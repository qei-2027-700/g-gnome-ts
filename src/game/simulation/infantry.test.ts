import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
import {MISSION} from '../content/mission-1-1.ts';
import {VEHICLES} from '../content/vehicles.ts';
import {INFANTRY_WEAPONS} from '../content/weapons.ts';
import {mobilityMultiplier} from './parts.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
const step=(s:Simulation,seconds:number)=>{for(let i=0;i<seconds*60;i++)s.tick(1/60,idle);};
function foot(){const s=new Simulation();s.units[0].x=100;s.units[0].z=-40;s.units[2].z=500;s.units[1].x=0;s.units[1].z=60;s.iff='6707';return s;}
function aimAt(s:Simulation,x:number,y:number,z:number){s.humanYaw=Math.atan2(x-s.human.x,z-s.human.z);s.pitch=Math.atan2(y-s.eyeHeight,Math.hypot(x-s.human.x,z-s.human.z));}
test('PRIF44 damages without ejecting; GASHR has five canisters and ejects after physical impact',()=>{
 const s=foot(),enemy=s.units[1];aimAt(s,0,4,60);s.fire(1);assert.ok(enemy.shield<22);assert.equal(enemy.pilot,true);assert.equal(s.gashrAmmo,5);
 const shield=enemy.shield,armor=enemy.armor;s.fire(2);assert.equal(s.gashrAmmo,4);assert.equal(enemy.pilot,true);assert.equal(s.soldiers.length,0);
 step(s,1.1);assert.equal(enemy.pilot,false);assert.equal(s.soldiers.length,1);assert.equal(enemy.shield,shield);assert.equal(enemy.armor,armor);assert.equal(s.soldiers[0].flight,null);assert.ok(Math.hypot(s.soldiers[0].x-enemy.x,s.soldiers[0].z-enemy.z)>4);assert.ok(s.events.some(e=>e.type==='pilot-eject'));
 s.footCooldown.GASHR=0;s.fire(2);step(s,1.1);assert.equal(s.soldiers.length,1);
});
test('gas misses, obstacles, empty vehicles and ammunition exhaustion cannot create extra pilots',()=>{
 const miss=foot();miss.humanYaw=Math.PI/2;miss.fire(2);step(miss,2);assert.equal(miss.soldiers.length,0);
 const rock=foot();rock.human={x:-40,z:20};rock.units[1].x=-40;rock.units[1].z=120;aimAt(rock,-40,4,120);rock.fire(2);step(rock,2);assert.equal(rock.soldiers.length,0);
 const empty=foot();empty.units[1].pilot=false;aimAt(empty,0,4,60);for(let i=0;i<5;i++){empty.footCooldown.GASHR=0;empty.fire(2);}assert.equal(empty.gashrAmmo,0);assert.equal(empty.missiles.length,5);empty.footCooldown.GASHR=0;empty.fire(2);assert.equal(empty.missiles.length,5);step(empty,2);assert.equal(empty.soldiers.length,0);
});
test('ejected enemy lands alive; empty HAWC is boardable and infantry ammunition is preserved',()=>{
 const s=foot(),unit=s.units[1],soldier=s.forceEject(unit)!;const shield=unit.shield,armor=unit.armor;step(s,3);assert.equal(soldier.flight,null);assert.ok(soldier.alive);
 s.gashrAmmo=3;s.human={x:unit.x,z:unit.z};assert.ok(s.board());assert.equal(s.mounted,unit);assert.equal(unit.shield,shield);assert.equal(unit.armor,armor);s.eject();assert.equal(s.gashrAmmo,3);
});
for(const kind of ['merc-sentry','merc-tactical'] as const){
 test(`GASHR clears ${kind} for automatic boarding on foot and player control`,()=>{
  const s=foot(),unit=s.units.find(u=>u.kind===kind)!;
  s.units=s.units.filter(u=>u===unit||u.kind==='union-sentry');
  unit.x=0;unit.z=60;unit.parts.leftLeg=.5;
  const parts={...unit.parts},ammo=unit.ammo,energy=unit.energy;
  aimAt(s,unit.x,VEHICLES[kind].height*.55,unit.z);s.fire(2);step(s,1.2);
  assert.equal(unit.pilot,false);assert.equal(unit.alive,true);
  assert.equal(s.soldiers.length,1);assert.equal(s.mounted,null);
  // Approach through normal movement rather than calling board or teleporting.
  s.humanYaw=0;
  for(let frame=0;frame<16*60&&!s.mounted;frame++)s.tick(1/60,{...idle,forward:true});
  assert.equal(s.mounted,unit);assert.equal(unit.pilot,true);
  assert.deepEqual(unit.parts,parts);assert.equal(unit.ammo,ammo);assert.equal(unit.energy,energy);
  assert.equal(s.gashrAmmo,4);assert.ok(s.soldiers[0].alive);
  assert.ok(s.events.some(e=>e.type==='board'&&e.unit===unit));
  const yaw=unit.yaw;s.tick(1/60,{...idle,right:true,boost:true});
  assert.ok(unit.yaw>yaw);assert.ok(s.speed>0);assert.equal(s.mounted,unit);
 });
}
test('PRIF44 can defeat ejected infantry without destroying the captured machine',()=>{
 const s=foot(),unit=s.units[1],soldier=s.forceEject(unit)!;step(s,3);aimAt(s,soldier.x,1,soldier.z);
 for(let i=0;i<5;i++){s.footCooldown.PRIF44=0;s.fire(1);}assert.equal(soldier.alive,false);assert.equal(unit.alive,true);assert.equal(s.kills,1);
});
test('Backspace launches upward, blocks boarding in the air and lands outside; ground exit stays quiet',()=>{
 const s=new Simulation();s.human={...MISSION.vehicle};s.board();const unit=s.mounted!;s.eject();assert.equal(s.mounted,null);assert.ok(s.flight);assert.equal(s.events.at(-1)?.launch,true);const height=s.flight!.altitude;
 step(s,.3);assert.ok(s.flight!.altitude>height);assert.equal(s.board(),false);assert.ok(s.eyeHeight>height);step(s,3);assert.equal(s.flight,null);assert.ok(Math.hypot(s.human.x-unit.x,s.human.z-unit.z)>7);assert.equal(s.mounted,null);
 s.human={x:unit.x,z:unit.z};s.board();s.eject('ground');assert.equal(s.flight,null);assert.equal(s.events.at(-1)?.launch,false);
});
test('damaged legs reduce player and enemy speed; other damaged parts do not',()=>{
 const s=new Simulation();s.human={...MISSION.vehicle};s.board();s.units=[s.mounted!];s.throttle=1;step(s,4);assert.ok(s.speed*3.6>69);
 s.mounted!.parts.hull=.1;step(s,2);assert.ok(s.speed*3.6>69);
 s.mounted!.parts.leftLeg=0;step(s,3);assert.ok(s.speed*3.6<43);assert.ok(s.speed*3.6>41);s.mounted!.parts.rightLeg=0;step(s,2);assert.ok(s.speed*3.6<16);
 assert.equal(mobilityMultiplier(s.mounted!.parts),.2);
 const healthy=foot(),damaged=foot();for(const a of [healthy,damaged]){a.iff='2620';a.human.z=0;a.units[1].z=100;a.units[1].cooldown=999;a.units[1].alert=true;}damaged.units[1].parts.leftLeg=0;damaged.units[1].parts.rightLeg=0;
 const z=healthy.units[1].z;step(healthy,1);step(damaged,1);assert.ok(Math.abs(damaged.units[1].z-z)<Math.abs(healthy.units[1].z-z));
});
test('waypoint starts hidden, cycles one then off and stays selected through boarding',()=>{
 const s=new Simulation();assert.equal(s.activeWaypoint,null);assert.equal(s.cycleWaypoint()?.id,1);s.human={...MISSION.vehicle};s.board();assert.equal(s.activeWaypoint?.id,1);s.eject();assert.equal(s.activeWaypoint?.id,1);assert.equal(s.cycleWaypoint(),null);assert.equal(new Simulation().activeWaypoint,null);
});

