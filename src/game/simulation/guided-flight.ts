import {VISOM_GUIDANCE} from '../content/weapons.ts';
type Velocity={vx:number;vy:number;vz:number};
export function steerMissile(missile:Velocity,yawDelta:number,pitchDelta:number){
 if(yawDelta===0&&pitchDelta===0)return;
 const speed=Math.hypot(missile.vx,missile.vy,missile.vz),yaw=Math.atan2(missile.vx,missile.vz)+yawDelta;
 const pitch=Math.max(-VISOM_GUIDANCE.pitchLimit,Math.min(VISOM_GUIDANCE.pitchLimit,Math.atan2(missile.vy,Math.hypot(missile.vx,missile.vz))+pitchDelta));
 missile.vx=Math.sin(yaw)*Math.cos(pitch)*speed;missile.vy=Math.sin(pitch)*speed;missile.vz=Math.cos(yaw)*Math.cos(pitch)*speed;
}

// Rotate toward the target by at most turnRate * dt without changing speed.
// Once the target leaves the seeker cone, the caller releases the target.
export function homeMissile(missile:Velocity&{x:number;y:number;z:number},target:{x:number;y:number;z:number},turnRate:number,cone:number,dt:number){
 const speed=Math.hypot(missile.vx,missile.vy,missile.vz),dx=target.x-missile.x,dy=target.y-missile.y,dz=target.z-missile.z,length=Math.hypot(dx,dy,dz);
 if(!speed||!length)return true;
 const dot=Math.max(-1,Math.min(1,(missile.vx*dx+missile.vy*dy+missile.vz*dz)/(speed*length))),angle=Math.acos(dot);
 if(angle>cone)return false;
 if(angle<1e-8||dt<=0||turnRate<=0)return true;
 const turn=Math.min(angle,turnRate*dt),a=Math.sin(angle-turn)/Math.sin(angle),b=Math.sin(turn)/Math.sin(angle)*speed/length;
 const vx=missile.vx*a+dx*b,vy=missile.vy*a+dy*b,vz=missile.vz*a+dz*b,scale=speed/Math.hypot(vx,vy,vz);
 missile.vx=vx*scale;missile.vy=vy*scale;missile.vz=vz*scale;return true;
}
