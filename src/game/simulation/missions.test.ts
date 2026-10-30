import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
import {DEFAULT_MISSION,type MissionDefinition} from '../content/missions/index.ts';
import {VEHICLES} from '../content/vehicles.ts';
import {LASERS,INFANTRY_WEAPONS} from '../content/weapons.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
const advance=(s:Simulation,n=60)=>{for(let i=0;i<n;i++)s.tick(1/60,idle);};
function mission(id='test'):MissionDefinition{return {...structuredClone(DEFAULT_MISSION),id,player:{x:40,z:0},initialIff:'6707',units:[{id:'own',kind:'merc-sentry',x:40,z:0,pilot:false},{id:'target',kind:'union-sentry',x:40,z:100,pilot:true}],assignedUnitId:'own',playerFaction:'merc',rocks:[],waypoints:[{id:2,x:40,z:120,radius:3}],objectives:[{id:'reach',type:'reach',waypointId:2,label:{ja:'到達',en:'Reach'}}]};}
test('different missions reuse the same vehicle and weapon defaults; capacities are weapon-specific',()=>{
 const a=new Simulation('Easy',mission('a')),b=new Simulation('Hard',mission('b'));
 for(const s of [a,b]){const u=s.units[0];assert.equal(u.spec.speed,VEHICLES['merc-sentry'].speed);assert.equal(u.spec.armor,VEHICLES['merc-sentry'].armor);assert.equal(u.ammunition.CHUM,25);assert.equal(s.weapons.lasers.RAID.damage,LASERS.RAID.damage);}
 const tactical=makeUnit('t','merc-tactical',0,0,false);tactical.ammunition.DASY=20;tactical.ammunition.SAG5T=3;
 assert.equal(tactical.ammo,20);assert.equal(tactical.ammunition.SAG5T,3);
 a.units[0].spec.speed=1;assert.equal(b.units[0].spec.speed,85);assert.equal(VEHICLES['merc-sentry'].speed,85);
});
test('mission and spawn overrides affect movement, regeneration limits, damage, equipment and do not leak',()=>{
 const def=mission();def.vehicleOverrides={'merc-sentry':{speed:18,shield:9,armor:200,energy:80,initialAmmo:{CHUM:2}}};
 def.units=[{...def.units[0],overrides:{speed:36}},def.units[1]];
 def.weaponOverrides={lasers:{RAID:{damage:11,energy:3,speed:100,interval:.8}}};
 const s=new Simulation('Easy',def);s.board();const u=s.mounted!;assert.equal(u.spec.speed,36);assert.equal(u.shield,9);assert.equal(u.energy,80);assert.equal(u.ammo,2);
 s.iff='2620';s.units[1].pilot=false;for(let i=0;i<240;i++)s.tick(1/60,{...idle,boost:true});assert.ok(s.speed*3.6>35.9);s.throttle=0;s.speed=0;u.z=0;u.aim=0;u.yaw=0;s.pitch=0;
 u.energy=0;u.shield=0;advance(s,1500);assert.ok(u.energy<=80&&u.shield<=9);assert.equal(u.shield,9);
 const before=u.parts.hull;s.damage(u,20,'hull');assert.ok(Math.abs(u.parts.hull-(before-11/(200*.6)))<1e-9);
 s.fire(1);assert.equal(u.energy,77);assert.equal(s.missiles[0].damage,11);assert.equal(Math.hypot(s.missiles[0].vx,s.missiles[0].vy,s.missiles[0].vz),100);
 const next=new Simulation('Easy',mission('next'));assert.equal(next.units[0].spec.speed,85);assert.equal(next.weapons.lasers.RAID.damage,5);assert.equal(LASERS.RAID.damage,5);
 const retry=new Simulation('Easy',def);assert.equal(retry.units[0].spec.speed,36);assert.equal(retry.units[0].ammo,2);assert.equal(retry.units[0].parts.hull,1);
});
test('mission objectives support multiple waypoints and targeted elimination without Merc or enemy-count assumptions',()=>{
 const def=mission();def.waypoints=[{id:2,x:40,z:20,radius:2},{id:3,x:40,z:50,radius:2}];
 def.objectives=[{id:'two',type:'reach',waypointId:2,label:{ja:'2',en:'2'}},{id:'three',type:'reach',waypointId:3,label:{ja:'3',en:'3'}},{id:'kill',type:'eliminate',unitIds:['target'],label:{ja:'排除',en:'Eliminate'}}];
 const s=new Simulation('Easy',def);s.board();assert.equal(s.enemies[0].kind,'union-sentry');assert.equal(s.cycleWaypoint()?.id,2);assert.equal(s.cycleWaypoint()?.id,3);assert.equal(s.cycleWaypoint(),null);
 s.mounted!.z=20;s.tick(.01,idle);assert.equal(s.objectiveStates[0].done,true);assert.equal(s.status,'running');
 s.damage(s.units[1],10000);s.mounted!.z=50;s.tick(.01,idle);assert.equal(s.status,'won');
 const retry=new Simulation('Easy',def);assert.equal(retry.reachedWaypoints.size,0);assert.equal(retry.status,'running');
});
test('manual downward aim reaches nearby infantry, guns and travelling lasers hit, cover and vehicles block them',()=>{
 for(const slot of [1,2]){
  const s=new Simulation();s.human={...DEFAULT_MISSION.units[0]};s.board();const source=s.units[1],soldier=s.forceEject(source)!;soldier.flight=null;soldier.x=0;soldier.z=s.player.z+8;soldier.cooldown=999;s.iff='6707';source.x=100;source.z=150;
  for(let i=0;i<90;i++)s.tick(1/60,{...idle,lookDown:true});assert.ok(s.pitch<-.55);
  s.pitch=Math.atan2(1-s.eyeHeight,8);const health=soldier.health;s.fire(slot);if(slot===2){assert.equal(soldier.health,health);advance(s,10);}assert.ok(soldier.health<health);
 }
 const cover=new Simulation();cover.human={x:-40,z:20};cover.units[0].x=-40;cover.units[0].z=20;cover.board();const soldier=cover.forceEject(cover.units[1])!;soldier.flight=null;soldier.x=-40;soldier.z=120;cover.iff='6707';cover.pitch=Math.atan2(1-cover.eyeHeight,100);cover.fire(2);advance(cover);assert.equal(soldier.health,35);
});
test('small arms use a low shared anti-vehicle value for player and enemy infantry',()=>{
 const s=new Simulation();s.human={x:0,z:0};s.units[0].x=100;const target=s.units[1];target.x=0;target.z=60;s.pitch=Math.atan2(4-s.eyeHeight,60);s.fire(1);assert.ok(Math.abs(target.shield-(22-INFANTRY_WEAPONS.PRIF44.vehicleDamage))<1e-9);
 const mounted=new Simulation();mounted.human={...DEFAULT_MISSION.units[0]};mounted.board();const soldier=mounted.forceEject(mounted.units[1])!;soldier.flight=null;soldier.x=0;soldier.z=70;soldier.yaw=Math.atan2(mounted.mounted!.x-soldier.x,mounted.mounted!.z-soldier.z);mounted.units=[mounted.mounted!];soldier.cooldown=0;const shield=mounted.mounted!.shield;mounted.tick(.01,idle);assert.equal(mounted.mounted!.shield,shield-INFANTRY_WEAPONS.PRIF44.vehicleDamage);
});
test('missiles are slightly faster while their maximum travel range is preserved',()=>{
 const s=new Simulation();for(const [weapon,expectedSpeed,expectedRange] of [['CHUM',94,425],['SAG5T',110,600]] as const){const p=s.fireMissile(s.units[1],weapon);assert.ok(Math.abs(Math.hypot(p.vx,p.vy,p.vz)-expectedSpeed)<1e-9);assert.ok(Math.abs(expectedSpeed*p.life-expectedRange)<1e-9);}
});
test('AI uses both configured weapons even when the loadout contains no missile',()=>{
 const s=new Simulation('Easy',mission());s.board();const enemy=s.units[1];enemy.yaw=Math.PI;enemy.aim=Math.PI;enemy.alert=true;
 s.tick(.01,idle);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===enemy&&e.weapon==='FIL-30'));
 enemy.cooldown=0;s.tick(.01,idle);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===enemy&&e.weapon==='FLECH'));assert.equal(enemy.ammunition.FLECH,399);
});


