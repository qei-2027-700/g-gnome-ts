import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
import {sweptVehicleContact} from './parts.ts';
import {MISSION} from '../content/mission-1-1.ts';
import {type Difficulty} from '../settings.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
const step=(s:Simulation,seconds:number)=>{for(let i=0;i<seconds*60;i++)s.tick(1/60,idle);};
function foot(difficulty:Difficulty='Easy'){const s=new Simulation(difficulty);s.units[0].x=100;s.units[0].z=-50;s.units[1].x=0;s.units[1].z=100;s.units[1].cooldown=999;s.iff='6707';return s;}
test('different IFF contact is fatal standing or prone; matching IFF protects across factions',()=>{
 for(const kind of ['merc-sentry','merc-tactical'] as const)for(const prone of [false,true])for(const same of [false,true]){
  const s=foot(),enemy=s.units[1];enemy.kind=kind;s.prone=prone;if(!same)s.iff='2620';s.human={x:enemy.x,z:enemy.z};s.tick(.016,idle);
  if(same){assert.equal(s.status,'running');assert.equal(s.humanHealth,100);continue;}
  assert.equal(s.status,'lost');assert.equal(s.humanHealth,0);assert.equal(s.events.filter(e=>e.type==='lose').length,1);s.tick(.016,idle);assert.equal(s.events.filter(e=>e.type==='lose').length,1);
 }
});
test('empty and destroyed vehicles do not crush infantry, and empty vehicles remain boardable',()=>{
 const s=foot(),enemy=s.units[1];enemy.pilot=false;s.human={x:enemy.x,z:enemy.z};s.tick(.016,idle);assert.equal(s.mounted,enemy);assert.equal(s.status,'running');assert.equal(enemy.alert,false);assert.equal(s.humanHealth,100);
 const dead=foot();dead.units[1].alive=false;dead.human={x:dead.units[1].x,z:dead.units[1].z};dead.tick(.016,idle);assert.equal(dead.status,'running');assert.equal(dead.humanHealth,100);
});
test('swept contact catches crossing vehicles but not infantry safely above the HAWC',()=>{
 const s=foot(),enemy=s.units[1];enemy.x=10;enemy.z=0;
 assert.equal(sweptVehicleContact(enemy,{x:-10,z:0},{x:0,y:0,z:0},{x:0,y:0,z:0}),true);
 s.flight={altitude:20,vy:0,vx:0,vz:0};s.human={x:enemy.x,z:enemy.z};s.tick(.016,idle);assert.equal(s.status,'running');assert.equal(s.humanHealth,100);
});
test('CHUM and SAG5T direct hits kill infantry on every difficulty, regardless of health or posture',()=>{
 for(const difficulty of ['Easy','Medium','Hard'] as const)for(const weapon of ['CHUM','SAG5T'] as const)for(const prone of [false,true]){
  const s=foot(difficulty);s.prone=prone;s.fireMissile(s.units[1],weapon);step(s,.2);assert.equal(s.humanHealth,100);step(s,2);assert.equal(s.humanHealth,0);assert.equal(s.status,'lost');
 }
});
test('missile near misses and cover are safe; mounted protection and ordinary small arms remain',()=>{
 const dodge=foot();dodge.fireMissile(dodge.units[1],'CHUM');dodge.human.x=120;step(dodge,2);assert.equal(dodge.humanHealth,100);
 const cover=foot();cover.human={x:-40,z:20};cover.units[1].x=-40;cover.units[1].z=120;cover.fireMissile(cover.units[1],'CHUM');step(cover,2);assert.equal(cover.humanHealth,100);
 const mounted=new Simulation();mounted.human={...MISSION.vehicle};mounted.board();mounted.units[1].x=0;mounted.units[1].z=100;mounted.units[1].cooldown=999;mounted.iff='6707';mounted.fireMissile(mounted.units[1],'CHUM');step(mounted,2);assert.equal(mounted.status,'running');assert.ok(mounted.mounted!.shield<35);
 const ordinary=foot();ordinary.damage(null,5);assert.equal(ordinary.humanHealth,95);assert.equal(ordinary.status,'running');
});
test('ejected enemy infantry also dies from direct missile contact',()=>{
 const s=foot(),soldier=s.forceEject(s.units[1])!;step(s,3);const shooter=s.units[2];shooter.x=soldier.x;shooter.z=soldier.z+40;shooter.cooldown=999;
 const p=s.fireMissile(shooter,'CHUM');p.x=soldier.x;p.y=1;p.z=soldier.z+10;p.vx=0;p.vy=0;p.vz=-100;step(s,.2);assert.equal(soldier.alive,false);assert.equal(soldier.health,0);
});


