// Reusable outdoor ambience: filtered noise with slow, overlapping gusts.
// Prototype synthesis, independent of engine sounds and speech playback.
export class ExternalWind {
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private level=-1;
 update(ctx:AudioContext|null,external:boolean,volume:number,paused=false){
  const level=external&&!paused&&ctx?.state==='running'?volume*.65:0;
  if(!this.master){
   if(!ctx||level<=0)return;
   this.context=ctx;
   const buffer=ctx.createBuffer(1,ctx.sampleRate*6,ctx.sampleRate),samples=buffer.getChannelData(0);
   let brown=0;
   for(let i=0;i<samples.length;i++){brown=(brown+.02*(Math.random()*2-1))/1.02;samples[i]=brown*3.5;}
   // Bring both ends to zero to avoid a click at the loop boundary.
   const fade=Math.min(512,samples.length/2);
   for(let i=0;i<fade;i++){samples[i]*=i/fade;samples[samples.length-1-i]*=i/fade;}
   const noise=ctx.createBufferSource(),low=ctx.createBiquadFilter(),high=ctx.createBiquadFilter(),gust=ctx.createGain();
   noise.buffer=buffer;noise.loop=true;low.type='lowpass';low.frequency.value=1400;low.Q.value=.5;high.type='highpass';high.frequency.value=65;high.Q.value=.5;gust.gain.value=.38;
   const master=ctx.createGain();master.gain.value=0;this.master=master;
   noise.connect(low);low.connect(high);high.connect(gust);gust.connect(master);master.connect(ctx.destination);
   for(const [frequency,depth] of [[.13,.15],[.31,.06]]){
    const oscillator=ctx.createOscillator(),modulation=ctx.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;modulation.gain.value=depth;oscillator.connect(modulation);modulation.connect(gust.gain);oscillator.start();
   }
   noise.start();
  }
  if(this.level===level)return;
  this.level=level;
  const gain=this.master.gain,time=this.context!.currentTime;
  gain.cancelScheduledValues(time);gain.setTargetAtTime(level,time,level>0?.3:.04);
 }
 pause(){this.update(this.context,false,0,true);}
}
