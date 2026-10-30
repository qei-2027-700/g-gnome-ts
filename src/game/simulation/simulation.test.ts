import {LASERS,weaponMountCount} from '../content/weapons.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,distance,angle,type Input} from './simulation.ts';
import {MISSION} from '../content/mission-1-1.ts';
import {DEFAULT_MISSION} from '../content/missions/index.ts';
import {VEHICLES} from '../content/vehicles.ts';
import {validateSettings,defaults} from '../settings.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};
const step=(s:Simulation,seconds:number,input:Partial<Input>={})=>{for(let i=0;i<seconds*60;i++)s.tick(1/60,{...idle,...input});};
const mounted=()=>{const s=new Simulation();s.human={...MISSION.vehicle};assert.ok(s.board());return s;};
test('walk, auto-board, name event, eject and reboard retain unit damage/ammo',()=>{const s=new Simulation();assert.equal(s.iff,'2620');assert.equal(s.mounted,null);step(s,3.5,{forward:true});assert.equal(s.mounted?.kind,'union-sentry');assert.equal(s.events.filter(e=>e.type==='board').length,1);s.mounted!.ammo=390;s.mounted!.armor=77;s.eject();assert.equal(s.mounted,null);s.tick(1/60,idle);assert.equal(s.mounted,null);step(s,3);s.human={x:0,z:18};assert.ok(s.board());assert.equal(s.mounted!.ammo,390);assert.equal(s.mounted!.armor,77);});
test('throttle reaches 70 km/h, persists, stop brakes, torso obeys limits',()=>{const s=mounted();s.units=s.units.slice(0,1);step(s,5,{boost:true});assert.ok(Math.abs(s.speed*3.6-70)<.1);assert.equal(s.events.filter(e=>e.type==='boost').length,1);const before=s.player.z;step(s,1);assert.ok(s.player.z>before);step(s,4,{stop:true});assert.ok(Math.abs(s.speed)<.1);s.aimBy(100);assert.ok(Math.abs(s.mounted!.aim-s.mounted!.yaw)<=VEHICLES['union-sentry'].torsoLimit);});
test('machine gun consumes ammunition, laser consumes energy, empty weapons do not fire',()=>{const s=mounted();s.units=s.units.slice(0,1);const u=s.mounted!;s.fire(1);assert.equal(u.ammo,399);assert.equal(u.energy,1600);u.cooldown=0;s.fire(2);assert.equal(u.energy,1598);u.cooldown=0;u.ammo=0;const count=s.events.length;s.fire(1);assert.equal(s.events.length,count);u.energy=0;s.fire(2);assert.equal(s.events.length,count);});
test('aim, range and rocks block laser hits; damage arrives on contact and shields protect armor',()=>{
 for(const [x,z,hit] of [[0,100,true],[100,100,false],[0,450,false]] as const){
  const s=mounted();s.iff='6707';const target=s.units[1];target.x=x;target.z=z;const shield=target.shield,armor=target.armor;
  s.fire(2);assert.equal(target.shield,shield);step(s,2);assert.equal(target.shield,shield-(hit?LASERS['FIL-30'].damage*weaponMountCount(s.mounted!.kind,'FIL-30'):0));assert.equal(target.armor,armor);
 }
 const s=mounted(),target=s.units[1];s.damage(target,30);assert.ok(target.armor<VEHICLES[target.kind].armor);assert.equal(s.lineOfSight({x:-40,z:30},{x:-40,z:120}),false);
});
test('IFF controls AI launch; missile damage stays identical across difficulty while aim can miss',()=>{
 for(const difficulty of ['Easy','Medium','Hard'] as const){
  const s=new Simulation(difficulty);s.units[0].z=100;s.human={x:0,z:100};s.board();s.units[1].x=0;s.units[1].yaw=Math.PI;s.units[1].aim=Math.PI;s.tick(.05,idle);
  assert.ok(s.enemies[0].alert);assert.equal(s.humanHealth,100);assert.equal(s.missiles.length,1);assert.equal(s.missiles[0].damage,5);assert.equal(s.mounted!.shield,35);
  step(s,1.3);assert.ok([35,30].includes(s.mounted!.shield));
  s.iff='6707';const health=s.humanHealth;step(s,5);assert.equal(s.units[1].alert,false);assert.equal(s.enemies.length,0);assert.equal(s.missiles.length,0);assert.equal(s.humanHealth,health);
 }
});
test('idle start and boarding are safe; forward approach triggers discovery',()=>{
 const s=new Simulation();step(s,30);assert.ok(s.enemies.every(e=>!e.alert));assert.equal(s.humanHealth,100);assert.equal(s.missiles.length,0);
 s.human={...MISSION.vehicle};s.board();step(s,10);assert.ok(s.enemies.every(e=>!e.alert));
 for(let i=0;i<1200&&!s.enemies[0].alert;i++)s.tick(1/60,{...idle,forward:true});
 assert.ok(s.enemies[0].alert);assert.ok(s.player.z>60);assert.equal(s.enemies[1].alert,false);
});
test('rocks hide nearby player; firing at an enemy alerts it beyond detection radius',()=>{
 const s=new Simulation();const enemy=s.units[1];enemy.x=-40;enemy.z=130;s.human={x:-40,z:20};s.tick(.05,idle);assert.equal(enemy.alert,false);
 const gunner=mounted();const target=gunner.units[1];target.x=0;target.z=185;gunner.fire(2);assert.equal(target.alert,false);step(gunner,3.1);assert.ok(target.alert);
});
test('missiles have travel time, can be dodged and hit rocks before the player',()=>{
 const s=mounted();const enemy=s.units[1];enemy.x=0;enemy.z=110;enemy.cooldown=999;
 const shield=s.mounted!.shield;s.fireMissile(enemy,'CHUM');step(s,.2);assert.equal(s.mounted!.shield,shield);step(s,1.3);assert.equal(s.mounted!.shield,shield-5);assert.ok(s.events.some(e=>e.type==='impact'));
 const dodge=mounted();const shooter=dodge.units[1];shooter.x=0;shooter.z=110;shooter.cooldown=999;dodge.fireMissile(shooter,'CHUM');dodge.mounted!.x=120;step(dodge,2);assert.equal(dodge.mounted!.shield,35);
 const cover=mounted();const attacker=cover.units[1];attacker.x=-40;attacker.z=120;attacker.cooldown=999;cover.mounted!.x=-40;cover.mounted!.z=30;cover.fireMissile(attacker,'CHUM');step(cover,1.4);assert.equal(cover.mounted!.shield,35);assert.equal(cover.missiles.length,0);assert.ok(cover.events.some(e=>e.type==='impact'));
});
test('swept collision catches fast rockets; tactical defense fires two missiles',()=>{
 const s=mounted();const enemy=s.units[1];enemy.x=0;enemy.z=60;enemy.cooldown=999;const p=s.fireMissile(enemy,'CHUM');p.vx=0;p.vy=0;p.vz=-4000;p.x=0;p.y=4;s.tick(.05,idle);assert.equal(s.mounted!.shield,30);assert.equal(s.missiles.length,0);
 const tactical=mounted();tactical.units[1].alive=false;tactical.units[2].x=0;tactical.units[2].z=130;tactical.units[2].yaw=Math.PI;tactical.units[2].aim=Math.PI;tactical.tick(.05,idle);assert.equal(tactical.missiles.length,2);assert.ok(tactical.missiles.every(m=>m.weapon==='SAG5T'));
});
test('waypoint and all enemies are both required; death cannot produce a win',()=>{const s=mounted();for(const u of s.enemies)s.damage(u,1000);s.tick(.05,idle);assert.equal(s.status,'running');s.mounted!.z=MISSION.waypoint.z;s.tick(.05,idle);assert.equal(s.status,'won');const lost=mounted();lost.waypoint=true;for(const u of lost.enemies)lost.damage(u,1000);lost.damage(lost.mounted,1000);lost.damage(null,1000);lost.tick(.05,idle);assert.equal(lost.status,'lost');});
test('fresh mission resets state and setting validation rejects corrupt storage',()=>{const s=mounted();s.eject();s.iff='0000';s.waypoint=true;const next=new Simulation();assert.equal(next.iff,'2620');assert.equal(next.kills,0);assert.equal(next.waypoint,false);assert.equal(next.mounted,null);assert.deepEqual(validateSettings(null),defaults());assert.equal(validateSettings({difficulty:'Impossible',sfx:Infinity,voice:-2}).difficulty,'Easy');assert.equal(validateSettings({voice:-2}).voice,0);const bad=defaults();bad.bindings.left=bad.bindings.right;assert.deepEqual(validateSettings(bad).bindings,defaults().bindings);});
// Fixed forward weapons require chassis alignment and a firing pause before advancing again.
test('a complete Easy sortie is winnable through normal movement and firing',()=>{const s=mounted();let fired=0;for(let frame=0;frame<60*150&&s.status==='running';frame++){const target=s.enemies.sort((a,b)=>distance(a,s.player)-distance(b,s.player))[0];if(target){s.selected=target.id;s.tracking=true;}const destination=target??MISSION.waypoint;const bearing=Math.atan2(destination.x-s.player.x,destination.z-s.player.z);const delta=Math.atan2(Math.sin(bearing-s.yaw),Math.cos(bearing-s.yaw));const move=target?distance(target,s.player)>90:!s.waypoint;s.tick(1/60,{...idle,forward:move,stop:!move,left:delta<-.008,right:delta>.008,fire1:!!target&&frame%7===0,fire2:!!target&&frame%7===0});fired++;}assert.equal(s.status,'won',`status=${s.status}, kills=${s.kills}, waypoint=${s.waypoint}, armor=${s.mounted?.armor}, frames=${fired}`);});

