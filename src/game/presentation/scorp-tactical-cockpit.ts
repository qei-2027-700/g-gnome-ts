const reference=new URL('../../../assets/cockpits/scorp-td-hawk.png',import.meta.url).href;

// The reference supplies only metal and framing. The battlefield and readouts remain live.
export function scorpTacticalCockpitShellSvg(){
 const window='M265 173Q330 166 388 190Q455 175 475 218H663Q690 175 748 190Q813 165 879 175L908 220L874 456L824 510H715Q655 487 570 494Q485 487 425 510H317L268 456L236 220Z M0 181H218L203 405L142 448H0Z M926 181H1144V448H1004L940 405Z';
 const displays='M0 0H290L320 140L278 181H0Z M819 0H1144V181H866L819 139Z M535 52H619V143H535Z M0 532Q110 523 230 555Q332 596 349 724L335 860H0Z M804 724Q825 594 925 555Q1037 520 1144 532V860H810Z M390 585Q570 537 754 585L784 860H360Z';
 return `<svg class="scorp-tactical-shell" viewBox="0 0 1144 860" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><mask id="scorp-tactical-metal-mask" maskUnits="userSpaceOnUse"><rect width="1144" height="860" fill="white"/><path d="${window}" fill="black"/><path d="${displays}" fill="black"/></mask></defs><path d="${displays}" fill="#000"/><image href="${reference}" width="1144" height="860" mask="url(#scorp-tactical-metal-mask)"/></svg>`;
}
