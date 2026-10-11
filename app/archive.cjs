const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {guardedPath}=require('./archive-paths.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('base64');
const key = id => crypto.createHash('sha256').update(id).digest('hex');
const safe = name => String(name).normalize('NFC').replace(/[^\p{L}\p{N}_.-]/gu, '_').slice(0, 35) || 'Faktura';
async function atomicWrite(target, bytes) {
  await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
  const temp = target + '.' + crypto.randomUUID() + '.tmp';
  const file = await fs.open(temp, 'wx', 0o600);
  try {
    try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    await fs.rename(temp, target);
  } catch (error) { await fs.rm(temp, { force: true }); throw error; }
}
function validNip(nip) {
  return typeof nip === 'string' && /^\d{10}$/.test(nip) && [6,5,7,2,3,4,5,6,7].reduce((sum,w,i)=>sum+w*Number(nip[i]),0)%11 === Number(nip[9]);
}
const displayCache=new Map();
const signature=stat=>`${stat.size}/${stat.mtimeMs}/${stat.ctimeMs}/${stat.ino}`;
class Archive {
  constructor(base, nip, environment='test', role='purchase') {
    if (!validNip(nip)) throw new Error('INVALID_NIP');
    if (!['test','prod'].includes(environment)) throw new Error('INVALID_ENVIRONMENT');
    if (!['purchase','sales'].includes(role)) throw new Error('INVALID_ROLE');
    this.base = path.resolve(base); base=this.base;
    this.nip = nip; this.role=role; this.root = path.join(base, environment==='prod'?'Produkcja':'Test', nip, role==='sales'?'Sprzedaż':'Zakupy'); this.index = path.join(this.root, 'archiwum.json');
    this.scope = `${environment}/${nip}/${role==='sales'?'Subject1':'Subject2'}`;
  }
  async load() {
    try { this.state = JSON.parse(await fs.readFile(await this.guardFile('archiwum.json'),'utf8')); if (this.state.schema !== 1 || this.state.scope !== this.scope || !this.state.documents) throw new Error('INVALID_ARCHIVE'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; this.state = { schema:1,scope:this.scope,documents:{},continuation:null,lastRun:null }; }
    return this;
  }
  async persist() { await atomicWrite(await this.guardFile('archiwum.json',true), JSON.stringify(this.state,null,2)); }
  location(meta, extension) {
    if (!meta || typeof meta.id !== 'string' || !meta.id || !/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(meta.date)) throw new Error('INVALID_METADATA');
    return path.join(meta.date.slice(0,7), `${safe(meta.number)}_${key(meta.id)}.${extension}`);
  }
  absolute(relative) {
    if (typeof relative !== 'string') throw new Error('INVALID_ARCHIVE_PATH');
    const target = path.resolve(this.root, relative);
    if (!target.startsWith(this.root + path.sep)) throw new Error('INVALID_ARCHIVE_PATH');
    return target;
  }
  async guardFile(relative,create=false){return guardedPath(this.base,this.absolute(relative),{create});}
  async guardDirectory(relative='',create=false){return guardedPath(this.base,relative?this.absolute(relative):this.root,{create,directory:true});}
  async verifiedXml(id) {
    const record=this.state.documents[id];if(!record)return false;
    try{return hash(await fs.readFile(await this.guardFile(record.xml)))===record.hash;}catch{return false;}
  }
  async beginRefresh({kind,dateFrom,dateTo,from}) {
    if(!['incremental','history','monthly','range'].includes(kind))throw new Error('INVALID_RANGE');
    const time=new Date().toISOString();
    const attempt={time,startedAt:time,status:'running',kind,dateFrom:dateFrom||null,dateTo:dateTo||null,from:['incremental','history'].includes(kind)?from:null,through:null,count:null,newInvoices:null};
    this.state.ksefRefresh={lastSuccess:this.state.ksefRefresh?.lastSuccess||null,lastAttempt:attempt};
    await this.persist();
  }
  async completeRefresh(expected,{continuation,truncated,newInvoices=0}) {
    const attempt=this.state.ksefRefresh?.lastAttempt;if(!attempt||attempt.status!=='running')throw new Error('INVALID_REFRESH');
    const distinct=[...new Set(expected)];
    for(const id of distinct)if(!await this.verifiedXml(id))throw new Error('INCOMPLETE_DOWNLOAD');
    const incremental=['incremental','history'].includes(attempt.kind);
    if(incremental&&(!continuation||!/^\d{4}-\d{2}-\d{2}T.*(?:Z|\+00:00)$/.test(continuation)||!Number.isFinite(Date.parse(continuation))||!Number.isFinite(Date.parse(attempt.from))||Date.parse(continuation)<Date.parse(attempt.from)))throw new Error('MISSING_CONTINUATION');
    const completed={...attempt,time:new Date().toISOString(),through:incremental?continuation:null,count:distinct.length,newInvoices};
    delete completed.status;
    this.state.ksefRefresh={lastSuccess:truncated?this.state.ksefRefresh.lastSuccess:completed,lastAttempt:{...completed,status:truncated?'incomplete':'success'}};
    await this.persist();return !truncated;
  }
  async failRefresh(status) {
    if(!['cancelled','failed','incomplete'].includes(status))throw new Error('INVALID_REFRESH');
    // Once XML and the complete KSeF response were confirmed, a later PDF
    // failure or cancellation cannot turn that successful check into failure.
    if(this.state.ksefRefresh?.lastAttempt?.status!=='running')return;
    this.state.ksefRefresh.lastAttempt={...this.state.ksefRefresh.lastAttempt,time:new Date().toISOString(),status};
    await this.persist();
  }
  async verified(id) {
    const record = this.state.documents[id]; if (!record || record.status !== 'ready') return false;
    try { const xml = await fs.readFile(await this.guardFile(record.xml)); const pdf = await fs.readFile(await this.guardFile(record.pdf)); return hash(xml)===record.hash && hash(pdf)===record.pdfHash && pdf.subarray(0,5).toString()==='%PDF-'; } catch { return false; }
  }
  async displayStatus(record) {
    const cacheKey=`${this.scope}/${this.root}/${record.id}`;
    try {
      const xmlStat=await fs.stat(await this.guardFile(record.xml));
      let pdfStat=null;try{if(record.pdf)pdfStat=await fs.stat(await this.guardFile(record.pdf));}catch{}
      const fingerprint=`${record.hash}/${record.pdfHash}/${record.status}/${signature(xmlStat)}/${pdfStat?signature(pdfStat):'-'}`;
      const cached=displayCache.get(cacheKey);if(cached?.fingerprint===fingerprint)return cached.status;
      let status='ready';if(!await this.verified(record.id)){status=hash(await fs.readFile(await this.guardFile(record.xml)))===record.hash?'xml-only':'damaged';}
      if(displayCache.size>=10000)displayCache.delete(displayCache.keys().next().value);
      displayCache.set(cacheKey,{fingerprint,status});return status;
    }catch{return 'damaged';}
  }
  async enrichMetadata(meta) {
    const record=this.state.documents[meta.id];if(!record||record.hash!==meta.hash)throw new Error('CONFLICTING_DOCUMENT');
    let changed=false;for(const name of ['buyer','buyerNip','type','acDate'])if(typeof meta[name]==='string'&&record[name]!==meta[name]){record[name]=meta[name];changed=true;}
    if(changed)await this.persist();
  }
  async saveXml(meta, xml) {
    if(!meta||typeof meta.number!=='string'||typeof meta.seller!=='string'||typeof meta.sellerNip!=='string'||typeof meta.currency!=='string'||!Number.isFinite(meta.gross))throw new Error('INVALID_METADATA');
    if (typeof meta.hash !== 'string' || hash(xml) !== meta.hash) throw new Error('XML_HASH_MISMATCH');
    const prior = this.state.documents[meta.id]; if (prior && prior.hash !== meta.hash) throw new Error('CONFLICTING_DOCUMENT');
    const relative = this.location(meta,'xml');
    await atomicWrite(await this.guardFile(relative,true),xml);
    // Explicit whitelist: no token, arbitrary extra fields or external paths enter the ledger.
    this.state.documents[meta.id]={ id:meta.id,number:String(meta.number),date:meta.date,seller:String(meta.seller),sellerNip:String(meta.sellerNip),gross:meta.gross,currency:String(meta.currency),buyer:String(meta.buyer||''),buyerNip:String(meta.buyerNip||''),type:String(meta.type||''),acDate:String(meta.acDate||''),hash:meta.hash,xml:relative,pdf:null,pdfHash:null,status:'xml-only' };
    await this.persist();
  }
  async savePdf(id, pdf) {
    const record = this.state.documents[id]; if (!record) throw new Error('MISSING_XML');
    if (!Buffer.isBuffer(pdf) || pdf.subarray(0,5).toString()!=='%PDF-') throw new Error('INVALID_PDF');
    const relative = this.location(record,'pdf'); await atomicWrite(await this.guardFile(relative,true),pdf);
    record.pdf=relative;record.pdfHash=hash(pdf);record.status='ready'; await this.persist();
  }
  async finish(expected, { continuation, truncated, kind, dateFrom, dateTo, historyFrom }) {
    const distinct = [...new Set(expected)];
    const missing=[];for (const id of distinct) if (!await this.verified(id)) missing.push(id);
    if (missing.length) return { complete:false,missing:missing.length,continuation:this.state.continuation };
    if (kind==='incremental'||kind==='history') {
      if (!continuation || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|\+00:00)$/.test(continuation)) throw new Error('MISSING_CONTINUATION');
      if(kind==='history'&&(historyFrom!=='2022-01-01T00:00:00.000Z'||Date.parse(continuation)<Date.parse(historyFrom)))throw new Error('INVALID_RANGE');
      if(!truncated){
        if(!this.state.continuation||Date.parse(continuation)>Date.parse(this.state.continuation))this.state.continuation=continuation;
        if(kind==='history')this.state.history={from:historyFrom,through:continuation,time:new Date().toISOString()};
        else if(this.state.history&&Date.parse(continuation)>Date.parse(this.state.history.through))this.state.history={...this.state.history,through:continuation,time:new Date().toISOString()};
      }
    }
    this.state.lastRun={time:new Date().toISOString(),count:distinct.length,truncated:!!truncated,kind,dateFrom:dateFrom||null,dateTo:dateTo||null,months:[...new Set(distinct.map(id=>this.state.documents[id].date.slice(0,7)))].sort()};
    if(!truncated && ['range','monthly'].includes(kind) && dateFrom && dateTo){this.state.coverage=this.state.coverage||[];this.state.coverage.push({from:dateFrom,to:dateTo,time:this.state.lastRun.time});this.state.coverage=this.state.coverage.slice(-200);}
    await this.persist();return { complete:!truncated,missing:0,count:distinct.length,truncated:!!truncated };
  }
  list(month) { return Object.values(this.state.documents).filter(r=>!month||r.date.startsWith(month)).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id)); }
  async checkedList(month) {
    const rows=[];
    for(const item of this.list(month)){
      const status=await this.displayStatus(item);
      rows.push({...item,status});
    }
    return rows;
  }
}
module.exports={Archive,atomicWrite,validNip,hash};
