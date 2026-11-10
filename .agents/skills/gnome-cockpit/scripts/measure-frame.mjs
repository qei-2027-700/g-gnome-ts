import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';

const file = process.argv[2];
const strideArg = Number(process.argv[3]);
if (!file) {
  console.error('usage: measure-frame.mjs <png> [stride]');
  process.exit(2);
}

const buf = readFileSync(file);
if (buf.readUInt32BE(0) !== 0x89504e47) {
  console.error('not a png');
  process.exit(2);
}

let offset = 8;
let width = 0;
let height = 0;
let bitDepth = 0;
let colorType = 0;
const idat = [];
while (offset + 8 <= buf.length) {
  const length = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  const data = buf.subarray(offset + 8, offset + 8 + length);
  if (type === 'IHDR') {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    bitDepth = data[8];
    colorType = data[9];
  } else if (type === 'IDAT') {
    idat.push(data);
  } else if (type === 'IEND') {
    break;
  }
  offset += 12 + length;
}

const channels = {2: 3, 6: 4}[colorType];
if (bitDepth !== 8 || !channels) {
  console.error(`unsupported png bitDepth=${bitDepth} colorType=${colorType}`);
  process.exit(2);
}

const raw = inflateSync(Buffer.concat(idat));
const rowBytes = width * channels;
const pixels = Buffer.alloc(height * rowBytes);
let src = 0;
let prev = Buffer.alloc(rowBytes);
for (let y = 0; y < height; y++) {
  const filter = raw[src++];
  const row = raw.subarray(src, src + rowBytes);
  src += rowBytes;
  const cur = pixels.subarray(y * rowBytes, (y + 1) * rowBytes);
  for (let i = 0; i < rowBytes; i++) {
    const left = i >= channels ? cur[i - channels] : 0;
    const up = prev[i];
    const ul = i >= channels ? prev[i - channels] : 0;
    const value = row[i];
    if (filter === 0) cur[i] = value;
    else if (filter === 1) cur[i] = (value + left) & 255;
    else if (filter === 2) cur[i] = (value + up) & 255;
    else if (filter === 3) cur[i] = (value + ((left + up) >> 1)) & 255;
    else if (filter === 4) {
      const p = left + up - ul;
      const pa = Math.abs(p - left);
      const pb = Math.abs(p - up);
      const pc = Math.abs(p - ul);
      const pred = pa <= pb && pa <= pc ? left : pb <= pc ? up : ul;
      cur[i] = (value + pred) & 255;
    } else {
      console.error(`unsupported filter ${filter}`);
      process.exit(2);
    }
  }
  prev = Buffer.from(cur);
}

function sample(x, y) {
  const i = (y * width + x) * channels;
  return [pixels[i], pixels[i + 1], pixels[i + 2]];
}

function cell(r, g, b) {
  const body = `${r},${g},${b}`;
  if (g > r + 20 && b + 10 < g) return `g${body}`;
  if (b > r + 25 && b > 140 && g > 100) return `s${body}`;
  if (g > 180 && g > r + 40 && g > b) return `h${body}`;
  if (r < 28 && g < 28 && b < 28) return `k${body}`;
  return body;
}

const stride = Number.isFinite(strideArg) && strideArg >= 8
  ? Math.round(strideArg)
  : Math.max(48, Math.round(Math.max(width, height) / 12));
const xs = [];
const ys = [];
for (let x = Math.min(stride, width - 1); x < width; x += stride) xs.push(Math.min(x, width - 1));
for (let y = Math.min(stride, height - 1); y < height; y += stride) ys.push(Math.min(y, height - 1));

console.log(`${width}x${height} stride=${stride}`);
console.log(`x ${xs.join(' ')}`);
for (const y of ys) {
  const samples = xs.map(x => cell(...sample(x, y)));
  console.log(`${y} ${samples.join(' ')}`);
}
