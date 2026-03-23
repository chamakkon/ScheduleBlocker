// Generates a 1024x1024 PNG icon using a simple Canvas-like approach via raw pixel data
// Since we don't have ImageMagick/rsvg, we'll create a minimal PNG using Node.js
import { writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// We'll use a simple HTML-based approach: render SVG in a headless context
// But simpler: just create PNG from the SVG using Electron itself
// Actually, let's just use a solid color icon and proper shape

// Create a simple but good-looking PNG using raw pixels and zlib
import zlib from "node:zlib";

const SIZE = 1024;

function createPng(width, height, pixelFn) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  function chunk(type, data) {
    const buf = Buffer.alloc(4 + type.length + data.length + 4);
    buf.writeUInt32BE(data.length, 0);
    buf.write(type, 4);
    data.copy(buf, 4 + type.length);
    const crc = crc32(Buffer.concat([Buffer.from(type), data]));
    buf.writeUInt32BE(crc, buf.length - 4);
    return buf;
  }
  
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ -1) >>> 0;
  }
  
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  
  // IDAT
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const off = y * (1 + width * 4) + 1 + x * 4;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(raw, { level: 6 });
  
  // IEND
  const iend = Buffer.alloc(0);
  
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", iend)
  ]);
}

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}

function blend(bg, fg, alpha) {
  return Math.round(bg * (1 - alpha) + fg * alpha);
}

function roundedRect(x, y, rx, ry, rw, rh, radius) {
  const dx = Math.max(rx, Math.min(x, rx + rw)) - x;
  const dy = Math.max(ry, Math.min(y, ry + rh)) - y;
  if (dx !== 0 || dy !== 0) return false;
  
  const corners = [
    [rx + radius, ry + radius],
    [rx + rw - radius, ry + radius],
    [rx + radius, ry + rh - radius],
    [rx + rw - radius, ry + rh - radius]
  ];
  
  for (const [cx, cy] of corners) {
    const cdx = x - cx;
    const cdy = y - cy;
    if (
      ((x < rx + radius || x > rx + rw - radius) && (y < ry + radius || y > ry + rh - radius)) &&
      (cdx * cdx + cdy * cdy > radius * radius)
    ) {
      return false;
    }
  }
  return true;
}

const blocks = [
  { y: 180, h: 100, color: "#039be5" },
  { y: 310, h: 80,  color: "#f6bf26" },
  { y: 420, h: 160, color: "#8e24aa" },
  { y: 640, h: 80,  color: "#33b679" },
  { y: 750, h: 80,  color: "#e67c73" },
];

const bgTop = hexToRgb("#1e1e1e");
const bgBot = hexToRgb("#2d2d2d");
const gridColor = hexToRgb("#3c3c3c");
const timeLineColor = hexToRgb("#f44336");

const png = createPng(SIZE, SIZE, (x, y) => {
  // Background with rounded corners
  if (!roundedRect(x, y, 0, 0, SIZE, SIZE, 180)) {
    return [0, 0, 0, 0];
  }
  
  const t = y / SIZE;
  let r = blend(bgTop[0], bgBot[0], t);
  let g = blend(bgTop[1], bgBot[1], t);
  let b = blend(bgTop[2], bgBot[2], t);
  let a = 255;
  
  // Vertical grid line at x=280
  if (x >= 279 && x <= 281 && y >= 180 && y <= 844) {
    [r, g, b] = gridColor;
  }
  
  // Horizontal grid lines
  const hLines = [290, 400, 510, 620, 730];
  for (const ly of hLines) {
    if (y >= ly - 1 && y <= ly + 1 && x >= 280 && x <= 820) {
      [r, g, b] = gridColor;
    }
  }
  
  // Schedule blocks
  for (const block of blocks) {
    if (x >= 296 && x <= 804 && y >= block.y && y < block.y + block.h) {
      const bc = hexToRgb(block.color);
      r = blend(r, bc[0], 0.85);
      g = blend(g, bc[1], 0.85);
      b = blend(b, bc[2], 0.85);
    }
  }
  
  // Current time red line at y=460
  if (y >= 459 && y <= 461 && x >= 280 && x <= 820) {
    [r, g, b] = timeLineColor;
  }
  // Red dot
  const dotDx = x - 280;
  const dotDy = y - 460;
  if (dotDx * dotDx + dotDy * dotDy <= 36) {
    [r, g, b] = timeLineColor;
  }
  
  return [r, g, b, a];
});

const pngPath = join(__dirname, "icon.png");
writeFileSync(pngPath, png);
console.log("Generated icon.png:", pngPath);
