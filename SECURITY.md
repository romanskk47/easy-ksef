# Zgłaszanie luk bezpieczeństwa

**Nie publikuj tokena, faktury ani danych swojej firmy w zgłoszeniu.** Dotyczy to także zrzutów ekranu, logów, adresów pobierania paczek i plików konfiguracyjnych.

Podejrzenie luki zgłoś przez [prywatne zgłoszenie bezpieczeństwa na GitHubie](https://github.com/romanskk47/easy-ksef/security/advisories/new). Opisz wersję programu, system, kroki odtworzenia i możliwy skutek. Użyj danych fikcyjnych. Nie przeprowadzaj testów na cudzych kontach KSeF.

Jeśli prywatny formularz jest niedostępny, otwórz zwykłe zgłoszenie z samą prośbą o prywatny kontakt — bez opisu luki i danych wrażliwych.

## Zakres wsparcia

Poprawki bezpieczeństwa trafiają do najnowszego wydania. Obecna linia publicznego pilotażu to **0.4.x**. Nie ma automatycznych aktualizacji; po opublikowaniu poprawki pobierz nowe wydanie z tego repozytorium.

Nie deklarujemy stałego czasu odpowiedzi ani niezależnego audytu bezpieczeństwa. Przegląd przed publikacją i testy ograniczają ryzyko, ale nie gwarantują braku błędów.

## Gdy token mógł wyciec

1. Unieważnij go w Aplikacji Podatnika KSeF dla właściwej firmy i środowiska.
2. Wygeneruj nowy token z samym uprawnieniem do przeglądania faktur.
3. W Easy KSeF wybierz tę firmę → **Ustawienia** → zmiana tokena.
4. Usuń sekret z miejsca, w którym go udostępniłeś. Samo usunięcie wpisu nie zastępuje unieważnienia tokena.

Więcej: [ochrona danych i granice zabezpieczeń](docs/bezpieczenstwo.md), [przegląd wydania 0.4.0](docs/security-review.md).
