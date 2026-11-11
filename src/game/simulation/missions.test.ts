import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
import {DEFAULT_MISSION,type MissionDefinition} from '../content/missions/index.ts';
import {VEHICLES} from '../content/vehicles.ts';
import {LASERS,INFANTRY_WEAPONS} from '../content/weapons.ts';
import {riverFrameAtZ,riverDistance,riverSamples} from '../content/missions/river.ts';
import {MISSION_4_3} from '../content/missions/mission-4-3.ts';
import {MISSION_1_5} from '../content/missions/mission-1-5.ts';
import {MISSION_3_4} from '../content/missions/mission-3-4.ts';
import {MAP_3_4_POINTS,map34PixelToWorld} from '../content/missions/mission-3-4-map.ts';
import {MISSION_3_2} from '../content/missions/mission-3-2.ts';
import {MAP_3_2_POINTS,map32PixelToWorld} from '../content/missions/mission-3-2-map.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
test('3-2 starts with Thane on the left in a Sentry and Kylie and Sheridan in separate Tactical HAWCs',()=>{
 const s=new Simulation('Easy',MISSION_3_2);
 assert.equal(s.mounted?.kind,'union-aip');
 assert.deepEqual(s.mounted.spec.weapons,['ARC-M','3cREAP']);
 assert.equal(s.mounted.slotAmmo[1],220);
 assert.equal(s.iff,'4044');
 assert.deepEqual({x:s.player.x,z:s.player.z},MAP_3_2_POINTS.start);
 assert.deepEqual(s.units.filter(u=>u.personId).map(u=>u.personId).sort(),['kylie','sheridan','thane']);
 assert.equal(s.units.find(u=>u.personId==='thane')?.kind,'union-sentry');
 assert.deepEqual({x:s.units.find(u=>u.personId==='thane')!.x,z:s.units.find(u=>u.personId==='thane')!.z},MAP_3_2_POINTS.thaneStart);
 assert.ok(s.units.find(u=>u.personId==='thane')!.z<s.player.z,'Thane is on the left as the player faces west');
 assert.equal(s.units.find(u=>u.personId==='kylie')?.kind,'union-tactical');
 assert.equal(s.units.find(u=>u.personId==='sheridan')?.kind,'union-tactical');
 assert.ok(s.units.find(u=>u.personId==='kylie')!.z<s.units.find(u=>u.personId==='thane')!.z,'Kylie starts in the east-central area');
 assert.equal(s.units.find(u=>u.id==='scorp-aip-patrol')?.kind,'scorp-aip');
 const enemyKinds=s.units.filter(u=>u.spec.faction==='scorp').map(u=>u.kind);
 for(const [kind,count] of [['scorp-meson-tower',2],['scorp-tactical',2],['scorp-aip',2],['scorp-assault',1],['scorp-rocket-tower',1]] as const)assert.equal(enemyKinds.filter(value=>value===kind).length,count,`${kind} roster`);
 assert.deepEqual(s.facilities.map(f=>f.facilityType).sort(),['comm-array','power-plant','shield-generator']);
 assert.ok(s.mission.objectives.some(o=>o.type==='destroy-facility'&&o.facilityIds.includes('ur-kinsk-comm')));
 const enemies=s.units.filter(u=>u.spec.faction==='scorp');
 for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++)assert.ok(Math.hypot(enemies[i]!.x-enemies[j]!.x,enemies[i]!.z-enemies[j]!.z)>=150,`${enemies[i]!.id} and ${enemies[j]!.id} are dispersed`);
 const radarContacts=s.selectionTargets.filter(target=>target.alive&&target.id!=='player-aip'&&Math.hypot(target.x-s.player.x,target.z-s.player.z)<=400);
 assert.ok(radarContacts.some(target=>target.id==='thane-sentry'&&!s.isHostile(target)));
 assert.ok(!radarContacts.some(target=>target.id==='scorp-td-north'),'the northern Tactical HAWC is by waypoint 1');
 const assault=s.units.find(u=>u.id==='scorp-assault')!;
 assert.equal(assault.spec.ejectionSeat,true);
 assert.deepEqual(assault.spec.weapons,['zWASP','LRIP','VISOM','SREM']);
 assert.equal(assault.slotAmmo[0],1000);assert.equal(assault.slotAmmo[2],20);assert.equal(assault.slotAmmo[3],80);
 assert.ok(s.forceEject(assault,'destruction'),'Scorp Assault pilot can eject');
 assert.deepEqual(s.events.filter(e=>e.type==='mission-radio'),[]);
 s.events=[];s.tick(1/60,idle);
 assert.equal(s.events.filter(e=>e.type==='mission-radio').length,0);
 assert.notEqual(s.mission.completionEnabled,false);
 assert.deepEqual(s.mission.waypoints.map(w=>w.id),[1,2,3]);
 assert.deepEqual(s.mission.minefields,[],'3-2 explicitly has no minefield areas');
 assert.equal(s.mines.length,0,'3-2 has no individual mines');
 assert.ok(s.mission.terrain.cliffs!.length>80);
 assert.equal(s.mission.terrain.grassTexture,true);
 assert.equal(s.mission.terrain.rockySlopeTexture,true);
 const slope=map32PixelToWorld(100,100);
 assert.ok(s.mission.terrain.cliffs!.some(c=>Math.abs(c.x-slope.x)<c.width/2&&Math.abs(c.z-slope.z)<c.depth/2));
 assert.ok(s.facilities.some(f=>f.id==='ur-kinsk-comm'&&f.facilityType==='comm-array'));
 const comm=s.facilities.find(f=>f.id==='ur-kinsk-comm')!;
 assert.equal(s.objectiveStates.find(o=>o.id==='destroy-latlon')?.done,false);
 s.damageFacility(comm,comm.health,{x:comm.x,y:1,z:comm.z});
 assert.equal(s.objectiveStates.find(o=>o.id==='destroy-latlon')?.done,true);
 assert.equal(s.objectiveStates.find(o=>o.id==='pass-southwest')?.done,false);
 s.tick(1/60,idle);assert.equal(s.status,'running','destroying the Latlon base alone does not complete the mission');
 assert.ok(MAP_3_2_POINTS.commArray.x<MAP_3_2_POINTS.thaneStart.x,'Latlon is central, west of Thane');
 assert.ok(MAP_3_2_POINTS.waypoint1.x<MAP_3_2_POINTS.thaneStart.x);
 assert.ok(MAP_3_2_POINTS.waypoint2.z<MAP_3_2_POINTS.commArray.z);
 assert.ok(MAP_3_2_POINTS.waypoint3.z<MAP_3_2_POINTS.waypoint2.z);
 assert.ok(s.units.find(u=>u.id==='scorp-assault')!.x<MAP_3_2_POINTS.waypoint3.x+50);
 assert.deepEqual({x:comm.x,z:comm.z},MAP_3_2_POINTS.commArray);
 assert.ok(s.units.find(u=>u.id==='meson-north')!.z>comm.z&&s.units.find(u=>u.id==='meson-south')!.z<comm.z,'the guard towers straddle the central comm area');
 assert.ok(s.facilities.find(f=>f.id==='scorp-shield-generator')!.z<MAP_3_2_POINTS.waypoint2.z,'the shield generator is south of the central waypoint');
 assert.ok(s.units.find(u=>u.id==='rocket-tower')!.z<MAP_3_2_POINTS.waypoint2.z,'the rocket tower is in the south');
});
test('3-2 completes after both the Latlon base is destroyed and the southwest passage is reached',()=>{
 const passage=MAP_3_2_POINTS.waypoint3;
 for(const order of ['passage-first','latlon-first'] as const){
  const s=new Simulation('Easy',MISSION_3_2),comm=s.facilities.find(f=>f.id==='ur-kinsk-comm')!;
  if(order==='passage-first'){
   s.mounted!.x=passage.x;s.mounted!.z=passage.z;s.tick(1/60,idle);
   assert.equal(s.objectiveStates.find(o=>o.id==='pass-southwest')?.done,true);
   assert.equal(s.status,'running');
   s.damageFacility(comm,comm.health,{x:comm.x,y:1,z:comm.z});s.tick(1/60,idle);
  }else{
   s.damageFacility(comm,comm.health,{x:comm.x,y:1,z:comm.z});s.tick(1/60,idle);
   assert.equal(s.status,'running');
   s.mounted!.x=passage.x;s.mounted!.z=passage.z;s.tick(1/60,idle);
  }
  assert.equal(s.status,'won',order);
  assert.deepEqual(s.objectiveStates.map(objective=>[objective.id,objective.done]),[['destroy-latlon',true],['pass-southwest',true]]);
  assert.equal(s.units.find(unit=>unit.id==='scorp-assault')?.alive,true,'the assault HAWC is not a kill requirement');
  assert.equal(s.events.filter(event=>event.type==='win').length,1);
 }
});
test('3-2 Thane moves on his own, the conversation starts after five seconds, and contact radio waits for the Scorp AIP',()=>{
 const s=new Simulation('Easy',MISSION_3_2),thane=s.units.find(u=>u.personId==='thane')!,initialX=thane.x,initialZ=thane.z,heard:{time:number;id:string}[]=[];
 for(let i=0;i<650;i++){
  s.tick(.05,idle);
  for(const event of s.events)if(event.type==='mission-radio')heard.push({time:s.time,id:event.radioId!});
  s.events=[];
 }
 assert.ok(thane.x<initialX-400,'Thane heads west from his marked northeast start toward waypoint 1');
 assert.ok(thane.z<initialZ-20,'Thane then begins descending the western side');
 assert.deepEqual(heard.map(entry=>entry.id),['thane-opening','kylie-history','thane-interrupt','kylie-reply','sheridan-encounter']);
 assert.ok(heard.slice(0,4).every(entry=>entry.time>=5&&entry.time<5.1));
 assert.ok(heard[4]!.time>=25&&heard[4]!.time<30);
 const noContact=new Simulation('Easy',MISSION_3_2);
 noContact.units.find(unit=>unit.id==='scorp-aip-patrol')!.x=1400;
 for(let i=0;i<520;i++){noContact.tick(.05,idle);assert.ok(!noContact.events.some(event=>event.radioId==='sheridan-encounter'));noContact.events=[];}
 const held=new Simulation('Easy',MISSION_3_2),heldThane=held.units.find(unit=>unit.personId==='thane')!;
 for(let i=0;i<20;i++)held.tick(.05,idle);
 assert.deepEqual(held.sendAllyOrder('thane','hold').accepted,['thane-sentry']);
 const stoppedAt={x:heldThane.x,z:heldThane.z};
 for(let i=0;i<100;i++)held.tick(.05,idle);
 assert.ok(Math.hypot(heldThane.x-stoppedAt.x,heldThane.z-stoppedAt.z)<15,'a player hold order cancels the scripted route');
});
test('3-2 allies destroy their assigned facilities in sequence when enemy vehicles are absent',()=>{
 const s=new Simulation('Easy',MISSION_3_2),plant=s.facilities.find(f=>f.id==='scorp-power-plant')!,comm=s.facilities.find(f=>f.id==='ur-kinsk-comm')!,generator=s.facilities.find(f=>f.id==='scorp-shield-generator')!;
 for(const unit of s.units)if(unit.spec.faction==='scorp')unit.pilot=false;
 for(let i=0;i<6000&&plant.alive;i++)s.tick(.05,idle);
 assert.equal(plant.alive,false,'Kylie and Sheridan attack the power plant after the nearby AIP is gone');
 assert.equal(comm.health,500,'they do not attack Latlon before the power plant is disabled');
 for(let i=0;i<6000&&(comm.alive||generator.alive);i++)s.tick(.05,idle);
 assert.equal(comm.alive,false,'Kylie and Sheridan proceed to Latlon after the ground shield falls');
 assert.equal(generator.alive,false,'Thane attacks the shield generator after his western route');
 assert.equal(s.status,'running','allies do not complete the player’s southwest passage objective');
});
test('3-2 nearby enemy vehicles take priority over the power plant',()=>{
 const s=new Simulation('Easy',MISSION_3_2),kylie=s.units.find(u=>u.id==='kylie-tactical')!,aip=s.units.find(u=>u.id==='scorp-aip-patrol')!,plant=s.facilities.find(f=>f.id==='scorp-power-plant')!;
 for(const unit of s.units)if(unit.spec.faction==='scorp')unit.pilot=false;
 aip.pilot=true;aip.x=kylie.x+60;aip.z=kylie.z;aip.spec.speed=0;aip.cooldown=999;aip.shield=1e6;aip.armor=1e6;
 for(let i=0;i<400;i++)s.tick(.05,idle);
 assert.equal(plant.health,350,'the allies engage the nearby AIP first');
 aip.pilot=false;
 for(let i=0;i<3600&&plant.health===350;i++)s.tick(.05,idle);
 assert.ok(plant.health<350,'the allies resume the power plant attack when the AIP is gone');
});
test('3-2 a GASHR-ejected companion boards a nearby empty vehicle and resumes the facility route',()=>{
 const s=new Simulation('Easy',MISSION_3_2),old=s.units.find(u=>u.id==='kylie-tactical')!,replacement=s.units.find(u=>u.id==='scorp-td-south')!,plant=s.facilities.find(f=>f.id==='scorp-power-plant')!;
 for(const unit of s.units)if(unit.spec.faction==='scorp')unit.pilot=false;
 const pilot=s.forceEject(old,'gas')!;old.x=1400;old.z=1400;replacement.x=pilot.x+18;replacement.z=pilot.z+8;
 for(let i=0;i<600&&!pilot.driverOf;i++)s.tick(.05,idle);
 assert.equal(pilot.driverOf,replacement.id);
 assert.equal(replacement.personId,'kylie');assert.equal(replacement.iff,s.iff);
 for(let i=0;i<3600&&plant.alive;i++)s.tick(.05,idle);
 assert.equal(plant.alive,false,'Kylie retains her scripted target after changing vehicles');
});
test('3-2 ground shield blocks foot and HAWCs, permits AIPs and shots, and vanishes with the power plant',()=>{
 const s=new Simulation('Easy',MISSION_3_2),shield=s.mission.groundShields![0]!,plant=s.facilities.find(f=>f.id===shield.powerPlantId)!,aip=s.mounted!,hawc=s.units.find(u=>u.id==='kylie-tactical')!;
 assert.ok(shield.x<aip.x&&shield.x<hawc.x,'the shield lies west of the eastern allies');
 s.units=[aip,hawc];
 const west=shield.x-shield.width/2-35;
 s.human={x:west,z:shield.z};s.mounted=null;
 s.move(s.human,Math.PI/2,100);
 assert.ok(s.human.x<shield.x-shield.width/2,'a soldier cannot cross the powered shield');
 s.human.z+=100;
 hawc.x=west;hawc.z=shield.z;s.move(hawc,Math.PI/2,100);
 assert.ok(hawc.x<shield.x-shield.width/2,'a HAWC cannot cross the powered shield');
 hawc.z+=100;
 aip.x=west;aip.z=shield.z;s.move(aip,Math.PI/2,100);
 assert.ok(aip.x>shield.x+shield.width/2,'the Union AIP can cross');
 const terrain=(s as unknown as {terrainObstacles:{x:number;z:number;width:number;depth:number}[]}).terrainObstacles;
 assert.ok(!terrain.some(box=>box.x===shield.x&&box.z===shield.z&&box.width===shield.width&&box.depth===shield.depth),'projectile collision ignores the foot-level shield');
 s.damageFacility(plant,plant.health,{x:plant.x,y:1,z:plant.z});
 s.human={x:west,z:shield.z};s.move(s.human,Math.PI/2,100);
 assert.ok(s.human.x>shield.x+shield.width/2,'destroying the power plant opens the crossing');
});
test('3-4 traces the west-bank crossing, impassable color regions and southeast endpoint',()=>{
 const s=new Simulation('Easy',MISSION_3_4),river=MISSION_3_4.terrain.river!,control=s.facilities.find(f=>f.id==='bridge-control')!,hq=s.facilities.find(f=>f.id==='ur-alr-hq')!;
 assert.equal(s.mounted?.kind,'scorp-tactical');assert.equal(s.units.find(u=>u.id==='thane-td')?.kind,'scorp-tactical');
 assert.equal(s.mission.objectives.length,4);assert.ok(s.raisedBridges.has('ur-alr-bridge'));
 assert.ok(s.player.x<MAP_3_4_POINTS.bridge.x&&control.x<MAP_3_4_POINTS.bridge.x);
 assert.ok(s.units.find(u=>u.id==='thane-td')!.z<s.player.z,'Thane starts behind the player, facing northwest');
 assert.equal(s.iff,'4033','the opening cockpit reference shows the starting IFF');
 const viewAngle=(point:{x:number;z:number})=>Math.atan2(point.x-s.player.x,point.z-s.player.z)-s.yaw;
 assert.ok(viewAngle(map34PixelToWorld(80,200))<0&&viewAngle(map34PixelToWorld(80,200))>-.8,'the mountain lies to the left in the opening view');
 assert.ok(viewAngle(control)>.8,'bridge control lies beyond the right edge of the opening view');
 assert.deepEqual(s.mission.waypoints.map(w=>w.id),[1,2,3]);
 assert.ok(s.mission.waypoints[0]!.x<s.mission.waypoints[1]!.x&&s.mission.waypoints[1]!.x<s.mission.waypoints[2]!.x);
 assert.equal(hq.x,MAP_3_4_POINTS.finalBase.x);assert.equal(hq.z,MAP_3_4_POINTS.finalBase.z);
 const tower=s.units.find(u=>u.id==='east-meson-tower')!;
 assert.equal(tower.kind,'scorp-meson-tower');assert.ok(tower.x>MAP_3_4_POINTS.bridge.x);
 assert.ok(river.path!.length>12);assert.ok(Math.abs(river.path![0]!.z-river.path!.at(-1)!.z)>1000);
 assert.ok(s.mission.terrain.cliffs!.some(c=>c.surface==='slope')&&s.mission.terrain.cliffs!.some(c=>c.surface==='plateau'));
 assert.ok(s.mission.terrain.cliffs!.length>100);
 s.units=[];s.mounted=null;s.mission.base=undefined;
 s.human=map34PixelToWorld(95,200);s.move(s.human,-Math.PI/2,140);
 assert.ok(s.human.x>map34PixelToWorld(78,200).x,'the bright slope stops travel from the dark plain');
 s.human=map34PixelToWorld(250,255);s.move(s.human,-Math.PI/2,180);
 assert.ok(s.human.x>map34PixelToWorld(210,255).x,'the dark-green plateau stops travel from the plain');
});
test('3-4 checks each objective and completes when Sheridan reaches the secured headquarters',()=>{
 const s=new Simulation('Easy',MISSION_3_4),player=s.mounted!,objective=(id:string)=>s.objectiveStates.find(o=>o.id===id)?.done;
 assert.ok(s.objectiveStates.every(o=>!o.done));
 const bridge=s.facilities.find(f=>f.id==='bridge-control')!,tower=s.units.find(u=>u.id==='east-meson-tower')!;
 bridge.pilot=false;s.eject('ground');s.human={x:bridge.x+bridge.width/2+1,z:bridge.z};assert.ok(s.board());assert.ok(s.operateBridge());
 assert.equal(objective('bridge-defense'),false);
 s.damage(tower,10000,'hull',undefined,player);s.tick(1/60,idle);assert.equal(objective('bridge-defense'),true);
 s.eject('ground');s.human={x:player.x+2,z:player.z+2};assert.ok(s.board());
 player.x=MAP_3_4_POINTS.waypoint2.x;player.z=MAP_3_4_POINTS.waypoint2.z;s.tick(1/60,idle);
 assert.equal(objective('approach'),true);assert.equal(objective('sheridan-hq'),false);
 player.x=MAP_3_4_POINTS.waypoint3.x;player.z=MAP_3_4_POINTS.waypoint3.z;s.tick(1/60,idle);
 const sheridan=s.units.find(u=>u.personId==='sheridan')!;assert.ok(sheridan?.alive);
 const shield=s.facilities.find(f=>f.id==='ur-alr-shield')!,mineControl=s.facilities.find(f=>f.id==='ur-alr-mine-control')!,rocket=s.units.find(u=>u.id==='base-rocket-tower')!;
 s.damageFacility(shield,shield.health,{x:shield.x,y:4,z:shield.z});s.damageFacility(mineControl,mineControl.health,{x:mineControl.x,y:4,z:mineControl.z});
 s.tick(1/60,idle);assert.equal(objective('ur-alr-attack'),false);
 s.damage(rocket,10000,'hull',undefined,player);s.tick(1/60,idle);assert.equal(objective('ur-alr-attack'),true);
 assert.equal(s.status,'running');assert.equal(objective('sheridan-hq'),false);
 sheridan.x=MAP_3_4_POINTS.finalBase.x+40;sheridan.z=MAP_3_4_POINTS.finalBase.z;
 s.tick(1/60,idle);assert.equal(objective('sheridan-hq'),true);assert.equal(s.status,'won');assert.ok(s.events.some(e=>e.type==='win'));
 const failed=new Simulation('Easy',MISSION_3_4),failedPlayer=failed.mounted!;failedPlayer.x=MAP_3_4_POINTS.waypoint3.x;failedPlayer.z=MAP_3_4_POINTS.waypoint3.z;failed.tick(1/60,idle);
 const lostSheridan=failed.units.find(u=>u.personId==='sheridan')!;lostSheridan.alive=false;lostSheridan.pilot=false;failed.tick(1/60,idle);
 assert.equal(failed.status,'lost');assert.ok(failed.events.some(e=>e.type==='lose'));
});
test('3-4 squad appears and accepts radio only upon waypoint 3 arrival',()=>{
 const s=new Simulation('Easy',MISSION_3_4),player=s.mounted!;
 assert.ok(!s.units.some(u=>u.personId==='kylie'||u.personId==='sheridan'));
 assert.equal(s.radioMembers.find(m=>m.personId==='kylie')?.reason,'missing');
 assert.equal(s.radioMembers.find(m=>m.personId==='sheridan')?.reason,'missing');
 assert.equal(s.sendAllyOrder('kylie','follow').accepted.length,0);
 player.x=MAP_3_4_POINTS.waypoint2.x;player.z=MAP_3_4_POINTS.waypoint2.z;
 s.tick(1/60,idle);assert.ok(!s.units.some(u=>u.personId==='kylie'||u.personId==='sheridan'));
 const target=MAP_3_4_POINTS.waypoint3,routeStart={x:player.x,z:player.z};
 s.move(player,Math.atan2(target.x-routeStart.x,target.z-routeStart.z),Math.hypot(target.x-routeStart.x,target.z-routeStart.z));
 assert.ok(Math.hypot(player.x-target.x,player.z-target.z)<2,'the grass valley stays traversable');
 assert.ok(!s.units.some(u=>u.personId==='kylie'||u.personId==='sheridan'),'travel alone does not spawn the squad before waypoint evaluation');
 s.tick(1/60,idle);
 const kylie=s.units.find(u=>u.id==='kylie-td')!,sheridan=s.units.find(u=>u.id==='sheridan-asv')!;
 assert.equal(kylie.kind,'scorp-tactical');assert.equal(sheridan.kind,'scorp-asv');
 assert.equal(kylie.personId,'kylie');assert.equal(sheridan.personId,'sheridan');
 assert.equal(s.radioMembers.find(m=>m.personId==='kylie')?.available,true);
 assert.equal(s.radioMembers.find(m=>m.personId==='sheridan')?.available,true);
 assert.deepEqual(s.sendAllyOrder('kylie','follow').accepted,['kylie-td']);
 s.tick(1/60,idle);assert.equal(s.units.filter(u=>u.personId==='kylie'||u.personId==='sheridan').length,2);
 const hq=MAP_3_4_POINTS.finalBase,start={x:player.x,z:player.z};
 s.move(player,Math.atan2(hq.x-start.x,hq.z-start.z),Math.hypot(hq.x-start.x,hq.z-start.z));
 assert.ok(Math.hypot(player.x-hq.x,player.z-hq.z)<35,'the vehicle reaches the headquarters entrance');
 assert.equal(kylie.order?.kind,'follow');assert.equal(sheridan.order?.kind,'follow');
 assert.equal(s.events.filter(e=>e.type==='mission-radio'&&e.text==='rendezvous').length,1);
 const mineControl=s.facilities.find(f=>f.id==='ur-alr-mine-control')!,rocket=s.units.find(u=>u.id==='base-rocket-tower')!;
 assert.equal(rocket.kind,'scorp-rocket-tower');assert.ok(rocket.z<MAP_3_4_POINTS.finalBase.z);
 assert.ok(s.facilities.some(f=>f.id==='ur-alr-shield'&&f.facilityType==='shield-generator'));
 assert.ok(s.facilities.some(f=>f.id==='ur-alr-hq'&&f.facilityType==='command'));
 assert.ok(s.mission.vehicleElevator&&s.mission.vehicleElevator.z<MAP_3_4_POINTS.finalBase.z);
 assert.ok(s.mines.some(m=>!m.spent));
 s.damageFacility(mineControl,mineControl.health,{x:mineControl.x,y:4,z:mineControl.z});
 assert.ok(s.mines.every(m=>m.spent));
 const mine=MISSION_3_4.minefields![0]!.mines[0]!;
 player.x=mine.x;player.z=mine.z;s.tick(1/60,idle);
 assert.equal(player.alive,true,'disabled mines no longer destroy the vehicle');
 const live=new Simulation('Easy',MISSION_3_4),liveMine=live.mines.find(m=>m.id===mine.id)!;
 live.mounted!.x=liveMine.x;live.mounted!.z=liveMine.z;live.tick(1/60,idle);
 assert.equal(live.mounted?.alive??false,false,'an active mine destroys the vehicle');
});
test('3-4 bridge crew exits after GASHR and the far-bank tower respects IFF',()=>{
 const s=new Simulation('Easy',MISSION_3_4),control=s.facilities.find(f=>f.id==='bridge-control')!,tower=s.units.find(u=>u.id==='east-meson-tower')!;
 assert.equal(control.pilot,true);
 tower.pilot=false;
 s.eject('ground');s.human={x:control.x-36,z:control.z};s.humanYaw=Math.PI/2;
 assert.equal(s.board(),false,'the occupied control building cannot be entered');
 s.fire(2);
 for(let i=0;i<45;i++)s.tick(1/60,idle);
 assert.equal(control.pilot,false,'GASHR forces the bridge crew outside');
 const crew=s.soldiers.find(p=>p.sourceVehicle==='bridge-control')!;
 assert.ok(crew?.alive);
 for(let shot=0;shot<6&&crew.alive;shot++){
  s.human={x:crew.x+5,z:crew.z};s.humanYaw=-Math.PI/2;
  s.fire(1);
  for(let i=0;i<45;i++)s.tick(1/60,idle);
 }
 assert.equal(crew.alive,false,'the ejected crew can be killed on foot');
 s.human={x:control.x+control.width/2+1,z:control.z};
 assert.equal(s.board(),true);assert.equal(s.insideFacility?.id,'bridge-control');
 const own=s.units.find(u=>u.id==='player-td')!,thane=s.units.find(u=>u.id==='thane-td')!;
 assert.equal(s.iff,'4033','the player is still recognizable on foot inside the facility');
 assert.equal(own.iff,'3317');assert.equal(thane.iff,'3317');
 assert.equal(s.operateBridge(),true);assert.ok(!s.raisedBridges.has('ur-alr-bridge'));
 s.eject('ground');s.human={x:own.x+2,z:own.z+2};assert.ok(s.board());
 assert.equal(s.iff,'3317');assert.equal(s.isHostile(tower),false);assert.equal(s.isHostile(thane),false);
 const thaneFoot=s.forceEject(thane,'boarding')!;
 assert.equal(thaneFoot.iff,'4033');assert.equal(s.isHostile(thaneFoot),false);
 s.selected=thane.id;assert.deepEqual(s.sendAllyOrder('thane','board').accepted,[thane.id]);
 for(let i=0;i<150&&(!thane.pilot||thane.iff!=='3317');i++)s.tick(1/60,idle);
 assert.equal(thane.pilot,true);assert.equal(thane.iff,'3317');
 s.mounted!.x=tower.x-48;s.mounted!.z=tower.z;tower.pilot=true;
 for(let i=0;i<120;i++)s.tick(1/60,idle);
 assert.ok(!s.events.some(e=>e.type==='shot'&&e.unit===tower),'the matching vehicle IFF keeps the tower friendly');
 thane.x=tower.x-42;thane.z=tower.z+24;
 const exposedThane=s.forceEject(thane,'boarding')!;
 assert.equal(exposedThane.iff,'4033');
 for(let i=0;i<90;i++)s.tick(1/60,idle);
 assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===tower),'the tower recognizes Thane on foot while the player remains disguised');
 exposedThane.alive=false;thane.alive=false;
 s.events.length=0;
 s.eject('ground');assert.equal(s.iff,'4033');assert.equal(s.isHostile(tower),true);
 for(let i=0;i<180;i++)s.tick(1/60,idle);
 assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===tower),'the tower recognizes the player on foot');
 const atStart=new Simulation('Easy',MISSION_3_4),distantGuard=atStart.units.find(u=>u.id==='east-meson-tower')!;
 for(let i=0;i<180;i++)atStart.tick(1/60,idle);
 assert.ok(!atStart.events.some(e=>e.type==='shot'&&e.unit===distantGuard),'the far-bank tower does not fire at the initial position');
 const exposed=new Simulation('Easy',MISSION_3_4),guard=exposed.units.find(u=>u.id==='east-meson-tower')!;
 exposed.mounted!.x=guard.x-48;exposed.mounted!.z=guard.z;
 for(let i=0;i<120;i++)exposed.tick(1/60,idle);
 assert.ok(exposed.events.some(e=>e.type==='shot'&&e.unit===guard),'the tower fires at a visible player before IFF alignment');
 const disguised=new Simulation('Easy',MISSION_3_4),friendlyGuard=disguised.units.find(u=>u.id==='east-meson-tower')!;
 disguised.mounted!.x=friendlyGuard.x-48;disguised.mounted!.z=friendlyGuard.z;
 assert.ok(disguised.changeIff(friendlyGuard.iff));
 for(let i=0;i<120;i++)disguised.tick(1/60,idle);
 assert.ok(!disguised.events.some(e=>e.type==='shot'&&e.unit===friendlyGuard),'the matching IFF prevents tower fire');
});
function riverBank(path:readonly {x:number;z:number}[],x:number,z:number){
 let best=Infinity,side=0;
 for(let i=1;i<path.length;i++){
  const a=path[i-1]!,b=path[i]!,dx=b.x-a.x,dz=b.z-a.z,len2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/len2));
  const cx=a.x+dx*t,cz=a.z+dz*t,dist=Math.hypot(x-cx,z-cz),len=Math.hypot(dx,dz)||1;
  if(dist<best){best=dist;side=(dx/len)*(z-cz)-(dz/len)*(x-cx);}
 }
 return side;
}
const advance=(s:Simulation,n=60)=>{for(let i=0;i<n;i++)s.tick(1/60,idle);};
function driveRoute(s:Simulation,points:readonly (readonly [number,number])[]){for(const [x,z] of points){for(let i=0;i<1500&&s.status==='running'&&Math.hypot(s.player.x-x,s.player.z-z)>8;i++){const unit=s.mounted;assert.ok(unit,'route vehicle remains occupied');unit.yaw=Math.atan2(x-unit.x,z-unit.z);unit.aim=unit.yaw;s.tick(.05,{...idle,forward:true});}assert.ok(s.status!=='running'||Math.hypot(s.player.x-x,s.player.z-z)<=8,`route blocked before ${x}, ${z}`);}}
test('1-5 starts in a Darken TD, requires generator destruction and bridge lowering, then waits for Kylie',()=>{
 const s=new Simulation('Easy',MISSION_1_5),player=s.mounted!,control=s.facilities.find(f=>f.id==='bridge-control')!,generator=s.facilities.find(f=>f.id==='shield-generator')!;
 assert.equal(player.kind,'darken-tactical');assert.equal(s.iff,'0024');assert.ok(s.raisedBridges.has('chambers-bridge'));
 const river=s.mission.terrain.river!,bridge=riverFrameAtZ(river,river.bridgeZ),path=river.path!;
 const ahead=(point:{x:number;z:number})=>(point.x-player.x)*Math.sin(player.yaw)+(point.z-player.z)*Math.cos(player.yaw);
 const right=(point:{x:number;z:number})=>(point.x-player.x)*Math.cos(player.yaw)-(point.z-player.z)*Math.sin(player.yaw);
 const bank=(point:{x:number;z:number})=>riverBank(path,point.x,point.z),playerBank=bank(player);
 const rocket=s.units.find(u=>u.id==='rocket-tower')!,meson=s.units.find(u=>u.id==='meson-tower')!,power=s.facilities.find(f=>f.id==='darken-power')!;
 const cliff=s.mission.terrain.cliffs!.find(c=>c.id==='ahead-cliff')!;
 const nearestRiver=riverSamples(river,8).reduce((best,point)=>Math.hypot(point.x-player.x,point.z-player.z)<Math.hypot(best.x-player.x,best.z-player.z)?point:best);
 assert.ok(player.x>control.x&&player.yaw<0,'start on the east side, facing west');
 assert.ok(Math.abs(path[0]!.x-path.at(-1)!.x)>800,'river runs east to west');
 assert.ok(right(nearestRiver)<-40&&riverDistance(river,player.x,player.z)>river.width/2+30,'the river lies on the left of the opening view');
 assert.ok(ahead(cliff)>0&&right(cliff)>0,'the opening cliff is ahead and to the right');
 assert.ok(playerBank*bank(rocket)<0&&riverDistance(river,rocket.x,rocket.z)>river.width/2,'rocket tower stands across the river');
 assert.ok(Math.max(...path.map(point=>point.z))>path[0]!.z+180,'the traced river bows north');
 assert.ok(path.at(-1)!.z<path[0]!.z-300,'the traced river leaves through the south');
 assert.ok(bridge.x<-400&&bridge.z<path[0]!.z,'the bridge lies on the western run');
 for(const place of [meson,power,control,generator])assert.ok(playerBank*bank(place)>0&&place.z>bridge.z&&riverDistance(river,place.x,place.z)>river.width/2,`${place.id} stands north of the bridge`);
 assert.ok(Math.hypot(power.x-meson.x,power.z-meson.z)<80,'the power plant stands beside the meson tower');
 assert.ok(Math.hypot(control.x-bridge.x,control.z-bridge.z)<160&&Math.hypot(generator.x-control.x,generator.z-control.z)<140,'bridge control and the shield generator sit together north of the bridge');
 const bridgeTd=s.units.find(u=>u.id==='bridge-td')!,controlSentry=s.units.find(u=>u.id==='control-sentry')!;
 assert.ok(playerBank*bank(bridgeTd)>0&&bridgeTd.z>bridge.z&&Math.hypot(bridgeTd.x-bridge.x,bridgeTd.z-bridge.z)<150,'the Darken TD waits north of the bridge');
 assert.ok(playerBank*bank(controlSentry)>0&&Math.hypot(controlSentry.x-control.x,controlSentry.z-control.z)<90,'one Darken sentry stands with the bridge control');
 assert.ok((s.mission.terrain.cliffs?.length??0)>40,'the white ridges are impassable cliffs');
 for(const hawk of s.units.filter(u=>u.id!=='player-td'&&/sentry|tactical|asv/.test(u.kind)))assert.ok(playerBank*bank(hawk)>0&&riverDistance(river,hawk.x,hawk.z)>river.width/2,`${hawk.id} stays on the player's bank`);
 assert.ok(playerBank*bank(s.soldiers.find(p=>p.personId==='kylie')!)<0,'Kylie waits on the far bank');
 const scale=Math.min(540/(s.mission.terrain.halfWidth*2),500/(s.mission.terrain.maxZ-s.mission.terrain.minZ));
 assert.ok(Math.abs((control.z-s.mission.base!.z)*scale)>36,'Chambers Pass and BRIDGE labels stay apart on the mission map');
 assert.ok(riverDistance(river,control.x,control.z)>river.width/2,'control is outside the river');
 assert.equal(s.mission.terrain.skyPalette,'amber');
 assert.equal(s.mission.bgm?.start.trackId,'bgm-mission-1-1-sentry-combat');
 assert.equal(s.units.find(u=>u.id==='rocket-tower')?.spec.missileHomingScale?.UNKPA,0);
 s.eject('ground');s.human={x:control.x-control.width/2-1,z:control.z};assert.equal(s.board(),false);
 s.damageFacility(generator,generator.health,{x:generator.x,y:1,z:generator.z});assert.ok(s.board());assert.equal(s.insideFacility?.id,'bridge-control');
 assert.ok(s.operateBridge());assert.equal(s.objectiveStates.find(o=>o.id==='lower-bridge')?.done,true);
 s.eject('ground');s.human={x:player.x,z:player.z+3};assert.ok(s.board());
 for(const enemy of s.units.filter(u=>u!==player)){enemy.alive=false;enemy.pilot=false;}
 assert.ok(s.changeIff('1234'));
 driveRoute(s,[[352,128],[528,128],[528,240],[512,240],[512,256],[496,256],[496,336],[480,336],[480,384],[144,384],[144,448],[-544,448],[-544,352],[-560,352],[-560,176],[-544,176],[-544,-80],[-512,-80],[-512,-96],[-464,-96],[-464,-160],[-272,-160],[-272,-224],[-288,-224]]);
 assert.equal(s.status,'running');assert.equal(s.objectiveStates.find(o=>o.id==='contact')?.done,true);
 assert.equal(s.objectiveStates.find(o=>o.id==='iff')?.done,false);
 assert.ok(s.changeIff('0024'));s.tick(.05,idle);
 assert.equal(s.status,'running');assert.ok(s.events.some(e=>e.type==='mission-radio'&&e.radioId==='kylie-contact'));
 advance(s,120);assert.equal(s.status,'running');advance(s,70);assert.equal(s.status,'won');
});
test('1-5 player death fails the mission before rendezvous',()=>{
 const s=new Simulation('Easy',MISSION_1_5);s.damage(null,s.humanHealth);assert.equal(s.status,'lost');
});
test('1-5 rocket tower holds its ground and fires after the assault delay',()=>{
 const s=new Simulation('Easy',MISSION_1_5),tower=s.units.find(u=>u.id==='rocket-tower')!,origin={x:tower.x,z:tower.z};
 advance(s,400);assert.equal(tower.alert,false);assert.equal(s.missiles.length,0);
 advance(s,200);assert.equal(tower.x,origin.x);assert.equal(tower.z,origin.z);assert.equal(tower.speed,0);
 assert.ok(s.missiles.some(missile=>missile.owner===tower.id)||s.events.some(event=>event.type==='shot'&&event.unit===tower));
});
test('1-5 ticks stay short while the rocket tower engages',()=>{
 const s=new Simulation('Easy',MISSION_1_5);
 advance(s,360);
 let worst=0;
 for(let i=0;i<360;i++){const t=performance.now();s.tick(1/60,idle);worst=Math.max(worst,performance.now()-t);}
 assert.ok(worst<250,`tick took ${worst.toFixed(0)}ms`);
});
test('1-5 rocket tower missiles keep their original course when the player moves',()=>{
 const s=new Simulation('Easy',MISSION_1_5),tower=s.units.find(u=>u.id==='rocket-tower')!,player=s.mounted!;
 for(const unit of s.units)if(unit!==player)unit.pilot=false;
 const missile=s.fireMissile(tower,'UNKPA',1,{x:player.x,y:player.spec.height*.6,z:player.z},player);
 assert.equal(missile.homingScale,0);const velocity={vx:missile.vx,vy:missile.vy,vz:missile.vz};
 player.x+=80;s.tick(.05,idle);
 assert.ok(Math.abs(missile.vx-velocity.vx)<1e-9&&Math.abs(missile.vy-velocity.vy)<1e-9&&Math.abs(missile.vz-velocity.vz)<1e-9);
});
test('4-3 starts with Kylie and Thane mounted and the Darken Sentry waits about five seconds',()=>{
 const s=new Simulation('Easy',MISSION_4_3),attacker=s.units.find(u=>u.id==='darken-opening-sentry')!;
 assert.equal(s.mounted?.kind,'union-tactical');assert.equal(s.units.find(u=>u.id==='kylie-asv')?.personId,'kylie');assert.equal(s.units.find(u=>u.id==='thane-sentry')?.personId,'thane');
 assert.equal(attacker.kind,'darken-sentry');assert.equal(s.mission.assaults?.find(a=>a.unitId===attacker.id)?.targetId,'union-player');
 advance(s,240);assert.equal(attacker.alert,false);assert.equal(attacker.speed,0);
 advance(s,70);assert.equal(attacker.alert,true);
});
test('4-3 Kylie can leave her Union ASV for the player to board',()=>{
 const s=new Simulation('Easy',MISSION_4_3),asv=s.units.find(u=>u.id==='kylie-asv')!;
 assert.equal(asv.pilot,true);assert.deepEqual(s.sendAllyOrder('kylie','disembark').accepted,['kylie-asv']);assert.equal(asv.pilot,false);
 s.eject('ground');s.human={x:asv.x,z:asv.z+3};assert.ok(s.board());assert.equal(s.mounted,asv);assert.equal(s.mounted?.kind,'union-asv');
});
test('4-3 can cross WP1 and WP2, take each supply once, and finish at WP3',()=>{
 const def={...MISSION_4_3,units:MISSION_4_3.units.filter(u=>u.id==='union-player'||u.id==='union-support'),assaults:[]};
 const s=new Simulation('Easy',def),unit=s.mounted!;
 assert.equal(unit.kind,'union-tactical');assert.equal(unit.iff,'2620');
 unit.ammunition.TCROCK=1;unit.shield=10;
 driveRoute(s,[[200,650],[255,470],[165,420],[95,410],[95,305],[0,305],[-230,320],[-290,320]]);
 assert.equal(unit.ammunition.TCROCK,10);assert.equal(unit.shield,unit.spec.shield*2);
 driveRoute(s,[[-290,0],[-290,-175],[265,-175]]);
 assert.equal(s.status,'won');assert.deepEqual([...s.reachedWaypoints],[1,2,3]);assert.deepEqual([...s.usedSupplies],[1,2]);
 assert.equal(s.events.filter(e=>e.type==='supply').length,2);
 const direct=new Simulation('Easy',def);direct.mounted!.x=265;direct.mounted!.z=-175;direct.tick(.01,idle);assert.equal(direct.status,'won');assert.deepEqual([...direct.usedSupplies],[]);
});
test('4-3 route remains traversable after the north bridge is lowered',()=>{
 const def={...MISSION_4_3,units:MISSION_4_3.units.filter(u=>['union-player','union-support','kylie-asv','thane-sentry'].includes(u.id)),assaults:[],minefields:[]};
 const s=new Simulation('Easy',def);assert.equal(s.callAirSupport(),false);
 s.raisedBridges.delete('war-north-bridge');
 driveRoute(s,[[200,650],[255,470],[165,420],[95,410],[95,305],[0,305],[-230,320],[-290,320],[-290,0],[-290,-175],[265,-175]]);
 assert.equal(s.status,'won');assert.deepEqual([...s.reachedWaypoints],[1,2,3]);
});
test('4-3 shield doubler expires and air support is called only once',()=>{
 const s=new Simulation('Easy',MISSION_4_3),unit=s.mounted!;
 unit.x=-290;unit.z=320;s.tick(.01,idle);assert.equal(unit.shield,72);
 unit.z=860;for(let i=0;i<1220&&s.status==='running';i++)s.tick(.05,idle);assert.ok(unit.shield<=unit.spec.shield);
 assert.equal(s.callAirSupport(),true);assert.equal(s.callAirSupport(),false);const support=s.units.find(u=>u.id==='union-support')!;
 assert.equal(s.airSupportUsed,1);assert.equal(support.pilot,true);assert.equal(support.iff,s.iff);
 let shots=0;for(let i=0;i<500&&s.status==='running';i++){s.tick(.05,idle);shots+=s.events.filter(e=>e.type==='shot'&&e.unit===support).length;s.events=[];}
 assert.ok(shots>0);
});
test('4-3 north bridge starts raised, lowers at its control, and the adjacent lava blocks vehicles',()=>{
 const def={...MISSION_4_3,units:MISSION_4_3.units.filter(u=>u.id==='union-player'),assaults:[],garrison:[]};
 const cross=new Simulation('Easy',def);cross.mounted!.x=-50;cross.mounted!.z=700;cross.mounted!.yaw=Math.PI;
 const blocked=new Simulation('Easy',def);blocked.mounted!.x=0;blocked.mounted!.z=700;blocked.mounted!.yaw=Math.PI;
 assert.ok(cross.raisedBridges.has('war-north-bridge'));
 cross.eject('ground');const control=cross.facilities.find(f=>f.id==='north-bridge-control')!;cross.human={x:control.x-control.width/2-1,z:control.z};assert.ok(cross.board());assert.equal(cross.insideFacility,control);assert.ok(cross.operateBridge());assert.ok(!cross.raisedBridges.has('war-north-bridge'));cross.eject('ground');cross.human={x:-50,z:700};assert.ok(cross.board());
 for(let i=0;i<130;i++){cross.tick(.05,{...idle,forward:true});blocked.tick(.05,{...idle,forward:true});}
 assert.ok(cross.player.z<620);assert.ok(blocked.player.z>650);assert.equal(def.terrain.rivers?.length,4);assert.ok(def.terrain.rivers?.every(r=>r.surface==='lava'));
});
test('4-3 Merc and Darken shoot each other and the player can change vehicles',()=>{
 const s=new Simulation('Easy',MISSION_4_3),merc=s.units.find(u=>u.id==='merc-tactical')!,darken=s.units.find(u=>u.id==='darken-aip')!;
 s.units.find(u=>u.id==='darken-opening-sentry')!.alive=false;
 let mercShots=0,darkenShots=0,hits=0;for(let i=0;i<400&&s.status==='running';i++){s.tick(.05,idle);mercShots+=s.events.filter(e=>e.type==='shot'&&e.unit===merc).length;darkenShots+=s.events.filter(e=>e.type==='shot'&&e.unit===darken).length;hits+=s.events.filter(e=>e.type==='hit'&&!!e.unit&&(e.unit.spec.faction==='merc'||e.unit.spec.faction==='darken')).length;s.events=[];}
 assert.ok(mercShots>0&&darkenShots>0&&hits>0);
 const derelict=s.units.find(u=>u.id==='depot-unoccupied')!;s.mounted!.x=292;s.mounted!.z=487;s.eject('ground');s.humanYaw=Math.atan2(derelict.x-s.human.x,derelict.z-s.human.z);
 for(let i=0;i<240&&!s.mounted&&s.status==='running';i++)s.tick(1/60,{...idle,forward:true});
 assert.equal(s.mounted,derelict);assert.equal(s.mounted.iff,s.iff);
});
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
 const next=new Simulation('Easy',mission('next'));assert.equal(next.units[0].spec.speed,85);assert.equal(next.weapons.lasers.RAID.damage,10);assert.equal(LASERS.RAID.damage,10);
 const retry=new Simulation('Easy',def);assert.equal(retry.units[0].spec.speed,36);assert.equal(retry.units[0].ammo,2);assert.equal(retry.units[0].parts.hull,1);
});
test('direct infantry fire reduces facility integrity and destroys the building at zero health',()=>{
 const def=mission();def.units=[];def.assignedUnitId=undefined;def.startMountedUnitId=undefined;def.player={x:40,z:0};def.base={name:'facility-damage',x:40,z:30,width:20,depth:20,buildings:[{id:'target-building',kind:'command',x:40,z:30,width:20,depth:20,height:10,health:14}]};def.objectives=[];
 const s=new Simulation('Easy',def),facility=s.facilities[0]!;s.humanYaw=0;s.pitch=Math.atan2(4-s.eyeHeight,30);s.fire(1);
 assert.equal(facility.health,14);assert.equal(facility.alive,true);assert.ok(!s.events.some(e=>e.type==='facility-hit'&&e.facility===facility));
 advance(s,60);assert.equal(facility.health,14-INFANTRY_WEAPONS.PRIF44.damage);assert.ok(s.events.some(e=>e.type==='facility-hit'&&e.facility===facility));s.selected=facility.id;assert.equal(s.targetState?.armor,.5);
 s.events=[];s.fire(1);assert.equal(facility.health,7);advance(s,60);
 assert.equal(facility.health,0);assert.equal(facility.alive,false);assert.equal(s.events.filter(e=>e.type==='destroy'&&e.facility===facility).length,1);
});
test('2-2 starts in the Merc Tactical with its configured loadout and Union IFF',async()=>{
 const {MISSION_2_2}=await import('../content/missions/mission-2-2.ts');
 const s=new Simulation('Easy',MISSION_2_2),player=s.mounted!;
 assert.equal(player.id,'merc-player');assert.equal(player.kind,'merc-tactical');assert.equal(player.iff,'2620');
 assert.deepEqual(player.spec.weapons,['DASY','SAG5T','RAID']);
 assert.equal(player.ammunition.DASY,300);assert.equal(player.ammunition.SAG5T,40);
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
test('PRIF44 modestly damages vehicles for player and enemy infantry',()=>{
 const s=new Simulation();s.human={x:0,z:0};s.units[0].x=100;const target=s.units[1];target.x=0;target.z=60;s.pitch=Math.atan2(4-s.eyeHeight,60);s.fire(1);assert.equal(target.shield,22);advance(s,60);assert.ok(Math.abs(target.shield-(22-INFANTRY_WEAPONS.PRIF44.vehicleDamage))<1e-9);
 const mounted=new Simulation();mounted.human={...DEFAULT_MISSION.units[0]};mounted.board();const soldier=mounted.forceEject(mounted.units[1])!;soldier.flight=null;soldier.x=0;soldier.z=70;soldier.iff='enemy';soldier.gashrAmmo=0;mounted.iff='player';soldier.yaw=Math.atan2(mounted.mounted!.x-soldier.x,mounted.mounted!.z-soldier.z);mounted.units=[mounted.mounted!];soldier.cooldown=0;mounted.mission.base=undefined;mounted.mission.rocks=[];mounted.mission.terrain.cliffs=[];const shield=mounted.mounted!.shield;for(let i=0;i<120&&mounted.events.every(e=>e.type!=='shot'||e.soldier!==soldier);i++)mounted.tick(.02,idle);assert.equal(mounted.mounted!.shield,shield);advance(mounted,60);assert.equal(mounted.mounted!.shield,shield-INFANTRY_WEAPONS.PRIF44.vehicleDamage);
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
 assert.equal(times.length,3);for(let i=1;i<times.length;i++)assert.ok(Math.abs(times[i]-times[i-1]-LASERS.GAUS30.recharge)<1e-9);
 assert.ok(LASERS.GAUS30.recharge>LASERS.GAUS30.interval);assert.equal(flightSpeed,LASERS.GAUS30.speed);assert.ok(flightSpeed<1000);assert.equal(tower.energy,tower.spec.energy);assert.deepEqual(tower.ammunition,{});
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
 const hq=s.facilities.find(f=>f.id==='ur-kinsk-hq')!,backCliff=s.mission.terrain.cliffs!.find(c=>c.id==='urkinsk-back-left-cliff')!;
 const screenRight=(point:{x:number;z:number})=>(point.x-s.player.x)*Math.cos(s.humanYaw)-(point.z-s.player.z)*Math.sin(s.humanYaw);
 assert.equal(s.mounted,null);assert.equal(s.mission.terrain.biome,'grassland');assert.equal(s.mission.terrain.skyPalette,'amber');assert.equal(s.human.z,840);assert.equal(s.humanYaw,Math.PI);assert.ok(screenRight(s.units.find(u=>u.id==='scorp-rocket')!)>0);assert.ok(screenRight(tower)<0);assert.ok(tower.z>hq.z&&hq.z>backCliff.z);assert.equal(s.mission.terrain.cliffs!.length,7);assert.equal(s.mission.terrain.peaks!.length,7);assert.ok(s.terrainObstacles.includes(backCliff));assert.ok(!s.objectiveStates[0].done);
 const river=s.mission.terrain.river!,path=river.path!,bank=(point:{x:number;z:number})=>riverBank(path,point.x,point.z),playerBank=bank(s.player);
 assert.ok(path[0]!.z>s.player.z&&path[0]!.x>s.player.x,'the river enters above and to the right of the start');
 assert.ok(path.at(-1)!.z<s.player.z&&path.at(-1)!.x>s.player.x&&path.at(-1)!.x>0,'the river leaves below the start and stays on the right');
 for(const cliff of s.mission.terrain.cliffs!)assert.ok(playerBank*bank(cliff)>0&&riverDistance(river,cliff.x,cliff.z)>river.width/2,`${cliff.id} stays on the start side of the river`);
 assert.ok(Math.min(...s.mission.terrain.cliffs!.map(cliff=>Math.hypot(cliff.x-s.player.x,cliff.z-s.player.z)))<riverDistance(river,s.player.x,s.player.z),'the start sits nearer the ridge field than the river');
 for(let i=0;i<800&&!s.mounted;i++){s.humanYaw=Math.atan2(tower.x-s.human.x,tower.z-s.human.z);s.tick(1/60,{...idle,forward:true});}
 assert.equal(s.units.find(u=>u.id==='scorp-rocket')!.personId,'kylie');assert.equal(s.units.find(u=>u.id==='thane-meson')!.personId,'thane');assert.equal(s.mounted?.id,tower.id);assert.equal(tower.kind,'scorp-meson-tower');assert.ok(s.objectiveStates[0].done);s.fire(1);assert.ok(s.events.some(e=>e.type==='shot'&&e.weapon==='GAUS30'&&e.unit===tower));
 const start={x:tower.x,z:tower.z};for(let i=0;i<30;i++)s.tick(1/60,{...idle,forward:true,boost:true});assert.deepEqual({x:tower.x,z:tower.z},start);assert.equal(s.throttle,0);
 s.eject();assert.equal(s.flight,null);assert.ok(s.objectiveStates[0].done);const retry=new Simulation('Easy',MISSION_4_2);assert.ok(!retry.objectiveStates[0].done);assert.equal(retry.mounted,null);
});
test('4-2 Scorp garrison engages Union without shooting the player and the defense can win or fail once',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const s=new Simulation('Easy',MISSION_4_2),tower=s.units.find(u=>u.id==='scorp-meson')!;s.human={x:tower.x,z:tower.z};assert.ok(s.board());
 const attackers=s.mission.assaults!.map(a=>s.units.find(u=>u.id===a.unitId)!);for(const [i,u] of attackers.entries()){u.x=(i%4-1.5)*35;u.z=650+Math.floor(i/4)*40;}
 let friendlyShot=false,hostileShot=false,friendlyFire=false;for(let i=0;i<2500&&s.status==='running';i++){s.tick(1/60,idle);friendlyShot ||= s.events.some(e=>e.type==='shot'&&s.mission.garrison!.includes(e.unit?.id??''));hostileShot ||= s.events.some(e=>e.type==='shot'&&attackers.some(u=>u===e.unit));friendlyFire ||= s.events.some(e=>e.type==='shot'&&s.mission.garrison!.includes(e.unit?.id??'')&&e.to&&Math.hypot(e.to.x-tower.x,e.to.z-tower.z)<10);s.events=[];if(friendlyShot&&hostileShot)break;}
 assert.ok(friendlyShot);assert.ok(hostileShot);assert.ok(!friendlyFire);assert.ok(tower.shield>0);assert.ok(s.mission.garrison!.every(id=>s.units.find(u=>u.id===id)!.iff===s.iff));
 for(const u of attackers){s.damage(u,99999);for(const soldier of s.soldiers)if(soldier.sourceVehicle===u.id){soldier.alive=false;soldier.health=0;}}s.events=[];s.tick(.02,idle);assert.equal(s.status,'running');s.eject('ground');const control=s.facilities.find(f=>f.id==='bridge-control')!;s.human={x:control.x-control.width/2-1,z:control.z};assert.ok(s.board());assert.equal(s.status,'running');assert.ok(s.raiseBridge());assert.equal(s.status,'won');assert.equal(s.events.filter(e=>e.type==='win').length,1);assert.equal(s.raiseBridge(),false);s.tick(.02,idle);assert.equal(s.events.filter(e=>e.type==='win').length,1);
 const failed=new Simulation('Easy',MISSION_4_2);failed.damageFacility(failed.facilities.find(f=>f.id==='ur-kinsk-hq')!,99999,{x:0,y:1,z:-100});failed.tick(.02,idle);assert.equal(failed.status,'lost');assert.equal(failed.events.filter(e=>e.type==='lose').length,1);
});

test('4-2 can be completed by boarding, actual GAUS fire and Scorp supporting fire',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const mission=structuredClone(MISSION_4_2),s=new Simulation('Easy',mission),tower=s.units.find(u=>u.id==='scorp-meson')!,testTarget=s.units.find(u=>u.id==='bridge-union-sentry')!;testTarget.cooldown=999;
 for(let i=0;i<800&&!s.mounted;i++){s.humanYaw=Math.atan2(tower.x-s.human.x,tower.z-s.human.z);s.tick(1/60,{...idle,forward:true});}
 assert.equal(s.mounted,tower);testTarget.x=tower.x+80;testTarget.z=tower.z+90;let shots=0,support=0;
 for(let i=0;i<15000&&s.status==='running';i++){
  if(!s.target||!s.isHostile(s.target))s.selectTarget();s.tracking=true;
  s.tick(1/60,{...idle,fire1:!!s.targetState?.locked&&s.targetState.inSight});
  shots+=s.events.filter(e=>e.type==='shot'&&e.unit===tower).length;support+=s.events.filter(e=>e.type==='shot'&&s.mission.garrison!.includes(e.unit?.id??'')).length;s.events=[];if((shots>0&&support>0)||(!s.enemies.length&&!s.soldiers.some(v=>v.alive&&v.iff!==s.iff)))break;
 }
 assert.equal(s.status,'running');assert.equal(s.raiseBridge(),false);
 for(const enemy of s.enemies){enemy.pilot=false;s.damage(enemy,99999);for(const soldier of s.soldiers)if(soldier.sourceVehicle===enemy.id){soldier.alive=false;soldier.health=0;}}
 for(const soldier of s.soldiers)if(soldier.alive&&soldier.iff!==s.iff){soldier.alive=false;soldier.health=0;}
 s.eject('ground');const control=s.facilities.find(f=>f.id==='bridge-control')!;for(let i=0;i<8000&&!s.insideFacility&&s.status==='running';i++){s.humanYaw=Math.atan2(control.x-s.human.x,control.z-s.human.z);s.tick(1/60,{...idle,forward:true});}assert.equal(s.insideFacility?.id,control.id);assert.equal(s.status,'running');assert.ok(s.raiseBridge());assert.equal(s.status,'won');assert.ok(shots>0);assert.ok(support>0);assert.ok(s.facilities.find(f=>f.id==='ur-kinsk-hq')!.alive);assert.ok(s.objectiveStates.every(o=>o.done));
 const retry=new Simulation('Easy',MISSION_4_2);assert.equal(retry.status,'running');assert.equal(retry.time,0);assert.equal(retry.mounted,null);assert.ok(retry.units.every(u=>u.alive));
});

