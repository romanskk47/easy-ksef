export function countLabel(count,forms=['faktura','faktury','faktur']){
 const value=Math.abs(Number(count)||0),last=value%10,lastTwo=value%100;
 return `${count} ${value===1?forms[0]:last>=2&&last<=4&&(lastTwo<12||lastTwo>14)?forms[1]:forms[2]}`;
}
export function operationStatus(operation,progress){
 if(!operation)return null;
 // Export cannot inherit cancellation or counters from a preceding connection.
 if(!['download','connect'].includes(operation.kind))return {label:operation.label,cancellable:false,value:null};
 const stage=progress?.stage;
 const labels={connecting:'Łączenie z KSeF',authenticating:'Sprawdzanie dostępu',permissions:'Sprawdzanie uprawnień firmy',preparing:'KSeF przygotowuje dokumenty',found:'Przygotowywanie PDF',saving:'Zapisywanie dokumentów',waiting:'KSeF ograniczył pobieranie — kontynuujemy po przerwie',partitioning:'Dzielenie dużego okresu na mniejsze części',fetching:'Pobieranie dokumentów z KSeF','pdf-failed':'Kontynuowanie pobierania — jeden PDF wymaga ponowienia'};
 const total=Number(progress?.total),count=Number(progress?.count);
 const known=stage==='saving'&&Number.isFinite(total)&&total>0&&Number.isFinite(count)&&count>=0;
 return {label:(progress?.role==='sales'?'Sprzedażowe · ':progress?.role==='purchase'?'Zakupowe · ':'')+(known?`Zapisano ${Math.min(count,total)} z ${total} dokumentów`:labels[stage]||operation.label),cancellable:operation.kind==='download'||operation.kind==='connect'&&['connecting','authenticating','permissions'].includes(stage),value:known?Math.min(100,Math.round(count/total*100)):null};
}

// Only count down a delay actually reported by KSeF; never invent an ETA.
export function remainingWait(progress,now=Date.now()){
 if(progress?.stage!=='waiting'||typeof progress.retryAfterSeconds!=='number'||!Number.isFinite(progress.retryAfterSeconds)||progress.retryAfterSeconds<0||typeof progress.receivedAt!=='number'||!Number.isFinite(progress.receivedAt))return null;
 return Math.max(0,Math.ceil(progress.retryAfterSeconds-(now-progress.receivedAt)/1000));
}
