const reference=new URL('../../../assets/cockpits/union-rocket-tower.png',import.meta.url).href;

// The outside landscape and photographed instrument pixels are cut away.
export function unionRocketTowerCockpitShellSvg(){
 const window='M0 0H1314V142H1202L1160 192L1174 245L1200 301L1170 389L1212 485L1240 550H1005L950 566H365L315 550H75L99 470L136 400L112 310L130 234L111 198L0 142Z';
 const left='M0 582H323L258 858H0Z',right='M991 582H1314V858H1056Z';
 const radar='M386 677L514 665 650 751 789 665 927 677 937 858H374Z';
 return `<svg class="union-rocket-tower-shell" viewBox="0 0 1314 858" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><mask id="union-rocket-tower-metal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1314" height="858"><rect width="1314" height="858" fill="white"/><path d="${window} ${left} ${right} ${radar}" fill="black"/></mask></defs><path d="${left} ${right} ${radar}" fill="#000"/><image href="${reference}" width="1314" height="858" mask="url(#union-rocket-tower-metal-mask)"/></svg>`;
}
