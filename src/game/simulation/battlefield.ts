import type {Vec} from './simulation.ts';
import type {Terrain} from '../content/missions/types.ts';
type Peak=NonNullable<Terrain['peaks']>[number];
export function sweptCircle(from:Vec,to:Vec,point:Vec,radius:number){const dx=to.x-from.x,dz=to.z-from.z,t=Math.max(0,Math.min(1,((point.x-from.x)*dx+(point.z-from.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(from.x+t*dx-point.x,from.z+t*dz-point.z)<=radius;}
export function crossesBuilding(from:Vec,to:Vec,b:{x:number;z:number;width:number;depth:number},padding=0){let lo=0,hi=1;for(const axis of ['x','z'] as const){const half=(axis==='x'?b.width:b.depth)/2+padding,a=from[axis]-b[axis],d=to[axis]-from[axis];if(Math.abs(d)<1e-9){if(Math.abs(a)>half)return false;}else{const n=(-half-a)/d,f=(half-a)/d;lo=Math.max(lo,Math.min(n,f));hi=Math.min(hi,Math.max(n,f));if(lo>hi)return false;}}return true;}
export function buildingContact(from:Vec&{y:number},to:Vec&{y:number},b:{x:number;z:number;width:number;depth:number;height:number},padding=0){let lo=0,hi=1;for(const [axis,center,half] of [['x',b.x,b.width/2+padding],['y',b.height/2,b.height/2+padding],['z',b.z,b.depth/2+padding]] as const){const a=from[axis]-center,d=to[axis]-from[axis];if(Math.abs(d)<1e-9){if(Math.abs(a)>half)return null;}else{const n=(-half-a)/d,f=(half-a)/d;lo=Math.max(lo,Math.min(n,f));hi=Math.min(hi,Math.max(n,f));if(lo>hi)return null;}}return lo;}

export function circleMotionContact(from:Vec,to:Vec,center:Vec,radius:number){
 const dx=to.x-from.x,dz=to.z-from.z,ox=from.x-center.x,oz=from.z-center.z,a=dx*dx+dz*dz,b=ox*dx+oz*dz,c=ox*ox+oz*oz-radius*radius;
 if(a<1e-12)return null;
 let t=0;if(c>1e-8){const d=b*b-a*c;if(d<0)return null;t=(-b-Math.sqrt(d))/a;if(t<0||t>1)return null;}else if(b>=0)return null;
 const x=from.x+dx*t-center.x,z=from.z+dz*t-center.z,length=Math.hypot(x,z)||1;
 return {t,nx:x/length,nz:z/length};
}

// Rocky mountain meshes taper from their listed width/depth toward the summit.
// The envelope uses the mesh's maximum crag height so shots cannot pass through a visible face.
export function peakHeight(peak:Peak,x:number,z:number){
 const radius=Math.hypot((x-peak.x)/(peak.width/2),(z-peak.z)/(peak.depth/2));
 return Math.pow(Math.max(0,1-radius),.8)*peak.height-3;
}
export function peakFootprint(peak:Peak){
 const solid=peak.height>4?1-Math.pow(4/peak.height,1.25):0;
 return {x:peak.width*solid/2,z:peak.depth*solid/2};
}
export function peakMotionContact(from:Vec,to:Vec,peak:Peak,padding=0){
 const size=peakFootprint(peak),rx=size.x+padding,rz=size.z+padding;
 if(rx<=0||rz<=0)return null;
 const local=(point:Vec)=>({x:(point.x-peak.x)/rx,z:(point.z-peak.z)/rz});
 const hit=circleMotionContact(local(from),local(to),{x:0,z:0},1);
 if(!hit)return null;
 const nx=hit.nx/rx,nz=hit.nz/rz,length=Math.hypot(nx,nz);
 return {...hit,nx:nx/length,nz:nz/length};
}
export function peakSegmentContact(from:Vec&{y:number},to:Vec&{y:number},peak:Peak,padding=0){
 const rx=peak.width/2+padding,rz=peak.depth/2+padding;
 const x=(from.x-peak.x)/rx,z=(from.z-peak.z)/rz,dx=(to.x-from.x)/rx,dz=(to.z-from.z)/rz;
 const a=dx*dx+dz*dz,b=x*dx+z*dz,c=x*x+z*z-1;
 let lo=0,hi=1;
 if(a<1e-12){if(c>0)return null;}
 else{const discriminant=b*b-a*c;if(discriminant<0)return null;const root=Math.sqrt(discriminant);lo=Math.max(0,(-b-root)/a);hi=Math.min(1,(-b+root)/a);if(lo>hi)return null;}
 const inside=(t:number)=>{const px=from.x+(to.x-from.x)*t,pz=from.z+(to.z-from.z)*t,y=from.y+(to.y-from.y)*t;return y<=peakHeight(peak,px,pz)+padding;};
 if(inside(lo))return lo;
 const closest=a<1e-12?lo:Math.max(lo,Math.min(hi,-b/a));
 const samples=Array.from({length:13},(_,i)=>lo+(hi-lo)*i/12);
 if(closest>lo&&closest<hi)samples.push(closest);
 samples.sort((left,right)=>left-right);
 for(let i=1;i<samples.length;i++)if(inside(samples[i])){let left=samples[i-1],right=samples[i];for(let j=0;j<8;j++){const middle=(left+right)/2;if(inside(middle))right=middle;else left=middle;}return right;}
 return null;
}

// Swept horizontal box contact, including separation from an existing overlap.
// Initial overlap may slide toward an exit, but cannot be pushed deeper.
export function buildingMotionContact(from:Vec,to:Vec,b:{x:number;z:number;width:number;depth:number},padding=0){
 const ox=from.x-b.x,oz=from.z-b.z,dx=to.x-from.x,dz=to.z-from.z,hx=b.width/2+padding,hz=b.depth/2+padding;
 if(dx*dx+dz*dz<1e-12)return null;
 const gapX=hx-Math.abs(ox),gapZ=hz-Math.abs(oz);
 if(gapX>=-1e-9&&gapZ>=-1e-9){
  const nearest=Math.min(gapX,gapZ),faces:{nx:number;nz:number}[]=[];
  if(gapX<=nearest+1e-8)faces.push({nx:Math.sign(ox)||Math.sign(dx)||1,nz:0});
  if(gapZ<=nearest+1e-8)faces.push({nx:0,nz:Math.sign(oz)||Math.sign(dz)||1});
  if(faces.some(n=>dx*n.nx+dz*n.nz>=-1e-10))return null;
  const nx=faces.reduce((v,n)=>v+n.nx,0),nz=faces.reduce((v,n)=>v+n.nz,0),length=Math.hypot(nx,nz);
  return {t:0,nx:nx/length,nz:nz/length};
 }
 let near=0,far=1,nx=0,nz=0;
 for(const [origin,delta,half,axis] of [[ox,dx,hx,'x'],[oz,dz,hz,'z']] as const){
  if(Math.abs(delta)<1e-12){if(Math.abs(origin)>half)return null;continue;}
  const a=(-half-origin)/delta,c=(half-origin)/delta,entry=Math.min(a,c),exit=Math.max(a,c),normal=-Math.sign(delta);
  if(entry>near+1e-10){near=entry;nx=axis==='x'?normal:0;nz=axis==='z'?normal:0;}
  else if(Math.abs(entry-near)<=1e-10){if(axis==='x')nx=normal;else nz=normal;}
  far=Math.min(far,exit);if(near>far)return null;
 }
 if(near<0||near>1||far<0)return null;
 const length=Math.hypot(nx,nz);return length?{t:near,nx:nx/length,nz:nz/length}:null;
}

export function rotatedBuildingMotionContact(from:Vec,to:Vec,b:{x:number;z:number;width:number;depth:number;yaw:number},padding=0){
 const c=Math.cos(b.yaw),s=Math.sin(b.yaw),local=(point:Vec)=>({x:c*(point.x-b.x)-s*(point.z-b.z),z:s*(point.x-b.x)+c*(point.z-b.z)});
 const hit=buildingMotionContact(local(from),local(to),{x:0,z:0,width:b.width,depth:b.depth},padding);
 return hit?{...hit,nx:c*hit.nx+s*hit.nz,nz:-s*hit.nx+c*hit.nz}:null;
}
