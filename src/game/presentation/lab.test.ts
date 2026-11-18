import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine.js';
import {Scene} from '@babylonjs/core/scene.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {VEHICLES} from '../content/vehicles.ts';
import {makeUnit} from '../simulation/simulation.ts';
import {LAB_INITIAL,LAB_FACTIONS,labItems,labMove,labSelection,labMarkup,hasWeaponPreview} from './lab.ts';
import {buildVehicleModel,buildSoldierModel,buildLaserProjectile,buildRocketProjectile,buildGunTracer} from './renderer.ts';

test('LAB lists every defined chassis, including those absent from the selected mission',()=>{
 const kinds=LAB_FACTIONS.flatMap(faction=>labItems('vehicles',faction).map(item=>item.kind));
 assert.deepEqual(new Set(kinds),new Set(Object.keys(VEHICLES)));
 assert.equal(new Set(kinds).size,kinds.length);
 const state={...LAB_INITIAL,index:labItems('vehicles','darken').length-1};
 assert.equal(labMove(state,1).index,0);
 assert.equal(labSelection({...state,index:-1}).item?.id,labItems('vehicles','darken').at(-1)?.id);
 assert.ok(labMarkup({...LAB_INITIAL,faction:'union'},'ja').includes('data-action="lab-category:structures"'));
 for(const category of ['vehicles','structures','personnel','weapons'] as const)for(const faction of LAB_FACTIONS){
  const items=labItems(category,faction);for(let index=0;index<items.length;index++)assert.ok(labMarkup({category,faction,index},'en').includes(items[index].name));
 }
});

test('LAB uses the same vehicle and soldier mesh builders as the battlefield',()=>{
 const engine=new NullEngine({renderWidth:800,renderHeight:600,textureSize:512});const scene=new Scene(engine);
 const material=(name:string,hex:string)=>{const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);return m;};
 for(const kind of ['darken-sentry','darken-tactical','scorp-asv'] as const){
  const root=buildVehicleModel(scene,makeUnit(`lab-${kind}`,kind,0,0,false),material).root;
  assert.ok(root.getChildMeshes().length>10,kind);root.dispose(false,true);
 }
 const soldier=buildSoldierModel(scene,'lab-scorp',false,'scorp','scorp',material).root;
 assert.ok(soldier.getChildMeshes().length>5);soldier.dispose(false,true);scene.dispose();engine.dispose();
});

test('LAB projectile previews share battlefield geometry and keep absent models explicit',()=>{
 const engine=new NullEngine({renderWidth:640,renderHeight:480});const scene=new Scene(engine);
 const material=(name:string,hex:string)=>{const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);return m;};
 assert.equal(hasWeaponPreview('PRIF44'),false);assert.equal(hasWeaponPreview('CHUM'),true);
 const laser=buildLaserProjectile(scene,'RUPP','lab-rup',material,()=>material('gaus','#388bff'));
 assert.equal(laser.metadata?.visual,'yellow-laser');
 const rocket=buildRocketProjectile(scene,'CHUM',material);assert.ok(rocket.root.getChildMeshes().some(m=>m.name==='missile-fin'));
 const tracer=buildGunTracer(scene,new Vector3(0,0,-4),new Vector3(0,0,.8),'FLECH','lab-tracer',material);
 assert.equal(tracer.metadata?.visual,'dashed-mg-tracer');scene.dispose();engine.dispose();
});
