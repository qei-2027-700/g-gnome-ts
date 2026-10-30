import type {MissionDefinition} from './types.ts';

// Validate authoring references before constructing a simulation or a briefing.
export function validateMissions(missions:readonly MissionDefinition[]):string[]{
 const errors:string[]=[],catalog=new Set<string>();
 for(const mission of missions){
  const fail=(message:string)=>errors.push(`${mission.id}: ${message}`);
  if(catalog.has(mission.id))fail('duplicate mission ID');catalog.add(mission.id);
  const unique=(values:readonly (string|number)[],label:string)=>{const seen=new Set<string|number>();for(const value of values){if(seen.has(value))fail(`duplicate ${label}: ${value}`);seen.add(value);}return seen;};
  const units=unique(mission.units.map(u=>u.id),'unit ID');
  const waypoints=unique(mission.waypoints.map(w=>w.id),'waypoint ID');
  unique(mission.objectives.map(o=>o.id),'objective ID');
  const people=unique([...mission.units.flatMap(u=>u.personId?[u.personId]:[]),...(mission.personnel??[]).map(p=>p.personId)],'person ID');
  const unitRef=(id:string,label:string)=>{if(!units.has(id))fail(`${label} references missing unit: ${id}`);};
  unitRef(mission.assignedUnitId,'assignedUnitId');
  if(mission.startMountedUnitId)unitRef(mission.startMountedUnitId,'startMountedUnitId');
  if(mission.bgm?.afterEliminate){const cue=mission.bgm.afterEliminate;if(!cue.unitIds.length)fail('BGM afterEliminate has no units');unique(cue.unitIds,'BGM afterEliminate unit ID');for(const id of cue.unitIds)unitRef(id,'BGM afterEliminate');}
  const targets=new Set([...units,...(mission.base?.buildings??[]).map((b,i)=>b.id??`facility-${b.kind??'command'}-${i}`)]);
  const targetRef=(id:string,label:string)=>{if(!targets.has(id))fail(`${label} references missing target: ${id}`);};
  for(const unit of mission.units)if(unit.powerSourceId){const source=mission.base?.buildings.find(b=>b.id===unit.powerSourceId);if(!source||source.kind!=='power-plant')fail(`unit ${unit.id} references missing power plant: ${unit.powerSourceId}`);}
  for(const person of mission.personnel??[]){if(person.facilityId){if(!mission.base?.buildings.some(b=>b.id===person.facilityId))fail(`person ${person.personId} references missing facility: ${person.facilityId}`);}if(person.boardingTargetId)unitRef(person.boardingTargetId,`person ${person.personId}`);if(person.facilityId&&person.boardingTargetId)fail(`person ${person.personId} has conflicting locations`);}
  for(const assault of mission.assaults??[]){unitRef(assault.unitId,'assault');targetRef(assault.targetId,'assault');if(!Number.isFinite(assault.startAt)||assault.startAt<0)fail('assault startAt must be nonnegative');}
  unique((mission.assaults??[]).map(a=>a.unitId),'assault unit ID');
  for(const objective of mission.objectives){
   if(objective.type==='raise-bridge'&&mission.terrain.river?.bridgeId!==objective.bridgeId)fail(`objective ${objective.id} references missing bridge: ${objective.bridgeId}`);
   if(objective.type==='defend'&&objective.untilBridgeId&&mission.terrain.river?.bridgeId!==objective.untilBridgeId)fail(`objective ${objective.id} references missing bridge: ${objective.untilBridgeId}`);
   if(objective.type==='board-unit')unitRef(objective.unitId,`objective ${objective.id}`);
   if(objective.type==='board-player'&&!people.has(objective.personId))fail(`objective ${objective.id} references missing person: ${objective.personId}`);
   if(objective.type==='defend'){if(objective.requiredKills!==undefined&&(!Number.isInteger(objective.requiredKills)||objective.requiredKills<1||objective.requiredKills>objective.attackerIds.length))fail(`objective ${objective.id} has invalid requiredKills`);if(!objective.targetIds.length||!objective.attackerIds.length)fail(`objective ${objective.id} has no defense targets or attackers`);for(const id of objective.targetIds)targetRef(id,`objective ${objective.id}`);for(const id of objective.attackerIds)unitRef(id,`objective ${objective.id}`);}
   if(objective.type==='reach'&&!waypoints.has(objective.waypointId))fail(`objective ${objective.id} references missing waypoint: ${objective.waypointId}`);
   if(objective.type==='eliminate'){if(!objective.unitIds.length)fail(`objective ${objective.id} has no targets`);for(const id of objective.unitIds)unitRef(id,`objective ${objective.id}`);}
   if(objective.type==='lure'){
    unitRef(objective.unitId,`objective ${objective.id}`);
    if(!mission.lures?.some(l=>l.unitId===objective.unitId))fail(`objective ${objective.id} has no lure definition`);
   }
   if(objective.type==='board-faction'){
    if(!objective.personIds.length)fail(`objective ${objective.id} has no people`);
    for(const id of objective.personIds)if(!people.has(id))fail(`objective ${objective.id} references missing person: ${id}`);
   }
  }
  for(const pickup of mission.pickups??[]){if(!people.has(pickup.personId))fail(`pickup references missing person: ${pickup.personId}`);targetRef(pickup.facilityId,'pickup');for(const id of pickup.attackerIds)unitRef(id,'pickup');if(!Number.isInteger(pickup.requiredKills)||pickup.requiredKills<1||pickup.requiredKills>pickup.attackerIds.length)fail('pickup has invalid requiredKills');}
  for(const id of mission.garrison??[])unitRef(id,'garrison');
  for(const b of mission.base?.buildings??[])if(b.bridgeId&&(b.kind!=='bridge-control'||mission.terrain.river?.bridgeId!==b.bridgeId))fail(`facility ${b.id} references missing bridge: ${b.bridgeId}`);
  const companions=mission.companions??[];
  unique(companions.map(c=>c.personId),'companion person ID');unique(companions.map(c=>c.key),'companion key');
  for(const companion of companions){
   if(companion.unitId){unitRef(companion.unitId,`companion ${companion.personId}`);if(mission.units.find(u=>u.id===companion.unitId)?.personId!==companion.personId&&!mission.personnel?.some(p=>p.personId===companion.personId&&p.boardingTargetId===companion.unitId))fail(`companion ${companion.personId} does not match its unit person ID`);}
   else if(companion.facilityId){targetRef(companion.facilityId,`companion ${companion.personId}`);if(!mission.personnel?.some(p=>p.personId===companion.personId&&p.facilityId===companion.facilityId))fail(`companion ${companion.personId} has no facility occupant`);}
   else fail(`companion ${companion.personId} has no starting location`);
  }
  for(const lure of mission.lures??[]){unitRef(lure.unitId,'lure');if(!Number.isInteger(lure.hits)||lure.hits<1)fail('lure hits must be a positive integer');}
  unique((mission.infantrySorties??[]).map(s=>s.id),'infantry sortie ID');
  for(const sortie of mission.infantrySorties??[]){if(!mission.base?.buildings.some(b=>b.id===sortie.facilityId))fail(`infantry sortie ${sortie.id} references missing facility: ${sortie.facilityId}`);if(!Number.isInteger(sortie.count)||sortie.count<1||!Number.isFinite(sortie.delay)||sortie.delay<0||!Number.isFinite(sortie.interval)||sortie.interval<=0||!Number.isFinite(sortie.range)||sortie.range<=0)fail(`infantry sortie ${sortie.id} has invalid count or timing`);}
  unique((mission.radioTriggers??[]).map(r=>r.id),'radio trigger ID');
  for(const trigger of mission.radioTriggers??[])if(!people.has(trigger.speakerId))fail(`radio trigger ${trigger.id} references missing speaker: ${trigger.speakerId}`);
  unique([...mission.units.map(u=>u.id),...(mission.base?.buildings??[]).flatMap(b=>b.id?[b.id]:[])],'selection ID');
  unique((mission.minefields??[]).map(f=>f.id),'minefield ID');
  unique((mission.minefields??[]).flatMap(f=>f.mines.map(m=>m.id)),'mine ID');
  unique((mission.terrain.cliffs??[]).map(c=>c.id),'cliff ID');
  if(mission.completionEnabled!==false&&!mission.objectives.length)fail('enabled mission has no objectives');
  if(!Number.isFinite(mission.terrain.halfWidth)||mission.terrain.halfWidth<=0||!Number.isFinite(mission.terrain.minZ)||!Number.isFinite(mission.terrain.maxZ)||mission.terrain.minZ>=mission.terrain.maxZ)fail('invalid terrain bounds');
  const finitePoint=(point:{x:number;z:number},label:string)=>{if(!Number.isFinite(point.x)||!Number.isFinite(point.z))fail(`${label} has non-finite coordinates`);};
  finitePoint(mission.player,'player');for(const unit of mission.units)finitePoint(unit,`unit ${unit.id}`);
  for(const waypoint of mission.waypoints){finitePoint(waypoint,`waypoint ${waypoint.id}`);if(!(waypoint.radius>0))fail(`waypoint ${waypoint.id} needs a positive radius`);}
  for(const image of [mission.briefingPresentation?.mapPreview,mission.briefingPresentation?.vehiclePreview])if(image&&(!image.src||!(image.width>0)||!(image.height>0)||!/^[-\d.]+\s+[-\d.]+\s+[\d.]+\s+[\d.]+$/.test(image.viewBox)))fail('invalid briefing preview image');
 }
 return errors;
}
