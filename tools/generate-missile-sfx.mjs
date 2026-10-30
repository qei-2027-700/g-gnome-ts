import {mkdir,writeFile} from 'node:fs/promises';
// Original procedural launch: short pressure blast followed by a rough motor roar.
const rate=44100,duration=1.2,samples=new Float64Array(Math.ceil(rate*duration));
let seed=0x51a7c0de,low=0,air=0,rumble=0,phase=0,subPhase=0;
const noise=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/0x80000000-1;};
let peak=0;
for(let i=0;i<samples.length;i++){
 const t=i/rate,n=noise(),cutoff=2300*Math.exp(-t*2.4)+160,alpha=1-Math.exp(-2*Math.PI*cutoff/rate);
 low+=alpha*(n-low);air+=.16*(n-air);rumble+=.018*(n-rumble);
 const attack=1-Math.exp(-t*250),tail=Math.pow(Math.max(0,1-t/duration),1.2),engine=attack*Math.exp(-t*2.2)*tail;
 phase+=2*Math.PI*(31+72*Math.exp(-t*18))/rate;subPhase+=2*Math.PI*(28+18*Math.exp(-t*4))/rate;
 const blast=(Math.sin(phase)*.65+n*.28)*Math.exp(-t*27)*attack;
 const roar=(low*2.8+rumble*3.5+Math.sin(subPhase)*.18)*(1+.13*Math.sin(2*Math.PI*19*t))*engine;
 const exhaust=(n-air)*.25*attack*Math.exp(-t*7)*tail;
 const sample=Math.tanh((blast+roar+exhaust)*1.7)*Math.min(1,(duration-t)*90);
 samples[i]=sample;peak=Math.max(peak,Math.abs(sample));
}
const wav=Buffer.alloc(44+samples.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples.length*2,40);
for(let i=0;i<samples.length;i++)wav.writeInt16LE(Math.round(samples[i]/peak*.88*32767),44+i*2);
const target=new URL('../assets/audio/sfx/missile-launch.wav',import.meta.url);await mkdir(new URL('.',target),{recursive:true});await writeFile(target,wav);
console.log(`Generated ${target.pathname}: ${duration}s, mono ${rate} Hz, peak 0.88`);
