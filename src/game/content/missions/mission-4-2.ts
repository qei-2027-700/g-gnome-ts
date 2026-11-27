import type {MissionDefinition,Spawn} from './types.ts';
const originalMap=new URL('../../../../assets/map/4-2/4-2map.png',import.meta.url).href;
// The original crop is x=14..435, y=50..474. Its 924x922 annotated enlargement supplies placements.
// Four and a half provisional world units per original pixel keep terrain and placements at one scale.
const mapScale=4.5;
const mapPoint=(x:number,y:number)=>({x:(x-225)*mapScale,z:(50-y)*mapScale+1500});
const markedPoint=(x:number,y:number)=>mapPoint(14+x*421/924,50+y*424/922);
const ridge=(x:number,y:number,width:number,depth:number)=>({...mapPoint(x,y),width:width*mapScale,depth:depth*mapScale,height:70});
const groundPositions=[
 [590,298],[610,306],[585,322],[625,328],
 [345,366],[368,378]
] as const;
const groundKinds=['union-tactical','union-sentry','union-sentry','union-asv','union-asv','union-sentry'] as const;
// User-confirmed scenario; coordinates, roster, timings and IFF are provisional.
const groundAttackers:Spawn[]=Array.from(
  {length:groundPositions.length},(_,i)=>(
    {
      id:`sheridan-union-${i+1}`,
      kind:groundKinds[i]!,
      ...markedPoint(groundPositions[i]![0],groundPositions[i]![1]),
      yaw:Math.PI,pilot:true
    }
  )
);
const airAttackers:Spawn[]=[
  {id:'union-aip-1',kind:'union-aip',...markedPoint(247,562),yaw:Math.PI,pilot:true},
  {id:'union-aip-2',kind:'union-aip',...markedPoint(280,585),yaw:Math.PI,pilot:true},
];
// Base assault only: the separate bridge-union-sentry is excluded from the BGM elimination cue.
const attackers=[...groundAttackers,...airAttackers];

