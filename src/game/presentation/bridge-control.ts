const reference=new URL('../../../assets/cockpits/bridge-control-building.png',import.meta.url).href;
export function bridgeControlMarkup(){return `<svg class="bridge-control-reference" viewBox="0 0 1842 1120" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs><mask id="bridge-control-frame"><rect width="1842" height="1120" fill="white"/>
<path fill="black" d="M839 116H947L973 164 1000 175 1082 237V389L1128 416 1220 492V618L1130 619 1118 675 1028 709V1105H738V768L651 743 646 643 570 629V524L714 485V418L765 377V291L808 239V195Z"/>
<rect x="1455" y="115" width="335" height="370" fill="black"/><rect x="213" y="148" width="320" height="260" fill="black"/>
<rect x="1500" y="965" width="342" height="155" fill="black"/></mask></defs>
<image href="${reference}" width="1842" height="1120" mask="url(#bridge-control-frame)"/>
<rect x="1455" y="115" width="335" height="370" fill="#020b05"/><rect x="213" y="148" width="320" height="260" fill="#020b05"/>
<path fill="#18191a" d="M1500 965H1842V1120H1500Z"/></svg>
<div class="bridge-state"><svg viewBox="0 0 100 80" aria-hidden="true"><path id="bridgeDiagram" d="M5 65H95" fill="none" stroke="#6dff47" stroke-width="4"/></svg><span id="bridgeStateLabel">BRIDGE DOWN</span></div>
<div id="bridgeReadout" class="bridge-readout"></div><button id="bridgeSwitch" aria-label="橋を上げる">橋を上げる · Enter</button><p class="bridge-exit-hint">Backspace · 退出</p>`;}
