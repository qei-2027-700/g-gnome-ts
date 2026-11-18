import type {Cliff,Terrain} from './types.ts';

// Source: assets/map/3-3/3-3map.png, source pixels x=30..370, y=40..380.
// Bright green mountain cells sampled on a 10px grid; scale and passability are provisional.
// The start marker and the base compound are cleared for the known starting and facility layout.
const MAP_ROWS=[
 '..................................',
 '..#.#....##..........#............',
 '.##########..##.....##....####....',
 '.##..######..##.....####..####....',
 '.##.###########.###.##.####..##...',
 '.##.##..#.###.######...##..###....',
 '..###.....##....######..##..##....',
 '..###.....################..##....',
 '..###.........###..#.###.###.##...',
 '.####.................#..######...',
 '.####.###..................####...',
 '.###########................###...',
 '.#######...##..............#####..',
 '...#######.#................####..',
 '....##...######...............##..',
 '.........######...............###.',
 '.........##...#......#......#.###.',
 '.........####.###...#####...#####.',
 '..........#####.#...#####...#.#.##',
 '......##.....####...#...#..##..#.#',
 '.....######.#####...#####..##.###.',
 '.....###########....##.#....#.#...',
 '...#####.#####.....###.#....###...',
 '...#####....#.....###..#.....####.',
 '..................###.###....####.',
 '..............##.###...##....###..',
 '.............##.##.#...##....####.',
 '...#.......###...###..##.##....##.',
 '...#......##..#.####..##.##....###',
 '...####.##...####.....##..##......',
 '.....######..#........###.##......',
 '.....####.###...........###.......',
 '............##............#.......',
 '..................................',
] as const;
export const map33PixelToWorld=(px:number,py:number)=>({x:(px-284)/.21,z:(271-py)/.21});
function tracedCliffs():Cliff[]{
 const active=new Map<string,{left:number;right:number;top:number}>(),cliffs:Cliff[]=[];
 const finish=(run:{left:number;right:number;top:number},bottom:number)=>{
  const left=30+run.left*10,right=30+run.right*10,top=40+run.top*10,low=40+bottom*10;
  const marker=left<=265&&right>265&&top<=265&&low>265;
  cliffs.push({id:marker?'start-left-cliff':`3-3-slope-${cliffs.length+1}`,...map33PixelToWorld((left+right)/2,(top+low)/2),width:(right-left)/.21,depth:(low-top)/.21,height:70,surface:'slope'});
 };
 for(let row=0;row<=MAP_ROWS.length;row++){
  const line=MAP_ROWS[row],runs=new Set<string>();
  if(line)for(let col=0;col<line.length;){
   if(line[col]!== '#'){col++;continue;}
   let right=col+1;while(right<line.length&&line[right]==='#')right++;
   const key=`${col}:${right}`;runs.add(key);
   if(!active.has(key))active.set(key,{left:col,right,top:row});
   col=right;
  }
  for(const [key,run] of active)if(!runs.has(key)){finish(run,row);active.delete(key);}
 }
 return cliffs;
}
export const MISSION_3_3_TERRAIN:Terrain={
 weather:'overcast',ridgeStyle:'rocky',biome:'grassland',rockySlopeTexture:true,
 halfWidth:1300,minZ:-550,maxZ:1200,ridgeHeight:150,ridgeVariation:24,seed:3,
 cliffs:[...tracedCliffs(),{id:'base-north-ridge',x:-905,z:95,width:320,depth:100,height:70},{id:'base-south-ridge',x:-905,z:-305,width:320,depth:70,height:70}],
 peaks:[{x:250,z:650,width:400,depth:330,height:270},{x:-260,z:700,width:340,depth:340,height:170}],
};
