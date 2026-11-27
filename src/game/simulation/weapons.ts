import {LASERS,type LaserWeapon,type LaserSpec,MISSILES,type MissileWeapon} from '../content/weapons.ts';
export function isLaser(weapon:string):weapon is LaserWeapon{return weapon in LASERS;}
export function laserRange(weapon:LaserWeapon,charge:number,profile?:LaserSpec){const p=profile??LASERS[weapon];if(p.chargeEffect==='damage')return p.range;const min=p.minRange??p.range;return min+(p.range-min)*Math.max(0,Math.min(1,charge));}
export function laserDamage(weapon:LaserWeapon,charge:number,profile?:LaserSpec){const p=profile??LASERS[weapon];return p.damage*(p.chargeEffect==='damage'?Math.max(0,Math.min(1,charge)):1);}

export function isMissile(weapon:string):weapon is MissileWeapon{return weapon in MISSILES;}
