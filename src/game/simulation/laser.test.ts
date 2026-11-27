import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,HARD_AI_RAPID_MIN_CHARGE,HARD_AI_RAPID_RANGE_FRACTION,type Input} from './simulation.ts';
import {LASER_FLIGHT_SPEED,LASER_SPEED_TIERS,LASERS,MACHINE_GUNS,weaponDisplayName,weaponMountCount} from '../content/weapons.ts';
import {laserRange,laserDamage} from './weapons.ts';
import {MISSION} from '../content/mission-1-1.ts';
import {MISSION_4_2} from '../content/missions/mission-4-2.ts';
import {VEHICLE_SHAPES,type VehicleKind} from '../content/vehicles.ts';
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
test('Scorp Assault LRIP reach depends on charge and not target selection',()=>{
 assert.equal(LASERS.LRIP.range,800);assert.equal(LASERS.LRIP.minRange,80);assert.notEqual(LASERS.LRIP.range,LASERS.CETI.range);
 for(const selected of [false,true])for(const charge of [.25,1]){
  const s=mounted('scorp-assault'),unit=s.mounted!,target=makeUnit('distant','merc-sentry',0,unit.z+400,false);s.units=[unit,target];s.mission.completionEnabled=false;s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];s.mission.terrain.rivers=[];
  s.pitch=0;if(selected)s.selected=target.id;unit.laserCharge=charge;
  const range=80+720*charge,shield=target.shield;assert.equal(s.weaponRange(2),range);
  s.fire(2);const bolts=s.missiles.filter(p=>p.weapon==='LRIP');assert.equal(bolts.length,2);assert.ok(bolts.every(p=>Math.abs(p.life-range/LASERS.LRIP.speed)<1e-8));assert.equal(target.shield,shield);
  step(s,320);assert.equal(target.shield<shield,charge===1,`selected=${selected}, charge=${charge}`);
 }
});
test('charge changes reach for every laser except GAUS30, whose charge changes damage',()=>{
 for(const weapon of Object.keys(LASERS) as (keyof typeof LASERS)[]){
  const profile=LASERS[weapon];
  if(weapon==='GAUS30'){
   for(const charge of [0,.5,1]){assert.equal(laserRange(weapon,charge),profile.range);assert.equal(laserDamage(weapon,charge),profile.damage*charge);}
   assert.equal(laserRange(weapon,.5,{...profile,range:480}),480);
  }else{
   const minRange='minRange' in profile?profile.minRange:profile.range;
   assert.equal(laserRange(weapon,0),minRange);assert.equal(laserRange(weapon,1),profile.range);
   assert.equal(laserRange(weapon,.5),(minRange+profile.range)/2);assert.equal(laserDamage(weapon,.5),profile.damage);
  }
 }
});
test('both Meson guard towers fire GAUS30 to fixed range with charge-scaled damage',()=>{
 for(const kind of ['merc-meson-tower','scorp-meson-tower'] as const)for(const charge of [0,.5,1]){
  const s=mounted(kind),tower=s.mounted!,target=makeUnit('target','merc-aip',0,100,false);s.units=[tower,target];s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];tower.laserCharge=charge;
  assert.equal(s.weaponRange(1),s.weapons.lasers.GAUS30.range);
  s.fire(1);const beam=s.missiles.find(p=>p.weapon==='GAUS30')!;
  assert.ok(beam);assert.equal(beam.damage,s.weapons.lasers.GAUS30.damage*charge);assert.equal(beam.life,s.weapons.lasers.GAUS30.range/s.weapons.lasers.GAUS30.speed);
  const shield=target.shield;Object.assign(beam,{x:0,y:target.hoverHeight+target.spec.height*.6-.4,z:80,vx:0,vy:0,vz:450});s.tick(.05,idle);
  assert.equal(target.shield,shield-Math.min(shield,s.weapons.lasers.GAUS30.damage*charge));
 }
 const s=new Simulation(),tower=makeUnit('tower','scorp-meson-tower',0,100,true);s.units=[tower];s.human={x:0,z:0};tower.iff='enemy';tower.yaw=tower.aim=Math.PI;tower.alert=true;tower.laserCharge=.5;s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];
 s.tick(.02,idle);assert.equal(s.missiles.some(p=>p.weapon==='GAUS30'),false);
 let chargeAtShot=0;for(let i=0;i<120;i++){const before=tower.laserCharge;s.tick(.02,idle);if(s.events.some(e=>e.type==='shot'&&e.unit===tower&&e.weapon==='GAUS30')){chargeAtShot=before;break;}s.events=[];}
 const beam=s.missiles.find(p=>p.weapon==='GAUS30')!;assert.ok(beam);assert.equal(chargeAtShot,1);assert.equal(beam.damage,s.weapons.lasers.GAUS30.damage);assert.ok(beam.life<=s.weapons.lasers.GAUS30.range/s.weapons.lasers.GAUS30.speed);
});
test('RAID on a captured Merc uses its own laser profile and charge display range',()=>{
 const s=mounted('merc-sentry');s.mounted!.laserCharge=.5;assert.equal(s.weaponRange(1),laserRange('RAID',.5));s.fire(1);assert.equal(s.events.at(-1)?.weapon,'RAID');assert.equal(s.mounted!.laserCharge,0);assert.equal(s.mounted!.energy,1098);assert.notEqual(LASERS.RAID.range,LASERS['FIL-30'].range);
});
test('Union AIP holds ARC-M until the beam can reach and closes from detection range',()=>{
 const s=new Simulation();s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];s.mission.terrain.rivers=[];s.mission.minefields=[];
 const aip=makeUnit('aip','union-aip',0,450,true);aip.iff='9999';aip.yaw=Math.PI;aip.aim=Math.PI;s.units=[aip];s.human={x:0,z:0};s.humanHealth=10000;
 let shots=0,gunShots=0;
 for(let i=0;i<30*20;i++){
  s.tick(1/30,idle);
  for(const event of s.events)if(event.type==='shot'&&event.unit===aip){
   shots++;
   const gap=Math.hypot(s.human.x-aip.x,s.human.z-aip.z),beam=event.to?Math.hypot(event.to.x-aip.x,event.to.z-aip.z):0;
   assert.ok(gap<LASERS['ARC-M'].range+1);assert.ok(beam+4>=gap);
   if(event.weapon==='3cREAP'){gunShots++;assert.ok(gap<160+1);}
  }
  s.events.length=0;
 }
 assert.ok(Math.hypot(aip.x-s.human.x,aip.z-s.human.z)<LASERS['ARC-M'].range);
 assert.ok(shots>0);
 assert.ok(gunShots>0);
});
test('Union AIP 3cREAP waits for its slower interval on repeated player shots',()=>{
 const s=mounted('union-aip'),u=s.mounted!,before=u.slotAmmo[1]!;s.fire(2);assert.equal(u.slotAmmo[1],before-1);assert.equal(u.slotCooldown[1],MACHINE_GUNS['3cREAP'].interval);assert.equal(MACHINE_GUNS['3cREAP'].interval,.5);
 step(s,21);s.fire(2);assert.equal(u.slotAmmo[1],before-1);
 step(s,5);s.fire(2);assert.equal(u.slotAmmo[1],before-2);
});
test('3cREAP uses its slower projectile speed and deals damage only after contact',()=>{
 const s=mounted('union-aip'),target=makeUnit('target','merc-sentry',0,118);s.units.push(target);s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];
 const shield=target.shield;s.fire(2);const bolt=s.missiles.find(p=>p.weapon==='3cREAP')!;
 assert.ok(bolt);assert.equal(MACHINE_GUNS['3cREAP'].projectileSpeed,40);assert.ok(Math.abs(Math.hypot(bolt.vx,bolt.vy,bolt.vz)-40)<1e-8);assert.equal(bolt.life,MACHINE_GUNS['3cREAP'].range/40);assert.equal(target.shield,shield);
 const start={x:bolt.x,z:bolt.z};step(s,50);assert.ok(s.missiles.includes(bolt));assert.ok(Math.abs(Math.hypot(bolt.x-start.x,bolt.z-start.z)-40)<2);assert.equal(target.shield,shield);
 step(s,100);assert.ok(target.shield<shield);
});
test('Scorp Tactical zWASP reaches a target after visible flight',()=>{
 const s=mounted('scorp-tactical'),target=makeUnit('target','merc-sentry',0,118,false);s.units.push(target);s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];
 const shield=target.shield;s.fire(2);const bolt=s.missiles.find(p=>p.weapon==='zWASP')!;
 assert.ok(bolt);assert.equal(MACHINE_GUNS.zWASP.projectileSpeed,60);assert.ok(Math.abs(Math.hypot(bolt.vx,bolt.vy,bolt.vz)-60)<1e-8);assert.equal(bolt.life,MACHINE_GUNS.zWASP.range/60);assert.equal(target.shield,shield);
 step(s,50);assert.ok(s.missiles.includes(bolt));assert.equal(target.shield,shield);
 step(s,60);assert.ok(target.shield<shield);
});
test('Union AIP AI 3cREAP repeats no faster than its weapon interval',()=>{
 const s=new Simulation();s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];s.mission.terrain.rivers=[];
 const aip=makeUnit('aip-gun','union-aip',0,100,true,{weapons:['3cREAP'],speed:0});aip.iff='enemy';aip.yaw=aip.aim=Math.PI;aip.alert=true;s.units=[aip];s.human={x:0,z:0};s.humanHealth=10000;
 const shots:number[]=[];for(let i=0;i<300;i++){s.tick(1/60,idle);if(s.events.some(event=>event.type==='shot'&&event.unit===aip&&event.weapon==='3cREAP'))shots.push(s.time);s.events=[];}
 assert.ok(shots.length>=3,`AI 3cREAP shots: ${shots.length}`);
 assert.ok(s.missiles.some(p=>p.weapon==='3cREAP'&&Math.abs(Math.hypot(p.vx,p.vy,p.vz)-40)<1e-8));
 for(let i=1;i<shots.length;i++)assert.ok(shots[i]-shots[i-1]>=MACHINE_GUNS['3cREAP'].interval-1e-8);
});
test('laser weapons use one of three shared flight-speed tiers',()=>{
 assert.deepEqual(LASER_SPEED_TIERS,{slow:72,medium:90,fast:180});
 assert.ok(Object.values(LASERS).every(weapon=>Object.values(LASER_SPEED_TIERS).includes(weapon.speed as 72|90|180)));
 assert.equal(LASERS.GAUS20.speed,LASER_SPEED_TIERS.medium);assert.equal(LASERS.GAUS30.speed,LASER_SPEED_TIERS.fast);assert.equal(LASERS['ARC-M'].speed,LASER_SPEED_TIERS.slow);
});
test('AI waits for READY before firing every laser, including rapid-fire HOMP11',()=>{
 for(const weapon of Object.keys(LASERS) as (keyof typeof LASERS)[]){
  const kind=weapon==='HOMP11'?'darken-tactical':'union-sentry';
  const s=new Simulation(),attacker=makeUnit(`ai-${weapon}`,kind,0,80,true,{weapons:[weapon],speed:0});attacker.iff='enemy';attacker.yaw=attacker.aim=Math.PI;attacker.alert=true;attacker.laserCharge=.5;s.units=[attacker];s.human={x:0,z:0};s.humanHealth=10000;s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];
  let shot=false;
  for(let i=0;i<360;i++){
   const charge=attacker.laserCharge;s.tick(1/60,idle);
   const fired=s.events.some(event=>event.type==='shot'&&event.unit===attacker&&event.weapon===weapon);
   if(fired){assert.equal(charge,1,`${weapon} fired below READY`);const beam=s.missiles.find(p=>p.weapon===weapon);assert.ok(beam);assert.equal(beam.damage,LASERS[weapon].damage);shot=true;break;}
   s.events=[];
  }
  assert.ok(shot,`${weapon} never fired after READY`);
 }
});
test('Hard AI uses partial-charge laser follow-up only near a target',()=>{
 assert.equal(HARD_AI_RAPID_MIN_CHARGE,.5);assert.equal(HARD_AI_RAPID_RANGE_FRACTION,.35);
 for(const difficulty of ['Easy','Medium','Hard'] as const)for(const range of [80,150]){
  const s=new Simulation(difficulty),attacker=makeUnit('rapid-p2mec','union-assault',0,range,true,{weapons:['P2MEC'],speed:0});attacker.iff='enemy';attacker.yaw=attacker.aim=Math.PI;attacker.alert=true;attacker.laserCharge=.5;s.units=[attacker];s.human={x:0,z:0};s.humanHealth=10000;s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];s.facilities=[];
  const shots:{time:number;charge:number;range:number}[]=[];
  for(let i=0;i<180&&shots.length<2;i++){
   const charge=attacker.laserCharge;s.tick(1/60,idle);
   const event=s.events.find(e=>e.type==='shot'&&e.unit===attacker&&e.weapon==='P2MEC');
   if(event){const beam=s.missiles.find(p=>p.id===event.projectileId)!;shots.push({time:s.time,charge,range:beam.life*LASERS.P2MEC.speed});}
   s.events=[];
  }
  assert.equal(shots.length,2,`${difficulty} at ${range}m`);assert.equal(shots[0]!.charge,1);
  if(difficulty==='Hard'&&range===80){assert.ok(shots[1]!.charge>=.5&&shots[1]!.charge<1);assert.ok(shots[1]!.range<LASERS.P2MEC.range);}
  else assert.equal(shots[1]!.charge,1,`${difficulty} at ${range}m`);
 }
});
test('Hard AI GAUS30 follow-up trades damage for cadence at close range',()=>{
 const s=new Simulation('Hard'),tower=makeUnit('hard-tower','scorp-meson-tower',0,100,true,{speed:0});s.units=[tower];s.human={x:0,z:0};s.humanHealth=10000;tower.iff='enemy';tower.yaw=tower.aim=Math.PI;tower.alert=true;s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];
 const shots:{charge:number;damage:number}[]=[];
 for(let i=0;i<270&&shots.length<2;i++){const charge=tower.laserCharge;s.tick(1/60,idle);const event=s.events.find(e=>e.type==='shot'&&e.unit===tower&&e.weapon==='GAUS30');if(event){const beam=s.missiles.find(p=>p.id===event.projectileId)!;shots.push({charge,damage:beam.damage});}s.events=[];}
 assert.equal(shots.length,2);assert.equal(shots[0]!.charge,1);assert.equal(shots[0]!.damage,LASERS.GAUS30.damage);assert.ok(shots[1]!.charge>=.5&&shots[1]!.charge<1);assert.equal(shots[1]!.damage,LASERS.GAUS30.damage*shots[1]!.charge);
});
test('moving AI shares the charge penalty and does not fire an undercharged RAID',()=>{
 const s=new Simulation();s.human={...MISSION.vehicle};s.board();s.iff='2620';const enemy=s.units[1];s.units=[s.mounted!,enemy];enemy.x=0;enemy.z=130;enemy.yaw=Math.PI;enemy.aim=Math.PI;enemy.alert=true;enemy.attackCycle=1;enemy.laserCharge=0;
 const shield=s.mounted!.shield;s.tick(.02,idle);const beam=s.events.find(e=>e.type==='shot'&&e.weapon==='RAID');assert.equal(beam,undefined);assert.equal(s.mounted!.shield,shield);assert.ok(enemy.laserCharge<=.02/LASERS.RAID.recharge*LASERS.RAID.movingRechargeFactor+1e-8);
});

