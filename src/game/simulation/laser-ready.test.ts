import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
import {advanceSimulation} from '../session.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
const step=(s:Simulation,n:number)=>{for(let i=0;i<n;i++)s.tick(1/60,idle);};
function setup(kind:'union-sentry'|'merc-sentry'='union-sentry'){
 const s=new Simulation(),unit=makeUnit('own',kind,0,0,false);s.units=[unit];s.human={x:0,z:0};assert.ok(s.board());return {s,unit};
}
for(const kind of ['union-sentry','merc-sentry'] as const){
 test(`${kind} acknowledges full laser charge once after each shot, never on spawn`,()=>{
  const {s,unit}=setup(kind),slot=kind==='union-sentry'?2:1;
  step(s,90);assert.equal(s.events.filter(e=>e.type==='laser-ready').length,0);
  s.fire(slot);step(s,10);assert.ok(unit.laserCharge<1);assert.equal(s.events.filter(e=>e.type==='laser-ready').length,0);
  step(s,120);assert.equal(unit.laserCharge,1);assert.equal(s.events.filter(e=>e.type==='laser-ready').length,1);
  step(s,120);assert.equal(s.events.filter(e=>e.type==='laser-ready').length,1);
  s.fire(slot);step(s,120);assert.equal(s.events.filter(e=>e.type==='laser-ready').length,2);
 });
}
test('moving delays Ready until full charge and pausing cannot complete recharge',()=>{
 const parked=setup(),moving=setup();parked.s.fire(2);moving.s.fire(2);moving.s.throttle=.7;
 assert.equal(advanceSimulation(parked.s,'pause',.05,idle),0);assert.equal(parked.unit.laserCharge,0);
 step(parked.s,40);step(moving.s,40);
 assert.equal(parked.s.events.filter(e=>e.type==='laser-ready').length,1);assert.equal(moving.s.events.filter(e=>e.type==='laser-ready').length,0);
 step(moving.s,90);assert.equal(moving.s.events.filter(e=>e.type==='laser-ready').length,1);
});
test('finishing recharge while dismounted does not announce Ready later on boarding',()=>{
 const {s,unit}=setup();s.fire(2);s.eject('ground');step(s,90);
 assert.equal(unit.laserCharge,1);assert.equal(s.events.filter(e=>e.type==='laser-ready').length,0);
 s.human={x:unit.x,z:unit.z};assert.ok(s.board());step(s,10);assert.equal(s.events.filter(e=>e.type==='laser-ready').length,0);
});
