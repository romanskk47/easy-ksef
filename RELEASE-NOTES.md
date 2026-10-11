# Easy KSeF 0.4.1 — czytelne odświeżanie danych z KSeF

Teraz łatwiej sprawdzisz, kiedy aplikacja ostatnio odczytała faktury z KSeF. Nowy panel **„Dane z KSeF”** pokazuje osobno zakupy i sprzedaż: czas udanego odświeżenia, jego zakres oraz wynik późniejszej nieudanej lub przerwanej próby.

**Odświeżenie listy i przygotowanie PDF-ów mają osobny status.** Najpierw program odczytuje faktury z KSeF i zapisuje XML-e. Po potwierdzeniu zakresu utrwala czas odświeżenia, a potem przygotowuje PDF-y. Brak PDF-a albo przerwanie tego etapu nie cofa potwierdzonego odczytu danych.

## Co się zmieniło

- **„Odśwież z KSeF”** sprawdza nowe faktury zakupowe i sprzedażowe wybranej firmy jednym przyciskiem.
- **„Wybierz okres…”** służy do uzupełnienia historii albo sprawdzenia konkretnego okresu. Zakres odświeżenia jest widoczny obok czasu.
- **„Lista faktur”** ma wyraźnie oddzielone filtry. Zmiana miesiąca, wyszukiwanie i filtrowanie przeglądają dane już w aplikacji.
- **„Otwórz folder”** i **„Eksportuj…”** dotyczą plików na komputerze. Eksport nie odświeża KSeF ani nie wysyła wiadomości.
- Postęp odróżnia odczyt danych od przygotowywania PDF-ów. Przy ograniczeniu zapytań program pokazuje oczekiwanie i ponawia próbę sam.
- Formularz zakresu wskazuje błędną datę i pozwala ją poprawić przed rozpoczęciem odświeżania.

## Pobierz

| Komputer | Plik w tym wydaniu |
| --- | --- |
| Windows 10/11, 64-bit | `Easy-KSeF-0.4.1-win-x64.exe` |
| Mac z Apple Silicon | `Easy-KSeF-0.4.1-mac-arm64.dmg` |
| Mac z Intelem | `Easy-KSeF-0.4.1-mac-x64.dmg` |
| Linux, x86-64 | `Easy-KSeF-0.4.1-linux-x86_64.AppImage` lub `Easy-KSeF-0.4.1-linux-amd64.deb` |

Na Macu wymagany jest macOS 13+. Wersje ZIP oraz sumy SHA-256 są również w załącznikach wydania. [Instrukcja instalacji](https://github.com/romanskk47/easy-ksef/blob/main/docs/instalacja.md).

## Po instalacji

Nowa firma: dodaj NIP, token KSeF z uprawnieniem „Przeglądanie faktur” i folder docelowy. Przez **„Wybierz okres…”** uzupełnij historię. Przy kolejnej pracy użyj **„Odśwież z KSeF”**. [Instrukcja krok po kroku](https://github.com/romanskk47/easy-ksef/blob/main/docs/pierwsze-kroki.md).

Przy aktualizacji zamknij program i zainstaluj nowszą wersję, zachowując folder faktur. Starsze archiwa mogą początkowo pokazywać czas wcześniejszego zakończonego pobrania. Następne udane odświeżenie zapisze czas odczytu niezależny od PDF-ów.

## Pilotaż i zakres weryfikacji

Program pozostaje bezpłatny i otwarty, na licencji MIT. To **prerelease**, a instalatory są **niepodpisane**. macOS i Windows mogą ostrzegać o nieznanym wydawcy. Sprawdź źródło pobrania i [instrukcję](https://github.com/romanskk47/easy-ksef/blob/main/docs/instalacja.md).

Odświeżanie z KSeF oraz aktualizacja programu są ręczne. Program nie wystawia faktur, nie obsługuje logowania certyfikatem ani osobnego zakresu faktur podmiotu trzeciego. Nie jest przeznaczony do równoczesnej pracy kilku komputerów na jednym archiwum.

Wyniki testów i budowania dla konkretnego commitu są w [przebiegach CI](https://github.com/romanskk47/easy-ksef/actions). Testy na fikcyjnych danych i uruchomienie gotowego pakietu nie potwierdzają połączenia z produkcyjnym KSeF Ministerstwa Finansów.

Token chroni mechanizm systemowy. PDF-y, XML-e i eksporty pozostają zwykłymi plikami w wybranym folderze. [Bezpieczeństwo](https://github.com/romanskk47/easy-ksef/blob/main/docs/bezpieczenstwo.md).

[Zgłoś problem lub pomysł](https://github.com/romanskk47/easy-ksef/issues/new/choose). Nie dołączaj sekretów ani prawdziwych faktur.
