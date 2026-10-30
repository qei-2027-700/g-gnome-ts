import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
import {LASERS,weaponDisplayName,weaponMountCount} from '../content/weapons.ts';
import {laserRange} from './weapons.ts';
import {MISSION} from '../content/mission-1-1.ts';
import {type VehicleKind} from '../content/vehicles.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
function mounted(kind:VehicleKind='union-sentry'){const s=new Simulation();s.units=[makeUnit('own',kind,0,18,false)];s.human={...MISSION.vehicle};s.board();s.iff='6707';return s;}
function step(s:Simulation,n=10){for(let i=0;i<n;i++)s.tick(.02,idle);}
test('movement, reverse and coasting slow charge on every currently laser-equipped chassis',()=>{
 for(const kind of ['union-sentry','merc-sentry'] as const){
  const parked=mounted(kind);parked.mounted!.laserCharge=0;step(parked);
  for(const reverse of [false,true]){const moving=mounted(kind);moving.mounted!.laserCharge=0;moving.throttle=reverse?-.3:.7;step(moving);assert.ok(moving.mounted!.laserCharge<parked.mounted!.laserCharge);}
  const coast=mounted(kind);coast.speed=10;coast.mounted!.laserCharge=0;step(coast);assert.ok(coast.mounted!.laserCharge<parked.mounted!.laserCharge);
  const before=coast.mounted!.laserCharge;coast.speed=0;step(coast);assert.ok(Math.abs(coast.mounted!.laserCharge-before-parked.mounted!.laserCharge)<1e-8);
 }
});
test('partial charge changes beam endpoint and actual hit reach, and a zero-charge shot remains legal',()=>{
 for(const charge of [0,.25,.5,1]){const s=mounted(),u=s.mounted!;u.laserCharge=charge;s.fire(2);const shot=s.events.find(e=>e.type==='shot')!;assert.ok(shot.to);assert.ok(Math.abs(Math.hypot(shot.to!.x-u.x,shot.to!.z-u.z)-laserRange('FIL-30',charge))<1e-8);assert.equal(u.laserCharge,0);assert.equal(u.energy,1598);}
 for(const charge of [.1,1]){const s=mounted(),target=makeUnit('target','merc-sentry',0,118);s.units.push(target);s.mounted!.laserCharge=charge;s.fire(2);assert.equal(target.shield,22);step(s,100);assert.equal(target.shield,charge===1?4:22);}
 const s=mounted();s.fire(2);s.fire(2);assert.equal(s.mounted!.energy,1598);step(s,6);assert.ok(s.mounted!.laserCharge<1);const energy=s.mounted!.energy;s.fire(2);assert.equal(s.mounted!.energy,energy);step(s,Math.ceil(LASERS['FIL-30'].interval*60));const readyEnergy=s.mounted!.energy;s.fire(2);assert.equal(s.mounted!.energy,readyEnergy-2);
});
test('RAID on a captured Merc uses its own laser profile and charge display range',()=>{
 const s=mounted('merc-sentry');s.mounted!.laserCharge=.5;assert.equal(s.weaponRange(1),laserRange('RAID',.5));s.fire(1);assert.equal(s.events.at(-1)?.weapon,'RAID');assert.equal(s.mounted!.laserCharge,0);assert.equal(s.mounted!.energy,1098);assert.notEqual(LASERS.RAID.range,LASERS['FIL-30'].range);
});
test('moving AI shares the charge penalty and an undercharged RAID cannot hit beyond its shortened beam',()=>{
 const s=new Simulation();s.human={...MISSION.vehicle};s.board();s.iff='2620';const enemy=s.units[1];s.units=[s.mounted!,enemy];enemy.x=0;enemy.z=130;enemy.yaw=Math.PI;enemy.aim=Math.PI;enemy.alert=true;enemy.attackCycle=1;enemy.laserCharge=0;
 const shield=s.mounted!.shield;s.tick(.02,idle);const beam=s.events.find(e=>e.type==='shot'&&e.weapon==='RAID');assert.ok(beam);assert.equal(s.mounted!.shield,shield);assert.ok(enemy.laserCharge<=.02/LASERS.RAID.recharge*LASERS.RAID.movingRechargeFactor+1e-8);
});

