import {Engine} from '@babylonjs/core/Engines/engine.js';
import {Scene} from '@babylonjs/core/scene.js';
import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera.js';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight.js';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight.js';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color.js';
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {VEHICLES,resolveVehicle,type Faction,type VehicleKind} from '../content/vehicles.ts';
import {LASERS,MACHINE_GUNS,MISSILES,INFANTRY_WEAPONS} from '../content/weapons.ts';
import {MISSIONS,type MissionDefinition} from '../content/missions/index.ts';
import {FACILITY_NAMES,type FacilityType} from '../simulation/facilities.ts';
import {makeUnit} from '../simulation/simulation.ts';
import {makeBase} from './base.ts';
import {buildGunTracer,buildLaserProjectile,buildRocketProjectile,buildSoldierModel,buildVehicleModel} from './renderer.ts';

export type LabCategory='vehicles'|'structures'|'personnel'|'weapons';
export type LabState={category:LabCategory;faction:Faction;index:number};
export type LabItem={id:string;name:string;category:LabCategory;faction:Faction;kind?:VehicleKind;facilityType?:FacilityType;building?:NonNullable<MissionDefinition['base']>['buildings'][number];weapon?:string};
export const LAB_CATEGORIES:LabCategory[]=['vehicles','structures','personnel','weapons'];
export const LAB_FACTIONS:Faction[]=['darken','union','merc','scorp'];
export const LAB_INITIAL:LabState={category:'vehicles',faction:'darken',index:0};

const referenceByVehicle:Partial<Record<VehicleKind,string>>={
 'darken-sentry':'docs/reference/vehicles/darken/README.md',
 'darken-tactical':'assets/reference/darken-tactical/darken-td-front-hawk.png',
 'scorp-asv':'docs/reference/vehicles/scope-asv/user-scorp-asv-lab-2026-10-24.png',
};
const repoUrl='https://github.com/qei-2027-700/g-gnome-ts/blob/main/';
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

export function labItems(category:LabCategory,faction:Faction):LabItem[]{
 if(category==='vehicles')return (Object.keys(VEHICLES) as VehicleKind[]).filter(kind=>VEHICLES[kind].faction===faction).map(kind=>({id:kind,name:VEHICLES[kind].name,category,faction,kind}));
 if(category==='structures'){
  const seen=new Set<string>(),items:LabItem[]=[];
  for(const mission of MISSIONS){const base=mission.base;if(!base||(base.faction??'scorp')!==faction)continue;
   for(const building of base.buildings){const facilityType=building.kind??'command';if(seen.has(facilityType))continue;seen.add(facilityType);
    items.push({id:`${faction}-${facilityType}`,name:FACILITY_NAMES[facilityType],category,faction,facilityType,building});
   }
  }
  return items;
 }
 if(category==='personnel')return [{id:`${faction}-soldier`,name:`${faction.toUpperCase()} Infantry`,category,faction}];
 const installed=new Set<string>();
 for(const spec of Object.values(VEHICLES))if(spec.faction===faction)for(const weapon of spec.weapons)installed.add(weapon);
 for(const weapon of Object.keys(INFANTRY_WEAPONS))installed.add(weapon);
 return [...installed].map(weapon=>({id:`${faction}-${weapon}`,name:weapon,category,faction,weapon}));
}

export function labSelection(state:LabState){const items=labItems(state.category,state.faction);return {items,item:items.length?items[((state.index%items.length)+items.length)%items.length]:undefined};}
export function labMove(state:LabState,step:number):LabState{const count=labItems(state.category,state.faction).length;return {...state,index:count?(state.index+step+count)%count:0};}
export function hasWeaponPreview(weapon:string){return weapon in LASERS||weapon in MISSILES||weapon in MACHINE_GUNS||weapon==='GASHR'||weapon==='EGGER';}

