import type {Localized,Companion} from './missions/types.ts';
import type {AllyCommand} from '../simulation/ally-orders.ts';
// Japanese boarding replies are user-specified. Other lines and English translations are provisional.
export const RADIO_REPLY_LINES:Record<string,Partial<Record<AllyCommand,Localized>>>={
 kylie:{board:{ja:'ラジャー！移動する',en:'Roger! Moving out.'},attack:{ja:'了解した。攻撃に移る。',en:'Understood. Moving to attack.'},follow:{ja:'先導しろ。以上。',en:'Understood. Following you.'},hold:{ja:'了解した。ここで待機する。',en:'Understood. Holding here.'}},
 thane:{board:{ja:'載せてちょうだい！',en:'Give me a ride!'},attack:{ja:'目標攻撃中！',en:'Understood. Engaging the target.'},follow:{ja:'了解。君についていこう。',en:'Understood. I will follow you.'},hold:{ja:'了解。この位置で待機する。',en:'Understood. Holding this position.'}},
 sheridan:{attack:{ja:'了解。攻撃を開始する。',en:'Copy. Starting the attack.'},follow:{ja:'了解。後ろについていく。',en:'Copy. Following behind you.'},hold:{ja:'了解。ここで止まる。',en:'Copy. Stopping here.'}},
 // F4 is board, F5 is follow. Japanese wording is user-specified. English is provisional.
 wilkins:{board:{ja:'今から向かう！',en:'Heading there now!'},follow:{ja:'後方に回る。オーバー！',en:'Moving to the rear. Over!'}},
};
export type RadioReply={personId:string;name:Localized;line:Localized};
export const RADIO_DEFAULT_REPLY={ja:'了解。',en:'Understood.'} as const;
export const RADIO_TARGET_FOLLOW_REPLY={ja:'了解。目標へ向かう。',en:'Understood. Moving to the selected target.'} as const;
export function orderReplies(members:readonly Companion[],accepted:readonly string[],command:AllyCommand,targetId?:string):RadioReply[]{return members.filter(member=>accepted.includes(member.unitId??member.facilityId??member.personId)).map(member=>{
 const own=RADIO_REPLY_LINES[member.personId]?.[command];
 // Wilkins keeps his F5 line when a target is selected. Other members still use the shared target-follow line.
 const line=member.personId==='wilkins'&&own?own:command==='follow'&&targetId?RADIO_TARGET_FOLLOW_REPLY:own??RADIO_DEFAULT_REPLY;
 return {personId:member.personId,name:member.name,line};
});}

export const KYLIE_TOWER_WARNING={ja:'タワーはパワーアップしてやがるぜ',en:'Those towers have been powered up.'} as const;

export const SHERIDAN_SCORP_ASV_BOARDED={ja:'よーしガンツ。お前がよーく見えるぞー。先導してくれ',en:'All right, Gant. I can see you clearly. Lead the way.'} as const;
export const SHERIDAN_INFANTRY_WARNING={ja:'歩兵を見張れガンツ',en:'Watch for infantry, Gant.'} as const;
