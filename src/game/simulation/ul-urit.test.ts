import {MACHINE_GUNS,weaponMountCount} from '../content/weapons.ts';
import {test} from 'node:test';import assert from 'node:assert/strict';import {Simulation,makeUnit,distance,type Input} from './simulation.ts';import {MISSION_3_3} from '../content/missions/mission-3-3.ts';import {crossesBuilding,buildingContact} from './battlefield.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};const step=(s:Simulation,n:number,input=idle)=>{for(let i=0;i<n;i++)s.tick(1/60,input);};
test('3-3 base lies beyond red minefield, with two functional towers and three empty Scorp HAWCs',()=>{const s=new Simulation('Easy',MISSION_3_3);assert.ok(s.mission.base!.x<s.mission.minefields![0].x-s.mission.minefields![0].width/2);assert.equal(s.units.filter(u=>u.kind==='scorp-rocket-tower').length,2);assert.deepEqual(s.mission.base!.buildings.map(b=>b.kind),['command','mine-control']);assert.ok(s.units.filter(u=>u.kind==='scorp-rocket-tower').every(u=>u.x>Math.max(...s.mission.base!.buildings.map(b=>b.x))));assert.equal(s.units.filter(u=>u.kind==='scorp-sentry'&&!u.pilot).length,1);assert.equal(s.units.filter(u=>u.kind==='scorp-tactical'&&!u.pilot).length,2);assert.ok(s.mines.length>70);assert.equal(new Simulation().mines.length,0);assert.equal(new Simulation().mission.base,undefined);
 const tower=s.units.find(u=>u.spec.category==='tower')!;s.units=[s.mounted!,tower];s.mounted!.x=tower.x;s.mounted!.z=tower.z-210;const at={x:tower.x,z:tower.z};step(s,180);assert.deepEqual({x:tower.x,z:tower.z},at);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===tower));s.damage(tower,9999);assert.equal(s.soldiers.length,1);assert.equal(s.soldiers[0].sourceVehicle,tower.id);assert.equal(s.soldiers[0].faction,'scorp');
});
test('mines detonate once on swept vehicle movement; detector reveals mines without immunity; retry restores them',()=>{for(const kind of ['union-asv','scorp-asv'] as const){const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind,x:0,z:0,pilot:false}];def.startMountedUnitId='own';def.minefields=[{id:'test',x:0,z:0,width:30,depth:30,triggerRadius:2,mines:[{id:'one',x:0,z:3}]}];const s=new Simulation('Easy',def);assert.equal(s.detectedMines.length,kind==='scorp-asv'?1:0);s.tick(.05,{...idle,boost:true});assert.equal(s.mines[0].spent,true);assert.equal(s.status,'running');assert.ok(s.flight);assert.equal(s.soldiers.length,0);assert.equal(s.events.filter(e=>e.type==='mine').length,1);step(s,10);assert.equal(s.events.filter(e=>e.type==='mine').length,1);assert.equal(new Simulation('Easy',def).mines[0].spent,false);}}
);
test('empty base vehicles and unoccupied rocket towers can be boarded',()=>{const s=new Simulation('Easy',MISSION_3_3);s.eject('ground');const parked=s.units.find(u=>u.id==='base-sentry')!;s.human={x:parked.x,z:parked.z};assert.ok(s.board());assert.equal(s.mounted!.kind,'scorp-sentry');const t=new Simulation('Easy',MISSION_3_3),tower=t.units.find(u=>u.spec.category==='tower')!;t.eject('ground');tower.pilot=false;t.human={x:tower.x,z:tower.z};assert.equal(t.board(),true);assert.equal(t.mounted,tower);assert.equal(t.forceEject(tower),null);});
test('TCREAP consumes ammunition and launches a moving tracer instead of instant damage',()=>{const s=new Simulation('Easy',MISSION_3_3);s.units=s.units.slice(0,1);const target=makeUnit('target','scorp-asv',0,70,false);s.units.push(target);s.lookBy(s.targetElevation(target));s.tick(1/60,{...idle,fire1:true});assert.equal(s.mounted!.ammunition.TCREAP,299);assert.equal(s.mounted!.energy,800);assert.equal(target.shield,24);const bolt=s.missiles.find(p=>p.weapon==='TCREAP')!;assert.ok(Math.abs(Math.hypot(bolt.vx,bolt.vy,bolt.vz)-60)<1e-8);step(s,90);assert.ok(target.shield<24);});
test('building collision blocks ground movement and bullets but permits shots over the roof',()=>{const b={x:0,z:10,width:6,depth:6,height:10};assert.ok(crossesBuilding({x:0,z:0},{x:0,z:30},b));assert.ok(buildingContact({x:0,y:3,z:0},{x:0,y:3,z:30},b)!<1);assert.equal(buildingContact({x:0,y:30,z:0},{x:0,y:30,z:30},b),null);});