test('laser bolts take time, can miss a moving target, and manual firing observes the slower interval',()=>{
 const s=mounted(),u=s.mounted!,target=makeUnit('target','merc-sentry',0,118);s.units.push(target);s.fire(2);
 const bolt=s.missiles.find(p=>p.weapon==='FIL-30')!;assert.equal(target.shield,22);assert.ok(Math.abs(Math.hypot(bolt.vx,bolt.vy,bolt.vz)-LASERS['FIL-30'].speed)<1e-8);
 s.tick(.05,idle);assert.ok(bolt.z>u.z&&bolt.z<target.z);assert.equal(target.shield,22);
 target.x=20;step(s,200);assert.equal(target.shield,22);assert.equal(s.missiles.length,0);
 const cadence=mounted(),times:number[]=[];for(let i=0;i<180;i++){const before=cadence.events.filter(e=>e.type==='shot'&&e.weapon==='FIL-30').length;cadence.tick(1/60,{...idle,fire2:true});if(cadence.events.filter(e=>e.type==='shot'&&e.weapon==='FIL-30').length>before)times.push(cadence.time);}assert.ok(times.length>=2&&times.length<=3);for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=LASERS['FIL-30'].interval-1e-8);step(cadence,60);const before=cadence.events.filter(e=>e.type==='shot').length;cadence.tick(1/60,{...idle,fire2:true});assert.equal(cadence.events.filter(e=>e.type==='shot').length,before+2);
});

test('Union Sentry FIL-30 fires both lower cockpit mounts for player and AI; weapon names omit the mount count',()=>{
 assert.equal(weaponMountCount('union-sentry','FIL-30'),2);assert.equal(weaponDisplayName('union-sentry','FIL-30'),'FIL-30');assert.equal(weaponDisplayName('union-tactical','P2MEC'),'P2MEC');
 for(const ai of [false,true])for(const yaw of [0,Math.PI/2]){
  const s=new Simulation(),unit=makeUnit('sentry','union-sentry',0,ai?60:1,ai,{faction:ai?'scorp':'union',weapons:['FIL-30']});s.units=[unit];s.human={x:0,z:0};unit.yaw=unit.aim=yaw;
  if(ai){unit.iff='6707';s.human={x:Math.sin(yaw)*40,z:60+Math.cos(yaw)*40};s.tick(.01,idle);}else{s.board();unit.aim=yaw;s.fire(1);}
  const bolts=s.missiles.filter(p=>p.weapon==='FIL-30'),shots=s.events.filter(e=>e.type==='shot'&&e.unit===unit);assert.equal(bolts.length,2,`${ai?'AI':'player'} yaw=${yaw}`);assert.equal(shots.length,2);assert.equal(unit.energy,1598);
  const [a,b]=shots.map(e=>e.from!);assert.ok(Math.abs(Math.hypot(a.x-b.x,a.z-b.z)-1.3)<1e-8);assert.ok(shots.every(e=>e.from!.y!<unit.spec.height*.5));
 }
});
test('laser hits on dismounted players use laser damage rather than missile instant death',()=>{
 const s=new Simulation();s.units[0].x=100;s.units[0].z=-50;s.units[2].z=500;const enemy=s.units[1];enemy.x=0;enemy.z=100;enemy.yaw=Math.PI;enemy.aim=Math.PI;enemy.alert=true;enemy.attackCycle=1;
 s.tick(.02,idle);assert.equal(s.humanHealth,100);assert.ok(s.missiles.some(p=>p.weapon==='RAID'));s.iff='6707';step(s,100);assert.equal(s.humanHealth,100-LASERS.RAID.damage);assert.equal(s.status,'running');
});


