import {VEHICLES,type VehicleKind,type VehicleSpec} from '../content/vehicles.ts';
import {VEHICLE_SHAPES,mercAssaultLegPose} from '../content/vehicle-shapes.ts';
export const PART_DAMAGE_THRESHOLDS={yellow:.6,critical:.25} as const;
export const PARTS=['hull','cockpit','leftWeapon','rightWeapon','leftLeg','rightLeg'] as const;
export type BodyPart=typeof PARTS[number];
export type PartState=Record<BodyPart,number>;
export type Point={x:number;y:number;z:number};
type PartBox={part:BodyPart;x:number;y:number;z:number;w:number;h:number;d:number;upper:boolean;segment?:{from:Point;to:Point}};
type Body={kind:VehicleKind;x:number;z:number;yaw:number;aim:number;aimPitch?:number;hoverHeight?:number;spec?:VehicleSpec};
export const freshParts=():PartState=>({hull:1,cockpit:1,leftWeapon:1,rightWeapon:1,leftLeg:1,rightLeg:1});
export const mobilityMultiplier=(parts:PartState)=>.2+.8*(parts.leftLeg+parts.rightLeg)/2;
// Prototype boxes follow the procedural models; original hit zones/HP await measurement.
const durability:Record<BodyPart,number>={hull:.6,cockpit:.3,leftWeapon:.35,rightWeapon:.35,leftLeg:.35,rightLeg:.35};
export function applyPartDamage(parts:PartState,part:BodyPart,damage:number,armor:number){parts[part]=Math.max(0,parts[part]-damage/(armor*durability[part]));}
function spiderBoxes(){
 const shape=VEHICLE_SHAPES['merc-assault'].spider;
 return [-1,1].flatMap(side=>[-1,1].flatMap(front=>{
  const {hip,knee,foot}=mercAssaultLegPose(side,front);
  return ([[hip,knee,shape.upperWidth],[knee,foot,shape.lowerWidth]] as const).map(([from,to,width])=>({
   part:(side<0?'leftLeg':'rightLeg') as BodyPart,x:(from.x+to.x)/2,y:(from.y+to.y)/2,z:(from.z+to.z)/2,
   w:width+shape.step,h:Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z)+width,d:width+shape.step,upper:false,
   segment:{from,to}
  }));
 }));
}
function boxes(body:Body):PartBox[]{const h=(body.spec??VEHICLES[body.kind]).height,shape=VEHICLE_SHAPES[body.kind];return [
 {part:'cockpit' as const,x:0,...shape.cockpit,y:h*.6+shape.cockpit.y,upper:!('track' in shape)},
 ...('gunHousing' in shape?[{part:'leftWeapon' as const,x:0,...shape.gunHousing,y:h*.6+shape.gunHousing.y,upper:true}]:[]),
 ...('roof' in shape?[{part:'cockpit' as const,x:0,...shape.roof,y:h*.6+shape.roof.y,upper:true}]:[]),
 {part:'hull' as const,x:0,...shape.hull,y:h*.6+shape.hull.y,upper:!('track' in shape)&&body.kind!=='merc-meson-tower'&&body.kind!=='scorp-meson-tower'},
 ...([-1,1] as const).map(side=>({part:(side<0?'leftWeapon':'rightWeapon') as BodyPart,...shape.weapon,x:side*shape.weapon.x,y:h*.6+shape.weapon.y,upper:true})),
 ...('chinWeapon' in shape?([-1,1] as const).map(side=>({part:(side<0?'leftWeapon':'rightWeapon') as BodyPart,...shape.chinWeapon,x:side*shape.chinWeapon.x,y:h*.6+shape.chinWeapon.y,upper:true})):[]),
 ...('shoulder' in shape?([-1,1] as const).map(side=>({part:(side<0?'leftLeg':'rightLeg') as BodyPart,...shape.shoulder,x:side*shape.shoulder.x,y:h*.6+shape.shoulder.y,upper:false})):[]),
 ...('upperLeg' in shape?([-1,1] as const).map(side=>({part:(side<0?'leftLeg':'rightLeg') as BodyPart,...shape.upperLeg,x:side*shape.legX,upper:false})):[]),
 ...('brace' in shape?([-1,1] as const).map(side=>({part:'hull' as const,...shape.brace,x:side*shape.brace.x,y:h*.6+shape.brace.y,upper:true})):[]),
 ...('spider' in shape?spiderBoxes():([-1,1] as const).map(side=>({part:(side<0?'leftLeg':'rightLeg') as BodyPart,x:side*shape.legX,y:'track' in shape?shape.track.y:'support' in shape?shape.support.y:h*.25,z:'track' in shape?shape.track.z:'support' in shape?shape.support.z:.4,w:'track' in shape?shape.track.w:'support' in shape?shape.support.w:1.5,h:'track' in shape?shape.track.h:'support' in shape?shape.support.h:h*.5,d:'track' in shape?shape.track.d:'support' in shape?shape.support.d:2,upper:false})))
 ];}
