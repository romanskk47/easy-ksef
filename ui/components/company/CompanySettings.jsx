import React from 'react';
import {Plus} from 'lucide-react';
import {Button} from '../ui/button';
import CompanySelector from './CompanySelector';
const readablePath=value=>value.replace(/^\/Users\/[^/]+\//,'~/').replace(/^~\/Documents\//,'Dokumenty / ');
export default function CompanySettings({status,busy,onSelect,onAdd,onEdit,onFolder}){
 const p=status.profile,base=status.documentsBase||'',environment=p.environment==='prod'?'Produkcja':'Test';
 return <section className="company-settings settings-workspace">
  <div className="settings-heading"><h1>Ustawienia</h1><Button variant="outline" disabled={busy} onClick={onAdd}><Plus/>Dodaj firmę</Button></div>
  <div className="settings-panel">
   <section className="settings-row" aria-label="Firma">
    <h2>Firma</h2>
    <div className="settings-value">
     <CompanySelector id="settings-company" label="Wybierz firmę" profiles={status.profiles||[p]} profile={p} busy={busy} onSelect={onSelect} onAdd={onAdd}/>
     <p className="settings-hint">NIP {p.nip}</p>
    </div>
   </section>
   <section className="settings-row" aria-labelledby="folder-settings-title">
    <h2 id="folder-settings-title">Folder faktur</h2>
    <div className="settings-value">
     <p className="settings-value-text">{readablePath(base)}</p>
     <p className="settings-hint">PDF i XML · osobny folder dla każdej firmy</p>
     <details className="settings-details"><summary>Pokaż ścieżkę tej firmy</summary><p dir="ltr">{base}/{environment}/{p.nip}</p><p>Zakupy i sprzedaż są podzielone na miesiące. Przy zmianie folderu skopiujemy dokumenty tej firmy i zachowamy oryginały.</p></details>
    </div>
    <Button variant="outline" disabled={busy} onClick={onFolder} aria-label="Zmień folder faktur tej firmy">Zmień folder…</Button>
   </section>
   <section className="settings-row" aria-labelledby="access-settings-title">
    <h2 id="access-settings-title">Dostęp do KSeF</h2>
    <div className="settings-value"><p className="settings-value-text">Token zapisany</p><p className="settings-hint">Chroniony przez system na tym komputerze.</p></div>
    <Button variant="outline" disabled={busy} onClick={onEdit}>Edytuj nazwę lub token…</Button>
   </section>
  </div>
  <details className="settings-details settings-footnote"><summary>O przechowywaniu dokumentów</summary><p>Lista firm otwiera zapisane archiwa. Nowe faktury pobierasz ręcznie przez „Sprawdź nowe faktury”. Wybrany folder może być synchronizowany przez iCloud lub inną usługę zgodnie z ustawieniami systemu.</p></details>
 </section>;
}
