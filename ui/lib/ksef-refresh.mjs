const validTime=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const newest=items=>items.filter(item=>validTime(item?.time)).sort((a,b)=>Date.parse(b.time)-Date.parse(a.time))[0]||null;

// Older archives prove completed KSeF reads too, but their original scope must
// remain visible. Prefer the new independent timestamp over a later PDF finish.
export function refreshEvidence(state={},active=false){
 const saved=state.ksefRefresh;
 const legacy=newest([
  state.lastRun&&!state.lastRun.truncated?state.lastRun:null,
  state.history?{...state.history,kind:'history'}:null,
  ...(Array.isArray(state.coverage)?state.coverage.map(r=>({time:r.time,kind:'range',dateFrom:r.from,dateTo:r.to})):[]),
 ]);
 const success=validTime(saved?.lastSuccess?.time)?saved.lastSuccess:legacy;
 const attempt=validTime(saved?.lastAttempt?.time)?saved.lastAttempt:null;
 const relevant=attempt&&(!success||Date.parse(attempt.time)>=Date.parse(success.time));
 const issue=relevant&&attempt.status!=='success'?(attempt.status==='running'&&!active?'interrupted':attempt.status):null;
 return {success,attempt,issue};
}

const date=value=>String(value).slice(0,10).split('-').reverse().join('.');
export function refreshScope(record){
 if(!record)return '';
 if(record.kind==='incremental')return 'Nowe faktury';
 if(record.kind==='history')return 'Cała dostępna historia';
 if(record.dateFrom&&record.dateTo)return `Okres wystawienia: ${date(record.dateFrom)}–${date(record.dateTo)}`;
 return 'Sprawdzony zakres faktur';
}

export const attemptLabel=issue=>({failed:'Ostatnia próba nie powiodła się',cancelled:'Ostatnia próba została przerwana',incomplete:'Ostatnia próba nie objęła całego zakresu',interrupted:'Ostatnia próba nie została ukończona',running:'Odświeżanie w toku'}[issue]||'');
