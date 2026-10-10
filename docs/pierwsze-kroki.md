# Pierwsze uruchomienie

Potrzebujesz dostępu do KSeF danej firmy i jej NIP-u. Token musi należeć do tej samej firmy i środowiska, które wybierzesz w programie.

## 1. Przygotuj token do odczytu

1. Otwórz [stronę Aplikacji Podatnika KSeF](https://ksef.podatki.gov.pl/aplikacja-podatnika-ksef-20/). Wybierz właściwe środowisko i zaloguj się.
2. Sprawdź NIP firmy, w której pracujesz. Prawdziwe dokumenty są w środowisku produkcyjnym. Testowy KSeF ma osobne, przykładowe dane i tokeny.
3. Wybierz **„Generuj token”** i nadaj mu nazwę, np. „Easy KSeF — odczyt”.
4. Zaznacz tylko **„Przeglądanie faktur”**. Program nie potrzebuje uprawnień do wystawiania faktur ani zarządzania dostępem.
5. Wygeneruj token i skopiuj go. KSeF pokazuje go tylko raz. Wklej token bezpośrednio w Easy KSeF, a nie w wiadomość lub zgłoszenie problemu.

Nazwy i układ strony MF mogą się zmieniać. Aktualny sposób obsługi opisuje [podręcznik Aplikacji Podatnika MF](https://ksef.podatki.gov.pl/media/i1ubiukl/aplikacja-podatnika-ksef-20-podrecznik-uzytkownika_25042026.pdf). Jeśli nie masz możliwości nadania uprawnień, poproś osobę zarządzającą KSeF w swojej firmie.

## 2. Dodaj firmę w Easy KSeF

1. Wybierz **„Prawdziwy KSeF — faktury firmy”** albo środowisko testowe.
2. Wpisz **NIP firmy**. Program spróbuje uzupełnić nazwę z wykazu podatników VAT Ministerstwa Finansów. Jeśli się nie uda, wpisz nazwę ręcznie.
3. Wklej token tej firmy.
4. Kliknij **„Wybierz folder…”**, jeśli chcesz zmienić miejsce zapisu. Sprawdź wyświetloną ścieżkę.
5. Kliknij **„Sprawdź dostęp i dodaj firmę”**. To sprawdza połączenie; samo dodanie firmy nie pobiera faktur.

Na Macu system może zapytać o dostęp do pęku kluczy. Na Linuksie potrzebny jest działający sejf haseł GNOME lub KDE. Gdy program nie może bezpiecznie zapisać tokena, zatrzyma konfigurację.

## 3. Pobierz faktury

Kliknij **„Pobierz faktury…”**. Wybierz:

- **Cała dostępna historia** — żeby zacząć od wszystkich dokumentów dostępnych przez KSeF 2.0 dla tej firmy. Domyślnie obejmuje zakupy i sprzedaż.
- **Wybrany okres** — żeby pobrać miesiąc lub zakres dat wystawienia. Możesz wybrać zakupy, sprzedaż albo oba rodzaje.

Sprawdź firmę, rodzaj faktur i folder w oknie, a następnie rozpocznij pobieranie. Pozostaw program otwarty. Duża historia może potrwać; KSeF może czasowo ograniczyć liczbę zapytań. Program pokazuje oczekiwanie i ponawia próbę sam.

Pliki trafiają do folderów według środowiska, NIP-u, rodzaju faktur i miesiąca, np.:

```text
Easy KSeF/
  Produkcja/
    NIP firmy/
      Zakupy/
        2026-09/
      Sprzedaż/
        2026-09/
```

PDF jest czytelną wizualizacją. XML zachowuje źródłowy dokument pobrany z KSeF. Warto zachować oba.

Jeśli pobieranie zostało przerwane, kliknij **„Ponów pobieranie”**. Gotowe dokumenty zostają na dysku. Ponowne pobranie tego samego zakresu nie powinno tworzyć kopii tych samych faktur; uzupełnia także brakujące pliki.

## Codzienna praca

**Na początku kliknij „Sprawdź nowe faktury”.** Przycisk działa dla otwartej zakładki „Zakupowe” albo „Sprzedażowe”. Chcesz sprawdzić oba rodzaje? Wykonaj tę czynność w obu zakładkach. Data ostatniego zakończonego pobrania dotyczy danego rodzaju faktur. Program nie pobiera nowych dokumentów automatycznie.

Sprawdzenie nowych faktur zachowuje Twój miesiąc i filtry. Nowe dokumenty mogą więc znajdować się poza aktualnym widokiem. Użyj **„Pokaż wszystkie zapisane”**, aby zobaczyć pełną lokalną listę.

**Brakuje starszego miesiąca?** Użyj „Pobierz starsze…”. Sama zmiana miesiąca na liście nie łączy się z KSeF. Pusta lista nie dowodzi, że w KSeF nie ma faktur.

**Szukasz jednej faktury?** Wpisz firmę, NIP, numer faktury lub numer KSeF. Filtry obejmują m.in. waluty dostępne w zapisanych dokumentach i kwotę. Zmiana liczby wierszy na stronie zmienia tylko widok.

**Chcesz przekazać dokumenty?** Zawęź listę do okresu i wybierz „Przygotuj do wysłania…”. Bez zaznaczenia paczka obejmuje wszystkie wyniki ze wszystkich stron. Jeśli zaznaczasz, sprawdź licznik; po zaznaczeniu strony możesz użyć „Zaznacz wszystkie…”. Wybierz PDF-y, PDF-y z XML-ami lub Excel. Gotowy plik jest w podfolderze „Eksporty”. Wyślij go samodzielnie wybraną metodą.

**Obsługujesz kilka firm?** Dodaj kolejną w ustawieniach lub selektorze firmy. Przed pobraniem sprawdź nazwę i NIP u góry. Każda firma i każde środowisko mają osobne dane dostępu oraz archiwum. To wygodne przełączanie firm na jednym komputerze; nie jest to system uprawnień dla wielu pracowników.

[Pomoc w problemach](pomoc.md) · [Bezpieczeństwo danych](bezpieczenstwo.md) · [Powrót do opisu](../README.md)
