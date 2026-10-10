const test=require('node:test');const assert=require('node:assert/strict');
const {environment,checkedProfile,warsawMonthStart,previousWarsawMonthStart}=require('../app/profile.cjs');
test('Month starts use Polish summer/winter time including UTC month edges',()=>{
 assert.equal(warsawMonthStart('2026-09'),'2026-08-31T22:00:00.000Z');
 assert.equal(warsawMonthStart('2026-01'),'2025-12-31T23:00:00.000Z');
 assert.equal(previousWarsawMonthStart(new Date('2026-09-30T22:30:00Z')),'2026-08-31T22:00:00.000Z');
 assert.equal(previousWarsawMonthStart(new Date('2026-01-31T23:30:00Z')),'2025-12-31T23:00:00.000Z');
});
test('Profile and fixed environment scope reject unknown servers and invalid identity',()=>{
 assert.throws(()=>environment('https://example.com'),/INVALID_ENVIRONMENT/);
 assert.throws(()=>checkedProfile({nip:'6808208874',name:'Example',environment:'demo',bootstrapFrom:'2026-09-01T00:00:00Z'}),/INVALID_ENVIRONMENT/);
 assert.throws(()=>checkedProfile({nip:'0000000001',name:'Example',environment:'prod',bootstrapFrom:'2026-09-01T00:00:00Z'}),/INVALID_PROFILE/);
});
