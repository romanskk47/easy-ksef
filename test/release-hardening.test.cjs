'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {requireSecureStorage}=require('../app/secure-storage.cjs');const {createPdfRenderer}=require('../app/pdf-renderer.cjs');
test('Linux never accepts plaintext or unknown credential storage; secure desktops work',()=>{
 for(const backend of ['basic_text','unknown',undefined,'future_unverified_backend'])assert.throws(()=>requireSecureStorage({isEncryptionAvailable:()=>true,getSelectedStorageBackend:()=>backend},'linux'),/STORAGE_UNAVAILABLE/);
 for(const backend of ['gnome_libsecret','kwallet','kwallet5','kwallet6'])assert.doesNotThrow(()=>requireSecureStorage({isEncryptionAvailable:()=>true,getSelectedStorageBackend:()=>backend},'linux'));
 for(const platform of ['darwin','win32','linux'])assert.throws(()=>requireSecureStorage({isEncryptionAvailable:()=>false},platform),/STORAGE_UNAVAILABLE/);
 for(const platform of ['darwin','win32'])assert.doesNotThrow(()=>requireSecureStorage({isEncryptionAvailable:()=>true},platform));
});
test('A stalled PDF renderer is destroyed, releases the caller and recovers on next attempt',async()=>{
 let created=0,destroyed=0;
 const render=createPdfRenderer({file:'fixture.html',timeoutMs:30,createWindow:()=>{const first=created++===0;let dead=false;return {isDestroyed:()=>dead,destroy:()=>{dead=true;destroyed++;},loadFile:async()=>{},webContents:{setWindowOpenHandler:()=>{},on:()=>{},executeJavaScript:()=>first?new Promise(()=>{}):Promise.resolve(Buffer.from('%PDF-fixture').toString('base64'))}};}});
 await assert.rejects(render(Buffer.from('<xml/>'),'SYNTHETIC',{}),/PDF_TIMEOUT/);assert.equal(destroyed,1);
 assert.equal((await render(Buffer.from('<xml/>'),'SYNTHETIC',{})).toString(),'%PDF-fixture');assert.equal(created,2);render.dispose();assert.equal(destroyed,2);
});
test('PDF page load failure and converter rejection destroy the renderer without leaving timers',async()=>{
 for(const stage of ['load','render']){let destroyed=false;const render=createPdfRenderer({file:'fixture.html',timeoutMs:100,createWindow:()=>({isDestroyed:()=>destroyed,destroy:()=>{destroyed=true;},loadFile:async()=>{if(stage==='load')throw Error('LOAD_FAILED');},webContents:{setWindowOpenHandler:()=>{},on:()=>{},executeJavaScript:async()=>{throw Error('RENDER_FAILED');}}})});await assert.rejects(render(Buffer.from('x'),'test',{}),/FAILED/);assert.equal(destroyed,true);}
});
test('Disk-full write preserves the previous file and removes the private temporary file',async t=>{
 const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');const realRequire=require('node:module').createRequire(require.resolve('../app/archive.cjs'));
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'easy-disk-full-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const target=path.join(dir,'archiwum.json');await fs.writeFile(target,'previous-complete-index');
 const mockedFs={...fs,open:async(...args)=>{const handle=await fs.open(...args);return {writeFile:async()=>{await handle.writeFile('partial');throw Object.assign(Error('No space'),{code:'ENOSPC'});},sync:()=>handle.sync(),close:()=>handle.close()};}};
 const context=vm.createContext({require:name=>name==='node:fs/promises'?mockedFs:realRequire(name),module:{exports:{}},Buffer});vm.runInContext(await fs.readFile(require.resolve('../app/archive.cjs'),'utf8'),context);
 await assert.rejects(context.module.exports.atomicWrite(target,Buffer.from('new-index')),{code:'ENOSPC'});assert.equal(await fs.readFile(target,'utf8'),'previous-complete-index');assert.deepEqual(await fs.readdir(dir),['archiwum.json']);
});
