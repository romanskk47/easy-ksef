import React,{useMemo} from 'react';
import {flexRender,getCoreRowModel,useReactTable} from '@tanstack/react-table';
import {ArrowDown,ArrowUp,ArrowUpDown,FileText,Ellipsis} from 'lucide-react';
import {Button} from '../ui/button';
import {Checkbox} from '../ui/checkbox';
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from '../ui/table';
import {COLUMNS} from '../../view.mjs';
import InvoicePagination from './InvoicePagination';

/** A complete, controlled table. Filtering/sorting/paging run in the archive backend.
 * Parent owns full-result selection (including exclusions), so current-page rows
 * never become the export target implicitly. Selection/PDF columns stay visible. */
export default function InvoiceDataTable({rows,total,page,view,sort,loading,rowSelected,onToggleRow,onTogglePage,onSort,onPage,onPageSize,renderCell,onOpenPdf,onRepair,onDetails,summaryFooter}){
 const rowSelection=useMemo(()=>Object.fromEntries(rows.filter(rowSelected).map(row=>[row.id,true])),[rows,rowSelected]);
 const sorting=useMemo(()=>[{id:sort.key,desc:sort.direction==='desc'}],[sort]);
 const columnVisibility=useMemo(()=>Object.fromEntries(COLUMNS.map(column=>[column.id,!view.hidden.includes(column.id)])),[view.hidden]);
 const columnOrder=useMemo(()=>['selection',...view.columns,'document'],[view.columns]);
 const definitions=useMemo(()=>[
  {id:'selection',enableSorting:false,enableHiding:false,meta:{className:'selection-cell'},header:({table})=><Checkbox checked={table.getIsAllPageRowsSelected()?true:table.getIsSomePageRowsSelected()?'indeterminate':false} disabled={!rows.length||loading} aria-label="Zaznacz faktury na tej stronie" onCheckedChange={onTogglePage}/>,cell:({row})=><Checkbox checked={row.getIsSelected()} disabled={loading} aria-label={'Zaznacz fakturę '+row.original.number} onCheckedChange={yes=>onToggleRow(row.id,yes)}/>},
  ...COLUMNS.map(column=>({id:column.id,accessorFn:row=>row[column.id],enableSorting:!!column.sort,sortDescFirst:false,meta:{className:column.id==='gross'?'amount-heading':''},header:({column:tableColumn})=>column.sort?<Button variant="ghost" onClick={tableColumn.getToggleSortingHandler()}>{column.label}{tableColumn.getIsSorted()?(tableColumn.getIsSorted()==='asc'?<ArrowUp/>:<ArrowDown/>):<ArrowUpDown className="sort-hint"/>}</Button>:column.label,cell:({row})=>renderCell(row.original,column.id)})),
  {id:'document',enableSorting:false,enableHiding:false,meta:{className:'row-actions'},header:'Dokument',cell:({row})=><div className="row-action-group">{row.original.status!=='ready'?<Button variant="outline" aria-label={'Napraw pliki faktury '+row.original.number} onClick={event=>onRepair(row.original,event.currentTarget)}>Napraw pliki</Button>:<Button variant="outline" aria-label={'Otwórz PDF '+row.original.number} onClick={()=>onOpenPdf(row.original)} title={'Otwórz PDF '+row.original.number}><FileText/>PDF</Button>}<Button variant="ghost" aria-label={'Szczegóły faktury '+row.original.number} title={'Szczegóły faktury '+row.original.number} onClick={event=>onDetails(row.original,event.currentTarget)}><Ellipsis/></Button></div>},
 ],[rows.length,loading,onTogglePage,onToggleRow,renderCell,onOpenPdf,onRepair,onDetails]);
 const table=useReactTable({
  data:rows,columns:definitions,getCoreRowModel:getCoreRowModel(),getRowId:row=>row.id,
  manualFiltering:true,manualSorting:true,manualPagination:true,rowCount:total,
  enableSortingRemoval:false,enableMultiSort:false,autoResetPageIndex:false,
  state:{sorting,columnVisibility,columnOrder,rowSelection,pagination:{pageIndex:page-1,pageSize:view.pageSize}},
  onSortingChange:updater=>{const next=typeof updater==='function'?updater(sorting):updater;if(next[0])onSort({key:next[0].id,direction:next[0].desc?'desc':'asc'});},
  onPaginationChange:updater=>{const old={pageIndex:page-1,pageSize:view.pageSize};const next=typeof updater==='function'?updater(old):updater;if(next.pageSize!==old.pageSize)onPageSize(next.pageSize);else onPage(next.pageIndex+1);},
 });
 return <><div className="table-scroll" tabIndex={0} aria-label="Tabela faktur — można przewijać w poziomie" aria-busy={loading}><Table className="invoice-table" containerClassName="table-inner"><TableHeader>{table.getHeaderGroups().map(group=><TableRow key={group.id}>{group.headers.map(header=><TableHead key={header.id} data-column={header.column.id} className={header.column.columnDef.meta?.className} aria-sort={header.column.getCanSort()&&header.column.getIsSorted()?(header.column.getIsSorted()==='asc'?'ascending':'descending'):undefined}>{header.isPlaceholder?null:flexRender(header.column.columnDef.header,header.getContext())}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{table.getRowModel().rows.map(row=><TableRow key={row.id} className={row.getIsSelected()?'selected-row':''} data-state={row.getIsSelected()?'selected':undefined}>{row.getVisibleCells().map(cell=><TableCell key={cell.id} data-column={cell.column.id} className={cell.column.id==='selection'?'selection-cell':cell.column.id==='document'?'row-actions':''}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</TableCell>)}</TableRow>)}</TableBody>{React.cloneElement(summaryFooter,{columns:table.getVisibleLeafColumns().map(column=>column.id)})}</Table></div><InvoicePagination table={table} total={total} page={page} pageSize={view.pageSize} loading={loading} onPageSize={onPageSize}/></>;
}
