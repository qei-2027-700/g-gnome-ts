import {buildingContact} from './battlefield.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,distance,segmentSphere,type Input} from './simulation.ts';
import {MISSION_3_3} from '../content/missions/mission-3-3.ts';
import {RadioMenu} from '../communications.ts';
import {advanceSimulation} from '../session.ts';
import {buildingClearance} from './parts.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
function setup(){
 // Behavior fixtures stay independent of changes to the launch-screen composition.
 const mission=structuredClone(MISSION_3_3);mission.terrain.cliffs=[];mission.terrain.maxZ=1300;
 const positions:Record<string,[number,number]>={kylie:[-22,30],thane:[10,65],sheridan:[26,100],'scorp-asv':[0,350]};
 mission.units=mission.units.map(u=>positions[u.id]?{...u,x:positions[u.id][0],z:positions[u.id][1],yaw:0}:u);
 const s=new Simulation('Easy',mission);s.selected='scorp-asv';return s;
}
function run(s:Simulation,seconds:number,input=idle){for(let i=0;i<seconds*60;i++)s.tick(1/60,input);}
function key(s:Simulation,menu:RadioMenu,code:string,repeat=false){const action=menu.key(code,s.mission.companions??[],repeat);if(action?.kind==='send')return s.sendAllyOrder(action.recipient,action.command);}
test('F1 then F1 attacks with all three: real movement, common weapons and target damage',()=>{
 const s=setup(),menu=new RadioMenu();menu.begin('all');assert.equal(key(s,menu,'F1',true),undefined);assert.equal(s.units[1].order,null);
 assert.equal(key(s,menu,'F1')!.accepted.length,3);const target=s.target!,start=s.units[1].z;
 run(s,16);assert.ok(s.units[1].z>start);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit?.id==='kylie'));
 assert.ok(target.shield<target.spec.shield||target.armor<target.spec.armor);assert.equal(s.mounted!.shield,s.mounted!.spec.shield);
 assert.ok(s.units[1].speed<=s.units[1].spec.speed/3.6);
});
test('F1 then F5 without selection follows player, updates as player moves, F7 stops',()=>{
 const s=setup(),menu=new RadioMenu();s.selected=null;menu.begin('all');assert.equal(key(s,menu,'F5')!.accepted.length,3);
 const target=s.units.find(u=>u.id==='scorp-asv')!;run(s,8,{...idle,forward:true});const before=distance(s.units[1],s.player);s.throttle=0;s.speed=0;s.mounted!.speed=0;run(s,8);
 assert.ok(distance(s.units[1],s.player)<before);assert.ok(distance(s.units[1],s.player)<40);assert.equal(target.shield,target.spec.shield);assert.equal(s.units[1].order?.kind,'follow');
 key(s,menu,'F7');const point={x:s.units[1].x,z:s.units[1].z};run(s,4);assert.ok(distance(point,s.units[1])<1);assert.equal(s.units[1].speed,0);assert.equal(s.units[1].order,null);
});
test('G recipient stage, individual recipient and long press do not issue unintended orders',()=>{
 const s=setup(),menu=new RadioMenu();menu.begin();key(s,menu,'F1');assert.equal(s.units[1].order,null);key(s,menu,'F1',true);assert.equal(s.units[1].order,null);key(s,menu,'F5');assert.equal(s.units[3].order?.kind,'follow');
 s.sendAllyOrder('all','hold');menu.begin();key(s,menu,'F2');key(s,menu,'F1');assert.equal(s.units[1].order?.kind,'attack');assert.equal(s.units[2].order,null);menu.close();key(s,menu,'F1');assert.equal(menu.recipient,'all');assert.equal(s.units[1].order?.kind,'attack');
});
test('attack snapshots target, rejects no target and friends, ends once for destroyed or empty target',()=>{
 const s=setup();s.sendAllyOrder('all','attack');s.selected='kylie';assert.equal(s.sendAllyOrder('all','attack').error,'target');assert.deepEqual(s.units[1].order,{kind:'attack',targetId:'scorp-asv'});
 s.selected=null;assert.equal(s.sendAllyOrder('all','attack').error,'target');const target=s.units.find(u=>u.id==='scorp-asv')!;target.pilot=false;run(s,.1);assert.equal(s.units[1].order,null);assert.equal(s.events.filter(e=>e.type==='ally-order-complete').length,3);run(s,1);assert.equal(s.events.filter(e=>e.type==='ally-order-complete').length,3);
});
test('radio filters absent, dead and unoccupied actors; new mission has no orders',()=>{
 for(const reason of ['missing','dead','unoccupied'] as const){const s=setup(),u=s.units[1];if(reason==='missing')s.units.splice(1,1);if(reason==='dead')u.alive=false;if(reason==='unoccupied')u.pilot=false;if(reason==='range')u.z=700;if(reason==='blocked')s.mission.rocks.push({x:u.x/2,z:u.z/2,r:2});if(reason==='iff')s.iff='0000';
 assert.equal(s.radioMembers[0].reason,reason);assert.equal(s.sendAllyOrder('kylie','follow').accepted.length,0);assert.equal(u.order,null);}
 const s=setup();s.units[1].alive=false;assert.equal(s.sendAllyOrder('all','follow').accepted.length,2);assert.equal(new Simulation().sendAllyOrder('all','follow').error,'unavailable');assert.ok(setup().units.every(u=>!u.order));
});
test('radio remains live while pause freezes ally movement; friendly obstruction prevents firing',()=>{
 const s=setup();s.sendAllyOrder('all','follow');advanceSimulation(s,'comm',.05,idle);assert.ok(s.time>0);const before=JSON.stringify(s.units);advanceSimulation(s,'pause',.05,idle);assert.equal(JSON.stringify(s.units),before);
 const a=setup(),shooter=a.units[1],blocker=a.units[2],target=a.target!;shooter.x=0;shooter.z=150;shooter.yaw=0;shooter.aim=0;blocker.x=0;blocker.z=200;target.x=0;target.z=250;target.cooldown=999;const health=blocker.shield;a.sendAllyOrder('kylie','attack');run(a,1);assert.ok(Math.abs(shooter.x)>1);assert.equal(blocker.shield,health);
});

