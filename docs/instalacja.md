# Instalacja i aktualizacje

Pobieraj program z [wydań tego repozytorium](https://github.com/romanskk47/easy-ksef/releases/tag/v0.4.1). Pliki „Source code” to kod dla programistów — wybierz instalator dla swojego komputera.

Wydanie 0.4.1 jest pilotażowe i nie ma podpisu wydawcy ani notaryzacji Apple. Ostrzeżenie o nieznanym wydawcy jest więc możliwe. Nie wyłączaj antywirusa, Gatekeepera ani innych zabezpieczeń całego systemu. Jeśli komputerem zarządza firma, przekaż instalator administratorowi.

## Windows

1. Pobierz `Easy-KSeF-0.4.1-win-x64.exe`.
2. Otwórz plik i przejdź przez instalator. Możesz wybrać folder instalacji; program instaluje się dla bieżącego użytkownika.
3. Uruchom **Easy KSeF** z menu Start lub skrótu na pulpicie.

Obsługiwany cel to Windows 10/11, 64-bit. Jeśli SmartScreen blokuje niepodpisany plik, upewnij się, że pochodzi z wydania wskazanego powyżej. Decyzję o zezwoleniu na uruchomienie podejmij dopiero po sprawdzeniu źródła, ewentualnie z administratorem. Nie ignoruj ostrzeżenia o wykrytym szkodliwym oprogramowaniu.

## macOS

1. W menu Apple → **Ten Mac** sprawdź, czy masz układ Apple czy procesor Intel.
2. Pobierz odpowiedni plik `.dmg`: `mac-arm64` dla Apple, `mac-x64` dla Intela.
3. Otwórz obraz i przeciągnij **Easy KSeF** do folderu **Aplikacje**.
4. Uruchom program z Aplikacji, nie bezpośrednio z obrazu instalacyjnego.

Wymagany jest macOS 13 lub nowszy. Jeżeli macOS zablokuje program ze względu na nieznanego wydawcę, najpierw sprawdź źródło pliku. Indywidualne zezwolenie może być dostępne w **Ustawienia systemowe → Prywatność i ochrona** po próbie otwarcia. Polityka komputera firmowego może wymagać pomocy administratora. Nie usuwaj systemowych zabezpieczeń poleceniami z przypadkowych instrukcji.

## Linux

Wydajemy pakiety x86-64. Potrzebujesz środowiska graficznego oraz działającego sejfu haseł **GNOME/libsecret** lub **KWallet**. Program nie zapisze tokena przy nieszyfrowanym mechanizmie awaryjnym.

**Ubuntu/Debian:** otwórz plik `.deb` w systemowym instalatorze pakietów. W razie zależności skorzystaj z menedżera pakietów swojej dystrybucji.

**AppImage:** zapisz plik w wybranym miejscu. We właściwościach pliku nadaj mu prawo uruchamiania, a następnie otwórz. Jeśli system zgłasza brak FUSE, zainstaluj odpowiedni pakiet FUSE dla swojej dystrybucji lub wybierz `.deb`. Nie uruchamiaj programu jako administrator i nie dodawaj opcji `--no-sandbox`.

Środowiskiem budowania Linuksa jest Ubuntu 22.04. Inne dystrybucje mogą wymagać dodatkowych bibliotek; nie oznacza to potwierdzonej zgodności z każdą z nich.

## Aktualizacja

W programie nie ma automatycznego aktualizatora. Pobierz nowsze wydanie, zamknij Easy KSeF i zainstaluj je w miejsce wcześniejszej wersji. Nie usuwaj przy tym folderu faktur. Przed pilotażową aktualizacją zachowaj jego kopię zapasową.

W wersji 0.4.1 czas odczytu danych z KSeF jest oddzielony od przygotowania PDF-ów. W starszym archiwum panel może początkowo korzystać z czasu wcześniejszego zakończonego pobrania. Po następnym udanym odświeżeniu pokaże nowy czas odczytu, niezależny od wyniku przygotowania PDF-ów. „Odśwież z KSeF” sprawdza teraz zakupy i sprzedaż jednym przyciskiem.

Tokeny są związane z kontem użytkownika systemu. Przeniesienie samych plików programu na inny komputer nie przenosi bezpiecznie dostępu do KSeF — dodaj tam firmę i odpowiedni token.

## Sprawdzenie pliku

W załącznikach wydania znajdziesz listę sum **SHA-256**. Możesz porównać skrót pobranego instalatora z tą listą. Pomaga to wykryć uszkodzony lub zmieniony plik; nie zastępuje podpisu wydawcy ani zaufania do konta publikującego wydanie.

[Przejdź do pierwszego uruchomienia](pierwsze-kroki.md).
