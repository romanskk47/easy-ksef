import React,{useState,useEffect,useRef} from 'react';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import {Slider} from '../ui/slider';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '../ui/dialog';
import {api} from '../../lib/client';
import {money} from '../../lib/format';
import {countLabel} from '../../lib/workflow.mjs';
import {cleanFilters,normalizedFilters,queryFilters,parseAmount,amountCurrency} from '../../lib/invoice-filters.mjs';
const currencyNames=new Intl.DisplayNames(['pl'],{type:'currency'});
export default function FilterSettings({open,onOpenChange,applied,onApply,facets,query,returnFocusRef}){
 const [filters,setFilters]=useState(applied),[preview,setPreview]=useState(null),[retry,setRetry]=useState(0);
 const lowerInput=useRef(null),upperInput=useRef(null);
 useEffect(()=>{if(open){setFilters({...applied});setPreview(null);}},[open]);
 let filterError='',invalidField='';
 for(const key of ['minGross','maxGross']){try{parseAmount(filters[key]);}catch(e){filterError=e.message;invalidField=key;break;}}
 if(!filterError){try{normalizedFilters(filters);}catch(e){filterError=e.message;invalidField='minGross';}}
 const draftKey=JSON.stringify(filters),queryKey=JSON.stringify(query);
 useEffect(()=>{if(!open||filterError)return;let active=true;setPreview(null);const timer=setTimeout(()=>{api('query',{...query,filters:queryFilters(filters),page:1}).then(result=>{if(active)setPreview({count:result.total,key:draftKey+queryKey});}).catch(error=>{if(active)setPreview({error:error.message,key:draftKey+queryKey});});},180);return()=>{active=false;clearTimeout(timer);};},[open,draftKey,queryKey,filterError,retry]);
 const currencies=facets?.currencies||[],unit=amountCurrency(facets,filters.currency),canSetAmount=!!unit&&unit.min!==null&&unit.max!==null;
 let bounds=null;
 if(unit&&unit.min!==null&&unit.max!==null){
  const low=filterError?null:parseAmount(filters.minGross),high=filterError?null:parseAmount(filters.maxGross);
  const min=Math.floor(Math.min(unit.min,low??unit.min)*100),max=Math.ceil(Math.max(unit.max,high??unit.max)*100);
  if(min<max&&Number.isSafeInteger(min)&&Number.isSafeInteger(max))bounds={min,max,value:[Math.round((low??unit.min)*100),Math.round((high??unit.max)*100)]};
 }
 function update(key,value){setFilters(f=>({...f,[key]:value}));}
 function apply(){if(filterError){(invalidField==='maxGross'?upperInput:lowerInput).current?.focus();return;}onApply(normalizedFilters(filters));onOpenChange(false);}
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="task-dialog filter-dialog" id="invoice-filters" onCloseAutoFocus={event=>{event.preventDefault();returnFocusRef?.current?.focus();}}><DialogHeader><DialogTitle>Filtruj zapisane faktury</DialogTitle><DialogDescription>Wybierz faktury do przeglądania lub wysłania. Filtry obejmują wszystkie strony wybranego okresu.</DialogDescription></DialogHeader>
 <div className="dialog-body filter-body"><section className="filter-section"><div className="filter-grid">
 <label>Kontrahent<Input placeholder="Nazwa lub NIP" value={filters.counterparty} onChange={e=>update('counterparty',e.target.value)}/></label>
 <label>Waluta<select value={filters.currency} onChange={e=>setFilters(f=>({...f,currency:e.target.value,minGross:'',maxGross:''}))} aria-describedby="currency-hint"><option value="">Wszystkie waluty</option>{currencies.map(c=><option key={c.code} value={c.code}>{c.code} · {currencyNames.of(c.code)} ({c.count})</option>)}{filters.currency&&!currencies.some(c=>c.code===filters.currency)&&<option value={filters.currency}>{filters.currency} · brak w tym okresie</option>}</select></label>
 </div><p className="filter-hint" id="currency-hint">{facets?.count===0?'W tym okresie nie ma zapisanych faktur.':'Waluty z zapisanych faktur w wybranym okresie. W nawiasie: liczba faktur. Po zmianie waluty ustaw kwoty ponownie.'}</p></section>
 <section className="filter-section amount-section" aria-labelledby="amount-heading"><div className="filter-section-heading"><h3 id="amount-heading">Kwota brutto{unit?' · '+unit.code:''}</h3><Button variant="ghost" size="sm" disabled={!filters.minGross&&!filters.maxGross} onClick={()=>setFilters(f=>({...f,minGross:'',maxGross:''}))}>Bez ograniczeń</Button></div>
 {!canSetAmount?<div className="amount-guidance">{currencies.length>1?'Wybierz jedną walutę, aby ustawić kwoty. PLN i EUR mają osobne zakresy.':filters.currency?'Brak kwot w tej walucie w wybranym okresie.':'Zakres kwot będzie dostępny po zapisaniu faktur.'}{(filters.minGross||filters.maxGross)&&<Button variant="outline" size="sm" onClick={()=>setFilters(f=>({...f,minGross:'',maxGross:''}))}>Usuń zakres kwot</Button>}</div>:<>
 <div className="amount-inputs"><label>Od<div className="amount-input"><Input ref={lowerInput} inputMode="decimal" placeholder="Bez minimum" value={filters.minGross.replace('.',',')} aria-invalid={invalidField==='minGross'} aria-describedby={filterError?'amount-error':'amount-hint'} onChange={e=>update('minGross',e.target.value)}/><span>{unit.code}</span></div></label><span className="range-separator" aria-hidden="true">—</span><label>Do<div className="amount-input"><Input ref={upperInput} inputMode="decimal" placeholder="Bez maksimum" value={filters.maxGross.replace('.',',')} aria-invalid={invalidField==='maxGross'} aria-describedby={filterError?'amount-error':'amount-hint'} onChange={e=>update('maxGross',e.target.value)}/><span>{unit.code}</span></div></label></div>
 <p id="amount-error" className="error-text" role="alert">{filterError}</p>
 {bounds&&!filterError&&<div className="amount-range"><Slider min={bounds.min} max={bounds.max} step={1} value={bounds.value} labels={['Kwota brutto od','Kwota brutto do']} valueText={v=>money(v/100)+' '+unit.code} onValueChange={([min,max])=>setFilters(f=>({...f,minGross:(min/100).toFixed(2),maxGross:(max/100).toFixed(2)}))}/><div className="amount-range-labels"><span>{money(bounds.min/100)} {unit.code}</span><span>{money(bounds.max/100)} {unit.code}</span></div></div>}
 <p className="filter-hint" id="amount-hint">{unit.min===unit.max?'Wszystkie zapisane kwoty są jednakowe. Możesz wpisać własny zakres.':bounds?'Przesuń końce suwaka lub wpisz dokładne kwoty, np. 1 234,56.':'Wpisz dokładne kwoty, np. 1 234,56.'} Puste pole oznacza brak ograniczenia.</p>
 </>}
 </section><section className="filter-section"><div className="filter-grid"><label>Rodzaj faktury<select value={filters.type} onChange={e=>update('type',e.target.value)}><option value="">Wszystkie rodzaje</option><option value="regular">Zwykłe faktury</option><option value="correction">Korekty</option><option value="Zal">Zaliczki</option><option value="Roz">Rozliczeniowe</option><option value="Upr">Uproszczone</option><option value="unknown">Rodzaj nieznany</option></select></label><label>Stan plików<select value={filters.status} onChange={e=>update('status',e.target.value)}><option value="">Wszystkie stany</option><option value="ready">Kompletne PDF i XML</option><option value="attention">Wymagają naprawy</option><option value="xml-only">Brak PDF</option><option value="damaged">Brakujące lub uszkodzone</option></select></label></div></section>
 </div><DialogFooter className="dialog-actions filter-footer"><div className="filter-preview" role="status" aria-live="polite">{filterError?'Popraw zakres kwot.':preview?.key===draftKey+queryKey&&preview?.error?<><span>Nie udało się policzyć wyników.</span><Button variant="link" size="sm" onClick={()=>setRetry(n=>n+1)}>Spróbuj ponownie</Button></>:preview?.key===draftKey+queryKey?`Pasuje ${countLabel(preview.count)}`:'Sprawdzanie wyników…'}</div><div className="filter-footer-buttons"><Button variant="ghost" onClick={()=>setFilters({...cleanFilters})}>Wyczyść filtry</Button><Button variant="outline" onClick={()=>onOpenChange(false)}>Anuluj</Button><Button onClick={apply}>Pokaż wyniki</Button></div></DialogFooter></DialogContent></Dialog>;
}