test('stationary ally turns its chassis to attack a target behind it',()=>{const s=setup(),u=s.units[1];u.x=-20;u.z=350;s.target!.z=250;u.yaw=0;u.aim=0;s.sendAllyOrder('kylie','attack');run(s,5);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===u));});

test('allies automatically engage approaching vehicles by IFF, without an attack order',()=>{
 const s=setup(),ally=s.units[1],enemy=s.units.find(u=>u.id==='scorp-asv')!;
 s.mission.rocks=[];s.mounted!.x=-80;s.mounted!.z=-80;ally.x=0;ally.z=0;ally.yaw=0;ally.aim=0;
 s.units[2].pilot=false;s.units[3].pilot=false;enemy.x=0;enemy.z=60;enemy.cooldown=999;
 const initial=enemy.shield;run(s,3);assert.ok(enemy.shield<initial);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===ally));assert.equal(ally.order,null);
 const friend=setup(),a=friend.units[1],e=friend.units.find(u=>u.id==='scorp-asv')!;friend.mission.rocks=[];a.x=0;a.z=0;e.x=0;e.z=60;e.iff=a.iff;run(friend,2);assert.ok(!friend.events.some(event=>event.type==='shot'&&event.unit===a));
});
test('E selects enemy infantry, allies attack it, and infantry rifles can damage an ally',()=>{
 const s=setup(),enemy=s.units.find(u=>u.id==='scorp-asv')!,ally=s.units[1];s.mission.rocks=[];
 const soldier=s.forceEject(enemy)!;enemy.alive=false;soldier.flight=null;soldier.x=0;soldier.z=60;soldier.cooldown=0;
 s.mounted!.x=-150;s.mounted!.z=-150;ally.x=0;ally.z=0;ally.yaw=0;ally.aim=0;s.units[2].pilot=false;s.units[3].pilot=false;
 s.selectTarget();assert.equal(s.target,soldier);assert.ok(s.targetState);assert.equal(s.sendAllyOrder('kylie','attack').accepted.length,1);
 run(s,3);assert.ok(s.events.some(e=>e.type==='shot'&&e.soldier===soldier&&e.weapon==='PRIF44'));assert.ok(ally.shield<ally.spec.shield);assert.ok(soldier.health<35);
});
test('IFF overrides faction for selection, radio and autonomous ally fire, and ejection keeps the code',()=>{
 const s=setup(),ally=s.units[1],enemy=s.units.find(u=>u.id==='scorp-asv')!;enemy.iff=s.iff;assert.equal(s.isHostile(enemy),false);
 ally.iff='1111';assert.equal(s.isHostile(ally),true);assert.equal(s.radioMembers[0].reason,undefined);s.selected=ally.id;assert.equal(s.sendAllyOrder('all','attack').accepted.length,3);
 const soldier=s.forceEject(enemy)!;assert.equal(soldier.iff,enemy.iff);s.selectTarget();assert.equal(s.target,ally);assert.equal(s.isHostile(soldier),false);
});

function footSquad(){const s=setup();s.mission.rocks=[];s.units.find(u=>u.id==='scorp-asv')!.pilot=false;
 const people=s.units.slice(1,4).map((unit,i)=>{const soldier=s.forceEject(unit,'destruction')!;unit.alive=false;soldier.flight=null;soldier.x=15+i*2;soldier.z=0;return soldier;});s.selected=null;return {s,people};}
test('F4 reserves three seats in recipient order, approaches on foot, and F6 restores the same people',()=>{
 const {s,people}=footSquad(),menu=new RadioMenu();menu.begin('all');s.selected='player-asv';assert.equal(key(s,menu,'F4')!.accepted.length,3);assert.ok(people.every(p=>p.boardingTarget===s.mounted!.id));assert.deepEqual(s.mounted!.passengers,[]);
 s.eject('ground');s.human={x:0,z:0};assert.equal(s.board(),true);assert.ok(s.mounted); // Empty vehicle still boards as pilot, reserved seats remain.
 run(s,4);assert.equal(s.mounted!.passengers.length,3);assert.ok(people.every(p=>p.passengerOf===s.mounted!.id));assert.ok(people.every(p=>!s.combatTargets.includes(p)));assert.ok(s.radioMembers.every(m=>m.available));
 const carrier=s.mounted!,count=s.soldiers.length;carrier.speed=5;carrier.yaw=.4;menu.begin('all');assert.equal(key(s,menu,'F6')!.accepted.length,3);assert.equal(s.soldiers.length,count);assert.ok(people.every(p=>!p.passengerOf&&p.flight&&p.alive));assert.deepEqual(carrier.passengers,[]);assert.equal(carrier.pilot,true);assert.equal(carrier.speed,5);assert.equal(carrier.yaw,.4);
});
test('seat competition rejects overflow and player boarding; F7, death, IFF and destruction release reservations',()=>{
 const {s,people}=footSquad();s.mounted!.spec.passengerCapacity=2;const result=s.sendAllyOrder('all','board');assert.equal(result.accepted.length,2);assert.equal(result.rejected.length,1);assert.equal(people[2].boardingTarget,undefined);
 const carrier=s.mounted!;s.eject('ground');carrier.pilot=true;s.flight=null;s.human={x:carrier.x,z:carrier.z};assert.equal(s.board(),false);carrier.pilot=false;s.board();
 s.sendAllyOrder('kylie','hold');assert.equal(people[0].boardingTarget,undefined);assert.equal(s.sendAllyOrder('sheridan','board').accepted.length,1);
 people[1].alive=false;run(s,.02);assert.equal(people[1].boardingTarget,undefined);people[2].iff='1111';run(s,.02);assert.equal(people[2].boardingTarget,undefined);
 s.sendAllyOrder('kylie','board');s.damage(carrier,9999);assert.equal(people[0].boardingTarget,undefined);
});
test('F4 leaves occupied HAWCs intact; destroyed carrier ejects passengers once and keeps identity and health',()=>{
 const s=setup();assert.equal(s.sendAllyOrder('all','board').accepted.length,0);assert.ok(s.units.slice(1,4).every(u=>u.pilot));
 const {s:a,people}=footSquad();a.sendAllyOrder('all','board');run(a,4);const carrier=a.mounted!,count=a.soldiers.length;assert.equal(carrier.passengers.length,3);
 a.damage(carrier,9999);assert.equal(a.soldiers.length,count);assert.deepEqual(carrier.passengers,[]);assert.ok(people.every(p=>!p.passengerOf&&p.alive&&p.health===35&&p.flight));
});

