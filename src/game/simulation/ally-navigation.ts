import {crossesBuilding,sweptCircle} from './battlefield.ts';
import type {Vec} from './simulation.ts';
export type NavigationArea={halfWidth:number;minZ:number;maxZ:number};
export type NavigationCircle=Vec&{r:number};
export type NavigationBox=Vec&{width:number;depth:number;yaw?:number};
const dist=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.z-b.z);
const local=(point:Vec,box:NavigationBox)=>{const c=Math.cos(box.yaw??0),s=Math.sin(box.yaw??0),x=point.x-box.x,z=point.z-box.z;return {x:c*x-s*z,z:s*x+c*z};};
const world=(x:number,z:number,box:NavigationBox)=>{const c=Math.cos(box.yaw??0),s=Math.sin(box.yaw??0);return {x:box.x+c*x+s*z,z:box.z-s*x+c*z};};
// Short visibility routes around expanded obstacles. Margins are prototype navigation values.
export function allyRoute(from:Vec,goal:Vec,area:NavigationArea,circles:NavigationCircle[],boxes:NavigationBox[]):Vec[]|null{
 const inside=(p:Vec)=>Math.abs(p.x)<=area.halfWidth&&p.z>=area.minZ&&p.z<=area.maxZ;
 const boundedBoxes=boxes.map(box=>({box,reach:Math.hypot(box.width,box.depth)/2}));
 const clear=(a:Vec,b:Vec)=>inside(b)&&!boundedBoxes.some(({box,reach})=>{
  if(Math.max(a.x,b.x)<box.x-reach||Math.min(a.x,b.x)>box.x+reach||Math.max(a.z,b.z)<box.z-reach||Math.min(a.z,b.z)>box.z+reach)return false;
  const start=local(a,box),end=local(b,box),bounds={x:0,z:0,width:box.width,depth:box.depth};
  if(!crossesBuilding(start,end,bounds))return false;
  // A chassis already against a wall may leave the extra planning margin.
  const inMargin=Math.abs(start.x)<box.width/2&&Math.abs(start.z)<box.depth/2;
  return !inMargin||crossesBuilding(start,end,{...bounds,width:box.width-2,depth:box.depth-2});
 })&&!circles.some(c=>{
  if(dist(a,c)<c.r-.01){const dx=b.x-a.x,dz=b.z-a.z;return (a.x-c.x)*dx+(a.z-c.z)*dz<0;}
  return sweptCircle(a,b,c,c.r);
 });
 if(!inside(goal))return null;if(clear(from,goal))return [{...goal}];
 const nodes:Vec[]=[{...from},{...goal}],usable=(p:Vec)=>inside(p)&&!boxes.some(b=>{const q=local(p,b);return Math.abs(q.x)<b.width/2&&Math.abs(q.z)<b.depth/2;})&&!circles.some(c=>dist(p,c)<c.r);
 for(const circle of circles)for(let i=0;i<12;i++){const angle=i*Math.PI/6,r=(circle.r+.4)/Math.cos(Math.PI/12),point={x:circle.x+Math.sin(angle)*r,z:circle.z+Math.cos(angle)*r};if(usable(point))nodes.push(point);}
 for(const b of boxes)for(const x of [-1,1])for(const z of [-1,1]){const point=world(x*(b.width/2+.5),z*(b.depth/2+.5),b);if(usable(point))nodes.push(point);}
 const costs=nodes.map(()=>Infinity),previous=nodes.map(()=>-1),visited=new Set<number>();costs[0]=0;
 for(let step=0;step<nodes.length;step++){
  let current=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(current<0||costs[i]+dist(nodes[i],goal)<costs[current]+dist(nodes[current],goal)))current=i;
  if(current<0||!Number.isFinite(costs[current]))break;
  if(current===1){const route:Vec[]=[];for(let i=1;i!==0;i=previous[i])route.unshift(nodes[i]);return route;}
  visited.add(current);
  for(let next=0;next<nodes.length;next++){if(visited.has(next))continue;const cost=costs[current]+dist(nodes[current],nodes[next]);if(cost<costs[next]&&clear(nodes[current],nodes[next])){costs[next]=cost;previous[next]=current;}}
 }
 return null;
}
