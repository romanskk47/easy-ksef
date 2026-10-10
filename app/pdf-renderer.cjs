"use strict";
// A malformed invoice must not hold the operation lock forever. Destroying the
// isolated renderer also settles Chromium work before the next attempt.
function createPdfRenderer({createWindow,file,timeoutMs=45000}){
 let window;
 const dispose=()=>{const old=window;window=null;if(old&&!old.isDestroyed())old.destroy();};
 const render=async(xml,id,options)=>{
  let timer;
  const work=(async()=>{
   if(!window||window.isDestroyed()){
    window=createWindow();
    window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
    window.webContents.on('will-navigate',event=>event.preventDefault());
    await window.loadFile(file);
   }
   const result=await window.webContents.executeJavaScript(`window.renderInvoice(${JSON.stringify(xml.toString('base64'))},${JSON.stringify(id)},${JSON.stringify(options)})`);
   return Buffer.from(result,'base64');
  })();
  try{return await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>{dispose();reject(new Error('PDF_TIMEOUT'));},timeoutMs);})]);}
  catch(error){dispose();throw error;}
  finally{clearTimeout(timer);}
 };
 render.dispose=dispose;return render;
}
module.exports={createPdfRenderer};
