const reference=new URL('../../../assets/cockpits/union-aip.png',import.meta.url).href;

// Keep the photographed metalwork; the view and every readout are live.
export function unionAipCockpitShellSvg(){
 const window='M66 234H1076L1117 412 1000 420 903 484 744 545H398L239 484 142 420 25 412Z';
 const weapons='M93 63H412V158H93Z';
 const iff='M520 75H613V111H520Z';
 const target='M28 569H269L181 858H0V692Z';
 const self='M872 569H1115L1142 689V858H960Z';
 const radar='<ellipse cx="571" cy="768" rx="186" ry="84"/>';
 return `<svg class="union-aip-shell" viewBox="0 0 1142 858" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><mask id="union-aip-metal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1142" height="858"><rect width="1142" height="858" fill="white"/><path d="${window} ${weapons} ${iff} ${target} ${self}" fill="black"/>${radar.replace('/>',' fill="black"/>')}</mask></defs><path d="${weapons} ${iff} ${target} ${self}" fill="#000"/>${radar.replace('/>',' fill="#000"/>')}<image href="${reference}" width="1142" height="858" mask="url(#union-aip-metal-mask)"/></svg>`;
}
