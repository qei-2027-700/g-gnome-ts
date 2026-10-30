export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type Locale = 'ja' | 'en';
export const DEFAULT_BINDINGS: Record<string,string> = {forward:'KeyW',back:'KeyS',left:'KeyA',right:'KeyD',lookUp:'PageUp',lookDown:'PageDown',stop:'Enter',center:'Space',boost:'ShiftLeft',fire1:'Digit1',fire2:'Digit2',fire3:'Digit3',fire4:'Digit4',board:'KeyF',eject:'Backspace',camera:'KeyC',cameraDiagonal:'KeyZ',map:'KeyB',waypoint:'KeyR',target:'KeyE',targetCursor:'KeyQ',track:'KeyT',prone:'KeyJ',pause:'KeyP',comm:'KeyG'};
export type Settings = {difficulty:Difficulty;locale:Locale;sfx:number;voice:number;music:number;sensitivity:number;bindings:Record<string,string>};
export const defaults = (): Settings => ({difficulty:'Easy',locale:'ja',sfx:.5,voice:.65,music:.4,sensitivity:1,bindings:{...DEFAULT_BINDINGS}});
export function validateSettings(raw:unknown): Settings {
  const d=defaults(); if(!raw || typeof raw!=='object') return d;
  const r=raw as Partial<Settings>;
  if(['Easy','Medium','Hard'].includes(r.difficulty??'')) d.difficulty=r.difficulty!;
  if(r.locale==='en') d.locale='en';
  for(const key of ['sfx','voice','music','sensitivity'] as const) if(typeof r[key]==='number' && Number.isFinite(r[key])) d[key]=Math.max(0,Math.min(key==='sensitivity'?2:1,r[key]!));
  if(r.bindings && typeof r.bindings==='object') {
    // Merge old saves so newly added actions do not erase existing bindings.
    const stored={...r.bindings};
    if(stored.forward==='ArrowUp')delete stored.forward;
    if(stored.back==='ArrowDown')delete stored.back;
    if(stored.lookUp==='ArrowUp')stored.lookUp='PageUp';
    if(stored.lookDown==='ArrowDown')stored.lookDown='PageDown';
    if(stored.stop==='Space')stored.stop='Enter';
    const merged={...d.bindings,...stored};
    const spareKeys=['Digit5','Digit6','Digit7','Digit8','Digit9','KeyL','KeyH','KeyV','KeyK','KeyN','KeyM'];
    for(const action of Object.keys(DEFAULT_BINDINGS))if(!(action in stored)&&Object.values(stored).includes(merged[action])){const spare=spareKeys.find(key=>!Object.values(merged).includes(key));if(spare)merged[action]=spare;}
    const values=Object.values(merged);
    if(new Set(values).size===values.length && Object.keys(merged).every(k=>k in DEFAULT_BINDINGS)&&Object.entries(merged).every(([key,value])=>(!['Enter','NumpadEnter'].includes(value)||key==='stop')&&(value!=='KeyZ'||key==='cameraDiagonal')&&(value!=='Space'||key==='center')&&(value!=='ArrowUp'||key==='lookUp')&&(value!=='ArrowDown'||key==='lookDown')&&(value!=='ArrowLeft'||key==='left')&&(value!=='ArrowRight'||key==='right')) && values.every(v=>typeof v==='string'&&!['KeyU','KeyI','KeyO','KeyX'].includes(v)&&/^(Key[A-Z]|Digit[0-9]|Space|Enter|NumpadEnter|ShiftLeft|ShiftRight|Backspace|PageUp|PageDown|Arrow(Up|Down|Left|Right))$/.test(v)))
      d.bindings=merged;
  } return d;
}