function transferSetup(){const s=setup();s.mission.rocks=[];s.units.find(u=>u.id==='scorp-asv')!.cooldown=999;const old=s.units[1];old.x=-25;old.z=0;const carrier=makeUnit('captured','scorp-sentry',0,30,false);s.units.push(carrier);s.selected=carrier.id;return {s,old,carrier};}
test('F4 selected empty vehicle: leave old HAWC, walk to saved target, capture as pilot and keep resources and person',()=>{
 const {s,old,carrier}=transferSetup(),menu=new RadioMenu();old.order={kind:'follow'};carrier.parts.leftLeg=.7;carrier.shield=12;carrier.energy=321;carrier.lastHit=999;carrier.ammunition.zWASP=123;carrier.yaw=.3;
 const resources={parts:{...carrier.parts},energy:carrier.energy,ammo:{...carrier.ammunition}};menu.begin('kylie');assert.deepEqual(key(s,menu,'F4')!.accepted,['kylie']);
 const person=s.soldiers.find(p=>p.personId==='kylie')!;person.health=23;assert.equal(old.pilot,false);assert.equal(old.order,null);assert.ok(old.alive);assert.equal(person.boardingTarget,carrier.id);assert.equal(person.boardingRole,'pilot');assert.equal(person.flight,null);assert.equal(carrier.pilot,false);
 const before={x:person.x,z:person.z};s.selected='scorp-asv';run(s,.5);assert.ok(distance(before,person)>1);assert.equal(carrier.pilot,false);run(s,12);
 assert.equal(carrier.pilot,true);assert.equal(carrier.personId,'kylie');assert.equal(carrier.iff,s.iff);assert.equal(person.driverOf,carrier.id);assert.equal(person.health,23);assert.equal(person.faction,'union');assert.equal(old.personId,undefined);assert.deepEqual(carrier.parts,resources.parts);assert.equal(carrier.energy,resources.energy);assert.deepEqual({...carrier.ammunition},resources.ammo);assert.equal(carrier.yaw,.3);
 assert.ok(!s.combatTargets.includes(person));assert.equal(s.soldiers.filter(p=>p.personId==='kylie').length,1);assert.equal(s.radioMembers[0].unit,carrier);assert.equal(s.radioMembers[0].available,true);
 const z=carrier.z;assert.deepEqual(s.sendAllyOrder('kylie','follow').accepted,['kylie']);run(s,3);assert.notEqual(carrier.z,z);assert.equal(carrier.order?.kind,'follow');
 assert.deepEqual(s.sendAllyOrder('kylie','disembark').accepted,['kylie']);assert.equal(person.driverOf,undefined);assert.equal(carrier.pilot,false);assert.equal(person.health,23);assert.equal(s.soldiers.filter(p=>p.personId==='kylie').length,1);
});
test('one selected pilot seat is reserved once; losing contenders stay in their old vehicles, F7 releases it',()=>{
 const {s,old,carrier}=transferSetup();const result=s.sendAllyOrder('all','board');assert.deepEqual(result.accepted,['kylie']);assert.equal(result.rejected.length,2);assert.ok(result.rejected.every(r=>r.reason==='reserved'));assert.equal(old.pilot,false);assert.ok(s.units[2].pilot&&s.units[3].pilot);
 const kylie=s.soldiers.find(p=>p.personId==='kylie')!;s.sendAllyOrder('kylie','hold');assert.equal(kylie.boardingTarget,undefined);assert.equal(kylie.boardingRole,undefined);assert.equal(s.sendAllyOrder('thane','board').accepted.length,1);
 s.damage(carrier,9999);assert.ok(s.soldiers.every(p=>!p.boardingTarget&&!p.boardingRole));
});
test('invalid target, tower and enemy pilot do not force an ally out; player cannot take a reserved seat',()=>{
 for(const invalid of ['missing','tower','occupied'] as const){const {s,old,carrier}=transferSetup();if(invalid==='missing')s.selected='absent';if(invalid==='tower')s.selected=s.units.find(u=>u.kind==='scorp-rocket-tower')!.id;if(invalid==='occupied')carrier.pilot=true;
  assert.equal(s.sendAllyOrder('kylie','board').accepted.length,0);assert.equal(old.pilot,true);assert.equal(s.soldiers.length,0);
 }
 const {s,carrier}=transferSetup();s.sendAllyOrder('kylie','board');s.eject('ground');s.flight=null;s.human={x:carrier.x,z:carrier.z};assert.equal(s.board(),false);s.sendAllyOrder('kylie','hold');assert.ok(s.board());assert.equal(s.mounted,carrier);
});
test('target occupation, loss or infantry death cancels pilot reservations and a destroyed capture ejects the same driver',()=>{
 for(const reason of ['occupied','removed','dead'] as const){const {s,carrier}=transferSetup();s.sendAllyOrder('kylie','board');const person=s.soldiers[0];if(reason==='occupied')carrier.pilot=true;if(reason==='removed')s.units=s.units.filter(u=>u!==carrier);if(reason==='dead')person.alive=false;run(s,.05);assert.equal(person.boardingTarget,undefined);assert.equal(person.boardingRole,undefined);}
 const {s,carrier}=transferSetup();s.sendAllyOrder('kylie','board');const person=s.soldiers[0];person.health=19;run(s,12);assert.equal(person.driverOf,carrier.id);const count=s.soldiers.length;s.damage(carrier,9999);assert.equal(s.soldiers.length,count);assert.equal(person.driverOf,undefined);assert.equal(person.health,19);assert.ok(person.flight);assert.equal(s.radioMembers[0].soldier,person);assert.equal(s.radioMembers[0].available,true);
});
test('a passenger can leave its carrier and take a selected empty vehicle as pilot',()=>{
 const {s,people}=footSquad();s.sendAllyOrder('kylie','board');run(s,4);const person=people[0];assert.equal(person.passengerOf,s.mounted!.id);const carrier=makeUnit('new-asv','scorp-asv',10,20,false);s.units.push(carrier);s.selected=carrier.id;assert.deepEqual(s.sendAllyOrder('kylie','board').accepted,['kylie']);assert.equal(person.passengerOf,undefined);assert.equal(s.mounted!.passengers.length,0);run(s,8);assert.equal(person.driverOf,carrier.id);assert.equal(carrier.personId,'kylie');assert.equal(s.soldiers.filter(p=>p.personId==='kylie').length,1);
});

