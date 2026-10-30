// Must run directly from the user's confirmation gesture. Browser policy may
// refuse to close a tab that was opened outside script control.
export function closeGameTab(host:Pick<Window,'close'|'closed'>,onBlocked:()=>void,schedule:(check:()=>void)=>void=check=>{setTimeout(check,300);}){
 try{host.close();}catch{onBlocked();return;}
 schedule(()=>{if(!host.closed)onBlocked();});
}
