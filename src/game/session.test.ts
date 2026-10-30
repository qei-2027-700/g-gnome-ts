import {test} from 'node:test';
import assert from 'node:assert/strict';
import {advanceSimulation,resolveMissionPanel} from './session.ts';
import {missionBriefing} from './presentation/mission-briefing.ts';
import {missionMap,missionMapObjectives} from './presentation/mission-map.ts';
import {Simulation,type Input} from './simulation/simulation.ts';
import {MISSION} from './content/mission-1-1.ts';
import {MISSIONS} from './content/missions/index.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
test('B map keeps throttle, missiles, damage and recharge live; settings and P freeze them',()=>{
 const s=new Simulation();s.human={...MISSION.vehicle};s.board();s.throttle=.4;s.mounted!.laserCharge=0;
 const enemy=s.units[1];enemy.x=0;enemy.z=110;enemy.cooldown=999;s.fireMissile(enemy,'CHUM');
 const initial=s.player.z;for(let i=0;i<90;i++)advanceSimulation(s,'map',1/60,idle);
 assert.ok(s.time>1);assert.ok(s.player.z>initial);assert.ok(s.mounted!.shield<35);assert.equal(s.mounted!.laserCharge,1);
 s.fireMissile(enemy,'CHUM');const before=JSON.stringify({time:s.time,player:s.player,missiles:s.missiles});
 for(const panel of ['pause','settings'])for(let i=0;i<90;i++)assert.equal(advanceSimulation(s,panel,1/60,idle),0);
 assert.equal(JSON.stringify({time:s.time,player:s.player,missiles:s.missiles}),before);
 advanceSimulation(s,null,.05,idle);assert.ok(s.time>1.5);
});

test('mission briefing and its settings keep the selected mission untouched until launch',()=>{
 for(const mission of MISSIONS){
  const sim=new Simulation('Medium',mission);
  const before=JSON.stringify({player:sim.player,units:sim.units,objectives:sim.objectiveStates});
  const heldInput={...idle,forward:true,fire1:true,fire2:true};
  for(const panel of ['briefing','settings','briefing'])for(let i=0;i<120;i++)assert.equal(advanceSimulation(sim,panel,1/60,heldInput),0);
  assert.equal(sim.time,0);
  assert.equal(JSON.stringify({player:sim.player,units:sim.units,objectives:sim.objectiveStates}),before);
  advanceSimulation(sim,null,1/60,idle);
  assert.equal(sim.mission.id,mission.id);
  assert.ok(sim.time>0);
 }
});

test('active missions cannot return to the launch console; results can return to mission selection',()=>{
 assert.equal(resolveMissionPanel(null,false,false),'briefing');
 assert.equal(resolveMissionPanel('settings',false,false),'settings');
 assert.equal(resolveMissionPanel('briefing',true,false),'map');
 assert.equal(resolveMissionPanel('map',true,false),'map');
 assert.equal(resolveMissionPanel('settings',true,false),'settings');
 assert.equal(resolveMissionPanel('briefing',true,true),'briefing');
});
test('pre-launch briefing and live map share content panels but never share launch controls or artwork',()=>{
 for(const mission of MISSIONS)for(const locale of ['ja','en'] as const){
  const sim=new Simulation('Easy',mission),briefing=missionBriefing(mission,MISSIONS,locale),map=missionMap(sim,locale);
  for(const component of ['mission-map-panel','mission-preview-panel','mission-objective-list']){assert.ok(briefing.includes(component));assert.ok(map.includes(component));}
  assert.ok(briefing.includes('data-action="start"'));assert.ok(briefing.includes('id="missionSelect"'));
  for(const forbidden of ['LAUNCH','mission-console','console-reference','data-action="start"','id="missionSelect"','data-action="newMission"','data-review='])assert.ok(!map.includes(forbidden),forbidden);
  assert.ok(map.includes('data-action="close"'));assert.ok(map.includes('id="map"'));assert.ok(map.includes('id="mapObjectives"'));
 }
});
test('live map objectives reflect current progress rather than reference-image checkmarks',()=>{
 const sim=new Simulation();const before=missionMapObjectives(sim,'en');assert.ok(!before.includes('data-complete="true"'));
 sim.reachedWaypoints.add(1);const after=missionMapObjectives(sim,'en');assert.ok(after.includes('data-complete="true"'));assert.ok(after.includes('Reach waypoint one'));
 assert.ok(!after.includes('Destroy Scorp Depot'));
});