test('Q selects the object under the cursor, E always chooses nearest hostile and Tab cycles',()=>{
 const s=mounted();const [own,a,b]=s.units;a.x=0;a.z=100;b.x=22;b.z=160;
 assert.equal(s.selectInCrosshair()?.id,a.id);assert.equal(s.selected,a.id);assert.equal(s.events.filter(e=>e.type==='target-select').length,1);
 s.selectTarget();s.selectTarget();assert.equal(s.selected,a.id);assert.equal(s.events.filter(e=>e.type==='target-select').length,1);
 s.cycleTarget();assert.equal(s.selected,b.id);s.cycleTarget(true);assert.equal(s.selected,a.id);
 s.tracking=true;s.clearTarget();assert.equal(s.target,null);assert.equal(s.tracking,false);
 s.mounted!.aim=1;assert.equal(s.selectInCrosshair(),null);assert.equal(s.target,null);assert.equal(s.events.filter(e=>e.type==='target-select').length,2);
 own.pilot=true;
});
test('selected target reports shields and lock, respects pitch and disappears on destruction',()=>{
 const s=mounted(),enemy=s.units[1];enemy.x=0;enemy.z=100;s.selectTarget();assert.ok(s.targetState?.locked);
 s.damage(enemy,11);assert.equal(s.targetState!.shield,.5);assert.equal(s.targetState!.armor,1);
 s.pitch=.5;assert.equal(s.targetState?.onAim,false);assert.equal(s.selectInCrosshair(),null);
 assert.equal(s.targetState,null);s.pitch=0;enemy.z=300;s.selectTarget();assert.equal(s.targetState?.locked,false);
 s.damage(enemy,1000);s.tick(.01,idle);assert.equal(s.selected,null);assert.equal(s.targetState,null);
});
test('stop acknowledges once per press, including zero throttle, and takes priority over boost',()=>{
 const s=mounted();s.units=s.units.slice(0,1);step(s,2,{boost:true});s.events=[];
 step(s,1,{stop:true,boost:true});assert.equal(s.throttle,0);assert.equal(s.events.filter(e=>e.type==='stop').length,1);assert.equal(s.events.filter(e=>e.type==='boost').length,0);
 s.tick(.01,idle);s.tick(.01,{...idle,stop:true});assert.equal(s.events.filter(e=>e.type==='stop').length,2);
 const foot=new Simulation();step(foot,1,{stop:true});assert.equal(foot.events.filter(e=>e.type==='stop').length,0);
});

