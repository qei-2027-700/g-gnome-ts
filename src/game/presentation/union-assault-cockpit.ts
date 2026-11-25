const reference=new URL('../../../assets/cockpits/union-assault-hawk.png',import.meta.url).href;
// Photo metal stays. Windows and the live instrument wells are cut; only the wells are painted back black.
const wells='<rect x="148" y="50" width="372" height="210"/><rect x="790" y="50" width="372" height="210"/><rect x="590" y="68" width="140" height="70"/><path d="M4 652L322 646L268 978H0Z"/><path d="M988 648H1256L1314 710V978H1048Z"/><ellipse cx="654" cy="928" rx="210" ry="148"/>';
export function unionAssaultCockpitShellSvg(){return `<svg class="union-assault-shell" viewBox="0 0 1314 978" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs><mask id="union-assault-metal" maskUnits="userSpaceOnUse" x="0" y="0" width="1314" height="978"><rect width="1314" height="978" fill="white"/>
<rect x="0" y="268" width="386" height="378" fill="black"/><rect x="472" y="268" width="364" height="500" fill="black"/><rect x="910" y="268" width="344" height="378" fill="black"/>
<g fill="black">${wells}</g>
</mask></defs>
<image href="${reference}" width="1314" height="978" mask="url(#union-assault-metal)"/>
<g fill="#000">${wells}</g>
</svg>`;}
