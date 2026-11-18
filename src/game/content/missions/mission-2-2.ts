import type {MissionDefinition} from './types.ts';
import {MAP_2_2_POINTS as P,MISSION_2_2_TERRAIN} from './mission-2-2-map.ts';

const reference=new URL('../../../../assets/map/2-2/2-2map.png',import.meta.url).href;
export const MISSION_2_2:MissionDefinition={
 id:'2-2',title:'River Race',playerFaction:'union',initialIff:'2620',factionCodes:{merc:'5031',union:'2620'},
 bgm:{start:{trackId:'bgm-snow-maze',delay:0}},
 briefingPresentation:{mapPreview:{src:reference,width:1126,height:844,viewBox:'225 65 355 355',label:{ja:'原作の2-2任務地図',en:'Original mission 2-2 map'},mapProjection:{pixelOrigin:{x:514,y:193},worldOrigin:{x:0,z:0},pixelPerWorldX:{x:.25,y:0},pixelPerWorldZ:{x:0,y:-.25}}},entries:[{label:{ja:'MercのLatlon通信基地を破壊',en:'Destroy the Merc Latlon communication base'},detail:{ja:'キリーとともに川を渡り、通信基地を攻撃する。',en:'Cross the river with Kylie and attack the communication base.'}}]},
 subtitle:{ja:'2-2: River Race／河岸の戦い',en:'2-2: River Race'},
 briefing:{ja:'キリーとともにCRISC川沿いを進み、MercのLatlon通信基地を破壊する。西側の警備機を倒すと橋の奥から増援が動き出す。橋制御棟で橋を上げれば、増援の進軍を止められる。',en:'Advance along the CRISC River with Kylie and destroy the Merc Latlon communication base. Defeating the western sentry activates a reinforcement beyond the bridge. Raising the bridge stops its advance.'},
 startHint:{ja:'Union TD HAWCに搭乗済み。キリーはUnion Sentry HAWCで同行する。川沿いの敵と交戦し、西の通信基地へ向かえ。',en:'Start in a Union TD HAWC. Kylie accompanies you in a Union Sentry HAWC. Fight along the river and head west to the communication base.'},
 success:{ja:'MercのLatlon通信基地を破壊した。',en:'Merc Latlon communication base destroyed.'},
 radio:{ja:'キリーへF2で指示できる。',en:'Use F2 to command Kylie.'},
 player:P.player,assignedUnitId:'player-td',startMountedUnitId:'player-td',initialView:'first-person',completionEnabled:true,
 units:[
  {id:'player-td',kind:'union-tactical',...P.player,yaw:-Math.PI/2,pilot:false,iff:'2620'},
  {id:'kylie-sentry',kind:'union-sentry',...P.kylie,yaw:-Math.PI/2,pilot:true,personId:'kylie',iff:'2620'},
  {id:'south-sentry',kind:'merc-sentry',...P.southSentry,yaw:Math.PI,pilot:true},
  {id:'south-cruiser',kind:'merc-cruiser',...P.southCruiser,yaw:Math.PI,pilot:true},
  {id:'west-sentry',kind:'merc-sentry',...P.westSentry,yaw:1.2,pilot:true},
  {id:'bridge-reinforcement',kind:'merc-sentry',...P.bridgeReinforcement,yaw:1.2,pilot:true},
  {id:'west-rocket',kind:'scorp-rocket-tower',...P.westRocket,yaw:1.2,pilot:true,overrides:{name:'Merc Rocket Tower',jp:'マーグ軍 ロケットタワー',faction:'merc',color:'#727c8c'}},
  {id:'latlon-assault',kind:'merc-assault',...P.latlonAssault,yaw:1.2,pilot:true},
  {id:'latlon-asv',kind:'union-asv',...P.latlonAsv,yaw:1.2,pilot:true,overrides:{name:'Merc ASV',jp:'マーグ軍 ASV',faction:'merc',color:'#727c8c'}},
  {id:'north-guard-tower',kind:'merc-meson-tower',...P.northGuardTower,pilot:false},
 ],
 companions:[{personId:'kylie',unitId:'kylie-sentry',key:'F2',name:{ja:'キリー',en:'Kylie'}}],
 autoFollowOnBoard:['union-tactical'],
 assaults:[{unitId:'bridge-reinforcement',targetId:'player-td',startAt:0,afterEliminateUnitId:'west-sentry',stopWhenBridgeRaisedId:'crisc-bridge'}],
 rocks:[],
 base:{name:'merc-latlon-outpost',faction:'merc',...P.latlon,width:180,depth:160,buildings:[
  {id:'north-control-a',kind:'bridge-control',bridgeId:'crisc-bridge',name:'Bridge Control Building A',...P.bridgeControlA,width:28,depth:24,height:12,health:400,boardable:true},
  {id:'north-control-b',kind:'bridge-control',bridgeId:'crisc-bridge',name:'Bridge Control Building B',...P.bridgeControlB,width:28,depth:24,height:12,health:400,boardable:true},
  {id:'merc-latlon',kind:'comm-array',name:'Merc Latlon通信基地',...P.latlon,width:58,depth:50,height:26,health:500,boardable:false},
 ]},
 waypoints:[{id:1,...P.waypoint1,radius:18},{id:2,...P.waypoint2,radius:18},{id:3,...P.waypoint3,radius:20}],
 objectives:[{id:'destroy-latlon',type:'destroy-facility',facilityIds:['merc-latlon'],label:{ja:'MercのLatlon通信基地を破壊',en:'Destroy the Merc Latlon communication base'}}],
 terrain:MISSION_2_2_TERRAIN,
 tuning:{Easy:{interval:2.6},Medium:{interval:1.9},Hard:{interval:1.35}},
};
