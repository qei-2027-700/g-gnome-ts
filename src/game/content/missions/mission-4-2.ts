import type {MissionDefinition,Spawn} from './types.ts';
// User-confirmed scenario; coordinates, roster, timings and IFF are provisional.
const groundAttackers:Spawn[]=Array.from(
  {length:8},(_,i)=>(
    {
      id:`sheridan-union-${i+1}`,
      kind:i<4?'union-sentry':i<6?'union-asv':'union-tactical',
      x:(i%4-1.5)*90+(i===4?45:0),z:360+Math.floor(i/4)*160+(i===4?130:0),
      yaw:Math.PI,pilot:true
    }
  )
);
const airAttackers:Spawn[]=[
  {id:'union-aip-1',kind:'union-aip',x:-260,z:600,yaw:Math.PI,pilot:true},
  {id:'union-aip-2',kind:'union-aip',x:260,z:650,yaw:Math.PI,pilot:true},
];
// Base assault only: the separate bridge-union-sentry is excluded from the BGM elimination cue.
const attackers=[...groundAttackers,...airAttackers];

export const MISSION_4_2:MissionDefinition={
 id:'4-2',title:'Scorp Defense',playerFaction:'union',initialIff:'3317',factionCodes:{scorp:'3317',union:'2620'},
 bgm:{volumeScale:.8,start:{trackId:'bgm-credits',delay:0},afterEliminate:{unitIds:attackers.map(u=>u.id),trackId:'bgm-snow-maze'}},
 subtitle:{ja:'ScorpとともにシェリダンのUnion軍を迎撃',en:'Defend Ur-Kinsk alongside Scorp against Sheridan’s Union forces'},
 briefing:{ja:'シェリダン率いるUnion軍がUr-Kinskへ迫っている。徒歩の開始地点から左手のScorpミーゾン・ガードタワーへ搭乗し、友軍Scorpとともに基地を守れ。キリーは右手のロケットタワー、ターンはもう1基のミーゾンタワーへ搭乗する。Union AIP2機が電力プラントを狙うため優先して迎撃せよ。最後は川辺のBridge Control Buildingへ入り、スイッチで橋を上げると即座に完了する。地上編成・配置・数値は試作設定。',en:'Sheridan’s Union forces are approaching Ur-Kinsk. Occupy the Scorp Meson tower to your left and defend the base alongside Scorp. Kylie boards the right rocket tower; Thane boards the second Meson tower. Two Union AIPs attack the power plant: intercept them before both Meson towers lose power. Finish by entering the riverside Bridge Control Building and raising the bridge. Ground roster, positions and statistics are provisional.'},
 startHint:{ja:'左手のミーゾンタワーへ：左に向いてWで接近すると搭乗。右手はキリーのロケットタワー。ターンはもう1基へ。Union AIP2機が電力プラントを狙う！ Eで敵選択、Tで追尾、1でGAUS。',en:'Turn left and walk into the Meson tower. Kylie takes the right rocket tower; Thane takes the second Meson tower. Two Union AIPs attack the power plant! E: target, T: track, 1: GAUS. Protect headquarters.'},
 success:{ja:'橋を上げ、Ur-Kinskの防衛任務を完了した。',en:'Bridge raised. Ur-Kinsk defense complete.'},
 radio:{ja:'Scorp守備隊と協力し、シェリダンのUnion軍を迎撃せよ。',en:'Cooperate with the Scorp garrison and repel Sheridan’s Union forces.'},
 player:{x:-18,z:840},initialYaw:Math.PI,assignedUnitId:'scorp-meson',initialView:'first-person',completionEnabled:true,
 units:[
  {id:'scorp-meson',kind:'scorp-meson-tower',x:20,z:800,pilot:false,powerSourceId:'ur-kinsk-power'},
  {id:'scorp-rocket',kind:'scorp-rocket-tower',x:-50,z:820,pilot:false},
  {id:'thane-meson',kind:'scorp-meson-tower',x:-65,z:755,pilot:false,powerSourceId:'ur-kinsk-power'},
  {id:'scorp-sentry-guard',kind:'scorp-sentry',x:-80,z:780,pilot:true},
  {id:'scorp-asv-guard',kind:'scorp-asv',x:110,z:770,pilot:true},
  {id:'scorp-asv-guard2',kind:'scorp-asv',x:100,z:730,pilot:true},
  {id:'scorp-asv-guard3',kind:'scorp-asv',x:55,z:710,pilot:false},
  {id:'scorp-tactical-guard',kind:'scorp-tactical',x:-130,z:730,pilot:true},
  {id:'scorp-tactical-guard2',kind:'scorp-tactical',x:-90,z:715,pilot:true},
  {id:'scorp-tactical-guard3',kind:'scorp-tactical',x:-600,z:5,pilot:true},
  {id:'bridge-rocket',kind:'scorp-rocket-tower',x:80,z:620,pilot:false},
  {id:'bridge-union-sentry',kind:'union-sentry',x:350,z:420,yaw:-Math.PI/2,pilot:true},
  {id:'bridge-union-asv',kind:'union-asv',x:300,z:440,yaw:-Math.PI/2,pilot:true},
  ...attackers
 ],
 personnel:[
    {personId:'kylie',x:-50,z:808,boardingTargetId:'scorp-rocket'},
    {personId:'thane',x:-65,z:743,boardingTargetId:'thane-meson'},
 ],
 companions:[
  {personId:'kylie',unitId:'scorp-rocket',key:'F2',name:{ja:'キリー',en:'Kylie'}},{personId:'thane',unitId:'thane-meson',key:'F3',name:{ja:'ターン',en:'Thane'}}
 ],
 garrison:['thane-meson','scorp-rocket','scorp-sentry-guard','scorp-asv-guard','scorp-tactical-guard'],
 //  garrison:['thane-meson','scorp-rocket',],
 assaults:[...groundAttackers.map((u,i)=>({unitId:u.id,targetId:'ur-kinsk-hq',startAt:12+Math.floor(i/2)*12})),...airAttackers.map((u,i)=>({unitId:u.id,targetId:'ur-kinsk-power',startAt:20+i*12}))],
 base:{
  name:'Ur-Kinsk',
  faction:'scorp',
  x:0,z:700,
  width:260,
  depth:120,
  buildings:[
   {id:'ur-kinsk-hq',kind:'command',name:'Ur-Kinsk HQ · 司令部',x:0,z:700,width:45,depth:35,height:18,health:1600,color:'#466b4c',boardable:false},
   {id:'ur-kinsk-power',kind:'power-plant',name:'Scorp Power Plant · 電力プラント',x:-105,z:700,width:38,depth:35,height:15,health:500,boardable:false},
   {id:'ur-kinsk-latlon',kind:'comm-array',name:'Scorp Latlon COMM Array',x:105,z:700,width:35,depth:30,height:15,health:500,boardable:false},
   {id:'bridge-control',kind:'bridge-control',bridgeId:'ur-kinsk-bridge',name:'Bridge Control Building',x:20,z:550,width:32,depth:25,height:12,health:800,boardable:true}
  ]
 },
 waypoints:[{id:1,x:20,z:800,radius:5},{id:2,x:20,z:550,radius:15}],
 objectives:[
  {id:'occupy-meson',optional:true,type:'board-unit',unitId:'scorp-meson',label:{ja:'Scorpミーゾン・ガードタワーに搭乗',en:'Occupy the Scorp Meson Guard Tower'}},
  {id:'defend-ur-kinsk',type:'defend',untilBridgeId:'ur-kinsk-bridge',targetIds:['ur-kinsk-hq'],attackerIds:attackers.map(u=>u.id),label:{ja:'橋を上げるまでUr-Kinsk司令部を守る',en:'Protect Ur-Kinsk headquarters until the bridge is raised'}},
  {id:'raise-bridge',type:'raise-bridge',bridgeId:'ur-kinsk-bridge',label:{ja:'川辺の橋制御棟へ入り、スイッチで橋を上げる',en:'Enter the riverside Bridge Control Building and raise the bridge'}}
 ],
 terrain:{
  river:{
    bridgeId:'ur-kinsk-bridge',
    x:210,
    z:360,
    width:70,
    length:1280,
    bridgeZ:560,
    bridgeWidth:24,
    path:[
      {x:450,z:1000},{x:410,z:900},{x:350,z:760},{x:280,z:610},{x:210,z:490},
      {x:250,z:390},{x:180,z:270},{x:225,z:145},{x:145,z:35},
      {x:115,z:-55},{x:80,z:-140},{x:40,z:-250},{x:31,z:-280}
    ]
  },
  biome:'grassland',weather:'overcast',skyPalette:'amber',ridgeStyle:'rocky',halfWidth:620,minZ:-280,maxZ:1000,ridgeHeight:34,ridgeVariation:22,seed:42,
  peaks:[
    {x:-470,z:680,width:230,depth:250,height:125},{x:-470,z:210,width:220,depth:230,height:120},
    {x:-190,z:500,width:230,depth:210,height:140},{x:-175,z:45,width:220,depth:210,height:120},
    {x:455,z:510,width:210,depth:230,height:135},{x:295,z:180,width:200,depth:210,height:120},
    {x:300,z:865,width:170,depth:170,height:105}
  ],
  cliffs:[
    {id:'urkinsk-west-north-cliff',x:-480,z:660,width:125,depth:95,height:130},
    {id:'urkinsk-west-south-cliff',x:-475,z:220,width:130,depth:110,height:125},
    {id:'urkinsk-back-left-cliff',x:-185,z:500,width:125,depth:90,height:130},
    {id:'urkinsk-center-south-cliff',x:-175,z:55,width:120,depth:95,height:120},
    {id:'urkinsk-east-north-cliff',x:300,z:850,width:90,depth:85,height:115},
    {id:'urkinsk-east-center-cliff',x:465,z:510,width:120,depth:95,height:135},
    {id:'urkinsk-east-south-cliff',x:305,z:185,width:105,depth:95,height:120}
  ]
 },
 rocks:[{x:-220,z:220,r:10},{x:220,z:250,r:13},{x:-300,z:440,r:15}],
 tuning:{Easy:{interval:2.2},Medium:{interval:1.6},Hard:{interval:1.1}},
};
