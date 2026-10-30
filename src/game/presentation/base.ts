import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {Scene} from '@babylonjs/core/scene.js';import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';import {Color3} from '@babylonjs/core/Maths/math.color.js';import type {MissionDefinition} from '../content/missions/types.ts';
export function makeBase(scene:Scene,mission:MissionDefinition){const material=(name:string,hex:string)=>{const m=new StandardMaterial(name,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=Color3.Black();return m;};const base=mission.base;
 if(base){
  // Reference image: separate low facilities standing directly on grass.
  // Dimensions and the assignment of silhouettes to facility roles remain provisional.
  const armor=material('base-armor','#919b8d'),roofPaint=material('base-roof-paint','#a6a28a'),dark=material('base-trim','#32423d'),glass=material('base-windows','#466e68');
  const box=(name:string,w:number,h:number,d:number,x:number,y:number,z:number,paint:StandardMaterial)=>{const mesh=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);mesh.position.set(x,y,z);mesh.material=paint;return mesh;};
  for(const [index,b] of base.buildings.entries()){
   const before=new Set(scene.meshes),id=b.id??`facility-${b.kind??'command'}-${index}`;
   const paint=b.color?material(`facility-${id}-armor`,b.color):armor;
   const name=b.kind==='bridge-control'?'bridge-control-building':b.kind==='comm-array'?'latlon-comm-array':b.kind==='power-plant'?'power-plant':b.kind==='citadel'?'citadel':b.kind==='mine-control'?'minefield-control':b.kind==='shield-generator'?'shield-generator':b.kind==='sweep-turret'?'sweep-turret':'command-center';
   const body=box(name,b.width,b.height*.8,b.depth,b.x,b.height*.4,b.z,paint);body.metadata={facility:b.kind??'command',facilityId:b.id};
   const roof=MeshBuilder.CreateCylinder(`${name}-roof`,{height:b.height*.2,diameterTop:.82,diameterBottom:1,tessellation:4},scene);
   roof.rotation.y=Math.PI/4;roof.scaling.set(b.width*Math.SQRT2,1,b.depth*Math.SQRT2);roof.position.set(b.x,b.height*.9,b.z);roof.material=b.color?paint:roofPaint;
   const front=b.x+b.width/2;
   // Narrow window bands and support ribs, without warehouse shutters or a paved yard.
   const bays=b.kind==='mine-control'?10:5,spacing=b.depth/(bays+1);
   for(let i=1;i<=bays;i++){
    const z=b.z-b.depth/2+spacing*i;
    box(`${name}-window`,.12,b.height*.2,spacing*.65,front+.08,b.height*.55,z,glass);
    box(`${name}-rib`,.3,b.height*.68,.45,front+.1,b.height*.34,z-spacing*.46,dark);
   }
   box(`${name}-entry`,.18,b.height*.36,2.2,front+.12,b.height*.18,b.z,dark);
   if(b.kind==='command'){
    box('command-center-upper-band',b.width*.55,b.height*.12,b.depth*.48,b.x,b.height*.78,b.z,glass);
    box('command-center-upper-room',b.width*.42,b.height*.2,b.depth*.5,b.x,b.height*.82,b.z,armor);
    for(const side of [-1,1])for(const end of [-1,1]){
     box('command-center-roof-turret',2.2,b.height*.18,2.2,b.x+side*b.width*.36,b.height*.88,b.z+end*b.depth*.34,armor);
    }
    for(const offset of [-1,0,1])box('command-center-antenna',.22,b.height*.13,.22,b.x,b.height*.93,b.z+offset*b.depth*.15,dark);
   }else if(b.kind==='comm-array'){
    for(const side of [-1,1])box('latlon-transmitter-band',.3,b.height*.12,b.depth*.8,b.x+side*b.width*.5,b.height*.57,b.z,glass);
   }else if(b.kind==='shield-generator'){
    for(const side of [-1,1])box('shield-generator-emitter',b.width*.18,b.height*.35,b.depth*.45,b.x+side*b.width*.28,b.height*.9,b.z,glass);
   }else if(b.kind==='sweep-turret'){
    box('sweep-turret-gun',b.width*.2,b.height*.2,b.depth*.9,b.x,b.height*.85,b.z, dark);
   }else{
    // Compact control equipment stays within the shared building collision envelope.
    for(const side of [-1,1])box('minefield-control-roof-equipment',3,b.height*.1,4,b.x+side*b.width*.3,b.height*.92,b.z,dark);
   }
   const root=new TransformNode(`facility-${id}`,scene);root.metadata={facilityId:id};for(const mesh of scene.meshes)if(!before.has(mesh))mesh.parent=root;
  }
 }
 if(mission.minefields?.length){const red=material('mine-area-red','#de1717');red.alpha=.65;red.disableLighting=true;red.emissiveColor=Color3.FromHexString('#e52720');const edge=material('mine-area-border','#fb3028');edge.emissiveColor=Color3.FromHexString('#9d1912');
 for(const field of mission.minefields){const area=MeshBuilder.CreateGround('red-minefield',{width:field.width,height:field.depth},scene);area.position.set(field.x,.32,field.z);area.material=red;for(const side of [-1,1]){for(const [w,d,x,z] of [[field.width,.5,field.x,field.z+side*field.depth/2],[.5,field.depth,field.x+side*field.width/2,field.z]]){const border=MeshBuilder.CreateGround('minefield-border',{width:w,height:d},scene);border.position.set(x,.36,z);border.material=edge;}for(let i=0;i<9;i++){const post=MeshBuilder.CreateCylinder('minefield-warning-post',{height:1.4,diameter:.16,tessellation:4},scene);post.position.set(field.x-field.width/2+i*field.width/8,.7,field.z+side*field.depth/2);post.material=edge;}}}
 }
}
