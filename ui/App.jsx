import React,{useState,useEffect,useCallback,useRef} from 'react';
import {Button} from './components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from './components/ui/dialog';
import CompanySetup from './components/company/CompanySetup';
import CompanySettings from './components/company/CompanySettings';
import InvoiceWorkspace from './components/invoices/InvoiceWorkspace';
import Help from './components/shell/Help';
import AppShell from './components/shell/AppShell';
import {api,setClientProfile} from './lib/client';
export default function App(){
 const [status,setStatus]=useState({profile:null,profiles:[],environment:'prod',folder:''});
 const [ready,setReady]=useState(false),[startupError,setStartupError]=useState('');
 const [helpOpen,setHelpOpen]=useState(false);
 const [page,setPage]=useState('invoices'),[setupMode,setSetupMode]=useState('add'),[busy,setActiveBusy]=useState(false);
 const [notice,setNotice]=useState({text:'',error:false}),[progress,setProgress]=useState(null),[operation,setOperation]=useState(null),[cancelling,setCancelling]=useState(false);
 const operationRef=useRef(null),refreshVersion=useRef(0);
 const notify=useCallback((text,error=false)=>setNotice({text,error,id:Date.now()}),[]);
 const setBusy=useCallback((value,context)=>{
  setActiveBusy(value);setProgress(null);setCancelling(false);
  const next=value?(context||{kind:'working',label:'Przetwarzanie'}):null;
  operationRef.current=next;setOperation(next);
  if(value)setNotice({text:'',error:false});
 },[]);
 const refresh=useCallback(async()=>{const version=++refreshVersion.current,value=await api('status');if(version===refreshVersion.current){setClientProfile(value.profile);setStatus(value);}return value;},[]);
 const initialize=useCallback(async()=>{
  setReady(false);setStartupError('');
  try{const value=await refresh();setPage(value.profile?'invoices':'setup');setActiveBusy(!!value.busy);}
  catch(error){setStartupError(error.message);}
  finally{setReady(true);}
 },[refresh]);
 useEffect(()=>{initialize();
  const offProfile=window.easyKsef?.onProfileChange?.(()=>refresh().catch(e=>notify(e.message,true)));
  const offProgress=window.easyKsef?.onProgress?.(data=>{
   if(!['download','connect'].includes(operationRef.current?.kind))return;
   if(data.stage!=='failed')setProgress({...data,receivedAt:Date.now()});
   if(data.stage==='ksef-refreshed'||data.stage==='connecting'&&operationRef.current?.kind==='download')refresh().catch(e=>notify(e.message,true));
  });
  return()=>{typeof offProfile==='function'&&offProfile();typeof offProgress==='function'&&offProgress();};
 },[initialize,refresh,notify]);
 useEffect(()=>{if(!notice.text||notice.error)return;const timer=setTimeout(()=>setNotice(current=>current.id===notice.id?{text:'',error:false}:current),6500);return()=>clearTimeout(timer);},[notice]);
 const addCompany=()=>{if(busy)return;setSetupMode('add');setNotice({text:'',error:false});setPage('setup');};
 const selectCompany=async id=>{
  if(busy)return;setReady(false);setBusy(true,{kind:'switch',label:'Otwieranie dokumentów wybranej firmy'});
  try{await api('selectCompany',{id,expectedActiveId:status.activeId||`${status.profile.environment}/${status.profile.nip}`});const next=await refresh();if(page==='setup')setPage('invoices');notify(`Wybrano ${next.profile.name}. Lista zawiera jej zapisane faktury.`);}
  catch(error){notify(error.message,true);}finally{setReady(true);setBusy(false);}
 };
 const changeFolder=async()=>{setBusy(true,{kind:'folder',label:'Zmiana folderu dokumentów tej firmy'});try{const result=await api('changeDocumentsFolder');if(!result.cancelled){await refresh();notify('Folder tej firmy zmieniony. Zapisane faktury skopiowano do nowego miejsca.');}}catch(error){notify(error.message,true);}finally{setBusy(false);}};
 const cancelOperation=async()=>{if(cancelling)return;setCancelling(true);try{await api('cancel');}catch(error){setCancelling(false);notify(error.message,true);}};
 const profile=status.profile;
 return <AppShell profile={profile} status={status} page={page} onNavigate={next=>{if(page==='setup'&&next==='help'){setHelpOpen(true);return;}if(next==='setup')setSetupMode('add');setPage(next);}} onSelectCompany={selectCompany} onAddCompany={addCompany} notice={notice} onDismiss={()=>setNotice({text:'',error:false})} busy={busy} operation={operation} progress={progress} onCancel={cancelOperation} cancelling={cancelling}>
  {!ready?<section className="startup-state" role="status">Otwieranie archiwum…</section>:startupError?<section className="startup-state" role="alert"><h1>Nie udało się otworzyć archiwum</h1><p>{startupError}</p><Button onClick={initialize}>Spróbuj ponownie</Button></section>:page==='setup'?<CompanySetup key={`${setupMode}/${profile?.environment}/${profile?.nip}`} mode={setupMode} profile={setupMode==='update'?profile:null} status={status} busy={busy} setBusy={setBusy} notify={notify} onCancel={profile?()=>setPage('settings'):null} onExisting={async id=>{await selectCompany(id);setPage('settings');}} onDone={async()=>{await refresh();setPage('invoices');}}/>:page==='invoices'?<InvoiceWorkspace key={`${status.environment}/${profile?.nip}`} status={status} busy={busy} setBusy={setBusy} notify={notify} refresh={refresh} operation={operation} progress={progress} cancelling={cancelling} onCancel={cancelOperation}/>:page==='settings'?<CompanySettings status={status} busy={busy} onSelect={selectCompany} onAdd={addCompany} onEdit={()=>{setSetupMode('update');setPage('setup');}} onFolder={changeFolder}/>:<Help/>}
 <Dialog open={helpOpen} onOpenChange={setHelpOpen}><DialogContent className="task-dialog setup-help-dialog" onCloseAutoFocus={event=>{event.preventDefault();document.getElementById('token')?.focus();}}><DialogHeader><DialogTitle>Pomoc podczas konfiguracji</DialogTitle><DialogDescription>Wpisane dane pozostaną w formularzu.</DialogDescription></DialogHeader><div className="dialog-body"><Help/></div><DialogFooter className="dialog-actions"><Button onClick={()=>setHelpOpen(false)}>Wróć do konfiguracji</Button></DialogFooter></DialogContent></Dialog>
 </AppShell>;
}
