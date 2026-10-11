# Easy KSeF 0.4.0 — publiczny pilotaż

Pobieraj faktury zakupowe i sprzedażowe z KSeF do własnego folderu. Program zapisuje XML-y i przygotowuje czytelne PDF-y, bez pobierania każdej faktury osobno.

## Pobierz

| Komputer | Plik w tym wydaniu |
| --- | --- |
| Windows 10/11, 64-bit | `Easy-KSeF-0.4.0-win-x64.exe` |
| Mac z Apple Silicon | `Easy-KSeF-0.4.0-mac-arm64.dmg` |
| Mac z Intelem | `Easy-KSeF-0.4.0-mac-x64.dmg` |
| Linux, x86-64 | `Easy-KSeF-0.4.0-linux-x86_64.AppImage` lub `Easy-KSeF-0.4.0-linux-amd64.deb` |

Na Macu wymagany jest macOS 13+. Wersje ZIP oraz sumy SHA-256 są również w załącznikach wydania. [Instrukcja instalacji](https://github.com/romanskk47/easy-ksef/blob/main/docs/instalacja.md).

## Pierwsze uruchomienie

Dodaj NIP, token KSeF z uprawnieniem „Przeglądanie faktur” i folder docelowy. Następnie wybierz **„Pobierz faktury…” → „Cała dostępna historia”** albo wskazany okres. Przy kolejnej pracy kliknij **„Sprawdź nowe faktury”** w zakupach lub sprzedaży. [Instrukcja krok po kroku](https://github.com/romanskk47/easy-ksef/blob/main/docs/pierwsze-kroki.md).

## Co potrafi ta wersja

- Pobranie całej dostępnej historii albo wybranego okresu, niezależnie od liczby wierszy na stronie.
- Kilka firm z osobnymi tokenami i folderami według NIP-u.
- Wyszukiwanie, filtrowanie, sortowanie i wybór kolumn lokalnej listy.
- Sumy pod kolumną kwot; waluty liczone osobno.
- Zaznaczanie dokumentów ze wszystkich stron oraz eksport do ZIP lub Excel.
- Widoczny postęp, oczekiwanie na KSeF, przerwanie i ponowienie pobierania.

## Przed użyciem

To **prerelease**, a instalatory są **niepodpisane**. macOS i Windows mogą ostrzegać o nieznanym wydawcy. Nie wyłączaj zabezpieczeń systemu; sprawdź źródło pobrania i [instrukcję](https://github.com/romanskk47/easy-ksef/blob/main/docs/instalacja.md).

Synchronizacja z KSeF i aktualizacja programu są ręczne. Widoczna lista to pliki zapisane na komputerze. Eksport nie odświeża KSeF ani nie wysyła wiadomości. Program nie wystawia faktur, nie obsługuje logowania certyfikatem ani osobnego zakresu faktur podmiotu trzeciego. Nie jest przeznaczony do równoczesnej pracy kilku komputerów na jednym archiwum.

Token chroni mechanizm systemowy. PDF-y, XML-e i eksporty pozostają zwykłymi plikami w wybranym folderze — uwzględnij jego kopie zapasowe i synchronizację w chmurze. [Bezpieczeństwo](https://github.com/romanskk47/easy-ksef/blob/main/docs/bezpieczenstwo.md).

[Zgłoś problem lub pomysł](https://github.com/romanskk47/easy-ksef/issues/new/choose). Nie dołączaj sekretów ani prawdziwych faktur.
