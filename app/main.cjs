const {downloadScope}=require('./download-scope.cjs');
const {app,BrowserWindow,ipcMain,safeStorage,shell,Menu,dialog,screen}=require('electron');
const fs=require('node:fs/promises');const path=require('node:path');const os=require('node:os');const {pathToFileURL}=require('node:url');const {Archive,atomicWrite,validNip}=require('./archive.cjs');
const {role:checkRole,date:checkDate,monthDates,queryArchive,summarizeArchive}=require('./browse.cjs');
const viewPrefs=require('./view-prefs.cjs');const exportsApi=require('./exports.cjs');
const {environment:checkEnvironment,previousWarsawMonthStart}=require('./profile.cjs');
const {CompanyProfiles,profileId,configurationTarget}=require('./company-profiles.cjs');
const {requireSecureStorage}=require('./secure-storage.cjs');
const {createPdfRenderer}=require('./pdf-renderer.cjs');
const profileSnapshot=new (require('node:async_hooks').AsyncLocalStorage)();
const {prepareDocumentsFolder,copyScopedArchive}=require('./documents-storage.cjs');
const lookupCompany=require('./company-lookup.cjs').createCompanyLookup();
app.setName('Easy KSeF');
// Isolated UI verification never opens or changes the user's saved profile.
if(process.argv.includes('--ui-check'))app.setPath('userData',path.join(os.tmpdir(),'easy-ksef-ui-check'));
let win, busy=false,currentOperation=null,connectionPending=false,lastResult=null;const children=new Set();
const entry=pathToFileURL(path.join(__dirname,'index.html')).href;
const bridgePath=()=>path.join(app.isPackaged?path.join(process.resourcesPath,'bridge'):path.join(__dirname,'../bridge/publish'),process.platform==='win32'?'EasyKsefBridge.exe':'EasyKsefBridge');
const defaultBase=()=>process.argv.includes('--ui-check')?(process.env.EASY_KSEF_UI_DOCUMENTS||path.join(os.tmpdir(),'easy-ksef-ui-check-documents')):path.join(app.getPath('documents'),'Easy KSeF');
const base=p=>p?.documentsPath||defaultBase();
const companyProfiles=()=>new CompanyProfiles(app.getPath('userData'));
const secretPath=(nip,environment)=>{checkEnvironment(environment);if(!validNip(nip))throw new Error('INVALID_NIP');return path.join(app.getPath('userData'),`${environment}-${nip}.encrypted`);};
const monthValid=m=>typeof m==='string'&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(m);
const send=message=>{if(win&&!win.isDestroyed())win.webContents.send('progress',{...message,profileId:currentOperation?.profileId||null});};
const safeErrors={INVALID_FOLDER:'Wybierz folder faktur albo eksportów.',INVALID_ROLE:'Wybierz faktury zakupowe albo sprzedażowe.',INVALID_RANGE:'Sprawdź daty. Początek okresu musi być przed końcem.',INVALID_MONTH:'Wybierz poprawny miesiąc.',INVALID_QUERY:'Sprawdź ustawienia wyszukiwania i filtrów.',INVALID_VIEW:'Nie udało się zapisać układu kolumn. Przywróć domyślny widok.',INVALID_COLUMNS:'Wybierz poprawne kolumny do eksportu.',INVALID_SELECTION:'Zaznaczenie nie należy do bieżących wyników. Zaznacz faktury ponownie.',EMPTY_EXPORT:'Nie ma faktur do eksportu w tym widoku.',EXPORT_INCOMPLETE:'Nie wszystkie faktury mają poprawny XML i PDF. Napraw brakujące pliki przed eksportem ZIP.',OUTSIDE_RANGE:'KSeF zwrócił dokument poza wybranymi datami. Pobieranie zatrzymane.',RANGE_PACKAGE_TRUNCATED:'Wybrany okres jest zbyt duży dla tej wersji. Wybierz krótszy okres.',INVALID_ENVIRONMENT:'Wybierz prawdziwy albo testowy KSeF.',INVALID_PROFILE:'Uzupełnij nazwę firmy i poprawny token.',OUTSIDE_MONTH:'Paczka zawiera dokument spoza wybranego miesiąca. Pobieranie zatrzymane.',CANCELLED:'Operacja przerwana. Zapisane pliki pozostają w folderze. Możesz spróbować ponownie.',BRIDGE_UNAVAILABLE:'Nie udało się uruchomić połączenia z KSeF. Zamknij program i otwórz aktualną wersję.',INCOMPLETE_DOWNLOAD:'Połączenie zakończyło się przed otrzymaniem wyniku. Spróbuj ponownie.',COMPANY_UNAVAILABLE:'Rejestr firm nie odpowiada. Spróbuj ponownie.',COMPANY_INVALID_RESPONSE:'Rejestr nie zwrócił poprawnych danych tej firmy.',COMPANY_RATE_LIMIT:'Rejestr firm osiągnął limit zapytań. Spróbuj później.',INVALID_NIP:'Sprawdź NIP. Powinien mieć 10 cyfr i prawidłową cyfrę kontrolną.',WRONG_COMPANY:'Dokument dotyczy innej firmy. Pobieranie zatrzymane.',XML_HASH_MISMATCH:'Dokument nie zgadza się z informacją KSeF. Spróbuj pobrać ponownie.',NETWORK_ERROR:'Nie udało się połączyć. Sprawdź internet i spróbuj ponownie.',KSEF_HTTP_401:'Dostęp został odrzucony. Sprawdź token i wybrane środowisko KSeF.',KSEF_HTTP_403:'Brak uprawnień do faktur tej firmy. Sprawdź NIP i uprawnienie do przeglądania.',TIMEOUT:'KSeF nie odpowiedział w wyznaczonym czasie. Sprawdź internet i spróbuj ponownie.',MONTHLY_PACKAGE_TRUNCATED:'Miesiąc przekracza zakres tego pilota. Pobieranie zatrzymane; punkt kontynuacji nie został zmieniony.',NO_CONTINUATION_PROGRESS:'Paczka KSeF wymaga dodatkowej obsługi. Punkt kontynuacji nie został przesunięty.',STORAGE_UNAVAILABLE:'System nie udostępnia chronionego zapisu dostępu. Konfiguracja nie została zapisana.',BUSY:'Trwa poprzednia operacja. Poczekaj na jej wynik.',NOT_CONFIGURED:'Najpierw skonfiguruj firmę.',RATE_LIMIT:'KSeF ogranicza tempo. Spróbuj później.',PART_HASH_MISMATCH:'Paczka jest niekompletna. Spróbuj pobrać ponownie.'};
function userError(error){if(error.name==='AbortError')return safeErrors.CANCELLED;return safeErrors[error.message]||'Nie udało się zakończyć operacji. Dokumenty już zapisane pozostają w folderze. Spróbuj ponownie.';}
Object.assign(safeErrors,{PROFILE_EXISTS:'Ta firma w tym środowisku jest już dodana. Wybierz ją z listy firm. Aby zmienić token, otwórz jej Ustawienia.',PROFILE_CHANGED:'Wybrana firma zmieniła się. Wróć do jej faktur i ponów czynność.',PROFILE_NOT_FOUND:'Nie znaleziono tej firmy. Wybierz firmę z listy ponownie.',INVALID_PROFILES:'Nie udało się odczytać listy firm. Ustawienia i dokumenty pozostają zapisane. Uruchom ponownie program.',INVALID_DOCUMENTS_PATH:'Wybierz folder, w którym mają być zapisywane faktury.',UNSAFE_DOCUMENTS_FOLDER:'Ten folder zawiera odsyłacze lub pliki, które uniemożliwiają bezpieczne kopiowanie. Wybierz inny folder.',DOCUMENTS_FOLDER_CONFLICT:'W wybranym folderze są inne pliki o tych samych nazwach. Wybierz pusty folder. Twoje obecne faktury pozostają w dotychczasowym miejscu.',NESTED_DOCUMENTS_FOLDER:'Wybierz osobny folder, poza dotychczasowym folderem faktur.',DOCUMENTS_COPY_FAILED:'Nie udało się potwierdzić kopii wszystkich plików. Faktury i ustawienia pozostają w dotychczasowym folderze.'});
Object.assign(safeErrors,{CANCELLED:'Operacja przerwana. Zapisane wcześniej faktury pozostają w folderze.',TOO_MANY_INVOICES_AT_SAME_DATE:'KSeF zwrócił niepełną paczkę nawet dla najmniejszego zakresu dat. Nie potwierdziliśmy pobrania całego okresu. Zapisane faktury pozostają w folderze.'});
safeErrors.STORAGE_UNAVAILABLE='Nie można bezpiecznie zapisać tokena. Odblokuj systemowy magazyn haseł. Na Linuksie uruchom GNOME Keyring lub KWallet i spróbuj ponownie.';
safeErrors.PDF_TIMEOUT='Przygotowanie PDF trwało zbyt długo. XML pozostaje zapisany. Spróbuj ponownie pobrać ten okres.';
safeErrors.INVALID_ARCHIVE='Nie można odczytać archiwum tej firmy. Pliki pozostają w folderze. Przywróć kopię archiwum lub zgłoś problem — nie usuwaj faktur.';
safeErrors.DOCUMENTS_FOLDER_UNAVAILABLE='Nie można zapisywać plików w tym folderze. Sprawdź dostęp do dysku i wolne miejsce albo wybierz inny folder.';
async function profile(){return profileSnapshot.getStore()||await companyProfiles().active();}
async function token(nip,environment){requireSecureStorage(safeStorage,process.platform);return safeStorage.decryptString(await fs.readFile(secretPath(nip,environment)));}
const bridgeRunner=require('./bridge-runner.cjs').createBridgeRunner({getPath:bridgePath,spawnChild:process.argv.includes('--ui-check')&&process.argv.includes('--simulate-connection')?()=>require('node:child_process').spawn(process.execPath,[path.join(__dirname,'fixtures/stalled-bridge.cjs')],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},stdio:['pipe','pipe','pipe']}):undefined,onStart:child=>children.add(child),onClose:child=>children.delete(child)});
async function runBridge(input,listener=async()=>{}){if(currentOperation)currentOperation.bridgeOperation=input.op;return bridgeRunner(input,listener,{signal:currentOperation?.signal,...(input.op==='probe'&&process.argv.includes('--ui-check')&&process.argv.includes('--simulate-connection')?{timeoutMs:6000}:{})});}
const renderPdf=createPdfRenderer({createWindow:()=>new BrowserWindow({show:false,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}}),file:path.join(__dirname,'pdf.html')});
async function pdf(xml,id,options={environment:'test'}){return renderPdf(xml,id,options);}
async function previewPdf(file,p){
 const url=pathToFileURL(file).href;
 const preview=new BrowserWindow({width:960,height:850,title:'Easy KSeF — podgląd PDF',webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}});
 preview.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 preview.webContents.on('will-navigate',(event,target)=>{if(target!==url)event.preventDefault();});
 await preview.loadURL(url);if(p)preview.setTitle(`Easy KSeF — ${p.name} · NIP ${p.nip} — PDF`);return true;
}
const scopedMethods=new Set(['chooseDocumentsFolder','changeDocumentsFolder','download','list','query','summary','getView','saveView','folder','pdf','exportExcel','exportZip','exportPdfZip','excel']);
function ipc(name,handler){ipcMain.handle(name,async(event,...args)=>{
  if(event.sender!==win.webContents||event.senderFrame!==win.webContents.mainFrame||event.senderFrame.url!==entry)throw new Error('INVALID_SENDER');
  try{
   const envelope=args.at(-1);if(envelope&&typeof envelope==='object'&&Object.hasOwn(envelope,'__profileId'))args.pop();
   if(scopedMethods.has(name)){const p=await companyProfiles().active();if((p?profileId(p):null)!==envelope?.__profileId)throw new Error('PROFILE_CHANGED');return {ok:true,value:await profileSnapshot.run(p,()=>handler(...args))};}
   return {ok:true,value:await handler(...args)};
  }catch(e){return {ok:false,error:userError(e),...(e.message==='CANCELLED'||e.name==='AbortError'?{code:'CANCELLED'}:{})};}
});}
async function archive(selectedRole='purchase',selectedProfile){const p=selectedProfile||await profile();if(!p)throw new Error('NOT_CONFIGURED');return new Archive(base(p),p.nip,p.environment,checkRole(selectedRole)).load();}
function lock(action){return async(...args)=>{if(busy)throw new Error('BUSY');busy=true;currentOperation=new AbortController();try{const snapshot=profileSnapshot.getStore();if(snapshot){const active=await companyProfiles().active();if(!active||profileId(active)!==profileId(snapshot))throw new Error('PROFILE_CHANGED');currentOperation.profileId=profileId(snapshot);}return await action(...args);}finally{busy=false;currentOperation=null;}};}
async function chooseDocumentsFolder(){
 const current=await profile();const result=await dialog.showOpenDialog(win,{title:'Wybierz folder faktur',buttonLabel:'Wybierz folder',defaultPath:base(current),properties:['openDirectory','createDirectory']});
 if(result.canceled||!result.filePaths.length)return {path:null,cancelled:true};
 return {path:await prepareDocumentsFolder(result.filePaths[0]),cancelled:false};
}
const changeDocumentsFolder=lock(async()=>{
 const current=await profile();if(!current)throw new Error('NOT_CONFIGURED');const selected=await chooseDocumentsFolder();if(selected.cancelled)return selected;
 const copied=await copyScopedArchive({sourceBase:base(current),destinationBase:selected.path,nip:current.nip,environment:current.environment});
 await companyProfiles().save({...current,documentsPath:copied.path});lastResult=null;
 win.webContents.send('profile-changed');return {...copied,cancelled:false};
});
const configure=lock(async data=>{
   const nip=String(data?.nip||'').replace(/[ -]/g,'');if(!validNip(nip))throw new Error('INVALID_NIP');
   const environment=checkEnvironment(data?.environment);
   const name=String(data?.name||'').trim().slice(0,500);let secret=String(data?.token||'').trim();if(!name||(secret.length<10&&!(data?.mode==='update'&&!secret))||secret.length>4096)throw new Error('INVALID_PROFILE');
   requireSecureStorage(safeStorage,process.platform);
   const registry=await companyProfiles().load();const previous=configurationTarget(registry,{...data,nip,environment});const sameScope=!!previous;if(!secret&&data?.mode==='update')secret=await token(nip,environment);
   const documentsBase=await prepareDocumentsFolder(data?.documentsPath??(sameScope?base(previous):defaultBase()));
   currentOperation.profileId=profileId({nip,environment});connectionPending=true;
   try{await runBridge({op:'probe',environment,nip,token:secret},message=>{if(message.type==='progress')send({stage:message.stage});});}finally{connectionPending=false;}
   currentOperation.signal.throwIfAborted();
   if(sameScope&&base(previous)!==documentsBase)await copyScopedArchive({sourceBase:base(previous),destinationBase:documentsBase,nip,environment});
   const encoded=safeStorage.encryptString(secret),file=secretPath(nip,environment);let previousEncrypted;try{previousEncrypted=await fs.readFile(file);}catch(error){if(error.code!=='ENOENT')throw error;}
   const p={nip,name,environment,bootstrapFrom:sameScope?previous.bootstrapFrom:previousWarsawMonthStart(),documentsPath:documentsBase};
   await atomicWrite(file,encoded);try{await companyProfiles().save(p);}catch(error){if(previousEncrypted)await atomicWrite(file,previousEncrypted);else await fs.rm(file,{force:true});throw error;}lastResult=null;return p;
 });
