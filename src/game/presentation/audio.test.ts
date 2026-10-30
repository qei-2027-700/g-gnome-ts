import {RADIO_REPLY_LINES,RADIO_DEFAULT_REPLY,RADIO_TARGET_FOLLOW_REPLY,KYLIE_TOWER_WARNING,SHERIDAN_SCORP_ASV_BOARDED,SHERIDAN_INFANTRY_WARNING} from '../content/radio-dialogue.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GameAudio} from './audio.ts';
import {defaults} from '../settings.ts';
test('drive audio is quiet, changes with speed, mutes on exit/pause and reuses its nodes',()=>{
 const ramps:number[]=[],frequencies:number[]=[];let oscillators=0;
 const param=()=>({value:0,setValueAtTime(v:number){this.value=v;},cancelScheduledValues(){},linearRampToValueAtTime(v:number){this.value=v;ramps.push(v);},setTargetAtTime(v:number){this.value=v;frequencies.push(v);}});
 const ctx={currentTime:0,destination:{},createGain:()=>({gain:param(),connect(){}}),createOscillator:()=>{oscillators++;return {frequency:param(),type:'',connect(){},start(){}};},createBiquadFilter:()=>({frequency:param(),Q:param(),type:'',connect(){}})};
 const settings=defaults(),audio=new GameAudio(settings);audio.ctx=ctx as unknown as AudioContext;
 audio.updateDrive(null,0,0);assert.equal(oscillators,0);
 audio.updateDrive('union-sentry',0,0);const idle=ramps.at(-1)!;assert.ok(idle>.005&&idle<.012);
 audio.updateDrive('union-sentry',1,1);assert.ok(ramps.at(-1)!>idle);assert.ok(ramps.at(-1)!<=.018);assert.ok(frequencies.includes(159));
 audio.updateDrive('union-sentry',1,1,true);assert.equal(ramps.at(-1),0);
 audio.updateDrive('union-sentry',.5,.5);settings.sfx=0;audio.updateDrive('union-sentry',.5,.5);assert.equal(ramps.at(-1),0);
 settings.sfx=.5;audio.updateDrive('union-sentry',1,1);audio.updateDrive(null,0,0);assert.equal(ramps.at(-1),0);assert.equal(oscillators,2);audio.updateDrive('merc-sentry',0,0);assert.ok(frequencies.includes(110));audio.updateDrive('merc-tactical',0,0);assert.ok(frequencies.includes(62));assert.equal(oscillators,2);
});

test('Ready speaks one complete Japanese word in the same female voice and respects mute',()=>{
 const spoken:SpeechSynthesisUtterance[]=[];let cancelled=0;
 const female={name:'Kyoko',lang:'ja-JP'},male={name:'Male',lang:'ja-JP'};
 const synth={getVoices:()=>[male,female],cancel(){cancelled++;},speak(u:SpeechSynthesisUtterance){spoken.push(u);}};
 const keys=['window','speechSynthesis','SpeechSynthesisUtterance'] as const;
 const previous=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 class Utterance {constructor(public text:string){} lang='';pitch=1;rate=1;volume=1;voice:unknown=null;}
 try{
  Object.defineProperty(globalThis,'window',{configurable:true,value:{speechSynthesis:synth}});
  Object.defineProperty(globalThis,'speechSynthesis',{configurable:true,value:synth});
  Object.defineProperty(globalThis,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
  const settings=defaults(),audio=new GameAudio(settings);audio.sayReady();
  assert.equal(cancelled,1);assert.deepEqual(spoken.map(u=>u.text),['レディー。']);
  assert.equal(spoken[0].voice,female);assert.equal(spoken[0].lang,'ja-JP');
  assert.ok(spoken[0].pitch<1);assert.equal(spoken[0].volume,settings.voice);
  audio.pause();assert.equal(cancelled,2);
  settings.voice=0;audio.sayReady();assert.equal(spoken.length,1);assert.equal(cancelled,2);
 }finally{
  for(const key of keys){const descriptor=previous.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}
 }
});

async function radioAudioFixture(check:(fixture:{audio:GameAudio;settings:ReturnType<typeof defaults>;sources:any[];gains:number[];spoken:SpeechSynthesisUtterance[];urls:string[];ctx:any})=>Promise<void>){
 const sources:any[]=[],gains:number[]=[],spoken:SpeechSynthesisUtterance[]=[],urls:string[]=[];
 const synth={getVoices:()=>[],cancel(){},speak(u:SpeechSynthesisUtterance){spoken.push(u);}};
 const keys=['window','speechSynthesis','SpeechSynthesisUtterance','fetch'] as const,previous=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 class Utterance{constructor(public text:string){}lang='';pitch=1;rate=1;volume=1;voice:unknown=null;}
 const ctx={currentTime:10,state:'running',sampleRate:22050,createBuffer:(_channels:number,length:number,sampleRate:number)=>({duration:length/sampleRate,copyToChannel(samples:Float32Array){assert.equal(Math.abs(samples[0]),0);assert.equal(Math.abs(samples.at(-1)!),0);assert.ok(samples.some(v=>Math.abs(v)>.2));}}),destination:{},decodeAudioData:async()=>({duration:2}),createGain:()=>({gain:{set value(v:number){gains.push(v);}},connect(){},disconnect(){}}),createBufferSource:()=>{const source={buffer:null as any,onended:null as (()=>void)|null,startTime:0,stopped:false,connect(){},disconnect(){},start(time:number){this.startTime=time;},stop(){this.stopped=true;}};sources.push(source);return source;}};
 try{Object.defineProperty(globalThis,'window',{configurable:true,value:{speechSynthesis:synth}});Object.defineProperty(globalThis,'speechSynthesis',{configurable:true,value:synth});Object.defineProperty(globalThis,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});Object.defineProperty(globalThis,'fetch',{configurable:true,value:async(url:string)=>{urls.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};}});
 const settings=defaults(),audio=new GameAudio(settings);audio.ctx=ctx as unknown as AudioContext;await check({audio,settings,sources,gains,spoken,urls,ctx});
 }finally{for(const key of keys){const descriptor=previous.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}
}
test('radio transmissions bracket overlapping voices with one opening and one closing static sound',async()=>{
 await radioAudioFixture(async({audio,settings,sources,gains,spoken,urls,ctx})=>{
  const replies=['kylie','thane','sheridan'].map(personId=>({personId,line:RADIO_DEFAULT_REPLY}));const pending=audio.sayRadio(replies);audio.sayReady();await pending;
  assert.equal(sources.length,4,JSON.stringify({sfx:settings.sfx,sources:sources.map(s=>s.buffer?.duration),gains}));const [opening,...voices]=sources;assert.ok(opening.buffer.duration<1);assert.equal(spoken.length,0);
  assert.ok(voices[0].startTime>=opening.startTime+opening.buffer.duration-1e-4);assert.ok(Math.abs(voices[1].startTime-voices[0].startTime-.18)<1e-8);assert.ok(voices[2].startTime<voices[0].startTime+voices[0].buffer.duration);assert.ok(gains.slice(1).every(g=>g===settings.voice/Math.sqrt(3)));
  opening.onended();voices[0].onended();audio.sayReady();assert.equal(spoken.length,0);voices[1].onended();ctx.currentTime=voices[2].startTime+voices[2].buffer.duration;voices[2].onended();
  const closing=sources.at(-1);assert.equal(sources.length,5);assert.ok(closing.buffer.duration<1);assert.ok(closing.startTime>=ctx.currentTime);audio.sayReady();assert.equal(spoken.length,0);closing.onended();audio.sayReady();assert.equal(spoken.at(-1)!.text,'レディー。');
  const second=sources.length;await audio.sayRadio(replies);assert.equal(urls.length,3,'decoded clips are cached');audio.pause();assert.ok(sources.slice(second).every(s=>s.stopped));
  const muted=sources.length;settings.voice=0;await audio.sayRadio(replies);assert.equal(sources.length,muted+2,'SE still brackets a voice-muted transmission');assert.ok(sources.slice(muted).every(s=>s.buffer.duration<1));
  settings.voice=1;settings.locale='en';const english=sources.length;await audio.sayRadio(replies);assert.ok(urls.slice(3).every(url=>url.includes('-en-')));await audio.sayRadio([{personId:'kylie',line:KYLIE_TOWER_WARNING}]);assert.ok(sources.slice(english,english+4).every(s=>s.stopped));
 });
});
test('radio static respects SE mute while preserving the voice, and TTS callouts get both static sounds',async()=>{
 await radioAudioFixture(async({audio,settings,sources,spoken,ctx})=>{
  settings.sfx=0;await audio.sayRadio([{personId:'kylie',line:RADIO_DEFAULT_REPLY}]);assert.equal(sources.length,1);assert.equal(sources[0].buffer.duration,2);sources[0].onended();assert.equal(sources.length,1);
  settings.sfx=.7;const before=sources.length;await audio.sayRadio([{line:{ja:'全員','en':'All units'}}],'solemn');assert.equal(sources.length,before+1);assert.equal(spoken.length,0);
  await new Promise(resolve=>setTimeout(resolve,350));assert.equal(spoken.length,1);assert.equal(spoken[0].text,'全員');ctx.currentTime+=1;spoken[0].onend?.({} as SpeechSynthesisEvent);assert.equal(sources.length,before+2);
  audio.pause();assert.ok(sources.slice(before).every(s=>s.stopped));
 });
});
test('pause cancels radio voices still loading and no stale clip starts afterward',async()=>{
 await radioAudioFixture(async({audio,ctx,sources})=>{let finish:((buffer:any)=>void)|undefined;ctx.decodeAudioData=()=>new Promise(resolve=>finish=resolve);const loading=audio.sayRadio([{personId:'kylie',line:RADIO_DEFAULT_REPLY}]);for(let i=0;i<8&&!finish;i++)await Promise.resolve();assert.ok(finish);audio.pause();finish!({duration:2});await loading;assert.equal(sources.length,0);});
});

