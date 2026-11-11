import type {Cliff,Terrain} from './types.ts';

// Source: assets/map/3-2/3-2map.png, map crop x=50..409, y=58..409.
// Bright green slopes are sampled in 8px cells. Scale and passability are provisional.
const MAP_ROWS=[
 '.............................................',
 '..............#....................#.........',
 '............########.........##....##........',
 '......####..#########.##....#########........',
 '.....#############.######.####.####.#####....',
 '......##..#####.##.##########.######.###.....',
 '.......##.#.##.#################.####.####...',
 '......##.############..#######.....#######...',
 '......######..##............#.......##..#....',
 '.......######.##....................#........',
 '......#####..................................',
 '.......####...........##.....##..............',
 '.......#####....##########..####......#......',
 '.......######..#######.####.##.###...##......',
 '........##.#...#.##########..######.#####....',
 '......#####....###.......##...###.########...',
 '....####.##....########..###....#.###...###..',
 '.....#######...########...###..####.#####.##.',
 '.....####.........#####...###.....#########..',
 '.....####....####..###...###......##....##...',
 '..######....###########..####................',
 '...##..#....#########.....#.#..##............',
 '...##..###...##...###....##...###............',
 '...#######........###.....#####.####.........',
 '....####.#................#######.#.#........',
 '........##......#..........##..######........',
 '................##.#............###..........',
 '....####....##.######........................',
 '....####...##.######.........................',
 '...##.##...#####.###.........................',
 '....##.##...#....##..##.#....................',
 '....####.............#####.###.###...........',
 '...###.##...........#####..#######...........',
 '..###..###......#...###...#######............',
 '...######....#####..##....##..####...........',
 '....###.....####.#..##...###.#####...........',
 '.....###...##..#.#####....#######............',
 '.....###.........##..##....#.##..............',
 '..................#####....#.#...............',
 '.................#####....####...............',
 '........####......##......###................',
 '........#####................................',
 '.......######................................',
 '.......###.##................................',
] as const;
export const MAP_3_2_SOURCE={x:50,y:58,width:360,height:352,step:8,metersPerPixel:8} as const;
export const map32PixelToWorld=(px:number,py:number)=>({x:(px-230)*8,z:(232-py)*8});
export const MAP_3_2_POINTS={start:map32PixelToWorld(335,118),thaneStart:map32PixelToWorld(328,125),waypoint1:map32PixelToWorld(146,133),commArray:map32PixelToWorld(248,200),waypoint2:map32PixelToWorld(248,213),waypoint3:map32PixelToWorld(132,398)} as const;

function marker(px:number,py:number){return Math.hypot(px-132,py-398)<18||Math.hypot(px-328,py-123)<13||Math.hypot(px-146,py-133)<11||Math.hypot(px-248,py-200)<8||Math.hypot(px-248,py-213)<8;}
function tracedCliffs():Cliff[]{
 const active=new Map<string,{left:number;right:number;top:number}>(),cliffs:Cliff[]=[];
 const finish=(run:{left:number;right:number;top:number},bottom:number)=>{
  const left=50+run.left*8,right=50+run.right*8,top=58+run.top*8,low=58+bottom*8;
  const center=map32PixelToWorld((left+right)/2,(top+low)/2);
  cliffs.push({id:`3-2-slope-${cliffs.length+1}`,...center,width:(right-left)*8,depth:(low-top)*8,height:75,surface:'slope'});
 };
 for(let row=0;row<=MAP_ROWS.length;row++){
  const line=MAP_ROWS[row],runs=new Set<string>();
  if(line)for(let col=0;col<line.length;){
   const isSlope=(index:number)=>line[index]==='#'&&!marker(50+(index+.5)*8,58+(row+.5)*8);
   if(!isSlope(col)){col++;continue;}
   let right=col+1;while(right<line.length&&isSlope(right))right++;
   const key=`${col}:${right}`;runs.add(key);
   if(!active.has(key))active.set(key,{left:col,right,top:row});
   col=right;
  }
  for(const [key,run] of active)if(!runs.has(key)){finish(run,row);active.delete(key);}
 }
 return cliffs;
}
export const MISSION_3_2_TERRAIN:Terrain={biome:'grassland',weather:'clear',ridgeStyle:'rocky',grassTexture:true,rockySlopeTexture:true,halfWidth:1600,minZ:-1600,maxZ:1600,ridgeHeight:100,ridgeVariation:20,seed:32,cliffs:tracedCliffs()};
