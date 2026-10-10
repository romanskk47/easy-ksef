'use strict';
const {validNip}=require('./archive.cjs');
const path=require('node:path');
function documentsPath(value){if(typeof value!=='string'||!value.trim()||value.includes('\0')||value.length>32768||!path.isAbsolute(value))throw new Error('INVALID_DOCUMENTS_PATH');return path.resolve(value);}
function environment(value){if(!['test','prod'].includes(value))throw new Error('INVALID_ENVIRONMENT');return value;}
function checkedProfile(p){if(!p||!validNip(p.nip)||typeof p.name!=='string'||!p.name.trim()||!Number.isFinite(Date.parse(p.bootstrapFrom)))throw new Error('INVALID_PROFILE');environment(p.environment);return {nip:p.nip,name:p.name,environment:p.environment,bootstrapFrom:p.bootstrapFrom,...(p.documentsPath!==undefined?{documentsPath:documentsPath(p.documentsPath)}:{})};}
function warsawMonthStart(month){
 if(!/^20\d{2}-(0[1-9]|1[0-2])$/.test(month))throw new Error('INVALID_MONTH');
 const [year,m]=month.split('-').map(Number),utc=Date.UTC(year,m-1,1);
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(utc)).map(p=>[p.type,p.value]));
 const shifted=Date.UTC(+parts.year,+parts.month-1,+parts.day,+parts.hour,+parts.minute);
 return new Date(utc-(shifted-utc)).toISOString();
}
function previousWarsawMonthStart(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
 const first=new Date(Date.UTC(+parts.year,+parts.month-2,1));return warsawMonthStart(first.toISOString().slice(0,7));
}
module.exports={environment,checkedProfile,documentsPath,warsawMonthStart,previousWarsawMonthStart};