test('holding or repeatedly tapping the infantry rifle respects the slower 0.7-second firing interval',()=>{
 const s=foot();s.units=[];const times:number[]=[];
 for(let i=0;i<120;i++){
  const before=s.events.filter(e=>e.type==='shot'&&e.weapon==='PRIF44').length;
  s.tick(1/60,{...idle,fire1:true});
  if(s.events.filter(e=>e.type==='shot'&&e.weapon==='PRIF44').length>before)times.push(s.time);
 }
 assert.equal(times.length,3);for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=.7-1e-9);
 const tapped=foot();tapped.units=[];
 for(let i=0;i<10;i++)tapped.fire(1);
 assert.equal(tapped.events.filter(e=>e.type==='shot').length,1);
 step(tapped,41/60);tapped.fire(1);assert.equal(tapped.events.filter(e=>e.type==='shot').length,1);
 step(tapped,2/60);tapped.fire(1);assert.equal(tapped.events.filter(e=>e.type==='shot').length,2);
});

test('destroying an occupied Scorp ASV ejects one living Scorp combatant who lands',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 const s=new Simulation('Easy',MISSION_3_3),unit=s.units.find(u=>u.kind==='scorp-asv')!;unit.shield=0;
 s.damage(unit,9999,'cockpit');assert.equal(unit.alive,false);assert.equal(unit.pilot,false);
 assert.equal(s.soldiers.length,1);const soldier=s.soldiers[0];assert.equal(soldier.faction,'scorp');assert.equal(soldier.sourceVehicle,unit.id);assert.ok(soldier.alive&&soldier.health>0);assert.ok(soldier.flight);
 assert.equal(s.events.find(e=>e.type==='pilot-eject')?.ejection,'destruction');
 s.damage(unit,9999);assert.equal(s.soldiers.length,1);assert.equal(s.events.filter(e=>e.type==='pilot-eject').length,1);
 step(s,3.5);assert.equal(soldier.flight,null);assert.equal(soldier.alive,true);
});
test('empty Scorp vehicles and player-controlled Scorp vehicles cannot create enemy escapees',()=>{
 const s=new Simulation(),empty=s.units[1];empty.kind='scorp-asv';empty.spec={...empty.spec,faction:'scorp'};empty.pilot=false;empty.shield=0;s.damage(empty,9999);assert.equal(s.soldiers.length,0);
 const owned=new Simulation();const own=owned.units[0];own.kind='scorp-asv';own.spec={...own.spec,faction:'scorp'};owned.human={x:own.x,z:own.z};assert.ok(owned.board());own.shield=0;owned.damage(own,9999);assert.equal(owned.soldiers.length,0);assert.equal(owned.status,'running');assert.ok(owned.flight);
 const merc=new Simulation();merc.units[1].shield=0;merc.damage(merc.units[1],9999);assert.equal(merc.soldiers.length,0);assert.equal(merc.events.filter(e=>e.type==='soldier-death'&&e.faction==='merc').length,1);
});