test('player hits acquire an unselected target, misses do not and an existing selection stays',()=>{
 const s=mounted(),a=s.units[1],b=s.units[2];a.x=0;a.z=100;b.x=40;b.z=160;
 s.fire(1);assert.equal(s.selected,a.id);assert.equal(s.targetState?.unit,a);assert.ok(s.events.some(e=>e.type==='target'&&e.unit===a));
 s.clearTarget();s.mounted!.cooldown=0;s.mounted!.aim=Math.PI/2;s.fire(1);assert.equal(s.selected,null);
 s.selected=b.id;s.mounted!.cooldown=0;s.mounted!.aim=0;s.fire(1);assert.equal(s.selected,b.id);
 s.clearTarget();a.shield=0;for(const part of Object.keys(a.parts) as (keyof typeof a.parts)[])a.parts[part]=.01;s.mounted!.cooldown=0;s.fire(1);assert.equal(a.alive,false);assert.equal(s.selected,null);
});

test('common ping warning follows living hostile awareness for every mounted vehicle',()=>{
 for(const kind of ['union-sentry','merc-sentry','merc-tactical'] as const){
  const s=new Simulation();s.units[0]=makeUnit('player',kind,0,18,false);s.human={x:0,z:18};s.board();
  assert.equal(s.detected,false);const enemy=s.units[1];enemy.alert=true;assert.equal(s.detected,true);
  s.iff='6707';assert.equal(s.detected,false);s.iff='2620';assert.equal(s.detected,true);
  enemy.pilot=false;assert.equal(s.detected,false);enemy.pilot=true;enemy.alive=false;assert.equal(s.detected,false);
 }
 const fresh=new Simulation();assert.equal(fresh.detected,false);
});

test('Merc Sentry approaches at 85 km/h and stays fast in close combat',()=>{
 for(const [z,expected] of [[140,85],[100,85]]){
  const s=mounted();s.mounted!.z=0;const enemy=s.units[1];s.units[2].alive=false;enemy.x=0;enemy.z=z;enemy.yaw=Math.PI;enemy.aim=Math.PI;enemy.alert=true;enemy.cooldown=999;
  enemy.speed=expected/3.6;const before={x:enemy.x,z:enemy.z};s.tick(.05,idle);assert.ok(Math.abs(distance(before,enemy)/.05*3.6-expected)<.01);
 }
});
test('Merc upper body rotates independently within its profile and cannot fire behind its guns',()=>{
 const s=mounted();s.mounted!.z=0;const enemy=s.units[1];s.units[2].alive=false;enemy.x=40;enemy.z=100;enemy.alert=true;enemy.yaw=0;enemy.aim=0;
 s.tick(.05,idle);assert.equal(s.events.filter(e=>e.type==='shot'&&e.unit===enemy).length,0);
 for(let i=0;i<90;i++){s.tick(1/60,idle);const offset=angle(enemy.aim-enemy.yaw);assert.ok(Math.abs(offset)<=VEHICLES[enemy.kind].torsoLimit+1e-8);}
 assert.ok(Math.abs(angle(enemy.aim-enemy.yaw))>.01);
});


test('full power accelerates gradually on every chassis; enemy movement uses the same inertia',()=>{
 for(const kind of ['union-sentry','merc-sentry','merc-tactical'] as const){
  const s=new Simulation();s.units=[makeUnit('own',kind,0,18,false)];s.human={...MISSION.vehicle};s.board();s.tick(.05,{...idle,boost:true});const top=VEHICLES[kind].speed/3.6;assert.ok(s.speed>0&&s.speed<top*.2);const first=s.speed;step(s,.5,{boost:true});assert.ok(s.speed>first&&s.speed<top*.9);step(s,3,{boost:true});assert.ok(s.speed>top*.99);assert.ok(s.speed<=top);
 }
 const s=mounted(),enemy=s.units[1];s.units=[s.mounted!,enemy];s.mounted!.z=0;enemy.x=0;enemy.z=140;enemy.alert=true;enemy.cooldown=999;
 s.tick(.05,idle);assert.ok(enemy.speed>0&&enemy.speed<VEHICLES[enemy.kind].speed/3.6*.2);const first=enemy.speed;
 for(let i=0;i<180;i++){enemy.x=0;enemy.z=140;s.tick(1/60,idle);}assert.ok(enemy.speed>first);assert.ok(enemy.speed*3.6>84);
});


test('Merc Tactical Defense uses the manual 72 km/h in AI movement without a hidden speed reduction',()=>{
 const s=mounted(),enemy=makeUnit('tactical','merc-tactical',0,200);s.units=[s.mounted!,enemy];s.mounted!.z=0;enemy.yaw=Math.PI;enemy.aim=Math.PI;enemy.alert=true;enemy.cooldown=999;
 assert.equal(VEHICLES['merc-tactical'].speed,72);
 let actual=0;for(let i=0;i<360;i++){enemy.x=0;enemy.z=200;const before={x:enemy.x,z:enemy.z};s.tick(1/60,idle);actual=distance(before,enemy)*60*3.6;assert.ok(actual<=72+1e-8);}
 assert.ok(Math.abs(actual-72)<.01);assert.ok(Math.abs(enemy.speed*3.6-72)<.01);
});

