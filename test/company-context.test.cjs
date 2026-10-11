'use strict';
// Runs the real main-process IPC handlers with synthetic profiles and an offline
// helper. No Electron window, network call, OS keychain or real credential exists.
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const vm=require('node:vm');const {createRequire}=require('node:module');const {pathToFileURL}=require('node:url');
const mainFile=path.resolve(__dirname,'../app/main.cjs'),appDirectory=path.dirname(mainFile),realRequire=createRequire(mainFile);
const {CompanyProfiles,profileId}=realRequire('./company-profiles.cjs');
const {COLUMN_IDS}=realRequire('./browse.cjs');
const NIP_A='6808208874',NIP_B='5265877635';
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
async function harness(t,{two=true}={}){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'easy-company-context-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));const userData=path.join(root,'settings'),documents=path.join(root,'documents');await fs.mkdir(userData,{recursive:true});await fs.mkdir(documents,{recursive:true});
 const profile=nip=>({nip,name:nip===NIP_A?'Fikcyjna firma A':'Fikcyjna firma B',environment:'test',bootstrapFrom:'2026-09-01T00:00:00.000Z',documentsPath:documents});
 const profiles=new CompanyProfiles(userData),a=profile(NIP_A),b=profile(NIP_B);await profiles.save(a);if(two)await profiles.save(b);await profiles.select(profileId(a));
 const tokenFile=nip=>path.join(userData,`test-${nip}.encrypted`);const oldToken=Buffer.from('MOCK_ENCRYPTED:synthetic-original-access');await fs.writeFile(tokenFile(NIP_A),oldToken);
 const controls={renderPdf:async()=>Buffer.from('%PDF-1.7\nsynthetic'),probe:async()=>({type:'connected'}),exportExcel:async()=>({count:1,filename:'synthetic.xlsx'}),download:async(input,listener)=>{await listener({type:'manifest',invoices:[]});return {type:'done',continuation:'2026-10-10T12:00:00Z',truncated:false};},progress:[],failRegistrySave:false,calls:{bridge:0,exports:0,pdf:0,renderPdf:0,encrypt:0}};
 class InjectableProfiles extends CompanyProfiles{async save(value){if(controls.failRegistrySave)throw new Error('SIMULATED_REGISTRY_WRITE_FAILURE');return super.save(value);}}
 const handles=new Map();const mainFrame={url:pathToFileURL(path.join(appDirectory,'index.html')).href};const webContents={mainFrame,send:(channel,message)=>{if(channel==='progress')controls.progress.push(message);}};const window={webContents,isDestroyed:()=>false};
 const electron={
  app:{setName:()=>{},setPath:()=>{},getPath:name=>name==='userData'?userData:documents,isPackaged:false,requestSingleInstanceLock:()=>false,quit:()=>{},on:()=>{}},
  BrowserWindow:class{constructor(){controls.calls.pdf++;this.webContents={setWindowOpenHandler:()=>{},on:()=>{}};}async loadURL(){}setTitle(){}},
  ipcMain:{handle:(name,handler)=>handles.set(name,handler)},
  safeStorage:{isEncryptionAvailable:()=>true,getSelectedStorageBackend:()=>'gnome_libsecret',encryptString:value=>{controls.calls.encrypt++;return Buffer.from('MOCK_ENCRYPTED:'+value);},decryptString:bytes=>bytes.toString().replace('MOCK_ENCRYPTED:','')},
  shell:{openPath:async()=>'',openExternal:async()=>{}},Menu:{},dialog:{},screen:{}
 };
 const mockExports={...realRequire('./exports.cjs'),exportExcel:async(...args)=>{controls.calls.exports++;return controls.exportExcel(...args);},exportZip:async()=>{controls.calls.exports++;return {count:1,filename:'synthetic.zip'};}};
 function requireForTest(name){if(name==='electron')return electron;if(name==='./pdf-renderer.cjs')return {createPdfRenderer:()=>{const render=async(...args)=>{controls.calls.renderPdf++;return controls.renderPdf(...args);};render.dispose=()=>{};return render;}};if(name==='./company-profiles.cjs')return {...realRequire(name),CompanyProfiles:InjectableProfiles};if(name==='./bridge-runner.cjs')return {createBridgeRunner:()=>async(input,listener)=>{controls.calls.bridge++;if(input.op==='download')return controls.download(input,listener);assert.equal(input.op,'probe','Only offline fixture operations allowed');return controls.probe(input);}};if(name==='./exports.cjs')return mockExports;return realRequire(name);}
 const context=vm.createContext({require:requireForTest,__dirname:appDirectory,__filename:mainFile,Buffer,AbortController,setTimeout,clearTimeout,process:{argv:['node','offline-context-test'],platform:process.platform,env:{}},console:{log:()=>{},error:()=>{}},module:{exports:{}}});
 const source=await fs.readFile(mainFile,'utf8');vm.runInContext(source+'\n globalThis.__testAccess={register,setWindow:value=>{win=value;},safeErrors};',context,{filename:mainFile});context.__testAccess.setWindow(window);context.__testAccess.register();
 async function invoke(name,args=[],scope){assert.ok(handles.has(name),`Expected real IPC handler ${name}`);return handles.get(name)({sender:webContents,senderFrame:mainFrame},...args,...(scope!==undefined?[{__profileId:scope}]:[]));}
 return {root,userData,documents,profiles,a,b,aId:profileId(a),bId:profileId(b),tokenFile,oldToken,controls,invoke,errors:context.__testAccess.safeErrors,handles,webContents,mainFrame};
}
function update(h){return {nip:NIP_A,name:'Fikcyjna firma A po zmianie',environment:'test',token:'MOCK_ONLY_new_access',documentsPath:h.documents,mode:'update',expectedProfileId:h.aId};}

