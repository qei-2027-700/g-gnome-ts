import type {Simulation} from '../simulation/simulation.ts';

// Fixed towers turn only their upper assembly; other vehicles retain chassis-relative radar.
export function radarPoint(sim:Pick<Simulation,'mounted'|'passenger'|'player'|'yaw'|'aim'>,target:{x:number;z:number},range:number){
 const carrier=sim.mounted??sim.passenger,heading=carrier?.spec.category==='tower'?sim.aim:sim.yaw;
 const dx=target.x-sim.player.x,dz=target.z-sim.player.z,cos=Math.cos(heading),sin=Math.sin(heading);
 return {x:200+(dx*cos-dz*sin)/range*180,y:130-(dx*sin+dz*cos)/range*95};
}
