import {hawcCollapseSamples} from './hawc-collapse-audio.ts';
import {isHawc} from '../simulation/movement.ts';
import {BGM_ASSETS} from '../content/music.ts';
import type {MissionDefinition} from '../content/missions/types.ts';
import {RADIO_STATIC_DURATION,radioStaticSamples} from './radio-static.ts';
import {deathCrySamples} from './death-voice.ts';
import {mercInteriorSamples} from './merc-interior-audio.ts';
import {ExternalWind} from './wind-audio.ts';
import {RADIO_VOICE_CLIPS,radioVoiceKey} from '../content/radio-voice-assets.ts';
import type {Settings} from '../settings.ts';
import type {Faction,VehicleKind} from '../content/vehicles.ts';
const MISSILE_LAUNCH_URL=new URL('../../../assets/audio/sfx/missile-launch.wav',import.meta.url).href;
export const DRIVE_PROFILES={
  'union-sentry':{idle:82,rev:65,harmonic:2.1,filter:360,volume:.035,wave:'sine'},
   'union-tactical':{idle:72,rev:52,harmonic:2.5,filter:320,volume:.035,wave:'triangle'},
 'merc-sentry':{idle:110,rev:90,harmonic:2,filter:450,volume:.032,wave:'sine'},
  'union-asv':{idle:70,rev:50,harmonic:2.4,filter:320,volume:.035,wave:'triangle'},
  'scorp-asv':{idle:64,rev:45,harmonic:2.6,filter:300,volume:.035,wave:'triangle'},
  'scorp-sentry':{idle:78,rev:60,harmonic:2,filter:320,volume:.035,wave:'sine'},
  'scorp-tactical':{idle:64,rev:50,harmonic:2.5,filter:300,volume:.035,wave:'triangle'},
     'merc-cruiser':{idle:56,rev:35,harmonic:2.5,filter:280,volume:.035,wave:'triangle'},
 'union-aip':{idle:110,rev:70,harmonic:2,filter:400,volume:.035,wave:'sine'},
 'merc-aip':{idle:110,rev:70,harmonic:2,filter:400,volume:.035,wave:'sine'},
 'merc-meson-tower':{idle:0,rev:0,harmonic:1,filter:300,volume:0,wave:'sine'},
 'scorp-meson-tower':{idle:0,rev:0,harmonic:1,filter:300,volume:0,wave:'sine'},
 'scorp-rocket-tower':{idle:0,rev:0,harmonic:1,filter:300,volume:0,wave:'sine'},
  'merc-assault':{idle:58,rev:40,harmonic:2.8,filter:280,volume:.035,wave:'triangle'},
  'merc-tactical':{idle:62,rev:45,harmonic:2.8,filter:300,volume:.035,wave:'triangle'},
} as const;
// Dedicated character voices; system announcements retain their existing profiles.
export const CHARACTER_VOICE_PROFILES={
 kylie:{pitch:.94,rate:1.04,preferred:/Otoya|Eddy|Alex|Tom/i},
 sheridan:{pitch:.78,rate:.88,preferred:/Reed|Takumi|Daniel|David/i},
} as const;
const maleVoiceName=/Otoya|Ichiro|Keita|Takumi|Naoki|Daichi|Eddy|Reed|Rocko|Grandpa|Alex|Daniel|David|Fred|George|James|Thomas|Aaron|Arthur|Gordon|Ralph|Albert|\bTom\b|\bMark\b|\bmale\b|男性/i;
export const RADIO_RESPONSE_STAGGER_SECONDS=.18;
export class GameAudio {
  private occupiedUtterance:SpeechSynthesisUtterance|null=null;
  private afterOccupied:(()=>void)|null=null;
  sayMinefieldFound(){this.say('地雷原を発見','Minefield detected.','solemn',true);}
  sayOccupied(){
    if(!('speechSynthesis'in window)||!this.settings.voice)return;
    this.stopRadio();speechSynthesis.cancel();this.afterOccupied=null;this.lastSpeech=performance.now();
    const utterance=this.utterance(this.settings.locale==='ja'?'占拠されています':'Occupied.','solemn');this.occupiedUtterance=utterance;
    const finish=()=>{if(this.occupiedUtterance!==utterance)return;this.occupiedUtterance=null;const next=this.afterOccupied;this.afterOccupied=null;next?.();};
    utterance.onend=finish;utterance.onerror=finish;speechSynthesis.speak(utterance);
  }
  announceResult(won:boolean){
    if(won)return;
    const speak=()=>this.say('任務失敗','Mission failed','young',true);
    if(this.occupiedUtterance)this.afterOccupied=speak;else speak();
  }
  private deathSources=new Set<AudioBufferSourceNode>();
  private collapseSources=new Set<AudioBufferSourceNode>();
  private collapseBuffer:AudioBuffer|null=null;
  vehicleDestroyed(kind:VehicleKind){
    if(!isHawc(kind)){this.sound('destroy');return;}
    const ctx=this.ctx;if(!ctx||ctx.state!=='running'||this.settings.sfx<=0)return;
    if(!this.collapseBuffer){const samples=hawcCollapseSamples(ctx.sampleRate);this.collapseBuffer=ctx.createBuffer(1,samples.length,ctx.sampleRate);this.collapseBuffer.copyToChannel(samples,0);}
    // Bound overlapping collapses, including several HAWCs on a lifting bridge.
    if(this.collapseSources.size>=2){const oldest=this.collapseSources.values().next().value!;oldest.stop();this.collapseSources.delete(oldest);}
    const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=this.collapseBuffer;gain.gain.value=this.settings.sfx*.6;source.connect(gain);gain.connect(ctx.destination);
    this.collapseSources.add(source);source.onended=()=>{this.collapseSources.delete(source);source.disconnect();gain.disconnect();};source.start();
  }

