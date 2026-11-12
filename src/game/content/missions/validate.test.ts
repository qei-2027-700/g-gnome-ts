import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MISSIONS} from './index.ts';
import {validateMissions} from './validate.ts';
import {MISSION_3_3} from './mission-3-3.ts';
import {MISSION_3_2} from './mission-3-2.ts';
import {MISSION_3_4} from './mission-3-4.ts';
import {MISSION_3_5} from './mission-3-5.ts';

test('ion strike requires valid targets, radio cues and positive timing',()=>{
 const mission=structuredClone(MISSION_3_5);
 mission.ionStrike={...mission.ionStrike!,facilityId:'missing-laboratory',retreatUnitId:'missing-ally',warningRadioIds:['missing-radio'],delay:0,safeRadius:0};
 const errors=validateMissions([mission]).join('\n');
 for(const expected of ['missing-laboratory','missing-ally','missing-radio','positive range, delay and safe radius'])assert.ok(errors.includes(expected),expected);
});
test('pop-up turrets require their control facility',()=>{
 const mission=structuredClone(MISSION_3_5);
 mission.units=mission.units.map(unit=>unit.id==='popup-turret-1'?{...unit,controlFacilityId:'missing-control'}:unit);
 assert.ok(validateMissions([mission]).join('\n').includes('missing turret control: missing-control'));
});

test('every registered mission has valid identities, references and completion data',()=>{
 assert.deepEqual(validateMissions(MISSIONS),[]);
});
test('3-2 scripted routes and encounter radio require valid units and timing',()=>{
 const mission=structuredClone(MISSION_3_2);
 mission.unitRoutes=[{unitId:'missing-route-unit',x:NaN,z:0,startAt:-1}];
 mission.radioTriggers=[{id:'bad-encounter',event:'encounter',at:-1,range:0,unitIds:['missing-ally'],enemyUnitIds:[],speakerId:'thane',vehicleKind:'union-aip',line:{ja:'',en:''}}];
 const errors=validateMissions([mission]).join('\n');
 for(const expected of ['missing-route-unit','unit route has invalid','missing-ally','needs encounter units','invalid encounter timing'])assert.ok(errors.includes(expected),expected);
});
test('3-2 companion facility routes validate their pilot, target and firing positions',()=>{
 const mission=structuredClone(MISSION_3_2),route=mission.unitRoutes![1]!;
 mission.unitRoutes=[{...route,personId:'missing-pilot',attackTargetIds:['missing-facility'],attackPositions:[]}];
 const errors=validateMissions([mission]).join('\n');
 for(const expected of ['invalid companion','missing-facility','unmatched attack positions'])assert.ok(errors.includes(expected),expected);
});
test('facility IFF disguise requires a bridge control, valid codes and existing vehicles',()=>{
 const mission=structuredClone(MISSION_3_4);
 mission.facilityIffDisguise={facilityId:'missing-control',enemyIff:'9999',footIff:'4033',vehicleIds:['missing-unit']};
 const errors=validateMissions([mission]).join('\n');
 for(const expected of ['missing-control','invalid code','missing-unit'])assert.ok(errors.includes(expected),expected);
});
test('3-4 waypoint arrivals and controlled mines reference existing people and facilities',()=>{
 const mission=structuredClone(MISSION_3_4);
 mission.rendezvous={waypointId:999,units:[{...MISSION_3_4.rendezvous!.units[0]!,personId:'missing-person'}]};
 mission.minefields![0]!.controlFacilityId='missing-mine-control';
 const errors=validateMissions([mission]).join('\n');
 for(const expected of ['missing waypoint','matching companion','missing-mine-control'])assert.ok(errors.includes(expected),expected);
});
test('registered missions do not start units or personnel inside mountain peaks',()=>{
 for(const mission of MISSIONS)for(const [index,peak] of (mission.terrain.peaks??[]).entries())for(const actor of [...mission.units,...(mission.personnel??[])]){
  const radius=Math.hypot((actor.x-peak.x)/(peak.width/2+5),(actor.z-peak.z)/(peak.depth/2+5));
  assert.ok(radius>=1,`${mission.id} peak ${index} encloses ${'id' in actor?actor.id:actor.personId}`);
 }
});
test('catalog validation reports broken references and duplicate identities together',()=>{
 const mission=structuredClone(MISSION_3_3);
 mission.units=[...mission.units,mission.units[0]];
 mission.assignedUnitId='missing-assigned';mission.startMountedUnitId='missing-start';
 mission.objectives=[...mission.objectives,{id:'bad-waypoint',type:'reach',waypointId:999,label:{ja:'test',en:'test'}},{id:'bad-unit',type:'eliminate',unitIds:['missing-enemy'],label:{ja:'test',en:'test'}}];
 mission.companions=[{...mission.companions![0],personId:'missing-person'}];
 const errors=validateMissions([mission,mission]).join('\n');
 for(const expected of ['duplicate mission ID','duplicate unit ID','missing-assigned','missing-start','missing waypoint: 999','missing-enemy','missing-person'])assert.ok(errors.includes(expected),expected);
});
test('invalid authoring data cannot silently create an unfinishable mission',()=>{
 const mission=structuredClone(MISSION_3_3);
 mission.objectives=[{id:'board',type:'board-faction',faction:'scorp',personIds:['unknown'],label:{ja:'test',en:'test'}},{id:'lure',type:'lure',unitId:'unknown',label:{ja:'test',en:'test'}}];
 mission.lures=[{unitId:'unknown',weapon:'VISOM',hits:0}];
 mission.terrain.minZ=mission.terrain.maxZ;mission.units[0].x=NaN;mission.initialYaw=NaN;
 const errors=validateMissions([mission]).join('\n');
 for(const expected of ['missing person: unknown','missing unit: unknown','positive integer','terrain bounds','non-finite coordinates','initialYaw must be finite'])assert.ok(errors.includes(expected),expected);
 mission.objectives=[];assert.ok(validateMissions([mission]).some(e=>e.includes('no objectives')));
 mission.completionEnabled=false;assert.ok(!validateMissions([mission]).some(e=>e.includes('no objectives')));
});

