const {role, date, monthDates}=require('./browse.cjs');
// Search permanent storage, not issue dates: backdated invoices must not be omitted.
// KSeF has existed since 2022-01-01. This bound precedes both API 2 environments.
const HISTORY_FROM='2022-01-01T00:00:00.000Z';
function downloadScope(request){
 if(!request||!['monthly','range','incremental','history'].includes(request.kind))throw new Error('INVALID_RANGE');
 const roles=request.role==='both'?['purchase','sales']:[role(request.role)];
 let dates=null;
 if(request.kind==='monthly')dates=monthDates(request.month);
 if(request.kind==='range'){dates={from:date(request.dateFrom),to:date(request.dateTo)};if(dates.from>dates.to)throw new Error('INVALID_RANGE');}
 return {roles,dates,historyFrom:request.kind==='history'?HISTORY_FROM:null};
}
module.exports={downloadScope,HISTORY_FROM};
