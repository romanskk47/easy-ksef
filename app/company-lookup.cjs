'use strict';
const { validNip } = require('./archive.cjs');
const SOURCE = 'Wykaz podatników VAT · Ministerstwo Finansów';
const normalizeNip = value => typeof value === 'string' ? value.replace(/[ -]/g, '') : '';
function warsawDate(now) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Warsaw',year:'numeric',month:'2-digit',day:'2-digit' }).formatToParts(now);
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function createCompanyLookup({ fetcher = fetch, now = () => new Date() } = {}) {
  const cache = new Map(), pending = new Map();
  return async function lookup(value) {
    const nip = normalizeNip(value);
    if (!validNip(nip)) throw new Error('INVALID_NIP');
    const date = warsawDate(now()), key = `${date}:${nip}`, at = now().getTime();
    const old = cache.get(key);
    if (old && at - old.at < 10 * 60 * 1000) return { ...old.value };
    if (pending.has(key)) return { ...await pending.get(key) };
    const request = (async () => {
      try {
        const response = await fetcher(`https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${date}`, {
          headers: { Accept:'application/json' }, redirect:'error', signal:AbortSignal.timeout(8000),
        });
        if (response.status === 429) throw new Error('COMPANY_RATE_LIMIT');
        if (!response.ok) throw new Error('COMPANY_UNAVAILABLE');
        const reader = response.body.getReader(); let size = 0; const chunks = [];
        for (;;) { const {done,value:chunk} = await reader.read(); if (done) break;
          size += chunk.byteLength; if (size > 128 * 1024) { await reader.cancel(); throw new Error('COMPANY_INVALID_RESPONSE'); }
          chunks.push(Buffer.from(chunk));
        }
        const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!data.result || !Object.hasOwn(data.result,'subject')) throw new Error('COMPANY_INVALID_RESPONSE');
        const subject = data.result.subject; let result;
        if (subject === null) result = { found:false,nip,source:SOURCE,date };
        else {
          if (subject.nip !== nip || typeof subject.name !== 'string' || !subject.name.trim() || subject.name.length > 500) throw new Error('COMPANY_INVALID_RESPONSE');
          const text = field => typeof subject[field] === 'string' ? subject[field].slice(0,500) : '';
          // Return only the company identity needed for onboarding; no accounts, PESEL or representatives.
          result = { found:true,nip,name:subject.name.trim(),address:text('workingAddress') || text('residenceAddress'),regon:text('regon'),krs:text('krs'),source:SOURCE,date };
        }
        if (cache.size >= 100) cache.delete(cache.keys().next().value);
        cache.set(key,{at,value:result}); return result;
      } catch (error) {
        if (error.message.startsWith('COMPANY_')) throw error;
        throw new Error('COMPANY_UNAVAILABLE');
      }
    })();
    pending.set(key,request);
    try { return { ...await request }; } finally { pending.delete(key); }
  };
}
module.exports = { createCompanyLookup, normalizeNip, warsawDate };
