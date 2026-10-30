import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,type Input} from './simulation.ts';
import {MISSION_3_3} from '../content/missions/mission-3-3.ts';
import {MISSILES} from '../content/weapons.ts';
import {advanceSimulation} from '../session.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
const tick=(s:Simulation,n=1,input:Partial<Input>={})=>{for(let i=0;i<n;i++)s.tick(1/60,{...idle,...input});};
function setup(){const s=new Simulation('Easy',MISSION_3_3);s.mission.terrain.cliffs=[];for(const [i,p] of [{x:-22,z:30},{x:10,z:65},{x:26,z:100}].entries())Object.assign(s.units[i+1],p);for(const u of s.units){u.yaw=0;u.aim=0;}Object.assign(s.units.find(u=>u.id==='scorp-asv')!,{x:0,z:350});return {s,own:s.mounted!,enemy:s.units.find(u=>u.id==='scorp-asv')!};}
function shoot(s:Simulation){tick(s,1,{fire2:true});assert.ok(s.guidedMissile);for(let i=0;i<700&&s.guidedMissile;i++)tick(s);assert.equal(s.guidedMissileId,null);}
test('3-3 starts mounted with three nearby Union allies and resets independently from 1-1',()=>{
 const {s,own}=setup();assert.equal(own.kind,'union-asv');assert.equal(s.units.filter(u=>u.spec.faction==='union').length,4);assert.equal(own.ammunition.VISOM,10);assert.equal(s.enemies.length,3);
 assert.equal(new Simulation().mounted,null);const retry=setup();assert.equal(retry.own.ammunition.VISOM,10);assert.equal(retry.enemy.lureHits,0);assert.equal(retry.s.guidedMissileId,null);
});
test('launch, keyboard and mouse steering consume one missile and leave the carrier stationary',()=>{
 const {s,own}=setup();const pos={x:own.x,z:own.z,yaw:own.yaw,aim:own.aim,pitch:s.pitch};tick(s,1,{fire2:true});const missile=s.guidedMissile!,initial=missile.vx,speed=Math.hypot(missile.vx,missile.vy,missile.vz);
 tick(s,8,{right:true,lookUp:true,fire2:true,boost:true});assert.ok(missile.vx>initial);assert.ok(missile.vy>0);assert.equal(own.ammunition.VISOM,9);assert.equal(s.speed,0);assert.equal(s.throttle,0);assert.equal(s.missiles.length,1);
 const before=missile.vx;s.aimBy(-.15);s.lookBy(-.1);assert.notEqual(missile.vx,before);assert.ok(Math.abs(Math.hypot(missile.vx,missile.vy,missile.vz)-speed)<1e-8);assert.deepEqual({x:own.x,z:own.z,yaw:own.yaw,aim:own.aim,pitch:s.pitch},pos);
 const paused={x:missile.x,y:missile.y,z:missile.z,life:missile.life};assert.equal(advanceSimulation(s,'pause',.05,{...idle,right:true}),0);assert.deepEqual({x:missile.x,y:missile.y,z:missile.z,life:missile.life},paused);
});
test('two physical VISOM impacts on the same ASV lure it once and it approaches the player',()=>{
 const {s,enemy}=setup(),origin={x:enemy.x,z:enemy.z};shoot(s);assert.equal(enemy.lureHits,1);assert.equal(enemy.lured,false);assert.equal(enemy.alert,true);assert.equal(enemy.shield,22);assert.deepEqual({x:enemy.x,z:enemy.z},origin);
 tick(s,20);assert.equal(enemy.lureHits,1);shoot(s);assert.equal(enemy.lureHits,2);assert.equal(enemy.lured,true);assert.equal(enemy.alert,true);assert.equal(enemy.alive,true);assert.equal(s.status,'running');assert.equal(s.objectiveStates[0].done,false);assert.equal(s.events.filter(e=>e.type==='lured').length,1);
 tick(s,180);assert.ok(enemy.z<origin.z-5);assert.equal(s.events.filter(e=>e.type==='lured').length,1);
});
test('hits are per target; one hit on each of two ASVs cannot meet the threshold',()=>{
 const def=structuredClone(MISSION_3_3);def.units=def.units.filter(u=>!def.companions?.some(c=>c.unitId===u.id));def.companions=[];def.terrain.cliffs=[];def.units=def.units.map(u=>u.id==='scorp-asv'?{...u,x:0,z:350}:u);def.units=[...def.units,{id:'other',kind:'scorp-asv',x:45,z:350,pilot:true}];def.lures=[...def.lures!,{unitId:'other',weapon:'VISOM',hits:2}];const s=new Simulation('Easy',def),first=s.units.find(u=>u.id==='scorp-asv')!,other=s.units.find(u=>u.id==='other')!;
 shoot(s);s.aimBy(Math.atan2(other.x,other.z)-s.aim);shoot(s);assert.equal(first.lureHits,1);assert.equal(other.lureHits,1);assert.equal(first.lured,false);assert.equal(other.lured,false);
});
test('rocks, misses, empty ASVs and unrelated weapons do not count as VISOM hits',()=>{
 const blocked=structuredClone(MISSION_3_3);blocked.rocks=[{x:0,z:160,r:12}];const cover=new Simulation('Easy',blocked);shoot(cover);assert.equal(cover.units.find(u=>u.id==='scorp-asv')!.lureHits,0);
 const {s:miss,enemy:target}=setup();miss.aimBy(.6);shoot(miss);assert.equal(target.lureHits,0);
 const {s:empty,enemy:unoccupied}=setup();unoccupied.pilot=false;shoot(empty);assert.equal(unoccupied.lureHits,0);assert.equal(unoccupied.lured,false);
 const {s:ordinary,enemy}=setup();ordinary.damage(enemy,2);assert.equal(enemy.lureHits,0);assert.equal(enemy.alert,true);
});
test('Space releases guidance without removing the missile; ejection, expiry and death cannot leave a stale view',()=>{
 const {s}=setup();tick(s,1,{fire2:true});const missile=s.guidedMissile!;tick(s,1,{center:true});assert.equal(s.guidedMissileId,null);assert.ok(s.missiles.includes(missile));const z=missile.z;tick(s);assert.ok(missile.z>z);assert.equal(s.events.filter(e=>e.type==='guidance-end').length,1);
 const {s:exit}=setup();tick(exit,1,{fire2:true});exit.eject();assert.equal(exit.guidedMissileId,null);assert.equal(exit.mounted,null);
 const {s:expiry}=setup();tick(expiry,1,{fire2:true});expiry.guidedMissile!.life=.01;tick(expiry);assert.equal(expiry.guidedMissileId,null);
 const {s:lost,own}=setup();tick(lost,1,{fire2:true});lost.damage(own,10000);assert.equal(lost.status,'running');assert.ok(lost.flight);assert.equal(lost.guidedMissileId,null);assert.equal(lost.guidedMissile,undefined);
});
test('direction keys steer at fixed speed without homing or changing carrier aim',async()=>{
 const {readInput}=await import('../input.ts');const {defaults}=await import('../settings.ts');const {s,own,enemy}=setup();const settings=defaults();s.tick(1/60,readInput(settings,new Set(['Digit2'])));const p=s.guidedMissile!;const initialYaw=own.aim;
 s.tick(1/60,readInput(settings,new Set(['ArrowDown','ArrowLeft','ShiftLeft'])));assert.ok(p.vx<0);assert.ok(p.vy<0);assert.ok(Math.abs(Math.hypot(p.vx,p.vy,p.vz)-MISSILES.VISOM.speed)<1e-8);assert.equal(own.aim,initialYaw);assert.equal(s.speed,0);
 const velocity={vx:p.vx,vy:p.vy,vz:p.vz};enemy.x=80;tick(s,20);assert.deepEqual({vx:p.vx,vy:p.vy,vz:p.vz},velocity);
});

