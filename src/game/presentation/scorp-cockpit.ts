const reference=new URL('../../../assets/cockpits/scorp-reference.png',import.meta.url).href;
// Coordinates are in the source frame. Crop away the blurred side bars and
// video border; replace every source display and the scenery with live layers.
export function scorpCockpitShellSvg(){
 const displays='M138 0H465L505 24 538 130 438 210H178L138 107Z M1230 0H1560V112L1524 210H1261L1168 134 1200 29Z M808 82H897V123H808Z M238 658H502V780L414 1000H138V801Z M1204 659H1431L1560 791V1000H1299Z M637 743Q850 671 1063 744Q1141 857 1070 1000H633Q565 867 637 743Z';
 const window='M640 157L739 94 747 0H954L965 94 1060 157L1168 134 1241 223H1401L1439 360H1276L1300 450 1359 450 1338 480 1347 491 1336 520 1352 536 1340 558 1180 644 1165 692 1070 650Q850 540 632 650L535 699 518 645 426 560 376 560 388 536 366 522 370 490 382 465 369 450H408L438 361H278L316 222H441L537 138 640 157Z';
 return `<svg class="scorp-cockpit-shell" viewBox="138 0 1422 1000" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><mask id="scorp-metal-mask" maskUnits="userSpaceOnUse" x="138" y="0" width="1422" height="1000"><rect x="138" width="1422" height="1000" fill="white"/><path d="${window}" fill="black"/><path d="M797 0H900L904 48 930 75 944 166 918 156 900 130H800L782 156 765 166 770 85 795 49Z" fill="white"/><path d="${displays}" fill="black"/></mask></defs><path d="${displays}" fill="#000"/><image href="${reference}" width="1712" height="1008" mask="url(#scorp-metal-mask)"/></svg>`;
}