test('diamond laser travels at 72 m/s while slender RAID keeps 60 m/s; both hit after flight',()=>{
 for(const kind of ['union-sentry','merc-sentry'] as const){const s=mounted(kind),own=s.mounted!,slot=kind==='union-sentry'?2:1,target=makeUnit('dummy','merc-sentry',0,118,false);s.units.push(target);s.fire(slot);const bolt=s.missiles[0],profile=s.weapons.lasers[bolt.weapon as 'FIL-30'|'RAID'];
 const speed=kind==='union-sentry'?72:60;assert.equal(profile.speed,speed);assert.ok(Math.abs(Math.hypot(bolt.vx,bolt.vy,bolt.vz)-speed)<1e-8);assert.equal(bolt.life,profile.range/speed);step(s,50);assert.equal(target.shield,target.spec.shield);assert.ok(s.missiles.includes(bolt));assert.ok(Math.abs(Math.hypot(bolt.x-own.x,bolt.z-own.z)-speed)<3);step(s,40);assert.ok(target.shield<target.spec.shield);
 }
});

test('Union Tactical fires both arm weapons together for player and AI at rotated bearings',()=>{
 for(const weapon of ['P2MEC','TCREAP'] as const)for(const ai of [false,true])for(const yaw of [0,Math.PI/2]){
  const s=new Simulation(),u=makeUnit('dual','union-tactical',0,18,ai,{faction:ai?'scorp':'union',weapons:[weapon],ai:{detection:160,strafe:0,keepMoving:false,stopDistance:65,missileVolley:1}});
  s.units=[u];s.human={x:0,z:0};u.aim=yaw;u.yaw=yaw;
  if(ai){s.human={x:Math.sin(yaw)*40,z:18+Math.cos(yaw)*40};s.tick(.01,idle);}else{s.human={x:0,z:18};s.board();u.aim=yaw;s.fire(1);}
  const shots=s.missiles.filter(p=>p.weapon===weapon);assert.equal(shots.length,2,`${weapon} ${ai?'AI':'player'}`);
  assert.notEqual(shots[0].id,shots[1].id);const origins=s.events.filter(e=>e.type==='shot'&&e.unit===u).map(e=>e.from!);assert.ok(Math.abs(Math.hypot(origins[0].x-origins[1].x,origins[0].z-origins[1].z)-5.3)<1e-8);
  assert.equal(s.events.filter(e=>e.type==='shot'&&e.unit===u).length,2);
  assert.equal(u.energy,weapon==='P2MEC'?1198:1200);if(weapon==='TCREAP')assert.equal(u.slotAmmo[0],299);
 }
});

test('Union Tactical missile slots use opposite pods for player and AI',()=>{
 for(const ai of [false,true])for(const yaw of [0,Math.PI/2]){
  const s=mounted('union-tactical'),u=s.mounted!;u.aim=yaw;u.yaw=yaw;
  const shots=[];
  for(const [index,weapon] of ['TCROCK','SAG5T'].entries()){
   if(ai)shots.push(s.fireMissile(u,weapon as 'TCROCK'|'SAG5T',1,{x:0,y:5,z:100}));
   else{u.cooldown=0;s.fire(index+3);shots.push(s.missiles.at(-1)!);}
  }
  const side=(p:{x:number,z:number})=>(p.x-u.x)*Math.cos(yaw)-(p.z-u.z)*Math.sin(yaw);
  assert.ok(side(shots[0])<0);assert.ok(side(shots[1])>0);assert.equal(shots[0].y,shots[1].y);
 }
});

