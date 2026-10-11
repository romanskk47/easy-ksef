const test=require('node:test');
const assert=require('node:assert/strict');

test('independent KSeF success keeps its time and scope after a later PDF completion',async()=>{
 const {refreshEvidence,refreshScope}=await import('../ui/lib/ksef-refresh.mjs');
 const read={time:'2026-10-11T08:00:00Z',kind:'incremental',count:12};
 const state={ksefRefresh:{lastSuccess:read,lastAttempt:{...read,status:'success'}},lastRun:{time:'2026-10-11T08:05:00Z',kind:'history',count:12,truncated:false},history:{time:'2026-10-11T08:05:00Z'}};
 const result=refreshEvidence(state);
 assert.deepEqual(result.success,read);
 assert.equal(result.success.time,'2026-10-11T08:00:00Z');
 assert.equal(refreshScope(result.success),'Nowe faktury');
 assert.equal(result.issue,null);
});

for(const [status,label] of [
 ['failed','Ostatnia próba nie powiodła się'],
 ['cancelled','Ostatnia próba została przerwana'],
 ['incomplete','Ostatnia próba nie objęła całego zakresu'],
])test(`a ${status} attempt reports its outcome without replacing the last successful KSeF read`,async()=>{
 const {refreshEvidence,attemptLabel}=await import('../ui/lib/ksef-refresh.mjs');
 const success={time:'2026-10-10T08:00:00Z',kind:'history',count:200};
 const attempt={time:'2026-10-11T09:00:00Z',kind:'incremental',status};
 const result=refreshEvidence({ksefRefresh:{lastSuccess:success,lastAttempt:attempt}});
 assert.deepEqual(result,{success,attempt,issue:status});
 assert.equal(attemptLabel(result.issue),label);
 assert.deepEqual(refreshEvidence({ksefRefresh:{lastAttempt:attempt}}),{success:null,attempt,issue:status});
});

test('a saved running attempt is interrupted after restart, but remains running during the active operation',async()=>{
 const {refreshEvidence,attemptLabel}=await import('../ui/lib/ksef-refresh.mjs');
 const success={time:'2026-10-10T08:00:00Z',kind:'incremental'};
 const attempt={time:'2026-10-11T09:00:00Z',kind:'incremental',status:'running'};
 const state={ksefRefresh:{lastSuccess:success,lastAttempt:attempt}};
 assert.deepEqual(refreshEvidence(state,false),{success,attempt,issue:'interrupted'});
 assert.equal(attemptLabel(refreshEvidence(state,false).issue),'Ostatnia próba nie została ukończona');
 assert.deepEqual(refreshEvidence(state,true),{success,attempt,issue:'running'});
 assert.equal(attemptLabel(refreshEvidence(state,true).issue),'Odświeżanie w toku');
 // An old incomplete attempt cannot make a newer successful read look stale.
 const older={...attempt,time:'2026-10-09T09:00:00Z'};
 assert.equal(refreshEvidence({ksefRefresh:{lastSuccess:success,lastAttempt:older}}).issue,null);
});

test('a successful legacy check with no invoices still proves a KSeF read with its actual timestamp',async()=>{
 const {refreshEvidence,refreshScope}=await import('../ui/lib/ksef-refresh.mjs');
 const check={time:'2026-10-11T10:00:00Z',kind:'incremental',count:0,truncated:false};
 const result=refreshEvidence({lastRun:check,coverage:[{time:'not-a-date'}]});
 assert.deepEqual(result,{success:check,attempt:null,issue:null});
 assert.equal(refreshScope(result.success),'Nowe faktury');
 assert.deepEqual(refreshEvidence({lastRun:{...check,truncated:true}}),{success:null,attempt:null,issue:null});
 assert.deepEqual(refreshEvidence(),{success:null,attempt:null,issue:null});
});

test('legacy month and range checks retain issue-date scope instead of claiming a new-invoice refresh',async()=>{
 const {refreshEvidence,refreshScope}=await import('../ui/lib/ksef-refresh.mjs');
 for(const kind of ['monthly','range']){
  const check={time:'2026-10-11T10:00:00Z',kind,dateFrom:'2026-08-01',dateTo:'2026-08-31',count:0,truncated:false};
  const result=refreshEvidence({lastRun:check});
  assert.deepEqual(result.success,check);
  assert.equal(refreshScope(result.success),'Okres wystawienia: 01.08.2026–31.08.2026');
 }
 const coverage={from:'2026-09-01',to:'2026-09-30',time:'2026-10-11T11:00:00Z'};
 const evidence=refreshEvidence({coverage:[coverage],lastRun:{time:'2026-10-10T10:00:00Z',kind:'incremental',truncated:false}});
 assert.equal(evidence.success.time,coverage.time);
 assert.equal(refreshScope(evidence.success),'Okres wystawienia: 01.09.2026–30.09.2026');
 assert.equal(refreshScope({kind:'monthly'}),'Sprawdzony zakres faktur');
 assert.equal(refreshScope({kind:'history'}),'Cała dostępna historia');
});

test('purchase and sales inputs keep independent evidence and do not mutate their source state',async()=>{
 const {refreshEvidence,refreshScope}=await import('../ui/lib/ksef-refresh.mjs');
 const roleStatuses={
  purchase:{ksefRefresh:{lastSuccess:{time:'2026-10-11T08:00:00Z',kind:'incremental'},lastAttempt:{time:'2026-10-11T09:00:00Z',kind:'incremental',status:'failed'}}},
  sales:{lastRun:{time:'2026-10-10T15:00:00Z',kind:'monthly',dateFrom:'2026-09-01',dateTo:'2026-09-30',count:0,truncated:false}},
 };
 const before=structuredClone(roleStatuses);
 const purchase=refreshEvidence(roleStatuses.purchase),sales=refreshEvidence(roleStatuses.sales);
 assert.equal(purchase.success.time,'2026-10-11T08:00:00Z');
 assert.equal(purchase.issue,'failed');
 assert.equal(refreshScope(purchase.success),'Nowe faktury');
 assert.equal(sales.success.time,'2026-10-10T15:00:00Z');
 assert.equal(sales.issue,null);
 assert.equal(sales.attempt,null);
 assert.equal(refreshScope(sales.success),'Okres wystawienia: 01.09.2026–30.09.2026');
 assert.deepEqual(refreshEvidence(undefined),{success:null,attempt:null,issue:null});
 assert.deepEqual(refreshEvidence(roleStatuses.purchase),purchase);
 assert.deepEqual(roleStatuses,before);
});
