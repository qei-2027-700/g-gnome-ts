import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {Mesh} from '@babylonjs/core/Meshes/mesh.js';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {Scene} from '@babylonjs/core/scene.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import type {Base} from '../content/missions/types.ts';

type Building=Base['buildings'][number];

// Shared exterior. Local +X is the entrance. The manual picture is one front view:
// a wide trapezoid, two rails on that face, a cabin on the image-right, and a thin mast.
// Image width maps to local Z. Depth and the far side are provisional.
// Face order is the reverse of a right-handed outward winding, so Babylon shows the outside.
export function makeBridgeControlBuilding(scene:Scene,b:Building,id:string){
 const root=new TransformNode(`facility-${id}`,scene);root.position.set(b.x,0,b.z);root.metadata={facilityId:id};
 const mat=(name:string,hex:string)=>{const paint=new StandardMaterial(`bridge-${id}-${name}`,scene);paint.diffuseColor=Color3.FromHexString(hex);paint.specularColor=Color3.Black();return paint;};
 const armor=mat('armor','#8a8d84'),dark=mat('recess','#2a2e2b'),cabinPaint=mat('cabin','#6f736e'),glass=mat('window','#161a1e'),mast=mat('mast','#d0d2cb');
 const w=b.width,d=b.depth,h=b.height;
 const box=(name:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,paint:StandardMaterial)=>{const mesh=MeshBuilder.CreateBox(name,{width:sx,height:sy,depth:sz},scene);mesh.position.set(x,y,z);mesh.material=paint;mesh.parent=root;return mesh;};
 const y0=.05,y1=.78*h,bottomX=.48*w,bottomZ=.48*d,topX=.64*bottomX,topZ=.64*bottomZ;
 const xAt=(t:number)=>bottomX+(topX-bottomX)*t,zAt=(t:number,z:number)=>z*(bottomZ+(topZ-bottomZ)*t);
 const track=(z:number)=>{
  const mesh=new Mesh('bridge-control-track',scene),data=new VertexData(),run=bottomX-topX,rise=y1-y0,len=Math.hypot(run,rise),nx=rise/len,ny=run/len,span=.02*d,stand=.07,thick=.04,yA=y0+.06*h,yB=y1-.04*h;
  const tOf=(y:number)=>(y-y0)/rise;
  const corner=(y:number,side:number,out:number)=>{const t=tOf(y);return [xAt(t)+nx*out,y+ny*out,zAt(t,z)+side*span];};
  const positions=[...corner(yA,-1,stand),...corner(yA,1,stand),...corner(yB,1,stand),...corner(yB,-1,stand),...corner(yA,-1,stand-thick),...corner(yA,1,stand-thick),...corner(yB,1,stand-thick),...corner(yB,-1,stand-thick)].flat();
  const faces=[0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];
  data.positions=positions;data.indices=faces;data.normals=[];VertexData.ComputeNormals(positions,faces,data.normals);data.applyToMesh(mesh);mesh.convertToFlatShadedMesh();
  mesh.material=dark;mesh.parent=root;return mesh;
 };
 const body=new Mesh('bridge-control-building',scene),data=new VertexData();
 const positions=[
  -bottomX,y0,bottomZ,bottomX,y0,bottomZ,bottomX,y0,-bottomZ,-bottomX,y0,-bottomZ,
  -topX,y1,topZ,topX,y1,topZ,topX,y1,-topZ,-topX,y1,-topZ
 ];
 const faces=[4,6,5,4,7,6,0,7,4,0,3,7,1,5,6,1,6,2,3,6,7,3,2,6,0,5,1,0,4,5,0,1,2,0,2,3];
 data.positions=positions;data.indices=faces;data.normals=[];VertexData.ComputeNormals(positions,faces,data.normals);data.applyToMesh(body);
 body.material=armor;body.parent=root;body.metadata={facility:'bridge-control',facilityId:id};
 for(const side of [-1,1])track(side*.3);
 const cabin=box('bridge-control-cabin',.04*w,y1+.08*h-.06,.22*d,.16*w,.16*h,.14*d,cabinPaint);
 box('bridge-control-window',cabin.position.x+.08*w+.05,cabin.position.y,cabin.position.z,.12,.07*h,.06*d,glass);
 box('bridge-control-antenna',.02*w,y1+.07*h,.08*d,.012*w,.18*h,.012*d,mast);
}