test('Space returns control to the carrier while VISOM flies on and inflicts damage on impact',async()=>{
 const {readInput}=await import('../input.ts');const {defaults}=await import('../settings.ts');
 const {s,own,enemy}=setup(),settings=defaults(),before=enemy.shield;
 s.tick(1/60,readInput(settings,new Set(['Digit2'])));const missile=s.guidedMissile!,velocity={vx:missile.vx,vy:missile.vy,vz:missile.vz};
 s.tick(1/60,readInput(settings,new Set(['Space'])));assert.equal(s.guidedMissileId,null);assert.ok(s.missiles.includes(missile));
 const carrierZ=own.z;s.aimBy(.3);s.lookBy(.1);tick(s,30,{forward:true});assert.ok(own.z>carrierZ);
 assert.deepEqual({vx:missile.vx,vy:missile.vy,vz:missile.vz},velocity);assert.equal(enemy.shield,before);
 for(let i=0;i<600&&s.missiles.includes(missile);i++)tick(s);
 assert.ok(!s.missiles.includes(missile));assert.equal(enemy.shield,before-MISSILES.VISOM.damage);assert.equal(enemy.lureHits,1);
 assert.equal(s.events.filter(e=>e.type==='impact'&&e.projectileId===missile.id).length,1);assert.equal(s.events.filter(e=>e.type==='guidance-end').length,1);
});

