// Provisional stand-ins for the 2026-11-10 auditory classes. Not original recordings.
// Weapons missing from these maps keep the sound they already had.
export type WeaponFireVoice='highWhee'|'pppBowWhee'|'bowWheeGggo'|'djon'|'denDen'|'djan'|'hataHata'|'durrrrn'|'kakaka'|'garara';
export const MISSILE_FIRE_VOICES:Record<string,WeaponFireVoice|undefined>={
 SREM:'highWhee',CHUM:'highWhee',PUG:'highWhee',SAG5T:'pppBowWhee',UNKPA:'pppBowWhee',VISOM:'pppBowWhee',TCROCK:'bowWheeGggo',
};
export const LASER_FIRE_VOICES:Record<string,WeaponFireVoice|undefined>={
 P2MEC:'djon',CETI:'djon',TAR12:'denDen',HOMP11:'denDen',RAID:'djan','FIL-30':'djan',
};
export const GUN_FIRE_VOICES:Record<string,WeaponFireVoice|undefined>={
 FLECH:'hataHata',TCREAP:'durrrrn',zWASP:'kakaka',DASY:'garara',
};
// Missile classes match the legacy launch level. The others sit near the old oscillator shot.
export const WEAPON_FIRE_GAIN:Record<WeaponFireVoice,number>={
 highWhee:.45,pppBowWhee:.45,bowWheeGggo:.45,djon:.12,denDen:.12,djan:.22,hataHata:.14,durrrrn:.14,kakaka:.14,garara:.14,
};
export const WEAPON_FIRE_DURATION:Record<WeaponFireVoice,number>={
 highWhee:.46,pppBowWhee:.6,bowWheeGggo:.84,djon:.16,denDen:.24,djan:.08,hataHata:.09,durrrrn:.11,kakaka:.05,garara:.13,
};
// zWASP rises across a held burst, then holds. A gap longer than the fire interval starts again at the bottom.
export const ZWASP_PITCH_STEPS=8;
export const ZWASP_PITCH_RATIO=1.12;
export const ZWASP_BURST_GAP=.25;
export const ZWASP_TWIN_GAP=.04;
// Missile classes share the launch wav's pressure crack, low motor, and exhaust.
// The onomatopoeia is that exhaust contour. A bare glide sounds like a cartoon effect.
const renderers:Record<WeaponFireVoice,(samples:Float32Array,rate:number,pitchStep:number)=>void>={
 highWhee(samples,rate){
  const noise=lcg(0x11a1ee),rush=filt(),rumble=filt();let sub=0;
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,u=t/WEAPON_FIRE_DURATION.highWhee,n=noise(),glide=Math.min(1,u/.8);
   tick(rush,n,160+460*glide,.62,rate);tick(rumble,n,62,1,rate);sub+=(32+14*glide)/rate;
   const attack=Math.min(1,t/.01),hold=u<.68?1:Math.pow(Math.max(0,(1-u)/.32),1.2);
   const crack=rush.band*Math.exp(-t*48);
   const body=(rush.band*(.45+.7*glide)+rumble.low*1.15+Math.sin(2*Math.PI*sub)*.12)*attack*hold;
   samples[i]=Math.tanh((crack+body)*1.7);
  }
 },
 pppBowWhee(samples,rate){
  const noise=lcg(0x505031),burst=filt(),rush=filt(),rumble=filt();let sub=0;const pops=[0,.046,.092];
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,n=noise();let pop=0;
   for(const at of pops){
    const age=t-at;if(age<0||age>=.013)continue;
    tick(burst,n,240,.9,rate);const env=Math.sin(Math.PI*age/.013);
    pop+=(burst.band*.85+Math.sin(age*480)*.7)*env;
   }
   let whoosh=0;
   if(t>.16){
    const u=(t-.16)/.4;tick(rush,n,300+340*Math.min(1,u/.8),.58,rate);tick(rumble,n,74,1,rate);sub+=48/rate;
    const env=Math.min(1,(t-.16)/.018)*(u<.6?1:Math.pow(Math.max(0,(1-u)/.4),1.1));
    whoosh=Math.tanh((rush.band*1.05+rumble.low*1.05+Math.sin(2*Math.PI*sub)*.14)*env*1.8);
   }
   samples[i]=pop+whoosh;
  }
 },
 bowWheeGggo(samples,rate){
  const noise=lcg(0x6607),air=filt(),burn=filt(),rumble=filt();
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,n=noise();let w=0;
   if(t<.36){const u=t/.36;tick(air,n,780*Math.exp(-u*1.6)+160,.55,rate);w=air.band*Math.min(1,t/.012)*(1-u*.85);}
   let g=0;
   if(t>.28){const age=t-.28;tick(burn,n,110,.85,rate);tick(rumble,n,48,1,rate);const env=Math.min(1,age/.04)*Math.pow(Math.max(0,1-age/.7),.55);g=(burn.low*1.6+rumble.low*2.1)*env*(.84+.16*Math.sin(age*19));}
   samples[i]=Math.tanh((w*.85+g)*1.45);
  }
 },
 djon(samples,rate){
  const noise=lcg(0xd10c);let phase=0;
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,u=t/WEAPON_FIRE_DURATION.djon,hz=460*Math.exp(-u*1.1);phase+=hz/rate;
   const click=t<.01?noise()*(1-t/.01):0,env=Math.min(1,t/.012)*Math.pow(Math.max(0,1-u),1.1);
   samples[i]=click*.45+(Math.sin(2*Math.PI*phase)*.85+Math.sin(4*Math.PI*phase)*.12)*env;
  }
 },
 denDen(samples,rate){
  const strikes=[{at:.006,hz:520,ring:.09},{at:.12,hz:520,ring:.11}];let phase=0,current=-1;
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate;let v=0;
   for(const [index,strike] of strikes.entries()){
    const age=t-strike.at;if(age<0||age>strike.ring)continue;
    if(current!==index){phase=0;current=index;}phase+=strike.hz/rate;const p=2*Math.PI*phase;
    const env=Math.min(1,age/.003)*Math.exp(-age/.04);
    v+=(Math.sin(p)*.62+Math.sin(p*2.37)*.28+Math.sin(p*4.1)*.16)*env;
   }
   samples[i]=v;
  }
 },
 djan(samples,rate){
  const noise=lcg(0xd1a0),body=filt();let phase=0;
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,u=t/WEAPON_FIRE_DURATION.djan,n=noise(),hz=92-24*u;phase+=hz/rate;tick(body,n,210,.75,rate);const p=2*Math.PI*phase;
   const env=Math.min(1,t/.003)*Math.pow(Math.max(0,1-u/.82),1.05);
   const tone=Math.sin(p)*.5+Math.sin(p*2)*.72+Math.sin(p*3)*.34;
   samples[i]=Math.tanh((tone+body.low*.55+body.band*.28)*env*1.45);
  }
 },
 hataHata(samples,rate){
  const noise=lcg(0x8a7a),knock=filt();const bursts=[.004,.046];
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,n=noise();tick(knock,n,58,.9,rate);let env=0,thump=0;
   for(const at of bursts){const age=t-at;if(age<0||age>=.016)continue;env=Math.max(env,Math.sin(Math.PI*age/.016));thump+=Math.sin(age*250)*Math.exp(-age/.009);}
   samples[i]=Math.tanh((knock.low*1.4+thump*.55)*env*1.5);
  }
 },
 durrrrn(samples,rate){
  const noise=lcg(0xd044),rumble=filt();let phase=0;
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,n=noise();phase+=38/rate;tick(rumble,n,95,.9,rate);let body=Math.sin(2*Math.PI*phase)+Math.sin(4*Math.PI*phase)*.22;
   const env=Math.min(1,t/.008)*Math.min(1,(WEAPON_FIRE_DURATION.durrrrn-t)/.02);
   samples[i]=Math.tanh((body*.42+rumble.low*1.15)*env*1.4);
  }
 },
 kakaka(samples,rate,pitchStep){
  const step=Math.max(0,Math.min(ZWASP_PITCH_STEPS,pitchStep)),hz=90*ZWASP_PITCH_RATIO**step,noise=lcg(0xcaca+step),body=filt();let phase=0,sub=0;
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,n=noise();tick(body,n,46,.95,rate);phase+=hz/rate;sub+=42/rate;
   const env=Math.min(1,t/.004)*Math.exp(-t/.022);
   samples[i]=Math.tanh((Math.sin(2*Math.PI*phase)*.55+Math.sin(2*Math.PI*sub)*.7+body.low*.8)*env*1.45);
  }
 },
 garara(samples,rate){
  const noise=lcg(0x6a4a),rattle=filt();let phase=0;const grains=[0,.026,.052,.078,.104];
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,n=noise();tick(rattle,n,52,.95,rate);phase+=58/rate;let env=0;
   for(const at of grains){const age=t-at;if(age>=0&&age<.014)env=Math.max(env,Math.sin(Math.PI*age/.014));}
   samples[i]=Math.tanh((rattle.low*1.35+Math.sin(2*Math.PI*phase)*.25)*env*Math.exp(-t/.26)*1.45);
  }
 },
};
function lcg(seed:number){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/2147483648-1;};}
function filt(){return {low:0,band:0};}
function tick(f:{low:number,band:number},input:number,cutoff:number,q:number,rate:number){
 const g=2*Math.sin(Math.PI*Math.min(cutoff,rate*.2)/rate);
 f.low+=g*f.band;const high=input-f.low-q*f.band;f.band+=g*high;
}
export function weaponFireSamples(voice:WeaponFireVoice,sampleRate:number,pitchStep=0){
 const samples=new Float32Array(Math.ceil(sampleRate*WEAPON_FIRE_DURATION[voice]));
 renderers[voice](samples,sampleRate,pitchStep);
 let peak=0;for(let i=0;i<samples.length;i++)peak=Math.max(peak,Math.abs(samples[i]));
 const scale=.8/(peak||1);for(let i=0;i<samples.length;i++)samples[i]*=scale;
 samples[0]=0;samples[samples.length-1]=0;return samples;
}
