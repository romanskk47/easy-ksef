const {contextBridge,ipcRenderer}=require('electron');
const methods=['cancel','company','status','configure','selectCompany','chooseDocumentsFolder','changeDocumentsFolder','download','query','summary','getView','saveView','exportExcel','exportZip','exportPdfZip','list','folder','pdf','excel','guide','sample'];
contextBridge.exposeInMainWorld('easyKsef',{
 ...Object.fromEntries(methods.map(method=>[method,(...args)=>ipcRenderer.invoke(method,...args)])),
 onProfileChange:listener=>{const handler=()=>listener();ipcRenderer.on('profile-changed',handler);return()=>ipcRenderer.removeListener('profile-changed',handler);},
 onProgress:listener=>{const handler=(_event,data)=>listener(data);ipcRenderer.on('progress',handler);return()=>ipcRenderer.removeListener('progress',handler);},
});