test('Merc 2-4 starts in its assigned Tactical HAWC, preserves ammo through reboarding and resets on retry without inventing completion',async()=>{
 const {MISSION_2_4}=await import('./content/missions/mission-2-4.ts');const s=new Simulation('Easy',MISSION_2_4);
 assert.ok(MISSIONS.includes(MISSION_2_4));assert.equal(s.mounted?.kind,'merc-tactical');assert.equal(s.iff,'5031');assert.equal(s.mounted!.iff,'5031');
 const unit=s.mounted!,initial=unit.ammunition.SAG5T!;s.tick(.05,{...idle,fire2:true});assert.ok(unit.ammunition.SAG5T!<initial);const remaining=unit.ammunition.SAG5T;
 s.eject();s.flight=null;s.human={x:unit.x,z:unit.z};s.board();assert.equal(s.mounted,unit);assert.equal(unit.ammunition.SAG5T,remaining);
 for(let i=0;i<120;i++)advanceSimulation(s,null,1/60,idle);assert.equal(s.status,'running');assert.ok(missionMap(s,'ja').includes('原作の敵配置・任務目標は未確認'));
 const retry=new Simulation('Easy',MISSION_2_4);assert.equal(retry.mounted?.ammunition.SAG5T,initial);assert.equal(retry.iff,'5031');assert.equal(new Simulation().mission.id,'1-1');
});

test('briefing artwork and review text follow mission data rather than a mission ID',async()=>{
 const {MISSION_3_3}=await import('./content/missions/mission-3-3.ts');
 const {briefingDetail}=await import('./presentation/mission-briefing.ts');
 const copy=structuredClone(MISSION_3_3);copy.id='future-mission';
 const original=missionBriefing(MISSION_3_3,[MISSION_3_3],'ja');
 const copied=missionBriefing(copy,[copy],'ja');
 assert.equal(copied,original.replaceAll('3-3','future-mission'));
 assert.equal(briefingDetail(copy,0,'ja'),briefingDetail(MISSION_3_3,0,'ja'));
 copy.briefingPresentation=undefined;
 const generic=missionBriefing(copy,[copy],'ja');
 assert.ok(!generic.includes('Ur-Ulit terrain preview'));
 assert.ok(generic.includes(copy.objectives[0].label.ja));
 assert.equal(briefingDetail(copy,0,'ja'),copy.objectives[0].label.ja);
});

test('menu exit confirmation pauses the game without launching or aborting the selected mission',()=>{
 const sim=new Simulation();const before=JSON.stringify(sim.units);
 assert.equal(resolveMissionPanel('exit',false,false),'exit');
 assert.equal(advanceSimulation(sim,'exit',1/60,idle),0);assert.equal(JSON.stringify(sim.units),before);
 assert.equal(resolveMissionPanel('briefing',false,false),'briefing');
});

test('a successful sortie freezes for a silent completion sequence and returns to the same fresh mission console',async()=>{
 const {MissionCompletion,COMPLETION_TIMING,missionCompletionMarkup}=await import('./presentation/mission-completion.ts');
 const def=structuredClone(MISSIONS.find(m=>m.id==='1-1')!);def.units=[{id:'own',kind:'union-sentry',x:0,z:0,pilot:false},{id:'target',kind:'merc-sentry',x:0,z:80,pilot:false}];def.assignedUnitId='own';def.startMountedUnitId='own';def.objectives=[{id:'destroy',type:'eliminate',unitIds:['target'],label:{ja:'Target',en:'Target'}}];def.companions=[];def.rocks=[];def.base=undefined;def.minefields=[];def.terrain.cliffs=[];def.completionEnabled=true;
 const s=new Simulation('Easy',def),before=missionBriefing(def,[def],'ja'),target=s.units[1];target.shield=0;for(const key of Object.keys(target.parts))target.parts[key as keyof typeof target.parts]=.00001;
 s.lookBy(s.targetElevation(target));s.fire(1);s.tick(.01,idle);assert.equal(s.status,'won');assert.equal(s.events.filter(e=>e.type==='win').length,1);
 const completion=new MissionCompletion();assert.equal(completion.start(),true);assert.equal(completion.start(),false);const time=s.time;advanceSimulation(s,'completion',1,idle);assert.equal(s.time,time);
 assert.equal(completion.step(COMPLETION_TIMING.view),false);assert.equal(completion.closure,0);completion.step(COMPLETION_TIMING.closing/2);assert.ok(Math.abs(completion.closure-.5)<1e-8);assert.equal(completion.step(COMPLETION_TIMING.closing/2),false);assert.ok(Math.abs(completion.closure-1)<1e-8);assert.equal(completion.step(COMPLETION_TIMING.closed+.001),true);assert.equal(completion.step(1),false);
 const reset=new Simulation('Easy',def);assert.equal(resolveMissionPanel('briefing',false,false),'briefing');assert.equal(missionBriefing(reset.mission,[def],'ja'),before);assert.equal(reset.status,'running');assert.equal(reset.time,0);assert.ok(reset.units.every(u=>u.alive));assert.ok(missionCompletionMarkup().includes('MISSION COMPLETE'));assert.ok(missionCompletionMarkup().includes('completion-door-top'));assert.ok(missionCompletionMarkup().includes('completion-door-bottom'));
 completion.start();assert.equal(completion.closure,0);completion.cancel();assert.equal(completion.active,false);
});


