/*
 * scripts/generate-pwa-icons.mjs
 * Generador de íconos PWA en JS puro (sin dependencias):
 *   - icon-192.png / icon-512.png   (propósito "any": esquinas redondeadas, fondo degradado)
 *   - maskable-192.png / maskable-512.png (propósito "maskable": fondo full-bleed,
 *     contenido dentro de la safe zone central del 80% / radio 0.4 del lienzo)
 *
 * Diseño: barra de pesas + texto "GYM PRO", paleta GYM PRO (#0B0E14 / #C6FF3D).
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/* ────────────────────────── Utilidades de color ────────────────────────── */
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, f) => a + (b - a) * f;

/** Mezcla dos colores [r,g,b] con factor f. */
function mix(c1, c2, f) {
  return [
    lerp(c1[0], c2[0], f),
    lerp(c1[1], c2[1], f),
    lerp(c1[2], c2[2], f),
  ];
}

const COLOR_BG_TOP = [0x13, 0x18, 0x22];   // #131822
const COLOR_BG_BOTTOM = [0x0b, 0x0e, 0x14]; // #0B0E14
const COLOR_ACCENT_1 = [0xd4, 0xff, 0x5e]; // #D4FF5E
const COLOR_ACCENT_2 = [0xc6, 0xff, 0x3d]; // #C6FF3D
const COLOR_LIGHT = [0xf4, 0xf6, 0xfb];    // #F4F6FB
const COLOR_GRAY = [0x9a, 0xa4, 0xbd];     // #9AA4BD
const COLOR_NOTCH = [0x13, 0x18, 0x22];    // #131822 (separadores de la barra)

/** Gradiente diagonal del fondo (de arriba-izquierda a abajo-derecha). */
function gradientBg(x, y, size) {
  const t = (x + y) / (2 * (size - 1));
  return mix(COLOR_BG_TOP, COLOR_BG_BOTTOM, clamp01(t));
}

/** Gradiente del acento a lo largo de la mancuerna (izquierda→derecha). */
function accentGradient(x, x0, x1) {
  const f = clamp01((x - x0) / (x1 - x0));
  return mix(COLOR_ACCENT_1, COLOR_ACCENT_2, f);
}

/* ────────────────────────── Codificador PNG │ RGBA ────────────────────────── */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** Codifica un buffer RGBA (W*H*4, filas en orden top→bottom) a PNG. */
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // compression=0, filter=0, interlace=0 (ya son 0)

  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtro None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ─────────────────────────────── Primitivas ─────────────────────────────── */
/**
 * Cobertura de un rectángulo redondeado en (x,y).
 * rect = {x, y, w, h, r}. Devuelve 0..1 con anti-aliasing por supersample 2x2.
 */
function rrCoverage(px, py, rect) {
  const k = SAMPLE;
  let hits = 0;
  for (let sy = 0; sy < k; sy++) {
    for (let sx = 0; sx < k; sx++) {
      const fx = px + (sx + 0.5) / k;
      const fy = py + (sy + 0.5) / k;
      if (inRoundRect(fx, fy, rect)) hits++;
    }
  }
  return hits / (k * k);
}

function inRoundRect(x, y, rect) {
  const { x: rx, y: ry, w, h, r } = rect;
  const left = rx, right = rx + w, top = ry, bottom = ry + h;
  const rr = Math.min(r, w / 2, h / 2);
  if (x < left || x > right || y < top || y > bottom) return false;
  // Centra esquinas
  const cx = Math.min(Math.max(x, left + rr), right - rr);
  const cy = Math.min(Math.max(y, top + rr), bottom - rr);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= rr * rr;
}

const SAMPLE = 2; // supersample por píxel (anti-aliasing del recorte "any")

