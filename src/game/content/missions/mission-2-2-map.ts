import type {Cliff,Terrain} from './types.ts';

// Source: assets/map/2-2/2-2map.png. The sampled area is x=228..580, y=68..420.
// Each symbol represents a 16 px square: # is a bright crest, + is its surrounding slope.
// The map has no scale or compass. Four metres per pixel is provisional.
// The yellow X is used as the start, with the numbered locations to its west.
const MAP_ROWS=[
 '......................',
 '...##+................',
 '+#.###..#.............',
 '++.###............+...',
 '++.+++.....++....+#...',
 '#+........###++...##+.',
 '++#.......+###+++.+#+.',
 '+#.........#####+..#+.',
 '.#.........+####+.+##.',
 '.#..+.........++...++.',
 '+#..##................',
 '+#..##..........#.....',
 '+#..++............+++.',
 '+#..++..........+++++.',
 '.#+++..........+++##+.',
 '.###+.........++####+.',
 '.++#+....+#++++++.....',
 '..++#...+#######+.....',
 '...+#...+.............',
 '....#+.+#.............',
 '........+.............',
 '......................',
] as const;
const CRISC_PATH=[[356,245],[370,245],[380,247],[390,265],[403,285],[420,290],[438,278],[456,289],[475,275],[492,250],[515,245],[540,242],[572,240]] as const;
const SPRING_PATH=[[348,70],[349,110],[350,145],[350,180],[346,213],[346,245],[350,278],[350,310],[332,340],[330,375],[327,402]] as const;
function nearChannel(px:number,py:number,path:readonly (readonly [number,number])[]){
 for(let i=1;i<path.length;i++){
  const [ax,ay]=path[i-1]!,[bx,by]=path[i]!,dx=bx-ax,dy=by-ay;
  const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));
  if(Math.hypot(px-ax-t*dx,py-ay-t*dy)<12)return true;
 }
 return false;
}

export const MAP_2_2_SOURCE={x:228,y:68,width:352,height:352,step:16,metersPerPixel:4} as const;
export const map22PixelToWorld=(px:number,py:number)=>({x:(px-514)*4,z:(193-py)*4});
export const MAP_2_2_POINTS={
 player:map22PixelToWorld(514,193),
 kylie:map22PixelToWorld(526,201),
 waypoint1:map22PixelToWorld(344,213),
 waypoint2:map22PixelToWorld(280,245),
 waypoint3:map22PixelToWorld(260,211),
 westSentry:map22PixelToWorld(300,255),
 westRocket:map22PixelToWorld(285,275),
 bridgeReinforcement:map22PixelToWorld(330,185),
 southSentry:map22PixelToWorld(470,310),
 southCruiser:map22PixelToWorld(425,330),
 bridgeControlA:map22PixelToWorld(366,205),
 bridgeControlB:map22PixelToWorld(383,213),
 northGuardTower:map22PixelToWorld(365,228),
 latlon:map22PixelToWorld(248,191),
 latlonAssault:map22PixelToWorld(272,183),
 latlonAsv:map22PixelToWorld(288,200),
} as const;

type Run={left:number;right:number;top:number};
function tracedSlopes():Cliff[]{
 const active=new Map<string,Run>(),slopes:Cliff[]=[];
 const clearings=[MAP_2_2_POINTS.player,MAP_2_2_POINTS.kylie,MAP_2_2_POINTS.waypoint1,MAP_2_2_POINTS.waypoint2,MAP_2_2_POINTS.waypoint3,MAP_2_2_POINTS.southSentry,MAP_2_2_POINTS.southCruiser,MAP_2_2_POINTS.westSentry,MAP_2_2_POINTS.westRocket,MAP_2_2_POINTS.bridgeReinforcement,MAP_2_2_POINTS.bridgeControlA,MAP_2_2_POINTS.bridgeControlB,MAP_2_2_POINTS.northGuardTower,MAP_2_2_POINTS.latlon,MAP_2_2_POINTS.latlonAssault,MAP_2_2_POINTS.latlonAsv];
 const finish=(run:Run,bottom:number)=>{
  const left=MAP_2_2_SOURCE.x+run.left*16,right=MAP_2_2_SOURCE.x+run.right*16;
  const top=MAP_2_2_SOURCE.y+run.top*16,low=MAP_2_2_SOURCE.y+bottom*16;
  slopes.push({id:`2-2-slope-${slopes.length+1}`,...map22PixelToWorld((left+right)/2,(top+low)/2),width:(right-left)*4,depth:(low-top)*4,height:75,surface:'slope'});
 };
 for(let row=0;row<=MAP_ROWS.length;row++){
  const source=MAP_ROWS[row],line=source&&[...source].map((cell,col)=>{
   const px=MAP_2_2_SOURCE.x+(col+.5)*16,py=MAP_2_2_SOURCE.y+(row+.5)*16,point=map22PixelToWorld(px,py);
   return clearings.some(clear=>Math.hypot(point.x-clear.x,point.z-clear.z)<60)||nearChannel(px,py,CRISC_PATH)||nearChannel(px,py,SPRING_PATH)?'.':cell;
  }).join(''),runs=new Set<string>();
  if(line)for(let col=0;col<line.length;){
   if(line[col]==='.'){col++;continue;}
   let right=col+1;while(right<line.length&&line[right]!=='.')right++;
   const key=`${col}:${right}`;runs.add(key);
   if(!active.has(key))active.set(key,{left:col,right,top:row});
   col=right;
  }
  for(const [key,run] of active)if(!runs.has(key)){finish(run,row);active.delete(key);}
 }
 return slopes;
}

export const MISSION_2_2_TERRAIN:Terrain={
 biome:'snow',weather:'overcast',ridgeStyle:'rocky',halfWidth:1200,minZ:-930,maxZ:540,ridgeHeight:120,ridgeVariation:50,seed:22,
 river:{bridgeId:'crisc-bridge',...map22PixelToWorld(390,247),width:32,length:840,bridgeZ:map22PixelToWorld(390,247).z,bridgeWidth:48,path:CRISC_PATH.map(([x,y])=>map22PixelToWorld(x,y))},
 rivers:[{bridgeId:'spring-bridge',...map22PixelToWorld(346,213),width:30,length:1300,bridgeZ:map22PixelToWorld(346,213).z,bridgeWidth:22,path:SPRING_PATH.map(([x,y])=>map22PixelToWorld(x,y))}],
 cliffs:tracedSlopes(),
};