test('a vehicle cannot skip a mine by crossing its entire trigger circle in one frame',()=>{const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind:'union-asv',x:0,z:-8,pilot:false}];def.startMountedUnitId='own';def.minefields=[{id:'sweep',x:0,z:0,width:30,depth:30,triggerRadius:2,mines:[{id:'one',x:0,z:0}]}];const s=new Simulation('Easy',def);s.speed=400;s.throttle=1;s.tick(.05,idle);assert.equal(s.status,'running');assert.ok(s.flight);assert.ok(s.mines[0].spent);});

test('TCREAP hits on a dismounted player deal projectile damage rather than missile instant death',()=>{const s=new Simulation();const enemy=makeUnit('enemy','union-asv',0,80,true,{faction:'scorp',weapons:['TCREAP'],ai:{detection:180,strafe:0,keepMoving:false,stopDistance:60,missileVolley:1}});enemy.iff='scorp';enemy.yaw=Math.PI;enemy.aim=Math.PI;s.units=[enemy];s.human={x:0,z:0};s.tick(1/60,idle);assert.ok(s.missiles.some(p=>p.weapon==='TCREAP'));assert.equal(s.humanHealth,100);step(s,90);assert.equal(s.humanHealth,100-MACHINE_GUNS.TCREAP.damage*weaponMountCount(enemy.kind,'TCREAP'));assert.equal(s.status,'running');});

test('friendly AI follows across a mine without detonating or consuming it, including a captured Scorp chassis',()=>{
 for(const kind of ['union-sentry','scorp-asv'] as const){
  const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind:'union-asv',x:0,z:80,pilot:false},{id:'kylie',kind,x:0,z:-12,pilot:true,personId:'kylie',iff:def.initialIff}];def.startMountedUnitId='own';def.minefields=[{id:'crossing',x:0,z:0,width:30,depth:30,triggerRadius:2,mines:[{id:'one',x:0,z:0}]}];def.rocks=[];const s=new Simulation('Easy',def),ally=s.units[1];assert.deepEqual(s.sendAllyOrder('kylie','follow').accepted,['kylie']);
  step(s,180);assert.ok(ally.z>10);assert.ok(ally.alive&&ally.pilot);assert.equal(s.mines[0].spent,false);assert.equal(s.events.filter(e=>e.type==='mine').length,0);
  // Ignoring the ally leaves the mine active for the player.
  s.mounted!.x=0;s.mounted!.z=0;s.tick(1/60,idle);assert.equal(s.mines[0].spent,true);assert.equal(s.status,'running');assert.ok(s.flight);
 }
});
test('NPC infantry never triggers or consumes mines, even after an IFF change',()=>{
 const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind:'union-asv',x:0,z:80,pilot:false},{id:'kylie',kind:'union-sentry',x:0,z:0,pilot:true,personId:'kylie'}];def.startMountedUnitId='own';def.minefields=[{id:'foot',x:0,z:0,width:30,depth:30,triggerRadius:2,mines:[{id:'one',x:0,z:0}]}];const s=new Simulation('Easy',def),person=s.forceEject(s.units[1],'destruction')!;person.flight=null;s.tick(1/60,idle);assert.equal(s.mines[0].spent,false);assert.equal(person.alive,true);assert.equal(person.health,35);
 person.iff='7777';s.tick(1/60,idle);assert.equal(s.mines[0].spent,false);assert.equal(person.alive,true);assert.equal(person.health,35);assert.equal(s.status,'running');
});

test('rocket tower cannot fire or consume ammo inside minimum range, and resumes when the target leaves it',()=>{
 const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind:'union-asv',x:0,z:0,pilot:false},{id:'tower',kind:'scorp-rocket-tower',x:0,z:30,pilot:true}];def.startMountedUnitId='own';def.minefields=[];def.base=undefined;def.rocks=[];
 const s=new Simulation('Easy',def),tower=s.units[1],ammo=tower.ammo;tower.yaw=Math.PI;tower.aim=Math.PI;step(s,180);
 assert.equal(tower.ammo,ammo);assert.equal(s.events.filter(e=>e.type==='shot'&&e.unit===tower).length,0);assert.equal(tower.x,0);assert.equal(tower.z,30);
 s.mounted!.z=-30;step(s,180);assert.ok(tower.ammo<ammo);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===tower));
 const remaining=tower.ammo;s.events=[];s.missiles=[];s.mounted!.z=0;step(s,180);assert.equal(tower.ammo,remaining);assert.equal(s.events.filter(e=>e.type==='shot'&&e.unit===tower).length,0);
});
test('rocket tower minimum range includes its boundary and applies to infantry targets',()=>{
 for(const range of [39.9,40]){const def=structuredClone(MISSION_3_3);delete def.startMountedUnitId;def.player={x:0,z:0};def.units=[{id:'tower',kind:'scorp-rocket-tower',x:0,z:range,pilot:true}];def.minefields=[];def.base=undefined;def.rocks=[];const s=new Simulation('Easy',def),tower=s.units[0];tower.yaw=Math.PI;tower.aim=Math.PI;s.tick(1/60,idle);assert.equal(s.events.some(e=>e.type==='shot'&&e.unit===tower),range===40);}
});