/* ─────────────────────────────── Fuente 5x7 ─────────────────────────────── */
const GLYPHS = {
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  M: ['10001', '10001', '11011', '10101', '10101', '10101', '10001'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
};
const TEXT_CHARS = ['G', 'Y', 'M', ' ', 'P', 'R', 'O'];

/** Cobertura (0/1) del píxel dentro del texto centrado en (cx, cy), escala `s`. */
function textCoverage(px, py, cx, cy, s) {
  const totalUnits = TEXT_CHARS.length * 6; // 7 celdas × 6 unidades (5 ancho + 1 espacio)
  const textW = totalUnits * s;
  const x0 = cx - textW / 2;
  const top = cy - (7 * s) / 2;
  for (let ci = 0; ci < TEXT_CHARS.length; ci++) {
    const glyph = GLYPHS[TEXT_CHARS[ci]];
    if (!glyph) continue; // espacio
    for (let row = 0; row < 7; row++) {
      const line = glyph[row];
      for (let col = 0; col < 5; col++) {
        if (line[col] === '0') continue;
        const cellX = x0 + (ci * 6 + col) * s;
        const cellY = top + row * s;
        if (px >= cellX && px < cellX + s && py >= cellY && py < cellY + s) return 1;
      }
    }
  }
  return 0;
}

/* ─────────────────────────────── drawIcon ─────────────────────────────── */
/**
 * Dibuja un píxel del ícono completo (fondo degradado + mancuerna + pill + texto).
 * mode: 'any' → esquinas redondeadas transparentes (propósito "any");
 *       'maskable' → fondo full-bleed, contenido dentro de la safe zone (r=0.4).
 * Todos los rects se definen en un espacio normalizado 512 y se escalan por `k`.
 */
function drawIcon(size, px, py, mode) {
  const S = 512;
  const k = size / S;
  const o = mode === 'maskable' ? 0.92 : 1; // márgen de safe zone 80% (radio 0.4·S)
  // Mapea coordenadas fuente (espacio 512) escalando hacia el centro para
  // mantener TODO el contenido dentro de la zona segura del maskable.
  const X = (px / k - 256) / o + 256;
  const Y = (py / k - 256) / o + 256;
  const cx = size / 2;

  // ── 1) Fondo degradado (opaco en ambos modos) ──
  const bg = gradientBg(X, Y, S);
  let r = bg[0], g = bg[1], b = bg[2];

  // ── 2) Recorte "any": roundrect con radio 112/512 → alpha 0 fuera ──
  let alpha = 1;
  if (mode === 'any') {
    const rad = 112;
    const hw = S / 2;
    let cov = 0;
    for (let sy = 0; sy < SAMPLE; sy++) {
      for (let sx = 0; sx < SAMPLE; sx++) {
        const fx = X + (sx + 0.5) / SAMPLE - 0.5;
        const fy = Y + (sy + 0.5) / SAMPLE - 0.5;
        const ax0 = Math.abs(fx - hw), ay0 = Math.abs(fy - hw);
        const qx = ax0 - (hw - rad), qy = ay0 - (hw - rad);
        const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
        const od = Math.hypot(ox, oy);
        const d = od + Math.min(Math.max(qx, qy), 0) - rad;
        cov += d <= 0 ? 1 : clamp01(0.5 - d);
      }
    }
    alpha = cov / (SAMPLE * SAMPLE);
  }

  // ── 3) Pill del texto (fondo suave del "GYM PRO") ──
  // Centrada horizontalmente, a ~80% de la altura (dentro de la safe zone).
  const pillX = cx - (112 * k);
  const pillY = k * 384;
  const pill = { x: pillX, y: pillY, w: 224 * k, h: 44 * k, r: 22 * k };
  const pillCov = rrCoverage(px, py, pill);
  if (pillCov > 0) {
    r = lerp(r, 198, pillCov * 0.14);
    g = lerp(g, 255, pillCov * 0.14);
    b = lerp(b, 61, pillCov * 0.12);
  }

  // ── 4) Mancuerna (rects en espacio 512, escalados por k) ──
  const bar = { x: 148, y: 240, w: 216, h: 32, r: 10 };
  const discs = [
    { x: 70, y: 160, w: 36, h: 192, r: 18 },   // disco izq (exterior, acento)
    { x: 120, y: 196, w: 28, h: 120, r: 14 },  // disco izq (interior, claro)
    { x: 364, y: 196, w: 28, h: 120, r: 14 },  // disco der (interior, claro)
    { x: 406, y: 160, w: 36, h: 192, r: 18 },  // disco der (exterior, acento)
  ];

  // barra central (gris): pintar primero para que los discos queden encima
  let c = rrCoverage(px, py, { x: bar.x * k, y: bar.y * k, w: bar.w * k, h: bar.h * k, r: bar.r * k });
  if (c > 0) {
    r = lerp(r, COLOR_GRAY[0], c * 0.85);
    g = lerp(g, COLOR_GRAY[1], c * 0.85);
    b = lerp(b, COLOR_GRAY[2], c * 0.85);
  }

  // muescas separadoras de la barra (3 lineas verticales oscuras)
  for (const nx of [230, 256, 282]) {
    c = rrCoverage(px, py, { x: nx * k, y: 240 * k, w: 4 * k, h: 32 * k, r: 2 * k });
    if (c > 0) {
      r = lerp(r, COLOR_NOTCH[0], c * 0.9);
      g = lerp(g, COLOR_NOTCH[1], c * 0.9);
      b = lerp(b, COLOR_NOTCH[2], c * 0.9);
    }
  }

  // discos: el exterior usa el gradiente de acento, el interior el claro
  let i = 0;
  for (const d of discs) {
    const cov = rrCoverage(px, py, { x: d.x * k, y: d.y * k, w: d.w * k, h: d.h * k, r: d.r * k });
    if (cov > 0) {
      if (i === 0 || i === 3) {
        const acc = accentGradient(X, 70, 442);
        r = lerp(r, acc[0], cov);
        g = lerp(g, acc[1], cov);
        b = lerp(b, acc[2], cov);
      } else {
        r = lerp(r, COLOR_LIGHT[0], cov);
        g = lerp(g, COLOR_LIGHT[1], cov);
        b = lerp(b, COLOR_LIGHT[2], cov);
      }
    }
    i++;
  }

  // ── 5) Texto "GYM PRO" (acento, centrado a ~84% de la altura) ──
  const s = 4 * k;
  const tc = textCoverage(px, py, cx, k * 406, s);
  if (tc > 0) {
    r = lerp(r, COLOR_ACCENT_2[0], tc);
    g = lerp(g, COLOR_ACCENT_2[1], tc);
    b = lerp(b, COLOR_ACCENT_2[2], tc);
  }

  return [Math.round(r), Math.round(g), Math.round(b), Math.round(255 * alpha)];
}

/* ─────────────────────── Generación y escritura de PNG ─────────────────────── */
function render(size, mode) {
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = drawIcon(size, x, y, mode);
      const i = (y * size + x) * 4;
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
    }
  }
  return buf;
}