test('friendly fire destroys a companion vehicle and launches its identified living pilot once',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');const s=new Simulation('Easy',MISSION_3_3),ally=s.units.find(u=>u.personId==='kylie')!;ally.shield=0;for(const part of Object.keys(ally.parts) as (keyof typeof ally.parts)[])ally.parts[part]=.001;
 s.aimBy(Math.atan2(ally.x-s.player.x,ally.z-s.player.z)-s.aim);s.lookBy(s.targetElevation(ally));s.tick(1/60,{...idle,fire1:true});step(s,.8);assert.equal(ally.alive,false);assert.equal(ally.pilot,false);assert.equal(ally.order,null);
 const pilot=s.soldiers.find(p=>p.sourceVehicle===ally.id)!;assert.ok(pilot?.alive&&pilot.flight);assert.equal(pilot.personId,'kylie');assert.equal(pilot.faction,'union');assert.equal(pilot.iff,ally.iff);assert.equal(s.events.filter(e=>e.type==='pilot-eject'&&e.unit===ally).length,1);
 s.damage(ally,9999);step(s,3.5);assert.equal(pilot.flight,null);assert.equal(pilot.alive,true);assert.equal(s.soldiers.filter(p=>p.sourceVehicle===ally.id).length,1);assert.ok(!s.board());
});

