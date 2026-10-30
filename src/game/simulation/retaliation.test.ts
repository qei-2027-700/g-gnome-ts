import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,distance,type Input} from './simulation.ts';
import {MISSION_3_3} from '../content/missions/mission-3-3.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
function setup(){const s=new Simulation('Easy',MISSION_3_3);s.mission.terrain.cliffs=[];for(const [i,p] of [{x:-22,z:30},{x:10,z:65},{x:26,z:100}].entries())Object.assign(s.units[i+1],p);for(const u of s.units){u.yaw=0;u.aim=0;}Object.assign(s.units.find(u=>u.id==='scorp-asv')!,{x:0,z:350});return {s,enemy:s.units.find(u=>u.id==='scorp-asv')!};}
function tick(s:Simulation,seconds:number,input=idle){for(let i=0;i<seconds*60;i++)s.tick(1/60,input);}
test('waiting ASV stays put until attacked; ordinary player gun hit provokes approach and return fire without lure credit',()=>{
 const {s,enemy}=setup();tick(s,2);assert.equal(enemy.alert,false);assert.equal(enemy.z,350);
 s.mounted!.z=230;s.human.z=230;enemy.cooldown=999;tick(s,.05,{...idle,fire1:true});tick(s,2.2);assert.ok(enemy.shield<enemy.spec.shield);assert.equal(enemy.alert,true);assert.equal(enemy.aggressorId,'player');assert.equal(enemy.lureHits,0);assert.equal(enemy.lured,false);
 enemy.cooldown=0;tick(s,5);assert.ok(enemy.z<345);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===enemy));assert.ok(s.mounted!.shield<s.mounted!.spec.shield||s.mounted!.armor<s.mounted!.spec.armor);
});
test('physical ally laser hits provoke ASV retaliation against that ally, even outside player detection range',()=>{
 const {s,enemy}=setup(),ally=s.units[1];ally.x=-30;ally.z=200;s.selected=enemy.id;assert.deepEqual(s.sendAllyOrder('kylie','attack').accepted,['kylie']);
 tick(s,6);assert.equal(enemy.alert,true);assert.equal(enemy.aggressorId,ally.id);assert.equal(enemy.lureHits,0);assert.equal(enemy.lured,false);
 s.sendAllyOrder('kylie','hold');const before=distance(enemy,ally);tick(s,5);assert.ok(distance(enemy,ally)<before);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===enemy));assert.ok(ally.shield<ally.spec.shield||ally.armor<ally.spec.armor);assert.equal(s.mounted!.shield,s.mounted!.spec.shield);
});
test('physical ally missile remembers its owner; dead or unoccupied aggressors are no longer targets',()=>{
 const {s,enemy}=setup(),ally=s.units[1];ally.x=40;ally.z=220;ally.aim=Math.atan2(enemy.x-ally.x,enemy.z-ally.z);s.fireMissile(ally,'TCROCK',1,{x:enemy.x,y:enemy.spec.height*.55,z:enemy.z});tick(s,1.5);assert.equal(enemy.aggressorId,ally.id);assert.equal(enemy.lureHits,0);
 ally.pilot=false;tick(s,.1);assert.equal(enemy.aggressorId,null);assert.ok(!s.events.slice(-2).some(e=>e.type==='lured'));
 const retry=setup();assert.equal(retry.enemy.aggressorId,null);assert.equal(retry.enemy.alert,false);
});
test('misses and empty or destroyed ASVs never activate retaliation',()=>{
 const {s,enemy}=setup();s.aimBy(.8);tick(s,.1,{...idle,fire1:true});assert.equal(enemy.alert,false);enemy.pilot=false;s.damage(enemy,1);assert.equal(enemy.alert,false);enemy.alive=false;s.damage(enemy,1);assert.equal(enemy.aggressorId,null);
});

test('retaliation keeps its attacker for three seconds despite alternating incoming hits',()=>{
 const {s,enemy}=setup(),first=s.units[1],second=s.units[2];
 s.damage(enemy,1,'hull',undefined,first,'FLECH');assert.equal(enemy.aggressorId,first.id);
 for(let i=0;i<5;i++){s.time+=.5;s.damage(enemy,.1,'hull',undefined,second,'FLECH');assert.equal(enemy.aggressorId,first.id);}
 s.time+=.51;s.damage(enemy,.1,'hull',undefined,second,'FLECH');assert.equal(enemy.aggressorId,second.id);
 s.damage(enemy,.1,'hull',undefined,s.mounted,'FLECH');assert.equal(enemy.aggressorId,second.id);
});
test('a dead, unoccupied or matching-IFF attacker releases retaliation before the timer expires',()=>{
 for(const invalid of ['dead','unoccupied','iff'] as const){const {s,enemy}=setup(),first=s.units[1],second=s.units[2];
 s.damage(enemy,1,'hull',undefined,first,'FLECH');if(invalid==='dead')first.alive=false;if(invalid==='unoccupied')first.pilot=false;if(invalid==='iff')first.iff=enemy.iff;
 s.damage(enemy,.1,'hull',undefined,second,'FLECH');assert.equal(enemy.aggressorId,second.id);assert.ok(s.time<3);
 }
});

