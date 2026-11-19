import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import type {Mesh} from '@babylonjs/core/Meshes/mesh.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {Scene} from '@babylonjs/core/scene.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import {Quaternion,Vector3} from '@babylonjs/core/Maths/math.vector.js';
import type {Base} from '../content/missions/types.ts';

type Building=Base['buildings'][number];

// Local X points toward the entrance; local Z runs across the reference image.
export function makeScorpFacility(scene:Scene,b:Building,id:string){
 const root=new TransformNode(`facility-${id}`,scene);root.position.set(b.x,0,b.z);root.metadata={facilityId:id};
 const mat=(name:string,hex:string)=>{const m=new StandardMaterial(`scorp-${id}-${name}`,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=Color3.Black();return m;};
 const armor=mat('armor','#52756a'),edge=mat('edge','#aeb9a6'),dark=mat('recess','#263c38'),glass=mat('glass','#318d89'),copper=mat('copper','#c77641'),gold=mat('gold','#c5a365'),red=mat('red','#d65d51');
 const w=b.width,d=b.depth,h=b.height;
 const box=(name:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,paint:StandardMaterial)=>{const m=MeshBuilder.CreateBox(name,{width:sx,height:sy,depth:sz},scene);m.position.set(x*w,y*h,z*d);m.material=paint;m.parent=root;return m;};
 const taper=(name:string,x:number,y:number,z:number,bottom:number,top:number,height:number,paint:StandardMaterial,sides=4)=>{const m=MeshBuilder.CreateCylinder(name,{height:height*h,diameterBottom:bottom*d,diameterTop:top*d,tessellation:sides},scene);m.position.set(x*w,y*h,z*d);m.material=paint;m.parent=root;return m;};
 const beam=(name:string,from:[number,number,number],to:[number,number,number],thickness:number,paint:StandardMaterial,sides=6)=>{const a=new Vector3(from[0]*w,from[1]*h,from[2]*d),end=new Vector3(to[0]*w,to[1]*h,to[2]*d),delta=end.subtract(a),direction=delta.clone().normalize(),axis=Vector3.Cross(Vector3.Up(),direction);const m=MeshBuilder.CreateCylinder(name,{height:delta.length(),diameter:thickness*d,tessellation:sides},scene);m.position.copyFrom(a.add(end).scale(.5));m.rotationQuaternion=axis.lengthSquared()>1e-8?Quaternion.RotationAxis(axis.normalize(),Math.acos(Vector3.Dot(Vector3.Up(),direction))):Quaternion.RotationAxis(Vector3.Right(),direction.y<0?Math.PI:0);m.material=paint;m.parent=root;return m;};
 // Keep the original body name and metadata used by targeting and existing scenes.
 const name=b.kind==='power-plant'?'power-plant':b.kind==='shield-generator'?'shield-generator':'command-center';
 let body:Mesh;
 if(b.kind==='power-plant'){
  body=box(name,0,.17,0,.7*w,.34*h,.64*d,armor);
  box('scorp-power-central-core',0,.39,0,.39*w,.35*h,.38*d,dark);
  box('scorp-power-core-face',.205,.38,0,.03*w,.25*h,.29*d,armor);
  for(const side of [-1,1]){
   box('scorp-power-shoulder',.08,.23,side*.34,.52*w,.4*h,.26*d,edge);
   box('scorp-power-red-panel',.352,.25,side*.35,.025*w,.21*h,.18*d,red);
   box('scorp-power-red-inset',.369,.25,side*.35,.01*w,.15*h,.12*d,dark);
   box('scorp-power-shoulder-cap',-.08,.46,side*.32,.37*w,.08*h,.27*d,armor);
   beam('scorp-power-raised-pipe',[.1,.45,side*.17],[.15,.82,side*.43],.075,armor);
   beam('scorp-power-pipe-joint',[.15,.82,side*.43],[.15,.91,side*.46],.085,edge);
   box('scorp-power-pipe-tip',.15,.935,side*.45,.07*w,.04*h,.09*d,copper);
   box('scorp-power-orange-vent',.36,.09,side*.12,.018*w,.045*h,.1*d,copper);
  }
  box('scorp-power-center-spine',.375,.33,0,.05*w,.55*h,.045*d,edge);
  box('scorp-power-center-indicator',.405,.55,0,.017*w,.1*h,.03*d,red);
 }else if(b.kind==='shield-generator'){
  body=box(name,0,.13,0,.67*w,.26*h,.7*d,edge);
  box('scorp-shield-central-step',.25,.25,0,.08*w,.29*h,.2*d,dark);
  taper('scorp-shield-central-tower',-.04,.54,0,.36,.15,.66,armor);
  box('scorp-shield-tower-window',.155,.57,0,.025*w,.31*h,.12*d,glass);
  box('scorp-shield-tower-cap',-.04,.89,0,.25*w,.035*h,.17*d,edge);
  for(const side of [-1,1]){
   beam('scorp-shield-wing-brace',[.18,.1,side*.2],[.1,.45,side*.36],.085,armor,4);
   beam('scorp-shield-wing-arm',[.03,.39,side*.14],[.04,.4,side*.42],.06,gold,4);
   box('scorp-shield-wing-plate',.2,.23,side*.34,.36*w,.22*h,.17*d,armor);
   box('scorp-shield-wing-glow',.392,.27,side*.34,.015*w,.09*h,.11*d,glass);
   for(const [distance,height] of [[.21,.7],[.41,.64]]){
    taper('scorp-shield-spire-base',-.08,height-.23,side*distance,.12,.065,.23,gold);
    taper('scorp-shield-spire-crystal',-.08,height-.06,side*distance,.07,.045,.16,glass);
    taper('scorp-shield-spire-tip',-.08,height+.08,side*distance,.06,0,.18,gold);
   }
  }
 }else if(b.kind==='mine-control'){
  // Front is +X. The reference is one low front view; the rear and interior stay provisional.
  body=box('minefield-control',0,.2,0,.7*w,.38*h,.58*d,armor);
  box('scorp-mine-eave',.36,.4,0,.025*w,.035*h,.6*d,copper);
  box('scorp-mine-center-face',.355,.23,0,.02*w,.26*h,.26*d,dark);
  for(const across of [-.09,-.03,.03,.09]){
   box('scorp-mine-window',.372,.24,across,.012*w,.2*h,.04*d,glass);
   box('scorp-mine-window-frame',.38,.24,across,.008*w,.22*h,.046*d,edge);
  }
  for(const side of [-1,1] as const){
   box('scorp-mine-side-block',0,.21,side*.3,.66*w,.4*h,.16*d,armor);
   box('scorp-mine-side-face',.35,.22,side*.3,.018*w,.24*h,.12*d,dark);
   for(const [row,column] of [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]] as const)box('scorp-mine-checker',.372,.16+row*.1,side*.3+(column-1)*.035,.008*w,.07*h,.028*d,(row+column)%2?edge:dark);
   box('scorp-mine-red-mark',.382,.14,side*.36,.01*w,.07*h,.035*d,red);
   beam('scorp-mine-fin',[.02,.2,side*.36],[.04,.58,side*.44],.045,copper,4);
   taper('scorp-mine-fin-tip',.04,.66,side*.44,.05,0,.14,edge,3);
  }
  box('scorp-mine-roof-vent',0,.43,0,.1*w,.05*h,.06*d,edge);
  for(const side of [-1,1])box('scorp-mine-roof-mast',0,.5,side*.03,.015*w,.1*h,.012*d,gold);
 }else{
  body=box(name,0,.18,.17,.63*w,.36*h,.6*d,armor);
  box('scorp-hq-right-block',.02,.29,.25,.64*w,.5*h,.43*d,armor);
  box('scorp-hq-right-face',.35,.25,.25,.025*w,.33*h,.36*d,glass);
  for(const side of [-1,0,1])box('scorp-hq-right-panel',.37,.24,.25+side*.12,.012*w,.25*h,.09*d,armor);
  box('scorp-hq-right-orange-stripe',.381,.29,.25,.009*w,.29*h,.025*d,copper);
  box('scorp-hq-right-roof',-.015,.57,.25,.7*w,.055*h,.47*d,edge);
  box('scorp-hq-orange-eave',.1,.58,.25,.62*w,.025*h,.48*d,copper);
  box('scorp-hq-central-tower',-.06,.44,-.18,.4*w,.62*h,.3*d,armor);
  box('scorp-hq-tower-face',.155,.4,-.18,.025*w,.35*h,.2*d,dark);
  taper('scorp-hq-pyramid-roof',-.06,.82,-.18,.32,0,.25,edge);
  box('scorp-hq-roof-band',-.06,.71,-.18,.43*w,.055*h,.34*d,copper);
  for(const side of [-1,1])beam('scorp-hq-antenna',[-.06,.9,-.17+side*.055],[-.06,1,-.17+side*.055],.006,gold,4);
  beam('scorp-hq-left-wing',[-.04,.15,-.28],[-.17,.47,-.41],.15,copper,4);
  box('scorp-hq-left-ramp',.27,.075,-.32,.42*w,.15*h,.29*d,dark);
  box('scorp-hq-left-accent',.43,.09,-.32,.012*w,.065*h,.17*d,copper);
  beam('scorp-hq-left-support',[.29,.03,-.43],[-.06,.48,-.27],.055,edge,4);
  taper('scorp-hq-left-fin',-.16,.44,-.4,.13,0,.45,copper,4);
 }
 body.metadata={facility:b.kind,facilityId:id};
 return root;
}