test('Union Sentry gun and laser leave the lower cockpit mounts while converging on the sighted target',()=>{
 for(const slot of [1,2]){
  const s=mounted(),u=s.mounted!,target=makeUnit('dummy','merc-sentry',0,78,false);s.units=[u,target];s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];
  s.pitch=s.targetElevation(target);s.fire(slot);
  const shot=s.events.find(e=>e.type==='shot'&&e.unit===u)!;assert.ok(shot);assert.ok(shot.from!.y!<s.eyeHeight-.8);assert.ok(shot.from!.z!>u.z+1.5);
  if(slot===2)step(s,100);assert.ok(target.shield<target.spec.shield);
 }
 const s=new Simulation(),enemy=makeUnit('enemy','union-sentry',0,60,true,{faction:'scorp',weapons:['FIL-30']});enemy.iff='scorp';enemy.yaw=enemy.aim=Math.PI;s.units=[enemy];s.human={x:0,z:0};s.tick(.02,idle);
 const shot=s.events.find(e=>e.type==='shot'&&e.unit===enemy)!;assert.ok(shot);assert.ok(shot.from!.y!<enemy.spec.height*.5);assert.ok(shot.from!.z!<enemy.z-1.5);
});


test('Scorp paired CETI and chin RAID fire from both mounts for player and AI without double energy cost',()=>{
 for(const [kind,weapon,separation] of [['scorp-sentry','CETI',4],['scorp-tactical','RAID',1.1]] as const)for(const ai of [false,true])for(const yaw of [0,Math.PI/2]){
  const s=new Simulation(),u=makeUnit('dual',kind,0,18,ai,{faction:ai?'scorp':'union',weapons:[weapon],ai:{detection:160,strafe:0,keepMoving:false,stopDistance:65,missileVolley:1}});
  s.units=[u];s.human={x:0,z:18};u.aim=u.yaw=yaw;const energy=u.energy;
  if(ai){s.human={x:Math.sin(yaw)*40,z:18+Math.cos(yaw)*40};s.tick(.01,idle);}else{s.board();u.aim=yaw;s.fire(1);}
  const bolts=s.missiles.filter(p=>p.weapon===weapon);assert.equal(bolts.length,2,`${kind} ${ai?'AI':'player'}`);assert.notEqual(bolts[0].id,bolts[1].id);
  const origins=s.events.filter(e=>e.type==='shot'&&e.unit===u).map(e=>e.from!);assert.equal(origins.length,2);assert.ok(Math.abs(Math.hypot(origins[0].x-origins[1].x,origins[0].z-origins[1].z)-separation)<1e-8);assert.equal(u.energy,energy-2);
  if(kind==='scorp-tactical')for(const origin of origins)assert.ok(Math.abs(origin.y!-(u.spec.height*.6-.05))<1e-8);
 }
});

test('GAUS30 tolerates a grazing AIP shot without accepting wider misses or shots through cover',()=>{
 for(const {padding,offset,cover,hit} of [{padding:0,offset:.32,cover:false,hit:false},{padding:.45,offset:.32,cover:false,hit:true},{padding:.45,offset:.8,cover:false,hit:false},{padding:.45,offset:.32,cover:true,hit:false}]){
  const s=new Simulation(),tower=makeUnit('own','merc-meson-tower',0,20,false),target=makeUnit('target','merc-aip',0,100,true,{speed:0,ai:{detection:0}});
  s.mission={...s.mission,rocks:cover?[{x:3+offset,z:90,r:3}]:[],base:undefined};s.facilities=[];s.units=[tower,target];s.soldiers=[];s.human={x:0,z:20};assert.ok(s.board());target.iff='enemy';s.weapons.lasers.GAUS30.hitPadding=padding;
  s.fire(1);const beam=s.missiles.find(m=>m.weapon==='GAUS30')!;assert.ok(beam);assert.ok(Math.abs(Math.hypot(beam.vx,beam.vy,beam.vz)-600)<1e-8);
  Object.assign(beam,{x:3+offset,y:target.hoverHeight+target.spec.height*.6-.4,z:80,vx:0,vy:0,vz:600});
  const shield=target.shield;s.tick(.01,idle);assert.equal(target.shield,shield);assert.ok(Math.abs(beam.z-86)<1e-8);s.tick(.04,idle);
  assert.equal(target.shield,hit?shield-17:shield,JSON.stringify({padding,offset,cover}));
 }
});
