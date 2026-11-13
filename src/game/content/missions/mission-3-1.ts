import type {MissionDefinition} from './types.ts';
import {MAP_3_1_POINTS,MISSION_3_1_TERRAIN} from './mission-3-1-map.ts';

// Start is due east of waypoint 1. The recon ASV, its rocks, and the plaza tower use that relation, not traced pixels.
// initialIff 0000 and enemyIff 0701 are placeholders, not measured codes. field-anchor is outside the map and is not the captured ASV.
// Kylie and Thane stand a few meters ahead. The ASV holds beyond the rocks so a straight missile along this line meets a rock. Those offsets are not measured pixels.
// Plaza hawks stand on either side of the rocket and advance on each other once the player is within PLAZA_RANGE. That range is provisional.
// Border mesons use a provisional 180 m detection so the southeast reach point stays outside it.
const start=MAP_3_1_POINTS.playerStart,waypoint=MAP_3_1_POINTS.waypoint1,asv=MAP_3_1_POINTS.reconAsv,yaw=Math.atan2(waypoint.x-start.x,waypoint.z-start.z);
const east=Math.PI/2,west=-east,mesonGuard={ai:{detection:180}},enemyIff='0701',PLAZA_RANGE=220;
const plazaFight=(unitId:string,targetId:string)=>({unitId,targetId,startAt:0,engageRange:PLAZA_RANGE});
const foot=(forward:number,lateral:number)=>({x:start.x+Math.sin(yaw)*forward+Math.cos(yaw)*lateral,z:start.z+Math.cos(yaw)*forward-Math.sin(yaw)*lateral});
const RECON_SPOTTED={ja:'偵察部隊に見つかった。真西の方角だ。攻撃はかのうか！',en:'The recon unit has spotted us. They are due west. Can we attack!'};
export const MISSION_3_1:MissionDefinition={
 id:'3-1',title:'Scorp Crossing',playerFaction:'union',initialIff:'0000',factionCodes:{union:'0000',scorp:enemyIff},
 bgm:{start:{trackId:'bgm-credits',delay:0}},
//  bgm:{start:{trackId:'bgm-credits',delay:0},afterBoard:{unitId:'scorp-asv',trackId:'bgm-union-march'}},
 subtitle:{ja:'スコープ国境',en:'Scorp border'},
 briefing:{ja:'第1ウェイポイントの真東から、黒い地を真西へ徒歩で進む。淡い黄緑の帯には徒歩で入れない。キリーとターンが仮の位置から徒歩でついてくる。真西の岩の向こうに、仮の位置でScorpのASVと歩兵が2人いる。そのASVを奪うと、キリーとターンが同乗する。二人が同乗すると、IFFが0701になり、キリーが完了を告げる。0701は未計測の仮の敵コードである。中央の空き地に無人のロケットタワーがあり、その西側にScorpのHAWC3機、東側にUnionのHAWC2機とASVが仮の位置でいる。近づくと両側が交戦する。緑の輪の南東に、司令部、電力プラント、ミーゾンタワー3基、Scorpセントリー2機が仮の位置である。0701のままなら、これらは撃ってこない。仮の南東地点まで到達すると、この段階の任務は終わる。',en:'Walk due west on the black ground from due east of waypoint 1. Infantry cannot enter the pale bands. Kylie and Thane follow on foot from provisional positions. A Scorp ASV and two infantry wait beyond the rocks to the west, on provisional ground. Capture that ASV and Kylie and Thane ride along. Once both are aboard, IFF becomes 0701 and Kylie confirms it. 0701 is an unmeasured provisional enemy code. An unmanned rocket tower stands in the central opening, with three Scorp HAWCs to its west and two Union HAWCs plus an ASV to its east. The two sides engage once you come near. Southeast of the green ring are a command post, a power plant, three meson towers, and two Scorp Sentries, all on provisional ground. They hold their fire while your IFF is 0701. Reaching the provisional southeast point ends this stage.'},
 startHint:{ja:'真西へ歩け。岩の向こうに偵察部隊がいる。帯には入らない。キリーとターンが徒歩でついてくる。ASVを奪うと二人が同乗し、IFFが0701になる。0701は未計測の仮コード。',en:'Walk due west. The recon unit is beyond the rocks. Stay off the bands. Kylie and Thane follow on foot. Capture the ASV and, once both are aboard, IFF becomes 0701. 0701 is an unmeasured provisional code.'},
 success:{ja:'仮の南東地点に到達した。',en:'Reached the provisional southeast point.'},
 radio:{ja:'黒い地を南東へ進め。',en:'Cross the black ground toward the southeast.'},
 player:start,initialYaw:yaw,assignedUnitId:'field-anchor',initialView:'first-person',
 units:[
  {id:'field-anchor',kind:'scorp-asv',x:1200,z:0,pilot:false,iff:'0000'},
  {id:'recon-asv',kind:'scorp-asv',...asv,yaw:Math.PI/2,pilot:true,overrides:{ai:{stopDistance:800}}},
  {id:'plaza-rocket',kind:'scorp-rocket-tower',...MAP_3_1_POINTS.plazaRocket,pilot:false},
  {id:'plaza-scorp-assault',kind:'scorp-assault',...MAP_3_1_POINTS.plazaScorpAssault,yaw:east,pilot:true},
  {id:'plaza-scorp-sentry',kind:'scorp-sentry',...MAP_3_1_POINTS.plazaScorpSentry,yaw:east,pilot:true},
  {id:'plaza-scorp-tactical',kind:'scorp-tactical',...MAP_3_1_POINTS.plazaScorpTactical,yaw:east,pilot:true},
  {id:'plaza-union-tactical',kind:'union-tactical',...MAP_3_1_POINTS.plazaUnionTactical,yaw:west,pilot:true,iff:'0000'},
  {id:'plaza-union-sentry',kind:'union-sentry',...MAP_3_1_POINTS.plazaUnionSentry,yaw:west,pilot:true,iff:'0000'},
  {id:'plaza-union-asv',kind:'union-asv',...MAP_3_1_POINTS.plazaUnionAsv,yaw:west,pilot:true,iff:'0000'},
  {id:'border-meson-north',kind:'scorp-meson-tower',powerSourceId:'border-power',...MAP_3_1_POINTS.borderMesonNorth,yaw:0,pilot:true,overrides:mesonGuard},
  {id:'border-meson-east',kind:'scorp-meson-tower',powerSourceId:'border-power',...MAP_3_1_POINTS.borderMesonEast,yaw:0,pilot:true,overrides:mesonGuard},
  {id:'border-meson-south',kind:'scorp-meson-tower',powerSourceId:'border-power',...MAP_3_1_POINTS.borderMesonSouth,yaw:0,pilot:true,overrides:mesonGuard},
  {id:'border-sentry-west',kind:'scorp-sentry',...MAP_3_1_POINTS.borderSentryWest,yaw:0,pilot:true},
  {id:'border-sentry-south',kind:'scorp-sentry',...MAP_3_1_POINTS.borderSentrySouth,yaw:0,pilot:true},
 ],
 base:{
  name:'ウル・ビンジャー司令部',faction:'scorp',x:540,z:-730,width:140,depth:80,
  buildings:[
   {id:'border-command',kind:'command',name:'ウル・ビンジャー司令部',...MAP_3_1_POINTS.borderCommand,width:36,depth:28,height:12,health:800,boardable:false},
   {id:'border-power',kind:'power-plant',name:'ウル・ビンジャー電力プラント',...MAP_3_1_POINTS.borderPower,width:32,depth:26,height:14,health:500,boardable:false},
  ],
 },
 personnel:[
  {personId:'kylie',...foot(8,-4),follow:true},{personId:'thane',...foot(8,4),follow:true},
  {personId:'recon-north',x:asv.x,z:asv.z+14,faction:'scorp',iff:enemyIff},
  {personId:'recon-south',x:asv.x,z:asv.z-14,faction:'scorp',iff:enemyIff},
 ],
 companions:[{personId:'kylie',name:{ja:'キリー',en:'Kylie'},key:'F2'},{personId:'thane',name:{ja:'ターン',en:'Thane'},key:'F3'}],
 autoPassengerOnBoard:['recon-asv'],
 passengerIff:{unitId:'recon-asv',iff:enemyIff},
 waypoints:[
  {id:1,...MAP_3_1_POINTS.waypoint1,radius:24},
  {id:2,...MAP_3_1_POINTS.waypoint2,radius:24},
  {id:3,...MAP_3_1_POINTS.southeastReach,radius:24},
 ],
 objectives:[{id:'reach-southeast',type:'reach',waypointId:3,label:{ja:'仮の南東地点へ到達する。キリーとターンが偵察ASVに同乗すると仮IFFは0701になる',en:'Reach the provisional southeast point. IFF becomes provisional 0701 once Kylie and Thane board the recon ASV'}}],
 terrain:MISSION_3_1_TERRAIN,
 rocks:[{x:asv.x+50,z:asv.z,r:12},{x:asv.x+80,z:asv.z+18,r:9},{x:asv.x+80,z:asv.z-18,r:9}],
 radioTriggers:[
  {id:'kylie-recon-west',event:'near-units',unitIds:['recon-asv'],range:200,speakerId:'kylie',vehicleKind:'scorp-asv',line:RECON_SPOTTED},
  {id:'kylie-iff-set',event:'iff',iff:enemyIff,unitId:'recon-asv',speakerId:'kylie',vehicleKind:'scorp-asv',line:{ja:'IFFコードセット完了！',en:'IFF code set complete!'}},
  {id:'kylie-iff-goal',event:'iff',iff:enemyIff,unitId:'recon-asv',speakerId:'kylie',vehicleKind:'scorp-asv',line:{ja:'目的は第2ウェイポイント、ウル・ビンシャー！',en:'The objective is waypoint 2, Ur-Binshar!'}},
  {id:'kylie-plaza',event:'near-units',unitIds:['plaza-scorp-assault','plaza-scorp-sentry','plaza-scorp-tactical','plaza-union-tactical','plaza-union-sentry','plaza-union-asv'],range:PLAZA_RANGE,speakerId:'kylie',vehicleKind:'scorp-asv',line:{ja:'まずいな…ユニオンのやせん基地と目と鼻の先だ',en:'This is bad... the Union night-battle base is right under our nose.'}},
  {id:'thane-union-hold',event:'player-hit',unitIds:['plaza-union-tactical','plaza-union-sentry','plaza-union-asv'],speakerId:'thane',vehicleKind:'scorp-asv',line:{ja:'攻撃はできないわ！彼らは味方よ！',en:'We cannot attack! They are allies!'}},
 ],
 assaults:[
  plazaFight('plaza-scorp-assault','plaza-union-tactical'),
  plazaFight('plaza-scorp-sentry','plaza-union-sentry'),
  plazaFight('plaza-scorp-tactical','plaza-union-asv'),
  plazaFight('plaza-union-tactical','plaza-scorp-assault'),
  plazaFight('plaza-union-sentry','plaza-scorp-sentry'),
  plazaFight('plaza-union-asv','plaza-scorp-tactical'),
 ],
 tuning:{Easy:{interval:2.5},Medium:{interval:1.8},Hard:{interval:1.3}},
};
