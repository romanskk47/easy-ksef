const validTime=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));

// A partial attempt must never become a successful "last update". Issue-date
// checks, including empty periods, and a completed history are valid evidence.
export function downloadFreshness({lastRun,history,coverage=[]}={}){
 const completed=[lastRun&&!lastRun.truncated?lastRun.time:null,history?.time,
  ...(Array.isArray(coverage)?coverage.map(check=>check.time):[])].filter(validTime);
 const completedAt=completed.sort((a,b)=>Date.parse(b)-Date.parse(a))[0]||null;
 const incomplete=!!lastRun?.truncated&&validTime(lastRun.time)&&(!completedAt||Date.parse(lastRun.time)>=Date.parse(completedAt));
 return {completedAt,incomplete};
}
