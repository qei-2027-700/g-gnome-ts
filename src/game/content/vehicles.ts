import type {
  VehicleWeapon
} from './weapons.ts';
export type Faction = 'union' | 'merc' | 'darken' | 'scorp';
export type VehicleSpec={
  missileHomingScale?:Partial<Record<VehicleWeapon,
  number>>;powerSupply?:'external';boardable?:boolean;ejectionSeat?:boolean;category?:'vehicle'|'tower'|'hovercraft';hoverHeight?:number;mineDetectorRange?:number;name:string;jp:string;faction:Faction;speed:number;shield:number;energy:number;armor:number;height:number;passengerCapacity:number;color:string;weapons:readonly VehicleWeapon[
  ];torsoLimit:number;voice:'young'|'solemn';initialAmmo:Partial<Record<VehicleWeapon,
number>>;ai:{
  minimumRange?:number;detection:number;strafe:number;keepMoving:boolean;stopDistance:number;missileVolley:number
}
};
type ShapeBox={w:number;h:number;d:number;x?:number;y:number;z:number};
// Dimensions are prototype metres in chassis-local coordinates.
export type VehicleShape={
 hull:ShapeBox;cockpit:ShapeBox;weapon:ShapeBox;legX:number;
 shoulder?:ShapeBox;upperLeg?:ShapeBox;brace?:ShapeBox;
 spider?:{hipX:number;hipY:number;hipZ:number;kneeX:number;kneeY:number;kneeZ:number;footX:number;footZ:number;upperWidth:number;lowerWidth:number;step:number;lift:number;kneeLift:number;sway:number;sideStep:number};
 track?:ShapeBox;chinWeapon?:ShapeBox;support?:ShapeBox;roof?:ShapeBox;gunHousing?:ShapeBox;
 legScale?:{x:number;y:number;z:number};legHip?:number;
};
// Visual tuning, not measured original animation data.
type GaitProfile={stride:number;lift:number;lean:number;bounce:number};
type DriveProfile={idle:number;rev:number;harmonic:number;filter:number;volume:number;wave:'sine'|'triangle'};
type VehicleDefinition=VehicleSpec&{shape:VehicleShape;gait:GaitProfile;drive:DriveProfile};
export const MERC_TACTICAL_PALETTE={
  white:'#e1e8e7',
  blue:'#8fbcd0',
  gray:'#839296',
  black:'#11191d'
} as const;
export const SCORP_ASV_PALETTE={
  armor:'#d3d8d1',
  black:'#1a2020',
  metal:'#7c8987',
  green:'#1f6b58',
  ochre:'#a98b4f'
} as const;
export const MERC_MESON_PALETTE={
  blue:'#183462',
  metal:'#b8c1c4',
  rim:'#606970',
  dark:'#11171c',
  red:'#973124'
} as const;
export const SCORP_TOWER_PALETTE={
  green:'#38856c',
  panel:'#4a967d',
  dark:'#182d26',
  metal:'#8c9390',
  ochre:'#b18138'
} as const;

