const test=require('node:test');const assert=require('node:assert/strict');
const {createCompanyLookup,warsawDate}=require('../app/company-lookup.cjs');
const {attachCompanyForm}=require('../app/company-form.js');
const nip='6808208874',other='5252674798';
const response=subject=>new Response(JSON.stringify({result:{subject}}),{headers:{'Content-Type':'application/json'}});
const now=()=>new Date('2026-10-08T08:00:00Z');
test('lookup checks NIP before sending, matches returned identity, and exposes only onboarding fields',async()=>{
 let calls=0;const lookup=createCompanyLookup({now,fetcher:async(url,options)=>{calls++;assert.equal(url,'https://wl-api.mf.gov.pl/api/search/nip/6808208874?date=2026-10-08');assert.equal(options.redirect,'error');return response({nip,name:'Firma',workingAddress:'Adres',pesel:'secret',accountNumbers:['secret'],representatives:['secret']});}});
 await assert.rejects(lookup('5070096478'),/INVALID_NIP/);assert.equal(calls,0);
 const result=await lookup('680-820-88-74');assert.equal(result.name,'Firma');assert.ok(!JSON.stringify(result).includes('secret'));
 result.name='Changed';assert.equal((await lookup(nip)).name,'Firma');assert.equal(calls,1);
 const wrong=createCompanyLookup({now,fetcher:async()=>response({nip:other,name:'Inna'})});await assert.rejects(wrong(nip),/COMPANY_INVALID_RESPONSE/);
});
test('lookup distinguishes absent company, rate limit, malformed data and network failure',async()=>{
 assert.equal((await createCompanyLookup({now,fetcher:async()=>response(null)})(nip)).found,false);
 for(const [fetcher,code] of [[async()=>new Response('',{status:429}),'COMPANY_RATE_LIMIT'],[async()=>new Response('{}'),'COMPANY_INVALID_RESPONSE'],[async()=>{throw new Error('token must never escape');},'COMPANY_UNAVAILABLE']])await assert.rejects(createCompanyLookup({now,fetcher})(nip),new RegExp(code));
 assert.equal(warsawDate(new Date('2026-10-07T22:30:00Z')),'2026-10-08');
});
function element(){return {value:'',hidden:false,readOnly:false,textContent:'',classList:{toggle(){}},events:{},addEventListener(event,fn){this.events[event]=fn;}};}
function form(lookup){const fields={nip:element(),name:element(),token:element(),status:element(),details:element(),retry:element()};return {...fields,controller:attachCompanyForm({...fields,lookup,delay:10000})};}
test('changing company clears prior identity and token; stale responses cannot overwrite new company',async()=>{
 let finishOld;const f=form(value=>value===nip?new Promise(resolve=>finishOld=resolve):Promise.resolve({found:true,name:'Allegro',address:'Adres',source:'MF'}));
 f.nip.value=nip;f.nip.events.input();const old=f.controller.run();f.token.value='unsaved-token';
 f.nip.value=other;f.nip.events.input();assert.equal(f.token.value,'');assert.equal(f.name.value,'');await f.controller.run();
 finishOld({found:true,name:'Poprzednia firma',source:'MF'});await old;assert.equal(f.name.value,'Allegro');assert.equal(f.details.textContent,'Adres');
});
test('invalid NIP makes no request; unavailable registry permits manual fallback and retry',async()=>{
 let calls=0;const f=form(async()=>{calls++;if(calls===1)throw new Error('Rejestr nie odpowiada.');return {found:true,name:'Firma',source:'MF'};});
 f.nip.value='5070096478';f.nip.events.input();await f.controller.run();assert.equal(calls,0);assert.match(f.status.textContent,/nieprawidłowa/);
 f.nip.value=nip;f.nip.events.input();await f.controller.run();assert.equal(f.name.readOnly,false);assert.equal(f.retry.hidden,false);assert.match(f.status.textContent,/ręcznie/);
 f.retry.events.click();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.name.value,'Firma');assert.equal(f.retry.hidden,true);
});