test('laser bolts take time, can miss a moving target, and manual firing observes the slower interval',()=>{
 const s=mounted(),u=s.mounted!,target=makeUnit('target','merc-sentry',0,118);s.units.push(target);s.fire(2);
 const bolt=s.missiles.find(p=>p.weapon==='FIL-30')!;assert.equal(target.shield,22);assert.ok(Math.abs(Math.hypot(bolt.vx,bolt.vy,bolt.vz)-LASERS['FIL-30'].speed)<1e-8);
 s.tick(.05,idle);assert.ok(bolt.z>u.z&&bolt.z<target.z);assert.equal(target.shield,22);
 target.x=20;step(s,200);assert.equal(target.shield,22);assert.equal(s.missiles.length,0);
 const cadence=mounted(),times:number[]=[];for(let i=0;i<180;i++){const before=cadence.events.filter(e=>e.type==='shot'&&e.weapon==='FIL-30').length;cadence.tick(1/60,{...idle,fire2:true});if(cadence.events.filter(e=>e.type==='shot'&&e.weapon==='FIL-30').length>before)times.push(cadence.time);}assert.ok(times.length>=2&&times.length<=3);for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=LASERS['FIL-30'].interval-1e-8);step(cadence,60);const before=cadence.events.filter(e=>e.type==='shot').length;cadence.tick(1/60,{...idle,fire2:true});assert.equal(cadence.events.filter(e=>e.type==='shot').length,before+2);
});

