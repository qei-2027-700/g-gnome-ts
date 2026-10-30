import {Scene} from '@babylonjs/core/scene.js';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {Mesh} from '@babylonjs/core/Meshes/mesh.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {RawTexture} from '@babylonjs/core/Materials/Textures/rawTexture.js';
import {Texture} from '@babylonjs/core/Materials/Textures/texture.js';
import {Color3} from '@babylonjs/core/Maths/math.color.js';
import type {Terrain} from '../content/missions/types.ts';
const fract=(v:number)=>v-Math.floor(v);
const hash=(x:number,y:number,seed:number)=>fract(Math.sin(x*127.1+y*311.7+seed*73.3)*43758.5453);
function noise(x:number,y:number,seed:number){const ix=Math.floor(x),iy=Math.floor(y),fx=fract(x),fy=fract(y),u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return (hash(ix,iy,seed)*(1-u)+hash(ix+1,iy,seed)*u)*(1-v)+(hash(ix,iy+1,seed)*(1-u)+hash(ix+1,iy+1,seed)*u)*v;}
function texture(scene:Scene,name:string,size:number,pixel:(x:number,y:number)=>number[]){const pixels=new Uint8Array(size*size*3);for(let y=0;y<size;y++)for(let x=0;x<size;x++)pixels.set(pixel(x/size,y/size).map(v=>Math.max(0,Math.min(255,v))),3*(y*size+x));const t=RawTexture.CreateRGBTexture(pixels,size,size,scene,true,false,Texture.BILINEAR_SAMPLINGMODE);t.name=name;t.wrapU=Texture.WRAP_ADDRESSMODE;t.wrapV=Texture.WRAP_ADDRESSMODE;return t;}
export function grassTexture(scene:Scene,seed:number){const t=texture(scene,'mottled-grass',256,(x,y)=>{const patches=noise(x*20,y*20,seed),fine=noise(x*110,y*110,seed+1),soil=patches>.72;return soil?[75+fine*35,72+fine*25,37+fine*18]:[20+patches*65+fine*20,60+patches*125+fine*30,15+fine*32];});t.uScale=45;t.vScale=45;return t;}
export function snowTexture(scene:Scene,seed:number){const t=texture(scene,'wind-swept-snow',256,(x,y)=>{const n=noise(x*60,y*25,seed),ripple=Math.sin(y*220+noise(x*12,y*8,seed)*6)*2;return [223+n*22+ripple,232+n*18+ripple,238+n*16+ripple];});t.uScale=36;t.vScale=36;return t;}
export function overcastSky(scene:Scene,seed:number,snow=false,amber=false){
 const paint=new StandardMaterial('overcast-sky',scene);paint.disableLighting=true;paint.backFaceCulling=false;paint.disableDepthWrite=true;paint.fogEnabled=false;
 paint.emissiveTexture=texture(scene,'layered-clouds',256,(x,y)=>{const longitude=x*Math.PI*2,a=Math.cos(longitude),b=Math.sin(longitude);let cloud=0,weight=.55;for(let i=0;i<5;i++){const f=3*Math.pow(2,i);cloud+=noise(a*f+y*5,b*f+y*(40+f*2),seed+i)*weight;weight*=.5;}const light=25+(cloud-.25)*200;return amber?[165+light*.4,100+light*.45,20+light*.25]:snow?[153+light*.32,155+light*.33,157+light*.36]:[light*.83,light*.94,light*1.08];});paint.emissiveColor=Color3.Black();paint.diffuseColor=Color3.Black();
 const sky=MeshBuilder.CreateSphere('storm-cloud-dome',{diameter:2400,segments:32,sideOrientation:Mesh.BACKSIDE},scene);sky.material=paint;sky.infiniteDistance=true;sky.isPickable=false;sky.applyFog=false;
}
export function rockyMountains(scene:Scene,terrain:Terrain){
 const snow=terrain.biome==='snow';const paint=new StandardMaterial(snow?'snow-mountain':'ochre-mountain',scene);paint.diffuseColor=Color3.FromHexString(snow?'#e8f0f4':'#b8a16b');paint.specularColor=Color3.Black();
 const rockTexture=texture(scene,'mountain-strata',128,(x,y)=>{const v=noise(x*(snow?7:42),y*(snow?5:9),terrain.seed)*.55+noise(x*(snow?18:90),y*(snow?15:70),terrain.seed+3)*.45;return snow?(v>.43?[205+v*45,218+v*35,229+v*25]:[40+v*60,57+v*70,76+v*80]):[105+v*85,86+v*73,55+v*58];});rockTexture.uScale=snow?2:6;rockTexture.vScale=snow?2:6;paint.diffuseTexture=rockTexture;
 const mountain=(x:number,z:number,i:number,peak?:{width:number;depth:number;height:number})=>{const width=peak?.width??220+(i%3)*65,depth=peak?.depth??230+(i%4)*35,h=peak?.height??terrain.ridgeHeight+(i%4)*terrain.ridgeVariation;
 const mesh=MeshBuilder.CreateGround('rocky-mountain',{width,height:depth,subdivisions:24,updatable:true},scene),v=mesh.getVerticesData('position')!,colors:number[]=[];
 for(let j=0;j<v.length;j+=3){const nx=v[j]/(width*.5),nz=v[j+2]/(depth*.5),edge=Math.max(0,1-Math.sqrt(nx*nx+nz*nz)),crag=.77+.23*noise(nx*8+i,nz*8,terrain.seed);v[j+1]=Math.pow(edge,.8)*h*crag-3;const c=.72+.28*noise(nx*21,nz*24,terrain.seed+i);colors.push(c,snow?c:c*.94,snow?c:c*.8,1);}mesh.updateVerticesData('position',v);mesh.createNormals(true);mesh.setVerticesData('color',colors);mesh.position.set(x,0,z);mesh.material=paint;mesh.isPickable=false;};
 for(let i=0;i<9;i++){const z=terrain.minZ-40+i*155;mountain(-terrain.halfWidth-90-(i%2)*70,z,i);mountain(terrain.halfWidth+90+(i%2)*70,z,i+11);}
 for(let i=0;i<6;i++)mountain(-550+i*220,terrain.maxZ+30+(i%2)*100,i+22);
 for(const [i,peak] of (terrain.peaks??[]).entries())mountain(peak.x,peak.z,i+60,peak);
 for(const cliff of terrain.cliffs??[]){
  const wall=MeshBuilder.CreateGround(cliff.id,{width:cliff.width,height:cliff.depth,subdivisions:16,updatable:true},scene),positions=wall.getVerticesData('position')!,colors:number[]=[];
  for(let i=0;i<positions.length;i+=3){const nx=positions[i]/cliff.width+.5,nz=positions[i+2]/cliff.depth+.5,rim=Math.pow(Math.min(1,nz*5,(1-nz)*5),.45),crag=.87+.13*noise(nx*12,nz*12,terrain.seed);positions[i+1]=cliff.height*Math.pow(1-nx,.35)*rim*crag;const shade=.82+.18*noise(nx*20,nz*20,terrain.seed);colors.push(shade,snow?shade:shade*.96,snow?shade:shade*.82,1);}
  wall.updateVerticesData('position',positions);wall.createNormals(true);wall.setVerticesData('color',colors);wall.position.set(cliff.x,0,cliff.z);const cliffPaint=paint.clone(cliff.id+'-strata');cliffPaint.diffuseColor=Color3.White();cliffPaint.diffuseTexture?.dispose();cliffPaint.diffuseTexture=texture(scene,cliff.id+'-moss',128,(x,y)=>{const n=noise(x*32,y*24,terrain.seed),moss=y<.35&&n>.3;return snow?(n>.46?[225+n*25,232+n*20,239+n*15]:[29+n*60,44+n*65,65+n*70]):moss?[38+n*40,90+n*65,20+n*25]:[123+n*62,103+n*50,60+n*36];});wall.material=cliffPaint;wall.isPickable=false;wall.metadata={terrainObstacle:cliff.id};
 }
 // Small distant trees suggest scale without changing battlefield collision geometry.
 const leaves=new StandardMaterial('valley-shrub',scene);leaves.diffuseColor=Color3.FromHexString('#344a25');for(let i=0;i<(snow?0:18);i++){const x=Math.sin(i*17.3)*240,z=90+i*42;if(Math.abs(x)<45)continue;const bush=MeshBuilder.CreateSphere('valley-shrub',{diameter:4+(i%3),segments:4},scene);bush.position.set(x,2,z);bush.scaling.y=1.2;bush.material=leaves;bush.isPickable=false;}
}