test('F boarding chooses nearest eligible vehicle; passenger preserves driver, orders and movement',async()=>{
 const {makeUnit}=await import('./simulation.ts');const s=new Simulation();s.mission.rocks=[];
 const far=makeUnit('far','union-sentry',0,10,false),carrier=makeUnit('carrier','scorp-asv',0,3);carrier.iff=s.iff;carrier.order={kind:'follow'};carrier.speed=8;carrier.yaw=.4;carrier.aim=.8;carrier.personId='driver';s.units=[far,carrier];s.human={x:0,z:0};
 far.z=6;carrier.speed=8;assert.equal(s.board(),true);assert.equal(s.passenger,carrier);assert.equal(s.mounted,null);assert.equal(carrier.pilot,true);assert.equal(carrier.personId,'driver');assert.equal(carrier.speed,8);
 const before={yaw:carrier.yaw,aim:carrier.aim,order:carrier.order};s.fire(1);assert.equal(s.events.filter(e=>e.type==='shot').length,0);
 s.tick(.05,{...idle,forward:true,right:true,fire1:true,fire2:true});assert.equal(carrier.yaw,before.yaw);assert.equal(carrier.aim,before.aim);assert.equal(carrier.order,before.order);assert.equal(s.player,carrier);assert.equal(s.humanHealth,100);
 carrier.speed=9;const order=carrier.order;s.eject();assert.equal(s.passenger,null);assert.equal(carrier.pilot,true);assert.equal(carrier.speed,9);assert.equal(carrier.order,order);assert.deepEqual(carrier.passengers,[]);assert.ok(s.flight);
});
test('passenger rejects HAWC, enemy IFF, full seats and reservations; seven metres is excluded',async()=>{
 const {makeUnit}=await import('./simulation.ts');
 for(const reason of ['hawc','iff','full','distance']){const s=new Simulation(),u=makeUnit('carrier',reason==='hawc'?'union-sentry':'union-asv',s.human.x,s.human.z);s.units=[u];if(reason==='iff')u.iff='1111';if(reason==='full')u.passengers=['a','b','c'];if(reason==='distance')u.z+=7;assert.equal(s.board(),false,reason);assert.equal(s.passenger,null);}
});
test('destroying or removing a passenger carrier clears riding state without killing the passenger',async()=>{
 const {makeUnit}=await import('./simulation.ts');for(const remove of [false,true]){const s=new Simulation(),u=makeUnit('carrier','union-asv',s.human.x,s.human.z);s.units=[u];assert.ok(s.board());const health=s.humanHealth;if(remove){s.units=[];s.tick(.01,idle);}else s.damage(u,9999);assert.equal(s.passenger,null);assert.equal(s.humanHealth,health);assert.equal(s.status,'running');assert.ok(s.flight);assert.ok(!u.passengers.includes('player'));}
});

test('boarding requires less than four metres for both pilot and passenger; automatic boarding uses the same boundary',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 for(const passenger of [false,true]){
  const s=passenger?new Simulation('Easy',MISSION_3_3):new Simulation();
  if(passenger)s.eject();
  s.flight=null;const unit=passenger?s.units.find(u=>u.id==='player-asv')!:s.units[0];
  if(passenger){unit.pilot=true;unit.iff=s.iff;}
  s.units=[unit];s.human={x:unit.x+4,z:unit.z};
  assert.equal(s.canBoard(unit),false);assert.equal(s.board(),false);
  s.tick(.001,idle);assert.equal(s.mounted,null);assert.equal(s.passenger,null);
  s.human.x=unit.x+6;assert.equal(s.board(),false);
  s.human.x=unit.x+3.99;assert.equal(s.canBoard(unit),true);
  if(passenger){s.tick(.001,idle);assert.equal(s.passenger,unit);assert.equal(s.mounted,null);}
  else{s.tick(.001,idle);assert.equal(s.mounted,unit);}
 }
});


for(const kind of ['union-sentry','union-tactical','union-asv','merc-sentry'] as const)test(`physical GASHR ejects ${kind} pilots independently of faction and IFF`,()=>{
 for(const iff of ['2620','7777']){
  const s=new Simulation(),unit=makeUnit('kylie',kind,0,60,true);unit.personId='kylie';unit.iff=iff;unit.spec.speed=0;unit.cooldown=999;unit.order={kind:'follow'};
  s.units=[unit];s.mission.rocks=[];s.mission.companions=[{personId:'kylie',unitId:unit.id,name:{ja:'キリー',en:'Kylie'},key:'F2'}];
  const before={shield:unit.shield,armor:unit.armor,energy:unit.energy,ammo:{...unit.ammunition}};
  aimAt(s,unit.x,unit.spec.height*.55,unit.z);s.fire(2);assert.equal(unit.pilot,true);assert.equal(s.soldiers.length,0);assert.equal(s.gashrAmmo,4);
  step(s,1.4);assert.equal(unit.pilot,false);assert.equal(unit.order,null);assert.equal(unit.speed,0);assert.equal(s.soldiers.length,1);
  const person=s.soldiers[0];assert.equal(person.personId,'kylie');assert.equal(person.iff,iff);assert.equal(person.faction,unit.spec.faction);assert.equal(person.health,35);assert.equal(!!person.flight,unit.spec.ejectionSeat!==false);assert.equal(person.alive,true);
  assert.deepEqual({shield:unit.shield,armor:unit.armor,energy:unit.energy,ammo:{...unit.ammunition}},before);assert.equal(s.events.filter(e=>e.type==='pilot-eject').length,1);
  if(iff===s.iff){assert.equal(s.radioMembers[0].soldier,person);assert.equal(s.radioMembers[0].available,true);s.selected=unit.id;assert.deepEqual(s.sendAllyOrder('kylie','board').accepted,[unit.id]);step(s,6);assert.equal(person.driverOf,unit.id);assert.equal(s.soldiers.length,1);assert.equal(unit.personId,'kylie');}
 }
});