function boardDefense(s:Simulation){for(let i=0;i<240&&!s.mounted;i++)s.tick(1/60,{...idle,forward:true});assert.equal(s.mounted?.id,'defense-tower');assert.ok(s.time<12);}

test('Meson held fire uses the slower cadence and slower flight while external power remains unlimited',()=>{
 const s=new Simulation(),tower=makeUnit('cadence','merc-meson-tower',0,20,false);s.units=[tower];s.human={x:0,z:20};assert.ok(s.board());s.events=[];
 const times:number[]=[];let flightSpeed=0;
 for(let i=0;i<600;i++){s.tick(1/60,{...idle,fire1:true});if(s.events.some(e=>e.type==='shot'&&e.unit===tower)){times.push(s.time);const beam=s.missiles.find(m=>m.owner===tower.id);if(beam)flightSpeed=Math.hypot(beam.vx,beam.vy,beam.vz);}s.events=[];}
 assert.ok(times.length>=5&&times.length<=7);for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=1.59&&times[i]-times[i-1]<1.75);
 assert.ok(flightSpeed>0&&flightSpeed<1000);assert.equal(tower.energy,tower.spec.energy);assert.deepEqual(tower.ammunition,{});
});

test('Meson external power supports unlimited player, friendly and enemy firing until its linked plant is destroyed',()=>{
 for(const role of ['player','friendly','enemy'] as const){
  const towerIff=role==='enemy'?'2620':'6707',targetIff=role==='enemy'?'6707':'2620';
  const def:MissionDefinition={...mission('external-power'),completionEnabled:false,objectives:[],waypoints:[],player:role==='player'?{x:0,z:20}:{x:-500,z:-300},initialIff:'6707',factionCodes:{merc:'6707',union:'2620'},
   companions:role==='friendly'?[{personId:'kylie',unitId:'tower',name:{ja:'キリー',en:'Kylie'},key:'F2'}]:[],
   units:[{id:'tower',kind:'merc-meson-tower',x:0,z:20,pilot:role!=='player',personId:role==='friendly'?'kylie':undefined,iff:towerIff,powerSourceId:'plant',overrides:{energy:1}},
    ...(role==='player'?[]:[{id:'dummy',kind:'union-sentry' as const,x:0,z:120,pilot:true,iff:targetIff,overrides:{weapons:[],speed:0,shield:100000}}])],
   assignedUnitId:'tower',base:{name:'power fixture',x:250,z:200,width:20,depth:20,buildings:[{id:'plant',kind:'power-plant',x:250,z:200,width:20,depth:20,height:10,boardable:false}]},
  };
  const s=new Simulation('Easy',def),tower=s.units[0];s.humanHealth=100000;if(role==='player')assert.ok(s.board());
  // One unit of stored energy cannot fund even one ordinary GAUS30 shot.
  let shots=0;for(let i=0;i<1600;i++){s.tick(.05,{...idle,fire1:role==='player'});shots+=s.events.filter(e=>e.type==='shot'&&e.unit===tower).length;s.events=[];}
  assert.ok(shots>20,`${role}: repeated external-power shots`);assert.equal(tower.energy,1);assert.deepEqual(tower.ammunition,{});
  const plant=s.facilities.find(f=>f.id==='plant')!;s.damageFacility(plant,10000,{x:plant.x,y:1,z:plant.z});s.events=[];
  for(let i=0;i<120;i++){s.tick(.05,{...idle,fire1:role==='player'});assert.ok(!s.events.some(e=>e.type==='shot'&&e.unit===tower));s.events=[];}
  assert.equal(s.unitPowered(tower),false);assert.equal(tower.laserCharge,0);
 }
 const ordinary=new Simulation(),hawc=makeUnit('ordinary','union-sentry',0,20,false,{weapons:['GAUS30'],energy:10});ordinary.units=[hawc];ordinary.human={x:0,z:20};assert.ok(ordinary.board());hawc.energy=1;ordinary.events=[];ordinary.fire(1);assert.ok(!ordinary.events.some(e=>e.type==='shot'));hawc.energy=10;ordinary.fire(1);assert.equal(hawc.energy,5);
});

