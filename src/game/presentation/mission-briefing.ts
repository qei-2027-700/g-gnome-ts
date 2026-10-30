import {escapeMissionText as escape,missionMapPanel,missionPreviewPanel,missionObjectiveList} from './mission-panels.ts';
import type {MissionDefinition} from '../content/missions/types.ts';
import {hologramSvg} from './hologram.ts';

// Frame, terrain preview and ASV portrait observed in the supplied mission screen.
const reference=new URL('../../../assets/ui/mission-console.png',import.meta.url).href;

const crop=(image:import('../content/missions/types.ts').BriefingImage,locale:'ja'|'en')=>`<svg viewBox="${escape(image.viewBox)}" role="img" aria-label="${escape(image.label[locale])}"><image href="${escape(image.src)}" width="${image.width}" height="${image.height}"/></svg>`;
export function missionBriefing(mission:MissionDefinition,missions:readonly MissionDefinition[],locale:'ja'|'en'){
 const presentation=mission.briefingPresentation,assigned=mission.units.find(u=>u.id===mission.assignedUnitId)!;
 const labels=presentation?presentation.entries.map(entry=>entry.label[locale]):mission.objectives.length?mission.objectives.map(o=>o.label[locale]):[mission.briefing[locale]];
 return `<section class="mission-console" aria-label="${locale==='ja'?'ミッション開始前':'Mission briefing'}" style="--console-reference:url('${reference}')">
 <div class="console-screen"></div><h1 class="console-title">${escape(mission.id)}: ${escape(presentation?.title??mission.title)}</h1>
 ${missionMapPanel('briefingMap',presentation?.mapPreview?crop(presentation.mapPreview,locale):undefined,'console-map')}
 ${missionPreviewPanel((presentation?.vehiclePreview?crop(presentation.vehiclePreview,locale):hologramSvg(assigned.kind))+'<div id="briefingDetail" hidden aria-live="polite"></div>','console-preview')}
 ${missionObjectiveList(labels.map((label,review)=>({label,review})),'console-orders')}
 <p class="console-hint">[ Click on bulletpoint to review ]</p>
 <label class="console-mission-select"><span>${locale==='ja'?'任務':'MISSION'}</span><select id="missionSelect" aria-label="${locale==='ja'?'任務を選択':'Select mission'}">${missions.map(m=>`<option value="${m.id}" ${m.id===mission.id?'selected':''}>${m.id} · ${escape(m.title)}</option>`).join('')}</select></label>
 <button class="console-button console-launch" data-action="start" aria-label="LAUNCH · ${locale==='ja'?'任務開始':'Start mission'}">LAUNCH</button>
 <button class="console-button console-new" data-action="newMission">NEW</button>
 <button class="console-button console-load" disabled title="Not implemented">LOAD</button>
 <button class="console-button console-save" disabled title="Not implemented">SAVE</button>
 <button class="console-button console-credits" data-action="credits">CREDITS</button>
 <div class="console-tabs"><button data-action="briefing" aria-current="page">GAME</button><button disabled>NETWORK</button><button data-action="loadout">LAB</button><button data-action="settings">OPTIONS</button><button data-action="exitBriefing">EXIT</button></div>
 </section>`;
}
export function briefingDetail(mission:MissionDefinition,index:number,locale:'ja'|'en'){
 return mission.briefingPresentation?.entries[index]?.detail[locale]??mission.objectives[index]?.label[locale]??mission.briefing[locale];
}
