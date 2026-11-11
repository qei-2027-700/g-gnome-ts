import type {Cliff,Terrain} from './types.ts';

// The original map occupies pixels 44..395 by 58..409 of the 772x724 image.
// Each character samples an 8x8-pixel area. S: impassable slope; P: plateau;
// dots: open ground. The world scale and heights are provisional.
const MAP_ROWS=[
 '............................................',
 '............................................',
 '..PPSS......................................',
 '.PPSSS......................................',
 '..PSS.......................................',
 '...PS.......................................',
 '...PSP.............S....S...................',
 '...PSP..........SSSSSSSSS...................',
 '...PSP......S..SSSSSSSS.....................',
 '..PPSP......SSSS.SS..S......................',
 '.PSSSP......SS.SSSS........................',
 '.PSSSP...........SS..SSSSS..................',
 '.PSSSS...........SSSSSSSSS..................',
 '.PSS.S...........SSSSS.S.SS....SS...........',
 'PPS.SSS..........SS.......SSSSSSS...........',
 'SSSSSS...........SSSSSS...SSSSS.SS..........',
 'SSSSSP................SSSSSSSS...SS.........',
 'S..SSP.................SSS...SSSSSS........',
 'S..SSPP................SS.......SS..........',
 'SSSSSSP.....................................',
 'PSS.SSP.....................................',
 'PPSSSSP.........PPPPPPP......P...PP........',
 '.PPSSSP.......PPPPPPPPP......PPPPPPP........',
 '..PSSSP.......PPPPPPPP.......PPPPPP.........',
 '..PSS.........PPPPPPPP......PPPPP...........',
 '.PPS........PPPPPPPPPP.....PPPPPP...........',
 '.PSSS.......PPPP...PPP.....PPPPPP...........',
 '.PSS.......................PPPPPP...........',
 '...........................PPP.PPP..........',
 '................................PP..........',
 '................................P...........',
 '...............PPPS............PP...........',
 '...............PSSSS............P........P..',
 '...............PSS.SSP.....SS...P......PPPP.',
 '...............PPS.SPP....SSSS......SSSSSSS.',
 '................PSSSSP.....SSS....SSSSSSSSS.',
 '..............PPSSSPPPP....SSSS..SSS...SSSSS',
 '............PPPSSSS...........SSSSS......S.S',
 '............PSSSSS................SS....SS..',
 '............SS...........................S.S',
 '............SS.......SS.SSSSS...........SS.S',
 '...........SS.......SSSSSSSSSSSS.SSSS..SSSSS',
 '......PPPSSSSS....SSSSSS...SSSSSSSSSSSSSSSS.',
 '........PPSS......SS............SSSSSS..SS..',
] as const;

export const MAP_3_4_SOURCE={x:44,y:58,width:352,height:352,step:8,metersPerPixel:4} as const;
export const map34PixelToWorld=(px:number,py:number)=>({x:(px-220)*MAP_3_4_SOURCE.metersPerPixel,z:(234-py)*MAP_3_4_SOURCE.metersPerPixel});
export const MAP_3_4_POINTS={
 bridge:map34PixelToWorld(131,201),
 waypoint2:map34PixelToWorld(242,346),
 waypoint3:map34PixelToWorld(333,356),
 finalBase:map34PixelToWorld(350,369),
 playerStart:map34PixelToWorld(103,212),
 thaneStart:map34PixelToWorld(103,219),
 bridgeControl:map34PixelToWorld(111,190),
 mesonTower:map34PixelToWorld(164,201),
 kylieArrival:map34PixelToWorld(325,350),
 sheridanArrival:map34PixelToWorld(340,352),
 shieldGenerator:map34PixelToWorld(337,377),
 mineControl:map34PixelToWorld(368,374),
 rocketTower:map34PixelToWorld(358,391),
 vehicleElevator:map34PixelToWorld(345,395),
} as const;

// The low valley in the third-waypoint screenshot is driveable. The 8px source
// sampling joined several bright slopes into a continuous wall across it.
const valley=[[242,346],[294,352],[333,356],[350,369],[352,397]] as const;
function inValley(px:number,py:number){
 for(let i=1;i<valley.length;i++){
  const [ax,ay]=valley[i-1]!,[bx,by]=valley[i]!,dx=bx-ax,dy=by-ay;
  const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy)));
  if(Math.hypot(px-ax-dx*t,py-ay-dy*t)<11)return true;
 }
 return false;
}

type Run={kind:'S'|'P';left:number;right:number;top:number};
function tracedCliffs():Cliff[]{
 const active=new Map<string,Run>(),cliffs:Cliff[]=[];
 const finish=(run:Run,bottom:number)=>{
  const left=MAP_3_4_SOURCE.x+run.left*MAP_3_4_SOURCE.step;
  const right=MAP_3_4_SOURCE.x+run.right*MAP_3_4_SOURCE.step;
  const top=MAP_3_4_SOURCE.y+run.top*MAP_3_4_SOURCE.step;
  const low=MAP_3_4_SOURCE.y+bottom*MAP_3_4_SOURCE.step;
  const center=map34PixelToWorld((left+right)/2,(top+low)/2);
  const surface=run.kind==='S'?'slope':'plateau';
  cliffs.push({id:`3-4-${surface}-${cliffs.length+1}`,x:center.x,z:center.z,width:(right-left)*4,depth:(low-top)*4,height:surface==='slope'?72:42,surface});
 };
 for(let row=0;row<=MAP_ROWS.length;row++){
  const runs=new Set<string>(),line=MAP_ROWS[row];
  if(line)for(let col=0;col<line.length;){
   const px=MAP_3_4_SOURCE.x+(col+.5)*MAP_3_4_SOURCE.step;
   const py=MAP_3_4_SOURCE.y+(row+.5)*MAP_3_4_SOURCE.step;
   const kind=inValley(px,py)?'.':line[col];
   if(kind!=='S'&&kind!=='P'){col++;continue;}
   let right=col+1;while(line[right]===kind&&!inValley(MAP_3_4_SOURCE.x+(right+.5)*MAP_3_4_SOURCE.step,py))right++;
   const key=`${kind}:${col}:${right}`;runs.add(key);
   if(!active.has(key))active.set(key,{kind,left:col,right,top:row});
   col=right;
  }
  for(const [key,run] of active)if(!runs.has(key)){finish(run,row);active.delete(key);}
 }
 return cliffs;
}

const riverPixels=[
 [229,85],[204,85],[180,84],[154,84],[141,89],[128,86],[118,98],
 [115,120],[119,146],[130,169],[133,190],[130,207],[120,229],
 [110,250],[102,274],[98,302],[95,326],[99,350],[118,379],
] as const;

export const MISSION_3_4_TERRAIN:Terrain={
 biome:'grassland',weather:'overcast',ridgeStyle:'rocky',halfWidth:704,minZ:-704,maxZ:704,ridgeHeight:60,ridgeVariation:15,seed:34,
 cliffs:tracedCliffs(),
 river:{bridgeId:'ur-alr-bridge',x:MAP_3_4_POINTS.bridge.x,z:MAP_3_4_POINTS.bridge.z,width:24,length:1200,bridgeZ:MAP_3_4_POINTS.bridge.z,bridgeWidth:36,path:riverPixels.map(([px,py])=>map34PixelToWorld(px,py))},
};
