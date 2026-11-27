import {VEHICLE_SHAPES} from './vehicles.ts';
export {VEHICLE_SHAPES} from './vehicles.ts';

// Fallen fixed equipment keeps a low, solid footprint after its fire burns out.
export const FACILITY_WRECK={width:9,depth:8,height:2.4} as const;

// RAID chin muzzle, relative to the Merc Tactical upper assembly.
export const MERC_TACTICAL_RAID_MUZZLE={x:0,y:.15,z:2.1} as const;

// Paired RAID barrels below the Scorp Tactical cockpit; tips relative to the upper assembly.
export const SCORP_TACTICAL_RAID_MUZZLES={x:.55,y:-.05,z:2.3} as const;

// World-height positions of the eight ports on the Scorp Rocket Tower's turning roof.
export const SCORP_ROCKET_TOWER_PORTS=[10.36,11.05].flatMap(y=>[-.36,.49,1.34,2.19].map(x=>({x,y,z:2.23})));

// Front and rear pairs alternate diagonally. Shared points drive the model and hit envelopes.
export function mercAssaultLegPose(side:number,front:number,phase=0,run=0){
 const s=VEHICLE_SHAPES['merc-assault'].spider,strength=Math.max(0,Math.min(1,run)),cycle=phase+(side*front>0?0:Math.PI),stride=Math.cos(cycle)*s.step*strength,lift=Math.max(0,Math.sin(cycle))*s.lift*strength,lateral=Math.sin(cycle)*strength;
 return {hip:{x:side*s.hipX,y:s.hipY,z:front*s.hipZ},knee:{x:side*(s.kneeX+lateral*s.sway),y:s.kneeY+Math.sin(cycle)*s.kneeLift*strength,z:front*s.kneeZ+stride*.3},foot:{x:side*(s.footX+Math.max(0,lateral)*s.sideStep),y:.1+lift,z:front*s.footZ+stride}};
}

// Speed at which the walk reaches its full step. Faster travel only shortens the time between steps.
export const UNION_ASSAULT_FULL_STEP_SPEED=4;

// Two-bone knee. The bend stays in the forward plane, so the leg does not swing sideways.
// An overlong reach stretches both bones instead of collapsing the shin.
function beastKnee(hip:{x:number;y:number;z:number},foot:{x:number;y:number;z:number},upper:number,lower:number,poleZ:number){
 const dx=foot.x-hip.x,dy=foot.y-hip.y,dz=foot.z-hip.z,actual=Math.hypot(dx,dy,dz)||1,reach=Math.min(actual,upper+lower-.05),scale=actual/reach;
 const ux=dx/actual,uy=dy/actual,uz=dz/actual,along=Math.max(.2,Math.min(reach-.2,(upper*upper-lower*lower+reach*reach)/(2*reach)));
 const height=Math.sqrt(Math.max(0,upper*upper-along*along));
 let py=.5,pz=poleZ,dot=py*uy+pz*uz;
 py-=dot*uy;pz-=dot*uz;const plen=Math.hypot(py,pz)||1;
 return {x:hip.x+ux*along*scale,y:hip.y+(uy*along+py/plen*height)*scale,z:hip.z+(uz*along+pz/plen*height)*scale};
}

// Four-beat walk: left hind, right fore, right hind, left fore. A planted paw travels backward. Hind feet stand slightly wider.
// Shared points drive the model and hit envelopes. Step length is provisional.
export function unionAssaultLegPose(side:number,front:number,phase=0,run=0){
 const s=VEHICLE_SHAPES['union-assault'].spider,reach=front<0?1.08:1,strength=Math.max(0,Math.min(1,run));
 const hip={x:side*s.hipX*reach,y:s.hipY,z:front*s.hipZ},knee={x:side*s.kneeX*reach,y:s.kneeY,z:front*s.kneeZ},foot={x:side*s.footX*reach,y:.1,z:front*s.footZ};
 if(strength===0)return {hip,knee,foot,footPitch:0};
 const offset=front<0?(side<0?0:Math.PI):(side>0?Math.PI/2:Math.PI*3/2),swing=.36,p=(((phase+offset)/(Math.PI*2))%1+1)%1;
 const ahead=(front>0?2.6:1.8)*strength,behind=(front>0?2.2:3.2)*strength,travel=ahead+behind;
 let along:number,lifted:number,footPitch:number;
 if(p<swing){const u=p/swing,arc=Math.sin(u*Math.PI);along=-behind+travel*u*u*(3-2*u);lifted=s.lift*arc*strength;footPitch=-.65*arc*strength;}
 else{along=ahead-travel*(p-swing)/(1-swing);lifted=0;footPitch=0;}
 const planted={x:foot.x,y:foot.y+lifted,z:foot.z+along};
 const upper=Math.hypot(knee.x-hip.x,knee.y-hip.y,knee.z-hip.z),lower=Math.hypot(foot.x-knee.x,foot.y-knee.y,foot.z-knee.z);
 return {hip,knee:beastKnee(hip,planted,upper,lower,front>0?-1:1),foot:planted,footPitch};
}

export function scorpAssaultLegPose(side:number,position:number,phase=0,run=0){
 const s=VEHICLE_SHAPES['scorp-assault'].spider,strength=Math.max(0,Math.min(1,run));
 const cycle=phase+(position===0?Math.PI:0)+(side<0?Math.PI:0);
 const stride=Math.cos(cycle)*s.step*strength,lift=Math.max(0,Math.sin(cycle))*s.lift*strength,lateral=Math.sin(cycle)*strength;
 return {hip:{x:side*s.hipX,y:s.hipY,z:position*s.hipZ},knee:{x:side*(s.kneeX+lateral*s.sway),y:s.kneeY+Math.sin(cycle)*s.kneeLift*strength,z:position*s.kneeZ+stride*.3},foot:{x:side*(s.footX+Math.max(0,lateral)*s.sideStep),y:.1+lift,z:position*s.footZ+stride}};
}