test('IFF editing preserves leading zeroes and reset restores mission IFF without changing allies or vehicle resources',()=>{
 const mission=structuredClone(MISSION_3_3);mission.factionCodes.scorp='1234';const s=new Simulation('Easy',mission),own=s.mounted!,ally=s.units[1],enemy=s.units.find(u=>u.id==='scorp-asv')!;
 const others=s.units.slice(1).map(u=>u.iff);own.parts.leftLeg=.4;own.energy=321;own.slotAmmo[0]=17;
 assert.equal(s.changeIff('0007'),true);assert.equal(s.iff,'0007');assert.equal(own.iff,'0007');assert.deepEqual(s.units.slice(1).map(u=>u.iff),others);
 for(const invalid of ['','123','12345','1280','abcd',' 1234']){assert.equal(s.changeIff(invalid),false);assert.equal(s.iff,'0007');assert.equal(own.iff,'0007');}
 assert.equal(s.changeIff('1234'),true);assert.equal(s.isHostile(enemy),false);assert.equal(s.isHostile(ally),true);assert.equal(s.radioMembers[0].available,true);
 s.resetIff();assert.equal(s.iff,mission.initialIff);assert.equal(own.iff,mission.initialIff);assert.equal(s.isHostile(enemy),true);assert.equal(s.isHostile(ally),false);assert.equal(s.radioMembers[0].available,true);assert.deepEqual(s.units.slice(1).map(u=>u.iff),others);assert.equal(own.parts.leftLeg,.4);assert.equal(own.energy,321);assert.equal(own.slotAmmo[0],17);
});
test('IFF reset uses the selected mission initial code, works on foot and never rewrites a passenger vehicle',()=>{
 const mission=structuredClone(MISSION_3_3);mission.initialIff='0031';const s=new Simulation('Easy',mission);s.changeIff('7777');s.eject('ground');const original=s.units[0].iff;s.resetIff();assert.equal(s.iff,'0031');assert.equal(s.units[0].iff,original);
 s.passenger=s.units[0];const carrierCode=s.passenger.iff;s.changeIff('0012');s.resetIff();assert.equal(s.iff,'0031');assert.equal(s.passenger.iff,carrierCode);
 const retry=new Simulation('Easy',mission);assert.equal(retry.iff,'0031');assert.equal(retry.mounted!.iff,'0031');
});

test('enemy DASY hits the intervening chassis instead of damaging the player behind it, regardless of blocker IFF',async()=>{
 const {makeUnit}=await import('./simulation.ts');
 for(const iff of ['6707','2620']){const s=new Simulation(),own=makeUnit('own','union-sentry',0,0,false),enemy=makeUnit('gunner','merc-tactical',0,120,true,{weapons:['DASY'],speed:0,ai:{detection:300,strafe:0,keepMoving:false,stopDistance:200,missileVolley:1}}),blocker=makeUnit('cover','merc-sentry',0,60,false);s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];s.units=[own,enemy,blocker];s.human={x:0,z:0};s.board();blocker.iff=iff;enemy.yaw=Math.PI;enemy.aim=Math.PI;enemy.alert=true;
  s.tick(.05,idle);assert.equal(own.shield,own.spec.shield);assert.ok(blocker.shield<blocker.spec.shield);const shot=s.events.find(e=>e.type==='shot'&&e.unit===enemy)!;assert.ok(shot);assert.ok(shot.to!.z>55);assert.ok(shot.to!.z<65);
 }
});

test('enemy laser and missile hit a chassis with the shooter IFF instead of passing through to the player',async()=>{
 const {makeUnit}=await import('./simulation.ts');
 for(const weapon of ['RAID','CHUM'] as const){const s=new Simulation(),own=makeUnit('own','union-sentry',0,0,false),enemy=makeUnit('shooter','merc-sentry',0,120,true,{weapons:[weapon],speed:0,ai:{detection:300,strafe:0,keepMoving:false,stopDistance:200,missileVolley:1}}),blocker=makeUnit('cover','merc-sentry',0,55,false);s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];s.units=[own,enemy,blocker];s.human={x:0,z:0};s.board();enemy.yaw=Math.PI;enemy.aim=Math.PI;enemy.alert=true;
  if(weapon==='CHUM'){enemy.cooldown=999;s.fireMissile(enemy,'CHUM',1,{x:0,y:4,z:0});}else{s.tick(.016,idle);enemy.cooldown=999;}
  tick(s,3);assert.equal(own.shield,own.spec.shield,weapon);assert.ok(blocker.shield<blocker.spec.shield,weapon);assert.equal(s.missiles.length,0);assert.ok(s.events.some(e=>e.type==='impact'&&e.weapon===weapon&&e.position!.z>50));
 }
});

test('incoming enemy missiles stop at buildings, cliffs and rocks before reaching the player',async()=>{
 const {makeUnit}=await import('./simulation.ts');
 for(const cover of ['building','cliff','rock'] as const){const s=new Simulation(),own=makeUnit('own','union-sentry',0,0,false),enemy=makeUnit('launcher','merc-sentry',0,120,false);s.units=[own,enemy];s.human={x:0,z:0};s.board();enemy.aim=Math.PI;s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];
  const wall={x:0,z:55,width:20,depth:10,height:20};if(cover==='building')s.mission.base={name:'cover',x:0,z:55,width:20,depth:10,buildings:[wall]};if(cover==='cliff')s.mission.terrain.cliffs=[{id:'cover',...wall}];if(cover==='rock')s.mission.rocks=[{x:0,z:55,r:12}];
  s.fireMissile(enemy,'CHUM',1,{x:0,y:4,z:0});tick(s,3);assert.equal(own.shield,own.spec.shield,cover);assert.equal(s.missiles.length,0);assert.ok(s.events.some(e=>e.type==='impact'&&e.position!.z>45),cover);
 }
});