test('VISOM preserves carrier travel and throttle while steering inputs control only the missile',()=>{
 for(const throttle of [.7,-.3,0]){
  const {s,own}=setup();s.throttle=throttle;s.speed=throttle<0?-6:6;own.speed=s.speed;
  const before=own.z;s.fire(2);const missile=s.guidedMissile!;
  assert.equal(s.throttle,throttle);assert.equal(s.speed,throttle<0?-6:6);assert.equal(own.speed,s.speed);
  const yaw=own.yaw,aim=own.aim,pitch=s.pitch;
  tick(s,30,{right:true,forward:true,boost:true,stop:true,fire2:true});
  assert.equal(s.throttle,throttle);assert.equal(own.yaw,yaw);assert.equal(own.aim,aim);assert.equal(s.pitch,pitch);
  assert.ok(throttle<0?own.z<before:own.z>before);assert.equal(own.speed,s.speed);assert.equal(own.ammunition.VISOM,9);assert.ok(missile.vx>0);
  const releaseZ=own.z;tick(s,1,{center:true});assert.equal(s.guidedMissileId,null);assert.equal(s.throttle,throttle);assert.notEqual(own.z,releaseZ);
 }
});
test('a moving carrier still collides with a vehicle during VISOM guidance',()=>{
 const {s,own}=setup(),blocker=s.units[1];blocker.x=own.x;blocker.z=20;blocker.pilot=false;
 s.throttle=1;s.speed=own.spec.speed/3.6;own.speed=s.speed;s.pitch=.8;s.fire(2);
 tick(s,120);assert.ok(s.guidedMissile);assert.ok(own.z>0&&own.z<blocker.z-3);assert.equal(s.speed,0);assert.equal(own.speed,0);
});

test('3-3 Scorp ASV physically lured by VISOM stops shooting at the dismounted player and closes all the way to a lethal ram',()=>{
 const {s,own,enemy}=setup();s.units=[own,enemy];s.mission.companions=[];s.mission.rocks=[];s.mission.base=undefined;s.mines=[];
 shoot(s);shoot(s);assert.equal(enemy.lured,true);s.eject('ground');own.x=200;own.z=-100;s.human={x:0,z:0};enemy.x=0;enemy.z=60;enemy.yaw=enemy.aim=Math.PI;enemy.speed=0;enemy.cooldown=0;s.events=[];
 const ammunition={...enemy.ammunition},energy=enemy.energy;
 for(let i=0;i<600&&s.status==='running';i++)tick(s);
 assert.equal(s.status,'lost');assert.ok(enemy.z<5);assert.equal(s.events.some(e=>e.type==='shot'&&e.unit===enemy),false);assert.deepEqual(enemy.ammunition,ammunition);assert.ok(enemy.energy>=energy);assert.equal(s.events.filter(e=>e.type==='occupied-contact').length,1);
});
test('the Scorp ASV ram response is mission data and ranged attacks resume against a mounted player',()=>{
 for(const mounted of [false,true])for(const override of [false,true]){
  const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind:'union-asv',x:0,z:0,pilot:false},{id:'scorp-asv',kind:'scorp-asv',x:0,z:80,yaw:Math.PI,pilot:true}];def.assignedUnitId='own';def.startMountedUnitId=mounted?'own':undefined;def.player={x:0,z:0};def.companions=[];def.base=undefined;def.rocks=[];def.minefields=[];def.terrain.cliffs=[];
  if(!override){def.id='other';def.lures=def.lures!.map(rule=>({...rule,onFootResponse:undefined}));}
  const s=new Simulation('Easy',def),enemy=s.units[1],own=s.units[0];enemy.lured=true;enemy.alert=true;if(!mounted)s.units=[enemy];tick(s,1);
  assert.equal(s.events.some(e=>e.type==='shot'&&e.unit===enemy),mounted||!override);
  if(!mounted&&override){s.units.push(own);s.human={x:own.x,z:own.z};assert.ok(s.board());s.events=[];enemy.cooldown=0;tick(s,1);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===enemy));}
 }
});


test('two VISOM hits lure the enemy ASV across active mines without losing the pilot or consuming mines',()=>{
 const {s,own,enemy}=setup();s.units=[own,enemy];enemy.cooldown=999;s.mines=[{id:'lure-path',x:0,z:300,radius:2,spent:false}];
 shoot(s);shoot(s);assert.equal(enemy.lured,true);tick(s,900);
 assert.ok(enemy.z<290,`ASV must cross the mine at z=300; reached ${enemy.z}`);assert.equal(enemy.alive,true);assert.equal(enemy.pilot,true);assert.equal(enemy.armor,enemy.spec.armor);assert.equal(s.mines[0].spent,false);assert.equal(s.events.filter(e=>e.type==='mine').length,0);assert.equal(s.events.filter(e=>e.type==='lured').length,1);
});
