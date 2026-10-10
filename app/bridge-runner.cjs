'use strict';
const {spawn}=require('node:child_process');const readline=require('node:readline');
function createBridgeRunner({getPath,onStart=()=>{},onClose=()=>{},spawnChild=spawn}) {
 return async function runBridge(input,listener=async()=>{},{signal,timeoutMs=input.op==='probe'?75000:input.op==='download'?2*60*60*1000:30000}={}) {
  if(signal?.aborted)throw new Error('CANCELLED');
  const child=spawnChild(getPath(),[],{stdio:['pipe','pipe','pipe'],windowsHide:true});onStart(child);
  let forceKill,abortReject,stopping=false;
  const completion=new Promise(resolve=>child.once('close',code=>{clearTimeout(forceKill);onClose(child);resolve(code);}));
  const interruption=new Promise((_resolve,reject)=>{abortReject=reject;});
  const lines=readline.createInterface({input:child.stdout,crlfDelay:Infinity});
  child.stderr.resume();child.stdin.on('error',()=>{});child.stdin.end(JSON.stringify(input)+'\n');
  function stop(code) {
   if(stopping)return;stopping=true;
   if(child.exitCode===null&&child.signalCode===null){
    child.kill('SIGTERM');
    forceKill=setTimeout(()=>child.kill('SIGKILL'),1000);forceKill.unref?.();
   }
   lines.close();child.stdout.destroy();child.stderr.destroy();child.stdin.destroy();
   abortReject(new Error(code));
  }
  const abort=()=>stop('CANCELLED');signal?.addEventListener('abort',abort,{once:true});
  child.once('error',()=>stop('BRIDGE_UNAVAILABLE'));
  // The download watchdog matches the helper's full multi-package deadline.
  const timer=timeoutMs>0?setTimeout(()=>stop('TIMEOUT'),timeoutMs):null;
  const work=(async()=>{
   let result=null,bridgeError=null;
   for await(const line of lines) {
    if(stopping)break;
    if(line.length>30*1024*1024)throw new Error('INVALID_BRIDGE_RESPONSE');
    const message=JSON.parse(line);
    if(message.type==='error')bridgeError=new Error(message.code);
    else {await listener(message);if(['connected','done','validated','health'].includes(message.type))result=message;}
   }
   const code=await completion;if(bridgeError)throw bridgeError;
   if(code!==0||!result)throw new Error('INCOMPLETE_DOWNLOAD');return result;
  })();
  try {return await Promise.race([work,interruption]);}
  catch(error){
   if(child.exitCode===null && child.signalCode===null)stop(error.message);
   // An invoice listener may still be writing XML/PDF. Keep the caller's lock
   // until it settles, so retry or folder migration cannot race a stale Archive.
   await Promise.allSettled([work,completion]);
   throw error;
  }
  finally {clearTimeout(timer);signal?.removeEventListener('abort',abort);lines.close();}
 };
}
module.exports={createBridgeRunner};
