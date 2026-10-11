import React,{useRef} from 'react';
import {Download,FolderOpen,Search,SlidersHorizontal,X} from 'lucide-react';
import {Button} from '../ui/button';
import {Input} from '../ui/input';
import {Badge} from '../ui/badge';
import IconButton from '../IconButton';
import SelectControl from '../SelectControl';
import ColumnSettings from './ColumnSettings';
import FilterSettings from './FilterSettings';
import {api} from '../../lib/client';
import {monthLabel,timestampLabel} from '../../lib/format';
import {monthOf,previousMonth,checkedView} from '../../view.mjs';
import {filterChips} from '../../lib/invoice-filters.mjs';
const cleanFilters={counterparty:'',currency:'',minGross:'',maxGross:'',type:'',status:''};
export default function InvoiceToolbar({state,actions}){
 const {periodKind,month,from,to,months,rangeValid,busy,search,filterOpen,hasFilters,view,filterError,filters,lastRun,coverageMessage,status,role,syncMessage,facets,query,filtersUnavailable,coverage,history,folder,freshness,companyEmpty,operation,progress,cancelling,onCancel}=state;
 const chips=filterChips(filters);
 const filterTrigger=useRef(null);
 const {setPeriodKind,setMonth,setFrom,setTo,download,setSearch,setFilterOpen,setView,setFilters,notify}=actions;
 return <div className="list-controls"><div className="period-controls"><label htmlFor="period-kind">Pokaż faktury z okresu</label><SelectControl id="period-kind" value={periodKind==='month'?month:periodKind} onChange={e=>{const value=e.target.value;if(value==='range'||value==='all')setPeriodKind(value);else{setMonth(value);setPeriodKind('month');}}}><option value="all">Wszystkie zapisane</option>{months.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}<option value="range">Własny zakres dat…</option></SelectControl>{periodKind==='range'&&<div className="date-range"><label>Od<Input type="date" value={from} onChange={e=>setFrom(e.target.value)} aria-invalid={!rangeValid} aria-describedby={!rangeValid?'range-error':undefined}/></label><label>Do<Input type="date" value={to} onChange={e=>setTo(e.target.value)} aria-invalid={!rangeValid} aria-describedby={!rangeValid?'range-error':undefined}/></label></div>}</div><div className="search-line"><div className="search-box"><Search aria-hidden="true"/><label htmlFor="invoice-search" className="sr-only">Szukaj po firmie, NIP-ie, numerze faktury lub KSeF</label><Input id="invoice-search" placeholder="Szukaj faktury…" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<IconButton label="Wyczyść wyszukiwanie" onClick={()=>setSearch('')}><X/></IconButton>}</div><Button ref={filterTrigger} aria-disabled={filtersUnavailable} variant={filterOpen||hasFilters?'secondary':'outline'} aria-expanded={filterOpen} aria-controls="invoice-filters" onClick={()=>{if(!filtersUnavailable)setFilterOpen(v=>!v);}}><SlidersHorizontal/>Filtry{hasFilters&&<Badge>{chips.length}</Badge>}</Button><ColumnSettings view={view} busy={busy} onSave={async next=>{const saved=await api('saveView',{role,view:next});setView(checkedView(saved||next));notify('Układ kolumn zapisany.');}}/></div>{!rangeValid&&<p id="range-error" className="error-text" role="alert">Data „Od” nie może być późniejsza niż data „Do”.</p>}
 {filterError&&<p id="filter-error" className="error-text" role="status">{filterError}</p>}
 <p className="list-filter-hint">Okres i filtry zmieniają tylko widok listy. Nie łączą się z KSeF.</p>
 {chips.length>0&&<div className="active-filters" aria-label="Aktywne filtry">{chips.map(chip=><Button key={chip.keys[0]} variant="outline" size="sm" aria-label={'Usuń filtr: '+chip.label} onClick={()=>setFilters(f=>({...f,...Object.fromEntries(chip.keys.map(key=>[key,'']))}))}>{chip.label}<X aria-hidden="true"/></Button>)}<Button variant="ghost" size="sm" onClick={()=>setFilters({...cleanFilters})}>Wyczyść filtry</Button></div>}
 <FilterSettings open={filterOpen} onOpenChange={setFilterOpen} applied={filters} onApply={setFilters} facets={facets} query={query} returnFocusRef={filterTrigger}/>
 </div>;
}
