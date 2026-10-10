const test=require('node:test');const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const path=require('node:path');
const {createBridgeRunner}=require('../app/bridge-runner.cjs');
function runner(script){const children=new Set();return {children,run:createBridgeRunner({getPath:()=>process.execPath,spawnChild:()=>spawn(process.execPath,['-e',script],{stdio:['pipe','pipe','pipe']}),onStart:child=>children.add(child),onClose:child=>children.delete(child)})};}
const stall='process.stdin.resume();console.log(JSON.stringify({type:"progress",stage:"connecting"}));setInterval(()=>{},1000);';
test('unresponsive helper ends within deadline, child closes and next attempt can run',async()=>{
 const r=runner(stall);const started=Date.now();await assert.rejects(r.run({op:'probe',token:'DUMMY'},undefined,{timeoutMs:70}),/TIMEOUT/);assert.ok(Date.now()-started<1500);
 await new Promise(resolve=>setTimeout(resolve,100));assert.equal(r.children.size,0);
 await assert.rejects(r.run({op:'probe'},undefined,{timeoutMs:70}),/TIMEOUT/);
});
test('cancel rejects promptly and does not emit connected or save credentials',async()=>{
 const r=runner(stall);const controller=new AbortController();let progress=0;
 const result=r.run({op:'probe'},message=>{progress++;assert.equal(message.stage,'connecting');controller.abort();},{signal:controller.signal,timeoutMs:3000});
 await assert.rejects(result,/CANCELLED/);assert.equal(progress,1);await new Promise(resolve=>setTimeout(resolve,100));assert.equal(r.children.size,0);
});
test('download cancellation stops helper after a saved invoice and preserves the completed listener write',async()=>{
 const r=runner('process.stdin.resume();console.log(JSON.stringify({type:"invoice",id:"saved"}));setInterval(()=>{},1000);');
 const controller=new AbortController();const saved=[];
 const result=r.run({op:'download'},async message=>{saved.push(message.id);controller.abort();},{signal:controller.signal,timeoutMs:3000});
 await assert.rejects(result,/CANCELLED/);assert.deepEqual(saved,['saved']);await new Promise(resolve=>setTimeout(resolve,100));assert.equal(r.children.size,0);
});
test('valid response passes; partial response, invalid JSON and missing binary fail without hanging',async()=>{
 const good=runner('process.stdin.resume();process.stdin.on("end",()=>console.log(JSON.stringify({type:"connected",environment:"test"})));');assert.equal((await good.run({op:'probe'},undefined,{timeoutMs:1000})).type,'connected');
 const empty=runner('process.stdin.resume();');await assert.rejects(empty.run({op:'probe'},undefined,{timeoutMs:1000}),/INCOMPLETE_DOWNLOAD/);
 const bad=runner('process.stdin.resume();console.log("not-json");');await assert.rejects(bad.run({op:'probe'},undefined,{timeoutMs:1000}));
 const missing=createBridgeRunner({getPath:()=>path.join(__dirname,'does-not-exist')});await assert.rejects(missing({op:'probe'},undefined,{timeoutMs:1000}),/BRIDGE_UNAVAILABLE/);
});
test('mid-write cancellation does not release the caller while archive writes are active',async()=>{
 const r=runner('process.stdin.resume();console.log(JSON.stringify({type:"invoice",id:"first"}));console.log(JSON.stringify({type:"invoice",id:"buffered"}));setInterval(()=>{},1000);');
 const controller=new AbortController();let active=false,finished=false;const received=[];
 const result=r.run({op:'download'},async message=>{received.push(message.id);active=true;setTimeout(()=>controller.abort(),20);await new Promise(resolve=>setTimeout(resolve,150));finished=true;active=false;},{signal:controller.signal,timeoutMs:3000});
 await assert.rejects(result,/CANCELLED/);assert.equal(active,false);assert.equal(finished,true);assert.deepEqual(received,['first']);assert.equal(r.children.size,0);
});
test('cancellation stops buffered invoices even when the helper already exited',async()=>{
 const r=runner('console.log(JSON.stringify({type:"invoice",id:"first"}));console.log(JSON.stringify({type:"invoice",id:"buffered"}));');
 const controller=new AbortController();const received=[];
 const result=r.run({op:'download'},async message=>{received.push(message.id);await new Promise(resolve=>setTimeout(resolve,80));assert.equal(r.children.size,0);controller.abort();await new Promise(resolve=>setTimeout(resolve,30));},{signal:controller.signal,timeoutMs:3000});
 await assert.rejects(result,/CANCELLED/);assert.deepEqual(received,['first']);assert.equal(r.children.size,0);
});
