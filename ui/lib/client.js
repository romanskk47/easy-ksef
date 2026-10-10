let activeProfileId=null;
export function setClientProfile(profile){activeProfileId=profile?`${profile.environment}/${profile.nip}`:null;}
const scoped=new Set(['chooseDocumentsFolder','changeDocumentsFolder','download','list','query','summary','getView','saveView','folder','pdf','exportExcel','exportZip','exportPdfZip','excel']);
export async function api(method,...args){
 if(typeof window.easyKsef?.[method]!=='function')throw new Error('Ta wersja programu nie obsługuje jeszcze tej czynności. Uruchom aktualną aplikację.');
 const startedProfileId=activeProfileId;
 const result=await window.easyKsef[method](...args,...(scoped.has(method)?[{__profileId:activeProfileId}]:[]));
 if(scoped.has(method)&&startedProfileId!==activeProfileId)throw new Error('Wybrana firma zmieniła się. Ponów czynność w jej aktualnym widoku.');
 if(!result.ok){const error=new Error(result.error||'Nie udało się zakończyć czynności.');if(result.code==='CANCELLED')error.code='CANCELLED';throw error;}
 return result.value;
}
