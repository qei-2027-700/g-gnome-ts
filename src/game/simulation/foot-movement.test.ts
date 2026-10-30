import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,type Input} from './simulation.ts';
import {INFANTRY_MOVEMENT} from './infantry.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
function foot(){const s=new Simulation();s.units=[];return s;}
const step=(s:Simulation,count:number,input:Input=idle)=>{for(let i=0;i<count;i++)s.tick(.05,input);};
test('walking accelerates from a short tap and glides briefly after release before stopping',()=>{
 const s=foot();s.tick(.05,{...idle,forward:true});assert.ok(s.speed>0&&s.speed<INFANTRY_MOVEMENT.walk);const speed=s.speed,z=s.human.z;
 s.tick(.05,idle);assert.ok(s.speed>0&&s.speed<speed);assert.ok(s.human.z>z);step(s,25);assert.ok(Math.abs(s.speed)<1e-8);
 s.tick(.05,{...idle,back:true});assert.ok(s.speed<0&&s.speed>-INFANTRY_MOVEMENT.walk);s.tick(.05,{...idle,right:true});assert.ok(Math.abs(s.humanYaw-.09)<1e-9);
});
test('foot full power still reaches 32 km/h, latches on release and brakes gradually',()=>{
 const s=foot();step(s,25,{...idle,boost:true});assert.equal(s.throttle,1);assert.ok(Math.abs(s.speed*3.6-32)<1e-8);
 const z=s.human.z;s.tick(.05,idle);assert.ok(s.human.z>z);assert.equal(s.events.filter(e=>e.type==='boost').length,1);
 s.tick(.05,{...idle,stop:true,boost:true,forward:true});assert.equal(s.throttle,0);assert.ok(s.speed>0&&s.speed<INFANTRY_MOVEMENT.full);
 const braking=s.speed;step(s,3);assert.ok(s.speed>0&&s.speed<braking);step(s,25);assert.ok(Math.abs(s.speed)<1e-8);
});
test('reverse and prone cancel full power with inertia; ejection does not enable automatic walking',()=>{
 const s=foot();step(s,25,{...idle,boost:true});s.tick(.05,{...idle,back:true});assert.ok(s.speed>0);assert.equal(s.throttle,0);step(s,25,{...idle,back:true});assert.ok(Math.abs(s.speed+INFANTRY_MOVEMENT.walk)<1e-8);
 step(s,25,{...idle,boost:true});s.prone=true;step(s,25,{...idle,boost:true,forward:true});assert.ok(Math.abs(s.speed-INFANTRY_MOVEMENT.prone)<1e-8);assert.equal(s.throttle,0);
 const mounted=new Simulation();mounted.human={x:mounted.units[0].x,z:mounted.units[0].z};assert.ok(mounted.board());mounted.throttle=1;mounted.eject('ground');mounted.tick(.016,idle);assert.equal(mounted.speed,0);assert.equal(mounted.throttle,0);
});
test('full power cannot accelerate a player during an ejection flight',()=>{
 const s=foot();s.flight={altitude:20,vy:0,vx:0,vz:0};s.tick(.05,{...idle,boost:true});assert.equal(s.throttle,0);assert.equal(s.events.filter(e=>e.type==='boost').length,0);
});
