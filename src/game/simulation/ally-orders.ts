export type AllyCommand='attack'|'follow'|'hold'|'board'|'disembark';
export type AllyOrder={kind:'attack';targetId:string}|{kind:'follow';targetId?:string};
export type RadioRecipient='all'|string;
export type RadioFailure='missing'|'dead'|'busy'|'unoccupied'|'player'|'faction'|'range'|'blocked'|'iff'|'occupied'|'reserved'|'full';
export type OrderResult={accepted:string[];rejected:{personId:string;reason:RadioFailure}[];error?:'target'|'unavailable'|'inactive'};
// Prototype formation spacing; movement still uses each chassis' common speed and collisions.
export function followPosition(player:{x:number;z:number},yaw:number,slot:number){
 const x=(slot%2===0?-1:1)*12,z=-18-Math.floor(slot/2)*12,c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:player.x+x*c+z*s,z:player.z+z*c-x*s};
}
