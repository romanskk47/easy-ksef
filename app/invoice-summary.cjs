'use strict';

// Add decimal representations of the stored KSeF amounts without binary-float
// accumulation. No exchange rates, payment balances or VAT estimates are inferred.
function decimal(value){
 if(typeof value!=='number'||!Number.isFinite(value))return null;
 const [mantissa,exponent='0']=String(value).toLowerCase().split('e');
 const [whole,fraction='']=mantissa.split('.');
 let units=BigInt(whole+fraction),scale=fraction.length-Number(exponent);
 if(scale<0){units*=10n**BigInt(-scale);scale=0;}
 return {units,scale};
}
function fixedAmount({units,scale}){
 if(scale<2)units*=10n**BigInt(2-scale);
 else if(scale>2){const divisor=10n**BigInt(scale-2);const sign=units<0n?-1n:1n;const absolute=units*sign;units=sign*(absolute/divisor+(absolute%divisor*2n>=divisor?1n:0n));}
 const absolute=units<0n?-units:units;
 return `${units<0n?'-':''}${absolute/100n}.${String(absolute%100n).padStart(2,'0')}`;
}
function summarizeRows(rows){
 const groups=new Map();let unknownCurrency=0,missingAmounts=0;
 for(const row of rows){
  if(typeof row.currency!=='string'||!/^[A-Z]{3}$/.test(row.currency)){unknownCurrency++;continue;}
  let group=groups.get(row.currency);if(!group){group={currency:row.currency,count:0,units:0n,scale:0,missingAmounts:0};groups.set(row.currency,group);}
  group.count++;const amount=decimal(row.gross);
  if(!amount){group.missingAmounts++;missingAmounts++;continue;}
  const scale=Math.max(group.scale,amount.scale);
  group.units=group.units*10n**BigInt(scale-group.scale)+amount.units*10n**BigInt(scale-amount.scale);group.scale=scale;
 }
 return {count:rows.length,unknownCurrency,missingAmounts,byCurrency:[...groups.values()].sort((a,b)=>a.currency.localeCompare(b.currency)).map(group=>({currency:group.currency,count:group.count,gross:group.count===group.missingAmounts?null:fixedAmount(group),missingAmounts:group.missingAmounts}))};
}
module.exports={summarizeRows};
