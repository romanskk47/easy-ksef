import React,{useEffect,useState} from 'react';
import {Clock3,LoaderCircle} from 'lucide-react';
import {Button} from '../ui/button';
import {operationStatus,remainingWait,downloadProgressHint} from '../../lib/workflow.mjs';

export default function DownloadProgress({operation,progress,cancelling,onCancel}){
 const[now,setNow]=useState(Date.now());
 const waiting=progress?.stage==='waiting';
 useEffect(()=>{if(!waiting)return;setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[waiting,progress?.receivedAt]);
 const active=operationStatus(operation,progress);
 const remaining=remainingWait(progress,now);
 const preparingFiles=['ksef-refreshed','preparing-pdfs','pdf-failed'].includes(progress?.stage);
 const label=cancelling?(preparingFiles?'Przerywanie przygotowania PDF-ów…':'Przerywanie odświeżania…'):active?.label||'Odświeżanie danych z KSeF…';
 return <div className="download-progress">
  <div className="download-progress-copy"><span className="download-progress-title" role="status" aria-live="polite" aria-atomic="true">{waiting?<Clock3 aria-hidden="true"/>:<LoaderCircle className="working-icon" aria-hidden="true"/>}{label}</span>
   <span className="download-progress-hint">{downloadProgressHint(progress,cancelling)}{!cancelling&&waiting&&remaining!==null&&<span className="retry-countdown"> {remaining>0?`Kolejna próba za ${remaining} s.`:'Czekamy na odpowiedź KSeF…'}</span>}</span>
   {!cancelling&&active?.value!==null&&active?.value!==undefined&&<progress max="100" value={active.value} aria-label={preparingFiles?'Postęp sprawdzania i przygotowywania PDF-ów':'Postęp odczytywania faktur z KSeF'}/>}
  </div>
  <Button variant="outline" size="sm" disabled={cancelling} onClick={onCancel}>{cancelling?'Przerywanie…':'Przerwij'}</Button>
 </div>;
}