test('defense authoring rejects absent protected targets, attackers, power sources and invalid assault schedules',async()=>{
 const {MISSION_2_6}=await import('./mission-2-6.ts');const def=structuredClone(MISSION_2_6);def.objectives=[{id:'guard',type:'defend',targetIds:['absent-citadel'],attackerIds:['absent-raider'],label:{ja:'防衛',en:'Defend'}}];def.units=[{...def.units[0],powerSourceId:'absent-plant'},...def.units.slice(1)];def.assaults=[{unitId:'absent-raider',targetId:'absent-citadel',startAt:-1}];
 const errors=validateMissions([def]).join('\n');for(const expected of ['absent-citadel','absent-raider','absent-plant','startAt'])assert.ok(errors.includes(expected));
});

test('infantry sorties reject a missing source facility and invalid timing',()=>{
 const mission=structuredClone(MISSION_3_3);mission.infantrySorties=[{id:'bad-sortie',facilityId:'missing-room',vehicleKind:'scorp-asv',range:0,count:0,delay:-1,interval:0}];const errors=validateMissions([mission]).join('\n');assert.ok(errors.includes('missing-room'));assert.ok(errors.includes('invalid count or timing'));
});

test('4-2 occupation and garrison references are validated',async()=>{
 const {MISSION_4_2}=await import('./mission-4-2.ts');const mission=structuredClone(MISSION_4_2);mission.garrison=['missing-guard'];mission.objectives=[{id:'board',type:'board-unit',unitId:'missing-tower',label:{ja:'搭乗',en:'Board'}}];
 const errors=validateMissions([mission]).join('\n');assert.ok(errors.includes('missing-guard'));assert.ok(errors.includes('missing-tower'));
});

test('river paths need multiple finite points inside the mission bounds',async()=>{
 const {MISSION_4_2}=await import('./mission-4-2.ts');const mission=structuredClone(MISSION_4_2);
 mission.terrain.river!.path=[{x:0,z:0}];assert.ok(validateMissions([mission]).some(error=>error.includes('river path needs at least two points')));
 mission.terrain.river!.path=[{x:0,z:0},{x:mission.terrain.halfWidth+1,z:0}];assert.ok(validateMissions([mission]).some(error=>error.includes('river path point 2 is outside terrain bounds')));
});


test('elimination BGM rejects an empty roster, duplicate IDs and absent enemies',()=>{
 const mission=structuredClone(MISSION_3_3);mission.bgm!.afterEliminate={unitIds:[],trackId:'next'};assert.ok(validateMissions([mission]).some(e=>e.includes('BGM afterEliminate has no units')));
 mission.bgm!.afterEliminate.unitIds=['missing','missing'];const errors=validateMissions([mission]).join('\n');assert.ok(errors.includes('duplicate BGM afterEliminate unit ID'));assert.ok(errors.includes('BGM afterEliminate references missing unit: missing'));
});

test('catalog validation always reports an assigned unit reference absent from the mission',()=>{
 for(let index=0;index<64;index++){
  const mission=structuredClone(MISSION_3_3);mission.assignedUnitId=`missing-unit-${index}`;
  assert.ok(validateMissions([mission]).length>0,mission.assignedUnitId);
 }
});

test('Codex content rules document all three content-addition templates',async()=>{
 const {readFile}=await import('node:fs/promises');
 const rules=await readFile(new URL('../../../../docs/technical/codex-rules.md',import.meta.url),'utf8');
 for(const section of ['機体追加のプロンプトテンプレート','ミッション追加のプロンプトテンプレート','既存ミッションのマップ拡張テンプレート'])assert.ok(rules.includes(section),section);
});
