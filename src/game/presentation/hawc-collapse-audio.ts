// Synthesized structural failure, not a voice or an original-game recording.
export const HAWC_COLLAPSE_DURATION=3.25;
export function hawcCollapseSamples(sampleRate:number){
 const samples=new Float32Array(Math.ceil(sampleRate*HAWC_COLLAPSE_DURATION));
 const chunks=[{at:0,weight:1},{at:.43,weight:.5},{at:.82,weight:.66},{at:1.22,weight:.48},{at:1.7,weight:.85},{at:2.15,weight:.35}];
 let seed=57031,low=0,air=0,p1=0,p2=0,p3=0,peak=0;
 const lowBlend=1-Math.exp(-2*Math.PI*125/sampleRate),airBlend=1-Math.exp(-2*Math.PI*1800/sampleRate);
 for(let i=0;i<samples.length;i++){
  const t=i/sampleRate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;low+=lowBlend*(noise-low);air+=airBlend*(noise-air);
  // Inharmonic descending metal, with an irregular load instead of vocal formants.
  const u=Math.min(1,Math.max(0,(t-.06)/1.65));p1+=(185-118*u)/sampleRate;p2+=(281-164*u)/sampleRate;p3+=(437-240*u)/sampleRate;
  const strain=t>.06&&t<1.71?Math.sin(Math.PI*u)**.7:0;
  const metal=(Math.sin(2*Math.PI*p1)*.36+Math.sin(2*Math.PI*p2)*.2+Math.sin(2*Math.PI*p3)*.11)*strain*(.76+.24*Math.sin(t*2*Math.PI*29));
  let debris=0;
  for(const [index,chunk] of chunks.entries()){
   const age=t-chunk.at;if(age<0)continue;
   const envelope=Math.min(1,age/.006)*Math.exp(-age/(.2+index*.035))*chunk.weight;
   debris+=envelope*(Math.sin(2*Math.PI*((72-index*5)*age-8*age*age))*.4+low*1.5+(air-low)*.25);
  }
  const scrape=(air-low)*strain*(.11+.13*Math.sin(t*2*Math.PI*17)**2);
  const tail=low*.35*Math.exp(-t/.95),edge=Math.max(0,Math.min(1,t/.006,(samples.length-1-i)/sampleRate/.1));
  samples[i]=Math.tanh((metal+debris+scrape+tail)*1.4)*Math.sin(edge*Math.PI/2)**2;peak=Math.max(peak,Math.abs(samples[i]));
 }
 for(let i=0;i<samples.length;i++)samples[i]*=.78/(peak||1);
 samples[0]=0;samples[samples.length-1]=0;
 return samples;
}
