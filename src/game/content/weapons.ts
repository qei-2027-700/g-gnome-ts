export const LASER_RECHARGE_SECONDS=.55; // Provisional until measured against the original.
// Charge/range curves, movement penalty and firing intervals still need measurement.
// Slow visible bolts, per user reference. Provisional speed in m/s.
export const LASER_FLIGHT_SPEED=72;
export const LASERS = {
  // Manual pp.41/57. Charge timing and the visible TAR12 bolt speed are provisional.
  TAR12:{range:500.5,minRange:50.05,recharge:1,movingRechargeFactor:.5,interval:1,energy:0,damage:18,speed:LASER_FLIGHT_SPEED},
  GAUS20:{range:300,minRange:30,recharge:1.2,movingRechargeFactor:.5,interval:1.2,energy:6,damage:13,speed:1000},
  // Manual p.46: RUPP range/energy/armor damage. Charge timing and visible bolt speed are provisional.
  RUPP:{range:325,minRange:32.5,recharge:1,movingRechargeFactor:.5,interval:1,energy:2,damage:18,speed:LASER_FLIGHT_SPEED},
  // Manual p.57: range 800 m, velocity 1000, energy 5, armor damage 17.
  // User-tuned slower visible flight (800 m/s) and 1.6-second firing/recharge interval.
  GAUS30:{range:800,minRange:80,recharge:1.6,movingRechargeFactor:1,interval:1.6,energy:5,damage:17,speed:600,hitPadding:.45},
  P2MEC:{range:315,minRange:31.5,recharge:.8,movingRechargeFactor:.5,interval:.8,energy:2,damage:18,speed:LASER_FLIGHT_SPEED},
  'FIL-30': {range:220,minRange:22,recharge:LASER_RECHARGE_SECONDS,movingRechargeFactor:.5,interval:1,energy:2,damage:9,speed:LASER_FLIGHT_SPEED},
  CETI: {range:180,minRange:18,recharge:.7,movingRechargeFactor:.5,interval:.7,energy:2,damage:5,speed:LASER_FLIGHT_SPEED},
  RAID: {range:180,minRange:18,recharge:.7,movingRechargeFactor:.5,interval:.7,energy:2,damage:5,speed:60},
} as const;
export type LaserWeapon = keyof typeof LASERS;
export const INFANTRY_WEAPONS={
  PRIF44:{range:150,damage:7,vehicleDamage:.2,cooldown:.7,tracerSpeed:160},
  GASHR:{range:100,speed:60,cooldown:.8,ammo:5},
  // EGGER ballistics and capacity are provisional, pending original-game measurements.
  EGGER:{range:100,speed:60,cooldown:.8,ammo:5},
} as const;
// VISOM flight speed in m/s; lifetime below preserves the 1000 m range.
export const VISOM_SPEED=90;
// Manual p.46: PUG range/velocity/armor damage; radius and homing remain provisional.
export const MISSILES={PUG:{speed:700,damage:38,radius:.45,lifetime:625/700},HSSO:{speed:110,damage:4.5,radius:.5,lifetime:600/110},CHUM:{speed:94,damage:5,radius:.45,lifetime:425/94},SAG5T:{speed:110,damage:4.5,radius:.5,lifetime:600/110},TCROCK:{speed:94,damage:5,radius:.45,lifetime:425/94},SREM:{speed:110,damage:4.5,radius:.5,lifetime:600/110},UNKPA:{speed:110,damage:4.5,radius:.5,lifetime:600/110},
 VISOM:{speed:VISOM_SPEED,damage:2,radius:.45,lifetime:1000/VISOM_SPEED}
};

export const MACHINE_GUNS={FLECH:{range:150,interval:.11,damage:3},DASY:{range:180,interval:.11,damage:4},TCREAP:{range:160,interval:.11,damage:3,projectileSpeed:60},zWASP:{range:180,interval:.11,damage:3}};
export type MachineGun=keyof typeof MACHINE_GUNS;
export type MissileWeapon=keyof typeof MISSILES;
export type VehicleWeapon=LaserWeapon|MachineGun|MissileWeapon;
export const MISSILE_INTERVAL=.4;
export type LaserSpec={hitPadding?:number;range:number;minRange:number;recharge:number;movingRechargeFactor:number;interval:number;energy:number;damage:number;speed:number};
export type GunSpec={projectileSpeed?:number;range:number;interval:number;damage:number};
export type MissileSpec={speed:number;damage:number;radius:number;lifetime:number};
export type WeaponOverrides={lasers?:Partial<Record<LaserWeapon,Partial<LaserSpec>>>;guns?:Partial<Record<MachineGun,Partial<GunSpec>>>;missiles?:Partial<Record<MissileWeapon,Partial<MissileSpec>>>};
export function resolveWeapons(overrides:WeaponOverrides={}){
 const lasers=Object.fromEntries(Object.entries(LASERS).map(([id,p])=>[id,{...p,...overrides.lasers?.[id as LaserWeapon]}])) as Record<LaserWeapon,LaserSpec>;
 const guns=Object.fromEntries(Object.entries(MACHINE_GUNS).map(([id,p])=>[id,{...p,...overrides.guns?.[id as MachineGun]}])) as Record<MachineGun,GunSpec>;
 const missiles=Object.fromEntries(Object.entries(MISSILES).map(([id,p])=>[id,{...p,...overrides.missiles?.[id as MissileWeapon]}])) as Record<MissileWeapon,MissileSpec>;
 return {lasers,guns,missiles};
}

// Fixed-speed manual guidance; turn rate is provisional.
export const VISOM_GUIDANCE={turnRate:1.15,pitchLimit:1.15,fov:.85};

// Limited automatic guidance for ordinary missiles; seeker angles/rate are provisional.
export const MISSILE_HOMING={turnRate:.45,acquisitionCone:Math.PI/6,trackingCone:Math.PI/4};

// AI aim and seeker response are provisional tuning values; both sides share them.
export const AI_MISSILE_ACCURACY={
 ground:{yawSpread:.035,pitchSpread:.018,turnRate:.18,updateInterval:.35},
 airborne:{yawSpread:.14,pitchSpread:.09,turnRate:.045,updateInterval:.75},
};

// User-confirmed laser-only hold-fire exceptions; chassis await content/models.
export const LASER_HOLD_FIRE_HAWCS=['scorp-assault','darken-tactical','merc-assault','union-assault'] as const;
export function allowsLaserHoldFire(chassis:string,weapon:VehicleWeapon){return weapon in LASERS&&(LASER_HOLD_FIRE_HAWCS as readonly string[]).includes(chassis);}

// Provisional floor for repeating a held player trigger; manual weapon intervals remain authoritative.
export const HELD_TRIGGER_INTERVAL=.5;

export function weaponMountCount(chassis:string,weapon:string){
 if(chassis==='merc-aip'||chassis==='airborne-insurgent-platform')return 1;
 if(chassis==='scorp-asv'&&weapon==='zWASP')return 1; // Duplicate slots already denote the ASV's left and right guns.
 if(chassis==='merc-assault'&&weapon==='RUPP')return 2;
 if(chassis==='union-sentry'&&weapon==='FIL-30')return 2;
 return (weapon in MACHINE_GUNS||chassis==='union-tactical'&&weapon==='P2MEC'||chassis==='scorp-sentry'&&weapon==='CETI'||chassis==='scorp-tactical'&&weapon==='RAID')?2:1;
}
export function weaponDisplayName(_chassis:string,weapon:string){return weapon;}