test('Scorp slots consume independently through custom fire bindings, survive reboarding and reset on retry',async()=>{
 const {readInput}=await import('../input.ts');
 const mission=structuredClone(new Simulation().mission);mission.units=[{id:'scorp',kind:'scorp-asv',x:0,z:0,pilot:false}];mission.assignedUnitId='scorp';mission.startMountedUnitId='scorp';const s=new Simulation('Easy',mission);
 const u=s.mounted!,settings=defaults();settings.bindings={...settings.bindings,fire1:'KeyJ',fire2:'KeyK',fire3:'KeyL',fire4:'KeyU'};
 const shoot=(key:string)=>{u.cooldown=0;s.tick(1/60,readInput(settings,new Set([key])));};
 shoot('KeyJ');assert.deepEqual(u.slotAmmo,[799,800,20,10]);assert.equal(u.ammunition.zWASP,1599);
 shoot('KeyK');assert.deepEqual(u.slotAmmo,[799,799,20,10]);
 u.slotAmmo[0]=0;const before=s.events.filter(e=>e.type==='shot').length;shoot('KeyJ');assert.equal(s.events.filter(e=>e.type==='shot').length,before);
 shoot('KeyK');assert.equal(u.slotAmmo[1],798);assert.equal(u.ammunition.zWASP,798);
 shoot('KeyL');shoot('KeyU');assert.deepEqual(u.slotAmmo,[0,798,19,9]);assert.deepEqual(s.missiles.map(m=>m.weapon),['SREM','UNKPA']);
 s.eject();s.flight=null;s.human={x:u.x,z:u.z};step(s,3);s.human={x:u.x,z:u.z};if(!s.mounted)assert.ok(s.board());assert.equal(s.mounted,u);assert.deepEqual(u.slotAmmo,[0,798,19,9]);
 const retry=new Simulation('Easy',mission).mounted!;assert.deepEqual(retry.slotAmmo,[800,800,20,10]);assert.equal(retry.ammunition.zWASP,1600);
 retry.ammunition.zWASP=5;assert.deepEqual(retry.slotAmmo.slice(0,2),[3,2]);retry.slotAmmo[0]!--;assert.equal(retry.ammunition.zWASP,4);
});

test('AI cycles past an empty left zWASP and consumes the right slot',()=>{
 const s=mounted();s.mission.rocks=[];
 const original=makeUnit('armed','scorp-asv',0,70,true);original.iff='enemy';original.slotAmmo[0]=0;original.slotAmmo[1]=2;original.slotAmmo[2]=0;original.slotAmmo[3]=0;original.alert=true;original.aim=Math.PI;s.units=[s.mounted!,original];
 step(s,12);assert.equal(original.slotAmmo[0],0);assert.ok(original.slotAmmo[1]!<2);assert.equal(original.ammunition.zWASP,original.slotAmmo[1]);
});

function homingSetup(weapon:import('../content/weapons.ts').MissileWeapon='SREM'){
 const mission=structuredClone(new Simulation().mission);mission.completionEnabled=false;mission.rocks=[];mission.units=[{id:'own',kind:'scorp-asv',x:0,z:0,pilot:false,overrides:{weapons:[weapon],initialAmmo:{[weapon]:10}}},{id:'target',kind:'union-asv',x:0,z:160,pilot:false}];mission.assignedUnitId='own';mission.startMountedUnitId='own';
 const s=new Simulation('Easy',mission);s.selected='target';return {s,target:s.units[1]};
}
test('ordinary missiles fired through input turn toward a displaced target with bounded turn and fixed speed',async()=>{
 const {MISSILE_HOMING,MISSILES}=await import('../content/weapons.ts');
 for(const weapon of ['SREM','UNKPA','TCROCK','HSSO','SAG5T','CHUM'] as const){
  const {s,target}=homingSetup(weapon);s.tick(1/60,{...idle,fire1:true});const p=s.missiles[0];assert.equal(p.homingTargetId,target.id);const before={vx:p.vx,vy:p.vy,vz:p.vz};target.x=12;s.clearTarget();s.tick(.05,idle);
  const speed=Math.hypot(p.vx,p.vy,p.vz),turn=Math.acos(Math.min(1,(before.vx*p.vx+before.vy*p.vy+before.vz*p.vz)/Math.hypot(before.vx,before.vy,before.vz)/speed));assert.ok(p.vx>before.vx,weapon);assert.ok(turn<=MISSILE_HOMING.turnRate*.05+1e-8);assert.ok(Math.abs(speed-MISSILES[weapon].speed)<1e-8);
  const shield=target.shield;step(s,2);assert.ok(target.shield<shield,`${weapon} tracks to physical impact`);
 }
});
test('missiles lose a target outside the cone or destroyed, and never retarget when selection changes',()=>{
 for(const lost of ['cone','destroyed'] as const){const {s,target}=homingSetup();s.tick(1/60,{...idle,fire1:true});const p=s.missiles[0];if(lost==='cone')target.x=200;else target.alive=false;
  const before={vx:p.vx,vy:p.vy,vz:p.vz};s.tick(.05,idle);assert.equal(p.homingTargetId,undefined);target.x=0;target.alive=true;step(s,.1);assert.deepEqual({vx:p.vx,vy:p.vy,vz:p.vz},before);
 }
 const {s,target}=homingSetup();s.selected=null;s.tick(1/60,{...idle,fire1:true});const p=s.missiles[0],vx=p.vx;s.selected=target.id;target.x=10;step(s,.2);assert.equal(p.homingTargetId,undefined);assert.equal(p.vx,vx);
 const outside=homingSetup();outside.target.x=200;outside.s.tick(1/60,{...idle,fire1:true});assert.equal(outside.s.missiles[0].homingTargetId,undefined);
});
test('AI missiles retain their actual attack target instead of the player selection',()=>{
 const {s,target}=homingSetup();const shooter=makeUnit('shooter','scorp-rocket-tower',0,300,true);shooter.iff='enemy';shooter.yaw=Math.PI;shooter.aim=Math.PI;target.pilot=true;target.iff=s.iff;shooter.aggressorId=target.id;shooter.aggressorUntil=100;shooter.alert=true;s.units.push(shooter);s.mounted!.z=-500;s.tick(.05,idle);
 const missiles=s.missiles.filter(p=>p.owner===shooter.id);assert.equal(missiles.length,2);assert.ok(missiles.every(p=>p.homingTargetId===target.id));const p=missiles[0],before=p.vx;target.x=10;step(s,.5);assert.ok(p.vx>before);
});


