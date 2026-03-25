#!/usr/bin/env node

// ================================================================
// SparkForge — Frost-Prismatic HDRI Generator (No Dependencies)
// ================================================================
//
// Generates a valid Radiance RGBE (.hdr) file programmatically.
// Matches the spec in public/hdri/README-frost-prismatic.md:
//   - Dark studio background (#0a0a14)
//   - Blue key light (#3B82F6, intensity 3.0, left 45°)
//   - Purple fill light (#8B5CF6, intensity 1.5, right 30°)
//   - Teal rim light (#06B6D4, intensity 2.0, top 60°)
//   - 1024x512 equirectangular
//
// Usage:
//   node tools/generate-frost-prismatic-hdri.js
//
// Output:
//   public/hdri/frost-prismatic.hdr
// ================================================================

const fs = require('fs');
const path = require('path');

// ── Configuration ────────────────────────────────────────────────

const WIDTH = 1024;
const HEIGHT = 512;
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'hdri', 'frost-prismatic.hdr');

// Background: dark studio #0a0a14 (sRGB → linear)
const BG = srgbToLinear(0x0a / 255, 0x0a / 255, 0x14 / 255);

// Light definitions
const LIGHTS = [
  {
    name: 'Blue Key',
    color: srgbToLinear(0x3b / 255, 0x82 / 255, 0xf6 / 255),
    intensity: 3.0,
    // Direction FROM light TO origin (light is left, up, forward)
    direction: normalize([-0.7, 0.5, 0.5]),
    angularSize: 0.15, // Radians — controls how soft/spread the light is
    falloff: 8.0,      // Higher = sharper light disc
  },
  {
    name: 'Purple Fill',
    color: srgbToLinear(0x8b / 255, 0x5c / 255, 0xf6 / 255),
    intensity: 1.5,
    direction: normalize([0.6, 0.4, 0.5]),
    angularSize: 0.20,
    falloff: 6.0,
  },
  {
    name: 'Teal Rim',
    color: srgbToLinear(0x06 / 255, 0xb6 / 255, 0xd4 / 255),
    intensity: 2.0,
    direction: normalize([0.0, 0.85, -0.3]),
    angularSize: 0.25,
    falloff: 5.0,
  },
  // Subtle accent: warm floor bounce
  {
    name: 'Warm Bounce',
    color: srgbToLinear(0.4, 0.25, 0.12),
    intensity: 0.3,
    direction: normalize([0.0, -0.9, 0.1]),
    angularSize: 0.5,
    falloff: 2.0,
  },
  // Subtle accent: cool back fill
  {
    name: 'Cool Back',
    color: srgbToLinear(0.05, 0.08, 0.25),
    intensity: 0.4,
    direction: normalize([0.0, 0.3, -0.9]),
    angularSize: 0.3,
    falloff: 3.0,
  },
];

// ── Math Utilities ───────────────────────────────────────────────

function srgbToLinear(r, g, b) {
  const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return [toLinear(r), toLinear(g), toLinear(b)];
}

