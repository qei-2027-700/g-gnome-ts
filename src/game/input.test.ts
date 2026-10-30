import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readInput} from './input.ts';
import {Simulation,makeUnit} from './simulation/simulation.ts';
import {defaults,validateSettings} from './settings.ts';
import {MISSION} from './content/mission-1-1.ts';
test('short arrow taps use common HAWC horizontal speed and stop when released',()=>{
 for(const kind of [null,'union-sentry','merc-assault','merc-meson-tower'] as const){
  const s=new Simulation();s.units=[];s.human={x:0,z:0};
  if(kind){const unit=makeUnit('manual',kind,0,0,false);s.units=[unit];assert.ok(s.board());}
  const before={yaw:s.yaw,aim:s.aim,pitch:s.pitch},settings=defaults();
  s.tick(1/60,readInput(settings,new Set(['ArrowRight','ArrowUp'])));const tapped={yaw:s.yaw,aim:s.aim,pitch:s.pitch};
  assert.ok(tapped.aim-before.aim>0&&tapped.aim-before.aim<=.031);assert.ok(tapped.pitch-before.pitch>0&&tapped.pitch-before.pitch<(kind==='merc-assault'?.014:.01));
  s.tick(1/60,readInput(settings,new Set()));assert.equal(s.yaw,tapped.yaw);assert.equal(s.aim,tapped.aim);assert.equal(s.pitch,tapped.pitch);
  s.tick(1/60,readInput(settings,new Set(['ArrowLeft','ArrowDown'])));assert.ok(Math.abs(s.yaw-before.yaw)<1e-8);assert.ok(Math.abs(s.aim-before.aim)<1e-8);assert.ok(Math.abs(s.pitch-before.pitch)<1e-8);
  if(kind==='merc-meson-tower'){assert.equal(tapped.yaw,before.yaw);assert.equal(s.speed,0);}
 }
});
test('up/down arrows only pitch, left/right turn, PageUp/Down remain aliases and Enter stops',()=>{
 const s=new Simulation();s.human={...MISSION.vehicle};s.board();const settings=defaults();
 for(let i=0;i<30;i++)s.tick(1/60,readInput(settings,new Set(['ArrowRight','ArrowUp'])));
 assert.ok(s.yaw>0);assert.ok(s.pitch>0);assert.equal(s.throttle,0);
 for(let i=0;i<60;i++)s.tick(1/60,readInput(settings,new Set(['ArrowLeft','ArrowDown'])));
 assert.ok(s.yaw<0);assert.ok(s.pitch<0);assert.equal(s.throttle,0);
 s.pitch=0;s.tick(.05,readInput(settings,new Set(['PageUp'])));assert.ok(s.pitch>0);s.tick(.05,readInput(settings,new Set(['PageDown'])));s.tick(.05,readInput(settings,new Set(['PageDown'])));assert.ok(s.pitch<0);
 s.throttle=1;s.tick(.05,readInput(settings,new Set(['NumpadEnter'])));assert.equal(s.throttle,0);assert.ok(s.events.some(e=>e.type==='stop'));
 assert.ok(readInput(settings,new Set(['Enter'])).stop);assert.equal(readInput(settings,new Set(['Space'])).stop,false);assert.ok(readInput(settings,new Set(['Space'])).center);
});
test('old key settings migrate Q and pitch actions while preserving valid custom keys',()=>{
 const old=defaults();delete old.bindings.targetCursor;delete old.bindings.lookUp;delete old.bindings.lookDown;old.bindings.forward='KeyH';
 const settings=validateSettings(old);assert.equal(settings.bindings.forward,'KeyH');assert.equal(settings.bindings.targetCursor,'KeyQ');assert.equal(settings.bindings.lookUp,'PageUp');assert.equal(settings.bindings.lookDown,'PageDown');
});

