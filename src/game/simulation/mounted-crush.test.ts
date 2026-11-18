import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
import {MISSION_3_5} from '../content/missions/mission-3-5.ts';
import {MISSION_4_2} from '../content/missions/mission-4-2.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
function setup(kind:'union-sentry'|'merc-sentry'|'merc-tactical'='union-sentry'){
 const s=new Simulation(),unit=makeUnit('own',kind,0,0,false),source=makeUnit('enemy','merc-sentry',100,200);
 s.units=[unit,source];s.human={x:0,z:0};s.board();s.iff='6707';
 const soldier=s.forceEject(source)!;soldier.flight=null;soldier.cooldown=0;soldier.x=0;soldier.z=0;
 return {s,unit,soldier};
}
test('player-driven vehicles crush enemy infantry regardless of IFF or chassis origin',()=>{
 for(const kind of ['union-sentry','merc-sentry','merc-tactical'] as const)for(const iff of ['2620','6707']){
  const {s,unit,soldier}=setup(kind);s.iff=iff;soldier.health=999;
  const shield=unit.shield,parts={...unit.parts};s.events=[];s.tick(.016,idle);
  assert.equal(soldier.health,0);assert.equal(soldier.alive,false);assert.equal(s.status,'running');assert.equal(s.mounted,unit);
  assert.equal(unit.shield,shield);assert.deepEqual(unit.parts,parts);assert.equal(s.kills,1);
  s.tick(.016,idle);assert.equal(s.events.filter(e=>e.type==='soldier-death'&&e.soldier===soldier).length,1);
 }
});
test('player-driven vehicles spare friendly infantry with a different IFF',()=>{
 const {s,soldier}=setup();soldier.faction=s.mission.playerFaction;soldier.iff='7777';
 s.tick(.016,idle);assert.equal(soldier.alive,true);assert.equal(soldier.health,35);
});
test('swept player vehicle movement crushes a soldier crossed between frames',()=>{
 const {s,unit,soldier}=setup();s.iff='2620';soldier.z=15;s.speed=2000;unit.speed=2000;
 s.tick(.016,idle);assert.ok(unit.z>20);assert.equal(soldier.alive,false);
});
test('an ejected soldier crossing into a stationary player vehicle dies on contact',()=>{
 const {s,unit,soldier}=setup();s.iff='2620';soldier.x=3.6;soldier.flight={altitude:.1,vy:0,vx:-10,vz:0};const shield=unit.shield;
 s.tick(.05,idle);assert.equal(soldier.alive,false);assert.equal(unit.shield,shield);
});
test('near misses, infantry above the vehicle and an empty vehicle do not kill enemy infantry',()=>{
 const miss=setup();miss.soldier.x=8;miss.s.tick(.016,idle);assert.equal(miss.soldier.alive,true);
 const above=setup();above.soldier.flight={altitude:20,vy:0,vx:0,vz:0};above.s.tick(.016,idle);assert.equal(above.soldier.alive,true);
 const empty=setup();empty.s.eject('ground');empty.s.tick(.016,idle);assert.equal(empty.soldier.alive,true);
});
test('a captured Scorp vehicle driven by the player crushes a Scorp soldier',()=>{
 const s=new Simulation('Easy',MISSION_3_5),captured=s.units.find(u=>u.id==='approach-td')!;
 s.eject('ground');s.flight=null;captured.pilot=false;s.human={x:captured.x,z:captured.z};assert.equal(s.board(),true);assert.equal(s.mounted,captured);
 const source=makeUnit('scorp-source','scorp-asv',captured.x+100,captured.z,true),soldier=s.forceEject(source,'boarding')!;
 soldier.flight=null;soldier.x=captured.x;soldier.z=captured.z;soldier.health=999;s.units=[captured,source];
 s.tick(.016,idle);assert.equal(soldier.alive,false);assert.equal(soldier.health,0);
});
test('4-2 Scorp defense vehicles crush enemy Union infantry and spare Scorp crew',()=>{
 const s=new Simulation('Easy',MISSION_4_2),guard=s.units.find(u=>u.id==='scorp-sentry-guard')!,attacker=s.units.find(u=>u.id==='sheridan-union-1')!;
 guard.pilot=false;s.human={x:guard.x,z:guard.z};assert.equal(s.board(),true);assert.equal(s.mounted,guard);
 attacker.iff=s.iff;const enemy=s.forceEject(attacker,'boarding')!;enemy.flight=null;enemy.x=guard.x;enemy.z=guard.z;enemy.health=999;
 s.units=[guard,attacker];s.tick(.016,idle);
 assert.equal(enemy.faction,'union');assert.equal(enemy.alive,false);assert.equal(enemy.health,0);
 const allyVehicle=makeUnit('scorp-crew','scorp-sentry',guard.x+100,guard.z,true),ally=s.forceEject(allyVehicle,'boarding')!;
 ally.flight=null;ally.x=guard.x;ally.z=guard.z;ally.iff='7777';s.tick(.016,idle);
 assert.equal(ally.faction,'scorp');assert.equal(ally.alive,true);
});

test('AI vehicles sweep opposing infantry during forward and reverse travel and respect ejection height',()=>{
 for(const same of [false,true])for(const reverse of [false,true])for(const altitude of [0,20]){
  const {s,unit,soldier}=setup();s.mounted=null;s.human={x:0,z:200};s.iff='0000';s.units=[unit];unit.alert=true;unit.iff=same?soldier.iff:'7777';unit.spec={...unit.spec,ai:{...unit.spec.ai,stopDistance:10000,keepMoving:false}};
  unit.x=0;unit.z=reverse?30:-30;unit.speed=reverse?-2000:2000;unit.cooldown=999;soldier.x=0;soldier.z=0;soldier.faction=same?s.mission.playerFaction:'merc';soldier.flight=altitude?{altitude,vy:0,vx:0,vz:0}:null;
  s.tick(.05,idle);assert.equal(soldier.alive,same||altitude>0,`${same}/${reverse}/${altitude}`);
 }
});
