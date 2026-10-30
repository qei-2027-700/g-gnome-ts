import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine.js';
import {World} from './renderer.ts';
import {Simulation,makeUnit} from '../simulation/simulation.ts';
import {MISSION} from '../content/mission-1-1.ts';
test('Merc Assault has four raised spider legs, grounded alternating feet, shared leg hit zones and yellow RUPP beams',async()=>{
 const {intersectParts,buildingClearance}=await import('../simulation/parts.ts');
 const engine=new NullEngine({renderWidth:1000,renderHeight:800,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{
  const sim=new Simulation(),unit=makeUnit('spider','merc-assault',0,0,false);sim.units=[unit];sim.human={x:0,z:0};assert.ok(sim.board());
  const world=new World({} as HTMLCanvasElement,sim,engine);world.mode=2;world.update(0);const rig=world.rigs.get(unit.id)!;
  assert.equal(rig.legs.length,0);assert.equal(rig.spiderLegs!.length,4);assert.equal(new Set(rig.spiderLegs!.map(l=>`${l.side}/${l.front}`)).size,4);
  for(const leg of rig.spiderLegs!){assert.ok(leg.upper.position.y>unit.spec.height*.5);assert.ok(Math.abs(leg.foot.position.y-.1)<1e-8);assert.ok(Math.abs(leg.foot.position.x)>4);}
  assert.ok(buildingClearance(unit)>6);
  for(const side of [-1,1])for(const front of [-1,1]){const hit=intersectParts(unit,{x:side*10,y:3,z:front*3.5},{x:side*4.2,y:3,z:front*3.5});assert.equal(hit?.part,side<0?'leftLeg':'rightLeg');}
  unit.z+=.6;world.update(.1);assert.ok(rig.spiderLegs!.some(l=>l.foot.position.y>.1));assert.ok(rig.spiderLegs!.every(l=>l.foot.position.y>=.1));
  world.mode=0;sim.fire(1);for(const event of sim.events)world.event(event);world.update(.01);
  const bolt=world.scene.meshes.find(m=>m.metadata?.weapon==='RUPP'&&m.metadata?.visual==='yellow-laser')!;assert.ok(bolt);
  const paint=bolt.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;assert.ok(paint.emissiveColor.r>.9&&paint.emissiveColor.g>.7&&paint.emissiveColor.b<.25);
  world.event({type:'impact',weapon:'RUPP',position:{x:0,y:3,z:20}});assert.ok(world.scene.getMeshByName('rupp-yellow-flash'));
  assert.equal(world.renderError,null);
 }finally{engine.dispose();}
});
test('Merc Assault supports boarding, all four weapon slots, camera changes and ejection',async()=>{
 const {mercAssaultCockpitShellSvg}=await import('./merc-assault-cockpit.ts');
 const {weaponMountCount}=await import('../content/weapons.ts');
 const {hologramSvg}=await import('./hologram.ts');
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{
  const sim=new Simulation(),unit=makeUnit('venom','merc-assault',0,18,false);sim.units=[unit];sim.human={x:0,z:18};
  assert.ok(sim.board());assert.equal(sim.mounted,unit);assert.deepEqual(unit.spec.weapons,['RUPP','zWASP','PUG','VISOM']);
  const world=new World({} as HTMLCanvasElement,sim,engine);world.update(.016);assert.equal(world.renderError,null);assert.equal(world.rigs.get(unit.id)!.root.isEnabled(),false);
  world.mode=1;world.update(.016);assert.ok(world.rigs.get(unit.id)!.root.isEnabled());
  world.mode=0;world.update(.016);assert.equal(world.rigs.get(unit.id)!.root.isEnabled(),false);
  assert.equal(weaponMountCount(unit.kind,'RUPP'),2);assert.notEqual(hologramSvg(unit.kind),hologramSvg('merc-sentry'));
  sim.fire(2);assert.equal(unit.slotAmmo[1],999);assert.equal(unit.slotAmmo[2],20);assert.equal(unit.slotAmmo[3],10);
  const shell=mercAssaultCockpitShellSvg();assert.ok(shell.includes('merc-assault.png'));assert.ok(shell.includes('maskUnits="userSpaceOnUse"'));
  sim.eject('ground');assert.equal(sim.mounted,null);world.update(.016);assert.equal(world.renderError,null);
 }finally{engine.dispose();}
});
test('Babylon scene creates real terrain and three rigs; camera switches and retry rebuilds',()=>{
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation();const world=new World({} as HTMLCanvasElement,sim,engine);
 assert.equal(world.rigs.size,3);assert.ok(world.scene.meshes.length>150);
 world.update(.016);assert.ok(Math.abs(world.camera.position.y-1.7)<.1);
 sim.human={...MISSION.vehicle};sim.board();world.update(.016);assert.equal(world.rigs.get('union')!.root.isEnabled(),false);
 world.mode=1;world.update(.016);assert.equal(world.rigs.get('union')!.root.isEnabled(),true);assert.equal(world.camera.position.y,10);
 world.mode=2;world.update(.016);assert.equal(world.camera.position.x,sim.player.x);
 world.event({type:'shot',from:sim.player,to:{x:0,z:100},weapon:'FIL-30'});assert.ok(world.effects.length>=2);world.update(.5);assert.equal(world.effects.length,0);
 const before=world.scene.meshes.length;world.reset(new Simulation());world.update(.016);assert.equal(world.scene.meshes.length,before);assert.equal(world.mode,0);
 engine.dispose();
});

test('rocket meshes move with simulation, effects freeze on pause and reset frees them',()=>{
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine),baseline=world.scene.meshes.length;
 sim.human={...MISSION.vehicle};sim.board();const enemy=sim.units[1];enemy.x=0;enemy.z=130;enemy.cooldown=999;
 const missile=sim.fireMissile(enemy,'CHUM');world.event(sim.events.find(e=>e.projectileId===missile.id)!);world.update(.04);
 assert.equal(world.missileRigs.size,1);assert.ok(world.scene.getMeshByName('rocket-exhaust'));assert.ok(world.scene.getMeshByName('rocket-smoke'));assert.ok(world.rigs.get(enemy.id)!.recoil>0);
 const root=world.missileRigs.get(missile.id)!.root,z=root.position.z;
 sim.tick(.05,{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false});world.update(.05);assert.ok(root.position.z<z);
 const position=root.position.clone(),life=world.effects[0].life;world.update(0);assert.ok(root.position.equals(position));assert.equal(world.effects[0].life,life);
 world.reset(new Simulation());assert.equal(world.missileRigs.size,0);assert.equal(world.effects.length,0);assert.equal(world.scene.meshes.length,baseline);engine.dispose();
});

test('terrain reaches the draw stage and target projection follows all camera views',async()=>{
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine);let draws=0;
 world.scene.getMeshByName('valley')!.onBeforeDrawObservable.add(()=>draws++);
 world.update(.016);await world.scene.whenReadyAsync();world.update(.016);
 assert.ok(world.scene.getActiveMeshes().length>20);assert.ok(draws>0);assert.equal(world.renderError,null);
 sim.human={...MISSION.vehicle};sim.board();const target=sim.units[1];target.x=0;target.z=100;
 for(const mode of [0,1,2]){world.mode=mode;world.update(.016);const p=world.projectTarget(target);assert.ok(p.visible);assert.ok(p.x>0&&p.x<1&&p.y>0&&p.y<1);}
 world.mode=0;sim.mounted!.aim=Math.PI;world.update(.016);assert.equal(world.projectTarget(target).visible,false);
 sim.mounted!.aim=0;sim.pitch=.3;world.update(.016);assert.ok(world.camera.rotation.x<0);engine.dispose();
});

test('waypoint one projects toward the destination and follows camera pitch',()=>{
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine);world.update(.016);const p=world.projectWaypoint();assert.ok(p.visible);assert.ok(Math.abs(p.x-.5)<.01);
 sim.pitch=.2;world.update(.016);assert.ok(world.projectWaypoint().y>p.y);sim.humanYaw=Math.PI;world.update(.016);assert.equal(world.projectWaypoint().visible,false);engine.dispose();
});

test('infantry has rear and diagonal views, a visible avatar and a camera that follows ejection',()=>{
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine);world.update(.016);assert.equal(world.soldierRigs.get('player')!.root.isEnabled(),false);
 world.mode=2;world.update(.016);assert.equal(world.soldierRigs.get('player')!.root.isEnabled(),true);assert.equal(world.camera.position.x,sim.human.x);assert.ok(world.camera.position.z<sim.human.z);
 world.mode=1;world.update(.016);assert.ok(world.camera.position.x>sim.human.x);
 sim.human={...MISSION.vehicle};sim.board();sim.eject();world.mode=0;world.update(.016);assert.ok(world.camera.position.y>6);
 const soldier=sim.forceEject(sim.units[1])!;world.update(.016);assert.ok(world.soldierRigs.has(soldier.id));assert.equal(world.soldierRigs.get(soldier.id)!.root.position.y,soldier.flight?.altitude??0);
 assert.equal(world.waypoint.visibility,0);sim.cycleWaypoint();world.update(.016);assert.ok(world.waypoint.visibility>0);sim.cycleWaypoint();world.update(.016);assert.equal(world.waypoint.visibility,0);
 engine.dispose();
});


test('3D damage is local, persists after hit flash, emits smoke only from damaged parts and resets cleanly',()=>{
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine);sim.human={...MISSION.vehicle};sim.board();world.mode=1;world.update(.016);
 for(const unit of [sim.mounted!,sim.units[1]]){
  const rig=world.rigs.get(unit.id)!,left=rig.parts.leftLeg.paint[0],right=rig.parts.rightLeg.paint[0];
  const leftColor=left.material.diffuseColor.clone(),rightColor=right.material.diffuseColor.clone();assert.notEqual(left.material,right.material);
  unit.shield=0;sim.damage(unit,unit.kind==='union-sentry'?30:20,'leftLeg');world.event(sim.events.at(-1)!);world.update(.016);
  assert.ok(!left.material.diffuseColor.equals(leftColor));assert.ok(right.material.diffuseColor.equals(rightColor));assert.ok(left.material.emissiveColor.r>0);assert.equal(right.material.emissiveColor.r,0);
  world.update(.3);assert.equal(rig.parts.leftLeg.flash,0);assert.ok(!left.material.diffuseColor.equals(leftColor));assert.ok(world.effects.some(e=>e.mesh.name==='damage-smoke'));
  const count=world.effects.length;world.update(0);assert.equal(world.effects.length,count);
  unit.parts.leftLeg=.4;world.update(0);const scorched=left.material.diffuseColor.clone();assert.ok(scorched.r<leftColor.r&&scorched.g<leftColor.g&&scorched.b<leftColor.b);assert.equal(left.material.emissiveColor.r,0);
  unit.parts.leftLeg=.15;world.update(0);assert.ok(left.material.diffuseColor.r<scorched.r&&left.material.diffuseColor.g<scorched.g&&left.material.diffuseColor.b<scorched.b);assert.equal(left.material.emissiveColor.r,0);assert.equal(left.material.emissiveColor.g,0);assert.ok(right.material.diffuseColor.equals(rightColor));
 }
 const materialCount=world.scene.materials.length;world.reset(new Simulation());world.update(.016);assert.equal(world.scene.materials.length,materialCount);world.reset(new Simulation());world.update(.016);assert.equal(world.scene.materials.length,materialCount);
 const fresh=world.rigs.get('union')!.parts.leftLeg.paint[0];assert.ok(fresh.material.diffuseColor.equals(fresh.base));assert.equal(world.effects.length,0);engine.dispose();
});

