import type {Unit} from '../simulation/simulation.ts';
// Meter activity is visual only: steering never creates forward velocity.
export class CockpitMotionMeter {
 level=0;private pulse=0;private previous:{id:string;yaw:number;aim:number;pitch:number}|null=null;
 update(unit:Unit|null,pitch:number,dt:number){
  if(!unit){this.previous=null;this.pulse=0;this.level=0;return;}
  const before=this.previous;this.previous={id:unit.id,yaw:unit.yaw,aim:unit.aim,pitch};
  if(!before||before.id!==unit.id){this.pulse=0;}else if(dt>0){
   const delta=(a:number,b:number)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
   const activity=(delta(unit.yaw,before.yaw)+delta(unit.aim-unit.yaw,before.aim-before.yaw)+Math.abs(pitch-before.pitch))/dt;
   const target=Math.min(.07,activity*.055);this.pulse+=(target-this.pulse)*(1-Math.exp(-dt*9));if(this.pulse<.0001)this.pulse=0;
  }
  this.level=Math.min(1,Math.abs(unit.speed)/(unit.spec.speed/3.6||1)+this.pulse);
 }
}