test('2-6 links both Meson towers to its Merc power plant; its fixed tower fires a single GAUS30 without consuming energy and retry resets',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const s=new Simulation('Easy',MISSION_2_6);boardDefense(s);const tower=s.mounted!,start={x:tower.x,z:tower.z};
 for(let i=0;i<60;i++)s.tick(1/60,{...idle,forward:true,right:true,lookDown:true});
 assert.deepEqual({x:tower.x,z:tower.z},start);assert.equal(tower.yaw,0);assert.notEqual(tower.aim,0);assert.ok(s.pitch<0);
 s.events=[];s.tick(.01,{...idle,fire1:true});const shots=s.events.filter(e=>e.type==='shot'&&e.unit===tower);assert.equal(shots.length,1);assert.equal(shots[0].weapon,'GAUS30');assert.ok(shots[0].from!.y!<9.7);assert.ok(Math.hypot(shots[0].from!.x-tower.x,shots[0].from!.z-tower.z)>3);assert.equal(tower.energy,1200);const plant=s.facilities.find(f=>f.id==='merc-power-plant')!,citadel=s.facilities.find(f=>f.id==='citadel')!,comm=s.facilities.find(f=>f.id==='merc-latlon')!;assert.equal(plant.facilityType,'power-plant');assert.equal(comm.facilityType,'comm-array');assert.ok(citadel.x>plant.x&&plant.x>comm.x);assert.ok([citadel,plant,comm].every(f=>f.faction==='merc'));assert.ok(s.mission.units.filter(u=>u.kind==='merc-meson-tower').every(u=>u.powerSourceId===plant.id));plant.alive=false;assert.ok(s.units.filter(u=>u.kind==='merc-meson-tower').every(u=>!s.unitPowered(u)));tower.cooldown=0;s.events=[];s.tick(.05,{...idle,fire1:true});assert.ok(!s.events.some(e=>e.type==='shot'&&e.unit===tower));

 const retry=new Simulation('Easy',MISSION_2_6);assert.equal(retry.time,0);assert.equal(retry.mounted,null);boardDefense(retry);assert.equal(retry.status,'running');assert.ok(retry.unitPowered(retry.mounted!));assert.equal(retry.mounted!.energy,1200);assert.ok(retry.facilities.every(f=>f.alive));assert.ok(retry.units.every(u=>u.alive));
});

