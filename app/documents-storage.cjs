'use strict';
const fs=require('node:fs/promises');
const {createReadStream,constants}=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {documentsPath,environment}=require('./profile.cjs');
const {validNip}=require('./archive.cjs');

async function optionalStat(file){try{return await fs.lstat(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
async function fingerprint(file){const digest=crypto.createHash('sha256');for await(const chunk of createReadStream(file))digest.update(chunk);return digest.digest('hex');}
function nested(parent,child){const relative=path.relative(parent,child);return relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative));}
async function prepareDocumentsFolder(value){
 const selected=documentsPath(value);
 try{
  await fs.mkdir(selected,{recursive:true,mode:0o700});const folder=await fs.realpath(selected);
  const probe=path.join(folder,`.easy-ksef-write-check-${crypto.randomUUID()}`);let handle;
  try{handle=await fs.open(probe,'wx',0o600);await handle.writeFile('');await handle.sync();}finally{if(handle)await handle.close();await fs.rm(probe,{force:true});}
  return folder;
 }catch(e){throw new Error('DOCUMENTS_FOLDER_UNAVAILABLE',{cause:e});}
}
async function safeDirectoryTree(base,relative,create=false){
 let current=base;for(const segment of relative.split(path.sep).filter(Boolean)){
  current=path.join(current,segment);let stat=await optionalStat(current);
  if(!stat&&create){try{await fs.mkdir(current,{mode:0o700});}catch(e){if(e.code!=='EEXIST')throw e;}stat=await optionalStat(current);}
  if(!stat)return false;if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('UNSAFE_DOCUMENTS_FOLDER');
 }return true;
}
async function collect(root,relative=''){
 const records=[];for(const entry of await fs.readdir(path.join(root,relative),{withFileTypes:true})){
  const name=path.join(relative,entry.name),file=path.join(root,name),stat=await fs.lstat(file);
  if(stat.isSymbolicLink())throw new Error('UNSAFE_DOCUMENTS_FOLDER');
  if(stat.isDirectory())records.push(...await collect(root,name));
  else if(stat.isFile())records.push({name,size:stat.size,hash:await fingerprint(file)});
  else throw new Error('UNSAFE_DOCUMENTS_FOLDER');
 }return records;
}
async function sameFile(file,record){const stat=await optionalStat(file);if(!stat)return false;if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==record.size||await fingerprint(file)!==record.hash)throw new Error('DOCUMENTS_FOLDER_CONFLICT');return true;}

// Copies only the configured entity/environment. Originals are retained even if copying fails.
async function copyScopedArchive({sourceBase,destinationBase,nip,environment:selectedEnvironment}){
 if(!validNip(nip))throw new Error('INVALID_NIP');environment(selectedEnvironment);
 let source=documentsPath(sourceBase);try{source=await fs.realpath(source);}catch(e){if(e.code!=='ENOENT')throw e;}
 const destination=await prepareDocumentsFolder(destinationBase);
 if(source===destination)return {path:destination,copiedFiles:0};
 if(nested(source,destination)||nested(destination,source))throw new Error('NESTED_DOCUMENTS_FOLDER');
 const scope=path.join(selectedEnvironment==='prod'?'Produkcja':'Test',nip),from=path.join(source,scope),to=path.join(destination,scope);
 if(!await safeDirectoryTree(source,scope))return {path:destination,copiedFiles:0};
 const records=await collect(from);
 // Inspect all collisions before copying any document.
 for(const record of records){await safeDirectoryTree(destination,path.join(scope,path.dirname(record.name)));await sameFile(path.join(to,record.name),record);}
 let copiedFiles=0;
 for(const record of records){
  await safeDirectoryTree(destination,path.join(scope,path.dirname(record.name)),true);
  const target=path.join(to,record.name);if(await sameFile(target,record))continue;
  const temporary=target+`.${crypto.randomUUID()}.copying`;
  try{
   await fs.copyFile(path.join(from,record.name),temporary,constants.COPYFILE_EXCL);await fs.chmod(temporary,0o600);
   if(!await sameFile(temporary,record))throw new Error('DOCUMENTS_COPY_FAILED');
   try{await fs.copyFile(temporary,target,constants.COPYFILE_EXCL);copiedFiles++;}catch(e){if(e.code!=='EEXIST')throw e;await sameFile(target,record);}
  }finally{await fs.rm(temporary,{force:true});}
 }
 // Re-check both ends before allowing the caller to switch the profile.
 for(const record of records){if(!await sameFile(path.join(from,record.name),record)||!await sameFile(path.join(to,record.name),record))throw new Error('DOCUMENTS_COPY_FAILED');}
 return {path:destination,copiedFiles};
}
module.exports={prepareDocumentsFolder,copyScopedArchive};