test('infantry turns toward its opponent before firing and shots follow its facing direction',()=>{
 const s=new Simulation();s.units=[];s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.human={x:0,z:0};
 const soldier=s.forceEject(makeUnit('pilot','merc-sentry',0,55,true))!;soldier.flight=null;soldier.x=0;soldier.z=55;soldier.yaw=0;
 s.tick(.1,idle);assert.equal(s.events.filter(e=>e.type==='shot'&&e.soldier===soldier).length,0);assert.equal(s.humanHealth,100);
 step(s,1.5);const shot=s.events.find(e=>e.type==='shot'&&e.soldier===soldier)!;assert.ok(shot);assert.ok(s.humanHealth<100);
 const dx=shot.to!.x-shot.from!.x,dz=shot.to!.z-shot.from!.z;assert.ok(Math.abs(Math.atan2(dx,dz)-soldier.yaw)<.025);
});
test('lethal rifle hits emit one death event, while further hits and player damage cannot repeat death',()=>{
 const s=new Simulation();s.units=[];const soldier=s.forceEject(makeUnit('pilot','merc-sentry',0,20,true))!;soldier.flight=null;soldier.x=0;soldier.z=20;soldier.health=1;
 aimAt(s,0,1,20);s.fire(1);assert.equal(soldier.alive,false);assert.equal(s.events.filter(e=>e.type==='soldier-death').length,1);
 s.footCooldown.PRIF44=0;s.fire(1);assert.equal(s.events.filter(e=>e.type==='soldier-death').length,1);
 s.events=[];s.damage(null,100);s.damage(null,100);const deaths=s.events.filter(e=>e.type==='soldier-death');assert.equal(deaths.length,1);assert.equal(deaths[0].faction,s.mission.playerFaction);assert.equal(s.events.filter(e=>e.type==='lose').length,1);
});

test('a facing infantry shot is intercepted by an intervening empty vehicle',()=>{
 const s=new Simulation();s.human={...s.units[0]};s.board();const own=s.mounted!,soldier=s.forceEject(makeUnit('enemy','merc-sentry',own.x,own.z+70,true))!,blocker=makeUnit('cover','union-asv',own.x,own.z+35,false);
 s.units=[own,blocker];soldier.x=own.x;s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];soldier.flight=null;soldier.yaw=Math.PI;soldier.cooldown=0;const shield=own.shield,before=blocker.shield;
 s.tick(.02,idle);assert.equal(own.shield,shield);assert.equal(blocker.shield,before-INFANTRY_WEAPONS.PRIF44.vehicleDamage);assert.ok(s.events.some(e=>e.type==='shot'&&e.soldier===soldier));
});