test('Merc Cruiser GAUS20 travels at the slower speed without losing range',()=>{
 const s=mounted('merc-cruiser');
 assert.equal(LASERS.GAUS20.speed,90);
 assert.equal(LASERS.GAUS30.speed,180);
 s.fire(2);
 const bolt=s.missiles.find(p=>p.weapon==='GAUS20')!;
 assert.ok(bolt);
 assert.ok(Math.abs(Math.hypot(bolt.vx,bolt.vy,bolt.vz)-90)<1e-8);
 assert.ok(Math.abs(bolt.life-LASERS.GAUS20.range/90)<1e-8);
 const from={x:bolt.x,y:bolt.y,z:bolt.z};
 for(let i=0;i<5;i++)s.tick(.05,idle);
 assert.ok(Math.abs(Math.hypot(bolt.x-from.x,bolt.y-from.y,bolt.z-from.z)-22.5)<1e-6);
});

test('Union Sentry FIL-30 fires both lower cockpit mounts for player and AI; weapon names omit the mount count',()=>{
 assert.equal(weaponMountCount('union-sentry','FIL-30'),2);assert.equal(weaponDisplayName('union-sentry','FIL-30'),'FIL-30');assert.equal(weaponDisplayName('union-tactical','P2MEC'),'P2MEC');
 for(const ai of [false,true])for(const yaw of [0,Math.PI/2]){
  const s=new Simulation(),unit=makeUnit('sentry','union-sentry',0,ai?60:1,ai,{faction:ai?'scorp':'union',weapons:['FIL-30']});s.units=[unit];s.human={x:0,z:0};unit.yaw=unit.aim=yaw;
  if(ai){unit.iff='6707';unit.alert=true;s.human={x:Math.sin(yaw)*40,z:60+Math.cos(yaw)*40};s.tick(.01,idle);}else{s.board();unit.aim=yaw;s.fire(1);}
  const bolts=s.missiles.filter(p=>p.weapon==='FIL-30'),shots=s.events.filter(e=>e.type==='shot'&&e.unit===unit);assert.equal(bolts.length,2,`${ai?'AI':'player'} yaw=${yaw}`);assert.equal(shots.length,2);assert.equal(unit.energy,1598);
  const [a,b]=shots.map(e=>e.from!);assert.ok(Math.abs(Math.hypot(a.x-b.x,a.z-b.z)-1.3)<1e-8);assert.ok(shots.every(e=>e.from!.y!<unit.spec.height*.5));
 }
});
test('Union Assault fires twin P2MEC from slot 1 and keeps the other racks single',()=>{
 assert.equal(weaponMountCount('union-assault','P2MEC'),2);
 assert.equal(weaponMountCount('union-assault','VISOM'),1);
 assert.equal(weaponMountCount('union-assault','TCROCK'),1);
 const s=mounted('union-assault'),unit=s.mounted!;
 assert.equal(unit.spec.weapons[0],'P2MEC');
 s.fire(1);
 const beams=s.events.filter(e=>e.type==='shot'&&e.weapon==='P2MEC');
 assert.equal(beams.length,2);
 assert.ok(beams[0]!.from!.x*beams[1]!.from!.x<0);
 const face=VEHICLE_SHAPES['union-assault'],chin=unit.spec.height*.6+face.cockpit.y-face.cockpit.h/2;
 assert.ok(beams.every(e=>e.from!.y<chin));
 assert.equal(unit.energy,2198);
 unit.cooldown=0;s.fire(3);
 const visom=s.events.find(e=>e.type==='shot'&&e.weapon==='VISOM');assert.ok(visom?.from);assert.ok(visom!.from!.y<chin);
 const rack=mounted('union-assault');rack.fire(4);
 const rock=rack.events.find(e=>e.type==='shot'&&e.weapon==='TCROCK');assert.ok(rock?.from);assert.ok(rock!.from!.y<chin);
});
test('Union Assault repeats P2MEC faster while its TCREAP uses the slower machine-gun interval',()=>{
 const laser=mounted('union-assault'),unit=laser.mounted!,times:number[]=[];
 for(let i=0;i<120;i++){const before=laser.events.length;laser.tick(1/60,{...idle,fire1:true});if(laser.events.length>before)times.push(laser.time);}
 assert.equal(unit.spec.weaponIntervals?.P2MEC,.6);assert.equal(times.length,4);
 for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=.6-1e-8&&times[i]-times[i-1]<.65);
 const gun=mounted('union-assault'),shooter=gun.mounted!,ammo=shooter.slotAmmo[1]!;gun.fire(2);assert.equal(shooter.slotAmmo[1],ammo-1);assert.equal(shooter.slotCooldown[1],.5);
 step(gun,20);gun.fire(2);assert.equal(shooter.slotAmmo[1],ammo-1);
 step(gun,6);gun.fire(2);assert.equal(shooter.slotAmmo[1],ammo-2);
 assert.equal(MACHINE_GUNS.TCREAP.interval,.36);
});
test('Union Assault AI uses its chassis intervals for P2MEC and TCREAP',()=>{
 for(const [weapon,interval] of [['P2MEC',.6],['TCREAP',.5]] as const){
  const s=new Simulation(),attacker=makeUnit('assault','union-assault',0,80,true,{weapons:[weapon],speed:0});attacker.iff='enemy';attacker.yaw=attacker.aim=Math.PI;attacker.alert=true;s.units=[attacker];s.human={x:0,z:0};s.humanHealth=10000;s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];
  const times:number[]=[];for(let i=0;i<180;i++){const charge=attacker.laserCharge;s.tick(1/60,idle);if(s.events.some(event=>event.type==='shot'&&event.unit===attacker&&event.weapon===weapon)){if(weapon==='P2MEC')assert.equal(charge,1);times.push(s.time);}s.events=[];}
  assert.ok(times.length>=3,`${weapon} shots: ${times.join(',')}`);
  const minimum=weapon==='P2MEC'?Math.max(interval,LASERS.P2MEC.recharge):interval;
  for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=minimum-1e-8&&times[i]-times[i-1]<minimum+.1);
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
 assert.equal(unit.spec.weaponIntervals?.HOMP11,.4);assert.equal(charges[0],0);assert.ok(charges.length>=3&&charges.length<=4);assert.ok(charges.slice(1).every(charge=>charge<.9));assert.equal(fire(),charges.length*2);
 for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=.4-1e-8&&times[i]-times[i-1]<.45);
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
  if(ai){u.alert=true;s.human={x:Math.sin(yaw)*40,z:18+Math.cos(yaw)*40};s.tick(.01,idle);}else{s.human={x:0,z:18};s.board();u.aim=yaw;s.fire(1);}
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
 const s=new Simulation(),enemy=makeUnit('enemy','union-sentry',0,60,true,{faction:'scorp',weapons:['FIL-30']});enemy.iff='scorp';enemy.alert=true;enemy.yaw=enemy.aim=Math.PI;s.units=[enemy];s.human={x:0,z:0};s.tick(.02,idle);
 const shot=s.events.find(e=>e.type==='shot'&&e.unit===enemy)!;assert.ok(shot);assert.ok(shot.from!.y!<enemy.spec.height*.5);assert.ok(shot.from!.z!<enemy.z-1.5);
});


