import {PART_DAMAGE_THRESHOLDS} from '../simulation/parts.ts';
export const partColor=(health:number)=>health>PART_DAMAGE_THRESHOLDS.yellow?'#72ff75':health>PART_DAMAGE_THRESHOLDS.critical?'#ffe000':'#ff0000';
