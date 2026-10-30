import type {Faction} from '../content/vehicles.ts';
// Provisional nonverbal voices by faction; not recordings or ethnic profiles.
export const INFANTRY_DEATH_VOICES={
 union:{pitch:164,formants:[760,1180,2550],duration:.78,roughness:.08},
 merc:{pitch:118,formants:[680,1080,2350],duration:.9,roughness:.16},
 darken:{pitch:142,formants:[820,1350,2850],duration:.72,roughness:.12},
 scorp:{pitch:87,formants:[540,920,2100],duration:1.02,roughness:.3},
} as const;
export function deathCrySamples(faction:Faction,sampleRate:number){
 const profile=INFANTRY_DEATH_VOICES[faction],samples=new Float32Array(Math.ceil(profile.duration*sampleRate));let phase=0,peak=0;
 for(let i=0;i<samples.length;i++){
  const t=i/sampleRate,u=t/profile.duration,pitch=profile.pitch*(1.12-.42*u)*(1+.035*Math.sin(t*37));phase+=pitch/sampleRate;
  let voice=0;
  for(let harmonic=1;harmonic<=32;harmonic++){
   const hz=harmonic*pitch,formant=profile.formants.reduce((sum,f)=>sum+Math.exp(-.5*((hz-f)/(f*.13))**2),0);
   voice+=Math.sin(2*Math.PI*phase*harmonic)*(formant+.035)/harmonic;
  }
  const envelope=Math.min(1,t/.045)*Math.pow(Math.max(0,1-u),.65)*(1+profile.roughness*Math.sin(t*2*Math.PI*41));
  samples[i]=Math.tanh(voice*3)*envelope;peak=Math.max(peak,Math.abs(samples[i]));
 }
 for(let i=0;i<samples.length;i++)samples[i]*=.7/(peak||1);
 return samples;
}