test('legacy Space stop migrates to Enter while Space centers without stopping or speaking',()=>{
 const old=defaults();delete old.bindings.center;old.bindings.stop='Space';old.bindings.forward='KeyH';
 const settings=validateSettings(old);assert.equal(settings.bindings.stop,'Enter');assert.equal(settings.bindings.center,'Space');assert.equal(settings.bindings.forward,'KeyH');
 const s=new Simulation();s.human={...MISSION.vehicle};s.board();s.mounted!.yaw=.7;s.mounted!.aim=1.1;s.pitch=.3;s.throttle=.8;s.speed=10;s.selected=s.units[1].id;s.tracking=true;s.events=[];
 s.tick(.01,readInput(settings,new Set(['Space'])));
 assert.equal(s.pitch,0);assert.equal(s.mounted!.aim,s.mounted!.yaw);assert.equal(s.throttle,.8);assert.ok(s.speed>0);assert.equal(s.tracking,false);assert.equal(s.selected,s.units[1].id);assert.ok(!s.events.some(e=>e.type==='stop'));
 s.tick(.01,readInput(settings,new Set(['Enter'])));assert.equal(s.throttle,0);assert.equal(s.events.filter(e=>e.type==='stop').length,1);
});
test('centering on foot resets pitch and preserves facing',()=>{
 const s=new Simulation();s.pitch=-.4;s.humanYaw=1;s.tick(.01,readInput(defaults(),new Set(['Space'])));assert.equal(s.pitch,0);assert.equal(s.humanYaw,1);assert.ok(!s.events.some(e=>e.type==='stop'));
});
test('new weapon slots preserve saved fire bindings that already use digits 3 and 4',()=>{
 const old=defaults();delete old.bindings.fire3;delete old.bindings.fire4;old.bindings.fire1='Digit3';old.bindings.fire2='Digit4';const settings=validateSettings(old);
 assert.equal(settings.bindings.fire1,'Digit3');assert.equal(settings.bindings.fire2,'Digit4');assert.notEqual(settings.bindings.fire3,'Digit3');assert.notEqual(settings.bindings.fire4,'Digit4');assert.equal(new Set(Object.values(settings.bindings)).size,Object.keys(settings.bindings).length);
 const input=readInput(settings,new Set([settings.bindings.fire3,settings.bindings.fire4]));assert.equal(input.fire3,true);assert.equal(input.fire4,true);assert.equal(input.fire1,false);assert.equal(input.fire2,false);
});

test('ASV external arrows steer the whole chassis while the turret keeps its relative bearing',async()=>{
 const {MISSION_3_3}=await import('./content/missions/mission-3-3.ts');const s=new Simulation('Easy',MISSION_3_3),u=s.mounted!,settings=defaults();
 for(let i=0;i<30;i++)s.tick(1/60,readInput(settings,new Set(['ArrowRight','ArrowDown']),false,true));assert.ok(u.yaw>0);assert.equal(u.aim,u.yaw);assert.ok(s.pitch<0);assert.equal(s.throttle,0);
 const yaw=u.yaw;s.tick(.05,readInput(settings,new Set(['KeyD']),false,true));assert.ok(u.yaw>yaw);assert.equal(u.aim,u.yaw);
});

test('old arrow movement bindings migrate without losing custom fire keys; arrows look and W/S move',async()=>{
 const old=defaults();old.bindings.forward='ArrowUp';old.bindings.back='ArrowDown';old.bindings.fire1='Digit3';old.bindings.fire3='Digit1';const settings=validateSettings(old);assert.equal(settings.bindings.forward,'KeyW');assert.equal(settings.bindings.back,'KeyS');assert.equal(settings.bindings.fire1,'Digit3');
 const {MISSION_3_3}=await import('./content/missions/mission-3-3.ts');
 for(const s of [new Simulation(),new Simulation('Easy',MISSION_3_3)]){const before={x:s.player.x,z:s.player.z};for(let i=0;i<30;i++)s.tick(1/60,readInput(settings,new Set(['ArrowUp'])));assert.ok(s.pitch>0);assert.deepEqual({x:s.player.x,z:s.player.z},before);assert.equal(s.throttle,0);const pitch=s.pitch;s.tick(.05,readInput(settings,new Set()));assert.equal(s.pitch,pitch);s.tick(.05,readInput(settings,new Set(['Space'])));assert.equal(s.pitch,0);for(let i=0;i<120;i++)s.tick(1/60,readInput(settings,new Set(['KeyW'])));assert.ok(s.player.z>before.z);}
});
test('external W/S retain movement while up/down arrows only change pitch',async()=>{
 const {MISSION_3_3}=await import('./content/missions/mission-3-3.ts');const s=new Simulation('Easy',MISSION_3_3);for(let i=0;i<120;i++)s.tick(1/60,readInput(defaults(),new Set(['KeyW']),false,true));assert.ok(s.player.z>5);const before=s.pitch,throttle=s.throttle;s.tick(.05,readInput(defaults(),new Set(['ArrowUp']),false,true));assert.ok(s.pitch>before);assert.equal(s.throttle,throttle);
});

