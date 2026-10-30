import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
import {advanceSimulation} from '../session.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
const step=(s:Simulation,n:number)=>{for(let i=0;i<n;i++)s.tick(1/60,idle);};
function foot(){const s=new Simulation();s.units=[];return s;}
for(const [weapon,slot,frames] of [['PRIF44',1,43],['GASHR',2,49]] as const){
 test(`${weapon} announces readiness once after an actual shot and a completed cooldown`,()=>{
  const s=foot();step(s,90);assert.equal(s.events.filter(e=>e.type==='foot-ready').length,0);
  s.fire(slot);step(s,10);assert.equal(s.events.filter(e=>e.type==='foot-ready').length,0);assert.ok(s.footCooldown[weapon]>0);
  step(s,frames);assert.equal(s.footCooldown[weapon],0);assert.equal(s.events.filter(e=>e.type==='foot-ready'&&e.weapon===weapon).length,1);
  step(s,90);assert.equal(s.events.filter(e=>e.type==='foot-ready').length,1);
  s.fire(slot);step(s,frames);assert.equal(s.events.filter(e=>e.type==='foot-ready'&&e.weapon===weapon).length,2);
 });
}
test('empty GASHR cannot announce Ready or replenish ammunition',()=>{
 const s=foot();s.gashrAmmo=1;s.fire(2);assert.equal(s.gashrAmmo,0);step(s,90);
 assert.equal(s.footCooldown.GASHR,0);assert.equal(s.events.filter(e=>e.type==='foot-ready').length,0);
 const shots=s.events.filter(e=>e.type==='shot').length;s.fire(2);step(s,90);assert.equal(s.events.filter(e=>e.type==='shot').length,shots);assert.equal(s.gashrAmmo,0);
});
test('pause freezes preparation; boarding cancels the pending infantry Ready announcement',()=>{
 const s=foot();s.fire(1);const cooldown=s.footCooldown.PRIF44;
 assert.equal(advanceSimulation(s,'pause',.05,idle),0);assert.equal(s.footCooldown.PRIF44,cooldown);
 const unit=makeUnit('own','union-sentry',0,0,false);s.units=[unit];assert.ok(s.board());step(s,90);
 assert.equal(s.events.filter(e=>e.type==='foot-ready').length,0);s.eject('ground');step(s,90);assert.equal(s.events.filter(e=>e.type==='foot-ready').length,0);
});
