export function countLabel(count,forms=['faktura','faktury','faktur']){
 const value=Math.abs(Number(count)||0),last=value%10,lastTwo=value%100;
 return `${count} ${value===1?forms[0]:last>=2&&last<=4&&(lastTwo<12||lastTwo>14)?forms[1]:forms[2]}`;
}
export function operationStatus(operation,progress){
 if(!operation)return null;
 // Export cannot inherit cancellation or counters from a preceding connection.
 if(!['download','connect'].includes(operation.kind))return {label:operation.label,cancellable:false,value:null};
 const stage=progress?.stage;
 const labels={connecting:'Łączenie z KSeF',authenticating:'Sprawdzanie dostępu',permissions:'Sprawdzanie uprawnień firmy',preparing:'KSeF przygotowuje dane faktur',found:'Odczytywanie faktur z KSeF',receiving:'Dodawanie faktur do aplikacji','ksef-refreshed':'Dane z KSeF odświeżone','preparing-pdfs':'Przygotowywanie PDF-ów',saving:'Zapisywanie plików',waiting:'KSeF ograniczył odczyt — czekamy na kolejną próbę',partitioning:'Sprawdzanie dużego okresu w mniejszych częściach',fetching:'Odbieranie danych z KSeF','pdf-failed':'Nie udało się przygotować jednego PDF-a — kontynuujemy'};
 const total=progress?.total,count=progress?.count;
 const known=['receiving','preparing-pdfs','saving'].includes(stage)&&Number.isInteger(total)&&total>0&&Number.isInteger(count)&&count>=0;
 const countText=known?`${Math.min(count,total)} z ${total}`:null;
 const label=known?(stage==='receiving'?`Odczytano dane ${countText} faktur`:stage==='preparing-pdfs'?`PDF-y: sprawdzono ${countText} faktur`:`Zapisano ${countText} plików`):labels[stage]||operation.label;
 return {label:(progress?.role==='sales'?'Sprzedażowe · ':progress?.role==='purchase'?'Zakupowe · ':'')+label,cancellable:operation.kind==='download'||operation.kind==='connect'&&['connecting','authenticating','permissions'].includes(stage),value:known?Math.min(100,Math.round(count/total*100)):null};
}

export function downloadProgressHint(progress,cancelling=false){
 const files=['ksef-refreshed','preparing-pdfs','pdf-failed'].includes(progress?.stage);
 const role=progress?.role==='purchase'?'zakupowych':progress?.role==='sales'?'sprzedażowych':null;
 const list=role?`Lista faktur ${role}`:'Lista faktur w tym zakresie';
 if(files&&progress?.ksefRefreshed===true)return cancelling?`${list} pozostaje odświeżona. Poczekaj na zakończenie bieżącego zapisu plików.`:`${list} jest już odświeżona. Teraz przygotowujemy pliki na komputerze.`;
 if(cancelling)return 'Poczekaj na zakończenie bieżącego zapisu. Faktury już dodane i gotowe pliki pozostają na komputerze.';
 if(files&&progress?.ksefRefreshed===false)return 'Przygotowujemy pliki z odebranych danych. Nie potwierdzono jeszcze całego zakresu w KSeF.';
 if(files)return 'Przygotowujemy pliki do faktur zapisanych w aplikacji.';
 if(progress?.stage==='waiting')return 'Program ponowi próbę sam. Nie musisz klikać ponownie.';
 return 'Możesz przeglądać faktury już w aplikacji. Pozostaw program otwarty.';
}

// Only count down a delay actually reported by KSeF; never invent an ETA.
export function remainingWait(progress,now=Date.now()){
 if(progress?.stage!=='waiting'||typeof progress.retryAfterSeconds!=='number'||!Number.isFinite(progress.retryAfterSeconds)||progress.retryAfterSeconds<0||typeof progress.receivedAt!=='number'||!Number.isFinite(progress.receivedAt))return null;
 return Math.max(0,Math.ceil(progress.retryAfterSeconds-(now-progress.receivedAt)/1000));
}
