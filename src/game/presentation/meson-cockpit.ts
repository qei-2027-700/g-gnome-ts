const reference=new URL('../../../assets/cockpits/merc-mison-guard-tower.png',import.meta.url).href;
// Keep the supplied metal frame; scenery, AIP and recorded readouts are masked out.
export function mesonCockpitShellSvg(){return `<svg class="meson-reference" viewBox="0 0 1650 952" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs><mask id="meson-frame-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1650" height="952"><rect width="1650" height="952" fill="white"/>
<g transform="scale(.9915865385 1.0170940171)"><path fill="black" d="M536 160H1128L1275 318H1419L1454 492H1302Q1260 489 1236 540L1120 596 979 581 836 572 672 599 564 613 533 552Q512 510 480 498H222L246 332H394Z M120 344L209 424 120 482Z M151 339H225L209 402Z M1440 343H1511L1457 400Z M1470 422L1565 343V482Z"/>
<path fill="black" d="M108 53H523V127H108Z M752 81H954V126H752Z M191 694Q352 661 511 698L490 824H197Z M1176 645Q1320 648 1453 682L1470 829H1184Z M599 679Q831 635 1085 684L1154 896H520Z"/>
</g></mask><linearGradient id="meson-screen" x2=".3" y2="1"><stop stop-color="#060c2c"/><stop offset="1" stop-color="#010416"/></linearGradient></defs>
<rect width="1650" height="952" fill="#000" mask="url(#meson-frame-mask)"/>
<image href="${reference}" width="1650" height="952" mask="url(#meson-frame-mask)"/>
<g transform="scale(.9915865385 1.0170940171)"><path fill="url(#meson-screen)" d="M108 53H523V127H108Z"/>
<path fill="#000403" d="M752 81H954V126H752Z M191 694Q352 661 511 698L490 824H197Z M1176 645Q1320 648 1453 682L1470 829H1184Z M599 679Q831 635 1085 684L1154 896H520Z"/>
</g></svg>`;}

// HUD geometry from merc-mison-guard-tower4.png; separate from the photographed frame.
export function mesonReticleSvg(){return `<svg class="meson-aim" viewBox="0 0 120 80" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor"><path d="M12 20 43 8 32 20 17 24Z"/><path d="M77 8 108 20 103 24 88 20Z"/><path d="M12 60 43 72 32 60 17 56Z"/><path d="M77 72 108 60 103 56 88 60Z"/><path d="M58 35h4v3h4v4h-4v3h-4v-3h-4v-4h4Z"/></g></svg>`;}
export function mesonHeadingScaleSvg(){return `<svg class="meson-heading-scale" viewBox="0 0 320 40" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.5"><path d="M4 35H316"/>${Array.from({length:65},(_,i)=>{const x=4+i*4.875,length=i%8===0?27:i%4===0?18:9;return `<path d="M${x} 35v-${length}"/>`;}).join('')}</g><path d="M154 3h12l-6 10Z" fill="currentColor"/></svg>`;}
