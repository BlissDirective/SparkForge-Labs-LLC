/**
 * SparkForge PWA Icon Generator
 *
 * Generates branded PWA assets with the crystalline glassmorphic aesthetic
 * inspired by the Hero Animation and 3D Cockpit Panoramic Architecture.
 *
 * Visual language:
 * - Background: Deep void (#0A0E16) with aurora gradients and star particles
 * - Logo: "SF" monogram with crystalline glass material, neon blue glow
 * - Accent: Frost-Prismatic #00BBFF with purple (#AA66FF) and cyan (#06B6D4) aurora
 * - Chrome bezel ring with emissive glow
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// ─── Design Tokens (from Frost-Prismatic + Hero Animation) ───
const COLORS = {
  void: '#0A0E16',
  voidRGB: '10,14,22',
  surface: '#111118',
  neonBlue: '#00BBFF',
  neonCyan: '#00FFFF',
  auroraBlue: '#3B82F6',
  auroraPurple: '#8B5CF6',
  auroraTeal: '#06B6D4',
  crystalWhite: '#B3D9FF',
  chromeEdge: 'rgba(255,255,255,0.12)',
  chromeHighlight: 'rgba(255,255,255,0.18)',
  chromeSpecular: 'rgba(255,255,255,0.25)',
};

/**
 * Generate the main SparkForge icon SVG at a given size.
 * Features: aurora background, star field, chrome bezel ring, crystalline "SF" logo
 */
