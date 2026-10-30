import type {Companion,Localized} from './content/missions/types.ts';
import type {Simulation} from './simulation/simulation.ts';
import type {AllyCommand,RadioRecipient,RadioFailure,OrderResult} from './simulation/ally-orders.ts';
type RecipientKey={personId:string;key:string};
export type RadioAction={kind:'select';recipient:RadioRecipient}|{kind:'send';recipient:RadioRecipient;command:AllyCommand}|{kind:'signal'};
export class RadioMenu {
 isOpen=false;recipient:RadioRecipient|null=null;
 begin(recipient:RadioRecipient|null=null){this.isOpen=true;this.recipient=recipient;}
 close(){this.isOpen=false;this.recipient=null;}
 select(recipient:RadioRecipient){this.begin(recipient);}
 key(code:string,members:readonly RecipientKey[],repeat=false):RadioAction|undefined{
  if(repeat)return;
  if(!this.isOpen){const recipient=code==='F1'?'all':members.find(m=>m.key===code)?.personId;if(!recipient)return;this.begin(recipient);return {kind:'select',recipient};}
  if(this.recipient===null){const recipient=code==='F1'?'all':members.find(m=>m.key===code)?.personId;if(!recipient)return;this.recipient=recipient;return {kind:'select',recipient};}
  const switched=members.find(m=>m.key===code&&code!=='F4');if(switched){this.recipient=switched.personId;return {kind:'select',recipient:this.recipient};}
  const command=code==='F1'?'attack':code==='F4'?'board':code==='F6'?'disembark':code==='F5'?'follow':code==='F7'?'hold':undefined;
  if(command)return {kind:'send',recipient:this.recipient,command};
  if(code==='F9')return {kind:'signal'};
 }
}

export function radioCallout(members:readonly Companion[],recipient:RadioRecipient|null):Localized|undefined{
 return recipient&&recipient!=='all'?members.find(m=>m.personId===recipient)?.name:{ja:'通信',en:'Communications'};
}

export function radioFailureText(reason:string|undefined,locale:'ja'|'en'){
 const labels:Record<string,[string,string]>={missing:['不在','Absent'],dead:['戦闘不能','Down'],busy:['施設内で作業中','Working inside facility'],unoccupied:['無人','Unoccupied'],player:['プレイヤーが操縦中','Piloted by player'],faction:['所属不一致','Faction mismatch'],range:['通信範囲外','Out of radio range'],blocked:['地形で通信が遮られています','Radio blocked by terrain'],iff:['IFF不一致','IFF mismatch'],occupied:['搭乗済み','Already aboard'],reserved:['操縦席を予約済み','Pilot seat reserved'],full:['満席','No free seats']};
 return labels[reason??'']?.[locale==='ja'?0:1]??(locale==='ja'?'通信不可':'Unavailable');
}
type RadioMember=Simulation['radioMembers'][number];
export function radioReceptionStatus(sim:Simulation,member:RadioMember,locale:'ja'|'en',reason:RadioFailure|undefined=member.reason){
 const actor=member.soldier??member.unit,ja=locale==='ja';
 if(!reason)return member.soldier&&!member.soldier.passengerOf?(ja?'通信可能・徒歩':'Ready, on foot'):(ja?'通信可能':'Ready');
 if(reason==='iff'&&actor)return `${radioFailureText(reason,locale)} (${ja?'自機':'You'} ${sim.iff} / ${ja?'相手':'Recipient'} ${actor.iff})`;
 if(reason==='range'&&actor)return `${radioFailureText(reason,locale)} (${Math.round(Math.hypot(actor.x-sim.player.x,actor.z-sim.player.z))}m / ${ja?'上限':'Limit'} ${sim.mission.radioRange??400}m)`;
 if(reason==='unoccupied'&&member.soldier)return ja?'すでに徒歩です':'Already on foot';
 return radioFailureText(reason,locale);
}
export function radioRejectionMessage(sim:Simulation,result:OrderResult,locale:'ja'|'en'){
 const members=sim.radioMembers;
 return result.rejected.length?result.rejected.map(rejection=>{const member=members.find(m=>m.personId===rejection.personId);return member?`${member.name[locale]}: ${radioReceptionStatus(sim,member,locale,rejection.reason)}`:`${rejection.personId}: ${radioFailureText(rejection.reason,locale)}`;}).join(' / '):locale==='ja'?'この任務には指示できる味方がいません。':'This mission has no squad members to command.';
}