function details(item:LabItem,locale:'ja'|'en'){
 const ja=locale==='ja',rows:[string,string][]=[];
 if(item.kind){const spec=resolveVehicle(item.kind);rows.push(['CLASS',spec.category??(item.kind.endsWith('-asv')?'ASV':'HAWC')],['MAX SPEED',`${spec.speed} km/h`],['SHIELD',String(spec.shield)],['ENERGY',String(spec.energy)],['HEIGHT',`${spec.height} m`],['ARMAMENT',spec.weapons.join(' / ')||'—']);}
 else if(item.building){rows.push(['TYPE',item.facilityType??'—'],['SIZE',`${item.building.width} × ${item.building.depth} × ${item.building.height} m`]);}
 else if(item.weapon){const id=item.weapon;const spec=id in LASERS?LASERS[id as keyof typeof LASERS]:id in MACHINE_GUNS?MACHINE_GUNS[id as keyof typeof MACHINE_GUNS]:id in MISSILES?MISSILES[id as keyof typeof MISSILES]:INFANTRY_WEAPONS[id as keyof typeof INFANTRY_WEAPONS];
  if('range'in spec)rows.push(['RANGE',`${spec.range} m`]);if('damage'in spec)rows.push(['DAMAGE',String(spec.damage)]);
 }
 const source=item.kind?referenceByVehicle[item.kind]??'docs/reference/vehicles/README.md':item.category==='weapons'?'docs/reference/vehicles-and-weapons.md':undefined;
 const status=source?ja?'外観照合: 未完了。リンク先の資料と比較してください。':'Visual comparison: incomplete. Compare with the linked reference.':ja?'外観照合: 未完了。原作画像は未登録です。':'Visual comparison: incomplete. No original image is registered.';
 const note=item.category==='structures'?ja?'寸法は登場任務の代表例。原作の確定値ではありません。':'Dimensions are from one mission, not confirmed original values.':item.category==='personnel'?ja?'勢力別の共通歩兵モデル':'Shared infantry model for this faction':item.category==='weapons'?hasWeaponPreview(item.weapon!)?ja?'表示中の3Dは発射体です。武器本体の単独モデルは未実装。':'The 3D preview shows a projectile. No standalone weapon model is implemented.':ja?'発射体・武器本体の単独モデルは未実装。':'No standalone projectile or weapon model.':ja?'性能値には未確認の仮値が含まれます。':'Some performance values remain provisional.';
 return `<dl>${rows.map(([key,value])=>`<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl><p class="lab-note">${escape(note)}</p><p class="lab-status">${escape(status)}</p>${source?`<a class="lab-reference" href="${repoUrl}${source}" target="_blank" rel="noopener">${ja?'原作資料を開く':'Open reference'}</a>`:`<span class="lab-status">${ja?'原作画像は未登録':'No original image registered'}</span>`}`;
}

export function labMarkup(state:LabState,locale:'ja'|'en'){
 const {items,item}=labSelection(state),ja=locale==='ja';
 return `<section class="lab-console" aria-label="LAB"><header class="lab-title">${item?escape(item.name):'LAB'}</header>
 <nav class="lab-categories" aria-label="${ja?'分類':'Category'}">${LAB_CATEGORIES.map(category=>`<button data-action="lab-category:${category}" ${state.category===category?'aria-current="true"':''}>${category.toUpperCase()}</button>`).join('')}</nav>
 <div class="lab-screen"><div class="lab-visual">${item&&(item.category!=='weapons'||item.weapon&&hasWeaponPreview(item.weapon))?'<canvas id="labCanvas" aria-label="3D model preview"></canvas>':`<p class="lab-empty">${item?ja?'武器本体の単独モデルは未実装':'No standalone weapon model':ja?'該当項目はありません':'No items in this category'}</p>`}</div>
 <div class="lab-information">${item?details(item,locale):''}</div></div>
 <nav class="lab-factions" aria-label="${ja?'勢力':'Faction'}">${LAB_FACTIONS.map(faction=>`<button data-action="lab-faction:${faction}" ${state.faction===faction?'aria-current="true"':''}>${faction.toUpperCase()}</button>`).join('')}</nav>
 <div class="lab-controls"><button data-action="lab-prev" aria-label="${ja?'前の項目':'Previous item'}">◀</button><span>${items.length?state.index%items.length+1:0} / ${items.length}</span><button data-action="lab-next" aria-label="${ja?'次の項目':'Next item'}">▶</button><button data-action="lab-view:front">${ja?'正面':'FRONT'}</button><button data-action="lab-view:side">${ja?'側面':'SIDE'}</button><button data-action="lab-view:back">${ja?'背面':'BACK'}</button><button data-action="lab-zoom:in">＋</button><button data-action="lab-zoom:out">−</button></div>
 <div class="lab-tabs"><button data-action="briefing">GAME</button><button disabled>NETWORK</button><button aria-current="page">LAB</button><button data-action="settings">OPTIONS</button><button data-action="exitBriefing">EXIT</button></div></section>`;
}

export class LabViewer {
 readonly engine:Engine;readonly scene:Scene;readonly camera:ArcRotateCamera;
 private observer:ResizeObserver;
 constructor(private canvas:HTMLCanvasElement,item:LabItem,mission:MissionDefinition){
  this.engine=new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true,limitDeviceRatio:2},true);
  this.scene=new Scene(this.engine);this.scene.clearColor=new Color4(0,0,0,1);
  this.camera=new ArcRotateCamera('lab-camera',Math.PI/4,Math.PI/2.45,15,new Vector3(0,3,0),this.scene);
  this.camera.lowerBetaLimit=.15;this.camera.upperBetaLimit=Math.PI-.15;this.camera.lowerRadiusLimit=2;this.camera.upperRadiusLimit=120;this.camera.wheelPrecision=35;this.camera.attachControl(canvas,true);
  const ambient=new HemisphericLight('lab-fill',new Vector3(0,1,0),this.scene);ambient.intensity=1.05;
  const key=new DirectionalLight('lab-key',new Vector3(-.6,-1,.55),this.scene);key.intensity=1.4;
  const material=(name:string,hex:string,glow=false)=>{const m=new StandardMaterial(name,this.scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.08,.08,.08);if(glow)m.emissiveColor=m.diffuseColor.clone();return m;};
  let root:TransformNode|undefined;
  if(item.kind){root=buildVehicleModel(this.scene,makeUnit('lab-vehicle',item.kind,0,0,false),material).root;}
  else if(item.building){const building={...item.building,x:0,z:0,id:'lab-facility'};makeBase(this.scene,{...mission,base:{name:'LAB',faction:item.faction,x:0,z:0,width:building.width,depth:building.depth,buildings:[building]},minefields:[]});root=this.scene.getTransformNodeByName('facility-lab-facility')??undefined;}
  else if(item.category==='personnel')root=buildSoldierModel(this.scene,'lab-soldier',false,item.faction,item.faction,material).root;
  else if(item.weapon){const weapon=item.weapon;root=new TransformNode('lab-projectile',this.scene);
   if(weapon in LASERS){const gaus=(id?:string)=>{const meson=id==='GAUS30',paint=material(meson?'meson-ultramarine':'gaus-blue',meson?'#2015a6':'#388bff',true);if(meson)paint.disableLighting=true;return paint;};buildLaserProjectile(this.scene,weapon,'lab-laser',material,gaus).parent=root;}
   else if(weapon in MACHINE_GUNS)buildGunTracer(this.scene,new Vector3(0,0,-4),new Vector3(0,0,.8),weapon,'lab-tracer',material).parent=root;
   else if(weapon in MISSILES||weapon==='GASHR'||weapon==='EGGER')buildRocketProjectile(this.scene,weapon,material).root.parent=root;
  }
  if(root){root.computeWorldMatrix(true);const bounds=root.getHierarchyBoundingVectors(true),size=bounds.max.subtract(bounds.min),center=bounds.min.add(bounds.max).scale(.5),span=Math.max(size.x,size.y,size.z,1);
   this.camera.target=center;this.camera.radius=Math.max(4,span*1.9);this.camera.lowerRadiusLimit=Math.max(1,span*.55);this.camera.upperRadiusLimit=Math.max(20,span*7);
  }
  this.scene.activeCamera=this.camera;
  this.engine.runRenderLoop(()=>this.scene.render());this.observer=new ResizeObserver(()=>this.engine.resize());this.observer.observe(canvas);
 }
 view(angle:'front'|'side'|'back'){this.camera.alpha=angle==='front'?Math.PI/2:angle==='side'?0:-Math.PI/2;this.camera.beta=Math.PI/2.45;}
 zoom(direction:'in'|'out'){this.camera.radius=Math.max(this.camera.lowerRadiusLimit!,Math.min(this.camera.upperRadiusLimit!,this.camera.radius*(direction==='in'?.8:1.25)));}
 dispose(){this.observer.disconnect();this.camera.detachControl();this.scene.dispose();this.engine.dispose();}
}