test('2-6 timed Merc assaults damage the Citadel even under a Merc disguise, cause one defeat, and cannot complete by waiting',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const def={...MISSION_2_6,assaults:MISSION_2_6.assaults!.map(a=>({...a,targetId:'citadel'})),personnel:MISSION_2_6.personnel!.filter(p=>p.personId!=='kylie'),companions:MISSION_2_6.companions!.filter(p=>p.personId!=='kylie')};const s=new Simulation('Easy',def),enemy=s.units.find(u=>u.kind==='merc-aip')!,before={x:enemy.x,z:enemy.z};s.iff='5031';
 for(let i=0;i<60;i++)s.tick(1/60,idle);assert.deepEqual({x:enemy.x,z:enemy.z},before);assert.equal(s.status,'running');
 const citadel=s.facilities.find(f=>f.id==='citadel')!;let damaged=false;
 for(let i=0;i<12000&&s.status==='running';i++){s.tick(1/60,idle);damaged ||= citadel.health<1200;}
 assert.ok(damaged);assert.equal(citadel.alive,false);assert.equal(s.status,'lost');assert.equal(s.events.filter(e=>e.type==='lose').length,1);s.tick(.05,idle);assert.equal(s.events.filter(e=>e.type==='lose').length,1);assert.ok(!s.objectiveStates[0].done);
});

test('2-6 progresses through real GAUS shots, Thane leaving the fortress and boarding a reserved HAWC',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const s=new Simulation('Easy',MISSION_2_6);boardDefense(s);let shots=0;const thane=s.soldiers.find(p=>p.personId==='thane')!;
 for(let i=0;i<12000&&s.status==='running'&&thane.insideFacility;i++){
  if(!s.target||!s.targetState?.inSight){s.selectTarget();for(let n=0;n<s.selectionTargets.length&&(!s.targetState?.inSight||!s.target||!s.isHostile(s.target));n++)s.cycleTarget();}s.tracking=true;
  s.tick(1/60,{...idle,fire1:!!s.targetState?.locked&&s.mounted?.laserCharge===1});shots+=s.events.filter(e=>e.type==='shot'&&e.unit===s.mounted).length;s.events=[];
 }
 assert.ok(shots>0);assert.equal(thane.insideFacility,undefined);assert.equal(s.status,'running');assert.ok(s.objectiveStates[0].done);assert.ok(!s.objectiveStates[1].done);assert.ok(!thane.passengerOf);
 s.eject();for(let i=0;i<600&&s.flight;i++)s.tick(1/60,idle);const reserve=s.units.find(u=>u.id==='reserve-assault'&&u.alive)??s.units.find(u=>u.id==='reserve-cruiser'&&u.alive)!;assert.ok(reserve?.alive);
 for(let i=0;i<4000&&!s.mounted&&s.status==='running';i++){const yaw=Math.atan2(reserve.x-s.player.x,reserve.z-s.player.z);s.aimBy(yaw-s.aim);s.tick(1/60,{...idle,forward:true});}
 assert.equal(s.mounted?.id,reserve.id,JSON.stringify({player:s.player,status:s.status,health:s.humanHealth,reserve:{x:reserve.x,z:reserve.z,alive:reserve.alive,pilot:reserve.pilot},distance:s.entryDistance(reserve)}));assert.equal(s.mounted?.spec.passengerCapacity,1);
 const drive=[{x:reserve.x,z:195},{x:70,z:195}];for(let i=0;i<12000&&s.status==='running';i++){if(drive.length&&Math.hypot(drive[0].x-s.player.x,drive[0].z-s.player.z)<4)drive.shift();const goal=drive[0]??s.player,bearing=Math.atan2(goal.x-s.player.x,goal.z-s.player.z),delta=Math.atan2(Math.sin(bearing-s.yaw),Math.cos(bearing-s.yaw)),near=!drive.length||Math.hypot(thane.x-s.player.x,thane.z-s.player.z)<10;s.tick(1/60,{...idle,forward:!near&&Math.abs(delta)<.45,left:!near&&delta<-.03,right:!near&&delta>.03,stop:near});}
 assert.equal(thane.passengerOf,reserve.id,JSON.stringify({thane,player:s.player,status:s.status,reserveAlive:reserve.alive,reservePassengers:reserve.passengers}));assert.equal(s.status,'won');assert.ok(thane.alive);
});

