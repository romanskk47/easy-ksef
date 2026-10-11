import React from 'react';

export default function Help(){
 return <section className="text-page">
  <h1>Jak korzystać z Easy KSeF</h1>
  <details open>
   <summary>Odświeżenie z KSeF a pliki na komputerze</summary>
   <p>„Odśwież z KSeF” sprawdza nowe faktury zakupowe i sprzedażowe wybranej firmy. Najpierw aktualizuje dane na liście i zapisuje oryginalne XML-e z KSeF. Potem przygotowuje PDF-y do tych faktur.</p>
   <p>Panel „Dane z KSeF” pokazuje czas i zakres ostatniego udanego odświeżenia osobno dla zakupów i sprzedaży. Jeśli następna próba zakończy się błędem albo zostanie przerwana, zobaczysz jej wynik obok ostatniego potwierdzonego stanu.</p>
   <p>Brak PDF-a nie oznacza, że faktury brakuje na liście. Stan plików sprawdzisz przy fakturze. „Otwórz folder” i „Eksportuj…” korzystają z plików na komputerze.</p>
  </details>
  <details>
   <summary>Czy faktury odświeżają się same?</summary>
   <p>Odświeżanie jest ręczne. Kliknij „Odśwież z KSeF”, aby sprawdzić nowe faktury obu rodzajów. Otworzenie programu lub przełączenie firmy nie odświeża danych.</p>
   <p>„Lista faktur” pokazuje dane już zapisane w aplikacji. Zmiana miesiąca, wyszukiwanie i filtry zmieniają tylko widok tej listy. Aby sprawdzić konkretny miesiąc w KSeF, użyj „Wybierz okres…”.</p>
  </details>
  <details>
   <summary>Chcę uzupełnić całą historię</summary>
   <p>Kliknij „Wybierz okres…”, zaznacz „Cała dostępna historia” i „Zakupowe i sprzedażowe”, a następnie „Odśwież całą historię”. Program uzupełni listę o faktury dostępne przez KSeF 2.0 dla tej firmy. Nie musisz osobno wybierać miesięcy.</p>
   <p>Zakupy i sprzedaż zobaczysz na osobnych zakładkach. Kolejne nowe faktury sprawdzisz przyciskiem „Odśwież z KSeF”.</p>
  </details>
  <details>
   <summary>Chcę sprawdzić faktury za wybrany okres</summary>
   <ol>
    <li>Kliknij „Wybierz okres…”.</li>
    <li>Zaznacz „Wybrany okres” i wybierz rodzaj faktur.</li>
    <li>Wybierz miesiąc lub własny zakres dat wystawienia.</li>
    <li>Kliknij „Odśwież wybrany okres”. Program sprawdzi cały zakres, niezależnie od stron i filtrów listy.</li>
   </ol>
   <p>Sprawdzenie dawnego miesiąca aktualizuje ten zakres. Aby sprawdzić nowe dokumenty, kliknij „Odśwież z KSeF”.</p>
  </details>
  <details>
   <summary>Chcę wysłać faktury księgowej</summary>
   <p>Najpierw odśwież dane z KSeF. Na liście wybierz miesiąc lub zakres, ewentualnie wyszukaj firmę. Kliknij „Eksportuj…”. Wybierz paczkę samych PDF-ów, PDF-ów z XML-ami albo zestawienie w Excelu.</p>
   <p>Bez zaznaczenia eksport obejmuje wszystkie wyniki ze wszystkich stron. Po zaznaczeniu — tylko zaznaczone faktury. Strony służą do przeglądania, nie ograniczają rozmiaru paczki.</p>
   <p>Eksport zapisuje plik na komputerze. Nie odświeża KSeF ani nie wysyła wiadomości. Gotową paczkę możesz samodzielnie dołączyć do wiadomości.</p>
  </details>
  <details>
   <summary>Chcę znaleźć fakturę lub zmienić kolumny</summary>
   <p>Wyszukiwanie działa po wpisaniu nazwy firmy, NIP-u lub numeru faktury. Wybierz okres, użyj filtrów albo kliknij nagłówek kolumny, aby sortować. Te czynności dotyczą tylko faktur już w aplikacji.</p>
   <p>W „Kolumnach” wybierz widoczne pola i ich kolejność. Zapisz widok. Układ zakupów i sprzedaży zapamiętujemy osobno.</p>
  </details>
  <details>
   <summary>Dane są odświeżone, ale brakuje PDF-a</summary>
   <p>PDF powstaje po odczytaniu danych z KSeF. Błąd przygotowania PDF-a nie zmienia czasu potwierdzonego odświeżenia danych. Faktura z zapisanym XML-em może już być widoczna na liście.</p>
   <p>Wybierz „Filtry” → „Stan plików” → „Wymagają naprawy”. Lista pokaże faktury z brakującym lub uszkodzonym plikiem. Przez „Wybierz okres…” odśwież ich okres ponownie. Program sprawdzi pliki i spróbuje przygotować brakujące PDF-y.</p>
   <p>Jeśli brakuje plików potrzebnych do wybranej paczki, eksport wskaże problem.</p>
  </details>
  <details>
   <summary>Jak dodać lub przełączyć firmę?</summary>
   <p>Wybierz firmę z listy u góry. Otworzysz jej zapisane dane; przełączenie nie sprawdza nowych faktur w KSeF. „Dodaj kolejną firmę…” otwiera pusty formularz. Każda firma potrzebuje własnego tokena dla jej NIP-u i środowiska.</p>
   <p>W Ustawieniach możesz także dodać firmę lub zmienić token wybranej firmy. Test i produkcja tego samego NIP-u są osobnymi pozycjami. Nie udostępnia to danych innym osobom ani komputerom.</p>
  </details>
  <details>
   <summary>Gdzie zapisują się XML-y, PDF-y i eksporty?</summary>
   <p>„Otwórz folder” pokazuje zapisane dokumenty wybranego rodzaju. Folder wybierasz przy konfiguracji; jego pełna ścieżka jest w Ustawieniach. Możesz tam zmienić folder — program skopiuje dokumenty tej firmy, pozostawiając poprzednie pliki.</p>
   <p>Podfoldery oddzielają środowisko, firmę, zakupowe i sprzedażowe oraz miesiące. „Eksporty” zawiera paczki ZIP i pliki Excel.</p>
   <p>Token chroni system. Program łączy się bezpośrednio z Ministerstwem Finansów. Jeśli system synchronizuje wybrany folder z iCloud lub OneDrive, dokumenty mogą trafić do tej usługi.</p>
  </details>
  <details>
   <summary>Stan tej wersji</summary>
   <p>To otwarta wersja próbna dla jednego komputera. Możesz obsługiwać kilka firm; każda ma osobny dostęp i dokumenty. Nie wystawia faktur ani nie sprawdza płatności. Program jest bezpłatny. Instalatory tej wersji nie mają podpisu wydawcy. Aktualizacje instalujesz ręcznie z oficjalnego repozytorium projektu.</p>
   <p>Duże zakresy odświeżania dzielimy automatycznie. Ograniczenia lub awarie KSeF mogą wydłużyć pracę. Jeśli nie uda się potwierdzić całego zakresu danych, pokażemy niepełny wynik. Stan przygotowania PDF-ów jest oddzielny.</p>
  </details>
 </section>;
}
