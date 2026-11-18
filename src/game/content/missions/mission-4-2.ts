import type {MissionDefinition,Spawn} from './types.ts';
const originalMap=new URL('../../../../assets/map/4-2/4-2map.png',import.meta.url).href;
// The crop is x=14..435, y=50..474. One source pixel is three provisional world units.
const mapPoint=(x:number,y:number)=>({x:(x-225)*3,z:(50-y)*3+1000});
const ridge=(id:string,x:number,y:number,width:number,depth:number)=>({id,...mapPoint(x,y),width:width*3,depth:depth*3,height:120});
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
 id:'4-2',title:'Scorp Defense',playerFaction:'union',friendlyFactions:['scorp'],initialIff:'3317',factionCodes:{scorp:'3317',union:'2620'},
 briefingPresentation:{mapPreview:{src:originalMap,width:824,height:818,viewBox:'14 50 421 424',label:{ja:'原作4-2の任務地図',en:'Original Mission 4-2 map'},mapProjection:{pixelOrigin:{x:225,y:50},worldOrigin:{x:0,z:1000},pixelPerWorldX:{x:1/3,y:0},pixelPerWorldZ:{x:0,y:-1/3}}},entries:[
  {label:{ja:'Ur-Kinskを防衛せよ',en:'Defend Ur-Kinsk'}},
  {label:{ja:'ガードタワーを占拠せよ',en:'Occupy guard towers'}},
  {label:{ja:'橋を上げよ',en:'Raise the bridge'}}
 ]},
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
  {id:'scorp-assault2',kind:'scorp-assault',x:-40,z:680,pilot:true},
  {id:'scorp-assault3',kind:'scorp-assault',x:-40,z:580,pilot:false},
  {id:'scorp-assault4',kind:'scorp-assault',x:-40,z:480,pilot:false},
  {id:'scorp-assault5',kind:'scorp-assault',x:-60,z:680,pilot:false},
  // {id:'scorp-assault6',kind:'scorp-assault',x:-60,z:580,pilot:false},
  {id:'scorp-asv-guard',kind:'scorp-asv',x:110,z:770,pilot:true},
  {id:'scorp-asv-guard2',kind:'scorp-asv',x:100,z:730,pilot:true},
  {id:'scorp-asv-guard3',kind:'scorp-asv',x:55,z:710,pilot:true},
  {id:'scorp-asv-guard4',kind:'scorp-asv',x:35,z:710,pilot:false},
  // {id:'scorp-asv-guard5',kind:'scorp-asv',x:15,z:610,pilot:false},
  {id:'scorp-tactical-guard',kind:'scorp-tactical',x:-130,z:730,pilot:true},
  {id:'scorp-tactical-guard2',kind:'scorp-tactical',x:-90,z:715,pilot:true},
  // {id:'scorp-tactical-guard3',kind:'scorp-tactical',x:-600,z:5,pilot:true},
  {id:'bridge-rocket',kind:'scorp-rocket-tower',x:170,z:610,pilot:false},
  {id:'bridge-union-sentry',kind:'union-sentry',x:350,z:420,yaw:-Math.PI/2,pilot:true},
  {id:'bridge-union-asv',kind:'union-asv',x:390,z:440,yaw:-Math.PI/2,pilot:true},
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
  //  {id:'ur-kinsk-latlon',kind:'comm-array',name:'Scorp Latlon COMM Array',x:105,z:700,width:35,depth:30,height:15,health:500,boardable:false},
   {id:'bridge-control',kind:'bridge-control',bridgeId:'ur-kinsk-bridge',name:'Bridge Control Building',x:205,z:517,width:32,depth:25,height:12,health:800,boardable:true}
  ]
 },
 waypoints:[{id:1,x:20,z:800,radius:5},{id:2,x:205,z:517,radius:15}],
 objectives:[
  {id:'occupy-meson',optional:true,type:'board-unit',unitId:'scorp-meson',label:{ja:'Scorpミーゾン・ガードタワーに搭乗',en:'Occupy the Scorp Meson Guard Tower'}},
  {id:'defend-ur-kinsk',type:'defend',untilBridgeId:'ur-kinsk-bridge',targetIds:['ur-kinsk-hq'],attackerIds:attackers.map(u=>u.id),label:{ja:'橋を上げるまでUr-Kinsk司令部を守る',en:'Protect Ur-Kinsk headquarters until the bridge is raised'}},
  {id:'raise-bridge',type:'raise-bridge',bridgeId:'ur-kinsk-bridge',label:{ja:'川辺の橋制御棟へ入り、スイッチで橋を上げる',en:'Enter the riverside Bridge Control Building and raise the bridge'}}
 ],
 terrain:{
  river:{
    bridgeId:'ur-kinsk-bridge',
    x:294,
    z:517,
    width:30,
    length:770,
    bridgeZ:517,
    bridgeWidth:24,
    path:[
      mapPoint(374,113),mapPoint(356,131),mapPoint(347,166),mapPoint(337,190),mapPoint(323,211),
      mapPoint(316,241),mapPoint(300,270),mapPoint(278,303),mapPoint(271,325),mapPoint(287,350),mapPoint(246,367)
    ]
  },
  biome:'grassland',weather:'overcast',skyPalette:'amber',ridgeStyle:'rocky',halfWidth:630,minZ:-272,maxZ:1000,ridgeHeight:34,ridgeVariation:22,seed:42,
  peaks:[
    {...mapPoint(156,75),width:90,depth:48,height:125},{...mapPoint(77,185),width:105,depth:60,height:120},
    {...mapPoint(75,323),width:70,depth:130,height:120},{...mapPoint(145,254),width:100,depth:100,height:140},
    {...mapPoint(175,385),width:85,depth:125,height:120},{...mapPoint(257,235),width:50,depth:100,height:135},
    {...mapPoint(370,276),width:80,depth:145,height:120},{...mapPoint(380,170),width:50,depth:90,height:105}
  ],
  cliffs:[
    ridge('urkinsk-northwest',150,74,36,19),ridge('urkinsk-north',219,66,99,15),
    ridge('urkinsk-northeast',278,87,20,44),ridge('urkinsk-northeast-hook',310,129,39,17),
    ridge('urkinsk-west-north-cliff',143,115,16,66),
    ridge('urkinsk-west-upper',61,181,51,19),ridge('urkinsk-west-upper-hook',125,171,40,17),
    ridge('urkinsk-west-middle',68,250,19,94),ridge('urkinsk-west-lower',79,327,20,80),
    ridge('urkinsk-west-south-cliff',61,386,25,55),ridge('urkinsk-west-tip',55,426,20,28),
    ridge('urkinsk-inner-island',145,254,35,38),
    ridge('urkinsk-center-north',246,183,17,26),ridge('urkinsk-center-middle',263,228,17,53),
    ridge('urkinsk-center-south',239,284,19,47),
    ridge('urkinsk-back-left-cliff',179,350,49,26),ridge('urkinsk-bottom-middle',167,388,24,56),
    ridge('urkinsk-bottom-tip',185,418,41,20),ridge('urkinsk-bottom-hook',214,336,30,16),
    ridge('urkinsk-east-upper',378,170,18,39),ridge('urkinsk-east-hook',401,193,24,19),
    ridge('urkinsk-east-island',369,276,31,67),ridge('urkinsk-east-tip',386,302,18,31)
  ]
 },
 rocks:[{x:-220,z:220,r:10},{x:220,z:250,r:13},{x:-300,z:440,r:15}],
 tuning:{Easy:{interval:2.2},Medium:{interval:1.6},Hard:{interval:1.1}},
};