test('Stale company context rejects Excel/ZIP/PDF/view changes before any effect',async t=>{
 const h=await harness(t);assert.equal((await h.invoke('selectCompany',[{id:h.bId,expectedActiveId:h.aId}])).ok,true);
 const registryBefore=await fs.readFile(h.profiles.file);const query={role:'purchase',period:{kind:'all'}};
 for(const [name,args] of [['exportExcel',[{query}]],['exportZip',[{query}]],['exportPdfZip',[{query}]],['pdf',[{role:'purchase',id:'OLD-COMPANY-INVOICE'}]],['saveView',[{role:'purchase',view:{columns:[...COLUMN_IDS],hidden:['id'],pageSize:50}}]]]){
  const result=await h.invoke(name,args,h.aId);assert.equal(result.ok,false,name);assert.equal(result.error,h.errors.PROFILE_CHANGED,name);
 }
 assert.equal(h.controls.calls.exports,0);assert.equal(h.controls.calls.pdf,0);assert.equal(h.controls.calls.bridge,0);assert.deepEqual(await fs.readFile(h.profiles.file),registryBefore);
 const files=await fs.readdir(h.userData);assert.ok(!files.some(name=>name.startsWith('view-')));assert.equal((await h.profiles.load()).activeId,h.bId);
});

test('Company selection is BUSY during a probe and does not change active company',async t=>{
 const h=await harness(t),entered=deferred(),release=deferred();h.controls.probe=async()=>{entered.resolve();await release.promise;return {type:'connected'};};
 const configuring=h.invoke('configure',[update(h)]);await entered.promise;
 try{const result=await h.invoke('selectCompany',[{id:h.bId,expectedActiveId:h.aId}]);assert.equal(result.ok,false);assert.equal(result.error,h.errors.BUSY);assert.equal((await h.profiles.load()).activeId,h.aId);}finally{release.resolve();}
 assert.equal((await configuring).ok,true);assert.equal((await h.profiles.load()).activeId,h.aId);
});

test('Company selection is BUSY during export and resumes after the operation finishes',async t=>{
 const h=await harness(t),entered=deferred(),release=deferred();h.controls.exportExcel=async archive=>{assert.equal(archive.nip,NIP_A);entered.resolve();await release.promise;return {count:1,filename:'synthetic.xlsx'};};
 const exporting=h.invoke('exportExcel',[{query:{role:'purchase',period:{kind:'all'}}}],h.aId);await entered.promise;
 try{const result=await h.invoke('selectCompany',[{id:h.bId,expectedActiveId:h.aId}]);assert.equal(result.ok,false);assert.equal(result.error,h.errors.BUSY);assert.equal((await h.profiles.load()).activeId,h.aId);}finally{release.resolve();}
 assert.equal((await exporting).ok,true);assert.equal((await h.invoke('selectCompany',[{id:h.bId,expectedActiveId:h.aId}])).ok,true);assert.equal((await h.profiles.load()).activeId,h.bId);
});