function aiMissileVolley(airborne:boolean,index:number){
 const def=structuredClone(MISSION);def.completionEnabled=false;def.rocks=[];def.units=[{id:'own',kind:'union-sentry',x:0,z:0,pilot:false}];def.assignedUnitId='own';def.startMountedUnitId='own';
 const s=new Simulation('Easy',def);s.eject(airborne?'launch':'ground');s.units=[];
 const shooter=makeUnit(`tower-${index}`,'scorp-rocket-tower',0,110,true);shooter.iff='enemy';shooter.aim=shooter.yaw=Math.atan2(s.human.x-shooter.x,s.human.z-shooter.z);s.units=[shooter];s.tick(1/60,idle);shooter.cooldown=999;
 return s;
}
test('AI volleys can miss stationary infantry and hit ejected players substantially less often',()=>{
 const hits:number[]=[],spread:number[]=[],delay:number[]=[];
 for(const airborne of [false,true]){let landed=0,totalSpread=0,totalDelay=0;
  for(let index=0;index<32;index++){
   const s=aiMissileVolley(airborne,index);assert.equal(s.missiles.length,2);if(airborne)assert.ok(s.flight);
   for(const p of s.missiles){assert.ok(p.aiGuidance);totalSpread+=Math.hypot(p.aiGuidance.offset.x,p.aiGuidance.offset.y,p.aiGuidance.offset.z);totalDelay+=p.aiGuidance.refreshAt-s.time;}
   step(s,2.5);if(s.humanHealth<100)landed++;
  }
  hits.push(landed);spread.push(totalSpread);delay.push(totalDelay);
 }
 assert.ok(hits[0]>0&&hits[0]<32,`grounded trials hit: ${hits[0]}/32`);assert.ok(hits[1]<hits[0],`ejection trials hit: ${hits[1]}/32; grounded: ${hits[0]}/32`);assert.ok(spread[1]>spread[0]*2);assert.ok(delay[1]>delay[0]);
});
test('ejecting changes aiming accuracy but gives no immunity to a physical missile hit',()=>{
 const s=aiMissileVolley(true,0),p=s.missiles[0];assert.ok(s.flight);s.missiles=[p];p.homingTargetId=undefined;p.aiGuidance=undefined;p.x=s.human.x;p.z=s.human.z+1;p.y=s.flight.altitude+1;p.vx=0;p.vy=0;p.vz=-110;
 s.tick(.02,idle);assert.equal(s.humanHealth,0);assert.equal(s.status,'lost');
});


test('airborne infantry killed by hostile vehicle contact keeps falling without acting or duplicate deaths',()=>{
 const s=foot(),source=s.units[1],person=s.forceEject(source,'boarding')!;
 const vehicle=makeUnit('crusher','union-asv',0,70,true);vehicle.iff='opponent';vehicle.cooldown=999;s.units=[vehicle];s.human={x:100,z:0};person.x=0;person.z=70;person.flight={altitude:1,vy:-1,vx:3,vz:0};
 s.tick(1/60,idle);assert.equal(person.alive,false);assert.ok(person.flight);const height=person.flight!.altitude,x=person.x,shots=s.events.filter(e=>e.type==='shot').length;
 step(s,.1);assert.ok(person.flight!.altitude<height);assert.ok(person.x>x);step(s,2);assert.equal(person.flight,null);assert.equal(person.health,0);assert.equal(s.events.filter(e=>e.type==='soldier-death'&&e.soldier===person).length,1);assert.equal(s.events.filter(e=>e.type==='shot').length,shots);
});
