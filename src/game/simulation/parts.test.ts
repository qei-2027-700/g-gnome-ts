import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
import {PARTS,freshParts,intersectParts} from './parts.ts';
import {partColor} from '../presentation/part-color.ts';
import {hologramSvg} from '../presentation/hologram.ts';
import {MISSION} from '../content/mission-1-1.ts';
import {VEHICLES} from '../content/vehicles.ts';
import {LASER_RECHARGE_SECONDS,LASERS} from '../content/weapons.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
function mounted(){const s=new Simulation();s.human={...MISSION.vehicle};s.board();return s;}
test('self and enemy damage is local; shields absorb hits and regeneration does not repair parts',()=>{
 for(const own of [true,false]){
  const s=mounted(),u=own?s.mounted!:s.units[1];u.shield=0;const initial=freshParts();s.damage(u,VEHICLES[u.kind].armor*.3,'leftLeg');
  assert.equal(partColor(u.parts.leftLeg),'#ff0000');for(const part of PARTS)if(part!=='leftLeg')assert.equal(u.parts[part],initial[part]);
  const before=u.parts.leftLeg;s.time=20;s.tick(.05,idle);assert.equal(u.parts.leftLeg,before);assert.ok(u.shield>0);
  const v=makeUnit('new',u.kind,0,0);s.damage(v,2,'rightWeapon');assert.deepEqual(v.parts,freshParts());
 }
});
test('hit regions follow hull/upper rotation and separate left/right legs and weapons',()=>{
 const u=makeUnit('unit','merc-sentry',0,0);
 const leg=intersectParts(u,{x:-1.3,y:1,z:-10},{x:-1.3,y:1,z:10});assert.equal(leg?.part,'leftLeg');
 const weapon=intersectParts(u,{x:2.05,y:5.1,z:10},{x:2.05,y:5.1,z:-10});assert.equal(weapon?.part,'rightWeapon');
 u.aim=Math.PI/2;const turned=intersectParts(u,{x:10,y:5.1,z:-2.05},{x:-10,y:5.1,z:-2.05});assert.equal(turned?.part,'rightWeapon');
});
test('Sentry hit regions distinguish the low Union cabin from the tall Merc cabin',()=>{
 const union=makeUnit('union','union-sentry',0,0),merc=makeUnit('merc','merc-sentry',0,0);
 const from={x:0,y:6,z:10},to={x:0,y:6,z:-10};
 assert.equal(intersectParts(union,from,to),null);
 assert.equal(intersectParts(merc,from,to)?.part,'cockpit');
 assert.equal(intersectParts(union,{x:0,y:4.3,z:10},{x:0,y:4.3,z:-10})?.part,'cockpit');
});
test('aiming at a leg damages that leg and the shot event ends at the real contact point',()=>{
 const s=mounted(),target=s.units[1];target.x=0;target.z=100;target.shield=0;
 s.mounted!.aim=Math.atan2(-1.3,82);s.pitch=Math.atan2(1.5-s.eyeHeight,Math.hypot(1.3,82));
 for(let i=0;i<4;i++){s.mounted!.cooldown=0;s.fire(1);}
 assert.ok(target.parts.leftLeg<.6);for(const part of PARTS)if(part!=='leftLeg')assert.equal(target.parts[part],1);
 assert.ok(s.events.some(e=>e.type==='hit'&&e.part==='leftLeg'&&e.position));assert.equal(s.selected,target.id);
});
test('both holograms color only the damaged path and new units start undamaged',()=>{
 const u=makeUnit('unit','merc-sentry',0,0);u.parts.leftWeapon=.1;
 const svg=hologramSvg(u.kind,u.parts);const paths=svg.match(/<path[^>]+>/g)!;assert.equal(paths.length,6);
 for(const path of paths)assert.ok(path.includes(path.includes('data-part="leftWeapon"')?'stroke="#ff0000"':'stroke="#72ff75"'));
 const s=new Simulation();s.units[0].parts.leftLeg=.2;const reset=new Simulation();assert.deepEqual(reset.units[0].parts,freshParts());assert.notEqual(reset.units[0].parts,reset.units[1].parts);
});
test('laser charge drains on firing, recharges over time, permits partial-charge refire and survives boarding',()=>{
 const s=mounted(),u=s.mounted!;s.units=[u];s.fire(2);assert.equal(u.laserCharge,0);
 u.cooldown=0;const energy=u.energy;s.fire(2);assert.equal(u.energy,energy-2);assert.equal(u.laserCharge,0);
 for(let i=0;i<10;i++)s.tick(.02,idle);assert.ok(u.laserCharge>0&&u.laserCharge<1);
 const before=u.laserCharge;s.eject('ground');s.tick(.01,idle);assert.ok(u.laserCharge>before);s.human={x:u.x,z:u.z};s.board();assert.ok(u.laserCharge<1);
 for(let i=0;i<Math.ceil(Math.max(LASER_RECHARGE_SECONDS,LASERS['FIL-30'].interval)/.02);i++)s.tick(.02,idle);assert.equal(u.laserCharge,1);
 s.fire(2);assert.equal(u.laserCharge,0);assert.equal(new Simulation().units[0].laserCharge,1);
});


