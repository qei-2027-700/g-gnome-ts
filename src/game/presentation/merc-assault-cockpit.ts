const reference=new URL('../../../assets/cockpits/merc-assault.png',import.meta.url).href;
// The supplied frame is retained; recorded scenery, target, radar and readouts are removed.
export function mercAssaultCockpitShellSvg(){return `<svg class="merc-assault-reference" viewBox="0 0 1882 1424" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs><mask id="merc-assault-metal" maskUnits="userSpaceOnUse" x="0" y="0" width="1882" height="1424"><rect width="1882" height="1424" fill="white"/>
<rect y="240" width="1882" height="820" fill="black"/>
<g fill="none" stroke="white" stroke-width="35" stroke-linejoin="round"><path d="M0 270 L540 383"/><path d="M540 383 L767 222"/><path d="M540 402 L619 985"/><path d="M44 458 L243 644"/><path d="M243 644 L533 402"/><path d="M243 644 L361 784"/><path d="M361 784 L558 711"/><path d="M1882 270 L1342 383"/><path d="M1342 383 L1115 222"/><path d="M1342 402 L1263 985"/><path d="M1838 458 L1639 644"/><path d="M1639 644 L1349 402"/><path d="M1639 644 L1521 784"/><path d="M1521 784 L1324 711"/><path d="M778 224 L946 382 L1114 224"/></g>
<path fill="white" d="M0 955L240 804 302 815 369 883 496 927 599 1002 610 1070H0Z M1882 955L1642 804 1580 815 1513 883 1386 927 1283 1002 1272 1070H1882Z M700 895L760 864 802 837H1090L1128 860 1195 895Z"/>
<path fill="black" d="M82 102H734L753 246H126Z M1199 103H1812L1774 247H1178Z M870 143H1011V187H870Z M126 1147L310 1078 503 1142 541 1400H61Z M1358 1146L1541 1090 1722 1136 1816 1408H1395Z M645 968L762 896 1102 896 1229 985 1328 1424H549Z"/>
</mask></defs>
<image href="${reference}" width="1882" height="1424" mask="url(#merc-assault-metal)"/>
<path fill="#000" d="M82 102H734L753 246H126Z M1199 103H1812L1774 247H1178Z M870 143H1011V187H870Z M126 1147L310 1078 503 1142 541 1400H61Z M1358 1146L1541 1090 1722 1136 1816 1408H1395Z M645 968L762 896 1102 896 1229 985 1328 1424H549Z"/>
</svg>`;}