test('three companions occupying selected Scorp HAWCs complete 3-3 under their original identities',()=>{
 const s=setup();s.mission.rocks=[];const parked=s.units.filter(u=>u.id.startsWith('base-'));const originals=s.units.slice(1,4);
 for(const [i,member] of s.mission.companions!.entries()){originals[i].x=-40+i*40;originals[i].z=5;parked[i].x=-40+i*40;parked[i].z=65;s.selected=parked[i].id;assert.deepEqual(s.sendAllyOrder(member.personId,'board').accepted,[member.unitId]);}
 run(s,20);assert.equal(s.status,'won');assert.equal(s.objectiveStates[0].current,3);assert.equal(s.events.filter(e=>e.type==='win').length,1);assert.deepEqual(parked.map(u=>s.companionCrew(u).map(m=>m.name.en)),[['Kylie'],['Thane'],['Sheridan']]);assert.ok(originals.every(u=>s.companionCrew(u).length===0));assert.ok(originals.every(u=>!u.pilot));assert.ok(parked.every(u=>u.pilot&&u.iff===s.iff));assert.deepEqual(s.radioMembers.map(m=>m.unit?.id),parked.map(u=>u.id));assert.ok(s.radioMembers.every(m=>m.available));assert.equal(s.soldiers.length,3);assert.ok(s.soldiers.every(p=>p.driverOf&&!s.combatTargets.includes(p)));
});
test('a second direct vehicle transfer reuses the driver and keeps later radio replies addressable',()=>{
 const {s,carrier}=transferSetup();s.sendAllyOrder('kylie','board');run(s,12);const person=s.soldiers[0];person.health=21;
 const next=makeUnit('second-capture','scorp-tactical',carrier.x+20,carrier.z+15,false);s.units.push(next);s.selected=next.id;assert.deepEqual(s.sendAllyOrder('kylie','board').accepted,['kylie']);assert.equal(carrier.pilot,false);assert.equal(person.driverOf,undefined);run(s,8);
 assert.equal(person.driverOf,next.id);assert.equal(person.health,21);assert.equal(s.soldiers.length,1);assert.equal(carrier.personId,undefined);assert.equal(s.radioMembers[0].unit,next);assert.deepEqual(s.sendAllyOrder('kylie','hold').accepted,['kylie']);
});


test('3-3 counts actual living Scorp occupants rather than boarding orders or stale identities',()=>{
 const {s,old,carrier}=transferSetup();assert.equal(s.objectiveStates[0].current,0);s.sendAllyOrder('kylie','board');assert.equal(s.objectiveStates[0].current,0);assert.equal(s.status,'running');run(s,12);
 assert.equal(s.objectiveStates[0].current,1);assert.equal(s.status,'running');assert.deepEqual(s.companionCrew(carrier).map(m=>m.personId),['kylie']);assert.equal(s.companionCrew(old).length,0);
 s.sendAllyOrder('kylie','disembark');assert.equal(s.objectiveStates[0].current,0);assert.equal(s.companionCrew(carrier).length,0);
 s.selected=carrier.id;s.sendAllyOrder('kylie','board');run(s,12);assert.equal(s.objectiveStates[0].current,1);s.damage(carrier,9999);assert.equal(s.objectiveStates[0].current,0);assert.equal(s.status,'running');
 const retry=setup();assert.equal(retry.objectiveStates[0].current,0);assert.equal(retry.status,'running');
});
test('passengers and people walking to a Scorp ASV do not satisfy companion vehicle occupation',()=>{
 const {s,people}=footSquad();s.sendAllyOrder('all','board');assert.equal(s.objectiveStates[0].current,0);run(s,4);assert.equal(s.objectiveStates[0].current,0);assert.equal(s.status,'running');
 s.mounted!.spec={...s.mounted!.spec,faction:'scorp'};s.tick(1/60,idle);assert.equal(s.objectiveStates[0].current,0);assert.equal(s.status,'running');assert.deepEqual(s.companionCrew(s.mounted!).map(m=>m.personId),people.map(p=>p.personId));
});