  infantryDeath(faction:Faction){
    const ctx=this.ctx;if(!ctx||ctx.state!=='running'||this.settings.voice<=0)return;
    const samples=deathCrySamples(faction,ctx.sampleRate),buffer=ctx.createBuffer(1,samples.length,ctx.sampleRate);buffer.copyToChannel(samples,0);
    const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=this.settings.voice*.6;source.connect(gain);gain.connect(ctx.destination);
    this.deathSources.add(source);source.onended=()=>{this.deathSources.delete(source);source.disconnect();gain.disconnect();};source.start();
  }
  private wind=new ExternalWind();
  updateWind(external:boolean,paused=false){this.wind.update(this.ctx,external,this.settings.sfx,paused);}
  private radioStaticBuffer:AudioBuffer|null=null;private radioSpeechTimer:ReturnType<typeof setTimeout>|undefined;
  private missionRadioQueue:{personId?:string;line:{ja:string;en:string}}[]=[];
  queueMissionRadio(reply:{personId?:string;line:{ja:string;en:string}}){this.missionRadioQueue.push(reply);}
  async updateMissionRadio(paused=false){if(paused||this.radioPending>0||this.occupiedUtterance||!this.missionRadioQueue.length)return;await this.sayRadio([this.missionRadioQueue.shift()!]);}
  private radioPending=0;private radioGeneration=0;
  private radioSources=new Map<AudioBufferSourceNode,GainNode>();private radioBuffers=new Map<string,Promise<AudioBuffer|null>>();
  ctx:AudioContext|null=null; music:HTMLAudioElement|null=null;url:string|null=null;lastSpeech=0;
  private drive:{gain:GainNode;osc:OscillatorNode;harmonic:OscillatorNode;filter:BiquadFilterNode;volume:number;pitch:number;kind:VehicleKind|null}|null=null;
  private buildingHum:{source:AudioBufferSourceNode;gain:GainNode}|null=null;
  private buildingHumBuffer:AudioBuffer|null=null;
  private gausShots=new Set<OscillatorNode>();
  private missileBuffer:AudioBuffer|null=null;private missileLoading:Promise<AudioBuffer|null>|null=null;
  private missionMusic:{cues:NonNullable<MissionDefinition['bgm']>;boarded:boolean;detected:boolean;eliminated:boolean;track:string|null;missingReported:boolean}|null=null;
  private musicOwner:'manual'|'mission'|null=null;
  private musicPaused=true;private musicPending=false;private musicFailed=false;private musicGeneration=0;
  musicError:string|null=null;
  constructor(public settings:Settings,private readonly bgmAssets:Readonly<Record<string,string|null>>=BGM_ASSETS){}
  private stopMusic(){
    this.musicGeneration++;this.music?.pause();this.music=null;this.musicOwner=null;this.musicPending=false;this.musicFailed=false;
    if(this.url){URL.revokeObjectURL(this.url);this.url=null;}
  }
  beginMissionMusic(mission:MissionDefinition){
    this.missionRadioQueue=[];
    if(mission.bgm||this.musicOwner==='mission')this.stopMusic();
    this.missionMusic=mission.bgm?{cues:mission.bgm,boarded:false,detected:false,eliminated:false,track:null,missingReported:false}:null;this.musicError=null;
  }
  resetMissionMusic(){this.missionRadioQueue=[];if(this.musicOwner==='mission')this.stopMusic();this.missionMusic=null;this.musicError=null;}
  missionMusicBoarded(unitId:string){if(this.missionMusic?.cues.afterBoard?.unitId===unitId)this.missionMusic.boarded=true;}
  missionMusicDetected(unitKind:VehicleKind){if(this.missionMusic?.cues.afterDetection?.unitKind===unitKind)this.missionMusic.detected=true;}
  private pauseMusic(){
    this.musicPaused=true;if(this.musicPending){this.musicGeneration++;this.musicPending=false;}this.music?.pause();
  }
  private playCurrentMusic(){
    const music=this.music;if(!music||this.musicPaused||this.musicPending||this.musicFailed||!music.paused)return;
    const generation=this.musicGeneration;this.musicPending=true;
    void music.play().then(()=>{if(generation!==this.musicGeneration)return;this.musicPending=false;if(this.musicPaused)music.pause();}).catch(()=>{
      if(generation!==this.musicGeneration)return;this.musicPending=false;if(this.musicPaused)return;
      this.musicFailed=true;this.musicError='playback';
    });
  }
  private get musicVolume(){return this.settings.music*(this.musicOwner==='mission'?(this.missionMusic?.cues.volumeScale??1):1);}
  updateMissionMusic(time:number,paused:boolean,units?:readonly {id:string;alive:boolean;defeated?:boolean}[]){
    this.musicPaused=paused;if(this.music)this.music.volume=this.musicVolume;
    if(paused){this.pauseMusic();return;}
    const state=this.missionMusic;
    if(state){
      const elimination=state.cues.afterEliminate;
      if(!state.eliminated&&units&&elimination?.unitIds.length&&elimination.unitIds.every(id=>units.some(unit=>unit.id===id&&(!unit.alive||unit.defeated===true))))state.eliminated=true;
      const next=state.eliminated?elimination:state.detected?state.cues.afterDetection:state.boarded?state.cues.afterBoard:undefined,availableNext=next&&this.bgmAssets[next.trackId];
      if(next&&!availableNext&&!state.missingReported){state.missingReported=true;this.musicError='missing-next';}
      const track=availableNext?next!.trackId:time>=state.cues.start.delay?state.cues.start.trackId:null;
      if(track&&track!==state.track){
        const url=this.bgmAssets[track];state.track=track;
        if(url){this.stopMusic();this.music=new Audio(url);this.music.loop=true;this.musicOwner='mission';this.music.volume=this.musicVolume;}
        else this.musicError='missing-start';
      }
    }
    this.playCurrentMusic();
  }