// Enclose all shared part boxes, including weapons and wide legs. A rotation-safe
// horizontal radius keeps both the body and its turning upper assembly outside walls.
export function buildingClearance(body:Body){
 return Math.max(...boxes(body).map(b=>b.segment?Math.max(Math.hypot(b.segment.from.x,b.segment.from.z),Math.hypot(b.segment.to.x,b.segment.to.z))+Math.max(b.w,b.d)/2:Math.hypot(Math.abs(b.x)+b.w/2,Math.abs(b.z)+b.d/2)))+.1;
}
export function intersectParts(body:Body,from:Point,to:Point,padding=0){
 let best:{part:BodyPart;t:number;point:Point}|null=null;
 for(const box of boxes(body)){
  const yaw=body.kind==='scorp-rocket-tower'?0:box.upper&&(body.spec??VEHICLES[body.kind]).torsoLimit!==0?body.aim:body.yaw,c=Math.cos(yaw),s=Math.sin(yaw);
  const local=(p:Point)=>{let y=p.y,z=(p.x-body.x)*s+(p.z-body.z)*c;if((body.kind==='merc-meson-tower'||body.kind==='scorp-meson-tower')&&(box.part==='leftWeapon'||box.part==='rightWeapon')){const pivot=(body.spec??VEHICLES[body.kind]).height*.6+VEHICLE_SHAPES[body.kind].weapon.y,pitch=body.aimPitch??0,relative=y-pivot;y=pivot+relative*Math.cos(pitch)-z*Math.sin(pitch);z=relative*Math.sin(pitch)+z*Math.cos(pitch);}const point={x:(p.x-body.x)*c-(p.z-body.z)*s-box.x,y:y-box.y,z:z-box.z};
    if(box.segment){const a=box.segment.from,b=box.segment.to,dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,length=Math.hypot(dx,dy,dz),flat=Math.hypot(dx,dz),ux=dz/flat,uz=-dx/flat,vx=dy*uz/length,vy=(dz*ux-dx*uz)/length,vz=-dy*ux/length;return {x:point.x*ux+point.z*uz,y:(point.x*dx+point.y*dy+point.z*dz)/length,z:point.x*vx+point.y*vy+point.z*vz};}
    return point;};
  const altitude=body.hoverHeight??((body.spec??VEHICLES[body.kind]) as VehicleSpec).hoverHeight??0;const a=local({...from,y:from.y-altitude}),b=local({...to,y:to.y-altitude});let near=0,far=1;
  for(const [axis,half] of [['x',box.w/2+padding],['y',box.h/2+padding],['z',box.d/2+padding]] as const){const delta=b[axis]-a[axis];if(Math.abs(delta)<1e-9){if(Math.abs(a[axis])>half){far=-1;break;}}else{const t1=(-half-a[axis])/delta,t2=(half-a[axis])/delta;near=Math.max(near,Math.min(t1,t2));far=Math.min(far,Math.max(t1,t2));}}
  if(near<=far&&near>=0&&near<=1&&(!best||near<best.t))best={part:box.part,t:near,point:{x:from.x+(to.x-from.x)*near,y:from.y+(to.y-from.y)*near,z:from.z+(to.z-from.z)*near}};
 }
 return best;
}

// Whole occupied HAWC contact is fatal to infantry, including a swept crossing.
export function sweptVehicleContact(body:Body,previous:{x:number;z:number},from:Point,to:Point,prone=false){
 if(((body.spec??VEHICLES[body.kind]) as VehicleSpec).category==='hovercraft')return false;
 const h=(body.spec??VEHICLES[body.kind]).height,radius=prone?.65:.35,humanHalf=prone?.35:.9,c=Math.cos(body.yaw),s=Math.sin(body.yaw);
 const local=(p:Point,origin:{x:number;z:number})=>({x:(p.x-origin.x)*c-(p.z-origin.z)*s,y:p.y+humanHalf-h/2,z:(p.x-origin.x)*s+(p.z-origin.z)*c});
 const a=local(from,previous),b=local(to,body);let near=0,far=1;
 for(const [axis,half] of [['x',(body.kind.endsWith('-tactical')?3.45:2.95)+radius],['y',h/2+humanHalf],['z',2.1+radius]] as const){
  const delta=b[axis]-a[axis];if(Math.abs(delta)<1e-9){if(Math.abs(a[axis])>half)return false;}else{const t1=(-half-a[axis])/delta,t2=(half-a[axis])/delta;near=Math.max(near,Math.min(t1,t2));far=Math.min(far,Math.max(t1,t2));if(near>far)return false;}
 }
 return near<=far;
}


// Conservative horizontal envelopes for the current procedural HAWC models.
export const vehicleRadius=(kind:VehicleKind)=>kind==='scorp-rocket-tower'?5.7:kind.endsWith('-tactical')?4.1:3.5;
export function vehicleContactFraction(body:Body,to:{x:number;z:number},other:Body):number|null{
 const dx=to.x-body.x,dz=to.z-body.z,ox=body.x-other.x,oz=body.z-other.z;
 const radius=vehicleRadius(body.kind)+vehicleRadius(other.kind),a=dx*dx+dz*dz,b=ox*dx+oz*dz,c=ox*ox+oz*oz-radius*radius;
 if(a<1e-12)return null;
 if(c<=1e-8)return b>=0?null:0; // Let touching/overlapping vehicles retreat.
 const discriminant=b*b-a*c;if(discriminant<0)return null;
 const t=(-b-Math.sqrt(discriminant))/a;return t>=0&&t<=1?t:null;
}
