import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
import {VEHICLES,resolveVehicle,type VehicleKind} from '../content/vehicles.ts';
import {MISSILES,INFANTRY_WEAPONS,MACHINE_GUNS,LASERS,weaponMountCount} from '../content/weapons.ts';
import type {Difficulty} from '../settings.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
const difficulties:Difficulty[]=['Easy','Medium','Hard'];
function mounted(d:Difficulty,kind:VehicleKind='union-sentry'){const s=new Simulation(d);s.units=[makeUnit('own',kind,0,0,false)];s.human={x:0,z:0};s.board();return s;}
test('all difficulties share each chassis speed and acceleration',()=>{
 for(const kind of Object.keys(VEHICLES) as VehicleKind[]){if(resolveVehicle(kind).category==='tower')continue;const samples=difficulties.map(d=>{const s=mounted(d,kind);for(let i=0;i<(kind==='merc-aip'?600:180);i++)s.tick(1/60,{...idle,boost:true});if(VEHICLES[kind].speed===0)assert.equal(s.speed,0);else assert.ok(s.speed*3.6>VEHICLES[kind].speed*.99);return {speed:s.speed,z:s.player.z};});assert.deepEqual(samples[0],samples[1]);assert.deepEqual(samples[1],samples[2]);}
});
test('CHUM and SAG5T retain weapon damage on every difficulty',()=>{
 for(const weapon of ['CHUM','SAG5T'] as const)for(const d of difficulties){const s=mounted(d),enemy=makeUnit('enemy','merc-sentry',0,100);s.units.push(enemy);s.iff='6707';enemy.cooldown=999;const p=s.fireMissile(enemy,weapon);assert.equal(p.damage,MISSILES[weapon].damage);for(let i=0;i<120;i++)s.tick(1/60,idle);assert.equal(s.mounted!.shield,35-MISSILES[weapon].damage);}
});
test('enemy RAID and DASY hit equally hard on Easy, Medium and Hard',()=>{
 for(const kind of ['merc-sentry','merc-tactical'] as const)for(const d of difficulties){const s=mounted(d),enemy=makeUnit('enemy',kind,0,100);s.units.push(enemy);enemy.yaw=Math.PI;enemy.aim=Math.PI;enemy.alert=true;enemy.attackCycle=1;s.tick(.02,idle);if(kind==='merc-sentry'){assert.equal(s.mounted!.shield,35);for(let i=0;i<90;i++)s.tick(.02,idle);}assert.equal(s.mounted!.shield,35-(kind==='merc-sentry'?LASERS.RAID.damage:MACHINE_GUNS.DASY.damage*weaponMountCount(kind,'DASY')));}
});
test('enemy infantry damage is also independent of difficulty',()=>{
 for(const d of difficulties){const s=mounted(d),enemy=makeUnit('enemy','merc-sentry',0,50);s.units.push(enemy);const soldier=s.forceEject(enemy)!;soldier.flight=null;soldier.yaw=Math.atan2(s.mounted!.x-soldier.x,s.mounted!.z-soldier.z);s.units=[s.mounted!];soldier.cooldown=0;s.tick(.02,idle);assert.equal(s.mounted!.shield,35-INFANTRY_WEAPONS.PRIF44.vehicleDamage);}
});
