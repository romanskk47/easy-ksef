const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const {CompanyProfiles,profileId,checkedRegistry,configurationTarget}=require('../app/company-profiles.cjs');
const first={nip:'6808208874',name:'Firma A',environment:'test',bootstrapFrom:'2026-08-31T22:00:00Z',documentsPath:path.join(os.tmpdir(),'firma-a')};
const second={nip:'5265877635',name:'Firma B',environment:'prod',bootstrapFrom:'2026-06-30T22:00:00Z',documentsPath:path.join(os.tmpdir(),'firma-b')};
async function fixture(t){const directory=await fs.mkdtemp(path.join(os.tmpdir(),'easy-ksef-companies-'));t.after(()=>fs.rm(directory,{recursive:true,force:true}));return {directory,store:new CompanyProfiles(directory)};}
test('Legacy enrollment retains its settings without reading or enrolling other secret files',async t=>{
 const {directory,store}=await fixture(t);await fs.writeFile(path.join(directory,'profil.json'),JSON.stringify(first));await fs.writeFile(path.join(directory,'prod-5265877635.encrypted'),'unrelated-protected-data');
 const oldBytes=await fs.readFile(path.join(directory,'profil.json'));assert.deepEqual(await store.active(),first);assert.equal((await store.load()).profiles.length,1);
 await store.save(second);assert.deepEqual((await store.load()).profiles,[first,second]);assert.deepEqual(await fs.readFile(path.join(directory,'profil.json')),oldBytes);assert.equal(await fs.readFile(path.join(directory,'prod-5265877635.encrypted'),'utf8'),'unrelated-protected-data');
 const reopened=new CompanyProfiles(directory);assert.deepEqual(await reopened.active(),second);await reopened.select(profileId(first));assert.deepEqual(await reopened.active(),first);
});
test('Same NIP has independent test/production entries, paths and startup ranges',async t=>{
 const {store}=await fixture(t);const prod={...first,environment:'prod',name:'A produkcja',documentsPath:path.join(os.tmpdir(),'prod-a'),bootstrapFrom:second.bootstrapFrom};await store.save(first);await store.save(prod);assert.equal((await store.load()).profiles.length,2);await store.select(profileId(first));assert.deepEqual(await store.active(),first);await store.select(profileId(prod));assert.deepEqual(await store.active(),prod);
});
test('Updating an existing company preserves all other companies and reopens updated active entry',async t=>{
 const {store}=await fixture(t);await store.save(first);await store.save(second);const updated={...first,name:'Firma A nowa nazwa'};await store.save(updated);assert.deepEqual((await store.load()).profiles,[updated,second]);assert.deepEqual(await store.active(),updated);await assert.rejects(store.select('prod/0000000000'),/PROFILE_NOT_FOUND/);assert.deepEqual(await store.active(),updated);
});
test('Duplicate add and editing another active identity are rejected before credentials change',()=>{
 const registry={version:1,activeId:profileId(first),profiles:[first,second]};assert.throws(()=>configurationTarget(registry,{...first,mode:'add'}),/PROFILE_EXISTS/);assert.throws(()=>configurationTarget(registry,{...second,mode:'update',expectedProfileId:profileId(second)}),/PROFILE_CHANGED/);assert.throws(()=>configurationTarget(registry,{...first,mode:'update',expectedProfileId:profileId(second)}),/PROFILE_CHANGED/);assert.deepEqual(configurationTarget(registry,{...first,mode:'update',expectedProfileId:profileId(first)}),first);
});
test('Registry corruption fails closed rather than silently losing enrolled companies',async t=>{
 const {directory,store}=await fixture(t);await fs.writeFile(path.join(directory,'profil.json'),JSON.stringify(first));await fs.writeFile(path.join(directory,'firmy.json'),'{broken');await assert.rejects(store.load(),SyntaxError);assert.throws(()=>checkedRegistry({version:1,activeId:profileId(first),profiles:[first,first]}),/INVALID_PROFILES/);assert.throws(()=>checkedRegistry({version:1,activeId:profileId(second),profiles:[first]}),/INVALID_PROFILES/);
});