function occupiedCarrier(moving=false){
 const s=new Simulation(),carrier=makeUnit('occupied','scorp-asv',0,1.5,true);s.units=[carrier];s.human={x:0,z:0};s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.minefields=[];
 carrier.spec={...carrier.spec,speed:moving?15:0,weapons:[],ai:{...carrier.spec.ai,detection:120,keepMoving:moving,strafe:0,stopDistance:0}};carrier.alert=moving;return {s,carrier};
}
test('contact with an occupied hostile passenger carrier announces once and stationary contact stays alive',()=>{
 const {s,carrier}=occupiedCarrier();s.tick(.02,idle);assert.equal(s.humanHealth,100);assert.equal(s.mounted,null);assert.equal(s.passenger,null);assert.equal(s.events.filter(e=>e.type==='occupied-contact').length,1);assert.equal(s.events.find(e=>e.type==='occupied-contact')!.unit,carrier);
 step(s,.3);assert.equal(s.status,'running');assert.equal(s.events.filter(e=>e.type==='occupied-contact').length,1);
 s.human.z=-12;s.tick(.02,idle);s.human.z=0;s.tick(.02,idle);assert.equal(s.events.filter(e=>e.type==='occupied-contact').length,2);
 carrier.spec.speed=15;carrier.spec.ai.keepMoving=true;carrier.alert=true;s.tick(.02,idle);assert.equal(s.status,'lost');assert.equal(s.humanHealth,0);
});
test('a moving hostile passenger carrier warns on first contact and kills on continued moving contact next update',()=>{
 const {s,carrier}=occupiedCarrier(true),start=carrier.z;s.tick(.02,idle);assert.notEqual(carrier.z,start);assert.equal(s.status,'running');assert.equal(s.events.filter(e=>e.type==='occupied-contact').length,1);
 s.tick(.02,idle);assert.equal(s.status,'lost');assert.equal(s.events.filter(e=>e.type==='occupied-contact').length,1);assert.equal(s.events.filter(e=>e.type==='lose').length,1);assert.ok(s.events.findIndex(e=>e.type==='occupied-contact')<s.events.findIndex(e=>e.type==='soldier-death'));
});
test('friendly, empty and safely airborne carrier contacts do not emit an occupied warning',()=>{
 const friendly=occupiedCarrier();friendly.carrier.iff=friendly.s.iff;friendly.s.tick(.02,idle);assert.equal(friendly.s.status,'running');assert.equal(friendly.s.events.some(e=>e.type==='occupied-contact'),false);assert.equal(friendly.s.passenger,friendly.carrier);
 const empty=occupiedCarrier();empty.carrier.pilot=false;empty.s.tick(.02,idle);assert.equal(empty.s.mounted,empty.carrier);assert.equal(empty.s.events.some(e=>e.type==='occupied-contact'),false);
 const flying=occupiedCarrier(true);flying.s.flight={altitude:20,vy:0,vx:0,vz:0};flying.s.tick(.02,idle);assert.equal(flying.s.status,'running');assert.equal(flying.s.events.some(e=>e.type==='occupied-contact'),false);
});

test('contact automatically boards a friendly carrier as passenger and accepts only ejection as a gameplay action',()=>{
 const {s,carrier}=occupiedCarrier();carrier.iff=s.iff;s.tick(.02,idle);assert.equal(s.passenger,carrier);assert.equal(s.mounted,null);assert.deepEqual(carrier.passengers,['player']);
 const before={yaw:carrier.yaw,aim:carrier.aim,iff:s.iff,pitch:s.pitch,selected:s.selected,waypoint:s.selectedWaypoint,ammo:{...carrier.ammunition}};
 s.aimBy(1);s.lookBy(1);s.selectTarget();s.selectInCrosshair();s.cycleTarget();s.cycleWaypoint();assert.equal(s.changeIff('7777'),false);assert.equal(s.sendAllyOrder('all','hold').error,'inactive');s.fire(1);
 s.tick(.02,{...idle,forward:true,right:true,boost:true,lookUp:true,center:true,fire1:true,fire2:true});
 assert.deepEqual({yaw:carrier.yaw,aim:carrier.aim,iff:s.iff,pitch:s.pitch,selected:s.selected,waypoint:s.selectedWaypoint,ammo:{...carrier.ammunition}},before);assert.equal(s.events.some(e=>e.type==='shot'||e.type==='center'||e.type==='boost'),false);assert.equal(s.humanHealth,100);
 s.eject();assert.equal(s.passenger,null);assert.ok(s.flight);assert.equal(carrier.pilot,true);assert.deepEqual(carrier.passengers,[]);
});

test('physical GASHR ejection preserves carrier momentum, then the empty vehicle brakes to rest',()=>{
 const s=foot(),unit=s.units[1];s.units=[unit];s.mission.rocks=[];unit.x=0;unit.z=60;unit.speed=10;unit.cooldown=999;unit.alert=false;unit.spec.ai.detection=0;
 aimAt(s,0,unit.spec.height*.55,60);s.fire(2);
 for(let i=0;i<120&&unit.pilot;i++)s.tick(1/60,idle);assert.equal(unit.pilot,false);assert.ok(unit.speed>0);const speed=unit.speed,z=unit.z;
 step(s,.5);assert.ok(unit.z>z);assert.ok(unit.speed>0&&unit.speed<speed);step(s,5);assert.equal(unit.speed,0);
});

