# Uruchomienie i budowanie ze źródeł

Dla codziennego używania aplikacji wystarczy [instalator](../README.md#wybierz-swój-komputer). Poniższe kroki są dla osób rozwijających lub samodzielnie budujących program.

## Narzędzia

- Git.
- Node.js 24 (środowisko wydania: 24.14.0) i npm 11.9.0.
- .NET SDK 10.0.401.
- Natywny system docelowy: Windows x64, macOS arm64/x64 lub Linux x64.

Gotowa aplikacja zawiera samowystarczalny komponent .NET; użytkownik nie instaluje runtime osobno. Na Linuksie do testu pakietu w CI używany jest Xvfb. Systemowe biblioteki GUI, sejf haseł i sandbox Electron muszą działać także poza CI.

## Start

```sh
git clone https://github.com/romanskk47/easy-ksef.git
cd easy-ksef
npm ci
npm run build
npm test
npm start
```

`build` pobiera wskazane commity oficjalnego klienta KSeF i generatora PDF, buduje konwerter oraz komponent .NET, kompiluje interfejs i generuje informacje licencyjne. Źródła zależności są przypięte w `scripts/vendors.json`. Nie zamieniaj ich na niezdefiniowane „latest”. Restore NuGet używa plików blokady właściwych dla systemu i architektury.

`npm start` uruchamia rzeczywistą aplikację. Do pracy rozwojowej używaj odrębnego profilu i danych testowych, nie archiwum swojej firmy. Testy automatyczne oraz self-test nie wymagają tokena KSeF.

## Sprawdzanie zmian

```sh
npm test
npm run build:ui
```

Przed wydaniem zbuduj całość i uruchom test gotowego pakietu:

```sh
npm run build
npm run dist
npm run smoke:packaged
npm run checksums
```

Na Linuksie bez sesji graficznej:

```sh
xvfb-run -a npm run smoke:packaged
```

`dist` buduje instalatory dla bieżącego systemu i architektury. Wyjątkowo architekturę można wskazać zmienną `EASY_KSEF_ARCH`, ale test gotowego programu musi działać natywnie na tej architekturze. Skrypt odmawia połączenia komponentu .NET i instalatora dla różnych celów.

Test pakietu działa na tymczasowym profilu, używa przykładowego XML-a i sprawdza wygenerowany PDF oraz archiwum. Nie jest próbą połączenia z produkcyjnym KSeF ani pełnym testem instalowania, aktualizowania i odinstalowywania.

## Struktura

| Katalog | Zawartość |
| --- | --- |
| `ui/` | React, tabela faktur, konfiguracja, dialogi |
| `app/` | Proces główny Electron, zapis dokumentów, profile i eksport |
| `bridge/` | Komponent .NET komunikujący się z API KSeF |
| `scripts/` | Pobieranie przypiętych źródeł, budowanie, licencje i pakowanie |
| `test/` | Testy na fikcyjnych danych |
| `docs/` | Instrukcje użytkownika i opis ograniczeń |

`node_modules`, pobrane źródła `vendor`, gotowe binaria, lokalne archiwa i logi nie należą do repozytorium. Nie dodawaj sekretów do zmiennych CI ani plików, jeśli test może korzystać z danych syntetycznych.

## Publikowanie wydania

Instalatory dla wszystkich czterech celów muszą powstać z tego samego commitu. Sprawdź wyniki natywnych testów pakietu, sumy SHA-256, licencje, informacje o znanych ograniczeniach i rzeczywiste załączniki wydania. Nie zastępuj brakującego instalatora samym archiwum źródeł. Wydanie pilotażowe powinno pozostać oznaczone jako prerelease.

[Zasady zgłoszeń i zmian](../CONTRIBUTING.md) · [Bezpieczeństwo](../SECURITY.md)
