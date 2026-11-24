import type {MissionDefinition} from './types.ts';
import {MAP_4_4_POINTS,MAP_4_4_SOURCE,MAP_4_4_TERRAIN,map44PixelToWorld as p} from './mission-4-4-map.ts';
const originalMap=new URL('../../../../assets/map/4-4/4-4map.png',import.meta.url).href;

// Terrain scale, enemy positions, IFF codes and enemy count are provisional.
// See docs/missions/mission-4-4.md for confirmed facts, known gaps and
// the reference video: https://www.youtube.com/watch?v=8sXUAZLF9Tw
export const MISSION_4_4:MissionDefinition={
 id:'4-4',title:'General Delivery',
 playerFaction:'union',
 friendlyFactions:[],
 // Player IFF: Wilkins-side Union.  Enemy IFF: Sheridan-side Union (provisional 4-digit code).
 initialIff:'2621',
 factionCodes:{union:'2621',darken:'5142'},
 bgm:{start:{trackId:'bgm-infiltrating-darken-territory',delay:0}},
 briefingPresentation:{
  mapPreview:{
   src:originalMap,
   width:1228,height:882,
   viewBox:`${MAP_4_4_SOURCE.x} ${MAP_4_4_SOURCE.y} ${MAP_4_4_SOURCE.width} ${MAP_4_4_SOURCE.height}`,
   label:{ja:'原作4-4の任務地図',en:'Original Mission 4-4 map'},
   mapProjection:{
    pixelOrigin:{x:99,y:181},
    worldOrigin:MAP_4_4_POINTS.start,
    pixelPerWorldX:{x:1/3,y:0},
    pixelPerWorldZ:{x:0,y:-1/3},
   },
  },
  entries:[
   {label:{ja:'地雷原制御施設を探せ',en:'Find the minefield control building'},
    detail:{ja:'施設に入るとGASHRで内部の敵歩兵を排除できる。IFFコードを取得して施設を出ると敵に気づかれる。',en:'Enter the building to clear enemy infantry with GASHR and obtain the enemy IFF code. Enemies will detect you when you exit.'}},
   {label:{ja:'ロケットタワー×2と警備部隊を排除',en:'Eliminate 2 rocket towers and security forces'},
    detail:{ja:'フィールド内にUnion Sentryほか複数の機体がいる。地雷原は制御施設の破壊か、敵AIPを無人化して乗ったまま溶岩を越えることで回避できる。',en:'Multiple Union units patrol the field. Bypass the minefield by destroying its control building or by boarding the unmanned enemy AIP over the lava.'}},
   {label:{ja:'橋制御施設で橋を下げる',en:'Lower the bridge at bridge control'},
    detail:{ja:'橋制御施設の近くにUnion Sentryが護衛している。施設に入り橋を下ろせ。',en:'A Union Sentry guards the bridge control building. Enter the building to lower the bridge.'}},
   {label:{ja:'橋を渡りミッション完了',en:'Cross the bridge to complete the mission'},
    detail:{ja:'橋を渡りきった先のウェイポイントへ到達するとクリア。',en:'Reach the waypoint beyond the bridge to complete the mission.'}},
  ],
 },
 subtitle:{ja:'溶岩の橋を渡れ',en:'Cross the lava bridge'},
 briefing:{ja:'シェリダン側のUnion警備部隊が守るこのエリアを突破し、橋制御施設で溶岩の橋を下ろして渡れ。地雷原制御施設に入るとIFFコードを取得できる。',en:'Break through Sheridan\'s Union security forces, lower the lava bridge at the bridge control building, and cross. Entering the minefield control building lets you obtain the enemy IFF code.'},
 startHint:{ja:'Union TD HAWCに搭乗済み。フィールド北西から開始。地雷原を避け、橋制御施設へ向かえ。歩兵時にGASHRが使える。',en:'You start mounted in a Union Tactical Defense HAWC at the northwest. Avoid the minefield and reach the bridge control building. GASHR is available on foot.'},
 success:{ja:'橋を渡り、増援の通路を確保した。',en:'Crossed the bridge and secured the reinforcement route.'},
 radio:{ja:'キリーからの通信：ガンツ、研究所の位置を確認した。橋を渡り次へ向かえ。',en:'Kylie on radio: Gantz, we\'ve confirmed the lab position. Cross the bridge and move out.'},
 player:MAP_4_4_POINTS.start,
 initialYaw:Math.PI/2,
 assignedUnitId:'player-td',
 startMountedUnitId:'player-td',
 footSecondaryWeapon:'GASHR',
 units:[
  {id:'player-td',kind:'union-tactical',...MAP_4_4_POINTS.start,yaw:Math.PI/2,pilot:false},
  // Enemy Sheridan-side Union forces (IFF provisional: '2622')
  // enemy-sentry-opening: 550 m east of start, behind cover. Provisional offset, kept level with the start.
  {id:'enemy-sentry-opening',kind:'union-sentry',x:MAP_4_4_POINTS.start.x+550,z:MAP_4_4_POINTS.start.z,yaw:-Math.PI/2,pilot:true,iff:'2622'},
  {id:'enemy-sentry-1',kind:'union-sentry',...p(190,210),yaw:Math.PI/2,pilot:true,iff:'2622'},
  {id:'enemy-asv',kind:'union-asv',...p(350,230),yaw:-Math.PI/2,pilot:true,iff:'2622'},
  {id:'enemy-aip',kind:'union-aip',...p(360,250),yaw:-Math.PI/2,pilot:true,iff:'2622'},
  {id:'enemy-tactical',kind:'union-tactical',...p(380,360),yaw:-Math.PI/2,pilot:true,iff:'2622'},
  // Rocket towers (scorp-rocket-tower recoloured as Union, provisional kind)
  {id:'rocket-tower-1',kind:'scorp-rocket-tower',...p(400,180),yaw:-Math.PI/2,pilot:true,iff:'2622',
   overrides:{name:'Union Rocket Tower',jp:'ユニオン ロケットタワー',faction:'union',color:'#8fbcd0',missileHomingScale:{UNKPA:0}}},
  {id:'rocket-tower-2',kind:'scorp-rocket-tower',...p(460,250),yaw:-Math.PI/2,pilot:true,iff:'2622',
   overrides:{name:'Union Rocket Tower',jp:'ユニオン ロケットタワー',faction:'union',color:'#8fbcd0',missileHomingScale:{UNKPA:0}}},
  // Bridge guard, beside the control building on the near bank.
  {id:'enemy-sentry-bridge',kind:'union-sentry',...p(440,390),yaw:Math.PI,pilot:true,iff:'2622'},
 ],
 assaults:[
  {unitId:'enemy-sentry-opening',targetId:'player-td',startAt:5},
  {unitId:'enemy-sentry-1',targetId:'player-td',startAt:8},
  {unitId:'enemy-tactical',targetId:'player-td',startAt:10},
 ],
 base:{
  name:'General Delivery facilities',faction:'union',
  ...p(450,330),width:900,depth:750,
  buildings:[
   // Mine-control building: boardable, enemy infantry inside (GASHR needed)
   // facilityIffDisguise requires bridge-control kind per validate.ts; IFF acquisition
   // is modelled via set-iff objective triggered on board instead (see objectives below).
   {id:'mine-control-building',kind:'mine-control',
    name:'Minefield Control',...MAP_4_4_POINTS.mineControl,width:26,depth:22,height:12,
    boardable:true,health:400},
   // Bridge-control building: raises/lowers delivery-bridge. Near bank, off the lava.
   {id:'delivery-bridge-control',kind:'bridge-control',
    bridgeId:'delivery-bridge',
    name:'Bridge Control',...MAP_4_4_POINTS.bridgeControl,width:26,depth:22,height:12,
    boardable:true,health:400,iff:'2622'},
   // Laboratory facility. The blue 1B icon is the bridge. (560, 450) is pale mountain, so this sits on the dark ground just south of that ridge. Provisional.
   {id:'laboratory',kind:'command',
    name:'Laboratory',...MAP_4_4_POINTS.labMarker,width:30,depth:26,height:14,
    boardable:false,health:600},
  ],
 },
 minefields:[{
  id:'delivery-minefield',
  controlFacilityId:'mine-control-building',
  ...MAP_4_4_POINTS.minefield,width:80,depth:70,
  triggerRadius:7,warningRange:100,
  visual:'markers',
  mines:[
   {id:'mine-1',...p(345,230)},
   {id:'mine-2',...p(370,232)},
   {id:'mine-3',...p(385,238)},
   {id:'mine-4',...p(348,250)},
   {id:'mine-5',...p(372,252)},
   {id:'mine-6',...p(388,248)},
  ],
 }],
 waypoints:[
  // Far bank of the single lava bridge, east of the southern leg.
  {id:1,...MAP_4_4_POINTS.waypoint1,radius:30},
 ],
 objectives:[
  // set-iff objective: triggered when player boards the mine-control building on foot
  // (models IFF code acquisition; facilityIffDisguise limited to bridge-control in validate.ts)
  {id:'get-iff',type:'set-iff',iff:'2622',optional:true,
   label:{ja:'地雷原制御施設でIFFコードを取得（任意）',en:'Obtain IFF code in the minefield control building (optional)'}},
  {id:'lower-bridge',type:'lower-bridge',bridgeId:'delivery-bridge',
   label:{ja:'橋制御施設で橋を下ろす',en:'Lower the bridge at bridge control'}},
  {id:'cross-bridge',type:'reach',waypointId:1,
   label:{ja:'橋を渡りきる',en:'Cross the bridge'}},
 ],
 initialRaisedBridges:['delivery-bridge'],
 // Kylie and Wilkins are off-field (radio-only). Personnel entries register person IDs
 // so the radio trigger validator can resolve each speaker.
 personnel:[{personId:'kylie',x:0,z:-1200},{personId:'wilkins',x:0,z:-1250}],
 radioTriggers:[
  // Kylie opens with an urgent radio call right at mission start (before first engagement).
  {id:'kylie-intro',event:'time',at:2,speakerId:'kylie',vehicleKind:'union-tactical',
   line:{ja:'ガンツか？！こちらキリー。研究所に到着した！戦況は良くない！橋には到着してないのか？！オーバー！',en:'Gantz?! This is Kylie. We\'ve reached the lab — situation is bad! Haven\'t you reached the bridge yet?! Over!'}},
  // Wilkins calls during the opening Sentry engagement (~15 s in).
  {id:'wilkins-intro',event:'time',at:15,speakerId:'wilkins',vehicleKind:'union-tactical',
   line:{ja:'ガンツ。ウィルキンスだ。我々の増援部隊は橋の向こうで待機している。早急に橋を下ろせ。',en:'Gantz. This is Wilkins. Our reinforcements are waiting on the other side of that bridge. Lower it now.'}},
  // On mission completion, Kylie confirms.
  {id:'kylie-complete',event:'completion',speakerId:'kylie',vehicleKind:'union-tactical',
   line:{ja:'ガンツ、研究所の位置を確認した。これで次の任務に進める。',en:'Gantz, we\'ve confirmed the lab\'s position. We can move to the next phase now.'}},
  // Wilkins closes via completionSequence (see below).
  {id:'wilkins-complete',event:'completion',speakerId:'wilkins',vehicleKind:'union-tactical',
   line:{ja:'素晴らしい働きだ諸君。増援を渡す準備ができた。',en:'Excellent work everyone. The reinforcements are ready to cross.'}},
 ],
 completionSequence:{delay:3,radioId:'wilkins-complete'},
 terrain:{
  biome:'volcanic',skyPalette:'amber',ridgeStyle:'rocky',weather:'clear',
  halfWidth:1550,minZ:-1000,maxZ:450,
  ridgeHeight:50,ridgeVariation:25,seed:44,
  ...MAP_4_4_TERRAIN,
 },
 rocks:[
  {...p(80,250),r:12},
  {...p(142,308),r:10},
  {...p(430,250),r:14},
 ],
 tuning:{Easy:{interval:2.2},Medium:{interval:1.6},Hard:{interval:1.1}},
};
