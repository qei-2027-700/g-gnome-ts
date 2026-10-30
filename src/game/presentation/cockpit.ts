// Union Sentry shell reconstructed from the supplied cockpit screenshot.
// Decorative geometry only: live instruments remain separate DOM elements.
export function cockpitShellSvg(){
 const bolts=[[28,28],[510,32],[1090,32],[1570,28],[41,812],[1560,812],[448,1132],[1152,1132]];
 const vents=(x:number)=>Array.from({length:9},(_,i)=>`<path d="M${x-i*3} ${1094+i*10}h${100+i*5}" stroke="#1a1b18" stroke-width="5"/><path d="M${x-i*3} ${1097+i*10}h${100+i*5}" stroke="#a18a74" stroke-width="2"/>`).join('');
 return `<svg class="cockpit-shell" viewBox="0 0 1600 1200" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
 <defs>
  <linearGradient id="shell-metal" x2=".15" y2="1"><stop stop-color="#8c8c80"/><stop offset=".18" stop-color="#55584f"/><stop offset=".4" stop-color="#30352f"/><stop offset=".65" stop-color="#72756a"/><stop offset="1" stop-color="#282d27"/></linearGradient>
  <linearGradient id="shell-deck" x2=".1" y2="1"><stop stop-color="#252a24"/><stop offset=".2" stop-color="#696c62"/><stop offset=".48" stop-color="#a09c8c"/><stop offset=".7" stop-color="#666d62"/><stop offset="1" stop-color="#393d35"/></linearGradient>
  <linearGradient id="shell-red" x2=".3" y2="1"><stop stop-color="#50332d"/><stop offset=".32" stop-color="#866052"/><stop offset=".56" stop-color="#694139"/><stop offset="1" stop-color="#2d2420"/></linearGradient>
  <linearGradient id="shell-edge" x2="0" y2="1"><stop stop-color="#151a16"/><stop offset=".35" stop-color="#94988a"/><stop offset=".52" stop-color="#62685c"/><stop offset=".8" stop-color="#222921"/><stop offset="1" stop-color="#0a0e0c"/></linearGradient>
  <radialGradient id="shell-radar"><stop offset=".65" stop-color="#1d211c"/><stop offset=".8" stop-color="#999887"/><stop offset=".86" stop-color="#40463e"/><stop offset=".94" stop-color="#8c8e7d"/><stop offset="1" stop-color="#161e18"/></radialGradient>
  <pattern id="shell-grille" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 0l7 7m-7 0l7-7" stroke="#81837a" stroke-width="1"/><rect width="7" height="7" fill="#111713" fill-opacity=".4"/></pattern>
  <pattern id="shell-scratches" width="127" height="91" patternUnits="userSpaceOnUse"><path d="M8 17h22m42 39h18m-65 21h9m51-58h13" stroke="#e4d5b8" opacity=".12"/><path d="M11 19h22m42 39h18m-65 21h9" stroke="#10130f" opacity=".23"/></pattern>
 </defs>
 <g stroke="#161c17" stroke-linejoin="round">
  <path d="M0 0h1600v140l-137-11-22-17H1070l-20 15H554l-16 18H139L0 161Z" fill="url(#shell-metal)" stroke-width="15"/>
  <path d="M14 12H505l35 123H20Z" fill="url(#shell-red)" stroke-width="8"/>
  <path d="M35 25h443l29 91H48Z" fill="#030905" stroke="#29352a" stroke-width="5"/>
  <path d="M1083 16h497l-19 117h-493Z" fill="url(#shell-red)" stroke-width="8"/>
  <path d="M1110 28h449l-18 86h-451Z" fill="#050a07" stroke="#242c23" stroke-width="5"/>
  <path d="M563 0v110m477-110v110M802 2v29" fill="none" stroke="#191e18" stroke-width="7"/>
  <path d="M28 139l94-10 338 615-39 31L76 194 8 181Z" fill="url(#shell-edge)" stroke-width="10"/>
  <path d="M1572 139l-94-10-338 615 39 31 345-581 68-13Z" fill="url(#shell-edge)" stroke-width="10"/>
  <path d="M94 166l335 576m1077-576-335 576" fill="none" stroke="#898d7e" stroke-width="5"/>
  <path d="M0 676l438 54q362-66 724 0l438-54v524H0Z" fill="url(#shell-deck)" stroke-width="12"/>
  <path d="M0 680l428 54q372-69 744 0l428-54v56l-422 46q-378-69-756 0L0 736Z" fill="url(#shell-edge)" stroke-width="9"/>
  <path d="M0 785l373 55 83 193-456 99Z" fill="#1b221b" stroke="#77796b" stroke-width="7"/>
  <path d="M1600 785l-373 55-83 193 456 99Z" fill="#1b221b" stroke="#77796b" stroke-width="7"/>
  <path d="M368 854l198-14 70-45q163-35 328 0l74 46 194 13" fill="none" stroke="#292922" stroke-width="42"/>
  <path d="M368 844l198-14m468 0l198 14" fill="none" stroke="#805e4b" stroke-width="20"/>
  <path d="M368 839l198-14m468 0l198 14" fill="none" stroke="#b29275" stroke-width="3"/>
  <path d="M410 985l179-169 182-19 3 84-152 24-104 119Z" fill="url(#shell-red)" stroke="#3e3d31" stroke-width="6"/>
  <path d="M1190 985l-179-169-182-19-3 84 152 24 104 119Z" fill="url(#shell-red)" stroke="#3e3d31" stroke-width="6"/>
  <path d="M795 797v102" stroke="#262c23" stroke-width="8"/><path d="M806 797v96" stroke="#b4b2a0" stroke-width="6"/>
  <ellipse cx="800" cy="1039" rx="386" ry="179" fill="url(#shell-radar)" stroke="#2c3329" stroke-width="8"/>
  <ellipse cx="800" cy="1028" rx="345" ry="144" fill="#020806" stroke="#171f18" stroke-width="10"/>
  <path d="M0 1124l350-73 77 149H0Z" fill="url(#shell-red)" stroke-width="7"/>
  <path d="M1600 1124l-350-73-77 149h427Z" fill="url(#shell-red)" stroke-width="7"/>
  <path d="M13 1140l164-34 14 94H0Z" fill="url(#shell-grille)"/>
  <path d="M1587 1140l-164-34-14 94h191Z" fill="url(#shell-grille)"/>
  <g>${vents(231)}${vents(1269)}</g>
  <path d="M400 1177q400 35 800 0" stroke="#161c16" stroke-width="32" fill="none"/>
  <path d="M400 1168q400 35 800 0" stroke="#797e6d" stroke-width="18" fill="none"/>
  <path d="M550 1174v26m500-26v26" stroke="#222c22" stroke-width="22"/>
  <path d="M553 1175v25m500-25v25" stroke="#9a9e86" stroke-width="9"/>
  ${bolts.map(([x,y])=>`<g transform="translate(${x} ${y})"><circle r="9" fill="#141a15" stroke="#787c6c" stroke-width="3"/><path d="M-4 0h8" stroke="#b1af99" stroke-width="2"/></g>`).join('')}
 </g>
 <path d="M0 785l373 55 83 193-456 99Zm1600 0-373 55-83 193 456 99Z" fill="url(#shell-scratches)" opacity=".7"/>
 </svg>`;
}