test('Merc Meson tower destruction ejects living occupants, including the player, while Merc HAWCs keep their own rule',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const s=new Simulation('Easy',MISSION_2_6);boardDefense(s);const tower=s.mounted!;s.damage(tower,10000);assert.equal(tower.alive,false);assert.equal(s.mounted,null);assert.equal(s.humanHealth,100);assert.equal(s.status,'running');assert.equal(s.flight,null);
 for(const kind of ['merc-meson-tower','merc-sentry'] as const){const enemy=makeUnit('occupied-'+kind,kind,100,0,true);s.units.push(enemy);s.damage(enemy,10000);const crew=s.soldiers.find(p=>p.sourceVehicle===enemy.id)!;if(kind==='merc-meson-tower'){assert.ok(crew);assert.equal(crew.alive,true);assert.ok(crew.health>0);}else assert.ok(!crew||!crew.alive);}
});


test('2-6 reserve Merc Assault can be reached on foot, piloted, exited and boarded again with ammunition preserved',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const s=new Simulation('Easy',MISSION_2_6);
 const assault=s.units.find(u=>u.id==='reserve-assault')!;assert.equal(assault.kind,'merc-assault');assert.equal(assault.pilot,false);assert.equal(assault.spec.boardable,true);
 const approach=()=>{s.humanYaw=Math.atan2(assault.x-s.human.x,assault.z-s.human.z);for(let i=0;i<1200&&!s.mounted&&s.status==='running';i++)s.tick(1/60,{...idle,forward:true,boost:true});};
 approach();assert.equal(s.mounted,assault);assert.equal(s.passenger,null);assert.ok(s.time<20);assert.ok(s.events.some(e=>e.type==='board'&&e.unit===assault));
 const ammo=assault.slotAmmo[1]!;s.fire(2);assert.equal(assault.slotAmmo[1],ammo-1);
 s.eject('ground');assert.equal(s.mounted,null);assert.equal(assault.pilot,false);assert.equal(s.flight,null);
 approach();assert.equal(s.mounted,assault);assert.equal(assault.slotAmmo[1],ammo-1);
 const retry=new Simulation('Easy',MISSION_2_6),fresh=retry.units.find(u=>u.id===assault.id)!;assert.equal(retry.mounted,null);assert.equal(fresh.pilot,false);assert.equal(fresh.slotAmmo[1],ammo);
});
test('2-6 starts on foot with Thane inside the giant fortress, Kylie boards the other tower before eight low Merc AIPs attack, and reserve HAWCs are empty',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const s=new Simulation('Easy',MISSION_2_6);assert.equal(s.mounted,null);assert.equal(s.mission.companions?.length,2);
 const thane=s.soldiers.find(p=>p.personId==='thane')!;assert.equal(thane.insideFacility,'citadel');assert.ok(!s.combatTargets.includes(thane));assert.equal(s.radioMembers.find(m=>m.personId==='thane')!.reason,'busy');assert.ok(s.facilities.find(f=>f.id==='citadel')!.height>40);
 const aip=s.units.filter(u=>u.kind==='merc-aip');assert.equal(aip.length,8);assert.ok(aip.some(u=>u.x>400));assert.ok(aip.some(u=>u.x< -400));assert.ok(aip.some(u=>u.z>600));assert.ok(aip.some(u=>u.z< -400));assert.ok(aip.every(u=>!!u.spec.hoverHeight&&u.spec.hoverHeight<2&&u.spec.height===3.7));
 for(const id of ['reserve-assault','reserve-cruiser'])assert.equal(s.units.find(u=>u.id===id)!.pilot,false);
 for(let i=0;i<180;i++)s.tick(1/60,idle);const kylie=s.units.find(u=>u.id==='kylie-tower')!;assert.equal(kylie.pilot,true);assert.equal(kylie.personId,'kylie');assert.ok(!s.events.some(e=>e.type==='shot'&&e.unit?.kind==='merc-aip'));
 boardDefense(s);assert.equal(thane.insideFacility,'citadel');assert.ok(thane.alive);
});