test('concentrating hits destroys a part and its vehicle earlier than spreading the same damage',()=>{
 for(const own of [false,true]){const focused=mounted(),spread=mounted();const a=own?focused.mounted!:focused.units[1],b=own?spread.mounted!:spread.units[1];a.shield=0;b.shield=0;
  for(let i=0;i<3;i++)focused.damage(a,15,'leftLeg');
  for(const part of ['leftLeg','rightLeg','hull'] as const)spread.damage(b,15,part);
  assert.equal(a.alive,false);assert.equal(a.parts.leftLeg,0);assert.equal(focused.events.filter(e=>e.type==='destroy').length,1);assert.equal(b.alive,true);assert.ok(b.parts.leftLeg>0);assert.equal(focused.status,'running');if(own)assert.ok(focused.flight);
  focused.damage(a,15,'leftLeg');assert.equal(focused.events.filter(e=>e.type==='destroy').length,1);
 }
});
test('aggregate damage alone does not destroy a vehicle with intact parts; shields protect local durability',()=>{
 const s=mounted(),u=s.units[1];u.shield=0;for(const part of PARTS)s.damage(u,15,part);assert.equal(u.alive,true);assert.ok(u.armor>0);assert.ok(PARTS.every(p=>u.parts[p]>0));
 const before={...u.parts};u.shield=10;s.damage(u,5,'cockpit');assert.deepEqual(u.parts,before);s.damage(u,20,'cockpit');assert.equal(u.alive,false);assert.equal(u.armor,0);
});


test('actual aimed shots can finish a previously damaged leg without damaging the other parts',()=>{
 const s=mounted(),target=s.units[1];target.x=0;target.z=100;target.shield=0;target.parts.leftLeg=.3;
 s.mounted!.aim=Math.atan2(-1.3,82);s.pitch=Math.atan2(1.5-s.eyeHeight,Math.hypot(1.3,82));
 s.fire(1);assert.equal(target.alive,true);s.mounted!.cooldown=0;s.fire(1);assert.equal(target.alive,false);assert.equal(target.parts.leftLeg,0);for(const part of PARTS)if(part!=='leftLeg')assert.equal(target.parts[part],1);
});

test('Tactical Defense separates its high cockpit, raised shoulders, narrow waist and wide legs',()=>{
 const u=makeUnit('tactical','merc-tactical',0,0);
 assert.equal(intersectParts(u,{x:0,y:7.1,z:12},{x:0,y:7.1,z:-12})?.part,'cockpit');
 assert.equal(intersectParts(u,{x:2.65,y:7.75,z:12},{x:2.65,y:7.75,z:-12})?.part,'rightWeapon');
 assert.equal(intersectParts(u,{x:0,y:5.25,z:12},{x:0,y:5.25,z:-12})?.part,'hull');
 assert.equal(intersectParts(u,{x:1.6,y:1,z:12},{x:1.6,y:1,z:-12})?.part,'rightLeg');
 u.yaw=Math.PI/2;u.aim=u.yaw;assert.equal(intersectParts(u,{x:12,y:7.75,z:-2.65},{x:-12,y:7.75,z:-2.65})?.part,'rightWeapon');
});

test('Scorp ASV leaves a central gap below the bridge while both separated tracks remain hittable',()=>{
 const u=makeUnit('scorp','scorp-asv',0,0);
 assert.equal(intersectParts(u,{x:0,y:.8,z:12},{x:0,y:.8,z:-12}),null);
 assert.equal(intersectParts(u,{x:0,y:1.86,z:12},{x:0,y:1.86,z:-12})?.part,'hull');
 for(const [x,part] of [[-2.15,'leftLeg'],[2.15,'rightLeg']] as const)assert.equal(intersectParts(u,{x,y:.8,z:12},{x,y:.8,z:-12})?.part,part);
 u.aim=Math.PI/2;assert.equal(intersectParts(u,{x:12,y:2.12,z:0},{x:-12,y:2.12,z:0})?.part,'hull');
});

