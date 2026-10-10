(function(root) {
  'use strict';
  function attachCompanyForm({nip,name,token,status,details,retry,lookup,delay=450}) {
    const normalize = value => value.replace(/[ -]/g,'');
    const valid = value => /^\d{10}$/.test(value) && [6,5,7,2,3,4,5,6,7].reduce((sum,w,i)=>sum+w*Number(value[i]),0)%11 === Number(value[9]);
    let revision=0,timer,previous=normalize(nip.value),resolved=null,inFlight=null;
    function say(text,error=false) { status.textContent=text; status.classList.toggle('lookup-error',error); }
    async function run() {
      clearTimeout(timer);const value=normalize(nip.value),generation=revision;
      if(!valid(value) || resolved===value || inFlight===value)return;
      inFlight=value; retry.hidden=true; say('Pobieram nazwę firmy…');name.readOnly=true;
      try {
        const company=await lookup(value);
        if(generation!==revision || normalize(nip.value)!==value)return;
        resolved=value;name.readOnly=false;
        if(company.found) {
          name.value=company.name; details.textContent=company.address;details.hidden=!company.address;
          say('Dane uzupełnione · '+company.source);
        } else { say('Nie znaleziono firmy w wykazie VAT. Wpisz jej nazwę poniżej.');name.value=''; }
      } catch(error) {
        if(generation!==revision || normalize(nip.value)!==value)return;
        name.readOnly=false;retry.hidden=false;
        say(error.message+' Możesz wpisać nazwę ręcznie.',true);
      } finally { if(generation===revision)inFlight=null; }
    }
    function changed() {
      const value=normalize(nip.value);if(value===previous)return;
      previous=value;revision++;resolved=null;inFlight=null;clearTimeout(timer);
      name.value='';name.readOnly=false;token.value='';details.textContent='';details.hidden=true;retry.hidden=true;
      if(value.length===10 && !valid(value))say('Sprawdź NIP — jedna z cyfr jest nieprawidłowa.',true);
      else if(valid(value)){say('Pobieram nazwę firmy…');timer=setTimeout(run,delay);}
      else say('Wpisz NIP. Nazwa firmy uzupełni się automatycznie.');
    }
    nip.addEventListener('input',changed);nip.addEventListener('blur',run);
    retry.addEventListener('click',()=>{resolved=null;run();});
    name.addEventListener('input',()=>{if(resolved)say('Nazwa zmieniona ręcznie. Sprawdź, czy odpowiada wpisanemu NIP-owi.');});
    say('Wpisz NIP. Nazwa firmy uzupełni się automatycznie.');
    return { refresh:()=>{previous='';changed();}, run };
  }
  if(typeof module==='object' && module.exports)module.exports={attachCompanyForm};
  else root.attachCompanyForm=attachCompanyForm;
})(typeof window==='object'?window:globalThis);
