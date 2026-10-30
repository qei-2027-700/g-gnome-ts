import type {Settings} from './settings.ts';
import type {Input} from './simulation/simulation.ts';
export function readInput(settings:Settings,keys:ReadonlySet<string>,mouseFire=false,externalVehicle=false):Input {
  const b=settings.bindings;
  const has=(code:string)=>keys.has(code)&&!['ArrowUp','ArrowDown'].includes(code)&&(!externalVehicle||!code.startsWith('Arrow'));
  return {forward:has(b.forward),back:has(b.back),left:has(b.left)||keys.has('ArrowLeft'),right:has(b.right)||keys.has('ArrowRight'),lookUp:keys.has('ArrowUp')||has(b.lookUp),lookDown:keys.has('ArrowDown')||has(b.lookDown),stop:has(b.stop)||has('Enter')||has('NumpadEnter'),center:has(b.center),boost:has(b.boost),fire1:has(b.fire1)||mouseFire,fire2:has(b.fire2),fire3:has(b.fire3),fire4:has(b.fire4)};
}
