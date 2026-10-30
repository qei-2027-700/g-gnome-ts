export type MissionResult='complete'|'failed'|'aborted';
const RESULT_LABELS:Record<MissionResult,string>={complete:'MISSION COMPLETE',failed:'MISSION FAILED',aborted:'MISSION ABORTED'};
// Provisional presentation timings; mission simulation stays frozen throughout.
export const COMPLETION_TIMING={view:3.5,closing:.6,closed:.25} as const;
export class MissionCompletion {
 elapsed=0;active=false;result:MissionResult='complete';
 private doorImpactPending=false;
 start(result:MissionResult='complete'){if(this.active)return false;this.result=result;this.elapsed=0;this.active=true;this.doorImpactPending=false;return true;}
 cancel(){this.elapsed=0;this.active=false;this.result='complete';this.doorImpactPending=false;}
 takeDoorImpact(){const pending=this.doorImpactPending;this.doorImpactPending=false;return pending;}
 get closure(){return Math.max(0,Math.min(1,(this.elapsed-COMPLETION_TIMING.view)/COMPLETION_TIMING.closing));}
 step(dt:number){
  if(!this.active)return false;const before=this.elapsed;this.elapsed+=Math.max(0,dt);
  const contact=COMPLETION_TIMING.view+COMPLETION_TIMING.closing;
  if(before<contact&&this.elapsed>=contact)this.doorImpactPending=true;
  if(this.elapsed<COMPLETION_TIMING.view+COMPLETION_TIMING.closing+COMPLETION_TIMING.closed)return false;
  this.active=false;return true;
 }
}
export function missionCompletionMarkup(result:MissionResult='complete'){
 const label=RESULT_LABELS[result];
 return `<section class="mission-completion" role="status" aria-label="${label}"><div class="completion-label">${label}</div><div class="completion-door completion-door-top" aria-hidden="true"></div><div class="completion-door completion-door-bottom" aria-hidden="true"></div></section>`;
}