function generateIconSVG(size) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.46;
  const bezelR = size * 0.42;
  const innerR = size * 0.38;
  const starCount = Math.floor(size * 0.15);

  // Generate deterministic star positions
  let stars = '';
  for (let i = 0; i < starCount; i++) {
    const seed = (i * 7919 + 1301) % 10000;
    const x = (seed % 100) / 100 * size;
    const y = Math.floor(seed / 100) / 100 * size;
    const r = 0.3 + (seed % 3) * 0.4;
    const opacity = 0.3 + (seed % 5) * 0.12;
    stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="white" opacity="${opacity.toFixed(2)}"/>`;
  }

  // Font size scales with icon
  const fontSize = size * 0.32;
  const letterSpacing = size * 0.02;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <!-- Aurora gradient background -->
    <radialGradient id="bg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#1a1e3a"/>
      <stop offset="40%" stop-color="#12162a"/>
      <stop offset="100%" stop-color="${COLORS.void}"/>
    </radialGradient>

    <!-- Aurora sweep 1: blue-purple -->
    <radialGradient id="aurora1" cx="30%" cy="25%" r="55%">
      <stop offset="0%" stop-color="${COLORS.auroraBlue}" stop-opacity="0.35"/>
      <stop offset="50%" stop-color="${COLORS.auroraPurple}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
    </radialGradient>

    <!-- Aurora sweep 2: teal-cyan -->
    <radialGradient id="aurora2" cx="70%" cy="60%" r="50%">
      <stop offset="0%" stop-color="${COLORS.auroraTeal}" stop-opacity="0.25"/>
      <stop offset="60%" stop-color="${COLORS.neonBlue}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="transparent" stop-opacity="0"/>
    </radialGradient>

    <!-- Chrome bezel gradient -->
    <linearGradient id="bezel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.20)"/>
      <stop offset="25%" stop-color="rgba(255,255,255,0.08)"/>
      <stop offset="50%" stop-color="rgba(255,255,255,0.15)"/>
      <stop offset="75%" stop-color="rgba(255,255,255,0.06)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.12)"/>
    </linearGradient>

    <!-- Neon glow outer ring -->
    <radialGradient id="ringGlow" cx="50%" cy="50%" r="52%">
      <stop offset="80%" stop-color="transparent"/>
      <stop offset="90%" stop-color="${COLORS.neonBlue}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${COLORS.neonBlue}" stop-opacity="0"/>
    </radialGradient>

    <!-- Crystalline text gradient (glassmorphic) -->
    <linearGradient id="crystalText" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="20%" stop-color="${COLORS.crystalWhite}" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="${COLORS.neonBlue}" stop-opacity="0.85"/>
      <stop offset="80%" stop-color="${COLORS.crystalWhite}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.95"/>
    </linearGradient>

    <!-- Crystalline inner glow -->
    <linearGradient id="crystalInner" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.neonCyan}" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="${COLORS.neonBlue}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${COLORS.auroraPurple}" stop-opacity="0.3"/>
    </linearGradient>

    <!-- Text neon glow filter -->
    <filter id="textGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${size * 0.012}" result="blur1"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="${size * 0.025}" result="blur2"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="${size * 0.05}" result="blur3"/>
      <feMerge>
        <feMergeNode in="blur3"/>
        <feMergeNode in="blur2"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Bezel ring glow -->
    <filter id="bezelGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="${size * 0.008}"/>
    </filter>

    <!-- Subtle inner shadow for depth -->
    <filter id="innerDepth" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${size * 0.015}" result="shadow"/>
      <feOffset dx="0" dy="${size * 0.005}"/>
      <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feFlood flood-color="${COLORS.neonBlue}" flood-opacity="0.15"/>
      <feComposite in2="SourceGraphic" operator="in"/>
      <feMerge>
        <feMergeNode in="SourceGraphic"/>
        <feMergeNode/>
      </feMerge>
    </filter>

    <!-- Clip to circle -->
    <clipPath id="circleClip">
      <circle cx="${cx}" cy="${cy}" r="${size / 2}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <g clip-path="url(#circleClip)">
    <!-- Deep void base -->
    <rect width="${size}" height="${size}" fill="url(#bg)"/>

    <!-- Star field -->
    ${stars}

    <!-- Aurora layers -->
    <rect width="${size}" height="${size}" fill="url(#aurora1)"/>
    <rect width="${size}" height="${size}" fill="url(#aurora2)"/>

    <!-- Subtle radial vignette -->
    <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
      <stop offset="60%" stop-color="transparent"/>
      <stop offset="100%" stop-color="${COLORS.void}" stop-opacity="0.7"/>
    </radialGradient>
    <rect width="${size}" height="${size}" fill="url(#vignette)"/>
  </g>

  <!-- Outer neon glow ring -->
  <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${COLORS.neonBlue}" stroke-width="${size * 0.004}" opacity="0.4" filter="url(#bezelGlow)"/>

  <!-- Chrome bezel ring -->
  <circle cx="${cx}" cy="${cy}" r="${bezelR}" fill="none" stroke="url(#bezel)" stroke-width="${size * 0.025}"/>

  <!-- Inner glow ring (emissive edge) -->
  <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${COLORS.neonBlue}" stroke-width="${size * 0.003}" opacity="0.6"/>

  <!-- Bezel specular highlight (top arc) -->
  <path d="M ${cx - bezelR * 0.7} ${cy - bezelR * 0.7} A ${bezelR} ${bezelR} 0 0 1 ${cx + bezelR * 0.7} ${cy - bezelR * 0.7}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="${size * 0.008}" stroke-linecap="round"/>

  <!-- Inner circle (glassmorphic panel) -->
  <circle cx="${cx}" cy="${cy}" r="${innerR - size * 0.01}" fill="${COLORS.void}" fill-opacity="0.6"/>
  <circle cx="${cx}" cy="${cy}" r="${innerR - size * 0.01}" fill="url(#crystalInner)" opacity="0.15"/>

  <!-- "SF" crystalline logo text -->
  <g filter="url(#textGlow)">
    <text x="${cx}" y="${cy + fontSize * 0.33}"
          font-family="'Exo 2', 'Segoe UI', Arial, sans-serif"
          font-weight="800"
          font-size="${fontSize}px"
          letter-spacing="${letterSpacing}px"
          text-anchor="middle"
          fill="url(#crystalText)">SF</text>
  </g>

  <!-- Crystalline refraction highlight on text -->
  <g opacity="0.3">
    <text x="${cx}" y="${cy + fontSize * 0.33}"
          font-family="'Exo 2', 'Segoe UI', Arial, sans-serif"
          font-weight="800"
          font-size="${fontSize}px"
          letter-spacing="${letterSpacing}px"
          text-anchor="middle"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          stroke-width="${size * 0.002}">SF</text>
  </g>

  <!-- Small accent dots (LED indicators like cockpit HUD) -->
  <circle cx="${cx}" cy="${cy - innerR + size * 0.04}" r="${size * 0.008}" fill="${COLORS.neonBlue}" opacity="0.8"/>
  <circle cx="${cx}" cy="${cy + innerR - size * 0.04}" r="${size * 0.008}" fill="${COLORS.neonBlue}" opacity="0.5"/>
  <circle cx="${cx - innerR + size * 0.04}" cy="${cy}" r="${size * 0.006}" fill="${COLORS.auroraPurple}" opacity="0.6"/>
  <circle cx="${cx + innerR - size * 0.04}" cy="${cy}" r="${size * 0.006}" fill="${COLORS.auroraTeal}" opacity="0.6"/>
</svg>`;
}