test('running follows actual travel, articulates knees, adds footfall dust and pauses without drifting',()=>{
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine),unit=sim.units[1],rig=world.rigs.get(unit.id)!;
 world.update(.016);assert.equal(rig.phase,0);
 for(let i=0;i<12;i++){unit.z+=1;world.update(.05);}assert.ok(rig.run>.8);assert.ok(rig.phase>Math.PI*2);assert.ok(rig.root.rotation.x>0);assert.ok(rig.knees.some(k=>k.rotation.x>.3));assert.ok(world.effects.some(e=>e.mesh.name==='footfall-dust'));
 const phase=rig.phase,pose=rig.legs.map(l=>l.rotation.x),dust=world.effects.map(e=>e.life);world.update(0);assert.equal(rig.phase,phase);assert.deepEqual(rig.legs.map(l=>l.rotation.x),pose);assert.deepEqual(world.effects.map(e=>e.life),dust);
 for(let i=0;i<25;i++)world.update(.05);assert.equal(rig.phase,phase);assert.ok(rig.run<.001);assert.equal(world.effects.filter(e=>e.mesh.name==='footfall-dust').length,0);engine.dispose();
});

test('both Merc HAWCs bob vertically while moving, including the tactical low-speed walk',()=>{
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine);
 for(const unit of sim.units.slice(1)){const rig=world.rigs.get(unit.id)!,samples:number[]=[];const speed=unit.kind==='merc-tactical'?3.6:20;
  for(let i=0;i<180;i++){unit.z+=speed/60;world.update(1/60);if(i>60)samples.push(rig.root.position.y);}
  assert.ok(Math.max(...samples)-Math.min(...samples)>.09,unit.kind);assert.ok(rig.root.position.y<.1);
 }
 engine.dispose();
});

test('mission switches rebuild terrain and resolved vehicle models, reset all projectiles, and retain stable resource counts',async()=>{
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const a=new Simulation();const world=new World({} as HTMLCanvasElement,a,engine);
 const definition=structuredClone(a.mission);definition.id='test-other';definition.units=[{id:'other',kind:'merc-sentry',x:40,z:20,pilot:false,overrides:{height:8,color:'#cc7722'}}];definition.assignedUnitId='other';definition.player={x:40,z:20};definition.rocks=[];definition.terrain.ridgeHeight=60;definition.terrain.biome='grassland';definition.waypoints=[{id:7,x:80,z:300,radius:5}];
 const b=new Simulation('Easy',definition);world.reset(b);world.update(0);assert.equal(world.rigs.size,1);assert.ok(world.rigs.has('other'));assert.equal(world.waypoint.position.x,80);assert.equal(world.waypoint.position.z,300);assert.equal(world.scene.meshes.some(m=>m.name==='boulder'),false);assert.ok(world.scene.getMaterialByName('grass'));assert.equal(world.scene.meshes.some(m=>m.name==='mesa'||m.name==='scrub'),false);
 b.cycleWaypoint();world.update(0);assert.equal(world.waypoint.visibility,.8);b.reachedWaypoints.add(7);world.update(0);assert.equal(world.waypoint.visibility,.25);
 b.board();b.fire(1);world.event(b.events.find(e=>e.type==='shot')!);world.update(.01);assert.ok(world.scene.getMeshByName('laser-bolt'));assert.equal(world.scene.meshes.some(m=>m.name==='rocket-smoke'),false);
 const meshCount=world.scene.meshes.length;world.reset(new Simulation('Easy',definition));world.update(0);const resetCount=world.scene.meshes.length;assert.ok(resetCount<meshCount);assert.equal(world.missileRigs.size,0);
 const materialCount=world.scene.materials.length;world.reset(new Simulation('Easy',definition));world.update(0);assert.equal(world.scene.meshes.length,resetCount);assert.equal(world.scene.materials.length,materialCount);
 world.reset(new Simulation());world.update(0);assert.equal(world.rigs.size,3);assert.ok(world.scene.getMeshByName('boulder'));assert.ok(world.scene.getMeshByName('mesa'));assert.equal(world.scene.getMaterialByName('grass'),null);engine.dispose();
});

test('VISOM camera follows the missile, hides its nose and restores the previous vehicle view',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation('Easy',MISSION_3_3),world=new World({} as HTMLCanvasElement,sim,engine);world.mode=2;world.update(0);sim.fire(2);const missile=sim.guidedMissile!;world.event(sim.events.find(e=>e.type==='shot')!);world.update(0);
 assert.equal(world.mode,2);assert.equal(world.camera.fov,.85);assert.equal(world.camera.position.x,missile.x);assert.equal(world.camera.position.y,missile.y);assert.equal(world.camera.position.z,missile.z);assert.equal(world.missileRigs.get(missile.id)!.root.isEnabled(),false);
 sim.releaseGuidance();world.update(0);assert.equal(world.mode,2);assert.equal(world.camera.fov,1.15);assert.ok(world.camera.position.z<sim.player.z);assert.equal(world.missileRigs.get(missile.id)!.root.isEnabled(),true);
 world.reset(new Simulation('Easy',MISSION_3_3));world.update(0);assert.equal(world.missileRigs.size,0);assert.equal(world.camera.fov,1.15);engine.dispose();
});
test('ASVs use tracks with matching damage regions and remain on the ground while moving',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');const {intersectParts}=await import('../simulation/parts.ts');const {VEHICLE_SHAPES}=await import('../content/vehicle-shapes.ts');
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),sim=new Simulation('Easy',MISSION_3_3),world=new World({} as HTMLCanvasElement,sim,engine);
 for(const unit of sim.units.filter(u=>u.kind.endsWith('-asv'))){const rig=world.rigs.get(unit.id)!,shape=VEHICLE_SHAPES[unit.kind];assert.ok('track' in shape);if(!('track' in shape))continue;
  const x=unit.x+shape.legX,y=shape.track.y;assert.equal(intersectParts(unit,{x,y,z:unit.z+10},{x,y,z:unit.z-10})?.part,'rightLeg');
  for(let i=0;i<20;i++){unit.z+=.5;world.update(.02);assert.equal(rig.root.position.y,0);assert.ok(rig.legs.every(track=>track.rotation.x===0));}
  unit.parts.rightLeg=.4;world.update(0);assert.ok(rig.parts.rightLeg.paint[0].material.diffuseColor.r<rig.parts.rightLeg.paint[0].base.r);assert.equal(rig.parts.rightLeg.paint[0].material.emissiveColor.r,0);assert.ok(rig.parts.leftLeg.paint[0].material.diffuseColor.equals(rig.parts.leftLeg.paint[0].base));
 }
 assert.equal(world.effects.some(e=>e.mesh.name==='footfall-dust'),false);engine.dispose();
});

test('infantry rifle fires one red shot from a fixed right-hand muzzle in every heading',()=>{
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine);
 for(const yaw of [0,Math.PI/2,Math.PI])for(const time of [0,.1,.2]){
  sim.time=time;const before=world.effects.length;
  world.event({type:'shot',weapon:'PRIF44',from:{x:0,y:1.7,z:0},to:{x:Math.sin(yaw)*100,y:1.7,z:Math.cos(yaw)*100}});
  const effects=world.effects.slice(before);assert.equal(effects.length,3);assert.ok(effects.some(e=>e.mesh.metadata?.visual==='prif44-first-person-streak'&&e.mesh.parent===world.camera));
  const flashes=effects.filter(e=>e.kind==='flash');assert.equal(flashes.length,1);
  const flash=flashes[0].mesh,material=flash.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;
  assert.ok(Math.abs(flash.position.x-(Math.cos(yaw)*.3+Math.sin(yaw)*.8))<1e-8);
  assert.ok(Math.abs(flash.position.z-(-Math.sin(yaw)*.3+Math.cos(yaw)*.8))<1e-8);
  assert.ok(material.emissiveColor.r>material.emissiveColor.g*4);
  const trace=effects.find(e=>e.kind==='tracer')!,tracer=trace.mesh,red=tracer.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;
  assert.ok(red.emissiveColor.r>red.emissiveColor.g*4);assert.ok(tracer.getTotalVertices()>20);assert.ok(Math.abs(trace.velocity!.length()-160)<1e-8);assert.ok(trace.duration>.6);assert.ok(flash.position.y>1.5);
 }
 engine.dispose();
});

test('Merc Tactical Defense has white armor, blue shin panels and a dark unlit upper cabin',()=>{
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine),rig=world.rigs.get('merc-1')!;
 const material=(part:'hull'|'cockpit'|'leftLeg',name:string)=>(rig.parts[part].meshes.find(m=>m.name===name)!.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial);
 const armor=material('hull','hull'),cabin=material('cockpit','cockpit'),blue=material('leftLeg','shin blue armor');
 assert.ok(armor.diffuseColor.r>.8&&armor.diffuseColor.g>.8&&armor.diffuseColor.b>.8);
 assert.ok(cabin.diffuseColor.r<.15&&cabin.diffuseColor.g<.15&&cabin.diffuseColor.b<.15);assert.equal(cabin.emissiveColor.r,0);
 assert.ok(blue.diffuseColor.b>blue.diffuseColor.r&&blue.diffuseColor.g>blue.diffuseColor.r);
 const pod=rig.parts.rightWeapon.meshes.find(m=>m.name==='weapon pod')!,waist=rig.parts.hull.meshes.find(m=>m.name==='hull')!;
 assert.ok(pod.position.y>waist.position.y+2);engine.dispose();
});

test('Scorp ASV has a raised sloped body, broad separated treads and green/ochre detailing',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation('Easy',MISSION_3_3),world=new World({} as HTMLCanvasElement,sim,engine),rig=world.rigs.get('scorp-asv')!;
 const body=rig.parts.hull.meshes.find(m=>m.name==='hull')!;body.computeWorldMatrix(true);
 assert.ok(body.getBoundingInfo().boundingBox.minimumWorld.y>1.2);
 const left=rig.parts.leftLeg.meshes.find(m=>m.name==='track-belt')!,right=rig.parts.rightLeg.meshes.find(m=>m.name==='track-belt')!;
 left.computeWorldMatrix(true);right.computeWorldMatrix(true);
 assert.ok(right.getBoundingInfo().boundingBox.minimumWorld.x-left.getBoundingInfo().boundingBox.maximumWorld.x>2);
 assert.equal(rig.parts.leftLeg.meshes.filter(m=>m.name==='front tread cleat').length,9);
 const green=rig.parts.cockpit.meshes.find(m=>m.name==='cockpit')!.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;
 const ochre=rig.parts.leftLeg.meshes.find(m=>m.name==='ochre tread rail')!.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;
 assert.ok(green.diffuseColor.g>green.diffuseColor.r*2);assert.ok(ochre.diffuseColor.r>ochre.diffuseColor.b);
 engine.dispose();
});

