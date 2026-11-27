import type {MissionDefinition} from './types.ts';
const referenceMap=new URL('../../../../assets/map/2-6/2-6map.png',import.meta.url).href;
const approaches=[{id:'north',angle:0},{id:'east',angle:Math.PI/2},{id:'south',angle:Math.PI},{id:'west',angle:Math.PI*1.5},{id:'north-east',angle:Math.PI/4},{id:'south-east',angle:Math.PI*.75},{id:'south-west',angle:Math.PI*1.25},{id:'north-west',angle:Math.PI*1.75}];
const raiders=approaches.map(a=>`merc-aip-${a.id}`);
const pickupKills=6; // At least 70% of eight AIPs, rounded up.
const victoryKills=7; // About 80% of eight AIPs, rounded up; original exact count unverified.
// User: Thane works inside the central fortress, Kylie boards the second tower,
// and the player must board before Merc aircraft attack. Positions, timing,
// aircraft loadout and the defense completion condition remain provisional.
export const MISSION_2_6:MissionDefinition={
 id:'2-6',title:'Battle of Clouds',playerFaction:'union',initialIff:'2620',factionCodes:{union:'2620',merc:'5031'},
 // The eight Merc AIPs otherwise destroy the defense tower before the pickup threshold.
 weaponOverrides:{guns:{TCREAP:{interval:2.6},DASY:{interval:2.6}}},
 bgm:{volumeScale:.8,start:{trackId:'bgm-fighting-on-the-tundra',delay:0}},
 subtitle:{ja:'中央陣地を守り、Merc AIP部隊を撃退',en:'Defend the central position from Merc AIPs'},
 briefing:{ja:'主人公は中央陣地で徒歩開始。右側にいるキリーは左手前の無人塔へ向かい、少ししてから搭乗する。奥の無人ミーゾンタワーには主人公が搭乗する。東寄りの要塞と電力プラントの間には無人のMerc Assault HAWKもある。ターンは中央要塞内。Merc AIPを6機倒すとターンが脱出を告げる。ターンを自機へ迎え、味方を失わず8機中7機を破壊せよ。',en:'You start on foot inside the central position. Kylie starts to your right and reaches the near left tower after a delay; the farther Meson tower is yours. An empty Merc Assault HAWK is also between the fortress and power plant to the east. Thane is inside the fortress. After six Merc AIPs fall, Thane announces her escape. Bring her aboard your vehicle, keep every ally alive, and destroy seven of eight AIPs.'},
 startHint:{ja:'奥のミーゾンタワーへ急げ。東寄りの要塞と電力プラントの間には無人Assault HAWKもある。',en:'Hurry to the farther Meson tower. An empty Assault HAWK is also between the fortress and power plant to the east.'},
 success:{ja:'ターンを回収し、味方を失わずMerc AIPを7機以上撃破した。',en:'Thane was brought aboard, and at least seven Merc AIPs were destroyed without allied casualties.'},
 radio:{ja:'キリーは左手前の塔へ向かう。ターンは中央要塞内。',en:'Kylie heads for the near left tower. Thane is inside the central fortress.'},
 player:{x:-90,z:-75},initialYaw:0,assignedUnitId:'defense-tower',initialView:'first-person',
 units:[
  {id:'defense-tower',kind:'merc-meson-tower',powerSourceId:'merc-power-plant',x:-112,z:75,pilot:false},
  {id:'kylie-tower',kind:'merc-meson-tower',powerSourceId:'merc-power-plant',x:-115,z:0,pilot:false},
  // User-confirmed empty Assault HAWC: available for player boarding, not an enemy pilot spawn.
  {id:'reserve-assault',kind:'merc-assault',x:195,z:125,pilot:false,overrides:{boardable:true}},
  {id:'reserve-cruiser',kind:'merc-cruiser',x:-150,z:125,pilot:false},
  ...approaches.map(a=>({id:`merc-aip-${a.id}`,kind:'merc-aip' as const,x:75+Math.sin(a.angle)*400,z:150+Math.cos(a.angle)*400,pilot:true,yaw:a.angle+Math.PI,overrides:{ai:{detection:650,strafe:1,keepMoving:false,stopDistance:12,missileVolley:1}}})),
 ],
 personnel:[{personId:'kylie',x:-30,z:-5,boardingTargetId:'kylie-tower'},{personId:'thane',x:110,z:200,facilityId:'citadel'}],
 companions:[{personId:'kylie',unitId:'kylie-tower',key:'F2',name:{ja:'キリー',en:'Kylie'}},{personId:'thane',facilityId:'citadel',key:'F3',name:{ja:'ターン',en:'Thane'}}],
 assaults:raiders.map((unitId,i)=>({unitId,targetId:i%2?'kylie-tower':'defense-tower',startAt:i<4?24:39,retreatAt:i<4?77:92,retreatToRange:130})),
 pickups:[{personId:'thane',facilityId:'citadel',attackerIds:raiders,requiredKills:pickupKills}],
 noCompanionCasualties:true,
 radioTriggers:[
  {id:'kylie-aip-arrival',event:'time',at:12,speakerId:'kylie',vehicleKind:'merc-meson-tower',line:{ja:'ほーら。おいでなすった',en:'Here they come.'}},
  {id:'kylie-tower-urgent',event:'time-if-unit-unoccupied',at:22,unitId:'defense-tower',speakerId:'kylie',vehicleKind:'merc-meson-tower',line:{ja:'ガンツ。タワーはまだ占領されていない。行け！',en:'Gantz, the tower is still unoccupied. Get in!'}},
  {id:'pickup-thane',event:'scripted',speakerId:'thane',vehicleKind:'merc-meson-tower',line:{ja:'脱出よ！',en:'I am getting out!'}},
 ],
 vehicleOverrides:{'merc-assault':{passengerCapacity:1},'merc-cruiser':{passengerCapacity:1}},
 base:{name:'Merc installation',faction:'merc',x:100,z:130,width:600,depth:600,buildings:[
  {id:'citadel',kind:'citadel',visual:'pyramid-fortress',name:'Merc Citadel · 中央要塞',iff:'2620',color:'#334f9b',x:110,z:200,width:110,depth:100,height:55,health:1200,boardable:false},
  {id:'merc-power-plant',kind:'power-plant',name:'Merc Power Plant · 電力プラント',iff:'2620',x:235,z:85,width:70,depth:65,height:24,health:400,boardable:false},
  {id:'merc-latlon',kind:'comm-array',name:'Merc Latron COMM Array · 通信基地',iff:'2620',x:320,z:20,width:75,depth:65,height:30,health:400,boardable:false},
 ]},
 groundShields:[
  {id:'north-wall',powerPlantId:'merc-power-plant',x:100,z:430,width:600,depth:8,height:2},
  {id:'south-wall',powerPlantId:'merc-power-plant',x:100,z:-170,width:600,depth:8,height:2},
  {id:'west-wall',powerPlantId:'merc-power-plant',x:-200,z:130,width:8,depth:600,height:2},
  {id:'east-wall',powerPlantId:'merc-power-plant',x:400,z:130,width:8,depth:600,height:2},
 ],
 waypoints:[{id:1,x:-112,z:75,radius:4}],
 objectives:[
  {id:'citadel-defense',type:'defend',targetIds:['citadel'],attackerIds:raiders,requiredKills:victoryKills,label:{ja:'中央要塞を守る',en:'Defend the central fortress'}},
  {id:'repel-aips',type:'eliminate-count',unitIds:raiders,requiredKills:victoryKills,label:{ja:'Merc AIPを7機以上破壊',en:'Destroy at least seven Merc AIPs'}},
  {id:'rescue-thane',type:'board-player',personId:'thane',label:{ja:'ターンを自機へ同乗させる',en:'Bring Thane aboard your vehicle'}},
 ],
 briefingPresentation:{
  mapPreview:{src:referenceMap,width:708,height:668,viewBox:'18 28 361 364',label:{ja:'原作2-6の任務地図',en:'Original 2-6 mission map'},mapProjection:{pixelOrigin:{x:200,y:200},worldOrigin:{x:-112,z:75},pixelPerWorldX:{x:.3,y:0},pixelPerWorldZ:{x:0,y:-.3}}},
  vehiclePreview:{src:referenceMap,width:708,height:668,viewBox:'384 28 316 364',label:{ja:'原作2-6の機体プレビュー',en:'Original 2-6 vehicle preview'}},
  entries:[
   {label:{ja:'最重要項目：要塞を防御せよ',en:'Primary: defend the fortress'},detail:{ja:'主人公・キリー・ターンを生存させ、中央要塞を守る。電力プラントが破壊されると地上シールドと2基の塔への給電が止まる。',en:'Keep Gantz, Kylie and Thane alive and defend the central fortress. Destroying the power plant disables the ground shield and both towers.'}},
   {label:{ja:'Merc軍攻撃部隊を撃滅せよ',en:'Destroy the Merc assault force'},detail:{ja:'Merc AIPを6機倒すとターンが脱出を告げる。任務完了には8機中7機を破壊する。',en:'After six Merc AIPs fall, Thane announces her escape. Destroy seven of eight AIPs to complete the mission.'}},
   {label:{ja:'ターンを自機に迎えよ',en:'Bring Thane aboard'},detail:{ja:'要塞から出たターンを主人公の搭乗機へ同乗させる。塔にも同乗席がある。',en:'Bring Thane from the fortress aboard the vehicle you occupy. The towers also have passenger seats.'}},
  ]},
 terrain:{biome:'snow',weather:'overcast',ridgeStyle:'rocky',halfWidth:550,minZ:-450,maxZ:550,ridgeHeight:40,ridgeVariation:20,seed:26,
  peaks:[
   {x:-430,z:390,width:180,depth:230,height:55},{x:-350,z:480,width:170,depth:180,height:50},
   {x:260,z:470,width:200,depth:170,height:55},{x:520,z:320,width:150,depth:220,height:60},
   {x:550,z:-90,width:130,depth:240,height:55},{x:360,z:-340,width:210,depth:140,height:50},
   {x:-30,z:-400,width:200,depth:120,height:55},{x:-420,z:-240,width:170,depth:210,height:50},
  ]},
 rocks:[],
 tuning:{Easy:{interval:2.6},Medium:{interval:1.9},Hard:{interval:1.35}},
};
