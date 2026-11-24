const reference=new URL('../../../assets/cockpits/union-asv-reference.png',import.meta.url).href;
// Use the supplied metalwork as an image layer. The world, instruments and the
// unrelated blue overlay are cut out; all displays below are live game UI.
export function asvCockpitShellSvg(){return `<svg class="asv-cockpit-shell" viewBox="138 0 1422 1020" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs><mask id="asv-shell-mask" maskUnits="userSpaceOnUse" x="138" y="0" width="1422" height="1020"><rect x="138" width="1422" height="1020" fill="white"/>
<path d="M222 286H1486L1406 506 1265 600 1058 618 1018 661H698L664 618 520 612 411 553 285 508Z" fill="black"/>
<path d="M243 79H668L677 282H255Z M1034 78H1459L1450 281H1028Z M811 108H890V133H811Z M810 257H894V283H810Z M225 681H488L363 1020H138V852Z M1214 679H1460L1560 1020H1295Z" fill="black"/>
<ellipse cx="850" cy="913" rx="221" ry="94" fill="black"/>
<!-- Remove the blue lower-right overlay in full, including its outer fringe. -->
<path d="M1355 929H1560V1020H1335Z" fill="black"/>
</mask></defs>
<path d="M243 79H668L677 282H255Z M1034 78H1459L1450 281H1028Z M811 108H890V133H811Z M810 257H894V283H810Z M225 681H488L363 1020H138V852Z M1214 679H1460L1560 1020H1295Z M1355 929H1560V1020H1335Z" fill="#000"/>
<ellipse cx="850" cy="913" rx="221" ry="94" fill="#000"/>
<image href="${reference}" x="0" y="0" width="1700" height="1020" mask="url(#asv-shell-mask)"/>
</svg>`;}
export function asvAimLadderSvg(){return `<svg class="asv-aim-ladder" viewBox="0 0 60 230" preserveAspectRatio="none" aria-hidden="true"><path d="M8 2V228" stroke="#42ff24" stroke-width="2"/>${Array.from({length:37},(_,i)=>`<path d="M8 ${3+i*6}h${i%6===0?28:i%3===0?20:13}" stroke="#42ff24" stroke-width="${i%6===0?2:1}"/>`).join('')}<path d="M8 115h31" stroke="#3074ff" stroke-width="2"/><path d="M45 115l12-7v14Z" fill="#59ff24"/></svg>`;}
export function asvWeaponSymbolSvg(kind:'laser'|'gun'|'missile'){
 const laserShape='<path d="M34 15h106"/><circle cx="46" cy="15" r="11" fill="#27f918"/><circle cx="84" cy="15" r="11" fill="#27f918"/><circle cx="122" cy="15" r="11" fill="#27f918"/>';
 const shell=(x:number)=>`<path d="M${x} 27V9L${x+6} 2L${x+12} 9V27Z M${x+3} 24V11L${x+6} 7L${x+9} 11V24Z"/>`;
 const gunShape=`<g stroke="#39ff20" stroke-width="1.6" fill="none">${[36,56,76,96,116].map(shell).join('')}</g>`;
 const shape=kind==='laser'?`<g stroke="#39ff20" stroke-width="2" fill="none" opacity=".22">${laserShape}</g><g class="asv-laser-charge" stroke="#39ff20" stroke-width="2" fill="none">${laserShape}</g>`:kind==='missile'?'<g stroke="#39ff20" stroke-width="2" fill="none"><path d="M35 10H111L138 15 111 20H35Z M45 10l4-6 14 6M45 20l4 6 14-6"/><path d="M35 11h14v8H35Z" fill="#f32914"/></g>':gunShape;
 return `<span class="asv-weapon-symbol" data-kind="${kind}" aria-hidden="true"><svg viewBox="0 0 150 30" xmlns="http://www.w3.org/2000/svg"><circle class="ready-light" cx="7" cy="15" r="4" fill="#f92a17"/>${shape}</svg></span>`;
}