test('A failed access probe leaves both existing and newly added profiles/tokens unchanged',async t=>{
 const h=await harness(t,{two:false}),registryBefore=await fs.readFile(h.profiles.file);h.controls.probe=async()=>{throw new Error('KSEF_HTTP_403');};
 for(const request of [update(h),{nip:NIP_B,name:'Fikcyjna firma B',environment:'test',token:'MOCK_ONLY_other_access',documentsPath:h.documents,mode:'add'}]){
  const result=await h.invoke('configure',[request]);assert.equal(result.ok,false);assert.equal(result.error,h.errors.KSEF_HTTP_403);assert.deepEqual(await fs.readFile(h.profiles.file),registryBefore);assert.deepEqual(await fs.readFile(h.tokenFile(NIP_A)),h.oldToken);await assert.rejects(()=>fs.access(h.tokenFile(NIP_B)),{code:'ENOENT'});
 }
 assert.equal(h.controls.calls.bridge,2);assert.equal(h.controls.calls.encrypt,0);assert.equal((await h.profiles.load()).activeId,h.aId);
});

test('Registry write failure restores an existing encrypted token and removes an uncommitted new token',async t=>{
 const h=await harness(t,{two:false}),registryBefore=await fs.readFile(h.profiles.file);h.controls.failRegistrySave=true;
 const result=await h.invoke('configure',[update(h)]);assert.equal(result.ok,false);assert.deepEqual(await fs.readFile(h.tokenFile(NIP_A)),h.oldToken);assert.deepEqual(await fs.readFile(h.profiles.file),registryBefore);
 const add=await h.invoke('configure',[{nip:NIP_B,name:'Fikcyjna firma B',environment:'test',token:'MOCK_ONLY_other_access',documentsPath:h.documents,mode:'add'}]);assert.equal(add.ok,false);await assert.rejects(()=>fs.access(h.tokenFile(NIP_B)),{code:'ENOENT'});assert.deepEqual(await fs.readFile(h.profiles.file),registryBefore);assert.equal(h.controls.calls.encrypt,2);assert.equal((await h.profiles.load()).activeId,h.aId);
});

test('The actual IPC entry guard rejects another sender and a foreign frame',async t=>{
 const h=await harness(t),handler=h.handles.get('status');await assert.rejects(()=>handler({sender:{},senderFrame:h.mainFrame}),/INVALID_SENDER/);await assert.rejects(()=>handler({sender:h.webContents,senderFrame:{url:h.mainFrame.url}}),/INVALID_SENDER/);assert.equal((await h.invoke('status')).ok,true);
});

test('Updating with an empty token probes the active company own saved access and preserves all other companies/environments',async t=>{
 const h=await harness(t);
 const other={...h.b,bootstrapFrom:'2025-03-31T22:00:00.000Z',documentsPath:path.join(h.root,'other-company-documents')};
 const otherEnvironment={...h.a,environment:'prod',name:'Fikcyjna firma A w innym środowisku',bootstrapFrom:'2024-12-31T23:00:00.000Z',documentsPath:path.join(h.root,'production-documents')};
 await h.profiles.save(other);await h.profiles.save(otherEnvironment);await h.profiles.select(h.aId);
 const otherToken=Buffer.from('MOCK_ENCRYPTED:synthetic-company-B-access'),prodToken=Buffer.from('MOCK_ENCRYPTED:synthetic-production-A-access');
 const prodTokenFile=path.join(h.userData,`prod-${NIP_A}.encrypted`);await fs.writeFile(h.tokenFile(NIP_B),otherToken);await fs.writeFile(prodTokenFile,prodToken);
 const before=await h.profiles.load(),activeBefore=before.profiles.find(p=>profileId(p)===h.aId);let probed=false;
 h.controls.probe=async input=>{probed=true;assert.equal(input.nip,NIP_A);assert.equal(input.environment,'test');assert.equal(input.token,'synthetic-original-access');return {type:'connected'};};
 const request={...update(h),token:''};delete request.documentsPath;
 const result=await h.invoke('configure',[request]);assert.equal(result.ok,true);assert.equal(probed,true);
 const after=await h.profiles.load(),activeAfter=after.profiles.find(p=>profileId(p)===h.aId);assert.equal(after.activeId,h.aId);assert.equal(activeAfter.name,request.name);assert.equal(activeAfter.bootstrapFrom,activeBefore.bootstrapFrom);assert.equal(await fs.realpath(activeAfter.documentsPath),await fs.realpath(activeBefore.documentsPath));
 assert.deepEqual(after.profiles.filter(p=>profileId(p)!==h.aId),before.profiles.filter(p=>profileId(p)!==h.aId));
 assert.deepEqual(await fs.readFile(h.tokenFile(NIP_A)),h.oldToken);assert.deepEqual(await fs.readFile(h.tokenFile(NIP_B)),otherToken);assert.deepEqual(await fs.readFile(prodTokenFile),prodToken);assert.equal(h.controls.calls.bridge,1);
});