test('rocket tower canopy, column, launch panels and flared supports have separate fixed hit regions',()=>{
 const u=makeUnit('tower','scorp-rocket-tower',0,0);
 for(const rotation of [0,Math.PI/2]){u.yaw=rotation;u.aim=rotation+.3;
  assert.equal(intersectParts(u,{x:0,y:10.8,z:15},{x:0,y:10.8,z:-15})?.part,'cockpit');
  assert.equal(intersectParts(u,{x:0,y:4,z:15},{x:0,y:4,z:-15})?.part,'hull');
  for(const side of [-1,1]){
   assert.equal(intersectParts(u,{x:side*2.95,y:8.35,z:15},{x:side*2.95,y:8.35,z:-15})?.part,side<0?'leftWeapon':'rightWeapon');
   assert.equal(intersectParts(u,{x:side*3.6,y:1,z:15},{x:side*3.6,y:1,z:-15})?.part,side<0?'leftLeg':'rightLeg');
  }
  assert.equal(intersectParts(u,{x:0,y:12.5,z:15},{x:0,y:12.5,z:-15}),null);
 }
});

test('crossing into yellow announces Damage once, in sync with the visual threshold and without a shield warning overriding it',()=>{
 const s=mounted(),u=s.mounted!;s.units=[u];u.shield=0;
 s.damage(u,23.99,'hull');s.tick(.016,idle);assert.equal(partColor(u.parts.hull),'#72ff75');assert.equal(s.events.filter(e=>e.type==='warning'&&e.text==='ダメージ').length,0);
 s.events=[];u.shield=0;s.damage(u,.02,'hull');s.tick(.016,idle);assert.equal(partColor(u.parts.hull),'#ffe000');assert.deepEqual(s.events.filter(e=>e.type==='warning').map(e=>e.text),['ダメージ']);
 s.events=[];for(let i=0;i<120;i++)s.tick(1/60,idle);s.damage(u,1,'hull');s.tick(.016,idle);assert.equal(s.events.filter(e=>e.type==='warning'&&e.text==='ダメージ').length,0);
 u.shield=0;s.damage(u,14.1,'leftWeapon');s.damage(u,14.1,'rightWeapon');s.tick(.016,idle);assert.equal(s.events.filter(e=>e.type==='warning'&&e.text==='ダメージ').length,1);
 s.events=[];s.eject('ground');s.board();s.tick(.016,idle);assert.equal(s.events.filter(e=>e.type==='warning'&&e.text==='ダメージ').length,0);
});
test('damage warnings ignore shield-only and enemy hits, and prioritize critical damage when a burst reaches red',()=>{
 const fresh=mounted();fresh.units=[fresh.mounted!];fresh.mounted!.shield=0;fresh.damage(fresh.mounted!,24.1,'hull');fresh.tick(.016,idle);assert.deepEqual(fresh.events.filter(e=>e.type==='warning').map(e=>e.text),['ダメージ']);
 const s=mounted(),u=s.mounted!;s.units=[u];s.damage(u,1,'hull');s.tick(.016,idle);assert.equal(s.events.filter(e=>e.type==='warning'&&e.text==='ダメージ').length,0);
 u.shield=0;s.damage(u,24.1,'hull');s.damage(u,21,'hull');s.tick(.016,idle);assert.equal(partColor(u.parts.hull),'#ff0000');assert.deepEqual(s.events.filter(e=>e.type==='warning').map(e=>e.text),['ダメージクリティカル']);
 const enemy=makeUnit('enemy','merc-sentry',50,50,false);enemy.shield=0;s.units.push(enemy);s.events=[];s.damage(enemy,20,'hull');s.tick(.016,idle);assert.equal(s.events.filter(e=>e.type==='warning'&&e.text==='ダメージ').length,0);
});

test('Merc Meson photo dimensions retain separate pedestal, bowl, roof, cannon and foot hit regions',()=>{
 const tower=makeUnit('meson','merc-meson-tower',0,0,false);
 assert.equal(intersectParts(tower,{x:0,y:3,z:20},{x:0,y:3,z:-20})?.part,'hull');
 assert.equal(intersectParts(tower,{x:2,y:8,z:20},{x:2,y:8,z:-20})?.part,'cockpit');
 assert.equal(intersectParts(tower,{x:1.5,y:10.6,z:20},{x:1.5,y:10.6,z:-20})?.part,'cockpit');
 assert.equal(intersectParts(tower,{x:0,y:10.75,z:20},{x:0,y:10.75,z:3.5})?.part,'leftWeapon');
 assert.equal(intersectParts(tower,{x:2.25,y:.1,z:20},{x:2.25,y:.1,z:-20})?.part,'leftLeg');
 tower.aim=Math.PI/2;assert.equal(intersectParts(tower,{x:20,y:10.75,z:0},{x:3.5,y:10.75,z:0})?.part,'leftWeapon');
});
