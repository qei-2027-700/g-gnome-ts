import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MISSIONS} from './index.ts';
import {validateMissions} from './validate.ts';
import {MISSION_3_3} from './mission-3-3.ts';

test('every registered mission has valid identities, references and completion data',()=>{
 assert.deepEqual(validateMissions(MISSIONS),[]);
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
 mission.terrain.minZ=mission.terrain.maxZ;mission.units[0].x=NaN;
 const errors=validateMissions([mission]).join('\n');
 for(const expected of ['missing person: unknown','missing unit: unknown','positive integer','terrain bounds','non-finite coordinates'])assert.ok(errors.includes(expected),expected);
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


test('elimination BGM rejects an empty roster, duplicate IDs and absent enemies',()=>{
 const mission=structuredClone(MISSION_3_3);mission.bgm!.afterEliminate={unitIds:[],trackId:'next'};assert.ok(validateMissions([mission]).some(e=>e.includes('BGM afterEliminate has no units')));
 mission.bgm!.afterEliminate.unitIds=['missing','missing'];const errors=validateMissions([mission]).join('\n');assert.ok(errors.includes('duplicate BGM afterEliminate unit ID'));assert.ok(errors.includes('BGM afterEliminate references missing unit: missing'));
});
