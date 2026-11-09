import type {MissionDefinition} from './types.ts';

// Briefing goals are on the original mission screen. The relative layout is the
// 2026-11-10 placement: east start, river on the left, towers and the bridge on
// the far bank, and no HAWCs across the river. Meter coordinates are provisional.
export const MISSION_1_5:MissionDefinition={
 id:'1-5',title:'Rescue!',subtitle:{ja:'キリーとの合流',en:'Contact Kylie at Chambers Pass'},
 playerFaction:'darken',initialIff:'0024',factionCodes:{darken:'6707'},
 bgm:{start:{trackId:'bgm-mission-1-1-sentry-combat',delay:0}},
 briefing:{ja:'チャンバーズ峠の橋を渡り、キリーと連絡を取る。ミーゾン・ガードタワーと警備部隊を倒し、IFFを0024に設定せよ。橋制御棟へ入る前にシールドジェネレーターを破壊する。',en:'Cross the bridge at Chambers Pass and contact Kylie. Defeat the Meson Tower and security forces, and set IFF to 0024. Destroy the shield generator before entering the bridge control building.'},
 startHint:{ja:'Darken TD HAWCに搭乗済み。川は左手、正面から右手は崖。川の反対側のロケットタワーはしばらく後に攻撃する。北岸を西へ進み、対岸のシールドジェネレーターを破壊して橋を下げる。',en:'You start in a Darken TD HAWC. The river is on your left and cliffs fill the view ahead and to the right. The rocket tower across the river attacks after a delay. Follow the north bank west, then destroy the shield generator on the far bank and lower the bridge.'},
 success:{ja:'キリーと連絡を取り、チャンバーズ峠を通過した。',en:'Contacted Kylie and crossed Chambers Pass.'},
 radio:{ja:'橋を渡り、キリーと合流せよ。',en:'Cross the bridge and contact Kylie.'},
 player:{x:420,z:40},initialYaw:-Math.PI/2,assignedUnitId:'player-td',startMountedUnitId:'player-td',initialView:'first-person',
 units:[
  {id:'player-td',kind:'darken-tactical',x:420,z:40,yaw:-Math.PI/2,pilot:false},
  {id:'rocket-tower',kind:'scorp-rocket-tower',x:340,z:-210,yaw:.31,pilot:true,overrides:{name:'Darken Rocket Tower',jp:'ダーケン軍 ロケットタワー',faction:'darken',color:'#a6522b',missileHomingScale:{UNKPA:0}}},
  {id:'approach-asv',kind:'darken-asv',x:250,z:45,yaw:Math.PI/2,pilot:true},
  {id:'bridge-td',kind:'darken-tactical',x:40,z:40,yaw:Math.PI/2,pilot:true},
  {id:'control-sentry',kind:'darken-sentry',x:-60,z:35,yaw:Math.PI/2,pilot:true},
  {id:'bridge-sentry',kind:'darken-sentry',x:-150,z:55,yaw:0,pilot:true},
  {id:'meson-tower',kind:'merc-meson-tower',x:-250,z:-250,yaw:.2,pilot:true,powerSourceId:'darken-power',overrides:{name:'Darken Meson Guard Tower',jp:'ダーケン軍 ミーゾン・ガードタワー',faction:'darken',color:'#a6522b'}},
 ],
 assaults:[{unitId:'rocket-tower',targetId:'player-td',startAt:7}],
 personnel:[{personId:'kylie',x:-390,z:-310}],
 radioTriggers:[{id:'kylie-contact',event:'completion',speakerId:'kylie',vehicleKind:'darken-tactical',line:{ja:'ガンツ、聞こえる？　橋を渡れたのね。こちらへ来て。',en:'Gantz, do you read? You made it across the bridge. Come to my position.'}}],
 completionSequence:{delay:3,radioId:'kylie-contact'},
 base:{name:'Chambers Pass',faction:'darken',x:-20,z:160,width:180,depth:120,buildings:[
  {id:'bridge-control',kind:'bridge-control',bridgeId:'chambers-bridge',name:'Bridge Control Building',x:-310,z:-215,width:28,depth:24,height:12,health:600,boardable:true},
  {id:'shield-generator',kind:'shield-generator',name:'Darken Shield Generator',x:-70,z:-215,width:30,depth:25,height:14,health:120,boardable:false},
  {id:'darken-power',kind:'power-plant',name:'Darken Power Plant',x:-150,z:-265,width:45,depth:36,height:18,health:400,boardable:false},
 ]},
 waypoints:[{id:1,x:-390,z:-310,radius:30}],
 objectives:[
  {id:'meson',type:'eliminate',unitIds:['meson-tower'],label:{ja:'ミーゾン・ガードタワーを倒す',en:'Defeat Meson Tower'}},
  {id:'security',type:'eliminate',unitIds:['approach-asv','control-sentry','bridge-td','bridge-sentry'],label:{ja:'警備部隊を倒す',en:'Defeat security forces'}},
  {id:'generator',type:'destroy-facility',facilityIds:['shield-generator'],label:{ja:'シールドジェネレーターを破壊',en:'Destroy the shield generator'}},
  {id:'lower-bridge',type:'lower-bridge',bridgeId:'chambers-bridge',label:{ja:'橋制御棟で橋を下げる',en:'Lower the bridge at bridge control'}},
  {id:'iff',type:'set-iff',iff:'0024',label:{ja:'IFFを0024に設定',en:'Set IFF to 0024'}},
  {id:'contact',type:'reach',waypointId:1,label:{ja:'チャンバーズ峠の橋を渡り、キリーと連絡を取る',en:'Cross the bridge at Chambers Pass and contact Kylie'}},
 ],
 initialRaisedBridges:['chambers-bridge'],
 terrain:{biome:'desert',weather:'clear',skyPalette:'amber',ridgeStyle:'rocky',halfWidth:640,minZ:-520,maxZ:480,ridgeHeight:80,ridgeVariation:28,seed:15,
  river:{bridgeId:'chambers-bridge',x:0,z:-120,width:72,length:1140,bridgeZ:-165,bridgeWidth:48,path:[{x:560,z:-40},{x:300,z:-85},{x:40,z:-105},{x:-190,z:-165},{x:-560,z:-115}]},
  cliffs:[{id:'ahead-cliff',x:170,z:180,width:260,depth:140,height:125},{id:'north-cliff',x:-80,z:290,width:280,depth:160,height:110}],
  peaks:[{x:90,z:390,width:160,depth:120,height:145},{x:220,z:-450,width:170,depth:120,height:120},{x:-450,z:-450,width:150,depth:140,height:130}]},
 rocks:[{x:360,z:140,r:8},{x:-10,z:145,r:10},{x:160,z:-250,r:7}],
 tuning:{Easy:{interval:2.6},Medium:{interval:2},Hard:{interval:1.35}},
};
