using System.IO.Compression;
using System.Net;
using System.Security.Cryptography;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Xml;
using System.Xml.Linq;
using KSeF.Client.Core.Exceptions;
using KSeF.Client.Core.Interfaces;
using KSeF.Client.Core.Interfaces.Clients;
using KSeF.Client.Core.Interfaces.Services;
using KSeF.Client.Core.Models.Authorization;
using KSeF.Client.Core.Models.Invoices;
using KSeF.Client.Core.Models.Invoices.Common;
using KSeF.Client.Core.Models.Sessions.BatchSession;
using KSeF.Client.DI;
using Microsoft.Extensions.DependencyInjection;

var json = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
json.Converters.Add(new JsonStringEnumConverter());
void Emit(object value) => Console.WriteLine(JsonSerializer.Serialize(value, json));
try
{
    var input = await Console.In.ReadLineAsync() ?? throw new InvalidOperationException("MISSING_INPUT");
    if (input.Length > 30 * 1024 * 1024) throw new InvalidOperationException("INVALID_INPUT");
    var request = JsonSerializer.Deserialize<Request>(input, json) ?? throw new InvalidOperationException("INVALID_INPUT");
    if (request.Op == "validate")
    {
        var bytes = Convert.FromBase64String(request.Xml ?? "");
        if (request.Role != null || request.Nip != null)
        {
            var validationSubject = request.Role switch { "purchase" => InvoiceSubjectType.Subject2, "sales" => InvoiceSubjectType.Subject1, _ => throw new InvalidOperationException("INVALID_ROLE") };
            CheckInvoiceParty(bytes, validationSubject, request.Nip ?? "");
        }
        Emit(new { type = "validated", buyerNip = PartyNip(bytes, "Podmiot2"), sellerNip = PartyNip(bytes, "Podmiot1"), hash = Hash(bytes) });
        return;
    }
    if (request.Op == "plan")
    {
        var plannedRange = BuildDownloadRange(request);
        var plannedEnd = plannedRange.To ?? DateTimeOffset.UtcNow;
        if (request.SnapshotHwmDate.HasValue) plannedEnd = DownloadWindows.StableSnapshot(plannedRange.From, plannedEnd, request.SnapshotHwmDate);
        var windows = DownloadWindows.Partition(plannedRange, plannedEnd).ToArray();
        if (request.PackageHwmDate.HasValue) DownloadWindows.CheckPackageBoundary(windows[0], request.PackageHwmDate, false);
        Emit(new { type = "plan", windows = windows.Select(w => { var splittable = DownloadWindows.TryBisect(w, out var left, out var right); return new { from = w.From.ToString("O"), to = w.To!.Value.ToString("O"), dateType = w.DateType.ToString(), splittable, leftFrom = splittable ? left.From.ToString("O") : null, leftTo = splittable ? left.To!.Value.ToString("O") : null, rightFrom = splittable ? right.From.ToString("O") : null, rightTo = splittable ? right.To!.Value.ToString("O") : null }; }).ToArray() });
        return;
    }
    if (input.Length > 16384) throw new InvalidOperationException("INVALID_INPUT");
    // Fixed endpoints and read-only invoice operations. Test/prod never share credentials.
    var baseUrl = request.Environment switch { "test" => KsefEnvironmentsUris.TEST, "prod" => KsefEnvironmentsUris.PROD, _ => throw new InvalidOperationException("INVALID_ENVIRONMENT") };
    var qrUrl = request.Environment == "prod" ? KsefQREnvironmentsUris.PROD : KsefQREnvironmentsUris.TEST;
    if (request.Op != "health" && (!System.Text.RegularExpressions.Regex.IsMatch(request.Nip ?? "", "^[0-9]{10}$") || string.IsNullOrWhiteSpace(request.Token))) throw new InvalidOperationException("INVALID_PROFILE");
    using var timeout = new CancellationTokenSource(request.Op == "probe" ? TimeSpan.FromSeconds(60) : request.Op == "health" ? TimeSpan.FromSeconds(20) : TimeSpan.FromHours(2));
    var ct = timeout.Token;
    // Electron cancellation sends SIGTERM first. Cancel cooperatively so the private XML spool
    // is deleted by finally before the parent's forced-termination fallback.
    using var termination = OperatingSystem.IsWindows() ? null : PosixSignalRegistration.Create(PosixSignal.SIGTERM, context => { context.Cancel = true; timeout.Cancel(); });
    var services = new ServiceCollection();
    services.AddKSeFClient(o => { o.BaseUrl = baseUrl; o.BaseQRUrl = qrUrl; });
    services.AddCryptographyClient();
    using var provider = services.BuildServiceProvider();
    var crypto = provider.GetRequiredService<ICryptographyService>();
    Emit(new { type = "progress", stage = "connecting" });
    await Retry(async () => { await crypto.WarmupAsync(ct); return true; }, ct);
    if (request.Op == "health")
    {
        Emit(new { type = "health", environment = request.Environment, publicKeyCertificatesLoaded = true });
        return;
    }
    var auth = provider.GetRequiredService<IAuthCoordinator>();
    Emit(new { type = "progress", stage = "authenticating" });
    var login = await Retry(() => auth.AuthKsefTokenAsync(AuthenticationTokenContextIdentifierType.Nip, request.Nip!, request.Token!, crypto, cancellationToken: ct), ct);
    var access = login.AccessToken.Token;
    var accessValidUntil = login.AccessToken.ValidUntil;
    async Task<T> Call<T>(Func<string, Task<T>> action) => await Retry(async () =>
    {
        if (accessValidUntil <= DateTimeOffset.UtcNow.AddMinutes(1))
        {
            var refreshed = await Retry(() => auth.RefreshAccessTokenAsync(login.RefreshToken.Token, ct), ct);
            access = refreshed.Token;
            accessValidUntil = refreshed.ValidUntil;
        }
        return await action(access);
    }, ct, delay => Emit(new { type = "progress", stage = "waiting", retryAfterSeconds = Math.Max(0, (int)Math.Ceiling(delay.TotalSeconds)) }));
    var client = provider.GetRequiredService<IKSeFClient>();
    if (request.Op == "probe")
    {
        Emit(new { type = "progress", stage = "permissions" });
        await Retry(() => client.QueryInvoiceMetadataAsync(new InvoiceQueryFilters { SubjectType = InvoiceSubjectType.Subject2, DateRange = new DateRange { DateType = DateType.Issue, From = DateTimeOffset.UtcNow.AddDays(-1), To = DateTimeOffset.UtcNow } }, access, pageOffset: 0, pageSize: 10, cancellationToken: ct), ct);
        Emit(new { type = "connected", environment = request.Environment, nip = request.Nip });
        return;
    }
    if (request.Op != "download") throw new InvalidOperationException("INVALID_OPERATION");
    var subjectType = request.Role switch { null or "purchase" => InvoiceSubjectType.Subject2, "sales" => InvoiceSubjectType.Subject1, _ => throw new InvalidOperationException("INVALID_ROLE") };
    var range = BuildDownloadRange(request);
    // KSeF limits a query to 100 UTC days. A table page is never a download limit.
    // Collect the entire plan before reporting completeness; verified XML is spooled privately on disk.
    var unique = new Dictionary<string, InvoiceSummary>();
    var files = new Dictionary<string, string>();
    var initialFrom = range.From;
    var requestedEnd = range.To ?? DateTimeOffset.UtcNow;
    DateTimeOffset? observedHwm = null;
    if (range.DateType == DateType.PermanentStorage)
    {
        // An OLD export returns its window end as HWM. Freezing that first value
        // would incorrectly stop a multi-window history after its first 99 days.
        // Obtain today's stable snapshot separately before walking older windows.
        var snapshot = await Call(token => client.QueryInvoiceMetadataAsync(new InvoiceQueryFilters { SubjectType = subjectType, DateRange = new DateRange { DateType = DateType.PermanentStorage, From = requestedEnd.AddDays(-1), To = requestedEnd, RestrictToPermanentStorageHwmDate = true } }, token, pageOffset: 0, pageSize: 10, cancellationToken: ct));
        requestedEnd = DownloadWindows.StableSnapshot(initialFrom, requestedEnd, snapshot.PermanentStorageHwmDate);
        observedHwm = requestedEnd;
    }
    var workspace = Path.Combine(Path.GetTempPath(), "easy-ksef-download-" + Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(workspace);
    if (!OperatingSystem.IsWindows()) File.SetUnixFileMode(workspace, UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
    var links = provider.GetRequiredService<IVerificationLinkService>();
    using var http = new HttpClient(new HttpClientHandler { AllowAutoRedirect = false });
    try
    {
        void CheckSummary(InvoiceSummary item)
        {
            if (string.IsNullOrWhiteSpace(item.KsefNumber) || string.IsNullOrWhiteSpace(item.InvoiceHash)) throw new InvalidOperationException("INVALID_MANIFEST");
            if (subjectType == InvoiceSubjectType.Subject2 && (item.Buyer?.Identifier?.Type != BuyerIdentifierType.Nip || item.Buyer.Identifier.Value != request.Nip)) throw new InvalidOperationException("WRONG_COMPANY");
            if (subjectType == InvoiceSubjectType.Subject1 && item.Seller?.Nip != request.Nip) throw new InvalidOperationException("WRONG_COMPANY");
            if (request.Kind == "monthly" && item.IssueDate.ToString("yyyy-MM") != request.Month) throw new InvalidOperationException("OUTSIDE_MONTH");
            if (request.Kind == "range" && (String.CompareOrdinal(item.IssueDate.ToString("yyyy-MM-dd"), request.DateFrom) < 0 || String.CompareOrdinal(item.IssueDate.ToString("yyyy-MM-dd"), request.DateTo) > 0)) throw new InvalidOperationException("OUTSIDE_RANGE");
            if ((request.Kind == "incremental" || request.Kind == "history") && (item.PermanentStorageDate < initialFrom || item.PermanentStorageDate > (observedHwm.HasValue && observedHwm.Value < requestedEnd ? observedHwm.Value : requestedEnd))) throw new InvalidOperationException("OUTSIDE_RANGE");
            if (unique.TryGetValue(item.KsefNumber, out var prior) && prior.InvoiceHash != item.InvoiceHash) throw new InvalidOperationException("CONFLICTING_MANIFEST");
        }
        async Task SaveVerified(InvoiceSummary item, byte[] bytes)
        {
            CheckSummary(item);
            if (bytes.Length > 20 * 1024 * 1024) throw new InvalidOperationException("XML_TOO_LARGE");
            if (Hash(bytes) != item.InvoiceHash) throw new InvalidOperationException("XML_HASH_MISMATCH");
            CheckInvoiceParty(bytes, subjectType, request.Nip!);
            if (unique.ContainsKey(item.KsefNumber)) return;
            // Never use an externally supplied identifier as a filesystem path.
            var file = Path.Combine(workspace, Guid.NewGuid().ToString("N") + ".xml");
            using (var output = PrivateFile(file, FileAccess.Write))
                await output.WriteAsync(bytes, ct);
            unique.Add(item.KsefNumber, item);
            files.Add(item.KsefNumber, file);
            Emit(new { type = "progress", stage = "preparing", collected = unique.Count });
        }
        async Task MetadataFallback(DateRange window)
        {
            // Only use metadata as a fallback when the server proves that every page is present.
            // In particular, advancing by one Issue day after 10,000 same-day records would lose invoices.
            var items = new Dictionary<string, InvoiceSummary>();
            for (var pageOffset = 0; ; pageOffset++)
            {
                var page = await Call(token => client.QueryInvoiceMetadataAsync(new InvoiceQueryFilters { SubjectType = subjectType, DateRange = window }, token, pageOffset, 250, cancellationToken: ct));
                if (page.IsTruncated) throw new InvalidOperationException("TOO_MANY_INVOICES_AT_SAME_DATE");
                foreach (var item in page.Invoices ?? [])
                {
                    CheckSummary(item);
                    if (items.TryGetValue(item.KsefNumber, out var prior) && prior.InvoiceHash != item.InvoiceHash) throw new InvalidOperationException("CONFLICTING_MANIFEST");
                    items[item.KsefNumber] = item;
                }
                if (!page.HasMore) break;
                if (page.Invoices == null || page.Invoices.Count == 0) throw new InvalidOperationException("INCOMPLETE_METADATA");
                Emit(new { type = "progress", stage = "preparing", collected = unique.Count, metadataPages = pageOffset + 1 });
            }
            foreach (var item in items.Values)
            {
                if (unique.ContainsKey(item.KsefNumber)) continue;
                // SDK GetInvoiceAsync returns a decoded string. Fetch original bytes here so UTF-8 BOM,
                // byte encoding and invoiceHash remain authoritative (never re-encode financial XML).
                var bytes = await Call(async token =>
                {
                    using var message = new HttpRequestMessage(HttpMethod.Get, baseUrl + "/v2/invoices/ksef/" + Uri.EscapeDataString(item.KsefNumber));
                    message.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                    message.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/xml"));
                    using var response = await http.SendAsync(message, HttpCompletionOption.ResponseHeadersRead, ct);
                    if ((int)response.StatusCode == 429) throw KsefRateLimitException.FromRetryAfterHeader("RATE_LIMIT", response.Headers.RetryAfter?.ToString() ?? "");
                    response.EnsureSuccessStatusCode();
                    using var source = await response.Content.ReadAsStreamAsync(ct);
                    using var buffer = new MemoryStream();
                    var block = new byte[64 * 1024];
                    int read;
                    while ((read = await source.ReadAsync(block, ct)) > 0)
                    {
                        if (buffer.Length + read > 20L * 1024 * 1024) throw new InvalidOperationException("XML_TOO_LARGE");
                        await buffer.WriteAsync(block.AsMemory(0, read), ct);
                    }
                    return buffer.ToArray();
                });
                await SaveVerified(item, bytes);
            }
        }
        async Task ProcessWindow(DateRange window)
        {
            ct.ThrowIfCancellationRequested();
            if (observedHwm.HasValue && window.DateType == DateType.PermanentStorage)
            {
                if (window.From > observedHwm.Value) return;
                if (window.To > observedHwm.Value) window.To = observedHwm.Value;
            }
            var encryption = crypto.GetEncryptionData();
            var op = await Call(token => client.ExportInvoicesAsync(new InvoiceExportRequest { Filters = new InvoiceQueryFilters { SubjectType = subjectType, DateRange = window }, Encryption = encryption.EncryptionInfo, CompressionType = CompressionType.Zip }, token, cancellationToken: ct));
            InvoiceExportStatusResponse status;
            while (true)
            {
                status = await Call(token => client.GetInvoiceExportStatusAsync(op.ReferenceNumber, token, ct));
                if (status.Status.Code == 200) break;
                if (status.Status.Code >= 400) throw new InvalidOperationException("EXPORT_FAILED");
                Emit(new { type = "progress", stage = "preparing", collected = unique.Count });
                await Task.Delay(2000, ct);
            }
            var package = status.Package ?? throw new InvalidOperationException("MISSING_PACKAGE");
            if (window.DateType == DateType.PermanentStorage)
            {
                if (package.PermanentStorageHwmDate == null || package.PermanentStorageHwmDate < initialFrom) throw new InvalidOperationException("MISSING_CONTINUATION");
                // Each historical package reports that window's boundary, not the
                // current snapshot. Never lower the frozen end or silently skip a gap.
                DownloadWindows.CheckPackageBoundary(window, package.PermanentStorageHwmDate, package.IsTruncated);
            }
            // Split before downloading when MF truncated the package or its size exceeds local RAM bounds.
            // This removes the old arbitrary 5,000-invoice ceiling while preserving resource checks.
            if (package.IsTruncated || package.Size > 128L * 1024 * 1024 || (package.Parts ?? []).Any(p => p.EncryptedPartSize > 128L * 1024 * 1024))
            {
                if (DownloadWindows.TryBisect(window, out var left, out var right))
                {
                    Emit(new { type = "progress", stage = "partitioning", collected = unique.Count });
                    await ProcessWindow(left);
                    await ProcessWindow(right);
                }
                else await MetadataFallback(window);
                return;
            }
            var zipPath = Path.Combine(workspace, Guid.NewGuid().ToString("N") + ".zip");
            try
            {
                using (var archiveBytes = PrivateFile(zipPath, FileAccess.ReadWrite))
                {
                    foreach (var part in (package.Parts ?? []).OrderBy(p => p.OrdinalNumber))
                    {
                        var uri = new Uri(part.Url);
                        if (uri.Scheme != "https" || uri.IsLoopback || uri.UserInfo != "" || IPAddress.TryParse(uri.Host, out _)) throw new InvalidOperationException("INVALID_PACKAGE_URL");
                        using var response = await http.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, ct);
                        response.EnsureSuccessStatusCode();
                        // Bound the stream while reading, not only after allocation.
                        if (part.EncryptedPartSize < 0 || part.EncryptedPartSize > 128L * 1024 * 1024) throw new InvalidOperationException("PACKAGE_TOO_LARGE");
                        using var encryptedBuffer = new MemoryStream();
                        using (var content = await response.Content.ReadAsStreamAsync(ct))
                        {
                            var block = new byte[64 * 1024];
                            int read;
                            while ((read = await content.ReadAsync(block, ct)) > 0)
                            {
                                if (encryptedBuffer.Length + read > part.EncryptedPartSize) throw new InvalidOperationException("PART_HASH_MISMATCH");
                                await encryptedBuffer.WriteAsync(block.AsMemory(0, read), ct);
                            }
                        }
                        var encrypted = encryptedBuffer.ToArray();
                        if (encrypted.LongLength != part.EncryptedPartSize || Hash(encrypted) != part.EncryptedPartHash) throw new InvalidOperationException("PART_HASH_MISMATCH");
                        var decrypted = crypto.DecryptBytesWithAES256(encrypted, encryption.CipherKey, encryption.CipherIv);
                        if (decrypted.LongLength != part.PartSize || Hash(decrypted) != part.PartHash) throw new InvalidOperationException("PART_HASH_MISMATCH");
                        if (archiveBytes.Length + decrypted.Length > 128L * 1024 * 1024) throw new InvalidOperationException("PACKAGE_TOO_LARGE");
                        await archiveBytes.WriteAsync(decrypted, ct);
                    }
                    if (package.InvoiceCount == 0 && archiveBytes.Length == 0) return;
                    archiveBytes.Position = 0;
                    using var zip = new ZipArchive(archiveBytes, ZipArchiveMode.Read, leaveOpen: true);
                    if (zip.Entries.Count > 100000 || zip.Entries.Sum(e => e.Length) > 256L * 1024 * 1024) throw new InvalidOperationException("PACKAGE_TOO_LARGE");
                    var manifests = zip.Entries.Where(e => e.FullName == "_metadata.json").ToArray();
                    if (manifests.Length != 1 || manifests[0].Length > 30L * 1024 * 1024) throw new InvalidOperationException("MISSING_MANIFEST");
                    using var manifestStream = manifests[0].Open();
                    var metadata = await JsonSerializer.DeserializeAsync<Manifest>(manifestStream, json, ct) ?? throw new InvalidOperationException("MISSING_MANIFEST");
                    var items = metadata.Invoices ?? throw new InvalidOperationException("MISSING_MANIFEST");
                    if (items.Count != package.InvoiceCount) throw new InvalidOperationException("MANIFEST_COUNT_MISMATCH");
                    var entryMap = zip.Entries.GroupBy(e => e.FullName).ToDictionary(g => g.Key, g => g.ToArray());
                    foreach (var item in items)
                    {
                        CheckSummary(item);
                        if (!entryMap.TryGetValue(item.KsefNumber + ".xml", out var entries) || entries.Length != 1 || entries[0].Length > 20L * 1024 * 1024) throw new InvalidOperationException("MISSING_XML");
                        using var buffer = new MemoryStream();
                        using (var stream = entries[0].Open()) await stream.CopyToAsync(buffer, ct);
                        await SaveVerified(item, buffer.ToArray());
                    }
                }
            }
            catch (InvalidOperationException ex) when (ex.Message == "PACKAGE_TOO_LARGE")
            {
                if (DownloadWindows.TryBisect(window, out var left, out var right))
                {
                    Emit(new { type = "progress", stage = "partitioning", collected = unique.Count });
                    await ProcessWindow(left);
                    await ProcessWindow(right);
                }
                else await MetadataFallback(window);
            }
            finally { File.Delete(zipPath); }
        }
        foreach (var window in DownloadWindows.Partition(range, requestedEnd)) await ProcessWindow(window);
        var manifest = JsonSerializer.Serialize(new { type = "manifest", invoices = unique.Values.Select(m => new { id = m.KsefNumber, number = m.InvoiceNumber, date = m.IssueDate.ToString("yyyy-MM-dd"), seller = m.Seller.Name, sellerNip = m.Seller.Nip, buyer = m.Buyer?.Name ?? "", buyerNip = m.Buyer?.Identifier?.Type == BuyerIdentifierType.Nip ? m.Buyer.Identifier.Value : "", type = m.InvoiceType.ToString(), gross = m.GrossAmount, currency = m.Currency, hash = m.InvoiceHash, qrCode = links.BuildInvoiceVerificationUrl(m.Seller.Nip, m.IssueDate.Date, m.InvoiceHash), acDate = m.AcquisitionDate.ToString("O") }).ToArray() }, json);
        // Respect the existing bridge protocol's bounded line length; never report partial success.
        if (manifest.Length > 30 * 1024 * 1024) throw new InvalidOperationException("MANIFEST_TOO_LARGE");
        Console.WriteLine(manifest);
        foreach (var item in unique.Values)
            Emit(new { type = "invoice", id = item.KsefNumber, xml = Convert.ToBase64String(await File.ReadAllBytesAsync(files[item.KsefNumber], ct)) });
        var continuation = (request.Kind == "incremental" || request.Kind == "history") ? (observedHwm.HasValue && observedHwm < requestedEnd ? observedHwm.Value : requestedEnd).ToString("O") : null;
        Emit(new { type = "done", continuation, truncated = false, from = initialFrom.ToString("O"), environment = request.Environment });
    }
    finally { Directory.Delete(workspace, recursive: true); }

}
catch (Exception error)
{
    // SDK error strings can include response details. Only fixed, non-secret codes cross the bridge.
    var code = error is KsefRateLimitException ? "RATE_LIMIT" : error is KsefApiException api ? $"KSEF_HTTP_{(int)api.StatusCode}" : error is HttpRequestException ? "NETWORK_ERROR" : error is OperationCanceledException or TimeoutException ? "TIMEOUT" : error is XmlException ? "INVALID_XML" : error is InvalidOperationException && System.Text.RegularExpressions.Regex.IsMatch(error.Message, "^[A-Z_]+$") ? error.Message : "KSEF_FAILED";
    Emit(new { type = "error", code });
    Environment.ExitCode = 1;
}

static FileStream PrivateFile(string file, FileAccess access)
{
    var options = new FileStreamOptions { Mode = FileMode.CreateNew, Access = access };
    if (!OperatingSystem.IsWindows()) options.UnixCreateMode = UnixFileMode.UserRead | UnixFileMode.UserWrite;
    return new FileStream(file, options);
}

static DateRange BuildDownloadRange(Request request)
{
    DateRange range;
    if (request.Kind == "monthly")
    {
        if (!System.Text.RegularExpressions.Regex.IsMatch(request.Month ?? "", "^20[0-9]{2}-(0[1-9]|1[0-2])$")) throw new InvalidOperationException("INVALID_MONTH");
        var first = DateTime.ParseExact(request.Month + "-01", "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);
        var zone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Warsaw");
        var from = new DateTimeOffset(first, zone.GetUtcOffset(first));
        var last = first.AddMonths(1);
        range = new DateRange { DateType = DateType.Issue, From = from, To = new DateTimeOffset(last, zone.GetUtcOffset(last)).AddTicks(-1) };
    }
    else if (request.Kind == "range")
    {
        if (!DateTime.TryParseExact(request.DateFrom, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var first) || !DateTime.TryParseExact(request.DateTo, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out var final) || first > final || first.Year < 2000 || final.Year > 2099) throw new InvalidOperationException("INVALID_RANGE");
        var zone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Warsaw");
        var after = final.AddDays(1);
        range = new DateRange { DateType = DateType.Issue, From = new DateTimeOffset(first, zone.GetUtcOffset(first)), To = new DateTimeOffset(after, zone.GetUtcOffset(after)).AddTicks(-1) };
    }
    else if (request.Kind == "history")
        range = new DateRange { DateType = DateType.PermanentStorage, From = DateTimeOffset.Parse("2022-01-01T00:00:00Z"), RestrictToPermanentStorageHwmDate = true };
    else if (request.Kind == "incremental" && DateTimeOffset.TryParse(request.From, out var start))
        range = new DateRange { DateType = DateType.PermanentStorage, From = start, RestrictToPermanentStorageHwmDate = true };
    else throw new InvalidOperationException("INVALID_RANGE");
    return range;
}

static void CheckInvoiceParty(byte[] bytes, InvoiceSubjectType subject, string nip)
{
    if (PartyNip(bytes, subject == InvoiceSubjectType.Subject1 ? "Podmiot1" : "Podmiot2") != nip) throw new InvalidOperationException("WRONG_COMPANY");
}
static string Hash(byte[] bytes) => Convert.ToBase64String(SHA256.HashData(bytes));
static string PartyNip(byte[] bytes, string party)
{
    using var source = new MemoryStream(bytes);
    using var reader = XmlReader.Create(source, new XmlReaderSettings { DtdProcessing = DtdProcessing.Prohibit, XmlResolver = null, MaxCharactersInDocument = 20 * 1024 * 1024 });
    var doc = XDocument.Load(reader);
    if (doc.Root?.Name.LocalName != "Faktura") throw new InvalidOperationException("UNSUPPORTED_XML");
    var buyer = doc.Root.Elements().Single(e => e.Name.LocalName == party);
    return buyer.Elements().Single(e => e.Name.LocalName == "DaneIdentyfikacyjne").Elements().Single(e => e.Name.LocalName == "NIP").Value;
}
static async Task<T> Retry<T>(Func<Task<T>> action, CancellationToken ct, Action<TimeSpan>? onDelay = null)
{
    for (var attempt = 0; ; attempt++)
    {
        try { return await action(); }
        catch (KsefRateLimitException error) when (attempt < 3)
        {
            var delay = error.RetryAfterSeconds.HasValue ? TimeSpan.FromSeconds(error.RetryAfterSeconds.Value) : error.RetryAfterDate.HasValue ? error.RetryAfterDate.Value - DateTimeOffset.UtcNow : TimeSpan.FromSeconds(60);
            onDelay?.Invoke(delay);
            await Task.Delay(delay < TimeSpan.Zero ? TimeSpan.Zero : delay, ct);
        }
    }
}
record Request(string Op, string? Environment, string? Nip, string? Token, string? Kind, string? Month, string? From, string? Xml, string? Role = null, string? DateFrom = null, string? DateTo = null, DateTimeOffset? SnapshotHwmDate = null, DateTimeOffset? PackageHwmDate = null);
class Manifest { public List<InvoiceSummary>? Invoices { get; set; } }

// Ranges overlap only at an exact PermanentStorage split boundary; KSeF-number deduplication
// avoids duplicates, and retaining that boundary avoids losing equal timestamps.
static class DownloadWindows
{
    public static DateTimeOffset StableSnapshot(DateTimeOffset from, DateTimeOffset requestedEnd, DateTimeOffset? currentHwm)
    {
        if (!currentHwm.HasValue || currentHwm < from) throw new InvalidOperationException("MISSING_CONTINUATION");
        return currentHwm.Value < requestedEnd ? currentHwm.Value : requestedEnd;
    }
    public static void CheckPackageBoundary(DateRange window, DateTimeOffset? packageHwm, bool truncated)
    {
        if (!packageHwm.HasValue) throw new InvalidOperationException("MISSING_CONTINUATION");
        if (!truncated && packageHwm < window.To) throw new InvalidOperationException("INCOMPLETE_DOWNLOAD");
    }
    static DateRange Window(DateRange source, DateTimeOffset from, DateTimeOffset to) => new() { DateType = source.DateType, From = from, To = to, RestrictToPermanentStorageHwmDate = source.RestrictToPermanentStorageHwmDate };
    public static IEnumerable<DateRange> Partition(DateRange source, DateTimeOffset end)
    {
        var from = source.From;
        if (end < from) throw new InvalidOperationException("INVALID_RANGE");
        while (true)
        {
            var to = from.AddDays(99) < end ? from.AddDays(99) : end;
            yield return Window(source, from, to);
            if (to >= end) break;
            from = to;
        }
    }
    public static bool TryBisect(DateRange source, out DateRange left, out DateRange right)
    {
        left = right = source;
        if (!source.To.HasValue) return false;
        var end = source.To.Value;
        DateTimeOffset cut;
        if (source.DateType == DateType.Issue)
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Warsaw");
            var first = TimeZoneInfo.ConvertTime(source.From, zone).Date;
            var final = TimeZoneInfo.ConvertTime(end, zone).Date;
            if (first == final) return false;
            var day = first.AddDays(Math.Max(1, (final - first).Days / 2));
            cut = new DateTimeOffset(day, zone.GetUtcOffset(day));
            if (cut <= source.From || cut > end) return false;
            left = Window(source, source.From, cut.AddTicks(-1));
        }
        else
        {
            var fromMs = source.From.ToUnixTimeMilliseconds();
            var endMs = end.ToUnixTimeMilliseconds();
            if (endMs - fromMs < 2) return false;
            cut = DateTimeOffset.FromUnixTimeMilliseconds(fromMs + (endMs - fromMs) / 2);
            left = Window(source, source.From, cut);
        }
        right = Window(source, cut, end);
        return true;
    }
}
