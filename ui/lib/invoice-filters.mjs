export const cleanFilters={counterparty:'',currency:'',minGross:'',maxGross:'',type:'',status:''};
export function parseAmount(value){
 const text=String(value??'').trim().replace(/[\s\u00a0\u202f]/g,'').replace(',','.');
 if(!text)return null;
 if(!/^-?\d+(?:\.\d{0,2})?$/.test(text))throw new Error('Wpisz kwotę, np. 1 234,56. Możesz użyć wartości ujemnej.');
 const n=Number(text);if(!Number.isFinite(n)||Math.abs(n)>1e15)throw new Error('Wpisz mniejszą kwotę.');return n;
}
export function normalizedFilters(filters){
 const result={...cleanFilters,...filters};
 for(const key of ['minGross','maxGross']){const n=parseAmount(result[key]);result[key]=n===null?'':String(n);}
 if(result.minGross!==''&&result.maxGross!==''&&Number(result.minGross)>Number(result.maxGross))throw new Error('Kwota „Od” nie może być większa niż kwota „Do”.');
 return result;
}
export const queryFilters=filters=>Object.fromEntries(Object.entries(normalizedFilters(filters)).filter(([,v])=>v!=='').map(([k,v])=>[k,k==='minGross'||k==='maxGross'?Number(v):v]));
export function amountCurrency(facets,currency){const currencies=facets?.currencies||[];return currency?currencies.find(c=>c.code===currency):currencies.length===1&&currencies[0].count===facets.count?currencies[0]:null;}
export function filterChips(filters){
 const chips=[];
 if(filters.counterparty)chips.push({keys:['counterparty'],label:'Kontrahent: '+filters.counterparty});
 if(filters.currency)chips.push({keys:['currency','minGross','maxGross'],label:'Waluta: '+filters.currency});
 if(filters.minGross!==''||filters.maxGross!==''){const format=v=>new Intl.NumberFormat('pl-PL',{maximumFractionDigits:2}).format(Number(v));chips.push({keys:['minGross','maxGross'],label:'Brutto: '+(filters.minGross!==''&&filters.maxGross!==''?`${format(filters.minGross)}–${format(filters.maxGross)}`:filters.minGross!==''?'od '+format(filters.minGross):'do '+format(filters.maxGross))+(filters.currency?' '+filters.currency:'')});}
 if(filters.type)chips.push({keys:['type'],label:({regular:'Zwykłe faktury',correction:'Korekty',Zal:'Zaliczki',Roz:'Rozliczeniowe',Upr:'Uproszczone',unknown:'Rodzaj nieznany'})[filters.type]||filters.type});
 if(filters.status)chips.push({keys:['status'],label:({ready:'Kompletne PDF i XML',attention:'Wymagają naprawy','xml-only':'Brak PDF',damaged:'Brakujące lub uszkodzone'})[filters.status]||filters.status});
 return chips;
}
