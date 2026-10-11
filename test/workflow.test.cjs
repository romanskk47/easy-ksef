const test=require('node:test');const assert=require('node:assert/strict');
test('export does not inherit connection cancellation or download counters',async()=>{
 const {operationStatus}=await import('../ui/lib/workflow.mjs');
 const prior={stage:'authenticating',count:63,total:63};
 assert.deepEqual(operationStatus({kind:'export',label:'Przygotowywanie Excela'},prior),{label:'Przygotowywanie Excela',cancellable:false,value:null});
 assert.equal(operationStatus(null,prior),null);
 assert.equal(operationStatus({kind:'download',label:'Pobieranie'},prior).cancellable,true);
 assert.equal(operationStatus({kind:'connect',label:'Połączenie'},prior).cancellable,true);
});
test('document progress uses known counters and never invents completion',async()=>{
 const {operationStatus}=await import('../ui/lib/workflow.mjs');const operation={kind:'download',label:'Odświeżanie'};
 assert.equal(operationStatus(operation,{stage:'preparing',count:0,total:0}).value,null);
 assert.equal(operationStatus(operation,{stage:'saving',count:3,total:12}).value,25);
 assert.equal(operationStatus(operation,{stage:'saving',count:12}).value,null);
 for(const stage of ['receiving','preparing-pdfs']){
  assert.equal(operationStatus(operation,{stage,count:0,total:12}).value,0);
  assert.equal(operationStatus(operation,{stage,count:3,total:12}).value,25);
  assert.equal(operationStatus(operation,{stage,count:15,total:12}).value,100);
  for(const counters of [{count:0,total:0},{count:null,total:12},{count:-1,total:12},{count:3,total:Infinity},{count:'3',total:12},{count:0.5,total:12},{count:3}])assert.equal(operationStatus(operation,{stage,...counters}).value,null);
 }
 for(const stage of ['found','ksef-refreshed','pdf-failed'])assert.equal(operationStatus(operation,{stage,count:12,total:12}).value,null);
});
test('KSeF list progress and local PDF work have different labels and role scopes',async()=>{
 const {operationStatus}=await import('../ui/lib/workflow.mjs');const operation={kind:'download',label:'Odświeżanie'};
 assert.equal(operationStatus(operation,{stage:'receiving',role:'purchase',count:3,total:12}).label,'Zakupowe · Odczytano dane 3 z 12 faktur');
 assert.equal(operationStatus(operation,{stage:'ksef-refreshed',role:'purchase'}).label,'Zakupowe · Dane z KSeF odświeżone');
 assert.equal(operationStatus(operation,{stage:'preparing-pdfs',role:'sales',count:3,total:12}).label,'Sprzedażowe · PDF-y: sprawdzono 3 z 12 faktur');
 assert.match(operationStatus(operation,{stage:'pdf-failed'}).label,/jednego PDF-a/);
 assert.doesNotMatch(operationStatus(operation,{stage:'found'}).label,/PDF/);
});
test('PDF success and cancellation hints require explicit successful KSeF evidence',async()=>{
 const {downloadProgressHint}=await import('../ui/lib/workflow.mjs');
 for(const stage of ['ksef-refreshed','preparing-pdfs','pdf-failed']){
  const confirmed={stage,role:'purchase',ksefRefreshed:true};
  assert.match(downloadProgressHint(confirmed),/Lista faktur zakupowych jest już odświeżona/);
  assert.match(downloadProgressHint(confirmed,true),/Lista faktur zakupowych pozostaje odświeżona/);
  assert.match(downloadProgressHint({...confirmed,role:'sales'}),/Lista faktur sprzedażowych jest już odświeżona/);
  for(const ksefRefreshed of [false,undefined]){
   assert.doesNotMatch(downloadProgressHint({...confirmed,ksefRefreshed}),/jest już odświeżona/);
   assert.doesNotMatch(downloadProgressHint({...confirmed,ksefRefreshed},true),/pozostaje odświeżona/);
  }
 }
 assert.match(downloadProgressHint({stage:'preparing-pdfs',ksefRefreshed:false}),/Nie potwierdzono jeszcze całego zakresu/);
 assert.match(downloadProgressHint({stage:'receiving'},true),/Faktury już dodane i gotowe pliki pozostają/);
 assert.match(downloadProgressHint({stage:'waiting'}),/Program ponowi próbę sam/);
});
test('Polish invoice and document counts cover singular and teen exceptions',async()=>{
 const {countLabel}=await import('../ui/lib/workflow.mjs');
 assert.equal(countLabel(1),'1 faktura');assert.equal(countLabel(2),'2 faktury');assert.equal(countLabel(12),'12 faktur');assert.equal(countLabel(22),'22 faktury');
 assert.equal(countLabel(1,['dokument','dokumenty','dokumentów']),'1 dokument');
});
test('rate-limit countdown uses only a reported delay, resets with a new event and never goes negative',async()=>{
 const {remainingWait}=await import('../ui/lib/workflow.mjs');
 const p={stage:'waiting',retryAfterSeconds:30,receivedAt:10000};
 assert.equal(remainingWait(p,10500),30);
 assert.equal(remainingWait(p,30000),10);
 assert.equal(remainingWait(p,45000),0);
 assert.equal(remainingWait({...p,receivedAt:45000},45000),30);
 for(const invalid of [{stage:'waiting'},{...p,stage:'saving'},{...p,retryAfterSeconds:Infinity},{...p,retryAfterSeconds:-1},{...p,receivedAt:undefined}])assert.equal(remainingWait(invalid,45000),null);
});