test('3-3 storm valley has cloud dome, textured grass and rocky mountains; mission switch restores daylight without leaks',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});const world=new World({} as HTMLCanvasElement,new Simulation('Easy',MISSION_3_3),engine);
 const cloud=world.scene.getMeshByName('storm-cloud-dome')!;assert.ok(cloud);assert.equal(cloud.applyFog,false);assert.ok(world.scene.getMaterialByName('grass')?.getActiveTextures().length);assert.equal(world.scene.meshes.filter(m=>m.name==='rocky-mountain').length,24+(MISSION_3_3.terrain.peaks?.length??0));assert.equal(world.scene.getLightByName('sun')!.intensity,.48);
 assert.ok(world.sim.radioMembers.every(m=>m.unit!.z>world.sim.player.z&&m.available));const counts=[world.scene.meshes.length,world.scene.materials.length,world.scene.textures.length];world.reset(new Simulation('Easy',MISSION_3_3));assert.deepEqual([world.scene.meshes.length,world.scene.materials.length,world.scene.textures.length],counts);
 world.reset(new Simulation());assert.equal(world.scene.getMeshByName('storm-cloud-dome'),null);assert.equal(world.scene.getMeshByName('rocky-mountain'),null);assert.equal(world.scene.getLightByName('sun')!.intensity,1.1);assert.equal(world.scene.fogEnd,680);engine.dispose();
});

test('a Scorp pilot escaping a destroyed vehicle is rendered as a green combatant',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation('Easy',MISSION_3_3),unit=sim.units.find(u=>u.kind==='scorp-asv')!;unit.shield=0;sim.damage(unit,9999);
 const world=new World({} as HTMLCanvasElement,sim,engine);world.update(0);const rig=world.soldierRigs.get(sim.soldiers[0].id)!;
 assert.equal(rig.root.metadata.faction,'scorp');assert.equal(rig.root.metadata.kind,'scorp-combatant');
 const skin=rig.root.getChildMeshes().find(m=>m.name==='soldier-head')!.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;
 assert.ok(skin.diffuseColor.g>skin.diffuseColor.r*1.5&&skin.diffuseColor.g>skin.diffuseColor.b*1.5);assert.ok(rig.root.position.y>0);engine.dispose();
});


test('CETI fires paired camera-facing green lasers with white cores, without long beam or rocket smoke',()=>{
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),s=new Simulation();s.units=[makeUnit('own','scorp-sentry',0,18,false)];s.human={x:0,z:18};s.board();s.fire(1);const world=new World({} as HTMLCanvasElement,s,engine);world.update(0);
 const bolt=world.scene.getMeshByName('laser-bolt')!;assert.ok(bolt);assert.equal(bolt.billboardMode,7);const vertices=bolt.getVerticesData('position')!;const material=world.scene.getMaterialByName('laser-green')! as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;assert.ok(material.emissiveColor.g>.9&&material.emissiveColor.r<.2);assert.equal(world.scene.meshes.filter(m=>m.name==='laser-bolt').length,2);assert.equal(world.scene.meshes.filter(m=>m.name==='laser-white-core').length,2);assert.ok(Math.max(...vertices.filter((_,i)=>i%3===2))-Math.min(...vertices.filter((_,i)=>i%3===2))<.01);assert.equal(world.scene.getMeshByName('laser-beam'),null);assert.equal(world.scene.getMeshByName('rocket-smoke'),null);engine.dispose();
});

test('destroyed vehicle burns, disappears, leaves a small fire and smoke, then clears; pause and retry are clean',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),s=new Simulation('Easy',MISSION_3_3),world=new World({} as HTMLCanvasElement,s,engine),ally=s.units.find(u=>u.personId==='kylie')!;
 s.damage(ally,9999);for(const e of s.events)world.event(e);world.update(.1);assert.ok(world.destructions.has(ally.id));assert.ok(world.rigs.has(ally.id));assert.ok(world.scene.getMeshByName('vehicle-flame'));assert.ok(world.soldierRigs.size>0);
 const age=world.destructions.get(ally.id)!.age;world.update(0);assert.equal(world.destructions.get(ally.id)!.age,age);
 for(let i=0;i<60;i++)world.update(1/60);assert.equal(world.rigs.has(ally.id),false);assert.equal(world.scene.getTransformNodeByName(ally.id),null);assert.ok(world.scene.getMeshByName('vehicle-fire-smoke'));assert.ok(world.destructions.get(ally.id)!.flames.every(f=>f.scaling.y<2));
 for(let i=0;i<18*60;i++)world.update(1/60);assert.equal(world.destructions.size,0);assert.equal(world.scene.getMeshByName('vehicle-flame'),null);assert.equal(world.scene.getMeshByName('vehicle-fire-smoke'),null);assert.equal(world.effects.length,0);
 world.reset(new Simulation('Easy',MISSION_3_3));assert.ok(world.rigs.has(ally.id));assert.equal(world.destructions.size,0);assert.equal(world.soldierRigs.size,0);engine.dispose();
});

test('external ASV camera keeps its position and horizontal bearing while following elevation; passenger bodies hide',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});const sim=new Simulation('Easy',MISSION_3_3),world=new World({} as HTMLCanvasElement,sim,engine);world.mode=2;world.update(.016);
 const rig=world.rigs.get(sim.mounted!.id)!,camera=world.camera.position.clone(),view=world.camera.getTarget().clone();const hull=rig.root.getChildMeshes().find(m=>m.name==='hull')!,hullMatrix=hull.computeWorldMatrix(true).clone();
 sim.aimBy(.45);sim.lookBy(-.25);world.update(.016);
 assert.ok(rig.torso.rotation.y>0);assert.ok(rig.torso.rotation.x>0);assert.ok(world.camera.position.equals(camera));assert.ok(world.camera.getTarget().y<view.y);assert.ok(hull.computeWorldMatrix(true).equals(hullMatrix));
 const soldier=sim.forceEject(sim.units[1],'destruction')!;soldier.passengerOf=sim.mounted!.id;world.update(.016);assert.equal(world.soldierRigs.get(soldier.id)!.root.isEnabled(),false);soldier.passengerOf=undefined;world.update(.016);assert.equal(world.soldierRigs.get(soldier.id)!.root.isEnabled(),true);engine.dispose();
});

test('Ul-Urit base and red minefield render, detector exposes only nearby live mines, and 1-1 removes them',async()=>{const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts'),engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),s=new Simulation('Easy',MISSION_3_3),world=new World({} as HTMLCanvasElement,s,engine);world.update(0);assert.equal(world.scene.getMeshByName('ul-urit-base-pad'),null);assert.equal(world.scene.getMeshByName('base-hangar-door'),null);assert.equal(world.scene.getMeshByName('base-perimeter-wall'),null);assert.ok(world.scene.getMeshByName('command-center'));assert.ok(world.scene.getMeshByName('minefield-control'));assert.equal(world.scene.meshes.filter(m=>m.name==='tower-column').length,2);assert.ok(world.scene.getMeshByName('red-minefield'));assert.ok(world.scene.meshes.filter(m=>m.name==='detected-mine').every(m=>!m.isVisible));
 s.eject('ground');const detector=s.units.find(u=>u.id==='scorp-asv')!;detector.pilot=false;s.human={x:detector.x,z:detector.z};assert.ok(s.board());detector.x=-500;detector.z=0;world.update(0);assert.ok(world.scene.meshes.some(m=>m.name==='detected-mine'&&m.isVisible));world.reset(new Simulation());world.update(0);assert.equal(world.scene.getMeshByName('red-minefield'),null);assert.equal(world.scene.getMeshByName('command-center'),null);assert.equal(world.scene.getMeshByName('minefield-control'),null);engine.dispose();});

test('external HAWC camera position stays fixed while vertical view follows pitch in rear and diagonal views',async()=>{
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine);
 sim.human={...MISSION.vehicle};sim.board();
 for(const mode of [1,2]){world.mode=mode;world.update(.016);const camera=world.camera.position.clone(),view=world.camera.getTarget().clone(),yaw=sim.yaw;
  sim.aimBy(.2);sim.lookBy(-.15);world.update(.016);
  assert.equal(sim.yaw,yaw);assert.equal(sim.aim,sim.yaw);assert.ok(world.camera.position.equals(camera));assert.ok(world.camera.getTarget().y<view.y);
 }
 engine.dispose();
});

test('C rear view follows chassis steering from directly behind while upper-body relative bearing stays fixed',async()=>{
 const {readInput}=await import('../input.ts'),{defaults}=await import('../settings.ts'),{toggleCamera}=await import('./camera-mode.ts');
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine);
 sim.human={...MISSION.vehicle};sim.board();world.mode=toggleCamera(world.mode,'rear');world.update(0);const rig=world.rigs.get(sim.mounted!.id)!;
 for(let i=0;i<60;i++){sim.tick(1/60,readInput(defaults(),new Set(['KeyW','ArrowRight']),false,true));world.update(1/60);}
 assert.ok(rig.root.rotation.y>0);assert.equal(rig.root.rotation.y,sim.mounted!.yaw);assert.ok(Math.abs(rig.torso.rotation.y)<1e-9);assert.ok(sim.player.x>0);assert.ok(Math.abs(world.camera.position.x-(sim.player.x-Math.sin(sim.yaw)*20))<1e-9);assert.ok(Math.abs(world.camera.position.z-(sim.player.z-Math.cos(sim.yaw)*20))<1e-9);
 engine.dispose();
});

test('C rear view stays directly behind the walking player while turning and advancing',async()=>{
 const {readInput}=await import('../input.ts'),{defaults}=await import('../settings.ts'),{toggleCamera}=await import('./camera-mode.ts');
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine);world.mode=toggleCamera(world.mode,'rear');
 for(let i=0;i<30;i++){sim.tick(1/60,readInput(defaults(),new Set(['KeyW','ArrowRight'])));world.update(1/60);
  assert.ok(Math.abs(world.camera.position.x-(sim.player.x-Math.sin(sim.yaw)*6.25))<1e-9);assert.ok(Math.abs(world.camera.position.z-(sim.player.z-Math.cos(sim.yaw)*6.25))<1e-9);
 }
 assert.ok(sim.humanYaw>0);engine.dispose();
});

test('selected-vehicle boarding hides only the identified driver body, then F6 restores the same rendered person',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');const sim=new Simulation('Easy',MISSION_3_3);sim.mission.rocks=[];sim.units[1].x=0;sim.units[1].z=10;const carrier=makeUnit('capture-visual','scorp-sentry',0,25,false);sim.units.push(carrier);
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);sim.selected=carrier.id;assert.equal(sim.sendAllyOrder('kylie','board').accepted.length,1);world.update(0);
 const person=sim.soldiers.find(s=>s.personId==='kylie')!,rig=world.soldierRigs.get(person.id)!;assert.equal(rig.root.isEnabled(),true);
 for(let i=0;i<240;i++)sim.tick(1/60,{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false});world.update(0);
 assert.equal(person.driverOf,carrier.id);assert.equal(rig.root.isEnabled(),false);assert.equal(world.rigs.get(carrier.id)!.root.isEnabled(),true);
 sim.sendAllyOrder('kylie','disembark');world.update(0);assert.equal(world.soldierRigs.get(person.id),rig);assert.equal(rig.root.isEnabled(),true);assert.equal(sim.soldiers.filter(s=>s.personId==='kylie').length,1);engine.dispose();
});