test('missile launch plays the roar asset once per shot, caches decoding and respects mute/pause',async()=>{
 let fetches=0,decodes=0,starts=0;const gains:number[]=[];
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'fetch');
 const ctx={state:'running',destination:{},decodeAudioData:async()=>{decodes++;return {duration:1.2};},createGain:()=>({gain:{value:0},connect(){},disconnect(){}}),createBufferSource:()=>({buffer:null,onended:null,connect(gain:{gain:{value:number}}){gains.push(gain.gain.value);},disconnect(){},start(){starts++;}})};
 try{
  Object.defineProperty(globalThis,'fetch',{configurable:true,value:async()=>{fetches++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};}});
  const settings=defaults(),audio=new GameAudio(settings);audio.ctx=ctx as unknown as AudioContext;
  await audio.sound('missile');await audio.sound('missile');assert.equal(starts,2);assert.equal(fetches,1);assert.equal(decodes,1);assert.deepEqual(gains,[settings.sfx*.45,settings.sfx*.45]);
  settings.sfx=0;await audio.sound('missile');assert.equal(starts,2);
  settings.sfx=.5;ctx.state='suspended';await audio.sound('missile');assert.equal(starts,2);
 }finally{if(descriptor)Object.defineProperty(globalThis,'fetch',descriptor);else Reflect.deleteProperty(globalThis,'fetch');}
});

test('individual radio keys speak their current mission character names once, including the F4 replacement',async()=>{
 const {RadioMenu,radioCallout}=await import('../communications.ts'),{MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 const spoken:SpeechSynthesisUtterance[]=[];const synth={getVoices:()=>[],cancel(){},speak(u:SpeechSynthesisUtterance){spoken.push(u);}};
 const keys=['window','speechSynthesis','SpeechSynthesisUtterance'] as const,previous=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 class Utterance{constructor(public text:string){}lang='';pitch=1;rate=1;volume=1;voice:unknown=null;}
 try{Object.defineProperty(globalThis,'window',{configurable:true,value:{speechSynthesis:synth}});Object.defineProperty(globalThis,'speechSynthesis',{configurable:true,value:synth});Object.defineProperty(globalThis,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
  const settings=defaults(),audio=new GameAudio(settings),menu=new RadioMenu();let members=MISSION_3_3.companions!;
  const select=(code:string,repeat=false)=>{const result=menu.key(code,members,repeat);if(result?.kind==='select'){const line=radioCallout(members,result.recipient);if(line)audio.say(line.ja,line.en,'solemn',true);}};
  for(const key of ['F2','F3','F4']){menu.close();select(key);select(key,true);}
  members=members.map(m=>m.key==='F4'?{...m,personId:'wilkins',name:{ja:'ウィルキンス',en:'Wilkins'}}:m);menu.close();select('F4');menu.close();select('F1');assert.deepEqual(spoken.map(u=>u.text),['キリー','ターン','シェリダン','ウィルキンス','通信']);assert.ok(spoken.every(u=>u.lang==='ja-JP'));
  settings.voice=0;menu.close();select('F2');assert.equal(spoken.length,5);
 }finally{for(const key of keys){const descriptor=previous.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}
});

test('vehicle collision sound uses a short low sine thump and respects sound-effect mute',()=>{
 const settings=defaults(),audio=new GameAudio(settings),starts:number[]=[],frequencies:number[]=[],waves:string[]=[];
 const param={setValueAtTime(v:number){frequencies.push(v);},exponentialRampToValueAtTime(){}};
 audio.ctx={currentTime:0,destination:{},createOscillator:()=>({set type(v:string){waves.push(v);},frequency:param,connect(){},start(){starts.push(1);},stop(){}}),createGain:()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}})} as unknown as AudioContext;
 audio.sound('collision');assert.deepEqual(waves,['sine']);assert.equal(frequencies[0],70);assert.equal(starts.length,1);settings.sfx=0;audio.sound('collision');assert.equal(starts.length,1);
});

