import {MANUAL_AIM,manualAimFor,isHawc,canFlyAcrossRiver,aiTurnStep,aiAimTurnStep,accelerateSpeed,infantryVelocity} from './movement.ts';
export {accelerateSpeed} from './movement.ts';
import {makeFacilities,isFacility,facilityDistance,facilityExit,entryAllowed,type Facility} from './facilities.ts';
export {isFacility} from './facilities.ts';
import {VEHICLE_SHAPES,FACILITY_WRECK,MERC_TACTICAL_RAID_MUZZLE,SCORP_TACTICAL_RAID_MUZZLES} from '../content/vehicle-shapes.ts';
import {allyRoute} from './ally-navigation.ts';
import {sweptCircle,crossesBuilding,buildingContact,buildingMotionContact,circleMotionContact} from './battlefield.ts';
import {followPosition,type AllyOrder,type AllyCommand,type RadioRecipient,type RadioFailure,type OrderResult} from './ally-orders.ts';
import {INFANTRY_WEAPONS} from '../content/weapons.ts';
import {INFANTRY_MOVEMENT,BOARDING_DISTANCE,launchFlight,isEmbarked,type Flight,type Soldier} from './infantry.ts';
import {PARTS,PART_DAMAGE_THRESHOLDS,freshParts,applyPartDamage,intersectParts,mobilityMultiplier,sweptVehicleContact,vehicleContactFraction,vehicleRadius,buildingClearance,type BodyPart,type PartState} from './parts.ts';
import {DEFAULT_MISSION,type MissionDefinition} from '../content/missions/index.ts';
import {resolveVehicle,type Faction,type VehicleKind,type VehicleSpec} from '../content/vehicles.ts';
import {resolveWeapons,allowsLaserHoldFire,HELD_TRIGGER_INTERVAL,MISSILE_INTERVAL,MISSILE_HOMING,AI_MISSILE_ACCURACY,weaponMountCount,type VehicleWeapon,type LaserWeapon,type MachineGun,type MissileWeapon,VISOM_GUIDANCE} from '../content/weapons.ts';
import {steerMissile,homeMissile} from './guided-flight.ts';
import {isLaser,isMissile,laserRange} from './weapons.ts';
import {type Difficulty} from '../settings.ts';
export type Vec = {x:number;z:number};
export type Unit = Vec & {id:string;hoverHeight:number;hoverDisabled:boolean;passengers:string[];iff:string;kind:VehicleKind;spec:VehicleSpec;personId?:string;order:AllyOrder|null;aggressorId:string|null;aggressorUntil:number;ammunition:Partial<Record<VehicleWeapon,number>>;readonly slotAmmo:(number|undefined)[];yaw:number;aim:number;aimPitch:number;speed:number;shield:number;armor:number;energy:number;ammo:number;laserCharge:number;pilot:boolean;alive:boolean;cooldown:number;alert:boolean;phase:number;lastHit:number;attackCycle:number;lureHits:number;lured:boolean;parts:PartState};
export type CombatTarget=Unit|Soldier;
export type SelectionTarget=CombatTarget|Facility;
export const isVehicle=(target:SelectionTarget):target is Unit=>'spec' in target;
export const targetHeight=(target:SelectionTarget)=>isFacility(target)?target.height*.5:isVehicle(target)?target.hoverHeight+target.spec.height*.55:(target.flight?.altitude??0)+1;
export const targetName=(target:SelectionTarget,companions:MissionDefinition['companions']=[],locale:'ja'|'en'='ja')=>{
 if(isFacility(target))return target.name;if(isVehicle(target))return target.spec.name;
 const member=companions?.find(person=>person.personId===target.personId);if(member)return member.name[locale];
 return target.faction==='scorp'?(locale==='ja'?'スコープ戦闘員':'Scorp combatant'):(locale==='ja'?'歩兵':'Infantry');
};
export type Input = {forward:boolean;back:boolean;left:boolean;right:boolean;boost:boolean;stop:boolean;fire1:boolean;fire2:boolean;fire3?:boolean;fire4?:boolean;lookUp?:boolean;lookDown?:boolean;center?:boolean};
export type Point3 = Vec & {y:number};
export type Missile = Point3 & {id:number;owner:string;weapon:MissileWeapon|'GASHR'|'EGGER'|'TCREAP'|LaserWeapon;playerOwned?:boolean;homingScale?:number;homingTargetId?:string;aiGuidance?:{point:Point3;offset:Point3;refreshAt:number};vx:number;vy:number;vz:number;damage:number;radius:number;life:number};
export type GameEvent = {type:'bridge-raised'|'enemy-detected'|'minefield-found'|'occupied-contact'|'vehicle-contact'|'mission-radio'|'mine'|'ally-order'|'ally-order-complete'|'lured'|'guidance-end'|'pilot-eject'|'soldier-hit'|'soldier-death'|'stop'|'center'|'target-select'|'laser-ready'|'foot-ready'|'target'|'impact'|'board'|'shot'|'hit'|'destroy'|'waypoint'|'win'|'lose'|'boost'|'eject'|'warning';text?:string;minefieldId?:string;faction?:Faction;radioId?:string;otherUnitId?:string;unit?:Unit;from?:Vec&{y?:number};to?:Vec&{y?:number};weapon?:string;projectileId?:number;position?:Point3;part?:BodyPart;soldier?:Soldier;facility?:Facility;launch?:boolean;ejection?:'gas'|'destruction';command?:AllyCommand;recipients?:string[];targetId?:string};
export const AGGRO_LOCK_SECONDS=3;
export const CROSSHAIR_SELECTION={range:800,horizontalAngle:12*Math.PI/180,verticalAngle:8*Math.PI/180};
export const distance=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.z-b.z);
export const angle=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
export function makeUnit(id:string,kind:VehicleKind,x:number,z:number,pilot=true,overrides?:Partial<VehicleSpec>):Unit {
 const spec=resolveVehicle(kind,overrides),ammunition={...spec.initialAmmo};
 const slotAmmo=spec.weapons.map((weapon,index)=>{
   const total=spec.initialAmmo[weapon];if(total===undefined)return undefined;
   const slots=spec.weapons.filter(w=>w===weapon).length,ordinal=spec.weapons.slice(0,index).filter(w=>w===weapon).length;
   return Math.floor(total/slots)+(ordinal<total%slots?1:0);
 });
 // Legacy weapon totals are views of the slot stores, including legacy writes.
 for(const weapon of new Set(spec.weapons)){if(!(weapon in ammunition))continue;
   const indices=spec.weapons.flatMap((w,i)=>w===weapon?[i]:[]);
   Object.defineProperty(ammunition,weapon,{enumerable:true,configurable:true,
     get:()=>indices.reduce((sum,i)=>sum+(slotAmmo[i]??0),0),
     set:(value:number)=>{const total=Math.max(0,Math.floor(value));indices.forEach((i,n)=>slotAmmo[i]=Math.floor(total/indices.length)+(n<total%indices.length?1:0));}});
 }
 const firstAmmo=spec.weapons.find(w=>w in ammunition);
 return {id,hoverHeight:spec.hoverHeight??0,hoverDisabled:false,passengers:[],iff:DEFAULT_MISSION.factionCodes[spec.faction]??spec.faction,kind,spec,order:null,aggressorId:null,aggressorUntil:0,ammunition,slotAmmo,x,z,yaw:0,aim:0,aimPitch:0,speed:0,shield:spec.shield,armor:spec.armor,energy:spec.energy,
 get ammo(){return firstAmmo?this.ammunition[firstAmmo]??0:0;},set ammo(value:number){if(firstAmmo)this.ammunition[firstAmmo]=value;},
 laserCharge:1,pilot,alive:true,cooldown:0,alert:false,phase:0,lastHit:-100,attackCycle:0,lureHits:0,lured:false,parts:freshParts()};
}
export class Simulation {
  soldiers:Soldier[]=[];flight:Flight|null=null;gashrAmmo:number=INFANTRY_WEAPONS.GASHR.ammo;eggerAmmo:number=INFANTRY_WEAPONS.EGGER.ammo;footCooldown={PRIF44:0,GASHR:0,EGGER:0};
  missiles:Missile[]=[];guidedMissileId:number|null=null;private nextMissileId=1;private laserRechargePending=new WeakSet<Unit>();private footRechargePending=new Set<'PRIF44'|'GASHR'|'EGGER'>();
  time=0; difficulty:Difficulty; status:'running'|'won'|'lost'='running';
  human:Vec; humanHealth=100; humanYaw=0;pitch=0;prone=false;
  units:Unit[]; mounted:Unit|null=null;insideFacility:Facility|null=null;passenger:Unit|null=null; private playerIff:string='';
  get iff(){return this.playerIff;}
  set iff(value:string){this.playerIff=value;if(this.mounted)this.mounted.iff=value;} throttle=0;speed=0; waypoint=false;
  changeIff(value:string){if(this.passenger)return false;if(!/^[0-7]{4}$/.test(value))return false;this.iff=value;return true;}
  resetIff(){if(this.passenger)return;this.iff=this.mission.initialIff;}
  selectedWaypoint:number|null=null;selected:string|null=null; tracking=false; events:GameEvent[]=[]; private playerDetectionAnnounced=new Set<string>();private occupiedContacts=new Map<string,number>();private warningLevel=0;private pendingDamageWarning:Unit|null=null;private stopHeld=false;private centerHeld=false;private fireHeld=[false,false,false,false];private fireRepeatAt=[0,0,0,0];private fireReleaseRequired=[false,false,false,false];private fireActor:string|undefined;
  mines:{id:string;x:number;z:number;radius:number;spent:boolean}[]=[];
  facilities:Facility[];readonly mission:MissionDefinition;readonly weapons:ReturnType<typeof resolveWeapons>;reachedWaypoints=new Set<number>();
  constructor(difficulty:Difficulty='Easy',mission:MissionDefinition=DEFAULT_MISSION){
    this.difficulty=difficulty;this.mission=structuredClone(mission);this.weapons=resolveWeapons(mission.weaponOverrides);
    this.human={...mission.player};this.iff=mission.initialIff;this.facilities=makeFacilities(this.mission.base,mission.factionCodes[mission.base?.faction??'scorp']??mission.base?.faction??'scorp');
    this.mines=(mission.minefields??[]).flatMap(field=>field.mines.map(mine=>({...mine,radius:field.triggerRadius,spent:false})));
    this.units=mission.units.map(spawn=>Object.assign(makeUnit(spawn.id,spawn.kind,spawn.x,spawn.z,spawn.pilot,resolveVehicle(spawn.kind,mission.vehicleOverrides?.[spawn.kind],spawn.overrides)),{yaw:spawn.yaw??0,aim:spawn.yaw??0,personId:spawn.personId,iff:spawn.iff??mission.factionCodes[resolveVehicle(spawn.kind,mission.vehicleOverrides?.[spawn.kind],spawn.overrides).faction]??resolveVehicle(spawn.kind).faction}));
    for(const person of mission.personnel??[]){const facility=this.facilities.find(f=>f.id===person.facilityId);this.soldiers.push({id:`person-${person.personId}`,personId:person.personId,sourceVehicle:person.boardingTargetId??person.facilityId??person.personId,insideFacility:person.facilityId,boardingTarget:person.boardingTargetId,boardingRole:person.boardingTargetId?'pilot':undefined,iff:this.iff,faction:mission.playerFaction,x:facility?.x??person.x,z:facility?.z??person.z,yaw:0,health:100,alive:true,alert:false,cooldown:0,flight:null,aggressorId:null,aggressorUntil:0});}
    if(mission.startMountedUnitId){const unit=this.units.find(u=>u.id===mission.startMountedUnitId);if(!unit||!unit.alive)throw new Error('Invalid mounted start');this.mounted=unit;this.boardedUnits.add(unit.id);unit.iff=this.iff;unit.pilot=true;this.human={x:unit.x,z:unit.z};this.applyBoardingOrders(unit);}
  }
  private applyBoardingOrders(unit:Unit){
    if(this.mission.autoFollowOnBoard?.includes(unit.kind))this.sendAllyOrder('all','follow',{followPlayer:true,excludeUnitId:unit.id});
    if(this.mounted!==unit)return;
    for(const cue of this.mission.radioTriggers??[])if(cue.event==='board'&&cue.vehicleKind===unit.kind&&!this.playedMissionRadio.has(cue.id)&&this.radioSpeakerAlive(cue.speakerId)){this.playedMissionRadio.add(cue.id);this.emit({type:'mission-radio',radioId:cue.id});}
  }
  private radioSpeakerAlive(personId:string){return this.units.some(u=>u.alive&&u.pilot&&u.personId===personId)||this.soldiers.some(s=>s.alive&&s.personId===personId);}

  private playedMissionRadio=new Set<string>();
  private tickMissionRadio(){
    const carrier=this.mounted??this.passenger,base=this.mission.base;if(!carrier||!base)return;
    for(const cue of this.mission.radioTriggers??[]){
      if(cue.event==='board'||this.playedMissionRadio.has(cue.id)||carrier.kind!==cue.vehicleKind||distance(this.player,base)>cue.range)continue;
      const alive=this.radioSpeakerAlive(cue.speakerId);
      if(!alive)continue;this.playedMissionRadio.add(cue.id);this.emit({type:'mission-radio',radioId:cue.id});
    }
  }
  private sortieProgress=new Map<string,{nextAt:number;emerged:number}>();
  private tickInfantrySorties(){
    for(const cue of this.mission.infantrySorties??[]){
      const facility=this.facilities.find(f=>f.id===cue.facilityId);if(!facility?.alive)continue;
      let progress=this.sortieProgress.get(cue.id);
      if(!progress){if(this.mounted?.kind!==cue.vehicleKind||!this.mission.base||distance(this.player,this.mission.base)>cue.range)continue;progress={nextAt:this.time+cue.delay,emerged:0};this.sortieProgress.set(cue.id,progress);}
      if(progress.emerged>=cue.count||this.time+1e-8<progress.nextAt)continue;
      progress.emerged++;progress.nextAt=this.time+cue.interval;
      const exit=facilityExit(facility),slot=progress.emerged-1;exit.x+=Math.floor(slot/3)*3;exit.z+=(slot%3-1)*3;this.soldiers.push({id:`sortie-${cue.id}-${progress.emerged}`,sourceVehicle:facility.id,iff:facility.iff,faction:facility.faction,...exit,yaw:Math.PI/2,health:35,alive:true,alert:false,cooldown:0,flight:null,aggressorId:null,aggressorUntil:0});
    }
  }
  get terrainObstacles(){const buildings=(this.mission.base?.buildings??[]).map((b,i)=>this.facilities.find(f=>f.id===(b.id??`facility-${b.kind??'command'}-${i}`))??b).filter(b=>!isFacility(b)||b.alive);return [...buildings,...(this.mission.terrain.cliffs??[]),...this.units.filter(u=>!u.alive&&u.spec.category==='tower').map(u=>({x:u.x,z:u.z,...FACILITY_WRECK}))];}
  private announcedMinefields=new Set<string>();
  private tickMinefieldWarnings(){
    const liveMines=new Set(this.mines.filter(m=>!m.spent).map(m=>m.id));
    for(const field of this.mission.minefields??[]){
      if(field.warningRange===undefined||this.announcedMinefields.has(field.id)||!field.mines.some(m=>liveMines.has(m.id)))continue;
      if(field.warningVehicle&&(this.mounted??this.passenger)?.kind!==field.warningVehicle)continue;
      const dx=Math.max(0,Math.abs(this.player.x-field.x)-field.width/2),dz=Math.max(0,Math.abs(this.player.z-field.z)-field.depth/2);
      if(Math.hypot(dx,dz)>field.warningRange)continue;
      this.announcedMinefields.add(field.id);this.emit({type:'minefield-found',minefieldId:field.id});
    }
  }
  get detectedMines(){const range=this.mounted?.spec.mineDetectorRange??0;return range?this.mines.filter(m=>!m.spent&&distance(m,this.player)<=range):[];}
  private tickMines(previousHuman:Vec,previousUnits:Map<string,Vec>){
    for(const mine of this.mines){if(mine.spent)continue;
      const unit=this.units.find(u=>u.alive&&u===this.mounted&&u.spec.category!=='tower'&&sweptCircle(previousUnits.get(u.id)??u,u,mine,mine.radius+3));
      const human=!this.mounted&&!this.passenger&&!this.insideFacility&&!this.flight&&sweptCircle(previousHuman,this.human,mine,mine.radius+.4);
      // NPCs never trigger mines; immunity follows the controller, not IFF or vehicle origin.
      if(!unit&&!human)continue;mine.spent=true;this.emit({type:'mine',position:{x:mine.x,y:.3,z:mine.z}});
      if(unit){unit.pilot=false;this.damage(unit,99999);}
      if(human)this.damage(null,this.humanHealth);
    }
  }
  companionCrew(unit:Unit){
    if(!unit.alive)return [];
    return (this.mission.companions??[]).filter(member=>{
      const person=this.soldiers.find(s=>s.personId===member.personId);
      if(person&&(!person.alive||person.health<=0))return false;
      return unit.pilot&&unit.personId===member.personId||!!person&&person.passengerOf===unit.id&&unit.passengers.includes(person.id);
    });
  }
  readonly raisedBridges=new Set<string>();
  private get riverObstacles(){
    const river=this.mission.terrain.river;if(!river)return [];
    const start=river.z-river.length/2,end=river.z+river.length/2;
    const spans=this.raisedBridges.has(river.bridgeId)?[[start,end]]:[[start,Math.min(end,river.bridgeZ-river.bridgeWidth/2)],[Math.max(start,river.bridgeZ+river.bridgeWidth/2),end]];
    return spans.filter(([a,b])=>b>a).map(([a,b])=>({x:river.x,z:(a+b)/2,width:river.width,depth:b-a}));
  }
  private movementObstacles(unit?:Unit){return canFlyAcrossRiver(unit?.kind)?this.terrainObstacles:[...this.terrainObstacles,...this.riverObstacles];}

