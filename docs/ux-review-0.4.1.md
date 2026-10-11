# Sprawdzenie interfejsu 0.4.1

Zakres: ekran faktur, odświeżenie danych KSeF, wybór okresu, komunikaty i eksport. Kontrola z 11 października 2026 r. korzystała z lokalnych, fikcyjnych faktur oraz symulowanego połączenia. Nie potwierdza działania konta ani bieżącej dostępności KSeF.

[Poprzedni ekran](screenshots/faktury.png) · [Ekran po zmianie](screenshots/faktury.jpg)

| Obszar | Problem przed zmianą | Zmiana | Dowód i wynik |
| --- | --- | --- | --- |
| Układ | Czas pobrania był małym tekstem w filtrach; czynność łączyła dane i pliki. | Stały panel „Dane z KSeF”, osobna „Lista faktur” i działania na plikach. | Sprawdzono renderowane widoki 1340×860, 660×600 i 320×700. Brak poziomego przewijania całej strony; tabela zachowuje własne przewijanie. Małe okno przewija treść pionowo. PASS. |
| Teksty | „Pobieranie” oznaczało zarówno odczyt KSeF, jak i przygotowanie PDF. | „Odśwież z KSeF”, „Wybierz okres…” i „Eksportuj…”. Przy dacie widać zakres, którego dotyczy odczyt. | Sprawdzono zwykły sukces, wybrany okres, pustą firmę, błąd połączenia, błąd PDF i anulowanie po odczycie zakupów. PASS. |
| Dostępność | Błędne daty blokowały przycisk bez wskazania pola; postęp miał dwa ogłoszenia. | Walidacja po zatwierdzeniu, fokus na błędnym polu, aria-invalid i opis błędu; jeden główny komunikat postępu. | Daty zmienione klawiaturą: fokus trafił do „Do”, z prawidłowym opisem błędu. Po zamknięciu wrócił do „Wybierz okres…”. Kontrola DOM i klawiatury; bez pełnego audytu czytnikiem ekranu. PASS w sprawdzonym zakresie. |
| Typografia | Informacja o aktualności była podporządkowana filtrom. | Nagłówek panelu, wyróżniona data i mniejszy opis zakresu. Daty używają cyfr tabelarycznych. | Sprawdzono 320 px i powiększenie 200% przez CSS w lokalnym podglądzie. Wąska zawartość przechodzi do układu pionowego, daty pozostają czytelne. PASS. |
| Kolory | Błąd PDF wyglądał jak nieudane pobranie KSeF. | Błąd odczytu i ostrzeżenie o brakującym PDF mają różne komunikaty i stany. Zachowano paletę aplikacji. | Z renderowanych kolorów: tekst/biel 15,10:1, tekst pomocniczy/biel 5,75:1, biały tekst/przycisk 6,97:1. Status zawsze opisany słowami. PASS. |
| Zachowanie UI | Czas sukcesu powstawał po PDF-ach. | Archiwum utrwala pełny odczyt XML przed przygotowaniem PDF; status i lista aktualizują się w tym momencie. | W przeglądarce data była widoczna podczas przygotowania PDF. Błąd KSeF zachował stare daty; błąd PDF zachował nowy sukces; eksport Excel nie zmienił żadnej daty. PASS. |

## Kontrole techniczne

- `npm test`: 113 testów, wszystkie przeszły lokalnie; w tym wstrzymany renderer PDF, niepełne XML, anulowanie i osobne konteksty firmy/środowiska/rodzaju faktur.
- `npm run build:ui` i `git diff --check`: poprawne.
- Konsola przeglądarki: bez zarejestrowanych błędów i ostrzeżeń podczas sprawdzania.
- Niezależny przegląd backendu: bez potwierdzonych defektów w kontroli nowego statusu. Przegląd UI wykrył dwa problemy (opis anulowania obu rodzajów i kierunek przycisku naprawy); poprawiono je przed wydaniem.
- Natywne instalatory i ich testy są dodatkowo wykonywane w CI. Wynik publikacji należy potwierdzić na stronie odpowiedniego przebiegu, niezależnie od lokalnej kontroli interfejsu.

Pozostające ograniczenia: ręczne odświeżanie, pilotaż bez podpisu wydawcy, brak testu rzeczywistego połączenia KSeF w tej kontroli. Starsze archiwum początkowo korzysta z udokumentowanego czasu poprzedniego ukończonego pobrania; następne odświeżenie zapisuje już oddzielny czas odczytu.