test('abort confirmation keeps combat and time live while rejecting every player control',()=>{
 const s=new Simulation();s.human={...MISSION.vehicle};s.board();s.throttle=.4;s.mounted!.laserCharge=0;
 const enemy=s.units[1];enemy.x=0;enemy.z=110;enemy.cooldown=999;s.fireMissile(enemy,'CHUM');
 const initial=s.player.z,yaw=s.yaw,pitch=s.pitch;
 const held:Input={forward:true,back:true,left:true,right:true,boost:true,stop:true,fire1:true,fire2:true,fire3:true,fire4:true,lookUp:true,lookDown:true,center:true};
 for(let i=0;i<90;i++)advanceSimulation(s,'abort',1/60,held);
 assert.ok(s.time>1);assert.ok(s.player.z>initial);assert.ok(s.mounted!.shield<35);assert.equal(s.mounted!.laserCharge,1);
 assert.equal(s.yaw,yaw);assert.equal(s.pitch,pitch);assert.equal(s.throttle,.4);assert.ok(!s.events.some(e=>e.type==='shot'&&e.unit===s.mounted));
 advanceSimulation(s,null,.05,{...idle,right:true,fire1:true});assert.notEqual(s.yaw,yaw);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===s.mounted));
});

test('abort confirmation can reach success or death; all endings freeze, close doors once and reset',async()=>{
 const {MissionCompletion,COMPLETION_TIMING,missionCompletionMarkup}=await import('./presentation/mission-completion.ts');
 for(const result of ['complete','failed','aborted'] as const){
  const s=new Simulation();
  if(result==='complete'){s.mission={...s.mission,completionEnabled:true,objectives:[{id:'reach',type:'reach',waypointId:1,label:{ja:'到達',en:'Reach'}}]};s.reachedWaypoints.add(1);advanceSimulation(s,'abort',.05,idle);assert.equal(s.status,'won');assert.equal(s.events.filter(e=>e.type==='win').length,1);}
  if(result==='failed'){
   const enemy=s.units[1];s.human={x:enemy.x,z:enemy.z};enemy.cooldown=999;
   for(let i=0;i<120&&s.status==='running';i++)advanceSimulation(s,'abort',1/60,idle);
   assert.equal(s.status,'lost');assert.equal(s.events.filter(e=>e.type==='lose').length,1);
  }
  const completion=new MissionCompletion();assert.equal(completion.start(result),true);assert.equal(completion.start('complete'),false);assert.equal(completion.result,result);
  const before=JSON.stringify({time:s.time,units:s.units,missiles:s.missiles});
  for(let i=0;i<100;i++)assert.equal(advanceSimulation(s,'completion',.05,{...idle,forward:true,fire1:true}),0);
  assert.equal(JSON.stringify({time:s.time,units:s.units,missiles:s.missiles}),before);
  const markup=missionCompletionMarkup(completion.result);assert.ok(markup.includes({complete:'MISSION COMPLETE',failed:'MISSION FAILED',aborted:'MISSION ABORTED'}[result]));assert.ok(markup.includes('completion-door-top'));assert.ok(markup.includes('completion-door-bottom'));
  completion.step(COMPLETION_TIMING.view);assert.equal(completion.closure,0);completion.step(COMPLETION_TIMING.closing);assert.ok(Math.abs(completion.closure-1)<1e-8);assert.equal(completion.step(COMPLETION_TIMING.closed+.001),true);assert.equal(completion.step(1),false);
  const fresh=new Simulation(s.difficulty,s.mission);assert.equal(fresh.mission.id,s.mission.id);assert.equal(fresh.time,0);assert.equal(fresh.status,'running');assert.equal(advanceSimulation(fresh,'briefing',.05,idle),0);
 }
});

test('door impact occurs once at contact for every ending and resets on restart or cancellation',async()=>{
 const {MissionCompletion,COMPLETION_TIMING}=await import('./presentation/mission-completion.ts');
 const completion=new MissionCompletion(),contact=COMPLETION_TIMING.view+COMPLETION_TIMING.closing;
 for(const result of ['complete','failed','aborted'] as const){
  completion.start(result);assert.equal(completion.takeDoorImpact(),false);
  completion.step(contact-.01);assert.ok(completion.closure<1);assert.equal(completion.takeDoorImpact(),false);
  completion.step(.02);assert.equal(completion.closure,1);assert.equal(completion.takeDoorImpact(),true);assert.equal(completion.takeDoorImpact(),false);
  completion.step(.1);assert.equal(completion.takeDoorImpact(),false);
  assert.equal(completion.step(1),true);assert.equal(completion.takeDoorImpact(),false);
 }
 completion.start();assert.equal(completion.step(100),true);assert.equal(completion.takeDoorImpact(),true);assert.equal(completion.takeDoorImpact(),false);
 completion.start();completion.step(contact+.01);completion.cancel();assert.equal(completion.takeDoorImpact(),false);
 completion.start();completion.step(contact+.01);assert.equal(completion.takeDoorImpact(),true);
});