test('lethal missile impact ejects a living tower operator once; empty towers eject nobody',()=>{
 for(const occupied of [true,false]){
  const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind:'scorp-asv',x:0,z:0,pilot:false},{id:'tower',kind:'scorp-rocket-tower',x:0,z:90,pilot:occupied}];def.startMountedUnitId='own';def.minefields=[];def.base=undefined;def.rocks=[];
  const s=new Simulation('Easy',def),tower=s.units[1];tower.cooldown=999;tower.shield=0;for(const key of Object.keys(tower.parts) as (keyof typeof tower.parts)[])tower.parts[key]=.001;
  s.selected=tower.id;s.lookBy(s.targetElevation(tower));s.tick(1/60,{...idle,fire3:true});step(s,80);assert.equal(tower.alive,false);assert.equal(tower.pilot,false);assert.equal(s.soldiers.length,occupied?1:0);
  if(occupied){const person=s.soldiers[0];assert.equal(person.faction,'scorp');assert.equal(person.iff,tower.iff);assert.equal(person.sourceVehicle,tower.id);assert.equal(person.alive,true);assert.equal(person.flight,null);s.damage(tower,9999);assert.equal(s.events.filter(e=>e.type==='pilot-eject'&&e.unit===tower).length,1);step(s,240);assert.equal(person.flight,null);assert.equal(person.alive,true);}
 }
});


test('3-3 launch layout has Sheridan in a distinct Union Tactical on the left, and the base and enemy approach off the left flank',()=>{
 const s=new Simulation('Easy',MISSION_3_3),sheridan=s.radioMembers.find(m=>m.personId==='sheridan')!.unit!;
 assert.equal(sheridan.kind,'union-tactical');assert.equal(sheridan.spec.faction,'union');assert.ok(sheridan.x<s.player.x&&sheridan.z>s.player.z);assert.ok(Math.cos(sheridan.yaw)<0);
 assert.equal(s.radioMembers.find(m=>m.personId==='kylie')!.unit!.kind,'union-sentry');assert.ok(s.units.find(u=>u.id==='thane')!.x>s.player.x);
 assert.ok(s.mission.base!.x<s.player.x-500);assert.ok(Math.abs(s.mission.base!.z-s.player.z)<100);
 const enemy=s.units.find(u=>u.id==='scorp-asv')!;assert.ok(enemy.x<s.player.x-200);assert.ok(Math.abs(enemy.z)<100);assert.ok(Math.abs(Math.atan2(enemy.x-s.player.x,enemy.z-s.player.z))>Math.PI/3);
 const before=s.units.map(u=>({id:u.id,x:u.x,z:u.z,yaw:u.yaw}));step(s,120);assert.deepEqual(s.units.map(u=>({id:u.id,x:u.x,z:u.z,yaw:u.yaw})),before);
 assert.deepEqual(new Simulation('Easy',MISSION_3_3).units.map(u=>({id:u.id,x:u.x,z:u.z,yaw:u.yaw})),before);
});
test('left launch cliff blocks ground travel, sight and physical missiles, while paths around its ends remain open',()=>{
 const s=new Simulation('Easy',MISSION_3_3),cliff=s.mission.terrain.cliffs![0],u=s.mounted!;s.units=[u];s.mines=[];
 const right={x:cliff.x+cliff.width/2+5,z:cliff.z},left={x:cliff.x-cliff.width/2-5,z:cliff.z};
 assert.equal(s.lineOfSight(right,left),false);assert.equal(s.lineOfSight({...right,z:cliff.z-cliff.depth},{...left,z:cliff.z-cliff.depth}),true);
 Object.assign(u,right);s.move(u,-Math.PI/2,cliff.width+10);assert.ok(u.x>=cliff.x+cliff.width/2+2);assert.ok(u.x<right.x);assert.equal(u.z,right.z);
 u.aim=-Math.PI/2;s.fireMissile(u,'TCROCK',1,{...left,y:3});assert.equal(s.missiles.length,1);step(s,120);assert.equal(s.missiles.length,0);assert.ok(s.events.some(e=>e.type==='impact'));
});

