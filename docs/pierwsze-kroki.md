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

## 3. Uzupełnij listę faktur

Kliknij **„Wybierz okres…”** w panelu **„Dane z KSeF”**. Wybierz:

- **Cała dostępna historia** — żeby zacząć od wszystkich dokumentów dostępnych przez KSeF 2.0 dla tej firmy. Domyślnie obejmuje zakupy i sprzedaż.
- **Wybrany okres** — żeby sprawdzić miesiąc lub zakres dat wystawienia. Możesz wybrać zakupy, sprzedaż albo oba rodzaje.

Sprawdź firmę, rodzaj faktur i folder w oknie, a następnie kliknij **„Odśwież całą historię”** lub **„Odśwież wybrany okres”**. Pozostaw program otwarty. Duża historia może potrwać; KSeF może czasowo ograniczyć liczbę zapytań. Program pokazuje oczekiwanie i ponawia próbę sam.

Odświeżanie ma dwa etapy. Najpierw program odczytuje dane z KSeF, zapisuje źródłowe XML-e i uzupełnia listę faktur. Po potwierdzeniu całego zakresu zapisuje czas w panelu „Dane z KSeF”. Następnie przygotowuje PDF-y. Błąd lub przerwanie przygotowywania PDF-ów nie cofa potwierdzonego odczytu.

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

Jeśli czynność została przerwana, kliknij **„Ponów odświeżanie”**. Faktury już dodane i gotowe pliki pozostają na komputerze. Ponowne odświeżenie tego samego zakresu nie powiela faktur; próbuje też uzupełnić brakujące pliki.

## Codzienna praca

**Na początku kliknij „Odśwież z KSeF”.** Przycisk sprawdza nowe faktury zakupowe i sprzedażowe wybranej firmy, niezależnie od otwartej zakładki. Jeśli wcześniej nie pobrano historii ani nowych faktur, zakres zaczyna się od początku miesiąca poprzedzającego dodanie firmy. Wcześniejsze dokumenty uzupełnisz przez „Wybierz okres…”. Program nie sprawdza nowych faktur automatycznie.

**Spójrz na panel „Dane z KSeF”.** Zakupy i sprzedaż mają własny czas oraz zakres ostatniego udanego odświeżenia. Nowsza nieudana, niepełna lub przerwana próba jest pokazana oddzielnie. Sprawdzenie dawnego miesiąca aktualizuje tylko wskazany zakres; aby sprawdzić nowe faktury, użyj głównego przycisku „Odśwież z KSeF”.

Odświeżenie nowych faktur zachowuje Twój miesiąc i filtry. Nowe dokumenty mogą więc znajdować się poza aktualnym widokiem. Użyj **„Pokaż wszystkie faktury”**, aby zobaczyć pełną listę zapisaną w aplikacji.

**Brakuje starszego miesiąca?** Użyj „Wybierz okres…”. Sama zmiana miesiąca w sekcji „Lista faktur” nie łączy się z KSeF. Pusta lista nie dowodzi, że w KSeF nie ma faktur.

**Szukasz jednej faktury?** Wpisz firmę, NIP, numer faktury lub numer KSeF. Filtry obejmują m.in. waluty dostępne w zapisanych dokumentach i kwotę. Zmiana liczby wierszy na stronie zmienia tylko widok.

**Chcesz przekazać dokumenty?** Zawęź listę do okresu i wybierz „Eksportuj…”. Bez zaznaczenia paczka obejmuje wszystkie wyniki ze wszystkich stron. Jeśli zaznaczasz, sprawdź licznik; po zaznaczeniu strony możesz użyć „Zaznacz wszystkie…”. Wybierz PDF-y, PDF-y z XML-ami lub Excel. Gotowy plik jest w podfolderze „Eksporty”. Eksport nie odświeża danych z KSeF ani nie wysyła dokumentów — gotowy plik wyślij samodzielnie wybraną metodą.

**Obsługujesz kilka firm?** Dodaj kolejną w ustawieniach lub selektorze firmy. Przed odświeżeniem sprawdź nazwę i NIP u góry. Każda firma i każde środowisko mają osobne dane dostępu oraz archiwum. To wygodne przełączanie firm na jednym komputerze; nie jest to system uprawnień dla wielu pracowników.

[Pomoc w problemach](pomoc.md) · [Bezpieczeństwo danych](bezpieczenstwo.md) · [Powrót do opisu](../README.md)
