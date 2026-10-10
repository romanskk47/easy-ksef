'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');const {Archive,hash}=require('../app/archive.cjs');const exportsApi=require('../app/exports.cjs');
const nip='6808208874';
async function setup(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'easy-archive-links-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const base=path.join(root,'documents'),outside=path.join(root,'outside');await fs.mkdir(base);await fs.mkdir(outside);return {base,outside};}
const meta={id:'synthetic',number:'FV/1',date:'2026-09-01',seller:'Przykład',sellerNip:nip,currency:'PLN',gross:1,hash:hash(Buffer.from('<xml/>'))};
test('Preplanted environment, company and role symlinks/junctions cannot redirect the ledger',async t=>{
 for(const scope of ['Test',`Test/${nip}`,`Test/${nip}/Zakupy`]){const {base,outside}=await setup(t);const link=path.join(base,scope);await fs.mkdir(path.dirname(link),{recursive:true});await fs.symlink(outside,link,process.platform==='win32'?'junction':'dir');await assert.rejects(new Archive(base,nip).load(),/UNSAFE_DOCUMENTS_FOLDER/);assert.deepEqual(await fs.readdir(outside),[]);}
});
test('Month and export links are rejected without writing outside the selected company',async t=>{
 const {base,outside}=await setup(t);const a=await new Archive(base,nip).load();await fs.mkdir(a.root,{recursive:true});await fs.symlink(outside,path.join(a.root,'2026-09'),process.platform==='win32'?'junction':'dir');await assert.rejects(a.saveXml(meta,Buffer.from('<xml/>')),/UNSAFE_DOCUMENTS_FOLDER/);assert.deepEqual(await fs.readdir(outside),[]);
 await fs.unlink(path.join(a.root,'2026-09'));await a.saveXml(meta,Buffer.from('<xml/>'));await a.savePdf(meta.id,Buffer.from('%PDF-fixture'));
 await fs.symlink(outside,path.join(a.root,'Eksporty'),process.platform==='win32'?'junction':'dir');await assert.rejects(exportsApi.exportExcel(a,{query:{role:'purchase',period:{kind:'all'}}}),/UNSAFE_DOCUMENTS_FOLDER/);await assert.rejects(exportsApi.exportZip(a,{query:{role:'purchase',period:{kind:'all'}}}),/UNSAFE_DOCUMENTS_FOLDER/);assert.deepEqual(await fs.readdir(outside),[]);
});