function maneuverSetup(distanceToTarget:number){
 const s=setup(),ally=s.units[1],target=s.units.find(u=>u.id==='scorp-asv')!;
 s.mission.rocks=[];s.mission.base=undefined;s.mission.minefields=[];s.mission.completionEnabled=false;
 s.units=s.units.filter(u=>u===s.mounted||u===ally||u===target);s.mounted!.x=-180;s.mounted!.z=-80;
 ally.x=0;ally.z=0;ally.yaw=0;ally.aim=0;target.x=0;target.z=distanceToTarget;target.cooldown=999;target.spec.speed=0;target.shield=10000;
 assert.deepEqual(s.sendAllyOrder('kylie','attack').accepted,['kylie']);return {s,ally,target};
}
test('attack order closes to fighting distance and keeps moving and firing inside weapon range',()=>{
 const {s,ally,target}=maneuverSetup(210);run(s,8);assert.ok(distance(ally,target)<120);
 const start={x:ally.x,z:ally.z};s.events=[];run(s,6);
 assert.ok(distance(ally,start)>8);assert.ok(distance(ally,target)>30);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===ally));assert.equal(ally.order?.kind,'attack');
});
test('close enemy causes reverse movement while retaining the attack order; moving target is pursued',()=>{
 const {s,ally,target}=maneuverSetup(22);let reversed=false;for(let i=0;i<180;i++){s.tick(1/60,idle);if(ally.speed<-.5)reversed=true;}
 assert.ok(reversed);assert.ok(distance(ally,target)>35);assert.equal(ally.order?.kind,'attack');
 target.x=90;target.z=220;const before=distance(ally,target);run(s,7);assert.ok(distance(ally,target)<before-30);
 s.sendAllyOrder('kylie','hold');const stopped={x:ally.x,z:ally.z};const momentum=ally.speed;run(s,5);assert.ok(Math.abs(momentum)>0);assert.ok(distance(ally,stopped)>0);assert.equal(ally.speed,0);
});
for(const obstacle of ['rock','building'] as const)test(`attack order routes around a ${obstacle} and resumes firing instead of stopping in cover`,()=>{
 const {s,ally,target}=maneuverSetup(180);
 // Issue the command before the obstruction blocks radio communication.
 if(obstacle==='rock')s.mission.rocks=[{x:0,z:85,r:27}];
 else s.mission.base={name:'cover',x:0,z:85,width:100,depth:100,buildings:[{x:0,z:85,width:70,depth:35,height:15}]};
 let lateral=0,shots=0;
 for(let i=0;i<1800;i++){
  s.tick(1/60,idle);lateral=Math.max(lateral,Math.abs(ally.x));
  for(const event of s.events)if(event.type==='shot'&&event.unit===ally){shots++;const from=event.from as {x:number;y:number;z:number},to=event.to as {x:number;y:number;z:number};for(const r of s.mission.rocks){const contact=segmentSphere(from,to,{x:r.x,y:r.r*.55,z:r.z},r.r+.1);assert.ok(contact===null||contact>1-1e-6);}for(const b of s.terrainObstacles){const contact=buildingContact(from,to,b,.1);assert.ok(contact===null||contact>1-1e-6);}}
  s.events=[];
  if(obstacle==='rock')assert.ok(Math.hypot(ally.x,ally.z-85)>=29);
  else assert.ok(Math.abs(ally.x)>=37||Math.abs(ally.z-85)>=19.5);
 }
 assert.ok(lateral>30);assert.ok(shots>0);assert.ok(distance(ally,target)<120);assert.equal(ally.order?.kind,'attack');
});

test('fixed forward weapons get firing pauses between maneuvers rather than orbiting without shooting',()=>{
 const {s,ally,target}=maneuverSetup(65);ally.spec.torsoLimit=0;s.events=[];
 let traveled=0,previous={x:ally.x,z:ally.z};
 for(let i=0;i<900;i++){s.tick(1/60,idle);traveled+=distance(previous,ally);previous={x:ally.x,z:ally.z};}
 assert.ok(traveled>20);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===ally));assert.ok(distance(ally,target)>25);
});

