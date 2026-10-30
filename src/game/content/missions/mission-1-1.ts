import type {MissionDefinition} from './types.ts';
const FIRST_WAYPOINT={id:1,x:0,z:215,radius:30};
export const MISSION:MissionDefinition = {
 bgm:{start:{trackId:'bgm-mission-1-1-start',delay:0},afterDetection:{unitKind:'merc-sentry',trackId:'bgm-mission-1-1-sentry-combat'}},
 id:'1-1',title:'Renegade Mercs',initialIff:'2620',playerFaction:'union',factionCodes:{union:'2620',merc:'6707'},
 subtitle:{ja:'離反したメルク部隊',en:'Darken border operation'},
 briefing:{ja:'ガンツ、ダーケン国境へ向かえ。近くのUnion Sentryに搭乗し、ウェイポイント1を目指せ。進路上のMerc襲撃部隊を排除する。',en:'Gantz, head for the Darken border. Board the nearby Union Sentry, reach waypoint one, and eliminate the Merc raiding party.'},
 startHint:{ja:'Union Sentryへ近づいて搭乗してください。',en:'Approach the Union Sentry to board.'},
 success:{ja:'ウェイポイント1に到達。Merc襲撃部隊を排除しました。',en:'Waypoint one reached. Merc raiding party eliminated.'},
 radio:{ja:'1-1の通信内容は未照合です。僚機への命令はこの任務では利用できません。',en:'Mission 1-1 radio dialogue is unverified. No wingman commands are available in this mission.'},
 player:{x:0,z:0},waypoints:[FIRST_WAYPOINT],assignedUnitId:'union',
 units:[{id:'union',kind:'union-sentry',x:0,z:18,pilot:false},{id:'merc-0',kind:'merc-sentry',x:-24,z:185,pilot:true},{id:'merc-1',kind:'merc-tactical',x:22,z:315,pilot:true}],
 objectives:[{id:'reach-1',type:'reach',waypointId:1,label:{ja:'ウェイポイント1へ移動',en:'Reach waypoint one'}},{id:'eliminate',type:'eliminate',unitIds:['merc-0','merc-1'],label:{ja:'Merc襲撃部隊を撃破',en:'Destroy the Merc raiding party'}}],
 terrain:{halfWidth:145,minZ:-70,maxZ:550,ridgeHeight:38,ridgeVariation:32,seed:0},
 tuning:{Easy:{interval:2.6},Medium:{interval:1.9},Hard:{interval:1.35}},
 rocks:[{x:-40,z:75,r:8},{x:48,z:135,r:9},{x:-68,z:258,r:11},{x:62,z:370,r:14}],
};
