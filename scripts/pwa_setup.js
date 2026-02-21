#!/usr/bin/env node
/**
 * scripts/pwa_setup.js
 *
 * Generates PWA icon PNG files using only Node.js built-in modules.
 * No npm dependencies required.
 *
 * Usage: node scripts/pwa_setup.js
 * Output: public/icons/icon-192.png, public/icons/icon-512.png
 */

import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = resolve(__dirname, '..', 'public', 'icons');

// ── Colour palette (matches app theme) ────────────────────────────────────────
const SAGE  = [0x7C, 0xB6, 0x9D]; // #7CB69D sage green
const CREAM = [0xF7, 0xF5, 0xF0]; // #F7F5F0 cream
const TERRA = [0xE0, 0x7A, 0x5F]; // #E07A5F terracotta

// ── CRC32 (required by PNG spec) ───────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG chunk builder ──────────────────────────────────────────────────────────
function makeChunk(typeStr, data) {
  const type = Buffer.from(typeStr, 'ascii');
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([type, data]);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, type, data, crcBuf]);
}

// ── IHDR: image header ─────────────────────────────────────────────────────────
function makeIHDR(w, h) {
  const d = Buffer.allocUnsafe(13);
  d.writeUInt32BE(w, 0);
  d.writeUInt32BE(h, 4);
  d[8]  = 8; // bit depth: 8
  d[9]  = 2; // colour type: RGB truecolour
  d[10] = 0; // compression: deflate
  d[11] = 0; // filter method: 0
  d[12] = 0; // interlace: none
  return makeChunk('IHDR', d);
}

// ── IDAT: compressed image data ────────────────────────────────────────────────
function makeIDAT(pixels, w, h) {
  // Each row: 1 filter byte (0=None) + w*3 RGB bytes
  const raw = Buffer.allocUnsafe(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const rowOff = y * (1 + w * 3);
    raw[rowOff] = 0; // filter: None
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 3;
      raw[rowOff + 1 + x * 3]     = pixels[p];
      raw[rowOff + 1 + x * 3 + 1] = pixels[p + 1];
      raw[rowOff + 1 + x * 3 + 2] = pixels[p + 2];
    }
  }
  return makeChunk('IDAT', deflateSync(raw));
}

// ── PNG signature ──────────────────────────────────────────────────────────────
const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// ── Icon pixel renderer ────────────────────────────────────────────────────────
function renderIcon(size) {
  const px = new Uint8Array(size * size * 3);
  const S = size / 512; // scale: maps design coords (0–512) to pixel coords

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Map pixel to design coordinate space
      const dx = col / S;
      const dy = row / S;

      let colour = SAGE; // default: sage background

      // Decorative ring: cx=256, cy=256, outer r=188, inner r=172
      {
        const rdx = dx - 256, rdy = dy - 256;
        const d2 = rdx * rdx + rdy * rdy;
        if (d2 <= 188 * 188 && d2 >= 172 * 172) {
          colour = [
            Math.round(CREAM[0] * 0.5 + SAGE[0] * 0.5),
            Math.round(CREAM[1] * 0.5 + SAGE[1] * 0.5),
            Math.round(CREAM[2] * 0.5 + SAGE[2] * 0.5),
          ];
        }
      }

      // Letterform P — simple axis-aligned rects
      const inRect = (rx, ry, rw, rh) => dx >= rx && dx <= rx + rw && dy >= ry && dy <= ry + rh;

      if (inRect(176, 160, 24, 192)) colour = CREAM; // vertical stem
      if (inRect(176, 160, 120, 24)) colour = CREAM; // top bar
      if (inRect(176, 232, 120, 24)) colour = CREAM; // middle bar
      if (inRect(272, 160, 24, 96))  colour = CREAM; // right bowl

      // Terracotta accent circle: cx=336, cy=320, r=28
      {
        const cdx = dx - 336, cdy = dy - 320;
        if (cdx * cdx + cdy * cdy <= 28 * 28) colour = TERRA;
        if (cdx * cdx + cdy * cdy <= 14 * 14) colour = CREAM;
      }

      const i = (row * size + col) * 3;
      px[i] = colour[0]; px[i + 1] = colour[1]; px[i + 2] = colour[2];
    }
  }

  return px;
}

// ── Build and write PNG files ──────────────────────────────────────────────────
mkdirSync(ICONS_DIR, { recursive: true });

for (const size of [192, 512]) {
  const pixels = renderIcon(size);
  const png = Buffer.concat([
    PNG_SIG,
    makeIHDR(size, size),
    makeIDAT(pixels, size, size),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
  const outPath = resolve(ICONS_DIR, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`[pwa_setup] ${outPath} (${png.length} bytes)`);
}

console.log('[pwa_setup] Done. Commit public/icons/ to the repository.');