test('rocket tower reference model has a green faceted body, metal canopy, ochre bands and fixed flared supports',async()=>{
 const {SCORP_TOWER_PALETTE}=await import('../content/vehicles.ts');const sim=new Simulation();sim.units=[makeUnit('tower-reference','scorp-rocket-tower',0,20)];
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine),rig=world.rigs.get('tower-reference')!;world.update(0);
 const meshes=rig.root.getChildMeshes(),column=meshes.find(m=>m.name==='tower-column')!,canopy=meshes.find(m=>m.name==='tower-metal-canopy')!;assert.ok(column&&canopy);assert.equal(meshes.filter(m=>m.name==='tower-support-strut').length,4);assert.equal(meshes.filter(m=>m.name==='tower-footing').length,4);assert.equal(meshes.filter(m=>m.name==='rocket-launcher').length,0);
 assert.equal(rig.parts.hull.paint.find(p=>p.base.toHexString()===SCORP_TOWER_PALETTE.green.toUpperCase())?.base.toHexString(),SCORP_TOWER_PALETTE.green.toUpperCase());
 const before=column.computeWorldMatrix(true).clone();sim.units[0].yaw=1.2;sim.units[0].aim=2;rig.recoil=1;world.update(.01);assert.ok(column.computeWorldMatrix(true).equals(before));assert.equal(rig.root.rotation.y,0);assert.equal(rig.torso.rotation.y,0);assert.equal(rig.torso.rotation.x,0);
 sim.units[0].parts.leftLeg=.4;world.update(0);assert.ok(rig.parts.leftLeg.paint.every(p=>p.material.diffuseColor.r<p.base.r&&p.material.diffuseColor.g<p.base.g&&p.material.diffuseColor.b<p.base.b));assert.ok(rig.parts.rightLeg.paint.some(p=>p.material.diffuseColor.toHexString()===SCORP_TOWER_PALETTE.metal.toUpperCase()));
 engine.dispose();
});

test('3-3 always initializes inside the ASV on launch, retry and return from another mission',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const world=new World({} as HTMLCanvasElement,new Simulation('Easy',MISSION_3_3),engine);
 const check=()=>{world.update(0);const own=world.sim.mounted!;assert.equal(world.mode,0);assert.equal(world.rigs.get(own.id)!.root.isEnabled(),false);assert.equal(world.camera.position.x,own.x);assert.equal(world.camera.position.z,own.z);assert.ok(world.sim.radioMembers.every(m=>m.unit!.z>own.z));};
 check();world.mode=0;world.reset(new Simulation('Easy',MISSION_3_3));check();world.mode=1;world.reset(new Simulation());assert.equal(world.mode,0);world.reset(new Simulation('Easy',MISSION_3_3));check();engine.dispose();
});


test('mission 3-3 rear view leaves visible ground beneath the vehicle while following chassis turns',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');
 const {Vector3,Matrix}=await import('@babylonjs/core/Maths/math.vector.js');
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),sim=new Simulation('Easy',MISSION_3_3),world=new World({} as HTMLCanvasElement,sim,engine);
 world.mode=2;for(const yaw of [0,.7,Math.PI]){
  sim.mounted!.yaw=yaw;world.update(0);world.camera.getViewMatrix(true);world.camera.getProjectionMatrix(true);
  const bottom=Vector3.Project(new Vector3(sim.player.x,0,sim.player.z),Matrix.Identity(),world.camera.getTransformationMatrix(),world.camera.viewport.toGlobal(1280,720));
  assert.ok(bottom.y<720*.9,`vehicle ground projects to ${bottom.y}`);assert.ok(bottom.y>720*.55);
  assert.ok(Math.abs(world.camera.position.x-(sim.player.x-Math.sin(yaw)*30))<1e-8);
 }
 engine.dispose();
});

test('up/down arrows tilt first-person and external cameras without moving; release holds and center restores',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts'),{readInput}=await import('../input.ts'),{defaults}=await import('../settings.ts');
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),sim=new Simulation('Easy',MISSION_3_3),world=new World({} as HTMLCanvasElement,sim,engine),settings=defaults();
 const tick=(key?:string)=>{sim.tick(1/60,readInput(settings,new Set(key?[key]:[]),false,world.mode!==0));world.update(0);};
 for(const mode of [0,1,2]){world.mode=mode;tick('Space');tick();const initial=world.camera.getTarget().clone(),position={x:sim.player.x,z:sim.player.z};
  for(let i=0;i<20;i++)tick('ArrowUp');assert.ok(world.camera.getTarget().y>initial.y);assert.deepEqual({x:sim.player.x,z:sim.player.z},position);assert.equal(sim.throttle,0);const pitch=sim.pitch;tick();assert.equal(sim.pitch,pitch);
  for(let i=0;i<40;i++)tick('ArrowDown');assert.ok(world.camera.getTarget().y<initial.y);tick('Space');assert.equal(sim.pitch,0);assert.ok(Math.abs(world.camera.getTarget().y-initial.y)<1e-6);assert.deepEqual({x:sim.player.x,z:sim.player.z},position);
 }
 engine.dispose();
});

test('launch-view Union ASV and Sheridan Rampage render distinct rear, armor and weapon silhouettes',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');const {VEHICLES}=await import('../content/vehicles.ts');
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),s=new Simulation('Easy',MISSION_3_3),world=new World({} as HTMLCanvasElement,s,engine);world.update(0);
 const sheridan=world.rigs.get('sheridan')!,asv=world.rigs.get('player-asv')!;
 assert.ok(sheridan.root.getChildMeshes().some(m=>m.name==='rampage armored brow'));assert.ok(sheridan.root.getChildMeshes().some(m=>m.name==='rampage central window'));
 assert.ok(asv.root.getChildMeshes().some(m=>m.name==='rear observation slit'));assert.ok(asv.root.getChildMeshes().some(m=>m.name==='engine grille slat'));
 assert.notEqual(VEHICLES['union-tactical'].height,VEHICLES['union-sentry'].height);assert.ok(VEHICLES['union-tactical'].weapons.includes('P2MEC'));
 assert.ok(world.scene.getMeshByName('start-left-cliff'));assert.ok(sheridan.root.rotation.y!==0);engine.dispose();
});

test('selected command facility has a building hologram, projects onto the HUD, and shares its scene bounds',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');const {facilityHologramSvg}=await import('./facility-hologram.ts');const {missionMap}=await import('./mission-map.ts');
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),s=new Simulation('Easy',MISSION_3_3),command=s.facilities.find(f=>f.facilityType==='command')!;
 s.mounted!.x=-700;s.mounted!.z=command.z;s.mounted!.yaw=-Math.PI/2;s.mounted!.aim=-Math.PI/2;s.pitch=s.targetElevation(command);s.selected=command.id;
 const world=new World({} as HTMLCanvasElement,s,engine);world.mode=0;world.update(0);assert.ok(world.projectTarget(command).visible);
 const mesh=world.scene.getMeshByName('command-center')!;assert.equal(mesh.position.x,command.x);assert.equal(mesh.metadata.facilityId,command.id);
 assert.ok(world.scene.getMeshByName('command-center-roof-turret'));assert.ok(world.scene.getMeshByName('command-center-antenna'));
 assert.ok(facilityHologramSvg('command').includes('司令部ホログラム'));assert.ok(missionMap(s,'ja').includes('司令部ホログラム'));engine.dispose();
});

test('player and Scorp infantry keep a smooth eight-head silhouette with longer legs, a compact torso and grounded boots',async()=>{
 const {SOLDIER_PROPORTIONS}=await import('./renderer.ts');const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const sim=new Simulation(),enemy=makeUnit('scorp-person','scorp-asv',30,0,true);sim.units.push(enemy);const person=sim.forceEject(enemy,'destruction')!,world=new World({} as HTMLCanvasElement,sim,engine);world.mode=2;world.update(0);
 for(const id of ['player',person.id]){const rig=world.soldierRigs.get(id)!,meshes=rig.root.getChildMeshes();meshes.forEach(mesh=>mesh.computeWorldMatrix(true));const head=meshes.find(m=>m.name==='soldier-head')!,headSize=head.getBoundingInfo().boundingBox.extendSizeWorld.y*2;
  const top=Math.max(...meshes.map(m=>m.getBoundingInfo().boundingBox.maximumWorld.y)),bottom=Math.min(...meshes.map(m=>m.getBoundingInfo().boundingBox.minimumWorld.y));assert.ok(Math.abs((top-bottom)/headSize-8)<1e-5);assert.ok(Math.abs(top-bottom-SOLDIER_PROPORTIONS.height)<1e-5);assert.ok(Math.abs(bottom-rig.root.position.y)<1e-5);assert.ok(rig.legs.every(leg=>leg.position.y>SOLDIER_PROPORTIONS.height/2));assert.ok(head.getTotalVertices()>100);
  const body=meshes.find(m=>m.name==='soldier-body')!,pelvis=meshes.find(m=>m.name==='soldier-pelvis')!;
  const bodyBounds=body.getBoundingInfo().boundingBox,pelvisBounds=pelvis.getBoundingInfo().boundingBox;
  assert.ok(bodyBounds.maximumWorld.y-bodyBounds.minimumWorld.y<3*headSize);
  assert.ok(Math.abs(bodyBounds.minimumWorld.y-pelvisBounds.maximumWorld.y)<.02);
  assert.equal((head.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial).diffuseTexture,null);
 }
 engine.dispose();
});
test('destroyed fixed tower leaves a permanent wreck after flames expire while normal wrecks vanish, and retry clears it',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),sim=new Simulation('Easy',MISSION_3_3),world=new World({} as HTMLCanvasElement,sim,engine),tower=sim.units.find(u=>u.kind==='scorp-rocket-tower')!,vehicle=sim.units[1];
 sim.damage(tower,9999);sim.damage(vehicle,9999);for(const event of sim.events)world.event(event);world.update(.1);assert.ok(world.destructions.has(tower.id));assert.ok(world.scene.getMeshByName('vehicle-flame'));world.update(1);
 assert.equal(world.rigs.has(tower.id),false);assert.ok(world.wreckRigs.has(tower.id));assert.ok(world.destructions.get(tower.id)!.flames.some(flame=>flame.position.y+flame.scaling.y*.5>2.4));assert.equal(world.wreckRigs.has(vehicle.id),false);const wreck=world.wreckRigs.get(tower.id)!;assert.equal(wreck.metadata.sourceUnitId,tower.id);world.update(20);assert.equal(world.destructions.size,0);assert.equal(world.wreckRigs.get(tower.id),wreck);assert.ok(world.scene.getMeshByName('facility-wreck-base'));
 world.reset(new Simulation('Easy',MISSION_3_3));assert.equal(world.wreckRigs.size,0);assert.equal(world.scene.getMeshByName('facility-wreck-base'),null);assert.ok(world.rigs.has(tower.id));engine.dispose();
});

