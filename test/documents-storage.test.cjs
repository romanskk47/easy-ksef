const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');
const {prepareDocumentsFolder,copyScopedArchive}=require('../app/documents-storage.cjs');
const {checkedProfile}=require('../app/profile.cjs');
const nip='6808208874';
async function fixture(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'easy-ksef-folder-test-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const source=path.join(root,'source'),destination=path.join(root,'destination');await fs.mkdir(source);return {root,source,destination};}
async function put(base,relative,value){const file=path.join(base,relative);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,value);return file;}
const request=f=>({sourceBase:f.source,destinationBase:f.destination,nip,environment:'test'});
test('Folder migration copies purchases and sales for one scope, retains originals and excludes other entities/environments',async t=>{
 const f=await fixture(t);const purchase=await put(f.source,`Test/${nip}/Zakupy/2026-09/a.xml`,'<invoice/>');
 const sales=await put(f.source,`Test/${nip}/Sprzedaż/archiwum.json`,'{"scope":"test"}');
 await put(f.source,`Produkcja/${nip}/Zakupy/private.xml`,'production');await put(f.source,'Test/5265877635/Zakupy/private.xml','other-entity');await put(f.source,'token.encrypted','not-an-archive');
 const result=await copyScopedArchive(request(f));assert.equal(result.copiedFiles,2);assert.equal(result.path,await fs.realpath(f.destination));
 assert.equal(await fs.readFile(purchase,'utf8'),'<invoice/>');assert.equal(await fs.readFile(sales,'utf8'),'{"scope":"test"}');
 assert.equal(await fs.readFile(path.join(f.destination,`Test/${nip}/Zakupy/2026-09/a.xml`),'utf8'),'<invoice/>');
 assert.deepEqual(await fs.readdir(f.destination),['Test']);assert.deepEqual(await fs.readdir(path.join(f.destination,'Test')),[nip]);
 assert.equal((await copyScopedArchive(request(f))).copiedFiles,0);
});
test('Conflicting existing document rejects before any new document is copied',async t=>{
 const f=await fixture(t);await put(f.source,`Test/${nip}/Zakupy/a.xml`,'new');await put(f.source,`Test/${nip}/Zakupy/z.xml`,'original');
 const existing=await put(f.destination,`Test/${nip}/Zakupy/z.xml`,'different');
 await assert.rejects(copyScopedArchive(request(f)),/DOCUMENTS_FOLDER_CONFLICT/);
 assert.equal(await fs.readFile(existing,'utf8'),'different');assert.deepEqual(await fs.readdir(path.dirname(existing)),['z.xml']);
 assert.equal(await fs.readFile(path.join(f.source,`Test/${nip}/Zakupy/a.xml`),'utf8'),'new');
});
test('Nested destinations and symlinks inside either scoped archive are rejected',async t=>{
 const f=await fixture(t);await put(f.source,`Test/${nip}/Zakupy/a.xml`,'original');
 await assert.rejects(copyScopedArchive({...request(f),destinationBase:path.join(f.source,'nested')}),/NESTED_DOCUMENTS_FOLDER/);
 const outside=path.join(f.root,'outside');await fs.mkdir(outside);await fs.mkdir(f.destination);await fs.symlink(outside,path.join(f.destination,'Test'),'dir');
 await assert.rejects(copyScopedArchive(request(f)),/UNSAFE_DOCUMENTS_FOLDER/);assert.deepEqual(await fs.readdir(outside),[]);
 await fs.rm(f.destination,{recursive:true});await fs.symlink(outside,path.join(f.source,`Test/${nip}/Zakupy/link`),'dir');
 await assert.rejects(copyScopedArchive(request(f)),/UNSAFE_DOCUMENTS_FOLDER/);
});
test('Destination picker preparation verifies a writable canonical directory and cleans probe files',async t=>{
 const f=await fixture(t);assert.equal(await prepareDocumentsFolder(f.destination),await fs.realpath(f.destination));assert.deepEqual(await fs.readdir(f.destination),[]);
 await assert.rejects(prepareDocumentsFolder('relative/folder'),/INVALID_DOCUMENTS_PATH/);
 const file=await put(f.root,'not-a-directory','x');await assert.rejects(prepareDocumentsFolder(file),/DOCUMENTS_FOLDER_UNAVAILABLE/);
});
test('Legacy profiles keep default destination; chosen paths survive validated reload',()=>{
 const p={nip,name:'Firma przykładowa',environment:'test',bootstrapFrom:'2026-09-01T00:00:00Z'};
 assert.equal(checkedProfile(p).documentsPath,undefined);assert.equal(checkedProfile({...p,documentsPath:path.resolve('/tmp/invoices')}).documentsPath,path.resolve('/tmp/invoices'));
 assert.throws(()=>checkedProfile({...p,documentsPath:'relative'}),/INVALID_DOCUMENTS_PATH/);
});