  private boardedUnits=new Set<string>();
  private securedDefenses=new Set<string>();
  private personRoutes=new Map<string,{until:number;goal:Vec;route:Vec[]}>();
  private approachPerson(soldier:Soldier,goal:Vec,dt:number,stop=0){
    const allied=soldier.iff===this.iff||!!soldier.personId&&this.mission.companions?.some(member=>member.personId===soldier.personId),walk=allied?INFANTRY_MOVEMENT.allyWalk:INFANTRY_MOVEMENT.walk;
    if(distance(soldier,goal)<=stop){this.moveInfantry(soldier,soldier.yaw,0,dt);return;}
    let route=this.personRoutes.get(soldier.id);if(!route||this.time>=route.until||distance(route.goal,goal)>4){const path=allyRoute(soldier,goal,this.mission.terrain,[...this.mission.rocks.map(r=>({...r,r:r.r+2.3})),...this.units.filter(u=>u.alive&&u!==goal).map(u=>({...u,r:vehicleRadius(u.kind)+.65}))],this.movementObstacles().map(b=>({...b,width:b.width+4.6,depth:b.depth+4.6})))??[];route={until:this.time+.8,goal:{...goal},route:path};this.personRoutes.set(soldier.id,route);}
    while(route.route.length>1&&distance(soldier,route.route[0])<1)route.route.shift();const next=route.route[0]??goal;soldier.yaw=Math.atan2(next.x-soldier.x,next.z-soldier.z);this.moveInfantry(soldier,soldier.yaw,Math.min(walk,distance(soldier,next)/dt),dt);
  }
  private tickPickups(){for(const pickup of this.mission.pickups??[]){const soldier=this.soldiers.find(s=>s.personId===pickup.personId);if(!soldier?.alive||soldier.order!==undefined)continue;if(soldier.insideFacility){if(pickup.attackerIds.filter(id=>this.eliminated(id)).length<pickup.requiredKills)continue;const facility=this.facilities.find(f=>f.id===pickup.facilityId&&f.alive);if(!facility)continue;soldier.insideFacility=undefined;Object.assign(soldier,facilityExit(facility));this.emit({type:'mission-radio',radioId:`pickup-${pickup.personId}`,text:'pickup-ready'});}
    if(soldier.passengerOf||soldier.driverOf)continue;const carrier=this.mounted;if(soldier.boardingTarget!==carrier?.id)this.cancelBoarding(soldier);if(carrier&&this.canReserve(carrier,soldier.iff,soldier.id)){soldier.boardingTarget=carrier.id;soldier.boardingRole='passenger';}
  }}
  get missionMusicUnits(){return this.units.map(unit=>({id:unit.id,alive:unit.alive,defeated:this.eliminated(unit.id)}));}
  private eliminated(id:string){const unit=this.units.find(u=>u.id===id);return !!unit&&(!unit.alive||this.soldiers.some(s=>s.sourceVehicle===id&&!s.alive));}
  private facilityIntegrity(f:Facility){const initial=this.mission.base?.buildings.find((b,i)=>(b.id??`facility-${b.kind??'command'}-${i}`)===f.id)?.health??200;return f.health/initial;}
  private laserEnergyCost(unit:Unit,weapon:LaserWeapon){return unit.spec.powerSupply==='external'?0:this.weapons.lasers[weapon].energy;}
  unitPowered(unit:Unit){const source=this.mission.units.find(s=>s.id===unit.id)?.powerSourceId;return !source||this.facilities.some(f=>f.id===source&&f.alive);}
  get objectiveStates(){return this.mission.objectives.map(objective=>{
    if(objective.type==='raise-bridge'){const done=this.raisedBridges.has(objective.bridgeId);return {...objective,current:Number(done),total:1,done};}
    if(objective.type==='board-unit'){const done=this.boardedUnits.has(objective.unitId);return {...objective,current:Number(done),total:1,done};}
    if(objective.type==='board-player'){const person=this.soldiers.find(s=>s.personId===objective.personId),done=!!person?.alive&&!!this.mounted&&person.passengerOf===this.mounted.id;return {...objective,current:Number(done),total:1,done};}
    if(objective.type==='defend'){const targets=objective.targetIds.map(id=>this.selectionTargets.find(t=>t.id===id&&t.alive));const integrity=Math.min(...targets.map(t=>!t?0:isFacility(t)?this.facilityIntegrity(t):isVehicle(t)?t.armor/t.spec.armor:t.health/35));const total=objective.untilBridgeId?1:objective.requiredKills??objective.attackerIds.length,current=objective.untilBridgeId?Number(this.raisedBridges.has(objective.untilBridgeId)):Math.min(total,objective.attackerIds.filter(id=>this.eliminated(id)).length);return {...objective,current,total,integrity,done:this.securedDefenses.has(objective.id)||total>0&&current===total&&objective.targetIds.every(id=>this.selectionTargets.some(t=>t.id===id&&t.alive))};}
    if(objective.type==='board-faction'){
      const current=objective.personIds.filter(id=>this.units.some(u=>u.spec.faction===objective.faction&&u.pilot&&u.personId===id&&this.companionCrew(u).some(member=>member.personId===id))).length,total=objective.personIds.length;
      return {...objective,current,total,done:total>0&&current===total};
    }
    const lure=this.mission.lures?.find(rule=>objective.type==='lure'&&rule.unitId===objective.unitId),unit=objective.type==='lure'?this.units.find(u=>u.id===objective.unitId):undefined;
    const current=objective.type==='lure'?Math.min(lure?.hits??0,unit?.lureHits??0):objective.type==='reach'?Number(this.reachedWaypoints.has(objective.waypointId)):objective.unitIds.filter(id=>{const unit=this.units.find(u=>u.id===id);return !!unit&&(!unit.alive||this.soldiers.some(s=>s.sourceVehicle===id&&!s.alive));}).length;
    const total=objective.type==='lure'?(lure?.hits??0):objective.type==='reach'?1:objective.unitIds.length;return {...objective,current,total,done:total>0&&current===total};
  });}
  get radioMembers(){return (this.mission.companions??[]).map(member=>{
    const soldier=this.soldiers.find(s=>s.personId===member.personId&&(!s.driverOf||!s.alive));
    const unit=this.units.find(u=>u.personId===member.personId&&u.pilot&&u!==this.mounted);const actor=soldier??unit??this.units.find(u=>u.id===member.unitId);
    let reason:RadioFailure|undefined;
    if(!actor)reason=this.units.some(u=>u.id===member.unitId)?'unoccupied':'missing';else if(!actor.alive)reason='dead';else if(!isVehicle(actor)&&actor.insideFacility)reason='busy';else if(actor===this.mounted)reason='player';else if(isVehicle(actor)&&!actor.pilot)reason='unoccupied';
    return {...member,unit,soldier,reason,available:reason===undefined};
  });}
  private validAttackTarget(unit:SelectionTarget|null|undefined){return !!unit&&!isFacility(unit)&&unit.alive&&(!isVehicle(unit)||unit.pilot)&&this.isHostile(unit);}
  sendAllyOrder(recipient:RadioRecipient,command:AllyCommand,options:{followPlayer?:boolean;excludeUnitId?:string}={}):OrderResult{
    const result:OrderResult={accepted:[],rejected:[]};if(this.status!=='running'||this.guidedMissile||this.passenger){result.error='inactive';return result;}
    const boarding=command==='board'?(this.selected?this.units.find(u=>u.id===this.selected):this.mounted):undefined;
    if(command==='board'&&(!boarding?.alive||(boarding.spec.boardable===false||this.entryShielded(boarding)))){result.error='target';return result;}
    const target=command==='follow'&&options.followPlayer?null:this.target;if(command==='attack'&&!this.validAttackTarget(target)){result.error='target';return result;}
    const members=this.radioMembers.filter(m=>recipient==='all'||m.personId===recipient);
    for(const member of members){if(options.excludeUnitId&&member.unit?.id===options.excludeUnitId)continue;if(!member.available||(!member.unit&&!member.soldier)){result.rejected.push({personId:member.personId,reason:member.reason??'missing'});continue;}
      let soldier=member.soldier;
      if(command==='board'){
        const carrier=boarding!,role=carrier.pilot?'passenger':'pilot',id=soldier?.id??member.personId;
        if(carrier===member.unit||soldier?.passengerOf===carrier.id||(!this.selected&&member.unit)){result.rejected.push({personId:member.personId,reason:'occupied'});continue;}
        const reason:RadioFailure|undefined=role==='pilot'?(this.pilotReserved(carrier,id)?'reserved':undefined):carrier.iff!==(soldier?.iff??member.unit!.iff)?'iff':!this.canReserve(carrier,soldier?.iff??member.unit!.iff,id)?'full':undefined;
        if(reason){result.rejected.push({personId:member.personId,reason});continue;}
        if(member.unit)soldier=this.forceEject(member.unit,'boarding')!;
        if(soldier!.passengerOf)this.exitPassenger(soldier,false);
        soldier!.order=null;soldier!.boardingTarget=carrier.id;soldier!.boardingRole=role;
        result.accepted.push(member.unitId??member.facilityId??member.personId);continue;
      }
      if(command==='disembark'){
        if(member.unit)soldier=this.forceEject(member.unit,'boarding')??undefined;
        else if(soldier?.passengerOf)this.exitPassenger(soldier);
        else{result.rejected.push({personId:member.personId,reason:'unoccupied'});continue;}
        if(soldier)soldier.order=null;result.accepted.push(member.unitId??member.facilityId??member.personId);continue;
      }
      if(soldier){
        this.cancelBoarding(soldier);soldier.order=command==='attack'?{kind:'attack',targetId:target!.id}:command==='follow'?(target?{kind:'follow',targetId:target.id}:{kind:'follow'}):null;
        result.accepted.push(member.unitId??member.facilityId??member.personId);continue;
      }
      const unit=member.unit!;unit.order=command==='attack'?{kind:'attack',targetId:target!.id}:command==='follow'?(target?{kind:'follow',targetId:target.id}:{kind:'follow'}):null;
      result.accepted.push(member.unitId??member.facilityId??member.personId);
    }
    if(!result.accepted.length){result.error='unavailable';return result;}
    this.emit({type:'ally-order',command,recipients:[...result.accepted],targetId:command==='attack'?target!.id:command==='board'?boarding!.id:command==='follow'?target?.id:undefined});return result;
  }
  private moveAllyToward(unit:Unit,goal:Vec,stop:number,dt:number,reverse=false){
    const remaining=distance(unit,goal)-stop;if(remaining<=.5){this.coastVehicle(unit,dt);return;}
    const bearing=Math.atan2(goal.x-unit.x,goal.z-unit.z),lookAhead=Math.min(12,remaining);
    const candidates=[0,.4,-.4,.8,-.8,1.2,-1.2,1.6,-1.6];let desired=bearing;
    for(const offset of candidates){const yaw=bearing+offset,next={x:unit.x+Math.sin(yaw)*lookAhead,z:unit.z+Math.cos(yaw)*lookAhead};
      if(Math.abs(next.x)>this.mission.terrain.halfWidth||next.z<this.mission.terrain.minZ||next.z>this.mission.terrain.maxZ)continue;
      if(this.mission.rocks.some(r=>distance(next,r)<r.r+4)||this.units.some(other=>other!==unit&&other.alive&&vehicleContactFraction(unit,next,other)!==null))continue;desired=yaw;break;
    }
    if(reverse)desired+=Math.PI;
    unit.yaw+=aiTurnStep(unit.kind,angle(desired-unit.yaw),dt);
    const alignment=Math.max(0,Math.cos(angle(desired-unit.yaw))),speed=unit.spec.speed*mobilityMultiplier(unit.parts)/3.6*alignment*Math.min(1,remaining/12);
    unit.speed=accelerateSpeed(unit.speed,reverse?-speed:speed,dt,unit.kind);this.move(unit,unit.yaw,Math.sign(unit.speed)*Math.min(remaining,Math.abs(unit.speed)*dt));
  }
  private allyFollowRoutes=new Map<string,{targetId:string;goal:Vec;until:number;route:Vec[]}>();
  private followAlly(unit:Unit,goal:Vec,targetId:string,anchor:Vec,dt:number){
    if(distance(unit,goal)<=3.5){this.coastVehicle(unit,dt);return;}
    let plan=this.allyFollowRoutes.get(unit.id);
    if(!plan||plan.targetId!==targetId||this.time>=plan.until||distance(plan.goal,goal)>5){
      const area=this.mission.terrain;
      const circles=[...this.mission.rocks.map(r=>({...r,r:r.r+3})),...this.units.filter(other=>other!==unit&&other.alive).map(other=>({...other,r:vehicleRadius(unit.kind)+vehicleRadius(other.kind)+.6}))];
      const clearance=buildingClearance(unit)+.5,boxes=this.movementObstacles(unit).map(b=>({...b,width:b.width+clearance*2,depth:b.depth+clearance*2}));
      const candidates=[{...goal,deviation:0}];for(const radius of [6,12,18,24])for(let i=0;i<12;i++)candidates.push({x:goal.x+Math.sin(i*Math.PI/6)*radius,z:goal.z+Math.cos(i*Math.PI/6)*radius,deviation:radius});
      candidates.sort((a,b)=>a.deviation-b.deviation||distance(a,anchor)-distance(b,anchor)||distance(a,unit)-distance(b,unit));
      let route:Vec[]=[];
      for(const candidate of candidates){
        if(Math.abs(candidate.x)>area.halfWidth||candidate.z<area.minZ||candidate.z>area.maxZ||circles.some(c=>distance(candidate,c)<c.r)||boxes.some(b=>Math.abs(candidate.x-b.x)<b.width/2&&Math.abs(candidate.z-b.z)<b.depth/2))continue;
        const path=allyRoute(unit,candidate,area,circles,boxes);if(path){route=path;break;}
      }
      plan={targetId,goal:{...goal},until:this.time+.8,route};this.allyFollowRoutes.set(unit.id,plan);
    }
    while(plan.route.length>1&&distance(unit,plan.route[0])<.7)plan.route.shift();
    const next=plan.route[0];if(next)this.moveAllyToward(unit,next,plan.route.length===1?3:0,dt);else this.coastVehicle(unit,dt);
  }
  private allyManeuvers=new Map<string,{targetId:string;target:Vec;until:number;route:Vec[]}>();
  private maneuverAlly(unit:Unit,target:CombatTarget,range:number,index:number,dt:number){
    if(unit.spec.speed<=0)return;
    const dist=distance(unit,target),minimum=unit.spec.ai.minimumRange??0;
    const preferred=Math.max(minimum+15,Math.min(Math.max(30,unit.spec.ai.stopDistance),range*.65));
    const clear=this.clearAIShot(unit,{x:unit.x,y:unit.spec.height*.6,z:unit.z},{x:target.x,y:targetHeight(target),z:target.z},target);
    // A short firing pause allows fixed forward weapons to aim; otherwise keep maneuvering.
    if(clear&&(unit.spec.torsoLimit===0?dist<Math.max(preferred*1.6,95):dist>preferred*.75&&dist<preferred*1.2)&&(this.time+index*.7)%5>(unit.spec.torsoLimit===0?2.5:3)){this.coastVehicle(unit,dt);this.allyManeuvers.delete(unit.id);return;}
    let plan=this.allyManeuvers.get(unit.id);
    if(!plan||plan.targetId!==target.id||this.time>=plan.until||distance(plan.target,target)>8){
      const side=index%2===0?1:-1,bearing=Math.atan2(unit.x-target.x,unit.z-target.z);
      const obstacles=this.units.filter(other=>other!==unit&&other.alive).map(other=>({...other,r:vehicleRadius(unit.kind)+vehicleRadius(other.kind)+.6}));
      const circles=[...this.mission.rocks.map(r=>({...r,r:r.r+3})),...obstacles];
      const clearance=buildingClearance(unit)+.5,boxes=this.movementObstacles(unit).map(b=>({...b,width:b.width+clearance*2,depth:b.depth+clearance*2}));
      const candidates:Vec[]=[];
      // Try a nearby orbit point first, then alternative firing positions around the target.
      for(const radius of [preferred,preferred*1.4])for(const offset of [.38*side,-.38*side,0,...Array.from({length:12},(_,i)=>(i+1)*Math.PI/6*side)]){
        const yaw=bearing+offset;candidates.push({x:target.x+Math.sin(yaw)*radius,z:target.z+Math.cos(yaw)*radius});
      }
      if(!clear)candidates.sort((a,b)=>distance(unit,a)-distance(unit,b));
      let route:Vec[]=[];
      for(const goal of candidates){
        if(distance(unit,goal)<6||!this.clearAIShot(unit,{...goal,y:unit.spec.height*.6},{x:target.x,y:targetHeight(target),z:target.z},target))continue;
        const path=allyRoute(unit,goal,this.mission.terrain,circles,boxes);if(path){route=path;break;}
      }
      plan={targetId:target.id,target:{x:target.x,z:target.z},until:this.time+.9,route};this.allyManeuvers.set(unit.id,plan);
    }
    while(plan.route.length&&distance(unit,plan.route[0])<2)plan.route.shift();
    const next=plan.route[0];if(next)this.moveAllyToward(unit,next,0,dt,dist<preferred*.75);else this.coastVehicle(unit,dt);
  }
  private aimAI(unit:Unit,target:SelectionTarget,dt:number){unit.aimPitch=Math.atan2(targetHeight(target)-(unit.hoverHeight+unit.spec.height*.6),distance(unit,target));const bearing=Math.atan2(target.x-unit.x,target.z-unit.z),limit=unit.spec.torsoLimit;if(unit.spec.category!=='tower'&&(Math.abs(unit.speed)<.1||this.brakingUnits.has(unit.id))&&Math.abs(angle(bearing-unit.yaw))>limit*.8)unit.yaw+=aiTurnStep(unit.kind,angle(bearing-unit.yaw),dt);const desired=unit.yaw+Math.max(-limit,Math.min(limit,angle(bearing-unit.yaw)));unit.aim+=aiAimTurnStep(unit.kind,angle(desired-unit.aim),dt);unit.aim=unit.yaw+Math.max(-limit,Math.min(limit,angle(unit.aim-unit.yaw)));}
  private tickAllies(dt:number){
    const allies=[...(this.mission.companions??[]).map(member=>this.units.find(u=>u.pilot&&u.personId===member.personId)),...(this.mission.garrison??[]).map(id=>this.units.find(u=>u.id===id))];
    for(const [index,unit] of [...new Set(allies.filter((u):u is Unit=>!!u))].entries()){if(!unit.alive||!unit.pilot||unit===this.mounted)continue;
      const order=unit.order;if(order?.kind!=='follow')this.allyFollowRoutes.delete(unit.id);if(order?.kind!=='attack')this.allyManeuvers.delete(unit.id);if(order?.kind==='follow'){
        const anchor=order.targetId?this.selectionTargets.find(t=>t.id===order.targetId&&t.alive):null;
        if(order.targetId&&!anchor){unit.order=null;this.coastVehicle(unit,dt);this.emit({type:'ally-order-complete',unit,command:'follow'});continue;}
        if(anchor===unit){unit.order=null;this.coastVehicle(unit,dt);continue;}
        const goal=followPosition(anchor??this.player,anchor?anchor.yaw:this.yaw,index);this.followAlly(unit,goal,order.targetId??'player',anchor??this.player,dt);
      }
      const target=order?.kind==='attack'?this.combatTargets.find(u=>u.id===order.targetId):this.combatTargets.filter(s=>s!==unit&&s!==this.mounted&&s.alive&&(!isVehicle(s)||s.pilot)&&s.iff!==unit.iff&&distance(unit,s)<unit.spec.ai.detection&&this.lineOfSight(unit,s)).sort((a,b)=>distance(a,unit)-distance(b,unit))[0];if(!target&&order?.kind!=='attack'){if(order?.kind!=='follow')this.coastVehicle(unit,dt);continue;}if(!this.validAttackTarget(target)){unit.order=null;this.coastVehicle(unit,dt);this.emit({type:'ally-order-complete',unit});continue;}
      const range=Math.max(...unit.spec.weapons.map(weapon=>isLaser(weapon)?this.weapons.lasers[weapon].range:isMissile(weapon)?this.weapons.missiles[weapon].speed*this.weapons.missiles[weapon].lifetime:this.weapons.guns[weapon].range));
      if(order?.kind==='attack')this.maneuverAlly(unit,target!,range,index,dt);else if(order?.kind!=='follow')this.coastVehicle(unit,dt);this.aimAI(unit,target!,dt);
      const bearing=Math.atan2(target!.x-unit.x,target!.z-unit.z);if(distance(unit,target!)<=range&&Math.abs(angle(unit.aim-bearing))<.12&&unit.cooldown<=0)this.fireAI(unit,target!);
    }
  }
  private clearAIShot(unit:CombatTarget,from:Point3,to:Point3,target:SelectionTarget|null){
    if(!this.lineOfSight(from,to))return false;
    const hits=this.units.filter(u=>u!==unit&&u.alive).map(u=>({unit:u,hit:intersectParts(u,from,to,.1)})).filter(item=>item.hit).sort((a,b)=>a.hit!.t-b.hit!.t);
    const bodies=this.soldiers.filter(s=>s!==unit&&s.alive&&!isEmbarked(s)).map(s=>({soldier:s,t:segmentSphere(from,to,{x:s.x,y:targetHeight(s),z:s.z},.65)})).filter(b=>b.t!==null).sort((a,b)=>a.t!-b.t!);
    const firstBody=bodies[0];if(firstBody&&(!hits[0]||firstBody.t!<hits[0].hit!.t))return firstBody.soldier===target;
    return target&&isVehicle(target)?hits[0]?.unit===target:hits.length===0;
  }
  private fireAI(unit:Unit,target:SelectionTarget|null){
    if(!this.unitPowered(unit))return;
    const spec=unit.spec,point={x:target?.x??this.human.x,y:target?targetHeight(target):(this.flight?.altitude??0)+(this.prone?.5:1),z:target?.z??this.human.z};
    if(distance(unit,point)<(spec.ai.minimumRange??0))return;
    const slot=(unit.attackCycle++ +1)%spec.weapons.length,weapon=spec.weapons[slot];if(!weapon)return;
    if(isMissile(weapon)){
      let fired=false;for(let i=0;i<spec.ai.missileVolley;i++){if((unit.slotAmmo[slot]??0)<=0)break;
        const side=spec.ai.missileVolley===1?1:i%2===0?-1:1,from=this.missileOrigin(unit,weapon,side);
        if(unit.iff===this.iff&&!this.clearAIShot(unit,from,point,target))continue;
        const airborne=target?!isVehicle(target)&&!isFacility(target)&&!!target.flight:!this.mounted&&!this.passenger&&!!this.flight;
        const accuracy=airborne?AI_MISSILE_ACCURACY.airborne:AI_MISSILE_ACCURACY.ground;
        const seed=[...unit.id].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))|0,this.nextMissileId);
        const sample=(salt:number)=>{const n=Math.sin(seed+salt)*43758.5453;return (n-Math.floor(n))*2-1;};
        const bearing=Math.atan2(point.x-from.x,point.z-from.z),range=distance(from,point),lateral=Math.tan(accuracy.yawSpread)*range*sample(1),vertical=Math.tan(accuracy.pitchSpread)*range*sample(2);
        const offset={x:Math.cos(bearing)*lateral,y:vertical,z:-Math.sin(bearing)*lateral},aimPoint={x:point.x+offset.x,y:point.y+offset.y,z:point.z+offset.z};
        unit.slotAmmo[slot]!--;const missile=this.fireMissile(unit,weapon,side,aimPoint,target);
        missile.aiGuidance={point:aimPoint,offset,refreshAt:this.time+accuracy.updateInterval};fired=true;
      }
      if(fired)unit.cooldown=Math.max(MISSILE_INTERVAL,this.mission.tuning[this.difficulty].interval);return;
    }
    const profile=isLaser(weapon)?this.weapons.lasers[weapon]:this.weapons.guns[weapon],range=isLaser(weapon)?laserRange(weapon,unit.laserCharge,this.weapons.lasers[weapon]):profile.range;
    if(isLaser(weapon)?unit.energy<this.laserEnergyCost(unit,weapon):(unit.slotAmmo[slot]??0)<=0)return;
    const origin=this.sentryMuzzle(unit,weapon,{x:unit.x,y:unit.hoverHeight+spec.height*.6,z:unit.z});
    const length=Math.hypot(point.x-origin.x,point.y-origin.y,point.z-origin.z),fraction=Math.min(1,range/(length||1)),endpoint={x:origin.x+(point.x-origin.x)*fraction,y:origin.y+(point.y-origin.y)*fraction,z:origin.z+(point.z-origin.z)*fraction};
    if(isLaser(weapon)&&this.mission.companions?.some(member=>member.personId===unit.personId)&&this.weaponOrigins(unit,weapon,origin).some(muzzle=>!this.clearAIShot(unit,muzzle,point,target)))return;
    unit.cooldown=Math.max(profile.interval,this.mission.tuning[this.difficulty].interval);
    if(isLaser(weapon)){unit.energy-=this.laserEnergyCost(unit,weapon);unit.laserCharge=0;this.laserRechargePending.add(unit);this.fireLaser(unit,weapon,origin,endpoint,range);}
    else{unit.slotAmmo[slot]!--;if(weapon==='TCREAP'){this.fireReapTracer(unit,origin,endpoint);return;}for(const muzzle of this.weaponOrigins(unit,weapon,origin,slot))if(unit.iff!==this.iff||this.clearAIShot(unit,muzzle,point,target))this.fireAIBullet(unit,muzzle,endpoint,weapon as MachineGun,profile.damage);}
  }
  // Hitscan AI guns stop at the nearest physical contact, regardless of IFF.
  private fireAIBullet(owner:CombatTarget,from:Point3,to:Point3,weapon:MachineGun|'PRIF44',damage:number,infantryDamage=damage){
    let first=Infinity,hit:Unit|null|undefined,body:Soldier|undefined,structure:Facility|undefined,part:BodyPart='hull';
    for(const obstacle of this.terrainObstacles){const t=buildingContact(from,to,obstacle,.1);if(t!==null&&t<first){first=t;structure=isFacility(obstacle)?obstacle:undefined;}}
    for(const rock of this.mission.rocks){const t=segmentSphere(from,to,{x:rock.x,y:rock.r*.55,z:rock.z},rock.r+.1);if(t!==null&&t<first){first=t;structure=undefined;}}
    for(const unit of this.units){if(!unit.alive||unit===owner)continue;const contact=intersectParts(unit,from,to,.1);if(contact&&contact.t<first){first=contact.t;hit=unit;structure=undefined;part=contact.part;}}
    for(const soldier of this.soldiers){if(!soldier.alive||soldier===owner||isEmbarked(soldier))continue;const t=segmentSphere(from,to,{x:soldier.x,y:(soldier.flight?.altitude??0)+1,z:soldier.z},.75);if(t!==null&&t<first){first=t;hit=undefined;structure=undefined;body=soldier;}}
    if(!this.mounted&&!this.passenger&&!this.insideFacility&&this.humanHealth>0){const t=segmentSphere(from,to,{x:this.human.x,y:(this.flight?.altitude??0)+(this.prone?.5:1),z:this.human.z},this.prone?.75:1);if(t!==null&&t<first){first=t;hit=null;structure=undefined;body=undefined;}}
    if(from.y>.1&&to.y<=.1){const t=(from.y-.1)/(from.y-to.y);if(t<first){first=t;hit=undefined;structure=undefined;body=undefined;}}
    const point=first===Infinity?to:{x:from.x+(to.x-from.x)*first,y:from.y+(to.y-from.y)*first,z:from.z+(to.z-from.z)*first};
    this.emit({type:'shot',...(isVehicle(owner)?{unit:owner}:{soldier:owner}),from,to:point,weapon,position:from});
    if(structure)this.damageFacility(structure,damage,point);else if(body)this.damageSoldier(body,infantryDamage,point,owner);else if(hit!==undefined)this.damage(hit,hit===null?infantryDamage:damage,part,point,owner,weapon);
    else if(first!==Infinity)this.emit({type:'impact',weapon,position:point});
  }
  get guidedMissile(){return this.status==='running'&&this.mounted?.alive?this.missiles.find(p=>p.id===this.guidedMissileId&&p.owner===this.mounted!.id):undefined;}
  releaseGuidance(reason='released'){if(this.guidedMissileId===null)return;this.guidedMissileId=null;this.emit({type:'guidance-end',text:reason});}
  private shouldRamPlayer(unit:Unit){
    return unit.kind==='scorp-asv'&&unit.lured&&!this.mounted&&!this.passenger&&this.isHostile(unit)&&!!this.mission.lures?.some(rule=>rule.unitId===unit.id&&rule.weapon==='VISOM'&&rule.onFootResponse==='ram-player');
  }
  private waitingForLure(unit:Unit){return !unit.lured&&!!this.mission.lures?.some(rule=>rule.unitId===unit.id);}
  private lureImpact(unit:Unit,missile:Missile){const rule=this.mission.lures?.find(r=>r.unitId===unit.id&&r.weapon===missile.weapon);
    if(!rule||unit===this.mounted||!missile.playerOwned||!unit.alive||!unit.pilot||unit.lured)return;
    unit.lureHits++;if(unit.lureHits>=rule.hits){unit.lured=true;unit.alert=true;unit.aggressorId='player';this.emit({type:'lured',unit});}
  }
  get player():Vec{return this.mounted??this.passenger??this.insideFacility??this.human;} get yaw(){return this.mounted?.yaw??this.passenger?.yaw??this.humanYaw;} get aim(){return this.mounted?.aim??this.passenger?.yaw??this.humanYaw;}
  get enemies(){return this.units.filter(u=>u.alive&&u.pilot&&this.isHostile(u));}
  get detected(){return this.status==='running'&&this.enemies.some(u=>u!==this.mounted&&u.alert&&this.isHostile(u))||this.status==='running'&&this.soldiers.some(s=>s.alive&&!isEmbarked(s)&&s.alert&&this.soldierHostile(s));}
  get kills(){return this.units.filter(u=>u.spec.faction!==this.mission.playerFaction&&(!u.alive||this.soldiers.some(s=>s.sourceVehicle===u.id&&!s.alive))).length;}
  emit(e:GameEvent){this.events.push(e);}
  private humanVelocity={x:0,z:0};
  private centerVehicle(unit:Unit,stop=true){unit.aim=unit.yaw;unit.aimPitch=0;if(stop)unit.speed=0;unit.alert=false;unit.aggressorId=null;unit.aggressorUntil=0;}
  private pilotReserved(unit:Unit,id:string){return this.soldiers.some(s=>s.alive&&s.id!==id&&s.boardingTarget===unit.id&&s.boardingRole==='pilot');}
  private cancelBoarding(soldier:Soldier){soldier.boardingTarget=undefined;soldier.boardingRole=undefined;}
  private validBoarding(soldier:Soldier,unit:Unit|undefined){return soldier.alive&&soldier.iff===this.iff&&!!unit?.alive&&unit.spec.boardable!==false&&!this.entryShielded(unit)&&(soldier.boardingRole==='pilot'?!unit.pilot:unit.iff===soldier.iff&&unit.passengers.length<unit.spec.passengerCapacity);}
  private canReserve(unit:Unit,iff:string,id:string){return unit.alive&&unit.iff===iff&&unit.spec.passengerCapacity>0&&unit.passengers.length+this.soldiers.filter(s=>s.alive&&s.iff===unit.iff&&s.id!==id&&s.boardingTarget===unit.id&&s.boardingRole!=='pilot').length<unit.spec.passengerCapacity;}
  entryShielded(target:Unit|Facility){
    const faction=isFacility(target)?target.faction:target.spec.faction;
    if(faction===this.mission.playerFaction||!isFacility(target)&&target.spec.category!=='tower')return false;
    return this.facilities.some(f=>f.alive&&f.facilityType==='shield-generator'&&f.faction===faction);
  }
  get entryBlockReason(){
    const near=this.boardingTargets.filter(t=>t.alive&&this.entryDistance(t)<BOARDING_DISTANCE).sort((a,b)=>this.entryDistance(a)-this.entryDistance(b))[0];
    if(!near)return null;
    if((isFacility(near)?near.boardable:near.spec.boardable)===false)return 'forbidden';
    if(this.entryShielded(near))return 'generator';
    return near.pilot?'occupied':null;
  }
  get boardingTargets(){return [...this.units,...this.facilities];}
  entryDistance(target:Unit|Facility){return isFacility(target)?facilityDistance(target,this.human):distance(target,this.human);}
  canBoard(unit:Unit|Facility,allowPassenger=true){
    if(this.entryDistance(unit)>=BOARDING_DISTANCE)return false;
    const boardable=isFacility(unit)?unit.boardable:unit.spec.boardable;
    if(entryAllowed({...unit,boardable},this.entryShielded(unit)))return isFacility(unit)||!this.pilotReserved(unit,'player');
    return !isFacility(unit)&&unit.alive&&boardable!==false&&!this.entryShielded(unit)&&unit.pilot&&allowPassenger&&this.canReserve(unit,this.iff,'player');
  }
  private exitPassenger(soldier?:Soldier,launch=true){
    const unit=soldier?this.units.find(u=>u.id===soldier.passengerOf):this.passenger;if(!unit)return;
    unit.passengers=unit.passengers.filter(id=>id!==(soldier?.id??'player'));
    const point={x:unit.x+Math.cos(unit.yaw)*9,z:unit.z-Math.sin(unit.yaw)*9};
    if(soldier){Object.assign(soldier,point);soldier.velocity=undefined;soldier.passengerOf=undefined;this.cancelBoarding(soldier);soldier.flight=launch&&unit.spec.ejectionSeat!==false&&unit.spec.category!=='tower'?launchFlight(unit.spec.height,unit.yaw):null;}
    else{this.passenger=null;this.humanVelocity={x:0,z:0};this.human=point;this.humanYaw=unit.yaw;this.flight=launch&&unit.spec.ejectionSeat!==false&&unit.spec.category!=='tower'?launchFlight(unit.spec.height,unit.yaw):null;this.pitch=0;this.throttle=0;this.speed=0;this.emit({type:'eject',unit,launch:!!this.flight});}
  }
  board(allowPassenger=true){if(this.mounted||this.passenger||this.insideFacility||this.flight||this.status!=='running')return false;const u=this.boardingTargets.filter(u=>this.canBoard(u,allowPassenger)).sort((a,b)=>this.entryDistance(a)-this.entryDistance(b))[0];if(!u)return false;
    if(isFacility(u)){this.insideFacility=u;u.pilot=true;this.human={x:u.x,z:u.z};this.humanYaw=u.yaw;this.humanVelocity={x:0,z:0};this.pitch=0;this.throttle=0;this.speed=0;this.tracking=false;this.clearTarget();this.emit({type:'board',facility:u});return true;}
    if(u.pilot){this.footRechargePending.clear();this.humanVelocity={x:0,z:0};this.passenger=u;this.humanVelocity={x:0,z:0};this.setTarget(null);u.passengers.push('player');this.pitch=0;this.throttle=0;this.speed=0;this.tracking=false;this.emit({type:'board',unit:u});this.applyBoardingOrders(u);return true;}
this.footRechargePending.clear();this.centerVehicle(u,false);this.humanVelocity={x:0,z:0};this.mounted=u;this.boardedUnits.add(u.id);u.hoverDisabled=false;u.iff=this.iff;this.pitch=0;u.aimPitch=0;this.tracking=false;u.pilot=true;this.throttle=0;this.speed=u.speed;this.emit({type:'board',unit:u});this.applyBoardingOrders(u);return true;}
  eject(mode:'launch'|'ground'='launch'){
    if(this.insideFacility){const facility=this.insideFacility;facility.pilot=false;this.insideFacility=null;this.human=facilityExit(facility);this.flight=null;this.humanVelocity={x:0,z:0};this.humanYaw=facility.yaw;this.pitch=0;this.throttle=0;this.speed=0;this.emit({type:'eject',facility,launch:false});return;}
    if(this.passenger&&this.status==='running'){this.exitPassenger();return;}
    if(!this.mounted||this.status!=='running')return;
    this.releaseGuidance('ejected');const u=this.mounted;this.playerIff=u.iff;u.pilot=false;this.centerVehicle(u,false);this.humanVelocity={x:0,z:0};
    const launch=mode==='launch'&&u.spec.ejectionSeat!==false&&u.spec.category!=='tower';
    this.human=launch?{x:u.x,z:u.z}:{x:u.x+Math.cos(u.yaw)*9,z:u.z-Math.sin(u.yaw)*9};
    this.flight=launch?launchFlight(u.spec.height,u.yaw):null;
    this.humanYaw=u.yaw;this.pitch=0;this.tracking=false;this.mounted=null;this.throttle=0;this.speed=0;this.emit({type:'eject',unit:u,launch});
  }
  private advanceFlight(body:Vec,flight:Flight,dt:number){
    const next={x:body.x+flight.vx*dt,z:body.z+flight.vz*dt};
    flight.vy-=9.8*dt;const altitude=flight.altitude+flight.vy*dt;
    // An airborne body can clear low wreckage; ground movement cannot.
    if(Math.abs(next.x)<=this.mission.terrain.halfWidth&&next.z>=this.mission.terrain.minZ&&next.z<=this.mission.terrain.maxZ){
      const from={...body,y:flight.altitude+.9},to={...next,y:altitude+.9};let contact=1;
      for(const obstacle of this.terrainObstacles){const t=buildingContact(from,to,obstacle,.4);if(t!==null)contact=Math.min(contact,Math.max(0,t-.001));}
      for(const water of this.riverObstacles){const hit=buildingMotionContact(body,next,water,.4);if(hit)contact=Math.min(contact,Math.max(0,hit.t-.001));}
      for(const rock of this.mission.rocks){const t=segmentSphere(from,to,{x:rock.x,y:rock.r*.55,z:rock.z},rock.r+.4);if(t!==null)contact=Math.min(contact,Math.max(0,t-.001));}
      body.x+=(next.x-body.x)*contact;body.z+=(next.z-body.z)*contact;
    }
    flight.altitude=altitude;
    return flight.altitude<=0?null:flight;
  }
  forceEject(unit:Unit,cause:'gas'|'destruction'|'boarding'='gas'){
    if(!unit.alive||!unit.pilot||unit===this.mounted)return null;
    if(cause==='gas'&&unit.spec.category==='hovercraft')unit.hoverDisabled=true;
    unit.pilot=false;this.centerVehicle(unit,cause==='destruction');unit.order=null;
    let soldier=this.soldiers.find(s=>s.driverOf===unit.id&&s.alive);
    if(cause==='destruction'&&unit.spec.ejectionSeat===false){
      if(soldier){soldier.driverOf=undefined;soldier.flight=null;soldier.velocity=undefined;soldier.health=0;soldier.alive=false;this.cancelBoarding(soldier);}
      this.emit({type:'soldier-death',soldier,faction:soldier?.faction??unit.spec.faction,position:{x:unit.x,y:unit.spec.height*.6,z:unit.z}});return null;
    }

    if(!soldier){soldier={id:`pilot-${unit.id}-${this.soldiers.length}`,sourceVehicle:unit.id,personId:unit.personId,faction:unit.spec.faction,iff:unit.iff,aggressorId:null,aggressorUntil:0,x:unit.x,z:unit.z,yaw:unit.yaw,health:35,alive:true,alert:true,cooldown:1.5,flight:null};this.soldiers.push(soldier);}
    soldier.order=undefined;soldier.driverOf=undefined;soldier.iff=unit.iff;soldier.yaw=unit.yaw;this.cancelBoarding(soldier);
    const launch=cause!=='boarding'&&unit.spec.ejectionSeat!==false&&unit.spec.category!=='tower';soldier.velocity=undefined;soldier.x=unit.x+(launch?0:Math.cos(unit.yaw)*9);soldier.z=unit.z-(launch?0:Math.sin(unit.yaw)*9);soldier.flight=launch?launchFlight(unit.spec.height,unit.yaw):null;
    if(cause!=='boarding')this.emit({type:'pilot-eject',unit,soldier,ejection:cause});return soldier;
  }
  private killVehicleCrew(unit:Unit){
    if(!unit.alive)return;
    const crew=this.soldiers.filter(s=>s.alive&&(s.driverOf===unit.id||s.passengerOf===unit.id));
    if(unit.pilot&&!crew.some(s=>s.driverOf===unit.id)){
      const pilot:Soldier={id:`pilot-${unit.id}-${this.soldiers.length}`,sourceVehicle:unit.id,driverOf:unit.id,personId:unit.personId,faction:unit.spec.faction,iff:unit.iff,aggressorId:null,aggressorUntil:0,x:unit.x,z:unit.z,yaw:unit.yaw,health:35,alive:true,alert:false,cooldown:0,flight:null};
      this.soldiers.push(pilot);crew.push(pilot);
    }
    for(const soldier of crew){soldier.health=0;soldier.alive=false;soldier.flight=null;soldier.velocity=undefined;soldier.driverOf=unit.id;soldier.passengerOf=undefined;this.cancelBoarding(soldier);this.emit({type:'soldier-death',soldier,faction:soldier.faction,position:{x:unit.x,y:unit.spec.height*.6,z:unit.z}});}
    // Dead occupants remain associated with the cabin and never become ground actors.
    unit.passengers=[];unit.pilot=false;unit.order=null;
  }
  private activeAggressor(actor:CombatTarget){
    if(actor.aggressorId==='player'){if(this.humanHealth>0&&actor.iff!==this.iff)return this.mounted??this.passenger??this.human;}
    else if(actor.aggressorId){const target=this.combatTargets.find(t=>t.id===actor.aggressorId&&t.alive&&(!isVehicle(t)||t.pilot)&&t.iff!==actor.iff);if(target)return target;}
    actor.aggressorId=null;actor.aggressorUntil=0;return null;
  }
  private rememberAggressor(actor:CombatTarget,attacker:CombatTarget|null){
    const player=!attacker||attacker===this.mounted;if(actor.iff===(player?this.iff:attacker!.iff))return;
    const current=this.activeAggressor(actor);if(current&&this.time<actor.aggressorUntil)return;
    actor.aggressorId=player?'player':attacker!.id;actor.aggressorUntil=this.time+AGGRO_LOCK_SECONDS;
  }
  private damageSoldier(soldier:Soldier,amount:number,position:Point3,attacker:CombatTarget|null=null){
    if(!soldier.alive||isEmbarked(soldier))return;if(amount>0)this.rememberAggressor(soldier,attacker);soldier.health=Math.max(0,soldier.health-amount);this.emit({type:'soldier-hit',soldier,position});
    if(soldier.health===0){soldier.alive=false;this.cancelBoarding(soldier);this.emit({type:'soldier-death',soldier,position});}
  }
  private crushSoldier(soldier:Soldier,from:Point3,previousVehicle:Vec,unit:Unit|null=this.mounted){
    if(!unit?.alive||!soldier.alive||isEmbarked(soldier)||unit.iff===soldier.iff)return false;
    const to={x:soldier.x,y:soldier.flight?.altitude??0,z:soldier.z};
    if(!sweptVehicleContact(unit,previousVehicle,from,to))return false;
    this.damageSoldier(soldier,soldier.health,to);return true;
  }
  private soldierHostile(soldier:Soldier){return this.isHostile(soldier);}
  private moveInfantry(actor:Vec,yaw:number,speed:number,dt:number){
    const soldier=this.soldiers.find(s=>s===actor),previous=actor===this.human?this.humanVelocity:soldier?.velocity??{x:0,z:0};
    let velocity=infantryVelocity(previous,yaw,speed,dt);const from={x:actor.x,z:actor.z},magnitude=Math.hypot(velocity.x,velocity.z);
    if(magnitude>0)this.move(actor,Math.atan2(velocity.x,velocity.z),magnitude*dt);
    if(dt>0)velocity={x:(actor.x-from.x)/dt,z:(actor.z-from.z)/dt};
    if(actor===this.human){this.humanVelocity=velocity;this.speed=Math.hypot(velocity.x,velocity.z)*(velocity.x*Math.sin(this.humanYaw)+velocity.z*Math.cos(this.humanYaw)<0?-1:1);}
    else if(soldier)soldier.velocity=velocity;
  }
  private brakingUnits=new Set<string>();
  private coastVehicle(unit:Unit,dt:number){this.brakingUnits.add(unit.id);unit.speed=accelerateSpeed(unit.speed,0,dt,unit.hoverDisabled?undefined:unit.kind);if(unit.speed)this.move(unit,unit.yaw,unit.speed*dt);}
  private tickFootOrder(soldier:Soldier,dt:number,from:Point3){
    const order=soldier.order;if(order===undefined)return false;
    const complete=()=>{soldier.order=null;this.emit({type:'ally-order-complete',soldier,command:order?.kind,targetId:order?.targetId});};
    if(order?.kind==='follow'){
      const anchor=order.targetId?this.selectionTargets.find(t=>t.id===order.targetId&&t.alive):undefined;
      if(order.targetId&&!anchor){complete();this.moveInfantry(soldier,soldier.yaw,0,dt);return true;}
      const slot=Math.max(0,(this.mission.companions??[]).findIndex(m=>m.personId===soldier.personId));
      this.approachPerson(soldier,followPosition(anchor??this.player,anchor?.yaw??this.yaw,slot),dt,3.5);
      for(const unit of this.units)if(unit.pilot)this.crushSoldier(soldier,from,unit,unit);return true;
    }
    const target=order?.kind==='attack'?this.combatTargets.find(t=>t.id===order.targetId):this.combatTargets.filter(t=>t!==soldier&&t.alive&&(!isVehicle(t)||t.pilot)&&t.iff!==soldier.iff&&distance(t,soldier)<=INFANTRY_WEAPONS.PRIF44.range&&this.lineOfSight(soldier,t)).sort((a,b)=>distance(a,soldier)-distance(b,soldier))[0];
    if(order?.kind==='attack'&&!this.validAttackTarget(target)){complete();this.moveInfantry(soldier,soldier.yaw,0,dt);return true;}
    const visible=!!target&&this.lineOfSight(soldier,target),range=INFANTRY_WEAPONS.PRIF44.range;
    if(order?.kind==='attack'&&target&&(distance(soldier,target)>range*.65||!visible))this.approachPerson(soldier,target,dt,visible?range*.65:0);
    else this.moveInfantry(soldier,soldier.yaw,0,dt);
    for(const unit of this.units)if(unit.pilot)this.crushSoldier(soldier,from,unit,unit);if(!soldier.alive)return true;
    soldier.alert=!!target;if(!target)return true;
    const bearing=Math.atan2(target.x-soldier.x,target.z-soldier.z);soldier.yaw+=Math.max(-INFANTRY_MOVEMENT.turn*dt,Math.min(INFANTRY_MOVEMENT.turn*dt,angle(bearing-soldier.yaw)));
    const origin={x:soldier.x,y:1.2,z:soldier.z},to={x:target.x,y:targetHeight(target),z:target.z};
    if(Math.hypot(to.x-origin.x,to.y-origin.y,to.z-origin.z)<=range&&Math.abs(angle(bearing-soldier.yaw))<.025&&soldier.cooldown===0&&this.clearAIShot(soldier,origin,to,target)){
      soldier.cooldown=INFANTRY_WEAPONS.PRIF44.cooldown;this.fireAIBullet(soldier,origin,to,'PRIF44',INFANTRY_WEAPONS.PRIF44.vehicleDamage,INFANTRY_WEAPONS.PRIF44.damage);
    }
    return true;
  }
  private tickSoldiers(dt:number){
    for(const soldier of this.soldiers){
      if(isEmbarked(soldier))continue;
      if(!soldier.alive){if(soldier.flight)soldier.flight=this.advanceFlight(soldier,soldier.flight,dt);continue;}
      const from={x:soldier.x,y:soldier.flight?.altitude??0,z:soldier.z};
      if(soldier.boardingTarget){const carrier=this.units.find(u=>u.id===soldier.boardingTarget);
        if(!this.validBoarding(soldier,carrier)){this.cancelBoarding(soldier);}
        else if(!soldier.flight){if(distance(soldier,carrier!)<BOARDING_DISTANCE){
          if(soldier.boardingRole==='pilot'){
            for(const old of this.units)if(old!==carrier&&old.personId===soldier.personId)delete old.personId;
            this.centerVehicle(carrier!,false);soldier.velocity=undefined;carrier!.hoverDisabled=false;carrier!.personId=soldier.personId;carrier!.iff=soldier.iff;carrier!.pilot=true;carrier!.order=null;soldier.driverOf=carrier!.id;soldier.sourceVehicle=carrier!.id;soldier.order=undefined;
          }else{carrier!.passengers.push(soldier.id);soldier.passengerOf=carrier!.id;soldier.order=undefined;}
          this.cancelBoarding(soldier);soldier.x=carrier!.x;soldier.z=carrier!.z;this.emit({type:'board',unit:carrier,soldier});continue;}
          this.approachPerson(soldier,carrier!,dt);for(const unit of this.units)if(unit.pilot)this.crushSoldier(soldier,from,unit,unit);continue;}
      }
      if(soldier.flight){soldier.flight=this.advanceFlight(soldier,soldier.flight,dt);for(const unit of this.units)if(unit.pilot)this.crushSoldier(soldier,from,unit,unit);continue;}
      soldier.cooldown=Math.max(0,soldier.cooldown-dt);
      if(this.tickFootOrder(soldier,dt,from))continue;
      if(this.mission.pickups?.some(p=>p.personId===soldier.personId)){this.approachPerson(soldier,this.player,dt,6);continue;}
      const opponents:{position:Vec;unit:Unit|null}[]=this.units.filter(u=>u.alive&&u.pilot&&u!==this.mounted&&u.iff!==soldier.iff).map(u=>({position:u,unit:u as Unit|null}));
      if(this.soldierHostile(soldier))opponents.push({position:this.player,unit:this.mounted??this.passenger});
      const aggressor=this.activeAggressor(soldier);
      const visible=opponents.filter(o=>distance(soldier,o.position)<120&&this.lineOfSight(soldier,o.position)).sort((a,b)=>distance(soldier,a.position)-distance(soldier,b.position));
      const opponent=aggressor?opponents.find(o=>o.position===aggressor):visible[0];
      if(!opponent){soldier.alert=false;this.moveInfantry(soldier,soldier.yaw,0,dt);continue;}soldier.alert=true;
      const dist=distance(soldier,opponent.position),away=Math.atan2(soldier.x-opponent.position.x,soldier.z-opponent.position.z);
      const bearing=away+Math.PI;
      soldier.yaw+=Math.max(-INFANTRY_MOVEMENT.turn*dt,Math.min(INFANTRY_MOVEMENT.turn*dt,angle(bearing-soldier.yaw)));
      this.moveInfantry(soldier,away,dist<45?3.5:0,dt);
      for(const unit of this.units)if(unit.pilot)this.crushSoldier(soldier,from,unit,unit);if(!soldier.alive)continue;
      const aim=Math.atan2(opponent.position.x-soldier.x,opponent.position.z-soldier.z);
      if(dist<100&&Math.abs(angle(aim-soldier.yaw))<.025&&this.lineOfSight(soldier,opponent.position)&&soldier.cooldown===0){
        const origin={x:soldier.x,y:1.2,z:soldier.z},range=dist+2,targetY=opponent.unit?targetHeight(opponent.unit):this.eyeHeight;
        const to={x:origin.x+Math.sin(soldier.yaw)*range,y:origin.y+(targetY-origin.y)*range/(distance(soldier,opponent.position)||1),z:origin.z+Math.cos(soldier.yaw)*range};
        soldier.cooldown=1.4;this.fireAIBullet(soldier,origin,to,'PRIF44',INFANTRY_WEAPONS.PRIF44.vehicleDamage,INFANTRY_WEAPONS.PRIF44.damage);
      }
    }
  }
  aimBy(delta:number){if(this.passenger)return;const missile=this.guidedMissile;if(missile){steerMissile(missile,delta,0);return;}const u=this.mounted;if(u){const limit=u.spec.torsoLimit;u.aim=u.yaw+Math.max(-limit,Math.min(limit,angle(u.aim+delta-u.yaw)));}else this.humanYaw+=delta;}
  aimMouseBy(x:number,y:number,sensitivity=1){
    const guided=!!this.guidedMissile,u=this.mounted,profile=manualAimFor(guided?undefined:u?.kind),yaw=x*profile.mouseYawPerPixel*sensitivity;
    if(!guided&&u&&isHawc(u.kind)){
      const limit=u.spec.torsoLimit;
      if(limit>=Math.PI)u.aim+=yaw;
      else{const relative=angle(u.aim-u.yaw)+yaw,clamped=Math.max(-limit,Math.min(limit,relative));u.yaw+=relative-clamped;u.aim=u.yaw+clamped;}
    }else this.aimBy(yaw);
    this.lookBy(-y*profile.mousePerPixel*sensitivity);
  }
  lookBy(delta:number){if(this.passenger)return;const missile=this.guidedMissile;if(missile)steerMissile(missile,0,delta);else this.pitch=Math.max(-1.2,Math.min(.8,this.pitch+delta));}
  get eyeHeight(){if(this.insideFacility)return this.insideFacility.height*.65;if(this.passenger)return this.passenger.spec.height*.9;return this.mounted?this.mounted.hoverHeight+((this.mounted.kind==='union-sentry'||this.mounted.kind==='merc-assault')?this.mounted.spec.height*.6+VEHICLE_SHAPES[this.mounted.kind].cockpit.y+.15:this.mounted.spec.height*.81):(this.flight?.altitude??0)+(this.prone?.7:1.7);}
  targetElevation(unit:SelectionTarget){return Math.atan2(targetHeight(unit)-this.eyeHeight,distance(unit,this.player));}
  get activeWaypoint(){return this.mission.waypoints.find(w=>w.id===this.selectedWaypoint)??null;}
  cycleWaypoint(){if(this.passenger)return this.activeWaypoint;const index=this.mission.waypoints.findIndex(w=>w.id===this.selectedWaypoint);this.selectedWaypoint=this.mission.waypoints[index+1]?.id??null;return this.activeWaypoint;}
  get combatTargets():CombatTarget[]{return [...this.units,...this.soldiers.filter(s=>!isEmbarked(s))];}
  get selectionTargets():SelectionTarget[]{return [...this.combatTargets,...this.facilities];}
  get target(){return this.selectionTargets.find(u=>u.id===this.selected&&u.alive&&u!==this.mounted)??null;}
  private setTarget(unit:SelectionTarget|null){this.selected=unit?.id??null;if(!unit)this.tracking=false;this.emit({type:'target',unit:unit&&isVehicle(unit)?unit:undefined,soldier:unit&&!isVehicle(unit)&&!isFacility(unit)?unit:undefined,facility:unit&&isFacility(unit)?unit:undefined});}
  private acquireHitTarget(target:SelectionTarget|null|undefined){if(target?.alive&&target!==this.mounted&&!this.target)this.setTarget(target);}
  selectTarget(){if(this.passenger)return;this.setTarget(this.selectionTargets.filter(u=>isFacility(u)?this.isHostile(u):this.validAttackTarget(u)).sort((a,b)=>distance(a,this.player)-distance(b,this.player))[0]??null);}
  selectInCrosshair(){
    if(this.passenger)return null;
    this.emit({type:'target-select'});
    const candidates=this.selectionTargets.filter(unit=>unit.alive&&unit!==this.mounted).map(unit=>{
      const range=distance(unit,this.player),horizontal=Math.abs(angle(Math.atan2(unit.x-this.player.x,unit.z-this.player.z)-this.aim)),vertical=Math.abs(this.targetElevation(unit)-this.pitch);
      return {unit,range,horizontal,vertical};
    }).filter(c=>c.range<=CROSSHAIR_SELECTION.range&&c.horizontal<Math.max(CROSSHAIR_SELECTION.horizontalAngle,Math.atan2(isFacility(c.unit)?Math.max(c.unit.width,c.unit.depth)*.5:2.5,c.range))&&c.vertical<Math.max(CROSSHAIR_SELECTION.verticalAngle,Math.atan2(isFacility(c.unit)?c.unit.height*.5:isVehicle(c.unit)?c.unit.spec.height*.5:.9,c.range)));
    const unit=candidates.sort((a,b)=>Math.hypot(a.horizontal,a.vertical)-Math.hypot(b.horizontal,b.vertical)||a.range-b.range)[0]?.unit;
    this.setTarget(unit??null);
    return unit??null;
  }
  cycleTarget(reverse=false){if(this.passenger)return;const list=this.selectionTargets.filter(u=>u.alive&&u!==this.mounted).sort((a,b)=>distance(a,this.player)-distance(b,this.player));const current=list.findIndex(u=>u.id===this.selected);const index=current<0?(reverse?list.length-1:0):(current+(reverse?-1:1)+list.length)%list.length;this.setTarget(list[index]??null);}
  clearTarget(){this.setTarget(null);}
  weaponRange(slot:number){if(!this.mounted)return INFANTRY_WEAPONS.PRIF44.range;const weapon=this.mounted.spec.weapons[slot-1];if(!weapon)return 0;return isLaser(weapon)?laserRange(weapon,this.mounted.laserCharge,this.weapons.lasers[weapon]):isMissile(weapon)?this.weapons.missiles[weapon].speed*this.weapons.missiles[weapon].lifetime:this.weapons.guns[weapon].range;}
  private attackVisible(from:Vec,target:Vec){
    if(!isFacility(target))return this.lineOfSight(from,target);
    const contact=buildingContact({...from,y:1},{x:target.x,y:targetHeight(target),z:target.z},target),fraction=Math.max(0,(contact??1)-.001);
    return this.lineOfSight(from,{x:from.x+(target.x-from.x)*fraction,z:from.z+(target.z-from.z)*fraction});
  }
  private selectionVisible(unit:SelectionTarget){
    if(!isFacility(unit))return this.lineOfSight(this.player,unit);
    const from={...this.player,y:this.eyeHeight},to={x:unit.x,y:targetHeight(unit),z:unit.z},contact=buildingContact(from,to,unit);
    const fraction=Math.max(0,(contact??1)-.001);
    return this.lineOfSight(from,{x:from.x+(to.x-from.x)*fraction,z:from.z+(to.z-from.z)*fraction});
  }
  get targetState(){const unit=this.target;if(!unit)return null;const dist=distance(unit,this.player),inSight=this.selectionVisible(unit),onAim=Math.abs(this.targetElevation(unit)-this.pitch)<.085&&Math.abs(angle(Math.atan2(unit.x-this.player.x,unit.z-this.player.z)-this.aim))<.085;return {unit,distance:dist,inSight,onAim,locked:onAim&&inSight&&dist<(this.mounted?Math.max(this.weaponRange(1),this.weaponRange(2)):150),shield:isFacility(unit)?0:isVehicle(unit)?unit.shield/unit.spec.shield:unit.health/35,armor:isFacility(unit)?this.facilityIntegrity(unit):isVehicle(unit)?unit.armor/unit.spec.armor:unit.health/35};}

  isHostile(u:SelectionTarget){return u!==this.mounted&&u.iff!==this.iff;} // 6707 is a provisional Merc disguise, not a mission requirement.
  lineOfSight(a:Vec,b:Vec){const dx=b.x-a.x,dz=b.z-a.z,dd=dx*dx+dz*dz;return !this.terrainObstacles.some(building=>crossesBuilding(a,b,building))&&!this.mission.rocks.some(r=>{const t=Math.max(0,Math.min(1,((r.x-a.x)*dx+(r.z-a.z)*dz)/(dd||1)));return Math.hypot(a.x+t*dx-r.x,a.z+t*dz-r.z)<r.r;});}
  private collisionContacts=new Map<string,readonly string[]>();
  move(u:Vec,yaw:number,step:number){
    const destination={x:u.x+Math.sin(yaw)*step,z:u.z+Math.cos(yaw)*step},terrain=this.mission.terrain;
    const inside=(p:Vec)=>Math.abs(p.x)<=terrain.halfWidth&&p.z>=terrain.minZ&&p.z<=terrain.maxZ;
    if(!inside(destination))return;
    const vehicle=this.units.find(unit=>unit===u);
    if(!vehicle){
      const soldier=this.soldiers.find(s=>s===u),iff=u===this.human?this.iff:soldier?.iff,position={x:u.x,z:u.z};let remaining={x:destination.x-u.x,z:destination.z-u.z};
      for(let pass=0;pass<6;pass++){
        const end={x:position.x+remaining.x,z:position.z+remaining.z};let first:{unit?:Unit;t:number;nx:number;nz:number}|null=null;
        for(const unit of this.units){if(!unit.alive)continue;const boarding=soldier?.boardingTarget===unit.id||u===this.human&&(!unit.pilot||unit.iff===this.iff&&unit.spec.passengerCapacity>unit.passengers.length);const radius=boarding?Math.min(vehicleRadius(unit.kind)+.35,BOARDING_DISTANCE-.15):vehicleRadius(unit.kind)+.35;const contact=circleMotionContact(position,end,unit,radius);if(contact&&(!first||contact.t<first.t))first={unit,...contact};}
        for(const obstacle of this.movementObstacles()){const contact=buildingMotionContact(position,end,obstacle,2);if(contact&&(!first||contact.t<first.t))first=contact;}
        for(const rock of this.mission.rocks){const contact=circleMotionContact(position,end,rock,rock.r+2);if(contact&&(!first||contact.t<first.t))first=contact;}
        if(!first){Object.assign(position,end);break;}
        if(first.unit?.pilot&&iff!==undefined&&first.unit.iff!==iff){if(soldier)this.damageSoldier(soldier,soldier.health,{...position,y:0},first.unit);else if(u===this.human&&!this.occupiedContact(first.unit,false))this.damage(null,this.humanHealth);}
        const fraction=Math.max(0,first.t-.001);position.x+=remaining.x*fraction;position.z+=remaining.z*fraction;
        remaining={x:remaining.x*(1-fraction),z:remaining.z*(1-fraction)};const inward=remaining.x*first.nx+remaining.z*first.nz;
        if(inward<0){remaining.x-=inward*first.nx;remaining.z-=inward*first.nz;}if(Math.hypot(remaining.x,remaining.z)<1e-6)break;
      }
      Object.assign(u,position);return;
    }
    const length=Math.abs(step);if(length<1e-9)return;
    type Contact={t:number;nx:number;nz:number;key:string;actors:readonly string[];other?:Unit};
    const firstContact=(from:Vec,to:Vec)=>{
      let hit:Contact|null=null;
      const take=(contact:{t:number;nx:number;nz:number}|null,key:string,actors:readonly string[],other?:Unit)=>{if(contact&&(!hit||contact.t<hit.t))hit={...contact,key,actors,other};};
      for(const other of this.units){if(other===vehicle||!other.alive)continue;
        const actors=[vehicle.id,other.id].sort();take(circleMotionContact(from,to,other,vehicleRadius(vehicle.kind)+vehicleRadius(other.kind)),JSON.stringify(actors),actors,other);
      }
      const groundActors=[...this.soldiers.filter(s=>s.alive&&!s.flight&&!isEmbarked(s)&&(!vehicle.pilot||s.iff===vehicle.iff)),...(!this.mounted&&!this.passenger&&!this.flight&&(!vehicle.pilot||this.iff===vehicle.iff)?[this.human]:[])];
      for(const actor of groundActors){const id=actor===this.human?'player':(actor as Soldier).id;take(circleMotionContact(from,to,actor,vehicleRadius(vehicle.kind)+.35),`${vehicle.id}/infantry/${id}`,[vehicle.id,id]);}
      for(const [i,rock] of this.mission.rocks.entries())take(circleMotionContact(from,to,rock,rock.r+2),`${vehicle.id}/rock/${i}`,[vehicle.id]);
      for(const b of this.movementObstacles(vehicle))take(buildingMotionContact(from,to,b,buildingClearance(vehicle)),`${vehicle.id}/wall/${b.x}/${b.z}`,[vehicle.id]);
      return hit as Contact|null;
    };
    const start={x:u.x,z:u.z},position={...start},touching=new Set<string>();let remaining={x:destination.x-start.x,z:destination.z-start.z},stopped=false;
    for(let pass=0;pass<6;pass++){
      const end={x:position.x+remaining.x,z:position.z+remaining.z},hit=firstContact(position,end);
      if(!hit){if(inside(end))Object.assign(position,end);break;}
      touching.add(hit.key);const magnitude=Math.hypot(remaining.x,remaining.z),inward=-(remaining.x*hit.nx+remaining.z*hit.nz),incidence=inward/(magnitude||1),fraction=Math.max(0,hit.t-.001);
      position.x+=remaining.x*fraction;position.z+=remaining.z*fraction;
      // A broad frontal impact stops; a shallow contact retains its tangent motion.
      if(incidence>=.75){
        if(!this.collisionContacts.has(hit.key)&&Math.max(Math.abs(vehicle.speed),length/.05)>=2){this.emit({type:'vehicle-contact',unit:vehicle,otherUnitId:hit.other?.id,position:{...position,y:vehicle.spec.height*.3}});}
        this.collisionContacts.set(hit.key,hit.actors);stopped=true;break;
      }
      remaining={x:remaining.x*(1-fraction),z:remaining.z*(1-fraction)};
      const normal=remaining.x*hit.nx+remaining.z*hit.nz;if(normal<0){remaining.x-=normal*hit.nx;remaining.z-=normal*hit.nz;}
      if(Math.hypot(remaining.x,remaining.z)<1e-5)break;
    }
    for(const [key,actors] of this.collisionContacts)if(actors.includes(vehicle.id)&&!touching.has(key))this.collisionContacts.delete(key);
    Object.assign(u,position);
    vehicle.speed=stopped?0:vehicle.speed*Math.min(1,distance(start,position)/length);if(vehicle===this.mounted)this.speed=vehicle.speed;
  }

  damage(u:Unit|null,amount:number,part:BodyPart='hull',position?:Point3,attacker?:CombatTarget|null,weapon?:string){if(u){if(!u.alive)return;if(amount>0&&u!==this.mounted&&u.pilot&&u.iff!==(attacker&&attacker!==this.mounted?attacker.iff:this.iff)){u.alert=true;if(weapon!=='VISOM')this.rememberAggressor(u,attacker??null);}const absorbed=Math.min(u.shield,amount);u.shield-=absorbed;const penetrated=amount-absorbed;const previousHealth=u.parts[part];applyPartDamage(u.parts,part,penetrated,u.spec.armor);if(u===this.mounted&&previousHealth>PART_DAMAGE_THRESHOLDS.yellow&&u.parts[part]<=PART_DAMAGE_THRESHOLDS.yellow&&u.parts[part]>PART_DAMAGE_THRESHOLDS.critical)this.pendingDamageWarning=u;if(penetrated>0)u.armor=u.spec.armor*PARTS.reduce((total,key)=>total+u.parts[key],0)/PARTS.length;u.lastHit=this.time;this.emit({type:'hit',unit:u,part,position,weapon});if(u.parts[part]<=0){const playerWasMounted=this.mounted===u;if(this.passenger===u)this.exitPassenger();for(const soldier of this.soldiers)if(soldier.passengerOf===u.id)this.exitPassenger(soldier);for(const soldier of this.soldiers)if(soldier.boardingTarget===u.id)this.cancelBoarding(soldier);if(u.pilot&&!playerWasMounted)this.forceEject(u,'destruction');u.armor=0;u.alive=false;u.pilot=false;u.order=null;u.speed=0;this.emit({type:'destroy',unit:u});if(playerWasMounted){this.releaseGuidance('destroyed');this.eject();}}}else{if(this.humanHealth<=0)return;const wasAlive=this.humanHealth>0;this.humanHealth=Math.max(0,this.humanHealth-amount);if(wasAlive&&this.humanHealth<=0){this.emit({type:'soldier-death',faction:this.mission.playerFaction,position:position??{x:this.human.x,y:(this.flight?.altitude??0)+1,z:this.human.z}});this.status='lost';this.releaseGuidance('destroyed');this.emit({type:'lose'});}}}
  fire(slot:number){if(this.passenger||this.insideFacility||this.guidedMissile)return;const u=this.mounted;if(u&&(!this.unitPowered(u)||u.cooldown>0))return;if(!u){if(slot<=2)this.fireFoot(slot);return;}
    const weapon=u.spec.weapons[slot-1];if(!weapon)return;const profile=isLaser(weapon)?this.weapons.lasers[weapon]:null;
    if(profile?u.energy<this.laserEnergyCost(u,weapon as LaserWeapon):(u.slotAmmo[slot-1]??0)<=0)return;
    if(isMissile(weapon)){u.slotAmmo[slot-1]!--;u.cooldown=MISSILE_INTERVAL;this.fireMissile(u,weapon);return;}
    const range=profile?laserRange(weapon as LaserWeapon,u.laserCharge,profile):this.weapons.guns[weapon as MachineGun].range;
    const sight={x:this.player.x,y:this.eyeHeight,z:this.player.z},from=this.sentryMuzzle(u,weapon,sight);
    const sightEnd={x:sight.x+Math.sin(this.aim)*Math.cos(this.pitch)*range,y:sight.y+Math.sin(this.pitch)*range,z:sight.z+Math.cos(this.aim)*Math.cos(this.pitch)*range};
    const end=this.sentryAimPoint(u,sight,sightEnd);
    if(profile){u.cooldown=profile.interval;u.energy-=this.laserEnergyCost(u,weapon as LaserWeapon);u.laserCharge=0;this.fireLaser(u,weapon as LaserWeapon,from,end,range);return;}
    u.slotAmmo[slot-1]!--;u.cooldown=this.weapons.guns[weapon as MachineGun].interval;if(weapon==='TCREAP'){this.fireReapTracer(u,from,end);return;}
    const damage=this.weapons.guns[weapon as MachineGun].damage;
    for(const muzzle of this.weaponOrigins(u,weapon,from,slot-1)){
      const structure=this.facilityShot(muzzle,end,.2);if(structure){this.damageFacility(structure.facility,damage,structure.point);this.acquireHitTarget(structure.facility);this.emit({type:'shot',unit:u,from:muzzle,to:structure.point,weapon,position:muzzle});continue;}
      const hits=this.units.filter(v=>v!==u&&v.alive).map(unit=>({unit,hit:intersectParts(unit,muzzle,end,.2)})).filter((v):v is {unit:Unit;hit:NonNullable<ReturnType<typeof intersectParts>>}=>!!v.hit&&this.lineOfSight(muzzle,v.hit.point)).sort((a,b)=>a.hit.t-b.hit.t);
      const target=hits[0],bodies=this.soldiers.filter(s=>s.alive&&!isEmbarked(s)).map(soldier=>({soldier,t:segmentSphere(muzzle,end,{x:soldier.x,y:(soldier.flight?.altitude??0)+1,z:soldier.z},.65)})).filter((v):v is {soldier:Soldier;t:number}=>v.t!==null&&this.lineOfSight(muzzle,v.soldier)).sort((a,b)=>a.t-b.t);
      const body=bodies[0],bodyHit=body&&(!target||body.t<target.hit.t),to=bodyHit?{x:muzzle.x+(end.x-muzzle.x)*body.t,y:muzzle.y+(end.y-muzzle.y)*body.t,z:muzzle.z+(end.z-muzzle.z)*body.t}:target?.hit.point??end;
      this.emit({type:'shot',unit:u,from:muzzle,to,weapon,position:muzzle});
      if(bodyHit){this.damageSoldier(body.soldier,damage,to,u);this.acquireHitTarget(body.soldier);}else if(target){this.damage(target.unit,damage,target.hit.part,to,u,weapon);this.acquireHitTarget(target.unit);}
    }
  }
  private sentryAimPoint(unit:Unit,from:Point3,to:Point3):Point3{
    if(unit.kind!=='union-sentry')return to;
    let first=1;
    const accept=(t:number|null)=>{if(t!==null&&t<first)first=t;};
    for(const target of this.units)if(target!==unit&&target.alive)accept(intersectParts(target,from,to,.1)?.t??null);
    for(const soldier of this.soldiers)if(soldier.alive&&!isEmbarked(soldier))accept(segmentSphere(from,to,{x:soldier.x,y:targetHeight(soldier),z:soldier.z},.65));
    for(const obstacle of this.terrainObstacles)accept(buildingContact(from,to,obstacle,.1));
    for(const rock of this.mission.rocks)accept(segmentSphere(from,to,{x:rock.x,y:rock.r*.55,z:rock.z},rock.r+.1));
    if(first<1)first=Math.min(1,first+.35/(Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z)||1));
    return {x:from.x+(to.x-from.x)*first,y:from.y+(to.y-from.y)*first,z:from.z+(to.z-from.z)*first};
  }
  private sentryMuzzle(unit:Unit,weapon:string,fallback:Point3):Point3{
    if(unit.kind==='merc-meson-tower'||unit.kind==='scorp-meson-tower'){const mount=VEHICLE_SHAPES[unit.kind].weapon,forward=mount.z+mount.d/2,pitch=unit===this.mounted?this.pitch:unit.aimPitch;return {x:unit.x+Math.sin(unit.aim)*Math.cos(pitch)*forward,y:unit.spec.height*.6+mount.y+Math.sin(pitch)*forward,z:unit.z+Math.cos(unit.aim)*Math.cos(pitch)*forward};}
    if(unit.kind!=='union-sentry')return fallback;
    const mount=VEHICLE_SHAPES['union-sentry'].weapon,forward=mount.z+mount.d/2+.61;
    return {x:unit.x+Math.sin(unit.yaw)*forward,y:unit.spec.height*.6+mount.y-.17,z:unit.z+Math.cos(unit.yaw)*forward};
  }
  private weaponOrigins(unit:Unit,weapon:string,fallback:Point3,slot?:number):Point3[]{
    if(unit.kind==='scorp-asv'&&weapon==='zWASP'&&slot!==undefined){
      const mount=VEHICLE_SHAPES[unit.kind].weapon,side=slot===0?-1:1,forward=mount.z+2.4;
      return [{x:unit.x+Math.cos(unit.aim)*side*mount.x+Math.sin(unit.aim)*forward,y:unit.spec.height*.6+mount.y,z:unit.z-Math.sin(unit.aim)*side*mount.x+Math.cos(unit.aim)*forward}];
    }
    if(unit.kind==='scorp-tactical'&&weapon==='RAID'){
      const mount=SCORP_TACTICAL_RAID_MUZZLES;
      return [-1,1].map(side=>({x:unit.x+Math.cos(unit.aim)*side*mount.x+Math.sin(unit.aim)*mount.z,y:unit.spec.height*.6+mount.y,z:unit.z-Math.sin(unit.aim)*side*mount.x+Math.cos(unit.aim)*mount.z}));
    }
    const assault=unit.kind==='merc-assault',tactical=unit.kind==='union-tactical'&&(weapon==='P2MEC'||weapon==='TCREAP'),ceti=unit.kind==='scorp-sentry'&&weapon==='CETI';
    if(!tactical&&!ceti&&weaponMountCount(unit.kind,weapon)!==2)return [fallback];
    const mount=VEHICLE_SHAPES[unit.kind].weapon,forward=mount.z+mount.d/2+(ceti?1.05:.16);
    const unionMuzzle=unit.kind==='union-sentry',muzzleForward=assault||tactical||ceti?forward:unionMuzzle?Math.sin(unit.aim)*(fallback.x-unit.x)+Math.cos(unit.aim)*(fallback.z-unit.z):mount.z+2.4,muzzleY=assault||tactical||ceti?unit.spec.height*.6+mount.y-(ceti?.17:0):unionMuzzle?fallback.y:unit.spec.height*.6+mount.y;
    return [-1,1].map(side=>({x:unit.x+Math.cos(unit.aim)*side*mount.x+Math.sin(unit.aim)*muzzleForward,y:muzzleY,z:unit.z-Math.sin(unit.aim)*side*mount.x+Math.cos(unit.aim)*muzzleForward}));
  }
  private fireReapTracer(unit:Unit,from:Point3,to:Point3){
    const profile=this.weapons.guns.TCREAP,speed=profile.projectileSpeed??60;
    for(const origin of this.weaponOrigins(unit,'TCREAP',from)){
      const length=Math.hypot(to.x-origin.x,to.y-origin.y,to.z-origin.z)||1;
      const p:Missile={...origin,id:this.nextMissileId++,owner:unit.id,playerOwned:unit===this.mounted,weapon:'TCREAP',vx:(to.x-origin.x)/length*speed,vy:(to.y-origin.y)/length*speed,vz:(to.z-origin.z)/length*speed,damage:profile.damage,radius:.12,life:profile.range/speed};
      this.missiles.push(p);this.emit({type:'shot',unit,from:origin,to,weapon:'TCREAP',projectileId:p.id,position:origin});
    }
  }
  private fireLaser(unit:Unit,weapon:LaserWeapon,from:Point3,to:Point3,range:number){
    from=this.sentryMuzzle(unit,weapon,from);
    if(unit.kind==='merc-tactical'&&weapon==='RAID'){const mount=MERC_TACTICAL_RAID_MUZZLE;from={x:unit.x+Math.sin(unit.aim)*mount.z,y:unit.spec.height*.6+mount.y,z:unit.z+Math.cos(unit.aim)*mount.z};}
    if(unit===this.mounted)this.laserRechargePending.add(unit);
    const profile=this.weapons.lasers[weapon];
    for(const origin of this.weaponOrigins(unit,weapon,from)){
      const length=Math.hypot(to.x-origin.x,to.y-origin.y,to.z-origin.z)||1;
      const projectile:Missile={...origin,id:this.nextMissileId++,owner:unit.id,playerOwned:unit===this.mounted,weapon,vx:(to.x-origin.x)/length*profile.speed,vy:(to.y-origin.y)/length*profile.speed,vz:(to.z-origin.z)/length*profile.speed,damage:profile.damage,radius:.12,life:range/profile.speed};
      this.missiles.push(projectile);this.emit({type:'shot',unit,from:origin,to,weapon,projectileId:projectile.id,position:origin});
    }
  }

  get footSecondaryWeapon(){return this.mission.footSecondaryWeapon??'GASHR';}
  get footSecondaryAmmo(){return this.footSecondaryWeapon==='EGGER'?this.eggerAmmo:this.gashrAmmo;}
  private updateFootCooldown(dt:number){
    for(const weapon of ['PRIF44','GASHR','EGGER'] as const){
      const before=this.footCooldown[weapon];this.footCooldown[weapon]=Math.max(0,before-dt);
      if(before>0&&this.footCooldown[weapon]===0&&this.footRechargePending.delete(weapon)&&!this.mounted&&!this.flight&&(weapon==='PRIF44'||(weapon==='EGGER'?this.eggerAmmo:this.gashrAmmo)>0))this.emit({type:'foot-ready',weapon});
    }
  }
  damageFacility(facility:Facility,amount:number,position:Point3){
    if(!facility.alive||amount<=0)return;
    facility.health=Math.max(0,facility.health-amount);
    if(facility.health===0){if(this.insideFacility===facility)this.eject('ground');facility.alive=false;facility.pilot=false;this.emit({type:'destroy',facility,position});}
  }
  private facilityShot(from:Point3,to:Point3,padding:number){
    let first=Infinity,facility:Facility|undefined;
    for(const obstacle of this.terrainObstacles){const t=buildingContact(from,to,obstacle,padding);if(t!==null&&t<first){first=t;facility=isFacility(obstacle)?obstacle:undefined;}}
    for(const rock of this.mission.rocks){const t=segmentSphere(from,to,{x:rock.x,y:rock.r*.55,z:rock.z},rock.r+padding);if(t!==null&&t<first){first=t;facility=undefined;}}
    for(const unit of this.units){if(!unit.alive||unit===this.mounted)continue;const hit=intersectParts(unit,from,to,padding);if(hit&&hit.t<first){first=hit.t;facility=undefined;}}
    for(const soldier of this.soldiers){if(!soldier.alive||isEmbarked(soldier))continue;const t=segmentSphere(from,to,{x:soldier.x,y:targetHeight(soldier),z:soldier.z},.65+padding);if(t!==null&&t<first){first=t;facility=undefined;}}
    if(!facility)return null;
    return {facility,point:{x:from.x+(to.x-from.x)*first,y:from.y+(to.y-from.y)*first,z:from.z+(to.z-from.z)*first}};
  }
  private facilityCrewHit(facility:Facility,lethal:boolean){
    if(!facility.pilot||this.insideFacility===facility)return;
    facility.pilot=false;const point=facilityExit(facility);
    let soldier=this.soldiers.find(s=>s.alive&&s.driverOf===facility.id);
    if(!soldier){soldier={id:`crew-${facility.id}-${this.soldiers.length}`,sourceVehicle:facility.id,iff:facility.iff,faction:facility.faction,x:point.x,z:point.z,yaw:facility.yaw,health:35,alive:true,alert:true,cooldown:1.5,flight:null,aggressorId:null,aggressorUntil:0};this.soldiers.push(soldier);}
    if(lethal){soldier.driverOf=facility.id;soldier.health=0;soldier.alive=false;this.emit({type:'soldier-death',soldier,faction:soldier.faction,position:{x:facility.x,y:1,z:facility.z}});}
    else{soldier.driverOf=undefined;Object.assign(soldier,point);soldier.flight=null;this.emit({type:'pilot-eject',facility,soldier,ejection:'gas'});}
  }
  private fireFoot(slot:number){
    const gas=slot===2,weapon=gas?this.footSecondaryWeapon:'PRIF44',profile=INFANTRY_WEAPONS[weapon];
    if(this.footCooldown[weapon]>0||(gas&&this.footSecondaryAmmo===0))return;
    this.footCooldown[weapon]=profile.cooldown;this.footRechargePending.add(weapon);
    const from={x:this.human.x,y:this.eyeHeight,z:this.human.z},direction={x:Math.sin(this.aim)*Math.cos(this.pitch),y:Math.sin(this.pitch),z:Math.cos(this.aim)*Math.cos(this.pitch)};
    const end={x:from.x+direction.x*profile.range,y:from.y+direction.y*profile.range,z:from.z+direction.z*profile.range};
    if(gas){
      if(weapon==='EGGER')this.eggerAmmo--;else this.gashrAmmo--;const speed=INFANTRY_WEAPONS[weapon==='EGGER'?'EGGER':'GASHR'].speed;
      const projectile:Missile={...from,id:this.nextMissileId++,owner:'player',playerOwned:true,weapon:weapon==='EGGER'?'EGGER':'GASHR',vx:direction.x*speed,vy:direction.y*speed,vz:direction.z*speed,damage:0,radius:.22,life:profile.range/speed};
      this.missiles.push(projectile);this.emit({type:'shot',from,to:end,weapon,projectileId:projectile.id,position:from});return;
    }
    const structure=this.facilityShot(from,end,.12);if(structure){this.damageFacility(structure.facility,INFANTRY_WEAPONS.PRIF44.damage,structure.point);this.acquireHitTarget(structure.facility);this.emit({type:'shot',from,to:structure.point,weapon});return;}
    const units=this.units.filter(u=>u.alive&&u!==this.mounted).map(unit=>({unit,contact:intersectParts(unit,from,end,.12)})).filter((v):v is {unit:Unit;contact:NonNullable<ReturnType<typeof intersectParts>>}=>!!v.contact&&this.lineOfSight(from,v.contact.point)).sort((a,b)=>a.contact.t-b.contact.t);
    const bodies=this.soldiers.filter(s=>s.alive&&!isEmbarked(s)).map(soldier=>({soldier,t:segmentSphere(from,end,{x:soldier.x,y:(soldier.flight?.altitude??0)+1,z:soldier.z},.65)})).filter((v):v is {soldier:Soldier;t:number}=>v.t!==null&&this.lineOfSight(from,v.soldier)).sort((a,b)=>a.t-b.t);
    const unit=units[0],body=bodies[0];let to=end;
    if(body&&(!unit||body.t<unit.contact.t)){to={x:from.x+(end.x-from.x)*body.t,y:from.y+(end.y-from.y)*body.t,z:from.z+(end.z-from.z)*body.t};this.damageSoldier(body.soldier,INFANTRY_WEAPONS.PRIF44.damage,to);this.acquireHitTarget(body.soldier);}
    else if(unit){to=unit.contact.point;this.damage(unit.unit,INFANTRY_WEAPONS.PRIF44.vehicleDamage,unit.contact.part,to,null,'PRIF44');this.acquireHitTarget(unit.unit);}
    this.emit({type:'shot',from,to,weapon});
  }
  private missileOrigin(unit:Unit,weapon:MissileWeapon,side:number):Point3{
    const tactical=unit.kind==='union-tactical'&&(weapon==='TCROCK'||weapon==='SAG5T');
    const mount=tactical?VEHICLE_SHAPES['union-tactical'].weapon:unit.kind==='scorp-asv'&&(weapon==='SREM'||weapon==='UNKPA')?VEHICLE_SHAPES['scorp-asv'].weapon:null;
    if(mount)side=tactical?(weapon==='TCROCK'?-1:1):(weapon==='SREM'?-1:1);
    const y=unit.hoverHeight+(mount?unit.spec.height*.6+mount.y:unit.spec.height*(weapon==='VISOM'?.81:.6));
    const offset=mount?side*mount.x:weapon==='VISOM'?.5:side*2.3,forward=mount?mount.z+2.5:weapon==='VISOM'?2.8:2.5;
    return {x:unit.x+Math.sin(unit.aim)*forward+Math.cos(unit.aim)*offset,y,z:unit.z+Math.cos(unit.aim)*forward-Math.sin(unit.aim)*offset};
  }
  fireMissile(unit:Unit,weapon:MissileWeapon,side=1,target?:Point3,attackTarget?:SelectionTarget|null){
    const profile=this.weapons.missiles[weapon],from=this.missileOrigin(unit,weapon,side),y=from.y;
    const targetY=target?.y??(this.mounted?this.mounted.spec.height*.6:(this.flight?.altitude??0)+(this.prone?.5:1.1));
    const dx=unit===this.mounted?Math.sin(unit.aim)*Math.cos(this.pitch):(target?.x??this.player.x)-from.x,dy=unit===this.mounted?Math.sin(this.pitch):targetY-y,dz=unit===this.mounted?Math.cos(unit.aim)*Math.cos(this.pitch):(target?.z??this.player.z)-from.z,length=Math.hypot(dx,dy,dz)||1;
    const missile:Missile={...from,id:this.nextMissileId++,owner:unit.id,weapon,playerOwned:unit===this.mounted,homingScale:unit.spec.missileHomingScale?.[weapon],vx:dx/length*profile.speed,vy:dy/length*profile.speed,vz:dz/length*profile.speed,damage:profile.damage,radius:profile.radius,life:profile.lifetime};
    if(weapon!=='VISOM'){
      const candidate=unit===this.mounted?this.target:attackTarget??(this.mounted??null);
      const point=candidate?{x:candidate.x,y:targetHeight(candidate),z:candidate.z}:unit!==this.mounted&&!this.mounted&&!this.passenger&&this.humanHealth>0?{...this.human,y:(this.flight?.altitude??0)+(this.prone?.5:1)}:null;
      if(point&&(!candidate||candidate.alive)&&homeMissile(missile,point,0,MISSILE_HOMING.acquisitionCone,0))missile.homingTargetId=candidate?.id??'player';
    }
    this.missiles.push(missile);
    if(weapon==='VISOM'&&unit===this.mounted){this.guidedMissileId=missile.id;this.tracking=false;}
    this.emit({type:'shot',unit,from,to:target??{...this.player},weapon,projectileId:missile.id,position:{...from}});
    return missile;
  }
  private advanceMissiles(dt:number){
    const survivors:Missile[]=[];
    for(const p of this.missiles){
      const from={x:p.x,y:p.y,z:p.z},step=Math.min(dt,p.life);
      const hitPadding=isLaser(p.weapon)?(this.weapons.lasers[p.weapon].hitPadding??0):0;
      if(p.homingTargetId&&isMissile(p.weapon)&&p.weapon!=='VISOM'){
        const target=this.selectionTargets.find(t=>t.id===p.homingTargetId&&t.alive);
        const point=target?{x:target.x,y:targetHeight(target),z:target.z}:p.homingTargetId==='player'&&!this.mounted&&!this.passenger&&this.humanHealth>0?{...this.human,y:(this.flight?.altitude??0)+(this.prone?.5:1)}:null;
        let aimPoint=point,turnRate=MISSILE_HOMING.turnRate;
        if(point&&p.aiGuidance){
          const airborne=target?!isVehicle(target)&&!isFacility(target)&&!!target.flight:p.homingTargetId==='player'&&!!this.flight;
          const accuracy=airborne?AI_MISSILE_ACCURACY.airborne:AI_MISSILE_ACCURACY.ground,guidance=p.aiGuidance;
          if(this.time>=guidance.refreshAt){guidance.point={x:point.x+guidance.offset.x,y:point.y+guidance.offset.y,z:point.z+guidance.offset.z};guidance.refreshAt=this.time+accuracy.updateInterval;}
          aimPoint=guidance.point;turnRate=accuracy.turnRate;
        }
        if(!aimPoint||!homeMissile(p,aimPoint,turnRate*(p.homingScale??1),MISSILE_HOMING.trackingCone,step))p.homingTargetId=undefined;
      }
      const to={x:p.x+p.vx*step,y:p.y+p.vy*step,z:p.z+p.vz*step};
      let first=Infinity,hit:Unit|null|undefined,hitSoldier:Soldier|undefined,hitFacility:Facility|undefined,part:BodyPart='hull';
      const test=(center:Point3,radius:number,unit?:Unit|null)=>{const t=segmentSphere(from,to,center,radius+p.radius);if(t!==null&&t<first){first=t;hit=unit;hitFacility=undefined;}};
      for(const building of this.terrainObstacles){const t=buildingContact(from,to,building,p.radius);if(t!==null&&t<first){first=t;hit=undefined;hitFacility=isFacility(building)?building:undefined;}}
      for(const rock of this.mission.rocks)test({x:rock.x,y:rock.r*.55,z:rock.z},rock.r);
      const owner=this.units.find(u=>u.id===p.owner);
      for(const unit of this.units){
        if(!unit.alive||unit.id===p.owner||(p.owner==='player'&&unit===this.mounted))continue;
        const contact=intersectParts(unit,from,to,p.radius+hitPadding);if(contact&&contact.t<first){first=contact.t;hit=unit;hitFacility=undefined;part=contact.part;}
      }
      if(!this.mounted&&!this.passenger&&!this.insideFacility&&p.owner!=='player')test({x:this.human.x,y:(this.flight?.altitude??0)+(this.prone?.5:1),z:this.human.z},(this.prone?.65:.9)+hitPadding,null);
      if(p.weapon!=='GASHR'&&p.weapon!=='EGGER')for(const soldier of this.soldiers){if(!soldier.alive||isEmbarked(soldier))continue;const t=segmentSphere(from,to,{x:soldier.x,y:(soldier.flight?.altitude??0)+1,z:soldier.z},.65+p.radius+hitPadding);if(t!==null&&t<first){first=t;hit=undefined;hitSoldier=soldier;hitFacility=undefined;}}
      if(to.y<=.1&&from.y>.1){const t=(from.y-.1)/(from.y-to.y);if(t<first){first=t;hit=undefined;hitSoldier=undefined;hitFacility=undefined;}}
      p.life-=step;
      if(first!==Infinity){
        Object.assign(p,{x:from.x+(to.x-from.x)*first,y:from.y+(to.y-from.y)*first,z:from.z+(to.z-from.z)*first});
        if(hit)this.lureImpact(hit,p);
        if(hitFacility){if(p.weapon==='EGGER'||p.weapon==='GASHR')this.facilityCrewHit(hitFacility,p.weapon==='EGGER');else this.damageFacility(hitFacility,p.damage,{x:p.x,y:p.y,z:p.z});}
        else if(hitSoldier)this.damageSoldier(hitSoldier,(isLaser(p.weapon)||p.weapon==='TCREAP')?p.damage:hitSoldier.health,{x:p.x,y:p.y,z:p.z},owner??null);else if(p.weapon==='EGGER'){if(hit)this.killVehicleCrew(hit);}else if(p.weapon==='GASHR'){if(hit)this.forceEject(hit);}else if(hit!==undefined)this.damage(hit,hit===null&&!isLaser(p.weapon)&&p.weapon!=='TCREAP'?this.humanHealth:p.damage,part,{x:p.x,y:p.y,z:p.z},owner,p.weapon);
        if(p.playerOwned)this.acquireHitTarget(hitFacility??hitSoldier??hit);
        this.emit({type:'impact',projectileId:p.id,weapon:p.weapon,position:{x:p.x,y:p.y,z:p.z}});
      }else if(p.life>0){Object.assign(p,to);survivors.push(p);}
    }
    this.missiles=survivors;if(this.guidedMissileId!==null&&!this.guidedMissile)this.releaseGuidance('ended');
  }

  private occupiedContact(unit:Unit,moving:boolean){
    if(unit.spec.passengerCapacity<=0)return false;
    const entered=this.occupiedContacts.get(unit.id);
    if(entered===undefined){this.occupiedContacts.set(unit.id,this.time);this.emit({type:'occupied-contact',unit});}
    else if(entered<this.time&&moving)this.damage(null,this.humanHealth);
    return true;
  }
  private passengerContact(unit:Unit,before:Vec,from:Point3,to:Point3){
    if(sweptVehicleContact(unit,before,from,to,this.prone))return true;
    // Ground approach uses the same envelope as the infantry movement blocker.
    return from.y<=0&&to.y<=0&&sweptCircle({x:from.x-before.x,z:from.z-before.z},{x:to.x-unit.x,z:to.z-unit.z},{x:0,z:0},vehicleRadius(unit.kind)+.36);
  }
  private checkCrush(from:Point3,previous:Map<string,Vec>){
    if(this.mounted||this.passenger||this.insideFacility||this.status!=='running')return false;
    const to={x:this.human.x,y:this.flight?.altitude??0,z:this.human.z};
    for(const unit of this.units){if(!unit.alive||!unit.pilot||unit.iff===this.iff)continue;
      const before=previous.get(unit.id)??unit;
      if(unit.spec.passengerCapacity>0){
        if(!this.passengerContact(unit,before,from,to))continue;
        this.occupiedContact(unit,Math.hypot(unit.x-before.x,unit.z-before.z)>=1e-6);
        if(this.humanHealth<=0)return true;continue;
      }
      if(!sweptVehicleContact(unit,before,from,to,this.prone))continue;
      this.damage(null,this.humanHealth);return true;
    }
    return false;
  }
  raiseBridge(){
    const facility=this.insideFacility,id=facility?.bridgeId;
    if(this.status!=='running'||facility?.facilityType!=='bridge-control'||!id||this.mission.terrain.river?.bridgeId!==id||this.raisedBridges.has(id))return false;
    const river=this.mission.terrain.river!;
    const onBridge=(actor:Vec)=>Math.abs(actor.x-river.x)<=river.width/2+9&&Math.abs(actor.z-river.bridgeZ)<=river.bridgeWidth/2;
    // Resolve occupants before completion; no ejection can evade the lifting deck.
    for(const unit of this.units)if(unit.alive&&onBridge(unit)&&!(canFlyAcrossRiver(unit.kind)&&unit.hoverHeight>0)){this.killVehicleCrew(unit);this.damage(unit,99999);}
    for(const soldier of this.soldiers)if(soldier.alive&&!isEmbarked(soldier)&&!soldier.insideFacility&&onBridge(soldier))this.damageSoldier(soldier,soldier.health,{x:soldier.x,y:1,z:soldier.z});
    if(!this.insideFacility&&!this.mounted&&!this.passenger&&onBridge(this.human))this.damage(null,this.humanHealth);
    this.raisedBridges.add(id);this.emit({type:'bridge-raised',facility});this.resolveObjectives();return true;
  }
  private resolveObjectives(){
    for(const objective of this.objectiveStates)if(objective.type==='defend'&&objective.done)this.securedDefenses.add(objective.id);
    if(this.status==='running'&&this.mission.objectives.some(o=>o.type==='defend'&&!this.securedDefenses.has(o.id)&&o.targetIds.some(id=>!this.selectionTargets.some(t=>t.id===id&&t.alive))||o.type==='board-player'&&this.soldiers.some(s=>s.personId===o.personId&&!s.alive))){this.status='lost';this.releaseGuidance('destroyed');this.emit({type:'lose'});}
    if(this.status==='running'&&this.mission.completionEnabled!==false&&this.objectiveStates.length>0&&this.objectiveStates.every(o=>o.optional||o.done)){this.status='won';this.releaseGuidance('complete');this.emit({type:'win'});}
  }
  tick(dt:number,input:Input){if(this.status!=='running')return;this.brakingUnits.clear();if(this.passenger)input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:input.fire1,fire2:input.fire2,fire3:input.fire3,fire4:input.fire4};dt=Math.min(dt,.05);this.time+=dt;
    for(const unit of this.units)if(unit.spec.category==='hovercraft'){const shape=VEHICLE_SHAPES[unit.kind],landed=-(unit.spec.height*.6+shape.hull.y-shape.hull.h/2),goal=unit.hoverDisabled?landed:unit.spec.hoverHeight??0;unit.hoverHeight+=Math.sign(goal-unit.hoverHeight)*Math.min(Math.abs(goal-unit.hoverHeight),dt*.6);}
    this.tickPickups();this.tickInfantrySorties();
    const fireDown=[input.fire1,input.fire2,!!input.fire3,!!input.fire4],firePressed=fireDown.map((down,i)=>down&&!this.fireHeld[i]);this.fireHeld=fireDown;
    for(const soldier of this.soldiers)if(soldier.insideFacility){const facility=this.facilities.find(f=>f.id===soldier.insideFacility);if(facility?.alive){soldier.x=facility.x;soldier.z=facility.z;}else if(soldier.alive){soldier.health=0;soldier.alive=false;}}
    for(const soldier of this.soldiers)if(soldier.boardingTarget){const carrier=this.units.find(u=>u.id===soldier.boardingTarget);if(!this.validBoarding(soldier,carrier))this.cancelBoarding(soldier);}
    const previousHuman={x:this.human.x,y:this.flight?.altitude??0,z:this.human.z},previousUnits=new Map(this.units.map(u=>[u.id,{x:u.x,z:u.z}]));for(const [id] of this.occupiedContacts){const unit=this.units.find(u=>u.id===id);if(this.mounted||this.passenger||!unit?.alive||!unit.pilot||unit.iff===this.iff||!this.passengerContact(unit,unit,previousHuman,previousHuman))this.occupiedContacts.delete(id);}this.updateFootCooldown(dt);const stopPressed=input.stop&&!this.stopHeld;this.stopHeld=input.stop;const centerPressed=!!input.center&&!this.centerHeld;this.centerHeld=!!input.center;if(this.selected&&!this.target)this.clearTarget();
    if(this.checkCrush(previousHuman,previousUnits))return;
    if(this.guidedMissileId!==null&&!this.guidedMissile)this.releaseGuidance('unavailable');
    const guiding=!!this.guidedMissile,manualAim=manualAimFor(this.mounted?.kind);
    if(guiding){if(centerPressed)this.releaseGuidance();else steerMissile(this.guidedMissile!, (Number(input.right)-Number(input.left))*dt*VISOM_GUIDANCE.turnRate,(Number(!!input.lookUp||input.forward)-Number(!!input.lookDown||input.back))*dt*VISOM_GUIDANCE.turnRate);}
    else{this.pitch=Math.max(-1.2,Math.min(.8,this.pitch+(Number(!!input.lookUp)-Number(!!input.lookDown))*dt*manualAim.pitch));
    if(centerPressed){this.pitch=0;this.tracking=false;this.emit({type:'center',unit:this.mounted??undefined});}}
    let u=this.mounted;const turn=guiding?0:(Number(input.right)-Number(input.left))*dt*(u?(u.spec.category==='tower'?MANUAL_AIM.towerYaw:manualAim.vehicleYaw):MANUAL_AIM.infantryYaw);
    if(u){const fixed=u.spec.category==='tower'||u.spec.speed<=0;if(!guiding){u.aimPitch=this.pitch;if(u.spec.category!=='tower')u.yaw+=turn;u.aim+=turn;if(centerPressed||u.spec.torsoLimit===0)u.aim=u.yaw;
      if(fixed)this.throttle=0;
      else if(input.stop){this.throttle=0;if(stopPressed)this.emit({type:'stop'});}
      else if(input.boost){if(this.throttle!==1)this.emit({type:'boost'});this.throttle=1;}
      else this.throttle=Math.max(-.35,Math.min(1,this.throttle+(Number(input.forward)-Number(input.back))*dt*.75));
      }
      if(fixed){this.throttle=0;this.speed=0;u.speed=0;}
      else{const desired=this.throttle*u.spec.speed*mobilityMultiplier(u.parts)/3.6;this.speed=accelerateSpeed(this.speed,desired,dt,u.kind);u.speed=this.speed;this.move(u,u.yaw,this.speed*dt);}
      if(!guiding){if(input.left||input.right||input.lookUp||input.lookDown)this.tracking=false;
      if(this.tracking){const t=this.target;if(t){const delta=angle(Math.atan2(t.x-u.x,t.z-u.z)-u.aim);const rate=u.spec.category==='tower'?MANUAL_AIM.towerTracking:1.3;this.aimBy(Math.max(-dt*rate,Math.min(dt*rate,delta)));this.pitch+=Math.max(-dt,Math.min(dt,this.targetElevation(t)-this.pitch));}}
    }}else if(!this.passenger&&!this.insideFacility){this.humanYaw+=turn;if(this.flight){this.speed=Math.hypot(this.flight.vx,this.flight.vz);this.flight=this.advanceFlight(this.human,this.flight,dt);}else{if(input.stop){if(stopPressed&&this.throttle!==0)this.emit({type:'stop'});this.throttle=0;}
      else if(input.back||this.prone)this.throttle=0;
      else if(input.boost){if(this.throttle!==1)this.emit({type:'boost'});this.throttle=1;}
      const direction=input.stop?0:this.throttle===1?1:Number(input.forward)-Number(input.back);
      const desired=direction*(this.prone?INFANTRY_MOVEMENT.prone:this.throttle===1?INFANTRY_MOVEMENT.full:INFANTRY_MOVEMENT.walk);
      this.moveInfantry(this.human,this.humanYaw,desired,dt);this.board();}}
    u=this.mounted;
    if(u)for(const soldier of this.soldiers)this.crushSoldier(soldier,{x:soldier.x,y:soldier.flight?.altitude??0,z:soldier.z},previousUnits.get(u.id)??u);
    if(this.checkCrush(previousHuman,previousUnits))return;
    const fireActor=u?.id??this.passenger?.id??'player';
    for(let i=0;i<fireDown.length;i++){if(!fireDown[i]){this.fireReleaseRequired[i]=false;this.fireRepeatAt[i]=0;}else if(this.fireActor!==undefined&&this.fireActor!==fireActor&&!firePressed[i])this.fireReleaseRequired[i]=true;}this.fireActor=fireActor;
    if(!guiding)for(let i=0;i<firePressed.length;i++){
      const weapon=u?.spec.weapons[i],rapidLaser=!!u&&!!weapon&&allowsLaserHoldFire(u.kind,weapon),charged=!weapon||!isLaser(weapon)||rapidLaser||u!.laserCharge>=1;
      if(!fireDown[i]||this.fireReleaseRequired[i]||!firePressed[i]&&(!charged||!rapidLaser&&this.time<this.fireRepeatAt[i]))continue;
      const before=this.events.length;this.fire(i+1);if(this.events.length>before)this.fireRepeatAt[i]=this.time+HELD_TRIGGER_INTERVAL;
    }
    for(const unit of this.units){if(!unit.alive)continue;unit.cooldown=Math.max(0,unit.cooldown-dt);const spec=unit.spec;if(this.time-unit.lastHit>7&&this.unitPowered(unit)){unit.shield=Math.min(spec.shield,unit.shield+dt*1.5);unit.energy=Math.min(spec.energy,unit.energy+dt*4);}
      if(unit===u)continue;if(!unit.pilot){this.coastVehicle(unit,dt);continue;}
      const assault=this.mission.assaults?.find(a=>a.unitId===unit.id);
      if(assault&&this.time<assault.startAt){this.coastVehicle(unit,dt);continue;}
      const assaultTarget=assault?this.selectionTargets.find(t=>t.id===assault.targetId&&t.alive&&t.iff!==unit.iff):undefined;
      if(assaultTarget)unit.alert=true;
      this.activeAggressor(unit);
      if(this.mission.companions?.some(member=>member.personId===unit.personId)||this.mission.garrison?.includes(unit.id)){unit.alert=false;continue;}
      const opponent=unit.aggressorId&&unit.aggressorId!=='player'?this.combatTargets.find(candidate=>candidate.id===unit.aggressorId):undefined;
      if(!this.isHostile(unit)&&!opponent&&!assaultTarget){unit.alert=false;this.coastVehicle(unit,dt);continue;}
      if(this.waitingForLure(unit)&&!unit.alert){this.coastVehicle(unit,dt);continue;}
      const hostile=!!opponent||!!assaultTarget||this.isHostile(unit);if(!hostile){unit.alert=false;this.coastVehicle(unit,dt);continue;}
      const ramPlayer=this.shouldRamPlayer(unit),target=ramPlayer?null:opponent??(unit.aggressorId==='player'?undefined:assaultTarget)??this.mounted??this.passenger,position=target??this.human;
      const dist=distance(unit,position),sight=this.attackVisible(unit,position),playerVisible=(target===this.mounted||target===this.passenger||target===null)&&dist<spec.ai.detection&&sight;if(playerVisible){unit.alert=true;if(!this.playerDetectionAnnounced.has(unit.id)){this.playerDetectionAnnounced.add(unit.id);this.emit({type:'enemy-detected',unit});}}if(!unit.alert)continue;
      if(!sight&&assaultTarget&&target===assaultTarget&&spec.category==='hovercraft'){this.followAlly(unit,assaultTarget,assault!.targetId,assaultTarget,dt);continue;}
      unit.phase+=dt;const bearing=Math.atan2(position.x-unit.x,position.z-unit.z);const strafe=unit.lured?0:spec.ai.keepMoving?spec.ai.strafe:Math.sin(unit.phase*.8)*spec.ai.strafe;
      const desired=bearing+(dist>95?strafe*.28:strafe);unit.yaw+=aiTurnStep(unit.kind,angle(desired-unit.yaw),dt,true);const limit=spec.torsoLimit,desiredAim=unit.yaw+Math.max(-limit,Math.min(limit,angle(bearing-unit.yaw)));unit.aim+=aiAimTurnStep(unit.kind,angle(desiredAim-unit.aim),dt);unit.aim=unit.yaw+Math.max(-limit,Math.min(limit,angle(unit.aim-unit.yaw)));
      const holdingForVisom=this.waitingForLure(unit)&&unit.aggressorId===null,moving=ramPlayer||!holdingForVisom&&(dist>spec.ai.stopDistance||spec.ai.keepMoving),desiredSpeed=moving?spec.speed*mobilityMultiplier(unit.parts)/3.6:0;
      unit.speed=accelerateSpeed(unit.speed,desiredSpeed,dt,unit.kind);this.move(unit,unit.yaw,unit.speed*dt);
      if(!ramPlayer&&dist<(spec.category==='tower'||spec.category==='hovercraft'?spec.ai.detection:180)&&sight&&unit.cooldown<=0&&Math.abs(angle(unit.aim-bearing))<.12){
        this.fireAI(unit,target);

      }
    }
    this.tickAllies(dt);this.tickMines(previousHuman,previousUnits);if(this.status!=='running')return;this.tickMinefieldWarnings();this.tickMissionRadio();
    // Actual displacement includes coasting, reverse, AI movement and damaged legs.
    for(const unit of this.units){if(!unit.alive)continue;const weapon=unit.spec.weapons.find(isLaser);if(!weapon||!isLaser(weapon))continue;
      if(!this.unitPowered(unit)){unit.laserCharge=0;continue;}
      const moving=distance(unit,previousUnits.get(unit.id)??unit)>dt*.05,profile=this.weapons.lasers[weapon];
      unit.laserCharge=Math.min(1,unit.laserCharge+dt/profile.recharge*(moving?profile.movingRechargeFactor:1));
      if(unit.laserCharge===1&&this.laserRechargePending.delete(unit)&&unit===this.mounted)this.emit({type:'laser-ready',unit,weapon});
    }
    if(this.checkCrush(previousHuman,previousUnits))return;
    for(const unit of this.units){if(!unit.alive||!unit.pilot||unit===this.mounted)continue;for(const soldier of this.soldiers){if(!soldier.alive||isEmbarked(soldier)||soldier.iff===unit.iff)continue;const point={x:soldier.x,y:soldier.flight?.altitude??0,z:soldier.z};if(sweptVehicleContact(unit,previousUnits.get(unit.id)??unit,point,point))this.damageSoldier(soldier,soldier.health,point,unit);}}
    this.advanceMissiles(dt);if(this.status!=='running')return;this.tickSoldiers(dt);
    if(this.passenger){if(!this.units.includes(this.passenger)||!this.passenger.alive)this.exitPassenger();else{this.human={x:this.passenger.x,z:this.passenger.z};this.speed=this.passenger.speed;}}
    for(const soldier of this.soldiers)if(soldier.passengerOf){const carrier=this.units.find(u=>u.id===soldier.passengerOf);if(carrier?.alive){soldier.x=carrier.x;soldier.z=carrier.z;}else if(carrier)this.exitPassenger(soldier);else soldier.passengerOf=undefined;}
    for(const soldier of this.soldiers)if(soldier.driverOf&&soldier.alive){const carrier=this.units.find(u=>u.id===soldier.driverOf);if(carrier?.alive&&carrier.pilot){soldier.x=carrier.x;soldier.z=carrier.z;soldier.iff=carrier.iff;}else{soldier.driverOf=undefined;soldier.flight=carrier?.spec.ejectionSeat===false?null:launchFlight(carrier?.spec.height??3,soldier.yaw);}}
    for(const waypoint of this.mission.waypoints)if(!this.reachedWaypoints.has(waypoint.id)&&distance(this.player,waypoint)<waypoint.radius){this.reachedWaypoints.add(waypoint.id);this.waypoint=true;this.emit({type:'waypoint',text:String(waypoint.id)});}
    if(u&&u===this.mounted&&u.alive){const level=Math.min(...PARTS.map(part=>u.parts[part]))<=PART_DAMAGE_THRESHOLDS.critical?2:u.shield<u.spec.shield*.25?1:0,raised=level>this.warningLevel;if(raised)this.warningLevel=level;if(raised&&level===2)this.emit({type:'warning',unit:u,text:'ダメージクリティカル'});else if(this.pendingDamageWarning===u)this.emit({type:'warning',unit:u,text:'ダメージ'});else if(raised)this.emit({type:'warning',unit:u,text:'シールド低下、減速してください'});}this.pendingDamageWarning=null;
    this.resolveObjectives();
  }
}

// Earliest segment contact prevents fast missiles from crossing targets between frames.
export function segmentSphere(a:Point3,b:Point3,c:Point3,radius:number):number|null{
  const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
  const ox=a.x-c.x,oy=a.y-c.y,oz=a.z-c.z;
  const cc=ox*ox+oy*oy+oz*oz-radius*radius;if(cc<=0)return 0;
  const aa=dx*dx+dy*dy+dz*dz;if(aa===0)return null;
  const bb=2*(ox*dx+oy*dy+oz*dz),disc=bb*bb-4*aa*cc;if(disc<0)return null;
  const t=(-bb-Math.sqrt(disc))/(2*aa);return t>=0&&t<=1?t:null;
}
