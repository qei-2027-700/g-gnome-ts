import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {Scene} from '@babylonjs/core/scene.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import type {Facility} from '../simulation/facilities.ts';

export function makeFacilityRuin(scene:Scene,facility:Facility){
 const root=new TransformNode(`facility-${facility.id}-ruin`,scene);
 root.position.set(facility.x,0,facility.z);
 root.metadata={facilityRuinId:facility.id};
 const paint=(name:string,hex:string)=>{const material=new StandardMaterial(`facility-ruin-${name}-${facility.id}`,scene);material.diffuseColor=Color3.FromHexString(hex);material.specularColor=Color3.Black();return material;};
 const soot=paint('soot','#211f1c'),char=paint('char','#33332d'),ash=paint('ash','#59564e');
 const {width:w,depth:d,height:h}=facility;
 const chunk=(name:string,width:number,height:number,depth:number,x:number,y:number,z:number,material:StandardMaterial)=>{
  const mesh=MeshBuilder.CreateBox(name,{width,height,depth},scene);
  mesh.parent=root;mesh.position.set(x,y,z);mesh.material=material;mesh.isPickable=false;return mesh;
 };
 const scorch=MeshBuilder.CreateCylinder('facility-ruin-scorch',{height:.08,diameter:1,tessellation:10},scene);
 scorch.parent=root;scorch.position.y=.06;scorch.scaling.set(w*1.07,1,d*1.07);scorch.material=soot;scorch.isPickable=false;
 chunk('facility-ruin-foundation',w*.86,.32,d*.86,0,.2,0,char);
 for(const side of [-1,1])for(const end of [-1,1]){
  const wallHeight=Math.min(h*(side===end?.29:.19),5);
  chunk('facility-ruin-wall',w*.23,wallHeight,d*.13,side*w*.28,.36+wallHeight/2,end*d*.34,side===end?char:ash);
 }
 const coreHeight=Math.min(h*.23,3.8);
 chunk('facility-ruin-core',w*.3,coreHeight,d*.27,-w*.06,.36+coreHeight/2,d*.04,soot);
 for(const side of [-1,1]){
  const beam=chunk('facility-ruin-fallen-beam',w*.32,.32,d*.06,side*w*.19,.54,side*d*.08,ash);
  beam.rotation.y=side*.32;beam.rotation.z=side*.16;
 }
 return root;
}