test('Kylie and Sheridan use distinct dedicated male voices for replies and mission dialogue in both locales',()=>{
 const spoken:SpeechSynthesisUtterance[]=[];const voices=[{name:'Kyoko',lang:'ja-JP'},{name:'Eddy (日本語)',lang:'ja-JP'},{name:'Reed (日本語)',lang:'ja-JP'},{name:'Samantha',lang:'en-US'},{name:'Alex',lang:'en-US'},{name:'David',lang:'en-US'}];
 const synth={getVoices:()=>voices,cancel(){},speak(u:SpeechSynthesisUtterance){spoken.push(u);}};
 const keys=['window','speechSynthesis','SpeechSynthesisUtterance'] as const,previous=new Map(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 class Utterance{constructor(public text:string){}lang='';pitch=1;rate=1;volume=1;voice:unknown=null;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;}
 try{Object.defineProperty(globalThis,'window',{configurable:true,value:{speechSynthesis:synth}});Object.defineProperty(globalThis,'speechSynthesis',{configurable:true,value:synth});Object.defineProperty(globalThis,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
  const settings=defaults(),audio=new GameAudio(settings),line={ja:'了解。',en:'Copy.'};
  for(const locale of ['ja','en'] as const){settings.locale=locale;for(const personId of ['kylie','sheridan','thane'])audio.sayRadio([{personId,line}]);const [kylie,sheridan,thane]=spoken.slice(-3);assert.equal(kylie.voice,voices[locale==='ja'?1:4]);assert.equal(sheridan.voice,voices[locale==='ja'?2:5]);assert.notEqual(kylie.pitch,sheridan.pitch);assert.notEqual(kylie.rate,sheridan.rate);assert.equal(thane.voice,voices[locale==='ja'?0:3]);}
  settings.locale='ja';audio.sayRadio([{personId:'kylie',line:{ja:'タワーはパワーアップしてやがるぜ',en:'Those towers have been powered up.'}}]);assert.equal(spoken.at(-1)!.voice,voices[1]);
  voices.splice(2,1);for(const personId of ['kylie','sheridan'])audio.sayRadio([{personId,line}]);const [a,b]=spoken.slice(-2);assert.equal(a.voice,b.voice);assert.notEqual(a.pitch,b.pitch);assert.notEqual(a.rate,b.rate);
  const count=spoken.length;settings.voice=0;audio.sayRadio([{personId:'kylie',line},{personId:'sheridan',line}]);assert.equal(spoken.length,count);
 }finally{for(const key of keys){const descriptor=previous.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}
});

test('external wind follows view, SE volume, pause and audio suspension without recreating its sources',()=>{
 const gains:{gain:{value:number;targets:number[];cancelScheduledValues():void;setTargetAtTime(value:number):void};connect():void}[]=[];
 let sources=0,oscillators=0,loops=0;
 const param=()=>({value:0,targets:[] as number[],cancelScheduledValues(){},setTargetAtTime(value:number){this.targets.push(value);}});
 const ctx={state:'running',currentTime:0,sampleRate:16000,destination:{},
  createBuffer:(_channels:number,length:number)=>({getChannelData:()=>new Float32Array(length)}),
  createGain:()=>{const gain={gain:param(),connect(){}};gains.push(gain);return gain;},
  createBiquadFilter:()=>({type:'',frequency:param(),Q:param(),connect(){}}),
  createBufferSource:()=>{sources++;return {buffer:null,loop:false,connect(){},start(){if(this.loop)loops++;}};},
  createOscillator:()=>{oscillators++;return {type:'',frequency:param(),connect(){},start(){}};},
 };
 const settings=defaults(),audio=new GameAudio(settings);audio.ctx=ctx as unknown as AudioContext;
 audio.updateWind(false);audio.updateWind(true,true);settings.sfx=0;audio.updateWind(true);assert.equal(sources,0);
 settings.sfx=.8;audio.updateWind(true);const master=gains[1].gain;assert.ok(master.targets.at(-1)!>0);assert.equal(loops,1);assert.equal(oscillators,2);
 const count=master.targets.length;for(let i=0;i<60;i++)audio.updateWind(true);assert.equal(master.targets.length,count);
 audio.updateWind(false);assert.equal(master.targets.at(-1),0);
 audio.updateWind(true);const loud=master.targets.at(-1)!;settings.sfx=.4;audio.updateWind(true);assert.equal(master.targets.at(-1),loud/2);
 settings.sfx=0;audio.updateWind(true);assert.equal(master.targets.at(-1),0);
 settings.sfx=.8;audio.updateWind(true);audio.updateWind(true,true);assert.equal(master.targets.at(-1),0);
 ctx.state='suspended';audio.updateWind(true);assert.equal(master.targets.at(-1),0);
 ctx.state='running';audio.updateWind(true);assert.ok(master.targets.at(-1)!>0);assert.equal(sources,1);assert.equal(oscillators,2);
 const previous=Object.getOwnPropertyDescriptor(globalThis,'window');
 try{Object.defineProperty(globalThis,'window',{configurable:true,value:{}});audio.pause();assert.equal(master.targets.at(-1),0);audio.updateWind(true);assert.ok(master.targets.at(-1)!>0);assert.equal(sources,1);}
 finally{if(previous)Object.defineProperty(globalThis,'window',previous);else Reflect.deleteProperty(globalThis,'window');}
});

test('all current radio replies have nonempty bundled clips, and dedicated character voices are preserved',async()=>{
 const {RADIO_VOICE_CLIPS,radioVoiceKey}=await import('../content/radio-voice-assets.ts');const {readFile}=await import('node:fs/promises');
 for(const person of ['kylie','thane','sheridan','wilkins'])for(const locale of ['ja','en'] as const){const lines=[...Object.values(RADIO_REPLY_LINES[person]??{}),RADIO_DEFAULT_REPLY,RADIO_TARGET_FOLLOW_REPLY,...(person==='kylie'?[KYLIE_TOWER_WARNING]:[])];
  for(const line of lines){const clip=RADIO_VOICE_CLIPS[radioVoiceKey(locale,person,line[locale])];assert.ok(clip,`${person}: ${line[locale]}`);const bytes=await readFile(new URL(clip.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.ok(bytes.length>2000);let offset=12,data=0;while(offset+8<=bytes.length){const length=bytes.readUInt32LE(offset+4);if(bytes.toString('ascii',offset,offset+4)==='data'){data=length;break;}offset+=8+length+length%2;}assert.ok(data>2000);assert.ok([...bytes.subarray(offset+8)].some(value=>value!==0));
   if(person==='kylie'||person==='sheridan')assert.ok(clip.voice.includes(locale==='ja'?'jm_':'am_'));
  }
 }
 const k=RADIO_VOICE_CLIPS[radioVoiceKey('ja','kylie',RADIO_DEFAULT_REPLY.ja)],s=RADIO_VOICE_CLIPS[radioVoiceKey('ja','sheridan',RADIO_DEFAULT_REPLY.ja)];assert.notEqual(k.pitch,s.pitch);assert.notEqual(k.rate,s.rate);
});

test('infantry death voices are distinct nonverbal faction sounds and stop on pause',async()=>{
 const {deathCrySamples,INFANTRY_DEATH_VOICES}=await import('./death-voice.ts');
 const signatures=new Set<string>();for(const faction of ['union','merc','darken','scorp'] as const){const samples=deathCrySamples(faction,22050);assert.equal(samples.length,Math.ceil(INFANTRY_DEATH_VOICES[faction].duration*22050));assert.ok(samples.some(v=>Math.abs(v)>.2));assert.ok(samples.every(Number.isFinite));signatures.add(Array.from(samples.slice(400,410)).join(','));}assert.equal(signatures.size,4);
 const sources:any[]=[];const ctx={state:'running',sampleRate:22050,destination:{},createBuffer:()=>({copyToChannel(){}}),createGain:()=>({gain:{value:0},connect(){},disconnect(){}}),createBufferSource:()=>{const source={buffer:null,connect(){},disconnect(){},start(){},stopped:false,stop(){this.stopped=true;}};sources.push(source);return source;}};
 const settings=defaults(),audio=new GameAudio(settings);audio.ctx=ctx as unknown as AudioContext;audio.infantryDeath('union');audio.infantryDeath('scorp');assert.equal(sources.length,2);const previous=Object.getOwnPropertyDescriptor(globalThis,'window');try{Object.defineProperty(globalThis,'window',{configurable:true,value:{}});audio.pause();assert.ok(sources.every(s=>s.stopped));settings.voice=0;audio.infantryDeath('merc');assert.equal(sources.length,2);}finally{if(previous)Object.defineProperty(globalThis,'window',previous);else Reflect.deleteProperty(globalThis,'window');}
});

test('opening F1 without a recipient plays squelch immediately, independently of voice volume, and pause stops it',async()=>{
 await radioAudioFixture(async({audio,settings,sources,spoken})=>{
  settings.voice=0;await audio.radioSquelch();assert.equal(sources.length,1);assert.equal(spoken.length,0);assert.ok(sources[0].buffer.duration<1);assert.ok(sources[0].startTime<10.05);
  audio.pause();assert.equal(sources[0].stopped,true);settings.sfx=0;await audio.radioSquelch();assert.equal(sources.length,1);
 });
});

test('occupied contact uses female voice two and finishes before a queued result announcement; explicit pause cancels both',()=>{
 const spoken:any[]=[],synth={getVoices:()=>[{name:'Kyoko',lang:'ja-JP'}],cancel(){},speak(u:unknown){spoken.push(u);}};
 const keys=['window','speechSynthesis','SpeechSynthesisUtterance'] as const,previous=new Map(keys.map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 class Utterance{constructor(public text:string){}lang='';pitch=1;rate=1;volume=1;voice:unknown=null;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;}
 try{Object.defineProperty(globalThis,'window',{configurable:true,value:{speechSynthesis:synth}});Object.defineProperty(globalThis,'speechSynthesis',{configurable:true,value:synth});Object.defineProperty(globalThis,'SpeechSynthesisUtterance',{configurable:true,value:Utterance});
  const settings=defaults(),audio=new GameAudio(settings);audio.sayOccupied();assert.equal(spoken[0].text,'占拠されています');assert.equal(spoken[0].pitch,.82);assert.equal(spoken[0].rate,.88);assert.equal(spoken[0].voice.name,'Kyoko');audio.pause(true);audio.announceResult(false);assert.equal(spoken.length,1);spoken[0].onend();assert.equal(spoken.at(-1).text,'任務失敗');
  audio.sayOccupied();const cancelled=spoken.at(-1);audio.announceResult(false);audio.pause();const n=spoken.length;cancelled.onend();assert.equal(spoken.length,n);settings.voice=0;audio.sayOccupied();assert.equal(spoken.length,n);
  settings.voice=1;settings.locale='en';audio.sayOccupied();assert.equal(spoken.at(-1).text,'Occupied.');
 }finally{for(const key of keys){const descriptor=previous.get(key);if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}
});

test('minefield discovery uses female voice two for the Japanese warning, supports English and respects mute',async()=>{
 await radioAudioFixture(async({audio,settings,spoken})=>{
  audio.sayMinefieldFound();assert.equal(spoken.at(-1)!.text,'地雷原を発見');assert.equal(spoken.at(-1)!.pitch,.82);assert.equal(spoken.at(-1)!.rate,.88);
  settings.locale='en';audio.sayMinefieldFound();assert.equal(spoken.at(-1)!.text,'Minefield detected.');const count=spoken.length;settings.voice=0;audio.sayMinefieldFound();assert.equal(spoken.length,count);
 });
});

async function musicFixture(check:(audio:GameAudio,tracks:any[])=>Promise<void>,availableNext=true){
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');const previous=Object.getOwnPropertyDescriptor(globalThis,'Audio'),tracks:any[]=[];
 class Music{src:string;loop=false;volume=1;paused=true;currentTime=0;plays=0;fail=false;defer:(()=>Promise<void>)|null=null;constructor(src:string){this.src=src;tracks.push(this);}pause(){this.paused=true;}play(){this.plays++;this.paused=false;return this.defer?this.defer():this.fail?Promise.reject(new Error('Playback blocked')):Promise.resolve();}}
 try{Object.defineProperty(globalThis,'Audio',{configurable:true,value:Music});const audio=new GameAudio(defaults(),{'bgm-mission-1-1-start':'mission-1-1-start.mp3','bgm-mission-1-1-sentry-combat':availableNext?'sentry-combat.mp3':null,'bgm-mission-3-3':'start.mp3','bgm-fighting-on-the-tundra':'tundra.mp3','bgm-snow-maze':'snow-maze.mp3','bgm-credits':'credits.mp3','bgm-union-march':availableNext?'union-march.mp3':null});audio.beginMissionMusic(MISSION_3_3);await check(audio,tracks);}
 finally{if(previous)Object.defineProperty(globalThis,'Audio',previous);else Reflect.deleteProperty(globalThis,'Audio');}
}
test('3-3 music starts once at three simulation seconds, loops, preserves position across pause and follows music volume',async()=>{
 const {Simulation}=await import('../simulation/simulation.ts'),{MISSION_3_3}=await import('../content/missions/mission-3-3.ts'),{advanceSimulation}=await import('../session.ts');
 await musicFixture(async(audio,tracks)=>{
  const s=new Simulation('Easy',MISSION_3_3);s.time=2.99;audio.updateMissionMusic(s.time,false);assert.equal(tracks.length,0);advanceSimulation(s,'settings',.05,{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false});audio.updateMissionMusic(s.time,true);assert.equal(tracks.length,0);
  audio.updateMissionMusic(3,false);await Promise.resolve();assert.equal(tracks.length,1);assert.equal(tracks[0].src,'start.mp3');assert.equal(tracks[0].loop,true);assert.equal(tracks[0].volume,audio.settings.music);audio.updateMissionMusic(4,false);assert.equal(tracks[0].plays,1);
  tracks[0].currentTime=12.5;audio.updateMissionMusic(4,true);assert.equal(tracks[0].paused,true);audio.resume();await Promise.resolve();assert.equal(tracks[0].currentTime,12.5);assert.equal(tracks[0].plays,2);
  audio.settings.music=0;audio.updateMissionMusic(5,false);assert.equal(tracks[0].volume,0);audio.settings.music=.7;audio.updateMissionMusic(6,false);assert.equal(tracks[0].volume,.7);
 });
});
test('boarding the designated enemy ASV switches to Union March once and supersedes a pending start cue',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 await musicFixture(async(audio,tracks)=>{
  audio.updateMissionMusic(3,false);await Promise.resolve();audio.missionMusicBoarded('other');audio.updateMissionMusic(4,false);assert.equal(tracks.length,1);
  audio.missionMusicBoarded('scorp-asv');audio.updateMissionMusic(4,false);await Promise.resolve();assert.equal(tracks.length,2);assert.equal(tracks[0].paused,true);assert.equal(tracks[1].src,'union-march.mp3');assert.equal(tracks[1].loop,true);
  tracks[1].currentTime=8;audio.missionMusicBoarded('scorp-asv');audio.updateMissionMusic(10,false);assert.equal(tracks.length,2);assert.equal(tracks[1].currentTime,8);
  audio.beginMissionMusic(MISSION_3_3);audio.missionMusicBoarded('scorp-asv');audio.updateMissionMusic(1,false);await Promise.resolve();assert.equal(tracks.at(-1).src,'union-march.mp3');const count=tracks.length;audio.updateMissionMusic(3,false);assert.equal(tracks.length,count);
 });
});
test('retry restarts the three-second delay and leaving the mission removes its automatic BGM',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts'),{MISSION}=await import('../content/mission-1-1.ts');
 await musicFixture(async(audio,tracks)=>{
  audio.updateMissionMusic(3,false);await Promise.resolve();tracks[0].currentTime=20;audio.beginMissionMusic(MISSION_3_3);assert.equal(tracks[0].paused,true);audio.updateMissionMusic(2.99,false);assert.equal(tracks.length,1);audio.updateMissionMusic(3,false);await Promise.resolve();assert.equal(tracks.length,2);assert.equal(tracks[1].currentTime,0);
  audio.beginMissionMusic({...MISSION,bgm:undefined});assert.equal(tracks[1].paused,true);assert.equal(audio.music,null);audio.updateMissionMusic(100,false);assert.equal(tracks.length,2);
  audio.beginMissionMusic(MISSION_3_3);audio.updateMissionMusic(3,false);audio.resetMissionMusic();assert.equal(audio.music,null);
 });
});
test('missing capture music keeps the current track and reports the missing cue only once',async()=>{
 await musicFixture(async(audio,tracks)=>{audio.updateMissionMusic(3,false);await Promise.resolve();audio.missionMusicBoarded('scorp-asv');audio.updateMissionMusic(4,false);assert.equal(tracks.length,1);assert.equal(tracks[0].paused,false);assert.equal(audio.musicError,'missing-next');audio.musicError=null;audio.updateMissionMusic(5,false);assert.equal(audio.musicError,null);},false);
});
test('late playback completion cannot resume paused mission music and failed playback does not retry every frame',async()=>{
 await musicFixture(async(audio,tracks)=>{
  audio.updateMissionMusic(3,true);assert.equal(tracks.length,0);audio.updateMissionMusic(3,false);await Promise.resolve();audio.updateMissionMusic(3,true);
  let finish!:()=>void;tracks[0].defer=()=>new Promise<void>(resolve=>{finish=resolve;});audio.resume();assert.equal(tracks[0].paused,false);audio.updateMissionMusic(3,true);finish();await Promise.resolve();assert.equal(tracks[0].paused,true);
  tracks[0].defer=null;tracks[0].fail=true;audio.resume();await Promise.resolve();await Promise.resolve();assert.equal(audio.musicError,'playback');const count=tracks[0].plays;audio.updateMissionMusic(4,false);assert.equal(tracks[0].plays,count);
 });
});
test('explicitly selecting a local music file overrides the automatic cue for the current run',async()=>{
 await musicFixture(async(audio,tracks)=>{
  await audio.loadMusic(new File(['audio'],'manual.mp3',{type:'audio/mpeg'}));audio.updateMissionMusic(100,false);assert.equal(tracks.length,1);assert.ok(tracks[0].src.startsWith('blob:'));assert.equal(tracks[0].loop,true);
 });
});


test('1-1 start music waits for launch, starts immediately once, resumes and resets on retry',async()=>{
 const {MISSION}=await import('../content/mission-1-1.ts');
 await musicFixture(async(audio,tracks)=>{
  audio.beginMissionMusic(MISSION);audio.updateMissionMusic(0,true);assert.equal(tracks.length,0);
  audio.updateMissionMusic(0,false);await Promise.resolve();assert.equal(tracks.length,1);assert.equal(tracks[0].src,'mission-1-1-start.mp3');assert.equal(tracks[0].plays,1);assert.equal(tracks[0].volume,audio.settings.music);
  tracks[0].currentTime=9;audio.updateMissionMusic(1,false);audio.missionMusicBoarded('union');audio.updateMissionMusic(2,false);assert.equal(tracks.length,1);assert.equal(tracks[0].currentTime,9);
  audio.updateMissionMusic(3,true);assert.equal(tracks[0].paused,true);audio.updateMissionMusic(3,false);await Promise.resolve();assert.equal(tracks[0].currentTime,9);assert.equal(tracks[0].plays,2);
  audio.beginMissionMusic(MISSION);assert.equal(tracks[0].paused,true);audio.updateMissionMusic(0,false);await Promise.resolve();assert.equal(tracks.length,2);assert.equal(tracks[1].currentTime,0);audio.resetMissionMusic();assert.equal(tracks[1].paused,true);assert.equal(audio.music,null);
 });
});

test('1-1 switches to combat music once when a Merc Sentry HAWC detects the player',async()=>{
 const {MISSION}=await import('../content/mission-1-1.ts');
 await musicFixture(async(audio,tracks)=>{
  audio.beginMissionMusic(MISSION);audio.updateMissionMusic(0,false);await Promise.resolve();assert.equal(tracks.at(-1).src,'mission-1-1-start.mp3');
  audio.missionMusicDetected('merc-tactical');audio.updateMissionMusic(1,false);assert.equal(tracks.length,1);
  audio.missionMusicDetected('merc-sentry');audio.updateMissionMusic(2,false);await Promise.resolve();assert.equal(tracks.length,2);assert.equal(tracks[0].paused,true);assert.equal(tracks[1].src,'sentry-combat.mp3');assert.equal(tracks[1].loop,true);
  tracks[1].currentTime=8;audio.missionMusicDetected('merc-sentry');audio.updateMissionMusic(3,false);assert.equal(tracks.length,2);assert.equal(tracks[1].currentTime,8);
 });
});

test('only a Merc Sentry HAWC sighting of the player, rather than damage retaliation, starts the 1-1 detection cue',async()=>{
 const {Simulation}=await import('../simulation/simulation.ts'),{makeUnit}=await import('../simulation/simulation.ts'),{MISSION}=await import('../content/mission-1-1.ts');
 const s=new Simulation('Easy',MISSION),sentry=makeUnit('sentry','merc-sentry',0,60,true);s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.terrain.ridgeHeight=0;s.units=[sentry];s.human={x:0,z:0};sentry.cooldown=999;
 s.damage(sentry,1,'hull',undefined,s.mounted,'FLECH');assert.equal(s.events.some(e=>e.type==='enemy-detected'),false);
 s.events=[];sentry.alert=false;sentry.aggressorId=null;sentry.lastHit=-100;sentry.pilot=true;s.tick(.02,{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false});
 assert.equal(s.events.filter(e=>e.type==='enemy-detected'&&e.unit===sentry).length,1);
 s.events=[];s.tick(.02,{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false});assert.equal(s.events.filter(e=>e.type==='enemy-detected'&&e.unit===sentry).length,0);
});

test('mission success has no spoken announcement while mission failure keeps its system voice',async()=>{
 await radioAudioFixture(async({audio,settings,spoken})=>{
  audio.announceResult(true);assert.equal(spoken.length,0);audio.announceResult(false);assert.equal(spoken.at(-1)!.text,'任務失敗');settings.locale='en';const count=spoken.length;audio.announceResult(true);assert.equal(spoken.length,count);audio.announceResult(false);assert.equal(spoken.at(-1)!.text,'Mission failed');
 });
});


test('GAUS fires a delayed low layered hum with a long tail, respects mute and cancels pending layers on pause',()=>{
 const nodes:any[]=[],gains:any[]=[],filters:any[]=[];
 const param=()=>({events:[] as number[][],value:0,setValueAtTime(v:number,t:number){this.events.push([v,t]);},linearRampToValueAtTime(v:number,t:number){this.events.push([v,t]);},exponentialRampToValueAtTime(v:number,t:number){this.events.push([v,t]);}});
 const ctx={currentTime:10,destination:{},createGain(){const g={gain:param(),connect(){},disconnect(){}};gains.push(g);return g;},createBiquadFilter(){const f={type:'',Q:param(),frequency:param(),disconnected:false,connect(){},disconnect(){this.disconnected=true;}};filters.push(f);return f;},createOscillator(){const o={type:'',frequency:param(),connect(){},disconnect(){},startTime:0,start(t:number){this.startTime=t;},stopTime:0,stop(t:number){this.stopTime=t;},onended:null as (()=>void)|null};nodes.push(o);return o;}};
 const settings=defaults(),audio=new GameAudio(settings);audio.ctx=ctx as unknown as AudioContext;
 for(const weapon of ['GAUS30','GAUS20']){
  const start=nodes.length;audio.sound('shot',true,weapon);const layers=nodes.slice(start);
  assert.equal(layers.length,3);assert.ok(layers.some(n=>n.type==='sine'&&n.frequency.events[0][0]<=120));assert.ok(layers.some(n=>n.type==='sawtooth'));
  for(const layer of layers){assert.equal(layer.startTime,10.15);assert.ok(layer.frequency.events[0][0]<300);assert.ok(layer.frequency.events[1][0]<layer.frequency.events[0][0]);assert.equal(layer.stopTime,10.15+.82);}
  assert.ok(gains.slice(start).every(g=>g.gain.events[0][0]===0&&g.gain.events[1][1]>10.15));assert.equal(filters.at(-1).type,'lowpass');
 }
 audio.sound('impact',false,'GAUS30');assert.equal(nodes.at(-1).stopTime,10.09);
 const count=nodes.length;settings.sfx=0;audio.sound('shot',true,'GAUS30');assert.equal(nodes.length,count);
 const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 try{Object.defineProperty(globalThis,'window',{configurable:true,value:{}});audio.pause();}finally{if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else Reflect.deleteProperty(globalThis,'window');}
 assert.ok(nodes.slice(0,6).every(n=>n.stopTime===undefined));assert.equal(nodes[6].stopTime,10.09);
 nodes[0].onended();nodes[1].onended();assert.equal(filters[0].disconnected,false);nodes[2].onended();assert.equal(filters[0].disconnected,true);
});

test('Merc interior hum loops without piling up, follows SE volume, and stops on exit, pause and other factions',()=>{
 const sources:any[]=[],buffers:Float32Array[]=[],gains:any[]=[];
 const param=()=>({value:0,setValueAtTime(v:number){this.value=v;},cancelScheduledValues(){},linearRampToValueAtTime(v:number){this.value=v;},setTargetAtTime(v:number){this.value=v;}});
 const ctx={currentTime:3,sampleRate:8000,destination:{},createBuffer(_c:number,n:number){return {duration:n/8000,copyToChannel(samples:Float32Array){buffers.push(samples);}};},createGain(){const g={gain:param(),connect(){},disconnect(){}};gains.push(g);return g;},createBufferSource(){const source={loop:false,buffer:null,stopped:false,connect(){},disconnect(){},start(){},stop(){this.stopped=true;}};sources.push(source);return source;}};
 const settings=defaults(),audio=new GameAudio(settings);audio.ctx=ctx as unknown as AudioContext;
 audio.updateBuildingInterior(null);audio.updateBuildingInterior('scorp');assert.equal(sources.length,0);
 audio.updateBuildingInterior('merc');assert.equal(sources.length,1);assert.equal(sources[0].loop,true);assert.equal(buffers.length,1);assert.equal(buffers[0][0],0);assert.ok(Math.abs(buffers[0].at(-1)!)<.0001);assert.ok(buffers[0].some(v=>Math.abs(v)>.5));const outputRms=Math.sqrt(buffers[0].reduce((sum,v)=>sum+(v*gains[0].gain.value)**2,0)/buffers[0].length);assert.ok(outputRms>.025&&outputRms<.08,'default SE level should carry a clearly present interior rumble');
 audio.updateBuildingInterior('merc');assert.equal(sources.length,1);settings.sfx=.2;audio.updateBuildingInterior('merc');assert.equal(gains[0].gain.value,.2*.32);
 audio.updateBuildingInterior(null);assert.equal(sources[0].stopped,true);assert.equal(gains[0].gain.value,0);
 audio.updateBuildingInterior('merc');assert.equal(buffers.length,1);
 const previousWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
 try{Object.defineProperty(globalThis,'window',{configurable:true,value:{}});audio.pause();}finally{if(previousWindow)Object.defineProperty(globalThis,'window',previousWindow);else Reflect.deleteProperty(globalThis,'window');}
 assert.equal(sources[1].stopped,true);
 audio.updateBuildingInterior('merc');audio.updateBuildingInterior('merc',true);assert.equal(sources[2].stopped,true);
 audio.updateBuildingInterior('merc');settings.sfx=0;audio.updateBuildingInterior('merc');assert.equal(sources[3].stopped,true);audio.updateBuildingInterior('merc');assert.equal(sources.length,4);
});

test('door impact plays immediately with muted voices, obeys SFX mute and releases audio nodes',()=>{
 const settings=defaults(),audio=new GameAudio(settings);settings.voice=0;
 audio.doorClosed();
 const starts:number[]=[],stops:number[]=[],levels:number[]=[],ended:(()=>void)[]=[];let disconnected=0;
 const ctx={currentTime:10,destination:{},createGain:()=>({gain:{setValueAtTime(v:number){levels.push(v);},exponentialRampToValueAtTime(){}},connect(){},disconnect(){disconnected++;}}),createOscillator:()=>({type:'',frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){disconnected++;},onended:null as null|(()=>void),start(t:number){starts.push(t);},stop(t:number){stops.push(t);ended.push(this.onended!);}})};
 audio.ctx=ctx as unknown as AudioContext;
 settings.sfx=0;audio.doorClosed();assert.equal(starts.length,0);
 settings.sfx=.5;audio.doorClosed();assert.ok(starts.length>0);assert.ok(starts.every(t=>t===10));assert.ok(stops.every(t=>t>10&&t<10.25));assert.ok(levels.every(v=>v>0));
 const firstLevels=[...levels];ended.forEach(finish=>finish());assert.equal(disconnected,starts.length*2);
 settings.sfx=1;audio.doorClosed();assert.deepEqual(levels.slice(firstLevels.length),firstLevels.map(v=>v*2));
});

test('Merc interior ambience mixes filtered cold airflow and machinery with soft loop edges',async()=>{
 const {mercInteriorSamples}=await import('./merc-interior-audio.ts');
 const rate=8000,samples=mercInteriorSamples(rate);assert.equal(samples[0],0);assert.equal(Math.abs(samples.at(-1)!),0);
 assert.ok(samples.every(v=>Number.isFinite(v)&&Math.abs(v)<1));
 for(let offset=rate/2;offset<samples.length-rate/2;offset+=rate/2){
  let energy=0;for(let i=offset;i<offset+rate/2;i++)energy+=samples[i]**2;
  assert.ok(Math.sqrt(energy/(rate/2))>.05,'a quiet machinery bed remains between recurring notes');
 }
 let energy=0,changes=0;for(let i=1;i<samples.length;i++){energy+=samples[i]**2;changes+=(samples[i]-samples[i-1])**2;}
 assert.ok(changes/energy<.5,'filtered airflow should remain smoother than raw high-frequency noise');
});

test('mission radio queues complete lines instead of cutting another speaker off, and resets on a new mission',async()=>{
 await radioAudioFixture(async({audio,sources,ctx})=>{
  audio.queueMissionRadio({personId:'sheridan',line:RADIO_DEFAULT_REPLY});audio.queueMissionRadio({personId:'kylie',line:RADIO_DEFAULT_REPLY});
  await audio.updateMissionRadio(true);assert.equal(sources.length,0);await audio.updateMissionRadio();assert.equal(sources.length,2);await audio.updateMissionRadio();assert.equal(sources.length,2);
  sources[0].onended();ctx.currentTime+=3;sources[1].onended();assert.equal(sources.length,3);await audio.updateMissionRadio();assert.equal(sources.length,3,'wait through closing static');sources[2].onended();await audio.updateMissionRadio();assert.equal(sources.length,5);assert.equal(sources[1].stopped,false);
  audio.queueMissionRadio({personId:'sheridan',line:RADIO_DEFAULT_REPLY});audio.beginMissionMusic({id:'next'} as any);audio.pause();const count=sources.length;await audio.updateMissionRadio();assert.equal(sources.length,count);
 });
});


test('3-3 Sheridan boarding and infantry warnings have complete dedicated male voice clips in both languages',async()=>{
 const {readFile}=await import('node:fs/promises');const {RADIO_VOICE_CLIPS,radioVoiceKey}=await import('../content/radio-voice-assets.ts');
 for(const line of [SHERIDAN_SCORP_ASV_BOARDED,SHERIDAN_INFANTRY_WARNING])for(const locale of ['ja','en'] as const){
  const clip=RADIO_VOICE_CLIPS[radioVoiceKey(locale,'sheridan',line[locale])];assert.ok(clip);assert.equal(clip.voice,locale==='ja'?'Kokoro/jm_kumo':'Kokoro/am_fenrir');assert.equal(clip.pitch,.78);const bytes=await readFile(new URL(clip.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.readUInt32LE(4)+8,bytes.length);assert.ok(bytes.length>44100);
 }
 await radioAudioFixture(async({audio,sources,urls,spoken})=>{await audio.sayRadio([{personId:'sheridan',line:SHERIDAN_SCORP_ASV_BOARDED}]);assert.equal(sources.length,2);assert.equal(spoken.length,0);assert.ok(urls[0].includes('sheridan-ja-'));});
});

test('Merc interior repeats a fixed-pitch mechanical pulse every four seconds with quiet gaps',async()=>{
 const {mercInteriorDrone}=await import('./merc-interior-audio.ts');let energy=0;
 for(let i=0;i<1800;i++){const t=i/1000,value=mercInteriorDrone(t);energy+=value**2;assert.ok(Math.abs(value-mercInteriorDrone(t+4))<1e-10);}
 assert.ok(Math.sqrt(energy/1800)>.09);assert.equal(mercInteriorDrone(0),0);
 for(const t of [1.8,2,3,3.999])assert.ok(Math.abs(mercInteriorDrone(t))<1e-12);
 assert.ok(Math.abs(mercInteriorDrone(.001))<.00001);assert.ok(Math.abs(mercInteriorDrone(1.799))<.00001);
});

test('2-6 plays Tundra once at launch, loops, pauses, resumes and starts fresh on retry',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');
 await musicFixture(async(audio,tracks)=>{
  audio.beginMissionMusic(MISSION_2_6);audio.updateMissionMusic(0,true);assert.equal(tracks.length,0);
  audio.updateMissionMusic(0,false);await Promise.resolve();assert.equal(tracks.length,1);assert.equal(tracks[0].src,'tundra.mp3');assert.equal(tracks[0].loop,true);assert.equal(tracks[0].paused,false);assert.equal(tracks[0].volume,audio.settings.music*.8);
  audio.updateMissionMusic(1,false);assert.equal(tracks.length,1);assert.equal(tracks[0].plays,1);
  tracks[0].currentTime=12;audio.updateMissionMusic(1,true);assert.equal(tracks[0].paused,true);audio.resume();await Promise.resolve();assert.equal(tracks[0].currentTime,12);assert.equal(tracks[0].paused,false);assert.equal(tracks[0].volume,audio.settings.music*.8);audio.settings.music=.7;audio.updateMissionMusic(1.5,false);assert.equal(tracks[0].volume,.7*.8);
  audio.settings.music=0;audio.updateMissionMusic(2,false);assert.equal(tracks[0].volume,0);assert.equal(tracks.length,1);
  audio.beginMissionMusic(MISSION_2_6);assert.equal(tracks[0].paused,true);audio.updateMissionMusic(0,false);await Promise.resolve();assert.equal(tracks.length,2);assert.equal(tracks[1].currentTime,0);
  audio.resetMissionMusic();assert.equal(tracks[1].paused,true);assert.equal(audio.music,null);
 });
});

test('4-2 starts the original credits cue on launch through the common mission music player',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');await musicFixture(async(audio,tracks)=>{
  audio.beginMissionMusic(MISSION_4_2);audio.updateMissionMusic(0,false);await Promise.resolve();assert.equal(tracks.length,1);assert.equal(tracks[0].src,'credits.mp3');assert.equal(tracks[0].loop,true);assert.equal(tracks[0].volume,audio.settings.music*.8);assert.equal(tracks[0].paused,false);
  audio.updateMissionMusic(2,false);assert.equal(tracks.length,1);audio.resetMissionMusic();assert.equal(tracks[0].paused,true);
 });
});


test('elimination BGM waits for the last specified enemy, switches once, preserves pause and resets on retry',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const mission=structuredClone(MISSION_4_2);mission.bgm!.afterEliminate={unitIds:['enemy-a','enemy-b'],trackId:'bgm-union-march'};
 await musicFixture(async(audio,tracks)=>{
  const units=[{id:'enemy-a',alive:false},{id:'enemy-b',alive:true},{id:'friendly',alive:true}];audio.beginMissionMusic(mission);audio.updateMissionMusic(0,false,units);await Promise.resolve();assert.equal(tracks.length,1);assert.equal(tracks[0].src,'credits.mp3');
  units[1].alive=false;audio.updateMissionMusic(1,true,units);assert.equal(tracks.length,1);audio.updateMissionMusic(1,false,units.slice(0,1));assert.equal(tracks.length,1);
  audio.updateMissionMusic(1,false,units);await Promise.resolve();assert.equal(tracks.length,2);assert.equal(tracks[0].paused,true);assert.equal(tracks[1].src,'union-march.mp3');assert.equal(tracks[1].volume,audio.settings.music*.8);assert.equal(tracks[1].loop,true);
  tracks[1].currentTime=12;audio.updateMissionMusic(2,false,units);assert.equal(tracks.length,2);assert.equal(tracks[1].currentTime,12);audio.updateMissionMusic(2,true,units);assert.equal(tracks[1].paused,true);audio.updateMissionMusic(2,false,units);await Promise.resolve();assert.equal(tracks[1].currentTime,12);
  units[1].alive=true;audio.beginMissionMusic(mission);audio.updateMissionMusic(0,false,units);await Promise.resolve();assert.equal(tracks.at(-1).src,'credits.mp3');assert.equal(tracks.at(-1).currentTime,0);
 });
});

