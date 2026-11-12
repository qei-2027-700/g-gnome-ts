import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
import {LASER_FLIGHT_SPEED,LASERS,weaponDisplayName,weaponMountCount} from '../content/weapons.ts';
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
test('Darken Sentry fires RUPP laser and CHUM missile pairs from opposite sides',()=>{
 assert.equal(weaponMountCount('darken-sentry','RUPP'),2);assert.equal(weaponMountCount('darken-sentry','CHUM'),2);
 const laser=mounted('darken-sentry'),unit=laser.mounted!;laser.fire(2);
 const beams=laser.events.filter(e=>e.type==='shot'&&e.weapon==='RUPP');assert.equal(beams.length,2);assert.ok(beams[0].from!.x*beams[1].from!.x<0);
 const missile=mounted('darken-sentry'),shooter=missile.mounted!,before=shooter.ammunition.CHUM!;missile.fire(1);
 const rockets=missile.events.filter(e=>e.type==='shot'&&e.weapon==='CHUM');assert.equal(rockets.length,2);assert.ok(rockets[0].from!.x*rockets[1].from!.x<0);assert.equal(shooter.ammunition.CHUM,before-2);
 const enemy=new Simulation(),attacker=makeUnit('darken','darken-sentry',0,60,true);enemy.units=[attacker];attacker.iff='5142';attacker.yaw=attacker.aim=Math.PI;attacker.attackCycle=1;attacker.alert=true;enemy.tick(.02,idle);
 assert.equal(enemy.events.filter(e=>e.type==='shot'&&e.weapon==='CHUM').length,2);
});
test('Darken Tactical Defense fires paired HOMP11 lasers and DASY guns from its shoulder pods',()=>{
 const laser=mounted('darken-tactical'),unit=laser.mounted!;
 assert.deepEqual(unit.spec.weapons,['HOMP11','DASY']);assert.equal(unit.spec.speed,67.5);assert.equal(unit.spec.shield,50);assert.equal(unit.spec.energy,1500);assert.equal(unit.spec.height,7.9);
 assert.equal(weaponMountCount(unit.kind,'HOMP11'),2);assert.equal(weaponMountCount(unit.kind,'DASY'),2);
 laser.fire(1);const beams=laser.events.filter(e=>e.type==='shot'&&e.weapon==='HOMP11');assert.equal(beams.length,2);assert.ok(beams[0].from!.x*beams[1].from!.x<0);assert.equal(unit.energy,1497);
 assert.equal(LASERS.HOMP11.speed,72);assert.equal(laser.missiles.filter(p=>p.weapon==='HOMP11').length,2);assert.ok(laser.missiles.filter(p=>p.weapon==='HOMP11').every(p=>Math.abs(Math.hypot(p.vx,p.vy,p.vz)-72)<1e-8));
 const gun=mounted('darken-tactical'),gunner=gun.mounted!;gun.fire(2);const bullets=gun.events.filter(e=>e.type==='shot'&&e.weapon==='DASY');assert.equal(bullets.length,2);assert.ok(bullets[0].from!.x*bullets[1].from!.x<0);assert.equal(gunner.ammunition.DASY,199);
});
test('Darken Tactical Defense repeats HOMP11 fire while held and stops on release',()=>{
 const s=mounted('darken-tactical'),unit=s.mounted!,fire=()=>s.events.filter(e=>e.type==='shot'&&e.weapon==='HOMP11').length;
 unit.laserCharge=0;s.throttle=.4;const charges:number[]=[],times:number[]=[];for(let i=0;i<75;i++){const before=fire(),charge=unit.laserCharge;s.tick(1/60,{...idle,fire1:true});if(fire()>before){charges.push(charge);times.push(s.time);}}
 assert.equal(LASERS.HOMP11.interval,.25);assert.equal(charges[0],0);assert.ok(charges.length>=4&&charges.length<=6);assert.ok(charges.slice(1).every(charge=>charge<.9));assert.equal(fire(),charges.length*2);
 for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=.25-1e-8&&times[i]-times[i-1]<.3);
 const count=fire();for(let i=0;i<90;i++)s.tick(1/60,idle);assert.equal(fire(),count);
 s.tick(1/60,{...idle,fire1:true});assert.equal(fire(),count+2);
});
test('laser hits on dismounted players use laser damage rather than missile instant death',()=>{
 const s=new Simulation();s.units[0].x=100;s.units[0].z=-50;s.units[2].z=500;const enemy=s.units[1];enemy.x=0;enemy.z=100;enemy.yaw=Math.PI;enemy.aim=Math.PI;enemy.alert=true;enemy.attackCycle=1;
 s.tick(.02,idle);assert.equal(s.humanHealth,100);assert.ok(s.missiles.some(p=>p.weapon==='RAID'));s.iff='6707';step(s,100);assert.equal(s.humanHealth,100-LASERS.RAID.damage);assert.equal(s.status,'running');
});


