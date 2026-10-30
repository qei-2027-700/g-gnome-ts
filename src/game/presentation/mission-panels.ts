import type {Simulation} from '../simulation/simulation.ts';
export const escapeMissionText=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function missionMapPanel(id:string,preview?:string,className=''){
 return `<div class="mission-map-panel ${className}">${preview??`<canvas id="${id}" width="600" height="600" aria-label="Mission map"></canvas>`}</div>`;
}
export function missionPreviewPanel(content:string,className=''){
 return `<div class="mission-preview-panel ${className}">${content}</div>`;
}
export function missionObjectiveText(objective:Simulation['objectiveStates'][number],locale:'ja'|'en'){
 return `${objective.label[locale]}${objective.type==='defend'?` (${locale==='ja'?'耐久':'Integrity'} ${Math.round(objective.integrity*100)}%)`:''}${objective.type!=='reach'?` · ${objective.current}/${objective.total}`:''}`;
}
export function missionObjectiveList(items:readonly {label:string;done?:boolean;review?:number}[],className=''){
 return `<ol class="mission-objective-list ${className}">${items.map(item=>{
  const content=`<span aria-hidden="true">${item.done?'✓':'□'}</span>${escapeMissionText(item.label)}`;
  return `<li>${item.review!==undefined?`<button data-review="${item.review}" aria-pressed="false">${content}</button>`:`<div class="mission-objective"${item.done?' data-complete="true"':''}>${content}</div>`}</li>`;
 }).join('')}</ol>`;
}