test('individual F5 follows the selected moving unit, keeps that identity after selection changes and stops on target loss',()=>{
 const s=setup();s.mission.rocks=[];s.mines=[];s.units=s.units.filter(u=>u.spec.faction==='union');const follower=s.units[1],anchor=s.units[2];anchor.x=80;anchor.z=160;s.selected=anchor.id;
 const menu=new RadioMenu();assert.deepEqual(menu.key('F2',s.mission.companions!),{kind:'select',recipient:'kylie'});const before=distance(follower,anchor);assert.deepEqual(key(s,menu,'F5')!.accepted,['kylie']);assert.deepEqual(follower.order,{kind:'follow',targetId:anchor.id});assert.equal(s.units[3].order,null);
 s.selected=s.units[3].id;run(s,9);assert.ok(distance(follower,anchor)<before/2);anchor.x=130;anchor.z=180;const moved=distance(follower,anchor);run(s,7);assert.ok(distance(follower,anchor)<moved);assert.deepEqual(follower.order,{kind:'follow',targetId:anchor.id});
 anchor.alive=false;s.tick(.05,idle);assert.equal(follower.order,null);run(s,4);assert.equal(follower.speed,0);const complete=s.events.filter(e=>e.type==='ally-order-complete'&&e.unit===follower).length;run(s,.2);assert.equal(s.events.filter(e=>e.type==='ally-order-complete'&&e.unit===follower).length,complete);
});
test('F5 accepts an empty selected vehicle as a destination and waits nearby',()=>{
 const s=setup();s.mission.rocks=[];s.mines=[];s.units=s.units.filter(u=>u.spec.faction==='union');const parked=makeUnit('destination','scorp-asv',80,150,false);s.units.push(parked);s.selected=parked.id;const follower=s.units[1];
 assert.deepEqual(s.sendAllyOrder('kylie','follow').accepted,['kylie']);run(s,14);assert.ok(distance(follower,parked)<35);assert.equal(follower.speed,0);assert.equal(follower.pilot,true);assert.equal(parked.pilot,false);
});

test('ally already stopped beside a building can leave the navigation margin and continue attacking',()=>{
 const {s,ally}=maneuverSetup(180);s.mission.base={name:'cover',x:0,z:85,width:100,depth:100,buildings:[{x:0,z:85,width:70,depth:35,height:15}]};
 ally.x=35+buildingClearance(ally)+.25;ally.z=85;const before={x:ally.x,z:ally.z};run(s,8);
 assert.ok(distance(ally,before)>8);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===ally));
});

test('ordered passenger walks inside the stricter four metre boarding boundary before entering',()=>{
 const {s,people}=footSquad(),soldier=people[0],carrier=s.mounted!;
 soldier.x=carrier.x+4;soldier.z=carrier.z;
 assert.deepEqual(s.sendAllyOrder('kylie','board').accepted,['kylie']);
 s.tick(.001,idle);assert.equal(soldier.passengerOf,undefined);
 s.tick(.001,idle);assert.equal(soldier.passengerOf,carrier.id);
});

function followObstacleSetup(selected:boolean){
 const s=setup(),ally=s.units[1],own=s.mounted!;s.mission.rocks=[];s.mission.base=undefined;s.mines=[];s.mission.completionEnabled=false;s.units=[own,ally];ally.x=0;ally.z=0;ally.yaw=0;ally.aim=0;
 own.x=selected?100:0;own.z=selected?-20:180;
 const anchor=selected?makeUnit('follow-anchor','union-asv',0,180,false):own;if(selected)s.units.push(anchor);s.selected=selected?anchor.id:null;
 assert.deepEqual(s.sendAllyOrder('kylie','follow').accepted,['kylie']);return {s,ally,anchor};
}
for(const selected of [false,true])for(const obstacle of ['rock','building','cliff','vehicle'] as const)test(`F5 ${selected?'selected target':'player'} follow routes around ${obstacle} cover and rejoins formation`,()=>{
 const {s,ally}=followObstacleSetup(selected);const blocker=makeUnit('blocker','merc-tactical',0,85,false);
 if(obstacle==='rock')s.mission.rocks=[{x:0,z:85,r:27}];else if(obstacle==='building')s.mission.base={name:'wall',x:0,z:85,width:100,depth:100,buildings:[{x:0,z:85,width:70,depth:35,height:15}]};else if(obstacle==='cliff')s.mission.terrain.cliffs=[{id:'cliff',x:0,z:85,width:70,depth:35,height:50}];else s.units.push(blocker);
 let lateral=0;for(let i=0;i<1800;i++){s.tick(1/60,idle);lateral=Math.max(lateral,Math.abs(ally.x));
  if(obstacle==='rock')assert.ok(Math.hypot(ally.x,ally.z-85)>=29-1e-6);else if(obstacle==='building'||obstacle==='cliff')assert.ok(Math.abs(ally.x)>=37-1e-6||Math.abs(ally.z-85)>=19.5-1e-6);else assert.ok(distance(ally,blocker)>=7.6-1e-6);
 }
 assert.ok(lateral>(obstacle==='rock'?20:obstacle==='building'||obstacle==='cliff'?35:6));assert.ok(distance(ally,{x:-12,z:162})<6,`${ally.x}, ${ally.z}`);assert.equal(ally.order?.kind,'follow');
});
test('F5 chooses a nearby open formation point if the exact slot is blocked',()=>{
 const {s,ally,anchor}=followObstacleSetup(false);s.mission.rocks=[{x:-12,z:162,r:12}];run(s,25);assert.ok(distance(ally,{x:-12,z:162})<=22);assert.ok(distance(ally,s.mission.rocks[0])>=14);assert.equal(ally.order?.kind,'follow');
});
test('F5 retains its order when no route exists and resumes after the obstruction is removed',()=>{
 const {s,ally}=followObstacleSetup(true);s.mission.terrain.halfWidth=14;s.mounted!.x=10;s.mounted!.z=-40;s.mission.base={name:'closed',x:0,z:85,width:60,depth:100,buildings:[{x:0,z:85,width:40,depth:25,height:15}]};
 run(s,2);assert.equal(ally.z,0);assert.equal(ally.order?.kind,'follow');s.mission.base=undefined;run(s,25);assert.ok(ally.z>130);assert.equal(ally.order?.kind,'follow');
});

