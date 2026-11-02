import type {River} from './types.ts';
import type {Vec} from '../../simulation/simulation.ts';

export type RiverFrame=Vec&{tx:number;tz:number;distance:number};

function points(river:River){return river.path?.length&&river.path.length>1?river.path:[{x:river.x,z:river.z-river.length/2},{x:river.x,z:river.z+river.length/2}];}

export function riverLength(river:River){
 const path=points(river);return path.slice(1).reduce((total,point,index)=>total+Math.hypot(point.x-path[index]!.x,point.z-path[index]!.z),0);
}

export function riverFrameAtDistance(river:River,distance:number):RiverFrame{
 const path=points(river);let remaining=Math.max(0,distance);
 for(let i=1;i<path.length;i++){
  const a=path[i-1]!,b=path[i]!,dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  if(remaining<=length||i===path.length-1){const t=length?Math.min(1,remaining/length):0;return {x:a.x+dx*t,z:a.z+dz*t,tx:dx/(length||1),tz:dz/(length||1),distance:distance-remaining+length*t};}
  remaining-=length;
 }
 const last=path.at(-1)!;return {x:last.x,z:last.z,tx:0,tz:1,distance:riverLength(river)};
}

export function riverFrameAtZ(river:River,z:number):RiverFrame{
 const path=points(river);let best:RiverFrame|undefined,bestDelta=Infinity,along=0;
 for(let i=1;i<path.length;i++){
  const a=path[i-1]!,b=path[i]!,dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz),t=Math.max(0,Math.min(1,(z-a.z)/(dz||1)));
  const pointZ=a.z+dz*t,delta=Math.abs(pointZ-z);
  if(delta<bestDelta){bestDelta=delta;best={x:a.x+dx*t,z:pointZ,tx:dx/(length||1),tz:dz/(length||1),distance:along+length*t};}
  along+=length;
 }
 return best??riverFrameAtDistance(river,0);
}

export function riverSamples(river:River,spacing=12){
 const length=riverLength(river),count=Math.max(1,Math.ceil(length/spacing));
 return Array.from({length:count+1},(_,i)=>riverFrameAtDistance(river,length*i/count));
}

export function riverStripBoxes(river:River,raised:boolean,spacing=river.width/3,bridgeClearance=0){
 const length=riverLength(river),bridge=riverFrameAtZ(river,river.bridgeZ),halfGap=raised?0:river.bridgeWidth/2+bridgeClearance;
 const ranges=raised?[[0,length]]:[[0,Math.max(0,bridge.distance-halfGap)],[Math.min(length,bridge.distance+halfGap),length]];
 const boxes:{x:number;z:number;width:number;depth:number;yaw:number}[]=[];
 for(const [distance,direction] of [[0,-1],[length,1]] as const){const end=riverFrameAtDistance(river,distance);boxes.push({x:end.x+end.tx*direction*river.width/2,z:end.z+end.tz*direction*river.width/2,width:river.width,depth:river.width,yaw:Math.atan2(end.tx,end.tz)});}
 for(const [start,end] of ranges){
  if(end<=start)continue;
  const count=Math.max(1,Math.ceil((end-start)/spacing));
  for(let i=0;i<count;i++){
   const from=riverFrameAtDistance(river,start+(end-start)*i/count),to=riverFrameAtDistance(river,start+(end-start)*(i+1)/count);
   const dx=to.x-from.x,dz=to.z-from.z,segmentLength=Math.hypot(dx,dz),frame=riverFrameAtDistance(river,(from.distance+to.distance)/2);
   boxes.push({x:(from.x+to.x)/2,z:(from.z+to.z)/2,width:river.width,depth:segmentLength+1,yaw:Math.atan2(frame.tx,frame.tz)});
  }
 }
 return boxes;
}

export function riverDistance(river:River,x:number,z:number){
 const path=points(river);let nearest=Infinity;
 for(let i=1;i<path.length;i++){
  const a=path[i-1]!,b=path[i]!,dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
  nearest=Math.min(nearest,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));
 }
 return nearest;
}
