import type {MissionDefinition} from './types.ts';
import {MAP_3_4_POINTS,MAP_3_4_SOURCE,MISSION_3_4_TERRAIN} from './mission-3-4-map.ts';

const originalMap=new URL('../../../../assets/map/3-4/3-4.png',import.meta.url).href;

// Terrain scale and exact base spacing remain provisional.
export const MISSION_3_4:MissionDefinition={
 id:'3-4',title:'Ur-Alr',playerFaction:'union',initialIff:'4033',factionCodes:{scorp:'3317',union:'4033'},
 subtitle:{ja:'ウル・アルーへ',en:'Approach Ur-Alr'},
 briefing:{ja:'ターンとともに橋制御棟へ向かい、GASHRで敵歩兵を排出して倒す。橋を下ろし、敵IFFに合わせてErreskat川を渡る。第3ウェイポイントでキリーとシェリダンに合流する。基地右側の地雷原を避け、Ur-Alr司令部を目指す。',en:'Secure bridge control with Thane, lower the bridge and match the enemy IFF before crossing the Erreskat River. Meet Kylie and Sheridan at waypoint 3. Avoid the mines on the right side of the base approach and continue toward Ur-Alr headquarters.'},
 startHint:{ja:'ターンとScorp TD HAWCで第1ウェイポイント近くから開始する。橋制御棟は西岸、橋は東側。',en:'Start near waypoint 1 with Thane in Scorp Tactical HAWCs. Bridge control is on the west bank; the bridge is east of it.'},
 success:{ja:'シェリダンがUr-Alr司令部に侵入し、研究所の座標を取得した。',en:'Sheridan infiltrated Ur-Alr headquarters and retrieved the laboratory coordinates.'},
 radio:{ja:'橋制御棟を確保し、川を渡れ。',en:'Secure bridge control and cross the river.'},
 player:MAP_3_4_POINTS.playerStart,initialYaw:-Math.PI/6,assignedUnitId:'player-td',startMountedUnitId:'player-td',initialView:'first-person',
 units:[
  {id:'player-td',kind:'scorp-tactical',...MAP_3_4_POINTS.playerStart,yaw:-Math.PI/6,pilot:false,iff:'4033'},
  {id:'thane-td',kind:'scorp-tactical',...MAP_3_4_POINTS.thaneStart,yaw:-Math.PI/6,pilot:true,personId:'thane',iff:'4033'},
  {id:'east-meson-tower',kind:'scorp-meson-tower',...MAP_3_4_POINTS.mesonTower,yaw:-Math.PI/2,pilot:true,iff:'3317',overrides:{ai:{detection:140,strafe:0,keepMoving:false,stopDistance:0,missileVolley:1}}},
  {id:'base-rocket-tower',kind:'scorp-rocket-tower',...MAP_3_4_POINTS.rocketTower,yaw:-Math.PI/4,pilot:true,iff:'3317'},
 ],
 companions:[{personId:'kylie',unitId:'kylie-td',key:'F2',name:{ja:'キリー',en:'Kylie'}},{personId:'thane',unitId:'thane-td',key:'F3',name:{ja:'ターン',en:'Thane'}},{personId:'sheridan',unitId:'sheridan-asv',key:'F4',name:{ja:'シェリダン',en:'Sheridan'}}],
 rendezvous:{waypointId:3,units:[
  {id:'kylie-td',kind:'scorp-tactical',...MAP_3_4_POINTS.kylieArrival,yaw:Math.PI/2,pilot:true,personId:'kylie',iff:'3317'},
  {id:'sheridan-asv',kind:'scorp-asv',...MAP_3_4_POINTS.sheridanArrival,yaw:Math.PI/2,pilot:true,personId:'sheridan',iff:'3317'},
 ]},radioRange:400,
 base:{name:'Ur-Alr',faction:'scorp',...MAP_3_4_POINTS.finalBase,width:120,depth:100,buildings:[
  {id:'ur-alr-hq',kind:'command',name:'Ur-Alr Headquarters',...MAP_3_4_POINTS.finalBase,width:38,depth:32,height:19,health:800,boardable:true},
  {id:'ur-alr-shield',kind:'shield-generator',name:'Ur-Alr Shield Generator',...MAP_3_4_POINTS.shieldGenerator,width:24,depth:20,height:14,health:320,boardable:false},
  {id:'ur-alr-mine-control',kind:'mine-control',name:'Ur-Alr Minefield Control',...MAP_3_4_POINTS.mineControl,width:26,depth:22,height:12,health:320,boardable:false},
  {id:'bridge-control',kind:'bridge-control',bridgeId:'ur-alr-bridge',name:'Bridge Control Building',...MAP_3_4_POINTS.bridgeControl,width:24,depth:20,height:12,health:400,pilot:true,iff:'3317',boardable:true},
 ]},
 vehicleElevator:{...MAP_3_4_POINTS.vehicleElevator,width:32,depth:28},
 minefields:[{id:'ur-alr-approach',controlFacilityId:'ur-alr-mine-control',visual:'markers',x:414,z:-558,width:72,depth:88,triggerRadius:3,mines:[
  {id:'ur-alr-mine-1',x:392,z:-528},{id:'ur-alr-mine-2',x:416,z:-536},{id:'ur-alr-mine-3',x:440,z:-546},
  {id:'ur-alr-mine-4',x:388,z:-566},{id:'ur-alr-mine-5',x:414,z:-574},{id:'ur-alr-mine-6',x:440,z:-584},
 ]}],shieldProtectionRadius:180,
 waypoints:[
  {id:1,...MAP_3_4_POINTS.bridge,radius:24},
  {id:2,...MAP_3_4_POINTS.waypoint2,radius:28},
  {id:3,...MAP_3_4_POINTS.waypoint3,radius:28},
 ],
 objectives:[
  {id:'sheridan-hq',type:'escort-facility',personId:'sheridan',facilityId:'ur-alr-hq',radius:52,afterObjectiveIds:['bridge-defense','approach','ur-alr-attack'],label:{ja:'最重要項目：シェリダンの司令部侵入を援護せよ',en:'Primary: support Sheridan entering headquarters'}},
  {id:'bridge-defense',type:'neutralize',unitIds:['east-meson-tower'],facilityIds:[],loweredBridgeId:'ur-alr-bridge',label:{ja:'Erreskat川を渡り、橋の防衛ラインを無力化せよ',en:'Cross the Erreskat River and neutralize bridge defenses'}},
  {id:'approach',type:'reach',waypointId:2,label:{ja:'Ur-Alrに接近せよ：第2ウェイポイント',en:'Approach Ur-Alr: waypoint 2'}},
  {id:'ur-alr-attack',type:'neutralize',unitIds:['base-rocket-tower'],facilityIds:['ur-alr-shield','ur-alr-mine-control'],label:{ja:'Ur-Alrを攻撃し、基地の防御設備を無力化せよ',en:'Attack Ur-Alr and neutralize the base defenses'}},
 ],initialRaisedBridges:['ur-alr-bridge'],facilityIffDisguise:{facilityId:'bridge-control',enemyIff:'3317',footIff:'4033',vehicleIds:['player-td','thane-td']},terrain:MISSION_3_4_TERRAIN,rocks:[],
 briefingPresentation:{
  mapPreview:{src:originalMap,width:772,height:724,viewBox:`${MAP_3_4_SOURCE.x} ${MAP_3_4_SOURCE.y} ${MAP_3_4_SOURCE.width} ${MAP_3_4_SOURCE.height}`,label:{ja:'3-4の原作任務地図',en:'Original 3-4 mission map'},mapProjection:{pixelOrigin:{x:220,y:234},worldOrigin:{x:0,z:0},pixelPerWorldX:{x:.25,y:0},pixelPerWorldZ:{x:0,y:-.25}}},
  entries:[
   {label:{ja:'橋制御棟を確保し、橋を下ろす',en:'Secure bridge control and lower the bridge'},detail:{ja:'西岸の橋制御棟から第1ウェイポイントの橋を操作する。',en:'Operate the waypoint 1 bridge from its west-bank control building.'}},
   {label:{ja:'IFFを合わせて川を渡る',en:'Align IFF codes and cross the river'},detail:{ja:'暫定的に橋制御棟へ入ると主人公機とターン機へ敵IFFを自動設定する。',en:'For now, entering bridge control automatically sets the enemy IFF on both HAWCs.'}},
   {label:{ja:'第2・第3ウェイポイントを進む',en:'Continue through waypoints 2 and 3'},detail:{ja:'第3ウェイポイント到達時にキリーとシェリダンが現れ、通信で連携できる。',en:'Kylie and Sheridan appear when you reach waypoint 3 and become available over radio.'}},
   {label:{ja:'Ur-Alr司令部へ侵入する',en:'Infiltrate Ur-Alr headquarters'},detail:{ja:'地図右下の最終地点に敵基地と司令部がある。',en:'The enemy base and headquarters lie at the southeast endpoint.'}},
  ],
 },
 tuning:{Easy:{interval:2.6},Medium:{interval:1.9},Hard:{interval:1.35}},
};
