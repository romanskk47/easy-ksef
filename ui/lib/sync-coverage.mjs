const validDate=value=>typeof value==='string'&&/^20\d{2}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;
const nextDay=value=>new Date(Date.parse(value+'T12:00:00Z')+86400000).toISOString().slice(0,10);
// Only successful, explicit issue-date checks establish coverage. An incremental
// cursor or documents present on disk cannot establish a checked month.
export function periodCoverage(period,coverage=[]){
 let from,to;
 if(period?.kind==='month'&&/^20\d{2}-(0[1-9]|1[0-2])$/.test(period.month)){
  const [year,month]=period.month.split('-').map(Number);from=period.month+'-01';to=new Date(Date.UTC(year,month,0)).toISOString().slice(0,10);
 }else if(period?.kind==='range'&&validDate(period.from)&&validDate(period.to)&&period.from<=period.to){from=period.from;to=period.to;}
 else return {covered:false,checkedAt:null};
 const ranges=(Array.isArray(coverage)?coverage:[]).filter(r=>validDate(r.from)&&validDate(r.to)&&r.from<=r.to&&r.from<=to&&r.to>=from&&Number.isFinite(Date.parse(r.time))).sort((a,b)=>a.from.localeCompare(b.from));
 // Find the newest timestamp for which the WHOLE requested period was checked
 // at least that recently, including adjacent checks and zero-invoice periods.
 for(const time of [...new Set(ranges.map(r=>r.time))].sort((a,b)=>Date.parse(b)-Date.parse(a))){
  let cursor=from;
  for(const range of ranges.filter(r=>Date.parse(r.time)>=Date.parse(time))){
   if(range.from>cursor)break;
   if(range.to>=cursor)cursor=nextDay(range.to);
   if(cursor>to)return {covered:true,checkedAt:time};
  }
 }
 return {covered:false,checkedAt:null};
}
