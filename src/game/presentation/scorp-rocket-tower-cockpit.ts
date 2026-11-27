const reference=new URL('../../../assets/cockpits/scorp-rocket-tower.png',import.meta.url).href;

// The photographed terrain, compass, IFF and holograms are replaced by live game state.
export function scorpRocketTowerCockpitShellSvg(){
 const window='M336 0H514V151H704V0H897L864 174 900 197H1210V340L947 386 930 570H302L285 386 22 340V197H335L370 174Z';
 const weapons='M0 0H327L355 178 284 200H0Z';
 const iff='M568 42H665V112H568Z';
 const left='M0 594H337L282 922H0Z',right='M895 594H1232V922H950Z';
 const radar='M400 646L615 620 833 646 869 922H359Z';
 const compass='M495 157H730V207H495Z',leftScale='M362 347H422V565H362Z';
 const lowerView='M290 552H942V610Q616 535 290 610Z';
 const lowerWell='M290 610Q616 535 942 610V650H290Z';
 const arch='M322 660Q616 530 910 660L910 684Q616 568 322 684Z';
 return `<svg class="scorp-rocket-tower-shell" viewBox="0 0 1232 922" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><mask id="scorp-rocket-tower-metal-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1232" height="922"><rect width="1232" height="922" fill="white"/><path d="${window} ${lowerView} ${lowerWell} ${weapons} ${iff} ${left} ${right} ${radar} ${compass} ${leftScale}" fill="black"/></mask></defs><path d="${lowerWell} ${weapons} ${iff} ${left} ${right} ${radar}" fill="#000"/><image href="${reference}" width="1232" height="922" mask="url(#scorp-rocket-tower-metal-mask)"/><path d="${arch}" fill="#777a70" stroke="#d1d3c7" stroke-width="7"/></svg>`;
}