test('missing elimination BGM keeps the current cue playing and reports the missing asset once',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const mission=structuredClone(MISSION_4_2);mission.bgm!.afterEliminate={unitIds:['enemy'],trackId:'bgm-union-march'};
 await musicFixture(async(audio,tracks)=>{
  audio.beginMissionMusic(mission);audio.updateMissionMusic(0,false,[{id:'enemy',alive:true}]);await Promise.resolve();audio.updateMissionMusic(1,false,[{id:'enemy',alive:false}]);assert.equal(tracks.length,1);assert.equal(audio.musicError,'missing-next');audio.musicError=null;audio.updateMissionMusic(2,false,[{id:'enemy',alive:false}]);assert.equal(audio.musicError,null);assert.equal(tracks[0].paused,false);
 },false);
});


test('4-2 changes Credits to Snow Maze after the base assault is destroyed even while the bridge guard remains alive',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const {Simulation}=await import('../simulation/simulation.ts');const sim=new Simulation('Easy',MISSION_4_2),ids=MISSION_4_2.bgm!.afterEliminate!.unitIds;
 assert.equal(ids.length,10);assert.ok(sim.units.filter(u=>ids.includes(u.id)).every(u=>u.spec.faction==='union'));assert.ok(!ids.includes(MISSION_4_2.assignedUnitId));const bridgeGuard=sim.units.find(u=>u.id==='bridge-union-sentry')!;assert.ok(bridgeGuard?.alive);assert.ok(!ids.includes(bridgeGuard.id));
 await musicFixture(async(audio,tracks)=>{
  audio.beginMissionMusic(MISSION_4_2);audio.updateMissionMusic(0,false,sim.units);await Promise.resolve();assert.equal(tracks[0].src,'credits.mp3');
  for(const unit of sim.units)if(ids.includes(unit.id)&&unit.id!==ids.at(-1))unit.alive=false;
  audio.updateMissionMusic(1,false,sim.units);assert.equal(tracks.length,1);sim.units.find(u=>u.id===ids.at(-1))!.alive=false;
  audio.updateMissionMusic(2,false,sim.units);await Promise.resolve();assert.equal(tracks.length,2);assert.equal(tracks[1].src,'snow-maze.mp3');assert.equal(tracks[0].paused,true);assert.equal(tracks[1].paused,false);assert.equal(sim.status,'running');assert.ok(bridgeGuard.alive);assert.ok(sim.units.find(u=>u.id===MISSION_4_2.assignedUnitId)!.alive);
  tracks[1].currentTime=8;audio.updateMissionMusic(3,false,sim.units);assert.equal(tracks.length,2);assert.equal(tracks[1].currentTime,8);
 });
});

