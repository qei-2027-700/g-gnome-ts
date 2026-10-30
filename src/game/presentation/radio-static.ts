export const RADIO_STATIC_DURATION=.28;
// Voice-band static with a faint carrier and soft edges, rather than dry
// high-frequency grain. The same squelch opens and closes every transmission.
export function radioStaticSamples(sampleRate:number){
 const samples=new Float32Array(Math.ceil(sampleRate*RADIO_STATIC_DURATION));
 const lowRate=1-Math.exp(-2*Math.PI*2100/sampleRate),highRate=1-Math.exp(-2*Math.PI*320/sampleRate);let low=0,baseline=0;
 for(let i=0;i<samples.length;i++){
  const time=i/sampleRate,white=Math.random()*2-1;
  low+=lowRate*(white-low);baseline+=highRate*(low-baseline);
  const edge=Math.min(1,time/.012,(samples.length-1-i)/(sampleRate*.04));
  const carrier=.055*Math.sin(2*Math.PI*820*time)+.025*Math.sin(2*Math.PI*1280*time);
  samples[i]=((low-baseline)*1.15+carrier)*(.9+.1*Math.sin(2*Math.PI*37*time))*edge;
 }
 return samples;
}