test('Scorp paired CETI, LRIP and chin RAID fire from both mounts for player and AI without double energy cost',()=>{
 for(const [kind,weapon,separation] of [['scorp-sentry','CETI',4],['scorp-assault','LRIP',.7],['scorp-tactical','RAID',1.1]] as const)for(const ai of [false,true])for(const yaw of [0,Math.PI/2]){
  const s=new Simulation(),u=makeUnit('dual',kind,0,18,ai,{faction:ai?'scorp':'union',weapons:[weapon],ai:{detection:160,strafe:0,keepMoving:false,stopDistance:65,missileVolley:1}});
  s.units=[u];s.human={x:0,z:18};u.aim=u.yaw=yaw;const energy=u.energy;
  if(ai){u.alert=true;s.human={x:Math.sin(yaw)*40,z:18+Math.cos(yaw)*40};s.tick(.01,idle);}else{s.board();u.aim=yaw;s.fire(1);}
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
 assert.equal(u.spec.weaponIntervals?.LRIP,.5);assert.equal(times.length,4);
 for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=.5-1e-8&&times[i]-times[i-1]<.55);
});

test('4-2 Scorp Assault AI repeats LRIP at the weapon interval inside laser range',()=>{
 const mission=structuredClone(MISSION_4_2);mission.units=mission.units.filter(unit=>unit.id==='scorp-assault2'||unit.id==='union-aip-1');mission.assaults=[];mission.personnel=[];mission.companions=[];mission.objectives=[];mission.completionEnabled=false;mission.base=undefined;mission.rocks=[];mission.terrain={...mission.terrain,river:undefined,peaks:[]};
 const s=new Simulation('Easy',mission),assault=s.units.find(unit=>unit.id==='scorp-assault2')!,target=s.units.find(unit=>unit.id==='union-aip-1')!;
 target.x=assault.x;target.z=assault.z+60;target.spec.speed=0;target.energy=0;target.slotAmmo.fill(0);target.spec.shield=100000;target.shield=100000;assault.spec.speed=0;assault.alert=true;
 const shots:number[]=[];let otherShots=0;
 for(let i=0;i<300;i++){const charge=assault.laserCharge;s.tick(1/60,idle);if(s.events.some(event=>event.type==='shot'&&event.unit===assault&&event.weapon==='LRIP')){assert.equal(charge,1);shots.push(s.time);}otherShots+=s.events.filter(event=>event.type==='shot'&&event.unit===assault&&event.weapon!=='LRIP').length;s.events=[];}
 assert.ok(shots.length>=4,`LRIP shots: ${shots.join(',')}; distance ${Math.hypot(target.x-assault.x,target.z-assault.z)}; charge ${assault.laserCharge}; status ${s.status}`);
 for(let i=1;i<shots.length;i++)assert.ok(shots[i]-shots[i-1]>=assault.spec.weaponIntervals!.LRIP!-1e-8&&shots[i]-shots[i-1]<.75,`LRIP gap ${shots[i]-shots[i-1]}`);
 assert.ok(otherShots>0,'the AI keeps using its other weapons while LRIP repeats');
});