test('Completed real download IPC returns its result and forwards reported rate-limit delay',async t=>{
 const h=await harness(t);h.controls.download=async(input,listener)=>{assert.equal(input.nip,NIP_A);assert.equal(input.environment,'test');await listener({type:'progress',stage:'waiting',retryAfterSeconds:12});await listener({type:'manifest',invoices:[]});return {type:'done',continuation:'2026-10-10T12:00:00Z',truncated:false};};
 const result=await h.invoke('download',[{kind:'incremental',role:'purchase'}],h.aId);
 assert.equal(result.ok,true);assert.equal(result.value.complete,true);assert.equal(result.value.saved,0);assert.equal(result.value.added,0);assert.equal(result.value.results.length,1);
 assert.equal(h.controls.progress.find(p=>p.stage==='waiting').retryAfterSeconds,12);assert.equal(h.controls.progress.find(p=>p.stage==='waiting').profileId,h.aId);
 const status=await h.invoke('status');assert.equal(status.value.roleStatuses.purchase.lastRun.kind,'incremental');assert.equal(status.value.roleStatuses.sales.lastRun,null);
});
test('A partial two-role download reports the failed role rather than full success',async t=>{
 const h=await harness(t);h.controls.download=async(input,listener)=>{if(input.role==='sales')throw Error('KSEF_HTTP_403');await listener({type:'manifest',invoices:[]});return {type:'done',continuation:'2026-10-10T12:00:00Z',truncated:false};};
 const result=await h.invoke('download',[{kind:'history',role:'both'}],h.aId);assert.equal(result.ok,true);assert.equal(result.value.complete,false);assert.equal(result.value.failures[0].role,'sales');assert.equal(result.value.results[0].role,'purchase');
});

function oneInvoice(h,{id='SYNTHETIC-REFRESH',truncated=false}={}){
 const xml=Buffer.from('<fictional-refresh/>');const {hash}=realRequire('./archive.cjs');
 const meta={id,number:'FV/TEST/REFRESH',date:'2026-09-11',seller:'Fikcyjny dostawca',sellerNip:NIP_B,gross:123,currency:'PLN',hash:hash(xml)};
 h.controls.download=async(input,listener)=>{
  await listener({type:'manifest',invoices:[meta]});
  await listener({type:'invoice',id,xml:xml.toString('base64')});
  assert.equal(h.controls.calls.renderPdf,0,'PDF rendering must start only after the helper completes');
  return {type:'done',continuation:'2026-10-10T12:00:00Z',truncated};
 };
 return {id,xml};
}

test('A failed PDF still confirms the KSeF list refresh, counts its new invoice and persists it after reload',async t=>{
 const h=await harness(t);oneInvoice(h);h.controls.renderPdf=async()=>{throw Error('PDF_TIMEOUT');};
 const result=await h.invoke('download',[{kind:'monthly',month:'2026-09',role:'purchase'}],h.aId);
 assert.equal(result.ok,true);assert.equal(result.value.complete,false);assert.equal(result.value.missing,1);assert.equal(result.value.saved,0);assert.equal(result.value.added,0);assert.equal(result.value.newInvoices,1);assert.equal(result.value.refreshed,1);
 const status=(await h.invoke('status')).value;const refresh=status.roleStatuses.purchase.ksefRefresh;
 assert.equal(refresh.lastAttempt.status,'success');assert.equal(refresh.lastSuccess.kind,'monthly');assert.equal(refresh.lastSuccess.dateFrom,'2026-09-01');assert.equal(refresh.lastSuccess.dateTo,'2026-09-30');assert.equal(refresh.lastSuccess.count,1);assert.equal(refresh.lastSuccess.newInvoices,1);assert.ok(Number.isFinite(Date.parse(refresh.lastSuccess.time)));
 assert.equal(status.roleStatuses.purchase.lastRun,null);assert.equal(status.roleStatuses.purchase.continuation,null);assert.equal(status.roleStatuses.purchase.coverage.length,0);assert.equal(status.roleStatuses.sales.ksefRefresh,null);
 const query=(await h.invoke('query',[{role:'purchase',period:{kind:'all'}}],h.aId)).value;
 assert.equal(query.rows.length,1);assert.equal(query.rows[0].status,'xml-only');assert.equal(query.ksefRefresh.lastSuccess.time,refresh.lastSuccess.time);
 assert.ok(h.controls.progress.findIndex(p=>p.stage==='ksef-refreshed')<h.controls.progress.findIndex(p=>p.stage==='preparing-pdfs'));
 const {Archive}=realRequire('./archive.cjs');const reloaded=await new Archive(h.documents,NIP_A,'test','purchase').load();assert.equal(reloaded.state.ksefRefresh.lastSuccess.time,refresh.lastSuccess.time);
 for(const [nip,environment,role] of [[NIP_A,'prod','purchase'],[NIP_B,'test','purchase'],[NIP_A,'test','sales']])assert.equal((await new Archive(h.documents,nip,environment,role).load()).state.ksefRefresh,undefined);
});

