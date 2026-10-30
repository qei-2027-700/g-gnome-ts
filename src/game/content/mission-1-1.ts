// Compatibility export for existing 1-1 fixtures; runtime uses missions/index.ts.
import {MISSION as definition} from './missions/mission-1-1.ts';
const assigned=definition.units.find(u=>u.id===definition.assignedUnitId)!;
export const MISSION={...definition,vehicle:{x:assigned.x,z:assigned.z},waypoint:definition.waypoints[0],bounds:definition.terrain.maxZ,enemies:definition.units.filter(u=>u.id!==assigned.id)};
