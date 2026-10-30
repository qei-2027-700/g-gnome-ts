import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CockpitMotionMeter} from './cockpit-motion.ts';
import {makeUnit} from '../simulation/simulation.ts';
test('stationary steering, turret movement and vertical aim briefly lift the yellow meter without moving the unit',()=>{
 for(const kind of ['turn','turret','pitch']){
  const unit=makeUnit('own','union-asv',0,0,false),meter=new CockpitMotionMeter();meter.update(unit,0,.02);
  if(kind==='turn'){unit.yaw=.1;unit.aim=.1;}if(kind==='turret')unit.aim=.1;
  const pitch=kind==='pitch'?.1:0;meter.update(unit,pitch,.02);assert.ok(meter.level>0&&meter.level<=.07);assert.equal(unit.speed,0);assert.equal(unit.x,0);assert.equal(unit.z,0);
  for(let i=0;i<60;i++)meter.update(unit,pitch,1/60);assert.equal(meter.level,0);
 }
});
test('the meter follows actual speed through braking and resets across boarding without a false pulse',()=>{
 const unit=makeUnit('own','scorp-asv',0,0,false),meter=new CockpitMotionMeter();unit.speed=unit.spec.speed/3.6*.5;meter.update(unit,0,.02);assert.equal(meter.level,.5);
 unit.speed/=2;meter.update(unit,0,.02);assert.equal(meter.level,.25);meter.update(null,0,.02);assert.equal(meter.level,0);
 const other=makeUnit('other','union-tactical',0,0,false);other.yaw=2;meter.update(other,0,.02);assert.equal(meter.level,0);
});
