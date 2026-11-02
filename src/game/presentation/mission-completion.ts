export type MissionResult='complete'|'failed'|'aborted';
const RESULT_LABELS:Record<Exclude<MissionResult,'aborted'>,string>={complete:'MISSION COMPLETE',failed:'MISSION FAILED'};
// Provisional presentation timings; mission simulation stays frozen throughout.
export const COMPLETION_TIMING={completeView:1,failedView:3.5,closing:.6,closed:1} as const;
const doorImage=new URL('../../../assets/ui-system/ui-system-end.png',import.meta.url).href;
export class MissionCompletion {
 elapsed=0;active=false;result:MissionResult='complete';
 private doorImpactPending=false;
 start(result:MissionResult='complete'){if(this.active)return false;this.result=result;this.elapsed=0;this.active=true;this.doorImpactPending=false;return true;}
 cancel(){this.elapsed=0;this.active=false;this.result='complete';this.doorImpactPending=false;}
 takeDoorImpact(){const pending=this.doorImpactPending;this.doorImpactPending=false;return pending;}
 get viewDuration(){return this.result==='complete'?COMPLETION_TIMING.completeView:this.result==='failed'?COMPLETION_TIMING.failedView:0;}
 get closure(){return Math.max(0,Math.min(1,(this.elapsed-this.viewDuration)/COMPLETION_TIMING.closing));}
 step(dt:number){
  if(!this.active)return false;const before=this.elapsed;this.elapsed+=Math.max(0,dt);
  const contact=this.viewDuration+COMPLETION_TIMING.closing;
  if(before<contact&&this.elapsed>=contact)this.doorImpactPending=true;
  if(this.elapsed<this.viewDuration+COMPLETION_TIMING.closing+COMPLETION_TIMING.closed)return false;
  this.active=false;return true;
 }
}
export function missionCompletionMarkup(result:MissionResult='complete'){
 const label=result==='aborted'?null:RESULT_LABELS[result];
 return `<section class="mission-completion"${label?` role="status" aria-label="${label}"`:''}>${label?`<div class="completion-label">${label}</div>`:''}<img class="completion-door-image" src="${doorImage}" alt="" aria-hidden="true"></section>`;
}
