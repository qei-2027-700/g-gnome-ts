import type {VehicleKind} from '../content/vehicles.ts';
import {freshParts,type PartState,type BodyPart} from '../simulation/parts.ts';
import {partColor} from './part-color.ts';
export function hologramSvg(kind:VehicleKind,parts:PartState=freshParts(),crewName=''):string {
 const heavy=kind.endsWith('-tactical'),merc=kind==='merc-sentry'||kind==='scorp-sentry';
 const paths:Record<BodyPart,string>={
  hull:heavy?'M54 48h52v10H54z M63 58h34v12H63z M48 65h64v8H48z':merc?'M53 45h54v19l-14 8H67l-14-8z M70 49h20v14H70z':'M55 44l10-7h30l10 7-8 24H63z M68 65l12 10 12-10',
  cockpit:heavy?'M57 20h46l-7 25H64z M55 16h50v5H55z':merc?'M51 10h58v36H51z M55 15h50l-4 23H59z M48 8h64v5H48z':'M67 39h26v20H67z M70 42h20v11H70z',
  leftWeapon:heavy?'M17 11h23l6 11v15H18z M20 16h18v12H20z M39 23h19v5H39z':merc?'M19 35l7-7h23v21H24l-5-6z M27 49v12h7V49':'M22 26l8-8h17l10 10-6 17H24z M25 29h26 M34 45v12h6V45',
  rightWeapon:heavy?'M120 11h23l-1 26h-28V22z M123 16h17v12h-17z M102 23h19v5h-19z':merc?'M111 28h23l7 7v8l-5 6h-25z M126 49v12h7V49':'M103 28l10-10h17l8 8-2 19h-27z M109 29h26 M120 45v12h6V45',
  leftLeg:heavy?'M48 67h19l-5 15 2 17H39V81z M40 84h23 M40 93h23 M34 99h33v7H34z':merc?'M52 54h18l-8 23 2 18H39V81l8-11z M42 80h19 M40 86h22 M36 96h30v7H36z':'M35 43h18l7 23-7 17v14H30V82l8-17z M32 83h20 M32 91h20 M27 97h29v6H27z',
  rightLeg:heavy?'M93 67h19l9 14v18H96l2-17z M97 84h23 M97 93h23 M93 99h33v7H93z':merc?'M90 54h18l5 16 8 11v14H96l2-18z M99 80h19 M98 86h22 M94 96h30v7H94z':'M107 43h18l-3 22 8 17v15h-23V83l-7-17z M108 83h20 M108 91h20 M104 97h29v6h-29z'

 };
 if(kind==='union-tactical')Object.assign(paths,{
 leftLeg:'M49 59h15l-5 22 1 18H44V80z M45 84h14 M44 93h15 M40 99h24v7H40z',
 rightLeg:'M96 59h15l5 21v19h-16l1-18z M101 84h14 M101 93h15 M96 99h24v7H96z'
 });
 if(kind==='union-sentry')Object.assign(paths,{
 hull:'M43 31l24 22h26l24-22-5-5-24 19H72L48 26z M64 57h32l-8 15H72z',
 cockpit:'M65 45h30v18H65z M69 48h22v10H69z',
 leftWeapon:'M61 64h14v12H61z M64 76v8h7v-8',
 rightWeapon:'M85 64h14v12H85z M88 76v8h7v-8',
 leftLeg:'M18 18l8-7h22l9 10v18H20z M23 24h29 M30 39h14l3 33-5 17v11H28V82l5-17z M28 83h16 M27 92h17 M22 100h28v6H22z',
 rightLeg:'M103 21l9-10h22l8 7-2 21h-37z M108 24h29 M116 39h14l-3 26 5 17v18h-14V89l-5-17z M116 83h16 M116 92h17 M110 100h28v6h-28z'
 });
 if(kind.endsWith('-asv'))Object.assign(paths,{
 hull:'M42 42h76l9 29-10 13H43L33 71z M48 49h64v22H48z',
 cockpit:'M59 25h42l8 18H51z M65 30h30v10H65z',
 leftWeapon:'M43 30h12v26H43z M46 15h6v15',rightWeapon:'M105 30h12v26h-12z M108 15h6v15',
 leftLeg:'M19 40h21v57H19z M24 45v47 M34 45v47 M19 54h21 M19 67h21 M19 80h21',
 rightLeg:'M120 40h21v57h-21z M125 45v47 M135 45v47 M120 54h21 M120 67h21 M120 80h21'
 });
 if(kind==='scorp-asv')Object.assign(paths,{
 hull:'M39 45l22-17h38l22 17-9 10H48z M55 40h50l-8 13H63z',
 cockpit:'M65 22h30l8 12H57z M70 14h20l8 8H62z',
 leftWeapon:'M53 19h12v9H53z M56 11h6v8',rightWeapon:'M95 19h12v9H95z M98 11h6v8',
 leftLeg:'M17 42h31v51H17z M21 48h23 M21 55h23 M21 62h23 M21 69h23 M21 76h23 M21 83h23',
 rightLeg:'M112 42h31v51h-31z M116 48h23 M116 55h23 M116 62h23 M116 69h23 M116 76h23 M116 83h23'
 });
 if(kind==='merc-cruiser')Object.assign(paths,{hull:'M69 35h22l4 20H65z',cockpit:'M67 10h26l-5 27H72z',leftWeapon:'M61 27h8v18h-8z',rightWeapon:'M91 27h8v18h-8z',leftLeg:'M68 45L25 27l-9 67h5l10-59 36 21M70 50L53 72l-3 34h5l4-31 15-17',rightLeg:'M92 45l43-18 9 67h-5l-10-59-36 21M90 50l17 22 3 34h-5l-4-31-15-17'});
 if(kind==='merc-aip'||kind==='union-aip')Object.assign(paths,{hull:'M12 77L80 44 148 77 80 89Z',cockpit:'M61 61L72 43H88L99 61 80 70Z',leftWeapon:'M35 69h10v12H35Z',rightWeapon:'M115 69h10v12h-10Z',leftLeg:'',rightLeg:''});
 if(kind==='merc-assault')Object.assign(paths,{
 hull:'M42 57l38-9 38 9-12 15H54z M54 57h52v9H54z',
 cockpit:'M64 39h32l8 14H56z M69 43h22v7H69z',
 leftWeapon:'M32 33h22v9H32z M29 37H16v6h24',rightWeapon:'M106 33h22v9h-22z M120 37h24v6h-13',
 leftLeg:'M55 57L24 12 9 101h9l12-68 23 31 M65 65L43 24 29 105h8l10-58 15 24',
 rightLeg:'M105 57l31-45 15 89h-9l-12-68-23 31 M95 65l22-41 14 81h-8l-10-58-15 24'
 });
 if(kind==='merc-meson-tower')Object.assign(paths,{hull:'M68 59h24l11 43H57Z M75 74h10v8H75Z M69 88h7v10h-7Z',cockpit:'M39 23h82l-8 23-22 16H69L47 46Z M39 23h82v5H39Z M60 19l9-9h22l9 9Z M51 32h58 M59 48h42',leftWeapon:'M74 9h12v25H74Z M76 7h8v5H76Z',rightWeapon:'',leftLeg:'M55 101h50v4H55Z',rightLeg:''});
 if(kind==='scorp-meson-tower')Object.assign(paths,{hull:'M55 38H105L96 100H64Z M65 43V89M95 43V89',cockpit:'M28 25H132V38H28Z M32 20H128V25H32Z',leftWeapon:'M76 3H84V34H76Z M74 8H86V13H74Z',rightWeapon:'',leftLeg:'M62 61L34 101H47L70 67Z',rightLeg:'M90 67L113 101H126L98 61Z'});
 if(kind==='scorp-rocket-tower')Object.assign(paths,{hull:'M54 33h52l-11 67H65z M60 60h40 M63 77h34 M65 94h30',cockpit:'M30 31l22-13 18-7h20l18 7 22 13z M68 11l4-7h16l4 7 M43 32h74',leftWeapon:'M49 35h19v22H51z M54 40h10v5H54z',rightWeapon:'M92 35h19l-2 22H92z M96 40h10v5H96z',leftLeg:'M61 59L37 99h15l18-36z M34 99h20v5H34z',rightLeg:'M90 63l18 36h15L99 59z M106 99h20v5h-20z'});
 const labelY=kind==='scorp-asv'?27:kind.endsWith('-asv')?35:kind==='scorp-rocket-tower'?30:heavy?33:merc?29:50;
 const safeName=crewName.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!)),labelWidth=Math.min(144,crewName.length*5+8);
 const label=crewName?`<g data-role="crew-name"><rect x="${80-labelWidth/2}" y="${labelY-9}" width="${labelWidth}" height="12" fill="#001006"/><text x="80" y="${labelY}" text-anchor="middle" font-family="monospace" font-size="9" fill="#baff9e" textLength="${labelWidth-6}" lengthAdjust="spacingAndGlyphs">${safeName}</text></g>`:'';
 return `<svg viewBox="0 0 160 110" aria-hidden="true">${Object.entries(paths).map(([part,d])=>`<path data-part="${part}" d="${d}" fill="${partColor(parts[part as BodyPart])}" fill-opacity=".08" stroke="${partColor(parts[part as BodyPart])}" stroke-width="1.6" stroke-linejoin="round"/>`).join('')}${label}</svg>`;
}


export function infantryHologramSvg(name=''){
 const safeName=name.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
 return `<svg viewBox="0 0 100 132" aria-label="${safeName||'歩兵'}"><g stroke="#72ff75" fill="none" stroke-width="3"><circle cx="50" cy="20" r="10"/><path d="M35 36H65L70 70H30ZM35 70L30 110M65 70L70 110M35 38L15 65M65 38L85 65"/></g>${name?`<text data-role="person-name" x="50" y="127" text-anchor="middle" font-family="monospace" font-size="11" fill="#baff9e">${safeName}</text>`:''}</svg>`;
}
