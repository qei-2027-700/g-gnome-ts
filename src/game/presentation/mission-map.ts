import {facilityHologramSvg} from './facility-hologram.ts';
import {isVehicle,isFacility,type Simulation} from '../simulation/simulation.ts';
import {hologramSvg} from './hologram.ts';
import {escapeMissionText,missionMapPanel,missionPreviewPanel,missionObjectiveList,missionObjectiveText} from './mission-panels.ts';
export function missionMapObjectives(sim:Simulation,locale:'ja'|'en'){
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
 <footer><p>${ja?'X：現在地　数字：ウェイポイント　赤：敵　青：無人機　緑：味方':'X: You · Numbers: Waypoints · Red: Enemy · Blue: Empty · Green: Friendly'}<br>${ja?'地形・配置は仮設定。地図表示中も任務は進行します。':'Provisional terrain and placement. Mission remains live.'}</p><button data-action="close">${ja?'任務へ戻る · B / Esc':'RESUME · B / Esc'}</button></footer>
 </section>`;
}
function mapPreview(sim:Simulation){
 const unit=sim.target??sim.mounted??sim.passenger;
 return unit&&isFacility(unit)?`<span>${escapeMissionText(unit.name)}</span>${facilityHologramSvg(unit.facilityType)}`:unit&&isVehicle(unit)?`<span>${escapeMissionText(unit.spec.name)}</span>${hologramSvg(unit.kind,unit.parts)}`:'<span>INFANTRY</span>';
}
export function drawMissionMap(sim:Simulation,c:HTMLCanvasElement){
 const mission=sim.mission,terrain=mission.terrain,ctx=c.getContext('2d')!;
ctx.fillStyle=terrain.biome==='snow'?'#a6bbc8':'#141d16';ctx.fillRect(0,0,600,600);ctx.strokeStyle=terrain.biome==='snow'?'#7a96aa':'#344635';for(let i=0;i<600;i+=40){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,600);ctx.moveTo(0,i);ctx.lineTo(600,i);ctx.stroke();}const scale=Math.min(540/(terrain.halfWidth*2),500/(terrain.maxZ-terrain.minZ));for(const cliff of terrain.cliffs??[]){ctx.fillStyle=terrain.biome==='snow'?'#40586c':'#9d783e';ctx.fillRect(300+(cliff.x-cliff.width/2)*scale,550-(cliff.z+cliff.depth/2-terrain.minZ)*scale,cliff.width*scale,cliff.depth*scale);}if(terrain.river){const r=terrain.river;ctx.fillStyle='#286b9e';ctx.fillRect(300+(r.x-r.width/2)*scale,550-(r.z+r.length/2-terrain.minZ)*scale,r.width*scale,r.length*scale);ctx.fillStyle='#c5bc96';ctx.fillRect(300+(r.x-r.width/2-9)*scale,550-(r.bridgeZ+r.bridgeWidth/2-terrain.minZ)*scale,(r.width+18)*scale,r.bridgeWidth*scale);}const plot=(x:number,z:number,label:string,color:string)=>{ctx.fillStyle=color;ctx.font='bold 18px monospace';ctx.fillText(label,300+x*scale-5,550-(z-terrain.minZ)*scale);};if(mission.base){const base=mission.base;for(const building of base.buildings){ctx.fillStyle=sim.facilities.find(f=>f.id===sim.selected&&f.x===building.x&&f.z===building.z)?'#ffe36c':'#85927d';ctx.fillRect(300+(building.x-building.width/2)*scale,550-(building.z+building.depth/2-terrain.minZ)*scale,building.width*scale,building.depth*scale);plot(building.x,building.z,building.kind==='bridge-control'?'BRIDGE':building.kind==='citadel'?'CITA':building.kind==='power-plant'?'PWR':building.kind==='mine-control'?'CTRL':'HQ','#dae1cf');}if(!base.buildings.some(b=>b.name===base.name))plot(base.x,base.z,base.name,'#dae1cf');}for(const field of mission.minefields??[]){ctx.fillStyle='#b9232390';ctx.fillRect(300+(field.x-field.width/2)*scale,550-(field.z+field.depth/2-terrain.minZ)*scale,field.width*scale,field.depth*scale);}for(const mine of sim.detectedMines)plot(mine.x,mine.z,'·','#ff5148');for(const r of mission.rocks)plot(r.x,r.z,'●','#766644');for(const u of sim.combatTargets)if(u.alive)plot(u.x,u.z,isVehicle(u)?u.pilot?'■':'□':'●',u===sim.mounted?'#8afba7':isVehicle(u)&&!u.pilot?'#5ac6ff':sim.isHostile(u)?'#f7785c':'#8afba7');for(const wp of mission.waypoints)plot(wp.x,wp.z,String(wp.id),'#f9da72');plot(sim.player.x,sim.player.z,'X','#fff');ctx.fillStyle=terrain.biome==='snow'?'#253d50':'#a6b99b';ctx.font='14px monospace';ctx.fillText(`N ↑   ${mission.title}`,20,28);ctx.fillText(`0 ━━━━━ 100 m`,20,580);
}
