import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,distance,type Input} from './simulation.ts';
import {vehicleRadius} from './parts.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
function setup(){const s=new Simulation();s.units=[makeUnit('own','union-sentry',0,0,false),makeUnit('other','merc-sentry',0,20)];s.human={x:0,z:0};s.board();s.iff='6707';return s;}
test('2-6 buildings stop infantry and the full reserve HAWC footprint on every side, including a fast crossing and retreat',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');
 for(const facilityId of ['citadel'])for(const kind of ['foot','merc-assault','merc-cruiser'] as const)for(const [axis,sign] of [['x',1],['x',-1],['z',1],['z',-1]] as const){
  const s=new Simulation('Easy',MISSION_2_6),building=s.facilities.find(f=>f.id===facilityId)!,half=(axis==='x'?building.width:building.depth)/2;
  const start={x:building.x,z:building.z};start[axis]+=sign*(half+20);s.units=[];s.human={...start};
  if(kind!=='foot'){const own=makeUnit('collision-own',kind,start.x,start.z,false);s.units=[own];assert.ok(s.board());}
  const actor=s.mounted??s.human,yaw=axis==='x'?-sign*Math.PI/2:sign>0?Math.PI:0;
  s.move(actor,yaw,(half+20)*2);
  // Three and a half metres covers the Assault weapon mount; the Cruiser legs reach 4.75 m sideways.
  const clearance=kind==='foot'?.35:kind==='merc-cruiser'?4.75:3.5;
  assert.ok(sign*(actor[axis]-building[axis])>=half+clearance-1e-6,`${facilityId}/${kind}/${axis}/${sign}: body crossed the wall`);
  const stopped=actor[axis];s.move(actor,yaw,-8);assert.ok(sign*(actor[axis]-stopped)>7.9);
 }
});
test('2-6 forward input keeps infantry and the reserve Assault outside the Citadel while pushing and allows reversing away',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');
 for(const mounted of [false,true]){
  const s=new Simulation('Easy',MISSION_2_6),assault=s.units.find(u=>u.id==='reserve-assault')!;s.units=mounted?[assault]:[];assault.x=150;assault.z=120;
  s.human={x:assault.x,z:assault.z};s.humanYaw=-Math.PI/2;
  if(mounted){assert.ok(s.board());assault.yaw=assault.aim=-Math.PI/2;}
  const actor=s.mounted??s.human,start=actor.x;
  for(let i=0;i<1200;i++){s.tick(1/60,{...idle,forward:true,boost:true});assert.ok(actor.x>=55+(mounted?3.5:.35));}
  assert.ok(actor.x<start-20);const stopped=actor.x;
  for(let i=0;i<180;i++)s.tick(1/60,{...idle,back:true});assert.ok(actor.x>stopped+2);
 }
});
test('mounted HAWC stops at contact; it can reverse away and pass at a safe lateral distance',()=>{
 const s=setup();s.speed=20;s.throttle=1;for(let i=0;i<100;i++)s.tick(.02,idle);
 const u=s.mounted!,other=s.units[1],separation=vehicleRadius(u.kind)+vehicleRadius(other.kind);assert.ok(distance(u,other)>=separation);assert.ok(distance(u,other)<separation+.1);assert.equal(s.speed,0);assert.equal(u.speed,0);
 const z=u.z;s.throttle=-.35;for(let i=0;i<20;i++)s.tick(.02,idle);assert.ok(u.z<z);
 u.x=12;s.move(u,0,50);assert.ok(u.z>other.z);
});
test('swept vehicle contact prevents high speed tunnelling, including reverse travel',()=>{
 for(const reverse of [false,true]){const s=setup(),u=s.mounted!,other=s.units[1];if(reverse){u.z=40;s.move(u,0,-100);}else s.move(u,0,100);assert.ok(distance(u,other)>=7);assert.ok(reverse?u.z>other.z:u.z<other.z);}
});
test('unoccupied and friendly live vehicles remain solid to other HAWCs',()=>{
 for(const state of ['empty','friendly']){const s=setup(),u=s.mounted!,other=s.units[1];if(state==='empty')other.pilot=false;if(state==='friendly')other.kind='union-sentry';s.move(u,0,100);assert.ok(u.z<other.z);assert.ok(distance(u,other)>=vehicleRadius(u.kind)+vehicleRadius(other.kind));}
});
test('AI cannot drive through the player or another AI and touching vehicles can separate',()=>{
 const s=setup(),u=s.mounted!,enemy=s.units[1];s.iff='2620';enemy.z=8;enemy.yaw=Math.PI;enemy.aim=Math.PI;enemy.speed=20;enemy.alert=true;enemy.cooldown=999;
 for(let i=0;i<30;i++){s.tick(.02,idle);assert.ok(distance(u,enemy)>=7);}
 const a=makeUnit('a','merc-sentry',-20,0),b=makeUnit('b','merc-tactical',-20,20);s.units.push(a,b);s.move(a,0,50);assert.ok(distance(a,b)>=7.6);const z=a.z;s.move(a,0,-3);assert.ok(a.z<z);
});