test('base approach encounters a close tower pair before the command and mine-control facilities',()=>{
 const s=new Simulation('Easy',MISSION_3_3),towers=s.units.filter(u=>u.kind==='scorp-rocket-tower'),facilities=s.facilities;
 assert.equal(facilities.length,2);assert.ok(towers.every(t=>facilities.every(f=>t.x>f.x)));assert.ok(Math.abs(towers[0].z-towers[1].z)<=120);
 assert.ok(facilities.find(f=>f.facilityType==='command')!.z<facilities.find(f=>f.facilityType==='mine-control')!.z);
});
test('Q, E and Tab select real facilities, preserve sight at the front face and exclude them from infantry and vehicle combat',()=>{
 const s=new Simulation('Easy',MISSION_3_3),command=s.facilities.find(f=>f.facilityType==='command')!,control=s.facilities.find(f=>f.facilityType==='mine-control')!;
 s.units=[s.mounted!];s.mounted!.x=-700;s.mounted!.z=command.z;s.mounted!.yaw=-Math.PI/2;s.mounted!.aim=-Math.PI/2;s.pitch=s.targetElevation(command);
 assert.equal(s.selectInCrosshair(),command);assert.equal(s.target,command);assert.equal(s.targetState!.inSight,true);assert.equal(s.targetState!.onAim,true);
 assert.ok(!s.combatTargets.some(t=>t.id===command.id));assert.equal(s.sendAllyOrder('all','attack').error,'target');assert.equal(s.sendAllyOrder('all','board').error,'target');
 s.mounted!.z=control.z;s.pitch=s.targetElevation(control);assert.equal(s.selectInCrosshair(),control);s.selectTarget();assert.equal(s.target,control);
 s.clearTarget();const ids=new Set<string>();for(let i=0;i<2;i++){s.cycleTarget();ids.add(s.target!.id);}assert.deepEqual(ids,new Set([command.id,control.id]));
 s.tracking=true;s.tick(.01,idle);assert.ok(s.targetState);assert.ok(s.mounted);assert.equal(new Simulation('Easy',MISSION_3_3).target,null);
});

for(const kind of ['scorp-rocket-tower','scorp-asv','merc-sentry'] as const)test(`destroyed ${kind} ${kind==='scorp-rocket-tower'?'retains solid fixed wreck':'allows passage through its fire'}`,()=>{
 const s=new Simulation(),own=s.units[0],obstacle=makeUnit('obstacle',kind,0,0,false);s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];s.units=[own,obstacle];own.x=0;own.z=-20;s.human={x:0,z:-20};s.damage(obstacle,9999);assert.equal(obstacle.alive,false);
 s.move(own,0,40);const parkedX=own.x;own.x=40;s.move(s.human,0,40);own.x=parkedX;
 if(kind==='scorp-rocket-tower'){assert.ok(own.z<-6);assert.ok(own.z>-20);assert.ok(s.human.z<-6);assert.ok(s.human.z>-20);assert.ok(s.terrainObstacles.some(b=>b.x===0&&b.z===0));}
 else{assert.equal(own.z,20);assert.equal(s.human.z,20);assert.equal(s.terrainObstacles.length,0);}
});
test('tower wreck intercepts a low missile after destruction without reactivating the tower',()=>{
 const s=new Simulation(),own=s.units[0],tower=makeUnit('wreck','scorp-rocket-tower',0,0,false);s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];own.x=0;own.z=-20;s.units=[own,tower];s.mounted=own;own.pilot=true;s.damage(tower,9999);
 const p=s.fireMissile(own,'CHUM');p.y=1;step(s,30);assert.ok(!s.missiles.includes(p));const impact=s.events.find(e=>e.type==='impact'&&e.projectileId===p.id)!;assert.ok(impact.position!.z<0);assert.equal(tower.alive,false);assert.equal(tower.pilot,false);
});


