import React from 'react';
import {RefreshCw,CheckCircle2,Clock3,AlertCircle} from 'lucide-react';
import {Button} from '../ui/button';
import {timestampLabel} from '../../lib/format';
import {refreshEvidence,refreshScope,attemptLabel} from '../../lib/ksef-refresh.mjs';
import DownloadProgress from './DownloadProgress';

export default function KsefRefreshStatus({status,busy,operation,progress,cancelling,onCancel,onRefresh,onChoosePeriod}){
 const refreshing=busy&&operation?.kind==='download';
 return <section className="ksef-refresh card" aria-labelledby="ksef-refresh-title">
  <div className="ksef-refresh-heading">
   <div><h2 id="ksef-refresh-title">Dane z KSeF</h2><p>Ostatnie udane odświeżenie listy faktur</p></div>
   <div className="ksef-refresh-actions">
    <Button variant="outline" disabled={busy} onClick={onChoosePeriod}>Wybierz okres…</Button>
    <Button id="download-from-ksef" disabled={busy} onClick={onRefresh}><RefreshCw aria-hidden="true"/>Odśwież z KSeF</Button>
   </div>
  </div>
  <dl className="ksef-refresh-roles">{[['purchase','Zakupowe'],['sales','Sprzedażowe']].map(([role,label])=>{
   const evidence=refreshEvidence(status.roleStatuses?.[role],refreshing&&(!progress?.role||progress.role===role));
   const {success,attempt,issue}=evidence;
   const Icon=issue&&issue!=='running'?AlertCircle:success?CheckCircle2:Clock3;
   return <div key={role} className={'ksef-refresh-role'+(issue&&issue!=='running'?' needs-attention':'')}>
    <dt><Icon aria-hidden="true"/>{label}</dt>
    <dd>{success?<><strong><time dateTime={success.time}>{timestampLabel(success.time)}</time></strong><span className="ksef-refresh-scope">{refreshScope(success)}</span></>:<><strong>Jeszcze nie odświeżono</strong><span className="ksef-refresh-scope">Brak potwierdzonego odczytu z KSeF</span></>}
     {issue&&<span className="ksef-refresh-attempt">{attemptLabel(issue)}{issue!=='running'&&attempt?<> · <time dateTime={attempt.time}>{timestampLabel(attempt.time)}</time></>:null}</span>}
    </dd>
   </div>;
  })}</dl>
  <p className="ksef-refresh-help">„Odśwież z KSeF” sprawdza nowe faktury zakupowe i sprzedażowe. Starsze miesiące uzupełnisz przez „Wybierz okres…”.</p>
  <div className="ksef-refresh-progress">{refreshing&&<DownloadProgress operation={operation} progress={progress} cancelling={cancelling} onCancel={onCancel}/>}</div>
 </section>;
}
