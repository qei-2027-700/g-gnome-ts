import {VEHICLE_SHAPES,mercAssaultLegPose} from '../content/vehicle-shapes.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GAITS,legPose} from './locomotion.ts';
import {DRIVE_PROFILES} from './audio.ts';
import {DARKEN_TACTICAL_HIP_Y,DARKEN_TACTICAL_SHIN,DARKEN_TACTICAL_THIGH,resolveVehicle,VEHICLE_DRIVE_PROFILES,VEHICLE_GAITS,VEHICLES,type VehicleKind} from '../content/vehicles.ts';
const kinds=Object.keys(GAITS).filter(kind=>!kind.endsWith('-asv')) as VehicleKind[];
test('every vehicle kind has shape, gait and drive profile data',()=>{
 const kinds=Object.keys(VEHICLES).sort();
 assert.deepEqual(Object.keys(VEHICLE_SHAPES).sort(),kinds);
 assert.deepEqual(Object.keys(GAITS).sort(),kinds);
 assert.deepEqual(Object.keys(DRIVE_PROFILES).sort(),kinds);
 for(const kind of kinds as VehicleKind[]){
  assert.deepEqual(VEHICLE_SHAPES[kind],VEHICLES[kind].shape);
  assert.deepEqual(GAITS[kind],VEHICLE_GAITS[kind]);
  assert.deepEqual(DRIVE_PROFILES[kind],VEHICLE_DRIVE_PROFILES[kind]);
 }
 const resolved=resolveVehicle('union-sentry');
 assert.ok(!('shape'in resolved||'gait'in resolved||'drive'in resolved));
});
test('articulated feet land on the ground and lift during recovery on every biped chassis',()=>{
 for(const kind of kinds)for(const run of [.2,.5,1])for(let i=0;i<32;i++){
  const phase=i/32*Math.PI*2,height=VEHICLES[kind].height,shape=VEHICLE_SHAPES[kind],scale='legScale' in shape?shape.legScale.y:1,hipHeight=('legHip' in shape?shape.legHip:height*.5)-.55*run+Math.abs(Math.sin(phase))*GAITS[kind].bounce*(kind==='merc-tactical'?run:Math.sqrt(run)),pose=legPose(kind,phase,run,hipHeight),upper=kind==='darken-tactical'?DARKEN_TACTICAL_THIGH:height*.26,lower=kind==='darken-tactical'?DARKEN_TACTICAL_SHIN:height*.22;
  const footY=hipHeight-upper*scale*Math.cos(pose.hip)-lower*scale*Math.cos(pose.hip+pose.knee);
  assert.ok(Math.abs(footY-(.225*scale+pose.lift))<.005,`${kind}: ground contact`);assert.ok(pose.lift>=0);assert.ok(Math.abs(pose.hip+pose.knee+pose.ankle-pose.solePitch)<1e-8);if(kind!=='merc-tactical'||i<=16)assert.equal(pose.solePitch,0);
  if(i<16||GAITS[kind].lift===0)assert.equal(pose.lift,0);else if(i>16)assert.ok(pose.lift>0);
 }
 assert.ok(GAITS['merc-sentry'].lift>GAITS['union-sentry'].lift);
 const stalker=legPose('darken-tactical',0,0,DARKEN_TACTICAL_HIP_Y);
 assert.ok(stalker.hip>.5&&stalker.knee< -1.5);assert.ok(Math.abs(stalker.hip+stalker.knee+stalker.ankle)<1e-8);
});

test('Merc Tactical running raises its sole toward the rear while the supporting foot stays flat',()=>{
 const run=legPose('merc-tactical',Math.PI*1.5,1,4.2),support=legPose('merc-tactical',Math.PI*.5,1,4.2),slow=legPose('merc-tactical',Math.PI*1.5,.2,4.2),stopped=legPose('merc-tactical',Math.PI*1.5,0,4.75);
 assert.ok(run.lift>1.5);assert.ok(run.solePitch>Math.PI/3);assert.ok(Math.sin(run.solePitch)>.9);assert.equal(support.lift,0);assert.equal(support.solePitch,0);assert.ok(slow.solePitch<run.solePitch);assert.equal(stopped.solePitch,0);assert.equal(stopped.lift,0);
 assert.equal(legPose('union-tactical',Math.PI*1.5,1,4.2).solePitch,0);
});

test('infantry flexes its knees on recovery while the supporting boot stays planted and level',async()=>{
 const {infantryLegPose,INFANTRY_GAIT}=await import('./locomotion.ts');
 for(const run of [.2,.5,1])for(const direction of [-1,1])for(let i=0;i<32;i++){
  const phase=i/32*Math.PI*2,bob=run*(-.035+.012*Math.abs(Math.sin(phase*2))),hipHeight=INFANTRY_GAIT.upper+INFANTRY_GAIT.lower+INFANTRY_GAIT.sole+bob,pose=infantryLegPose(phase,run,hipHeight,direction);
  const ankle=hipHeight-INFANTRY_GAIT.upper*Math.cos(pose.hip)-INFANTRY_GAIT.lower*Math.cos(pose.hip+pose.knee);
  assert.ok(Math.abs(ankle-(INFANTRY_GAIT.sole+pose.lift))<.005);assert.ok(Math.abs(pose.hip+pose.knee+pose.ankle)<1e-8);
  if(i<16)assert.equal(pose.lift,0);
 }
 assert.ok(infantryLegPose(Math.PI*1.5,1,.965).knee>1);assert.equal(infantryLegPose(0,0,1).knee,0);
});


test('Merc Assault legs swing their knees sideways and carry raised feet outward while supporting toes stay planted',()=>{
 for(const side of [-1,1])for(const front of [-1,1]){
  const offset=side*front>0?0:Math.PI,rest=mercAssaultLegPose(side,front),swing=mercAssaultLegPose(side,front,Math.PI/2-offset,1),stance=mercAssaultLegPose(side,front,Math.PI*1.5-offset,1),slow=mercAssaultLegPose(side,front,Math.PI/2-offset,.25);
  assert.ok(Math.abs(swing.knee.x)-Math.abs(stance.knee.x)>1.5);assert.ok(Math.abs(swing.foot.x)-Math.abs(rest.foot.x)>1);assert.equal(stance.foot.x,rest.foot.x);assert.equal(stance.foot.y,.1);assert.ok(swing.foot.y>.1);assert.ok(Math.abs(slow.foot.x)<Math.abs(swing.foot.x));
  assert.deepEqual(mercAssaultLegPose(side,front,1.7,0),rest);
 }
});

test('legPose is deterministic for every vehicle kind and representative inputs',()=>{
 const phases=[-Math.PI*2,-Math.PI,0,Math.PI/2,Math.PI*2,17.4],runs=[0,.25,.5,1],heights=[0,.225,1];
 for(const kind of Object.keys(GAITS) as VehicleKind[])for(const phase of phases)for(const run of runs)for(const hipHeight of heights){
  assert.deepEqual(legPose(kind,phase,run,hipHeight),legPose(kind,phase,run,hipHeight),`${kind}: ${phase}, ${run}, ${hipHeight}`);
 }
});