test('4-2 has exactly two Union AIPs that attack the power plant and disable both Meson towers',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const air=MISSION_4_2.units.filter(u=>u.kind==='union-aip');assert.equal(air.length,2);assert.ok(air.every(u=>MISSION_4_2.assaults!.find(a=>a.unitId===u.id)!.targetId==='ur-kinsk-power'));
 const mission={...MISSION_4_2,completionEnabled:false,objectives:[],garrison:[],companions:[],personnel:[],units:MISSION_4_2.units.filter(u=>u.kind==='union-aip'||u.kind==='scorp-meson-tower'),assaults:MISSION_4_2.assaults!.filter(a=>air.some(u=>u.id===a.unitId)).map(a=>({...a,startAt:0}))};
 const s=new Simulation('Easy',mission),plant=s.facilities.find(f=>f.id==='ur-kinsk-power')!,tower=s.units.find(u=>u.id==='scorp-meson')!;s.human={x:tower.x,z:tower.z};assert.ok(s.board());
 for(const [i,u] of s.units.filter(u=>u.kind==='union-aip').entries()){u.x=plant.x+(i?50:-50);u.z=plant.z-80;}
 const fired=new Set<string>();for(let i=0;i<4200&&plant.alive;i++){s.tick(1/60,idle);for(const e of s.events)if(e.type==='shot'&&e.unit?.kind==='union-aip')fired.add(e.unit.id);s.events=[];}
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
  const bridge=riverFrameAtZ(r,r.bridgeZ),normal={x:bridge.tz,z:-bridge.tx},point=(across:number,along=0)=>({x:bridge.x+normal.x*across+bridge.tx*along,z:bridge.z+normal.z*across+bridge.tz*along});
  const occupied=s.units.find(u=>u.id==='bridge-union-sentry')!,empty=s.units.find(u=>u.id==='scorp-asv-guard')!,safe=s.units.find(u=>u.id==='scorp-sentry-guard')!;Object.assign(occupied,point(0));Object.assign(empty,point(12));empty.pilot=false;Object.assign(safe,point(r.width/2+20));
  const pedestrian=s.soldiers.find(v=>v.personId==='kylie')!,bank=s.soldiers.find(v=>v.personId==='thane')!;pedestrian.boardingTarget=undefined;Object.assign(pedestrian,point(0));bank.boardingTarget=undefined;Object.assign(bank,point(0,r.bridgeWidth/2+10));
 const reserve=s.units.find(u=>u.id==='bridge-rocket')!;assert.equal(reserve.pilot,false);assert.ok(reserve.x<r.x-r.width/2);assert.ok(MISSION_4_2.units.find(u=>u.id===occupied.id)!.x>r.x+r.width/2);assert.ok(Math.hypot(control.x-bridge.x,control.z-bridge.z)>150);
 s.human={x:control.x-control.width/2-1,z:control.z};assert.ok(s.board());assert.ok(s.raiseBridge());assert.equal(s.status,'won');assert.ok(!occupied.alive&&!empty.alive&&!pedestrian.alive);assert.ok(safe.alive&&bank.alive);assert.ok(!s.soldiers.some(v=>v.alive&&v.sourceVehicle===occupied.id));
 const deathEvents=s.events.filter(e=>e.type==='soldier-death').length;assert.equal(s.raiseBridge(),false);assert.equal(s.events.filter(e=>e.type==='soldier-death').length,deathEvents);
});