test('F5 routes around a destroyed fixed tower and keeps following after its fire expires',()=>{
 const {s,ally}=followObstacleSetup(false),tower=makeUnit('wreck-blocker','scorp-rocket-tower',-6,85,false);s.units.push(tower);s.damage(tower,9999);
 let lateral=0;for(let i=0;i<1800;i++){s.tick(1/60,idle);lateral=Math.max(lateral,Math.abs(ally.x));assert.ok(Math.abs(ally.x+6)>=6.5-1e-6||Math.abs(ally.z-85)>=6-1e-6);}
 assert.ok(lateral>5);assert.ok(distance(ally,{x:-12,z:162})<6);assert.equal(ally.order?.kind,'follow');assert.ok(s.terrainObstacles.some(o=>o.x===-6&&o.z===85));
});

test('mission companions receive and execute orders across range, terrain and IFF differences',()=>{
 const s=setup(),ally=s.units[1];s.selected=null;s.iff='0000';ally.x=0;ally.z=900;s.mission.terrain.cliffs=[{id:'radio-wall',x:0,z:450,width:50,depth:30,height:30}];
 assert.equal(s.lineOfSight(ally,s.player),false);assert.ok(distance(ally,s.player)>400);assert.ok(s.radioMembers.every(m=>m.available));assert.deepEqual(s.sendAllyOrder('kylie','follow').accepted,['kylie']);const before=ally.z;run(s,2);assert.ok(ally.z<before-5);assert.equal(ally.order?.kind,'follow');
});

test('2-6 F2 addresses Kylie before and after tower boarding; F1 attacks the selected AIP and radio survives disembark/reboard',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const {orderReplies}=await import('../content/radio-dialogue.ts');const s=new Simulation('Easy',MISSION_2_6),menu=new RadioMenu(),tower=s.units.find(u=>u.id==='kylie-tower')!,target=s.units.find(u=>u.id==='merc-aip-east')!,near=s.units.find(u=>u.id==='merc-aip-north')!;
 target.x=300;target.z=210;near.x=80;near.z=310;
 key(s,menu,'F2');assert.equal(menu.recipient,'kylie');assert.equal(s.radioMembers.find(m=>m.personId==='kylie')!.available,true);assert.equal(s.radioMembers.find(m=>m.personId==='thane')!.reason,'busy');
 run(s,3);assert.equal(tower.pilot,true);assert.equal(tower.personId,'kylie');assert.equal(s.radioMembers.find(m=>m.personId==='kylie')!.unit,tower);assert.equal(s.radioMembers.find(m=>m.personId==='kylie')!.available,true);
 s.selected=target.id;s.events=[];const shield=target.shield,result=key(s,menu,'F1')!;assert.deepEqual(result.accepted,['kylie-tower']);assert.deepEqual(tower.order,{kind:'attack',targetId:target.id});assert.deepEqual(orderReplies(s.mission.companions!,result.accepted,'attack',target.id).map(r=>r.personId),['kylie']);
 const position={x:tower.x,z:tower.z};run(s,4);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===tower&&e.weapon==='GAUS30'));assert.ok(target.shield<shield);assert.deepEqual({x:tower.x,z:tower.z},position);
 assert.deepEqual(key(s,menu,'F7')!.accepted,['kylie-tower']);assert.equal(tower.order,null);assert.deepEqual(key(s,menu,'F6')!.accepted,['kylie-tower']);assert.equal(tower.pilot,false);assert.ok(s.radioMembers.find(m=>m.personId==='kylie')!.soldier?.alive);
 assert.deepEqual(key(s,menu,'F1')!.accepted,['kylie-tower']);assert.equal(s.radioMembers.find(m=>m.personId==='kylie')!.soldier?.order?.kind,'attack');s.selected=tower.id;assert.deepEqual(key(s,menu,'F4')!.accepted,['kylie-tower']);run(s,2);assert.equal(tower.pilot,true);assert.equal(s.radioMembers.find(m=>m.personId==='kylie')!.available,true);assert.equal(s.radioMembers.find(m=>m.personId==='thane')!.reason,'busy');
});


function orderedFootSetup(){const {s,people}=footSquad();s.mission.base=undefined;s.mission.terrain.cliffs=[];s.mission.completionEnabled=false;s.mines=[];s.units=[s.mounted!];s.mounted!.x=-80;s.mounted!.z=-60;
 const target=makeUnit('foot-order-target','merc-sentry',0,260,true);target.spec.speed=0;target.spec.ai.detection=0;target.cooldown=9999;s.units.push(target);people[0].x=0;people[0].z=0;people[0].yaw=0;people.slice(1).forEach((p,i)=>{p.x=-50-i*10;p.z=-50;p.cooldown=999;});s.selected=target.id;return {s,people,target};}

test('dismounted F2/F1 attack advances into common PRIF44 range, fires and damages the selected enemy; invalid target clears once',()=>{
 const {s,people,target}=orderedFootSetup(),soldier=people[0],menu=new RadioMenu();key(s,menu,'F2');assert.deepEqual(key(s,menu,'F1')!.accepted,['kylie']);assert.deepEqual(soldier.order,{kind:'attack',targetId:target.id});const shield=target.shield;
 run(s,40);assert.ok(soldier.z>100);assert.ok(s.events.some(e=>e.type==='shot'&&e.soldier===soldier&&e.weapon==='PRIF44'));assert.ok(target.shield<shield);assert.ok(distance(soldier,target)<150);
 target.pilot=false;run(s,.1);assert.equal(soldier.order,null);assert.equal(s.events.filter(e=>e.type==='ally-order-complete'&&e.soldier===soldier).length,1);run(s,1);assert.equal(s.events.filter(e=>e.type==='ally-order-complete'&&e.soldier===soldier).length,1);
});

