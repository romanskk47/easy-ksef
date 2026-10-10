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
 const {operationStatus}=await import('../ui/lib/workflow.mjs');const operation={kind:'download',label:'Pobieranie'};
 assert.equal(operationStatus(operation,{stage:'preparing',count:0,total:0}).value,null);
 assert.equal(operationStatus(operation,{stage:'saving',count:3,total:12}).value,25);
 assert.equal(operationStatus(operation,{stage:'saving',count:12}).value,null);
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
