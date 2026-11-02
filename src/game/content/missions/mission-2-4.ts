import type {MissionDefinition,Spawn} from './types.ts';

const groundAttackers:Spawn[]=[
  {id:'merc-aip-1',kind:'merc-aip',x:60,z:200,yaw:Math.PI,pilot:true},
  {id:'merc-sentry',kind:'merc-sentry',x:60,z:300,yaw:Math.PI,pilot:true},
  {id:'darken-sentry',kind:'darken-sentry',x:40,z:300,yaw:Math.PI,pilot:true},
  // {id:'merc-sentry2',kind:'merc-sentry',x:60,z:300,yaw:Math.PI,pilot:true},
];

const attackers=[...groundAttackers];

// User reference confirms the cockpit, snow plain and right-hand mountain.
// Coordinates and bounds are provisional; no original objectives are inferred.
export const MISSION_2_4:MissionDefinition={
 id:'2-4',title:'Merc · Snowfield',playerFaction:'merc',initialIff:'5031',factionCodes:{merc:'5031',union:'2620'},
 subtitle:{ja:'Merc編・雪原',en:'Merc snowfield'},
 briefing:{ja:'Merc Tactical Defense HAWCに搭乗した状態で雪原から開始する。地形は提供画像を基準にした仮配置。原作の敵配置・任務目標は未確認。',en:'Start aboard a Merc Tactical Defense HAWC on a snow plain. Terrain placement is provisional, based on the supplied image. Original enemies and objectives are unverified.'},
 startHint:{ja:'Merc Tactical Defense HAWC · 雪原。B：地図、C：視点切替。任務目標は未確定。',en:'Merc Tactical Defense HAWC · Snowfield. B: map, C: camera. Objectives unverified.'},
 success:{ja:'任務完了。',en:'Mission complete.'},radio:{ja:'キリーへF2で個別に指示できる。原作の会話内容は未確認。',en:'Use F2 to command Kylie. Original mission dialogue is unverified.'},
 player:{x:0,z:0},assignedUnitId:'merc-player',startMountedUnitId:'merc-player',initialView:'first-person',completionEnabled:false,
 units:[
  {id:'merc-player',kind:'merc-tactical',x:0,z:0,yaw:0,pilot:false},
  {id:'kylie',kind:'union-sentry',x:-18,z:-28,yaw:0,pilot:true,personId:'kylie',iff:'5031'},
  ...attackers,
  {id:'merc-meson',kind:'merc-meson-tower',x:-25,z:-5,pilot:false,powerSourceId:'merc-power'},
  {id:'scorp-rocket',kind:'scorp-rocket-tower',x:-5,z:-10,pilot:false},
  {id:'scorp-meson',kind:'scorp-meson-tower',x:-25,z:20,pilot:false,powerSourceId:'merc-power'},
],
 // Kylie participates per user instruction; chassis and placement remain provisional.
 companions:[{personId:'kylie',unitId:'kylie',key:'F2',name:{ja:'キリー',en:'Kylie'}}],
 // These displayed ammo values are the screenshot snapshot, not verified capacity.
 vehicleOverrides:{'merc-tactical':{weapons:['DASY','SAG5T','RAID'],initialAmmo:{DASY:300,SAG5T:40}}},
 rocks:[],
 base:{
  name:'Ur-Kinsk',
  faction:'merc',
  x:0,z:-100,
  width:260,
  depth:100,
  buildings:[
   {id:'merc-power',kind:'power-plant',name:'<erc> Power Plant · 電力プラント',x:-105,z:-100,width:38,depth:35,height:15,health:500,boardable:false},
  ]
 },
 waypoints:[{id:1,x:-25,z:-5,radius:5},{id:2,x:245,z:-140,radius:15}],
 objectives:[
  // {id:'occupy-meson',optional:true,type:'board-unit',unitId:'merc-tactical',label:{ja:'Scorpミーゾン・ガードタワーに搭乗',en:'Occupy the Scorp Meson Guard Tower'}},
 ],
 terrain:{biome:'snow',weather:'overcast',ridgeStyle:'rocky',halfWidth:220,minZ:-180,maxZ:1200,ridgeHeight:120,ridgeVariation:70,seed:24,
 cliffs:[{id:'snow-right-wall',x:145,z:130,width:110,depth:460,height:195}],
 peaks:[{x:-210,z:620,width:340,depth:360,height:150},{x:15,z:900,width:420,depth:400,height:180},{x:280,z:520,width:430,depth:420,height:250}]},
 tuning:{Easy:{interval:2.6},Medium:{interval:1.9},Hard:{interval:1.35}},
};
