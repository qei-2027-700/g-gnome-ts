import type {AllyOrder} from './ally-orders.ts';
import type {Faction} from '../content/vehicles.ts';
// Boarding radius from the vehicle center; user-tuned prototype value.
export const BOARDING_DISTANCE=4;
// User-tuned walking/turning response; full speed uses the Union manual maximum.
export const INFANTRY_MOVEMENT={walk:4.4,allyWalk:8,full:32/3.6,prone:2.5,turn:2.8} as const;
export type Flight={altitude:number;vy:number;vx:number;vz:number};
export type Soldier={order?:AllyOrder|null;insideFacility?:string;velocity?:{x:number;z:number};driverOf?:string;passengerOf?:string;boardingTarget?:string;boardingRole?:'pilot'|'passenger';id:string;iff:string;aggressorId:string|null;aggressorUntil:number;sourceVehicle:string;personId?:string;faction:Faction;x:number;z:number;yaw:number;health:number;alive:boolean;alert:boolean;cooldown:number;flight:Flight|null};
export function launchFlight(height:number,yaw:number):Flight{return {altitude:height*.8,vy:9,vx:Math.cos(yaw)*4.5,vz:-Math.sin(yaw)*4.5};}

export const isEmbarked=(soldier:Soldier)=>!!(soldier.passengerOf||soldier.driverOf||soldier.insideFacility);
