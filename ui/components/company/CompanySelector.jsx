import React from 'react';
import SelectControl from '../SelectControl';
const id=p=>`${p.environment}/${p.nip}`;
export default function CompanySelector({profiles=[],profile,busy,onSelect,onAdd,id:controlId='active-company',label='Firma'}){
 return <div className="company-selector"><label htmlFor={controlId}>{label}</label><SelectControl title={profile?`${profile.name} · NIP ${profile.nip}`:undefined} id={controlId} value={profile?id(profile):''} disabled={busy} onChange={event=>{const value=event.target.value;if(value==='add-company')onAdd();else if(!profile||value!==id(profile))onSelect(value);}}>{!profile&&<option value="">Wybierz firmę</option>}{profiles.map(p=><option key={id(p)} value={id(p)}>{p.name}{profile&&id(p)===id(profile)?'':` · NIP ${p.nip}`}{p.environment==='test'?' · test':''}</option>)}<option value="add-company">＋ Dodaj kolejną firmę…</option></SelectControl></div>;
}
