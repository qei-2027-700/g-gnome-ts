import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RadioMenu} from './communications.ts';
import {orderReplies} from './content/radio-dialogue.ts';
import {Simulation} from './simulation/simulation.ts';
import {MISSION_3_3} from './content/missions/mission-3-3.ts';
test('radio replies match accepted recipients once, through the real F1 command sequence',()=>{
 const s=new Simulation('Easy',MISSION_3_3),menu=new RadioMenu();menu.begin('all');s.selected='scorp-asv';s.units[2].alive=false;
 const input=menu.key('F1',s.mission.companions!)!;assert.equal(input.kind,'send');if(input.kind!=='send')return;s.sendAllyOrder(input.recipient,input.command);
 const events=s.events.filter(e=>e.type==='ally-order');assert.equal(events.length,1);const event=events[0],replies=orderReplies(s.mission.companions!,event.recipients!,event.command!);
 assert.deepEqual(replies.map(r=>r.name.ja),['キリー','シェリダン']);assert.equal(replies[0].line.ja,'了解した。攻撃に移る。');assert.equal(menu.key('F1',s.mission.companions!,true),undefined);
 const before=s.events.length;s.selected=null;assert.equal(s.sendAllyOrder('all','attack').error,'target');assert.equal(s.events.length,before);
 for(const command of ['follow','hold'] as const){const result=s.sendAllyOrder('kylie',command);assert.equal(orderReplies(s.mission.companions!,result.accepted,command).length,1);}
 assert.deepEqual(orderReplies(s.mission.companions!,[],'attack'),[]);
});

test('accepted F4 boarding replies preserve Kylie and Thane user-specified lines; rejected orders stay silent',()=>{
 const s=new Simulation('Easy',MISSION_3_3),menu=new RadioMenu();
 for(const unit of s.units.slice(1,4)){const person=s.forceEject(unit,'destruction')!;person.flight=null;unit.alive=false;}
 s.selected=null;menu.begin('all');const input=menu.key('F4',s.mission.companions!)!;assert.equal(input.kind,'send');if(input.kind!=='send')return;
 const result=s.sendAllyOrder(input.recipient,input.command);assert.equal(result.accepted.length,3);
 const event=s.events.find(e=>e.type==='ally-order')!,replies=orderReplies(s.mission.companions!,event.recipients!,event.command!);
 assert.equal(replies.find(r=>r.personId==='kylie')!.line.ja,'ラジャー！移動する');assert.equal(replies.find(r=>r.personId==='thane')!.line.ja,'載せてちょうだい！');
 s.mounted!.spec.passengerCapacity=0;s.events=[];const rejected=s.sendAllyOrder('all','board');assert.deepEqual(orderReplies(s.mission.companions!,rejected.accepted,'board'),[]);assert.equal(s.events.filter(e=>e.type==='ally-order').length,0);
});

test('first F1 selects all; first F2-F4 select mission roster members without issuing an order',()=>{
 const members=MISSION_3_3.companions!;
 for(const [code,recipient] of [['F1','all'],['F2','kylie'],['F3','thane'],['F4','sheridan']]){
  const menu=new RadioMenu();assert.deepEqual(menu.key(code,members),{kind:'select',recipient});assert.equal(menu.key(code,members,true),undefined);assert.deepEqual(menu.key('F5',members),{kind:'send',recipient,command:'follow'});
 }
 const replacement=members.map(m=>m.key==='F4'?{...m,personId:'wilkins',name:{ja:'ウィルキンス',en:'Wilkins'}}:m),menu=new RadioMenu();assert.deepEqual(menu.key('F4',replacement),{kind:'select',recipient:'wilkins'});
});
test('target-directed F5 has a target-directed voice reply without dialogue subtitles',()=>{
 const replies=orderReplies(MISSION_3_3.companions!,['thane'],'follow','parked');assert.equal(replies.length,1);assert.equal(replies[0].line.ja,'了解。目標へ向かう。');assert.notEqual(replies[0].line.ja,orderReplies(MISSION_3_3.companions!,['thane'],'follow')[0].line.ja);
});

test('F3 and F4 select the real initial 3-3 companions and F5 is accepted, including after a failed command',()=>{
 for(const [key,id] of [['F3','thane'],['F4','sheridan']] as const){const sim=new Simulation('Easy',MISSION_3_3),menu=new RadioMenu();sim.selected=null;
  const selected=menu.key(key,sim.mission.companions!);assert.deepEqual(selected,{kind:'select',recipient:id});const send=menu.key('F5',sim.mission.companions!)!;assert.equal(send.kind,'send');if(send.kind!=='send')throw Error('Expected command');assert.deepEqual(sim.sendAllyOrder(send.recipient,send.command).accepted,[id]);assert.equal(sim.units.find(u=>u.personId===id)!.order?.kind,'follow');
 }
 const menu=new RadioMenu(),members=MISSION_3_3.companions!;menu.key('F2',members);assert.deepEqual(menu.key('F3',members),{kind:'select',recipient:'thane'});assert.deepEqual(menu.key('F5',members),{kind:'send',recipient:'thane',command:'follow'});assert.deepEqual(menu.key('F4',members),{kind:'send',recipient:'thane',command:'board'});menu.begin();assert.deepEqual(menu.key('F4',members),{kind:'select',recipient:'sheridan'});
});
test('radio reaches named mission companions despite IFF, range or terrain, including dismounted followers',()=>{
 for(const scenario of ['iff','range','blocked','foot'] as const){const sim=new Simulation('Easy',MISSION_3_3),u=sim.units.find(u=>u.personId==='thane')!;sim.selected=null;
  if(scenario==='iff')sim.iff='0000';if(scenario==='range')u.z=500;if(scenario==='blocked')sim.mission.rocks=[{x:u.x/2,z:u.z/2,r:4}];if(scenario==='foot')sim.forceEject(u,'destruction');
  assert.deepEqual(sim.sendAllyOrder('thane','follow').accepted,['thane']);if(scenario==='foot')assert.equal(sim.radioMembers.find(m=>m.personId==='thane')!.soldier!.order?.kind,'follow');
 }
});

test('2-4 includes Kylie and F2 sends accepted commands without range, terrain or IFF restrictions',async()=>{
 const {MISSION_2_4}=await import('./content/missions/mission-2-4.ts');const sim=new Simulation('Easy',MISSION_2_4),menu=new RadioMenu(),kylie=sim.units.find(u=>u.personId==='kylie')!;kylie.x=0;kylie.z=1000;sim.changeIff('0000');sim.mission.terrain.cliffs=[{id:'wall',x:0,z:500,width:100,depth:40,height:60}];assert.equal(sim.radioMembers[0].available,true);assert.equal(sim.radioMembers[0].key,'F2');assert.equal(menu.key('F2',sim.mission.companions!)?.kind,'select');const action=menu.key('F5',sim.mission.companions!)!;if(action.kind!=='send')throw Error('Expected order');assert.deepEqual(sim.sendAllyOrder(action.recipient,action.command).accepted,['kylie']);assert.equal(kylie.order?.kind,'follow');
});
