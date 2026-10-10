'use strict';
const fs=require('node:fs/promises');const path=require('node:path');
// Treat the selected base as intentional (it may itself be an OS alias), but
// reject pre-existing links/junctions within company archives. The folder must
// remain private: portable Node APIs cannot prevent races with another writer.
async function guardedPath(base,target,{create=false,directory=false}={}){
 const relative=path.relative(base,target);
 if(relative==='..'||relative.startsWith('..'+path.sep)||path.isAbsolute(relative))throw Error('INVALID_ARCHIVE_PATH');
 if(create)await fs.mkdir(base,{recursive:true,mode:0o700});
 let root;try{root=await fs.realpath(base);}catch(error){if(error.code==='ENOENT'&&!create)return target;throw error;}
 let current=root;const parts=relative.split(path.sep).filter(Boolean);
 for(let i=0;i<parts.length;i++){
  current=path.join(current,parts[i]);const isDirectory=i<parts.length-1||directory;
  let stat;try{stat=await fs.lstat(current);}catch(error){if(error.code!=='ENOENT')throw error;}
  if(!stat&&isDirectory&&create){try{await fs.mkdir(current,{mode:0o700});}catch(error){if(error.code!=='EEXIST')throw error;}stat=await fs.lstat(current);}
  if(stat&&(stat.isSymbolicLink()||(isDirectory?!stat.isDirectory():!stat.isFile())))throw Error('UNSAFE_DOCUMENTS_FOLDER');
 }
 return current;
}
module.exports={guardedPath};
