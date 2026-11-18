import type {MissionDefinition} from './types.ts';
import {VEHICLES} from '../vehicles.ts';
import {MAP_3_5_POINTS,MAP_3_5_SOURCE,MISSION_3_5_TERRAIN} from './mission-3-5-map.ts';

const originalMap=new URL('../../../../assets/map/3-5/sc- 2026-11-12 0.42.40.png',import.meta.url).href;
const mesonTowerAI={...VEHICLES['scorp-meson-tower'].ai,detection:480};
const popupControlId='popup-turret-control';

// Enemy positions and the original ion-strike delay and safety distance remain provisional.
export const MISSION_3_5:MissionDefinition={
 id:'3-5',title:'Ion-Strike',playerFaction:'union',initialIff:'1381',factionCodes:{union:'1381',scorp:'3317'},
 subtitle:{ja:'G-NOME研究所へ',en:'Approach the G-NOME laboratory'},
 briefing:{ja:'キリー、ターン、シェリダンとともに黒い地形を通って南東のG-NOME研究所へ向かう。ロケットタワーの防衛線を越えて研究所を破壊せよ。',en:'Proceed with Kylie, Thane and Sheridan over the black ground toward the G-NOME laboratory in the southeast. Pass the rocket-tower defense and destroy the laboratory.'},
 startHint:{ja:'地図上部のXから味方3人と開始する。黒い領域は歩行できる。',en:'Start with three allies at the X near the top of the map. The black areas are walkable.'},
 success:{ja:'研究所を破壊し、シェリダンのイオン攻撃から生き延びた。',en:'The laboratory was destroyed and the player survived Sheridan’s ion strike.'},
 radio:{ja:'南東の研究所へ向かえ。',en:'Proceed to the laboratory in the southeast.'},
 player:MAP_3_5_POINTS.playerStart,initialYaw:Math.PI,assignedUnitId:'player-assault',startMountedUnitId:'player-assault',initialView:'first-person',
 units:[
  {id:'player-assault',kind:'scorp-assault',...MAP_3_5_POINTS.playerStart,yaw:Math.PI,pilot:false,iff:'1381'},
  {id:'kylie-aip',kind:'scorp-aip',...MAP_3_5_POINTS.kylieStart,yaw:Math.PI,pilot:true,personId:'kylie',iff:'1381'},
  {id:'thane-td',kind:'scorp-tactical',...MAP_3_5_POINTS.thaneStart,yaw:Math.PI,pilot:true,personId:'thane',iff:'1381'},
  {id:'sheridan-sentry',kind:'scorp-sentry',...MAP_3_5_POINTS.sheridanStart,yaw:Math.PI,pilot:true,personId:'sheridan',iff:'1381'},
  {id:'approach-td',kind:'scorp-tactical',...MAP_3_5_POINTS.approachTd,yaw:0,pilot:true,iff:'3317'},
  {id:'first-rocket-tower',kind:'scorp-rocket-tower',...MAP_3_5_POINTS.firstRocketTower,yaw:0,pilot:true,iff:'3317'},
  {id:'popup-turret-1',kind:'scorp-popup-turret',controlFacilityId:popupControlId,...MAP_3_5_POINTS.popupTurret1,pilot:true,iff:'3317'},
  {id:'popup-turret-2',kind:'scorp-popup-turret',controlFacilityId:popupControlId,...MAP_3_5_POINTS.popupTurret2,pilot:true,iff:'3317'},
  {id:'popup-turret-3',kind:'scorp-popup-turret',controlFacilityId:popupControlId,...MAP_3_5_POINTS.popupTurret3,pilot:true,iff:'3317'},
  {id:'popup-turret-4',kind:'scorp-popup-turret',controlFacilityId:popupControlId,...MAP_3_5_POINTS.popupTurret4,pilot:true,iff:'3317'},
  {id:'popup-turret-5',kind:'scorp-popup-turret',controlFacilityId:popupControlId,...MAP_3_5_POINTS.popupTurret5,pilot:true,iff:'3317'},
  {id:'second-rocket-tower',kind:'scorp-rocket-tower',...MAP_3_5_POINTS.secondRocketTower,yaw:0,pilot:true,iff:'3317'},
  {id:'second-line-aip-west',kind:'scorp-aip',...MAP_3_5_POINTS.secondLineAipWest,yaw:0,pilot:true,iff:'3317'},
  {id:'second-line-aip-east',kind:'scorp-aip',...MAP_3_5_POINTS.secondLineAipEast,yaw:0,pilot:true,iff:'3317'},
  {id:'left-approach-asv',kind:'scorp-asv',...MAP_3_5_POINTS.leftApproachAsv,yaw:0,pilot:true,iff:'3317'},
  {id:'left-meson-tower',kind:'scorp-meson-tower',powerSourceId:'g-nome-power-plant',...MAP_3_5_POINTS.leftMesonTower,yaw:0,pilot:true,iff:'3317',overrides:{ai:mesonTowerAI}},
  {id:'laboratory-meson-tower',kind:'scorp-meson-tower',powerSourceId:'g-nome-power-plant',...MAP_3_5_POINTS.laboratoryMesonTower,yaw:0,pilot:true,iff:'3317',overrides:{ai:mesonTowerAI}},
 ],
 companions:[
  {personId:'kylie',unitId:'kylie-aip',faction:'union',key:'F2',name:{ja:'キリー',en:'Kylie'}},
  {personId:'thane',unitId:'thane-td',faction:'union',key:'F3',name:{ja:'ターン',en:'Thane'}},
  {personId:'sheridan',unitId:'sheridan-sentry',faction:'union',key:'F4',name:{ja:'シェリダン',en:'Sheridan'}},
 ],
 waypoints:[{id:1,...MAP_3_5_POINTS.waypoint1,radius:24}],
 objectives:[
  {id:'destroy-laboratory',type:'destroy-facility',facilityIds:['g-nome-laboratory'],label:{ja:'G-NOMEの研究所を破壊せよ',en:'Destroy the G-NOME laboratory'}},
  {id:'survive-betrayal',type:'survive-ion-strike',label:{ja:'研究所への作戦を完遂せよ',en:'Complete the laboratory operation'}},
 ],
 ionStrike:{facilityId:'g-nome-laboratory',retreatUnitId:'sheridan-sentry',retreatRadioId:'sheridan-retreat',retreatRange:220,warningRadioIds:['thane-lost-gnome','kylie-eject'],delay:20,safeRadius:80},
 radioTriggers:[
  {id:'sheridan-retreat',event:'scripted',speakerId:'sheridan',vehicleKind:'scorp-sentry',line:{ja:'Baby、やられた。戦線を離脱する',en:'Baby, I’ve been hit. I’m leaving the battlefield.'}},
  {id:'thane-lost-gnome',event:'scripted',speakerId:'thane',vehicleKind:'scorp-tactical',line:{ja:'ガンツ！Gnomeを見失ったわ！',en:'Gantz! I’ve lost sight of G-Nome!'}},
  {id:'kylie-eject',event:'scripted',speakerId:'kylie',vehicleKind:'scorp-aip',line:{ja:'ガンツ！お前が狙われてるぞ。脱出脱出脱出だ！',en:'Gantz! You’re the target. Eject, eject, eject!'}},
 ],
 base:{name:'G-NOME laboratory',faction:'scorp',...MAP_3_5_POINTS.laboratory,width:28,depth:24,buildings:[
  {id:'g-nome-laboratory',kind:'command',name:'G-NOME Laboratory',...MAP_3_5_POINTS.laboratory,width:22,depth:18,height:12,health:500,boardable:false},
  {id:'g-nome-power-plant',kind:'power-plant',name:'G-NOME Power Plant',...MAP_3_5_POINTS.powerPlant,width:28,depth:28,height:20,health:400,boardable:false},
  {id:popupControlId,kind:'popup-turret-control',name:'Pop-up Turret Control',...MAP_3_5_POINTS.popupControl,width:20,depth:18,height:9,health:300,boardable:false},
 ]},
 terrain:MISSION_3_5_TERRAIN,rocks:[],
 briefingPresentation:{
  mapPreview:{src:originalMap,width:1140,height:850,viewBox:`${MAP_3_5_SOURCE.x} ${MAP_3_5_SOURCE.y} ${MAP_3_5_SOURCE.width} ${MAP_3_5_SOURCE.height}`,label:{ja:'3-5の原作任務地図',en:'Original 3-5 mission map'},mapProjection:{pixelOrigin:{x:408,y:244},worldOrigin:{x:0,z:0},pixelPerWorldX:{x:.25,y:0},pixelPerWorldZ:{x:0,y:-.25}}},
  entries:[
   {label:{ja:'G-NOMEの研究所を破壊せよ',en:'Destroy the G-NOME laboratory'},detail:{ja:'研究所は南東にある。',en:'The laboratory lies in the southeast.'}},
   {label:{ja:'ロケットタワーの防衛ラインを突破せよ',en:'Break through the rocket-tower defense'},detail:{ja:'防衛線を越えて研究所へ向かう。',en:'Pass the defense line on the way to the laboratory.'}},
   {label:{ja:'イオン砲を用いて研究所を破壊せよ',en:'Destroy the laboratory with the ion cannon'},detail:{ja:'研究所への攻撃を進める。',en:'Continue the attack on the laboratory.'}},
  ],
 },
 weaponOverrides:{lasers:{GAUS30:{range:480},LRIP:{range:800}}},
 tuning:{Easy:{interval:2.6},Medium:{interval:1.9},Hard:{interval:1.35}},
};