test('4-2 starts on foot, boards a dedicated Scorp Meson tower and records occupation through exit and retry',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const s=new Simulation('Easy',MISSION_4_2),tower=s.units.find(u=>u.id==='scorp-meson')!;
 assert.equal(s.mounted,null);assert.equal(s.mission.terrain.biome,'grassland');assert.equal(s.mission.terrain.skyPalette,'amber');assert.ok(s.units.find(u=>u.id==='scorp-rocket')!.x>s.player.x);assert.ok(!s.objectiveStates[0].done);
 for(let i=0;i<800&&!s.mounted;i++){s.humanYaw=Math.atan2(tower.x-s.human.x,tower.z-s.human.z);s.tick(1/60,{...idle,forward:true});}
 assert.equal(s.units.find(u=>u.id==='scorp-rocket')!.personId,'kylie');assert.equal(s.units.find(u=>u.id==='thane-meson')!.personId,'thane');assert.equal(s.mounted?.id,tower.id);assert.equal(tower.kind,'scorp-meson-tower');assert.ok(s.objectiveStates[0].done);s.fire(1);assert.ok(s.events.some(e=>e.type==='shot'&&e.weapon==='GAUS30'&&e.unit===tower));
 const start={x:tower.x,z:tower.z};for(let i=0;i<30;i++)s.tick(1/60,{...idle,forward:true,boost:true});assert.deepEqual({x:tower.x,z:tower.z},start);assert.equal(s.throttle,0);
 s.eject();assert.equal(s.flight,null);assert.ok(s.objectiveStates[0].done);const retry=new Simulation('Easy',MISSION_4_2);assert.ok(!retry.objectiveStates[0].done);assert.equal(retry.mounted,null);
});
test('4-2 Scorp garrison engages Union without shooting the player and the defense can win or fail once',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const s=new Simulation('Easy',MISSION_4_2),tower=s.units.find(u=>u.id==='scorp-meson')!;s.human={x:tower.x,z:tower.z};assert.ok(s.board());
 const attackers=s.mission.assaults!.map(a=>s.units.find(u=>u.id===a.unitId)!);for(const [i,u] of attackers.entries()){u.x=(i%4-1.5)*35;u.z=150+Math.floor(i/4)*40;}
 let friendlyShot=false,hostileShot=false;for(let i=0;i<2500&&s.status==='running';i++){s.tick(1/60,idle);friendlyShot ||= s.events.some(e=>e.type==='shot'&&s.mission.garrison!.includes(e.unit?.id??''));hostileShot ||= s.events.some(e=>e.type==='shot'&&attackers.some(u=>u===e.unit));s.events=[];if(friendlyShot&&hostileShot)break;}
 assert.ok(friendlyShot);assert.ok(hostileShot);assert.equal(tower.shield,tower.spec.shield);assert.ok(s.mission.garrison!.every(id=>s.units.find(u=>u.id===id)!.iff===s.iff));
 for(const u of attackers){s.damage(u,99999);for(const soldier of s.soldiers)if(soldier.sourceVehicle===u.id){soldier.alive=false;soldier.health=0;}}s.events=[];s.tick(.02,idle);assert.equal(s.status,'running');s.eject('ground');const control=s.facilities.find(f=>f.id==='bridge-control')!;s.human={x:control.x-control.width/2-1,z:control.z};assert.ok(s.board());assert.equal(s.status,'running');assert.ok(s.raiseBridge());assert.equal(s.status,'won');assert.equal(s.events.filter(e=>e.type==='win').length,1);assert.equal(s.raiseBridge(),false);s.tick(.02,idle);assert.equal(s.events.filter(e=>e.type==='win').length,1);
 const failed=new Simulation('Easy',MISSION_4_2);failed.damageFacility(failed.facilities.find(f=>f.id==='ur-kinsk-hq')!,99999,{x:0,y:1,z:-100});failed.tick(.02,idle);assert.equal(failed.status,'lost');assert.equal(failed.events.filter(e=>e.type==='lose').length,1);
});

