import type {MissionDefinition} from '../content/missions/types.ts';
// User-tuned distance for C rear views, including mission-specific framing.
export const REAR_CAMERA_DISTANCE_SCALE=1.25;
export function initialCameraMode(view:MissionDefinition['initialView'],aboard=false){if(aboard)return 0;return view==='external-rear'?2:view==='external-diagonal'?1:0;}
export function toggleCamera(mode:number,view:'rear'|'diagonal'):number{
 const next=view==='rear'?2:1;
 return mode===next?0:next;
}
