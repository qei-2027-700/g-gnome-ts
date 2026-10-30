import type {Vec} from './simulation.ts';
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