test('walking into the hostile carrier movement boundary warns once without killing the player against a stationary hull',()=>{
 const {s,carrier}=occupiedCarrier();s.human.z=-8;
 for(let i=0;i<180;i++)s.tick(1/60,{...idle,forward:true});
 assert.equal(s.status,'running');assert.equal(s.humanHealth,100);assert.equal(s.events.filter(e=>e.type==='occupied-contact').length,1);assert.ok(s.human.z<carrier.z);
 carrier.spec.speed=15;carrier.spec.ai.keepMoving=true;carrier.alert=true;carrier.yaw=Math.PI;
 for(let i=0;i<60&&s.status==='running';i++)s.tick(1/60,idle);assert.equal(s.status,'lost');
});

test('holding a trigger through automatic passenger boarding and ejection cannot fire until release',()=>{
 const {s,carrier}=occupiedCarrier();carrier.iff=s.iff;s.tick(.02,{...idle,fire1:true});assert.equal(s.passenger,carrier);s.tick(.02,{...idle,fire1:true});s.eject();s.events=[];
 s.tick(.02,{...idle,fire1:true});assert.equal(s.events.some(e=>e.type==='shot'),false);s.tick(.02,idle);s.tick(.02,{...idle,fire1:true});assert.equal(s.events.filter(e=>e.type==='shot').length,1);
});

for(const kind of ['merc-sentry','merc-tactical'] as const)test(`${kind} has no ejection seat even when captured; ground evacuation and destruction remain separate`,()=>{
 const s=new Simulation(),unit=makeUnit('merc-no-seat',kind,0,30,false);s.units=[unit];s.human={x:0,z:30};s.board();unit.speed=8;s.speed=8;
 s.eject();assert.equal(s.flight,null);assert.equal(s.mounted,null);assert.ok(Math.hypot(s.human.x-unit.x,s.human.z-unit.z)>4);assert.equal(unit.speed,8);assert.equal(s.events.at(-1)?.launch,false);
 s.human={x:unit.x,z:unit.z};s.board();unit.shield=0;s.damage(unit,9999);assert.equal(s.status,'running');assert.equal(s.humanHealth,100);assert.equal(s.flight,null);assert.equal(s.mounted,null);
 const enemy=new Simulation(),target=makeUnit('merc-enemy',kind,0,60,true);enemy.units=[target];target.shield=0;enemy.damage(target,9999);assert.equal(target.alive,false);assert.equal(enemy.soldiers.filter(p=>p.alive).length,0);assert.equal(enemy.events.filter(e=>e.type==='pilot-eject').length,0);assert.equal(enemy.events.filter(e=>e.type==='soldier-death').length,1);
 enemy.damage(target,9999);assert.equal(enemy.events.filter(e=>e.type==='soldier-death').length,1);
});


