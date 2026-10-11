# Dane, dostęp i bezpieczeństwo

## Dokąd trafiają dane?

| Czynność | Odbiorca / miejsce |
| --- | --- |
| Wpisanie poprawnego NIP-u podczas konfiguracji | Wykaz podatników VAT MF (`wl-api.mf.gov.pl`) — do uzupełnienia nazwy firmy |
| Sprawdzenie tokena i pobranie faktur | Wybrane środowisko KSeF Ministerstwa Finansów |
| Pobranie paczek eksportu KSeF | Adresy paczek przekazane przez API KSeF |
| Zapis PDF, XML i eksportów | Wybrany folder na Twoim komputerze |
| Zgłoszenie na GitHubie | GitHub; treść publicznego zgłoszenia jest widoczna dla innych |

Aplikacja nie prowadzi własnego serwera pośredniczącego i nie ma analityki użytkowania. Nie wysyła samodzielnie dokumentów do księgowej. Połączenia z usługami zewnętrznymi nadal ujawniają tym usługom dane niezbędne do obsługi, np. adres IP i NIP użyty w zapytaniu.

## Token

Program zapisuje token po zaszyfrowaniu przez mechanizm `safeStorage` Electron, oparty na zabezpieczeniach konta systemowego: pęku kluczy macOS, Windows DPAPI lub wspieranym sejfie GNOME/KDE na Linuksie. Na Linuksie nieszyfrowany mechanizm zastępczy `basic_text` jest odrzucany. Jeśli bezpieczne przechowanie nie jest dostępne, konfiguracja jest zatrzymywana.

To chroni zapisany sekret w określonym kontekście systemowym. Nie chroni przed osobą lub złośliwym programem działającym z odpowiednimi uprawnieniami na odblokowanym komputerze. Chroń konto systemowe, aktualizuj system i używaj szyfrowania dysku.

Twórz token z samym uprawnieniem **„Przeglądanie faktur”**. Nie przesyłaj go autorowi aplikacji ani do zgłoszeń. Dla każdej firmy i środowiska używaj właściwego dostępu; token testowy i produkcyjny nie są zamienne. W razie ujawnienia unieważnij token w KSeF — sama zmiana pola w programie nie odwołuje starego dostępu.

## Faktury i eksporty

PDF-y, XML-e, Excel i ZIP są **zwykłymi plikami, których aplikacja nie szyfruje**. Każda osoba i program z dostępem do folderu może je odczytać. Dotyczy to także kopii zapasowych i eksportów pozostawionych po wysłaniu.

Wybieraj prywatny folder bieżącego użytkownika, do którego inne osoby nie mają prawa zapisu. Program odrzuca zastane dowiązania symboliczne i junctions w chronionych podkatalogach archiwum. Nie gwarantuje jednak odporności na równoczesną podmianę plików przez innego użytkownika z prawem zapisu.

Firma ma oddzielny folder z NIP-em, a test i produkcja są rozdzielone. Jest to organizacja danych i ochrona przed pomyleniem profili, a nie osobny system uprawnień użytkowników. Nie podłączaj wspólnego aktywnego archiwum do kilku komputerów naraz.

Foldery iCloud, OneDrive, Dropbox, Dysku Google i udziały sieciowe mogą przesyłać dokumenty dalej zgodnie ze swoją konfiguracją. Wybierz folder odpowiedni do zasad firmy i ogranicz jego uprawnienia. Zapewnij kopie zapasowe.

## Instalatory i aktualizacje

Publiczny pilotaż 0.4.1 jest niepodpisany i nie ma automatycznego aktualizatora. Pobieraj pliki wyłącznie z [wydań właściwego repozytorium](https://github.com/romanskk47/easy-ksef/releases). Sumy SHA-256 pomagają porównać pliki, ale nie są podpisem wydawcy.

Otwarty kod pozwala sprawdzić sposób działania i zbudować własną wersję. Sam w sobie nie gwarantuje bezpieczeństwa gotowego programu. [Przegląd bezpieczeństwa wersji 0.4.0](security-review.md) opisuje wykonane wtedy kontrole i ich ograniczenia. Wyniki tej wcześniejszej wersji nie zastępują testów poprawki 0.4.1.

## Zgłoszenia i pomoc

Do zwykłego zgłoszenia dołączaj wyłącznie dane fikcyjne. Usuń ze zrzutów nazwy firm, NIP-y, numery faktur, kwoty, ścieżki i tokeny. Nie publikuj adresów pobierania paczek KSeF ani pełnych logów bez sprawdzenia ich zawartości.

Podejrzenie luki zgłoś [prywatnie](../SECURITY.md). Nie przedstawiamy tego przeglądu jako niezależnego audytu lub certyfikacji.