test('destroyed ordinary vehicles allow HAWCs to cross their former footprint',()=>{
 const s=setup(),u=s.mounted!,other=s.units[1];s.damage(other,9999);s.move(u,0,100);assert.equal(u.z,100);
});

test('frontal vehicle impact emits one dull-contact event per encounter, without repeat while pushing',()=>{
 const s=setup();s.speed=20;s.throttle=1;for(let i=0;i<150;i++)s.tick(.02,idle);
 const first=s.events.filter(e=>e.type==='vehicle-contact');assert.equal(first.length,1);assert.equal(first[0].unit,s.mounted);assert.equal(first[0].otherUnitId,'other');assert.equal(s.speed,0);
 s.throttle=-.5;for(let i=0;i<40;i++)s.tick(.02,idle);s.throttle=1;for(let i=0;i<200;i++)s.tick(.02,idle);assert.equal(s.events.filter(e=>e.type==='vehicle-contact').length,2);
});
test('a small overlap at the edge slides past the other vehicle instead of stopping or penetrating',()=>{
 for(const side of [-1,1]){
  const s=setup(),own=s.mounted!,other=s.units[1];own.x=side*6.4;own.z=10;s.speed=15;own.speed=15;s.throttle=1;let sidestep=0;
  for(let i=0;i<150;i++){s.tick(.02,idle);assert.ok(distance(own,other)>=7-1e-6);sidestep=Math.max(sidestep,Math.abs(own.x)-6.4);}
  assert.ok(own.z>other.z+10);assert.ok(sidestep>.2);assert.equal(s.events.filter(e=>e.type==='vehicle-contact').length,0);assert.ok(own.speed>0);
 }
});
test('AI uses the same sliding contact and a third body cannot be crossed while sliding',()=>{
 const s=setup(),ai=makeUnit('slider','union-sentry',6.4,10,true),blocker=s.units[1];s.units=[ai,blocker];ai.speed=15;
 for(let i=0;i<100;i++){s.move(ai,0,.3);assert.ok(distance(ai,blocker)>=7-1e-6);}assert.ok(ai.z>blocker.z+10);
 const closed=setup(),own=closed.mounted!;own.x=6.4;own.z=10;const third=makeUnit('third','union-sentry',14,20,false);closed.units.push(third);
 for(let i=0;i<100;i++){closed.move(own,0,.3);assert.ok(distance(own,closed.units[1])>=7-1e-6);assert.ok(distance(own,third)>=7-1e-6);}
});
test('shallow wall contact slides along its face; direct frontal wall contact stops with a contact event',()=>{
 const s=setup(),u=s.mounted!;s.units=[u];s.mission.rocks=[];s.mission.base={name:'test',x:0,z:20,width:30,depth:8,buildings:[{x:0,z:20,width:30,depth:8,height:8}]};u.z=12;u.speed=15;
 s.move(u,Math.PI/3,10);assert.ok(u.x>5);assert.ok(u.z<=14+1e-6);assert.equal(s.events.filter(e=>e.type==='vehicle-contact').length,0);
 u.x=0;u.z=10;u.speed=15;s.move(u,0,10);assert.ok(u.z<14.001);assert.equal(u.speed,0);assert.equal(s.events.filter(e=>e.type==='vehicle-contact').length,1);
});

for(const obstacle of ['rock','building','cliff'] as const)test(`frontal ${obstacle} contact emits the common thump once while pushing`,()=>{
 const s=setup(),own=s.mounted!;s.units=[own];s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];
 if(obstacle==='rock')s.mission.rocks=[{x:0,z:20,r:5}];
 else if(obstacle==='building')s.mission.base={name:'wall',x:0,z:20,width:30,depth:8,buildings:[{x:0,z:20,width:30,depth:8,height:15}]};
 else s.mission.terrain.cliffs=[{id:'cliff',x:0,z:20,width:30,depth:8,height:30}];
 s.speed=15;own.speed=15;s.throttle=1;for(let i=0;i<150;i++)s.tick(.02,idle);
 const contacts=s.events.filter(e=>e.type==='vehicle-contact');assert.equal(contacts.length,1);assert.equal(contacts[0].unit,own);assert.equal(contacts[0].otherUnitId,undefined);assert.equal(s.speed,0);assert.ok(own.z<20);
});

