# Pomoc

## Nie widzę sierpnia, lipca albo innych faktur

„Lista faktur” pokazuje dane już zapisane w aplikacji. Wyczyść wyszukiwanie i filtry, a w okresie wybierz **„Wszystkie zapisane”**. Jeśli nadal brakuje faktur, użyj **„Wybierz okres…”** i sprawdź okres lub całą dostępną historię. Sam wybór miesiąca na liście nie odświeża KSeF.

Sprawdź również firmę, środowisko i zakładkę „Zakupowe”/„Sprzedażowe”. Testowy KSeF nie zawiera rzeczywistych dokumentów produkcyjnych.

## Czy nowe faktury pojawiają się same?

Nie. Kliknij **„Odśwież z KSeF”**. Czynność sprawdza nowe faktury zakupowe i sprzedażowe wybranej firmy jednym przyciskiem, niezależnie od otwartej zakładki.

## Co oznacza czas w panelu „Dane z KSeF”?

To czas ostatniego potwierdzonego odczytu faktur z KSeF do aplikacji, osobno dla zakupów i sprzedaży. Obok jest zakres odczytu: nowe faktury, historia albo wybrany okres. Sprawdzenie starszego miesiąca nie oznacza odświeżenia nowych dokumentów.

Jeśli późniejsza próba nie powiedzie się, będzie niepełna lub zostanie przerwana, zobaczysz jej wynik oddzielnie. Nie zastępuje poprzedniego udanego odczytu. Status „Jeszcze nie odświeżono” oznacza brak takiego potwierdzenia.

Przygotowanie PDF-ów odbywa się po odczycie. Brak PDF-a może wymagać naprawy pliku, ale nie cofa potwierdzonego odświeżenia danych.

## Widzę 50 wierszy. Jak odświeżyć lub wyeksportować wszystkie?

Liczba wierszy służy przeglądaniu. Odświeżenie historii lub wybranego okresu nie jest nią ograniczone.

Przy eksporcie, jeśli niczego nie zaznaczysz, **„Eksportuj…”** obejmuje całą bieżącą listę po filtrowaniu, ze wszystkich stron. Jeżeli zaznaczasz faktury, po zaznaczeniu strony użyj **„Zaznacz wszystkie…”** i sprawdź licznik w oknie eksportu. Eksport korzysta z danych i plików na komputerze; nie odświeża KSeF ani nie wysyła wiadomości.

## Token nie działa

Sprawdź kolejno:

1. Czy NIP w Easy KSeF zgadza się z firmą, dla której utworzono token?
2. Czy środowisko się zgadza: produkcja czy test?
3. Czy token ma uprawnienie do przeglądania faktur i nie został unieważniony?
4. Czy skopiowano cały token, bez otaczającego tekstu?

Nie wklejaj tokena do zgłoszenia. Gdy KSeF odrzuca poprawny dostęp, sprawdź uprawnienia w Aplikacji Podatnika i spróbuj ponownie. Gdy błąd dotyczy systemowego sejfu, rozwiąż ten problem przed ponownym zapisem tokena.

## Odświeżanie trwa, stoi albo zostało przerwane

Przy ograniczeniu liczby zapytań program pokaże oczekiwanie i ponowi próbę sam. Nie klikaj wielokrotnie odświeżania. Możesz użyć przycisku **„Przerwij”**; zakończenie bieżącego zapisu może chwilę potrwać.

Po błędzie lub przerwaniu użyj **„Ponów odświeżanie”**. Faktury już dodane i gotowe pliki pozostają na komputerze. Jeśli przerwałeś przygotowywanie PDF-ów po udanym odczycie, czas odświeżenia danych pozostaje potwierdzony. Jeżeli zabrakło miejsca, folder zniknął albo utraciłeś prawo zapisu, najpierw usuń tę przyczynę. Nie odłączaj dysku podczas pracy programu.

## PDF się nie otwiera albo plik wymaga naprawy

Wybierz **„Filtry” → „Stan plików” → „Wymagają naprawy”**, aby znaleźć faktury z brakującym lub uszkodzonym plikiem. Następnie przez **„Wybierz okres…”** odśwież ich okres ponownie. Program spróbuje uzupełnić pliki. Jeżeli problem powtarza się dla jednego dokumentu, zgłoś go, opisując komunikat i wersję aplikacji. Nie załączaj prawdziwego XML-a lub PDF-a; do odtworzenia potrzebny będzie bezpieczny przykład.

## Nie udało się uzupełnić nazwy firmy

Program korzysta z wykazu podatników VAT MF. Firma może nie występować w tym wykazie albo usługa może być chwilowo niedostępna. Wpisz nazwę ręcznie. Sam brak wyniku w wykazie nie oznacza braku dostępu do KSeF.

## Czy mogę używać folderu OneDrive, iCloud lub dysku sieciowego?

To ustawienie Twojego komputera, nie usługa Easy KSeF. Pliki w folderze synchronizowanym mogą trafić do dostawcy tej usługi. Zapewnij uprawnienia, dostępną przestrzeń i kopie zapasowe.

**Nie używaj jednego archiwum równocześnie z kilku komputerów.** Ta wersja nie zapewnia blokad ani uzgadniania zmian dla takiej pracy. Udostępniaj gotowe eksporty zamiast wspólnego aktywnego archiwum.

## Ograniczenia wersji pilotażowej

- Instalatory są niepodpisane; Mac nie ma notaryzacji Apple.
- Synchronizacja z KSeF oraz aktualizowanie programu są ręczne.
- Dostęp jest przez token. Logowanie certyfikatem nie jest obsługiwane.
- Obsługiwane są dokumenty, w których firma jest sprzedawcą albo nabywcą. Odrębny zakres podmiotu trzeciego lub upoważnionego nie jest obsługiwany.
- „Cała dostępna historia” oznacza dokumenty udostępniane temu podmiotowi przez KSeF 2.0. Nie obiecuje dostępu do dokumentów spoza tego API ani faktur niewprowadzonych do KSeF.
- Kilka firm oznacza odrębne profile na tym komputerze, nie konta wielu pracowników ani system ról.
- Program nie wystawia faktur, nie prowadzi księgowości i nie sprawdza zgodności podatkowej dokumentów.
- Nie zadeklarowano nieograniczonej wydajności dla dowolnie dużego archiwum. Duży zbiór wymaga czasu i miejsca na dysku; limit wierszy w widoku nie jest limitem pobierania.

[Zgłoś problem](https://github.com/romanskk47/easy-ksef/issues/new/choose) · [Prywatne zgłoszenie luki](../SECURITY.md)