/**
 * Generate OG image SVG (1200x630) — wider format for social sharing.
 * Features: full aurora background, chrome frame, "SparkForge" wordmark + tagline
 */
function generateOGImageSVG() {
  const w = 1200;
  const h = 630;
  const starCount = 80;

  let stars = '';
  for (let i = 0; i < starCount; i++) {
    const seed = (i * 7919 + 1301) % 10000;
    const x = (seed % 100) / 100 * w;
    const y = Math.floor(seed / 100) / 100 * h;
    const r = 0.5 + (seed % 3) * 0.5;
    const opacity = 0.2 + (seed % 5) * 0.1;
    stars += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="white" opacity="${opacity.toFixed(2)}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="ogBg" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#1a1e3a"/>
      <stop offset="40%" stop-color="#12162a"/>
      <stop offset="100%" stop-color="${COLORS.void}"/>
    </radialGradient>
    <radialGradient id="ogAurora1" cx="25%" cy="30%" r="50%">
      <stop offset="0%" stop-color="${COLORS.auroraBlue}" stop-opacity="0.3"/>
      <stop offset="50%" stop-color="${COLORS.auroraPurple}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <radialGradient id="ogAurora2" cx="75%" cy="55%" r="45%">
      <stop offset="0%" stop-color="${COLORS.auroraTeal}" stop-opacity="0.2"/>
      <stop offset="60%" stop-color="${COLORS.neonBlue}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
    <linearGradient id="ogBezel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.15)"/>
      <stop offset="50%" stop-color="rgba(255,255,255,0.06)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.10)"/>
    </linearGradient>
    <linearGradient id="ogTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="30%" stop-color="${COLORS.crystalWhite}"/>
      <stop offset="60%" stop-color="${COLORS.neonBlue}"/>
      <stop offset="100%" stop-color="#FFFFFF"/>
    </linearGradient>
    <filter id="ogGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b1"/>
      <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="b2"/>
      <feMerge>
        <feMergeNode in="b2"/>
        <feMergeNode in="b1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="ogSubGlow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
    </filter>
    <radialGradient id="ogVignette" cx="50%" cy="50%" r="60%">
      <stop offset="50%" stop-color="transparent"/>
      <stop offset="100%" stop-color="${COLORS.void}" stop-opacity="0.8"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${h}" fill="url(#ogBg)"/>
  ${stars}
  <rect width="${w}" height="${h}" fill="url(#ogAurora1)"/>
  <rect width="${w}" height="${h}" fill="url(#ogAurora2)"/>
  <rect width="${w}" height="${h}" fill="url(#ogVignette)"/>

  <!-- Chrome frame border -->
  <rect x="20" y="20" width="${w - 40}" height="${h - 40}" rx="16" ry="16" fill="none" stroke="url(#ogBezel)" stroke-width="2"/>

  <!-- Inner neon border -->
  <rect x="28" y="28" width="${w - 56}" height="${h - 56}" rx="12" ry="12" fill="none" stroke="${COLORS.neonBlue}" stroke-width="0.5" opacity="0.4"/>

  <!-- SF monogram (left side) -->
  <g filter="url(#ogGlow)" transform="translate(280, 315)">
    <text x="0" y="0"
          font-family="'Exo 2', 'Segoe UI', Arial, sans-serif"
          font-weight="800"
          font-size="140px"
          text-anchor="middle"
          fill="url(#ogTextGrad)">SF</text>
  </g>

  <!-- Divider line -->
  <line x1="430" y1="220" x2="430" y2="410" stroke="${COLORS.neonBlue}" stroke-width="1" opacity="0.4"/>
  <line x1="430" y1="230" x2="430" y2="400" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>

  <!-- "SparkForge" wordmark -->
  <g filter="url(#ogSubGlow)">
    <text x="480" y="300"
          font-family="'Exo 2', 'Segoe UI', Arial, sans-serif"
          font-weight="700"
          font-size="64px"
          fill="white">SparkForge</text>
  </g>

  <!-- Tagline -->
  <text x="480" y="350"
        font-family="'Sora', 'Segoe UI', Arial, sans-serif"
        font-weight="400"
        font-size="22px"
        fill="${COLORS.neonBlue}" opacity="0.8">AI Learning Lab for Young Explorers</text>

  <!-- HUD accent dots (cockpit style) -->
  <circle cx="60" cy="60" r="3" fill="${COLORS.neonBlue}" opacity="0.6"/>
  <circle cx="${w - 60}" cy="60" r="3" fill="${COLORS.auroraPurple}" opacity="0.6"/>
  <circle cx="60" cy="${h - 60}" r="3" fill="${COLORS.auroraTeal}" opacity="0.6"/>
  <circle cx="${w - 60}" cy="${h - 60}" r="3" fill="${COLORS.neonBlue}" opacity="0.6"/>

  <!-- Horizontal accent lines (HUD scanner style) -->
  <line x1="80" y1="60" x2="200" y2="60" stroke="${COLORS.neonBlue}" stroke-width="0.5" opacity="0.3"/>
  <line x1="${w - 200}" y1="60" x2="${w - 80}" y2="60" stroke="${COLORS.auroraPurple}" stroke-width="0.5" opacity="0.3"/>
  <line x1="80" y1="${h - 60}" x2="200" y2="${h - 60}" stroke="${COLORS.auroraTeal}" stroke-width="0.5" opacity="0.3"/>
  <line x1="${w - 200}" y1="${h - 60}" x2="${w - 80}" y2="${h - 60}" stroke="${COLORS.neonBlue}" stroke-width="0.5" opacity="0.3"/>

  <!-- Bottom status text (cockpit aesthetic) -->
  <text x="${w / 2}" y="${h - 45}"
        font-family="'Orbitron', 'Courier New', monospace"
        font-weight="400"
        font-size="11px"
        text-anchor="middle"
        fill="${COLORS.neonBlue}"
        opacity="0.4">SYS:NOMINAL  ·  NET:ACTIVE  ·  AI:ONLINE</text>
</svg>`;
}

async function generateIcon(size, filename) {
  const svg = generateIconSVG(size);
  const buffer = Buffer.from(svg);
  await sharp(buffer).png().toFile(join(PUBLIC_DIR, filename));
  console.log(`  ✓ ${filename} (${size}×${size})`);
}

async function generateFavicon() {
  // Generate 32x32 PNG first, then convert to ICO format
  // ICO is just a PNG wrapped in ICO container — modern browsers accept PNG favicons
  const svg32 = generateIconSVG(32);
  const svg16 = generateIconSVG(16);

  // Generate 32px PNG as the base favicon
  const buffer32 = Buffer.from(svg32);
  await sharp(buffer32).png().toFile(join(PUBLIC_DIR, 'favicon.png'));

  // For .ico, we'll create a 32x32 PNG — Next.js and modern browsers handle PNG favicons
  // Also output as favicon.ico (sharp outputs PNG, browsers accept it)
  await sharp(buffer32).png().toFile(join(PUBLIC_DIR, 'favicon.ico'));
  console.log('  ✓ favicon.ico (32×32 PNG)');
  console.log('  ✓ favicon.png (32×32)');
}

async function generateOGImage() {
  const svg = generateOGImageSVG();
  const buffer = Buffer.from(svg);
  await sharp(buffer).png().toFile(join(PUBLIC_DIR, 'og-image.png'));
  console.log('  ✓ og-image.png (1200×630)');
}

async function main() {
  console.log('');
  console.log('🔷 SparkForge PWA Icon Generator');
  console.log('   Frost-Prismatic Crystalline Branding');
  console.log('─'.repeat(45));
  console.log('');

  // Ensure public dir exists
  if (!existsSync(PUBLIC_DIR)) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Generate all icons
  await generateIcon(512, 'icon-512.png');
  await generateIcon(192, 'icon-192.png');
  await generateIcon(180, 'apple-touch-icon.png');
  await generateFavicon();
  await generateOGImage();

  console.log('');
  console.log('─'.repeat(45));
  console.log('✅ All PWA assets generated in public/');
  console.log('');
}

main().catch(console.error);
