const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
test('client distinguishes cancellation from failure and rejects results after a company switch',async t=>{
 const prior=global.window;t.after(()=>{global.window=prior;});
 const source=await fs.readFile(path.join(__dirname,'../ui/lib/client.js'),'utf8');
 const {api,setClientProfile}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 setClientProfile({environment:'test',nip:'6808208874'});
 global.window={easyKsef:{download:async()=>({ok:false,error:'Przerwano',code:'CANCELLED'})}};
 await assert.rejects(api('download'),e=>e.code==='CANCELLED'&&e.message==='Przerwano');
 window.easyKsef.download=async()=>({ok:false,error:'Brak połączenia',code:'INTERNAL_DETAIL'});
 await assert.rejects(api('download'),e=>e.code===undefined&&e.message==='Brak połączenia');
 window.easyKsef.download=async()=>{setClientProfile({environment:'test',nip:'5265877635'});return {ok:true,value:{saved:12}};};
 await assert.rejects(api('download'),/Wybrana firma zmieniła się/);
});
