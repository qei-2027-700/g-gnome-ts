import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,makeUnit,type Input} from './simulation.ts';
const idle:Input={forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false};

test('fixed tower exit places the player beside it on the ground and accepts walking on the next frame',()=>{
 for(const kind of ['merc-meson-tower','scorp-rocket-tower'] as const){
  const s=new Simulation(),unit=makeUnit('exit-tower',kind,0,30,false);s.units=[unit];s.human={x:0,z:30};assert.ok(s.board());s.events=[];
  s.eject();assert.equal(s.mounted,null);assert.equal(s.flight,null);assert.equal(s.throttle,0);assert.equal(s.speed,0);assert.ok(Math.abs(s.human.x-unit.x)>5);assert.equal(s.events.at(-1)?.launch,false);
  const start={...s.human};s.tick(1/60,{...idle,forward:true});assert.ok(Math.hypot(s.human.x-start.x,s.human.z-start.z)>0);assert.equal(s.flight,null);assert.equal(s.mounted,null);
 }
});
test('building exit is on the ground with no movement lock or launch event',()=>{
 const base=new Simulation().mission,def={...structuredClone(base),units:[],companions:[],player:{x:6,z:0},base:{name:'exit building',x:0,z:0,width:10,depth:10,buildings:[{id:'room',x:0,z:0,width:10,depth:10,height:30}]}};
 const s=new Simulation('Easy',def);assert.ok(s.board());assert.ok(s.insideFacility);s.events=[];s.eject();assert.equal(s.insideFacility,null);assert.equal(s.flight,null);assert.equal(s.eyeHeight,1.7);assert.ok(s.human.x>9);assert.equal(s.events.at(-1)?.launch,false);
 const before=s.human.x;s.tick(1/60,{...idle,forward:true});assert.ok(s.human.x>before);assert.equal(s.insideFacility,null);
});

test('fixed towers ignore full-power and movement inputs without boost announcements, but keep aiming and shooting',()=>{
 for(const kind of ['merc-meson-tower','scorp-rocket-tower'] as const){
  const s=new Simulation(),unit=makeUnit('fixed',kind,0,20,false);s.units=[unit];s.human={x:0,z:20};assert.ok(s.board());s.events=[];const start={x:unit.x,z:unit.z},aim=unit.aim;
  for(let i=0;i<60;i++)s.tick(1/60,{...idle,forward:true,boost:true,right:true,lookUp:true});
  assert.equal(s.throttle,0);assert.equal(s.speed,0);assert.equal(unit.speed,0);assert.deepEqual({x:unit.x,z:unit.z},start);assert.ok(unit.aim>aim);assert.ok(s.pitch>0);assert.ok(!s.events.some(e=>e.type==='boost'));
  s.tick(1/60,idle);s.tick(1/60,{...idle,boost:true});assert.ok(!s.events.some(e=>e.type==='boost'));
  s.fire(1);assert.ok(s.events.some(e=>e.type==='shot'&&e.unit===unit));
 }
});
test('being inside a building never accepts full power, while a mobile HAWC still announces it once',()=>{
 const base=new Simulation().mission,def={...structuredClone(base),units:[],companions:[],player:{x:6,z:0},base:{name:'test building',x:0,z:0,width:10,depth:10,buildings:[{id:'room',x:0,z:0,width:10,depth:10,height:10}]}};
 const s=new Simulation('Easy',def);assert.ok(s.board());assert.ok(s.insideFacility);s.events=[];
 for(let i=0;i<60;i++)s.tick(1/60,{...idle,forward:true,boost:true});assert.equal(s.throttle,0);assert.equal(s.speed,0);assert.ok(!s.events.some(e=>e.type==='boost'));
 const moving=new Simulation(),unit=makeUnit('mobile','merc-assault',0,20,false);moving.units=[unit];moving.human={x:0,z:20};assert.ok(moving.board());moving.events=[];
 for(let i=0;i<60;i++)moving.tick(1/60,{...idle,boost:true});assert.equal(moving.throttle,1);assert.ok(moving.speed>0);assert.equal(moving.events.filter(e=>e.type==='boost').length,1);
});

for(const kind of ['merc-sentry','merc-tactical'] as const){
 test(`forced ejection centers and preserves momentum on ${kind} without rotating its chassis or repairing it`,()=>{
  const s=new Simulation(),unit=makeUnit('captured',kind,0,60);
  s.units=[unit];unit.yaw=.8;unit.aim=1.2;unit.speed=15;unit.alert=true;
  unit.parts.leftLeg=.4;unit.ammo=17;unit.energy=120;unit.laserCharge=.3;
  const soldier=s.forceEject(unit);
  assert.ok(soldier);assert.equal(soldier.yaw,.8);assert.equal(unit.pilot,false);
  assert.equal(unit.yaw,.8);assert.equal(unit.aim,.8);assert.equal(unit.speed,15);assert.equal(unit.alert,false);
  assert.equal(unit.parts.leftLeg,.4);assert.equal(unit.ammo,17);assert.equal(unit.energy,120);assert.equal(unit.laserCharge,.3);
  s.human={x:unit.x,z:unit.z};s.pitch=.4;s.tracking=true;
  assert.ok(s.board());assert.equal(s.aim,s.yaw);assert.equal(s.pitch,0);assert.equal(s.tracking,false);
 });
}

