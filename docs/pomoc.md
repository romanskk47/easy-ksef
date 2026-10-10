# Pomoc

## Nie widzę sierpnia, lipca albo innych faktur

Lista pokazuje lokalne dokumenty. Wyczyść wyszukiwanie i filtry, a w okresie wybierz **„Wszystkie zapisane”**. Jeśli nadal brakuje faktur, użyj **„Pobierz starsze…”** i wybierz okres lub całą dostępną historię. Sam wybór miesiąca nie pobiera niczego z KSeF.

Sprawdź również firmę, środowisko i zakładkę „Zakupowe”/„Sprzedażowe”. Testowy KSeF nie zawiera rzeczywistych dokumentów produkcyjnych.

## Czy nowe faktury pojawiają się same?

Nie. Kliknij **„Sprawdź nowe faktury”**. Czynność dotyczy otwartej zakładki zakupów albo sprzedaży. Czas ostatniego zakończonego pobrania jest widoczny przy liście. Może to być wcześniejszy termin niż ostatnia nieudana próba.

## Widzę 50 wierszy. Jak pobrać lub wyeksportować wszystkie?

Liczba wierszy służy przeglądaniu. Pobranie historii lub okresu nie jest nią ograniczone.

Przy eksporcie, jeśli niczego nie zaznaczysz, **„Przygotuj do wysłania…”** obejmuje całą bieżącą listę po filtrowaniu, ze wszystkich stron. Jeżeli wybierasz checkboxy, po zaznaczeniu strony użyj **„Zaznacz wszystkie…”** i sprawdź licznik w oknie eksportu.

## Token nie działa

Sprawdź kolejno:

1. Czy NIP w Easy KSeF zgadza się z firmą, dla której utworzono token?
2. Czy środowisko się zgadza: produkcja czy test?
3. Czy token ma uprawnienie do przeglądania faktur i nie został unieważniony?
4. Czy skopiowano cały token, bez otaczającego tekstu?

Nie wklejaj tokena do zgłoszenia. Gdy KSeF odrzuca poprawny dostęp, sprawdź uprawnienia w Aplikacji Podatnika i spróbuj ponownie. Gdy błąd dotyczy systemowego sejfu, rozwiąż ten problem przed ponownym zapisem tokena.

## Pobieranie trwa, stoi albo zostało przerwane

Przy ograniczeniu liczby zapytań program pokaże oczekiwanie i ponowi próbę sam. Nie klikaj wielokrotnie pobierania. Możesz przerwać czynność; zakończenie zapisu bieżącego dokumentu może chwilę potrwać.

Po błędzie lub przerwaniu użyj **„Ponów pobieranie”**. Zapisane pliki pozostają na komputerze. Jeżeli zabrakło miejsca, folder zniknął albo utraciłeś prawo zapisu, najpierw usuń tę przyczynę. Nie odłączaj dysku podczas pobierania.

## PDF się nie otwiera albo plik wymaga naprawy

Pobierz ponownie ten sam okres. Program powinien uzupełnić brakujący lub uszkodzony plik. Jeżeli problem powtarza się dla jednego dokumentu, zgłoś go, opisując komunikat i wersję aplikacji. Nie załączaj prawdziwego XML-a lub PDF-a; do odtworzenia potrzebny będzie bezpieczny przykład.

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
