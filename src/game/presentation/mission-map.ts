import {facilityHologramSvg} from './facility-hologram.ts';
import {isVehicle,isFacility,type Simulation} from '../simulation/simulation.ts';
import {hologramSvg} from './hologram.ts';
import {escapeMissionText,missionMapPanel,missionPreviewPanel,missionObjectiveList,missionObjectiveText} from './mission-panels.ts';
import {riverFrameAtZ,riverSamples,terrainRivers} from '../content/missions/river.ts';
import type {BriefingImage} from '../content/missions/types.ts';
const mapImages=new Map<string,HTMLImageElement>();
export function projectMapImagePoint(image:BriefingImage,point:{x:number;z:number}){
 const projection=image.mapProjection;if(!projection)return null;
 const [cropX,cropY,cropWidth,cropHeight]=image.viewBox.split(/\s+/).map(Number);
 const dx=point.x-projection.worldOrigin.x,dz=point.z-projection.worldOrigin.z;
 const px=projection.pixelOrigin.x+dx*projection.pixelPerWorldX.x+dz*projection.pixelPerWorldZ.x;
 const py=projection.pixelOrigin.y+dx*projection.pixelPerWorldX.y+dz*projection.pixelPerWorldZ.y;
 return {x:(px-cropX)/cropWidth!,y:(py-cropY)/cropHeight!};
}
export function missionMapObjectives(sim:Simulation,locale:'ja'|'en'){
 if(sim.mission.completionEnabled===false)return `<div class="mission-objective-list"><p>${escapeMissionText(sim.mission.briefing[locale])}</p></div>`;
 if(sim.mission.briefingPresentation?.mapPreview){
  const entries=sim.mission.briefingPresentation.entries;
  return missionObjectiveList(entries.map((entry,i)=>({label:entry.label[locale],done:i===0||i===4?sim.reachedWaypoints.has(3):i===1?sim.airSupportUsed>0:sim.reachedWaypoints.has(i-1)})));
 }
 if(!sim.objectiveStates.length)return `<div class="mission-objective-list"><p>${escapeMissionText(sim.mission.briefing[locale])}</p></div>`;
 return missionObjectiveList(sim.objectiveStates.map(o=>({label:missionObjectiveText(o,locale),done:o.done})));
}
export function missionMap(sim:Simulation,locale:'ja'|'en'){
 const ja=locale==='ja';
 return `<section class="mission-map-modal" role="dialog" aria-labelledby="missionMapTitle">
 <header><span>${ja?'任務中の地図':'MISSION MAP'} · ${sim.mission.id}</span><button data-action="close" aria-label="${ja?'任務へ戻る':'Resume mission'}">×</button></header>
 <h1 id="missionMapTitle">${escapeMissionText(sim.mission.title)}</h1>
 <div class="mission-map-layout">${missionMapPanel('map')}<div class="mission-map-info">
 ${missionPreviewPanel(mapPreview(sim),'map-vehicle-preview')}
 <h2>${ja?'任務目標':'OBJECTIVES'}</h2><div id="mapObjectives">${missionMapObjectives(sim,locale)}</div>
 </div></div>
 <footer><p>${missionMapLegend(sim,locale)}<br>${ja?'3D地形の座標は仮設定。地図表示中も任務は進行します。':'3D terrain coordinates are provisional. Mission remains live.'}</p><button data-action="close">${ja?'任務へ戻る · B / Esc':'RESUME · B / Esc'}</button></footer>
 </section>`;
}
function mapPreview(sim:Simulation){
 const unit=sim.target??sim.mounted??sim.passenger;
 return unit&&isFacility(unit)?`<span>${escapeMissionText(unit.name)}</span>${facilityHologramSvg(unit.facilityType)}`:unit&&isVehicle(unit)?`<span>${escapeMissionText(unit.spec.name)}</span>${hologramSvg(unit.kind,unit.parts)}`:'<span>INFANTRY</span>';
}
function missionMapLegend(sim:Simulation,locale:'ja'|'en'){
 if(sim.mission.id==='3-4')return locale==='ja'?'丸囲みX：現在地　青：川と橋　緑：ウェイポイント　黄：最終地点':'Circled X: You · Blue: River and bridge · Green: Waypoints · Yellow: Endpoint';
 if(sim.mission.briefingPresentation?.mapPreview)return locale==='ja'?'X：現在地　青：橋　緑：ウェイポイント　赤：マグマ':'X: You · Blue: Bridges · Green: Waypoints · Red: Lava';
 return locale==='ja'?'X：現在地　数字：ウェイポイント　赤：敵　青：無人機　緑：味方':'X: You · Numbers: Waypoints · Red: Enemy · Blue: Empty · Green: Friendly';
}
export function drawMissionMap(sim:Simulation,c:HTMLCanvasElement){
 const mission=sim.mission,terrain=mission.terrain,ctx=c.getContext('2d')!;
 const preview=mission.briefingPresentation?.mapPreview,source=preview?.src;
 if(source){
  let photo=mapImages.get(source);
  if(!photo){photo=new Image();mapImages.set(source,photo);photo.src=source;}
  const image=photo;
  const paint=()=>{ctx.fillStyle='#090d08';ctx.fillRect(0,0,c.width,c.height);ctx.imageSmoothingEnabled=false;
   if(preview?.mapProjection){const [sx,sy,sw,sh]=preview.viewBox.split(/\s+/).map(Number);ctx.drawImage(image,sx!,sy!,sw!,sh!,0,0,c.width,c.height);}else ctx.drawImage(image,0,0,c.width,c.height);
   const projected=preview?projectMapImagePoint(preview,sim.player):null;
   const px=projected?c.width*projected.x:c.width*(.5+(sim.player.x-mission.player.x)/1070),py=projected?c.height*projected.y:c.height*(.17+(mission.player.z-sim.player.z)/1400);
   if(preview?.mapProjection){ctx.beginPath();ctx.arc(px,py,14,0,Math.PI*2);ctx.fillStyle='#08120a';ctx.fill();ctx.strokeStyle='#fff59b';ctx.lineWidth=3;ctx.stroke();}
   ctx.font='bold 24px monospace';ctx.fillStyle='#fff59b';ctx.fillText('X',px-8,py+8);};
  if(image.complete&&image.naturalWidth)paint();else image.onload=paint;return;
 }
ctx.fillStyle=terrain.biome==='snow'?'#a6bbc8':'#141d16';ctx.fillRect(0,0,600,600);ctx.strokeStyle=terrain.biome==='snow'?'#7a96aa':'#344635';for(let i=0;i<600;i+=40){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,600);ctx.moveTo(0,i);ctx.lineTo(600,i);ctx.stroke();}const scale=Math.min(540/(terrain.halfWidth*2),500/(terrain.maxZ-terrain.minZ)),mapPoint=(x:number,z:number)=>({x:300+x*scale,y:550-(z-terrain.minZ)*scale});for(const cliff of terrain.cliffs??[]){const center=mapPoint(cliff.x,cliff.z),width=cliff.width*scale,depth=cliff.depth*scale;ctx.fillStyle=terrain.biome==='snow'?'#708d9f':terrain.biome==='grassland'?'#83c970':'#9d783e';ctx.fillRect(center.x-width/2,center.y-depth/2,width,depth);ctx.strokeStyle=terrain.biome==='snow'?'#c3d6e0':terrain.biome==='grassland'?'#b4ed8c':'#d0b779';ctx.lineWidth=2;ctx.strokeRect(center.x-width/2,center.y-depth/2,width,depth);}for(const r of terrainRivers(terrain)){const samples=riverSamples(r,Math.max(4,r.width/5));ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();samples.forEach((point,i)=>{const p=mapPoint(point.x,point.z);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.strokeStyle='#ad9f79';ctx.lineWidth=(r.width+28)*scale;ctx.stroke();ctx.strokeStyle=r.surface==='lava'?'#d74712':'#286b9e';ctx.lineWidth=r.width*scale;ctx.stroke();const bridge=riverFrameAtZ(r,r.bridgeZ),normal={x:bridge.tz,z:-bridge.tx},a=mapPoint(bridge.x-normal.x*(r.width/2+9),bridge.z-normal.z*(r.width/2+9)),b=mapPoint(bridge.x+normal.x*(r.width/2+9),bridge.z+normal.z*(r.width/2+9));ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='#c5bc96';ctx.lineWidth=Math.max(2,r.bridgeWidth*scale);ctx.stroke();}const plot=(x:number,z:number,label:string,color:string)=>{ctx.fillStyle=color;ctx.font='bold 18px monospace';ctx.fillText(label,300+x*scale-5,550-(z-terrain.minZ)*scale);};if(mission.base){const base=mission.base;for(const building of base.buildings){ctx.fillStyle=sim.facilities.find(f=>f.id===sim.selected&&f.x===building.x&&f.z===building.z)?'#ffe36c':'#85927d';ctx.fillRect(300+(building.x-building.width/2)*scale,550-(building.z+building.depth/2-terrain.minZ)*scale,building.width*scale,building.depth*scale);plot(building.x,building.z,building.kind==='bridge-control'?'BRIDGE':building.kind==='citadel'?'CITA':building.kind==='power-plant'?'PWR':building.kind==='mine-control'||building.kind==='popup-turret-control'?'CTRL':'HQ','#dae1cf');}if(!base.buildings.some(b=>b.name===base.name))plot(base.x,base.z,base.name,'#dae1cf');}for(const field of mission.minefields??[]){ctx.fillStyle='#b9232390';ctx.fillRect(300+(field.x-field.width/2)*scale,550-(field.z+field.depth/2-terrain.minZ)*scale,field.width*scale,field.depth*scale);}for(const mine of sim.detectedMines)plot(mine.x,mine.z,'·','#ff5148');for(const r of mission.rocks)plot(r.x,r.z,'●','#766644');for(const u of sim.combatTargets)if(u.alive)plot(u.x,u.z,isVehicle(u)?u.pilot?'■':'□':'●',u===sim.mounted?'#8afba7':isVehicle(u)&&!u.pilot?'#5ac6ff':sim.isHostile(u)?'#f7785c':'#8afba7');for(const wp of mission.waypoints)plot(wp.x,wp.z,String(wp.id),'#f9da72');plot(sim.player.x,sim.player.z,'X','#fff');ctx.fillStyle=terrain.biome==='snow'?'#253d50':'#a6b99b';ctx.font='14px monospace';ctx.fillText(`N ↑   ${mission.title}`,20,28);ctx.fillText(`0 ━━━━━ 100 m`,20,580);
}
