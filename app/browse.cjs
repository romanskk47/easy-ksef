'use strict';
// The exact same validated predicate and ordering drive list and all exports.
const COLUMN_IDS=Object.freeze(['counterparty','counterpartyNip','number','date','gross','currency','id','status','type','acDate']);
const DEFAULT_VIEW=Object.freeze({columns:COLUMN_IDS,hidden:['counterpartyNip','currency','id','type','acDate'],pageSize:50});
const {summarizeRows}=require('./invoice-summary.cjs');
function role(value='purchase'){if(!['purchase','sales'].includes(value))throw new Error('INVALID_ROLE');return value;}
function date(value){if(typeof value!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])-\d{2}$/.test(value))throw new Error('INVALID_RANGE');const parsed=new Date(value+'T12:00:00Z');if(!Number.isFinite(+parsed)||parsed.toISOString().slice(0,10)!==value)throw new Error('INVALID_RANGE');return value;}
function monthDates(month){if(typeof month!=='string'||!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))throw new Error('INVALID_MONTH');const [y,m]=month.split('-').map(Number);return {from:month+'-01',to:new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)};}
function text(value,max=500){if(value==null)return '';if(typeof value!=='string'||value.length>max)throw new Error('INVALID_QUERY');return value.trim();}
function fold(value){return String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleLowerCase('pl').replace(/ł/g,'l');}
function amount(value){if(value==null||value==='')return null;if(typeof value!=='number'||!Number.isFinite(value)||Math.abs(value)>1e15)throw new Error('INVALID_QUERY');return value;}
function validateQuery(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('INVALID_QUERY');
 const q={role:role(input.role),search:text(input.search),period:input.period||{kind:'all'}};
 if(!q.period||typeof q.period!=='object')throw new Error('INVALID_RANGE');
 if(q.period.kind==='month'){q.period={kind:'month',month:q.period.month};monthDates(q.period.month);}
 else if(q.period.kind==='range'){q.period={kind:'range',from:date(q.period.from),to:date(q.period.to)};if(q.period.from>q.period.to)throw new Error('INVALID_RANGE');}
 else if(q.period.kind==='all')q.period={kind:'all'};else throw new Error('INVALID_RANGE');
 const f=input.filters||{};if(typeof f!=='object'||Array.isArray(f))throw new Error('INVALID_QUERY');
 q.filters={counterparty:text(f.counterparty),currency:text(f.currency,3).toUpperCase(),minGross:amount(f.minGross),maxGross:amount(f.maxGross),type:text(f.type,30),status:text(f.status,20)};
 if(q.filters.currency&&!/^[A-Z]{3}$/.test(q.filters.currency))throw new Error('INVALID_QUERY');
 if(q.filters.minGross!==null&&q.filters.maxGross!==null&&q.filters.minGross>q.filters.maxGross)throw new Error('INVALID_QUERY');
 if(q.filters.type&&!['correction','regular','Vat','Zal','Kor','Roz','Upr','KorZal','KorRoz','VatPef','VatPefSp','KorPef','VatRr','KorVatRr','unknown'].includes(q.filters.type))throw new Error('INVALID_QUERY');
 if(q.filters.status&&!['ready','xml-only','damaged','attention'].includes(q.filters.status))throw new Error('INVALID_QUERY');
 q.sort={key:input.sort?.key||'date',direction:input.sort?.direction||'desc'};
 if(!['date','counterparty','number','gross','id','counterpartyNip','currency','status','type','acDate'].includes(q.sort.key)||!['asc','desc'].includes(q.sort.direction))throw new Error('INVALID_QUERY');
 q.page=input.page??1;q.pageSize=input.pageSize??50;if(!Number.isSafeInteger(q.page)||q.page<1||q.page>1000000||![50,100,5000].includes(q.pageSize))throw new Error('INVALID_QUERY');
 return q;
}
function row(item,selectedRole){return {id:item.id,number:item.number,date:item.date,counterparty:selectedRole==='sales'?(item.buyer||'Brak nazwy nabywcy'):item.seller,counterpartyNip:selectedRole==='sales'?(item.buyerNip||''):item.sellerNip,seller:item.seller,sellerNip:item.sellerNip,buyer:item.buyer||'',buyerNip:item.buyerNip||'',gross:item.gross,currency:item.currency,status:item.status,type:item.type||'',acDate:item.acDate||''};}
function contains(value,needle){return fold(value).includes(fold(needle));}
function matches(r,q){
 const p=q.period;if(p.kind==='month'&&!r.date.startsWith(p.month))return false;if(p.kind==='range'&&(r.date<p.from||r.date>p.to))return false;
 if(q.search){const n=q.search.replace(/[\s-]/g,'');const nipMatch=/^\d+$/.test(n)&&[r.counterpartyNip,r.sellerNip,r.buyerNip].some(x=>String(x).replace(/[\s-]/g,'').includes(n));if(!nipMatch&&![r.number,r.id,r.counterparty,r.seller,r.buyer].some(x=>contains(x,q.search)))return false;}
 const f=q.filters;if(f.counterparty&&!contains(r.counterparty,f.counterparty)&&!String(r.counterpartyNip).includes(f.counterparty.replace(/[\s-]/g,'')))return false;
 if(f.currency&&r.currency!==f.currency)return false;if((f.minGross!==null||f.maxGross!==null)&&grossValue(r.gross)===null)return false;if(f.minGross!==null&&r.gross<f.minGross)return false;if(f.maxGross!==null&&r.gross>f.maxGross)return false;
 if(f.status&&(f.status==='attention'?r.status==='ready':r.status!==f.status))return false;
 if(f.type){const correction=/^Kor/i.test(r.type);if(f.type==='correction'&&!correction)return false;if(f.type==='regular'&&(!r.type||correction))return false;if(f.type==='unknown'&&r.type)return false;if(!['correction','regular','unknown'].includes(f.type)&&r.type!==f.type)return false;}
 return true;
}
function sortRows(rows,q){const sign=q.sort.direction==='asc'?1:-1;const collator=new Intl.Collator('pl',{numeric:true,sensitivity:'base'});return rows.sort((a,b)=>{const av=a[q.sort.key],bv=b[q.sort.key];const compare=q.sort.key==='gross'?av-bv:collator.compare(String(av||''),String(bv||''));return sign*compare||String(a.id).localeCompare(String(b.id));});}
function grossValue(value){if(value===null||value===undefined||value===''||typeof value==='boolean')return null;const n=Number(value);return Number.isFinite(n)?n:null;}
function filterFacets(rows,q){
 // Facets cover the period across every page, before search and other filters.
 const periodQuery={...q,search:'',filters:{counterparty:'',currency:'',minGross:null,maxGross:null,type:'',status:''}};
 const currencies=new Map();let count=0;
 for(const r of rows){if(!matches(r,periodQuery))continue;count++;if(!/^[A-Z]{3}$/.test(r.currency||''))continue;let c=currencies.get(r.currency);if(!c){c={code:r.currency,count:0,min:null,max:null};currencies.set(r.currency,c);}c.count++;const gross=grossValue(r.gross);if(gross!==null){c.min=c.min===null?gross:Math.min(c.min,gross);c.max=c.max===null?gross:Math.max(c.max,gross);}}
 return {count,currencies:[...currencies.values()].sort((a,b)=>a.code.localeCompare(b.code))};
}
async function queryArchive(archive,input,{all=false}={}){const q=validateQuery(input);if(q.role!==archive.role)throw new Error('INVALID_ROLE');const records=await archive.checkedList();const rows=records.map(r=>row(r,q.role));const result=sortRows(rows.filter(r=>matches(r,q)),q);const fileCounts={ready:0,xmlOnly:0,damaged:0};for(const r of result)fileCounts[r.status==='ready'?'ready':r.status==='xml-only'?'xmlOnly':'damaged']++;return {fileCounts,history:archive.state.history||null,rows:all?result:result.slice((q.page-1)*q.pageSize,q.page*q.pageSize),facets:filterFacets(rows,q),summary:summarizeRows(result),total:result.length,archiveTotal:records.length,page:q.page,pageSize:q.pageSize,folder:archive.root,coverage:archive.state.coverage||[],lastRun:archive.state.lastRun||null};}
function validateView(input){if(!input||typeof input!=='object'||!Array.isArray(input.columns)||input.columns.length!==COLUMN_IDS.length||new Set(input.columns).size!==COLUMN_IDS.length||input.columns.some(x=>!COLUMN_IDS.includes(x))||!Array.isArray(input.hidden)||new Set(input.hidden).size!==input.hidden.length||input.hidden.some(x=>!COLUMN_IDS.includes(x))||input.hidden.length===COLUMN_IDS.length||![50,100].includes(input.pageSize))throw new Error('INVALID_VIEW');return {columns:[...input.columns],hidden:[...input.hidden],pageSize:input.pageSize};}
function selectExportRows(rows,ids,excludeIds){
 if(ids!==undefined&&excludeIds!==undefined)throw new Error('INVALID_SELECTION');
 const list=ids!==undefined?ids:excludeIds;if(list===undefined)return rows;
 if(!Array.isArray(list)||(ids!==undefined&&list.length===0)||list.length>50000||list.some(id=>typeof id!=='string')||new Set(list).size!==list.length)throw new Error('INVALID_SELECTION');
 const allowed=new Set(rows.map(x=>x.id));if(list.some(id=>!allowed.has(id)))throw new Error('INVALID_SELECTION');
 const selected=new Set(list);return rows.filter(x=>ids!==undefined?selected.has(x.id):!selected.has(x.id));
}
async function summarizeArchive(archive,request){if(!request||typeof request!=='object'||Array.isArray(request))throw new Error('INVALID_QUERY');const result=await queryArchive(archive,request.query,{all:true});return summarizeRows(selectExportRows(result.rows,request.ids,request.excludeIds));}
module.exports={COLUMN_IDS,DEFAULT_VIEW,role,date,monthDates,validateQuery,queryArchive,validateView,selectExportRows,summarizeArchive};