test('Merc snowfield renders snow and solid right-hand terrain; switching missions clears snow resources',async()=>{
 const {MISSION_2_4}=await import('../content/missions/mission-2-4.ts');const sim=new Simulation('Easy',MISSION_2_4),engine=new NullEngine({renderWidth:1200,renderHeight:800,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);world.update(.016);
 assert.equal(world.mode,0);assert.ok(world.scene.getMaterialByName('snow')?.getActiveTextures().length);assert.ok(world.scene.getMaterialByName('snow-mountain'));assert.ok(world.scene.getMeshByName('snow-right-wall'));assert.equal(world.scene.getMeshByName('scrub'),null);assert.equal(world.scene.getMeshByName('valley-shrub'),null);
 const u=sim.mounted!;sim.move(u,Math.PI/2,145);assert.ok(u.x<89);sim.move(u,0,40);assert.ok(Math.abs(u.z-40)<1e-8);
 const count=world.scene.meshes.length;world.reset(new Simulation('Easy',MISSION_2_4));world.update(.016);assert.equal(world.scene.meshes.length,count);
 world.reset(new Simulation());world.update(.016);assert.equal(world.scene.getMeshByName('snow-right-wall'),null);assert.equal(world.scene.getMaterialByName('snow'),null);assert.ok(world.scene.getMaterialByName('sand'));engine.dispose();
});

test('DASY is a red machine gun and RAID is a slender red laser for either side',async()=>{
 const {MISSION_2_4}=await import('../content/missions/mission-2-4.ts');const {LinesMesh}=await import('@babylonjs/core/Meshes/linesMesh.js');const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),sim=new Simulation('Easy',MISSION_2_4),world=new World({} as HTMLCanvasElement,sim,engine);
 const own=sim.mounted!,enemy=makeUnit('enemy','merc-tactical',30,50,true,{weapons:['RAID']});sim.units.push(enemy);
 for(const unit of [own,enemy]){world.event({type:'shot',unit,from:{x:unit.x,z:unit.z},to:{x:unit.x,z:unit.z+80},weapon:'DASY'});const effect=world.effects.filter(e=>e.mesh.name==='bullet-tracer').at(-1)!,tracer=effect.mesh,paintTracer=tracer.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;assert.ok(paintTracer.emissiveColor.r>.9&&paintTracer.emissiveColor.g<.2);assert.equal(tracer.metadata.visual,'dashed-mg-tracer');assert.ok(tracer.metadata.segments>1);assert.equal(effect.duration,.16);assert.equal(effect.velocity,undefined);const flash=world.effects.filter(e=>e.mesh.name==='muzzle-flash').at(-1)!.mesh;const paint=flash.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;assert.ok(paint.emissiveColor.r>.9&&paint.emissiveColor.g<.2);}
 for(const unit of [own,enemy]){sim.mounted=unit;unit.cooldown=0;sim.fire(unit===own?3:1);assert.equal(sim.missiles.at(-1)?.weapon,'RAID');assert.equal(sim.missiles.at(-1)?.owner,unit.id);world.update(.016);const bolt=world.scene.meshes.filter(m=>m.metadata?.weapon==='RAID').at(-1)!;assert.ok(bolt);assert.equal(bolt.billboardMode,0);const bounds=bolt.getBoundingInfo().boundingBox.extendSize;assert.ok(bounds.y/Math.max(bounds.x,bounds.z)>10);assert.ok(!bolt.getClassName().includes('Lines'));}
 assert.ok(!world.scene.meshes.some(m=>m.name==='missile-body'));engine.dispose();
});

test('Merc RAID starts below the cockpit at its chin muzzle and charge recovers after firing',async()=>{
 const {MISSION_2_4}=await import('../content/missions/mission-2-4.ts');const sim=new Simulation('Easy',MISSION_2_4),u=sim.mounted!,engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);
 u.yaw=Math.PI/2;u.aim=Math.PI/2;sim.tick(.016,{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false,fire3:true});const shot=sim.events.find(e=>e.type==='shot'&&e.weapon==='RAID')!;assert.ok(shot?.position);assert.ok(shot.position.y<sim.eyeHeight-1);assert.ok(shot.position.x>u.x+2);assert.ok(Math.abs(shot.position.z-u.z)<1e-6);assert.ok(u.laserCharge<.1);
 world.update(.016);const barrel=world.scene.getMeshByName('raid chin barrel')!;barrel.computeWorldMatrix(true);assert.equal(barrel.metadata.bodyPart,'hull');assert.ok(barrel.getAbsolutePosition().y<sim.eyeHeight-1);
 for(let i=0;i<120;i++)sim.tick(1/60,{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false});assert.equal(u.laserCharge,1);engine.dispose();
});

test('player boarding from either external view enters cockpit; ally boarding does not change the player view',async()=>{
 const {toggleCamera}=await import('./camera-mode.ts');
 for(const external of [1,2]){
  const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine);
  world.mode=external;sim.human={...MISSION.vehicle};assert.ok(sim.board());for(const event of sim.events)world.event(event);world.update(0);assert.equal(world.mode,0);assert.equal(world.rigs.get(sim.mounted!.id)!.root.isEnabled(),false);
  world.mode=toggleCamera(world.mode,'rear');assert.equal(world.mode,2);const enemy=sim.units[1],soldier=sim.forceEject(enemy)!;world.event({type:'board',unit:enemy,soldier});assert.equal(world.mode,2);engine.dispose();
 }
});
test('passenger boarding enters first person and mounted mission starts override external defaults',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts'),{unionTacticalCockpitShellSvg}=await import('./union-tactical-cockpit.ts');
 const def=structuredClone(MISSION_3_3);def.initialView='external-diagonal';const sim=new Simulation('Easy',def),engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);
 assert.equal(world.mode,0);sim.eject('ground');const carrier=sim.units.find(u=>u.kind==='scorp-asv')!;carrier.iff=sim.iff;sim.units=[carrier];sim.human={x:carrier.x,z:carrier.z};world.mode=1;sim.events=[];assert.ok(sim.board());assert.equal(sim.passenger,carrier);for(const event of sim.events)world.event(event);world.update(0);assert.equal(world.mode,0);assert.equal(world.rigs.get(carrier.id)!.root.isEnabled(),false);
 const shell=unionTacticalCockpitShellSvg();assert.ok(shell.includes('assets/cockpits/union-tactical-reference.png'));assert.ok(shell.includes('tactical-metal-mask'));assert.ok(shell.includes('tactical-holo-grid'));engine.dispose();
});

test('TCREAP draws a thin moving red line for both player and AI, without a diamond or laser core',()=>{
 for(const ai of [false,true]){
  const sim=new Simulation(),unit=makeUnit('reap','union-asv',0,ai?40:0,ai,{weapons:['TCREAP'],faction:ai?'scorp':'union'});sim.units=[unit];sim.human={x:0,z:ai?0:-5};unit.yaw=unit.aim=ai?Math.PI:0;unit.spec.speed=0;
  const energy=unit.energy;if(ai){unit.alert=true;sim.tick(.01,{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false});}else{sim.human={x:0,z:0};sim.board();sim.fire(1);}
  const projectile=sim.missiles.find(p=>p.weapon==='TCREAP')!;assert.ok(projectile);assert.equal(unit.energy,energy);assert.equal(unit.ammunition.TCREAP,299);
  const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);world.update(0);
  const bolt=world.scene.meshes.find(m=>m.metadata?.weapon==='TCREAP')!;assert.ok(bolt);assert.equal(bolt.getClassName(),'Mesh');assert.equal(bolt.billboardMode,0);assert.equal(bolt.metadata.visual,'dashed-mg-tracer');assert.ok(bolt.metadata.segments>1);assert.equal(world.scene.getMeshByName('laser-white-core'),null);assert.equal(world.scene.getMeshByName('rocket-smoke'),null);engine.dispose();
 }
});

test('tower survivor remains enabled and above ground outside the rendered wreck after landing',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');const def=structuredClone(MISSION_3_3);def.units=[{id:'own',kind:'union-asv',x:0,z:0,pilot:false},{id:'tower',kind:'scorp-rocket-tower',x:0,z:65,pilot:true}];def.assignedUnitId='own';def.startMountedUnitId='own';def.companions=[];def.minefields=[];def.base=undefined;def.rocks=[];def.terrain.cliffs=[];
 const sim=new Simulation('Easy',def),engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);sim.damage(sim.units[1],9999);for(const e of sim.events)world.event(e);sim.events=[];
 for(let i=0;i<200;i++)sim.tick(1/60,{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false});world.update(3.34);const soldier=sim.soldiers[0],rig=world.soldierRigs.get(soldier.id)!;
 assert.equal(soldier.flight,null);assert.equal(rig.root.isEnabled(),true);assert.equal(rig.root.position.y,0);assert.ok(Math.abs(rig.root.position.x)>7);assert.ok(world.wreckRigs.has('tower'));engine.dispose();
});

test('Union Sentry has a low central cabin and high M-shaped shoulders with matching fixed hit regions',async()=>{
 const {VEHICLE_SHAPES}=await import('../content/vehicle-shapes.ts'),{intersectParts}=await import('../simulation/parts.ts');
 const s=new Simulation(),u=s.units[0],shape=VEHICLE_SHAPES['union-sentry'];
 s.units=[u];const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,s,engine);
 world.update(0);const rig=world.rigs.get(u.id)!,cabin=rig.parts.cockpit.meshes.find(m=>m.name==='cockpit')!,pod=rig.parts.rightLeg.meshes.find(m=>m.name==='prowler shoulder armor')!;
 cabin.computeWorldMatrix(true);pod.computeWorldMatrix(true);
 assert.ok(pod.getAbsolutePosition().y>cabin.getAbsolutePosition().y+1.5);const gun=rig.parts.rightWeapon.meshes.find(m=>m.name==='barrel')!;gun.computeWorldMatrix(true);assert.ok(gun.getAbsolutePosition().y<cabin.getAbsolutePosition().y-shape.cockpit.h/2);
 assert.equal(world.scene.getMeshByName('shoulder bridge'),null);
 assert.equal(rig.parts.hull.meshes.filter(m=>m.name==='prowler diagonal brace').length,2);
 const y=shape.upperLeg.y,x=u.x+shape.legX;
 assert.equal(intersectParts(u,{x,y,z:u.z+10},{x,y,z:u.z-10})?.part,'rightLeg');
 u.aim=Math.PI/2;world.update(0);assert.equal(rig.torso.rotation.y,0);
 assert.equal(intersectParts(u,{x,y,z:u.z+10},{x,y,z:u.z-10})?.part,'rightLeg');
 s.human={x:u.x,z:u.z};s.board();assert.ok(s.eyeHeight<cabin.getAbsolutePosition().y+shape.cockpit.h/2);engine.dispose();
});

test('Union infantry wears white from helmet to boots and death produces temporary red blood instead of a blast',()=>{
 const sim=new Simulation();sim.units=[];const soldier=sim.forceEject(makeUnit('white','union-sentry',0,25,true))!;soldier.flight=null;
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);world.update(0);
 const merc=sim.forceEject(makeUnit('merc','merc-sentry',4,25,true))!;merc.flight=null;world.update(0);const mercRig=world.soldierRigs.get(merc.id)!;assert.ok((mercRig.root.getChildMeshes().find(m=>m.name==='soldier-head')!.material as any).diffuseColor.r<.8);
 const rig=world.soldierRigs.get(soldier.id)!;
 for(const name of ['soldier-helmet','soldier-head','soldier-body','soldier-hand','soldier-boot']){const mesh=rig.root.getChildMeshes().find(m=>m.name===name)!;const color=(mesh.material as any).diffuseColor;assert.ok(color.r>.85&&color.g>.85&&color.b>.85,name);}
 world.event({type:'soldier-death',soldier,position:{x:soldier.x,y:1,z:soldier.z}});const blood=world.scene.meshes.filter(m=>m.name==='infantry-blood');assert.equal(blood.length,16);assert.equal(world.scene.meshes.filter(m=>m.name==='blast').length,0);
 const red=(blood[0].material as any).diffuseColor;assert.ok(red.r>red.g*4);world.update(.7);assert.ok(blood.every(m=>m.isDisposed()));engine.dispose();
});

