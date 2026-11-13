import type {Cliff,Terrain} from './types.ts';

// Source: assets/map/3-1/3-1 map.png, pixels x=18..377 and y=38..389.
// Each cell is 8x8 pixels. # is a pale yellow-green band cell that contains no
// dark-ground pixel four or more pixels from a band, the river, or the crop edge.
// Dots keep the black walkable ground. Marker disks, the frame, and the vehicle
// panel are not painted. The 5 m/px scale is provisional for this map alone.
const MAP_ROWS=[
 '.............................................',
 '.............................................',
 '...................................#####.....',
 '............................##.....###..##...',
 '............................##.....##...###..',
 '.........................#####..##.......#...',
 '.........................########........#...',
 '.........................................#...',
 '......................................####...',
 '.......................................####..',
 '..................................#....##....',
 '...................#..####....#..##...####...',
 '...................#..#############..#####...',
 '.............#.....#..#######...........#....',
 '.............#######..##..###................',
 '...............#####.......###...............',
 '................#..........##................',
 '............................#................',
 '.............................................',
 '..............#............#.............#...',
 '.............##............#..#.......####...',
 '..............##............####.#....####...',
 '...............###.###..........##......##...',
 '............#.......###..........##......#...',
 '...........##......####..........#.......##..',
 '............#####.#..#.......####.......###..',
 '...............#...............#.........#...',
 '.........................................##..',
 '........................................##...',
 '............##...##................##..###...',
 '...........###########......###############..',
 '................#######....####..............',
 '.................#..###....###...............',
 '.....................##....###...............',
 '.....................###......##.............',
 '....................###.......#....####......',
 '....................###......................',
 '.....................##......................',
 '....................#####....................',
 '.......................#####.................',
 '........................####.....#....##.....',
 '.........................####.#.#########....',
 '..........................###..#..###........',
 '.............................................',
] as const;

export const MAP_3_1_SOURCE={x:18,y:38,width:360,height:352,step:8,metersPerPixel:5} as const;
export const map31PixelToWorld=(px:number,py:number)=>({x:(px-198)*MAP_3_1_SOURCE.metersPerPixel,z:(214-py)*MAP_3_1_SOURCE.metersPerPixel});
export const MAP_3_1_POINTS={
 // Due east of waypoint 1, closer to the recon ASV than the first inset. Not a traced start symbol.
 playerStart:map31PixelToWorld(264,108),
 waypoint1:map31PixelToWorld(165,108),
 waypoint2:map31PixelToWorld(116,176),
 southeastReach:map31PixelToWorld(360,378),
 // Dark ground just east of the green 1. The digit itself is not ground.
 reconAsv:map31PixelToWorld(180,108),
 // Open ground near the center of the field. Not a traced tower symbol.
 plazaRocket:map31PixelToWorld(195,197),
 // Dark ground west of the rocket, on the waypoint-2 side. Not traced vehicle symbols.
 plazaScorpAssault:map31PixelToWorld(168,185),
 plazaScorpSentry:map31PixelToWorld(174,197),
 plazaScorpTactical:map31PixelToWorld(168,209),
 // Dark ground east of the rocket. Not traced vehicle symbols.
 plazaUnionTactical:map31PixelToWorld(228,185),
 plazaUnionSentry:map31PixelToWorld(228,197),
 plazaUnionAsv:map31PixelToWorld(228,209),
 // Dark ground southeast of the green ring at (281, 339). Not traced facility symbols.
 borderCommand:map31PixelToWorld(300,360),
 borderPower:map31PixelToWorld(312,360),
 borderMesonNorth:map31PixelToWorld(300,348),
 borderMesonEast:map31PixelToWorld(324,348),
 borderMesonSouth:map31PixelToWorld(300,384),
 borderSentryWest:map31PixelToWorld(292,352),
 borderSentrySouth:map31PixelToWorld(312,384),
} as const;

// Row-wise center of the blue channel. The width below is the median width of the
// south-flowing run, not the longer spans where the channel crosses a row sideways.
const RIVER_PIXELS=[[196.0,56],[198.0,66],[197.5,76],[178.5,86],[153.5,96],[149.5,106],[152.5,116],[144.0,126],[112.5,136],[105.5,146],[76.5,156],[69.0,166],[66.5,176],[67.0,186],[71.5,196],[68.5,206],[65.0,216],[71.5,226],[67.0,236],[69.5,246],[73.0,256],[86.0,266],[93.5,276],[89.0,286],[90.0,296],[86.5,306],[90.0,310]] as const;
const riverPath=RIVER_PIXELS.map(([px,py])=>map31PixelToWorld(px,py));
const riverLength=riverPath.slice(1).reduce((total,point,index)=>total+Math.hypot(point.x-riverPath[index]!.x,point.z-riverPath[index]!.z),0);

type Run={left:number;right:number;top:number};
function tracedSlopes():Cliff[]{
 const active=new Map<string,Run>(),slopes:Cliff[]=[];
 const finish=(run:Run,bottom:number)=>{
  const left=MAP_3_1_SOURCE.x+run.left*MAP_3_1_SOURCE.step,right=MAP_3_1_SOURCE.x+run.right*MAP_3_1_SOURCE.step;
  const top=MAP_3_1_SOURCE.y+run.top*MAP_3_1_SOURCE.step,low=MAP_3_1_SOURCE.y+bottom*MAP_3_1_SOURCE.step;
  const center=map31PixelToWorld((left+right)/2,(top+low)/2);
  slopes.push({id:`3-1-slope-${slopes.length+1}`,...center,width:(right-left)*MAP_3_1_SOURCE.metersPerPixel,depth:(low-top)*MAP_3_1_SOURCE.metersPerPixel,height:64,surface:'slope'});
 };
 for(let row=0;row<=MAP_ROWS.length;row++){
  const line=MAP_ROWS[row],runs=new Set<string>();
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

const channel=map31PixelToWorld(66.5,176);
export const MISSION_3_1_TERRAIN:Terrain={
 biome:'grassland',weather:'clear',ridgeStyle:'rocky',grassTexture:true,rockySlopeTexture:true,
 halfWidth:960,minZ:-960,maxZ:960,ridgeHeight:64,ridgeVariation:0,seed:31,
 cliffs:tracedSlopes(),
 river:{bridgeId:'3-1-water',x:channel.x,z:channel.z,width:8*MAP_3_1_SOURCE.metersPerPixel,length:riverLength,bridgeZ:channel.z,bridgeWidth:0,path:riverPath},
};
