const reference=new URL('../../../assets/cockpits/scope-assault-hawk.png',import.meta.url).href;

// The photographed metal stays fixed; scenery and all instruments use live state.
export function scorpAssaultCockpitShellSvg(){
 const window='M0 218H344L386 264Q411 190 477 190Q563 181 620 231Q670 144 755 145H929Q1018 143 1093 231Q1141 182 1213 190Q1280 190 1301 262L1337 218H1684V630L1380 630L1306 620L1105 614Q850 594 650 604L379 619L310 630H0Z';
 const displays='M0 14H417L455 131L385 217H42L0 141Z M1271 14H1684V216H1300L1220 129Z M797 87H891V137H797Z M8 648L388 631L420 716L323 966H0Z M1294 636L1676 649L1684 966H1362L1261 713Z M555 710Q842 662 1129 710L1173 966H512Z';
 return `<svg class="scorp-assault-shell" viewBox="0 0 1684 966" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><mask id="scorp-assault-metal-mask" maskUnits="userSpaceOnUse"><rect width="1684" height="966" fill="white"/><path d="${window}" fill="black"/><path d="${displays}" fill="black"/></mask></defs><image href="${reference}" width="1684" height="966" mask="url(#scorp-assault-metal-mask)"/><path d="${displays}" fill="#000"/></svg>`;
}
