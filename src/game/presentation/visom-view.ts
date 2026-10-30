const referenceImage=new URL('../../../assets/cockpits/visom-reference.png',import.meta.url).href;
// The aperture follows the supplied optical-view frame, including the floor
// brace and the lower-right pipe. It exposes the current 3D scene beneath it.
const aperture='M690 215L741 207 779 282H909L939 205 1080 320 1170 437 1092 468V571L1154 604 1059 625 1028 611 985 616 957 646 953 680 975 711 1004 719 963 786 907 819 894 747 797 744 780 817 710 779 666 721 611 669 558 642 606 600V469L553 442 568 390 647 292Z';
export function visomFrameSvg(){
 return `<svg class="visom-shell" viewBox="0 0 1708 1026" preserveAspectRatio="xMidYMid slice" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
 <defs>
  <linearGradient id="visom-metal" x2=".8" y2="1"><stop stop-color="#4e4b43"/><stop offset=".35" stop-color="#242725"/><stop offset=".7" stop-color="#555951"/><stop offset="1" stop-color="#161b19"/></linearGradient>
  <linearGradient id="visom-red" x2="1" y2=".2"><stop stop-color="#160e0b"/><stop offset=".45" stop-color="#723d28"/><stop offset=".7" stop-color="#482217"/><stop offset="1" stop-color="#1d100c"/></linearGradient>
  <linearGradient id="visom-pipe" x2="1" y2="1"><stop stop-color="#080c0c"/><stop offset=".3" stop-color="#6b7b74"/><stop offset=".47" stop-color="#222d2b"/><stop offset=".6" stop-color="#0a1010"/><stop offset="1" stop-color="#020606"/></linearGradient>
  <mask id="visom-shell-mask"><path fill="white" d="M0 0h1708v1026H0z"/><path fill="black" d="${aperture}"/></mask>
  <mask id="visom-photo-mask"><path fill="white" d="M0 0h1708v1026H0z"/><path fill="black" stroke="black" stroke-width="70" stroke-linejoin="round" d="${aperture}"/><path fill="black" d="M1368 914h340v112h-340z M1695 0h13v1026h-13z M0 1016h1708v10H0z"/></mask>
 </defs>
 <g mask="url(#visom-shell-mask)" stroke="#101512" stroke-linejoin="round">
  <path d="M0 0h1708v1026H0z" fill="url(#visom-metal)"/>
  <path d="M84 0h235L719 299 568 431 84 254Z M1389 0h235v259l-489 180-150-141Z M84 766l486-171 151 135-402 296H84Z M1138 595l486 171v260h-234L984 730Z" fill="url(#visom-red)" stroke-width="22"/>
  <path d="M422 0h100l217 257-42 35Z M1185 0h100l-275 293-44-37Z M423 1026h104l214-250-44-39Z M1180 1026h104l-274-290-44 39Z" fill="#141817" stroke-width="9"/>
  <path d="M759 0h191l-38 282H795Z M754 1026h203l-63-279h-97Z" fill="url(#visom-metal)" stroke-width="13"/>
  <path d="M0 388l610 81v110L0 654Z M1708 388l-616 80v110l616 76Z" fill="#111814" stroke-width="12"/>
  <path d="M164 109l469 216M170 916l462-217M1557 121l-488 203M1555 909l-484-215" fill="none" stroke="#0c1010" stroke-width="62"/>
  <path d="M164 97l469 216M170 904l462-217M1557 109l-488 203M1555 897l-484-215" fill="none" stroke="url(#visom-pipe)" stroke-width="40"/>
  <circle cx="1009" cy="668" r="55" fill="#2e3430" stroke="#101714" stroke-width="14"/>
  <path d="M1010 668l698 199" fill="none" stroke="#080e0d" stroke-width="67"/>
  <path d="M1010 657l698 199" fill="none" stroke="url(#visom-pipe)" stroke-width="40"/>
 </g>
 <image href="${referenceImage}" x="0" y="0" width="1708" height="1026" mask="url(#visom-photo-mask)"/>
 </svg>`;
}
