import type {MissionDefinition} from './types.ts';

// Validate authoring references before constructing a simulation or a briefing.
export function validateMissions(missions:readonly MissionDefinition[]):string[]{
 const errors:string[]=[],catalog=new Set<string>();
 for(const mission of missions){
  const fail=(message:string)=>errors.push(`${mission.id}: ${message}`);
  if(catalog.has(mission.id))fail('duplicate mission ID');catalog.add(mission.id);
  const unique=(values:readonly (string|number)[],label:string)=>{const seen=new Set<string|number>();for(const value of values){if(seen.has(value))fail(`duplicate ${label}: ${value}`);seen.add(value);}return seen;};
  const allUnits=[...mission.units,...(mission.rendezvous?.units??[])];
  const units=unique(allUnits.map(u=>u.id),'unit ID');
  const waypoints=unique(mission.waypoints.map(w=>w.id),'waypoint ID');
  unique(mission.objectives.map(o=>o.id),'objective ID');
  const people=unique([...allUnits.flatMap(u=>u.personId?[u.personId]:[]),...(mission.personnel??[]).map(p=>p.personId)],'person ID');
  if(mission.rendezvous){const meeting=mission.rendezvous;if(!waypoints.has(meeting.waypointId))fail(`rendezvous references missing waypoint: ${meeting.waypointId}`);if(!meeting.units.length)fail('rendezvous needs units');for(const unit of meeting.units)if(!unit.personId||!mission.companions?.some(member=>member.personId===unit.personId&&member.unitId===unit.id))fail(`rendezvous unit lacks matching companion: ${unit.id}`);}
  if(mission.vehicleElevator){const e=mission.vehicleElevator;if(![e.x,e.z,e.width,e.depth].every(Number.isFinite)||e.width<=0||e.depth<=0)fail('invalid vehicle elevator');}
  if(mission.shieldProtectionRadius!==undefined&&(!Number.isFinite(mission.shieldProtectionRadius)||mission.shieldProtectionRadius<=0))fail('invalid shield protection radius');
  const unitRef=(id:string,label:string)=>{if(!units.has(id))fail(`${label} references missing unit: ${id}`);};
  unitRef(mission.assignedUnitId,'assignedUnitId');
  if(mission.startMountedUnitId)unitRef(mission.startMountedUnitId,'startMountedUnitId');
  if(mission.bgm?.afterEliminate){const cue=mission.bgm.afterEliminate;if(!cue.unitIds.length)fail('BGM afterEliminate has no units');unique(cue.unitIds,'BGM afterEliminate unit ID');for(const id of cue.unitIds)unitRef(id,'BGM afterEliminate');}
  if(mission.bgm?.afterRadio&&!mission.radioTriggers?.some(trigger=>trigger.id===mission.bgm?.afterRadio?.radioId))fail(`BGM afterRadio references missing radio: ${mission.bgm.afterRadio.radioId}`);
  const targets=new Set([...units,...(mission.base?.buildings??[]).map((b,i)=>b.id??`facility-${b.kind??'command'}-${i}`)]);
  if(mission.facilityIffDisguise){const disguise=mission.facilityIffDisguise;
   if(!mission.base?.buildings.some(b=>b.id===disguise.facilityId&&b.kind==='bridge-control'))fail(`IFF disguise references missing bridge control: ${disguise.facilityId}`);
   if(!/^[0-7]{4}$/.test(disguise.enemyIff)||!/^[0-7]{4}$/.test(disguise.footIff))fail('IFF disguise has invalid code');
   if(!disguise.vehicleIds.length)fail('IFF disguise has no vehicles');
   unique(disguise.vehicleIds,'IFF disguise vehicle ID');for(const id of disguise.vehicleIds)unitRef(id,'IFF disguise');
  }
  const targetRef=(id:string,label:string)=>{if(!targets.has(id))fail(`${label} references missing target: ${id}`);};
  for(const unit of allUnits)if(unit.powerSourceId){const source=mission.base?.buildings.find(b=>b.id===unit.powerSourceId);if(!source||source.kind!=='power-plant')fail(`unit ${unit.id} references missing power plant: ${unit.powerSourceId}`);}
  for(const unit of allUnits)if(unit.controlFacilityId){const source=mission.base?.buildings.find(b=>b.id===unit.controlFacilityId);if(!source||source.kind!=='popup-turret-control')fail(`unit ${unit.id} references missing turret control: ${unit.controlFacilityId}`);}
  for(const person of mission.personnel??[]){if(person.facilityId){if(!mission.base?.buildings.some(b=>b.id===person.facilityId))fail(`person ${person.personId} references missing facility: ${person.facilityId}`);}if(person.boardingTargetId)unitRef(person.boardingTargetId,`person ${person.personId}`);if(person.facilityId&&person.boardingTargetId)fail(`person ${person.personId} has conflicting locations`);if(person.follow&&(person.facilityId||person.boardingTargetId))fail(`person ${person.personId} cannot follow from another location`);if(person.follow&&(person.faction||person.iff))fail(`person ${person.personId} cannot follow from another faction`);if(person.iff!==undefined&&person.iff==='')fail(`person ${person.personId} has an empty IFF`);}
  for(const id of mission.autoPassengerOnBoard??[])unitRef(id,'auto passenger');
  unique(mission.autoPassengerOnBoard??[],'auto passenger unit ID');
  if(mission.passengerIff){const rule=mission.passengerIff;unitRef(rule.unitId,'passenger IFF');if(!/^[0-7]{4}$/.test(rule.iff))fail('passenger IFF has invalid code');}
  for(const assault of mission.assaults??[]){unitRef(assault.unitId,'assault');targetRef(assault.targetId,'assault');if(!Number.isFinite(assault.startAt)||assault.startAt<0)fail('assault startAt must be nonnegative');if(assault.engageRange!==undefined&&(!Number.isFinite(assault.engageRange)||assault.engageRange<=0))fail('assault engageRange must be positive');}
  unique((mission.unitRoutes??[]).map(route=>route.unitId),'unit route ID');
  for(const route of mission.unitRoutes??[]){unitRef(route.unitId,'unit route');if(route.personId&&!mission.companions?.some(member=>member.personId===route.personId&&member.unitId===route.unitId))fail(`unit route ${route.unitId} has invalid companion`);if(![route.x,route.z,route.startAt,...(route.via??[]).flatMap(point=>[point.x,point.z]),...(route.attackPositions??[]).flatMap(point=>[point.x,point.z])].every(Number.isFinite)||route.startAt<0)fail('unit route has invalid coordinates or startAt');if(route.attackPositions?.length!==undefined&&route.attackPositions.length!==route.attackTargetIds?.length)fail(`unit route ${route.unitId} has unmatched attack positions`);for(const id of route.attackTargetIds??[])targetRef(id,'unit route');}
  unique((mission.groundShields??[]).map(shield=>shield.id),'ground shield ID');
  for(const shield of mission.groundShields??[]){if(!mission.base?.buildings.some(b=>b.id===shield.powerPlantId&&b.kind==='power-plant'))fail(`ground shield ${shield.id} references missing power plant`);if(![shield.x,shield.z,shield.width,shield.depth,shield.height].every(Number.isFinite)||shield.width<=0||shield.depth<=0||shield.height<=0)fail(`ground shield ${shield.id} has invalid dimensions`);}
  for(const supply of mission.supplies??[]){if(!waypoints.has(supply.waypointId))fail(`supply references missing waypoint: ${supply.waypointId}`);if(supply.kind==='shield-doubler'&&(!Number.isFinite(supply.duration)||supply.duration<=0))fail('shield doubler duration must be positive');}
  unique((mission.supplies??[]).map(s=>s.waypointId),'supply waypoint ID');
  if(mission.airSupport){unitRef(mission.airSupport.unitId,'air support');if(mission.units.find(u=>u.id===mission.airSupport?.unitId)?.pilot!==false)fail('air support unit must start unoccupied');}
  unique((mission.assaults??[]).map(a=>a.unitId),'assault unit ID');
  for(const objective of mission.objectives){
   if((objective.type==='raise-bridge'||objective.type==='lower-bridge')&&![mission.terrain.river,...mission.terrain.rivers??[]].some(r=>r?.bridgeId===objective.bridgeId))fail(`objective ${objective.id} references missing bridge: ${objective.bridgeId}`);
   if(objective.type==='defend'&&objective.untilBridgeId&&mission.terrain.river?.bridgeId!==objective.untilBridgeId)fail(`objective ${objective.id} references missing bridge: ${objective.untilBridgeId}`);
   if(objective.type==='board-unit')unitRef(objective.unitId,`objective ${objective.id}`);
   if(objective.type==='board-player'&&!people.has(objective.personId))fail(`objective ${objective.id} references missing person: ${objective.personId}`);
   if(objective.type==='defend'){if(objective.requiredKills!==undefined&&(!Number.isInteger(objective.requiredKills)||objective.requiredKills<1||objective.requiredKills>objective.attackerIds.length))fail(`objective ${objective.id} has invalid requiredKills`);if(!objective.targetIds.length||!objective.attackerIds.length)fail(`objective ${objective.id} has no defense targets or attackers`);for(const id of objective.targetIds)targetRef(id,`objective ${objective.id}`);for(const id of objective.attackerIds)unitRef(id,`objective ${objective.id}`);}
   if(objective.type==='reach'&&!waypoints.has(objective.waypointId))fail(`objective ${objective.id} references missing waypoint: ${objective.waypointId}`);
   if(objective.type==='eliminate'){if(!objective.unitIds.length)fail(`objective ${objective.id} has no targets`);for(const id of objective.unitIds)unitRef(id,`objective ${objective.id}`);}
   if(objective.type==='neutralize'){
    if(!objective.unitIds.length&&!objective.facilityIds.length&&!objective.loweredBridgeId)fail(`objective ${objective.id} has no targets`);
    for(const id of objective.unitIds)unitRef(id,`objective ${objective.id}`);
    for(const id of objective.facilityIds)if(!mission.base?.buildings.some(b=>b.id===id))fail(`objective ${objective.id} references missing facility: ${id}`);
    if(objective.loweredBridgeId&&![mission.terrain.river,...mission.terrain.rivers??[]].some(r=>r?.bridgeId===objective.loweredBridgeId))fail(`objective ${objective.id} references missing bridge: ${objective.loweredBridgeId}`);
   }
   if(objective.type==='escort-facility'){
    if(!people.has(objective.personId)||!mission.companions?.some(c=>c.personId===objective.personId))fail(`objective ${objective.id} references missing companion: ${objective.personId}`);
    if(!mission.base?.buildings.some(b=>b.id===objective.facilityId))fail(`objective ${objective.id} references missing facility: ${objective.facilityId}`);
    if(!Number.isFinite(objective.radius)||objective.radius<=0)fail(`objective ${objective.id} has invalid radius`);
    for(const id of objective.afterObjectiveIds)if(id===objective.id||!mission.objectives.some(o=>o.id===id))fail(`objective ${objective.id} references missing prerequisite: ${id}`);
   }
   if(objective.type==='destroy-facility'){if(!objective.facilityIds.length)fail(`objective ${objective.id} has no facilities`);for(const id of objective.facilityIds)if(!mission.base?.buildings.some(b=>b.id===id))fail(`objective ${objective.id} references missing facility: ${id}`);}
   if(objective.type==='set-iff'&&!/^[0-7]{4}$/.test(objective.iff))fail(`objective ${objective.id} has invalid IFF`);
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
  for(const b of mission.base?.buildings??[])if(b.bridgeId&&(b.kind!=='bridge-control'||![mission.terrain.river,...mission.terrain.rivers??[]].some(r=>r?.bridgeId===b.bridgeId)))fail(`facility ${b.id} references missing bridge: ${b.bridgeId}`);
  const companions=mission.companions??[];
  unique(companions.map(c=>c.personId),'companion person ID');unique(companions.map(c=>c.key),'companion key');
  if(mission.passengerIff&&!companions.length)fail('passenger IFF needs companions');
  for(const companion of companions){
   if(companion.unitId){unitRef(companion.unitId,`companion ${companion.personId}`);if(allUnits.find(u=>u.id===companion.unitId)?.personId!==companion.personId&&!mission.personnel?.some(p=>p.personId===companion.personId&&p.boardingTargetId===companion.unitId))fail(`companion ${companion.personId} does not match its unit person ID`);}
   else if(companion.facilityId){targetRef(companion.facilityId,`companion ${companion.personId}`);if(!mission.personnel?.some(p=>p.personId===companion.personId&&p.facilityId===companion.facilityId))fail(`companion ${companion.personId} has no facility occupant`);}
   else if(!mission.personnel?.some(p=>p.personId===companion.personId&&!p.facilityId&&!p.boardingTargetId))fail(`companion ${companion.personId} has no starting location`);
  }
  for(const lure of mission.lures??[]){unitRef(lure.unitId,'lure');if(!Number.isInteger(lure.hits)||lure.hits<1)fail('lure hits must be a positive integer');}
  unique((mission.infantrySorties??[]).map(s=>s.id),'infantry sortie ID');
  for(const sortie of mission.infantrySorties??[]){if(!mission.base?.buildings.some(b=>b.id===sortie.facilityId))fail(`infantry sortie ${sortie.id} references missing facility: ${sortie.facilityId}`);if(!Number.isInteger(sortie.count)||sortie.count<1||!Number.isFinite(sortie.delay)||sortie.delay<0||!Number.isFinite(sortie.interval)||sortie.interval<=0||!Number.isFinite(sortie.range)||sortie.range<=0)fail(`infantry sortie ${sortie.id} has invalid count or timing`);}
  unique((mission.radioTriggers??[]).map(r=>r.id),'radio trigger ID');
  for(const trigger of mission.radioTriggers??[]){
   if(!people.has(trigger.speakerId))fail(`radio trigger ${trigger.id} references missing speaker: ${trigger.speakerId}`);
   if(trigger.event==='time'&&(!Number.isFinite(trigger.at)||trigger.at<0))fail(`radio trigger ${trigger.id} has invalid time`);
   if(trigger.event==='encounter'){
    if(!Number.isFinite(trigger.at)||trigger.at<0||!Number.isFinite(trigger.range)||trigger.range<=0)fail(`radio trigger ${trigger.id} has invalid encounter timing or range`);
    if(!trigger.unitIds.length||!trigger.enemyUnitIds.length)fail(`radio trigger ${trigger.id} needs encounter units`);
    for(const id of [...trigger.unitIds,...trigger.enemyUnitIds])unitRef(id,`radio trigger ${trigger.id}`);
   }
   if(trigger.event==='near-units'){
    if(!Number.isFinite(trigger.range)||trigger.range<=0||!trigger.unitIds.length)fail(`radio trigger ${trigger.id} has invalid near-units range`);
    for(const id of trigger.unitIds)unitRef(id,`radio trigger ${trigger.id}`);
   }
   if(trigger.event==='iff'&&(!/^[0-7]{4}$/.test(trigger.iff)||(!!trigger.unitId&&!units.has(trigger.unitId))))fail(`radio trigger ${trigger.id} has invalid IFF or unit`);
   if(trigger.event==='player-hit'){if(!trigger.unitIds.length)fail(`radio trigger ${trigger.id} has no units`);for(const id of trigger.unitIds)unitRef(id,`radio trigger ${trigger.id}`);}
  }
  if(mission.ionStrike){const strike=mission.ionStrike;
   if(!mission.base?.buildings.some(b=>b.id===strike.facilityId))fail(`ion strike references missing facility: ${strike.facilityId}`);
   unitRef(strike.retreatUnitId,'ion strike retreat');
   if(![strike.retreatRange,strike.delay,strike.safeRadius].every(value=>Number.isFinite(value)&&value>0))fail('ion strike needs positive range, delay and safe radius');
   for(const id of [strike.retreatRadioId,...strike.warningRadioIds])if(!mission.radioTriggers?.some(cue=>cue.id===id&&cue.event==='scripted'))fail(`ion strike references missing scripted radio: ${id}`);
   if(!mission.objectives.some(o=>o.type==='survive-ion-strike'))fail('ion strike needs a survival objective');
  }
  if(mission.objectives.some(o=>o.type==='survive-ion-strike')&&!mission.ionStrike)fail('ion survival objective needs ion strike configuration');
  if(mission.completionSequence){if(!mission.radioTriggers?.some(r=>r.id===mission.completionSequence?.radioId&&r.event==='completion'))fail('completion sequence references missing radio trigger');if(!Number.isFinite(mission.completionSequence.delay)||mission.completionSequence.delay<0)fail('completion sequence has invalid delay');}
  unique([...allUnits.map(u=>u.id),...(mission.base?.buildings??[]).flatMap(b=>b.id?[b.id]:[])],'selection ID');
  unique((mission.minefields??[]).map(f=>f.id),'minefield ID');
  unique((mission.minefields??[]).flatMap(f=>f.mines.map(m=>m.id)),'mine ID');
  for(const field of mission.minefields??[])if(field.controlFacilityId&&!mission.base?.buildings.some(b=>b.id===field.controlFacilityId&&b.kind==='mine-control'))fail(`minefield ${field.id} references missing mine control: ${field.controlFacilityId}`);
  unique((mission.terrain.cliffs??[]).map(c=>c.id),'cliff ID');
  if(mission.completionEnabled!==false&&!mission.objectives.length)fail('enabled mission has no objectives');
  if(!Number.isFinite(mission.terrain.halfWidth)||mission.terrain.halfWidth<=0||!Number.isFinite(mission.terrain.minZ)||!Number.isFinite(mission.terrain.maxZ)||mission.terrain.minZ>=mission.terrain.maxZ)fail('invalid terrain bounds');
  const finitePoint=(point:{x:number;z:number},label:string)=>{if(!Number.isFinite(point.x)||!Number.isFinite(point.z))fail(`${label} has non-finite coordinates`);};
  finitePoint(mission.player,'player');for(const unit of allUnits)finitePoint(unit,`unit ${unit.id}`);
  if(mission.initialYaw!==undefined&&!Number.isFinite(mission.initialYaw))fail('initialYaw must be finite');
  const rivers=[...(mission.terrain.river?[mission.terrain.river]:[]),...(mission.terrain.rivers??[])];unique(rivers.map(r=>r.bridgeId),'bridge ID');
  for(const id of mission.initialRaisedBridges??[])if(!rivers.some(r=>r.bridgeId===id))fail(`initial raised bridge is missing: ${id}`);
  for(const river of rivers)if(river.path){if(river.path.length<2)fail('river path needs at least two points');for(const [i,point] of river.path.entries()){finitePoint(point,`river path point ${i+1}`);if(Math.abs(point.x)>mission.terrain.halfWidth||point.z<mission.terrain.minZ||point.z>mission.terrain.maxZ)fail(`river path point ${i+1} is outside terrain bounds`);}}
  for(const waypoint of mission.waypoints){finitePoint(waypoint,`waypoint ${waypoint.id}`);if(!(waypoint.radius>0))fail(`waypoint ${waypoint.id} needs a positive radius`);}
  for(const image of [mission.briefingPresentation?.mapPreview,mission.briefingPresentation?.vehiclePreview])if(image){
   if(!image.src||!(image.width>0)||!(image.height>0)||!/^[-\d.]+\s+[-\d.]+\s+[\d.]+\s+[\d.]+$/.test(image.viewBox))fail('invalid briefing preview image');
   const projection=image.mapProjection;
   if(projection){const values=[projection.pixelOrigin.x,projection.pixelOrigin.y,projection.worldOrigin.x,projection.worldOrigin.z,projection.pixelPerWorldX.x,projection.pixelPerWorldX.y,projection.pixelPerWorldZ.x,projection.pixelPerWorldZ.y];if(!values.every(Number.isFinite)||Math.abs(projection.pixelPerWorldX.x*projection.pixelPerWorldZ.y-projection.pixelPerWorldX.y*projection.pixelPerWorldZ.x)<1e-9)fail('invalid briefing map projection');}
  }
 }
 return errors;
}
