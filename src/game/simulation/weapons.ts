import {LASERS,type LaserWeapon,type LaserSpec,MISSILES,type MissileWeapon} from '../content/weapons.ts';
export function isLaser(weapon:string):weapon is LaserWeapon{return weapon in LASERS;}
export function laserRange(weapon:LaserWeapon,charge:number,profile?:LaserSpec){const p=profile??LASERS[weapon];return p.minRange+(p.range-p.minRange)*Math.max(0,Math.min(1,charge));}

export function isMissile(weapon:string):weapon is MissileWeapon{return weapon in MISSILES;}