test('4-2 can be completed by boarding, actual GAUS fire and Scorp supporting fire',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const s=new Simulation('Easy',MISSION_4_2),tower=s.units.find(u=>u.id==='scorp-meson')!;
 for(let i=0;i<800&&!s.mounted;i++){s.humanYaw=Math.atan2(tower.x-s.human.x,tower.z-s.human.z);s.tick(1/60,{...idle,forward:true});}
 assert.equal(s.mounted,tower);let shots=0,support=0;
 for(let i=0;i<15000&&s.status==='running';i++){
  if(!s.target||!s.isHostile(s.target))s.selectTarget();s.tracking=true;
  s.tick(1/60,{...idle,fire1:!!s.targetState?.locked&&s.targetState.inSight});
  shots+=s.events.filter(e=>e.type==='shot'&&e.unit===tower).length;support+=s.events.filter(e=>e.type==='shot'&&s.mission.garrison!.includes(e.unit?.id??'')).length;s.events=[];if(!s.enemies.length&&!s.soldiers.some(v=>v.alive&&v.iff!==s.iff))break;
 }
 assert.equal(s.status,'running');assert.equal(s.raiseBridge(),false);s.eject('ground');const control=s.facilities.find(f=>f.id==='bridge-control')!;for(let i=0;i<8000&&!s.insideFacility&&s.status==='running';i++){s.humanYaw=Math.atan2(control.x-s.human.x,control.z-s.human.z);s.tick(1/60,{...idle,forward:true});}assert.equal(s.insideFacility?.id,control.id);assert.equal(s.status,'running');assert.ok(s.raiseBridge());assert.equal(s.status,'won');assert.ok(shots>0);assert.ok(support>0);assert.ok(s.facilities.find(f=>f.id==='ur-kinsk-hq')!.alive);assert.ok(s.objectiveStates.every(o=>o.done));
 const retry=new Simulation('Easy',MISSION_4_2);assert.equal(retry.status,'running');assert.equal(retry.time,0);assert.equal(retry.mounted,null);assert.ok(retry.units.every(u=>u.alive));
});

test('4-2 has exactly two Union AIPs that attack the power plant and disable both Meson towers',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const air=MISSION_4_2.units.filter(u=>u.kind==='union-aip');assert.equal(air.length,2);assert.ok(air.every(u=>MISSION_4_2.assaults!.find(a=>a.unitId===u.id)!.targetId==='ur-kinsk-power'));
 const mission={...MISSION_4_2,completionEnabled:false,objectives:[],garrison:[],companions:[],personnel:[],units:MISSION_4_2.units.filter(u=>u.kind==='union-aip'||u.kind==='scorp-meson-tower'),assaults:MISSION_4_2.assaults!.filter(a=>air.some(u=>u.id===a.unitId)).map(a=>({...a,startAt:0}))};
 const s=new Simulation('Easy',mission),plant=s.facilities.find(f=>f.id==='ur-kinsk-power')!,tower=s.units.find(u=>u.id==='scorp-meson')!;s.human={x:tower.x,z:tower.z};assert.ok(s.board());
 for(const [i,u] of s.units.filter(u=>u.kind==='union-aip').entries()){u.x=plant.x+(i?50:-50);u.z=80;}
 const fired=new Set<string>();for(let i=0;i<3000&&plant.alive;i++){s.tick(1/60,idle);for(const e of s.events)if(e.type==='shot'&&e.unit?.kind==='union-aip')fired.add(e.unit.id);s.events=[];}
 assert.equal(fired.size,2);assert.equal(plant.alive,false);assert.ok(s.units.filter(u=>u.kind==='scorp-meson-tower').every(u=>!s.unitPowered(u)));tower.cooldown=0;s.events=[];s.fire(1);assert.ok(!s.events.some(e=>e.type==='shot'&&e.unit===tower));
});

