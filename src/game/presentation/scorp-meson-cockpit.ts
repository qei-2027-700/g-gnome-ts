const reference=new URL('../../../assets/cockpits/scorp-meson-tower.png',import.meta.url).href;

// The photographed terrain, compass, IFF and holograms are replaced by live game state.
export function scorpMesonCockpitShellSvg(){
 const window='M336 0H897L864 174 900 197H1210V340L947 386 930 570H302L285 386 22 340V197H335L370 174Z';
 const iffMount='M594 0H638L645 34 665 51 676 44 682 55 665 73 665 133 651 133 651 67 581 67 581 133 567 133 567 73 550 55 556 44 567 51 587 34Z';
 const weapons='M0 0H327L355 178 284 200H0Z';
 const iff='M568 42H665V112H568Z';
 const left='M0 594H337L282 922H0Z',right='M895 594H1232V922H950Z';
 const radar='M400 646L615 620 833 646 869 922H359Z';
 const compass='M495 157H730V207H495Z',leftScale='M362 347H422V565H362Z';
 const lowerView='M290 552H942V610Q616 535 290 610Z';
 const lowerWell='M290 610Q616 535 942 610V650H290Z';
 const arch='M322 660Q616 530 910 660L910 684Q616 568 322 684Z';
 return `<svg class="scorp-meson-tower-shell" viewBox="0 0 1232 922" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><mask id="scorp-meson-tower-metal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1232" height="922"><rect width="1232" height="922" fill="white"/><path d="${window} ${lowerView} ${lowerWell} ${weapons} ${iff} ${left} ${right} ${radar} ${compass} ${leftScale}" fill="black"/><path d="${iffMount}" fill="white"/><path d="${iff}" fill="black"/></mask></defs><path d="${lowerWell} ${weapons} ${iff} ${left} ${right} ${radar}" fill="#000"/><image href="${reference}" width="1232" height="922" mask="url(#scorp-meson-tower-metal-mask)"/><path d="${arch}" fill="#777a70" stroke="#d1d3c7" stroke-width="7"/></svg>`;
}
