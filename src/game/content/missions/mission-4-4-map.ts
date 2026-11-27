import type {River,Terrain} from './types.ts';

// Pixels are on assets/map/4-4/4-4map.png (1228×882), the briefing image the mission pastes.
// The map panel inside that screenshot is x:38, y:68, 622×460.
// assets/map/4-4/4-4-map.png is a smaller briefing capture of the same ribbon; coordinates stay on 4-4map.png.
// The orange core is one ribbon: south down the west side, east through the middle, then south to a hook.
// It does not cross itself. The blue 1B marker sits on the southern leg, and that is the only bridge.
// Start-marker center measured on 4-4map.png: (99, 181).
// Provisional scale: 3 world units per pixel. This mission already used that ratio.
// It is not a distance read from the image, and it is not a measured scale from another mission.
// z is biased +100 so the southern hook stays on the volcanic ground mesh, which is 1800 units centered at z=0.
// The same origin, bias and scale apply to the river, the bridge, the start and the facilities.
export const MAP_4_4_SOURCE={x:38,y:68,width:622,height:460,metersPerPixel:3} as const;
const startPixel={x:99,y:181},metersPerPixel=3,zBias=100;
export const map44PixelToWorld=(x:number,y:number)=>({x:(x-startPixel.x)*metersPerPixel,z:(startPixel.y-y)*metersPerPixel+zBias});

// Centerline samples of the saturated orange core on 4-4map.png. The line stays within about one ribbon width of that core.
export const MAP_4_4_LAVA=[
 [228,110],[232,160],[222,178],[228,240],[228,290],
 [300,305],[348,312],[400,335],[450,332],[492,340],
 [492,355],[490,385],[484,394],[490,414],[495,440],
 [492,455],[476,470],[464,500],
] as const;

// Unit and facility pixels were read from assets/map/4-4/4-4-map配置.png (760×756).
// That image is stretched relative to 4-4map.png. The yellow start (103.2, 219.9) maps to (99, 181)
// and the blue 1B (561.7, 592.0) maps to (494.7, 414.3). Scale is 0.863 in x and 0.627 in y.
// Meters stay the provisional 3 above. A labeled center that landed on lava or a pale ridge
// is the nearest dark pixel; those nudges are recorded in docs/missions/mission-4-4.md.
export const MAP_4_4_POINTS={
 start:map44PixelToWorld(startPixel.x,startPixel.y),
 bridge:map44PixelToWorld(490,414),
 bridgeControl:map44PixelToWorld(450,414),
 labMarker:map44PixelToWorld(530,448),
 // West-bank approach: rocket, control building, mine belt, then three TD HAWCs.
 mineControl:map44PixelToWorld(325,340),
 minefield:map44PixelToWorld(365,345),
 waypoint1:map44PixelToWorld(530,420),
 sentryOpening:map44PixelToWorld(216,209),
 tacticalWest:map44PixelToWorld(218,258),
 asv:map44PixelToWorld(264,309),
 aip:map44PixelToWorld(379,296),
 rocketRight:map44PixelToWorld(533,316),
 rocketLeft:map44PixelToWorld(275,323),
 tacticalSouth1:map44PixelToWorld(407,345),
 tacticalSouth2:map44PixelToWorld(416,352),
 tacticalSouth3:map44PixelToWorld(420,358),
 bridgeSentry:map44PixelToWorld(456,425),
} as const;

const lava:River={
 bridgeId:'delivery-bridge',
 ...MAP_4_4_POINTS.bridge,
 width:32,length:0,
 bridgeZ:MAP_4_4_POINTS.bridge.z,bridgeWidth:36,
 surface:'lava',
 path:MAP_4_4_LAVA.map(([x,y])=>map44PixelToWorld(x,y)),
};
const peak=(x:number,y:number,width:number,depth:number,height:number)=>({...map44PixelToWorld(x,y),width:width*metersPerPixel,depth:depth*metersPerPixel,height});

export const MAP_4_4_TERRAIN:Pick<Terrain,'rivers'|'peaks'>={
 rivers:[lava],
 // Cream on 4-4map.png is cliff and mountain ground. The meshes and the movement block are the ellipses
 // inside these width/depth boxes, so a diagonal ridge is a chain of ellipses rather than its contour.
 // Dark red between the cream stays open. Heights are provisional, in the same range as the earlier peaks.
 // The start pixel (99, 181) stays south of the northwest knob. The bridge gap and the lava ribbon stay clear.
 peaks:[
  peak(299,214,54,44,122),
  peak(174,329,74,49,129),
  peak(579,364,64,34,125),
  peak(374,389,79,34,130),
  peak(374,404,64,44,125),
  peak(199,89,67,17,126),
  peak(264,89,67,17,126),
  peak(259,99,54,29,122),
  peak(184,104,39,29,117),
  peak(269,109,64,39,125),
  peak(294,109,84,24,132),
  peak(184,154,29,39,117),
  peak(129,174,34,24,115),
  peak(264,184,29,24,114),
  peak(99,229,49,24,120),
  peak(149,234,89,24,132),
  peak(289,234,49,24,120),
  peak(164,244,49,44,120),
  peak(174,264,34,24,115),
  peak(279,264,49,39,120),
  peak(604,264,44,39,119),
  peak(374,274,59,29,124),
  peak(294,279,79,24,130),
  peak(344,279,134,34,132),
  peak(514,279,74,34,129),
  peak(599,279,34,34,115),
  peak(469,294,34,24,115),
  peak(169,304,39,59,124),
  peak(214,339,114,34,132),
  peak(164,349,79,29,130),
  peak(204,354,129,39,132),
  peak(289,359,114,29,132),
  peak(244,364,94,34,132),
  peak(324,369,54,24,122),
  peak(559,374,59,24,124),
  peak(569,414,32,17,115),
  peak(564,439,54,39,122),
  peak(374,454,39,59,124),
  peak(569,454,64,34,125),
  peak(569,469,59,49,124),
  peak(364,474,64,29,125),
  peak(379,484,79,24,130),
  peak(104,166,22,18,111),
 ],
};
