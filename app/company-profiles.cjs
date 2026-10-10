'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const {checkedProfile,environment}=require('./profile.cjs');
const {validNip,atomicWrite}=require('./archive.cjs');

function profileId(p){environment(p?.environment);if(!validNip(p?.nip))throw new Error('INVALID_PROFILE');return `${p.environment}/${p.nip}`;}
function checkedRegistry(value){
 if(value?.version!==1||!Array.isArray(value.profiles)||!value.profiles.length)throw new Error('INVALID_PROFILES');
 const profiles=value.profiles.map(checkedProfile),ids=profiles.map(profileId);
 if(new Set(ids).size!==ids.length||!ids.includes(value.activeId))throw new Error('INVALID_PROFILES');
 return {version:1,activeId:value.activeId,profiles};
}
// The previous single-company file remains recoverable. No tokens are read or
// copied here, and another encrypted file alone never enrolls a company.
class CompanyProfiles{
 constructor(directory){this.file=path.join(directory,'firmy.json');this.legacy=path.join(directory,'profil.json');}
 async load(){
  try{return checkedRegistry(JSON.parse(await fs.readFile(this.file,'utf8')));}catch(e){if(e.code!=='ENOENT')throw e;}
  try{const p=checkedProfile(JSON.parse(await fs.readFile(this.legacy,'utf8')));return {version:1,activeId:profileId(p),profiles:[p]};}catch(e){if(e.code==='ENOENT')return {version:1,activeId:null,profiles:[]};throw e;}
 }
 async active(){const registry=await this.load();return registry.profiles.find(p=>profileId(p)===registry.activeId)||null;}
 async save(profile){const p=checkedProfile(profile),registry=await this.load(),id=profileId(p),index=registry.profiles.findIndex(item=>profileId(item)===id);if(index<0)registry.profiles.push(p);else registry.profiles[index]=p;registry.activeId=id;await atomicWrite(this.file,JSON.stringify(checkedRegistry(registry)));return p;}
 async select(id){const registry=await this.load();const p=registry.profiles.find(item=>profileId(item)===id);if(!p)throw new Error('PROFILE_NOT_FOUND');registry.activeId=id;await atomicWrite(this.file,JSON.stringify(checkedRegistry(registry)));return p;}
}
function configurationTarget(registry,{nip,environment:env,mode,expectedProfileId}){
 const id=profileId({nip,environment:env}),existing=registry.profiles.find(p=>profileId(p)===id)||null;
 if(mode==='add'&&existing)throw new Error('PROFILE_EXISTS');
 if(mode==='update'&&(!existing||expectedProfileId!==id||registry.activeId!==id))throw new Error('PROFILE_CHANGED');
 if(mode!==undefined&&!['add','update'].includes(mode))throw new Error('INVALID_PROFILE');
 return existing;
}
module.exports={CompanyProfiles,profileId,checkedRegistry,configurationTarget};
