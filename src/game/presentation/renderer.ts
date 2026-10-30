import {MERC_INFANTRY_PALETTE} from '../content/infantry.ts';
import {weatheredArmor,mesonWeatheredArmor} from './vehicle-finish.ts';
import {initialCameraMode,REAR_CAMERA_DISTANCE_SCALE} from './camera-mode.ts';
import {isEmbarked} from '../simulation/infantry.ts';
import {makeBase} from './base.ts';
import {grassTexture,snowTexture,overcastSky,rockyMountains} from './landscape.ts';
import {MERC_TACTICAL_PALETTE,MERC_MESON_PALETTE,SCORP_ASV_PALETTE,SCORP_TOWER_PALETTE,type Faction} from '../content/vehicles.ts';
// Register rendering extensions and shaders before the first frame, including dev reloads.
import '@babylonjs/core';
import '@babylonjs/core/Shaders/default.vertex.js';
import '@babylonjs/core/Shaders/default.fragment.js';
import '@babylonjs/core/Shaders/color.vertex.js';
import '@babylonjs/core/Shaders/color.fragment.js';
import {Engine} from '@babylonjs/core/Engines/engine.js';
import {Scene} from '@babylonjs/core/scene.js';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color.js';
import {Matrix,Quaternion,Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight.js';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight.js';
import {FreeCamera} from '@babylonjs/core/Cameras/freeCamera.js';
import {MeshBuilder} from '@babylonjs/core/Meshes/meshBuilder.js';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial.js';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode.js';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData.js';
import {Mesh} from '@babylonjs/core/Meshes/mesh.js';
import {GAITS,legPose,INFANTRY_GAIT,infantryLegPose} from './locomotion.ts';
import {PARTS,type BodyPart} from '../simulation/parts.ts';
import {VISOM_GUIDANCE,INFANTRY_WEAPONS} from '../content/weapons.ts';
import {isLaser} from '../simulation/weapons.ts';
import {mercAssaultLegPose,VEHICLE_SHAPES,FACILITY_WRECK,MERC_TACTICAL_RAID_MUZZLE,SCORP_TACTICAL_RAID_MUZZLES} from '../content/vehicle-shapes.ts';
import {Simulation,isVehicle,isFacility,targetHeight,type SelectionTarget,type CombatTarget,type Unit,type GameEvent,type Point3} from '../simulation/simulation.ts';
const color=(hex:string)=>Color3.FromHexString(hex);
type Effect={mesh:Mesh;life:number;duration:number;kind:'beam'|'tracer'|'flash'|'smoke'|'blast'|'blood';velocity?:Vector3};
type PartVisual={meshes:Mesh[];paint:{material:StandardMaterial;base:Color3;glow:Color3}[];flash:number;smoke:number};
type SpiderLeg={side:number;front:number;upper:Mesh;lower:Mesh;foot:Mesh};
type Rig={spiderLegs?:SpiderLeg[];cannon?:TransformNode;root:TransformNode;torso:TransformNode;legs:TransformNode[];knees:TransformNode[];feet:Mesh[];phase:number;run:number;lastX:number;lastZ:number;recoil:number;parts:Record<BodyPart,PartVisual>};
export const SOLDIER_PROPORTIONS={height:1.9,headHeight:1.9/8,hipHeight:INFANTRY_GAIT.upper+INFANTRY_GAIT.lower+INFANTRY_GAIT.sole} as const;
export const VEHICLE_DESTRUCTION={engulf:.85,burn:12,smokeEnd:15,clear:18} as const;
type SoldierRig={root:TransformNode;upper:TransformNode;legs:TransformNode[];knees:TransformNode[];ankles:TransformNode[];arms:TransformNode[];lastX:number;lastZ:number;phase:number;run:number;direction:number};
type Destruction={age:number;smokeTimer:number;root:TransformNode;flames:Mesh[]};
export class World {
  destructions=new Map<string,Destruction>();
  wreckRigs=new Map<string,TransformNode>();
  engine:Engine;scene:Scene;camera:FreeCamera; rigs=new Map<string,Rig>();
  completionTime:number|null=null;
  mode=0;effects:Effect[]=[];waypoint:Mesh;
  soldierRigs=new Map<string,SoldierRig>();
  missileRigs=new Map<number,{root:TransformNode;smokeTimer:number;flame:Mesh}>();
  private fxMaterials=new Map<string,StandardMaterial>();
  private mineRigs=new Map<string,Mesh>();
  private terrainRoot!:TransformNode;
  private kick=0;renderError:string|null=null;
  constructor(public canvas:HTMLCanvasElement,public sim:Simulation,engine?:Engine){
    this.mode=initialCameraMode(sim.mission.initialView,!!(sim.mounted??sim.passenger));
    this.engine=engine??new Engine(canvas,true,{preserveDrawingBuffer:true,stencil:true,limitDeviceRatio:2},true);this.scene=new Scene(this.engine);this.engine.onEffectErrorObservable.add(({errors})=>{this.renderError=errors;});this.scene.clearColor=new Color4(.46,.66,.79,1);this.scene.fogMode=Scene.FOGMODE_LINEAR;this.scene.fogStart=140;this.scene.fogEnd=680;this.scene.fogColor=new Color3(.67,.72,.67);
    this.camera=new FreeCamera('camera',new Vector3(0,1.7,0),this.scene);this.camera.minZ=.1;this.camera.maxZ=1400;this.camera.fov=1.15;
    const hemi=new HemisphericLight('sky',new Vector3(0,1,0),this.scene);hemi.intensity=.85;hemi.groundColor=color('#544c34');const sun=new DirectionalLight('sun',new Vector3(-.5,-1,.35),this.scene);sun.intensity=1.1;
    this.terrain();
    for(const unit of sim.units)this.makeMech(unit);
    const wpMat=this.material('wp','#b8e77b',true);this.waypoint=MeshBuilder.CreateTorus('waypoint',{diameter:38,thickness:.35,tessellation:40},this.scene);this.waypoint.position.set((this.sim.mission.waypoints[0]?.x??0),.25,(this.sim.mission.waypoints[0]?.z??0));this.waypoint.material=wpMat;this.waypoint.visibility=0;
    if(typeof window!=='undefined')window.addEventListener('resize',()=>this.engine.resize());
  }
  material(name:string,hex:string,glow=false){const m=new StandardMaterial(name,this.scene);m.diffuseColor=color(hex);m.specularColor=new Color3(.08,.08,.08);if(glow)m.emissiveColor=color(hex);return m;}
  terrain(){
    this.mineRigs.clear();this.terrainRoot?.dispose(false,true);const before=new Set(this.scene.meshes),terrain=this.sim.mission.terrain;this.terrainRoot=new TransformNode('mission-terrain',this.scene);
    const amber=terrain.skyPalette==='amber',storm=terrain.weather==='overcast',grass=terrain.biome==='grassland',snow=terrain.biome==='snow',groundPaint=this.material(snow?'snow':grass?'grass':'sand',snow?'#eef5f8':grass?'#649638':'#bbae80');
    this.scene.clearColor=amber?new Color4(.78,.48,.12,1):snow?new Color4(.76,.79,.81,1):storm?new Color4(.22,.28,.34,1):new Color4(.46,.66,.79,1);this.scene.fogStart=storm?400:140;this.scene.fogEnd=storm?1550:680;this.scene.fogColor=amber?color('#bf994c'):snow?color('#e3edf2'):storm?color('#697574'):grass?color('#b2c7a0'):new Color3(.67,.72,.67);const sun=this.scene.getLightByName('sun')!;sun.intensity=storm?.48:1.1;if(storm)overcastSky(this.scene,terrain.seed,snow,amber);if(terrain.ridgeStyle==='rocky')rockyMountains(this.scene,terrain);const sky=this.scene.getLightByName('sky') as HemisphericLight;sky.intensity=storm?.9:.85;sky.groundColor=color(snow?'#b6c7d8':grass?'#40582e':'#544c34');
    const ground=MeshBuilder.CreateGround('valley',{width:Math.max(1800,terrain.halfWidth*2+1000),height:grass||snow?Math.max(1800,terrain.maxZ-terrain.minZ+1200):1800,subdivisions:90,updatable:true},this.scene);ground.material=groundPaint;if(storm&&grass){groundPaint.diffuseColor=Color3.White();groundPaint.diffuseTexture=grassTexture(this.scene,terrain.seed);}if(snow){groundPaint.diffuseColor=Color3.White();groundPaint.diffuseTexture=snowTexture(this.scene,terrain.seed);}if(grass||snow)ground.position.z=(terrain.minZ+terrain.maxZ)/2;
    const vertices=ground.getVerticesData('position')!;const colors:number[]=[];for(let i=0;i<vertices.length;i+=3){const x=vertices[i],z=vertices[i+2];vertices[i+1]=snow?0:grass?Math.min(1,Math.max(0,(Math.abs(x)-terrain.halfWidth-10)/180))*(10+8*Math.sin(x*.009)*Math.cos(z*.007)):Math.abs(x)>terrain.halfWidth+10?Math.max(0,(Math.abs(x)-terrain.halfWidth-10)*.22)*(1+.3*Math.sin(z*.018)):0;const v=grass?.94+.045*Math.sin(x*.018+z*.012)*Math.cos(z*.008):.88+.09*Math.sin(x*.14+z*.07)*Math.cos(z*.032);colors.push(v,grass||snow?v:v*.98,grass||snow?v:v*.85,1);}ground.updateVerticesData('position',vertices);ground.setVerticesData('color',colors);ground.receiveShadows=true;
    if(terrain.river){
      const river=terrain.river,water=MeshBuilder.CreateGround('river-water',{width:river.width,height:river.length},this.scene);water.position.set(river.x,.13,river.z);water.material=this.material('river-blue','#245c9a');
      for(const side of [-1,1]){
        const hinge=new TransformNode(`bridge-hinge-${side}`,this.scene);hinge.position.set(river.x+side*(river.width/2+9),.2,river.bridgeZ);
        const leaf=MeshBuilder.CreateBox('river-bridge-leaf',{width:(river.width+18)/2,height:.35,depth:river.bridgeWidth},this.scene);leaf.parent=hinge;leaf.position.x=-side*(river.width+18)/4;leaf.material=this.material(`bridge-deck-${side}`,'#77796c');
        for(const edge of [-1,1]){const rail=MeshBuilder.CreateBox('bridge-rail',{width:(river.width+18)/2,height:1,depth:.3},this.scene);rail.parent=hinge;rail.position.set(-side*(river.width+18)/4,.65,edge*river.bridgeWidth/2);rail.material=this.material(`bridge-rail-${side}-${edge}`,'#494d43');}
      }
    }
    const stone=grass&&!this.sim.mission.rocks.length?null:this.material('sandstone',grass?'#5f853f':'#bda16d');const band=grass?null:this.material('strata','#897751');
    const ridge=(x:number,z:number,i:number)=>{const h=terrain.ridgeHeight+(Math.sin(i*7.1+terrain.seed)+1)*terrain.ridgeVariation;const rock=MeshBuilder.CreateCylinder('mesa',{height:h,diameterTop:16+(i%4)*8,diameterBottom:75+(i%5)*18,tessellation:6,subdivisions:4},this.scene);rock.position.set(x,h/2-3,z);rock.rotation.y=i;rock.material=stone;const line=MeshBuilder.CreateCylinder('sediment',{height:2.5,diameterTop:40+(i%4)*7,diameterBottom:45+(i%4)*7,tessellation:6},this.scene);line.position.set(x,h*.61,z);line.rotation.y=i;line.material=band;};
    if(!grass&&!snow){for(let i=0;i<28;i++){ridge(-terrain.halfWidth-55-(i%3)*42,terrain.minZ-80+i*35,i);ridge(terrain.halfWidth+50+(i%4)*34,terrain.minZ-70+i*35,i+30);}for(let i=0;i<8;i++)ridge(-220+i*65,terrain.maxZ+100,i+60);}
    for(const [i,r] of this.sim.mission.rocks.entries()){const rock=MeshBuilder.CreateSphere('boulder',{diameter:r.r*2,segments:5},this.scene);rock.scaling.y=.75;rock.position.set(r.x,r.r*.55,r.z);rock.rotation.set(i,.4*i,.3);rock.material=stone;}
    if(!grass&&!snow){const shrubMat=this.material('scrub','#666744');for(let i=0;i<75;i++){const x=Math.sin(i*27.3)*135,z=-40+(i*87.7)%610;if(Math.abs(x)<14)continue;const s=MeshBuilder.CreateCylinder('scrub',{height:1.4,diameterTop:.1,diameterBottom:2,tessellation:3},this.scene);s.position.set(x,.7,z);s.rotation.z=Math.sin(i)*.4;s.material=shrubMat;}}
    makeBase(this.scene,this.sim.mission);if(this.sim.mines.length){const mineMat=this.material('detected-mine','#ff1818',true);for(const mine of this.sim.mines){const mesh=MeshBuilder.CreateCylinder('detected-mine',{height:.25,diameter:1.3,tessellation:6},this.scene);mesh.position.set(mine.x,.48,mine.z);mesh.material=mineMat;mesh.isVisible=false;this.mineRigs.set(mine.id,mesh);}}
    for(const node of this.scene.transformNodes)if(node.metadata?.facilityId&&!node.parent)node.parent=this.terrainRoot;
    for(const mesh of this.scene.meshes)if(!before.has(mesh)&&!mesh.parent)mesh.parent=this.terrainRoot;
  }
  makeMech(u:Unit){const spec=u.spec,scorp=u.kind==='scorp-asv',tower=spec.category==='tower';const root=new TransformNode(u.id,this.scene);const torso=new TransformNode('upper',this.scene);torso.parent=root;torso.position.y=spec.height*.6;
    const shell=this.material(`${u.id}-paint`,spec.color);const dark=this.material(`${u.id}-joints`,tower?SCORP_TOWER_PALETTE.dark:scorp?SCORP_ASV_PALETTE.black:u.kind==='merc-tactical'?MERC_TACTICAL_PALETTE.black:u.kind==='merc-sentry'?'#090d13':'#343d39');const glow=this.material(`${u.id}-visor`,tower?SCORP_TOWER_PALETTE.panel:scorp?SCORP_ASV_PALETTE.green:u.kind==='merc-tactical'?MERC_TACTICAL_PALETTE.black:u.kind==='merc-sentry'?'#0d1722':'#1b252b');
    const unionTactical=u.kind==='union-tactical',union=u.kind==='union-sentry',merc=u.kind==='merc-sentry',heavy=u.kind.endsWith('-tactical'),shape=VEHICLE_SHAPES[u.kind];
    const accent=this.material(`${u.id}-${heavy?'blue':'red'}-panels`,tower?SCORP_TOWER_PALETTE.ochre:scorp?SCORP_ASV_PALETTE.ochre:unionTactical?'#98463e':heavy?MERC_TACTICAL_PALETTE.blue:union?'#983f3b':'#813c3e');
    if(u.kind==='union-asv'||unionTactical){shell.diffuseColor=Color3.White();shell.diffuseTexture=weatheredArmor(this.scene);}
    const trim=this.material(`${u.id}-edge-panels`,tower?SCORP_TOWER_PALETTE.metal:scorp?SCORP_ASV_PALETTE.metal:heavy?MERC_TACTICAL_PALETTE.gray:'#a0a5a5');
    const box=(name:string,w:number,h:number,d:number,x:number,y:number,z:number,mat:StandardMaterial,parent:TransformNode,part?:BodyPart)=>{const b=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},this.scene);b.parent=parent;b.position.set(x,y,z);b.material=mat;if(part)b.metadata={bodyPart:part};return b;};
    let cannon:TransformNode|undefined;
    const legs:TransformNode[]=[],knees:TransformNode[]=[],feet:Mesh[]=[],spiderLegs:SpiderLeg[]=[];
    if(spec.category==='hovercraft'){
      const {hull,cockpit}=shape;
      // A low faceted diamond: the supplied tower view shows pointed shoulders, not a square platform.
      const platform=new Mesh('aip-diamond-platform',this.scene),data=new VertexData();
      const points=[[0,hull.y+hull.h/2,0],[-hull.w/2,hull.y-.1,0],[0,hull.y-.1,hull.d/2],[hull.w/2,hull.y-.1,0],[0,hull.y-.1,-hull.d/2],[0,hull.y-hull.h/2,0]];
      const faces=[[0,1,2],[0,2,3],[0,3,4],[0,4,1],[5,2,1],[5,3,2],[5,4,3],[5,1,4]],positions:number[]=[],indices:number[]=[];
      for(const face of faces){const start=positions.length/3;for(const index of face)positions.push(...points[index]);indices.push(start,start+1,start+2);}
      data.positions=positions;data.indices=indices;data.normals=[];VertexData.ComputeNormals(positions,indices,data.normals);data.applyToMesh(platform);platform.parent=torso;platform.material=shell;platform.metadata={bodyPart:'hull'};
      const canopy=MeshBuilder.CreateCylinder('aip-cockpit',{height:cockpit.h,diameterTop:.28,diameterBottom:1,tessellation:4},this.scene);canopy.parent=torso;canopy.bakeTransformIntoVertices(Matrix.RotationY(Math.PI/4));canopy.scaling.set(cockpit.w*Math.SQRT2,1,cockpit.d*Math.SQRT2);canopy.position.set(0,cockpit.y,cockpit.z);canopy.material=dark;canopy.metadata={bodyPart:'cockpit'};

      for(const side of [-1,1]){box('aip-pod',.5,.5,2.4,side*2,-.2,0,shell,torso,'hull');box('aip-gun',.7,.7,2.7,side*2.4,.1,1,dark,torso,side<0?'leftWeapon':'rightWeapon');}
     }else if(u.kind==='merc-assault'){
      const {hull,cockpit,weapon,spider}=VEHICLE_SHAPES['merc-assault'];shell.diffuseColor=Color3.FromHexString('#c6c7c2');accent.diffuseColor=Color3.FromHexString('#5863a1');dark.diffuseColor=Color3.FromHexString('#303335');
      const body=MeshBuilder.CreateCylinder('assault-low-hull',{height:hull.h,diameterTop:.65,diameterBottom:1,tessellation:4},this.scene);body.parent=torso;body.bakeTransformIntoVertices(Matrix.RotationY(Math.PI/4));body.scaling.set(hull.w*Math.SQRT2,1,hull.d*Math.SQRT2);body.position.set(0,hull.y,hull.z);body.material=shell;body.metadata={bodyPart:'hull'};
      box('assault-cockpit',cockpit.w,cockpit.h,cockpit.d,0,cockpit.y,cockpit.z,shell,torso,'cockpit');
      box('assault-blue-roof',cockpit.w+.1,.18,cockpit.d+.1,0,cockpit.y+cockpit.h/2,cockpit.z,accent,torso,'cockpit');
      box('assault-front-window',cockpit.w*.82,.55,.09,0,cockpit.y,cockpit.z+cockpit.d/2+.05,dark,torso,'cockpit');
      for(const side of [-1,1]){
       box('assault-side-window',.08,.55,cockpit.d*.8,side*(cockpit.w/2+.05),cockpit.y,cockpit.z,dark,torso,'cockpit');
       box('assault-weapon',weapon.w,weapon.h,weapon.d,side*weapon.x,weapon.y,weapon.z,accent,torso,side<0?'leftWeapon':'rightWeapon');
       for(const front of [-1,1]){
        const part:BodyPart=side<0?'leftLeg':'rightLeg';
        const upper=MeshBuilder.CreateBox('assault-upper-leg',{width:spider.upperWidth,height:1,depth:spider.upperWidth},this.scene);upper.parent=root;upper.material=trim;upper.metadata={bodyPart:part};
        for(let rib=0;rib<6;rib++)box('assault-leg-rib',spider.upperWidth*1.12,.035,spider.upperWidth*1.12,0,-.4+rib*.16,0,shell,upper,part);
        const lower=MeshBuilder.CreateCylinder('assault-lower-leg',{height:1,diameterTop:spider.lowerWidth,diameterBottom:.09,tessellation:4},this.scene);lower.parent=root;lower.material=dark;lower.metadata={bodyPart:part};
        const foot=box('assault-foot',.45,.2,.65,0,0,0,dark,root,part);spiderLegs.push({side,front,upper,lower,foot});
       }
      }
    }else if(u.kind==='merc-cruiser'){
      const shape=VEHICLE_SHAPES['merc-cruiser'];box('cruiser-hull',2.4,2,2.8,0,1.4,0,shell,torso,'hull');box('cruiser-cockpit',2,2.6,2.4,0,3.2,0,glow,torso,'cockpit');
      for(const side of [-1,1]){box('cruiser-gun',.6,.6,2.4,side*.9,2.6,1.3,trim,torso,side<0?'leftWeapon':'rightWeapon');for(const front of [-1,1]){const leg=MeshBuilder.CreateTube('cruiser-leg',{path:[new Vector3(side*1,9,front),new Vector3(side*shape.legX,7,front*3.2),new Vector3(side*shape.legX,.1,front*3.2)],radius:.18,tessellation:5},this.scene);leg.parent=root;leg.material=trim;leg.metadata={bodyPart:side<0?'leftLeg':'rightLeg'};}}
    }else if(u.kind==='scorp-meson-tower'){
      const {hull,cockpit,weapon}=shape;
      const column=MeshBuilder.CreateCylinder('scorp-meson-column',{height:hull.h,diameterTop:hull.w,diameterBottom:hull.w*.65,tessellation:8},this.scene);column.parent=root;column.position.y=hull.h/2;column.material=shell;column.metadata={bodyPart:'hull'};
      box('scorp-meson-roof',cockpit.w,cockpit.h,cockpit.d,0,cockpit.y,0,trim,torso,'cockpit');
      box('scorp-meson-roof-rim',cockpit.w+.15,.3,cockpit.d+.15,0,cockpit.y-.7,0,accent,torso,'cockpit');
      for(const side of [-1,1]){
       box('scorp-meson-ochre-stripe',.35,6,.14,side*1.3,4.5,2.5,accent,root,'hull');
       const brace=MeshBuilder.CreateTube('scorp-meson-brace',{path:[new Vector3(side*4.2,.3,0),new Vector3(side*1.7,5.4,0)],radius:.5,tessellation:4,cap:Mesh.CAP_ALL},this.scene);brace.parent=root;brace.material=trim;brace.metadata={bodyPart:side<0?'leftLeg':'rightLeg'};
      }
      cannon=new TransformNode(`scorp-meson-cannon-pivot-${u.id}`,this.scene);cannon.parent=torso;cannon.position.y=weapon.y;
      box('scorp-meson-cannon',weapon.w,weapon.h,weapon.d,0,0,weapon.z,trim,cannon,'leftWeapon');
      box('scorp-meson-cannon-band',weapon.w+.1,weapon.h+.1,.7,0,0,weapon.z+1,accent,cannon,'leftWeapon');
      box('scorp-meson-muzzle',weapon.w,weapon.h,.12,0,0,weapon.z+weapon.d/2+.06,dark,cannon,'leftWeapon');
    }else if(u.kind==='merc-meson-tower'){
      const {hull,cockpit,roof,weapon,gunHousing,support}=VEHICLE_SHAPES['merc-meson-tower'];
      const metal=this.material(`${u.id}-meson-metal`,MERC_MESON_PALETTE.metal),rim=this.material(`${u.id}-meson-rim`,MERC_MESON_PALETTE.rim),red=this.material(`${u.id}-meson-red`,MERC_MESON_PALETTE.red);
      metal.diffuseTexture=mesonWeatheredArmor(this.scene);shell.diffuseTexture=mesonWeatheredArmor(this.scene,true);dark.diffuseColor=color(MERC_MESON_PALETTE.dark);
      // merc-mison.png: broad navy bowl, narrow waist, flared weathered pedestal and single roof cannon.
      const base=MeshBuilder.CreateCylinder('meson-pedestal',{height:hull.h,diameterTop:hull.w*.56,diameterBottom:hull.w,tessellation:8},this.scene);base.parent=root;base.position.y=hull.h/2;base.material=metal;base.metadata={bodyPart:'hull'};
      const facetScale=1/Math.cos(Math.PI/8),head=MeshBuilder.CreateCylinder('meson-head',{height:cockpit.h,diameterTop:1,diameterBottom:.44,tessellation:8},this.scene);head.bakeTransformIntoVertices(Matrix.RotationY(Math.PI/8));head.parent=torso;head.scaling.set(cockpit.w*facetScale,1,cockpit.d*facetScale);head.position.y=cockpit.y;head.material=shell;head.metadata={bodyPart:'cockpit'};
      const lip=MeshBuilder.CreateCylinder('meson-head-rim',{height:.2,diameter:1,tessellation:8},this.scene);lip.bakeTransformIntoVertices(Matrix.RotationY(Math.PI/8));lip.parent=torso;lip.scaling.set(cockpit.w*facetScale,1,cockpit.d*facetScale);lip.position.y=cockpit.y+cockpit.h/2;lip.material=rim;lip.metadata={bodyPart:'cockpit'};
      const cap=MeshBuilder.CreateCylinder('meson-roof-cap',{height:roof.h,diameterTop:.35,diameterBottom:1,tessellation:6},this.scene);cap.parent=torso;cap.scaling.set(roof.w,1,roof.d);cap.position.set(0,roof.y,roof.z);cap.material=metal;cap.metadata={bodyPart:'cockpit'};
      for(let i=0;i<13;i++)box('meson-upper-vent',.065,.38,.05,(i-6)*.2,cockpit.y+cockpit.h/2-.38,cockpit.d/2-.18,dark,torso,'cockpit');
      for(let i=0;i<9;i++){const theta=(i-4)*.21,rivet=MeshBuilder.CreateSphere('meson-head-fastener',{diameter:.12,segments:4},this.scene);rivet.parent=torso;rivet.position.set(Math.sin(theta)*cockpit.w*.305,cockpit.y-.7,Math.cos(theta)*cockpit.d*.305);rivet.material=metal;rivet.metadata={bodyPart:'cockpit'};}
      const taper=(hull.w-hull.w*.56)/2/hull.h;
      for(const [y,height] of [[2,.7],[2.85,1]] as const){const mark=box('meson-pedestal-red-mark',.68,height,.045,-.38,y,hull.w/2-taper*y+.03,red,root,'hull');mark.rotation.x=-Math.atan(taper);}
      box('meson-pedestal-hatch',.72,.62,.08,0,4.85,hull.w/2-taper*4.85+.025,dark,root,'hull');
      for(const side of [-1,1]){const seam=box('meson-pedestal-seam',.07,4.7,.035,side*.86,2.6,hull.w/2-taper*2.6+.015,rim,root,'hull');seam.rotation.x=-Math.atan(taper);}
      cannon=new TransformNode(`meson-cannon-pivot-${u.id}`,this.scene);cannon.parent=torso;cannon.position.y=weapon.y;
      box('meson-cannon-housing',gunHousing.w,gunHousing.h,gunHousing.d,0,0,gunHousing.z,metal,cannon,'leftWeapon');
      box('meson-cannon',weapon.w,weapon.h,weapon.d,0,0,weapon.z,metal,cannon,'leftWeapon');
      box('meson-muzzle',weapon.w*.72,weapon.h*.7,.035,0,0,weapon.z+weapon.d/2,dark,cannon,'leftWeapon');
      const foot=MeshBuilder.CreateCylinder('meson-foot',{height:support.h,diameterTop:support.w*.95,diameterBottom:support.w,tessellation:8},this.scene);foot.parent=root;foot.position.y=support.y;foot.material=metal;foot.metadata={bodyPart:'leftLeg'};
      torso.rotation.y=u.aim;
    }else if(tower){
      const {hull,cockpit,weapon}=shape,origin=spec.height*.6;
      // Photo reference: green faceted body, flared braces and a broad metal canopy.
      const column=MeshBuilder.CreateCylinder('tower-column',{height:hull.h,diameterTop:hull.w,diameterBottom:hull.w*.67,tessellation:8},this.scene);column.parent=torso;column.position.y=hull.y;column.material=shell;column.metadata={bodyPart:'hull'};
      for(let i=0;i<8;i++){
        const yaw=i*Math.PI/4+Math.PI/8;
        const rim=box('tower-ochre-rim',1.25,.55,.4,Math.sin(yaw)*2.95,9.35-origin,Math.cos(yaw)*2.95,accent,torso,'hull');rim.rotation.y=yaw;
        for(const y of [1.8,3.9,6]){const radius=(hull.w*.335+(hull.w*.5-hull.w*.335)*y/hull.h)*.924+.04;
          const patch=box('tower-ochre-panel',.48,.85,.12,Math.sin(yaw)*radius,y-origin,Math.cos(yaw)*radius,accent,torso,'hull');patch.rotation.y=yaw;}
        const radius=2.45,panel=box('tower-upper-panel',1.1,1.8,.12,Math.sin(yaw)*radius,8-origin,Math.cos(yaw)*radius,glow,torso,'hull');panel.rotation.y=yaw;
      }
      const canopy=MeshBuilder.CreateCylinder('tower-metal-canopy',{height:1.6,diameterTop:.2,diameterBottom:1,tessellation:4},this.scene);canopy.parent=torso;canopy.rotation.y=Math.PI/4;canopy.scaling.set(cockpit.w*Math.SQRT2,1,cockpit.d*Math.SQRT2);canopy.position.y=10.4-origin;canopy.material=trim;canopy.metadata={bodyPart:'cockpit'};
      const cap=MeshBuilder.CreateCylinder('tower-roof-cap',{height:.8,diameterTop:1.2,diameterBottom:1.6,tessellation:8},this.scene);cap.parent=torso;cap.position.y=11.6-origin;cap.material=trim;cap.metadata={bodyPart:'cockpit'};
      for(const side of [-1,1]){
        const part:BodyPart=side<0?'leftWeapon':'rightWeapon';box('tower-launch-panel',weapon.w,weapon.h,weapon.d,side*weapon.x,weapon.y,weapon.z,shell,torso,part);
        box('tower-launch-recess',.7,.2,.1,side*weapon.x,weapon.y+.4,weapon.d/2+.06,dark,torso,part);
        for(const face of [-1,1]){const vent=box('tower-roof-vent',.8,.09,1.1,side*.7,10.575-origin,face*2.1,dark,torso,'cockpit');vent.rotation.x=face*.46;}
        for(const end of [-1,1]){
          const support=MeshBuilder.CreateTube('tower-support-strut',{path:[new Vector3(side*3.8,.3-origin,end*2.6),new Vector3(side*1.6,5.3-origin,end)],radius:.55,tessellation:4,cap:Mesh.CAP_ALL},this.scene);support.convertToFlatShadedMesh();support.parent=torso;support.material=trim;support.metadata={bodyPart:side<0?'leftLeg':'rightLeg'};
          box('tower-footing',1.4,.35,1.8,side*3.8,.2-origin,end*2.6,trim,torso,side<0?'leftLeg':'rightLeg');
        }
      }
    }else if('track' in shape){
      const {hull,cockpit,weapon,track}=shape;
      if(scorp){
        const wedge=MeshBuilder.CreateCylinder('hull',{height:hull.h,diameterTop:.7,diameterBottom:1,tessellation:4},this.scene);
        wedge.parent=torso;wedge.position.set(0,hull.y,hull.z);wedge.bakeTransformIntoVertices(Matrix.RotationY(Math.PI/4));wedge.scaling.set(hull.w*Math.SQRT2,1,hull.d*Math.SQRT2);wedge.material=shell;wedge.metadata={bodyPart:'hull'};
        const cabin=MeshBuilder.CreateCylinder('cockpit',{height:cockpit.h,diameterTop:.7,diameterBottom:1,tessellation:4},this.scene);
        cabin.parent=torso;cabin.position.set(0,cockpit.y,cockpit.z);cabin.bakeTransformIntoVertices(Matrix.RotationY(Math.PI/4));cabin.scaling.set(cockpit.w*Math.SQRT2,1,cockpit.d*Math.SQRT2);cabin.material=glow;cabin.metadata={bodyPart:'cockpit'};
        box('cabin white header',cockpit.w*.7,.16,cockpit.d*.7,0,cockpit.y+cockpit.h/2,cockpit.z,shell,torso,'cockpit');
        const turret=MeshBuilder.CreateCylinder('upper turret',{height:.48,diameterTop:.85,diameterBottom:1.45,tessellation:6},this.scene);
        turret.parent=torso;turret.position.set(0,1.23,-.3);turret.material=trim;turret.metadata={bodyPart:'cockpit'};
        box('turret black ring',1.48,.15,1.12,0,1.02,-.3,dark,torso,'cockpit');
        const glacis=MeshBuilder.CreateCylinder('front green glacis',{height:.75,diameterTop:.55,diameterBottom:1,tessellation:4},this.scene);
        glacis.parent=torso;glacis.position.set(0,-.34,hull.d*.47);glacis.bakeTransformIntoVertices(Matrix.RotationY(Math.PI/4));glacis.scaling.set(2.3*Math.SQRT2,1,.16*Math.SQRT2);glacis.material=glow;glacis.metadata={bodyPart:'hull'};
        for(const side of [-1,1]){
          box('sloped shoulder armor',1.9,.28,2.7,side*1.6,.03,.12,shell,torso,'hull').rotation.z=-side*.36;
          box('ochre shoulder brace',1.9,.09,.25,side*1.6,.22,.75,accent,torso,'hull').rotation.z=-side*.36;
        }
      }else{
        const body=MeshBuilder.CreateCylinder('hull',{height:hull.h,diameterTop:.83,diameterBottom:1,tessellation:4},this.scene);
        body.parent=torso;body.position.set(0,hull.y,hull.z);body.bakeTransformIntoVertices(Matrix.RotationY(Math.PI/4));body.scaling.set(hull.w*Math.SQRT2,1,hull.d*Math.SQRT2);body.material=shell;body.metadata={bodyPart:'hull'};
        box('cockpit',cockpit.w,cockpit.h,cockpit.d,0,cockpit.y,cockpit.z,shell,torso,'cockpit');
        box('rear observation slit',cockpit.w*.82,.32,.12,0,cockpit.y+.03,cockpit.z-cockpit.d/2-.06,dark,torso,'cockpit');
        box('rear window upper rim',cockpit.w+.2,.12,.16,0,cockpit.y+.25,-1.08,trim,torso,'cockpit');
        box('rear engine grille',1.8,.35,.13,0,hull.y-.16,-hull.d/2-.04,dark,torso,'hull');
        for(let i=0;i<10;i++)box('engine grille slat',.07,.35,.16,-.8+i*.18,hull.y-.16,-hull.d/2-.08,trim,torso,'hull');
        for(const side of [-1,1]){
          box('rear bumper',1.3,.18,.35,side*1.18,-.58,-2.38,trim,torso,'hull');
          box('weathered shoulder rail',.7,.2,3.5,side*1.32,.23,0,shell,torso,'hull');
          box('rear marker',.18,.13,.08,side*1.42,-.2,-2.29,accent,torso,'hull');
        }
      }
      box('visor',cockpit.w*.75,.3,.12,0,cockpit.y,cockpit.z+cockpit.d/2+.08,glow,torso,'cockpit');
      for(const side of [-1,1]){
        const part:BodyPart=side<0?'leftWeapon':'rightWeapon';
        box('weapon pod',weapon.w,weapon.h,weapon.d,side*weapon.x,weapon.y,weapon.z,shell,torso,part);
        box('barrel',.18,.18,2.2,side*weapon.x,weapon.y,weapon.z+1.3,dark,torso,part);
        const tread=new TransformNode('track',this.scene);tread.parent=root;tread.position.x=side*shape.legX;legs.push(tread);
        const knee=new TransformNode('track-frame',this.scene);knee.parent=tread;knees.push(knee);
        feet.push(box('track-belt',track.w,track.h,track.d,0,track.y,track.z,dark,knee));
        if(scorp||u.kind==='union-asv'){
          const trackPart:BodyPart=side<0?'leftLeg':'rightLeg';
          for(let i=0;i<9;i++){
            const y=track.y-track.h*.43+i*track.h*.108;
            box('front tread cleat',track.w+.04,.10,.16,0,y,track.d/2+.04,trim,knee,trackPart);
            box('rear tread cleat',track.w+.04,.10,.16,0,y,-track.d/2-.04,trim,knee,trackPart);
          }
          for(let i=0;i<12;i++)box('upper tread cleat',track.w+.04,.12,.16,0,track.y+track.h/2,-track.d*.45+i*track.d*.082,trim,knee,trackPart);
          for(const edge of [-1,1]){
            box('ochre tread rail',.13,track.h,.18,edge*(track.w/2-.12),track.y,track.d/2+.14,accent,knee,trackPart);
            box('tread front rim',.12,track.h+.1,.16,edge*(track.w/2+.01),track.y,track.d/2+.06,shell,knee,trackPart);
          }
        }
        box('track-guard',track.w+.1,.18,track.d-.1,0,track.y+track.h/2,.1,shell,knee);
        for(let i=0;i<5;i++){const wheel=MeshBuilder.CreateCylinder('road-wheel',{diameter:track.h*.7,height:track.w+.04,tessellation:10},this.scene);wheel.parent=tread;wheel.position.set(0,track.y,-track.d*.36+i*track.d*.18);wheel.rotation.z=Math.PI/2;wheel.material=trim;}
      }
    }else{
    const {hull,cockpit,weapon}=shape;
    box('hull',hull.w,hull.h,hull.d,0,hull.y,hull.z,shell,torso);
    if(heavy){
      const cabin=MeshBuilder.CreateCylinder('cockpit',{height:cockpit.h,diameterTop:1,diameterBottom:.68,tessellation:4},this.scene);
      cabin.parent=torso;cabin.position.set(0,cockpit.y,cockpit.z);cabin.rotation.y=Math.PI/4;cabin.scaling.set(cockpit.w*Math.SQRT2,1,cockpit.d*Math.SQRT2);cabin.material=dark;cabin.metadata={bodyPart:'cockpit'};
      box('cab roof edge',cockpit.w+.16,.18,cockpit.d+.12,0,cockpit.y+cockpit.h/2,cockpit.z,shell,torso,'cockpit');
      box('cab lower rim',cockpit.w*.75,.18,cockpit.d*.8,0,cockpit.y-cockpit.h/2,cockpit.z,trim,torso,'cockpit');
      box('shoulder crossbar',4.5,.28,1.05,0,2.05,-.25,trim,torso,'hull');
      box('waist bridge',3.0,.36,1.5,0,-.95,.1,shell,torso,'hull');
      box('waist dark inset',1.6,.3,.15,0,-.25,1.2,dark,torso,'hull');
      box('waist blue plate',1.7,.22,.18,0,-.52,1.24,accent,torso,'hull');
      if(u.kind==='merc-tactical'){
        // The reference is a rear view: expose the central cooling spine and the backs of both shoulder pods.
        box('rear spine housing',1.72,2.05,.3,0,.55,-1.32,shell,torso,'hull');
        box('rear spine recess',1.25,1.52,.12,0,.55,-1.5,dark,torso,'hull');
        box('rear spine header',1.4,.18,.14,0,1.27,-1.59,accent,torso,'hull');
        for(let i=0;i<6;i++)box('rear cooling slat',1.02,.09,.11,0,1.03-i*.19,-1.59,trim,torso,'hull');
        box('rear waist shell',2.5,.62,.2,0,-.78,-1.05,shell,torso,'hull');
        box('rear waist blue inset',1.45,.22,.12,0,-.82,-1.17,accent,torso,'hull');
        for(const side of [-1,1]){
          const x=side*weapon.x,z=weapon.z-weapon.d/2-.09;
          box('rear shoulder pod face',weapon.w*.82,.78,.16,x,weapon.y,z,trim,torso,side<0?'leftWeapon':'rightWeapon');
          box('rear shoulder pod inset',weapon.w*.52,.48,.08,x,weapon.y,z-.13,dark,torso,side<0?'leftWeapon':'rightWeapon');
          box('rear shoulder blue marker',weapon.w*.58,.12,.09,x,weapon.y-.38,z-.14,accent,torso,side<0?'leftWeapon':'rightWeapon');
        }
      }
      if(unionTactical){box('rampage armored brow',3.3,.45,1.3,0,1.92,.7,shell,torso,'cockpit');box('rampage central window',1.55,.65,.14,0,1.3,1.35,dark,torso,'cockpit');}
    }else box('cockpit',cockpit.w,cockpit.h,cockpit.d,0,cockpit.y,cockpit.z,shell,torso);
    if(!heavy){const visor=box('visor',cockpit.w*.84,cockpit.h*.61,.13,0,cockpit.y+.05,cockpit.z+cockpit.d/2+.04,glow,torso);visor.rotation.x=-.15;}
    if(u.kind==='scorp-tactical'){const mount=SCORP_TACTICAL_RAID_MUZZLES;box('raid chin carriage',1.6,.35,.65,0,mount.y,mount.z-1.05,trim,torso,'hull');for(const side of [-1,1])box('scorp raid chin barrel',.18,.18,1.2,side*mount.x,mount.y,mount.z-.6,dark,torso,side<0?'leftWeapon':'rightWeapon');}
    if(u.kind==='merc-tactical'){const mount=MERC_TACTICAL_RAID_MUZZLE;box('raid chin mount',.65,.4,.6,0,mount.y,mount.z-.85,trim,torso,'hull');box('raid chin barrel',.2,.2,1.1,0,mount.y,mount.z-.55,dark,torso,'hull');}
    if(!heavy)box('rear cabin panel',cockpit.w*.7,cockpit.h*.45,.12,0,cockpit.y,cockpit.z-cockpit.d/2-.04,dark,torso,'cockpit');
    if(!heavy)box('cockpit brow',cockpit.w+.18,.16,cockpit.d+.12,0,cockpit.y+cockpit.h/2,cockpit.z,trim,torso,'cockpit');
    if(union){
      box('central lower armor',1.35,.48,1.2,0,hull.y-.3,.2,accent,torso,'hull').rotation.z=Math.PI/4;
      // Prowler: high outer shoulders descend into the low central cabin.
      for(const side of [-1,1]){
        const brace=MeshBuilder.CreateTube('prowler diagonal brace',{path:[new Vector3(side*.65,cockpit.y-.1,-.15),new Vector3(side*VEHICLE_SHAPES['union-sentry'].shoulder.x,VEHICLE_SHAPES['union-sentry'].shoulder.y-.25,-.15)],radius:.23,tessellation:4,cap:Mesh.CAP_ALL},this.scene);
        brace.parent=torso;brace.material=shell;brace.metadata={bodyPart:'hull'};
      }
    }
    if(merc){
      box('cabin roof rail',2.85,.2,2.4,0,2.5,0,trim,torso,'cockpit');
      box('lower chassis',1.7,.6,2,0,-.8,.15,dark,torso);
      box('centre red panel',.62,.72,.15,0,-.15,1.3,accent,torso);
    }
    for(const side of [-1,1]){
      const part:BodyPart=side<0?'leftWeapon':'rightWeapon',x=side*weapon.x;
      const pod=unionTactical?MeshBuilder.CreateCylinder('weapon pod',{diameter:2,height:1,tessellation:8},this.scene):box('weapon pod',weapon.w,weapon.h,weapon.d,x,weapon.y,weapon.z,shell,torso,part);
      if(unionTactical){pod.parent=torso;pod.position.set(x,weapon.y,weapon.z);pod.rotation.x=Math.PI/2;pod.scaling.set(weapon.w/2,weapon.d,weapon.h/2);pod.material=accent;pod.metadata={bodyPart:part};}
      if(!heavy){
        box('pod rim',weapon.w*.8,.14,weapon.d+.1,x,weapon.y+.35,weapon.z,trim,torso,part);
        box('weapon muzzle',weapon.w*.7,weapon.h*.55,.18,x,weapon.y,weapon.z+weapon.d/2+.07,dark,torso,part);
        box('weapon face panel',.36,.3,.2,x+side*.28,weapon.y+.05,weapon.z+weapon.d/2+.12,accent,torso,part);
      }
      if(heavy){
        box('shoulder blue cap',weapon.w+.12,.27,weapon.d+.1,x,weapon.y+weapon.h/2+.05,weapon.z,accent,torso,part);
        box('shoulder black face',weapon.w*.75,weapon.h*.63,.16,x,weapon.y,weapon.z+weapon.d/2+.06,dark,torso,part);
        box('shoulder white divider',weapon.w*.88,.16,.2,x,weapon.y-.24,weapon.z+weapon.d/2+.12,shell,torso,part);
        box('shoulder lower rail',weapon.w+.06,.16,weapon.d+.12,x,weapon.y-weapon.h/2,weapon.z,trim,torso,part);
      }
      box('barrel',.22,.22,heavy?1.3:1.1,x,weapon.y-.17,weapon.z+weapon.d/2+.5,dark,torso,part);
      const leg=new TransformNode('leg',this.scene);leg.parent=root;leg.position.set(side*shape.legX,'legHip' in shape?shape.legHip:spec.height*.5,0);if('legScale' in shape)leg.scaling.set(shape.legScale.x,shape.legScale.y,shape.legScale.z);legs.push(leg);
      if(union){const shoulder=VEHICLE_SHAPES['union-sentry'].shoulder;const cap=MeshBuilder.CreateCylinder('prowler shoulder armor',{diameter:2,height:1,tessellation:8},this.scene);cap.parent=leg;cap.position.set(0,spec.height*.6+shoulder.y-spec.height*.5,shoulder.z);cap.rotation.x=Math.PI/2;cap.scaling.set(shoulder.w/2,shoulder.d,shoulder.h/2);cap.material=accent;cap.metadata={bodyPart:side<0?'leftLeg':'rightLeg'};}
      box('thigh',heavy?1.12:.92,spec.height*.26,.95,0,-spec.height*.13,0,shell,leg);
      if(!heavy){
        if(union){const support=VEHICLE_SHAPES['union-sentry'].upperLeg;box('shoulder leg support',support.w,support.h,support.d,0,support.y-spec.height*.5,support.z,shell,leg);box('shoulder support inset',support.w*.55,support.h*.75,.13,0,support.y-spec.height*.5,support.z+support.d/2+.02,dark,leg);}
        box('hip armor',1.1,.65,1.22,0,-.2,.1,shell,leg);
        box('thigh inset',.68,.7,.12,0,-spec.height*.13,.52,dark,leg);
        box('leg side armor',.12,.82,.76,side*.51,-spec.height*.13,.08,accent,leg);
      }
      const knee=new TransformNode('knee',this.scene);knee.parent=leg;knee.position.y=-spec.height*.26;knees.push(knee);
      box('shin',heavy?1.38:1.12,spec.height*.22,1.15,0,-spec.height*.11,.12,shell,knee);
      if(!heavy){
        box('knee band',1.24,.24,1.27,0,-.1,.12,trim,knee);
        box('shin red armor',.88,spec.height*.12,.16,0,-spec.height*.095,.77,accent,knee);
        box('shin rear armor',.88,spec.height*.1,.13,0,-spec.height*.095,-.49,accent,knee);
        box('ankle band',1.15,.2,1.28,0,-spec.height*.19,.12,trim,knee);
      }
      if(heavy){
        box('thigh black inset',.85,spec.height*.13,.12,0,-spec.height*.13,.54,dark,leg);
        box('upper leg white cuff',1.3,.3,1.12,0,-.22,.05,shell,leg);
        if(u.kind==='merc-tactical'){
          box('rear thigh armor',1.05,spec.height*.16,.16,0,-spec.height*.13,-.53,shell,leg,side<0?'leftLeg':'rightLeg');
          box('rear thigh inset',.62,spec.height*.11,.08,0,-spec.height*.13,-.65,dark,leg,side<0?'leftLeg':'rightLeg');
        }
        box('tactical knee band',1.5,.32,1.3,0,-.1,.12,trim,knee);
        box('shin blue armor',1.3,spec.height*.13,.18,0,-spec.height*.115,.79,accent,knee);
        box('shin black vent',.9,.32,.2,0,-spec.height*.12,.89,dark,knee);
        box('shin white seam',1.4,.18,.22,0,-spec.height*.065,.9,shell,knee);
        box('shin lower white cuff',1.5,.27,1.35,0,-spec.height*.2,.12,shell,knee);
        if(u.kind==='merc-tactical'){
          box('rear shin blue armor',1.25,spec.height*.14,.18,0,-spec.height*.115,-.66,accent,knee,side<0?'leftLeg':'rightLeg');
          box('rear shin dark vent',.78,.34,.12,0,-spec.height*.12,-.78,dark,knee,side<0?'leftLeg':'rightLeg');
          box('rear shin white seam',1.28,.16,.12,0,-spec.height*.065,-.81,shell,knee,side<0?'leftLeg':'rightLeg');
        }
      }
      const foot=box('foot',heavy?1.65:1.5,.45,heavy?2.35:2,0,-spec.height*.22,.2,dark,knee);feet.push(foot);
      if(u.kind==='merc-tactical')for(const z of [-.75,-.25,.25,.75]){const tread=MeshBuilder.CreatePlane('merc-sole-tread',{width:1.35,height:.14,sideOrientation:Mesh.DOUBLESIDE},this.scene);tread.parent=foot;tread.rotation.x=Math.PI/2;tread.position.set(0,-.226,z);tread.material=trim;}
    }
    }
    if('track' in shape){const body=new TransformNode('asv-body',this.scene);body.parent=root;body.position.y=torso.position.y;
      for(const mesh of torso.getChildMeshes()){if(mesh.name==='weapon pod'||mesh.name==='barrel'||mesh.name==='upper turret'||mesh.name==='turret black ring')continue;mesh.parent=body;}
    }
    const parts=Object.fromEntries(PARTS.map((part):[BodyPart,PartVisual]=>[part,{meshes:[],paint:[],flash:0,smoke:0}])) as Record<BodyPart,PartVisual>;
    for(const mesh of root.getChildMeshes() as Mesh[]){
      const part:BodyPart=mesh.metadata?.bodyPart??(mesh.isDescendantOf(legs[0])?'leftLeg':mesh.isDescendantOf(legs[1])?'rightLeg':mesh.name==='weapon pod'||mesh.name==='barrel'?(mesh.position.x<0?'leftWeapon':'rightWeapon'):mesh.name==='cockpit'||mesh.name==='visor'?'cockpit':'hull');
      const original=mesh.material as StandardMaterial,material=original.clone(`${u.id}-${part}-${mesh.name}`)!;
      mesh.material=material;mesh.metadata={bodyPart:part};parts[part].meshes.push(mesh);parts[part].paint.push({material,base:original.diffuseColor.clone(),glow:original.emissiveColor.clone()});
    }
    accent.dispose();trim.dispose();shell.dispose(false,true);dark.dispose();glow.dispose();
    this.rigs.set(u.id,{spiderLegs,cannon,root,torso,legs,knees,feet,phase:0,run:0,lastX:u.x,lastZ:u.z,recoil:0,parts});
  }
  get cockpitBackdropSwayPercent(){
    const unit=this.sim.mounted??this.sim.passenger;
    if(this.mode!==0||this.sim.guidedMissile||this.completionTime!==null||unit?.kind!=='merc-assault'||!unit.alive)return 0;
    const rig=this.rigs.get(unit.id);return rig?Math.sin(rig.phase)*rig.run*.6:0;
  }
  private poseAssaultLegs(rig:Rig,phase:number,run:number){
    for(const leg of rig.spiderLegs??[]){
      const pose=mercAssaultLegPose(leg.side,leg.front,phase,run);
      for(const [mesh,a,b] of [[leg.upper,pose.hip,pose.knee],[leg.lower,pose.foot,pose.knee]] as const){const from=new Vector3(a.x,a.y,a.z),to=new Vector3(b.x,b.y,b.z),delta=to.subtract(from);mesh.position.copyFrom(from.add(to).scale(.5));mesh.scaling.y=delta.length();mesh.rotationQuaternion=Quaternion.FromUnitVectorsToRef(Vector3.Up(),delta.normalize(),new Quaternion());}
      leg.foot.position.set(pose.foot.x,pose.foot.y,pose.foot.z);
    }
  }
  private updateGait(unit:Unit,rig:Rig,dt:number){
    const spec=unit.spec,profile=GAITS[unit.kind],travel=Math.hypot(unit.x-rig.lastX,unit.z-rig.lastZ),before=rig.phase;
    rig.lastX=unit.x;rig.lastZ=unit.z;
    if(dt>0){const speed=unit.alive?travel/dt:0;rig.run+=(Math.min(1,speed/Math.max(1,spec.speed/3.6))-rig.run)*Math.min(1,dt*12);if(unit.alive)rig.phase+=travel/profile.stride*Math.PI*2;}
    const run=unit.alive?rig.run:0;
    if(unit.spec.category==='hovercraft'){rig.root.position.set(unit.x,unit.hoverHeight+(!unit.hoverDisabled&&Math.abs(unit.speed)>.1?Math.sin(this.sim.time*3)*.15:0),unit.z);rig.root.rotation.set(0,unit.yaw,0);return;}
    if(unit.spec.category==='tower'){rig.root.position.set(unit.x,0,unit.z);rig.root.rotation.set(0,0,0);return;}
    if(unit.kind.endsWith('-asv')){rig.root.position.set(unit.x,unit.alive?0:-.6,unit.z);rig.root.rotation.set(0,unit.yaw,unit.alive?0:.3);return;}
    if(unit.kind==='merc-assault'){rig.root.position.set(unit.x,unit.alive?0:-1,unit.z);rig.root.rotation.set(0,unit.yaw,unit.alive?0:.3);rig.torso.position.x=0;rig.torso.rotation.z=0;this.poseAssaultLegs(rig,rig.phase,run);return;}
    rig.root.position.set(unit.x,unit.alive?-.55*run+Math.abs(Math.sin(rig.phase))*profile.bounce*(unit.kind==='merc-tactical'?run:Math.sqrt(run)):-1.4,unit.z);
    rig.root.rotation.set(unit.alive?profile.lean*run:.5,unit.yaw,unit.alive?Math.sin(rig.phase)*(unit.kind==='merc-tactical'?.055:.025)*run:.4);
    rig.legs.forEach((leg,i)=>{
      const pose=legPose(unit.kind,rig.phase+i*Math.PI,run,leg.position.y+rig.root.position.y,spec.height);
      leg.rotation.x=pose.hip;rig.knees[i].rotation.x=pose.knee;rig.feet[i].rotation.x=pose.ankle;
    });
    if(dt>0&&run>.25&&Math.floor(before/Math.PI)!==Math.floor(rig.phase/Math.PI)){
      const foot=rig.feet[Math.floor(rig.phase/Math.PI)%2];foot.computeWorldMatrix(true);const point=foot.getAbsolutePosition();
      for(const side of [-1,1]){const dust=MeshBuilder.CreateSphere('footfall-dust',{diameter:.65+run*.6,segments:4},this.scene);dust.position.set(point.x+side*.25,.2,point.z);dust.material=this.fxMaterial('run-dust','#bbae80');this.addEffect(dust,.55,'smoke',new Vector3(side*.6-Math.sin(unit.yaw)*.8,.7,-Math.cos(unit.yaw)*.8));}
    }
  }
  private updateDamage(unit:Unit,rig:Rig,dt:number){
    for(const part of PARTS){const visual=rig.parts[part],health=unit.parts[part],damage=1-health;visual.flash=Math.max(0,visual.flash-dt*5);
      for(const paint of visual.paint){
        const scorch=Math.pow(Math.max(0,Math.min(1,damage)),.7);
        paint.material.diffuseColor=paint.base.scale(1-scorch*.9);
        paint.material.emissiveColor=Color3.Lerp(paint.glow.scale(1-scorch),new Color3(1,.32,.04),visual.flash*.7);
      }
      // Smoke originates on the damaged assembly and follows its articulation.
      if(unit.alive&&health<.3){visual.smoke+=dt;if(visual.smoke>=.3){visual.smoke%=.3;const anchor=visual.meshes[0];anchor.computeWorldMatrix(true);const smoke=MeshBuilder.CreateSphere('damage-smoke',{diameter:.55+(1-health)*.6,segments:4},this.scene);smoke.position.copyFrom(anchor.getAbsolutePosition());smoke.material=this.fxMaterial('smoke','#6d6a60');this.addEffect(smoke,1.2,'smoke',new Vector3(.15,1.4,0));}}
      else visual.smoke=0;
    }
  }
  private makeSoldier(id:string,hero=false,faction:Faction='merc'){
    const root=new TransformNode(id,this.scene),upper=new TransformNode('soldier-upper',this.scene),legs:TransformNode[]=[],knees:TransformNode[]=[],ankles:TransformNode[]=[],arms:TransformNode[]=[];upper.parent=root;
    faction=hero?this.sim.mission.playerFaction:faction;const union=faction==='union',scorp=faction==='scorp',merc=faction==='merc';root.metadata={faction:hero?this.sim.mission.playerFaction:faction,kind:scorp?'scorp-combatant':hero?'player':'enemy-soldier'};
    const paint=this.fxMaterial(union?'union-uniform':scorp?'scorp-uniform':merc?'merc-uniform':hero?'human-uniform':'enemy-uniform',union?'#f5f5f2':merc?MERC_INFANTRY_PALETTE.blue:scorp?'#416e34':hero?'#546878':'#787b47'),skin=this.fxMaterial(union?'union-face':scorp?'scorp-skin':merc?'merc-face':hero?'human-face':'enemy-face',union?'#f5f5f2':merc?MERC_INFANTRY_PALETTE.face:scorp?'#62bb42':hero?'#bc9c78':'#8b9d65');
    const dark=this.fxMaterial(merc?'merc-black':'soldier-boots-and-weapon',merc?MERC_INFANTRY_PALETTE.black:'#18201e'),trim=this.fxMaterial(union?'union-gear':merc?'merc-gray':'soldier-gear',union?'#e3e5e4':merc?MERC_INFANTRY_PALETTE.gray:'#39413a'),boots=union?paint:dark,armor=merc?this.fxMaterial('merc-white-armor',MERC_INFANTRY_PALETTE.white):paint;
    const box=(name:string,w:number,h:number,d:number,x:number,y:number,z:number,parent:TransformNode,mat=paint)=>{const mesh=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},this.scene);mesh.parent=parent;mesh.position.set(x,y,z);mesh.material=mat;return mesh;};
    const cylinder=(name:string,h:number,top:number,bottom:number,x:number,y:number,z:number,parent:TransformNode,mat=paint)=>{const mesh=MeshBuilder.CreateCylinder(name,{height:h,diameterTop:top,diameterBottom:bottom,tessellation:16},this.scene);mesh.parent=parent;mesh.position.set(x,y,z);mesh.material=mat;return mesh;};
    const {height,headHeight,hipHeight}=SOLDIER_PROPORTIONS;
    const head=MeshBuilder.CreateSphere('soldier-head',{diameter:1,segments:24},this.scene);head.parent=upper;head.scaling.set(.205,headHeight,.22);head.position.y=height-headHeight/2;head.material=skin;
    const helmet=MeshBuilder.CreateSphere('soldier-helmet',{diameter:1,segments:24},this.scene);helmet.parent=upper;helmet.scaling.set(.22,.12,.235);helmet.position.y=height-.06;helmet.material=paint;
    cylinder('soldier-neck',.06,.10,.11,0,height-headHeight-.03,0,upper,skin);
    box('soldier-brow',.12,.022,.016,0,1.795,.112,upper,dark);box('soldier-nose',.028,.035,.032,0,1.75,.119,upper,skin);
    const body=cylinder('soldier-body',.50,.5,.39,0,1.35,0,upper);body.scaling.z=.62;
    box('soldier-pelvis',.38,.16,.27,0,1.02,0,root);box('soldier-belt',.4,.045,.29,0,1.105,0,root,trim);
    box('soldier-back-seam',.018,.39,.015,0,1.36,-.158,upper,trim);
    if(merc){box('merc-white-chest',.38,.28,.055,0,1.38,.17,upper,armor);box('merc-gray-waist',.33,.12,.05,0,1.20,.15,upper,trim);}
    for(const side of [-1,1]){
      const arm=new TransformNode('soldier-shoulder',this.scene);arm.parent=upper;arm.position.set(side*.31,1.52,.03);arms.push(arm);
      cylinder('soldier-arm',.31,.14,.115,0,-.13,0,arm);
      if(merc)box('merc-white-shoulder',.17,.1,.17,0,-.025,0,arm,armor);
      const forearm=cylinder('soldier-forearm',.28,.12,.10,0,-.32,.15,arm);forearm.rotation.x=-.75;
      box('soldier-hand',.1,.1,.13,0,-.435,.25,arm,merc?dark:skin);
      const leg=new TransformNode('soldier-leg',this.scene);leg.parent=root;leg.position.set(side*.115,hipHeight,0);
      cylinder('soldier-thigh',INFANTRY_GAIT.upper,.16,.14,0,-INFANTRY_GAIT.upper/2,0,leg);
      const knee=new TransformNode('soldier-knee',this.scene);knee.parent=leg;knee.position.y=-INFANTRY_GAIT.upper;knees.push(knee);
      const cap=MeshBuilder.CreateSphere('soldier-kneecap',{diameter:.165,segments:16},this.scene);cap.parent=knee;cap.position.z=.025;cap.material=armor;
      cylinder('soldier-shin',INFANTRY_GAIT.lower,.14,.12,0,-INFANTRY_GAIT.lower/2,0,knee);
      const ankle=new TransformNode('soldier-ankle',this.scene);ankle.parent=knee;ankle.position.y=-INFANTRY_GAIT.lower;ankles.push(ankle);
      box('soldier-boot',.17,.12,.28,0,-.06,.035,ankle,boots);legs.push(leg);
    }
    box('soldier-rifle',.10,.12,.58,-.02,-.38,.4,arms[1],dark);box('soldier-rifle-stock',.08,.14,.18,-.02,-.39,.09,arms[1],trim);
    const barrel=cylinder('soldier-rifle-barrel',.27,.045,.045,-.02,-.37,.82,arms[1],dark);barrel.rotation.x=Math.PI/2;
    const rig={root,upper,legs,knees,ankles,arms,lastX:NaN,lastZ:NaN,phase:0,run:0,direction:1};this.soldierRigs.set(id,rig);return rig;
  }
  private poseSoldier(rig:SoldierRig,x:number,z:number,yaw:number,altitude:number,grounded:boolean,dt:number){
    const dx=Number.isFinite(rig.lastX)?x-rig.lastX:0,dz=Number.isFinite(rig.lastZ)?z-rig.lastZ:0,travel=Math.hypot(dx,dz);
    rig.lastX=x;rig.lastZ=z;
    if(!grounded)rig.run=0;else if(dt>0){rig.run=Math.min(1,travel/dt/4.4);rig.phase+=travel/INFANTRY_GAIT.stride*Math.PI*2;if(travel>.0001)rig.direction=dx*Math.sin(yaw)+dz*Math.cos(yaw)<0?-1:1;}
    const run=rig.run,direction=rig.direction,bob=run*(-.035+.012*Math.abs(Math.sin(rig.phase*2)));
    rig.root.position.set(x,altitude+bob,z);rig.upper.rotation.set(.12*run*direction,0,Math.sin(rig.phase)*.035*run);
    rig.legs.forEach((leg,i)=>{
      const pose=infantryLegPose(rig.phase+i*Math.PI,run,SOLDIER_PROPORTIONS.hipHeight+bob,direction);
      leg.rotation.x=grounded?pose.hip:0;rig.knees[i].rotation.x=grounded?pose.knee:0;rig.ankles[i].rotation.x=grounded?pose.ankle:0;
      rig.arms[i].rotation.x=grounded?Math.sin(rig.phase+i*Math.PI)*run*(i===0?.55:.22):0;
    });
  }
  private updateSoldiers(dt:number){
    const sim=this.sim,hero=this.soldierRigs.get('player')??this.makeSoldier('player',true);
    hero.root.setEnabled(!sim.mounted&&!sim.passenger&&!sim.insideFacility&&(this.mode!==0||this.completionTime!==null));
    this.poseSoldier(hero,sim.human.x,sim.human.z,sim.humanYaw,sim.flight?.altitude??(sim.humanHealth<=0?.25:0),!sim.flight&&!sim.prone&&sim.humanHealth>0,dt);
    hero.root.rotation.set(sim.prone||sim.humanHealth<=0?Math.PI/2:0,sim.humanYaw,0);
    for(const soldier of sim.soldiers){const rig=this.soldierRigs.get(soldier.id)??this.makeSoldier(soldier.id,false,soldier.faction);
      rig.root.setEnabled(!isEmbarked(soldier));this.poseSoldier(rig,soldier.x,soldier.z,soldier.yaw,soldier.flight?.altitude??(soldier.alive?0:.25),soldier.alive&&!soldier.flight&&!isEmbarked(soldier),dt);
      rig.root.rotation.set(soldier.alive?0:Math.PI/2,soldier.yaw,0);
    }
  }
  private bloodBurst(position:Point3){
    for(let i=0;i<16;i++){
      const drop=MeshBuilder.CreateSphere('infantry-blood',{diameter:.075+(i%3)*.018,segments:6},this.scene);
      drop.position.set(position.x,Math.max(.7,position.y),position.z);drop.material=this.fxMaterial('infantry-blood','#ac1222');
      const yaw=i*2.39996,speed=.8+(i%5)*.32;
      this.addEffect(drop,.65,'blood',new Vector3(Math.sin(yaw)*speed,1+(i%4)*.4,Math.cos(yaw)*speed));
    }
  }
  private gasCloud(position:Point3){
    for(let i=0;i<8;i++){const cloud=MeshBuilder.CreateSphere('gas-cloud',{diameter:1.2,segments:5},this.scene);cloud.position.set(position.x+Math.sin(i*2.4),position.y,position.z+Math.cos(i*2.4));cloud.material=this.fxMaterial('gas-cloud','#a5bb76');this.addEffect(cloud,1,'smoke',new Vector3(Math.sin(i)*.8,.6,Math.cos(i)*.8));}
  }
  private fxMaterial(name:string,hex:string,glow=false){
    let material=this.fxMaterials.get(name);
    if(!material){material=this.material(name,hex,glow);if(name==='smoke'||name==='gas-cloud'||name==='run-dust'){material.alpha=.5;material.disableLighting=true;material.emissiveColor=color(hex);}this.fxMaterials.set(name,material);}
    return material;
  }
  private retireVehicle(unit:Unit){if(unit.spec.category==='hovercraft'){this.rigs.get(unit.id)?.root.dispose(false,true);this.rigs.delete(unit.id);return;}
    const rig=this.rigs.get(unit.id);if(rig){rig.root.dispose(false,true);this.rigs.delete(unit.id);}
    if(unit.spec.category!=='tower'||this.wreckRigs.has(unit.id))return;
    const root=new TransformNode(`${unit.id}-wreck`,this.scene);root.position.set(unit.x,0,unit.z);root.metadata={kind:'facility-wreck',sourceUnitId:unit.id};
    const char=this.fxMaterial('facility-wreck-char','#282b26'),metal=this.fxMaterial('facility-wreck-metal','#4a4d43');
    const chunk=(name:string,w:number,h:number,d:number,x:number,y:number,z:number,material:StandardMaterial)=>{const mesh=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},this.scene);mesh.parent=root;mesh.position.set(x,y,z);mesh.material=material;return mesh;};
    chunk('facility-wreck-base',FACILITY_WRECK.width,.55,FACILITY_WRECK.depth,0,.275,0,char);
    chunk('facility-wreck-column',3.4,1.35,3.4,0,1.225,0,char);
    const roof=MeshBuilder.CreateCylinder('facility-wreck-roof',{height:.28,diameterTop:5.5,diameterBottom:7.8,tessellation:8},this.scene);roof.parent=root;roof.position.set(.2,1.85,.1);roof.rotation.z=.09;roof.material=metal;
    for(const side of [-1,1]){const beam=chunk('facility-wreck-support',.42,1.1,5.8,side*2.4,.9,0,char);beam.rotation.z=side*.3;}
    this.wreckRigs.set(unit.id,root);
  }
  private startDestruction(unit:Unit){
    if(this.destructions.has(unit.id))return;
    const root=new TransformNode(`vehicle-fire-${unit.id}`,this.scene);root.position.set(unit.x,0,unit.z);const flames:Mesh[]=[];
    for(let i=0;i<8;i++){
      const flame=MeshBuilder.CreateCylinder('vehicle-flame',{height:1,diameterTop:0,diameterBottom:1,tessellation:5},this.scene);flame.parent=root;flame.rotation.y=i*1.7;flame.material=this.fxMaterial(i%2?'flame-orange':'flame-yellow',i%2?'#ff4810':'#ffc333',true);flame.isPickable=false;flames.push(flame);
    }
    this.destructions.set(unit.id,{age:0,smokeTimer:0,root,flames});this.burst({x:unit.x,y:unit.spec.height*.5,z:unit.z},true);
  }
  private updateDestructions(dt:number){
    for(const [id,fire] of this.destructions){fire.age+=dt;const unit=this.sim.units.find(u=>u.id===id)!;
      if(fire.age>=VEHICLE_DESTRUCTION.engulf)this.retireVehicle(unit);
      const engulf=fire.age<VEHICLE_DESTRUCTION.engulf,fade=Math.max(0,1-Math.max(0,fire.age-VEHICLE_DESTRUCTION.burn)/(VEHICLE_DESTRUCTION.smokeEnd-VEHICLE_DESTRUCTION.burn));
      fire.flames.forEach((flame,i)=>{const pulse=.85+.15*Math.sin(fire.age*17+i*2.4),height=engulf?unit.spec.height*(.8+.3*(i%3)):1+(i%3)*.32,radius=engulf?2.8:.8;flame.position.set(Math.sin(i*2.4)*radius,height*pulse*.5+(!engulf&&unit.spec.category==='tower'?1.6:0),Math.cos(i*2.4)*radius);flame.scaling.set((engulf?2.8:.65)*pulse,height*pulse,(engulf?2.8:.65)*pulse);flame.visibility=fade;});
      if(dt>0&&fire.age<VEHICLE_DESTRUCTION.smokeEnd){fire.smokeTimer+=dt;if(fire.smokeTimer>=.22){fire.smokeTimer%=.22;const smoke=MeshBuilder.CreateSphere('vehicle-fire-smoke',{diameter:engulf?3:1.7,segments:5},this.scene);smoke.position.set(unit.x+Math.sin(fire.age*3)*.6,engulf?unit.spec.height*.6:unit.spec.category==='tower'?2.7:1.1,unit.z);smoke.material=this.fxMaterial('smoke','#6d6a60');this.addEffect(smoke,2.5,'smoke',new Vector3(.5,2.2,.15));}}
      if(fire.age>=VEHICLE_DESTRUCTION.clear){fire.root.dispose();this.destructions.delete(id);}
    }
  }
  private dashedGunTrace(from:Vector3,to:Vector3,weapon:string,name='bullet-tracer'){
    const direction=to.subtract(from),length=direction.length();direction.normalize();
    const side=Vector3.Cross(direction,Math.abs(direction.y)>.95?Vector3.Right():Vector3.Up()).normalize().scale(.035),up=Vector3.Cross(direction,side).normalize().scale(.035);
    const positions:number[]=[],indices:number[]=[],count=Math.max(1,Math.min(40,Math.ceil(length/3))),spacing=length/count,dash=Math.min(1.2,spacing*.45);
    for(let i=0;i<count;i++){
      const start=from.add(direction.scale(i*spacing)),end=start.add(direction.scale(dash));
      for(const cross of [side,up]){const index=positions.length/3;for(const point of [start.subtract(cross),start.add(cross),end.add(cross),end.subtract(cross)])positions.push(point.x,point.y,point.z);indices.push(index,index+1,index+2,index,index+2,index+3);}
    }
    const tracer=new Mesh(name,this.scene),data=new VertexData();data.positions=positions;data.indices=indices;data.normals=Array(positions.length).fill(0);for(let i=1;i<data.normals.length;i+=3)data.normals[i]=1;data.applyToMesh(tracer);
    const paint=this.fxMaterial('machinegun-red-tracer','#ff2413',true);paint.disableLighting=true;paint.fogEnabled=false;paint.backFaceCulling=false;tracer.material=paint;tracer.isPickable=false;tracer.metadata={weapon,visual:'dashed-mg-tracer',segments:count};return tracer;
  }
  private mesonCockpitJet(owner:string){
    const jet=new Mesh('meson-cockpit-jet',this.scene),data=new VertexData();
    // Camera-local viewmodel: a broad near edge below/left of the reticle, narrowing toward it.
    data.positions=[-.42,-.52,2.6,-.16,-.52,2.6,.05,-.12,14,-.05,-.12,14];data.indices=[0,1,2,0,2,3];data.normals=[0,0,-1,0,0,-1,0,0,-1,0,0,-1];data.applyToMesh(jet);
    const paint=this.fxMaterial('meson-cockpit-jet','#2822b4',true);paint.disableLighting=true;paint.fogEnabled=false;paint.backFaceCulling=false;paint.disableDepthWrite=true;paint.alpha=.76;
    jet.parent=this.camera;jet.material=paint;jet.isPickable=false;jet.metadata={visual:'meson-cockpit-jet',owner};this.addEffect(jet,.18,'beam');
  }
  private gausMaterial(weapon?:string){
    const meson=weapon==='GAUS30',paint=this.fxMaterial(meson?'meson-ultramarine':'gaus-blue',meson?'#2015a6':'#388bff',true);
    if(meson){paint.disableLighting=true;paint.fogEnabled=false;}
    return paint;
  }
  private laserBolt(name='laser-bolt',weapon?:string){
    if(weapon==='GAUS30'){
      const bolt=MeshBuilder.CreateBox(name,{width:.12,height:.008,depth:24},this.scene);
      const paint=this.gausMaterial(weapon);bolt.material=paint;bolt.isPickable=false;bolt.metadata={weapon,visual:'blue-laser',shape:'thin-plate'};
      return bolt;
    }
    if(weapon==='GAUS20'){const bolt=MeshBuilder.CreateCylinder(name,{height:6,diameter:.12,tessellation:8},this.scene);bolt.rotation.x=Math.PI/2;bolt.material=this.fxMaterial('gaus-blue','#388bff',true);bolt.isPickable=false;bolt.metadata={weapon,visual:'blue-laser'};return bolt;}
    if(weapon==='TCREAP')return this.dashedGunTrace(new Vector3(0,0,-4),new Vector3(0,0,.8),'TCREAP',name);
    if(weapon==='RAID'||weapon==='FIL-30'){const bolt=MeshBuilder.CreateCylinder(name,{height:1.8,diameter:.1,tessellation:8},this.scene);bolt.rotation.x=Math.PI/2;bolt.material=this.fxMaterial('laser-red','#ff2413',true);bolt.isPickable=false;bolt.metadata={weapon,visual:'slender-laser'};const core=MeshBuilder.CreateCylinder(weapon==='RAID'?'raid-white-core':'fil30-white-core',{height:1.65,diameter:.035,tessellation:6},this.scene);core.parent=bolt;core.material=this.fxMaterial('laser-core','#fff3df',true);core.isPickable=false;return bolt;}
    const bolt=MeshBuilder.CreateDisc(name,{radius:.55,tessellation:4,sideOrientation:Mesh.DOUBLESIDE},this.scene);bolt.billboardMode=Mesh.BILLBOARDMODE_ALL;
    const yellow=weapon==='RUPP'||weapon==='TAR12';bolt.material=this.fxMaterial(yellow?'laser-yellow':weapon==='CETI'?'laser-green':'laser-red',yellow?'#ffe529':weapon==='CETI'?'#25ff43':'#ff2413',true);bolt.isPickable=false;bolt.metadata={weapon,visual:yellow?'yellow-laser':weapon==='CETI'?'green-laser':'red-laser'};
    const core=MeshBuilder.CreateDisc('laser-white-core',{radius:.23,tessellation:4,sideOrientation:Mesh.DOUBLESIDE},this.scene);core.parent=bolt;core.position.z=-.015;core.material=this.fxMaterial('laser-core','#fff3df',true);core.isPickable=false;
    return bolt;
  }
  private addEffect(mesh:Mesh,duration:number,kind:Effect['kind'],velocity?:Vector3){
    this.effects.push({mesh,duration,life:duration,kind,velocity});
  }
  private yellowLaserFlash(position:Point3,weapon:string){const flash=MeshBuilder.CreateSphere(weapon==='TAR12'?'tar12-yellow-flash':'rupp-yellow-flash',{diameter:.45,segments:6},this.scene);flash.position.set(position.x,position.y,position.z);flash.material=this.fxMaterial('laser-yellow','#ffe529',true);this.addEffect(flash,.12,'flash');}
  private gausFlash(position:Point3,weapon?:string){const flash=MeshBuilder.CreateSphere('gaus-blue-flash',{diameter:.55,segments:6},this.scene);flash.position.set(position.x,position.y,position.z);flash.material=this.gausMaterial(weapon);this.addEffect(flash,.12,'flash');}
  private burst(position:Point3,large=false){
    const blast=MeshBuilder.CreateSphere('impact-flash',{diameter:1,segments:8},this.scene);
    blast.position.set(position.x,Math.max(.4,position.y),position.z);
    blast.material=this.fxMaterial('fire','#ffad42',true);blast.scaling.setAll(large?3:1.2);
    this.addEffect(blast,large?.7:.35,'blast');
    for(let i=0;i<(large?7:3);i++){
      const smoke=MeshBuilder.CreateSphere('impact-smoke',{diameter:large?3:1.4,segments:5},this.scene);
      smoke.position.set(position.x+Math.sin(i*2.4)*1.5,position.y+.5,position.z+Math.cos(i*2.4)*1.5);
      smoke.material=this.fxMaterial('smoke','#6d6a60');this.addEffect(smoke,large?1.3:.8,'smoke',new Vector3(Math.sin(i),2,Math.cos(i)));
    }
  }
  event(e:GameEvent){
    if(e.type==='board'&&e.facility)this.mode=0;
    if(e.type==='board'&&!e.soldier&&(e.unit===this.sim.mounted||e.unit===this.sim.passenger))this.mode=0;
    if(e.type==='hit'&&e.unit&&e.part){const visual=this.rigs.get(e.unit.id)?.parts[e.part];if(visual)visual.flash=1;}
    if(e.type==='shot'&&e.from&&e.to){
      const unit=e.unit,rig=unit?this.rigs.get(unit.id):undefined;
      if(rig)rig.recoil=unit?.spec.category==='tower'?0:1;
      if(e.weapon==='GAUS30'&&unit===this.sim.mounted&&unit?.kind==='merc-meson-tower'&&this.mode===0&&!this.sim.guidedMissile&&this.completionTime===null)this.mesonCockpitJet(unit.id);
      if(unit===this.sim.mounted&&unit?.spec.category!=='tower')this.kick=e.projectileId!==undefined?.09:.035;
      const infantryRifle=e.weapon==='PRIF44',dasy=e.weapon==='DASY';
      if(infantryRifle&&!e.unit&&!e.soldier&&this.mode===0&&!this.sim.mounted){
        const streak=MeshBuilder.CreateTube('prif44-first-person-streak',{path:[new Vector3(.3,-.12,.8),new Vector3(.08,-.03,2)],radius:.015,tessellation:6,cap:Mesh.CAP_ALL},this.scene);
        streak.parent=this.camera;streak.material=this.fxMaterial('prif44-red-tracer','#ff2413',true);streak.isPickable=false;streak.metadata={visual:'prif44-first-person-streak'};this.addEffect(streak,.2,'beam');
      }
      const yaw=unit?.aim??Math.atan2(e.to.x-e.from.x,e.to.z-e.from.z),side=(this.sim.time*12%2)<1?-1:1;
      const lateral=infantryRifle?.3:side*2.3,forward=infantryRifle?.8:2.6;
      const height=infantryRifle?Math.max(.2,(e.from.y??1.6)-.12):unit?unit.spec.height*.6:1.1;
      let from=e.position?new Vector3(e.position.x,e.position.y,e.position.z):new Vector3(e.from.x+Math.cos(yaw)*lateral+Math.sin(yaw)*forward,height,e.from.z-Math.sin(yaw)*lateral+Math.cos(yaw)*forward);
      const machineGun=!!unit&&['FLECH','DASY','zWASP'].includes(e.weapon??'');
      if(machineGun&&rig&&!e.position){const index=unit!.spec.weapons.indexOf(e.weapon as import('../content/weapons.ts').VehicleWeapon),part=index%2===0?'leftWeapon':'rightWeapon',barrel=rig.parts[part].meshes.find(mesh=>mesh.name==='barrel');if(barrel){barrel.computeWorldMatrix(true);const tip=barrel.getBoundingInfo().boundingBox.maximum;from=Vector3.TransformCoordinates(new Vector3(0,0,tip.z),barrel.getWorldMatrix());}}
      const flash=MeshBuilder.CreateSphere('muzzle-flash',{diameter:e.weapon==='GAUS30'?.6:e.weapon==='GAUS20'?.25:infantryRifle?(e.soldier?.18:.055):e.projectileId!==undefined?1.2:.7,segments:5},this.scene);
      if(e.weapon==='GAUS30'&&unit?.kind==='merc-meson-tower')flash.metadata={mesonMuzzleOwner:unit.id};
      flash.position.copyFrom(from);flash.material=(e.weapon==='GAUS30'||e.weapon==='GAUS20')?this.gausMaterial(e.weapon):this.fxMaterial((e.weapon==='RUPP'||e.weapon==='TAR12')?'rupp-muzzle':dasy?'dasy-muzzle':infantryRifle?'rifle-muzzle':'muzzle',(e.weapon==='RUPP'||e.weapon==='TAR12')?'#ffe529':dasy?'#ff2413':infantryRifle?'#ff3020':'#ffda83',true);this.addEffect(flash,e.weapon==='GAUS30'?.14:.09,'flash');
      if(e.projectileId===undefined){
        const to=new Vector3(e.to.x,e.to.y??(e.unit===this.sim.mounted?4:(this.sim.mounted?4:1.1)),e.to.z),direction=to.subtract(from),length=direction.length();direction.normalize();
        const laser=isLaser(e.weapon??'');
        let beam:Mesh;
        if(laser){beam=this.laserBolt('laser-flash',e.weapon);beam.position.copyFrom(from);}
        else if(machineGun){beam=this.dashedGunTrace(from,to,e.weapon!);}
        else if(infantryRifle){beam=MeshBuilder.CreateTube('prif44-red-tracer',{path:[from,from.add(direction.scale(Math.min(6,length)))],radius:.12,tessellation:6,cap:Mesh.CAP_ALL},this.scene);beam.material=this.fxMaterial('prif44-red-tracer','#ff2413',true);beam.isPickable=false;}
        else{const tracer=MeshBuilder.CreateLines('bullet-tracer',{points:[from,from.add(direction.scale(Math.min(5,length)))]},this.scene);tracer.color=color(dasy?'#ff2413':infantryRifle?'#ff3020':'#ff5035');beam=tracer;}
        const tracerSpeed=infantryRifle?INFANTRY_WEAPONS.PRIF44.tracerSpeed:450;
        this.addEffect(beam,laser?.1:machineGun?.16:Math.max(.02,length/tracerSpeed),laser?'beam':'tracer',laser?direction.scale(this.sim.weapons.lasers[e.weapon as import('../content/weapons.ts').LaserWeapon].speed):machineGun?undefined:direction.scale(tracerSpeed));
      }
    }
    if(e.type==='mine'&&e.position)this.burst(e.position,true);
    if(e.type==='impact'&&e.position){if(e.weapon==='GAUS30'||e.weapon==='GAUS20')this.gausFlash(e.position,e.weapon);else if(e.weapon==='RUPP'||e.weapon==='TAR12')this.yellowLaserFlash(e.position,e.weapon);else if(e.weapon==='GASHR')this.gasCloud(e.position);else if(e.weapon!=='EGGER')this.burst(e.position);}
    if(e.type==='soldier-death'&&e.position&&(!e.soldier||!isEmbarked(e.soldier)))this.bloodBurst(e.position);
    if(e.type==='hit'&&e.unit&&e.unit!==this.sim.mounted){const point=e.position??{x:e.unit.x,y:e.unit.spec.height*.6,z:e.unit.z};if(e.weapon==='GAUS30'||e.weapon==='GAUS20')this.gausFlash(point,e.weapon);else if(e.weapon==='RUPP'||e.weapon==='TAR12')this.yellowLaserFlash(point,e.weapon);else this.burst(point);}
    if(e.type==='hit'&&e.unit===this.sim.mounted)this.kick=.12;
    if(e.type==='destroy'&&e.unit)this.startDestruction(e.unit);if(e.type==='destroy'&&e.facility&&e.position)this.burst(e.position,true);
  }
  private updateMissiles(dt:number){
    const live=new Set(this.sim.missiles.map(p=>p.id));
    for(const [id,rig] of this.missileRigs)if(!live.has(id)){rig.root.dispose();this.missileRigs.delete(id);}
    for(const missile of this.sim.missiles){
      let rig=this.missileRigs.get(missile.id);
      if(isLaser(missile.weapon)||missile.weapon==='TCREAP'){
        if(!rig){const root=new TransformNode(`laser-${missile.id}`,this.scene),bolt=this.laserBolt('laser-bolt',missile.weapon);bolt.parent=root;rig={root,flame:bolt,smokeTimer:0};this.missileRigs.set(missile.id,rig);}
        rig.root.setEnabled(missile.id!==this.sim.guidedMissile?.id);rig.root.position.set(missile.x,missile.y,missile.z);rig.root.lookAt(rig.root.position.add(new Vector3(missile.vx,missile.vy,missile.vz)));
        if(missile.weapon==='GAUS30'){
          const localCamera=Vector3.TransformCoordinates(this.camera.position,Matrix.Invert(rig.root.computeWorldMatrix(true)));
          // Rotate the ribbon around its flight axis so external views see its face.
          rig.flame.rotation.z=Math.atan2(-localCamera.x,localCamera.y);
          const nearOwnJet=this.mode===0&&this.completionTime===null&&!this.sim.guidedMissile&&this.sim.mounted?.kind==='merc-meson-tower'&&missile.owner===this.sim.mounted.id&&Vector3.Distance(this.camera.position,rig.root.position)<24;rig.root.setEnabled(!nearOwnJet);
          const distance=Vector3.Distance(this.camera.position,rig.root.position),width=distance*2*Math.tan(this.camera.fov/2)*3/this.engine.getHardwareScalingLevel()/Math.max(1,this.engine.getRenderHeight());
          rig.flame.scaling.x=Math.max(1,width/.12);
        }
        continue;
      }
      if(!rig){
        const root=new TransformNode(`missile-${missile.id}`,this.scene),gas=missile.weapon==='GASHR'||missile.weapon==='EGGER';
        const body=MeshBuilder.CreateCylinder('missile-body',{height:gas?.45:1.6,diameter:gas?.22:.35,tessellation:8},this.scene);body.parent=root;body.rotation.x=Math.PI/2;body.material=this.fxMaterial('missile-body','#d3d1b7');
        const nose=MeshBuilder.CreateCylinder('missile-nose',{height:.6,diameterTop:0,diameterBottom:.35,tessellation:8},this.scene);nose.parent=root;nose.rotation.x=Math.PI/2;nose.position.z=1.1;nose.material=this.fxMaterial('missile-nose','#ac5e3b');nose.setEnabled(!gas);
        for(const spin of [0,Math.PI/2]){const fin=MeshBuilder.CreateBox('missile-fin',{width:1,height:.06,depth:.45},this.scene);fin.parent=root;fin.position.z=-.55;fin.rotation.z=spin;fin.material=this.fxMaterial('missile-body','#d3d1b7');fin.setEnabled(!gas);}
        const flame=MeshBuilder.CreateCylinder('rocket-exhaust',{height:2,diameterTop:.4,diameterBottom:0,tessellation:6},this.scene);flame.parent=root;flame.position.z=-1.7;flame.rotation.x=Math.PI/2;flame.material=this.fxMaterial('exhaust','#ffb94c',true);flame.setEnabled(!gas);
        rig={root,flame,smokeTimer:0};this.missileRigs.set(missile.id,rig);
      }
      rig.root.setEnabled(missile.id!==this.sim.guidedMissile?.id);rig.root.position.set(missile.x,missile.y,missile.z);rig.root.lookAt(rig.root.position.add(new Vector3(missile.vx,missile.vy,missile.vz)));
      rig.flame.scaling.y=.8+.25*Math.sin(this.sim.time*70+missile.id);
      rig.smokeTimer+=dt;
      if(missile.weapon!=='EGGER'&&rig.smokeTimer>=.035){rig.smokeTimer%=.035;const smoke=MeshBuilder.CreateSphere('rocket-smoke',{diameter:missile.weapon==='GASHR'?.5:.9,segments:4},this.scene);smoke.position.copyFrom(rig.root.position);smoke.material=missile.weapon==='GASHR'?this.fxMaterial('gas-cloud','#a5bb76'):this.fxMaterial('smoke','#6d6a60');this.addEffect(smoke,.65,'smoke',new Vector3(0,.7,0));}
    }
  }
  update(dt:number){const sim=this.sim;const river=sim.mission.terrain.river;if(river)for(const side of [-1,1]){const hinge=this.scene.getTransformNodeByName(`bridge-hinge-${side}`);if(hinge)hinge.rotation.z=sim.raisedBridges.has(river.bridgeId)?-side*Math.PI*.48:0;}for(const facility of sim.facilities){const root=this.scene.getTransformNodeByName(`facility-${facility.id}`);root?.setEnabled(facility.alive&&!(sim.insideFacility===facility&&this.mode===0&&this.completionTime===null));}const detected=new Set(sim.detectedMines.map(m=>m.id));for(const [id,mesh] of this.mineRigs)mesh.isVisible=detected.has(id);this.updateDestructions(dt);for(const u of sim.units){const rig=this.rigs.get(u.id);if(!rig)continue;if(!u.alive&&!this.destructions.has(u.id)){this.retireVehicle(u);continue;}rig.recoil=Math.max(0,rig.recoil-dt*9);rig.torso.position.z=u.spec.category==='tower'||u.kind==='merc-assault'?0:-rig.recoil*.35;rig.torso.rotation.x=u.spec.category==='tower'||u.kind==='merc-assault'?0:(u.kind.endsWith('-asv')?-(u===sim.mounted?sim.pitch:u.aimPitch):0)-rig.recoil*.045;this.updateGait(u,rig,dt);rig.torso.rotation.y=(u.kind==='merc-meson-tower'||u.kind==='scorp-meson-tower')?u.aim:u.spec.category==='tower'||u.spec.torsoLimit===0?0:u.aim-u.yaw;if(u.kind!=='merc-assault')rig.torso.rotation.z=-rig.root.rotation.z*.65;rig.root.setEnabled(!((u===sim.mounted||u===sim.passenger)&&this.mode===0&&!sim.guidedMissile&&this.completionTime===null));if(rig.cannon)rig.cannon.rotation.x=-(u===sim.mounted?sim.pitch:u.aimPitch);this.updateDamage(u,rig,dt);}
    this.updateSoldiers(dt);
    const p=sim.player;const yaw=sim.aim;const height=sim.eyeHeight;
    const guided=sim.guidedMissile;
    this.camera.fov=guided?VISOM_GUIDANCE.fov:1.15;
    if(this.completionTime!==null){
      const carrier=sim.mounted??sim.passenger,viewYaw=sim.yaw+.65+Math.min(this.completionTime,4)*.035,range=24;
      this.camera.fov=1.05;this.camera.position.set(p.x-Math.sin(viewYaw)*range,Math.max(42,(carrier?.spec.height??1.9)*6),p.z-Math.cos(viewYaw)*range);
      this.camera.setTarget(new Vector3(p.x,carrier?carrier.spec.height*.35:1,p.z));
    }
    else if(guided){const direction=new Vector3(guided.vx,guided.vy,guided.vz).normalize();this.camera.position.set(guided.x,guided.y,guided.z);this.camera.setTarget(this.camera.position.add(direction.scale(80)));}
    else if(this.mode===0){const gait=sim.mounted?this.rigs.get(sim.mounted.id):null,bob=gait&&sim.mounted?Math.sin(gait.phase*2)*Math.min(.12,GAITS[sim.mounted.kind].bounce*.5)*Math.sqrt(gait.run):(!sim.passenger&&Math.abs(sim.speed)>1?Math.sin(sim.time*7)*.06:0);this.camera.position.set(p.x,height+bob,p.z);this.camera.setTarget(new Vector3(p.x+Math.sin(yaw)*80,height+Math.tan(sim.pitch)*80,p.z+Math.cos(yaw)*80));}
    else {const carrier=sim.mounted??sim.passenger,fixed=!!carrier,body=sim.yaw,viewYaw=fixed?body:yaw,viewPitch=sim.pitch,rear=carrier&&this.mode===2?sim.mission.rearCamera:undefined,range=(rear?.range??(carrier?(this.mode===1?20:16):(this.mode===1?6:5)))*(this.mode===2?REAR_CAMERA_DISTANCE_SCALE:1),side=this.mode===1?(carrier?15:4):0,altitude=sim.flight?.altitude??0,lookAhead=rear?.lookAhead??(carrier?(this.mode===1?8:15):(this.mode===1?2:3));this.camera.position.set(p.x-Math.sin(body)*range+Math.cos(body)*side,altitude+(rear?.height??(carrier?10:3)),p.z-Math.cos(body)*range-Math.sin(body)*side);this.camera.setTarget(new Vector3(p.x+Math.sin(viewYaw)*lookAhead,altitude+(rear?.targetHeight??(carrier?4:1.2))+Math.tan(viewPitch)*(carrier?25:8),p.z+Math.cos(viewYaw)*lookAhead));}
    this.kick=Math.max(0,this.kick-dt*.7);if(!guided)this.camera.position.y+=this.kick*Math.sin(sim.time*65);
    this.updateMissiles(dt);
    const waypoint=sim.activeWaypoint;this.waypoint.visibility=waypoint?(sim.reachedWaypoints.has(waypoint.id)?.25:.8):0;if(waypoint)this.waypoint.position.set(waypoint.x,.25,waypoint.z);
    for(const effect of this.effects){
      effect.life-=dt;
      if(effect.kind==='blood'&&effect.velocity)effect.velocity.y-=9.8*dt;
      if(effect.velocity)effect.mesh.position.addInPlace(effect.velocity.scale(dt));
      if(effect.kind==='blood'){effect.mesh.position.y=Math.max(.025,effect.mesh.position.y);effect.mesh.visibility=Math.max(0,effect.life/effect.duration);}
      const remaining=Math.max(0,effect.life/effect.duration);
      if(effect.mesh.metadata?.mesonMuzzleOwner)effect.mesh.setEnabled(!(this.mode===0&&!guided&&this.completionTime===null&&sim.mounted?.id===effect.mesh.metadata.mesonMuzzleOwner));
      if(effect.mesh.metadata?.visual==='meson-cockpit-jet'){effect.mesh.setEnabled(this.mode===0&&this.sim.mounted?.id===effect.mesh.metadata.owner&&!guided&&this.completionTime===null);effect.mesh.visibility=Math.min(1,remaining*1.5);}
      if(effect.mesh.metadata?.visual==='prif44-first-person-streak'){effect.mesh.setEnabled(this.mode===0&&!sim.mounted&&!sim.insideFacility);effect.mesh.visibility=Math.min(1,remaining*2);}
      if(effect.kind==='smoke'){effect.mesh.scaling.addInPlace(new Vector3(dt*2,dt*2,dt*2));effect.mesh.visibility=remaining*.7;}
      if(effect.kind==='tracer'&&effect.mesh.metadata?.visual==='dashed-mg-tracer')effect.mesh.visibility=remaining;
      if(effect.kind==='blast'){effect.mesh.scaling.addInPlace(new Vector3(dt*16,dt*16,dt*16));effect.mesh.visibility=remaining;}
      if(effect.life<=0)effect.mesh.dispose();
    }this.effects=this.effects.filter(e=>e.life>0);this.scene.render();
  }
  projectWaypoint(){
    const waypoint=this.sim.activeWaypoint??this.sim.mission.waypoints[0]??{x:0,z:0},point=new Vector3(waypoint.x,2,waypoint.z),width=this.engine.getRenderWidth(),height=this.engine.getRenderHeight();
    const projected=Vector3.Project(point,Matrix.Identity(),this.scene.getTransformMatrix(),this.camera.viewport.toGlobal(width,height));
    const view=Vector3.TransformCoordinates(point,this.camera.getViewMatrix());
    return {x:projected.x/width,y:projected.y/height,visible:view.z>0&&projected.x>0&&projected.x<width&&projected.y>0&&projected.y<height};
  }
  projectTarget(unit:SelectionTarget){
    const altitude=isVehicle(unit)?unit.hoverHeight:isFacility(unit)?0:unit.flight?.altitude??0,objectHeight=isFacility(unit)?unit.height:isVehicle(unit)?unit.spec.height:1.8;
    const point=new Vector3(unit.x,targetHeight(unit),unit.z),width=this.engine.getRenderWidth(),height=this.engine.getRenderHeight();
    const viewport=this.camera.viewport.toGlobal(width,height),matrix=this.scene.getTransformMatrix();
    const projected=Vector3.Project(point,Matrix.Identity(),matrix,viewport);
    const top=Vector3.Project(new Vector3(unit.x,altitude+objectHeight,unit.z),Matrix.Identity(),matrix,viewport);
    const bottom=Vector3.Project(new Vector3(unit.x,altitude,unit.z),Matrix.Identity(),matrix,viewport);
    const view=Vector3.TransformCoordinates(point,this.camera.getViewMatrix());
    return {x:projected.x/width,y:projected.y/height,size:Math.max(.02,Math.abs(top.y-bottom.y)/height),visible:view.z>0&&projected.x>0&&projected.x<width&&projected.y>0&&projected.y<height,side:view.x<0?'left':'right'};
  }
  reset(sim:Simulation){this.completionTime=null;for(const root of this.wreckRigs.values())root.dispose();this.wreckRigs.clear();for(const fire of this.destructions.values())fire.root.dispose();this.destructions.clear();for(const rig of this.soldierRigs.values())rig.root.dispose();this.soldierRigs.clear();for(const rig of this.missileRigs.values())rig.root.dispose();this.missileRigs.clear();this.kick=0;for(const rig of this.rigs.values())rig.root.dispose(false,true);for(const e of this.effects)e.mesh.dispose();this.effects=[];this.rigs.clear();this.sim=sim;this.terrain();this.waypoint.position.set((sim.mission.waypoints[0]?.x??0),.25,(sim.mission.waypoints[0]?.z??0));for(const u of sim.units)this.makeMech(u);this.mode=initialCameraMode(sim.mission.initialView,!!(sim.mounted??sim.passenger));}
}
