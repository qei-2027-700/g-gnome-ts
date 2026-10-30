import type {VehicleKind} from './vehicles.ts';

// User-tuned Union Tactical leg proportions; keep upper assembly and declared height unchanged.
const unionTacticalLegScale={x:.82,y:1.1,z:.9};
const unionTacticalHip=7.5*.5*unionTacticalLegScale.y;

// Centres are relative to the upper assembly; dimensions are prototype metres.
export const VEHICLE_SHAPES = {
 'union-sentry':{hull:{w:2.45,h:1.05,d:2.1,y:-.85,z:0},cockpit:{w:1.5,h:1.1,d:1.7,y:-.12,z:.5},weapon:{w:.5,h:.42,d:1.1,x:.65,y:-1.02,z:1.05},shoulder:{w:1.45,h:1.3,d:2.4,x:2.35,y:2.05,z:.05},legX:2.35,upperLeg:{w:.85,h:2.65,d:1.1,y:4.72,z:-.1},brace:{x:1.5,y:.9,z:-.15,w:1.7,h:2.2,d:.7}},
 'union-tactical':{hull:{w:2.9,h:1.1,d:2.1,y:-.35,z:0},cockpit:{w:2.65,h:1.6,d:2.2,y:1.2,z:.2},weapon:{w:1.7,h:1.3,d:2.6,x:2.65,y:1.5,z:.05},legX:1.65,legScale:unionTacticalLegScale,legHip:unionTacticalHip,support:{w:1.65*unionTacticalLegScale.x,h:unionTacticalHip,d:2.35*unionTacticalLegScale.z,y:unionTacticalHip/2,z:.2*unionTacticalLegScale.z}},
 'merc-sentry':{hull:{w:2.6,h:1.3,d:2.5,y:0,z:0},cockpit:{w:2.65,h:2.15,d:2.25,y:1.35,z:0},weapon:{w:1.3,h:1.05,d:2.9,x:2.05,y:.65,z:.3},legX:1.5},
 'merc-tactical':{hull:{w:2.6,h:1.25,d:2.3,y:-.45,z:0},cockpit:{w:2.65,h:1.85,d:1.95,y:1.4,z:.1},weapon:{w:1.25,h:1.25,d:2.1,x:2.65,y:2.05,z:.05},legX:1.6},
 // Side reference: low pointed body and four raised, outward-splayed legs. Dimensions remain provisional.
 'merc-assault':{hull:{w:3.2,h:1.25,d:5.8,y:-1.1,z:0},cockpit:{w:2.6,h:1.25,d:2.8,y:-.1,z:-.8},weapon:{w:.55,h:.5,d:2,x:1.8,y:-1.15,z:2.2},legX:4.8,
  spider:{hipX:1.25,hipY:3.8,hipZ:1.45,kneeX:3.7,kneeY:7.3,kneeZ:2.9,footX:4.8,footZ:3.8,upperWidth:.7,lowerWidth:.6,step:.65,lift:.95,kneeLift:.55,sway:.95,sideStep:1.1}},
 'union-asv':{hull:{w:3.2,h:1.1,d:4.5,y:-.25,z:0},cockpit:{w:1.8,h:.85,d:2.2,y:.45,z:.1},weapon:{w:.6,h:.6,d:2.2,x:1.05,y:.65,z:.8},legX:1.85,track:{w:1.05,h:1.1,d:5.1,y:.65,z:0}},
 'scorp-asv':{hull:{w:4.2,h:.95,d:3.5,y:-.55,z:0},cockpit:{w:2.1,h:.72,d:1.7,y:.5,z:.3},weapon:{w:.55,h:.36,d:1,x:.8,y:1.08,z:.35},legX:2.15,track:{w:1.65,h:1.85,d:5,y:1.05,z:0}},
 'scorp-sentry':{hull:{w:2.8,h:1.3,d:2.5,y:0,z:0},cockpit:{w:2.1,h:1.7,d:2.2,y:1,z:0},weapon:{w:1.2,h:1,d:2.6,x:2,y:.8,z:.3},legX:1.5},
 'scorp-tactical':{chinWeapon:{x:.55,y:-.05,z:1.7,w:.28,h:.28,d:1.2},hull:{w:3,h:1.4,d:2.6,y:-.4,z:0},cockpit:{w:2.6,h:1.8,d:2.1,y:1.2,z:.1},weapon:{w:1.4,h:1.3,d:2.3,x:2.5,y:1.8,z:0},legX:1.7},
 'union-aip':{hull:{w:5.2,h:1.7,d:6.2,y:-.4,z:0},cockpit:{w:2.4,h:1.5,d:2.8,y:.7,z:.8},weapon:{w:.7,h:.7,d:2.7,x:2.1,y:.1,z:1},legX:2.6,support:{w:.2,h:.2,d:.2,y:0,z:0}},
 'merc-aip':{hull:{w:6,h:1.7,d:5,y:-.4,z:0},cockpit:{w:2.2,h:1.5,d:2.4,y:.7,z:.8},weapon:{w:.7,h:.7,d:2.7,x:2.4,y:.1,z:1},legX:2.6,support:{w:.2,h:.2,d:.2,y:0,z:0}},
 'merc-cruiser':{hull:{w:2.4,h:2,d:2.8,y:1.4,z:0},cockpit:{w:2,h:2.6,d:2.4,y:3.2,z:0},weapon:{w:.6,h:.6,d:2.4,x:.9,y:2.6,z:1.3},legX:4.5,support:{w:.5,h:9,d:7,y:4.5,z:0}},
 'merc-meson-tower':{hull:{w:4.4,h:6.1,d:4.4,y:-4.15,z:0},cockpit:{w:6.8,h:4,d:6.4,y:.9,z:0},roof:{w:4.2,h:.9,d:3.8,y:3.35,z:-.35},weapon:{w:.85,h:.8,d:3.4,x:0,y:3.55,z:2.15},gunHousing:{w:1.55,h:1.05,d:1.7,y:3.55,z:.15},legX:0,support:{w:4.6,h:.3,d:4.6,y:.15,z:0}},
 'scorp-meson-tower':{hull:{w:5.4,h:9.6,d:5.4,y:-2.4,z:0},cockpit:{w:8,h:1.6,d:8,y:3.2,z:0},weapon:{w:.8,h:.8,d:7,x:0,y:4.5,z:3.8},legX:2.8,support:{w:3.4,h:5.6,d:7,y:2.8,z:0}},
 'scorp-rocket-tower':{hull:{w:5.4,h:9.6,d:5.4,y:-2.4,z:0},cockpit:{w:8,h:2.4,d:8,y:3.6,z:0},weapon:{w:1.2,h:2.1,d:3.2,x:2.5,y:1.15,z:0},legX:2.8,support:{w:3.4,h:5.6,d:7,y:2.8,z:0}},
} as const satisfies Record<VehicleKind,unknown>;

