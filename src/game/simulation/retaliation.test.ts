import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,distance,type Input} from './simulation.ts';
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
test('a dead or unoccupied attacker releases retaliation, while matching IFF retains the attacker',()=>{
 for(const invalid of ['dead','unoccupied'] as const){const {s,enemy}=setup(),first=s.units[1],second=s.units[2];
 s.damage(enemy,1,'hull',undefined,first,'FLECH');if(invalid==='dead')first.alive=false;if(invalid==='unoccupied')first.pilot=false;
 s.damage(enemy,.1,'hull',undefined,second,'FLECH');assert.equal(enemy.aggressorId,second.id);assert.ok(s.time<3);
 }
 const {s,enemy}=setup(),first=s.units[1],second=s.units[2];s.damage(enemy,1,'hull',undefined,first,'FLECH');first.iff=enemy.iff;s.damage(enemy,.1,'hull',undefined,second,'FLECH');assert.equal(enemy.aggressorId,first.id);
});
test('a disguised player can provoke weapon fire from the original enemy',()=>{
 const {s,enemy}=setup();s.mounted!.x=0;s.mounted!.z=245;enemy.z=300;enemy.yaw=enemy.aim=Math.PI;enemy.iff='1234';
 assert.ok(s.changeIff(enemy.iff));tick(s,.1);assert.equal(enemy.alert,false);
 s.damage(enemy,2,'hull',undefined,s.mounted,'RAID');assert.equal(enemy.aggressorId,'player');tick(s,3);
 assert.ok(s.events.some(event=>event.type==='shot'&&event.unit===enemy));
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

test('a low shot inside a boulder footprint stops, and guidance does not steer around the boulder',()=>{
 const covered=new Simulation();
 covered.mission.rocks=[{x:0,z:40,r:6}];covered.mission.base=undefined;covered.mission.terrain.cliffs=[];covered.mission.terrain.peaks=[];
 const enemy=makeUnit('launcher','scorp-asv',0,-30,false);covered.units=[enemy];covered.human={x:12.4,z:80};
 // y=0.2 crosses the disk but stays outside the sphere of radius r centered at 0.55r.
 const missile=covered.fireMissile(enemy,'SREM',1,{x:covered.human.x,y:.2,z:covered.human.z});
 const speed=Math.hypot(12.4,80);
 missile.x=0;missile.y=.2;missile.z=0;missile.vx=12.4/speed*110;missile.vy=0;missile.vz=80/speed*110;
 tick(covered,2);
 assert.equal(covered.humanHealth,100);
 assert.equal(covered.missiles.length,0);
 const impact=covered.events.find(e=>e.type==='impact'&&e.weapon==='SREM');
 assert.ok(impact?.position);assert.ok(impact.position.z>30&&impact.position.z<55);assert.ok(Math.hypot(impact.position.x,impact.position.z-40)<8);
 const open=new Simulation();
 open.mission.rocks=[];open.mission.base=undefined;open.mission.terrain.cliffs=[];open.mission.terrain.peaks=[];
 const shooter=makeUnit('launcher','scorp-asv',0,-30,false);open.units=[shooter];open.human={x:12.4,z:80};
 const shot=open.fireMissile(shooter,'SREM',1,{x:open.human.x,y:.2,z:open.human.z});
 shot.x=0;shot.y=.2;shot.z=0;shot.vx=missile.vx;shot.vy=0;shot.vz=missile.vz;
 tick(open,2);
 assert.ok(open.humanHealth<100);
 const beside=new Simulation();
 beside.mission.rocks=[{x:0,z:40,r:12}];beside.mission.base=undefined;beside.mission.terrain.cliffs=[];beside.mission.terrain.peaks=[];
 const guide=makeUnit('guide','scorp-asv',0,-40,false);beside.units=[guide];beside.human={x:0,z:70};
 const passing=beside.fireMissile(guide,'SREM',1,{x:beside.human.x,y:1,z:beside.human.z});
 passing.x=-20;passing.y=1;passing.z=10;passing.vx=0;passing.vy=0;passing.vz=110;passing.homingTargetId='player';
 beside.tick(1/60,idle);assert.equal(passing.homingTargetId,undefined);
 tick(beside,1);assert.equal(beside.humanHealth,100);assert.ok(beside.missiles.length===1);assert.ok(Math.abs(beside.missiles[0].x+20)<1);
 const shadow=new Simulation();
 shadow.mission.rocks=[{x:0,z:30,r:12}];shadow.mission.base=undefined;shadow.mission.terrain.cliffs=[];shadow.mission.terrain.peaks=[];
 const gunner=makeUnit('gunner','scorp-asv',0,0,true,{speed:0,ai:{detection:300,strafe:0,keepMoving:false,stopDistance:800,missileVolley:1}});
 shadow.units=[gunner];shadow.human={x:0,z:46};gunner.yaw=gunner.aim=0;gunner.alert=true;
 tick(shadow,4);assert.equal(shadow.humanHealth,100);
 // Reproduced graze: closest approach 12.44 m on an r=12 rock. The extra meter stops it.
 // The same shooter with the player about 16 m off that axis still connects.
 const graze=new Simulation();
 graze.mission.rocks=[{x:-40,z:530,r:12}];graze.mission.base=undefined;graze.mission.terrain.cliffs=[];graze.mission.terrain.peaks=[];
 const grazer=makeUnit('grazer','scorp-asv',-90,500,false);graze.units=[grazer];graze.human={x:-25.95,z:542};
 assert.equal(graze.lineOfSight({x:-90,z:544},{x:graze.human.x,z:graze.human.z}),false);
 const grazed=graze.fireMissile(grazer,'SREM',1,{x:graze.human.x,y:1.2,z:graze.human.z});
 const gdx=-25.95-(-90),gdz=542-544,glen=Math.hypot(gdx,gdz);
 grazed.x=-90;grazed.y=1.2;grazed.z=544;grazed.vx=gdx/glen*110;grazed.vy=0;grazed.vz=gdz/glen*110;grazed.homingTargetId='player';
 tick(graze,2);assert.equal(graze.humanHealth,100);assert.equal(graze.missiles.length,0);
 const grazeImpact=graze.events.find(e=>e.type==='impact'&&e.weapon==='SREM');
 assert.ok(grazeImpact?.position);assert.ok(Math.hypot(grazeImpact.position.x+40,grazeImpact.position.z-530)<14);
 const flank=new Simulation();
 flank.mission.rocks=[{x:-40,z:530,r:12}];flank.mission.base=undefined;flank.mission.terrain.cliffs=[];flank.mission.terrain.peaks=[];
 const flanker=makeUnit('flanker','scorp-asv',-90,500,false);flank.units=[flanker];flank.human={x:-25.95,z:546};
 assert.equal(flank.lineOfSight({x:-90,z:544},{x:flank.human.x,z:flank.human.z}),true);
 const flanked=flank.fireMissile(flanker,'SREM',1,{x:flank.human.x,y:1.2,z:flank.human.z});
 const fdx=-25.95-(-90),fdz=546-544,flen=Math.hypot(fdx,fdz);
 flanked.x=-90;flanked.y=1.2;flanked.z=544;flanked.vx=fdx/flen*110;flanked.vy=0;flanked.vz=fdz/flen*110;flanked.homingTargetId='player';
 tick(flank,2);assert.ok(flank.humanHealth<100);
});
test('incoming enemy missiles stop at buildings, cliffs, rocks and mountains before reaching the player',async()=>{
 const {makeUnit}=await import('./simulation.ts');
 for(const cover of ['building','cliff','rock','peak'] as const){const s=new Simulation(),own=makeUnit('own','union-sentry',0,0,false),enemy=makeUnit('launcher','merc-sentry',0,120,false);s.units=[own,enemy];s.human={x:0,z:0};s.board();enemy.aim=Math.PI;s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[];
  const wall={x:0,z:55,width:20,depth:10,height:20};if(cover==='building')s.mission.base={name:'cover',x:0,z:55,width:20,depth:10,buildings:[wall]};if(cover==='cliff')s.mission.terrain.cliffs=[{id:'cover',...wall}];if(cover==='rock')s.mission.rocks=[{x:0,z:55,r:12}];
  if(cover==='peak')s.mission.terrain.peaks=[{x:0,z:55,width:60,depth:60,height:50}];
  s.fireMissile(enemy,'CHUM',1,{x:0,y:4,z:0});tick(s,3);assert.equal(own.shield,own.spec.shield,cover);assert.equal(s.missiles.length,0);assert.ok(s.events.some(e=>e.type==='impact'&&e.position!.z>45),cover);
 }
});
test('enemy AI does not fire through a mountain peak',()=>{
 const s=new Simulation(),own=makeUnit('own','union-sentry',0,0,false),enemy=makeUnit('mountain-gunner','merc-tactical',0,120,true,{weapons:['DASY'],speed:0,ai:{detection:300,strafe:0,keepMoving:false,stopDistance:200,missileVolley:1}});s.units=[own,enemy];s.human={x:0,z:0};s.board();s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.terrain.peaks=[{x:0,z:60,width:60,depth:60,height:65}];enemy.yaw=enemy.aim=Math.PI;enemy.alert=true;
 for(let i=0;i<60;i++)s.tick(1/60,idle);
 assert.equal(s.events.filter(e=>e.type==='shot'&&e.unit===enemy).length,0);assert.equal(own.shield,own.spec.shield);
});
