import React from 'react';
import {Button} from '../ui/button';
import {TableFooter,TableRow,TableCell} from '../ui/table';
import {countLabel} from '../../lib/workflow.mjs';

// Keep exact decimal strings: large totals must not lose cents through Number.
function amount(value){
 if(value===null)return 'Brak kwoty';
 const [integer,fraction]=value.replace(/^-/, '').split('.');
 return (value.startsWith('-')?'−':'')+new Intl.NumberFormat('pl-PL').format(BigInt(integer))+','+fraction;
}
export default function InvoiceSummary({columns=[],summary,selected,total,selectionCount,pending,error,onRetry,onShowGross}){
 const labelColumn=columns.find(id=>!['selection','gross','document'].includes(id))||'selection';
 const count=summary?.count??(selected?selectionCount:total);
 const label=<><strong>{selected?'Suma zaznaczonych':'Suma listy'}</strong><span className="summary-scope">{countLabel(count)}</span>{!!(summary?.unknownCurrency||summary?.missingAmounts)&&<span className="summary-warning">Brakujące dane: kwota {summary.missingAmounts}, waluta {summary.unknownCurrency}.</span>}</>;
 return <TableFooter className={'invoice-summary'+(selected?' has-selection':'')} aria-label="Podsumowanie faktur" aria-busy={pending}>
  <TableRow>{columns.includes('gross')?columns.map(id=><TableCell key={id} data-column={id} className={id==='gross'?'summary-amount-cell':id===labelColumn?'summary-label-cell':''}>
   {id===labelColumn&&label}
   {id==='gross'&&<div className="summary-values" role="status" aria-live="polite" aria-atomic="true">
    {pending?<span className="muted">Obliczanie…</span>:error?<><span className="error-text">Sumy niedostępne</span><Button variant="ghost" title={error} onClick={onRetry}>Ponów obliczenie</Button></>:summary?.byCurrency.length?summary.byCurrency.map(group=><div key={group.currency} className="currency-total"><strong>{amount(group.gross)} {group.currency}</strong>{group.missingAmounts>0&&<span className="summary-warning">suma częściowa</span>}</div>):<span className="muted">—</span>}
   </div>}
  </TableCell>):<TableCell colSpan={columns.length}><div className="summary-hidden"><span>Sumy ukryte razem z kolumną Brutto.</span><Button variant="ghost" onClick={onShowGross}>Pokaż Brutto</Button></div></TableCell>}</TableRow>
 </TableFooter>;
}