// Fallen fixed equipment keeps a low, solid footprint after its fire burns out.
export const FACILITY_WRECK={width:9,depth:8,height:2.4} as const;

// RAID chin muzzle, relative to the Merc Tactical upper assembly.
export const MERC_TACTICAL_RAID_MUZZLE={x:0,y:.15,z:2.1} as const;

// Paired RAID barrels below the Scorp Tactical cockpit; tips relative to the upper assembly.
export const SCORP_TACTICAL_RAID_MUZZLES={x:.55,y:-.05,z:2.3} as const;

// Front and rear pairs alternate diagonally. Shared points drive the model and hit envelopes.
export function mercAssaultLegPose(side:number,front:number,phase=0,run=0){
 const s=VEHICLE_SHAPES['merc-assault'].spider,strength=Math.max(0,Math.min(1,run)),cycle=phase+(side*front>0?0:Math.PI),stride=Math.cos(cycle)*s.step*strength,lift=Math.max(0,Math.sin(cycle))*s.lift*strength,lateral=Math.sin(cycle)*strength;
 return {hip:{x:side*s.hipX,y:s.hipY,z:front*s.hipZ},knee:{x:side*(s.kneeX+lateral*s.sway),y:s.kneeY+Math.sin(cycle)*s.kneeLift*strength,z:front*s.kneeZ+stride*.3},foot:{x:side*(s.footX+Math.max(0,lateral)*s.sideStep),y:.1+lift,z:front*s.footZ+stride}};
}
