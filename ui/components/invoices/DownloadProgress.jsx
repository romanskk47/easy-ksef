import React,{useEffect,useState} from 'react';
import {Clock3,LoaderCircle} from 'lucide-react';
import {Button} from '../ui/button';
import {operationStatus,remainingWait} from '../../lib/workflow.mjs';

export default function DownloadProgress({operation,progress,cancelling,onCancel}){
 const[now,setNow]=useState(Date.now());
 const waiting=progress?.stage==='waiting';
 useEffect(()=>{if(!waiting)return;setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[waiting,progress?.receivedAt]);
 const active=operationStatus(operation,progress);
 const remaining=remainingWait(progress,now);
 const label=cancelling?'Kończenie pobierania…':active?.label||'Sprawdzanie KSeF…';
 return <div className="download-progress">
  <div className="download-progress-copy"><span className="download-progress-title" role="status">{waiting?<Clock3 aria-hidden="true"/>:<LoaderCircle className="working-icon" aria-hidden="true"/>}{label}</span>
   <span className="download-progress-hint">{cancelling?'Poczekaj na zakończenie zapisu. Gotowe pliki zostają w folderze.':waiting?'Program ponowi próbę sam. Nie musisz klikać ponownie.':'Możesz przeglądać zapisane faktury. Pozostaw program otwarty.'}{!cancelling&&waiting&&remaining!==null&&<span className="retry-countdown"> {remaining>0?`Kolejna próba za ${remaining} s.`:'Czekamy na odpowiedź KSeF…'}</span>}</span>
   {!cancelling&&active?.value!==null&&active?.value!==undefined&&<progress max="100" value={active.value} aria-label="Postęp zapisywania faktur"/>}
  </div>
  <Button variant="outline" size="sm" disabled={cancelling} onClick={onCancel}>{cancelling?'Kończenie…':'Przerwij pobieranie'}</Button>
 </div>;
}
