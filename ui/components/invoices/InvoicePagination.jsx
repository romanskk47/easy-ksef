import React from 'react';
import {ChevronLeft,ChevronRight} from 'lucide-react';
import IconButton from '../IconButton';
import SelectControl from '../SelectControl';
export default function InvoicePagination({table,total,page,pageSize,loading,onPageSize}){
 return <div className="pagination"><div className="pagination-summary"><span>{total?`${(page-1)*pageSize+1}–${Math.min(page*pageSize,total)} z ${total}`:'0 wyników'}</span><label>Na stronie<SelectControl value={pageSize} disabled={loading} onChange={e=>onPageSize(Number(e.target.value))}><option value="50">50</option><option value="100">100</option></SelectControl></label></div>{table.getPageCount()>1&&<div className="actions"><IconButton label="Poprzednia strona" disabled={!table.getCanPreviousPage()||loading} onClick={()=>table.previousPage()}><ChevronLeft/></IconButton><span>Strona {page} z {Math.max(1,table.getPageCount())}</span><IconButton label="Następna strona" disabled={!table.getCanNextPage()||loading} onClick={()=>table.nextPage()}><ChevronRight/></IconButton></div>}</div>;
}