test('moving 4-2 Scorp Assault AI waits for enough LRIP charge instead of switching to a slow volley',()=>{
 const mission=structuredClone(MISSION_4_2);mission.units=mission.units.filter(unit=>unit.id==='scorp-assault2'||unit.id==='union-aip-1');mission.assaults=[];mission.personnel=[];mission.companions=[];mission.objectives=[];mission.completionEnabled=false;mission.base=undefined;mission.rocks=[];mission.terrain={...mission.terrain,river:undefined,peaks:[]};
 const s=new Simulation('Easy',mission),assault=s.units.find(unit=>unit.id==='scorp-assault2')!,target=s.units.find(unit=>unit.id==='union-aip-1')!;
 target.x=assault.x;target.z=assault.z+100;target.spec.speed=0;target.energy=0;target.slotAmmo.fill(0);target.spec.shield=100000;target.shield=100000;assault.alert=true;
 const shots:number[]=[];
 for(let i=0;i<360;i++){const charge=assault.laserCharge;s.tick(1/60,idle);if(s.events.some(event=>event.type==='shot'&&event.unit===assault&&event.weapon==='LRIP')){assert.equal(charge,1);shots.push(s.time);}s.events=[];}
 assert.ok(shots.length>=2,`LRIP shots: ${shots.join(',')}`);
 assert.ok(shots.some((time,index)=>index>0&&time-shots[index-1]!<1.5),'the AI repeats LRIP without the mission-wide delay');
});

