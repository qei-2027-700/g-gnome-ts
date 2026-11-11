import {spawn, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const defaultViews = {
  front: {pos: [0, 4.6, 13], target: [0, 3.1, 0], fov: 0.62},
  rear: {pos: [0, 4.6, -13], target: [0, 3.1, 0], fov: 0.62},
  side: {pos: [12, 4.2, 2], target: [0, 3.2, 0], fov: 0.7},
  top: {pos: [1.2, 11, 7], target: [0, 2.2, 0], fov: 0.85}
};
const cameraFile = process.env.GNOME_MODEL_CAMERA_FILE;
let views = defaultViews;
if (cameraFile) {
  try {
    const overrides = JSON.parse(readFileSync(resolve(cameraFile), 'utf8'));
    if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) throw new Error('expected an object keyed by view');
    for (const [name, camera] of Object.entries(overrides)) {
      if (!(name in defaultViews) || !camera || typeof camera !== 'object' || Array.isArray(camera) ||
        !['pos', 'target'].every(key => Array.isArray(camera[key]) && camera[key].length === 3 && camera[key].every(Number.isFinite)) ||
        !Number.isFinite(camera.fov) || camera.fov <= 0 || camera.fov >= Math.PI) {
        throw new Error(`invalid camera for ${name}`);
      }
    }
    views = {...defaultViews, ...overrides};
  } catch (error) {
    console.error(`invalid GNOME_MODEL_CAMERA_FILE: ${error.message}`);
    process.exit(2);
  }
}
const kind = process.argv[2];
const requestedPort = process.env.GNOME_MODEL_PORT === undefined ? undefined : Number(process.env.GNOME_MODEL_PORT);
const label = process.env.GNOME_MODEL_LABEL || '';
const requested = process.argv.slice(3);
const selected = requested.length ? requested : ['front'];
if (!kind || selected.some(view => !views[view]) || !/^[a-z0-9-]*$/.test(label) || (requestedPort !== undefined && (!Number.isInteger(requestedPort) || requestedPort < 1024 || requestedPort > 65535))) {
  console.error('usage: render-views.mjs <vehicle-kind> [front|side|rear|top ...]');
  console.error('optional: GNOME_MODEL_LABEL=before GNOME_MODEL_PORT=5175 GNOME_MODEL_CAMERA_FILE=cameras.json');
  process.exit(2);
}
const vehicles = readFileSync(resolve(root, 'src/game/content/vehicles.ts'), 'utf8');
if (!vehicles.includes(`'${kind}'`)) {
  console.error(`unknown vehicle kind: ${kind}`);
  process.exit(2);
}

const chrome = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium'
].find(path => existsSync(path));
if (!chrome) {
  console.error('Google Chrome was not found. The model was not rendered.');
  process.exit(3);
}

const previewName = `model-match-preview-${process.pid}.html`;
const previewPath = resolve(root, previewName);
const outDir = resolve(root, '.artifacts/model-match', kind);
mkdirSync(outDir, {recursive: true});

function listening(port) {
  const probe = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN'], {encoding: 'utf8'});
  return probe.status === 0 && probe.stdout.includes('LISTEN');
}
async function waitFor(url) {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`timed out waiting for ${url}`);
}

let server;
try {
  const port = requestedPort || Array.from({length: 20}, (_, i) => 5173 + i).find(candidate => !listening(candidate));
  if (!port || listening(port)) throw new Error(`port ${port || '5173-5192'} is occupied; choose a free GNOME_MODEL_PORT`);
  let serverError = '';
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {cwd: root, stdio: ['ignore', 'ignore', 'pipe']});
  server.stderr.on('data', chunk => { serverError += chunk; });
  writeFileSync(previewPath, `<!doctype html>
<html><head><meta charset="utf-8"></head><body style="margin:0">
<canvas id="c" width="960" height="720"></canvas>
<script type="module">
import {Vector3} from '@babylonjs/core/Maths/math.vector.js';
import {Simulation,makeUnit} from '/src/game/simulation/simulation.ts';
import {World} from '/src/game/presentation/renderer.ts';
const cameras=${JSON.stringify(views)};
const canvas=document.querySelector('#c');
const sim=new Simulation();
sim.units=[makeUnit('model-match','${kind}',0,0,false)];
sim.human={x:40,z:40};
const world=new World(canvas,sim);
world.update(.016);
const camera=cameras[new URLSearchParams(location.search).get('view')];
world.camera.position.set(...camera.pos);
world.camera.setTarget(new Vector3(...camera.target));
world.camera.fov=camera.fov;
await new Promise(resolve=>setTimeout(resolve,500));
for(let i=0;i<8;i++){world.scene.render();await new Promise(resolve=>requestAnimationFrame(resolve));}
document.body.dataset.ready='yes';
</script></body></html>`);
  try { await waitFor(`http://127.0.0.1:${port}/${previewName}`); }
  catch (error) { throw new Error(`${error.message}${serverError ? `\n${serverError}` : ''}`); }
  for (const view of selected) {
    const stamp = Date.now();
    const file = resolve(outDir, `${label ? `${label}-` : ''}${view}.png`);
    // A fresh profile avoids Chrome reusing a screenshot of the previous model.
    const profile = resolve(tmpdir(), `gnome-model-match-${stamp}`);
    const shot = spawnSync(chrome, [
      '--headless=new', '--disable-background-networking', '--hide-scrollbars',
      `--user-data-dir=${profile}`, '--window-size=960,720', '--virtual-time-budget=12000',
      `--screenshot=${file}`,
      `http://127.0.0.1:${port}/${previewName}?view=${view}&r=${stamp}`
    ], {encoding: 'utf8'});
    rmSync(profile, {recursive: true, force: true});
    const bytes = existsSync(file) ? statSync(file).size : 0;
    if (shot.status !== 0 || bytes < 8000) {
      console.error(shot.stderr || `blank screenshot for ${view} (${bytes} bytes)`);
      process.exitCode = 1;
      break;
    }
    writeFileSync(file.replace(/\.png$/, '.json'), JSON.stringify({
      kind, view, camera: views[view], cameraSource: cameraFile || 'built-in',
      viewport: {width: 960, height: 720},
      pose: {unitX: 0, unitZ: 0, yaw: 0, aim: 0, aimPitch: 0, pilot: false, updateSeconds: 0.016}
    }, null, 2) + '\n');
    console.log(file);
  }
} finally {
  rmSync(previewPath, {force: true});
  if (server) server.kill();
}