test('friendly AI uses dispersed aim and delayed guidance for vehicles and ejected enemy pilots',()=>{
 const delays:number[]=[];
 for(const airborne of [false,true]){
  const {s,target}=homingSetup();s.mounted!.x=100;s.mounted!.z=0;target.iff='enemy';target.pilot=true;target.cooldown=999;
  const ally=makeUnit('friendly-tower','scorp-rocket-tower',0,20,true);ally.iff=s.iff;ally.personId='kylie';s.units.push(ally);s.mission.companions=[{personId:'kylie',unitId:ally.id,name:{ja:'キリー',en:'Kylie'},key:'F2'}];
  if(airborne)s.damage(target,9999);const victim=airborne?s.soldiers[0]:target;s.selected=victim.id;
  assert.deepEqual(s.sendAllyOrder('kylie','attack').accepted,[ally.id]);s.tick(.05,idle);ally.cooldown=999;
  const p=s.missiles.find(p=>p.owner===ally.id)!;assert.ok(p?.aiGuidance);assert.ok(Math.hypot(p.aiGuidance.offset.x,p.aiGuidance.offset.y,p.aiGuidance.offset.z)>0);const point={...p.aiGuidance.point};delays.push(p.aiGuidance.refreshAt-s.time);victim.x=12;
  s.tick(.05,idle);assert.deepEqual(p.aiGuidance.point,point);step(s,airborne?.8:.4);assert.ok(p.aiGuidance.point.x>point.x);
 }
 assert.ok(delays[1]>delays[0]);
});

test('Scorp ASV SREM launches from the left weapon pod and UNKPA from the right, including rotated aim',async()=>{
 const {VEHICLE_SHAPES}=await import('../content/vehicle-shapes.ts');const s=new Simulation(),u=makeUnit('own-scorp','scorp-asv',5,20,true);s.units=[u];s.mounted=u;
 for(const yaw of [0,Math.PI/2]){u.aim=u.yaw=yaw;s.missiles=[];u.cooldown=0;s.fire(3);u.cooldown=0;s.fire(4);assert.deepEqual(s.missiles.map(p=>p.weapon),['SREM','UNKPA']);
  for(const [i,p] of s.missiles.entries()){const lateral=(p.x-u.x)*Math.cos(yaw)-(p.z-u.z)*Math.sin(yaw);assert.ok(Math.abs(lateral-(i===0?-1:1)*VEHICLE_SHAPES['scorp-asv'].weapon.x)<1e-8);assert.equal(p.y,u.spec.height*.6+VEHICLE_SHAPES['scorp-asv'].weapon.y);}
 }
 assert.equal(u.slotAmmo[2],18);assert.equal(u.slotAmmo[3],8);
});

for(const cover of ['rock','building','cliff'] as const)test(`Q and E select through ${cover} cover but shots and lock remain obstructed`,()=>{
 const s=mounted(),own=s.mounted!,enemy=s.units[1];s.units=[own,enemy];s.mission.rocks=[];s.mission.base=undefined;s.mission.terrain.cliffs=[];enemy.x=0;enemy.z=100;enemy.cooldown=999;
 if(cover==='rock')s.mission.rocks=[{x:0,z:60,r:12}];else if(cover==='building')s.mission.base={name:'cover',x:0,z:60,width:40,depth:10,buildings:[{x:0,z:60,width:40,depth:10,height:20}]};else s.mission.terrain.cliffs=[{id:'cover',x:0,z:60,width:40,depth:10,height:20}];
 assert.equal(s.selectInCrosshair(),enemy);assert.equal(s.targetState?.inSight,false);assert.equal(s.targetState?.locked,false);s.clearTarget();s.selectTarget();assert.equal(s.target,enemy);
 const shield=enemy.shield;s.fire(2);step(s,1);assert.equal(enemy.shield,shield);
});
test('Q accepts a wider aim cone and farther targets while preferring the center of the crosshair',()=>{
 const s=mounted(),own=s.mounted!,enemy=s.units[1];s.units=[own,enemy];s.mission.rocks=[];enemy.x=Math.tan(10*Math.PI/180)*200;enemy.z=own.z+200;s.pitch=s.targetElevation(enemy)+6*Math.PI/180;assert.equal(s.selectInCrosshair(),enemy);
 s.clearTarget();s.pitch=0;enemy.x=Math.tan(14*Math.PI/180)*200;assert.equal(s.selectInCrosshair(),null);
 enemy.x=0;enemy.z=own.z+700;assert.equal(s.selectInCrosshair(),enemy);s.clearTarget();enemy.z=own.z+801;assert.equal(s.selectInCrosshair(),null);
 enemy.z=own.z+300;const nearer=makeUnit('near-edge','merc-sentry',Math.tan(6*Math.PI/180)*60,own.z+60,true);s.units.push(nearer);assert.equal(s.selectInCrosshair(),enemy);enemy.alive=false;assert.equal(s.selectInCrosshair(),nearer);
});

