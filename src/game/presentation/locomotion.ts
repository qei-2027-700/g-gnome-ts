import {DARKEN_TACTICAL_REST_STEP,DARKEN_TACTICAL_SHIN,DARKEN_TACTICAL_THIGH,VEHICLE_GAITS,VEHICLE_SHAPES,VEHICLES,type VehicleKind} from '../content/vehicles.ts';
export const GAITS=VEHICLE_GAITS satisfies Record<VehicleKind,{stride:number;lift:number;lean:number;bounce:number}>;
export function legPose(kind:VehicleKind,phase:number,run:number,hipHeight:number,height?:number){
 const h=height??VEHICLES[kind].height,profile=GAITS[kind],strength=Math.max(0,Math.min(1,run));
 const cycle=((phase/(Math.PI*2))%1+1)%1,stance=cycle<.5;
 const stride=profile.stride*.25*strength;
 const z=stance?stride*(1-cycle*4):stride*(-1+(cycle-.5)*4);
 const lift=stance?0:Math.sin((cycle-.5)*Math.PI*2)*profile.lift*strength;
 const shape=VEHICLE_SHAPES[kind],scale='legScale' in shape?shape.legScale:{x:1,y:1,z:1};
 const darken=kind==='darken-tactical',y=.225+(lift-hipHeight)/scale.y,localZ=z/scale.z+(darken?DARKEN_TACTICAL_REST_STEP:0),upper=darken?DARKEN_TACTICAL_THIGH:h*.26,lower=darken?DARKEN_TACTICAL_SHIN:h*.22;
 const reach=Math.max(.01,Math.min(upper+lower-.001,Math.hypot(y,localZ)));
 const clamp=(v:number)=>Math.max(-1,Math.min(1,v));
 const hip=Math.atan2(-localZ,-y)-Math.acos(clamp((upper*upper+reach*reach-lower*lower)/(2*upper*reach)));
 const knee=Math.PI-Math.acos(clamp((upper*upper+lower*lower-reach*reach)/(2*upper*lower)));
 const solePitch=kind==='merc-tactical'&&!stance?Math.sin((cycle-.5)*Math.PI*2)*1.4*strength:0;
 return {hip,knee,ankle:-hip-knee+solePitch,lift,z,solePitch};
}

export const INFANTRY_GAIT={upper:.46,lower:.42,sole:.12,stride:2.8,lift:.2} as const;
export function infantryLegPose(phase:number,strength:number,hipHeight:number,direction=1){
 const cycle=((phase/(Math.PI*2))%1+1)%1,stance=cycle<.5,amount=Math.max(0,Math.min(1,strength));
 if(amount===0)return {hip:0,knee:0,ankle:0,lift:0};
 const z=(stance?1-cycle*4:-1+(cycle-.5)*4)*.18*amount*direction;
 const lift=stance?0:Math.sin((cycle-.5)*Math.PI*2)*INFANTRY_GAIT.lift*amount;
 const y=INFANTRY_GAIT.sole+lift-hipHeight,{upper,lower}=INFANTRY_GAIT;
 const reach=Math.max(.01,Math.min(upper+lower-.001,Math.hypot(y,z))),clamp=(v:number)=>Math.max(-1,Math.min(1,v));
 const hip=Math.atan2(-z,-y)-Math.acos(clamp((upper*upper+reach*reach-lower*lower)/(2*upper*reach)));
 const knee=Math.PI-Math.acos(clamp((upper*upper+lower*lower-reach*reach)/(2*upper*lower)));
 return {hip,knee,ankle:-hip-knee,lift};
}