test('foot attack routes around cover, F7 cancels approach and F4 replaces the order with boarding',()=>{
 const {s,people,target}=orderedFootSetup(),soldier=people[0];target.z=150;s.mission.rocks=[{x:0,z:60,r:12}];assert.deepEqual(s.sendAllyOrder('kylie','attack').accepted,['kylie']);run(s,30);assert.ok(Math.abs(soldier.x)>10);assert.ok(s.events.some(e=>e.type==='shot'&&e.soldier===soldier));
 s.sendAllyOrder('kylie','hold');run(s,2);const stopped={x:soldier.x,z:soldier.z};run(s,2);assert.ok(distance(soldier,stopped)<.1);assert.equal(soldier.order,null);
 s.selected=null;assert.deepEqual(s.sendAllyOrder('kylie','board').accepted,['kylie']);assert.equal(soldier.boardingTarget,s.mounted!.id);assert.equal(soldier.order,null);run(s,45);assert.equal(soldier.passengerOf,s.mounted!.id);assert.equal(soldier.order,undefined);
});

test('foot attack never shoots through an ally; foot follow moves to the commander and honors hold',()=>{
 const {s,people,target}=orderedFootSetup(),soldier=people[0],blocker=people[1];target.z=100;blocker.x=0;blocker.z=35;blocker.order=null;blocker.cooldown=999;const health=blocker.health,enemy=s.forceEject(target,'boarding')!;target.alive=false;enemy.x=0;enemy.z=100;enemy.cooldown=999;enemy.flight=null;s.selected=enemy.id;
 s.sendAllyOrder('kylie','attack');run(s,3);assert.equal(blocker.health,health);assert.ok(!s.events.some(e=>e.type==='shot'&&e.soldier===soldier));blocker.x=30;const enemyHealth=enemy.health;run(s,3);assert.ok(enemy.health<enemyHealth);
 s.selected=null;assert.deepEqual(s.sendAllyOrder('kylie','follow').accepted,['kylie']);const before=distance(soldier,s.player);run(s,20);assert.ok(distance(soldier,s.player)<before);assert.equal(soldier.order?.kind,'follow');s.sendAllyOrder('kylie','hold');run(s,2);const position={x:soldier.x,z:soldier.z};run(s,2);assert.ok(distance(soldier,position)<.1);
});

test('foot attack is shared by every current mission with companions, including interrupting 2-6 automatic tower boarding',async()=>{
 const {MISSIONS}=await import('../content/missions/index.ts');
 for(const source of MISSIONS.filter(m=>m.companions?.some(p=>p.personId==='kylie'))){const def=structuredClone(source),member=def.companions!.find(m=>m.personId==='kylie')!;def.companions=[member];def.personnel=def.personnel?.filter(p=>p.personId==='kylie');def.units=def.units.filter(u=>u.id===def.assignedUnitId||u.id===member.unitId);def.base=undefined;def.rocks=[];def.terrain.cliffs=[];def.minefields=[];def.objectives=[];def.completionEnabled=false;def.assaults=[];def.pickups=[];
  const s=new Simulation('Easy',def),radio=s.radioMembers[0],soldier=radio.soldier??s.forceEject(radio.unit!,'boarding')!,target=makeUnit('ordered-enemy','merc-sentry',soldier.x,soldier.z+200,true);soldier.flight=null;target.iff='0000';target.spec.speed=0;target.spec.ai.detection=0;target.cooldown=999;s.units.push(target);s.selected=target.id;
  assert.equal(s.sendAllyOrder('kylie','attack').accepted.length,1,source.id);assert.equal(soldier.boardingTarget,undefined,source.id);run(s,40);assert.ok(s.events.some(e=>e.type==='shot'&&e.soldier===soldier),source.id);assert.ok(target.shield<target.spec.shield,source.id);
 }
});

test('allied infantry follows at the faster pace, settles on hold and still boards its commander',()=>{
 const {s,people}=orderedFootSetup(),soldier=people[0];s.selected=null;assert.deepEqual(s.sendAllyOrder('kylie','follow').accepted,['kylie']);const start={x:soldier.x,z:soldier.z};run(s,2);const travelled=distance(start,soldier),speed=Math.hypot(soldier.velocity!.x,soldier.velocity!.z);assert.ok(travelled>13&&travelled<17);assert.ok(Math.abs(speed-8)<.05);
 s.sendAllyOrder('kylie','hold');run(s,2);const stopped={x:soldier.x,z:soldier.z};run(s,2);assert.ok(distance(stopped,soldier)<.01);s.sendAllyOrder('kylie','board');run(s,20);assert.equal(soldier.passengerOf,s.mounted!.id);
});

test('unassigned friendly infantry also boards faster while enemy infantry keeps its original retreat speed',()=>{
 const boarding=(friendly:boolean)=>{
  const s=new Simulation();s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.completionEnabled=false;s.mission.companions=[];s.mission.assaults=[];s.mines=[];s.human={x:0,z:-30};const iff=friendly?s.iff:'hostile';const donor=makeUnit('walking-donor','union-sentry',0,-20,true),carrier=makeUnit('walking-carrier','union-asv',0,100,false);donor.iff=carrier.iff=iff;s.units=[donor,carrier];const person=s.forceEject(donor,'boarding')!;person.x=0;person.z=0;person.boardingTarget=carrier.id;person.boardingRole='pilot';run(s,2);return {distance:Math.hypot(person.x,person.z),speed:Math.hypot(person.velocity!.x,person.velocity!.z)};
 };
 const friendly=boarding(true),enemy=boarding(false);assert.ok(friendly.distance>13);assert.ok(enemy.distance<9);assert.ok(friendly.distance>enemy.distance*1.7);assert.ok(Math.abs(friendly.speed-8)<.05);assert.ok(Math.abs(enemy.speed-3.5)<.05);
});