test('Q on empty ground clears an existing target and tracking for every mission',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 for(const mission of [DEFAULT_MISSION,MISSION_3_3]){
  const s=new Simulation('Easy',mission!);if(!s.mounted){s.human={...MISSION.vehicle};s.board();}
  const target=s.units.find(u=>u!==s.mounted)!;s.selected=target.id;s.tracking=true;s.mounted!.aim=Math.PI/2;s.pitch=1.2;
  assert.equal(s.selectInCrosshair(),null);assert.equal(s.selected,null);assert.equal(s.targetState,null);assert.equal(s.tracking,false);
 }
});
test('player ejects from a destroyed vehicle, lands, boards another, and only human death causes failure',()=>{
 const s=mounted(),own=s.mounted!,replacement=makeUnit('replacement','union-asv',30,0,false);s.units=[own,replacement];s.humanHealth=43;s.gashrAmmo=2;s.iff='6707';
 s.damage(own,9999);assert.equal(s.status,'running');assert.equal(s.mounted,null);assert.ok(s.flight);assert.equal(s.humanHealth,43);assert.equal(s.gashrAmmo,2);assert.equal(s.iff,'6707');assert.equal(s.soldiers.length,0);assert.equal(own.alive,false);assert.equal(s.events.filter(e=>e.type==='eject').length,1);assert.equal(s.events.filter(e=>e.type==='lose').length,0);
 assert.equal(s.board(),false);for(let i=0;i<400&&s.flight;i++)s.tick(1/60,idle);assert.equal(s.flight,null);assert.equal(s.status,'running');
 s.human={x:replacement.x,z:replacement.z};assert.equal(s.board(),true);assert.equal(s.mounted,replacement);assert.equal(s.humanHealth,43);assert.equal(s.gashrAmmo,2);
 s.damage(replacement,9999);assert.equal(s.status,'running');s.damage(null,43);s.tick(.01,idle);assert.equal(s.status,'lost');assert.equal(s.events.filter(e=>e.type==='lose').length,1);
});

function hitSelectionFixture(weapon:import('../content/weapons.ts').VehicleWeapon='GAUS30'){
 const s=new Simulation('Easy',{...MISSION,completionEnabled:false,objectives:[],rocks:[],companions:[],personnel:[],assaults:[],pickups:[],startMountedUnitId:undefined,assignedUnitId:'own',player:{x:0,z:0},
  units:[{id:'own',kind:'union-sentry',x:0,z:0,pilot:false,overrides:{weapons:[weapon],initialAmmo:{[weapon]:8},energy:5000}},{id:'other-selection',kind:'union-asv',x:200,z:80,pilot:false}],
  base:{name:'target fixture',faction:'merc',x:0,z:80,width:40,depth:30,buildings:[{id:'hit-facility',kind:'command',x:0,z:80,width:40,depth:30,height:20,health:5000,boardable:false}]},
 });assert.ok(s.board());s.events=[];return s;
}
test('all mounted weapons select their surviving hit facility only when no target is selected',async()=>{
 const {LASERS,MACHINE_GUNS,MISSILES}=await import('../content/weapons.ts');
 for(const weapon of [...Object.keys(LASERS),...Object.keys(MACHINE_GUNS),...Object.keys(MISSILES)] as import('../content/weapons.ts').VehicleWeapon[]){
  for(const selected of [false,true]){
   const s=hitSelectionFixture(weapon);if(selected)s.selected='other-selection';s.fire(1);
   assert.ok(s.events.some(e=>e.type==='shot'),`${weapon}: fired`);
   if(s.missiles.length)assert.equal(s.selected,selected?'other-selection':null,`${weapon}: selection waits for impact`);
   for(let i=0;i<300&&s.missiles.length;i++)s.tick(.02,idle);
   assert.equal(s.selected,selected?'other-selection':'hit-facility',`${weapon}: hit selection`);
   assert.equal(s.events.filter(e=>e.type==='target').length,selected?0:1,`${weapon}: one selection event`);
  }
 }
});
test('foot rifle, GASHR and EGGER share hit selection, including a facility hit that only affects its crew',()=>{
 for(const weapon of ['PRIF44','GASHR','EGGER'] as const)for(const selected of [false,true]){
  const s=hitSelectionFixture();s.eject('ground');s.units[0].x=-500;s.human={x:0,z:0};s.humanYaw=0;s.pitch=0;s.mission={...s.mission,footSecondaryWeapon:weapon==='EGGER'?'EGGER':'GASHR'};s.events=[];
  if(selected)s.selected='other-selection';s.fire(weapon==='PRIF44'?1:2);
  for(let i=0;i<300&&s.missiles.length;i++)s.tick(.02,idle);
  assert.equal(s.selected,selected?'other-selection':'hit-facility',weapon);assert.equal(s.events.filter(e=>e.type==='target').length,selected?0:1);
 }
});
test('a player laser still selects on impact after exiting the firing vehicle; enemy hits do not select',()=>{
 const s=hitSelectionFixture();s.fire(1);assert.equal(s.missiles[0].playerOwned,true);s.eject('ground');s.events=[];
 for(let i=0;i<100&&s.missiles.length;i++)s.tick(.02,idle);assert.equal(s.selected,'hit-facility');
 for(const iff of ['hostile','2620']){
  const ai=hitSelectionFixture(),own=ai.mounted!;own.x=400;const enemy=makeUnit('ai-tower','merc-meson-tower',0,0,true);enemy.iff=iff;ai.units.push(enemy);ai.mission={...ai.mission,assaults:[{unitId:enemy.id,targetId:'hit-facility',startAt:0}]};ai.events=[];
  for(let i=0;i<100;i++)ai.tick(.02,idle);
  assert.ok(ai.events.some(e=>e.type==='shot'&&e.unit===enemy));assert.ok(ai.facilities[0].health<5000);assert.equal(ai.selected,null);assert.ok(!ai.events.some(e=>e.type==='target'));
 }
});
test('rifle and laser impacts select surviving infantry and vehicles; destroyed hits stay unselected',()=>{
 for(const type of ['soldier','vehicle','destroyed'] as const){
  const s=hitSelectionFixture();s.facilities=[];s.mission={...s.mission,base:undefined};
  const target=makeUnit('target','union-sentry',0,60,true);target.iff='hostile';s.units=[s.mounted!,target];
  if(type==='vehicle'){
   s.pitch=Math.atan2(target.spec.height*.6-s.eyeHeight,60);s.fire(1);for(let i=0;i<100&&s.missiles.length;i++)s.tick(.02,idle);assert.equal(s.selected,target.id);
  }else{
   const soldier=s.forceEject(target)!;assert.ok(soldier);soldier.flight=null;soldier.x=0;soldier.z=60;soldier.health=type==='destroyed'?1:35;target.x=500;
   s.eject('ground');s.units[0].x=-500;s.human={x:0,z:0};s.humanYaw=0;s.pitch=Math.atan2(1-s.eyeHeight,60);s.fire(1);
   assert.equal(s.selected,type==='destroyed'?null:soldier.id);
  }
 }
});

