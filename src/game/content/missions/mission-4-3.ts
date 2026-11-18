import type {MissionDefinition} from './types.ts';
import {MAP_4_3_POINTS,MAP_4_3_SOURCE,MAP_4_3_TERRAIN,map43PixelToWorld as p} from './mission-4-3-map.ts';
const originalMap=new URL('../../../../assets/map/4-3/4-3,ap.png',import.meta.url).href;

// The route, force size, IFF codes and supply values are provisional; see docs/missions/mission-4-3.md.
export const MISSION_4_3:MissionDefinition={
 id:'4-3',title:'War Zone',playerFaction:'union',initialIff:'2620',factionCodes:{union:'2620',merc:'6707',darken:'5142'},
 bgm:{start:{trackId:'bgm-barren-landscape',delay:0},afterBridge:{bridgeId:'war-north-bridge',trackId:'bgm-merc-region'}},
 briefingPresentation:{mapPreview:{src:originalMap,width:786,height:738,viewBox:`${MAP_4_3_SOURCE.x} ${MAP_4_3_SOURCE.y} ${MAP_4_3_SOURCE.width} ${MAP_4_3_SOURCE.height}`,label:{ja:'原作4-3の任務地図',en:'Original Mission 4-3 map'},mapProjection:{pixelOrigin:{x:220,y:100},worldOrigin:MAP_4_3_POINTS.start,pixelPerWorldX:{x:1/3,y:0},pixelPerWorldZ:{x:0,y:-1/3}}},entries:[
  {label:{ja:'戦域を横断してWP3へ',en:'Cross the war zone to WP3'},detail:{ja:'出撃位置は地図の上側。まず橋制御施設で橋を下ろす。',en:'Start near the top of the map. Lower the first bridge at its control building.'}},
  {label:{ja:'Union HAWCと航空支援を利用',en:'Use the Union HAWC and one airstrike'},detail:{ja:'航空支援は搭乗中にVで1回呼び出す。操作と効果は試作設定。',en:'Press V while mounted to call support once. The control and effect are provisional.'}},
  {label:{ja:'WP1で弾薬を補給',en:'Ammunition supply at WP1'},detail:{ja:'右側のDarken武器庫で弾薬を補給する。',en:'Replenish ammunition at the Darken weapons depot on the right.'}},
  {label:{ja:'WP2でShield Doublerを取得',en:'Shield Doubler supply at WP2'},detail:{ja:'WP2は地図の左側。搭乗中に到達するとシールド上限が一時的に2倍になる。',en:'WP2 is on the left. Arrive while mounted for a temporary doubled shield capacity.'}},
  {label:{ja:'WP3で戦域の端に到達',en:'Reach the edge of the war zone at WP3'},detail:{ja:'WP3到達で任務完了。途中の補給と航空支援は試作上は任意。',en:'Reaching WP3 completes the mission. Supplies and support are optional in this prototype.'}},
 ]},
 subtitle:{ja:'交戦中の戦域を抜けてWP3へ',en:'Cross the contested zone to WP3'},
 briefing:{ja:'MercとDarkenが交戦する戦域を横断し、WP3へ向かう。WP1には弾薬補給、WP2にはShield Doublerがある。Unionの航空支援は1回だけ呼び出せる。補給と航空支援は任意。',en:'Cross the Merc–Darken war zone and reach WP3. WP1 has ammunition; WP2 has a Shield Doubler. Union air support can be called once. Supplies and support are optional.'},
 startHint:{ja:'KylieとThaneが近くにいる。襲撃を退け、橋制御施設で橋を下ろす。Vで航空支援を1回呼べる。',en:'Kylie and Thane are nearby. Defeat the attacker and lower the bridge at its control building. Press V for one airstrike.'},
 success:{ja:'戦域の端へ到達した。',en:'Reached the far edge of the war zone.'},
 radio:{ja:'交戦を避けながらWP3へ向かえ。',en:'Proceed to WP3 through the contested area.'},
 player:MAP_4_3_POINTS.start,initialYaw:Math.PI,assignedUnitId:'union-player',startMountedUnitId:'union-player',
 units:[
  {id:'union-player',kind:'union-tactical',...MAP_4_3_POINTS.start,yaw:Math.PI,pilot:true},
  {id:'kylie-asv',kind:'union-asv',...p(206,96),yaw:Math.PI,personId:'kylie',pilot:true},
  {id:'thane-sentry',kind:'union-sentry',...p(234,96),yaw:Math.PI,personId:'thane',pilot:true},
  {id:'union-support',kind:'union-aip',...p(245,98),pilot:false},
  {id:'darken-opening-sentry',kind:'darken-sentry',...p(275,140),yaw:-Math.PI/2,pilot:true},
  {id:'merc-tactical',kind:'merc-tactical',...p(215,184),yaw:Math.PI/2,pilot:true},
  {id:'darken-aip',kind:'darken-aip',...p(251,185),yaw:-Math.PI/2,pilot:true},
  {id:'darken-asv',kind:'darken-asv',...p(275,184),yaw:-Math.PI/2,pilot:true},
  {id:'merc-cruiser',kind:'merc-cruiser',...p(268,207),yaw:Math.PI/2,pilot:true},
  {id:'darken-tactical',kind:'darken-tactical',...p(331,227),yaw:-Math.PI/2,pilot:true},
  {id:'depot-unoccupied',kind:'darken-sentry',...p(321,248),pilot:false},
 ],
 garrison:['union-support'],
 companions:[{personId:'kylie',unitId:'kylie-asv',name:{ja:'キリー',en:'Kylie'},key:'F2'},{personId:'thane',unitId:'thane-sentry',name:{ja:'ターン',en:'Thane'},key:'F3'}],
 assaults:[
  {unitId:'darken-opening-sentry',targetId:'union-player',startAt:5},
  {unitId:'merc-tactical',targetId:'darken-aip',startAt:0},
  {unitId:'darken-aip',targetId:'merc-tactical',startAt:0},
 ],
 airSupport:{unitId:'union-support'},
 supplies:[{waypointId:1,kind:'ammunition'},{waypointId:2,kind:'shield-doubler',duration:60}],
 waypoints:[{id:1,...MAP_4_3_POINTS.waypoint1,radius:25},{id:2,...MAP_4_3_POINTS.waypoint2,radius:25},{id:3,...MAP_4_3_POINTS.waypoint3,radius:35}],
 objectives:[{id:'cross-war-zone',type:'reach',waypointId:3,label:{ja:'戦域を横断してWP3へ到達',en:'Cross the war zone and reach WP3'}}],
 initialRaisedBridges:['war-north-bridge'],
 minefields:[{id:'east-minefield',...p(273,192),width:60,depth:60,triggerRadius:7,warningRange:90,mines:[{id:'east-mine-1',...p(265,186)},{id:'east-mine-2',...p(278,190)},{id:'east-mine-3',...p(272,200)}]}],
 base:{name:'War Zone facilities',faction:'darken',...p(200,215),width:1000,depth:850,buildings:[
  {id:'north-bridge-control',kind:'bridge-control',bridgeId:'war-north-bridge',name:'North Bridge Control',...p(226,137),width:24,depth:20,height:8,iff:'2620',boardable:true},
  {id:'minefield-control',kind:'mine-control',name:'Minefield Control',...p(310,196),width:22,depth:18,height:7},
  {id:'wp1-depot',kind:'command',name:'Darken Weapons Depot',...p(316,244),width:22,depth:18,height:7,boardable:false},
  {id:'wp2-depot',kind:'command',name:'WP2 Shield Doubler Depot',...p(68,236),width:22,depth:18,height:7,boardable:false},
 ]},
 terrain:{biome:'volcanic',skyPalette:'amber',ridgeStyle:'rocky',weather:'clear',halfWidth:600,minZ:-160,maxZ:1050,ridgeHeight:50,ridgeVariation:25,seed:43,
  ...MAP_4_3_TERRAIN},
 rocks:[{...p(146,181),r:12},{...p(313,200),r:15},{...p(147,357),r:14}],
 tuning:{Easy:{interval:2.2},Medium:{interval:1.6},Hard:{interval:1.1}},
};