for(const mode of ['launch','ground'] as const){
 test(`${mode} exit leaves a centered empty machine and neutral player controls`,()=>{
  const s=new Simulation(),unit=s.units[0];s.human={x:unit.x,z:unit.z};s.board();
  unit.yaw=.7;unit.aim=1.1;unit.speed=10;s.speed=10;s.throttle=1;s.pitch=.4;s.tracking=true;
  s.eject(mode);
  assert.equal(s.mounted,null);assert.equal(unit.pilot,false);assert.equal(unit.yaw,.7);assert.equal(unit.aim,.7);
  assert.equal(unit.speed,10);assert.equal(s.speed,0);assert.equal(s.throttle,0);assert.equal(s.pitch,0);assert.equal(s.tracking,false);
 });
}

test('center aligns upper body and view, cancels tracking, and acknowledges only once per press',()=>{
 const s=new Simulation(),unit=s.units[0];s.units=[unit];s.human={x:unit.x,z:unit.z};s.board();
 unit.yaw=.6;unit.aim=1;s.pitch=.4;s.tracking=true;s.events=[];
 for(let i=0;i<5;i++)s.tick(1/60,{...idle,center:true});
 assert.equal(unit.aim,unit.yaw);assert.equal(unit.yaw,.6);assert.equal(s.pitch,0);assert.equal(s.tracking,false);
 assert.equal(s.events.filter(e=>e.type==='center').length,1);
 s.tick(1/60,idle);s.tick(1/60,{...idle,center:true});
 assert.equal(s.events.filter(e=>e.type==='center').length,2);
});

test('Union Sentry keeps aim fixed to its chassis under manual aim, turning and tracking; pitch remains available',()=>{
 const s=new Simulation(),u=makeUnit('own','union-sentry',0,0,false),target=makeUnit('target','merc-sentry',50,60,false);
 s.units=[u,target];s.human={x:0,z:0};s.board();
 s.aimBy(.8);assert.equal(u.aim,u.yaw);assert.equal(u.yaw,0);
 s.lookBy(.2);assert.equal(s.pitch,.2);
 s.tick(.05,{...idle,right:true});assert.ok(u.yaw>0);assert.equal(u.aim,u.yaw);
 const yaw=u.yaw;s.selected=target.id;s.tracking=true;
 for(let i=0;i<20;i++){s.tick(.02,idle);assert.equal(u.aim,u.yaw);}
 assert.equal(u.yaw,yaw);
});
test('AI Union Sentry turns its whole chassis toward an enemy and never swivels its upper assembly',()=>{
 const s=new Simulation(),u=makeUnit('enemy','union-sentry',0,60,true,{faction:'scorp'});u.iff='scorp';s.units=[u];s.human={x:30,z:0};
 for(let i=0;i<40;i++){s.tick(.02,idle);assert.ok(Math.abs(u.aim-u.yaw)<1e-10);}
 assert.ok(Math.abs(u.yaw)>.1);
});


test('tower keyboard aiming keeps its base fixed while using the common HAWC horizontal key speed',()=>{
 for(const kind of ['merc-meson-tower','scorp-rocket-tower','merc-tactical'] as const){
  const s=new Simulation(),u=makeUnit('own',kind,0,20,false);s.units=[u];s.human={x:0,z:20};assert.ok(s.board());const yaw=u.yaw;
  for(let i=0;i<60;i++)s.tick(1/60,{...idle,right:true});
  const tower=kind!=='merc-tactical';assert.ok(Math.abs(u.aim-yaw-1.5)<1e-8);
  if(tower){assert.equal(u.yaw,yaw);assert.equal(u.x,0);assert.equal(u.z,20);}
  for(let i=0;i<60;i++)s.tick(1/60,{...idle,left:true});assert.ok(Math.abs(u.aim-yaw)<1e-8);
 }
});
test('tower tracking catches and follows a close AIP moving sideways at its defined maximum speed',()=>{
 for(const kind of ['merc-meson-tower','scorp-rocket-tower'] as const){
  const s=new Simulation(),u=makeUnit('own',kind,0,20,false),target=makeUnit('razor','merc-aip',0,38,true,{speed:0,ai:{detection:0}});
  s.units=[u,target];s.human={x:0,z:20};assert.ok(s.board());target.iff='enemy';s.selected=target.id;s.tracking=true;
  const rate=103.5/3.6/18;
  for(let i=0;i<180;i++){const theta=.5+rate*(i+1)/60;target.x=u.x+Math.sin(theta)*18;target.z=u.z+Math.cos(theta)*18;s.tick(1/60,idle);if(i>90)assert.ok(Math.abs(Math.atan2(Math.sin(theta-u.aim),Math.cos(theta-u.aim)))<.04);}
  assert.equal(u.yaw,0);assert.equal(u.speed,0);
 }
});

test('manual tower turn cancels tracking without dropping the selected target or fighting the input',()=>{
 const s=new Simulation(),tower=makeUnit('own','merc-meson-tower',0,20,false),enemy=makeUnit('target','merc-aip',30,100,true,{speed:0,ai:{detection:0}});
 s.units=[tower,enemy];s.human={x:0,z:20};assert.ok(s.board());enemy.iff='enemy';s.selected=enemy.id;s.tracking=true;
 for(let i=0;i<10;i++)s.tick(1/60,{...idle,left:true});
 assert.equal(s.tracking,false);assert.equal(s.selected,enemy.id);assert.ok(tower.aim<-.1);assert.equal(tower.yaw,0);
 const aim=tower.aim;s.tick(1/60,idle);assert.equal(tower.aim,aim);
});