test('HAWC collapse has a finite bounded metal-and-debris tail with quiet edges',async()=>{
 const {hawcCollapseSamples,HAWC_COLLAPSE_DURATION}=await import('./hawc-collapse-audio.ts');const rate=8000,samples=hawcCollapseSamples(rate);assert.equal(samples.length,Math.ceil(rate*HAWC_COLLAPSE_DURATION));assert.equal(samples[0],0);assert.equal(samples.at(-1),0);assert.ok(samples.every(v=>Number.isFinite(v)&&Math.abs(v)<=.781));
 const rms=(start:number,end:number)=>Math.sqrt(samples.slice(start*rate,end*rate).reduce((sum,v)=>sum+v*v,0)/((end-start)*rate));assert.ok(rms(.1,.7)>.08);assert.ok(rms(1.6,2.3)>.03);assert.ok(rms(2.9,3.2)<rms(.1,.7));assert.deepEqual(hawcCollapseSamples(rate),samples);
});

test('HAWC destruction plays one cached collapse, respects SFX mute, bounds overlaps and preserves the result tail',async()=>{
 const {Simulation,makeUnit}=await import('../simulation/simulation.ts');const sources:any[]=[],gains:any[]=[];let buffers=0,fallbacks=0;
 const ctx={state:'running',sampleRate:8000,destination:{},createBuffer(_c:number,n:number,rate:number){buffers++;return {duration:n/rate,copyToChannel(){}};},createGain(){const g={gain:{value:0},connect(){},disconnect(){}};gains.push(g);return g;},createBufferSource(){const source={buffer:null,stopped:false,starts:0,connect(){},disconnect(){},start(){this.starts++;},stop(){this.stopped=true;},onended:null as (()=>void)|null};sources.push(source);return source;}};
 const settings=defaults(),audio=new GameAudio(settings);audio.ctx=ctx as unknown as AudioContext;audio.sound=()=>{fallbacks++;};const sim=new Simulation(),unit=makeUnit('collapse-test','merc-assault',0,100,false);sim.units=[unit];sim.events=[];sim.damage(unit,99999);sim.damage(unit,99999);for(const event of sim.events)if(event.type==='destroy'&&event.unit)audio.vehicleDestroyed(event.unit.kind);
 assert.equal(sources.length,1);assert.equal(sources[0].starts,1);assert.equal(sources[0].buffer.duration,3.25);assert.equal(gains[0].gain.value,settings.sfx*.6);assert.equal(buffers,1);assert.equal(fallbacks,0);
 audio.vehicleDestroyed('union-sentry');audio.vehicleDestroyed('merc-cruiser');assert.equal(buffers,1);assert.equal(sources.length,3);assert.equal(sources[0].stopped,true);assert.equal(sources[1].stopped,false);assert.equal(sources[2].stopped,false);
 audio.vehicleDestroyed('merc-aip');audio.vehicleDestroyed('scorp-rocket-tower');assert.equal(fallbacks,2);settings.sfx=0;audio.vehicleDestroyed('merc-tactical');assert.equal(sources.length,3);
 const previous=Object.getOwnPropertyDescriptor(globalThis,'window');try{Object.defineProperty(globalThis,'window',{configurable:true,value:{}});audio.pause(false,true);assert.equal(sources[2].stopped,false);audio.pause();assert.ok(sources.every(s=>s.stopped));}finally{if(previous)Object.defineProperty(globalThis,'window',previous);else Reflect.deleteProperty(globalThis,'window');}
});

