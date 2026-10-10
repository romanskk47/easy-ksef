const test=require('node:test');const assert=require('node:assert/strict');
test('Polish amount entry, unbounded ends and malformed input',async()=>{
 const {parseAmount,normalizedFilters,queryFilters,cleanFilters}=await import('../ui/lib/invoice-filters.mjs');
 assert.equal(parseAmount('1 234,56'),1234.56);assert.equal(parseAmount('-12,34'),-12.34);assert.equal(parseAmount('1\u202f234.50'),1234.5);assert.equal(parseAmount(''),null);assert.equal(parseAmount('0'),0);
 for(const value of ['1,234.56','1e3','12,345','NaN','-','1,2,3'])assert.throws(()=>parseAmount(value));
 assert.throws(()=>normalizedFilters({...cleanFilters,minGross:'10',maxGross:'9'}));
 assert.deepEqual(queryFilters({...cleanFilters,currency:'EUR',maxGross:'1 234,56'}),{currency:'EUR',maxGross:1234.56});
});
test('Amounts have one currency, with an explicit multi-currency choice',async()=>{
 const {amountCurrency,filterChips,cleanFilters}=await import('../ui/lib/invoice-filters.mjs');
 const pln={code:'PLN',count:100,min:-50,max:1000},eur={code:'EUR',count:20,min:10,max:20};
 assert.equal(amountCurrency({count:120,currencies:[pln,eur]},''),null);assert.equal(amountCurrency({count:120,currencies:[pln,eur]},'EUR'),eur);assert.equal(amountCurrency({count:100,currencies:[pln]},''),pln);
 assert.equal(amountCurrency({count:101,currencies:[pln]},''),null);
 const chips=filterChips({...cleanFilters,currency:'PLN',minGross:'0',maxGross:'1000'});assert.equal(chips.length,2);assert.deepEqual(chips[0].keys,['currency','minGross','maxGross']);assert.match(chips[1].label,/0–1.*000 PLN/);
});
