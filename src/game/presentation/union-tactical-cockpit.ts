const reference=new URL('../../../assets/cockpits/union-tactical-reference.png',import.meta.url).href;
// User-assigned Union Tactical interior reference. Only the metal survives;
// recorded scenery, target, weapon counts, holo figures and browser toast are removed.
export function unionTacticalCockpitShellSvg(){
 const window='M0 202H565L606 119H772L797 132H1004L1026 113H1191L1232 202H1804V472L1594 649 1411 725 1308 674H497L391 725 193 649 0 478Z';
 const instruments='M18 33H568V164H18ZM1240 32H1771V166H1240ZM808 30H986V84H808ZM0 43H370V88H0ZM46 784H103V956H46ZM1346 834H1390V888H1346ZM1720 920H1774V959H1720Z';
 const figures='M208 776L225 766 244 779V802L267 812H300V843H271V875L280 964H253L241 899 216 872 204 895 198 965H169L175 860 163 843H144V810H178L200 799ZM1450 790H1579L1608 814V848H1581L1570 870 1594 962H1554L1526 898 1497 874 1477 960H1438L1448 866 1424 849H1397V812H1440Z';
 const radar='M598 811L680 780 809 786 846 763H961L1000 789H1111L1203 845 1231 943 1228 1012 1189 1071 998 1071 976 1058H818L793 1080 603 1060 563 1000V873Z';
 return `<svg class="union-tactical-shell" viewBox="0 0 1804 1126" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs>
 <mask id="tactical-metal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1804" height="1126"><rect width="1804" height="1126" fill="white"/><path d="${window}" fill="black"/><path d="${instruments}" fill="black"/><path d="${radar}" fill="black"/><path d="${figures}" fill="black"/><ellipse cx="235" cy="947" rx="210" ry="64" fill="black"/><ellipse cx="1578" cy="947" rx="210" ry="64" fill="black"/></mask>
 <pattern id="tactical-holo-grid" width="26" height="17" patternUnits="userSpaceOnUse" patternTransform="skewX(-35)"><path d="M0 0H26V17" fill="none" stroke="#1c9e9b" stroke-width="2"/></pattern></defs>
 <path d="${instruments} ${radar}" fill="#000"/><path d="${figures}" fill="#20251f"/>
 <image href="${reference}" width="1804" height="1126" mask="url(#tactical-metal-mask)"/>
 <g><ellipse cx="235" cy="947" rx="210" ry="64" fill="#001011"/><ellipse cx="1578" cy="947" rx="210" ry="64" fill="#001011"/><ellipse cx="235" cy="947" rx="210" ry="64" fill="url(#tactical-holo-grid)"/><ellipse cx="1578" cy="947" rx="210" ry="64" fill="url(#tactical-holo-grid)"/></g>
 </svg>`;
}