test('projectile misses and destroyed facilities never acquire a target',()=>{
 for(const destroyed of [false,true]){
  const s=hitSelectionFixture();if(destroyed)s.facilities[0].health=1;else s.mounted!.aim=s.mounted!.yaw=Math.PI/2;
  s.fire(1);for(let i=0;i<150&&s.missiles.length;i++)s.tick(.02,idle);
  assert.equal(s.selected,null);assert.ok(!s.events.some(e=>e.type==='target'));assert.equal(s.facilities[0].alive,!destroyed);
 }
});
test('taking over an AI firing vehicle does not turn its already fired bolt into a player attack',()=>{
 const s=hitSelectionFixture();s.mounted!.x=400;const enemy=makeUnit('ai-tower','merc-meson-tower',0,0,true);enemy.iff='hostile';s.units.push(enemy);s.mission={...s.mission,assaults:[{unitId:enemy.id,targetId:'hit-facility',startAt:0}]};
 for(let i=0;i<50&&!s.missiles.length;i++)s.tick(.01,idle);assert.ok(s.missiles.length);assert.equal(s.missiles[0].playerOwned,false);
 s.forceEject(enemy);s.eject('ground');s.human={x:enemy.x,z:enemy.z};assert.ok(s.board());assert.equal(s.mounted,enemy);s.events=[];
 for(let i=0;i<100&&s.missiles.length;i++)s.tick(.01,idle);
 assert.ok(s.facilities[0].health<5000);assert.equal(s.selected,null);assert.ok(!s.events.some(e=>e.type==='target'));
});


test('Scorp rocket tower carries 30 UNKPA rounds in slot two, preserves spent ammunition and resets on retry',()=>{
 const mission=structuredClone(DEFAULT_MISSION);mission.units=[{id:'tower-ammo',kind:'scorp-rocket-tower',x:0,z:0,pilot:false}];mission.assignedUnitId='tower-ammo';mission.startMountedUnitId='tower-ammo';mission.companions=[];mission.personnel=[];mission.objectives=[];mission.completionEnabled=false;mission.rocks=[];mission.base=undefined;
 const s=new Simulation('Easy',mission),u=s.mounted!;assert.deepEqual(u.slotAmmo,[100,30]);for(let i=0;i<30;i++){u.cooldown=0;s.fire(2);}assert.equal(u.slotAmmo[1],0);assert.equal(u.slotAmmo[0],100);assert.equal(s.missiles.filter(p=>p.weapon==='UNKPA').length,30);u.cooldown=0;s.fire(2);assert.equal(s.missiles.length,30);
 s.eject('ground');s.human={x:u.x,z:u.z};assert.ok(s.board());assert.equal(u.slotAmmo[1],0);assert.equal(new Simulation('Easy',mission).mounted!.slotAmmo[1],30);
});

test('Scorp rocket tower UNKPA turns 20 percent faster while tower SREM and Scorp ASV retain their seekers',async()=>{
 const {MISSILES,MISSILE_HOMING}=await import('../content/weapons.ts');
 const turn=(kind:'scorp-rocket-tower'|'scorp-asv',weapon:'SREM'|'UNKPA')=>{
  const mission=structuredClone(DEFAULT_MISSION);mission.units=[{id:'seeker-own',kind,x:0,z:0,pilot:false},{id:'seeker-target',kind:'union-asv',x:0,z:250,pilot:false}];mission.assignedUnitId='seeker-own';mission.startMountedUnitId='seeker-own';mission.companions=[];mission.personnel=[];mission.objectives=[];mission.completionEnabled=false;mission.rocks=[];mission.base=undefined;
  const s=new Simulation('Easy',mission);s.selected='seeker-target';const p=s.fireMissile(s.mounted!,weapon);assert.equal(p.homingTargetId,'seeker-target');const before={x:p.vx,y:p.vy,z:p.vz};s.units[1].x=60;s.tick(.05,idle);const speed=Math.hypot(p.vx,p.vy,p.vz);assert.ok(Math.abs(speed-MISSILES[weapon].speed)<1e-8);assert.equal(p.homingTargetId,'seeker-target');return Math.acos(Math.min(1,(before.x*p.vx+before.y*p.vy+before.z*p.vz)/(speed*speed)));
 };
 const ordinary=turn('scorp-asv','UNKPA'),stronger=turn('scorp-rocket-tower','UNKPA');assert.ok(Math.abs(stronger/ordinary-1.2)<1e-6);assert.ok(Math.abs(ordinary-MISSILE_HOMING.turnRate*.05)<1e-6);assert.ok(Math.abs(turn('scorp-rocket-tower','SREM')-ordinary)<1e-6);
});

