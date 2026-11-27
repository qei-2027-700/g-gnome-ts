import type {MissionDefinition,Spawn} from './types.ts';
import type {VehicleKind,VehicleOverride} from '../vehicles.ts';
import {MAP_4_5_POINTS,MAP_4_5_SOURCE,MAP_4_5_TERRAIN} from './mission-4-5-map.ts';
const originalMap=new URL('../../../../assets/map/4-5/map4-5.png',import.meta.url).href;

// The player boards the registered union-assault. Wilkins calls it a Lion HAWK in the briefing. The HUD name stays Union Assault HAWC.
// The four start together on the dark passage beside the eastern start mark, facing west. Wilkins is a Union TD HAWK, Keeley a Union ASV, and Thane a Union Sentry. The sheet does not name Thane.
// The sheet's Union ASV, east of the AIP, and the Union TD west of the mesa are enemies.
// Keeley's ASV keeps its ejection seat. Destroying that vehicle, or Wilkins' HAWK, does not lose the mission. Keeley the person dying before the mark or the laboratory's destruction does.
// The mark still destroys Kylie and her vehicle together. Destroying the laboratory instead starts her radio, then kills her four seconds later and wins one second after that.
// On foot, slot 3 is EGGER with 2 rounds and slot 4 is LaserSite. Slot 2 stays GASHR. The helmet frame's LaserSite 0 is a spent bar, not the charge at the start.
// LaserSite destroys genetics-lab when the aim ray hits that building inside 220 m. The mounted 10 s mark remains.
// Reference video: https://www.youtube.com/watch?v=_XcvTyyTxyw
// The central basin is a walkable deck. Two rocket towers stand on it, under the two labels. They are not immune, and UNKPA homing stays at the chassis default.
// Meson detection is a provisional 160 m. The chassis default is 1000 m. The eastern start is outside that range.
// Mark range 220 m is unmeasured. The 10 s hold is the walkthrough line "paint it for 10 seconds", not a measured charge bar.
// Slot 1 on the assault is twin P2MEC. Hold-fire repeats at the chassis's 0.6 s interval. There is no ion strike.
// Infantry LaserSite recharge is the unmeasured INFANTRY_LASER_SITE.cooldown. One hit spends the laboratory's remaining health. Other buildings are not in the list.
// The sheet's sweep turrets use the existing sweep-turret building. That kind does not fire.
const faceWest=-Math.PI/2;
const faceStart=(point:{x:number;z:number})=>Math.atan2(MAP_4_5_POINTS.start.x-point.x,MAP_4_5_POINTS.start.z-point.z);
const enemyIff='4502';
const unionMeson:VehicleOverride={name:'Union Meson Guard Tower',jp:'ユニオン ミーゾン ガードタワー',faction:'union',color:'#8fbcd0',ai:{detection:160}};
const enemy=(id:string,kind:VehicleKind,point:{x:number;z:number},extra?:{powerSourceId?:string;overrides?:VehicleOverride}):Spawn=>({
 id,kind,...point,yaw:faceStart(point),pilot:true,iff:enemyIff,
 ...(extra?.powerSourceId?{powerSourceId:extra.powerSourceId}:{}),
 ...(extra?.overrides?{overrides:extra.overrides}:{}),
});
export const MISSION_4_5:MissionDefinition={
 id:'4-5',title:"Sheridan's Lair",
 playerFaction:'union',
 friendlyFactions:[],
 // Provisional codes. Sheridan's units and buildings use a different IFF so they are hostile.
 initialIff:'4501',
 factionCodes:{union:'4501'},
 briefingPresentation:{
  mapPreview:{
   src:originalMap,
   width:844,height:794,
   viewBox:`${MAP_4_5_SOURCE.x} ${MAP_4_5_SOURCE.y} ${MAP_4_5_SOURCE.width} ${MAP_4_5_SOURCE.height}`,
   label:{ja:'原作4-5の任務地図',en:'Original Mission 4-5 map'},
   mapProjection:{
    pixelOrigin:{x:234,y:254},
    worldOrigin:{x:0,z:0},
    pixelPerWorldX:{x:1/MAP_4_5_SOURCE.metersPerPixel,y:0},
    pixelPerWorldZ:{x:0,y:-1/MAP_4_5_SOURCE.metersPerPixel},
   },
  },
  entries:[
   {label:{ja:'徒歩のLaserSiteで研究所を破壊するか、搭乗レーザーでマークせよ',en:'Destroy the laboratory with the infantry LaserSite, or mark it with the mounted laser'},
    detail:{ja:'ウィルキンス将軍は、この機体をライオンホークとも呼ぶ。降りると武器3はEGGR（2発）、武器4はLaserSite。武器4の照準が研究所に当たると、その1発で研究所を破壊する。開始時は充填済みで、画面に出る0は打ち切ったあとの表示。再充填は仮に1秒。射程220mはマークと同じ未計測。研究所を壊した時点でキリーが生きていれば、キリーの無線から約4秒後に機体または歩兵状態のキリーが死に、その約1秒後に完了する。搭乗したまま研究所を選択し、レーザー1番を10秒当て続けても完了するが、その場合はキリーが機体ごと破壊される。キリーの機体が壊れても、キリーが生きていれば失敗にはならない。マークか破壊より前にキリー本人が倒れると失敗する。',en:'General Wilkins also calls this HAWC a Lion. On foot, slot 3 is EGGR with 2 rounds and slot 4 is LaserSite. A LaserSite shot that hits the laboratory destroys it. The designator starts charged. A readout of 0 is a spent bar, not the starting charge. The 1 second recharge is unmeasured. The 220 m range is the same unmeasured mark range. Destroying the laboratory while Kylie lives starts her radio call; she dies about 4 seconds later, and the mission completes about 1 second after that. Staying mounted, selecting the laboratory, and holding laser 1 for 10 seconds also completes it, and that mark destroys Keeley with her vehicle. Destroying Keeley\'s vehicle does not fail the mission while Keeley lives. If Keeley herself dies before the mark or the destruction, the mission fails.'}},
  ],
 },
 subtitle:{ja:'シェリダンの陰謀',en:"Sheridan's plot"},
 briefing:{ja:'ウィルキンス将軍は、この機体をライオンホークとも呼ぶ。開始は東側の初期位置のそば、暗い通路。キリー、ターン、ウィルキンスも同じ場所にいる。西を向け。中央の高台にロケットタワーが2基ある。弾は移動すればある程度よけられる。高台の北にユニオンAIP、その東に敵のユニオンASV。高台の西に敵のユニオンTD。北西にスイープタレット、セントリー、ミーゾン・ガードタワー、電力プラント。北東にセントリー。高台の東にセントリーとミーゾン・ガードタワー。西端の第1ウェイポイントに司令部とミーゾン・ガードタワー。南にスイープタレット、その先の第2ウェイポイントがユニオン研究所。降りると武器3はEGGR（2発）、武器4はLaserSite。武器4の照準が研究所に当たると、その1発で研究所を破壊する。開始時は充填済みで、画面に出る0は打ち切ったあとの表示。再充填は仮に1秒。射程220mはマークと同じ未計測。研究所を壊した時点でキリーが生きていれば、キリーの無線から約4秒後に機体または歩兵状態のキリーが死に、その約1秒後に完了する。搭乗したまま研究所を選択し、レーザー1番を10秒当て続けても完了するが、その場合はキリーが機体ごと破壊される。キリーの機体が壊れても、キリーが生きていれば失敗にはならない。マークか破壊より前にキリー本人が倒れると失敗する。',en:'General Wilkins also calls this HAWC a Lion. Start on the dark passage beside the eastern start mark. Keeley, Thane, and Wilkins start there with you. Face west. Two rocket towers stand on the central high ground. Keep moving and you can dodge some of their fire. North of the high ground: a Union AIP, and east of that an enemy Union ASV. West of the high ground: an enemy Union TD. Northwest: a sweep turret, a Sentry, a meson guard tower, and a power plant. Northeast: a Sentry. East of the high ground: a Sentry and a meson guard tower. Waypoint 1 at the west end has a headquarters and a meson guard tower. South: a sweep turret, then the Union laboratory at waypoint 2. On foot, slot 3 is EGGR with 2 rounds and slot 4 is LaserSite. A LaserSite shot that hits the laboratory destroys it. The designator starts charged. A readout of 0 is a spent bar, not the starting charge. The 1 second recharge is unmeasured. The 220 m range is the same unmeasured mark range. Destroying the laboratory while Kylie lives starts her radio call; she dies about 4 seconds later, and the mission completes about 1 second after that. Staying mounted, selecting the laboratory, and holding laser 1 for 10 seconds also completes it, and that mark destroys Keeley with her vehicle. Destroying Keeley\'s vehicle does not fail the mission while Keeley lives. If Keeley herself dies before the mark or the destruction, the mission fails.'},
 startHint:{ja:'ウィルキンス将軍はライオンホークとも呼ぶ。東側の初期位置から西を向け。キリー、ターン、ウィルキンスも同じ場所にいる。中央のロケットは移動してよけろ。降りて武器4のLaserSiteを研究所に当てて壊せ。武器3はEGGR。研究所を破壊するとキリーの無線が流れ、約4秒後にキリーが死に、さらに約1秒後に完了する。搭乗レーザー1番を10秒当てても完了するが、その場合はキリーが機体ごと破壊される。先にキリー本人が死ぬと失敗。',en:'General Wilkins also calls it a Lion. The eastern start mark faces west. Keeley, Thane, and Wilkins start there with you. Dodge the central rockets by moving. Dismount and hit the laboratory with LaserSite in slot 4. Slot 3 is EGGR. Destroying the laboratory while Kylie lives starts her radio call; she dies about 4 seconds later, and the mission completes about 1 second after that. Holding mounted laser 1 for 10 seconds also completes it, and that mark destroys Keeley with her vehicle. If Keeley herself dies first, the mission fails.'},
 success:{ja:'研究所を破壊するか、搭乗レーザーでマークした。',en:'The laboratory was destroyed, or marked with the mounted laser.'},
 radio:{ja:'F2 キリー、F3 ターン、F4 ウィルキンス。',en:'F2 Keeley, F3 Thane, F4 Wilkins.'},
 player:MAP_4_5_POINTS.start,
 initialYaw:faceWest,
 assignedUnitId:'player-assault',
 startMountedUnitId:'player-assault',
 footWeapons:{egger:{ammo:2},laserSite:{range:220,facilityIds:['genetics-lab']}},
 initialView:'first-person',
 completionEnabled:true,
 completionSequence:{delay:5,radioId:'kylie-lab-destroyed',whenFacilityDestroyedId:'genetics-lab',casualty:{personId:'kylie',after:4}},
 radioTriggers:[
  {id:'kylie-lab-destroyed',event:'completion',speakerId:'kylie',vehicleKind:'union-asv',
   line:{ja:'やられた！ベイビー、ベイビー、ベイビー！',en:'I got hit! Baby, baby, baby!'}},
 ],
 radioRange:2000,
 bgm:{start:{trackId:'bgm-rescuing-kylie',delay:0},afterWaypoint:{waypointId:1,trackId:'bgm-infiltrating-darken-territory'}},
 units:[
  {id:'player-assault',kind:'union-assault',...MAP_4_5_POINTS.start,yaw:faceWest,pilot:false},
  {id:'kylie',kind:'union-asv',...MAP_4_5_POINTS.kylie,yaw:faceWest,pilot:true,personId:'kylie'},
  {id:'thane',kind:'union-sentry',...MAP_4_5_POINTS.thane,yaw:faceWest,pilot:true,personId:'thane'},
  {id:'wilkins',kind:'union-tactical',...MAP_4_5_POINTS.wilkins,yaw:faceWest,pilot:true,personId:'wilkins'},
  enemy('east-asv','union-asv',MAP_4_5_POINTS.eastAsv),
  enemy('east-meson','scorp-meson-tower',MAP_4_5_POINTS.eastMeson,{powerSourceId:'union-power',overrides:unionMeson}),
  enemy('east-sentry','union-sentry',MAP_4_5_POINTS.eastSentry),
  enemy('northeast-sentry','union-sentry',MAP_4_5_POINTS.northeastSentry),
  enemy('northwest-meson','scorp-meson-tower',MAP_4_5_POINTS.northwestMeson,{powerSourceId:'union-power',overrides:unionMeson}),
  enemy('northwest-sentry','union-sentry',MAP_4_5_POINTS.northwestSentry),
  enemy('route-td','union-tactical',MAP_4_5_POINTS.routeTd),
  enemy('route-aip','union-aip',MAP_4_5_POINTS.routeAip),
  enemy('waypoint-meson','scorp-meson-tower',MAP_4_5_POINTS.waypointMeson,{powerSourceId:'union-power',overrides:unionMeson}),
  enemy('rocket-north','union-rocket-tower',MAP_4_5_POINTS.rocketNorth),
  enemy('rocket-south','union-rocket-tower',MAP_4_5_POINTS.rocketSouth),
 ],
 companions:[
  {personId:'kylie',unitId:'kylie',name:{ja:'キリー',en:'Kylie'},key:'F2'},
  {personId:'thane',unitId:'thane',name:{ja:'ターン',en:'Thane'},key:'F3'},
  {personId:'wilkins',unitId:'wilkins',name:{ja:'ウィルキンス',en:'Wilkins'},key:'F4'},
 ],
 waypoints:[
  // 170 is provisional. Radius 40 is about 9 pixels and sits inside the map marker, so standing on the green "1" with that marker, or at the headquarters and meson the briefing groups with waypoint 1, did not count. The laboratory is about 845 m away and keeps radius 40.
  {id:1,...MAP_4_5_POINTS.waypoint1,radius:170},
  {id:2,...MAP_4_5_POINTS.laboratory,radius:40},
 ],
 objectives:[
  {id:'mark-laboratory',type:'mark-facility-casualty',facilityId:'genetics-lab',personId:'kylie',range:220,holdSeconds:10,completeOnDestroy:true,
   label:{ja:'徒歩のLaserSiteで研究所を破壊するか、搭乗レーザーでマークせよ',en:'Destroy the laboratory with the infantry LaserSite, or mark it with the mounted laser'}},
 ],
 base:{
  name:'Union Laboratory',faction:'union',
  ...MAP_4_5_POINTS.laboratory,width:40,depth:40,
  buildings:[
   {id:'genetics-lab',kind:'command',name:'Union Laboratory',...MAP_4_5_POINTS.laboratory,
    width:22,depth:18,height:12,health:500,boardable:false,iff:enemyIff},
   {id:'headquarters',kind:'command',name:'Union Headquarters',...MAP_4_5_POINTS.headquarters,
    width:28,depth:22,height:12,health:500,boardable:false,iff:enemyIff},
   {id:'union-power',kind:'power-plant',name:'Union Power Plant',...MAP_4_5_POINTS.power,
    width:32,depth:26,height:14,health:400,boardable:false,iff:enemyIff},
   {id:'northwest-sweep',kind:'sweep-turret',name:'Union Sweep Turret',...MAP_4_5_POINTS.northwestSweep,
    width:8,depth:8,height:6,health:200,iff:enemyIff},
   {id:'south-sweep',kind:'sweep-turret',name:'Union Sweep Turret',...MAP_4_5_POINTS.southSweep,
    width:8,depth:8,height:6,health:200,iff:enemyIff},
  ],
 },
 terrain:{
  // Open center window of assets/cockpits/union-assault-hawk.png, x 560–760, y 300–380. Not the shared amber clear color.
  biome:'volcanic',skyColor:'#bc8664',ridgeStyle:'rocky',weather:'clear',
  halfWidth:900,minZ:-880,maxZ:880,
  ridgeHeight:50,ridgeVariation:25,seed:45,
  ...MAP_4_5_TERRAIN,
 },
 rocks:[],
 tuning:{Easy:{interval:2.2},Medium:{interval:1.6},Hard:{interval:1.1}},
};