async function downloadRole(request,p,selectedRole,dates,historyFrom){
   const a=await archive(selectedRole,p);
   const input={op:'download',environment:p.environment,nip:p.nip,token:await token(p.nip,p.environment),role:selectedRole,kind:request.kind,month:request.month,dateFrom:dates?.from,dateTo:dates?.to,from:historyFrom||a.state.continuation||p.bootstrapFrom};
   let expected=null;let saved=0,added=0;const before=new Set(Object.keys(a.state.documents));const received=new Set();
   const report=message=>send({...message,role:selectedRole});
   const end=await runBridge(input,async message=>{
     if(message.type==='manifest'){if(expected!==null||!Array.isArray(message.invoices))throw new Error('INVALID_MANIFEST');expected=new Map(message.invoices.map(m=>[m.id,m]));report({stage:'found',count:expected.size});}
     else if(message.type==='invoice'){
       if(!expected?.has(message.id)||received.has(message.id))throw new Error('UNEXPECTED_DOCUMENT');received.add(message.id);const meta=expected.get(message.id);
       if(a.state.documents[message.id])await a.enrichMetadata(meta);
       if(!await a.verified(message.id)){const xml=Buffer.from(message.xml,'base64');await a.saveXml(meta,xml);try{await a.savePdf(message.id,await pdf(xml,message.id,{environment:p.environment,qrCode:meta.qrCode,acDate:meta.acDate}));}catch{report({stage:'pdf-failed',count:saved,total:expected.size});}}
       if(await a.verified(message.id)){saved++;if(!before.has(message.id))added++;}report({stage:'saving',count:saved,total:expected.size});
     }else if(message.type==='progress')report({stage:message.stage||'preparing',count:message.count,total:message.total,retryAfterSeconds:message.retryAfterSeconds});
   });
   currentOperation.signal.throwIfAborted();
   if(expected===null||received.size!==expected.size)throw new Error('INCOMPLETE_DOWNLOAD');
   const result=await a.finish([...expected.keys()],{continuation:end.continuation,truncated:end.truncated,kind:request.kind,dateFrom:dates?.from,dateTo:dates?.to,historyFrom});return {...result,role:selectedRole,saved,added,months:[...new Set([...expected.values()].map(m=>m.date.slice(0,7)))].sort()};
 }