const BASE_VEHICLES = {
  'union-sentry': {
    name:'Union Sentry HAWC',
    jp:'ユニオン セントリー ホーク',
    faction:'union',
    speed:70,
    shield:35,
    energy:1600,
    armor:100,
    height:6.8,
    passengerCapacity:0,
    color:'#85898c',
    weapons:[
      'FLECH',
      'FIL-30'],
    torsoLimit:0,
    voice:'young',
    initialAmmo:{
      FLECH:400
    },
    ai:{
      detection:125,
      strafe:1.1,
      keepMoving:true,
      stopDistance:60,
      missileVolley:1
    },
    shape:{hull:{w:2.45,h:1.05,d:2.1,y:-.85,z:0},cockpit:{w:1.5,h:1.1,d:1.7,y:-.12,z:.5},weapon:{w:.5,h:.42,d:1.1,x:.65,y:-1.02,z:1.05},shoulder:{w:1.45,h:1.3,d:2.4,x:2.35,y:2.05,z:.05},legX:2.35,upperLeg:{w:.85,h:2.65,d:1.1,y:4.72,z:-.1},brace:{x:1.5,y:.9,z:-.15,w:1.7,h:2.2,d:.7}},
    gait:{stride:6.8,lift:.65,lean:.085,bounce:.10},
    drive:{idle:82,rev:65,harmonic:2.1,filter:360,volume:.035,wave:'sine'}
  },
  'darken-sentry': {
    ejectionSeat:true,
    name:'Darken Sentry HAWC',
    jp:'ダーケン軍 セントリー ホーク',
    faction:'darken',
    speed:85,
    shield:22,
    energy:1100,
    armor:84,
    height:6.9,
    passengerCapacity:0,
    color:'#c68122',
    weapons:[
      'CHUM',
      'RUPP',
    ],
    torsoLimit:Math.PI/3,
    voice:'solemn',
    initialAmmo:{
      CHUM:50
    },
    ai:{
      detection:125,
      strafe:1.1,
      keepMoving:true,
      stopDistance:60,
      missileVolley:2
    },
    shape:{hull:{w:1.55,h:1.25,d:1.55,y:-.68,z:0},cockpit:{w:.82,h:1.15,d:1.2,y:.45,z:.22},weapon:{w:1.05,h:.65,d:1.15,x:1.68,y:.12,z:.42},legX:1.08},
    gait:{stride:6.8,lift:.65,lean:.085,bounce:.10},
    drive:{idle:82,rev:65,harmonic:2.1,filter:360,volume:.035,wave:'sine'}
  },
  // Manual p.22: Rampage is a separate chassis, not a Sentry paint variant.
  'union-tactical':{
    name:'Union Tactical Defense HAWC',
    jp:'ユニオン タクティカル ディフェンス ホーク',
    faction:'union',
    speed:60,
    shield:36,
    energy:1200,
    armor:120,
    height:7.5,
    passengerCapacity:0,
    color:'#a5a098',
    weapons:[
      'P2MEC',
      'TCREAP',
      'TCROCK',
      'SAG5T'],
    torsoLimit:Math.PI/3,
    voice:'young',
    initialAmmo:{
      TCREAP:300,
      TCROCK:10,
      SAG5T:26
    },
    ai:{
      detection:160,
      strafe:.7,
      keepMoving:false,
      stopDistance:65,
      missileVolley:1
    },
    // User-tuned leg proportions; keep the upper assembly and declared height unchanged.
    shape:{hull:{w:2.9,h:1.1,d:2.1,y:-.35,z:0},cockpit:{w:2.65,h:1.6,d:2.2,y:1.2,z:.2},weapon:{w:1.7,h:1.3,d:2.6,x:2.65,y:1.5,z:.05},legX:1.65,legScale:{x:.82,y:1.1,z:.9},legHip:4.125,support:{w:1.65*.82,h:4.125,d:2.35*.9,y:4.125/2,z:.2*.9}},
    gait:{stride:7,lift:.65,lean:.06,bounce:.13},
    drive:{idle:72,rev:52,harmonic:2.5,filter:320,volume:.035,wave:'triangle'}
  },
  'merc-sentry': {
    ejectionSeat:false,
    name:'Merc Sentry HAWC',
    jp:'メルク軍 セントリー ホーク',
    faction:'merc',
    speed:85,
    shield:22,
    energy:1100,
    armor:84,
    height:6.9,
    passengerCapacity:0,
    color:'#17365f',
    weapons:[
      'RAID',
      'CHUM',
    ],
    torsoLimit:Math.PI/3,
    voice:'young',
    initialAmmo:{
      CHUM:25
    },
    ai:{
      detection:125,
      strafe:1.1,
      keepMoving:true,
      stopDistance:60,
      missileVolley:1
    },
    shape:{hull:{w:2.6,h:1.3,d:2.5,y:0,z:0},cockpit:{w:2.65,h:2.15,d:2.25,y:1.35,z:0},weapon:{w:1.3,h:1.05,d:2.9,x:2.05,y:.65,z:.3},legX:1.5},
    gait:{stride:7.6,lift:.85,lean:.12,bounce:.24},
    drive:{idle:110,rev:90,harmonic:2,filter:450,volume:.032,wave:'sine'}
  },
  'merc-tactical': {
    ejectionSeat:false,
    name:'Merc Tactical Defense HAWC',
    jp:'メルク軍 タクティカル ディフェンス ホーク',
    faction:'merc',
    speed:72,
    shield:50,
    energy:1700,
    armor:144,
    height:9.5,
    passengerCapacity:0,
    color:MERC_TACTICAL_PALETTE.white,
    weapons:[
      'DASY',
      'SAG5T'],
    torsoLimit:0,
    voice:'solemn',
    initialAmmo:{
      DASY:400,
      SAG5T:400
    },
    ai:{
      detection:145,
      strafe:.9,
      keepMoving:false,
      stopDistance:60,
      missileVolley:2
    },
    shape:{hull:{w:2.6,h:1.25,d:2.3,y:-.45,z:0},cockpit:{w:2.65,h:1.85,d:1.95,y:1.4,z:.1},weapon:{w:1.25,h:1.25,d:2.1,x:2.65,y:2.05,z:.05},legX:1.6},
    gait:{stride:7.4,lift:2.15,lean:.105,bounce:.52},
    drive:{idle:62,rev:45,harmonic:2.8,filter:300,volume:.035,wave:'triangle'}
  },
  // Manual p.52: Venom's speed/shield/energy/height and standard armament. External geometry, armor, articulation and AI are provisional.
  'merc-assault':{
    ejectionSeat:false,
    name:'Merc Heavy Assault HAWC',
    jp:'メルク軍 アサルト ホーク',
    faction:'merc',
    speed:31.5,
    shield:70,
    energy:1800,
    armor:160,
    height:7.9,
    passengerCapacity:0,
    color:'#748b96',
    weapons:[
      'RUPP',
      'zWASP',
      'PUG',
      'VISOM'],
    torsoLimit:Math.PI/3,
    voice:'solemn',
    initialAmmo:{
      zWASP:1000,
      PUG:20,
      VISOM:10
    },
    ai:{
      detection:200,
      strafe:.3,
      keepMoving:false,
      stopDistance:100,
      missileVolley:1
    },
    // Side-reference prototype: low body and four raised, outward-splayed legs.
    shape:{hull:{w:3.2,h:1.25,d:5.8,y:-1.1,z:0},cockpit:{w:2.6,h:1.25,d:2.8,y:-.1,z:-.8},weapon:{w:.55,h:.5,d:2,x:1.8,y:-1.15,z:2.2},legX:4.8,spider:{hipX:1.25,hipY:3.8,hipZ:1.45,kneeX:3.7,kneeY:7.3,kneeZ:2.9,footX:4.8,footZ:3.8,upperWidth:.7,lowerWidth:.6,step:.65,lift:.95,kneeLift:.55,sway:.95,sideStep:1.1}},
    gait:{stride:4,lift:.25,lean:.03,bounce:.05},
    drive:{idle:58,rev:40,harmonic:2.8,filter:280,volume:.035,wave:'triangle'}
  },
  // ASV speed/shield/energy/height and ammunition follow manual pp.23 and 33.
  // Armor, colors, AI, firing profiles, pooling of twin racks/guns and three passenger seats are provisional.
  'union-asv':{
    name:'Union ASV',
    jp:'ユニオン軍 アーマード サポート ビークル',
    faction:'union',
    speed:72,
    shield:30,
    energy:800,
    armor:100,
    height:3.1,
    passengerCapacity:3,
    color:'#85898c',
    weapons:[
      'TCREAP',
      'TCROCK'],
    torsoLimit:Math.PI,
    voice:'young',
    initialAmmo:{
      TCREAP:300,
      TCROCK:60
    },
    ai:{
      detection:200,
      strafe:0,
      keepMoving:false,
      stopDistance:60,
      missileVolley:1
    },
    shape:{hull:{w:3.2,h:1.1,d:4.5,y:-.25,z:0},cockpit:{w:1.8,h:.85,d:2.2,y:.45,z:.1},weapon:{w:.6,h:.6,d:2.2,x:1.05,y:.65,z:.8},legX:1.85,track:{w:1.05,h:1.1,d:5.1,y:.65,z:0}},
    gait:{stride:5,lift:0,lean:0,bounce:0},
    drive:{idle:70,rev:50,harmonic:2.4,filter:320,volume:.035,wave:'triangle'}
  },
  'scorp-asv':{
    mineDetectorRange:120,
    name:'Scorp ASV',
    jp:'スコープ軍 アーマード サポート ビークル',
    faction:'scorp',
    speed:64,
    shield:24,
    energy:1200,
    armor:100,
    height:4.2,
    passengerCapacity:3,
    color:SCORP_ASV_PALETTE.armor,
    weapons:[
      'zWASP',
      'zWASP',
      'SREM',
      'UNKPA'],
    torsoLimit:Math.PI,
    voice:'solemn',
    initialAmmo:{
      zWASP:1600,
      SREM:20,
      UNKPA:10
    },
    ai:{
      detection:200,
      strafe:0,
      keepMoving:false,
      stopDistance:60,
      missileVolley:1
    },
    shape:{hull:{w:4.2,h:.95,d:3.5,y:-.55,z:0},cockpit:{w:2.1,h:.72,d:1.7,y:.5,z:.3},weapon:{w:.55,h:.36,d:1,x:.8,y:1.08,z:.35},legX:2.15,track:{w:1.65,h:1.85,d:5,y:1.05,z:0}},
    gait:{stride:5,lift:0,lean:0,bounce:0},
    drive:{idle:64,rev:45,harmonic:2.6,filter:300,volume:.035,wave:'triangle'}
  },
  // Manual pp.31-32: speed, shield, energy, height, weapon names and ammunition.
  // Geometry, armor, weapon performance, articulation and tower values are prototypes.
  'scorp-sentry':{
    name:'Scorp Sentry HAWC',
    jp:'スコープ軍 セントリー ホーク',
    faction:'scorp',
    speed:56.25,
    shield:42,
    energy:800,
    armor:100,
    height:6.3,
    passengerCapacity:0,
    color:'#b2a77d',
    weapons:[
      'CETI',
      'zWASP',
      'SREM'],
    torsoLimit:Math.PI/3,
    voice:'young',
    initialAmmo:{
      zWASP:400,
      SREM:20
    },
    ai:{
      detection:140,
      strafe:.7,
      keepMoving:false,
      stopDistance:65,
      missileVolley:1
    },
    shape:{hull:{w:2.8,h:1.3,d:2.5,y:0,z:0},cockpit:{w:2.1,h:1.7,d:2.2,y:1,z:0},weapon:{w:1.2,h:1,d:2.6,x:2,y:.8,z:.3},legX:1.5},
    gait:{stride:6,lift:.6,lean:.06,bounce:.1},
    drive:{idle:78,rev:60,harmonic:2,filter:320,volume:.035,wave:'sine'}
  },
  'scorp-tactical':{
    name:'Scorp Tactical Defense HAWC',
    jp:'スコープ軍 タクティカル ディフェンス ホーク',
    faction:'scorp',
    speed:54,
    shield:48,
    energy:1700,
    armor:140,
    height:8.9,
    passengerCapacity:0,
    color:'#a8ac86',
    weapons:[
      'RAID',
      'zWASP',
      'HSSO'],
    torsoLimit:Math.PI/3,
    voice:'solemn',
    initialAmmo:{
      zWASP:1000,
      HSSO:15
    },
    ai:{
      detection:170,
      strafe:.4,
      keepMoving:false,
      stopDistance:70,
      missileVolley:1
    },
    shape:{hull:{w:3,h:1.4,d:2.6,y:-.4,z:0},cockpit:{w:2.6,h:1.8,d:2.1,y:1.2,z:.1},weapon:{w:1.4,h:1.3,d:2.3,x:2.5,y:1.8,z:0},legX:1.7,chinWeapon:{x:.55,y:-.05,z:1.7,w:.28,h:.28,d:1.2}},
    gait:{stride:7,lift:.65,lean:.05,bounce:.15},
    drive:{idle:64,rev:50,harmonic:2.5,filter:300,volume:.035,wave:'triangle'}
  },
  // Manual p.54: one GAUS30, fixed tower; dimensions and defensive values are provisional.
  // Manual p.53: Razor hovercraft. Hover gap, armor and AI remain provisional.
  // Manual p.51: WidowMaker. Armor and geometry remain provisional.
  'merc-cruiser':{
    ejectionSeat:false,
    name:'Merc Cruiser HAWC (WidowMaker)',
    jp:'メルク軍 ホーク クルーザー',
    faction:'merc',
    speed:45,
    shield:40,
    energy:1000,
    armor:140,
    height:12.4,
    passengerCapacity:0,
    color:'#87939e',
    weapons:[
      'FLECH',
      'GAUS20',
    ],
    torsoLimit:Math.PI,
    voice:'solemn',
    initialAmmo:{
      FLECH:300
    },
    ai:{
      detection:300,
      strafe:.3,
      keepMoving:false,
      stopDistance:90,
      missileVolley:1
    },
    shape:{hull:{w:2.4,h:2,d:2.8,y:1.4,z:0},cockpit:{w:2,h:2.6,d:2.4,y:3.2,z:0},weapon:{w:.6,h:.6,d:2.4,x:.9,y:2.6,z:1.3},legX:4.5,support:{w:.5,h:9,d:7,y:4.5,z:0}},
    gait:{stride:4,lift:.2,lean:.02,bounce:.02},
    drive:{idle:56,rev:35,harmonic:2.5,filter:280,volume:.035,wave:'triangle'}
  },
  'union-aip':{
    category:'hovercraft',
    hoverHeight:1.2,
    ejectionSeat:true,
    name:'Union Airborne Insurgence Platform',
    jp:'Union エアーボーン インサージェンス プラットフォーム',
    faction:'union',
    speed:90,
    shield:30,
    energy:1200,
    armor:80,
    height:3.7,
    passengerCapacity:0,
    color:'#7890a4',
    weapons:[
      'P2MEC'],
    torsoLimit:Math.PI,
    voice:'young',
    initialAmmo:{
    },
    ai:{
      detection:650,
      strafe:.3,
      keepMoving:false,
      stopDistance:110,
      missileVolley:1
    },
    shape:{hull:{w:5.2,h:1.7,d:6.2,y:-.4,z:0},cockpit:{w:2.4,h:1.5,d:2.8,y:.7,z:.8},weapon:{w:.7,h:.7,d:2.7,x:2.1,y:.1,z:1},legX:2.6,support:{w:.2,h:.2,d:.2,y:0,z:0}},
    gait:{stride:1,lift:0,lean:0,bounce:0},
    drive:{idle:110,rev:70,harmonic:2,filter:400,volume:.035,wave:'sine'}
  },
  'merc-aip':{
    category:'hovercraft',
    hoverHeight:.8,
    ejectionSeat:false,
    name:'Merc Airborne Insurgence Platform (Razor)',
    jp:'メルク軍 エアーボーン インサージェンス プラットフォーム',
    faction:'merc',
    speed:103.5,
    shield:18,
    energy:1400,
    armor:84,
    height:3.7,
    passengerCapacity:0,
    color:'#386849',
    weapons:[
      'TAR12',
      'TCREAP',
      'DASY'],
    torsoLimit:Math.PI,
    voice:'young',
    initialAmmo:{
      TCREAP:500,
      DASY:510
    },
    ai:{
      detection:650,
      strafe:1,
      keepMoving:true,
      stopDistance:90,
      missileVolley:1
    },
    shape:{hull:{w:6,h:1.7,d:5,y:-.4,z:0},cockpit:{w:2.2,h:1.5,d:2.4,y:.7,z:.8},weapon:{w:.7,h:.7,d:2.7,x:2.4,y:.1,z:1},legX:2.6,support:{w:.2,h:.2,d:.2,y:0,z:0}},
    gait:{stride:1,lift:0,lean:0,bounce:0},
    drive:{idle:110,rev:70,harmonic:2,filter:400,volume:.035,wave:'sine'}
  },
  // Tower shield/armor raised from 60/180 to 120/360 (provisional; original values unconfirmed).
  'merc-meson-tower':{
    powerSupply:'external',
    ejectionSeat:true,
    category:'tower',
    name:'Merc Meson Guard Tower',
    jp:'ミーゾン ガードタワー',
    faction:'merc',
    speed:0,
    shield:120,
    energy:1200,
    armor:360,
    height:12,
    passengerCapacity:0,
    color:MERC_MESON_PALETTE.blue,
    weapons:[
      'GAUS30'],
    torsoLimit:Math.PI,
    voice:'solemn',
    initialAmmo:{
    },
    ai:{
      detection:1000,
      strafe:0,
      keepMoving:false,
      stopDistance:0,
      missileVolley:1
    },
    shape:{hull:{w:4.4,h:6.1,d:4.4,y:-4.15,z:0},cockpit:{w:6.8,h:4,d:6.4,y:.9,z:0},roof:{w:4.2,h:.9,d:3.8,y:3.35,z:-.35},weapon:{w:.85,h:.8,d:3.4,x:0,y:3.55,z:2.15},gunHousing:{w:1.55,h:1.05,d:1.7,y:3.55,z:.15},legX:0,support:{w:4.6,h:.3,d:4.6,y:.15,z:0}},
    gait:{stride:1,lift:0,lean:0,bounce:0},
    drive:{idle:0,rev:0,harmonic:1,filter:300,volume:0,wave:'sine'}
  },
  'scorp-meson-tower':{
    powerSupply:'external',
    ejectionSeat:true,
    category:'tower',
    name:'Scorp Meson Guard Tower',
    jp:'ミーゾン ガードタワー',
    faction:'scorp',
    speed:0,
    shield:120,
    energy:1200,
    armor:360,
    height:12,
    passengerCapacity:0,
    color:SCORP_TOWER_PALETTE.green,
    weapons:[
      'GAUS30'],
    torsoLimit:Math.PI,
    voice:'solemn',
    initialAmmo:{
    },
    ai:{
      detection:1000,
      strafe:0,
      keepMoving:false,
      stopDistance:0,
      missileVolley:1
    },
    shape:{hull:{w:5.4,h:9.6,d:5.4,y:-2.4,z:0},cockpit:{w:8,h:1.6,d:8,y:3.2,z:0},weapon:{w:.8,h:.8,d:7,x:0,y:4.5,z:3.8},legX:2.8,support:{w:3.4,h:5.6,d:7,y:2.8,z:0}},
    gait:{stride:1,lift:0,lean:0,bounce:0},
    drive:{idle:0,rev:0,harmonic:1,filter:300,volume:0,wave:'sine'}
  },
  'scorp-rocket-tower':{
    category:'tower',
    name:'Scorp Rocket Tower',
    jp:'ロケットタワー',
    faction:'scorp',
    speed:0,
    shield:120,
    energy:1200,
    armor:360,
    height:12,
    passengerCapacity:0,
    color:SCORP_TOWER_PALETTE.green,
    weapons:[
      'SREM',
      'UNKPA'],
    torsoLimit:Math.PI,
    voice:'solemn',
    initialAmmo:{
      SREM:100,
      UNKPA:30
    },
    missileHomingScale:{
      UNKPA:1.2
    },
    ai:{
      minimumRange:40,
      detection:280,
      strafe:0,
      keepMoving:false,
      stopDistance:0,
      missileVolley:2
    },
    shape:{hull:{w:5.4,h:9.6,d:5.4,y:-2.4,z:0},cockpit:{w:8,h:2.4,d:8,y:3.6,z:0},weapon:{w:1.2,h:2.1,d:3.2,x:2.5,y:1.15,z:0},legX:2.8,support:{w:3.4,h:5.6,d:7,y:2.8,z:0}},
    gait:{stride:1,lift:0,lean:0,bounce:0},
    drive:{idle:0,rev:0,harmonic:1,filter:300,volume:0,wave:'sine'}
  },
} as const satisfies Record<string,VehicleDefinition>;
// Chassis and loadouts are provisional until the original Darken variants are measured.
export const VEHICLES={...BASE_VEHICLES,
 'darken-tactical':{...BASE_VEHICLES['merc-tactical'],ejectionSeat:true,name:'Darken Tactical Defense HAWC',jp:'ダーケン軍 タクティカル ディフェンス ホーク',faction:'darken',speed:67.5,shield:50,energy:1500,height:7.9,color:'#b08a32',weapons:['HOMP11','DASY'],initialAmmo:{DASY:200},shape:{hull:{w:2.1,h:1.3,d:2.1,y:-.45,z:0},cockpit:{w:1.9,h:1.85,d:1.75,y:1.2,z:.1},weapon:{w:1.7,h:1.55,d:1.65,x:2.2,y:1.65,z:.1},legX:1.45,legScale:{x:1,y:1.1,z:1}}},
 'darken-asv':{...BASE_VEHICLES['union-asv'],name:'Darken ASV',jp:'ダーケン軍 ASV',faction:'darken',color:'#a6522b'},
 'darken-aip':{...BASE_VEHICLES['merc-aip'],ejectionSeat:true,name:'Darken AIP',jp:'ダーケン軍 AIP',faction:'darken',color:'#a6522b'},
} as const satisfies Record<string,VehicleDefinition>;
export type VehicleKind=keyof typeof VEHICLES;
type VehicleDataKey='shape'|'gait'|'drive';
function vehicleData<K extends VehicleDataKey>(key:K):{[Kind in VehicleKind]:(typeof VEHICLES)[Kind][K]}{
 return Object.fromEntries(Object.entries(VEHICLES).map(([kind,definition])=>[kind,definition[key]])) as {[Kind in VehicleKind]:(typeof VEHICLES)[Kind][K]};
}
export const VEHICLE_SHAPES=vehicleData('shape');
export const VEHICLE_GAITS=vehicleData('gait');
export const VEHICLE_DRIVE_PROFILES=vehicleData('drive');
export function resolveVehicle(kind:VehicleKind,
                               ...overrides:(Partial<VehicleSpec>|undefined)[
]):VehicleSpec {
  const {shape:_shape,gait:_gait,drive:_drive,...base}=VEHICLES[kind];let spec:VehicleSpec={
    ...base,
    weapons:[
      ...base.weapons],
    initialAmmo:{
      ...base.initialAmmo
    },
    ai:{
      ...base.ai
    }
  };
for(const override of overrides)if(override)spec={
  ...spec,
  ...override,
  weapons:[
    ...(override.weapons??spec.weapons)],
  initialAmmo:{
    ...spec.initialAmmo,
    ...override.initialAmmo
  },
  ai:{
    ...spec.ai,
    ...override.ai
  }
};
return spec;
}
