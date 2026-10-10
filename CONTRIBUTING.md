# Pomóż ulepszyć Easy KSeF

Najbardziej przydatne zgłoszenie opisuje prawdziwe zadanie: „Chcę przekazać wszystkie faktury za miesiąc księgowej, ale nie wiem, czy zaznaczyłem wszystkie strony”. Nie musisz proponować rozwiązania ani znać się na programowaniu.

## Zgłoszenie problemu

Użyj [formularza zgłoszenia](https://github.com/romanskk47/easy-ksef/issues/new/choose). Podaj system, wersję aplikacji, oczekiwany wynik i kroki odtworzenia. Zrzut ekranu jest pomocny po usunięciu nazw firm, NIP-ów, numerów faktur, kwot i ścieżek z danymi osobowymi. Nigdy nie załączaj tokena lub prawdziwej faktury.

Luki zgłaszaj [prywatnie](SECURITY.md).

## Zmiana kodu

1. Dla większej zmiany najpierw opisz problem w zgłoszeniu.
2. Przygotuj mały pull request, który rozwiązuje jeden problem.
3. W opisie pokaż efekt dla użytkownika i sposób sprawdzenia. Dla zmiany wyglądu dodaj zrzut na fikcyjnych danych.
4. Uruchom testy odpowiednie do zmiany i kompilację interfejsu. Instrukcje są w [docs/development.md](docs/development.md).

Testy korzystają z fikcyjnych danych. Nie dodawaj prywatnych archiwów, poświadczeń, raportów z kont ani absolutnych ścieżek ze swojego komputera. Nowa zależność wymaga sprawdzenia licencji i uzasadnienia. Nie wyłączaj zabezpieczeń Electron ani systemowego sejfu po to, by uruchomić aplikację.

Zachowuj prosty język interfejsu i rozróżnienie trzech czynności: pobranie z KSeF, przeglądanie lokalnych plików i przygotowanie eksportu. Nie dodawaj kolejnego przełącznika, jeśli problem można rozwiązać czytelną nazwą albo dobrym ustawieniem domyślnym.

Przekazując zmianę, udostępniasz ją na licencji MIT projektu. Zachowaj informacje o autorach i licencjach wykorzystywanego kodu.
