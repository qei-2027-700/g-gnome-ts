// Provisional stand-ins for the 2026-11-10 auditory classes. Not original recordings.
// Weapons missing from these maps keep the sound they already had.
export type WeaponFireVoice='highWhee'|'pppBowWhee'|'bowWheeGggo'|'djon'|'denDen'|'djan'|'hataHata'|'durrrrn'|'kakaka'|'garara';
export const MISSILE_FIRE_VOICES:Record<string,WeaponFireVoice|undefined>={
 SREM:'highWhee',CHUM:'highWhee',SAG5T:'pppBowWhee',TCROCK:'bowWheeGggo',
};
export const LASER_FIRE_VOICES:Record<string,WeaponFireVoice|undefined>={
 P2MEC:'djon',CETI:'djon',TAR12:'denDen',HOMP11:'denDen',RAID:'djan','FIL-30':'djan',
};
export const GUN_FIRE_VOICES:Record<string,WeaponFireVoice|undefined>={
 FLECH:'hataHata',TCREAP:'durrrrn',zWASP:'kakaka',DASY:'garara',
};
// Missile classes match the legacy launch level. The others sit near the old oscillator shot.
export const WEAPON_FIRE_GAIN:Record<WeaponFireVoice,number>={
 highWhee:.45,pppBowWhee:.45,bowWheeGggo:.45,djon:.12,denDen:.12,djan:.12,hataHata:.14,durrrrn:.14,kakaka:.14,garara:.14,
};
export const WEAPON_FIRE_DURATION:Record<WeaponFireVoice,number>={
 highWhee:.46,pppBowWhee:.6,bowWheeGggo:.84,djon:.16,denDen:.24,djan:.08,hataHata:.09,durrrrn:.11,kakaka:.05,garara:.13,
};
// zWASP rises across a held burst, then holds. A gap longer than the fire interval starts again at the bottom.
export const ZWASP_PITCH_STEPS=8;
export const ZWASP_PITCH_RATIO=1.12;
export const ZWASP_BURST_GAP=.25;
export const ZWASP_TWIN_GAP=.04;
const renderers:Record<WeaponFireVoice,(samples:Float32Array,rate:number,pitchStep:number)=>void>={
 highWhee(samples,rate){
  let phase=0;
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,u=t/WEAPON_FIRE_DURATION.highWhee,hz=1500+1900*Math.min(1,u/.72);
   phase+=hz/rate;samples[i]=Math.sin(2*Math.PI*phase)*Math.min(1,t/.02)*Math.pow(Math.max(0,1-u),.35);
  }
 },
 pppBowWhee(samples,rate){
  const noise=lcg(0x505031);let phase=0;const pops=[0,.045,.09];
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate;let pop=0;
   for(const at of pops){const age=t-at;if(age>=0&&age<.014)pop+=noise()*Math.sin(Math.PI*age/.014);}
   let whoosh=0;
   if(t>.16){const u=(t-.16)/.4,hz=360+820*Math.min(1,u);phase+=hz/rate;whoosh=Math.sin(2*Math.PI*phase)*Math.min(1,(t-.16)/.03)*Math.pow(Math.max(0,1-u),.4);}
   samples[i]=pop*.9+whoosh;
  }
 },
 bowWheeGggo(samples,rate){
  const noise=lcg(0x6607);let whoosh=0,growl=0,low=0;const blend=1-Math.exp(-2*Math.PI*180/rate);
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate;let w=0;
   if(t<.32){const u=t/.32,hz=880*Math.exp(-u*1.35);whoosh+=hz/rate;w=Math.sin(2*Math.PI*whoosh)*Math.min(1,t/.015)*(1-u);}
   let g=0;
   if(t>.26){const age=t-.26;growl+=72/rate;low+=blend*(noise()-low);const env=Math.min(1,age/.04)*Math.exp(-age/.72);g=(Math.sin(2*Math.PI*growl)*.7+Math.sin(4*Math.PI*growl)*.22+low*.55)*env*(.72+.28*Math.sin(age*31));}
   samples[i]=w*.85+g;
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
  const pulses=[{at:.008,hz:860,len:.062},{at:.128,hz:860,len:.07}];let phase=0,current=-1;
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate;let v=0;
   for(const [index,pulse] of pulses.entries()){
    const age=t-pulse.at;if(age<0||age>pulse.len)continue;
    if(current!==index){phase=0;current=index;}phase+=pulse.hz/rate;v+=Math.sin(2*Math.PI*phase)*Math.sin(Math.PI*age/pulse.len);
   }
   samples[i]=v;
  }
 },
 djan(samples,rate){
  const noise=lcg(0xd1a0);let phase=0;
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,u=t/WEAPON_FIRE_DURATION.djan,hz=1680*Math.exp(-u*.55);phase+=hz/rate;
   const click=t<.006?noise()*(1-t/.006):0,env=Math.min(1,t/.004)*Math.pow(Math.max(0,1-u),.6);
   samples[i]=click*.5+(Math.sin(2*Math.PI*phase)+Math.sin(6*Math.PI*phase)*.35)*env;
  }
 },
 hataHata(samples,rate){
  const noise=lcg(0x8a7a);let hp=0,prev=0;const bursts=[.004,.046];
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,n=noise();hp=n-prev+.85*hp;prev=n;let env=0;
   for(const at of bursts){const age=t-at;if(age>=0&&age<.014)env=Math.max(env,Math.sin(Math.PI*age/.014));}
   samples[i]=hp*env;
  }
 },
 durrrrn(samples,rate){
  let phase=0;
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate;phase+=92/rate;let saw=0;
   for(let h=1;h<=8;h++)saw+=Math.sin(2*Math.PI*phase*h)/h;
   samples[i]=saw*Math.min(1,t/.008)*Math.min(1,(WEAPON_FIRE_DURATION.durrrrn-t)/.012)*(.84+.16*Math.sin(t*78));
  }
 },
 kakaka(samples,rate,pitchStep){
  const step=Math.max(0,Math.min(ZWASP_PITCH_STEPS,pitchStep)),hz=880*ZWASP_PITCH_RATIO**step,noise=lcg(0xcaca+step);let phase=0;
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate,click=t<.004?noise()*(1-t/.004):0;phase+=hz/rate;
   const env=t<.004?0:Math.min(1,(t-.004)/.003)*Math.exp(-(t-.004)/.018);
   samples[i]=click*.8+Math.sin(2*Math.PI*phase)*env;
  }
 },
 garara(samples,rate){
  const noise=lcg(0x6a4a);let low=0,phase=0;const blend=1-Math.exp(-2*Math.PI*400/rate),grains=[0,.026,.052,.078,.104];
  for(let i=1;i<samples.length-1;i++){
   const t=i/rate;low+=blend*(noise()-low);phase+=175/rate;let env=0;
   for(const at of grains){const age=t-at;if(age>=0&&age<.012)env=Math.max(env,Math.sin(Math.PI*age/.012));}
   samples[i]=(low*.8+Math.sin(2*Math.PI*phase)*.25)*env*Math.exp(-t/.2);
  }
 },
};
function lcg(seed:number){let s=seed>>>0;return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/2147483648-1;};}
export function weaponFireSamples(voice:WeaponFireVoice,sampleRate:number,pitchStep=0){
 const samples=new Float32Array(Math.ceil(sampleRate*WEAPON_FIRE_DURATION[voice]));
 renderers[voice](samples,sampleRate,pitchStep);
 let peak=0;for(let i=0;i<samples.length;i++)peak=Math.max(peak,Math.abs(samples[i]));
 const scale=.8/(peak||1);for(let i=0;i<samples.length;i++)samples[i]*=scale;
 samples[0]=0;samples[samples.length-1]=0;return samples;
}
