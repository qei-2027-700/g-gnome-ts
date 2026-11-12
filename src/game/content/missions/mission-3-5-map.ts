import type {Cliff,Terrain} from './types.ts';

// Source: assets/map/3-5/sc- 2026-11-12 0.42.40.png, pixels 232..583, 68..419.
// Each cell samples 8x8 pixels. # follows the bright green bands; dots preserve
// the black walkable ground specified by the user. Heights and scale are provisional.
// The waypoint marker is omitted from the slope mask.
const MAP_ROWS=[
 '............................................',
 '.............#..............................',
 '.......###.#####............................',
 '.......############.........................',
 '......######..#####..............###.###....',
 '.......#####....###......#####...#######....',
 '..........###...###.....################....',
 '...........##..###.....############.####....',
 '...........######......####...##########....',
 '............##.###.#...####...#######.......',
 '.........####.####.....##############.......',
 '.......#####.####........###########........',
 '......##########........####....####........',
 '......##########........####.....###........',
 '.......#####.#.........######.....#.........',
 '.......####............######...............',
 '.......#####.........#######................',
 '....########.......#########................',
 '...#########......##########................',
 '..##########......##########................',
 '..###..##........#######....................',
 '..###.###.......#######.....................',
 '...#####........######......................',
 '....####......####.###......................',
 '....####......###.###.......................',
 '...####.......###.###..............##.......',
 '...###.........######......#......###.......',
 '...####.......#######.....####.######.......',
 '...####........#########.############.......',
 '..#####..........#####################......',
 '..######..............#####..#...#######....',
 '..#######..............##........########...',
 '..###########....................###.#####..',
 '........#######..................###....##..',
 '.........######.###......###.....#########..',
 '.........##..################......#######..',
 '.........#####################........###...',
 '..........#########......#####........###...',
 '...........####..........#####.......#####..',
 '............#.............#####......######.',
 '..........................########..###.###.',
 '............................##############..',
 '............................#############...',
 '.............................#..............',
] as const;

export const MAP_3_5_SOURCE={x:232,y:68,width:352,height:352,step:8,metersPerPixel:4} as const;
export const map35PixelToWorld=(px:number,py:number)=>({x:(px-408)*MAP_3_5_SOURCE.metersPerPixel,z:(244-py)*MAP_3_5_SOURCE.metersPerPixel});
export const MAP_3_5_POINTS={
 playerStart:map35PixelToWorld(434,77),
 kylieStart:map35PixelToWorld(423,83),
 thaneStart:map35PixelToWorld(445,85),
 sheridanStart:map35PixelToWorld(434,95),
 waypoint1:map35PixelToWorld(491,362),
 laboratory:map35PixelToWorld(500,373),
 approachTd:map35PixelToWorld(396,112),
 firstRocketTower:map35PixelToWorld(380,152),
 popupControl:map35PixelToWorld(312,248),
 popupTurret1:map35PixelToWorld(352,224),
 popupTurret2:map35PixelToWorld(352,240),
 popupTurret3:map35PixelToWorld(328,232),
 popupTurret4:map35PixelToWorld(336,264),
 popupTurret5:map35PixelToWorld(304,264),
 secondRocketTower:map35PixelToWorld(332,304),
 secondLineAipWest:map35PixelToWorld(304,304),
 secondLineAipEast:map35PixelToWorld(360,320),
 leftMesonTower:map35PixelToWorld(392,336),
 leftApproachAsv:map35PixelToWorld(424,336),
 laboratoryMesonTower:map35PixelToWorld(484,344),
 powerPlant:map35PixelToWorld(516,372),
} as const;

// Playability adjustment: widen the bends leading to the two rocket towers.
// The original image stays unchanged in the briefing; this is a provisional field mask.
const ROCKET_APPROACH=[{x:396,y:112},{x:384,y:152},{x:356,y:192},{x:344,y:232},{x:332,y:272},{x:332,y:304}] as const;
function widenedRocketApproach(px:number,py:number){
 for(let i=1;i<ROCKET_APPROACH.length;i++){
  const a=ROCKET_APPROACH[i-1]!,b=ROCKET_APPROACH[i]!,dx=b.x-a.x,dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((px-a.x)*dx+(py-a.y)*dy)/(dx*dx+dy*dy)));
  if(Math.hypot(px-a.x-t*dx,py-a.y-t*dy)<=18)return true;
 }
 return false;
}

type Run={left:number;right:number;top:number};
function tracedSlopes():Cliff[]{
 const active=new Map<string,Run>(),slopes:Cliff[]=[];
 const finish=(run:Run,bottom:number)=>{
  const left=MAP_3_5_SOURCE.x+run.left*8,right=MAP_3_5_SOURCE.x+run.right*8;
  const top=MAP_3_5_SOURCE.y+run.top*8,low=MAP_3_5_SOURCE.y+bottom*8;
  const center=map35PixelToWorld((left+right)/2,(top+low)/2);
  slopes.push({id:`3-5-slope-${slopes.length+1}`,...center,width:(right-left)*4,depth:(low-top)*4,height:64,surface:'slope'});
 };
 for(let row=0;row<=MAP_ROWS.length;row++){
  const source=MAP_ROWS[row],line=source&&[...source].map((cell,col)=>widenedRocketApproach(MAP_3_5_SOURCE.x+(col+.5)*8,MAP_3_5_SOURCE.y+(row+.5)*8)?'.':cell).join(''),runs=new Set<string>();
  if(line)for(let col=0;col<line.length;){
   if(line[col]!=='#'){col++;continue;}
   let right=col+1;while(line[right]==='#')right++;
   const key=`${col}:${right}`;runs.add(key);
   if(!active.has(key))active.set(key,{left:col,right,top:row});
   col=right;
  }
  for(const [key,run] of active)if(!runs.has(key)){finish(run,row);active.delete(key);}
 }
 return slopes;
}

export const MISSION_3_5_TERRAIN:Terrain={
 biome:'grassland',weather:'overcast',ridgeStyle:'rocky',grassTexture:true,rockySlopeTexture:true,
 halfWidth:736,minZ:-736,maxZ:736,ridgeHeight:85,ridgeVariation:18,seed:35,
 cliffs:tracedSlopes(),
};
