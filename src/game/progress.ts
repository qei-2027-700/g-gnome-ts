import type {Difficulty} from './settings.ts';

// Clear records and the last selected mission. Separate from gnome.settings.v1.
// Preview sorties and corrupt rows are dropped. Mid-mission saves are not stored.
export const CAMPAIGN_STORAGE_KEY='gnome.progress.v1';
const DIFFICULTIES=new Set<Difficulty>(['Easy','Medium','Hard']);
const MISSION_ID=/^\d+-\d+$/;

export type MissionClear={difficulty:Difficulty;timeSeconds:number;clearedAt:string};
export type CampaignProgress={lastMissionId:string|null;clears:Record<string,MissionClear>};
export type ProgressStorage={getItem(key:string):string|null;setItem(key:string,value:string):void};

export function emptyProgress():CampaignProgress{return {lastMissionId:null,clears:{}};}

function known(id:string,knownIds?:ReadonlySet<string>){return knownIds?knownIds.has(id):MISSION_ID.test(id);}

function parseClear(value:unknown):MissionClear|null{
 if(!value||typeof value!=='object')return null;
 const row=value as Partial<MissionClear>;
 if(!DIFFICULTIES.has(row.difficulty as Difficulty))return null;
 if(typeof row.timeSeconds!=='number'||!Number.isFinite(row.timeSeconds)||row.timeSeconds<0)return null;
 if(typeof row.clearedAt!=='string'||Number.isNaN(Date.parse(row.clearedAt)))return null;
 return {difficulty:row.difficulty as Difficulty,timeSeconds:row.timeSeconds,clearedAt:row.clearedAt};
}

export function loadCampaignProgress(raw:unknown,knownIds?:ReadonlySet<string>):CampaignProgress{
 const progress=emptyProgress();
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return progress;
 const record=raw as {lastMissionId?:unknown;clears?:unknown};
 if(typeof record.lastMissionId==='string'&&known(record.lastMissionId,knownIds))progress.lastMissionId=record.lastMissionId;
 if(!record.clears||typeof record.clears!=='object'||Array.isArray(record.clears))return progress;
 for(const [id,value] of Object.entries(record.clears)){
  const clear=parseClear(value);
  if(clear&&known(id,knownIds))progress.clears[id]=clear;
 }
 return progress;
}

export function recordMissionClear(progress:CampaignProgress,entry:{id:string;difficulty:Difficulty;timeSeconds:number;clearedAt?:string},knownIds?:ReadonlySet<string>):CampaignProgress{
 const clear=parseClear({difficulty:entry.difficulty,timeSeconds:entry.timeSeconds,clearedAt:entry.clearedAt??new Date().toISOString()});
 if(!clear||!known(entry.id,knownIds))return progress;
 return {lastMissionId:entry.id,clears:{...progress.clears,[entry.id]:clear}};
}

export function rememberMission(progress:CampaignProgress,id:string,knownIds?:ReadonlySet<string>):CampaignProgress{
 if(!known(id,knownIds)||progress.lastMissionId===id)return progress;
 return {...progress,lastMissionId:id};
}

export function readCampaignProgress(storage:ProgressStorage,knownIds?:ReadonlySet<string>):CampaignProgress{
 try{return loadCampaignProgress(JSON.parse(storage.getItem(CAMPAIGN_STORAGE_KEY)??'null'),knownIds);}
 catch{return emptyProgress();}
}

export function writeCampaignProgress(storage:ProgressStorage,progress:CampaignProgress){
 try{storage.setItem(CAMPAIGN_STORAGE_KEY,JSON.stringify(progress));return true;}
 catch{return false;}
}
