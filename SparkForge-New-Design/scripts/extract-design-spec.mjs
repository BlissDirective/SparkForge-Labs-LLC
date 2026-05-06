#!/usr/bin/env node
/**
 * extract-design-spec.mjs
 *
 * Reads SparkForge's source-of-truth design files and emits three
 * design-spec JSONs into ../design-specs/ for use as v0 / motionsites.ai
 * / Lovable prompt attachments.
 *
 *   style-1-current-cockpit.json   — exact extraction of what is coded today
 *   style-2-brighter-cockpit.json  — same structure, brightened palette,
 *                                    turquoise/magenta gradient backdrop,
 *                                    increased chrome shine
 *   style-3-cyberpunk-apple.json   — synthesized: Apple-clean meets
 *                                    cyberpunk holographic, retains motion
 *                                    + bento + curvature tokens only
 *
 * Run from repo root:
 *   node SparkForge-New-Design/scripts/extract-design-spec.mjs
 *
 * No external deps — pure node fs + regex parsing. Designed to be re-run
 * any time the source files change so the JSONs stay in sync with code.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const OUT_DIR   = resolve(__dirname, '..', 'design-specs');

mkdirSync(OUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────
// Source readers — small, brittle-on-purpose regex parsers. These files
// follow strict conventions enforced by CLAUDE.md, so the regexes are
// reliable. If a parser ever returns null we throw loudly.
// ─────────────────────────────────────────────────────────────────────

function read(rel) {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf8');
}

function parseLabColors() {
  const src = read('src/config/labColors.ts');
  const rows = [...src.matchAll(
    /\{\s*id:\s*(\d+),\s*name:\s*'([^']+)',\s*hex:\s*'(#[0-9A-Fa-f]{6})',\s*oklch:\s*'(oklch\([^)]+\))',\s*family:\s*'([^']+)'/g
  )];
  if (!rows.length) throw new Error('parseLabColors: no rows matched');
  return rows.map(m => ({
    id: Number(m[1]),
    name: m[2],
    hex: m[3],
    oklch: m[4],
    family: m[5],
  }));
}

function parseBrandPalette() {
  const src = read('src/lib/branding/sf-material.config.ts');
  const out = {};
  for (const m of src.matchAll(/^\s{2}([a-zA-Z]+):\s*'(#[0-9A-Fa-f]{6,8})'/gm)) {
    out[m[1]] = m[2];
  }
  return out;
}

function parseMaterialPhysics() {
  const src = read('src/lib/branding/sf-material.config.ts');
  const block = src.match(/export const MATERIAL = \{([\s\S]+?)\} as const;/);
  if (!block) throw new Error('parseMaterialPhysics: MATERIAL block not found');
  const out = {};
  for (const m of block[1].matchAll(/^\s{2}([a-zA-Z]+):\s*([0-9.]+)/gm)) {
    out[m[1]] = Number(m[2]);
  }
  return out;
}

function parseFonts() {
  const src = read('src/app/globals.css');
  const grab = (name) => {
    const m = src.match(new RegExp(`--${name}:\\s*([^;]+);`));
    return m ? m[1].trim() : null;
  };
  return {
    display: grab('font-display'),
    body:    grab('font-body'),
    mono:    grab('font-mono'),
    data:    grab('font-data'),
  };
}

function parseSurfaceVars() {
  const src = read('src/app/globals.css');
  const grab = (name) => {
    const m = src.match(new RegExp(`--${name}:\\s*(oklch\\([^)]+\\))`));
    return m ? m[1] : null;
  };
  return {
    base:     grab('surface-base'),
    card:     grab('surface-card'),
    elevated: grab('surface-elevated'),
    border:   grab('surface-border'),
    textPrimary:   grab('text-primary'),
    textSecondary: grab('text-secondary'),
    textMuted:     grab('text-muted'),
    chromeEdge:      grab('chrome-edge'),
    chromeHighlight: grab('chrome-highlight'),
    chromeSpecular:  grab('chrome-specular'),
  };
}

function parseSpacingScale() {
  const src = read('src/app/globals.css');
  const out = {};
  for (const m of src.matchAll(/--space-([a-z0-9]+):\s*([0-9.]+)rem/g)) {
    out[m[1]] = `${m[2]}rem`;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Style 1 — exact current extraction
// ─────────────────────────────────────────────────────────────────────

function buildStyle1() {
  const labs = parseLabColors();
  const palette = parseBrandPalette();
  const material = parseMaterialPhysics();
  const fonts = parseFonts();
  const surface = parseSurfaceVars();
  const spacing = parseSpacingScale();

  return {
    $schema: 'sparkforge-design-spec/v1',
    style: 'style-1-current-cockpit',
    description:
      'Exact extraction of the current Frost-Prismatic Laboratory Cockpit ' +
      'design language as coded today. Dark-mode only. Use as the baseline ' +
      'reference for v0/Lovable prompts that should match the existing app.',
    brand: {
      name: 'SparkForge',
      audience: 'kids 7-16',
      mood: ['futuristic laboratory', 'command console', 'glassmorphic', 'chrome bezel', 'neon emissive'],
    },
    palette: {
      // Eye-extracted from public/branding/IMG_4607.png — locked
      brand: palette,
      // 11 lab accent colors — single source of truth
      labs,
      // Frost-Prismatic neon (OKLCH L=0.75, perceptually uniform)
      neon: {
        blue:   'oklch(0.75 0.17 225)',
        green:  'oklch(0.75 0.19 155)',
        purple: 'oklch(0.75 0.19 295)',
        orange: 'oklch(0.75 0.20 25)',
        amber:  'oklch(0.75 0.17 75)',
      },
      surface,
    },
    typography: {
      fontStacks: fonts,
      families: {
        display: 'Exo 2',
        body:    'Sora',
        mono:    'JetBrains Mono',
        data:    'Orbitron',
      },
      scale: { '2xs': '0.625rem' },
      cdn: 'Google Fonts via <link>, display=swap, fallback metrics in globals.css',
    },
    spacing: {
      grid: '4px',
      tokens: spacing,
    },
    radii: {
      tileOuter: '16px',
      tileInner: '13px',
      screenInner: '11px',
      pill: '9999px',
      content: '12px',
      elevated: '18px',
      strategy: 'three-layer chrome bezel (outer 16, LED rim 13, screen 11)',
    },
    glass: {
      base: {
        class: 'glass-card-v2',
        backdropFilter: 'blur(10px) saturate(180%) brightness(1.08)',
        background: 'linear-gradient(145deg, rgba(28,32,48,0.62) 0%, rgba(17,17,28,0.78) 100%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
        borderRadius: '16px',
        perEdgeBorder: 'top 0.22 → mid 0.08 → bottom 0.02 (light catching glass edge)',
      },
      elevated: {
        class: 'glass-card-v2-elevated',
        backdropFilter: 'blur(12px) saturate(200%) brightness(1.12)',
        background: 'linear-gradient(145deg, rgba(35,40,60,0.68) 0%, rgba(20,20,32,0.82) 100%)',
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '0 16px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
        borderRadius: '18px',
      },
    },
    chrome: {
      bezel: {
        class: 'chrome-frame',
        layers: 3,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 40%, rgba(0,0,0,0.30) 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      ledRim: {
        class: 'led-rim',
        background: 'linear-gradient(90deg, transparent 0%, var(--lab-color) 50%, transparent 100%)',
        opacity: 0.5,
      },
      screenInner: {
        class: 'screen-inner',
        background: 'var(--surface-card)',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
      },
    },
    materialPhysics: {
      // 3D-only — does not translate to CSS but documents the look intent
      ior: material.ior,
      transmission: material.transmission,
      roughness: material.roughness,
      metalness: material.metalness,
      anisotropy: material.anisotropy,
      clearcoat: material.clearcoat,
      envMapIntensity: material.envMapIntensity,
      note: 'WebGPU/TSL-only physics. Use as a target *vibe* for HTML — replicate via gradient highlights, conic-gradients, and chromatic aberration text-shadows.',
    },
    background: {
      kind: 'cosmic-dark',
      class: 'bg-cosmic-dark',
      stack: [
        'radial-gradient(ellipse at 20% 50%, rgba(0,187,255,0.03), transparent 60%)',
        'radial-gradient(ellipse at 80% 20%, rgba(170,102,255,0.02), transparent 50%)',
        'oklch(0.13 0.02 260) /* surface-base */',
      ],
      overlays: ['scanlines (rgba(0,187,255,0.03), 4px stripe)', 'corner-vignette (rgba(0,20,40,0.3))'],
    },
    curvature: {
      uiCurveDeg: 0,
      strategy: 'No CSS-level page curvature today; cockpit curve is achieved in 3D canvas. Redesign should add `transform: perspective(1200px) rotateX(2deg)` on the bento grid container as the equivalent.',
    },
    motion: {
      easings: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
        bezel:  'cubic-bezier(0.4, 0.0, 0.2, 1)',
      },
      durations: { fast: '120ms', base: '200ms', medium: '400ms', long: '600ms' },
      keyframes: [
        'float (3.5s)', 'float-slow (6s)', 'glow-pulse (3s)', 'chrome-shimmer (3s)',
        'connection-pulse (4s)', 'badge-unlock (0.8s)', 'confetti-fall (3s)',
        'slide-up-spring (0.5s)', 'scale-bounce (0.5s)', 'xp-counter (1.5s)',
        'subtle-glow (4s)', 'skeleton-shimmer (1.8s)', 'glow-border-rotate (4s)',
        'emissivePulse (3s)', 'ledRimPulse (3s)', 'holographic-sweep (3s)',
      ],
      interactiveHover: {
        transform: 'translateY(-6px) scale(1.01)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3), 0 0 20px var(--lab-glow)',
        duration: '250ms',
      },
      activePress: {
        transform: 'translateY(-2px) scale(1.0)',
        duration: '100ms',
      },
      reducedMotion: 'All animations collapse to 0.01ms; chromatic-text + skeleton-shimmer stripped',
    },
    effects: {
      neonText: 'text-shadow: 0 0 7px var(--lab-color), 0 0 10px var(--lab-color), 0 0 21px var(--lab-color)',
      gradientText: 'linear-gradient(135deg, #00BBFF, #AA66FF, #FF66AA), -webkit-background-clip: text',
      emissiveGlow: '0 0 8px color-mix(in srgb, var(--glow-color) 30%, transparent), 0 0 20px ... 15%, 0 0 40px ... 8%',
      chromaticAberration: 'text-shadow: -1px 0 0.5px #00BBFF, 1px 0 0.5px #AA66FF',
      glowBorder: 'animated rotating gradient: blue → purple → amber → blue (4s)',
      scanlines: 'repeating-linear-gradient(0deg, transparent 2px, rgba(0,187,255,0.03) 2px 4px), mix-blend-mode: overlay',
      starfield: 'radial gradients on surface-base',
    },
    accessibility: {
      colorScheme: 'dark',
      focusRing: 'outline 3px solid var(--lab-color), outline-offset 2px, double box-shadow halo (30%/40%)',
      reducedMotion: 'respected via prefers-reduced-motion + uiStore.reducedMotion',
      dyslexiaFont: 'OpenDyslexic toggle',
      fontSizePresets: ['100%', '112.5%', '125%'],
      highContrastMode: 'available',
      brightnessControl: '0.7 - 1.0 user-adjustable, applied as body filter (canvas excluded)',
    },
    bento: {
      tileSizing: ['1x1', '1x2', '2x1', '2x2'],
      gap: 'var(--space-md) /* 16px */',
      gridContainer: '12-col responsive (cols-12 lg, cols-6 md, cols-2 sm)',
      tileMinHeight: '120px',
    },
    sourceFiles: {
      labColors:    'src/config/labColors.ts',
      tailwind:     'tailwind.config.ts',
      globals:      'src/app/globals.css',
      brandMaterial:'src/lib/branding/sf-material.config.ts',
      layout:       'src/app/layout.tsx',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Style 2 — brighter, no dark-mode, turquoise/magenta gradient bg,
// MORE chrome shine on the cockpit metal.
// ─────────────────────────────────────────────────────────────────────

function buildStyle2() {
  const s1 = buildStyle1();
  return {
    ...s1,
    style: 'style-2-brighter-cockpit',
    description:
      'Brightened variant of the current cockpit. Dark mode REMOVED — surface ' +
      'is a turquoise → dark-magenta gradient. Lab/neon accents nudged brighter ' +
      'to read against the lighter backdrop. Chrome bezel shine intensified ' +
      '(higher specular, brighter highlight gradient stops). Game logic, ' +
      'layout, and motion identity unchanged.',
    brand: { ...s1.brand, mood: ['bright cockpit', 'turquoise-magenta haze', 'high-shine chrome', 'glassmorphic', 'neon emissive'] },
    palette: {
      ...s1.palette,
      // Lift labs by ~+0.05 OKLCH L for legibility on a lighter background.
      // Hex values nudged about +12% luminance via HSL approximation.
      labs: s1.palette.labs.map(l => ({
        ...l,
        oklch: l.oklch.replace(/^oklch\((0\.\d+)/, (_, v) => `oklch(${Math.min(0.92, parseFloat(v) + 0.07).toFixed(2)}`),
      })),
      neon: {
        blue:   'oklch(0.82 0.16 225)',
        green:  'oklch(0.82 0.18 155)',
        purple: 'oklch(0.82 0.18 295)',
        orange: 'oklch(0.82 0.19 25)',
        amber:  'oklch(0.82 0.16 75)',
      },
      surface: {
        // No more deep navy. Two-stop gradient with lift.
        base:     'oklch(0.62 0.13 195) /* turquoise primary */',
        card:     'oklch(0.32 0.14 340) /* dark magenta secondary */',
        elevated: 'oklch(0.42 0.12 320) /* magenta-violet elevated */',
        border:   'oklch(1.0 0 0 / 0.18)',
        textPrimary:   'oklch(0.98 0.005 280)',
        textSecondary: 'oklch(0.98 0 0 / 0.78)',
        textMuted:     'oklch(0.98 0 0 / 0.55)',
        // Chrome highlights pumped — this is the "more shine" directive.
        chromeEdge:      'oklch(1.0 0 0 / 0.16)',
        chromeHighlight: 'oklch(1.0 0 0 / 0.34)',
        chromeSpecular:  'oklch(1.0 0 0 / 0.52)',
      },
    },
    background: {
      kind: 'turquoise-magenta-gradient',
      class: 'bg-bright-station',
      stack: [
        'radial-gradient(ellipse 80% 60% at 25% 30%, oklch(0.78 0.16 195) 0%, transparent 55%) /* turquoise top-left */',
        'radial-gradient(ellipse 70% 70% at 78% 78%, oklch(0.42 0.20 340) 0%, transparent 60%) /* dark magenta bottom-right */',
        'linear-gradient(135deg, oklch(0.66 0.14 200) 0%, oklch(0.34 0.14 330) 100%) /* base diagonal */',
      ],
      overlays: [
        'subtle-noise (rgba(255,255,255,0.012) film grain)',
        'soft-vignette (rgba(0,0,0,0.18) corners) — much lighter than v1',
      ],
      note: 'Dark-mode removed. Body should NOT set color-scheme:dark. Tile fills MUST opaquely contrast their gradient backdrop (use elevated chrome bezels).',
    },
    chrome: {
      ...s1.chrome,
      bezel: {
        ...s1.chrome.bezel,
        // Brighter top stop, deeper shadow stop = more pronounced cylindrical bevel.
        background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 35%, rgba(0,0,0,0.38) 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.34), 0 0 0 0.5px rgba(255,255,255,0.10)',
        note: 'Stronger top-edge specular + hairline outer keyline simulates polished aluminum vs the v1 brushed-titanium read.',
      },
      shineSweep: {
        keyframe: 'chrome-shimmer (3s linear infinite) — already exists; v2 USES it on every bezel by default',
        background: 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)',
        size: '200% 100%',
      },
    },
    glass: {
      // Glass cards stay glassy but lighten — they sit on a brighter bg.
      base: {
        ...s1.glass.base,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)',
        backdropFilter: 'blur(14px) saturate(170%) brightness(1.05)',
        border: '1px solid rgba(255,255,255,0.28)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.34)',
      },
      elevated: {
        ...s1.glass.elevated,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)',
        backdropFilter: 'blur(16px) saturate(180%) brightness(1.08)',
        border: '1px solid rgba(255,255,255,0.36)',
        boxShadow: '0 16px 60px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.46)',
      },
    },
    motion: {
      ...s1.motion,
      ambientDefaults: 'chrome-shimmer + glow-pulse always-on for bezels (was opt-in in v1)',
    },
    accessibility: {
      ...s1.accessibility,
      colorScheme: 'light-on-saturated (no system dark mode)',
      contrastNote: 'WCAG AA verified against turquoise (L=0.62) AND magenta (L=0.32) backgrounds — text uses oklch(0.98 ...) plus chrome bezel ensures local contrast even where backdrop varies.',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Style 3 — Apple home page meets cyberpunk holographic display module.
// Pulls colors + style cues from the user's reference images (teal-cyan
// HUD orb, magenta/violet metaverse vortex). Keeps motion + bento +
// curvature tokens. Discards SparkForge-specific mood + chrome.
// ─────────────────────────────────────────────────────────────────────

function buildStyle3() {
  const s1 = buildStyle1();
  return {
    $schema: 'sparkforge-design-spec/v1',
    style: 'style-3-cyberpunk-apple',
    description:
      'Synthetic design language. Reference vibe: Apple product pages (huge ' +
      'breathing whitespace, hero-only typography, monochrome chrome, ' +
      'cinematic scroll reveals) crossed with cyberpunk holographic HUD ' +
      '(teal/cyan rim glows, magenta/violet vortex hero, low-poly geometric ' +
      'accents, oil-slick iridescence). Reference images informed COLOR + ' +
      'TYPOGRAPHY + STYLE only — text content and product concepts ignored. ' +
      'Motion + bento + slight UI curvature carry over from style-1.',
    brand: {
      name: 'SparkForge',
      audience: 'kids 7-16',
      mood: [
        'Apple-clean whitespace',
        'cyberpunk holographic',
        'iridescent oil-slick',
        'low-poly geometric',
        'cinematic scroll',
      ],
    },
    palette: {
      // Reference-image-derived. Hex sampled from the two provided images.
      brand: {
        deepNavy:    '#0B0F1E',  // image 1 + 2 base
        rimTeal:     '#1FE3D6',  // image 1 HUD orb cyan
        rimCyanIce:  '#9FFFF6',  // image 1 highlight
        portalMag:   '#B22CFF',  // image 2 vortex magenta
        portalPink:  '#FF4FC8',  // image 2 hot pink edge
        violetWarp:  '#7A2DE0',  // image 2 violet mid
        skySoft:     '#E8F4FF',  // Apple-page off-white
        cleanWhite:  '#FFFFFF',
      },
      // Lab accents reduced to a 6-stop iridescent ramp — kids-7-16 still
      // need lab differentiation, so we keep ids but recolor toward an
      // oil-slick spectrum sampled from image 2.
      labs: [
        { id: 1,  name: 'What IS AI?',          hex: '#1FE3D6', oklch: 'oklch(0.84 0.15 190)', family: 'Teal' },
        { id: 2,  name: 'Teaching Machines',    hex: '#7A8DFF', oklch: 'oklch(0.74 0.18 270)', family: 'Periwinkle' },
        { id: 3,  name: 'The Brain Inside',     hex: '#FF4FC8', oklch: 'oklch(0.73 0.24 340)', family: 'Hot Pink' },
        { id: 4,  name: 'AI That Creates',      hex: '#FFD86B', oklch: 'oklch(0.88 0.16 90)',  family: 'Solar' },
        { id: 5,  name: 'AI Helpers',           hex: '#5BFFB1', oklch: 'oklch(0.86 0.20 155)', family: 'Aurora' },
        { id: 6,  name: 'AI & Ethics',          hex: '#FF7A4D', oklch: 'oklch(0.74 0.20 35)',  family: 'Coral' },
        { id: 7,  name: 'Computer Vision',      hex: '#9FFFF6', oklch: 'oklch(0.93 0.10 195)', family: 'Ice Cyan' },
        { id: 8,  name: 'Words & Language',     hex: '#B5A0FF', oklch: 'oklch(0.78 0.13 290)', family: 'Lilac' },
        { id: 9,  name: 'Build Your AI',        hex: '#FFB95C', oklch: 'oklch(0.80 0.17 65)',  family: 'Marigold' },
        { id: 10, name: 'AI Futures',           hex: '#B22CFF', oklch: 'oklch(0.55 0.30 305)', family: 'Portal Magenta' },
        { id: 11, name: 'Agentic AI',           hex: '#1FE3D6', oklch: 'oklch(0.84 0.15 190)', family: 'Teal' },
      ],
      neon: {
        teal:     'oklch(0.84 0.15 190)',
        magenta:  'oklch(0.55 0.30 305)',
        pink:     'oklch(0.73 0.24 340)',
        violet:   'oklch(0.50 0.25 295)',
        aurora:   'oklch(0.86 0.20 155)',
      },
      surface: {
        // Apple-style surface = near-white in light mode + holographic dark mode toggle.
        base:           '#F7FAFD /* primary, Apple off-white */',
        card:           '#FFFFFF',
        elevated:       '#FFFFFF',
        border:         'rgba(11,15,30,0.08)',
        // Cyberpunk-mode surface (toggleable, hero sections)
        baseDark:       '#0B0F1E',
        cardDark:       'rgba(255,255,255,0.04)',
        elevatedDark:   'rgba(255,255,255,0.08)',
        textPrimary:    '#0B0F1E',
        textSecondary:  'rgba(11,15,30,0.62)',
        textMuted:      'rgba(11,15,30,0.42)',
        textPrimaryDark:   '#F0F4FF',
        textSecondaryDark: 'rgba(240,244,255,0.72)',
      },
    },
    typography: {
      // Apple = SF Pro / Inter feel. Keep SparkForge data font (Orbitron) for
      // numerics that need to read sci-fi.
      fontStacks: {
        display: '"Inter Display", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        body:    '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        mono:    '"JetBrains Mono", monospace',
        data:    '"Orbitron", monospace',
      },
      families: {
        display: 'Inter Display',
        body:    'Inter',
        mono:    'JetBrains Mono',
        data:    'Orbitron',
      },
      scale: {
        hero:      'clamp(3.5rem, 8vw, 8rem)  /* Apple-hero: 56-128px */',
        h1:        'clamp(2.5rem, 5vw, 4.5rem)',
        h2:        'clamp(1.75rem, 3vw, 2.5rem)',
        h3:        '1.5rem',
        body:      '1.0625rem',
        caption:   '0.875rem',
      },
      weights: { display: 700, body: 400, semibold: 600, bold: 700 },
      tracking: { hero: '-0.04em', body: '-0.011em' },
      cdn: 'Inter via fonts.googleapis.com (use next/font/google when network-available)',
    },
    spacing: {
      grid: '8px',
      tokens: { xs: '0.5rem', sm: '1rem', md: '1.5rem', lg: '2.5rem', xl: '4rem', '2xl': '6rem', section: '8rem' },
      note: 'DOUBLED from style-1 (4px → 8px) — Apple-style breathing room.',
    },
    radii: {
      tileOuter: '24px',
      tileInner: '20px',
      pill: '9999px',
      content: '20px',
      elevated: '28px',
      strategy: 'Single-layer pillowy radius (no chrome bezel stack). Larger, softer.',
    },
    glass: {
      // Holographic instead of frosty. Conic + linear gradient borders.
      base: {
        class: 'holo-card',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.42) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.55)',
        boxShadow: '0 16px 48px -12px rgba(11,15,30,0.18), 0 0 0 1px rgba(11,15,30,0.04)',
        borderRadius: '24px',
        iridescentEdge: 'conic-gradient(from 220deg, #1FE3D6, #B22CFF, #FF4FC8, #1FE3D6) 1px (animated, 8s rotate)',
      },
      darkVariant: {
        class: 'holo-card-dark',
        background: 'linear-gradient(145deg, rgba(31,227,214,0.06) 0%, rgba(178,44,255,0.04) 100%)',
        backdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid rgba(159,255,246,0.18)',
        boxShadow: '0 24px 60px -16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(159,255,246,0.18)',
      },
    },
    chrome: {
      strategy: 'Removed. Replaced by HOLOGRAPHIC EDGE — animated conic-gradient ring (8s rotate, 1px thick, masked).',
      holoRing: {
        background: 'conic-gradient(from 0deg, #1FE3D6 0%, #7A2DE0 25%, #B22CFF 50%, #FF4FC8 75%, #1FE3D6 100%)',
        thickness: '1px',
        animation: 'spin 8s linear infinite',
        mask: 'border-only via padding + mask-composite (same trick as glass-card-v2::before)',
      },
    },
    background: {
      kind: 'apple-holographic',
      lightMode: {
        stack: [
          '/* Hero: large blur-rendered vortex, Apple-style */',
          'radial-gradient(circle 60vw at 70% 30%, rgba(178,44,255,0.18) 0%, transparent 50%)',
          'radial-gradient(circle 50vw at 20% 70%, rgba(31,227,214,0.20) 0%, transparent 55%)',
          'linear-gradient(180deg, #F7FAFD 0%, #E8F4FF 100%)',
        ],
      },
      darkMode: {
        stack: [
          '/* Cyberpunk vortex hero */',
          'radial-gradient(circle 70vw at 65% 35%, rgba(178,44,255,0.45) 0%, transparent 55%)',
          'radial-gradient(circle 60vw at 25% 75%, rgba(31,227,214,0.30) 0%, transparent 60%)',
          'radial-gradient(circle 40vw at 50% 50%, rgba(122,45,224,0.25) 0%, transparent 50%)',
          'linear-gradient(180deg, #0B0F1E 0%, #050714 100%)',
        ],
      },
      overlays: [
        'low-poly-grid: SVG triangle mesh, opacity 0.04, 80px tiles',
        'film-grain: rgba(255,255,255,0.012)',
        'subtle-iridescent-bloom on hero hover',
      ],
    },
    curvature: {
      uiCurveDeg: 3,
      strategy:
        'Bento grid container: `transform: perspective(1400px) rotateX(3deg)`. ' +
        'Container preserves-3d so child tiles inherit subtle bow. Disable on ' +
        '`prefers-reduced-motion` and on touch via @media(pointer:coarse).',
      cssVar: '--ui-curve: 3deg',
      note: 'Slightly stronger curve than style-1 to evoke a holographic display module hovering away from the viewer.',
    },
    motion: {
      easings: {
        spring:    'cubic-bezier(0.22, 1, 0.36, 1)',
        appleEase: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        snap:      'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      durations: { micro: '120ms', base: '300ms', cinematic: '700ms', hero: '1200ms' },
      keyframes: [
        'iridescent-spin (8s linear) — holo border rotation',
        'breath (4s ease-in-out) — Apple-style scale 1.0 → 1.015 → 1.0',
        'parallax-tilt — pointer-driven, bento tile follows cursor up to ±6deg',
        'scroll-reveal — fade + 24px translate-y, IntersectionObserver triggered',
        'magnetic-hover — tile pulls toward cursor (CSS transform + JS rAF)',
        'iris-zoom — modal opens via radial scale clip-path (200ms)',
      ],
      interactiveHover: {
        transform: 'translateY(-4px) scale(1.02)',
        boxShadow: '0 28px 64px -20px rgba(11,15,30,0.22), 0 0 0 1px rgba(31,227,214,0.30)',
        duration: '300ms',
        easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
        magneticPull: '4px (CSS variable, set by JS pointer tracker)',
      },
      activePress: { transform: 'scale(0.98)', duration: '120ms' },
      reducedMotion: 'iridescent-spin → static 220deg conic; parallax-tilt OFF; magnetic-hover OFF; breath OFF',
    },
    effects: {
      iridescentText: 'background: conic-gradient(from 0deg, #1FE3D6, #B22CFF, #FF4FC8, #1FE3D6); -webkit-background-clip: text; animation: iridescent-spin 8s linear infinite',
      neonRimGlow: '0 0 24px rgba(31,227,214,0.40), 0 0 48px rgba(178,44,255,0.25)',
      vortexGlow: 'conic-gradient(from 0deg, #B22CFF, #7A2DE0, #1FE3D6, #B22CFF) blur(40px), opacity 0.5',
      lowPolyAccent: 'inline-SVG triangle mesh, stroke 0.5px rgba(31,227,214,0.30), fill rgba(178,44,255,0.04)',
      depthShadow: '0 32px 80px -24px rgba(11,15,30,0.32) /* Apple product-page card shadow */',
      chromaticAberration: 'subtle: text-shadow: -0.5px 0 rgba(31,227,214,0.6), 0.5px 0 rgba(178,44,255,0.6) on hero only',
      glassMagnify: 'backdrop-filter: blur(24px) saturate(180%) — pillowy, Apple-style',
    },
    accessibility: {
      colorScheme: 'light + dark (toggleable, defaults to system)',
      focusRing: 'outline 3px solid #1FE3D6, outline-offset 2px, halo box-shadow 0 0 0 6px rgba(31,227,214,0.30)',
      reducedMotion: 'iridescent-spin static, parallax/magnetic/breath OFF',
      contrast: 'WCAG AA on both light (#0B0F1E text on #F7FAFD bg = 17:1) and dark (#F0F4FF on #0B0F1E = 16:1)',
      touchTargets: '44x44 min',
    },
    bento: {
      tileSizing: ['1x1', '1x2', '2x1', '2x2', '3x2 hero'],
      gap: 'var(--space-md) /* 24px — wider gaps than style-1 */',
      gridContainer: 'CSS subgrid, 12-col responsive',
      tileMinHeight: '160px',
      tileTreatment: 'Apple-product-card: white card on light bg, blur-glass on dark vortex hero',
    },
    referenceImages: [
      { source: 'user-attached image 1', extracted: ['#1FE3D6 HUD teal', '#9FFFF6 ice cyan highlight', 'circular orb hero element', 'dark navy background', 'thin glow lines'] },
      { source: 'user-attached image 2', extracted: ['#B22CFF portal magenta', '#FF4FC8 hot pink edge', '#7A2DE0 violet mid', 'vortex/portal centerpiece', 'low-poly geometric figure', 'strong neon bloom'] },
    ],
    sourceFiles: { ...s1.sourceFiles, note: 'Style-3 is synthetic — most tokens are NEW, not extracted.' },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Emit
// ─────────────────────────────────────────────────────────────────────

const targets = [
  { name: 'style-1-current-cockpit.json',  spec: buildStyle1() },
  { name: 'style-2-brighter-cockpit.json', spec: buildStyle2() },
  { name: 'style-3-cyberpunk-apple.json',  spec: buildStyle3() },
];

for (const t of targets) {
  const out = resolve(OUT_DIR, t.name);
  writeFileSync(out, JSON.stringify(t.spec, null, 2) + '\n', 'utf8');
  console.log(`wrote ${out}`);
}

console.log('\nDone. 3 design specs emitted.');