test('same-IFF infantry cannot walk through occupied or empty ASVs, even with a large swept step',()=>{
 for(const kind of ['union-asv','scorp-asv'] as const)for(const occupied of [true,false]){
  const s=new Simulation(),vehicle=makeUnit('asv-solid',kind,0,0,occupied),source=makeUnit('source','merc-sentry',60,30,true);s.units=[vehicle,source];s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];
  const soldier=s.forceEject(source)!;soldier.flight=null;soldier.iff=vehicle.iff;soldier.x=0;soldier.z=-10;s.move(soldier,0,30);
  assert.ok(soldier.z<0);assert.ok(soldier.z>=-10);assert.equal(soldier.alive,true);assert.equal(soldier.health,35);
 }
});
test('an occupied ASV also stops against matching-IFF ground infantry rather than passing through them',()=>{
 const s=new Simulation(),vehicle=makeUnit('solid-own','scorp-asv',0,0,false),source=makeUnit('source','merc-sentry',60,30,true);s.units=[vehicle,source];s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];
 s.human={x:0,z:0};s.board();const soldier=s.forceEject(source)!;soldier.flight=null;soldier.iff=s.iff;soldier.x=0;soldier.z=10;
 for(let i=0;i<120;i++)s.tick(1/60,{...idle,boost:true});assert.ok(vehicle.z<soldier.z-3);assert.equal(soldier.alive,true);assert.equal(soldier.health,35);
});

function wallEscape(){
 const s=new Simulation();s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.base={name:'wall',x:0,z:0,width:8,depth:20,buildings:[{x:0,z:0,width:8,depth:20,height:10}]};
 const carrier=makeUnit('blocked-side','union-asv',9.8,0,true);carrier.iff=s.iff;carrier.passengers=['a','b','c'];carrier.spec={...carrier.spec,speed:0,weapons:[],ai:{...carrier.spec.ai,detection:0}};s.units=[carrier];s.human={x:5.9,z:0};return {s,carrier};
}
test('infantry wedged between a wall margin and a full friendly ASV can walk along the wall without entering either obstacle',()=>{
 const {s,carrier}=wallEscape();for(let i=0;i<180;i++){s.tick(1/60,{...idle,forward:true});assert.ok(s.human.x>=5.9-1e-8);assert.ok(distance(s.human,carrier)>=3.85-1e-6);}
 assert.equal(s.status,'running');assert.equal(s.passenger,null);assert.ok(s.human.z>8);
});
test('existing wall overlap can separate or slide, but movement deeper into the wall is rejected for infantry and vehicles',()=>{
 for(const mounted of [false,true]){
  const {s}=wallEscape();s.units=[];let actor=s.human;
  if(mounted){const unit=makeUnit('own','union-sentry',5.9,0,false);s.units=[unit];s.human={x:5.9,z:0};s.board();actor=unit;}
  s.move(actor,-Math.PI/2,1);assert.ok(actor.x>=5.9-1e-8);s.move(actor,0,8);assert.ok(actor.z>7.9);s.move(actor,Math.PI/2,2);assert.ok(actor.x>7.8);
 }
});
test('foot sliding checks a second vehicle and a wall along the remaining movement rather than tunnelling through them',()=>{
 const s=new Simulation();s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.base={name:'wall',x:0,z:0,width:4,depth:30,buildings:[{x:0,z:0,width:4,depth:30,height:10}]};
 const carrier=makeUnit('solid','union-asv',-4,8,true);carrier.iff=s.iff;carrier.passengers=['a','b','c'];s.units=[carrier];s.human={x:-8,z:-8};s.move(s.human,Math.PI/4,30);
 assert.ok(distance(s.human,{x:-8,z:-8})>1);assert.ok(s.human.x<=-4+1e-6);assert.ok(distance(s.human,carrier)>=3.85-1e-6);
});
test('swept foot contact clips a fast step at a wall and can reverse away afterward',()=>{
 const {s}=wallEscape();s.units=[];s.human={x:12,z:0};s.move(s.human,-Math.PI/2,40);assert.ok(s.human.x>=6-1e-6);assert.ok(s.human.x<12);const x=s.human.x;s.move(s.human,Math.PI/2,2);assert.ok(s.human.x>x+1.9);
});

