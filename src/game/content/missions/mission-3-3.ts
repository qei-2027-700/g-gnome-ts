import {BRIEFING_3_3} from './mission-3-3-briefing.ts';
import {MISSION_3_3_TERRAIN} from './mission-3-3-map.ts';
import {KYLIE_TOWER_WARNING,SHERIDAN_SCORP_ASV_BOARDED,SHERIDAN_INFANTRY_WARNING} from '../radio-dialogue.ts';
import type {MissionDefinition} from './types.ts';
// Layout follows launch-view and user direction; metre coordinates and yaw are provisional.
const SCORP_ASV_START={x:-780,z:-125};
const BASE={x:-905,z:-140};
export const MISSION_3_3:MissionDefinition={
 footSecondaryWeapon:'EGGER',
 briefingPresentation:BRIEFING_3_3,autoFollowOnBoard:['scorp-asv'],
 id:'3-3',title:'ウル・ウリット侵攻',subtitle:{ja:'ウル・ウリット基地と地雷原',en:'Ul-Urit base and minefield'},
 bgm:{start:{trackId:'bgm-mission-3-3',delay:3},afterBoard:{unitId:'scorp-asv',trackId:'bgm-union-march'}},
 briefing:{ja:'スコープ軍領内。Union ASVで開始する。武器2のVISOMを発射し、矢印キーで操縦する。同じ敵ASVへ2発命中させて誘い出せ。基地手前の赤い地雷エリアは、Scorp ASVで地雷を探知して避ける。南西の第1ウェイポイントが基地。左のロケットタワーは有人で攻撃する。右のタワーは当初無人だが、敵兵が後から搭乗する。仲間3人全員をScorp機に搭乗させると任務完了。距離と配置は仮設定。',en:'Scorp territory. Start aboard a Union ASV. Hit the same enemy ASV twice with VISOM to lure it out. Detect and avoid mines in a Scorp ASV. Waypoint 1 marks the southwest base. The left rocket tower is occupied; the right starts empty but an enemy soldier may board it later. Board all three squad members into Scorp vehicles to complete the mission. Distances are provisional.'},
 startHint:{ja:'2：VISOM発射 → 矢印キーで誘導。Spaceで誘導を終了。',en:'2: Launch VISOM. Arrow keys: steer. Space: release guidance.'},
 success:{ja:'仲間全員がScorp機への搭乗を完了しました。',en:'All squad members have boarded Scorp vehicles.'},
 radio:{ja:'キリー、ターン、シェリダンが付近で待機。F1→F1で選択目標を全員で攻撃。F1→F5でプレイヤーに追従。',en:'Kylie, Thane and Sheridan are nearby. F1 then F1: all attack the selected target. F1 then F5: follow the player.'},
 initialIff:'2620',factionCodes:{union:'2620'},playerFaction:'union',player:{x:0,z:0},assignedUnitId:'player-asv',startMountedUnitId:'player-asv',initialView:'first-person',rearCamera:{range:24,height:11,lookAhead:20,targetHeight:10},completionEnabled:true,
 units:[{id:'player-asv',kind:'union-asv',x:0,z:0,pilot:false,personId:'gant',overrides:{weapons:['P2MEC','VISOM'],initialAmmo:{VISOM:10}}},
 {id:'kylie',kind:'union-sentry',x:26,z:50,yaw:0,pilot:true,personId:'kylie'},
 {id:'thane',kind:'union-sentry',x:55,z:62,yaw:-Math.PI/2,pilot:true,personId:'thane'},
 {id:'sheridan',kind:'union-tactical',x:18,z:22,yaw:0,pilot:true,personId:'sheridan'},
 {id:'scorp-asv',kind:'scorp-asv',...SCORP_ASV_START,pilot:true},
 {id:'rocket-tower-west',kind:'scorp-rocket-tower',x:-865,z:-195,pilot:true},{id:'rocket-tower-east',kind:'scorp-rocket-tower',x:-865,z:-85,pilot:false},
 {id:'base-sentry',kind:'scorp-sentry',x:-900,z:-188,pilot:false},{id:'base-tactical-west',kind:'scorp-tactical',x:-910,z:-140,pilot:false},{id:'base-tactical-east',kind:'scorp-tactical',x:-900,z:-92,pilot:false}],
 companions:[{personId:'kylie',unitId:'kylie',name:{ja:'キリー',en:'Kylie'},key:'F2'},{personId:'thane',unitId:'thane',name:{ja:'ターン',en:'Thane'},key:'F3'},{personId:'sheridan',unitId:'sheridan',name:{ja:'シェリダン',en:'Sheridan'},key:'F4'}],radioRange:400,
 waypoints:[{id:1,...BASE,radius:30}],
 objectives:[{id:'board-scorp',type:'board-faction',faction:'scorp',personIds:['kylie','thane','sheridan'],label:{ja:'仲間全員をScorp機に搭乗させる',en:'Board all squad members into Scorp vehicles'}}],
 radioTriggers:[{id:'kylie-tower-warning',speakerId:'kylie',vehicleKind:'scorp-asv',range:350,line:KYLIE_TOWER_WARNING},
 {id:'sheridan-scorp-boarded',speakerId:'sheridan',vehicleKind:'scorp-asv',event:'board',line:SHERIDAN_SCORP_ASV_BOARDED},
 {id:'sheridan-infantry-warning',speakerId:'sheridan',vehicleKind:'scorp-asv',range:280,line:SHERIDAN_INFANTRY_WARNING}],
 // Provisional count and timing; soldiers emerge one at a time after the approach warning.
 infantrySorties:[{id:'ul-urit-infantry',facilityId:'ul-urit-command',vehicleKind:'scorp-asv',range:280,count:3,delay:3,interval:8}],
 towerCrewArrivals:[{id:'ul-urit-right-tower-crew',towerId:'rocket-tower-east',range:220,delay:15,spawn:{x:-847,z:-80}}],
 lures:[{unitId:'scorp-asv',weapon:'VISOM',hits:2,onFootResponse:'ram-player'}],
 base:{name:'UL-URIT',...BASE,width:240,depth:300,buildings:[{id:'ul-urit-command',kind:'command',x:-965,z:-168,width:28,depth:30,height:9},{id:'ul-urit-mine-control',kind:'mine-control',x:-955,z:-105,width:18,depth:46,height:7}]},
 minefields:[{id:'base-approach',warningRange:60,warningVehicle:'union-asv',x:-600,z:-110,width:220,depth:520,triggerRadius:2,mines:Array.from({length:8},(_,row)=>Array.from({length:16},(_,column)=>{const z=500+row*28,x=-240+column*32+(row%2)*8;return {id:`mine-${row}-${column}`,x:-z,z:x-110};}).filter(mine=>Math.abs(mine.z+110-Math.sin((-mine.x-500)/196*Math.PI)*70)>22)).flat()}],
 terrain:MISSION_3_3_TERRAIN,rocks:[{x:-180,z:-100,r:12},{x:-260,z:110,r:14}],
 tuning:{Easy:{interval:2.6},Medium:{interval:1.9},Hard:{interval:1.35}},
};