test('the empty bridge Scorp rocket tower boards and fires SREM and UNKPA from separate slots',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const s=new Simulation('Easy',MISSION_4_2),u=s.units.find(v=>v.id==='bridge-rocket')!;s.human={x:u.x,z:u.z};assert.ok(s.board());assert.equal(s.mounted,u);assert.deepEqual(u.spec.weapons,['SREM','UNKPA']);const before=[...u.slotAmmo];s.events=[];s.tick(1/60,{...idle,fire1:true});u.cooldown=0;s.tick(1/60,{...idle,fire2:true});assert.deepEqual(s.missiles.filter(p=>p.owner===u.id).map(p=>p.weapon),['SREM','UNKPA']);assert.deepEqual(u.slotAmmo,[before[0]!-1,before[1]!-1]);
 s.eject('ground');for(let i=0;i<300&&!s.mounted;i++){s.humanYaw=Math.atan2(u.x-s.human.x,u.z-s.human.z);s.tick(1/60,{...idle,forward:true});}assert.equal(s.mounted,u);assert.deepEqual(u.slotAmmo,[before[0]!-1,before[1]!-1]);assert.equal(new Simulation('Easy',MISSION_4_2).units.find(v=>v.id===u.id)!.slotAmmo[1],before[1]);
});

test('raising the 4-2 bridge does not destroy AIPs hovering above its deck',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const s=new Simulation('Easy',MISSION_4_2),r=s.mission.terrain.river!,control=s.facilities.find(f=>f.id==='bridge-control')!;
 const aip=s.units.find(u=>u.kind==='union-aip')!,bridge=riverFrameAtZ(r,r.bridgeZ);aip.x=bridge.x;aip.z=bridge.z;assert.ok(aip.hoverHeight>0);s.human={x:control.x-control.width/2-1,z:control.z};assert.ok(s.board());assert.ok(s.raiseBridge());assert.ok(aip.alive);assert.ok(aip.pilot);assert.equal(s.events.filter(e=>e.type==='destroy'&&e.unit===aip).length,0);
});
