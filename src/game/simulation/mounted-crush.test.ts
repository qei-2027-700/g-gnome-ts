import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
function setup(kind:'union-sentry'|'merc-sentry'|'merc-tactical'='union-sentry'){
 const s=new Simulation(),unit=makeUnit('own',kind,0,0,false),source=makeUnit('enemy','merc-sentry',100,200);
 s.units=[unit,source];s.human={x:0,z:0};s.board();s.iff='6707';
 const soldier=s.forceEject(source)!;soldier.flight=null;soldier.cooldown=0;soldier.x=0;soldier.z=0;
 return {s,unit,soldier};
}
test('occupied player vehicles kill enemy infantry on contact with a different IFF, protecting matching IFF across chassis',()=>{
 for(const kind of ['union-sentry','merc-sentry','merc-tactical'] as const)for(const iff of ['2620','6707']){
  const {s,unit,soldier}=setup(kind);s.iff=iff;soldier.health=999;
  const shield=unit.shield,parts={...unit.parts};s.events=[];s.tick(.016,idle);
  if(soldier.iff===unit.iff){assert.equal(soldier.health,999);assert.equal(soldier.alive,true);continue;}
  assert.equal(soldier.health,0);assert.equal(soldier.alive,false);assert.equal(s.status,'running');assert.equal(s.mounted,unit);
  assert.equal(unit.shield,shield);assert.deepEqual(unit.parts,parts);assert.equal(s.kills,1);
  s.tick(.016,idle);assert.equal(s.events.filter(e=>e.type==='soldier-death'&&e.soldier===soldier).length,1);
 }
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

test('AI vehicles sweep infantry by IFF during forward and reverse travel and respect ejection height',()=>{
 for(const same of [false,true])for(const reverse of [false,true])for(const altitude of [0,20]){
  const {s,unit,soldier}=setup();s.mounted=null;s.human={x:0,z:200};s.iff='0000';s.units=[unit];unit.alert=true;unit.iff=same?soldier.iff:'7777';unit.spec={...unit.spec,ai:{...unit.spec.ai,stopDistance:10000,keepMoving:false}};
  unit.x=0;unit.z=reverse?30:-30;unit.speed=reverse?-2000:2000;unit.cooldown=999;soldier.x=0;soldier.z=0;soldier.flight=altitude?{altitude,vy:0,vx:0,vz:0}:null;
  s.tick(.05,idle);assert.equal(soldier.alive,same||altitude>0,`${same}/${reverse}/${altitude}`);
 }
});
