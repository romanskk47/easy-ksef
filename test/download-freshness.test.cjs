const test=require('node:test');const assert=require('node:assert/strict');
test('freshness does not call a truncated attempt a completed download',async()=>{
 const {downloadFreshness}=await import('../ui/lib/download-freshness.mjs');
 assert.deepEqual(downloadFreshness({lastRun:{time:'2026-10-09T10:00:00Z',truncated:true},history:{time:'2026-10-08T08:00:00Z'}}),{completedAt:'2026-10-08T08:00:00Z',incomplete:true});
 assert.deepEqual(downloadFreshness({lastRun:{time:'2026-10-09T10:00:00Z',truncated:true}}),{completedAt:null,incomplete:true});
});
test('freshness includes a successful zero-invoice check and keeps the newest valid completion',async()=>{
 const {downloadFreshness}=await import('../ui/lib/download-freshness.mjs');
 assert.deepEqual(downloadFreshness({lastRun:{time:'2026-10-09T10:00:00Z',count:0,truncated:false},history:{time:'2026-10-08T08:00:00Z'},coverage:[{time:'invalid'}]}),{completedAt:'2026-10-09T10:00:00Z',incomplete:false});
 assert.deepEqual(downloadFreshness({coverage:[{time:'2026-10-09T11:00:00Z'}]}),{completedAt:'2026-10-09T11:00:00Z',incomplete:false});
 assert.deepEqual(downloadFreshness(),{completedAt:null,incomplete:false});
});
