// UI verification fixture. Used only with BOTH --ui-check and --simulate-connection.
// Never authenticates, reads invoice data or writes a profile.
process.stdin.resume();console.log(JSON.stringify({type:'progress',stage:'connecting'}));setInterval(()=>{},1000);