test('external horizontal arrows turn and vertical arrows pitch without moving on every chassis',async()=>{
 const {makeUnit}=await import('./simulation/simulation.ts');
 for(const kind of ['union-sentry','merc-sentry','union-asv','scorp-asv'] as const)for(const key of ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD']){
  const s=new Simulation();s.units=[makeUnit('own',kind,0,0,false)];s.human={x:0,z:0};s.board();const u=s.mounted!;s.aimBy(.3);s.lookBy(.2);
  for(let i=0;i<60;i++)s.tick(1/60,readInput(defaults(),new Set([key]),false,true));
  assert.ok(Math.abs((u.aim-u.yaw)-(u.spec.torsoLimit===0?0:.3))<1e-9,`${kind}/${key}: upper body relative bearing`);if(key==='ArrowUp')assert.ok(s.pitch>.2);else if(key==='ArrowDown')assert.ok(s.pitch<.2);else assert.equal(s.pitch,.2);
  if(key==='ArrowLeft'||key==='KeyA'){assert.ok(u.yaw<0);assert.equal(u.x,0);assert.equal(u.z,0);}
  else if(key==='ArrowRight'||key==='KeyD'){assert.ok(u.yaw>0);assert.equal(u.x,0);assert.equal(u.z,0);}
  else{assert.equal(u.yaw,0);assert.equal(u.x,0);assert.equal(u.z,0);assert.equal(s.throttle,0);}
 }
});
test('turning and advancing in external view changes the path while the turret follows the chassis',async()=>{
 const {makeUnit}=await import('./simulation/simulation.ts');const s=new Simulation();s.units=[makeUnit('own','union-asv',0,0,false)];s.human={x:0,z:0};s.board();
 for(let i=0;i<120;i++)s.tick(1/60,readInput(defaults(),new Set(['KeyW','ArrowRight']),false,true));
 assert.ok(s.player.x>1);assert.ok(s.player.z>1);assert.ok(s.yaw>0);assert.equal(s.mounted!.aim,s.mounted!.yaw);assert.equal(s.pitch,0);
});

test('held custom keys and mouse repeat at controlled intervals while releases and presses keep weapon cooldowns',async()=>{
 const {MISSION_2_4}=await import('./content/missions/mission-2-4.ts');const {weaponMountCount}=await import('./content/weapons.ts');const settings=defaults();settings.bindings.fire1='KeyH';settings.bindings.fire2='KeyK';settings.bindings.fire3='KeyL';
 for(const [key,weapon] of [['KeyH','DASY'],['KeyK','SAG5T'],['KeyL','RAID']] as const){const s=new Simulation('Easy',MISSION_2_4),count=()=>s.events.filter(e=>e.type==='shot'&&e.weapon===weapon).length,times:number[]=[];
  for(let i=0;i<300;i++){const before=count();s.tick(1/60,readInput(settings,new Set([key])));if(count()>before)times.push(s.time);}assert.ok(times.length>=2&&times.length<=11,weapon);for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=.5-1e-8,weapon);
  for(let i=0;i<120;i++)s.tick(1/60,readInput(settings,new Set()));const before=count();s.tick(1/60,readInput(settings,new Set([key])));assert.equal(count(),before+weaponMountCount(s.mounted!.kind,weapon));s.tick(1/60,readInput(settings,new Set()));s.tick(1/60,readInput(settings,new Set([key])));assert.equal(count(),before+weaponMountCount(s.mounted!.kind,weapon),'repress cannot bypass weapon cooldown');
 }
 const mouse=new Simulation('Easy',MISSION_2_4);for(let i=0;i<120;i++)mouse.tick(1/60,readInput(settings,new Set(),true));assert.ok(mouse.mounted!.ammunition.DASY!<=296);assert.ok(mouse.mounted!.ammunition.DASY!>=295);
});
test('holding a firearm while boarding does not trigger another shot from the new chassis',async()=>{
 const {MISSION_2_4}=await import('./content/missions/mission-2-4.ts');const s=new Simulation('Easy',MISSION_2_4),u=s.mounted!,keys=new Set(['Digit1']),settings=defaults();s.eject('ground');s.units=[u];s.human={x:0,z:-10};
 s.tick(1/60,readInput(settings,keys));assert.equal(s.events.filter(e=>e.type==='shot').length,1);s.human={x:0,z:0};s.board();for(let i=0;i<120;i++)s.tick(1/60,readInput(settings,keys));assert.equal(u.ammunition.DASY,300);s.tick(1/60,readInput(settings,new Set()));s.tick(1/60,readInput(settings,keys));assert.equal(u.ammunition.DASY,299);
});

