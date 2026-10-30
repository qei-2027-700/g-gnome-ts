import type {Simulation,Input} from './simulation/simulation.ts';
export function pausesSimulation(panel:string|null){return panel!==null&&panel!=='map'&&panel!=='comm'&&panel!=='abort';}
export function advanceSimulation(sim:Simulation,panel:string|null,dt:number,input:Input){
 if(pausesSimulation(panel))return 0;
 const controls:Input=panel==='abort'?{forward:false,back:false,left:false,right:false,boost:false,stop:false,fire1:false,fire2:false}:input;
 sim.tick(dt,controls);return dt;
}

// In-progress missions may show their map, never the pre-launch console.
export function resolveMissionPanel(next:string|null,launched:boolean,ended:boolean){
 if(!launched&&next!=='settings'&&next!=='exit')return 'briefing';
 if(launched&&!ended&&next==='briefing')return 'map';
 return next;
}
