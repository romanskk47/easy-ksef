export const COLUMNS = [
 {id:'counterparty',label:'Kontrahent',sort:'counterparty'},
 {id:'number',label:'Numer faktury',sort:'number'},
 {id:'date',label:'Data wystawienia',sort:'date'},
 {id:'gross',label:'Brutto',sort:'gross'},
 {id:'currency',label:'Waluta'},
 {id:'id',label:'Numer KSeF',sort:'id'},
 {id:'status',label:'Pliki'},
 {id:'counterpartyNip',label:'NIP kontrahenta'},
 {id:'type',label:'Rodzaj'},
 {id:'acDate',label:'Otrzymano w KSeF'},
];
export const DEFAULT_VIEW={columns:COLUMNS.map(c=>c.id),hidden:['counterpartyNip','currency','id','type','acDate'],pageSize:50};
export function moveColumn(columns,id,offset){const index=columns.indexOf(id);const to=index+offset;if(index<0||to<0||to>=columns.length)return columns;const next=[...columns];next.splice(index,1);next.splice(to,0,id);return next;}
export function dropColumn(columns,id,before){const from=columns.indexOf(id),to=columns.indexOf(before);if(from<0||to<0||from===to)return columns;const next=columns.filter(c=>c!==id);next.splice(next.indexOf(before),0,id);return next;}
export function checkedView(value){const known=COLUMNS.map(c=>c.id);const saved=Array.isArray(value?.columns)?value.columns.filter(c=>known.includes(c)):[];return{columns:[...new Set([...saved,...known])],hidden:Array.isArray(value?.hidden)?[...new Set(value.hidden.filter(c=>known.includes(c)))]:DEFAULT_VIEW.hidden,pageSize:value?.pageSize===100?100:50};}
export function statusLabel(value){return value==='ready'?'Zapisane PDF + XML':value==='xml-only'?'Brak PDF':value==='damaged'?'Sprawdź pliki':value==='pdf-pending'?'PDF w przygotowaniu':'Sprawdź pliki';}
export function typeLabel(value){const labels={Vat:'Faktura',Kor:'Korekta',Zal:'Zaliczka',Roz:'Rozliczeniowa',Upr:'Uproszczona',KorZal:'Korekta zaliczki',KorRoz:'Korekta rozliczenia',VAT:'Faktura',KOR:'Korekta',ZAL:'Zaliczka',ROZ:'Rozliczeniowa',UPR:'Uproszczona'};return labels[value]||value||'—';}
export function monthOf(date=new Date()){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit'}).format(date);}
export function previousMonth(month){const [y,m]=month.split('-').map(Number);return new Date(Date.UTC(y,m-2,1)).toISOString().slice(0,7);}