  updateDrive(kind:VehicleKind|null,speedRatio:number,throttle:number,paused=false){
    const ctx=this.ctx;if(!ctx)return;
    const active=kind!==null&&!paused,profile=DRIVE_PROFILES[kind??'union-sentry'];
    if(!this.drive){
      if(!active)return;
      const gain=ctx.createGain(),osc=ctx.createOscillator(),harmonic=ctx.createOscillator(),filter=ctx.createBiquadFilter();
      gain.gain.setValueAtTime(0,ctx.currentTime);osc.type='sine';harmonic.type='triangle';filter.type='lowpass';filter.Q.value=.4;
      osc.connect(filter);harmonic.connect(filter);filter.connect(gain);gain.connect(ctx.destination);osc.start();harmonic.start();
      this.drive={gain,osc,harmonic,filter,volume:0,pitch:0,kind:null};
    }
    const drive=this.drive,speed=Math.max(0,Math.min(1,speedRatio)),load=Math.max(0,Math.min(1,throttle));
    const volume=active?this.settings.sfx*profile.volume*(.55+.35*speed+.1*load):0;
    if(Math.abs(volume-drive.volume)>.00001){drive.gain.gain.cancelScheduledValues(ctx.currentTime);drive.gain.gain.setValueAtTime(drive.gain.gain.value,ctx.currentTime);drive.gain.gain.linearRampToValueAtTime(volume,ctx.currentTime+.1);drive.volume=volume;}
    const pitch=profile.idle+speed*profile.rev+load*12;
    if(kind!==drive.kind||Math.abs(pitch-drive.pitch)>.25){drive.osc.type=profile.wave;drive.osc.frequency.setTargetAtTime(pitch,ctx.currentTime,.15);drive.harmonic.frequency.setTargetAtTime(pitch*profile.harmonic,ctx.currentTime,.15);drive.filter.frequency.setTargetAtTime(profile.filter+speed*170,ctx.currentTime,.15);drive.pitch=pitch;drive.kind=kind;}
  }
  updateBuildingInterior(faction:Faction|null,paused=false){
    const ctx=this.ctx,active=faction==='merc'&&!paused&&this.settings.sfx>0;
    if(!ctx)return;
    if(!active){
      if(this.buildingHum){const {source,gain}=this.buildingHum;gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setValueAtTime(gain.gain.value,ctx.currentTime);gain.gain.linearRampToValueAtTime(0,ctx.currentTime+.08);source.stop(ctx.currentTime+.08);this.buildingHum=null;}
      return;
    }
    if(!this.buildingHum){
      if(!this.buildingHumBuffer){
        const samples=mercInteriorSamples(ctx.sampleRate);
        this.buildingHumBuffer=ctx.createBuffer(1,samples.length,ctx.sampleRate);this.buildingHumBuffer.copyToChannel(samples,0);
      }
      const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=this.buildingHumBuffer;source.loop=true;gain.gain.setValueAtTime(0,ctx.currentTime);source.connect(gain);gain.connect(ctx.destination);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();this.buildingHum={source,gain};
    }
    this.buildingHum.gain.gain.setTargetAtTime(this.settings.sfx*.32,ctx.currentTime,.08);
  }
  private playGausSweep(){
    const ctx=this.ctx!,t=ctx.currentTime+.15,filter=ctx.createBiquadFilter();
    filter.type='lowpass';filter.Q.value=.6;filter.frequency.setValueAtTime(1000,t);filter.frequency.exponentialRampToValueAtTime(350,t+.8);filter.connect(ctx.destination);
    const layers=[{wave:'triangle',start:240,end:100,volume:.022},{wave:'sawtooth',start:244,end:102,volume:.01},{wave:'sine',start:120,end:50,volume:.018}] as const;
    let remaining=layers.length;
    for(const layer of layers){
      const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=layer.wave;osc.frequency.setValueAtTime(layer.start,t);osc.frequency.exponentialRampToValueAtTime(layer.end,t+.8);
      gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(this.settings.sfx*layer.volume,t+.045);gain.gain.exponentialRampToValueAtTime(this.settings.sfx*layer.volume*.6,t+.3);gain.gain.exponentialRampToValueAtTime(.00001,t+.8);
      osc.connect(gain);gain.connect(filter);this.gausShots.add(osc);osc.onended=()=>{this.gausShots.delete(osc);osc.disconnect();gain.disconnect();if(--remaining===0)filter.disconnect();};osc.start(t);osc.stop(t+.82);
    }
  }