test('Kylie tower warning fires once when Scorp ASV reaches the base, never from another chassis or a paused briefing',async()=>{
 const {advanceSimulation}=await import('../session.ts');
 const s=new Simulation('Easy',MISSION_3_3),base=s.mission.base!,scorp=s.units.find(u=>u.id==='scorp-asv')!;
 s.units=s.units.filter(u=>u===s.mounted||u===scorp||u.personId==='kylie');s.mines=[];
 s.mounted!.x=base.x+340;s.mounted!.z=base.z;s.tick(.01,idle);assert.equal(s.events.filter(e=>e.type==='mission-radio').length,0);
 s.eject('ground');scorp.pilot=false;scorp.x=base.x+351;scorp.z=base.z;s.human={x:scorp.x,z:scorp.z};assert.ok(s.board());s.tick(.01,idle);assert.equal(s.events.filter(e=>e.type==='mission-radio').length,0);
 scorp.x=base.x+349;advanceSimulation(s,'settings',.01,idle);assert.equal(s.events.filter(e=>e.type==='mission-radio').length,0);
 s.tick(.01,idle);const events=s.events.filter(e=>e.type==='mission-radio');assert.equal(events.length,1);assert.equal(events[0].radioId,'kylie-tower-warning');assert.equal(events[0].text,undefined);
 scorp.x=base.x+450;s.tick(.01,idle);scorp.x=base.x+340;s.tick(.01,idle);assert.equal(s.events.filter(e=>e.type==='mission-radio').length,1);
 const cue=s.mission.radioTriggers![0];assert.equal(cue.speakerId,'kylie');assert.equal(cue.line.ja,'タワーはパワーアップしてやがるぜ');
 const retry=new Simulation('Easy',MISSION_3_3),carrier=retry.units.find(u=>u.kind==='scorp-asv')!;retry.mounted!.pilot=false;retry.mounted=carrier;carrier.iff=retry.iff;carrier.x=base.x+349;carrier.z=base.z;retry.mines=[];retry.tick(.01,idle);assert.equal(retry.events.filter(e=>e.type==='mission-radio').length,1);
});

test('tower operator clears its solid wreck, lands visibly outside it, attacks and is targeted by an ally',()=>{
 const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind:'union-asv',x:0,z:0,pilot:false},{id:'kylie',personId:'kylie',kind:'union-sentry',x:-20,z:0,pilot:true},{id:'tower',kind:'scorp-rocket-tower',x:0,z:65,yaw:0,pilot:true}];def.assignedUnitId='own';def.startMountedUnitId='own';def.companions=[{personId:'kylie',unitId:'kylie',key:'F2',name:{ja:'キリー',en:'Kylie'}}];def.minefields=[];def.base=undefined;def.rocks=[];def.terrain.cliffs=[];
 const s=new Simulation('Easy',def),tower=s.units[2];s.damage(tower,9999);const soldier=s.soldiers[0];step(s,300);
 assert.equal(soldier.flight,null);assert.equal(soldier.alive,true);assert.ok(Math.abs(soldier.x)>7);assert.ok(s.events.some(e=>e.type==='shot'&&e.soldier===soldier));assert.ok(s.events.some(e=>e.type==='shot'&&e.unit?.personId==='kylie'));assert.ok(soldier.health<35);
});

test('3-3 Scorp ASV boarding automatically follows the player regardless of selected target, once per boarding',()=>{
 const s=new Simulation('Easy',MISSION_3_3);s.mission.terrain.cliffs=[];s.mission.rocks=[];
 const carrier=s.units.find(u=>u.kind==='scorp-asv')!,enemy=s.units.find(u=>u.kind==='scorp-rocket-tower')!;
 s.eject('ground');carrier.pilot=false;carrier.x=0;carrier.z=180;s.human={x:carrier.x,z:carrier.z};s.selected=enemy.id;s.events=[];
 assert.ok(s.board());assert.equal(s.mounted,carrier);assert.equal(s.selected,enemy.id);
 const allies=s.radioMembers.map(m=>m.unit!).filter(Boolean);assert.equal(allies.length,3);for(const ally of allies)assert.deepEqual(ally.order,{kind:'follow'});
 const order=s.events.filter(e=>e.type==='ally-order'&&e.command==='follow');assert.equal(order.length,1);assert.equal(order[0].targetId,undefined);assert.equal(order[0].recipients!.length,3);
 const ally=allies[0],before=distance(ally,s.player);step(s,180);assert.ok(distance(ally,s.player)<before);
 s.sendAllyOrder('all','hold');step(s,30);for(const ally of allies)assert.equal(ally.order,null);
 s.eject('ground');s.human={x:carrier.x,z:carrier.z};assert.ok(s.board());for(const ally of allies)assert.deepEqual(ally.order,{kind:'follow'});
});
test('automatic boarding follow is mission data and does not trigger on Union ASV or another mission',()=>{
 const s=new Simulation('Easy',MISSION_3_3);for(const ally of s.radioMembers)assert.equal(ally.unit?.order,null);
 const mission=structuredClone(MISSION_3_3);mission.id='other';mission.autoFollowOnBoard=undefined;const other=new Simulation('Easy',mission),carrier=other.units.find(u=>u.kind==='scorp-asv')!;
 other.eject('ground');carrier.pilot=false;other.human={x:carrier.x,z:carrier.z};assert.ok(other.board());for(const ally of other.radioMembers)assert.equal(ally.unit?.order,null);
});

