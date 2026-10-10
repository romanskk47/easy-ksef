const test=require('node:test');const assert=require('node:assert/strict');
test('empty months need an explicit full check, not merely another downloaded month',async()=>{
 const {periodCoverage}=await import('../ui/lib/sync-coverage.mjs');
 const august={kind:'month',month:'2026-08'};
 assert.equal(periodCoverage(august,[{from:'2026-09-01',to:'2026-09-30',time:'2026-10-08T10:00:00Z'}]).covered,false);
 assert.deepEqual(periodCoverage(august,[{from:'2026-08-01',to:'2026-08-31',time:'2026-10-08T10:00:00Z'}]),{covered:true,checkedAt:'2026-10-08T10:00:00Z'});
});
test('adjacent checks cover the range; gaps do not; freshness uses the oldest necessary check',async()=>{
 const {periodCoverage}=await import('../ui/lib/sync-coverage.mjs');const period={kind:'range',from:'2026-07-01',to:'2026-08-31'};
 const checks=[{from:'2026-07-01',to:'2026-07-31',time:'2026-10-01T10:00:00Z'},{from:'2026-08-01',to:'2026-08-31',time:'2026-10-08T10:00:00Z'}];
 assert.equal(periodCoverage(period,checks).checkedAt,checks[0].time);
 assert.equal(periodCoverage(period,[checks[0],{...checks[1],from:'2026-08-02'}]).covered,false);
 assert.equal(periodCoverage(period,[...checks,{from:'2026-07-01',to:'2026-08-31',time:'2026-10-09T10:00:00Z'}]).checkedAt,'2026-10-09T10:00:00Z');
});
test('month boundaries include leap days and unknown/all views never claim full KSeF coverage',async()=>{
 const {periodCoverage}=await import('../ui/lib/sync-coverage.mjs');const check={from:'2024-02-01',to:'2024-02-28',time:'2024-03-01T10:00:00Z'};
 assert.equal(periodCoverage({kind:'month',month:'2024-02'},[check]).covered,false);
 assert.equal(periodCoverage({kind:'month',month:'2024-02'},[{...check,to:'2024-02-29'}]).covered,true);
 assert.equal(periodCoverage({kind:'all'},[check]).covered,false);
 assert.equal(periodCoverage({kind:'range',from:'2026-02-31',to:'2026-03-02'},[check]).covered,false);
});