/** Downsample por promediado de caja (512 → 192) manteniendo el AA. */
function downscale(src, srcSize, dstSize) {
  const wing = srcSize / dstSize;
  const out = Buffer.alloc(dstSize * dstSize * 4);
  for (let dy = 0; dy < dstSize; dy++) {
    const y0 = Math.floor(dy * wing);
    const y1 = Math.min(srcSize, Math.ceil((dy + 1) * wing));
    for (let dx = 0; dx < dstSize; dx++) {
      const x0 = Math.floor(dx * wing);
      const x1 = Math.min(srcSize, Math.ceil((dx + 1) * wing));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * srcSize + x) * 4;
          r += src[i]; g += src[i + 1]; b += src[i + 2]; a += src[i + 3]; n++;
        }
      }
      const o = (dy * dstSize + dx) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

const OUT_DIR = path.resolve(process.cwd(), 'public/icons');
fs.mkdirSync(OUT_DIR, { recursive: true });

const jobs = [
  ['icon-512.png', render(512, 'any')],
  ['icon-192.png', downscale(render(512, 'any'), 512, 192)],
  ['maskable-512.png', render(512, 'maskable')],
  ['maskable-192.png', downscale(render(512, 'maskable'), 512, 192)],
];

for (const [name, rgba] of jobs) {
  const size = name.includes('192') ? 192 : 512;
  const png = encodePNG(size, size, rgba);
  fs.writeFileSync(path.join(OUT_DIR, name), png);
  console.log(`✔ ${name}  (${size}×${size}, ${(png.length / 1024).toFixed(1)} KB)`);
}