test('infantry has articulated knees and runs only when its actual position changes, preserving the pose while paused',()=>{
 const sim=new Simulation();sim.units=[];sim.mission.base=undefined;sim.mission.rocks=[];sim.mission.terrain.cliffs=[];sim.human={x:0,z:0};
 const person=sim.forceEject(makeUnit('standing','merc-sentry',5,5,true))!;person.flight=null;person.alert=true;
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);world.mode=2;world.update(0);
 const hero=world.soldierRigs.get('player')!,npc=world.soldierRigs.get(person.id)!;assert.equal(hero.knees.length,2);assert.equal(hero.ankles[0].parent,hero.knees[0]);assert.equal(hero.knees[0].parent,hero.legs[0]);
 sim.human.z+=.4;world.update(.1);assert.ok(hero.knees.some(k=>k.rotation.x>.5));assert.ok(hero.arms.some(a=>Math.abs(a.rotation.x)>.1));assert.ok(hero.upper.rotation.x>0);assert.ok(npc.knees.every(k=>k.rotation.x===0));
 const pose=hero.knees.map(k=>k.rotation.x);world.update(0);assert.deepEqual(hero.knees.map(k=>k.rotation.x),pose);world.update(.1);assert.ok(hero.knees.every(k=>k.rotation.x===0));assert.equal(hero.upper.rotation.x,0);
 person.z+=.35;world.update(.1);assert.ok(npc.knees.some(k=>k.rotation.x>.5));engine.dispose();
});
test('Union Tactical slender legs leave a narrower hit region with higher hips while other Tactical chassis retain their proportions',async()=>{
 const {intersectParts}=await import('../simulation/parts.ts'),{VEHICLE_SHAPES}=await import('../content/vehicle-shapes.ts');const u=makeUnit('slender','union-tactical',0,0,false),shape=VEHICLE_SHAPES['union-tactical'];
 assert.equal(intersectParts(u,{x:shape.legX,y:1,z:4},{x:shape.legX,y:1,z:-4})?.part,'rightLeg');assert.equal(intersectParts(u,{x:shape.legX+.72,y:1,z:4},{x:shape.legX+.72,y:1,z:-4}),null);
 assert.equal(intersectParts(u,{x:shape.legX,y:4,z:4},{x:shape.legX,y:4,z:-4})?.part,'rightLeg');assert.ok(!('legScale' in VEHICLE_SHAPES['merc-tactical']));assert.ok(!('legScale' in VEHICLE_SHAPES['scorp-tactical']));
});

test('FIL-30 is a slender red projectile like RAID, with no diamond or billboard for player and AI units',()=>{
 const sim=new Simulation(),own=sim.units[0],enemy=makeUnit('fil-enemy','union-sentry',30,60,true);sim.units=[own,enemy];sim.human={x:own.x,z:own.z};sim.board();
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);
 for(const unit of [own,enemy]){sim.mounted=unit;unit.cooldown=0;sim.fire(2);world.update(0);const bolt=world.scene.meshes.filter(m=>m.metadata?.weapon==='FIL-30').at(-1)!;assert.ok(bolt);assert.equal(bolt.metadata.visual,'slender-laser');assert.equal(bolt.billboardMode,0);const bounds=bolt.getBoundingInfo().boundingBox.extendSize;assert.ok(bounds.y>bounds.x*10);assert.ok(world.scene.getMeshByName('fil30-white-core'));}
 assert.equal(world.scene.getMeshByName('laser-white-core'),null);engine.dispose();
});

test('Merc ground infantry use blue, white, black and gray for enemy pilots and the Merc player independently of IFF',async()=>{
 const {MISSION_2_4}=await import('../content/missions/mission-2-4.ts'),{MERC_INFANTRY_PALETTE}=await import('../content/infantry.ts');
 const sim=new Simulation('Easy',MISSION_2_4);sim.eject('ground');const enemy=makeUnit('merc-palette','merc-sentry',8,0,true);enemy.iff='2620';sim.units.push(enemy);const pilot=sim.forceEject(enemy)!;
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);world.mode=2;world.update(0);
 for(const id of ['player',pilot.id]){const rig=world.soldierRigs.get(id)!;assert.equal(rig.root.metadata.faction,'merc');const meshes=rig.root.getChildMeshes();
  const tint=(name:string)=>(meshes.find(m=>m.name===name)!.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial).diffuseColor.toHexString().toLowerCase();
  assert.equal(tint('soldier-body'),MERC_INFANTRY_PALETTE.blue);assert.equal(tint('merc-white-chest'),MERC_INFANTRY_PALETTE.white);assert.equal(tint('soldier-boot'),MERC_INFANTRY_PALETTE.black);assert.equal(tint('soldier-belt'),MERC_INFANTRY_PALETTE.gray);assert.equal(tint('soldier-head'),MERC_INFANTRY_PALETTE.face);
 }
 assert.equal(pilot.flight,null);engine.dispose();
});


test('EGGER has no gas cloud or explosion and keeps cabin deaths hidden',()=>{
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 const def=structuredClone(MISSION);def.footSecondaryWeapon='EGGER';def.completionEnabled=false;def.rocks=[];
 const sim=new Simulation('Easy',def);sim.units=[makeUnit('cabin','union-asv',0,40,true)];sim.iff=sim.units[0].iff;sim.human={x:0,z:0};sim.pitch=Math.atan2(2-sim.eyeHeight,40);sim.fire(2);
 const world=new World({} as HTMLCanvasElement,sim,engine);for(const event of sim.events)world.event(event);sim.events=[];world.update(.05);assert.equal(world.missileRigs.size,1);assert.equal(world.scene.getMeshByName('rocket-smoke'),null);
 for(let frame=0;frame<60;frame++){sim.tick(1/60,{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false});for(const event of sim.events)world.event(event);sim.events=[];world.update(1/60);}
 const person=sim.soldiers[0];assert.equal(person.alive,false);assert.equal(world.soldierRigs.get(person.id)!.root.isEnabled(),false);assert.equal(world.scene.getMeshByName('gas-cloud'),null);assert.equal(world.effects.length,0);engine.dispose();
});

test('mission completion shows a high diagonal camera and the player rig, overriding cockpit aim; reset restores normal view',()=>{
 for(const mounted of [false,true]){
  const sim=new Simulation();if(mounted){sim.human={...sim.units[0]};sim.board();}sim.pitch=-1;const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);world.mode=0;world.completionTime=0;world.update(0);
  const p=sim.player,camera=world.camera.position,look=world.camera.getTarget(),horizontal=Math.hypot(camera.x-p.x,camera.z-p.z);assert.ok(camera.y-look.y>horizontal*1.5);assert.ok(Math.abs(camera.x-p.x)>5);assert.ok(Math.abs(camera.z-p.z)>5);assert.ok(Math.abs(look.x-p.x)<1e-4&&Math.abs(look.z-p.z)<1e-4);
  assert.equal(mounted?world.rigs.get(sim.mounted!.id)!.root.isEnabled():world.soldierRigs.get('player')!.root.isEnabled(),true);const initial=camera.clone();world.completionTime=3;world.update(.02);assert.ok(!world.camera.position.equals(initial));world.reset(new Simulation());assert.equal(world.completionTime,null);engine.dispose();
 }
});


test('entering a building hides its exterior and the player, resets to first person and exits outside',async()=>{
 const {MISSION_3_3}=await import('../content/missions/mission-3-3.ts');const sim=new Simulation('Easy',MISSION_3_3),engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);
 sim.eject('ground');const command=sim.facilities.find(f=>f.facilityType==='command')!,root=world.scene.getTransformNodeByName(`facility-${command.id}`)!;assert.ok(root.getChildMeshes().length>0);assert.ok(root.parent);
 sim.human={x:command.x+command.width/2+1,z:command.z};assert.ok(sim.board());world.mode=2;world.event(sim.events.at(-1)!);assert.equal(world.mode,0);world.update(0);assert.equal(root.isEnabled(),false);assert.equal(world.soldierRigs.get('player')!.root.isEnabled(),false);assert.equal(world.camera.position.y,sim.eyeHeight);
 sim.eject();world.update(0);assert.equal(root.isEnabled(),true);assert.ok(sim.human.x>command.x+command.width/2+4);assert.equal(sim.flight,null);assert.equal(world.camera.position.y,1.7);
 world.reset(new Simulation());assert.equal(world.scene.getTransformNodeByName(`facility-${command.id}`),null);engine.dispose();
});


test('machine guns remain red and dashed in cockpit view, stop at the hit point, and fade without moving through cover',()=>{
 for(const [kind,weapon] of [['union-sentry','FLECH'],['merc-tactical','DASY'],['scorp-asv','zWASP']] as const){
  const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),sim=new Simulation(),unit=makeUnit('own',kind,0,18,false,{weapons:[weapon]});sim.units=[unit];sim.human={x:0,z:18};sim.board();const world=new World({} as HTMLCanvasElement,sim,engine);world.mode=0;world.update(0);
  world.event({type:'shot',unit,weapon,from:{x:0,y:4,z:20},to:{x:0,y:sim.eyeHeight,z:60}});
  const effect=world.effects.find(e=>e.mesh.metadata?.visual==='dashed-mg-tracer')!,mesh=effect.mesh;assert.ok(mesh);assert.ok(mesh.getVerticesData('position')!.every((n,i)=>i%3!==2||n<=60.04));assert.equal(effect.velocity,undefined);const paint=mesh.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;assert.equal(paint.disableLighting,true);assert.equal(paint.fogEnabled,false);assert.ok(paint.emissiveColor.r>.9);const position=mesh.position.clone();world.update(.1);assert.ok(mesh.isEnabled());assert.ok(mesh.visibility>0);assert.ok(mesh.position.equals(position));world.update(.07);assert.ok(mesh.isDisposed());engine.dispose();
 }
});

test('Scorp Tactical twin RAID models share the simulated under-cockpit muzzle locations',()=>{
 const engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),sim=new Simulation(),u=makeUnit('own','scorp-tactical',0,18,false);sim.units=[u];sim.human={x:0,z:18};sim.board();const world=new World({} as HTMLCanvasElement,sim,engine);world.mode=2;world.update(0);sim.fire(1);
 const barrels=world.scene.meshes.filter(m=>m.name==='scorp raid chin barrel');assert.equal(barrels.length,2);for(const barrel of barrels){barrel.computeWorldMatrix(true);const bounds=barrel.getBoundingInfo().boundingBox;assert.ok(sim.missiles.some(bolt=>Math.abs(bolt.x-bounds.centerWorld.x)<1e-5&&Math.abs(bolt.y-bounds.centerWorld.y)<1e-5&&Math.abs(bolt.z-bounds.maximumWorld.z)<1e-5));}engine.dispose();
});

test('Merc Meson tower has a fixed pedestal, rotating head and one cannon; reset restores the defense scene',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const sim=new Simulation('Easy',MISSION_2_6),engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);
 sim.human={x:-80,z:210};sim.board();world.mode=1;sim.aimBy(.6);world.update(.016);const rig=world.rigs.get('defense-tower')!;assert.equal(rig.root.rotation.y,0);assert.ok(Math.abs(rig.torso.rotation.y-.6)<1e-8);assert.equal(rig.torso.getChildMeshes().filter(m=>m.name==='meson-cannon').length,1);assert.ok(world.scene.getMeshByName('meson-pedestal'));
 world.reset(new Simulation('Easy',MISSION_2_6));world.update(.016);assert.equal(world.mode,0);assert.equal(world.rigs.get('defense-tower')!.root.isEnabled(),true);engine.dispose();
});


