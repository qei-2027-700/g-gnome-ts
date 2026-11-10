const reference=new URL('../../../assets/cockpits/scope-sentry-hawk.png',import.meta.url).href;

// Keep the photographed frame. The window, weapon readouts, IFF and holograms stay live.
export function scorpSentryCockpitShellSvg(){
 const window='M415 198H670L700 210H1010L1040 198H1295L1175 490L1360 555L1330 615H340L310 555L530 490Z';
 const sides='M40 222L370 215L410 310L460 420L490 510L490 598L200 598L190 500L165 430L85 310Z M1310 220L1655 232L1605 300L1560 370L1525 480L1488 512L1448 555L1420 598L1310 598L1265 548L1275 430L1295 300Z';
 const displays='M40 42H452V206H40Z M1250 42H1684V206H1250Z M802 102H886V130H802Z M30 664L404 652L418 758L362 888L312 988H16Z M1284 658H1690V988H1400L1312 868L1268 756Z';
 return `<svg class="scorp-sentry-shell" viewBox="0 0 1708 1000" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><mask id="scorp-sentry-metal-mask"><rect width="1708" height="1000" fill="white"/><path d="${window}" fill="black"/><path d="${sides}" fill="black"/><path d="${displays}" fill="black"/></mask></defs><image href="${reference}" width="1708" height="1000" mask="url(#scorp-sentry-metal-mask)"/><path d="${displays}" fill="#000"/></svg>`;
}
