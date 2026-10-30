import type {VehicleKind} from '../content/vehicles.ts';
// Manual input tuning: smaller keyboard steps and finer mouse aiming. AI turn rates are separate.
export const MANUAL_AIM={vehicleYaw:.6,towerYaw:1.5,towerTracking:2.0,infantryYaw:1.8,pitch:.55,mousePerPixel:.0025,mouseYawPerPixel:.0025} as const;
const HAWC_KINDS=new Set<VehicleKind>(['union-sentry','union-tactical','merc-sentry','merc-tactical','merc-assault','scorp-sentry','scorp-tactical','merc-cruiser']);
export const canFlyAcrossRiver=(kind?:VehicleKind)=>kind==='union-aip'||kind==='merc-aip';
export const isHawc=(kind:VehicleKind)=>HAWC_KINDS.has(kind);
const HAWC_MANUAL_AIM={...MANUAL_AIM,vehicleYaw:1.5,mouseYawPerPixel:.005} as const;
const ASSAULT_MANUAL_AIM={...HAWC_MANUAL_AIM,pitch:.825,mousePerPixel:.00375} as const;
export const manualAimFor=(kind?:VehicleKind)=>kind==='merc-assault'?ASSAULT_MANUAL_AIM:kind&&(isHawc(kind)||kind==='scorp-asv')?HAWC_MANUAL_AIM:MANUAL_AIM;
// User-tuned prototype response; maximum speeds remain vehicle/infantry data.
export const MOVEMENT_RESPONSE={vehicleAcceleration:1.8,vehicleBraking:1.4,footAcceleration:10,footBraking:6,restSpeed:.035} as const;
// Heavy low-hover handling, tuned from the user's Merc AIP agility feedback.
export const MERC_AIP_RESPONSE={turnRate:.55,aimTurnRate:.9,acceleration:.7,braking:.65} as const;
export function aiTurnStep(kind:VehicleKind,error:number,dt:number,eased=false){
 if(kind==='merc-aip')return Math.max(-dt*MERC_AIP_RESPONSE.turnRate,Math.min(dt*MERC_AIP_RESPONSE.turnRate,error));
 return eased?error*Math.min(1,dt*1.7):Math.max(-dt*1.8,Math.min(dt*1.8,error));
}
export function aiAimTurnStep(kind:VehicleKind,error:number,dt:number){
 const rate=kind==='merc-aip'?MERC_AIP_RESPONSE.aimTurnRate:2.4;return Math.max(-dt*rate,Math.min(dt*rate,error));
}
export function accelerateSpeed(current:number,desired:number,dt:number,kind?:VehicleKind){
 const braking=Math.abs(desired)<Math.abs(current)||current*desired<0;
 const next=current+(desired-current)*Math.min(1,dt*(kind==='merc-aip'?(braking?MERC_AIP_RESPONSE.braking:MERC_AIP_RESPONSE.acceleration):(braking?MOVEMENT_RESPONSE.vehicleBraking:MOVEMENT_RESPONSE.vehicleAcceleration)));
 return desired===0&&Math.abs(next)<MOVEMENT_RESPONSE.restSpeed?0:next;
}
export function infantryVelocity(current:{x:number;z:number},yaw:number,speed:number,dt:number){
 const desired={x:Math.sin(yaw)*speed,z:Math.cos(yaw)*speed},braking=Math.hypot(desired.x,desired.z)<Math.hypot(current.x,current.z)||desired.x*current.x+desired.z*current.z<0;
 const blend=1-Math.exp(-dt*(braking?MOVEMENT_RESPONSE.footBraking:MOVEMENT_RESPONSE.footAcceleration));
 const next={x:current.x+(desired.x-current.x)*blend,z:current.z+(desired.z-current.z)*blend};
 if(Math.hypot(next.x-desired.x,next.z-desired.z)<.02)return desired;
 return next;
}
