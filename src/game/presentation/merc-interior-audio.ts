// Provisional enclosed machinery and winter wind; no vehicle-speed coupling.
const INTERIOR_PITCH=2**(1/12); // One semitone up; pulse/loop durations stay fixed.
export function mercInteriorDrone(time:number){
 const phase=((time%4)+4)%4,duration=1.8;
 if(phase>=duration)return 0;
 const envelope=Math.sin(Math.PI*phase/duration)**2,tone=phase*INTERIOR_PITCH;
 // Fixed motor and inharmonic metal frequencies avoid a voice-like pitch/formant sweep.
 return envelope*(.23*Math.sin(2*Math.PI*72*tone)+.1*Math.sin(2*Math.PI*217*tone)+.055*Math.sin(2*Math.PI*641*tone)+.025*Math.sin(2*Math.PI*1103*tone));
}
export function mercInteriorSamples(sampleRate:number){
 const duration=8,length=Math.round(sampleRate*duration),samples=new Float32Array(length);
 let seed=7429,rumble=0,air=0;
 const rumbleBlend=1-Math.exp(-2*Math.PI*90*INTERIOR_PITCH/sampleRate),airBlend=1-Math.exp(-2*Math.PI*900*INTERIOR_PITCH/sampleRate);
 for(let i=0;i<length;i++){
  const time=i/sampleRate,toneTime=time*INTERIOR_PITCH;
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;
  rumble+=rumbleBlend*(noise-rumble);air+=airBlend*(noise-air);
  const load=.86+.09*Math.sin(2*Math.PI*.5*time)+.05*Math.sin(2*Math.PI*.875*time);
  // Upper harmonics keep the rumble audible on speakers with weak bass response.
  const machinery=load*(.32*Math.sin(2*Math.PI*48*toneTime)+.16*Math.sin(2*Math.PI*72*toneTime)+.08*Math.sin(2*Math.PI*96*toneTime)+.14*Math.sin(2*Math.PI*144*toneTime)+.1*Math.sin(2*Math.PI*192*toneTime)+.06*Math.sin(2*Math.PI*288*toneTime));
  const vibration=(.6+.4*Math.sin(2*Math.PI*18*time)**2)*(.035*Math.sin(2*Math.PI*216*toneTime)+rumble*.3);
  const phase=time%4,gust=phase<1.8?Math.sin(Math.PI*phase/1.8)**2:0;
  const blades=.9+.1*Math.sin(2*Math.PI*24*toneTime);
  const wind=(.24+.7*gust)*blades*(air-rumble);
  // Brief soft edges prevent a click when the filtered noise loops.
  const edge=Math.min(1,time/.04,(length-1-i)/sampleRate/.04);
  const mixed=machinery*.5+vibration*.32+wind+mercInteriorDrone(time);
  samples[i]=edge<=0?0:Math.sin(edge*Math.PI/2)**2*.9*Math.tanh(mixed);
 }
 return samples;
}