function normalize(v) {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  return [v[0] / len, v[1] / len, v[2] / len];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

// Convert equirectangular UV → 3D direction vector
function uvToDirection(u, v) {
  const theta = u * 2.0 * Math.PI;        // Horizontal angle [0, 2π]
  const phi = v * Math.PI;                 // Vertical angle [0, π]

  return [
    Math.sin(phi) * Math.sin(theta),       // X
    Math.cos(phi),                          // Y (up)
    Math.sin(phi) * Math.cos(theta),       // Z
  ];
}

// Simple noise for subtle variation (avoids perfectly smooth gradients)
function hash(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return (h & 0x7fffffff) / 0x7fffffff; // [0, 1]
}

// ── HDR Pixel Generation ─────────────────────────────────────────

function computePixel(px, py) {
  const u = (px + 0.5) / WIDTH;
  const v = (py + 0.5) / HEIGHT;
  const dir = uvToDirection(u, v);

  // Start with background
  let r = BG[0];
  let g = BG[1];
  let b = BG[2];

  // Add subtle vertical gradient (slightly brighter at top for depth)
  const vertGrad = Math.max(0, dir[1]) * 0.008;
  r += vertGrad * 0.3;
  g += vertGrad * 0.4;
  b += vertGrad * 0.8;

  // Accumulate each light's contribution
  for (const light of LIGHTS) {
    // Angle between pixel direction and light direction
    const cosAngle = dot(dir, light.direction);

    // Smooth falloff based on angular distance from light center
    // Using smoothstep-like function for soft-edged area lights
    const angularDist = Math.acos(Math.min(1, Math.max(-1, cosAngle)));
    const t = Math.max(0, 1.0 - angularDist / light.angularSize);
    const falloff = Math.pow(t, light.falloff);

    // Add light contribution
    r += light.color[0] * light.intensity * falloff;
    g += light.color[1] * light.intensity * falloff;
    b += light.color[2] * light.intensity * falloff;
  }

  // Add very subtle noise to avoid banding in dark areas
  const noise = (hash(px, py) - 0.5) * 0.002;
  r = Math.max(0, r + noise);
  g = Math.max(0, g + noise);
  b = Math.max(0, b + noise);

  return [r, g, b];
}

// ── Radiance RGBE Format Writer ──────────────────────────────────
//
// The Radiance .hdr format stores HDR pixels as RGBE (4 bytes per pixel):
//   R, G, B = mantissa bytes (0-255)
//   E = shared exponent byte
//
// This gives ~0.4% precision per channel with a huge dynamic range.

function floatToRGBE(r, g, b) {
  const maxVal = Math.max(r, g, b);

  if (maxVal < 1e-32) {
    return [0, 0, 0, 0]; // Black
  }

  // frexp equivalent: find exponent such that maxVal = mantissa * 2^exp
  const exp = Math.ceil(Math.log2(maxVal));
  const scale = Math.pow(2, -exp) * 256;

  return [
    Math.min(255, Math.max(0, Math.floor(r * scale))),
    Math.min(255, Math.max(0, Math.floor(g * scale))),
    Math.min(255, Math.max(0, Math.floor(b * scale))),
    exp + 128, // Biased exponent
  ];
}

function writeHDR(pixels, width, height, outputPath) {
  // Radiance header
  const header = [
    '#?RADIANCE',
    '# Generated by SparkForge frost-prismatic HDRI generator',
    'FORMAT=32-bit_rle_rgbe',
    '',
    `-Y ${height} +X ${width}`,
  ].join('\n') + '\n';

  const headerBytes = Buffer.from(header, 'ascii');

  // Pixel data (simple uncompressed scanlines — no RLE for simplicity)
  // Each scanline: width * 4 bytes (RGBE)
  const pixelData = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x);
      const [r, g, b] = pixels[idx];
      const [re, ge, be, e] = floatToRGBE(r, g, b);

      const offset = idx * 4;
      pixelData[offset] = re;
      pixelData[offset + 1] = ge;
      pixelData[offset + 2] = be;
      pixelData[offset + 3] = e;
    }
  }

  // Write file
  const output = Buffer.concat([headerBytes, pixelData]);

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, output);
  return output.length;
}

// ── Main ─────────────────────────────────────────────────────────

function main() {
  console.log('='.repeat(60));
  console.log('SparkForge — Frost-Prismatic HDRI Generator');
  console.log('='.repeat(60));
  console.log();
  console.log(`Resolution: ${WIDTH} x ${HEIGHT}`);
  console.log(`Lights: ${LIGHTS.length} (3 main + 2 accent)`);
  console.log(`Output: ${OUTPUT_PATH}`);
  console.log();

  // Generate all pixels
  console.log('Generating pixels...');
  const totalPixels = WIDTH * HEIGHT;
  const pixels = new Array(totalPixels);

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      pixels[y * WIDTH + x] = computePixel(x, y);
    }

    // Progress (every 10%)
    if (y % Math.floor(HEIGHT / 10) === 0) {
      const pct = Math.floor((y / HEIGHT) * 100);
      process.stdout.write(`  ${pct}%\r`);
    }
  }
  console.log('  100% — Done!');
  console.log();

  // Write HDR file
  console.log('Writing HDR file...');
  const fileSize = writeHDR(pixels, WIDTH, HEIGHT, OUTPUT_PATH);
  const fileSizeKB = (fileSize / 1024).toFixed(1);

  console.log();
  console.log('='.repeat(60));
  console.log(`  frost-prismatic.hdr generated successfully!`);
  console.log(`  Size: ${fileSizeKB} KB`);
  console.log(`  Location: ${OUTPUT_PATH}`);
  console.log();
  console.log('  The app will automatically use this HDRI on next render.');
  console.log('  No code changes needed — preloadAssets.ts handles loading.');
  console.log('='.repeat(60));
}

main();
