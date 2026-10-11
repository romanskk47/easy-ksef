import React,{useState,useEffect,useRef} from 'react';
import {RefreshCw,FolderOpen} from 'lucide-react';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '../ui/dialog';
import {monthLabel,timestampLabel} from '../../lib/format';
import SelectControl from '../SelectControl';
import {monthOf} from '../../view.mjs';

function validDate(value){
 if(!/^20\d{2}-(0[1-9]|1[0-2])-\d{2}$/.test(value))return false;
 const date=new Date(value+'T12:00:00Z');
 return Number.isFinite(+date)&&date.toISOString().slice(0,10)===value;
}

export default function DownloadDialog({open,onOpenChange,role,period,months,folder,busy,onDownload,initialMode,roleStatuses={},bootstrapFrom,profile,returnFocus}){
 const [mode,setMode]=useState('history'),[scope,setScope]=useState(role),[choice,setChoice]=useState(''),[from,setFrom]=useState(''),[to,setTo]=useState(''),[submitted,setSubmitted]=useState(false);
 const fromInput=useRef(null),toInput=useRef(null);
 useEffect(()=>{
  if(!open)return;
  const next=initialMode||(period.kind==='all'?'history':'period');
  setMode(next);setScope(next==='history'?'both':role);setChoice(period.kind==='range'?'range':period.month||monthOf());setSubmitted(false);
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw'}).format(new Date());
  const [year,month]=(period.month||monthOf()).split('-').map(Number);
  const monthEnd=new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);
  setFrom(period.from||(period.month||monthOf())+'-01');setTo(period.to||(monthEnd<today?monthEnd:today));
 },[open]);
 const displayMonths=period.kind==='month'&&!months.includes(period.month)?[period.month,...months]:months;
 const destination=scope==='both'?folder.replace(/\/(Zakupy|Sprzedaż)\/?$/,'')+' / Zakupy i Sprzedaż':folder.replace(/\/(Zakupy|Sprzedaż)\/?$/,scope==='purchase'?'/Zakupy':'/Sprzedaż')+(mode==='period'&&/^20\d{2}-\d{2}$/.test(choice)?'/'+choice:'');
 const scopes=scope==='both'?['purchase','sales']:[scope];
 const customRange=mode==='period'&&choice==='range';
 const fromError=customRange&&!validDate(from)?'Wpisz pełną datę „Od”, np. 01.08.2026.':'';
 const toError=customRange&&!validDate(to)?'Wpisz pełną datę „Do”, np. 31.08.2026.':customRange&&!fromError&&from>to?'Data „Do” musi być taka sama lub późniejsza niż data „Od”.':'';
 const labels={history:'Cała dostępna historia',period:'Wybrany okres'};
 const descriptions={history:'Uzupełnij listę także o starsze faktury, bez wybierania dat.',period:'Sprawdź miesiąc lub zakres według daty wystawienia faktury.'};
 function chooseMode(next){setMode(next);setScope(next==='history'?'both':role);setSubmitted(false);}
 function submit(event){
  event.preventDefault();if(busy)return;
  setSubmitted(true);
  if(fromError||toError){(fromError?fromInput:toInput).current?.focus();return;}
  onOpenChange(false);
  onDownload({role:scope,...(mode==='history'?{kind:'history'}:mode==='incremental'?{kind:'incremental'}:choice==='range'?{kind:'range',dateFrom:from,dateTo:to}:{kind:'monthly',month:choice})});
 }
 return <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="task-dialog download-dialog" onCloseAutoFocus={event=>{event.preventDefault();const trigger=returnFocus?.current;(trigger?.isConnected&&!trigger.disabled?trigger:document.getElementById('invoice-search'))?.focus();}}>
   <DialogHeader>
    <DialogTitle>Odśwież dane z KSeF</DialogTitle>
    <DialogDescription>Najpierw uzupełnimy listę faktur danymi z KSeF. Potem automatycznie przygotujemy pliki PDF.</DialogDescription>
   </DialogHeader>
   <form id="ksef-period-form" className="dialog-body download-options" noValidate onSubmit={submit}>
    <div className="download-company"><strong>{profile?.name}</strong><span>NIP {profile?.nip} · {profile?.environment==='prod'?'KSeF produkcyjny':'KSeF testowy'}</span></div>
    {mode!=='incremental'&&<fieldset className="download-modes"><legend>Jaki zakres chcesz odświeżyć?</legend>{['history','period'].map(value=><label key={value} className={mode===value?'download-mode chosen':'download-mode'}><input type="radio" name="download-mode" value={value} checked={mode===value} onChange={()=>chooseMode(value)}/><span><strong>{labels[value]}</strong><small>{descriptions[value]}</small></span></label>)}</fieldset>}
    <label htmlFor="download-role">Rodzaj faktur do odświeżenia</label>
    <SelectControl id="download-role" value={scope} onChange={e=>setScope(e.target.value)}><option value="both">Zakupowe i sprzedażowe</option><option value="purchase">Zakupowe — od dostawców</option><option value="sales">Sprzedażowe — dla klientów</option></SelectControl>
    {mode==='period'&&<>
     <label htmlFor="download-period">Daty wystawienia faktur</label>
     <SelectControl id="download-period" value={choice} onChange={e=>{setChoice(e.target.value);setSubmitted(false);}}>{displayMonths.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}<option value="range">Własny zakres dat…</option></SelectControl>
     {customRange&&<>
      <div className="date-range">
       <label htmlFor="download-date-from">Od<Input ref={fromInput} id="download-date-from" type="date" required value={from} aria-invalid={submitted&&!!fromError} aria-describedby={submitted&&fromError?'download-date-from-error':undefined} onChange={e=>setFrom(e.target.value)}/></label>
       <label htmlFor="download-date-to">Do<Input ref={toInput} id="download-date-to" type="date" required value={to} aria-invalid={submitted&&!!toError} aria-describedby={submitted&&toError?'download-date-to-error':undefined} onChange={e=>setTo(e.target.value)}/></label>
      </div>
      {submitted&&fromError&&<p id="download-date-from-error" className="error-text" role="alert">{fromError}</p>}
      {submitted&&toError&&<p id="download-date-to-error" className="error-text" role="alert">{toError}</p>}
     </>}
    </>}
    {mode==='history'?<p className="muted">Sprawdzimy całą dostępną historię wybranego rodzaju. Duża historia może potrwać dłużej.</p>:mode==='incremental'?<div className="incremental-starts">{scopes.map(value=><p className="muted" key={value}>{value==='purchase'?'Zakupowe':'Sprzedażowe'}: od {roleStatuses[value]?.continuation?timestampLabel(roleStatuses[value].continuation):bootstrapFrom?timestampLabel(bootstrapFrom):'początku poprzedniego miesiąca'}{!roleStatuses[value]?.continuation?' (pierwsze odświeżenie)':''}.</p>)}<p className="muted">Starsze dokumenty uzupełnisz przez „Cała dostępna historia”.</p></div>:<p className="muted">Sprawdzimy cały wybrany okres, niezależnie od filtrów, zaznaczenia i stron listy.</p>}
    <div className="destination-summary"><FolderOpen aria-hidden="true"/><div><strong>Pliki na komputerze</strong><p>{destination.split('/').filter(Boolean).slice(-3).join(' / ')}</p><details className="destination-path"><summary>Pokaż pełną ścieżkę</summary><p dir="ltr">{destination}</p></details><span>Tu zapiszemy XML-y z KSeF i przygotowane PDF-y. Folder zmienisz w Ustawieniach.</span></div></div>
    {mode==='history'&&<details className="history-scope-details"><summary>Jaką historię sprawdzimy?</summary><p className="muted">Faktury dostępne przez KSeF 2.0 dla tej firmy, w których jest sprzedawcą lub nabywcą. Sprawdzamy zapis w KSeF od 1 stycznia 2022 r., do ostatniego kompletnego stanu danych. Nie obejmuje to faktur, w których firma jest wyłącznie podmiotem trzecim lub upoważnionym.</p></details>}
    <p className="muted">Faktury na liście nie będą się powtarzać. Ponowne odświeżenie spróbuje też uzupełnić brakujące lub uszkodzone pliki z tego zakresu.</p>
   </form>
   <DialogFooter className="dialog-actions"><Button type="button" variant="outline" onClick={()=>onOpenChange(false)}>Anuluj</Button><Button type="submit" form="ksef-period-form" disabled={busy}><RefreshCw aria-hidden="true"/>{mode==='history'?'Odśwież całą historię':mode==='incremental'?'Odśwież nowe faktury':'Odśwież wybrany okres'}</Button></DialogFooter>
  </DialogContent>
 </Dialog>;
}
