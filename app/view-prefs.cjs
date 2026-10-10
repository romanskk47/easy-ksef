'use strict';
const fs=require('node:fs/promises');const path=require('node:path');const {atomicWrite,validNip}=require('./archive.cjs');const {role,validateView,DEFAULT_VIEW}=require('./browse.cjs');
function filename(base,profile,selectedRole){if(!validNip(profile?.nip)||!['prod','test'].includes(profile?.environment))throw new Error('INVALID_PROFILE');return path.join(base,`view-${profile.environment}-${profile.nip}-${role(selectedRole)}.json`);}
async function getView(base,profile,selectedRole){try{return validateView(JSON.parse(await fs.readFile(filename(base,profile,selectedRole),'utf8')));}catch(e){if(e.code!=='ENOENT'&&e.message!=='INVALID_VIEW'&&!(e instanceof SyntaxError))throw e;return {columns:[...DEFAULT_VIEW.columns],hidden:[...DEFAULT_VIEW.hidden],pageSize:DEFAULT_VIEW.pageSize};}}
async function saveView(base,profile,selectedRole,view){const checked=validateView(view);await atomicWrite(filename(base,profile,selectedRole),JSON.stringify(checked));return checked;}
module.exports={getView,saveView};