test('3-3 minefield discovery warns only aboard Union ASV, once at the area boundary; retry resets it',async()=>{
 const {advanceSimulation}=await import('../session.ts');
 for(const mode of ['union-asv','scorp-asv','foot','passenger'] as const){
  const def=structuredClone(MISSION_3_3),field=def.minefields![0],edge=field.x+field.width/2+field.warningRange!;def.units=[{id:'own',kind:mode==='scorp-asv'?'scorp-asv':'union-asv',x:mode==='foot'?edge+100:edge+1,z:field.z,pilot:false}];def.assignedUnitId='own';def.startMountedUnitId=mode==='foot'?undefined:'own';def.player={x:edge+1,z:field.z};def.companions=[];def.base=undefined;def.rocks=[];def.terrain.cliffs=[];
  const s=new Simulation('Easy',def);if(mode==='passenger'){s.eject('ground');s.flight=null;const u=s.units[0];u.pilot=true;u.iff=s.iff;s.human={x:u.x,z:u.z};assert.ok(s.board());assert.equal(s.passenger,u);}
  s.tick(.01,idle);assert.equal(s.events.some(e=>e.type==='minefield-found'),false);
  (s.mounted??s.passenger??s.human).x=edge;advanceSimulation(s,'pause',.05,idle);assert.equal(s.events.some(e=>e.type==='minefield-found'),false);s.tick(.01,idle);
  const expected=mode==='union-asv'||mode==='passenger'?1:0,warnings=s.events.filter(e=>e.type==='minefield-found');assert.equal(warnings.length,expected,mode);if(mode==='foot')assert.equal(s.mounted,null);if(expected)assert.equal(warnings[0].minefieldId,field.id);assert.equal(s.events.some(e=>e.type==='mine'),false);
  (s.mounted??s.passenger??s.human).x=edge+10;s.tick(.01,idle);(s.mounted??s.passenger??s.human).x=edge;s.tick(.01,idle);assert.equal(s.events.filter(e=>e.type==='minefield-found').length,expected);
  const retry=new Simulation('Easy',def);(retry.mounted??retry.human).x=edge;retry.tick(.01,idle);assert.equal(retry.events.filter(e=>e.type==='minefield-found').length,expected);
  if(mode==='scorp-asv'){s.eject('ground');s.flight=null;const union=makeUnit('union-reboard','union-asv',edge,field.z,false);s.units=[union];s.human={x:edge,z:field.z};assert.ok(s.board());s.tick(.01,idle);assert.equal(s.events.filter(e=>e.type==='minefield-found').length,1);}
 }
 const other=new Simulation();other.tick(.01,idle);assert.equal(other.events.some(e=>e.type==='minefield-found'),false);
 const exhausted=new Simulation('Easy',MISSION_3_3);exhausted.mines.forEach(m=>m.spent=true);exhausted.mounted!.x=-430;exhausted.tick(.01,idle);assert.equal(exhausted.events.some(e=>e.type==='minefield-found'),false);
});


test('enemy mine immunity ends when the player captures and pilots the same Scorp ASV',()=>{
 const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind:'union-asv',x:0,z:80,pilot:false},{id:'enemy',kind:'scorp-asv',x:0,z:0,pilot:true}];def.startMountedUnitId='own';def.base=undefined;def.rocks=[];def.minefields=[{id:'test',x:0,z:0,width:30,depth:30,triggerRadius:2,mines:[{id:'one',x:0,z:0}]}];
 const s=new Simulation('Easy',def),enemy=s.units[1];enemy.cooldown=999;
 for(const iff of ['enemy',s.iff]){enemy.iff=iff;s.tick(1/60,idle);assert.equal(enemy.alive,true);assert.equal(enemy.armor,100);assert.equal(s.mines[0].spent,false);}
 s.eject('ground');enemy.pilot=false;s.human={x:enemy.x,z:enemy.z};assert.ok(s.board());assert.equal(s.mounted,enemy);s.tick(1/60,idle);assert.equal(s.mines[0].spent,true);assert.equal(enemy.alive,false);assert.equal(s.events.filter(e=>e.type==='mine').length,1);
});