test('river water blocks people and ground chassis in both directions, with only AIPs able to cross without a bridge',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');
 for(const kind of ['foot','union-sentry','merc-assault','merc-cruiser','union-asv','union-aip','merc-aip'] as const)for(const sign of [-1,1]){
  const mission=structuredClone(MISSION_4_2);mission.units=[];mission.personnel=[];mission.companions=[];mission.garrison=[];mission.assaults=[];mission.objectives=[];mission.completionEnabled=false;mission.base=undefined;mission.rocks=[];
  const s=new Simulation('Easy',mission),r=mission.terrain.river!,start=r.x-sign*(r.width/2+20),z=r.bridgeZ+100;s.human={x:start,z};
  if(kind!=='foot'){s.units=[makeUnit('river-own',kind,start,z,false)];assert.ok(s.board());}
  const actor=s.mounted??s.human;s.move(actor,sign*Math.PI/2,r.width+40);
  if(kind==='union-aip'||kind==='merc-aip')assert.ok(sign*(actor.x-r.x)>r.width/2+19);
  else{
   assert.ok(sign*(actor.x-r.x)<-r.width/2,`${kind}: crossed the water`);const x=actor.x;s.move(actor,0,10);assert.ok(actor.z>z+9);assert.ok(Math.abs(actor.x-x)<1e-6);s.move(actor,-sign*Math.PI/2,8);assert.ok(sign*(x-actor.x)>7.9);
  }
  assert.equal(s.lineOfSight({x:r.x-60,z},{x:r.x+60,z}),true);
 }
});

test('lowered bridges admit people and HAWCs, while raised bridges block ground crossing and preserve the AIP exception',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');
 for(const raised of [false,true])for(const kind of ['foot','union-sentry','merc-assault','union-aip','merc-aip'] as const)for(const sign of [-1,1]){
  const mission=structuredClone(MISSION_4_2);mission.units=[];mission.personnel=[];mission.companions=[];mission.garrison=[];mission.assaults=[];mission.objectives=[];mission.completionEnabled=false;mission.base=undefined;mission.rocks=[];
  const s=new Simulation('Easy',mission),r=mission.terrain.river!,start=r.x-sign*(r.width/2+20);s.human={x:start,z:r.bridgeZ};if(raised)s.raisedBridges.add(r.bridgeId);
  if(kind!=='foot'){s.units=[makeUnit('river-own',kind,start,r.bridgeZ,false)];assert.ok(s.board());}const actor=s.mounted??s.human;s.move(actor,sign*Math.PI/2,r.width+40);
  if(!raised||kind==='union-aip'||kind==='merc-aip')assert.ok(sign*(actor.x-r.x)>r.width/2+19,`${kind}/${raised}: bridge passage blocked`);
  else assert.ok(sign*(actor.x-r.x)<-r.width/2,`${kind}: raised bridge still passed`);
 }
});

test('normal forward input cannot walk or drive a HAWC through the river bank',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');
 for(const mounted of [false,true]){
  const mission=structuredClone(MISSION_4_2);mission.units=[];mission.personnel=[];mission.companions=[];mission.garrison=[];mission.assaults=[];mission.objectives=[];mission.completionEnabled=false;mission.base=undefined;mission.rocks=[];
  const s=new Simulation('Easy',mission),r=mission.terrain.river!,start={x:r.x-r.width/2-15,z:r.bridgeZ+100};s.human={...start};s.humanYaw=Math.PI/2;
  if(mounted){const unit=makeUnit('river-own','union-sentry',start.x,start.z,false);unit.yaw=unit.aim=Math.PI/2;s.units=[unit];assert.ok(s.board());}
  for(let i=0;i<300;i++)s.tick(.05,{...idle,forward:true});assert.ok(s.player.x<r.x-r.width/2);assert.equal(s.humanHealth,100);
 }
});

test('an ejected person cannot bypass water from the air, and an allied HAWC routes through the lowered bridge',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const mission=structuredClone(MISSION_4_2);mission.units=[];mission.personnel=[];mission.companions=[];mission.garrison=[];mission.assaults=[];mission.objectives=[];mission.completionEnabled=false;mission.base=undefined;mission.rocks=[];
 const flight=new Simulation('Easy',mission),r=mission.terrain.river!;flight.human={x:r.x-r.width/2-10,z:r.bridgeZ+100};flight.flight={altitude:20,vy:10,vx:100,vz:0};for(let i=0;i<100;i++)flight.tick(.05,idle);assert.ok(flight.human.x<r.x-r.width/2);assert.equal(flight.humanHealth,100);
 mission.units=[{id:'river-ally',kind:'union-sentry',x:r.x-r.width/2-25,z:r.bridgeZ+80,pilot:true,personId:'kylie',iff:mission.initialIff}];mission.companions=[{personId:'kylie',unitId:'river-ally',key:'F2',name:{ja:'キリー',en:'Kylie'}}];
 const follow=new Simulation('Easy',mission);follow.human={x:r.x+r.width/2+25,z:r.bridgeZ+80};assert.deepEqual(follow.sendAllyOrder('kylie','follow').accepted,['river-ally']);let usedBridge=false;for(let i=0;i<1200;i++){follow.tick(.05,idle);const ally=follow.units[0];if(Math.abs(ally.x-r.x)<r.width/2){usedBridge=true;assert.ok(Math.abs(ally.z-r.bridgeZ)<r.bridgeWidth/2);}}
 assert.ok(usedBridge);assert.ok(follow.units[0].x>r.x+r.width/2);
});