test('GAUS30 has a wider hit area without accepting clear misses or shots through cover',()=>{
 for(const {padding,offset,cover,hit} of [{padding:0,offset:.32,cover:false,hit:false},{padding:1.5,offset:1.2,cover:false,hit:true},{padding:1.5,offset:2.1,cover:false,hit:false},{padding:1.5,offset:1.2,cover:true,hit:false}]){
  const s=new Simulation(),tower=makeUnit('own','merc-meson-tower',0,20,false),target=makeUnit('target','merc-aip',0,100,true,{speed:0,ai:{detection:0}});
  s.mission={...s.mission,rocks:cover?[{x:3+offset,z:90,r:3}]:[],base:undefined};s.facilities=[];s.units=[tower,target];s.soldiers=[];s.human={x:0,z:20};assert.ok(s.board());target.iff='enemy';s.weapons.lasers.GAUS30.hitPadding=padding;
  s.fire(1);const beam=s.missiles.find(m=>m.weapon==='GAUS30')!;assert.ok(beam);assert.ok(Math.abs(Math.hypot(beam.vx,beam.vy,beam.vz)-LASERS.GAUS30.speed)<1e-8);
  Object.assign(beam,{x:3+offset,y:target.hoverHeight+target.spec.height*.6-.4,z:80,vx:0,vy:0,vz:450});
  const shield=target.shield;s.tick(.01,idle);assert.equal(target.shield,shield);assert.ok(Math.abs(beam.z-84.5)<1e-8);s.tick(.04,idle);
  assert.equal(target.shield,hit?shield-18:shield,JSON.stringify({padding,offset,cover}));
 }
});
test('Meson tower can hit an AIP beside the other tower inside 40 m',()=>{
 const s=new Simulation(),tower=makeUnit('own','merc-meson-tower',0,20,false),kylieTower=makeUnit('kylie','merc-meson-tower',0,60,true),target=makeUnit('target','merc-aip',5,55,true,{speed:0,ai:{detection:0}});
 s.mission={...s.mission,rocks:[],base:undefined,terrain:{...s.mission.terrain,cliffs:[]}};s.facilities=[];s.units=[tower,kylieTower,target];s.soldiers=[];s.human={x:0,z:20};assert.ok(s.board());target.iff='enemy';kylieTower.iff=tower.iff;
 s.aimBy(Math.atan2(target.x-tower.x,target.z-tower.z));s.lookBy(s.targetElevation(target));assert.ok(s.pitch>-.28);
 const shield=target.shield;s.fire(1);for(let i=0;i<70;i++)s.tick(1/60,idle);
 assert.ok(target.shield<shield,'the nearby AIP takes damage');
});
test('Meson tower downward view stops above an AIP at its own base',()=>{
 const s=new Simulation(),tower=makeUnit('own','merc-meson-tower',0,20,false),target=makeUnit('target','merc-aip',0,28,true,{speed:0,ai:{detection:0}});
 s.mission={...s.mission,rocks:[],base:undefined,terrain:{...s.mission.terrain,cliffs:[]}};s.facilities=[];s.units=[tower,target];s.soldiers=[];s.human={x:0,z:20};assert.ok(s.board());target.iff='enemy';
 s.lookBy(-2);assert.equal(s.pitch,-.28);for(let i=0;i<60;i++)s.tick(1/60,{...idle,lookDown:true});assert.equal(s.pitch,-.28);
 s.selected=target.id;s.tracking=true;for(let i=0;i<60;i++)s.tick(1/60,idle);assert.equal(s.pitch,-.28);assert.equal(s.targetState?.locked,false);
 const shield=target.shield;s.fire(1);for(let i=0;i<70;i++)s.tick(1/60,idle);
 assert.equal(target.shield,shield,'the AIP below the view limit stays out of the firing line');
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
 assert.equal(LASERS.GAUS30.range,1000);assert.equal(LASERS.GAUS30.speed,180);
 for(const kind of ['merc-meson-tower','scorp-meson-tower'] as const)assert.equal(makeUnit('tower',kind,0,0).spec.ai.detection,1000);
 const s=mounted('merc-meson-tower'),tower=s.mounted!;s.mission={...s.mission,rocks:[],base:undefined,terrain:{...s.mission.terrain,cliffs:[]}};s.facilities=[];
 const target=makeUnit('far-target','merc-meson-tower',tower.x,tower.z+900,true,{ai:{detection:0}});target.iff='enemy';s.units.push(target);s.pitch=s.targetElevation(target);
 assert.equal(s.selectInCrosshair(),target);s.clearTarget();s.fire(1);
 const beam=s.missiles.find(m=>m.weapon==='GAUS30')!;assert.ok(beam);assert.ok(Math.abs(Math.hypot(beam.vx,beam.vy,beam.vz)-LASERS.GAUS30.speed)<1e-8);assert.ok(Math.abs(beam.life-LASERS.GAUS30.range/LASERS.GAUS30.speed)<1e-8);
 step(s,250);assert.ok(target.shield<tower.spec.shield);
});