test('GAUS30 renders a blue laser with no rocket body, exhaust or explosion impact',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const sim=new Simulation('Easy',MISSION_2_6),engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine);sim.human={x:-80,z:210};sim.board();sim.fire(1);for(const e of sim.events)world.event(e);world.update(.01);
 const bolt=world.scene.meshes.find(m=>m.metadata?.visual==='blue-laser')!;assert.ok(bolt);const paint=bolt.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;assert.ok(paint.emissiveColor.b>paint.emissiveColor.r);assert.ok(world.missileRigs.get(sim.missiles[0].id)!.root.name.startsWith('laser-'));
 const size=bolt.getBoundingInfo().boundingBox.extendSize;assert.ok(size.z/size.x>190);assert.ok(size.x/size.y>14);assert.equal(bolt.metadata.shape,'thin-plate');assert.equal(paint.emissiveColor.toHexString(),'#2015A6');assert.equal(world.scene.getMeshByName('muzzle-flash')!.material,paint);assert.ok(paint.emissiveColor.b>paint.emissiveColor.g*3);assert.ok(paint.emissiveColor.b>paint.emissiveColor.r*5);assert.equal(paint.disableLighting,true);assert.equal(paint.fogEnabled,false);assert.equal(world.scene.getMeshByName('meson-blue-core'),null);
 sim.missiles[0].z+=300;world.update(0);assert.ok(bolt.scaling.x>1);assert.equal(bolt.scaling.y,1);assert.equal(bolt.scaling.z,1);
 const before=world.scene.meshes.filter(m=>m.name==='impact-flash'||m.name==='impact-smoke').length;world.event({type:'impact',weapon:'GAUS30',position:{x:0,y:2,z:100}});assert.equal(world.scene.meshes.filter(m=>m.name==='impact-flash'||m.name==='impact-smoke').length,before);assert.equal(world.scene.getMeshByName('gaus-blue-flash')!.material,paint);engine.dispose();
});


test('Merc Razor is a green diamond hovering close to the ground and bobs slightly only while moving',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const sim=new Simulation('Easy',MISSION_2_6),engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4}),world=new World({} as HTMLCanvasElement,sim,engine),aip=sim.units.find(u=>u.kind==='merc-aip')!;world.update(0);const rig=world.rigs.get(aip.id)!,base=rig.root.position.y;assert.ok(base>0&&base<2);
 const platform=world.scene.getMeshByName('aip-diamond-platform')!,paint=platform.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;assert.ok(paint.diffuseColor.g>paint.diffuseColor.r&&paint.diffuseColor.g>paint.diffuseColor.b);assert.ok(platform.getTotalVertices()>0);const hullSize=platform.getBoundingInfo().boundingBox.extendSize;assert.ok(Math.abs(hullSize.x-3)<1e-6);assert.ok(Math.abs(hullSize.z-2.5)<1e-6);assert.equal(platform.getTotalVertices(),24);const canopy=world.scene.getMeshByName('aip-cockpit')!;assert.equal(canopy.metadata.bodyPart,'cockpit');
 aip.speed=20;sim.time=.5;world.update(.01);const up=rig.root.position.y;sim.time=1.5;world.update(.01);assert.ok(Math.abs(up-rig.root.position.y)>.1);assert.ok(Math.abs(rig.root.position.y-base)<.2);aip.speed=0;world.update(0);assert.equal(rig.root.position.y,base);engine.dispose();
});


