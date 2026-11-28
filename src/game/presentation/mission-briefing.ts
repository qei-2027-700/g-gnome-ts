import {escapeMissionText as escape,missionMapPanel,missionPreviewPanel,missionObjectiveList} from './mission-panels.ts';
import type {MissionDefinition} from '../content/missions/types.ts';
import type {CampaignProgress} from '../progress.ts';
import {hologramSvg} from './hologram.ts';

// Frame, terrain preview and ASV portrait observed in the supplied mission screen.
const reference=new URL('../../../assets/ui/mission-console.png',import.meta.url).href;

const crop=(image:import('../content/missions/types.ts').BriefingImage,locale:'ja'|'en')=>`<svg viewBox="${escape(image.viewBox)}" role="img" aria-label="${escape(image.label[locale])}"><image href="${escape(image.src)}" width="${image.width}" height="${image.height}"/></svg>`;
const clearClock=(seconds:number)=>{const total=Math.max(0,Math.floor(seconds));return `${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;};
export function missionBriefing(mission:MissionDefinition,missions:readonly MissionDefinition[],locale:'ja'|'en',progress?:CampaignProgress){
 const presentation=mission.briefingPresentation,assigned=mission.units.find(u=>u.id===mission.assignedUnitId)!;
 const labels=presentation?presentation.entries.map(entry=>entry.label[locale]):mission.objectives.length?mission.objectives.map(o=>o.label[locale]):[mission.briefing[locale]];
 const clears=progress?.clears??{},clearLabel=locale==='ja'?'クリア':'CLEAR',clearedCount=missions.filter(item=>clears[item.id]).length;
 const listHeading=`${locale==='ja'?'任務を選択':'SELECT MISSION'}${clearedCount?` · ${clearedCount} ${clearLabel}`:''}`;
 const selectedLabel=`${escape(mission.id)} · ${escape(mission.title)}${clears[mission.id]?` · ${clearLabel}`:''}`;
 const option=(item:MissionDefinition)=>{
  const clear=clears[item.id];
  const mark=clear?` data-cleared="true" title="${escape(`${clear.difficulty} · ${clearClock(clear.timeSeconds)}`)}"`:'';
  return `<button data-action="selectMission:${escape(item.id)}" ${item.id===mission.id?'aria-current="true"':''}${mark}><span>${escape(item.id)}</span><span>${escape(item.title)}</span>${clear?`<span class="mission-clear">${clearLabel}</span>`:''}</button>`;
 };
 return `<section class="mission-console" aria-label="${locale==='ja'?'ミッション開始前':'Mission briefing'}" style="--console-reference:url('${reference}')">
 <div class="console-screen"></div><h1 class="console-title">${escape(mission.id)}: ${escape(presentation?.title??mission.title)}</h1>
 ${missionMapPanel('briefingMap',presentation?.mapPreview?crop(presentation.mapPreview,locale):undefined,'console-map')}
 ${missionPreviewPanel((presentation?.vehiclePreview?crop(presentation.vehiclePreview,locale):hologramSvg(assigned.kind))+'<div id="briefingDetail" hidden aria-live="polite"></div>','console-preview')}
 ${missionObjectiveList(labels.map((label,review)=>({label,review})),'console-orders')}
 <p class="console-hint">[ Click on bulletpoint to review ]</p>
 <div class="console-mission-select"><span>${locale==='ja'?'任務':'MISSION'}</span><button id="missionSelect" data-action="loadMissions" aria-haspopup="dialog" aria-controls="missionList">${selectedLabel}</button></div>
 <button class="console-button console-launch" data-action="start" aria-label="LAUNCH · ${locale==='ja'?'任務開始':'Start mission'}">LAUNCH</button>
 <button class="console-button console-new" data-action="newMission">NEW</button>
 <button class="console-button console-load" data-action="loadMissions">LOAD</button>
 <button class="console-button console-save" disabled title="Not implemented">SAVE</button>
 <button class="console-button console-credits" data-action="credits">CREDITS</button>
 <div class="console-tabs"><button data-action="briefing" aria-current="page">GAME</button><button disabled>NETWORK</button><button data-action="loadout">LAB</button><button data-action="settings">OPTIONS</button><button data-action="exitBriefing">EXIT</button></div>
 <div id="missionList" class="console-mission-list" role="dialog" aria-modal="true" aria-label="${locale==='ja'?'任務を選択':'Select mission'}" hidden><div class="console-mission-list-header"><strong>${listHeading}</strong><button data-action="closeMissions" aria-label="${locale==='ja'?'閉じる':'Close'}">×</button></div><div class="console-mission-options">${missions.map(option).join('')}</div></div>
 </section>`;
}
export function briefingDetail(mission:MissionDefinition,index:number,locale:'ja'|'en'){
 return mission.briefingPresentation?.entries[index]?.detail[locale]??mission.objectives[index]?.label[locale]??mission.briefing[locale];
}
