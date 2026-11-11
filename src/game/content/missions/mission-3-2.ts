import type {MissionDefinition} from './types.ts';
import {MAP_3_2_POINTS,MAP_3_2_SOURCE,MISSION_3_2_TERRAIN,map32PixelToWorld} from './mission-3-2-map.ts';

const originalMap=new URL('../../../../assets/map/3-2/3-2map.png',import.meta.url).href;

// First field pass. The map has no scale; distances, defenders and IFF are provisional.
export const MISSION_3_2:MissionDefinition={
 id:'3-2',title:'CommArray at Ur-Kinsk',
 subtitle:{ja:'ウル・キンスクの通信施設',en:'Comm Array at Ur-Kinsk'},
 briefing:{ja:'ScorpのLatlon通信基地を破壊し、南西のScorp Assault HAWCがいる側を通過する。ターンは第1ウェイポイントから西側を下り、中央のシールド発生施設へ向かう。東中央の足元シールドは電力プラントの破壊で消える。',en:'Destroy the Scorp Latlon communication array and pass through the southwest area near the Scorp Assault HAWC. Thane heads from waypoint 1 down the west side toward the central shield generator. Destroy the power plant to remove the eastern ground shield.'},
 startHint:{ja:'Union AIPの機内から開始。左手のターンは別地点へ向かい、キリーとシェリダンも別地点にいる。',en:'Start in the Union AIP. Thane moves independently from your left; Kylie and Sheridan are at another location.'},
 success:{ja:'通信施設を破壊し、南西の通過地点に到達した。',en:'Communication array destroyed and southwest passage reached.'},
 radio:{ja:'ターンは独自に移動中。キリーとシェリダンは別地点で敵に接近する。',en:'Thane moves independently. Kylie and Sheridan approach the enemy from another location.'},
 briefingPresentation:{mapPreview:{src:originalMap,width:766,height:710,viewBox:`${MAP_3_2_SOURCE.x} ${MAP_3_2_SOURCE.y} ${MAP_3_2_SOURCE.width} ${MAP_3_2_SOURCE.height}`,label:{ja:'3-2の原作任務地図',en:'Original 3-2 mission map'},mapProjection:{pixelOrigin:{x:230,y:232},worldOrigin:{x:0,z:0},pixelPerWorldX:{x:1/8,y:0},pixelPerWorldZ:{x:0,y:-1/8}}},entries:[
  {label:{ja:'通信網を破壊',en:'Destroy the comm network'},detail:{ja:'Latlon通信基地は地図中央、第2ウェイポイントの北側。',en:'The Latlon array is in the center, north of waypoint 2.'}},
  {label:{ja:'第3ウェイポイント',en:'Waypoint 3'},detail:{ja:'地図左下の丸印は南西の通過地点。',en:'The circled marker at the lower left is the southwest passage.'}},
 ]},
 playerFaction:'union',initialIff:'4044',factionCodes:{union:'4044',scorp:'3317'},
 vehicleOverrides:{'union-aip':{weapons:['ARC-M','3cREAP'],initialAmmo:{'3cREAP':220}}},
 player:MAP_3_2_POINTS.start,initialYaw:-Math.PI/2,assignedUnitId:'player-aip',startMountedUnitId:'player-aip',initialView:'first-person',
 units:[
  {id:'player-aip',kind:'union-aip',...MAP_3_2_POINTS.start,yaw:-Math.PI/2,pilot:false},
  {id:'thane-sentry',kind:'union-sentry',...MAP_3_2_POINTS.thaneStart,yaw:-Math.PI/2,pilot:true,personId:'thane'},
  {id:'kylie-tactical',kind:'union-tactical',...map32PixelToWorld(320,220),yaw:Math.PI,pilot:true,personId:'kylie'},
  {id:'sheridan-tactical',kind:'union-tactical',...map32PixelToWorld(335,220),yaw:Math.PI,pilot:true,personId:'sheridan'},
  {id:'scorp-aip-patrol',kind:'scorp-aip',...map32PixelToWorld(350,256),yaw:0,pilot:true,overrides:{ai:{detection:150,strafe:0,keepMoving:false,stopDistance:80,missileVolley:1}}},
  {id:'scorp-td-north',kind:'scorp-tactical',...map32PixelToWorld(155,148),yaw:0,pilot:true},
  {id:'scorp-td-south',kind:'scorp-tactical',...map32PixelToWorld(245,226),yaw:Math.PI,pilot:true},
  {id:'scorp-aip-south',kind:'scorp-aip',...map32PixelToWorld(168,252),yaw:Math.PI,pilot:true},
  {id:'scorp-assault',kind:'scorp-assault',...map32PixelToWorld(129,361),yaw:Math.PI/2,pilot:true},
  {id:'rocket-tower',kind:'scorp-rocket-tower',...map32PixelToWorld(240,359),pilot:true},
  {id:'meson-north',kind:'scorp-meson-tower',...map32PixelToWorld(221,184),pilot:true,powerSourceId:'scorp-power-plant'},
  {id:'meson-south',kind:'scorp-meson-tower',...map32PixelToWorld(224,245),pilot:true,powerSourceId:'scorp-power-plant'},
 ],
 companions:[
  {personId:'kylie',unitId:'kylie-tactical',name:{ja:'キリー',en:'Kylie'},key:'F2'},
  {personId:'thane',unitId:'thane-sentry',name:{ja:'ターン',en:'Thane'},key:'F3'},
  {personId:'sheridan',unitId:'sheridan-tactical',name:{ja:'シェリダン',en:'Sheridan'},key:'F4'},
 ],radioRange:400,autoBoardCompanions:true,
 radioTriggers:[
  {id:'thane-opening',event:'time',at:5,speakerId:'thane',vehicleKind:'union-aip',line:{ja:'ところでキリー。シェリダンの話って一体...',en:'By the way, Kylie. What was that about Sheridan...?'}},
  {id:'kylie-history',event:'time',at:5.01,speakerId:'kylie',vehicleKind:'union-aip',line:{ja:'やつは10年前、俺たちを裏切った。そして最高の戦士を失った...',en:'Ten years ago, he betrayed us. We lost our finest soldier...'}},
  {id:'thane-interrupt',event:'time',at:5.02,speakerId:'thane',vehicleKind:'union-aip',line:{ja:'それでなんで奴が偉そうにしてるわけ？！',en:'Then why is he acting so high and mighty?!'}},
  {id:'kylie-reply',event:'time',at:5.03,speakerId:'kylie',vehicleKind:'union-aip',line:{ja:'やつは無罪放免さ。パールの死体は見つからなかったからな',en:'He walked free. Pearl’s body was never found.'}},
  {id:'sheridan-encounter',event:'encounter',at:25,unitIds:['kylie-tactical','sheridan-tactical'],enemyUnitIds:['scorp-aip-patrol'],range:220,speakerId:'sheridan',vehicleKind:'union-aip',line:{ja:'さあー諸君。ひと暴れと行こうか！',en:'All right, everyone. Let us raise some hell!'}},
 ],
 unitRoutes:[
  {unitId:'thane-sentry',personId:'thane',...map32PixelToWorld(170,300),via:[MAP_3_2_POINTS.waypoint1,map32PixelToWorld(145,225),map32PixelToWorld(145,255)],attackTargetIds:['scorp-shield-generator'],attackPositions:[map32PixelToWorld(170,300)],startAt:0},
  {unitId:'kylie-tactical',personId:'kylie',...map32PixelToWorld(295,270),attackTargetIds:['scorp-power-plant','ur-kinsk-comm'],attackPositions:[map32PixelToWorld(295,270),map32PixelToWorld(255,215)],startAt:15},
  {unitId:'sheridan-tactical',personId:'sheridan',...map32PixelToWorld(295,270),attackTargetIds:['scorp-power-plant','ur-kinsk-comm'],attackPositions:[map32PixelToWorld(295,270),map32PixelToWorld(255,215)],startAt:15},
 ],
 base:{name:'Ur-Kinsk communication site',faction:'scorp',...MAP_3_2_POINTS.commArray,width:190,depth:130,buildings:[
  {id:'ur-kinsk-comm',kind:'comm-array',name:'Scorp Latlon COMM Array',...MAP_3_2_POINTS.commArray,width:34,depth:28,height:17,health:500,boardable:false},
  {id:'scorp-power-plant',kind:'power-plant',name:'Scorp Power Plant',...map32PixelToWorld(242,271),width:25,depth:23,height:13,health:350,boardable:false},
  {id:'scorp-shield-generator',kind:'shield-generator',name:'Scorp Shield Generator',...map32PixelToWorld(183,307),width:26,depth:22,height:13,health:400,boardable:false},
 ]},
 groundShields:[{id:'east-ground-shield',powerPlantId:'scorp-power-plant',...map32PixelToWorld(290,270),width:24,depth:720,height:5}],
 minefields:[],
 shieldProtectionRadius:220,
 waypoints:[{id:1,...MAP_3_2_POINTS.waypoint1,radius:25},{id:2,...MAP_3_2_POINTS.waypoint2,radius:25},{id:3,...MAP_3_2_POINTS.waypoint3,radius:80}],
 objectives:[
  {id:'destroy-latlon',type:'destroy-facility',facilityIds:['ur-kinsk-comm'],label:{ja:'ScorpのLatlon通信基地を破壊',en:'Destroy the Scorp Latlon communication array'}},
  {id:'pass-southwest',type:'reach',waypointId:3,label:{ja:'南西のScorp Assault HAWCがいる側を通過',en:'Pass through the southwest area near the Scorp Assault HAWC'}},
 ],
 terrain:MISSION_3_2_TERRAIN,rocks:[],
 tuning:{Easy:{interval:2.5},Medium:{interval:1.8},Hard:{interval:1.3}},
};