test('The successful refresh is durable and visible while PDF generation is still waiting; cancelling PDF keeps it',async t=>{
 const h=await harness(t);oneInvoice(h);const entered=deferred(),release=deferred();h.controls.renderPdf=async()=>{entered.resolve();await release.promise;throw Error('PDF_TIMEOUT');};
 const downloading=h.invoke('download',[{kind:'incremental',role:'purchase'}],h.aId);await entered.promise;
 let refreshedAt;
 try{
  const status=(await h.invoke('status')).value;assert.equal(status.busy,true);const refresh=status.roleStatuses.purchase.ksefRefresh;refreshedAt=refresh.lastSuccess.time;assert.equal(refresh.lastAttempt.status,'success');assert.equal(refresh.lastSuccess.from,h.a.bootstrapFrom);assert.equal(refresh.lastSuccess.through,'2026-10-10T12:00:00Z');
  assert.equal((await h.invoke('cancel')).value,true);
 }finally{release.resolve();}
 const result=await downloading;assert.equal(result.ok,false);assert.equal(result.code,'CANCELLED');
 const status=(await h.invoke('status')).value;assert.equal(status.busy,false);assert.equal(status.roleStatuses.purchase.ksefRefresh.lastSuccess.time,refreshedAt);assert.equal(status.roleStatuses.purchase.ksefRefresh.lastAttempt.status,'success');assert.equal(status.roleStatuses.purchase.continuation,null);
});

test('API failure, missing bridge documents and cancellation retain the previous successful refresh timestamp',async t=>{
 const h=await harness(t);await h.invoke('download',[{kind:'incremental',role:'purchase'}],h.aId);const successful=(await h.invoke('status')).value.roleStatuses.purchase.ksefRefresh.lastSuccess;
 assert.equal(successful.count,0);assert.equal(successful.newInvoices,0);
 for(const [code,expectedStatus] of [['KSEF_HTTP_403','failed'],['INCOMPLETE_DOWNLOAD','incomplete'],['CANCELLED','cancelled']]){
  h.controls.download=async()=>{throw Error(code);};const result=await h.invoke('download',[{kind:'incremental',role:'purchase'}],h.aId);assert.equal(result.ok,false);
  const refresh=(await h.invoke('status')).value.roleStatuses.purchase.ksefRefresh;assert.equal(refresh.lastAttempt.status,expectedStatus);assert.equal(refresh.lastSuccess.time,successful.time);assert.equal(refresh.lastSuccess.count,0);
 }
 const entered=deferred(),release=deferred();h.controls.download=async(_input,listener)=>{await listener({type:'manifest',invoices:[]});entered.resolve();await release.promise;return {type:'done',continuation:'2026-10-10T12:00:00Z',truncated:false};};
 const downloading=h.invoke('download',[{kind:'incremental',role:'purchase'}],h.aId);await entered.promise;try{assert.equal((await h.invoke('cancel')).value,true);}finally{release.resolve();}
 assert.equal((await downloading).code,'CANCELLED');const refresh=(await h.invoke('status')).value.roleStatuses.purchase.ksefRefresh;assert.equal(refresh.lastAttempt.status,'cancelled');assert.equal(refresh.lastSuccess.time,successful.time);
});

test('Incomplete and truncated helper responses never establish a successful KSeF refresh',async t=>{
 const h=await harness(t);h.controls.download=async(_input,listener)=>{await listener({type:'manifest',invoices:[{id:'MISSING'}]});return {type:'done',continuation:'2026-10-10T12:00:00Z',truncated:false};};
 assert.equal((await h.invoke('download',[{kind:'incremental',role:'purchase'}],h.aId)).ok,false);
 let refresh=(await h.invoke('status')).value.roleStatuses.purchase.ksefRefresh;assert.equal(refresh.lastSuccess,null);assert.equal(refresh.lastAttempt.status,'incomplete');
 oneInvoice(h,{truncated:true});const result=await h.invoke('download',[{kind:'incremental',role:'purchase'}],h.aId);assert.equal(result.ok,true);assert.equal(result.value.complete,false);assert.equal(result.value.refreshed,0);
 refresh=(await h.invoke('status')).value.roleStatuses.purchase.ksefRefresh;assert.equal(refresh.lastSuccess,null);assert.equal(refresh.lastAttempt.status,'incomplete');assert.equal(h.controls.progress.some(p=>p.stage==='ksef-refreshed'),false);
});
