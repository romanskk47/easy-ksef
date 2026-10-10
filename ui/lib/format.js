export const dateLabel=value=>value?String(value).slice(0,10).split('-').reverse().join('.'):'—';
export const timestampLabel=value=>{if(!value)return '—';try{return new Intl.DateTimeFormat('pl-PL',{timeZone:'Europe/Warsaw',dateStyle:'short',timeStyle:'short'}).format(new Date(value));}catch{return '—';}};
export const monthLabel=value=>{const[y,m]=value.split('-');return new Intl.DateTimeFormat('pl-PL',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(+y,+m-1,1)));};
export const money=(value,currency)=>{try{return new Intl.NumberFormat('pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value));}catch{return String(value)+' '+currency;}};
export const roleLabel=role=>role==='sales'?'sprzedażowe':'zakupowe';