const downloadRequest=lock(async request=>{
 const p=await profile();if(!p)throw new Error('NOT_CONFIGURED');
 const {roles,dates,historyFrom}=downloadScope(request);const results=[],failures=[];
 for(const selectedRole of roles){
  currentOperation.signal.throwIfAborted();
  try{results.push(await downloadRole(request,p,selectedRole,dates,historyFrom));}
  catch(error){if(currentOperation.signal.aborted||roles.length===1)throw error;failures.push({role:selectedRole,message:safeErrors[error.message]||'Nie udało się pobrać faktur. Spróbuj ponownie.'});}
 }
 lastResult={role:request.role,results,failures,saved:results.reduce((n,r)=>n+r.saved,0),added:results.reduce((n,r)=>n+r.added,0),missing:results.reduce((n,r)=>n+(r.missing||0),0),truncated:results.some(r=>r.truncated),complete:failures.length===0&&results.every(r=>r.complete),months:[...new Set(results.flatMap(r=>r.months))].sort()};
 return lastResult;
 });
function register(){
 ipc('company',lookupCompany);
 ipc('cancel',()=>{if(!busy||!currentOperation||!['probe','download'].includes(currentOperation.bridgeOperation))return false;currentOperation.abort();return true;});
 ipc('status',async()=>{const registry=await companyProfiles().load();const p=registry.profiles.find(item=>profileId(item)===registry.activeId)||null;const a=p?await archive('purchase',p):null;const roleStatuses={};if(p)for(const selectedRole of ['purchase','sales']){const scoped=selectedRole==='purchase'?a:await archive(selectedRole,p);roleStatuses[selectedRole]={folder:scoped.root,archiveTotal:Object.keys(scoped.state.documents).length,continuation:scoped.state.continuation,lastRun:scoped.state.lastRun,coverage:scoped.state.coverage||[],history:scoped.state.history||null};}return {profile:p,profiles:registry.profiles,activeId:registry.activeId,defaultDocumentsBase:defaultBase(),environment:p?.environment||'prod',documentsBase:base(p),folder:a?.root||base(p),busy,lastResult,lastRun:a?.state.lastRun,roleStatuses,simulatedConnection:process.argv.includes('--ui-check')&&process.argv.includes('--simulate-connection')};});
 ipc('chooseDocumentsFolder',lock(chooseDocumentsFolder));ipc('changeDocumentsFolder',changeDocumentsFolder);
 ipc('configure',configure);ipc('selectCompany',lock(async request=>{const registry=await companyProfiles().load();if(request?.expectedActiveId!==registry.activeId)throw new Error('PROFILE_CHANGED');await companyProfiles().select(request?.id);lastResult=null;return true;}));ipc('download',downloadRequest);
 ipc('list',async month=>{if(!monthValid(month))throw new Error('INVALID_MONTH');return (await (await archive()).checkedList(month)).map(({id,number,date,seller,gross,currency,status})=>({id,number,date,seller,gross,currency,status}));});
 ipc('query',async q=>queryArchive(await archive(checkRole(q?.role)),q));
 ipc('summary',async request=>summarizeArchive(await archive(checkRole(request?.query?.role)),request));
 ipc('getView',async selectedRole=>{const p=await profile();if(!p)throw new Error('NOT_CONFIGURED');return viewPrefs.getView(app.getPath('userData'),p,checkRole(selectedRole));});
 ipc('saveView',lock(async request=>{const p=await profile();if(!p)throw new Error('NOT_CONFIGURED');return viewPrefs.saveView(app.getPath('userData'),p,checkRole(request?.role),request?.view);}));
 ipc('folder',async request=>{const legacy=typeof request==='string';const a=await archive(legacy?'purchase':checkRole(request?.role));const requestedFolder=exportsApi.folderTarget(a,request);const folder=await a.guardDirectory(path.relative(a.root,requestedFolder),true);await fs.mkdir(folder,{recursive:true,mode:0o700});const error=await shell.openPath(folder);if(error)throw new Error('OPEN_FAILED');return true;});
 ipc('pdf',async request=>{const legacy=typeof request==='string';const a=await archive(legacy?'purchase':checkRole(request?.role));const id=legacy?request:request?.id;if(typeof id!=='string'||!await a.verified(id))throw new Error('MISSING_PDF');return previewPdf(await a.guardFile(a.state.documents[id].pdf),await profile());});
 ipc('exportExcel',lock(async request=>exportsApi.exportExcel(await archive(checkRole(request?.query?.role)),request)));
 ipc('exportZip',lock(async request=>exportsApi.exportZip(await archive(checkRole(request?.query?.role)),request)));
 ipc('exportPdfZip',lock(async request=>exportsApi.exportZip(await archive(checkRole(request?.query?.role)),{...request,formats:'pdf'})));
 ipc('excel',lock(async month=>{if(!monthValid(month))throw new Error('INVALID_MONTH');return exportsApi.exportExcel(await archive(),{query:{role:'purchase',period:{kind:'month',month}}});}));
 ipc('guide',async()=>{await shell.openExternal('https://ksef.podatki.gov.pl/');return true;});
 ipc('sample',lock(async()=>{const xml=await fs.readFile(path.join(__dirname,'fixtures/invoice.xml'));const bytes=await pdf(xml,'5265877635-20260101-000000000000-00');const file=path.join(base(await profile()),'Przykład','Przykładowa faktura.pdf');await atomicWrite(file,bytes);return previewPdf(file);}));
}
if(!app.requestSingleInstanceLock())app.quit();
else app.whenReady().then(async()=>{
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Easy KSeF',submenu:[{role:'about'},{type:'separator'},{role:'quit'}]},{label:'Plik',submenu:[{role:'close'}]},{label:'Widok',submenu:[{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'}]},{label:'Edycja',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]}]));
 if(process.argv.includes('--self-test')){
   try {const xml=await fs.readFile(path.join(__dirname,'fixtures/invoice.xml'));const validation=await runBridge({op:'validate',xml:xml.toString('base64')});const output=await pdf(xml,'5265877635-20260101-000000000000-00');const folder=await fs.mkdtemp(path.join(os.tmpdir(),'easy-ksef-selftest-'));const a=await new Archive(folder,validation.buyerNip).load();const meta={id:'SELFTEST',number:'FV/TEST',date:'2026-01-01',seller:'Przykład',sellerNip:'5265877635',gross:100,currency:'PLN',hash:validation.hash};await a.saveXml(meta,xml);await a.savePdf(meta.id,output);if(!await a.verified(meta.id))throw new Error('SELFTEST_FILES');const destination=process.env.EASY_KSEF_TEST_OUTPUT||path.join(__dirname,'../../../outputs/easy-ksef');await fs.mkdir(destination,{recursive:true});await fs.writeFile(path.join(destination,'przykladowa-faktura-test.pdf'),output);await fs.rm(folder,{recursive:true});console.log(JSON.stringify({selfTest:'passed',pdfBytes:output.length,buyerValidated:true,filesVerified:true}));app.quit();}catch(e){console.error('SELFTEST_FAILED: '+e.message);app.exit(1);}return;
 }
 const workArea=screen.getPrimaryDisplay().workAreaSize;
 win=new BrowserWindow({width:Math.min(1280,workArea.width-48),height:Math.min(900,workArea.height-48),minWidth:660,minHeight:600,title:process.argv.includes('--ui-check')?'Easy KSeF — test aktualizacji':'Easy KSeF',backgroundColor:'#f4f5f7',icon:path.join(__dirname,'brand/easy-ksef-256.png'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',(event,url)=>{if(url!==entry)event.preventDefault();});win.webContents.session.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
 if(process.argv.includes('--ui-check'))win.webContents.on('console-message',details=>console.log(JSON.stringify({uiConsole:details.level,message:details.message})));
 register();await win.loadURL(entry);
 win.on('closed',()=>renderPdf.dispose());
 if(process.argv.includes('--import-access')){
   try {
     // A locally authorized bootstrap: selected credential arrives on stdin, never argv or logs.
     const readline=require('node:readline');const lines=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
     let line;for await(const value of lines){line=value;break;}lines.close();
     if(!line||line.length>16384)throw new Error('INVALID_PROFILE');
     const input=JSON.parse(line);const selectedMonth=input.month;const p=await configure(input);line=null;input.token=null;
     win.webContents.send('profile-changed');
     console.log(JSON.stringify({type:'access-imported',environment:p.environment,nip:p.nip}));
     if(selectedMonth){const result=await downloadRequest({kind:'monthly',month:selectedMonth});console.log(JSON.stringify({type:'live-result',environment:p.environment,month:selectedMonth,...result}));win.webContents.send('profile-changed');}
   }catch(e){console.log(JSON.stringify({type:'live-error',code:safeErrors[e.message]?e.message:'FAILED',message:userError(e)}));send({stage:'failed',message:userError(e)});}
 }
});
app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus();}});app.on('window-all-closed',()=>app.quit());
app.on('before-quit',()=>{for(const child of children)child.kill();});
