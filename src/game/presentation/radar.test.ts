import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from '../simulation/simulation.ts';
import {radarPoint} from './radar.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};

test('tower radar follows actual keyboard, mouse and tracking aim while its base remains fixed',()=>{
 for(const kind of ['merc-meson-tower','scorp-rocket-tower'] as const){
  const s=new Simulation(),u=makeUnit('tower',kind,0,0,false),target=makeUnit('target','merc-aip',0,200,true,{speed:0,ai:{detection:0}});target.iff='enemy';s.units=[u,target];s.human={x:0,z:0};s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.completionEnabled=false;assert.ok(s.board());
  assert.deepEqual(radarPoint(s,target,400),{x:200,y:82.5});
  for(let i=0;i<60;i++)s.tick(1/60,{...idle,right:true});assert.equal(u.yaw,0);assert.equal(u.x,0);assert.equal(u.z,0);const keyed=radarPoint(s,target,400);assert.ok(keyed.x<115);assert.ok(Math.abs(keyed.y-130)<4);
  s.aimMouseBy(-200,0);const dragged=radarPoint(s,target,400);assert.ok(dragged.x>keyed.x);assert.equal(u.yaw,0);
  s.selected=target.id;s.tracking=true;for(let i=0;i<60;i++)s.tick(1/60,idle);const tracked=radarPoint(s,target,400);assert.ok(Math.abs(tracked.x-200)<1e-8);assert.ok(Math.abs(tracked.y-82.5)<1e-8);
  target.x=80;target.z=100;const moved=radarPoint(s,target,400);assert.ok(Math.abs(moved.x-236)<1e-8);assert.ok(Math.abs(moved.y-106.25)<1e-8);
 }
});
test('ordinary vehicle radar stays chassis-relative and updates when the player moves',()=>{
 const s=new Simulation(),u=makeUnit('own','merc-assault',0,0,false),target={x:0,z:200};s.units=[u];s.human={x:0,z:0};s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.completionEnabled=false;assert.ok(s.board());s.aimMouseBy(100,0);assert.equal(u.yaw,0);assert.deepEqual(radarPoint(s,target,400),{x:200,y:82.5});
 for(let i=0;i<60;i++)s.tick(1/60,{...idle,forward:true});assert.ok(u.z>0);assert.ok(radarPoint(s,target,400).y>82.5);
 for(let i=0;i<60;i++)s.tick(1/60,{...idle,right:true,stop:true});assert.ok(radarPoint(s,target,400).x<200);
});