test('4-2 switches BGM after the last ejected enemy pilot is shot even though the empty chassis and bridge guard survive',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const {Simulation}=await import('../simulation/simulation.ts');const mission=structuredClone(MISSION_4_2);mission.rocks=[];const sim=new Simulation('Easy',mission),ids=mission.bgm!.afterEliminate!.unitIds,last=sim.units.find(u=>u.id===ids.at(-1))!;
 for(const unit of sim.units)if(ids.includes(unit.id)&&unit!==last)sim.damage(unit,99999);sim.soldiers=[];last.x=-300;last.z=-150;const pilot=sim.forceEject(last)!;assert.ok(pilot.alive);pilot.flight=null;pilot.x=-300;pilot.z=-170;sim.human={x:-300,z:-200};sim.humanYaw=0;sim.pitch=sim.targetElevation(pilot);
 await musicFixture(async(audio,tracks)=>{
  audio.beginMissionMusic(mission);audio.updateMissionMusic(sim.time,false,sim.missionMusicUnits);await Promise.resolve();assert.equal(tracks[0].src,'credits.mp3');assert.equal(sim.missionMusicUnits.find(u=>u.id===last.id)!.defeated,false);
  for(let i=0;i<6&&pilot.alive;i++){sim.footCooldown.PRIF44=0;sim.fire(1);}assert.equal(pilot.alive,false);assert.equal(last.alive,true);assert.equal(last.pilot,false);assert.ok(sim.units.find(u=>u.id==='bridge-union-sentry')!.alive);
  audio.updateMissionMusic(sim.time,false,sim.missionMusicUnits);await Promise.resolve();assert.equal(tracks.length,2);assert.equal(tracks[1].src,'snow-maze.mp3');assert.equal(tracks[1].paused,false);assert.equal(sim.status,'running');
 });
});
