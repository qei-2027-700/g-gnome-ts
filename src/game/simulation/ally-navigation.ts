import {crossesBuilding,sweptCircle} from './battlefield.ts';
import type {Vec} from './simulation.ts';
export type NavigationArea={halfWidth:number;minZ:number;maxZ:number};
export type NavigationCircle=Vec&{r:number};
export type NavigationBox=Vec&{width:number;depth:number;yaw?:number};
const dist=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.z-b.z);
const CELL=110,LOCAL_REACH=220;
// Short visibility routes around expanded obstacles. Margins are prototype navigation values.
// Corners only link to nearby corners. A complete graph over a dense ridge field spends
// longer than a frame on one search. The mover can still see every corner, and every corner can see the goal.
export function allyRoute(from:Vec,goal:Vec,area:NavigationArea,circles:NavigationCircle[],boxes:NavigationBox[]):Vec[]|null{
 const inside=(p:Vec)=>Math.abs(p.x)<=area.halfWidth&&p.z>=area.minZ&&p.z<=area.maxZ;
 const prepared=boxes.map(box=>{const yaw=box.yaw??0,c=Math.cos(yaw),s=Math.sin(yaw);return {box,c,s,reach:Math.hypot(box.width,box.depth)/2,hw:box.width/2,hd:box.depth/2};});
 const localOf=(point:Vec,item:(typeof prepared)[number])=>{const x=point.x-item.box.x,z=point.z-item.box.z;return {x:item.c*x-item.s*z,z:item.s*x+item.c*z};};
 const place=(x:number,z:number,item:(typeof prepared)[number])=>({x:item.box.x+item.c*x+item.s*z,z:item.box.z-item.s*x+item.c*z});
 const contains=(p:Vec,item:(typeof prepared)[number])=>{const dx=p.x-item.box.x,dz=p.z-item.box.z;if(item.s===0)return Math.abs(dx)<item.hw&&Math.abs(dz)<item.hd;if(Math.abs(dx)>item.reach||Math.abs(dz)>item.reach)return false;const q=localOf(p,item);return Math.abs(q.x)<item.hw&&Math.abs(q.z)<item.hd;};
 const hits=(a:Vec,b:Vec,item:(typeof prepared)[number])=>{
  const {box,reach}=item;if(Math.max(a.x,b.x)<box.x-reach||Math.min(a.x,b.x)>box.x+reach||Math.max(a.z,b.z)<box.z-reach||Math.min(a.z,b.z)>box.z+reach)return false;
  const start=localOf(a,item),end=localOf(b,item),bounds={x:0,z:0,width:box.width,depth:box.depth};
  if(!crossesBuilding(start,end,bounds))return false;
  // A chassis already against a wall may leave the extra planning margin.
  const inMargin=Math.abs(start.x)<box.width/2&&Math.abs(start.z)<box.depth/2;
  return !inMargin||crossesBuilding(start,end,{...bounds,width:box.width-2,depth:box.depth-2});
 };
 const clear=(a:Vec,b:Vec)=>inside(b)&&!prepared.some(item=>hits(a,b,item))&&!circles.some(circle=>{
  if(dist(a,circle)<circle.r-.01){const dx=b.x-a.x,dz=b.z-a.z;return (a.x-circle.x)*dx+(a.z-circle.z)*dz<0;}
  return sweptCircle(a,b,circle,circle.r);
 });
 if(!inside(goal))return null;if(clear(from,goal))return [{...goal}];
 const nodes:Vec[]=[{...from},{...goal}],groups:number[][]=[];
 const usable=(p:Vec)=>inside(p)&&!prepared.some(item=>contains(p,item))&&!circles.some(circle=>dist(p,circle)<circle.r);
 for(const circle of circles)for(let i=0;i<12;i++){const angle=i*Math.PI/6,r=(circle.r+.4)/Math.cos(Math.PI/12),point={x:circle.x+Math.sin(angle)*r,z:circle.z+Math.cos(angle)*r};if(usable(point))nodes.push(point);}
 for(const item of prepared){const group:number[]=[];for(const x of [-1,1])for(const z of [-1,1]){const point=place(x*(item.hw+.5),z*(item.hd+.5),item);if(!usable(point))continue;group.push(nodes.length);nodes.push(point);}if(group.length>1)groups.push(group);}
 const bucket=new Map<number,number[]>(),cellOf=(p:Vec)=>Math.floor(p.x/CELL)*100000+Math.floor(p.z/CELL);
 for(let i=2;i<nodes.length;i++){const key=cellOf(nodes[i]),list=bucket.get(key);if(list)list.push(i);else bucket.set(key,[i]);}
 const neighbors=nodes.map(()=>[] as number[]),seen=nodes.map(()=>new Set<number>());
 const link=(i:number,j:number)=>{if(i===j||seen[i].has(j))return;seen[i].add(j);seen[j].add(i);neighbors[i].push(j);neighbors[j].push(i);};
 const span=Math.ceil(LOCAL_REACH/CELL);
 for(let i=2;i<nodes.length;i++){const cx=Math.floor(nodes[i].x/CELL),cz=Math.floor(nodes[i].z/CELL);for(let dx=-span;dx<=span;dx++)for(let dz=-span;dz<=span;dz++){const list=bucket.get((cx+dx)*100000+(cz+dz));if(!list)continue;for(const j of list)if(j>i&&dist(nodes[i],nodes[j])<=LOCAL_REACH)link(i,j);}}
 for(const group of groups)for(let a=0;a<group.length;a++)for(let b=a+1;b<group.length;b++)link(group[a],group[b]);
 for(let i=2;i<nodes.length;i++)link(0,i);
 const costs=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),visited=new Uint8Array(nodes.length);costs[0]=0;
 for(let step=0;step<nodes.length;step++){
  let current=-1;for(let i=0;i<nodes.length;i++)if(!visited[i]&&(current<0||costs[i]+dist(nodes[i],goal)<costs[current]+dist(nodes[current],goal)))current=i;
  if(current<0||!Number.isFinite(costs[current]))break;
  if(current===1){const route:Vec[]=[];for(let i=1;i!==0;i=previous[i])route.unshift(nodes[i]);return route;}
  visited[current]=1;
  for(const next of neighbors[current]){if(visited[next])continue;const cost=costs[current]+dist(nodes[current],nodes[next]);if(cost<costs[next]&&clear(nodes[current],nodes[next])){costs[next]=cost;previous[next]=current;}}
  if(!visited[1]){const cost=costs[current]+dist(nodes[current],goal);if(cost<costs[1]&&clear(nodes[current],goal)){costs[1]=cost;previous[1]=current;}}
 }
 return null;
}