async function eggerScenario(){
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind:'union-asv',x:200,z:0,pilot:false},{id:'enemy',kind:'scorp-asv',x:0,z:45,pilot:true}];def.startMountedUnitId='own';def.lures=[];def.minefields=[];def.rocks=[];def.base=undefined;def.completionEnabled=false;
 const s=new Simulation('Easy',def);s.eject('ground');s.human={x:0,z:0};s.iff=s.units[1].iff;aimAt(s,0,2,45);s.units[1].cooldown=999;return s;
}
test('mission 3-3 EGGER kills the cabin pilot without armor damage or a living ejection, then allows boarding',async()=>{
 const s=await eggerScenario(),unit=s.units[1],parts={...unit.parts},shield=unit.shield,armor=unit.armor,ammo=unit.ammo,energy=unit.energy;
 assert.equal(s.footSecondaryWeapon,'EGGER');s.fire(2);assert.equal(unit.pilot,true);assert.equal(s.eggerAmmo,4);step(s,1);
 assert.equal(unit.pilot,false);assert.equal(unit.alive,true);assert.deepEqual(unit.parts,parts);assert.equal(unit.shield,shield);assert.equal(unit.armor,armor);assert.equal(unit.ammo,ammo);assert.equal(unit.energy,energy);
 assert.equal(s.soldiers.length,1);assert.equal(s.soldiers[0].alive,false);assert.equal(s.soldiers[0].driverOf,unit.id);assert.equal(s.soldiers[0].flight,null);assert.equal(s.events.filter(e=>e.type==='pilot-eject').length,0);assert.equal(s.events.filter(e=>e.type==='soldier-death').length,1);
 s.humanYaw=0;for(let i=0;i<14*60&&!s.mounted;i++)s.tick(1/60,{...idle,forward:true});assert.equal(s.mounted,unit);s.eject('ground');assert.equal(s.eggerAmmo,4);
 s.human={x:0,z:0};aimAt(s,unit.x,2,unit.z);s.fire(2);step(s,1);assert.equal(s.soldiers.length,1);assert.equal(s.events.filter(e=>e.type==='soldier-death').length,1);
 assert.equal(new Simulation().footSecondaryWeapon,'GASHR');
});
test('EGGER kills existing driver and passenger identities inside the cabin and preserves vehicle momentum',async()=>{
 const s=await eggerScenario(),unit=s.units[1];
 const driver=s.forceEject(unit,'boarding')!;driver.driverOf=unit.id;unit.pilot=true;driver.flight=null;driver.health=17;
 const passenger={...driver,id:'passenger',personId:'passenger',driverOf:undefined,passengerOf:unit.id,health:20};s.soldiers.push(passenger);unit.passengers.push(passenger.id);unit.speed=8;
 s.fire(2);step(s,1);assert.equal(driver.alive,false);assert.equal(passenger.alive,false);assert.equal(s.soldiers.length,2);assert.equal(unit.passengers.length,0);assert.ok(unit.speed>0);assert.equal(s.events.filter(e=>e.type==='soldier-death').length,2);
});
test('EGGER ignores exposed infantry, respects cover and cannot fire with empty ammunition',async()=>{
 const ground=await eggerScenario(),unit=ground.units[1],person=ground.forceEject(unit,'boarding')!;person.x=0;person.z=20;person.cooldown=999;ground.units=[];ground.humanYaw=0;ground.pitch=0;ground.fire(2);step(ground,1.7);assert.equal(person.health,35);assert.equal(person.alive,true);
 const cover=await eggerScenario();cover.units[1].x=-40;cover.units[1].z=120;cover.human={x:-40,z:20};cover.mission.rocks=[{x:-40,z:60,r:12}];aimAt(cover,-40,2,120);cover.fire(2);step(cover,2);assert.equal(cover.units[1].pilot,true);assert.equal(cover.soldiers.length,0);
 const empty=await eggerScenario();for(let i=0;i<6;i++){empty.footCooldown.EGGER=0;empty.fire(2);}assert.equal(empty.eggerAmmo,0);assert.equal(empty.gashrAmmo,5);assert.equal(empty.missiles.length,5);
});

test('GASHR makes a moving Merc AIP coast down and settle onto the ground gradually; pause freezes landing and boarding restarts hover',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const {advanceSimulation}=await import('../session.ts');const def=structuredClone(MISSION_2_6);def.base=undefined;def.units=[{id:'own',kind:'union-sentry',x:100,z:-80,pilot:false},{id:'razor',kind:'merc-aip',x:0,z:45,pilot:true}];def.assignedUnitId='own';def.player={x:0,z:0};def.companions=[];def.personnel=[];def.assaults=[];def.pickups=[];def.objectives=[];def.completionEnabled=false;def.rocks=[];def.terrain.cliffs=[];
 const s=new Simulation('Easy',def),aip=s.units[1];s.iff='5031';aip.speed=12;s.pitch=s.targetElevation(aip);s.fire(2);assert.ok(s.missiles.some(p=>p.weapon==='GASHR'));
 for(let i=0;i<180&&aip.pilot;i++)s.tick(1/60,idle);assert.equal(aip.pilot,false);assert.equal(aip.hoverDisabled,true);assert.ok(s.soldiers.some(p=>p.sourceVehicle===aip.id&&p.alive));const height=aip.hoverHeight,speed=aip.speed;assert.ok(speed>0);assert.ok(height>0);
 const frozen=JSON.stringify({height:aip.hoverHeight,speed:aip.speed,time:s.time});assert.equal(advanceSimulation(s,'pause',1,idle),0);assert.equal(JSON.stringify({height:aip.hoverHeight,speed:aip.speed,time:s.time}),frozen);
 for(let i=0;i<30;i++)s.tick(1/60,idle);assert.ok(aip.hoverHeight<height);assert.ok(aip.hoverHeight>-.9);assert.ok(aip.speed<speed);
 for(let i=0;i<240;i++)s.tick(1/60,idle);assert.ok(aip.hoverHeight<0);assert.ok(Math.abs(aip.speed)<.1);const grounded=aip.hoverHeight;
 s.human={x:aip.x,z:aip.z};assert.equal(s.board(),true);assert.equal(s.mounted,aip);assert.equal(aip.hoverDisabled,false);for(let i=0;i<240;i++)s.tick(1/60,idle);assert.ok(aip.hoverHeight>grounded);assert.ok(Math.abs(aip.hoverHeight-aip.spec.hoverHeight!)<1e-6);
});
