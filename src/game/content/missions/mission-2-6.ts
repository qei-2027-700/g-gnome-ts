import type {MissionDefinition} from './types.ts';
const approaches=[{id:'north',angle:0},{id:'east',angle:Math.PI/2},{id:'south',angle:Math.PI},{id:'west',angle:Math.PI*1.5},{id:'north-east',angle:Math.PI/4},{id:'south-east',angle:Math.PI*.75},{id:'south-west',angle:Math.PI*1.25},{id:'north-west',angle:Math.PI*1.75}];
const raiders=approaches.map(a=>`merc-aip-${a.id}`);
const pickupKills=4; // Original count unverified.
// User: Thane works inside the central fortress, Kylie boards the second tower,
// and the player must board before Merc aircraft attack. Positions, timing,
// aircraft loadout and the defense completion condition remain provisional.
export const MISSION_2_6:MissionDefinition={
 id:'2-6',title:'Battle of Clouds',playerFaction:'union',initialIff:'2620',factionCodes:{union:'2620',merc:'5031'},
 bgm:{volumeScale:.8,start:{trackId:'bgm-fighting-on-the-tundra',delay:0}},
 subtitle:{ja:'中央要塞を2基のミーゾンタワーで防衛',en:'Defend the central fortress with two Meson towers'},
 briefing:{ja:'ターンは中央の巨大要塞内で作業中。キリーはもう1基のミーゾンタワーへ向かう。主人公も敵飛行機の攻撃が始まる前に手前の塔へ搭乗し、四方八方から来るMerc AIPの襲撃から要塞を守れ。',en:'Thane is working inside the central fortress. Kylie heads for the second Meson tower. Reach your tower before Merc aircraft attack and defend the fortress from Merc AIPs approaching from all directions.'},
 startHint:{ja:'正面のミーゾンタワーへ急げ。キリーは右の塔へ向かう。ターンは中央要塞内で作業中。搭乗後はEで敵選択、Tで追尾、1で青いGAUS30を発射。',en:'Hurry into the Meson tower ahead. Kylie is taking the right tower; Thane is working inside the fortress. E: target, T: track, 1: blue GAUS30 laser.'},
 success:{ja:'ターンを回収し、搭乗を完了した。',en:'Thane is safely aboard your vehicle.'},
 radio:{ja:'キリーは右の塔で迎撃。ターンは要塞内で作業中。',en:'Kylie is defending from the right tower. Thane is working inside the fortress.'},
 player:{x:-80,z:192},assignedUnitId:'defense-tower',initialView:'first-person',
 units:[
  {id:'defense-tower',kind:'merc-meson-tower',powerSourceId:'merc-power-plant',x:-80,z:210,pilot:false},
  {id:'kylie-tower',kind:'merc-meson-tower',powerSourceId:'merc-power-plant',x:80,z:210,pilot:false},
  // User-confirmed empty Assault HAWC: available for player boarding, not an enemy pilot spawn.
  {id:'reserve-assault',kind:'merc-assault',x:-115,z:170,pilot:false,overrides:{boardable:true}},
  {id:'reserve-cruiser',kind:'merc-cruiser',x:115,z:170,pilot:false},
  ...approaches.map(a=>({id:`merc-aip-${a.id}`,kind:'merc-aip' as const,x:Math.sin(a.angle)*560,z:120+Math.cos(a.angle)*560,pilot:true,yaw:a.angle+Math.PI})),
 ],
 personnel:[{personId:'kylie',x:80,z:198,boardingTargetId:'kylie-tower'},{personId:'thane',x:0,z:120,facilityId:'citadel'}],
 companions:[{personId:'kylie',unitId:'kylie-tower',key:'F2',name:{ja:'キリー',en:'Kylie'}},{personId:'thane',facilityId:'citadel',key:'F3',name:{ja:'ターン',en:'Thane'}}],
 assaults:raiders.map((unitId,i)=>({unitId,targetId:i%2?'kylie-tower':'defense-tower',startAt:i<4?12:27})),
 pickups:[{personId:'thane',facilityId:'citadel',attackerIds:raiders,requiredKills:pickupKills}],
 vehicleOverrides:{'merc-assault':{passengerCapacity:1},'merc-cruiser':{passengerCapacity:1}},
 base:{name:'Merc installation',faction:'merc',x:-100,z:120,width:400,depth:180,buildings:[
  {id:'citadel',kind:'citadel',name:'Merc Citadel · 中央要塞',iff:'2620',color:'#334f9b',x:0,z:120,width:110,depth:100,height:55,health:1200,boardable:false},
  {id:'merc-power-plant',kind:'power-plant',name:'Merc Power Plant · 電力プラント',iff:'2620',x:-135,z:120,width:70,depth:65,height:24,health:400,boardable:false},
  {id:'merc-latlon',kind:'comm-array',name:'Merc Latlon COMM Array · 通信基地',iff:'2620',x:-235,z:120,width:75,depth:65,height:30,health:400,boardable:false},
 ]},
 waypoints:[{id:1,x:-80,z:210,radius:4}],
 objectives:[{id:'citadel-defense',type:'defend',targetIds:['citadel'],attackerIds:raiders,requiredKills:pickupKills,label:{ja:'ターンのいる中央要塞を守り、Merc飛行部隊を撃退',en:'Protect Thane in the central fortress and repel Merc aircraft'}},{id:'pickup-thane',type:'board-player',personId:'thane',label:{ja:'要塞から出たターンを自分の機体に搭乗させる',en:'Pick up Thane in your vehicle after she leaves the fortress'}}],
 briefingPresentation:{entries:[
  {label:{ja:'ターン：中央の巨大要塞内で作業中',en:'Thane: working inside the central fortress'},detail:{ja:'ターンは要塞内にいる。一定数のAIPを倒すと要塞から出て、主人公の機体へ搭乗しようとする。必要撃破数は試作では4機。塔には同乗席がないので、無人のAssault HAWCかCruiserを確保して迎える。',en:'Thane is inside the fortress. After enough AIPs are destroyed, she leaves the fortress and tries to board your vehicle. The prototype uses four kills. Take an empty Assault HAWC or Cruiser to pick her up.'}},
  {label:{ja:'キリー：右側のミーゾンタワーに搭乗',en:'Kylie: take the right Meson tower'},detail:{ja:'キリーは任務開始後、右側の塔へ自動的に向かって搭乗し、接近する敵機を迎撃する。',en:'Kylie automatically heads for the right tower, boards it and engages approaching aircraft.'}},
  {label:{ja:'敵飛行機の攻撃前に正面の塔へ搭乗',en:'Board your tower before the aircraft attack'},detail:{ja:'主人公は徒歩開始。正面の塔まで進んで搭乗し、Eで敵選択、Tで追尾、1でGAUS30を発射する。敵を倒すたびに選択と追尾をやり直す。',en:'Start on foot. Walk into the tower ahead. E: select, T: track, 1: GAUS30. Select and track again after each kill.'}},
 ]},
 terrain:{biome:'snow',weather:'overcast',ridgeStyle:'rocky',halfWidth:650,minZ:-500,maxZ:900,ridgeHeight:130,ridgeVariation:65,seed:26,
  peaks:[{x:-500,z:320,width:220,depth:400,height:190},{x:500,z:500,width:250,depth:500,height:210}]},
 rocks:[{x:-330,z:400,r:16},{x:320,z:550,r:14}],
 tuning:{Easy:{interval:2.6},Medium:{interval:1.9},Hard:{interval:1.35}},
};
