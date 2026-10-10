const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const {Archive,hash}=require('../app/archive.cjs');
const nip='6808208874';const xml=Buffer.from('<fictional/>');const pdf=Buffer.from('%PDF-1.7\nfixture');const meta=id=>({id,number:'FV/1',date:'2026-10-08',seller:'Example',sellerNip:'5265877635',gross:123,currency:'PLN',hash:hash(xml)});
async function fixture(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'easy-ksef-test-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));return new Archive(root,nip).load();}
test('Different KSeF IDs with identical invoice number survive disk round-trip',async t=>{const a=await fixture(t);for(const id of ['ID-A','ID-B']){await a.saveXml(meta(id),xml);await a.savePdf(id,pdf);}const again=await new Archive(path.dirname(path.dirname(path.dirname(a.root))),nip).load();assert.equal(Object.keys(again.state.documents).length,2);assert.notEqual(again.state.documents['ID-A'].xml,again.state.documents['ID-B'].xml);assert.equal(await again.verified('ID-B'),true);});
test('Missing PDF does not advance continuation; retry can repair it',async t=>{const a=await fixture(t);await a.saveXml(meta('A'),xml);assert.equal((await a.finish(['A'],{kind:'incremental',continuation:'2026-10-08T00:00:00Z'})).complete,false);assert.equal(a.state.continuation,null);await a.savePdf('A',pdf);assert.equal((await a.finish(['A'],{kind:'incremental',continuation:'2026-10-08T00:00:00Z'})).complete,true);assert.equal(a.state.continuation,'2026-10-08T00:00:00Z');});
test('Missing expected document and later disk corruption are detected',async t=>{const a=await fixture(t);await a.saveXml(meta('A'),xml);await a.savePdf('A',pdf);assert.equal((await a.finish(['A','B'],{kind:'monthly'})).missing,1);await fs.writeFile(a.absolute(a.state.documents.A.xml),'corrupted');assert.equal(await a.verified('A'),false);});
test('Monthly export leaves previously saved continuation unchanged',async t=>{const a=await fixture(t);a.state.continuation='2026-09-01T00:00:00Z';await a.finish([],{kind:'monthly'});assert.equal(a.state.continuation,'2026-09-01T00:00:00Z');});
test('Hash conflict is rejected and original XML remains intact',async t=>{const a=await fixture(t);await a.saveXml(meta('A'),xml);const changed=Buffer.from('changed');await assert.rejects(()=>a.saveXml({...meta('A'),hash:hash(changed)},changed),/CONFLICTING_DOCUMENT/);assert.equal(hash(await fs.readFile(a.absolute(a.state.documents.A.xml))),hash(xml));});
test('Malicious names stay inside archive; record excludes credentials',async t=>{const a=await fixture(t);await a.saveXml({...meta('../../evil'),number:'../outside/filename',token:'FICTIONAL_SECRET'},xml);assert.ok(a.absolute(a.state.documents['../../evil'].xml).startsWith(a.root+path.sep));assert.throws(()=>a.absolute('../../escape'),/INVALID_ARCHIVE_PATH/);assert.ok(!(await fs.readFile(a.index,'utf8')).includes('FICTIONAL_SECRET'));});
test('Production and test with the same NIP use isolated archives and reject copied ledger',async t=>{
 const a=await fixture(t);await a.saveXml(meta('A'),xml);await a.savePdf('A',pdf);
 const base=path.dirname(path.dirname(path.dirname(a.root)));const prod=await new Archive(base,nip,'prod').load();
 assert.notEqual(prod.root,a.root);assert.equal(prod.list('2026-10').length,0);
 await fs.mkdir(prod.root,{recursive:true});await fs.copyFile(a.index,prod.index);
 await assert.rejects(()=>new Archive(base,nip,'prod').load(),/INVALID_ARCHIVE/);
});
test('Display/export status verifies files instead of trusting the ledger',async t=>{
 const a=await fixture(t);await a.saveXml(meta('A'),xml);await a.savePdf('A',pdf);
 assert.equal((await a.checkedList('2026-10'))[0].status,'ready');
 await fs.rm(a.absolute(a.state.documents.A.pdf));assert.equal((await a.checkedList('2026-10'))[0].status,'xml-only');
 await fs.writeFile(a.absolute(a.state.documents.A.xml),'broken');assert.equal((await a.checkedList('2026-10'))[0].status,'damaged');
});