test('only the four confirmed special chassis bypass the full-charge wait for held laser fire',async()=>{
 const {LASER_HOLD_FIRE_HAWCS,allowsLaserHoldFire}=await import('./content/weapons.ts');const {MISSION_2_4}=await import('./content/missions/mission-2-4.ts');
 for(const kind of LASER_HOLD_FIRE_HAWCS){assert.ok(allowsLaserHoldFire(kind,'RAID'));assert.ok(allowsLaserHoldFire(kind,'FIL-30'));assert.equal(allowsLaserHoldFire(kind,'DASY'),false);assert.equal(allowsLaserHoldFire(kind,'SAG5T'),false);
  // Isolate the trigger policy with a reserved chassis identity. No guessed model or performance is registered in production content.
  const s=new Simulation('Easy',MISSION_2_4),u=s.mounted!;u.kind=kind as typeof u.kind;
  let minimumEnergy=u.energy;for(let i=0;i<120;i++){s.tick(1/60,readInput(defaults(),new Set(['Digit3'])));minimumEnergy=Math.min(minimumEnergy,u.energy);}const shots=s.events.filter(e=>e.type==='shot'&&e.weapon==='RAID');assert.ok(shots.length>=2&&shots.length<=3,kind);assert.ok(minimumEnergy<u.spec.energy);assert.ok(u.laserCharge<1);
 }
 for(const kind of ['merc-tactical','union-tactical','scorp-tactical','union-sentry','merc-sentry','scorp-sentry'])assert.equal(allowsLaserHoldFire(kind,'RAID'),false);
});

test('ordinary held lasers wait for full moving recharge while the confirmed exception uses its own interval',async()=>{
 const {MISSION_2_4}=await import('./content/missions/mission-2-4.ts');
 for(const rapid of [false,true]){const s=new Simulation('Easy',MISSION_2_4),u=s.mounted!;if(rapid)u.kind='merc-assault';s.throttle=.6;const charges:number[]=[],times:number[]=[];
  for(let i=0;i<180;i++){const before=s.events.filter(e=>e.type==='shot'&&e.weapon==='RAID').length,charge=u.laserCharge;s.tick(1/60,readInput(defaults(),new Set(['Digit3'])));if(s.events.filter(e=>e.type==='shot'&&e.weapon==='RAID').length>before){charges.push(charge);times.push(s.time);}}
  assert.ok(times.length>=2);if(rapid)assert.ok(charges.slice(1).some(charge=>charge<.9));else{assert.ok(charges.slice(1).every(charge=>charge===1));assert.ok(times[1]-times[0]>=1.39);}
 }
});


test('HAWC horizontal look is shared across all chassis and preserves sensitivity, vertical tuning and release',()=>{
 for(const kind of ['union-sentry','union-tactical','merc-sentry','merc-tactical','merc-assault','scorp-sentry','scorp-tactical','merc-cruiser','merc-meson-tower'] as const){
  const s=new Simulation(),u=makeUnit('own',kind,0,0,false);s.units=[u];s.human={x:0,z:0};assert.ok(s.board());const settings=defaults();
  for(let i=0;i<30;i++)s.tick(1/60,readInput(settings,new Set(['ArrowRight','ArrowUp'])));
  assert.ok(Math.abs(u.aim-.75)<1e-8);assert.ok(Math.abs(s.pitch-(kind==='merc-assault'?.4125:.275))<1e-8);
  const aim=s.aim,pitch=s.pitch;s.tick(1/60,readInput(settings,new Set()));assert.equal(s.aim,aim);assert.equal(s.pitch,pitch);
  s.aimMouseBy(40,20,2);const yawScale=kind==='merc-meson-tower'?.0025:.005,pitchScale=kind==='merc-assault'?.00375:.0025;assert.ok(Math.abs(s.aim-aim-40*yawScale*2)<1e-8);assert.ok(Math.abs(s.pitch-pitch+20*pitchScale*2)<1e-8);assert.equal(s.speed,0);
 }
});