test('Merc AIP AI makes a slow bounded turn toward a side target while Union AIP keeps its original response',()=>{
 const run=(kind:'merc-aip'|'union-aip',fps:number)=>{
  const mission=structuredClone(DEFAULT_MISSION);mission.units=[{id:'handling-aip',kind,x:0,z:0,pilot:true,iff:'hostile',overrides:{weapons:[]}}];mission.player={x:150,z:0};mission.assignedUnitId='handling-aip';mission.startMountedUnitId=undefined;mission.companions=[];mission.personnel=[];mission.garrison=[];mission.assaults=[];mission.objectives=[];mission.completionEnabled=false;mission.base=undefined;mission.rocks=[];mission.terrain.cliffs=[];
  const s=new Simulation('Easy',mission),unit=s.units[0];for(let i=0;i<fps;i++){const yaw=unit.yaw,aim=unit.aim;s.tick(1/fps,idle);if(kind==='merc-aip'){assert.ok(Math.abs(angle(unit.yaw-yaw))<=.55/fps+1e-8);assert.ok(Math.abs(angle(unit.aim-aim))<=.9/fps+1e-8);}}return {yaw:unit.yaw,aim:unit.aim,speed:unit.speed};
 };
 const merc=run('merc-aip',60),union=run('union-aip',60);assert.ok(merc.yaw>.5&&merc.yaw<.56);assert.ok(union.yaw>merc.yaw*1.7);assert.ok(union.aim>merc.aim);assert.ok(merc.speed<union.speed);
 for(const fps of [30,120])assert.ok(Math.abs(run('merc-aip',fps).yaw-merc.yaw)<.01);
});

test('mounted Merc AIP accelerates and brakes with more inertia without lowering its maximum speed',()=>{
 const run=(kind:'merc-aip'|'union-aip')=>{
  const mission=structuredClone(DEFAULT_MISSION);mission.units=[{id:'mounted-handling',kind,x:0,z:0,pilot:false}];mission.assignedUnitId='mounted-handling';mission.startMountedUnitId='mounted-handling';mission.companions=[];mission.personnel=[];mission.garrison=[];mission.assaults=[];mission.objectives=[];mission.completionEnabled=false;mission.base=undefined;mission.rocks=[];mission.terrain={...mission.terrain,halfWidth:2000,minZ:-2000,maxZ:3000,cliffs:[],river:undefined};
  const s=new Simulation('Easy',mission);for(let i=0;i<60;i++)s.tick(1/60,{...idle,boost:true});const afterOneSecond=s.speed;for(let i=0;i<1800;i++)s.tick(1/60,{...idle,boost:true});const maximum=s.mounted!.spec.speed/3.6;assert.ok(Math.abs(s.speed-maximum)<1e-7);for(let i=0;i<60;i++)s.tick(1/60,{...idle,stop:true});return {afterOneSecond,remainingFraction:s.speed/maximum};
 };
 const merc=run('merc-aip'),union=run('union-aip');assert.ok(merc.afterOneSecond<union.afterOneSecond*.8);assert.ok(merc.remainingFraction>union.remainingFraction*1.7);
});


test('Scorp ASV horizontal key and mouse aiming matches HAWCs without starting movement or changing Union ASV controls',()=>{
 const turn=(kind:'scorp-asv'|'union-asv'|'union-sentry')=>{
  const s=new Simulation(),unit=makeUnit('scorp-asv-controls',kind,0,0,false);s.units=[unit];s.human={x:0,z:0};assert.ok(s.board());for(let i=0;i<60;i++)s.tick(1/60,{...idle,right:true});const key=unit.yaw,before=unit.aim;s.aimMouseBy(100,0);assert.equal(unit.x,0);assert.equal(unit.z,0);assert.equal(s.speed,0);return {key,mouse:angle(unit.aim-before)};
 };
 const scorp=turn('scorp-asv'),hawc=turn('union-sentry'),union=turn('union-asv');assert.deepEqual(scorp,hawc);assert.ok(Math.abs(scorp.key-1.5)<1e-8);assert.ok(Math.abs(scorp.mouse-.5)<1e-8);assert.ok(Math.abs(union.key-.6)<1e-8);assert.ok(Math.abs(union.mouse-.25)<1e-8);
});

test('selecting allied infantry resolves each person name in the active mission and locale',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const {targetName}=await import('./simulation.ts');const s=new Simulation('Easy',MISSION_4_2);s.units=[];s.facilities=[];s.human={x:0,z:0};
 const kylie=s.soldiers.find(p=>p.personId==='kylie')!,thane=s.soldiers.find(p=>p.personId==='thane')!;Object.assign(kylie,{x:0,z:15,boardingTarget:undefined});Object.assign(thane,{x:0,z:25,boardingTarget:undefined});
 s.cycleTarget();assert.equal(s.target,kylie);assert.equal(targetName(s.target!,s.mission.companions,'ja'),'キリー');s.cycleTarget();assert.equal(s.target,thane);assert.equal(targetName(s.target!,s.mission.companions,'ja'),'ターン');assert.equal(targetName(s.target!,s.mission.companions,'en'),'Thane');assert.equal(targetName({...thane,personId:undefined},s.mission.companions,'ja'),'歩兵');
});