function entryScenario(){
 const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind:'union-asv',x:0,z:-80,pilot:false},{id:'tower',kind:'scorp-rocket-tower',x:-30,z:20,pilot:false}];def.startMountedUnitId='own';def.minefields=[];def.rocks=[];def.companions=[];def.lures=[];def.terrain.cliffs=[];def.completionEnabled=false;
 def.base={name:'entry-test',x:0,z:30,width:100,depth:100,buildings:[{id:'command',kind:'command',x:0,z:30,width:10,depth:10,height:8},{id:'generator',kind:'shield-generator',x:20,z:30,width:8,depth:8,height:6,health:7},{id:'sweep',kind:'sweep-turret',x:40,z:30,width:6,depth:6,height:4}]};
 const s=new Simulation('Easy',def);s.eject('ground');s.human={x:0,z:0};return s;
}
test('a live shield generator blocks enemy facilities and rocket towers until actual rifle fire destroys it',()=>{
 const s=entryScenario(),command=s.facilities[0],generator=s.facilities[1],tower=s.units[1];s.human={x:6,z:30};assert.equal(s.canBoard(command),false);assert.equal(s.board(),false);
 s.human={x:tower.x,z:tower.z};assert.equal(s.canBoard(tower),false);
 s.human={x:20,z:0};s.humanYaw=0;s.pitch=0;s.fire(1);assert.equal(generator.alive,false);assert.equal(s.events.filter(e=>e.type==='destroy'&&e.facility===generator).length,1);
 s.human={x:6,z:30};s.humanHealth=73;s.eggerAmmo=3;assert.ok(s.board());assert.equal(s.insideFacility,command);assert.equal(command.pilot,true);assert.equal(s.mounted,null);assert.equal(s.eyeHeight,command.height*.65);
 const shots=s.events.filter(e=>e.type==='shot').length,pos={...s.player};step(s,60,{...idle,forward:true,right:true,boost:true,fire1:true,fire2:true});assert.deepEqual(s.player,pos);assert.equal(s.events.filter(e=>e.type==='shot').length,shots);assert.equal(s.humanHealth,73);assert.equal(s.eggerAmmo,3);
 s.eject();assert.equal(s.insideFacility,null);assert.equal(command.pilot,false);assert.ok(s.human.x>command.x+command.width/2+4);s.tick(.01,idle);assert.equal(s.insideFacility,null);
 s.human={x:tower.x,z:tower.z};assert.ok(s.board());assert.equal(s.mounted,tower);const before={x:tower.x,z:tower.z,yaw:tower.yaw};step(s,30,{...idle,forward:true,right:true,boost:true});assert.deepEqual({x:tower.x,z:tower.z,yaw:tower.yaw},before);assert.equal(s.speed,0);
});
test('all generators must be destroyed; sweep turrets and occupied or destroyed buildings stay inaccessible',()=>{
 const s=entryScenario(),command=s.facilities[0],generator=s.facilities[1],sweep=s.facilities[2];s.facilities.push({...generator,id:'second-generator'});
 s.damageFacility(generator,7,{x:generator.x,y:1,z:generator.z});s.human={x:6,z:30};assert.equal(s.canBoard(command),false);
 s.damageFacility(s.facilities[3],7,{x:20,y:1,z:30});assert.equal(s.canBoard(command),true);command.pilot=true;assert.equal(s.canBoard(command),false);command.pilot=false;
 s.human={x:sweep.x+sweep.width/2+1,z:sweep.z};assert.equal(s.canBoard(sweep),false);assert.equal(s.board(),false);
 s.human={x:6,z:30};assert.ok(s.board());s.damageFacility(command,999,{x:0,y:1,z:30});assert.equal(s.insideFacility,null);assert.equal(command.alive,false);assert.equal(s.status,'running');assert.equal(s.canBoard(command),false);
});
test('gas clears a rocket tower for entry while generator protection remains independent of its shield charge',()=>{
 const s=entryScenario(),tower=s.units[1];s.facilities=[];s.mission.base=undefined;tower.x=0;tower.z=60;tower.pilot=true;tower.cooldown=999;s.human={x:0,z:0};s.humanYaw=0;s.pitch=Math.atan2(7-s.eyeHeight,60);
 s.mission.footSecondaryWeapon='GASHR';
 s.fire(2);step(s,90);assert.equal(tower.pilot,false);assert.equal(tower.shield,tower.spec.shield);assert.equal(s.soldiers.length,1);
 s.human={x:0,z:56.1};assert.ok(s.board());assert.equal(s.mounted,tower);assert.equal(tower.alive,true);
});