test('RAID and FIL-30 share the slender laser speed, and TAR12 and HOMP11 share theirs; both still hit after flight',()=>{
 assert.equal(LASERS.RAID.speed,LASERS['FIL-30'].speed);assert.equal(LASERS.TAR12.speed,LASERS.HOMP11.speed);assert.equal(LASERS.RAID.speed,LASER_FLIGHT_SPEED);
 for(const kind of ['union-sentry','merc-sentry'] as const){const s=mounted(kind),own=s.mounted!,slot=kind==='union-sentry'?2:1,target=makeUnit('dummy','merc-sentry',0,118,false);s.units.push(target);s.fire(slot);const bolt=s.missiles[0],profile=s.weapons.lasers[bolt.weapon as 'FIL-30'|'RAID'];
 const speed=LASER_FLIGHT_SPEED;assert.equal(profile.speed,speed);assert.ok(Math.abs(Math.hypot(bolt.vx,bolt.vy,bolt.vz)-speed)<1e-8);assert.equal(bolt.life,profile.range/speed);step(s,50);assert.equal(target.shield,target.spec.shield);assert.ok(s.missiles.includes(bolt));assert.ok(Math.abs(Math.hypot(bolt.x-own.x,bolt.z-own.z)-speed)<3);step(s,40);assert.ok(target.shield<target.spec.shield);
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


test('Scorp paired CETI, LRIP and chin RAID fire from both mounts for player and AI without double energy cost',()=>{
 for(const [kind,weapon,separation] of [['scorp-sentry','CETI',4],['scorp-assault','LRIP',.7],['scorp-tactical','RAID',1.1]] as const)for(const ai of [false,true])for(const yaw of [0,Math.PI/2]){
  const s=new Simulation(),u=makeUnit('dual',kind,0,18,ai,{faction:ai?'scorp':'union',weapons:[weapon],ai:{detection:160,strafe:0,keepMoving:false,stopDistance:65,missileVolley:1}});
  s.units=[u];s.human={x:0,z:18};u.aim=u.yaw=yaw;const energy=u.energy;
  if(ai){s.human={x:Math.sin(yaw)*40,z:18+Math.cos(yaw)*40};s.tick(.01,idle);}else{s.board();u.aim=yaw;s.fire(1);}
  const bolts=s.missiles.filter(p=>p.weapon===weapon);assert.equal(bolts.length,2,`${kind} ${ai?'AI':'player'}`);assert.notEqual(bolts[0].id,bolts[1].id);
  const origins=s.events.filter(e=>e.type==='shot'&&e.unit===u).map(e=>e.from!);assert.equal(origins.length,2);assert.ok(Math.abs(Math.hypot(origins[0].x-origins[1].x,origins[0].z-origins[1].z)-separation)<1e-8);assert.equal(u.energy,energy-2);
  if(kind==='scorp-tactical')for(const origin of origins)assert.ok(Math.abs(origin.y!-(u.spec.height*.6-.05))<1e-8);
 }
});

test('Scorp Assault LRIP repeats paired shots at its shorter interval while held',()=>{
 const s=new Simulation(),u=makeUnit('rapid-lrip','scorp-assault',0,18,false);s.units=[u];s.human={x:0,z:18};assert.ok(s.board());
 const times:number[]=[];let count=0;
 for(let i=0;i<105;i++){
  s.tick(1/60,{...idle,fire2:true});
  const shots=s.events.filter(event=>event.type==='shot'&&event.weapon==='LRIP').length;
  if(shots>count){assert.equal(shots-count,2);times.push(s.time);count=shots;}
 }
 assert.equal(LASERS.LRIP.interval,.6);assert.equal(times.length,3);
 for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=.6-1e-8&&times[i]-times[i-1]<.65);
});

test('GAUS30 has a wider hit area without accepting clear misses or shots through cover',()=>{
 for(const {padding,offset,cover,hit} of [{padding:0,offset:.32,cover:false,hit:false},{padding:1.5,offset:1.2,cover:false,hit:true},{padding:1.5,offset:2.1,cover:false,hit:false},{padding:1.5,offset:1.2,cover:true,hit:false}]){
  const s=new Simulation(),tower=makeUnit('own','merc-meson-tower',0,20,false),target=makeUnit('target','merc-aip',0,100,true,{speed:0,ai:{detection:0}});
  s.mission={...s.mission,rocks:cover?[{x:3+offset,z:90,r:3}]:[],base:undefined};s.facilities=[];s.units=[tower,target];s.soldiers=[];s.human={x:0,z:20};assert.ok(s.board());target.iff='enemy';s.weapons.lasers.GAUS30.hitPadding=padding;
  s.fire(1);const beam=s.missiles.find(m=>m.weapon==='GAUS30')!;assert.ok(beam);assert.ok(Math.abs(Math.hypot(beam.vx,beam.vy,beam.vz)-200)<1e-8);
  Object.assign(beam,{x:3+offset,y:target.hoverHeight+target.spec.height*.6-.4,z:80,vx:0,vy:0,vz:450});
  const shield=target.shield;s.tick(.01,idle);assert.equal(target.shield,shield);assert.ok(Math.abs(beam.z-84.5)<1e-8);s.tick(.04,idle);
  assert.equal(target.shield,hit?shield-18:shield,JSON.stringify({padding,offset,cover}));
 }
});
test('GAUS30 near misses infantry without the vehicle hit padding but direct shots still hit',()=>{
 for(const kind of ['merc-meson-tower','scorp-meson-tower'] as const)for(const offset of [0,1.8]){
  const s=new Simulation(),tower=makeUnit('tower',kind,0,20,false);
  s.mission={...s.mission,rocks:[],base:undefined,terrain:{...s.mission.terrain,cliffs:[]}};s.facilities=[];s.units=[tower];s.human={x:0,z:20};assert.ok(s.board());s.fire(1);
  const beam=s.missiles.find(m=>m.weapon==='GAUS30')!;assert.ok(beam);s.mounted=null;tower.pilot=false;
  Object.assign(beam,{x:0,y:1,z:90,vx:0,vy:0,vz:200,life:1});s.human={x:offset,z:100};
  s.tick(.1,idle);assert.equal(s.humanHealth,offset===0?72:100,`${kind} foot offset ${offset}`);
 }
 for(const offset of [0,1.8]){
  const s=new Simulation(),tower=makeUnit('tower','scorp-meson-tower',0,20,false),carrier=makeUnit('carrier','scorp-asv',offset,100,true);
  s.mission={...s.mission,rocks:[],base:undefined,terrain:{...s.mission.terrain,cliffs:[]}};s.facilities=[];s.units=[tower,carrier];s.human={x:0,z:20};assert.ok(s.board());s.fire(1);
  const beam=s.missiles.find(m=>m.weapon==='GAUS30')!;assert.ok(beam);s.mounted=null;tower.pilot=false;
  const soldier=s.forceEject(carrier,'boarding')!;soldier.flight=null;soldier.x=offset;soldier.z=100;soldier.cooldown=999;s.units=[tower];s.human={x:100,z:20};
  Object.assign(beam,{x:0,y:1,z:90,vx:0,vy:0,vz:200,life:1});s.tick(.1,idle);
  assert.equal(soldier.health,offset===0?7:35,`NPC foot offset ${offset}`);
 }
});

test('Meson towers can select and hit targets across their extended GAUS30 range',()=>{
 assert.equal(LASERS.GAUS30.range,1000);assert.equal(LASERS.GAUS30.speed,200);
 for(const kind of ['merc-meson-tower','scorp-meson-tower'] as const)assert.equal(makeUnit('tower',kind,0,0).spec.ai.detection,1000);
 const s=mounted('merc-meson-tower'),tower=s.mounted!;s.mission={...s.mission,rocks:[],base:undefined,terrain:{...s.mission.terrain,cliffs:[]}};s.facilities=[];
 const target=makeUnit('far-target','merc-meson-tower',tower.x,tower.z+900,true,{ai:{detection:0}});target.iff='enemy';s.units.push(target);s.pitch=s.targetElevation(target);
 assert.equal(s.selectInCrosshair(),target);s.clearTarget();s.fire(1);
 const beam=s.missiles.find(m=>m.weapon==='GAUS30')!;assert.ok(beam);assert.ok(Math.abs(Math.hypot(beam.vx,beam.vy,beam.vz)-200)<1e-8);assert.ok(Math.abs(beam.life-1000/200)<1e-8);
 step(s,250);assert.ok(target.shield<tower.spec.shield);
});
