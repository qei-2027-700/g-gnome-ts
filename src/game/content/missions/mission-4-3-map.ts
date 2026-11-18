import type {River,Terrain} from './types.ts';

// Source pixels use the full 786 × 738 briefing screenshot. The field scale is
// provisional: the source gives no distance bar or cardinal direction.
export const MAP_4_3_SOURCE={x:24,y:42,width:386,height:390,metersPerPixel:3} as const;
export const map43PixelToWorld=(x:number,y:number)=>({x:(x-220)*3,z:(100-y)*3+860});
export const MAP_4_3_POINTS={
 start:map43PixelToWorld(220,100),
 northBridge:map43PixelToWorld(197,150),
 eastBridge:map43PixelToWorld(290,221),
 westBridge:map43PixelToWorld(115,258),
 southBridge:map43PixelToWorld(222,312),
 waypoint1:map43PixelToWorld(307,230),
 waypoint2:map43PixelToWorld(68,250),
 waypoint3:map43PixelToWorld(316,385),
} as const;

// Each orange band is approximated by a separate, descending polyline. A path
// point follows the middle of the visible band, not the dark contour beside it.
const channel=(bridgeId:string,bridge:[number,number],pixels:readonly [number,number][]):River=>{
 const at=map43PixelToWorld(...bridge),path=pixels.map(([x,y])=>map43PixelToWorld(x,y));
 return {bridgeId,x:at.x,z:at.z,width:27,length:0,bridgeZ:at.z,bridgeWidth:33,surface:'lava',path};
};
const peak=(x:number,y:number,width:number,depth:number,height:number)=>({...map43PixelToWorld(x,y),width:width*3,depth:depth*3,height});

export const MAP_4_3_TERRAIN:Pick<Terrain,'rivers'|'peaks'>={
 rivers:[
  channel('war-north-bridge',[197,150],[[174,112],[177,132],[197,150],[224,159],[248,174],[266,191]]),
  channel('war-east-bridge',[290,221],[[266,191],[282,204],[290,221],[301,245],[309,267],[295,300],[303,330],[311,355]]),
  channel('war-west-bridge',[115,258],[[166,180],[145,202],[128,224],[115,258],[124,288],[99,317],[85,347]]),
  channel('war-south-bridge',[222,312],[[164,281],[184,297],[222,312],[251,334],[260,357],[262,365]]),
 ],
 peaks:[
  peak(151,87,38,37,115),peak(222,72,42,28,105),peak(296,89,34,44,110),
  peak(365,163,34,44,125),peak(383,262,25,64,115),peak(371,351,38,67,130),
  peak(171,219,43,48,120),peak(230,210,38,45,130),peak(188,267,52,48,125),peak(254,267,43,42,125),
  peak(61,290,28,61,120),peak(86,375,43,36,120),peak(257,344,44,30,110),peak(261,411,70,28,100),
 ],
};
