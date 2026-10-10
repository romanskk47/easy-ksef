const test=require('node:test');const assert=require('node:assert/strict');
const {summarizeRows}=require('../app/invoice-summary.cjs');
const {queryArchive,summarizeArchive}=require('../app/browse.cjs');
const rows=Array.from({length:120},(_,i)=>({id:'I'+i,number:'FV/'+i,date:'2026-09-01',gross:i===119?-0.01:0.1,currency:i<100?'PLN':'EUR',status:'ready',seller:'Firma testowa'}));
const archive={role:'purchase',root:'/fictional',state:{},checkedList:async()=>rows};
const query={role:'purchase',period:{kind:'month',month:'2026-09'},page:2,pageSize:50};
test('Summary spans all filtered pages; currency totals never mix',async()=>{
 const r=await queryArchive(archive,query);assert.equal(r.rows.length,50);assert.equal(r.summary.count,120);
 assert.deepEqual(r.summary.byCurrency,[{currency:'EUR',count:20,gross:'1.89',missingAmounts:0},{currency:'PLN',count:100,gross:'10.00',missingAmounts:0}]);
 const f=await queryArchive(archive,{...query,filters:{currency:'EUR'}});assert.equal(f.summary.count,20);assert.equal(f.rows.length,0);assert.equal(f.summary.byCurrency[0].gross,'1.89');
});
test('Selected IDs on different pages and all-results exclusions use export selection rules',async()=>{
 const r=await summarizeArchive(archive,{query,ids:['I0','I119']});assert.equal(r.count,2);assert.deepEqual(r.byCurrency.map(g=>[g.currency,g.gross]),[['EUR','-0.01'],['PLN','0.10']]);
 const all=await summarizeArchive(archive,{query,excludeIds:['I0','I119']});assert.equal(all.count,118);assert.deepEqual(all.byCurrency.map(g=>[g.currency,g.gross]),[['EUR','1.90'],['PLN','9.90']]);
 await assert.rejects(()=>summarizeArchive(archive,{query:{...query,filters:{currency:'EUR'}},ids:['I0']}),/INVALID_SELECTION/);
 await assert.rejects(()=>summarizeArchive(archive,{query,ids:['I0'],excludeIds:['I1']}),/INVALID_SELECTION/);
 await assert.rejects(()=>summarizeArchive({...archive,role:'sales'},{query}),/INVALID_ROLE/);
});
test('Decimal sum retains cents beyond safe integer totals and avoids floating-point accumulation',()=>{
 const input=Array.from({length:100},()=>({gross:999999999999.99,currency:'PLN'}));
 assert.equal(summarizeRows(input).byCurrency[0].gross,'99999999999999.00');
 assert.equal(summarizeRows([{gross:0.1,currency:'PLN'},{gross:0.2,currency:'PLN'},{gross:-0.3,currency:'PLN'}]).byCurrency[0].gross,'0.00');
 assert.equal(summarizeRows([{gross:1e-7,currency:'PLN'},{gross:0.005,currency:'PLN'}]).byCurrency[0].gross,'0.01');
});
test('Unknown currencies and missing amounts never masquerade as complete totals',()=>{
 const r=summarizeRows([{gross:10,currency:'EUR'},{gross:null,currency:'EUR'},{gross:999,currency:''},{gross:NaN,currency:'PLN'}]);
 assert.equal(r.count,4);assert.equal(r.unknownCurrency,1);assert.equal(r.missingAmounts,2);
 assert.deepEqual(r.byCurrency,[{currency:'EUR',count:2,gross:'10.00',missingAmounts:1},{currency:'PLN',count:1,gross:null,missingAmounts:1}]);
});
test('Empty filter result or all-results exclusions has an honest empty summary',async()=>{
 assert.deepEqual(summarizeRows([]),{count:0,unknownCurrency:0,missingAmounts:0,byCurrency:[]});
 const r=await summarizeArchive(archive,{query,excludeIds:rows.map(r=>r.id)});assert.equal(r.count,0);assert.equal(r.byCurrency.length,0);
 const f=await queryArchive(archive,{...query,search:'no matching invoices'});assert.equal(f.summary.count,0);
});
