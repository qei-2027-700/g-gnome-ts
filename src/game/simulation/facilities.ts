import type {Base} from '../content/missions/types.ts';
import type {Faction} from '../content/vehicles.ts';
export type FacilityType=NonNullable<Base['buildings'][number]['kind']>;
export type Facility={bridgeId?:string;id:string;facilityType:FacilityType;name:string;faction:Faction;x:number;z:number;width:number;depth:number;height:number;yaw:number;iff:string;alive:boolean;pilot:boolean;health:number;boardable:boolean};
export const isFacility=(target:object):target is Facility=>'facilityType' in target;
const names:Record<FacilityType,string>={citadel:'Citadel', 'power-plant':'電力施設','comm-array':'Latlon通信基地','bridge-control':'Bridge Control Building',command:'司令部','mine-control':'地雷原コントロール設備','shield-generator':'シールドジェネレーター','sweep-turret':'スイープタレット'};
export function makeFacilities(base:Base|undefined,iff='scorp'):Facility[]{
 return (base?.buildings??[]).map((b,i)=>({...b,id:b.id??`facility-${b.kind??'command'}-${i}`,facilityType:b.kind??'command',name:b.name??names[b.kind??'command'],faction:base?.faction??'scorp',yaw:b.yaw??Math.PI/2,iff:b.iff??iff,alive:true,pilot:b.pilot??false,health:b.health??200,boardable:b.kind!=='sweep-turret'&&b.boardable!==false}));
}
// Buildings use distance to their wall, so a large footprint does not block its own entrance.
export function facilityDistance(f:Facility,p:{x:number;z:number}){return Math.hypot(Math.max(0,Math.abs(p.x-f.x)-f.width/2),Math.max(0,Math.abs(p.z-f.z)-f.depth/2));}
export function facilityExit(f:Facility){return {x:f.x+f.width/2+5,z:f.z};}
export function entryAllowed(target:{alive:boolean;pilot:boolean;boardable?:boolean},protectedByGenerator:boolean){return target.alive&&!target.pilot&&target.boardable!==false&&!protectedByGenerator;}