test('Meson reference cockpit keeps only its frame while live tower instruments survive boarding and camera changes',async()=>{
 const {mesonCockpitShellSvg}=await import('./meson-cockpit.ts');
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');
 const sim=new Simulation('Easy',MISSION_2_6),engine=new NullEngine({renderWidth:1280,renderHeight:720,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{
  sim.human={x:-80,z:210};assert.ok(sim.board());assert.equal(sim.mounted!.kind,'merc-meson-tower');
  const world=new World({} as HTMLCanvasElement,sim,engine);world.update(0);assert.equal(world.rigs.get(sim.mounted!.id)!.root.isEnabled(),false);
  world.mode=2;world.update(0);assert.equal(world.rigs.get(sim.mounted!.id)!.root.isEnabled(),true);world.mode=0;world.update(0);assert.equal(world.rigs.get(sim.mounted!.id)!.root.isEnabled(),false);
  const shell=mesonCockpitShellSvg();assert.ok(shell.includes('merc-mison-guard-tower.png'));assert.ok(shell.includes('viewBox="0 0 1650 952"'));assert.ok(shell.includes('maskUnits="userSpaceOnUse"'));assert.ok(shell.includes('fill="black"'));
  sim.eject('ground');world.update(0);assert.equal(sim.mounted,null);assert.equal(world.renderError,null);
 }finally{engine.dispose();}
});

test('2-6 renders a blue Merc fortress, a power plant and a named Latlon array in reference order',async()=>{
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');const {facilityHologramSvg}=await import('./facility-hologram.ts');
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{
  const world=new World({} as HTMLCanvasElement,new Simulation('Easy',MISSION_2_6),engine);world.update(0);
  const fortress=world.scene.getMeshByName('citadel')!,plant=world.scene.getMeshByName('power-plant')!,comm=world.scene.getMeshByName('latlon-comm-array')!;
  assert.ok(fortress.position.x>plant.position.x&&plant.position.x>comm.position.x);
  assert.equal((fortress.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial).diffuseColor.toHexString(),'#334F9B');
  assert.ok(world.scene.getMeshByName('latlon-transmitter-band'));assert.ok(facilityHologramSvg('comm-array').includes('Latlon通信基地'));
 }finally{engine.dispose();}
});

test('Z diagonal view frames the subject farther away and more from the side while rear view stays behind',()=>{
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{
  const sim=new Simulation(),world=new World({} as HTMLCanvasElement,sim,engine);
  for(const mounted of [false,true]){
   if(mounted){const unit=sim.units[0];unit.pilot=false;sim.human={x:unit.x,z:unit.z};assert.ok(sim.board());}
   for(const yaw of [0,.8]){
    if(sim.mounted)sim.mounted.yaw=sim.mounted.aim=yaw;else sim.humanYaw=yaw;
    world.mode=2;world.update(0);const rear=world.camera.position.clone(),position={...sim.player};
    world.mode=1;world.update(0);const diagonal=world.camera.position,dx=diagonal.x-position.x,dz=diagonal.z-position.z;
    const behind=-(dx*Math.sin(yaw)+dz*Math.cos(yaw)),side=dx*Math.cos(yaw)-dz*Math.sin(yaw);
    assert.ok(Math.hypot(dx,dz)>Math.hypot(rear.x-position.x,rear.z-position.z)*1.1);
    assert.ok(side/behind>.65,'view should show more of the subject side');assert.equal(diagonal.y,rear.y);
    assert.ok(Math.abs((rear.x-position.x)*Math.cos(yaw)-(rear.z-position.z)*Math.sin(yaw))<1e-8);
   }
  }
 }finally{engine.dispose();}
});

test('Meson shots have no tower or camera recoil and the ribbon faces rear and diagonal cameras',async()=>{
 const {Vector3}=await import('@babylonjs/core/Maths/math.vector.js');
 const {MISSION_2_6}=await import('../content/missions/mission-2-6.ts');
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{
  for(const mode of [0,1,2]){
   const sim=new Simulation('Easy',MISSION_2_6);sim.human={x:-80,z:210};assert.ok(sim.board());sim.events=[];sim.time=.17;
   const world=new World({} as HTMLCanvasElement,sim,engine);world.mode=mode;world.update(0);
   const tower=sim.mounted!,rig=world.rigs.get(tower.id)!,camera=world.camera.position.clone(),body=rig.root.position.clone(),cannon=rig.cannon!.position.clone();
   sim.fire(1);assert.ok(sim.events.some(e=>e.type==='shot'));for(const event of sim.events)world.event(event);world.update(0);
   assert.equal(rig.recoil,0);assert.ok(world.camera.position.equals(camera));assert.ok(rig.root.position.equals(body));assert.ok(rig.cannon!.position.equals(cannon));assert.equal(rig.torso.position.z,0);assert.equal(rig.torso.rotation.x,0);
   const missile=sim.missiles.find(m=>m.weapon==='GAUS30')!;assert.ok(missile);missile.z+=300;world.update(0);
   const laser=world.missileRigs.get(missile.id)!,bolt=laser.flame,normal=Vector3.TransformNormal(Vector3.Up(),bolt.computeWorldMatrix(true)).normalize(),axis=new Vector3(missile.vx,missile.vy,missile.vz).normalize();
   const view=world.camera.position.subtract(laser.root.position),side=view.subtract(axis.scale(Vector3.Dot(view,axis))).normalize();
   assert.ok(Math.abs(Vector3.Dot(normal,side))>.999,'the wide face must remain visible from each camera');
   const distance=Vector3.Distance(world.camera.position,laser.root.position),pixelWidth=.12*bolt.scaling.x/(distance*2*Math.tan(world.camera.fov/2))*engine.getRenderHeight();assert.ok(pixelWidth>=3-1e-8);
   world.scene.dispose();
  }
 }finally{engine.dispose();}
});

test('Merc AIP TAR12 renders yellow bolts, muzzle and impact for player and AI',()=>{
 for(const ai of [false,true]){
  const s=new Simulation(),aip=makeUnit('aip','merc-aip',0,0,ai);s.units=[aip];s.human=ai?{x:0,z:70}:{x:0,z:0};s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.completionEnabled=false;if(!ai)assert.ok(s.board());
  const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
  try{
   const world=new World({} as HTMLCanvasElement,s,engine);if(ai){aip.iff='enemy';aip.alert=true;aip.attackCycle=2;s.tick(.016,{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false});}else s.fire(1);
   assert.ok(s.events.some(e=>e.type==='shot'&&e.weapon==='TAR12'));for(const event of s.events)world.event(event);world.update(0);
   const yellow=(mesh:import('@babylonjs/core/Meshes/abstractMesh.js').AbstractMesh)=>{const c=(mesh.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial).emissiveColor;assert.ok(c.r>.9&&c.g>.8&&c.b<.25);};
   const bolt=world.scene.meshes.find(m=>m.metadata?.weapon==='TAR12'&&m.metadata.visual==='yellow-laser')!;assert.ok(bolt);yellow(bolt);yellow(world.scene.getMeshByName('muzzle-flash')!);
   const before=world.scene.meshes.filter(m=>m.name==='impact-flash').length;world.event({type:'impact',weapon:'TAR12',position:{x:0,y:2,z:50}});yellow(world.scene.getMeshByName('tar12-yellow-flash')!);assert.equal(world.scene.meshes.filter(m=>m.name==='impact-flash').length,before);
  }finally{engine.dispose();}
 }
});

test('Merc Meson photo model has a navy bowl over a weathered flared base, red markings and a shared cannon muzzle',()=>{
 const s=new Simulation(),u=makeUnit('photo-tower','merc-meson-tower',0,0,false);s.units=[u];s.human={x:0,z:0};s.mission.base=undefined;s.mission.rocks=[];s.mission.terrain.cliffs=[];s.mission.completionEnabled=false;assert.ok(s.board());
 const engine=new NullEngine({renderWidth:1000,renderHeight:800,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{
  const world=new World({} as HTMLCanvasElement,s,engine);world.mode=2;world.update(0);const head=world.scene.getMeshByName('meson-head')!,base=world.scene.getMeshByName('meson-pedestal')!,positions=head.getVerticesData('position')!;
  let upper=0,lower=0;for(let i=0;i<positions.length;i+=3){const radius=Math.hypot(positions[i],positions[i+2]);if(positions[i+1]>1.9)upper=Math.max(upper,radius);if(positions[i+1]<-1.9)lower=Math.max(lower,radius);}assert.ok(upper>lower*2);
  const paint=head.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;assert.ok(paint.diffuseColor.b>paint.diffuseColor.r*2);assert.ok(paint.diffuseTexture);assert.equal(base.metadata.bodyPart,'hull');assert.equal(world.scene.meshes.filter(m=>m.name==='meson-pedestal-red-mark').length,2);assert.equal(world.scene.getMeshByName('meson-roof-cap')!.metadata.bodyPart,'cockpit');
  for(const [yaw,pitch] of [[0,0],[Math.PI/2,.3]] as const){u.aim=yaw;s.pitch=pitch;u.cooldown=0;u.laserCharge=1;world.update(0);s.events=[];s.fire(1);const shot=s.events.find(e=>e.type==='shot'&&e.weapon==='GAUS30')!;assert.ok(shot);const muzzle=world.scene.getMeshByName('meson-muzzle')!;muzzle.computeWorldMatrix(true);const center=muzzle.getAbsolutePosition();assert.ok(Math.hypot(shot.from!.x-center.x,shot.from!.y!-center.y,shot.from!.z-center.z)<1e-5);}
 }finally{engine.dispose();}
});

test('4-2 renders grassland under amber skies, a dedicated rotating Scorp Meson cannon and the right rocket tower',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{const s=new Simulation('Easy',MISSION_4_2),world=new World({} as HTMLCanvasElement,s,engine);world.update(0);
 assert.ok(world.scene.getMeshByName('scorp-meson-column'));assert.ok(world.scene.getMeshByName('scorp-meson-brace'));assert.ok(world.scene.getMeshByName('scorp-meson-cannon'));assert.ok(world.scene.getMeshByName('tower-launch-panel'));assert.ok(world.scene.clearColor.r>world.scene.clearColor.b);assert.ok(world.scene.getMaterialByName('grass'));
 const tower=s.units.find(u=>u.id==='scorp-meson')!;tower.aim=.7;world.update(0);assert.equal(world.rigs.get(tower.id)!.torso.rotation.y,.7);assert.equal(world.rigs.get(tower.id)!.root.rotation.y,0);
 const {scorpMesonCockpitShellSvg}=await import('./scorp-meson-cockpit.ts');assert.ok(scorpMesonCockpitShellSvg().includes('scorp-meson-reference'));assert.ok(!scorpMesonCockpitShellSvg().includes('merc-mison'));
 }finally{engine.dispose();}
});

test('Merc Meson GAUS emits an ultramarine viewmodel jet from the lower left toward the reticle without changing its projectile',async()=>{
 const {Vector3}=await import('@babylonjs/core/Maths/math.vector.js');const s=new Simulation(),u=makeUnit('own','merc-meson-tower',0,0,false);s.units=[u];s.human={x:0,z:0};assert.ok(s.board());const engine=new NullEngine({renderWidth:1000,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{
  const world=new World({} as HTMLCanvasElement,s,engine);world.update(0);s.fire(1);const projectile={...s.missiles[0]};for(const event of s.events)world.event(event);world.update(.01);const jet=world.scene.getMeshByName('meson-cockpit-jet')!;assert.ok(jet);assert.equal(jet.parent,world.camera);assert.equal(s.missiles.length,1);assert.deepEqual(s.missiles[0],projectile);assert.equal(world.scene.getMeshByName('muzzle-flash')!.isEnabled(),false);assert.equal(world.missileRigs.get(projectile.id)!.root.isEnabled(),false);
  jet.computeWorldMatrix(true);const viewport=world.camera.viewport.toGlobal(1000,600),project=(v:InstanceType<typeof Vector3>)=>Vector3.Project(v,jet.getWorldMatrix(),world.scene.getTransformMatrix(),viewport);const near=project(new Vector3(-.29,-.52,2.6)),far=project(new Vector3(0,-.12,14));assert.ok(near.x<500&&near.y>350);assert.ok(Math.abs(far.x-500)<15&&Math.abs(far.y-300)<15);
  const paint=jet.material as import('@babylonjs/core/Materials/standardMaterial.js').StandardMaterial;assert.ok(paint.emissiveColor.b>paint.emissiveColor.r*3);assert.ok(paint.alpha<1);assert.equal(paint.fogEnabled,false);
  world.mode=2;world.update(0);assert.equal(jet.isEnabled(),false);assert.equal(world.scene.getMeshByName('muzzle-flash')!.isEnabled(),true);assert.equal(world.missileRigs.get(projectile.id)!.root.isEnabled(),true);world.update(.2);assert.equal(jet.isDisposed(),true);world.event(s.events.find(e=>e.type==='shot')!);assert.equal(world.scene.getMeshByName('meson-cockpit-jet'),null);
 }finally{engine.dispose();}
});

test('Merc Assault keeps its chassis level while its spider legs swing sideways and rise, then settle when stopped',async()=>{
 const {Vector3}=await import('@babylonjs/core/Maths/math.vector.js');const {VEHICLE_SHAPES}=await import('../content/vehicle-shapes.ts');
 const sim=new Simulation(),unit=makeUnit('sway-spider','merc-assault',0,0,false);sim.units=[unit];const engine=new NullEngine({renderWidth:1000,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{
  const world=new World({} as HTMLCanvasElement,sim,engine);world.mode=2;const rig=world.rigs.get(unit.id)!,shape=VEHICLE_SHAPES['merc-assault'].spider;let minFoot=Infinity,maxFoot=0,maxLift=0;
  for(let i=0;i<120;i++){
   unit.z+=unit.spec.speed/3.6*.04;world.update(.04);assert.equal(rig.torso.position.x,0);assert.equal(rig.torso.rotation.z,0);assert.equal(rig.torso.rotation.x,0);assert.equal(rig.root.position.y,0);
   assert.equal(rig.root.rotation.z,0);assert.equal(rig.root.position.x,unit.x);
   for(const leg of rig.spiderLegs!){
    maxLift=Math.max(maxLift,leg.foot.position.y-.1);minFoot=Math.min(minFoot,Math.abs(leg.foot.position.x));maxFoot=Math.max(maxFoot,Math.abs(leg.foot.position.x));leg.foot.computeWorldMatrix(true);assert.ok(leg.foot.getAbsolutePosition().y>=.1-1e-7);
    leg.upper.computeWorldMatrix(true);rig.torso.computeWorldMatrix(true);const joint=Vector3.TransformCoordinates(new Vector3(0,-.5,0),leg.upper.getWorldMatrix()),socket=Vector3.TransformCoordinates(new Vector3(leg.side*shape.hipX,shape.hipY-rig.torso.position.y,leg.front*shape.hipZ),rig.torso.getWorldMatrix());assert.ok(Vector3.Distance(joint,socket)<1e-4,`hip joint separation: ${Vector3.Distance(joint,socket)}`);
   }
  }
  assert.ok(maxFoot-minFoot>.9);assert.ok(maxLift>.8);rig.recoil=1;world.update(0);assert.equal(rig.torso.rotation.x,0);assert.equal(rig.torso.position.z,0);
  for(let i=0;i<120;i++)world.update(.04);
  assert.ok(Math.abs(rig.torso.position.x)<1e-8);assert.ok(Math.abs(rig.torso.rotation.z)<1e-8);assert.ok(rig.spiderLegs!.every(l=>Math.abs(l.foot.position.y-.1)<1e-8));
 }finally{engine.dispose();}
});


test('Merc Assault window scenery sways gently with its gait, freezes on pause and clears outside its cockpit',()=>{
 const sim=new Simulation(),unit=makeUnit('cockpit-sway','merc-assault',0,0,false);sim.units=[unit];sim.human={x:0,z:0};assert.ok(sim.board());const engine=new NullEngine({renderWidth:1000,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{
  const world=new World({} as HTMLCanvasElement,sim,engine);world.mode=0;world.update(0);assert.equal(world.cockpitBackdropSwayPercent,0);const rig=world.rigs.get(unit.id)!;
  rig.phase=Math.PI/2;rig.run=1;world.update(0);const right=world.cockpitBackdropSwayPercent;assert.ok(right>.4&&right<1);world.update(0);assert.equal(world.cockpitBackdropSwayPercent,right);
  rig.phase=-Math.PI/2;world.update(0);assert.equal(world.cockpitBackdropSwayPercent,-right);world.mode=2;assert.equal(world.cockpitBackdropSwayPercent,0);world.mode=0;world.completionTime=0;assert.equal(world.cockpitBackdropSwayPercent,0);world.completionTime=null;
  const aim=sim.aim,pitch=sim.pitch;for(let i=0;i<120;i++)world.update(.04);assert.ok(Math.abs(world.cockpitBackdropSwayPercent)<1e-8);assert.equal(sim.aim,aim);assert.equal(sim.pitch,pitch);
  sim.mounted=null;assert.equal(world.cockpitBackdropSwayPercent,0);unit.kind='merc-sentry';sim.mounted=unit;assert.equal(world.cockpitBackdropSwayPercent,0);
 }finally{engine.dispose();}
});

test('bridge control raises both leaves and remains visible from the completion camera',async()=>{
 const {MISSION_4_2}=await import('../content/missions/mission-4-2.ts');const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512,deterministicLockstep:true,lockstepMaxSteps:4});
 try{const s=new Simulation('Easy',MISSION_4_2),world=new World({} as HTMLCanvasElement,s,engine);world.update(0);assert.ok(world.scene.getMeshByName('river-water'));assert.equal(world.scene.getTransformNodeByName('bridge-hinge-1')!.rotation.z,0);
 const control=s.facilities.find(f=>f.id==='bridge-control')!;s.human={x:control.x-control.width/2-1,z:control.z};assert.ok(s.board());world.update(0);assert.equal(world.scene.getTransformNodeByName('facility-bridge-control')!.isEnabled(),false);
 assert.ok(s.raiseBridge());world.completionTime=0;world.update(0);assert.ok(Math.abs(world.scene.getTransformNodeByName('bridge-hinge-1')!.rotation.z)>1.4);assert.ok(world.scene.getTransformNodeByName('bridge-hinge--1')!.rotation.z>1.4);assert.equal(world.scene.getTransformNodeByName('facility-bridge-control')!.isEnabled(),true);
 const {bridgeControlMarkup}=await import('./bridge-control.ts');assert.ok(bridgeControlMarkup().includes('id="bridgeSwitch"'));assert.ok(bridgeControlMarkup().includes('bridge-control-building'));
 }finally{engine.dispose();}
});

test('infantry target holograms show the selected person name and escape markup',async()=>{
 const {infantryHologramSvg}=await import('./hologram.ts');const kylie=infantryHologramSvg('キリー'),thane=infantryHologramSvg('ターン');assert.ok(kylie.includes('data-role="person-name"'));assert.ok(kylie.includes('キリー'));assert.ok(!thane.includes('キリー'));assert.ok(thane.includes('ターン'));const escaped=infantryHologramSvg('<ally & "friend">');assert.ok(!escaped.includes('<ally'));assert.ok(escaped.includes('&lt;ally &amp; &quot;friend&quot;&gt;'));
});
