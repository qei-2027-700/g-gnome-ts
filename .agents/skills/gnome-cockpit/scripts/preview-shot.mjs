import {spawn, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createServer} from 'node:net';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const kind = process.argv[2];
const stationClass = process.argv[3] || `${kind}-cockpit`;
if (!kind || typeof WebSocket !== 'function') {
  console.error('usage: preview-shot.mjs <previewVehicle> [station-class]');
  if (typeof WebSocket !== 'function') console.error('This Node has no global WebSocket.');
  process.exit(2);
}

const chromePath = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium'
].find(path => existsSync(path));
if (!chromePath) {
  console.error('Google Chrome was not found. The cockpit was not captured.');
  process.exit(3);
}

function listening(port) {
  const probe = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], {encoding: 'utf8'});
  return probe.status === 0 && probe.stdout.includes('LISTEN');
}
function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.listen(0, '127.0.0.1', () => {
      const {port} = server.address();
      server.close(() => resolvePort(port));
    });
    server.on('error', reject);
  });
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const shellClass = stationClass.replace(/-cockpit$/, '-shell');
const outDir = resolve(root, '.artifacts/cockpit', kind);
const outFile = resolve(outDir, 'preview.png');
mkdirSync(outDir, {recursive: true});

let vite;
if (!listening(5173)) {
  vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173'], {cwd: root, stdio: 'ignore'});
  for (let attempt = 0; attempt < 40 && !listening(5173); attempt++) await sleep(250);
  if (!listening(5173)) {
    vite.kill();
    console.error('Vite did not start on 127.0.0.1:5173.');
    process.exit(3);
  }
}

const port = await freePort();
const profile = resolve(tmpdir(), `gnome-cockpit-${Date.now()}`);
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-background-networking', '--hide-scrollbars', '--no-first-run',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, '--window-size=1440,900', 'about:blank'
], {stdio: 'ignore'});

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const opened = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve);
    ws.addEventListener('error', reject);
  });
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const call = ++id;
    const timer = setTimeout(() => {
      pending.delete(call);
      reject(new Error(`timeout ${method}`));
    }, 20000);
    pending.set(call, message => {
      clearTimeout(timer);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    });
    ws.send(JSON.stringify({id: call, method, params}));
  });
  return {opened, send, close: () => ws.close()};
}

let failed = false;
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const version = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (version.ok) break;
    } catch {}
    if (attempt === 49) throw new Error('Chrome DevTools did not start');
    await sleep(200);
  }
  let created = await fetch(`http://127.0.0.1:${port}/json/new?${new URLSearchParams({url: 'about:blank'})}`, {method: 'PUT'});
  if (!created.ok) created = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`);
  const page = await created.json();
  const cdp = connect(page.webSocketDebuggerUrl);
  await cdp.opened;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Page.navigate', {url: `http://127.0.0.1:5173/?previewVehicle=${encodeURIComponent(kind)}`});

  const valueOf = async expression => {
    const message = await cdp.send('Runtime.evaluate', {expression, returnByValue: true});
    return message.result?.value ?? '';
  };
  let clicked = false;
  for (let attempt = 0; attempt < 40 && !clicked; attempt++) {
    clicked = await valueOf(`(()=>{const b=document.querySelector('[data-action="start"]'); if(!b) return false; b.click(); return true;})()`);
    if (!clicked) await sleep(250);
  }
  let facts = '';
  for (let attempt = 0; attempt < 30 && !facts; attempt++) {
    await sleep(400);
    facts = await valueOf(`(()=>{
      const station=document.querySelector('#station');
      if(!station?.classList.contains(${JSON.stringify(stationClass)})) return '';
      const shell=document.querySelector(${JSON.stringify('.' + shellClass)});
      const rows=[...document.querySelectorAll('.weapon-panel>div')].filter(el=>!el.hidden).length;
      const radar=document.querySelector('.radar-instrument');
      return JSON.stringify({
        iff:document.querySelector('#iffDisplay')?.textContent?.trim()??'',
        shell:shell?getComputedStyle(shell).display:'missing',
        href:shell?.querySelector('image')?.getAttribute('href')??'',
        radar:radar?getComputedStyle(radar).display:'missing',
        rows
      });
    })()`);
  }
  const shot = await cdp.send('Page.captureScreenshot', {format: 'png'});
  writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
  console.log(outFile);
  console.log(facts || `station never gained ${stationClass}`);
  if (!facts) failed = true;
  cdp.close();
} catch (error) {
  failed = true;
  console.error(error instanceof Error ? error.message : error);
} finally {
  chrome.kill();
  if (vite) vite.kill();
  await sleep(800);
  try {
    rmSync(profile, {recursive: true, force: true});
  } catch (error) {
    console.error(`profile cleanup: ${error instanceof Error ? error.message : error}`);
  }
}
process.exit(failed ? 1 : 0);
