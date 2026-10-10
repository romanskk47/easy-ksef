'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {queryArchive,selectExportRows,summarizeArchive}=require('../app/browse.cjs');
test('Whole-result query/export and sums include every one of 12,501 invoices across 251 pages',async()=>{
 const records=Array.from({length:12501},(_,i)=>({id:'SYNTHETIC-'+i,number:'FV/'+i,date:'2026-09-30',seller:'Fikcyjny dostawca',sellerNip:'6808208874',gross:i%2?-1.23:1.23,currency:i%3?'PLN':'EUR',status:'ready'}));
 const archive={role:'purchase',root:'/synthetic-unused',state:{},checkedList:async()=>records};
 const query={role:'purchase',period:{kind:'all'},page:251,pageSize:50};
 const page=await queryArchive(archive,query);assert.equal(page.total,12501);assert.equal(page.rows.length,1);assert.equal(page.summary.count,12501);
 const all=await queryArchive(archive,query,{all:true});assert.equal(all.rows.length,12501);assert.equal(new Set(all.rows.map(r=>r.id)).size,12501);
 const selected=selectExportRows(all.rows,undefined,['SYNTHETIC-0']);assert.equal(selected.length,12500);
 const summary=await summarizeArchive(archive,{query,excludeIds:['SYNTHETIC-0']});assert.equal(summary.count,12500);assert.equal(summary.byCurrency.length,2);assert.equal(summary.byCurrency.find(x=>x.currency==='EUR').gross,'0.00');assert.equal(summary.byCurrency.find(x=>x.currency==='PLN').gross,'0.00');
});