test('Sheridan greets Gant once on piloting a Scorp ASV, not as a passenger, and retry restores the cue',()=>{
 const prepare=()=>{const s=new Simulation('Easy',MISSION_3_3);s.mission.completionEnabled=false;s.mines=[];s.eject('ground');const asv=s.units.find(u=>u.id==='scorp-asv')!;asv.pilot=false;asv.x=s.mission.base!.x+400;asv.z=0;s.human={x:asv.x,z:asv.z};s.events=[];return {s,asv};};
 const {s,asv}=prepare();assert.ok(s.board());assert.equal(s.mounted,asv);assert.equal(s.events.filter(e=>e.radioId==='sheridan-scorp-boarded').length,1);
 s.eject('ground');s.human={x:asv.x,z:asv.z};assert.ok(s.board());assert.equal(s.events.filter(e=>e.radioId==='sheridan-scorp-boarded').length,1);
 const passenger=prepare();passenger.asv.pilot=true;passenger.asv.iff=passenger.s.iff;assert.ok(passenger.s.board());assert.equal(passenger.s.mounted,null);assert.equal(passenger.s.events.filter(e=>e.radioId==='sheridan-scorp-boarded').length,0);
 const unavailable=prepare();unavailable.s.units=unavailable.s.units.filter(u=>u.personId!=='sheridan');assert.ok(unavailable.s.board());assert.equal(unavailable.s.events.filter(e=>e.radioId==='sheridan-scorp-boarded').length,0);
 const retry=prepare();assert.ok(retry.s.board());assert.equal(retry.s.events.filter(e=>e.radioId==='sheridan-scorp-boarded').length,1);
 const cue=s.mission.radioTriggers!.find(r=>r.id==='sheridan-scorp-boarded')!;assert.equal(cue.line.ja,'よーしガンツ。お前がよーく見えるぞー。先導してくれ');
});
test('Scorp ASV base approach warns about infantry once and releases Scorp soldiers one by one; pause freezes the schedule',async()=>{
 const {advanceSimulation}=await import('../session.ts');const s=new Simulation('Easy',MISSION_3_3),base=s.mission.base!;
 s.mission.completionEnabled=false;s.mines=[];const towers=s.units.filter(u=>u.spec.category==='tower');assert.equal(towers.length,2);assert.ok(towers.every(u=>u.pilot));assert.equal(s.soldiers.length,0);s.units=s.units.filter(u=>u.spec.category!=='tower');
 s.mounted!.x=base.x+270;s.tick(.01,idle);assert.equal(s.events.filter(e=>e.radioId==='sheridan-infantry-warning').length,0);assert.equal(s.soldiers.length,0);
 s.eject('ground');const asv=s.units.find(u=>u.id==='scorp-asv')!;asv.pilot=false;asv.x=base.x+281;asv.z=base.z;s.human={x:asv.x,z:asv.z};assert.ok(s.board());s.tick(.01,idle);assert.equal(s.events.filter(e=>e.radioId==='sheridan-infantry-warning').length,0);
 asv.x=base.x+279;s.tick(.05,idle);assert.equal(s.events.filter(e=>e.radioId==='sheridan-infantry-warning').length,1);
 for(let i=0;i<200;i++)advanceSimulation(s,'settings',.05,idle);assert.equal(s.soldiers.filter(p=>p.id.startsWith('sortie-')).length,0);
 step(s,179);assert.equal(s.soldiers.filter(p=>p.id.startsWith('sortie-')).length,0);step(s,1);const first=s.soldiers.find(p=>p.id.startsWith('sortie-'))!;assert.ok(first);assert.equal(first.faction,'scorp');assert.equal(first.iff,'scorp');assert.equal(first.flight,null);assert.equal(first.insideFacility,undefined);assert.equal(first.health,35);
 step(s,479);assert.equal(s.soldiers.filter(p=>p.id.startsWith('sortie-')).length,1);step(s,1);assert.equal(s.soldiers.filter(p=>p.id.startsWith('sortie-')).length,2);step(s,480);assert.equal(s.soldiers.filter(p=>p.id.startsWith('sortie-')).length,3);assert.equal(new Set(s.soldiers.filter(p=>p.id.startsWith('sortie-')).map(p=>`${p.x}/${p.z}`)).size,3);step(s,200);assert.equal(s.soldiers.filter(p=>p.id.startsWith('sortie-')).length,3);assert.equal(s.events.filter(e=>e.radioId==='sheridan-infantry-warning').length,1);
 const retry=new Simulation('Easy',MISSION_3_3);assert.equal(retry.soldiers.filter(p=>p.id.startsWith('sortie-')).length,0);
});
test('destroyed command facility cannot release additional infantry',()=>{
 const s=new Simulation('Easy',MISSION_3_3);s.mission.completionEnabled=false;s.mines=[];s.eject('ground');const asv=s.units.find(u=>u.id==='scorp-asv')!;asv.pilot=false;asv.x=s.mission.base!.x+270;asv.z=0;s.human={x:asv.x,z:asv.z};s.board();s.tick(.05,idle);s.facilities.find(f=>f.id==='ul-urit-command')!.alive=false;step(s,450);assert.equal(s.soldiers.filter(p=>p.id.startsWith('sortie-')).length,0);
});
