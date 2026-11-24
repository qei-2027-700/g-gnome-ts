const reference=new URL('../../../assets/cockpits/union-aip.png',import.meta.url).href;

// Keep the photographed metalwork; the view and every readout are live.
export function unionAipCockpitShellSvg(){
 const window='M74 248L83 280 97 312 105 344 117 376 128 408 184 448 258 480 414 504 427 536 438 546H693L715 504 855 480 895 448 1005 408 1017 376 1027 344 1038 312 1049 280 1060 248Z';
 const weapons='M76 50H424V230H76Z';
 const iff='M516 68H622V112H516Z';
 const target='M28 569H269L181 858H0V692Z';
 const self='M852 569H1115L1142 689V858H948Z';
 const radar='<ellipse cx="567" cy="766" rx="178" ry="76"/>';
 return `<svg class="union-aip-shell" viewBox="0 0 1142 858" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><mask id="union-aip-metal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1142" height="858"><rect width="1142" height="858" fill="white"/><path d="${window} ${weapons} ${iff} ${target} ${self}" fill="black"/>${radar.replace('/>',' fill="black"/>')}</mask></defs><path d="${weapons} ${iff} ${target} ${self}" fill="#000"/>${radar.replace('/>',' fill="#000"/>')}<image href="${reference}" width="1142" height="858" mask="url(#union-aip-metal-mask)"/></svg>`;
}