test('4-2 clears immediately on its bridge switch, not on entering the control building or eliminating enemies',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const s=new Simulation('Easy',MISSION_4_2);assert.equal(s.raiseBridge(),false);
 const control=s.facilities.find(f=>f.id==='bridge-control')!;s.human={x:control.x-control.width/2-1,z:control.z};assert.ok(s.board());assert.equal(s.insideFacility,control);assert.equal(s.status,'running');assert.ok(s.enemies.length>0);
 assert.ok(s.raiseBridge());assert.equal(s.status,'won');assert.ok(s.raisedBridges.has('ur-kinsk-bridge'));assert.equal(s.events.filter(e=>e.type==='bridge-raised').length,1);assert.equal(s.events.filter(e=>e.type==='win').length,1);assert.equal(s.raiseBridge(),false);
 const retry=new Simulation('Easy',MISSION_4_2);assert.equal(retry.raisedBridges.size,0);assert.ok(!retry.objectiveStates.find(o=>o.id==='raise-bridge')!.done);
});

 test('raising the bridge destroys occupied and empty HAWCs and kills bridge pedestrians, preserving both banks',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const s=new Simulation('Easy',MISSION_4_2),r=s.mission.terrain.river!,control=s.facilities.find(f=>f.id==='bridge-control')!;
 const occupied=s.units.find(u=>u.id==='bridge-union-sentry')!,empty=s.units.find(u=>u.id==='scorp-asv-guard')!,safe=s.units.find(u=>u.id==='scorp-sentry-guard')!;occupied.x=r.x;occupied.z=r.bridgeZ;empty.x=r.x+12;empty.z=r.bridgeZ;empty.pilot=false;safe.x=r.x+r.width/2+10;safe.z=r.bridgeZ;
 const pedestrian=s.soldiers.find(v=>v.personId==='kylie')!,bank=s.soldiers.find(v=>v.personId==='thane')!;pedestrian.boardingTarget=undefined;pedestrian.x=r.x;pedestrian.z=r.bridgeZ;bank.boardingTarget=undefined;bank.x=r.x;bank.z=r.bridgeZ+r.bridgeWidth/2+1;
 const reserve=s.units.find(u=>u.id==='bridge-rocket')!;assert.equal(reserve.pilot,false);assert.ok(reserve.x<r.x-r.width/2);assert.ok(MISSION_4_2.units.find(u=>u.id===occupied.id)!.x>r.x+r.width/2);assert.ok(Math.abs(control.x-r.x)>150);
 s.human={x:control.x-control.width/2-1,z:control.z};assert.ok(s.board());assert.ok(s.raiseBridge());assert.equal(s.status,'won');assert.ok(!occupied.alive&&!empty.alive&&!pedestrian.alive);assert.ok(safe.alive&&bank.alive);assert.ok(!s.soldiers.some(v=>v.alive&&v.sourceVehicle===occupied.id));
 const deathEvents=s.events.filter(e=>e.type==='soldier-death').length;assert.equal(s.raiseBridge(),false);assert.equal(s.events.filter(e=>e.type==='soldier-death').length,deathEvents);
});

test('the empty bridge Scorp rocket tower boards and fires SREM and UNKPA from separate slots',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const s=new Simulation('Easy',MISSION_4_2),u=s.units.find(v=>v.id==='bridge-rocket')!;s.human={x:u.x,z:u.z};assert.ok(s.board());assert.equal(s.mounted,u);assert.deepEqual(u.spec.weapons,['SREM','UNKPA']);const before=[...u.slotAmmo];s.events=[];s.tick(1/60,{...idle,fire1:true});u.cooldown=0;s.tick(1/60,{...idle,fire2:true});assert.deepEqual(s.missiles.filter(p=>p.owner===u.id).map(p=>p.weapon),['SREM','UNKPA']);assert.deepEqual(u.slotAmmo,[before[0]!-1,before[1]!-1]);
 s.eject('ground');for(let i=0;i<300&&!s.mounted;i++){s.humanYaw=Math.atan2(u.x-s.human.x,u.z-s.human.z);s.tick(1/60,{...idle,forward:true});}assert.equal(s.mounted,u);assert.deepEqual(u.slotAmmo,[before[0]!-1,before[1]!-1]);assert.equal(new Simulation('Easy',MISSION_4_2).units.find(v=>v.id===u.id)!.slotAmmo[1],before[1]);
});

test('raising the 4-2 bridge does not destroy AIPs hovering above its deck',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const s=new Simulation('Easy',MISSION_4_2),r=s.mission.terrain.river!,control=s.facilities.find(f=>f.id==='bridge-control')!;
 const aip=s.units.find(u=>u.kind==='union-aip')!;aip.x=r.x;aip.z=r.bridgeZ;assert.ok(aip.hoverHeight>0);s.human={x:control.x-control.width/2-1,z:control.z};assert.ok(s.board());assert.ok(s.raiseBridge());assert.ok(aip.alive);assert.ok(aip.pilot);assert.equal(s.events.filter(e=>e.type==='destroy'&&e.unit===aip).length,0);
});
