import React,{useState,useEffect} from 'react';
import {FileText} from 'lucide-react';
import {Button} from '../ui/button';
import {Dialog,DialogContent,DialogDescription,DialogFooter,DialogHeader,DialogTitle} from '../ui/dialog';
import {COLUMNS} from '../../view.mjs';
export default function InvoiceDetails({details,onClose,renderCell,onOpenPdf,returnFocus}){
 const [error,setError]=useState(''),[opening,setOpening]=useState(false);useEffect(()=>{setError('');},[details?.id]);
 return <Dialog open={!!details} onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="invoice-details" onCloseAutoFocus={event=>{event.preventDefault();const label=returnFocus.current?.getAttribute('aria-label');const replacement=label?[...document.querySelectorAll('button[aria-label]')].find(button=>button.getAttribute('aria-label')===label):null;const target=returnFocus.current?.isConnected?returnFocus.current:replacement||document.getElementById('invoice-search');target?.focus();}}><DialogHeader><DialogTitle>Faktura {details?.number}</DialogTitle><DialogDescription>Faktura z lokalnego archiwum. Stan plików pokazuje, czy XML i PDF są zapisane na tym komputerze.</DialogDescription></DialogHeader>{details&&<dl>{COLUMNS.map(col=><div key={col.id}><dt>{col.label}</dt><dd>{renderCell(details,col.id)}</dd></div>)}</dl>}{error&&<p className="setup-error" role="alert">{error}</p>}<DialogFooter><Button disabled={details?.status!=='ready'||opening} onClick={async()=>{setError('');setOpening(true);try{await onOpenPdf(details);}catch(e){setError(e.message);}finally{setOpening(false);}}}><FileText/>Otwórz PDF</Button></DialogFooter></DialogContent></Dialog>;
}
