import {VEHICLE_SHAPES} from './vehicles.ts';
export {VEHICLE_SHAPES} from './vehicles.ts';

// Fallen fixed equipment keeps a low, solid footprint after its fire burns out.
export const FACILITY_WRECK={width:9,depth:8,height:2.4} as const;

// RAID chin muzzle, relative to the Merc Tactical upper assembly.
export const MERC_TACTICAL_RAID_MUZZLE={x:0,y:.15,z:2.1} as const;

// Paired RAID barrels below the Scorp Tactical cockpit; tips relative to the upper assembly.
export const SCORP_TACTICAL_RAID_MUZZLES={x:.55,y:-.05,z:2.3} as const;

// Front and rear pairs alternate diagonally. Shared points drive the model and hit envelopes.
export function mercAssaultLegPose(side:number,front:number,phase=0,run=0){
 const s=VEHICLE_SHAPES['merc-assault'].spider,strength=Math.max(0,Math.min(1,run)),cycle=phase+(side*front>0?0:Math.PI),stride=Math.cos(cycle)*s.step*strength,lift=Math.max(0,Math.sin(cycle))*s.lift*strength,lateral=Math.sin(cycle)*strength;
 return {hip:{x:side*s.hipX,y:s.hipY,z:front*s.hipZ},knee:{x:side*(s.kneeX+lateral*s.sway),y:s.kneeY+Math.sin(cycle)*s.kneeLift*strength,z:front*s.kneeZ+stride*.3},foot:{x:side*(s.footX+Math.max(0,lateral)*s.sideStep),y:.1+lift,z:front*s.footZ+stride}};
}

// Three legs per side; the middle pair runs half a cycle behind its neighbors.
export function scorpAssaultLegPose(side:number,position:number,phase=0,run=0){
 const s=VEHICLE_SHAPES['scorp-assault'].spider,strength=Math.max(0,Math.min(1,run));
 const cycle=phase+(position===0?Math.PI:0)+(side<0?Math.PI:0);
 const stride=Math.cos(cycle)*s.step*strength,lift=Math.max(0,Math.sin(cycle))*s.lift*strength,lateral=Math.sin(cycle)*strength;
 return {hip:{x:side*s.hipX,y:s.hipY,z:position*s.hipZ},knee:{x:side*(s.kneeX+lateral*s.sway),y:s.kneeY+Math.sin(cycle)*s.kneeLift*strength,z:position*s.kneeZ+stride*.3},foot:{x:side*(s.footX+Math.max(0,lateral)*s.sideStep),y:.1+lift,z:position*s.footZ+stride}};
}