  unlock(){this.ctx??=new AudioContext();void this.ctx.resume();void this.loadMissileSound();}
  doorClosed(){
    const ctx=this.ctx;if(!ctx||this.settings.sfx===0)return;
    // Short body thud and metallic contact, both finished before the menu returns.
    for(const [frequency,endFrequency,volume,duration] of [[110,35,.22,.22],[920,260,.07,.09]]){
      const oscillator=ctx.createOscillator(),gain=ctx.createGain(),time=ctx.currentTime;
      oscillator.type='triangle';oscillator.frequency.setValueAtTime(frequency,time);oscillator.frequency.exponentialRampToValueAtTime(endFrequency,time+duration);
      gain.gain.setValueAtTime(this.settings.sfx*volume,time);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
      oscillator.connect(gain);gain.connect(ctx.destination);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};oscillator.start(time);oscillator.stop(time+duration);
    }
  }
  sound(kind:'shot'|'hit'|'destroy'|'board'|'missile'|'impact'|'gas'|'collision',laser=false,weapon?:string){if(!this.ctx||this.settings.sfx===0)return;if(kind==='missile')return this.playMissileLaunch();if(kind==='shot'&&(weapon==='GAUS30'||weapon==='GAUS20'))return this.playGausSweep();const gaus=(weapon==='GAUS30'||weapon==='GAUS20')&&(kind==='shot'||kind==='impact'),ctx=this.ctx,o=ctx.createOscillator(),g=ctx.createGain();o.type=gaus?'sine':kind==='collision'||kind==='shot'&&laser?'sine':'sawtooth';const t=ctx.currentTime,duration=gaus?.09:kind==='collision'?.18:kind==='gas'?.3:kind==='impact'?.25:kind==='destroy'?.65:kind==='board'?.2:.12;o.frequency.setValueAtTime(gaus?420:kind==='collision'?70:kind==='impact'?65:kind==='shot'?(laser?1100:160):kind==='hit'?90:60,t);o.frequency.exponentialRampToValueAtTime(25,t+duration);g.gain.setValueAtTime(this.settings.sfx*(gaus?.008:.1),t);g.gain.exponentialRampToValueAtTime(gaus?.00001:.001,t+duration);o.connect(g);g.connect(ctx.destination);o.start();o.stop(t+duration);}
  private loadMissileSound():Promise<AudioBuffer|null>{
    const ctx=this.ctx;if(!ctx)return Promise.resolve(null);
    if(this.missileBuffer)return Promise.resolve(this.missileBuffer);
    if(!this.missileLoading)this.missileLoading=fetch(MISSILE_LAUNCH_URL).then(response=>{if(!response.ok)throw new Error('Missile sound unavailable');return response.arrayBuffer();}).then(bytes=>ctx.decodeAudioData(bytes)).then(buffer=>{this.missileBuffer=buffer;return buffer;}).catch(()=>{this.missileLoading=null;return null;});
    return this.missileLoading;
  }
  private async playMissileLaunch(){
    const ctx=this.ctx;if(!ctx)return;const requested=performance.now(),buffer=await this.loadMissileSound();
    if(!buffer||!this.settings.sfx||ctx.state!=='running'||performance.now()-requested>800)return;
    const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=this.settings.sfx*.45;
    source.connect(gain);gain.connect(ctx.destination);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();
  }
  private utterance(text:string,profile:'young'|'solemn',personId?:string){
    const u=new SpeechSynthesisUtterance(text);u.lang=this.settings.locale==='ja'?'ja-JP':'en-US';u.pitch=profile==='young'?1.2:.82;u.rate=profile==='young'?1:.88;u.volume=this.settings.voice;
    const voices=speechSynthesis.getVoices().filter(v=>v.lang.startsWith(u.lang.slice(0,2))),character=personId==='kylie'||personId==='sheridan'?CHARACTER_VOICE_PROFILES[personId]:null;
    if(character){
      const male=voices.filter(v=>maleVoiceName.test(v.name)),kylie=male.find(v=>CHARACTER_VOICE_PROFILES.kylie.preferred.test(v.name))??male[0];
      const candidates=personId==='sheridan'&&male.length>1?male.filter(v=>v!==kylie):male;
      u.voice=candidates.find(v=>character.preferred.test(v.name))??candidates[0]??null;u.pitch=character.pitch;u.rate=character.rate;
    }else u.voice=voices.find(v=>/Kyoko|Samantha|female|女性|O-Ren/i.test(v.name))??voices[0]??null;
    return u;
  }
  say(ja:string,en:string,profile:'young'|'solemn'='young',priority=false){
    if(!('speechSynthesis'in window)||!this.settings.voice)return;
    const now=performance.now();if(!priority&&(this.radioPending>0||now-this.lastSpeech<1800))return;
    if(priority){this.occupiedUtterance=null;this.afterOccupied=null;this.stopRadio();speechSynthesis.cancel();}this.lastSpeech=now;
    speechSynthesis.speak(this.utterance(this.settings.locale==='ja'?ja:en,profile));
  }
  private stopRadio(){
    if(this.radioSpeechTimer!==undefined){clearTimeout(this.radioSpeechTimer);this.radioSpeechTimer=undefined;}
    this.radioGeneration++;this.radioPending=0;
    for(const [source,gain] of this.radioSources){source.onended=null;source.stop();source.disconnect();gain.disconnect();}this.radioSources.clear();
  }
  private loadRadioBuffer(url:string):Promise<AudioBuffer|null>{
    const ctx=this.ctx;if(!ctx)return Promise.resolve(null);const cached=this.radioBuffers.get(url);if(cached)return cached;
    const loading=fetch(url).then(response=>{if(!response.ok)throw new Error('Radio voice unavailable');return response.arrayBuffer();}).then(bytes=>ctx.decodeAudioData(bytes)).catch(()=>{this.radioBuffers.delete(url);return null;});this.radioBuffers.set(url,loading);return loading;
  }
  private radioHiss(start:number,generation:number,finish?:()=>void){
    const ctx=this.ctx;if(!ctx||ctx.state!=='running'||!this.settings.sfx)return 0;
    if(!this.radioStaticBuffer){const samples=radioStaticSamples(ctx.sampleRate);this.radioStaticBuffer=ctx.createBuffer(1,samples.length,ctx.sampleRate);this.radioStaticBuffer.copyToChannel(samples,0);}
    const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=this.radioStaticBuffer;gain.gain.value=this.settings.sfx*.23;source.connect(gain);gain.connect(ctx.destination);this.radioSources.set(source,gain);
    source.onended=()=>{this.radioSources.delete(source);source.disconnect();gain.disconnect();if(generation===this.radioGeneration)finish?.();};source.start(start);return RADIO_STATIC_DURATION;
  }
  async radioSquelch(){
    this.stopRadio();const generation=this.radioGeneration;
    if(this.ctx?.state==='suspended'){try{await this.ctx.resume();}catch{return;}if(generation!==this.radioGeneration)return;}
    this.radioPending=this.radioHiss((this.ctx?.currentTime??0)+.01,generation,()=>{this.radioPending=0;})?1:0;
  }
  private radioVoiceEnded(generation:number){
    if(generation!==this.radioGeneration)return;
    this.radioPending=Math.max(0,this.radioPending-1);
    if(this.radioPending===0&&this.radioHiss(this.ctx?.currentTime??0,generation,()=>{this.radioPending=0;}))this.radioPending=1;
  }
  private radioTts(replies:readonly {personId?:string;line:{ja:string;en:string}}[],generation:number,profile:'young'|'solemn'){
    const delay=this.radioHiss((this.ctx?.currentTime??0)+.01,generation);
    const speak=()=>{
      this.radioSpeechTimer=undefined;if(generation!==this.radioGeneration)return;
      if(!('speechSynthesis'in window)){this.radioPending=1;this.radioVoiceEnded(generation);return;}
      for(const reply of replies){const u=this.utterance(reply.line[this.settings.locale],profile,reply.personId);let ended=false;
        const finish=()=>{if(!ended){ended=true;this.radioVoiceEnded(generation);}};u.onend=finish;u.onerror=finish;speechSynthesis.speak(u);}
    };
    if(delay)this.radioSpeechTimer=setTimeout(speak,(delay+.01)*1000);else speak();
  }
  async sayRadio(replies:readonly {personId?:string;line:{ja:string;en:string}}[],profile:'young'|'solemn'='young'){
    this.occupiedUtterance=null;this.afterOccupied=null;
    if(!replies.length)return;
    this.stopRadio();const generation=this.radioGeneration;this.radioPending=replies.length;this.lastSpeech=performance.now();
    if('speechSynthesis'in window)speechSynthesis.cancel();
    if(this.ctx?.state==='suspended'){try{await this.ctx.resume();}catch{this.radioPending=0;return;}if(generation!==this.radioGeneration)return;}
    if(!this.settings.voice){
      const start=this.ctx?.currentTime??0,duration=this.radioHiss(start,generation);this.radioPending=duration?1:0;
      if(duration)this.radioHiss(start+duration+.03,generation,()=>{this.radioPending=0;});return;
    }
    const locale=this.settings.locale,clips=replies.map(reply=>RADIO_VOICE_CLIPS[radioVoiceKey(locale,reply.personId??'',reply.line[locale])]);
    if(!this.ctx||clips.some(clip=>!clip)){this.radioTts(replies,generation,profile);return;}
    const ctx=this.ctx,buffers=await Promise.all(clips.map(clip=>this.loadRadioBuffer(clip.url)));
    if(generation!==this.radioGeneration)return;
    if(!this.settings.voice||ctx.state!=='running'){this.radioPending=0;return;}
    if(buffers.some(buffer=>!buffer)){this.radioTts(replies,generation,profile);return;}
    const opening=ctx.currentTime+.03,start=opening+this.radioHiss(opening,generation);
    buffers.forEach((buffer,index)=>{
      const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=this.settings.voice/Math.sqrt(buffers.length);source.connect(gain);gain.connect(ctx.destination);this.radioSources.set(source,gain);
      source.onended=()=>{this.radioSources.delete(source);source.disconnect();gain.disconnect();this.radioVoiceEnded(generation);};
      source.start(start+index*RADIO_RESPONSE_STAGGER_SECONDS);
    });
  }
  sayReady(){
    if(this.radioPending>0||!('speechSynthesis'in window)||!this.settings.voice)return;
    speechSynthesis.cancel();this.lastSpeech=performance.now();
    // Keep the word intact so the synthesizer can pronounce its initial sound
    // and transitions naturally, using the existing female voice.
    const japanese=this.settings.locale==='ja',u=this.utterance(japanese?'レディー。':'Ready.','solemn');
    u.pitch=japanese?.82:.68;u.rate=.88;speechSynthesis.speak(u);
  }
  loadMusic(file:File){this.stopMusic();this.missionMusic=null;this.musicOwner='manual';this.musicError=null;this.url=URL.createObjectURL(file);this.music=new Audio(this.url);this.music.loop=true;this.music.volume=this.settings.music;return this.musicPaused?Promise.resolve():this.music.play();}
  pause(preserveOccupied=false,preserveCollapse=false){if(!preserveCollapse){for(const source of this.collapseSources)source.stop();this.collapseSources.clear();}this.updateBuildingInterior(null,true);for(const source of this.gausShots)source.stop();this.gausShots.clear();this.pauseMusic();for(const source of this.deathSources)source.stop();this.deathSources.clear();this.wind.pause();this.stopRadio();this.updateDrive(null,0,0,true);this.music?.pause();if(!preserveOccupied||!this.occupiedUtterance){this.occupiedUtterance=null;this.afterOccupied=null;if('speechSynthesis'in window)speechSynthesis.cancel();}}
  resume(){this.musicPaused=false;this.musicFailed=false;if(this.music)this.music.volume=this.musicVolume;this.playCurrentMusic();}
}
