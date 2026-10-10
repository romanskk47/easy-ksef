# Przegląd bezpieczeństwa wydania 0.4.0

Stan przeglądu: **2026-10-11**. To przegląd kodu i testów przed publicznym pilotażem, nie niezależny audyt, pentest ani certyfikacja. Zakres obejmuje aplikację desktopową, lokalne archiwum, konfigurację dostępu i proces budowania.

## Co sprawdzamy

| Obszar | Ryzyko / oczekiwane zachowanie |
| --- | --- |
| Tokeny | Bez jawnego zapisu lub logowania; brak zgody na nieszyfrowany magazyn zastępczy Linuksa |
| Oddzielenie firm | NIP, środowisko, token i folder właściwe dla bieżącego profilu; odrzucenie wyniku dla zmienionego profilu |
| Dokumenty i ścieżki | Dane z faktur nie mogą wybierać dowolnej ścieżki ani uruchamiać kodu |
| Archiwum | Ponowienie bez duplikowania, wykrywanie brakujących/uszkodzonych plików, bez fałszywego potwierdzenia kompletności |
| Sieć | Limity, przerwanie, niepełne odpowiedzi, bezpieczne komunikaty, brak poświadczeń w komunikatach |
| Interfejs | Filtry nie zmieniają zakresu pobrania; eksport jasno wskazuje wybór i wszystkie strony |
| Zależności i wydanie | Przypięte źródła, blokady zależności, informacje licencyjne, test gotowego programu |

## Zależności npm

Przy przeglądzie `npm audit` zgłaszał **8 pozycji o poziomie moderate**, bez pozycji high lub critical. Raport obejmuje również narzędzia budowania i propagację tej samej zależności przez jej użytkowników; liczba pozycji nie jest liczbą niezależnych ataków na gotową aplikację.

Pozostaje zgłoszenie dotyczące `sprintf-js` w wersjach do 1.1.3 w drzewie narzędzi. W chwili przeglądu nie było dostępnej poprawionej wersji według raportu npm. Nie oznaczamy tego wyniku jako „zero podatności”. Szczegóły wymagają ponownego sprawdzenia przy aktualizacji zależności lub wydaniu.

## Wyniki i ograniczenia weryfikacji

Lokalny zestaw **99 testów przeszedł poprawnie** przed publikacją. W przeglądzie znaleziono i poprawiono problem o średnim poziomie ryzyka: zastane dowiązania symboliczne lub junctions mogły skierować zapis poza właściwy podfolder archiwum. Dodano kontrolę katalogu firmy, miesiąca i eksportów oraz testy tych przypadków. Nadal wymagany jest folder bez równoczesnego zapisu przez inne osoby lub komputery — nie deklarujemy przenośnej, atomowej ochrony przed aktywną podmianą ścieżek przez innego zapisującego.

Wyniki testów dla konkretnego commitu i czterech celów instalatora należy odczytać z [przebiegów CI](https://github.com/romanskk47/easy-ksef/actions) oraz załączników [wydania 0.4.0](https://github.com/romanskk47/easy-ksef/releases/tag/v0.4.0). Obecność pliku konfiguracyjnego CI nie jest potwierdzeniem przejścia testów na danej platformie.

Test pakietu sprawdza uruchomienie aplikacji i przetwarzanie przykładowego XML-a do zweryfikowanego PDF-a na tymczasowym profilu. Nie potwierdza dostępu do produkcyjnego KSeF. Nie zastępuje ręcznego sprawdzenia instalatora, uprawnień sejfu systemowego, migracji starszej wersji ani wszystkich dystrybucji Linuksa.

Poza zakresem pozostają niezależny pentest, formalny audyt kryptografii i infrastruktury MF, testy złośliwego oprogramowania działającego na komputerze użytkownika oraz gwarancja wydajności dla dowolnie dużych archiwów.

## Świadome ograniczenia pilotażu

- Niepodpisane instalatory; brak notaryzacji macOS i automatycznych aktualizacji.
- PDF-y, XML-e i eksporty nie są szyfrowane przez aplikację.
- Brak obsługi równoczesnego zapisu do jednego archiwum przez kilka komputerów.
- Token jest chroniony przez mechanizmy konta systemowego, nie przed przejęciem działającego systemu.
- Publikacja otwartego kodu i przejście testów nie stanowią gwarancji braku luk.

[Zgłoszenie luki](../SECURITY.md) · [Opis przepływu danych](bezpieczenstwo.md)
