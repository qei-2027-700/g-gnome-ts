import type {Facility,FacilityType} from '../simulation/facilities.ts';
// Green is a targeting display, not the facility's paint color.
const FACILITY_HOLOGRAMS:Record<FacilityType,{label:string;command:boolean}>={
 citadel:{label:'Citadel',command:true},
 'power-plant':{label:'電力施設',command:false},
 'comm-array':{label:'Latlon通信基地',command:false},
 'bridge-control':{label:'Bridge Control Building',command:true},
 command:{label:'司令部',command:true},
 'mine-control':{label:'地雷原コントロール設備',command:false},
 'shield-generator':{label:'シールドジェネレーター',command:false},
 'sweep-turret':{label:'スイープタレット',command:false},
};
export function facilityHologramSvg(kind:Facility['facilityType']){
 const {command,label}=FACILITY_HOLOGRAMS[kind];
 const body=command?'<path d="M29 57H130V102H29ZM20 57L39 41H119L141 57ZM46 42L55 27H104L116 42ZM54 27V19H104V27M36 39V25H42V39M116 39V25H122V39M64 19V9M79 19V5M94 19V11M63 102V81H91V102M37 68H51V78H37ZM108 68H122V78H108Z"/>':'<path d="M15 61H145V101H15ZM8 61L23 47H133L152 61ZM25 47V36H48V47M110 47V36H132V47M70 47V26H91V47M76 26V12M73 101V79H91V101"/>';
 const windows=Array.from({length:command?6:10},(_,i)=>`<path d="M${command?35+i*15:20+i*12} 65v7m-2 19h5"/>`).join('');
 return `<svg viewBox="0 0 160 120" role="img" aria-label="${label}ホログラム"><g fill="#155b16" stroke="#65ff3b" stroke-width="1.5" stroke-linejoin="round">${body}</g><g fill="none" stroke="#78ff4c" stroke-width="1">${windows}<path d="M23 105H139M33 96H126M43 53H119M35 59V101M125 59V101"/></g></svg>`;
}