test('HAWC mouse look carries past upper-body limits without slowing or moving forward',()=>{
 for(const kind of ['union-sentry','merc-tactical','merc-assault','merc-sentry','merc-cruiser'] as const){
  const s=new Simulation(),u=makeUnit('own',kind,0,0,false);s.units=[u];s.human={x:0,z:0};assert.ok(s.board());const start={x:u.x,z:u.z};
  s.aimMouseBy(400,0);assert.ok(Math.abs(s.aim-2)<1e-8);assert.ok(Math.abs(Math.atan2(Math.sin(u.aim-u.yaw),Math.cos(u.aim-u.yaw)))<=u.spec.torsoLimit+1e-8);
  if(u.spec.torsoLimit===0)assert.equal(u.yaw,u.aim);else if(u.spec.torsoLimit<Math.PI)assert.ok(u.yaw>0);else assert.equal(u.yaw,0);
  s.aimMouseBy(-800,0);assert.ok(Math.abs(s.aim+2)<1e-8);s.tick(1/60,readInput(defaults(),new Set()));assert.ok(Math.abs(s.aim+2)<1e-8);assert.deepEqual({x:u.x,z:u.z},start);assert.equal(s.speed,0);
 }
});
test('Union ASV, AIP and infantry retain their existing manual horizontal look speed',()=>{
 for(const kind of ['union-asv','merc-aip',null] as const){const s=new Simulation();s.units=[];s.human={x:0,z:0};if(kind){s.units=[makeUnit('own',kind,0,0,false)];assert.ok(s.board());}for(let i=0;i<30;i++)s.tick(1/60,readInput(defaults(),new Set(['ArrowRight'])));assert.ok(Math.abs(s.aim-(kind?.3:.9))<1e-8);const aim=s.aim;s.aimMouseBy(40,0);assert.ok(Math.abs(s.aim-aim-.1)<1e-8);}
});

test('actual Merc Assault RUPP keeps firing both barrels while key or mouse is held, even before moving recharge completes',()=>{
 for(const mouse of [false,true]){
  const s=new Simulation(),u=makeUnit('assault','merc-assault',0,0,false);s.units=[u];s.human={x:0,z:0};s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.completionEnabled=false;assert.ok(s.board());s.throttle=.6;
  const times:number[]=[],charges:number[]=[];let minimumEnergy=u.energy;
  for(let i=0;i<240;i++){const before=s.events.filter(e=>e.type==='shot'&&e.weapon==='RUPP').length,charge=u.laserCharge;s.tick(1/60,readInput(defaults(),new Set(mouse?[]:['Digit1']),mouse));const after=s.events.filter(e=>e.type==='shot'&&e.weapon==='RUPP').length;if(after>before){assert.equal(after-before,2);times.push(s.time);charges.push(charge);}minimumEnergy=Math.min(minimumEnergy,u.energy);}
  assert.ok(times.length>=4);assert.ok(charges.slice(1).some(charge=>charge<.75));assert.ok(minimumEnergy<u.spec.energy);for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=s.weapons.lasers.RUPP.interval-1e-6);
  const shots=s.events.filter(e=>e.type==='shot'&&e.weapon==='RUPP').length;for(let i=0;i<120;i++)s.tick(1/60,readInput(defaults(),new Set()));assert.equal(s.events.filter(e=>e.type==='shot'&&e.weapon==='RUPP').length,shots);
 }
});
test('Merc Assault RUPP hold-fire exception bypasses the shared half-second input floor without bypassing its weapon interval',()=>{
 const s=new Simulation(),u=makeUnit('assault','merc-assault',0,0,false);s.units=[u];s.human={x:0,z:0};s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.completionEnabled=false;assert.ok(s.board());
 // A short interval isolates the input policy; production weapon performance stays unchanged.
 s.weapons.lasers.RUPP.interval=.2;s.weapons.lasers.RUPP.recharge=3;const times:number[]=[];
 for(let i=0;i<90;i++){const before=s.events.length;s.tick(1/60,readInput(defaults(),new Set(['Digit1'])));if(s.events.slice(before).some(e=>e.type==='shot'&&e.weapon==='RUPP'))times.push(s.time);}
 assert.ok(times.length>=7);for(let i=1;i<times.length;i++){assert.ok(times[i]-times[i-1]>=.2-1e-6);assert.ok(times[i]-times[i-1]<.25);}
});