export const MISSION_4_2:MissionDefinition={
 id:'4-2',title:'Scorp Defense',playerFaction:'union',friendlyFactions:['scorp'],initialIff:'3317',factionCodes:{scorp:'3317',union:'2620'},
 briefingPresentation:{mapPreview:{src:originalMap,width:824,height:818,viewBox:'14 50 421 424',label:{ja:'原作4-2の任務地図',en:'Original Mission 4-2 map'},mapProjection:{pixelOrigin:{x:225,y:50},worldOrigin:{x:0,z:1500},pixelPerWorldX:{x:1/mapScale,y:0},pixelPerWorldZ:{x:0,y:-1/mapScale}}},entries:[
  {label:{ja:'Ur-Kinskを防衛せよ',en:'Defend Ur-Kinsk'},detail:{ja:'友軍Scorpとともに基地を守り、橋を上げるまで司令部を維持する。編成・配置・数値は試作設定。',en:'Defend the base with Scorp and hold the headquarters until the bridge is raised. Roster, positions and statistics are provisional.'}},
  {label:{ja:'ガードタワーを占拠せよ',en:'Occupy guard towers'},detail:{ja:'左手のScorpミーゾンタワーへ搭乗する。キリーは右手のロケットタワー、ターンはもう1基へ向かう。搭乗は任意。',en:'Board the Scorp Meson tower on the left. Kylie takes the right rocket tower and Thane the other Meson tower. Boarding is optional.'}},
  {label:{ja:'橋を上げよ',en:'Raise the bridge'},detail:{ja:'川辺のBridge Control Buildingへ入り、スイッチで橋を上げると完了する。',en:'Enter the riverside Bridge Control Building and raise the bridge to finish.'}}
 ]},
 bgm:{volumeScale:.8,start:{trackId:'bgm-credits',delay:0},afterEliminate:{unitIds:attackers.map(u=>u.id),trackId:'bgm-snow-maze',when:'crew-dead'}},
 shieldProtectionRadius:80,respawningUnits:['bridge-union-sentry','bridge-union-asv'],respawnDelay:30,
 subtitle:{ja:'ScorpとともにシェリダンのUnion軍を迎撃',en:'Defend Ur-Kinsk alongside Scorp against Sheridan’s Union forces'},
 briefing:{ja:'シェリダン率いるUnion軍がUr-Kinskへ迫っている。徒歩の開始地点から左手のScorpミーゾン・ガードタワーへ搭乗し、友軍Scorpとともに基地を守れ。キリーは右手のロケットタワー、ターンはもう1基のミーゾンタワーへ搭乗する。Union AIP2機が電力プラントを狙うため優先して迎撃せよ。最後は川辺のBridge Control Buildingへ入り、スイッチで橋を上げると即座に完了する。地上編成・配置・数値は試作設定。',en:'Sheridan’s Union forces are approaching Ur-Kinsk. Occupy the Scorp Meson tower to your left and defend the base alongside Scorp. Kylie boards the right rocket tower; Thane boards the second Meson tower. Two Union AIPs attack the power plant: intercept them before both Meson towers lose power. Finish by entering the riverside Bridge Control Building and raising the bridge. Ground roster, positions and statistics are provisional.'},
 startHint:{ja:'左手のミーゾンタワーへ：左に向いてWで接近すると搭乗。右手はキリーのロケットタワー。ターンはもう1基へ。Union AIP2機が電力プラントを狙う！ Eで敵選択、Tで追尾、1でGAUS。',en:'Turn left and walk into the Meson tower. Kylie takes the right rocket tower; Thane takes the second Meson tower. Two Union AIPs attack the power plant! E: target, T: track, 1: GAUS. Protect headquarters.'},
 success:{ja:'橋を上げ、Ur-Kinskの防衛任務を完了した。',en:'Bridge raised. Ur-Kinsk defense complete.'},
 radio:{ja:'Scorp守備隊と協力し、シェリダンのUnion軍を迎撃せよ。',en:'Cooperate with the Scorp garrison and repel Sheridan’s Union forces.'},
 player:markedPoint(438,103),initialYaw:Math.PI/4,assignedUnitId:'scorp-meson',initialView:'first-person',completionEnabled:true,
 units:[
  {id:'scorp-meson',kind:'scorp-meson-tower',...markedPoint(394,151),pilot:false,powerSourceId:'ur-kinsk-power'},
  {id:'scorp-rocket',kind:'scorp-rocket-tower',...markedPoint(450,153),pilot:false},
  // {id:'thane-meson',kind:'scorp-meson-tower',...markedPoint(476,194),pilot:false,powerSourceId:'ur-kinsk-power'},
  {id:'thane-meson',kind:'scorp-meson-tower',...markedPoint(526,194),pilot:false,powerSourceId:'ur-kinsk-power'},
  {id:'scorp-sentry-guard',kind:'scorp-sentry',...markedPoint(420,170),pilot:true},
  {id:'scorp-assault2',kind:'scorp-assault',...markedPoint(555,115),pilot:true},
  // {id:'scorp-assault3',kind:'scorp-assault',...markedPoint(385,355),pilot:false},
  // {id:'scorp-asv-guard',kind:'scorp-asv',...markedPoint(558,214),pilot:true},
  // {id:'scorp-asv-guard5',kind:'scorp-asv',x:15,z:610,pilot:false},
  {id:'scorp-tactical-guard',kind:'scorp-tactical',...markedPoint(522,123),pilot:true},
  {id:'scorp-tactical-guard2',kind:'scorp-tactical',...markedPoint(500,85),pilot:true},
  // {id:'scorp-tactical-guard3',kind:'scorp-tactical',x:-600,z:5,pilot:true},
  {id:'bridge-rocket',kind:'scorp-rocket-tower',...markedPoint(630,205),pilot:false},
  {id:'bridge-union-sentry',kind:'union-sentry',...markedPoint(760,325),yaw:-Math.PI/2,pilot:true},
  {id:'bridge-union-asv',kind:'union-asv',...markedPoint(760,375),yaw:-Math.PI/2,pilot:true},
  ...attackers
 ],
 personnel:[
    {personId:'kylie',...markedPoint(430,145),boardingTargetId:'scorp-rocket'},
    {personId:'thane',...markedPoint(476,186),boardingTargetId:'thane-meson'},
 ],
 companions:[
  {personId:'kylie',unitId:'scorp-rocket',key:'F2',name:{ja:'キリー',en:'Kylie'}},{personId:'thane',unitId:'thane-meson',key:'F3',name:{ja:'ターン',en:'Thane'}}
 ],
 garrison:['thane-meson','scorp-rocket','scorp-sentry-guard','scorp-assault2','scorp-tactical-guard','scorp-tactical-guard2'],
 //  garrison:['thane-meson','scorp-rocket',],
 assaults:[...groundAttackers.map((u,i)=>({unitId:u.id,targetId:'ur-kinsk-hq',startAt:12+Math.floor(i/2)*12})),...airAttackers.map((u,i)=>({unitId:u.id,targetId:'ur-kinsk-power',startAt:8+i*12,retaliateAfterHits:3}))],
 base:{
  name:'Ur-Kinsk',
  faction:'scorp',
  ...markedPoint(535,124),
  width:390,
  depth:180,
  buildings:[
   {id:'ur-kinsk-hq',kind:'command',name:'Ur-Kinsk HQ · 司令部',...markedPoint(504,62),width:45,depth:35,height:18,health:1600,color:'#466b4c',boardable:false},
   {id:'ur-kinsk-power',kind:'power-plant',name:'Scorp Power Plant · 電力プラント',...markedPoint(537,89),width:38,depth:35,height:15,health:80,boardable:false},
   {id:'ur-kinsk-shield',kind:'shield-generator',name:'Scorp Shield Generator · シールド発生装置',...markedPoint(575,135),width:35,depth:30,height:15,health:500,boardable:false},
  //  {id:'ur-kinsk-latlon',kind:'comm-array',name:'Scorp Latlon COMM Array',x:105,z:700,width:35,depth:30,height:15,health:500,boardable:false},
   {id:'bridge-control',kind:'bridge-control',bridgeId:'ur-kinsk-bridge',name:'Bridge Control Building',...markedPoint(626,349),width:32,depth:25,height:12,health:800,boardable:true}
  ]
 },
 waypoints:[{id:1,...markedPoint(424,111),radius:5},{id:2,...markedPoint(626,349),radius:15}],
 objectives:[
  {id:'occupy-meson',optional:true,type:'board-unit',unitId:'scorp-meson',label:{ja:'Scorpミーゾン・ガードタワーに搭乗',en:'Occupy the Scorp Meson Guard Tower'}},
  {id:'defend-ur-kinsk',type:'defend',untilBridgeId:'ur-kinsk-bridge',targetIds:['ur-kinsk-hq'],attackerIds:attackers.map(u=>u.id),label:{ja:'橋を上げるまでUr-Kinsk司令部を守る',en:'Protect Ur-Kinsk headquarters until the bridge is raised'}},
  {id:'raise-bridge',type:'raise-bridge',bridgeId:'ur-kinsk-bridge',label:{ja:'川辺の橋制御棟へ入り、スイッチで橋を上げる',en:'Enter the riverside Bridge Control Building and raise the bridge'}}
 ],
 terrain:{
  river:{
    bridgeId:'ur-kinsk-bridge',
    x:mapPoint(323,211).x,
    z:mapPoint(323,211).z,
    width:45,
    length:1155,
    bridgeZ:mapPoint(323,211).z,
    bridgeWidth:36,
    path:[
      mapPoint(374,113),mapPoint(356,131),mapPoint(347,166),mapPoint(337,190),mapPoint(323,211),
      mapPoint(316,241),mapPoint(300,270),mapPoint(278,303),mapPoint(271,325),mapPoint(287,350),mapPoint(246,367)
    ]
  },
  biome:'grassland',weather:'overcast',skyPalette:'amber',ridgeStyle:'rocky',halfWidth:945,minZ:-408,maxZ:1500,ridgeHeight:34,ridgeVariation:22,seed:42,
  peaks:[
    {...mapPoint(156,75),width:135,depth:72,height:125},{...mapPoint(77,185),width:157.5,depth:90,height:120},
    {...mapPoint(75,323),width:105,depth:195,height:120},{...mapPoint(145,254),width:150,depth:150,height:140},
    {...mapPoint(175,385),width:127.5,depth:187.5,height:120},{...mapPoint(257,235),width:75,depth:150,height:135},
    {...mapPoint(370,276),width:120,depth:217.5,height:120},{...mapPoint(380,170),width:75,depth:135,height:105},
    ridge(150,74,36,19),ridge(219,66,99,15),ridge(278,87,20,44),ridge(310,129,39,17),
    ridge(143,115,16,66),ridge(61,181,51,19),ridge(125,171,40,17),
    ridge(68,250,19,94),ridge(79,327,20,80),ridge(61,386,25,55),ridge(55,426,20,28),
    ridge(145,254,35,38),ridge(246,183,17,26),ridge(263,228,17,53),ridge(239,284,19,47),
    ridge(179,350,49,26),ridge(167,388,24,56),ridge(185,418,41,20),ridge(214,336,30,16),
    ridge(378,170,18,39),ridge(401,193,24,19),ridge(369,276,31,67),ridge(386,302,18,31)
  ]
 },
 rocks:[{x:-330,z:330,r:10},{x:330,z:375,r:13},{x:-450,z:660,r:15}],
 tuning:{Easy:{interval:2.2},Medium:{interval:1.6},Hard:{interval:1.1}},
};
