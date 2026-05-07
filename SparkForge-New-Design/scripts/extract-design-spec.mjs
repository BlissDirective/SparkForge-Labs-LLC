#!/usr/bin/env node
/**
 * extract-design-spec.mjs
 *
 * Reads SparkForge's source-of-truth design files and emits three
 * design-spec JSONs into ../design-specs/.  Each spec contains BOTH
 * design tokens (palette/typography/glass/motion) AND a full home-screen
 * ARCHITECTURE block (zones / panels / HUD / lab map / instrument cluster).
 *
 *   style-1-current-cockpit.json   — current cockpit, lightly cleaned
 *   style-2-brighter-cockpit.json  — "Lab Atrium" creative reinterpretation
 *                                    (still 4-zone, brighter, more open,
 *                                     turquoise-magenta gradient backdrop)
 *   style-3-cyberpunk-apple.json   — "Holo-Deck Dashboard" clean-sheet
 *                                    (Apple-style vertical scroll layout,
 *                                     bento grid + iridescent accents,
 *                                     not a traditional 4-zone cockpit)
 *
 * Architecture data for style-1 mirrors what is actually coded today
 * (extracted via codebase audit).  Styles 2 and 3 are hand-authored
 * creative redesigns informed by current best-practice web UI patterns:
 * container queries, View Transitions API, CSS scroll-driven animations,
 * subgrid, OKLCH color, anchor positioning, magnetic hover, scroll-snap.
 *
 * Run from repo root:
 *   node SparkForge-New-Design/scripts/extract-design-spec.mjs
 *
 * No external deps.  Idempotent.  Re-run after any source-of-truth edit.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const OUT_DIR   = resolve(__dirname, '..', 'design-specs');

mkdirSync(OUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────
// Source-of-truth readers
// ─────────────────────────────────────────────────────────────────────

const read = (rel) => readFileSync(resolve(REPO_ROOT, rel), 'utf8');

function parseLabColors() {
  const src = read('src/config/labColors.ts');
  const rows = [...src.matchAll(
    /\{\s*id:\s*(\d+),\s*name:\s*'([^']+)',\s*hex:\s*'(#[0-9A-Fa-f]{6})',\s*oklch:\s*'(oklch\([^)]+\))',\s*family:\s*'([^']+)'/g
  )];
  if (!rows.length) throw new Error('parseLabColors: no rows matched');
  return rows.map((m) => ({
    id: Number(m[1]), name: m[2], hex: m[3], oklch: m[4], family: m[5],
  }));
}

function parseBrandPalette() {
  const src = read('src/lib/branding/sf-material.config.ts');
  const out = {};
  for (const m of src.matchAll(/^\s{2}([a-zA-Z]+):\s*'(#[0-9A-Fa-f]{6,8})'/gm)) out[m[1]] = m[2];
  return out;
}

function parseMaterialPhysics() {
  const src = read('src/lib/branding/sf-material.config.ts');
  const block = src.match(/export const MATERIAL = \{([\s\S]+?)\} as const;/);
  if (!block) throw new Error('parseMaterialPhysics: MATERIAL block not found');
  const out = {};
  for (const m of block[1].matchAll(/^\s{2}([a-zA-Z]+):\s*([0-9.]+)/gm)) out[m[1]] = Number(m[2]);
  return out;
}

function parseFonts() {
  const src = read('src/app/globals.css');
  const grab = (n) => {
    const m = src.match(new RegExp(`--${n}:\\s*([^;]+);`));
    return m ? m[1].trim() : null;
  };
  return { display: grab('font-display'), body: grab('font-body'), mono: grab('font-mono'), data: grab('font-data') };
}

function parseSurfaceVars() {
  const src = read('src/app/globals.css');
  const grab = (n) => {
    const m = src.match(new RegExp(`--${n}:\\s*(oklch\\([^)]+\\))`));
    return m ? m[1] : null;
  };
  return {
    base: grab('surface-base'), card: grab('surface-card'), elevated: grab('surface-elevated'),
    border: grab('surface-border'),
    textPrimary: grab('text-primary'), textSecondary: grab('text-secondary'), textMuted: grab('text-muted'),
    chromeEdge: grab('chrome-edge'), chromeHighlight: grab('chrome-highlight'), chromeSpecular: grab('chrome-specular'),
  };
}

function parseSpacingScale() {
  const src = read('src/app/globals.css');
  const out = {};
  for (const m of src.matchAll(/--space-([a-z0-9]+):\s*([0-9.]+)rem/g)) out[m[1]] = `${m[2]}rem`;
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Architecture blocks — one per style.
// Style 1 mirrors the actual coded cockpit (audited).
// Styles 2 and 3 are creative redesigns with full liberty.
// ─────────────────────────────────────────────────────────────────────

function architectureStyle1() {
  return {
    kind: '4-zone-cockpit',
    metaphor: 'futuristic spacecraft cockpit cabin',
    rationale:
      'Mirrors the currently-coded CockpitUILayer architecture, lightly ' +
      'cleaned for HTML translation. Four fixed zones surround a variable ' +
      'center viewport that swaps content per route. A peripheral HUD frame ' +
      'wraps the viewport with corner data readouts.',
    zoneGrid: {
      kind: 'css-grid',
      template: `
        "hud-tl   hud-top   hud-tr   "  64px
        "left     center    right    "  1fr
        "hud-bl   hud-bottom hud-br  "  56px
        "instr    instr     instr    "  120px
        / 25%     45%       25%
      `.trim(),
      zones: {
        left:    { id: 'player-hub',  widthPct: 25, fixed: true,  ariaLandmark: 'aside', label: 'Pilot identity' },
        center:  { id: 'viewport',    widthPct: 45, fixed: false, ariaLandmark: 'main',  label: 'Mission viewport' },
        right:   { id: 'controls',    widthPct: 25, fixed: true,  ariaLandmark: 'aside', label: 'Controls and monitoring' },
        bottom:  { id: 'instruments', heightPx: 120, spansFullWidth: true, ariaLandmark: 'nav', label: 'Navigation and instruments' },
        hudFrame:{ id: 'hud',         kind: 'peripheral-arcs', position: 'absolute' },
      },
    },
    panels: [
      {
        id: 'player-hub', zone: 'left', title: 'Pilot Identity',
        elements: [
          { kind: 'hexagonal-avatar', size: '96px', frame: 'chrome-bezel-3-layer', glow: 'lab-color' },
          { kind: 'child-name',       font: 'display', weight: 600, size: '18px', tracking: '-0.01em' },
          { kind: 'level-badge',      font: 'data',    size: '11px', format: 'LV.{level}', bg: 'pill chrome' },
          { kind: 'gauge-stack',      orientation: 'vertical', items: [
            { id: 'xp',       label: 'XP',       valueFont: 'data', kind: 'circular-gauge', radius: 28, value: '{xp.toLocaleString()}' },
            { id: 'streak',   label: 'STREAK',   icon: 'flame',     kind: 'numeric',        value: '{streakDays}d' },
            { id: 'daily',    label: 'TODAY',    kind: 'progress-ring', value: '{dailyPct}%' },
          ]},
          { kind: 'badge-shelf', layout: 'honeycomb-2x3', count: 6, lockedTreatment: 'desaturated + lock icon' },
        ],
      },
      {
        id: 'viewport', zone: 'center', title: 'Mission Viewport',
        background: { kind: 'lab-map-hologram', refer: 'architecture.labMap' },
        foreground: [
          { kind: 'floating-header', position: 'top-center', text: 'Welcome back, {displayName}', font: 'display', size: '28px', weight: 700 },
          { kind: 'continue-cta',    position: 'bottom-center', label: 'Continue Learning', icon: 'arrow-right', variant: 'primary-glow' },
        ],
        slot: 'CenterContentRouter swaps based on cockpitStore.centerContent (home | labs | game | profile | arcade)',
      },
      {
        id: 'controls', zone: 'right', title: 'Mission Console',
        elements: [
          { kind: 'collapsible-header', text: 'CONTROLS', icon: 'chevron-down', font: 'data', size: '11px' },
          { kind: 'toggle',  id: 'audio-master',  label: 'Audio',       valueFrom: 'cockpitStore.masterSoundEnabled' },
          { kind: 'slider',  id: 'ambient',       label: 'Ambient',     min: 0, max: 1, step: 0.05, valueFrom: 'cockpitStore.ambientVolume' },
          { kind: 'slider',  id: 'brightness',    label: 'Brightness',  min: 0.7, max: 1.0, step: 0.02, valueFrom: 'cockpitStore.brightness' },
          { kind: 'segmented', id: 'theme', label: 'Theme', options: ['Default', 'Aurora', 'Crimson'], valueFrom: 'cockpitStore.cockpitTheme' },
          { kind: 'link', id: 'settings-full', label: 'Open all settings', href: '/settings' },
        ],
      },
      {
        id: 'instruments', zone: 'bottom', title: 'Navigation Cluster',
        elements: [
          { kind: 'nav-button-grid', layout: 'flex-evenly', buttons: [
            { id: 'home',    label: 'Home',    icon: 'home',    href: '/home' },
            { id: 'labs',    label: 'Labs',    icon: 'beaker',  href: '/labs' },
            { id: 'arcade',  label: 'Arcade',  icon: 'gamepad', href: '/arcade' },
            { id: 'profile', label: 'Profile', icon: 'user',    href: '/profile' },
            { id: 'settings',label: 'Settings',icon: 'cog',     href: '/settings' },
          ]},
          { kind: 'dial-cluster', dials: [
            { id: 'mission-status', label: 'STATUS', kind: 'led-indicator' },
            { id: 'connection',     label: 'LINK',   kind: 'pulse-bar' },
          ]},
          { kind: 'status-bar', backgroundLine: 'lab-color rim, 1px, fades to transparent at edges' },
        ],
      },
    ],
    hud: {
      kind: 'peripheral-arc-frame',
      position: 'absolute, wraps viewport at z-index 50',
      segments: [
        { id: 'top',    arcDeg: 92,  ticks: 32, position: 'top-center' },
        { id: 'bottom', arcDeg: 92,  ticks: 32, position: 'bottom-center' },
        { id: 'left',   arcDeg: 70,  ticks: 24, position: 'middle-left' },
        { id: 'right',  arcDeg: 70,  ticks: 24, position: 'middle-right' },
      ],
      cornerReadouts: {
        topLeft:  { kind: 'clock',      font: 'data', size: '12px', format: 'HH:MM',                          letterSpacing: '0.12em' },
        topRight: { kind: 'xp-counter', font: 'data', size: '12px', format: 'XP {xp.toLocaleString()}',       prefix: 'XP ' },
        bottomLeft:  { kind: 'mode-label',  font: 'data', size: '11px', format: '{MODE}',          letterSpacing: '0.18em' },
        bottomRight: { kind: 'child-tag',   font: 'data', size: '11px', format: '{name} / LV.{level}' },
      },
      animation: 'breathing emissive pulse 4s; gold celebration cascade for major events',
      baselineOpacity: 0.35,
      hoverOpacity: 0.7,
    },
    labMap: {
      kind: 'concentric-rings-2',
      rings: [
        { id: 'outer', labIds: [1,2,3,4,5,6],     radiusVw: 18, angleStepDeg: 60, startAngleDeg: -90, role: 'foundation' },
        { id: 'inner', labIds: [7,8,9,10,11],     radiusVw: 11, angleStepDeg: 72, startAngleDeg: -90, role: 'advanced' },
      ],
      adjacency: {
        outerLoop:    [[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]],
        innerLoop:    [[7,8],[8,9],[9,10],[10,11],[11,7]],
        crossBeams:   [[1,7],[2,8],[3,9],[4,10],[5,11]],
        specialOverlay: { labId: 6, treatment: 'connects to ALL labs visually (Ethics overlay)' },
      },
      nodeTreatment: {
        idle:    'circular hex-emblem 64px, chrome ring, lab-color emissive at 30%',
        hovered: 'scale 1.06, emissive 60%, label tooltip appears anchored to node',
        focused: 'scale 1.12, emissive 90%, ring pulses, neighboring beams brighten',
        locked:  'desaturated 40%, padlock icon, no hover effect',
      },
      edgeTreatment: {
        kind: 'animated-energy-line',
        baseColor:   'rgba(255,255,255,0.06)',
        activeColor: 'gradient lab-color → adjacent-lab-color',
        animation:   'connection-pulse 4s ease-in-out (existing keyframe)',
        thickness:   '1px',
      },
      interaction: {
        click:       'focus lab + center camera (CSS perspective shift)',
        doubleClick: 'iris-zoom into lab detail page (View Transitions API)',
        hover:       'highlight node + tooltip',
        keyboard:    'arrow keys traverse adjacency graph; Enter focuses; Space enters',
      },
    },
    transitions: {
      heroToCockpit: { kind: 'view-transitions-api', duration: '600ms', morphTargets: ['hero-logo → topbar-logo'] },
      labEntry:      { kind: 'iris-zoom',            duration: '400ms', mask: 'circle from clicked-lab origin' },
      gameEntry:     { kind: 'iris-zoom',            duration: '500ms', plus: 'CSS scroll-driven exit on previous content' },
      panelExpand:   { kind: 'fold-out',             duration: '300ms', easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
    responsive: {
      strategy: 'container-queries (not viewport)',
      breakpoints: {
        cabin:   '@container (min-width: 1280px) — full 4-zone cockpit',
        compact: '@container (min-width: 900px)  — left/right narrow to 20%, center 60%',
        stacked: '@container (max-width: 899px)  — vertical stack: HUD top, viewport, instruments, controls collapse to bottom-sheet',
      },
    },
  };
}

function architectureStyle2() {
  return {
    kind: 'lab-atrium-4-zone',
    metaphor: 'sunlit spacecraft atrium / observatory deck (vs cramped pilot cockpit)',
    rationale:
      'Same 4-zone topology as style-1 (preserves muscle memory + game ' +
      'integration paths) but reimagined as an open, glass-walled atrium ' +
      'with cantilevered floating panels. Panels lift away from the page ' +
      'with parallax shadow rather than embedding in a chrome wall. ' +
      'Bezels become luminous edge rails that wrap the panel like a ' +
      'museum display. Instrument hex gauges replaced with bento-style ' +
      'flat tiles for a less mechanical, more curated feel. ' +
      'Best-practice additions: container queries, anchor positioning ' +
      'for tooltips, scroll-driven entrance animations, View Transitions.',
    zoneGrid: {
      kind: 'css-grid + subgrid',
      template: `
        "hud      hud      hud   "  56px
        "pilot    stage    deck  "  1fr
        "instruments instruments instruments"  140px
        / 22%     56%      22%
      `.trim(),
      zones: {
        pilot:       { id: 'pilot-card',     widthPct: 22, fixed: true, ariaLandmark: 'aside', label: 'Pilot card' },
        stage:       { id: 'main-stage',     widthPct: 56, fixed: false, ariaLandmark: 'main', label: 'Mission stage' },
        deck:        { id: 'mission-deck',   widthPct: 22, fixed: true, ariaLandmark: 'aside', label: 'Mission deck' },
        instruments: { id: 'navigation-dock',heightPx: 140, spansFullWidth: true, ariaLandmark: 'nav', label: 'Navigation dock' },
        hud:         { id: 'topbar',         heightPx: 56, spansFullWidth: true, ariaLandmark: 'banner', label: 'Top status bar' },
      },
      ambientLayers: [
        'page background: turquoise → dark-magenta diagonal gradient',
        'aurora bloom layer (large blurred radial gradients, 0.4 opacity, animated 30s drift)',
        'floating particle layer (24 particles, lab-color tinted, opacity 0.15)',
        'curved accent rail (1px luminous arc) hugging top + bottom of stage zone',
      ],
    },
    panels: [
      {
        id: 'pilot-card', zone: 'pilot', title: 'Pilot Card',
        treatment: 'cantilevered glass card, 24px radius, 32px outer padding, hovers 8px above page with soft shadow',
        elements: [
          { kind: 'circular-avatar', size: '120px', ring: 'animated rotating iridescent 8s', glow: 'soft outer ' },
          { kind: 'child-name',  font: 'display', weight: 700, size: '24px', align: 'center' },
          { kind: 'level-pill',  font: 'data',    size: '12px', format: 'LV {level}',  bg: 'glass + lab-color tint' },
          { kind: 'stat-row', layout: 'flex 3-up', items: [
            { id: 'xp',     label: 'XP',     value: '{xp.toLocaleString()}', valueFont: 'data', size: '20px' },
            { id: 'streak', label: 'STREAK', value: '{streakDays}d',         icon: 'flame', valueFont: 'data', size: '20px' },
            { id: 'rank',   label: 'RANK',   value: 'Cadet III',             valueFont: 'data', size: '20px' },
          ]},
          { kind: 'progress-rail', label: 'To Next Level', valueFrom: '{nextLevelPct}', height: '8px', radius: '4px' },
          { kind: 'badge-shelf', layout: 'horizontal-scroll-snap', tileSize: '56px', count: 'unlimited', emptySlots: 5 },
        ],
      },
      {
        id: 'main-stage', zone: 'stage', title: 'Mission Stage',
        background: { kind: 'lab-constellation', refer: 'architecture.labMap' },
        layout: 'CSS grid 12-col 8-row, child elements absolutely positioned via grid-area',
        foreground: [
          { kind: 'hero-greeting',  position: 'top-center', text: 'Good {timeOfDay}, {displayName}.', font: 'display', size: 'clamp(2rem, 4vw, 3.25rem)', weight: 700 },
          { kind: 'sub-greeting',   position: 'below hero',  text: 'Lab {focusedLabId} is calling — your {pendingMission} mission awaits.', font: 'body', size: '1.0625rem' },
          { kind: 'continue-cta',   position: 'bottom-center', label: 'Continue Mission', icon: 'arrow-right', variant: 'glass-primary-glow' },
          { kind: 'nearby-quick-actions', position: 'beside CTA', items: ['Resume Game', 'Daily Challenge', 'Ask Guide'] },
        ],
      },
      {
        id: 'mission-deck', zone: 'deck', title: 'Mission Deck',
        treatment: 'same cantilevered glass treatment as pilot card; vertical stack of bento mini-cards',
        elements: [
          { kind: 'mini-card', id: 'next-up',     title: 'Next Up',     body: 'Lab {n}: {gameName}', cta: 'Begin' },
          { kind: 'mini-card', id: 'daily-streak', title: 'Daily Streak', body: '{streakDays}-day streak', visual: 'flame stack' },
          { kind: 'mini-card', id: 'ai-guide',    title: 'Ask Sparky',  body: 'Got a question?',     cta: 'Open chat',   accent: 'iridescent ring' },
          { kind: 'mini-card', id: 'parent-note',  title: 'From Parent', body: '{parentMessageOrNone}',cta: 'Reply',       conditional: 'show only if message exists' },
          { kind: 'mini-card', id: 'achievements', title: 'New Badges', body: '{newBadgeCount} unlocked', cta: 'View' },
        ],
      },
      {
        id: 'navigation-dock', zone: 'instruments', title: 'Navigation Dock',
        treatment: 'horizontal bento strip, 5 large rounded tiles + 2 smaller status pills, flush-bottom',
        elements: [
          { kind: 'nav-bento', tiles: [
            { id: 'home',    label: 'Home',    icon: 'home',    primary: true },
            { id: 'labs',    label: 'Labs',    icon: 'beaker',  badge: '11' },
            { id: 'arcade',  label: 'Arcade',  icon: 'gamepad' },
            { id: 'profile', label: 'Profile', icon: 'user' },
            { id: 'settings',label: 'Settings',icon: 'cog' },
          ]},
          { kind: 'status-pill',  id: 'online-state', label: 'ONLINE',  variant: 'success' },
          { kind: 'status-pill',  id: 'guide-state',  label: 'SPARKY READY', variant: 'info' },
        ],
      },
      {
        id: 'topbar', zone: 'hud', title: 'Top Status Bar',
        treatment: 'translucent glass, blur(20px) saturate(180%), no chrome bezel — only a 1px iridescent bottom edge',
        elements: [
          { kind: 'logo',           position: 'left', size: '32px',  href: '/home' },
          { kind: 'breadcrumb',     position: 'left-of-center', font: 'data', size: '11px', tracking: '0.16em', format: '{ZONE} / {SUB}' },
          { kind: 'clock',          position: 'right-3', font: 'data', size: '12px', format: 'HH:MM' },
          { kind: 'xp-chip',        position: 'right-2', icon: 'spark', value: '{xp.toLocaleString()}' },
          { kind: 'avatar-chip',    position: 'right-1', size: '32px', menuOnClick: 'profile-menu' },
        ],
      },
    ],
    labMap: {
      kind: 'concentric-rings-2 + parallax',
      rings: [
        { id: 'outer', labIds: [1,2,3,4,5,6],  radiusVmin: 22, angleStepDeg: 60, startAngleDeg: -90, role: 'foundation', parallax: '+12px on cursor' },
        { id: 'inner', labIds: [7,8,9,10,11],  radiusVmin: 14, angleStepDeg: 72, startAngleDeg: -90, role: 'advanced',   parallax: '+24px on cursor' },
      ],
      adjacency: {
        outerLoop:  [[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]],
        innerLoop:  [[7,8],[8,9],[9,10],[10,11],[11,7]],
        crossBeams: [[1,7],[2,8],[3,9],[4,10],[5,11]],
        specialOverlay: { labId: 6, treatment: 'soft glow halo overlays all rings — no hard line connections' },
      },
      nodeTreatment: {
        idle:    'soft-glass disk 72px, lab-color rim, ambient breathing glow',
        hovered: 'scale 1.08, rim brightens to lab-color full, anchor-positioned tooltip card appears (CSS anchor)',
        focused: 'scale 1.16, ring rotates iridescent 4s, neighbors highlight',
        locked:  'desaturated 50%, padlock icon, no rotation',
      },
      edgeTreatment: {
        kind: 'gradient-tube',
        thickness: '1.5px',
        background: 'gradient lab-color → adjacent-lab-color, animated dash 6s',
        glow: 'soft drop-shadow lab-color',
      },
      ambientMotion: 'whole constellation slowly orbits ±2deg in 60s loop (CSS keyframe), parallax-tilt on cursor',
      interaction: 'click → focus + page View Transitions; hover → tooltip; keyboard → arrow-key adjacency traversal; touch → tap focus, double-tap enter',
    },
    transitions: {
      heroToHome:    { kind: 'view-transitions-api', duration: '700ms', morphTargets: ['hero-logo → topbar-logo', 'hero-cta → continue-cta'] },
      labEntry:      { kind: 'iris-zoom',           duration: '500ms', mask: 'circle from clicked-lab origin',        accent: 'iridescent ring expands' },
      gameEntry:     { kind: 'iris-zoom',           duration: '600ms', plus: 'CSS @scroll-timeline exit fade'},
      panelExpand:   { kind: 'fold-out',            duration: '350ms', easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      cardLift:      { kind: 'magnetic-hover',      duration: '250ms', cursorTracking: 'enabled (desktop only)' },
    },
    responsive: {
      strategy: 'container-queries on grid wrapper',
      breakpoints: {
        atrium:    '@container (min-width: 1440px) — full 22/56/22 + dock',
        observatory:'@container (min-width: 1024px) — 24/52/24 + dock',
        compact:   '@container (min-width: 768px)  — pilot + stage 2-col, deck collapses to bottom-sheet',
        stacked:   '@container (max-width: 767px)  — vertical: topbar, hero greeting, lab map, mini-cards stack, nav as bottom bar',
      },
    },
  };
}

function architectureStyle3() {
  return {
    kind: 'holo-deck-vertical-scroll',
    metaphor: 'Apple-style product page meets cyberpunk holographic display module',
    rationale:
      'Clean-sheet redesign. Discards the 4-zone cockpit metaphor. ' +
      'Replaces with a single-column vertical scroll of distinct ' +
      '"folds" (Apple convention), each with one focal element and ' +
      'generous whitespace. Lab map reduced to a small floating widget; ' +
      'main attention given to a hero greeting + bento mission grid. ' +
      'Floating bottom dock provides constant nav. Iridescent edge ' +
      'rings + low-poly accents are the only sci-fi flourishes — the ' +
      'overall feel is calm, premium, scrollable. ' +
      'Best-practice additions: scroll-snap, scroll-driven animations ' +
      '(CSS @scroll-timeline), View Transitions API, anchor-positioned ' +
      'menus, container queries, prefers-reduced-motion + ' +
      'prefers-contrast respect, AAA color contrast where possible.',
    zoneGrid: {
      kind: 'single-column-vertical-scroll',
      maxWidthPx: 1280,
      columns: 12,
      gapPx: 24,
      scrollSnap: 'y mandatory on the page wrapper (optional, can be disabled in Settings)',
      folds: [
        { id: 'fold-hero',        heightVh: 92, scrollSnapAlign: 'start', label: 'Welcome + focal stat' },
        { id: 'fold-mission',     heightVh: 'auto', minVh: 100, label: 'Mission bento grid (11 labs)' },
        { id: 'fold-momentum',    heightVh: 'auto', minVh: 60,  label: 'Recent activity + Continue CTA' },
        { id: 'fold-orbit',       heightVh: 'auto', minVh: 70,  label: 'Lab map widget (small + interactive)' },
        { id: 'fold-discover',    heightVh: 'auto', minVh: 60,  label: 'Daily challenge + Sparky guide' },
      ],
      persistentLayers: [
        'top-bar (transparent, blurs on scroll past 64px) — anchored top',
        'floating-dock (5-button magnetic dock) — anchored bottom-center, 32px from bottom',
        'background gradient + vortex bloom — fixed, parallax-shifted by scroll position via CSS @scroll-timeline',
      ],
    },
    panels: [
      {
        id: 'top-bar',
        kind: 'transparent-on-load → glass-on-scroll',
        elements: [
          { kind: 'logo-wordmark', size: '32px', href: '/home', font: 'display', weight: 700 },
          { kind: 'tab-row', position: 'center', tabs: ['Home', 'Labs', 'Arcade', 'Achievements'], font: 'body', size: '14px', weight: 500 },
          { kind: 'avatar-button', position: 'right', size: '36px', menuOnClick: 'profile-menu (anchor-positioned)' },
        ],
        scrollBehavior: 'transparent at scrollY=0; on scroll past 64px adds backdrop-filter blur(24px) + 1px bottom border',
      },
      {
        id: 'fold-hero', kind: 'fold', layout: 'centered-flex-column',
        elements: [
          { kind: 'eyebrow',     text: 'Today, {dayName}',           font: 'body', weight: 500, size: '14px', color: 'lab-color', tracking: '0.20em', uppercase: true },
          { kind: 'hero-title',  text: 'Welcome back,\\n{firstName}.', font: 'display', weight: 700, size: 'clamp(3rem, 7vw, 6.5rem)', tracking: '-0.04em', lineHeight: 0.96 },
          { kind: 'hero-stat',   text: '{streakDays}-day streak', font: 'display', weight: 600, size: 'clamp(1.5rem, 3vw, 2.25rem)', treatment: 'iridescent-text-clip-conic' },
          { kind: 'hero-cta-row', items: [
            { variant: 'primary',   label: 'Continue Mission', icon: 'arrow-right' },
            { variant: 'secondary', label: 'Browse Labs',      icon: 'compass'    },
          ]},
          { kind: 'low-poly-accent', position: 'bottom-right corner of fold', sizeVw: 14, asset: 'inline-svg low-poly triangle mesh, stroke teal 0.5px' },
          { kind: 'vortex-bloom',  position: 'behind hero-title', kind: 'radial-gradient blur(60px) opacity 0.6', colors: ['portalMag', 'rimTeal', 'violetWarp'] },
        ],
        scrollAnimation: 'hero-title scales 1.0 → 0.85 + opacity → 0 between scrollY 0 → 100vh (CSS @scroll-timeline)',
      },
      {
        id: 'fold-mission', kind: 'fold', layout: 'bento-grid',
        elements: [
          { kind: 'fold-eyebrow', text: 'Your Labs', font: 'data', weight: 500, size: '12px', tracking: '0.20em', uppercase: true },
          { kind: 'fold-title',   text: 'Where curiosity meets AI.', font: 'display', weight: 700, size: 'clamp(2rem, 4vw, 3.5rem)', tracking: '-0.03em' },
          { kind: 'bento-grid',   refer: 'architecture.labMap.bento', columns: 12, rows: 'auto', gap: '24px', tiles: [
            { labId: 'currentOrNext', size: '6x4', variant: 'hero',  position: 'top-left', shows: 'iridescent ring + vortex glow + low-poly accent + lab description' },
            { labId: 1,  size: '3x2' }, { labId: 2,  size: '3x2' },
            { labId: 3,  size: '3x2' }, { labId: 4,  size: '3x2' },
            { labId: 5,  size: '3x2' }, { labId: 6,  size: '3x2' },
            { labId: 7,  size: '3x2' }, { labId: 8,  size: '3x2' },
            { labId: 9,  size: '3x2' }, { labId: 10, size: '3x2' },
            { labId: 11, size: '6x2', variant: 'wide', label: 'NEW · Agentic AI' },
          ]},
        ],
        scrollAnimation: 'each tile fades in + translateY(24px) → 0 as it crosses 80% viewport (IntersectionObserver, stagger by 60ms)',
      },
      {
        id: 'fold-momentum', kind: 'fold', layout: 'two-column-asymmetric',
        elements: [
          { kind: 'fold-eyebrow', text: 'Pick up where you left off' },
          { kind: 'fold-title',   text: 'In progress.' },
          { kind: 'continue-card',  primary: true, size: '8x3-cols', shows: ['game-thumbnail', 'lab-name', 'progress-bar', 'time-since'] },
          { kind: 'recent-list',    secondary: true, size: '4x3-cols', items: '{recentActivity[0..2]}', kind: 'vertical list of 3 mini-cards' },
        ],
      },
      {
        id: 'fold-orbit', kind: 'fold', layout: 'centered-widget',
        elements: [
          { kind: 'fold-eyebrow', text: 'Or jump anywhere' },
          { kind: 'fold-title',   text: 'The constellation.' },
          { kind: 'lab-map-widget', refer: 'architecture.labMap.orbit', sizeVmin: 70, interaction: 'rotate via drag + click to enter' },
        ],
      },
      {
        id: 'fold-discover', kind: 'fold', layout: 'two-column-equal',
        elements: [
          { kind: 'eyebrow',     text: "Today's spark" },
          { kind: 'daily-card',  shows: ['challenge-title', 'time-estimate', 'reward-XP', 'cta-Begin'] },
          { kind: 'sparky-card', shows: ['guide-avatar', 'invitation: "Got a question? Ask me about today’s lab."', 'cta-OpenChat'] },
        ],
      },
      {
        id: 'floating-dock',
        kind: 'persistent-anchored-bottom',
        treatment:
          'Pill-shaped glass dock. Width: clamp(320px, 52vw, 540px). ' +
          'Height: 64px. Border-radius: 9999px. Backdrop-filter: ' +
          'blur(28px) saturate(180%). 1px iridescent ring (animated). ' +
          'Centered horizontally, 32px from viewport bottom. Z-index 80.',
        elements: [
          { kind: 'dock-icon', id: 'home',     icon: 'home',     activeOnRoute: '/home' },
          { kind: 'dock-icon', id: 'labs',     icon: 'beaker',   activeOnRoute: '/labs' },
          { kind: 'dock-fab',  id: 'continue', icon: 'play',     primary: true, label: 'Continue', expandsOnHover: true },
          { kind: 'dock-icon', id: 'arcade',   icon: 'gamepad',  activeOnRoute: '/arcade' },
          { kind: 'dock-icon', id: 'profile',  icon: 'user',     activeOnRoute: '/profile' },
        ],
        magneticHover: 'each dock icon scales 1.0 → 1.18 with neighbors 1.0 → 1.06 based on cursor proximity (Apple-dock style)',
      },
    ],
    labMap: {
      // Two presentations: a small bento "constellation snapshot" embedded in fold-mission,
      // and a larger interactive "orbit" widget in fold-orbit.
      bento: {
        kind: 'flat-bento-grid',
        rationale: 'Apple-style: emphasize browsability over spatial 3D map',
        layout: '12-col grid, mixed tile sizes (1×1 / 2×1 / 3×2 / 6×2 hero)',
        primaryTile: { labId: 'currentOrNext', size: '6x4', position: 'top-left' },
      },
      orbit: {
        kind: 'concentric-rings-3d-css',
        rationale: 'Decorative interactive widget: shows topology + adjacency, but not the primary entry point',
        rings: [
          { id: 'outer', labIds: [1,2,3,4,5,6],   radiusPct: 38, angleStepDeg: 60, startAngleDeg: -90 },
          { id: 'inner', labIds: [7,8,9,10,11],   radiusPct: 22, angleStepDeg: 72, startAngleDeg: -90 },
        ],
        adjacency: {
          outerLoop:  [[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]],
          innerLoop:  [[7,8],[8,9],[9,10],[10,11],[11,7]],
          crossBeams: [[1,7],[2,8],[3,9],[4,10],[5,11]],
          specialOverlay: { labId: 6, treatment: 'soft halo + dashed connections to all' },
        },
        treatment: 'CSS-3D transforms (transform-style: preserve-3d), each lab a 64px disk; ring rotates slowly; user can drag to rotate; click to navigate',
        nodeTreatment: { idle: 'glass disk + iridescent rim 1px', hovered: 'scale 1.10 + glow', focused: 'scale 1.18 + iridescent rotate 4s' },
      },
    },
    transitions: {
      heroToHome:   { kind: 'view-transitions-api', duration: '700ms', morphTargets: ['hero-logo → topbar-logo'] },
      labEntry:     { kind: 'iris-zoom',           duration: '500ms', mask: 'circle from clicked-lab origin' },
      gameEntry:    { kind: 'view-transition-named', duration: '600ms', morphTargets: ['game-thumbnail → game-page-hero'] },
      foldScroll:   { kind: 'snap + opacity ramp', duration: 'scroll-driven', usesScrollTimeline: true },
      cardLift:     { kind: 'magnetic-hover + tilt', duration: '300ms' },
    },
    responsive: {
      strategy: 'container-queries on .fold + classic viewport queries on top-bar/dock',
      breakpoints: {
        wide:    '@container (min-width: 1280px) — full 12-col bento, hero 6x4',
        medium:  '@container (min-width: 768px)  — 8-col, hero 4x3',
        narrow:  '@container (max-width: 767px)  — 4-col, hero 4x2, lab tiles 2x1, dock simplifies to 4 icons',
      },
      reducedMotion: 'scroll-snap off, scroll-driven animations off, magnetic hover off, iridescent ring static',
      reducedTransparency: 'glass surfaces become solid, blur disabled',
      contrastModes:        'AAA palette swap available via prefers-contrast: more',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Style assembly
// ─────────────────────────────────────────────────────────────────────

function buildStyle1() {
  const labs = parseLabColors();
  const palette = parseBrandPalette();
  const material = parseMaterialPhysics();
  const fonts = parseFonts();
  const surface = parseSurfaceVars();
  const spacing = parseSpacingScale();

  return {
    $schema: 'sparkforge-design-spec/v2',
    style: 'style-1-current-cockpit',
    description:
      'Current Frost-Prismatic Laboratory Cockpit, lightly cleaned for HTML ' +
      'translation. Dark-mode only. Architecture mirrors the actual coded ' +
      'CockpitUILayer — 4 fixed zones around a variable center viewport, ' +
      'with peripheral HUD frame and concentric 6+5 lab map.',
    brand: { name: 'SparkForge', audience: 'kids 7-16', mood: ['futuristic laboratory', 'command console', 'glassmorphic', 'chrome bezel', 'neon emissive'] },
    palette: {
      brand: palette,
      labs,
      neon: {
        blue: 'oklch(0.75 0.17 225)', green: 'oklch(0.75 0.19 155)', purple: 'oklch(0.75 0.19 295)',
        orange: 'oklch(0.75 0.20 25)', amber: 'oklch(0.75 0.17 75)',
      },
      surface,
    },
    typography: {
      fontStacks: fonts,
      families: { display: 'Exo 2', body: 'Sora', mono: 'JetBrains Mono', data: 'Orbitron' },
      scale: { '2xs': '0.625rem', xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem', xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.25rem' },
      tracking: { tight: '-0.02em', normal: '0', wide: '0.04em', wider: '0.12em', widest: '0.20em' },
      cdn: 'Google Fonts via <link>, display=swap, fallback metrics in globals.css',
    },
    spacing: { grid: '4px', tokens: spacing },
    radii: { tileOuter: '16px', tileInner: '13px', screenInner: '11px', pill: '9999px', content: '12px', elevated: '18px' },
    glass: {
      base: {
        class: 'glass-card-v2',
        backdropFilter: 'blur(10px) saturate(180%) brightness(1.08)',
        background: 'linear-gradient(145deg, rgba(28,32,48,0.62) 0%, rgba(17,17,28,0.78) 100%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
        borderRadius: '16px',
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
      ledRim: { class: 'led-rim', background: 'linear-gradient(90deg, transparent 0%, var(--lab-color) 50%, transparent 100%)', opacity: 0.5 },
      screenInner: { class: 'screen-inner', background: 'var(--surface-card)', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)' },
    },
    materialPhysics: {
      ior: material.ior, transmission: material.transmission, roughness: material.roughness,
      metalness: material.metalness, anisotropy: material.anisotropy, clearcoat: material.clearcoat, envMapIntensity: material.envMapIntensity,
      note: 'WebGPU/TSL-only physics. Replicate the *vibe* in HTML via gradient highlights, conic-gradients, chromatic-aberration text-shadows.',
    },
    background: {
      kind: 'cosmic-dark',
      class: 'bg-cosmic-dark',
      stack: [
        'radial-gradient(ellipse at 20% 50%, rgba(0,187,255,0.03), transparent 60%)',
        'radial-gradient(ellipse at 80% 20%, rgba(170,102,255,0.02), transparent 50%)',
        'oklch(0.13 0.02 260)',
      ],
      overlays: ['scanlines (rgba(0,187,255,0.03), 4px stripe)', 'corner-vignette (rgba(0,20,40,0.3))'],
    },
    curvature: {
      uiCurveDeg: 2,
      strategy: 'Apply `transform: perspective(1200px) rotateX(2deg); transform-style: preserve-3d;` to the cockpit grid wrapper. Disable on prefers-reduced-motion + (pointer:coarse).',
    },
    motion: {
      easings: { spring: 'cubic-bezier(0.22, 1, 0.36, 1)', bezel: 'cubic-bezier(0.4, 0.0, 0.2, 1)' },
      durations: { fast: '120ms', base: '200ms', medium: '400ms', long: '600ms' },
      keyframes: [
        'float (3.5s)','float-slow (6s)','glow-pulse (3s)','chrome-shimmer (3s)','connection-pulse (4s)',
        'badge-unlock (0.8s)','slide-up-spring (0.5s)','scale-bounce (0.5s)','xp-counter (1.5s)',
        'subtle-glow (4s)','skeleton-shimmer (1.8s)','glow-border-rotate (4s)','emissivePulse (3s)','ledRimPulse (3s)','holographic-sweep (3s)',
      ],
      interactiveHover: { transform: 'translateY(-6px) scale(1.01)', boxShadow: '0 12px 40px rgba(0,0,0,0.3), 0 0 20px var(--lab-glow)', duration: '250ms' },
      activePress: { transform: 'translateY(-2px) scale(1.0)', duration: '100ms' },
      reducedMotion: 'all animations collapse to 0.01ms; chromatic-text + skeleton-shimmer stripped',
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
      brightnessControl: '0.7-1.0 user-adjustable, body filter (canvas excluded)',
      semanticLandmarks: 'banner / main / aside / nav / contentinfo on each zone',
    },
    architecture: architectureStyle1(),
    sourceFiles: {
      labColors:    'src/config/labColors.ts',
      tailwind:     'tailwind.config.ts',
      globals:      'src/app/globals.css',
      brandMaterial:'src/lib/branding/sf-material.config.ts',
      layout:       'src/app/layout.tsx',
      cockpitUI:    'src/components/3d/CockpitUILayer.tsx',
      cockpitPanels:'src/components/3d/CockpitPanels.tsx',
      labMap:       'src/components/3d/HolographicLabMap.tsx',
      hud:          'src/components/3d/HolographicHUD.tsx',
      cockpitStore: 'src/stores/cockpitStore.ts',
    },
  };
}

function buildStyle2() {
  const s1 = buildStyle1();
  return {
    ...s1,
    style: 'style-2-brighter-cockpit',
    description:
      '"Lab Atrium" — bright, open cockpit reinterpretation. Same 4-zone ' +
      'topology as style-1 (preserves muscle memory and game integration ' +
      'paths) but reimagined as a glass-walled atrium with cantilevered ' +
      'floating panels. Dark mode REMOVED. Surface is a turquoise → ' +
      'dark-magenta diagonal gradient with aurora bloom. Chrome bezels ' +
      'replaced by luminous edge rails. Hex-gauge instrument cluster ' +
      'replaced with bento-style flat tiles for a curated, less ' +
      'mechanical feel. Augmented with modern best-practices: container ' +
      'queries, anchor positioning, scroll-driven animations, View ' +
      'Transitions, parallax-tilt panels.',
    brand: { ...s1.brand, mood: ['lab atrium', 'sunlit observatory', 'cantilevered glass', 'aurora bloom', 'curated bento'] },
    palette: {
      ...s1.palette,
      labs: s1.palette.labs.map((l) => ({
        ...l,
        oklch: l.oklch.replace(/^oklch\((0\.\d+)/, (_, v) => `oklch(${Math.min(0.92, parseFloat(v) + 0.07).toFixed(2)}`),
      })),
      neon: {
        blue: 'oklch(0.82 0.16 225)', green: 'oklch(0.82 0.18 155)', purple: 'oklch(0.82 0.18 295)',
        orange: 'oklch(0.82 0.19 25)', amber: 'oklch(0.82 0.16 75)',
      },
      surface: {
        base:     'oklch(0.62 0.13 195) /* turquoise primary */',
        card:     'oklch(0.32 0.14 340) /* dark magenta secondary */',
        elevated: 'oklch(0.42 0.12 320) /* magenta-violet elevated */',
        border:   'oklch(1.0 0 0 / 0.18)',
        textPrimary:   'oklch(0.98 0.005 280)',
        textSecondary: 'oklch(0.98 0 0 / 0.78)',
        textMuted:     'oklch(0.98 0 0 / 0.55)',
        chromeEdge:      'oklch(1.0 0 0 / 0.16)',
        chromeHighlight: 'oklch(1.0 0 0 / 0.34)',
        chromeSpecular:  'oklch(1.0 0 0 / 0.52)',
      },
    },
    background: {
      kind: 'turquoise-magenta-aurora',
      class: 'bg-bright-atrium',
      stack: [
        'radial-gradient(ellipse 80% 60% at 25% 30%, oklch(0.78 0.16 195) 0%, transparent 55%)',
        'radial-gradient(ellipse 70% 70% at 78% 78%, oklch(0.42 0.20 340) 0%, transparent 60%)',
        'linear-gradient(135deg, oklch(0.66 0.14 200) 0%, oklch(0.34 0.14 330) 100%)',
      ],
      overlays: [
        'aurora-drift: large blurred radial gradients animated 30s loop',
        'film-grain (rgba(255,255,255,0.012))',
        'soft-vignette (rgba(0,0,0,0.18) corners) — much lighter than v1',
      ],
      note: 'Dark-mode removed. Surface contrast ensured locally per-panel.',
    },
    chrome: {
      ...s1.chrome,
      bezel: {
        ...s1.chrome.bezel,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 35%, rgba(0,0,0,0.38) 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.18), inset 0 1px 0 rgba(255,255,255,0.34), 0 0 0 0.5px rgba(255,255,255,0.10)',
        note: 'Polished aluminum vs brushed-titanium of style-1. Use as outer rail on cantilevered cards.',
      },
      shineSweep: {
        keyframe: 'chrome-shimmer 3s linear infinite (always-on, ambient)',
        background: 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)',
        size: '200% 100%',
      },
    },
    glass: {
      base: {
        class: 'atrium-card',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)',
        backdropFilter: 'blur(14px) saturate(170%) brightness(1.05)',
        border: '1px solid rgba(255,255,255,0.28)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.34), 0 24px 56px -32px rgba(0,0,0,0.35) /* cantilever */',
        borderRadius: '20px',
      },
      elevated: {
        class: 'atrium-card-elevated',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)',
        backdropFilter: 'blur(18px) saturate(180%) brightness(1.08)',
        border: '1px solid rgba(255,255,255,0.36)',
        boxShadow: '0 16px 60px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.46), 0 32px 72px -28px rgba(0,0,0,0.45)',
        borderRadius: '24px',
      },
    },
    motion: {
      ...s1.motion,
      ambientDefaults: 'chrome-shimmer + glow-pulse always-on for bezels (was opt-in in v1)',
      parallaxTilt: 'cards rotateX/rotateY ±2deg following cursor (lerp 0.15)',
      magneticHover: 'cards translate ±3px toward cursor on hover',
      scrollDriven: 'aurora-drift speed scales with scroll velocity (CSS @scroll-timeline)',
    },
    architecture: architectureStyle2(),
  };
}

function buildStyle3() {
  return {
    $schema: 'sparkforge-design-spec/v2',
    style: 'style-3-cyberpunk-apple',
    description:
      '"Holo-Deck Dashboard" — clean-sheet redesign. Apple-style vertical ' +
      'scroll page with cyberpunk holographic accents (iridescent rings, ' +
      'magenta/teal vortex hero, low-poly geometric corners). Discards ' +
      'the 4-zone cockpit metaphor entirely. Light + dark theme variants. ' +
      'Reference image colors sampled. Uses every modern CSS best ' +
      'practice: scroll-snap, @scroll-timeline, View Transitions API, ' +
      'anchor positioning, container queries, OKLCH, color-mix, :has().',
    brand: {
      name: 'SparkForge',
      audience: 'kids 7-16',
      mood: ['Apple-clean whitespace', 'cyberpunk holographic', 'iridescent', 'scrollable narrative', 'low-poly geometric'],
    },
    palette: {
      brand: {
        deepNavy:   '#0B0F1E',
        rimTeal:    '#1FE3D6',
        rimCyanIce: '#9FFFF6',
        portalMag:  '#B22CFF',
        portalPink: '#FF4FC8',
        violetWarp: '#7A2DE0',
        skySoft:    '#E8F4FF',
        cleanWhite: '#FFFFFF',
      },
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
      neon: { teal: 'oklch(0.84 0.15 190)', magenta: 'oklch(0.55 0.30 305)', pink: 'oklch(0.73 0.24 340)', violet: 'oklch(0.50 0.25 295)', aurora: 'oklch(0.86 0.20 155)' },
      surface: {
        base:           '#F7FAFD',
        card:           '#FFFFFF',
        elevated:       '#FFFFFF',
        border:         'rgba(11,15,30,0.08)',
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
      fontStacks: {
        display: '"Inter Display", "SF Pro Display", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        body:    '"Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        mono:    '"JetBrains Mono", monospace',
        data:    '"Orbitron", monospace',
      },
      families: { display: 'Inter Display', body: 'Inter', mono: 'JetBrains Mono', data: 'Orbitron' },
      scale: {
        hero:    'clamp(3rem, 7vw, 6.5rem)',
        h1:      'clamp(2.25rem, 4vw, 3.75rem)',
        h2:      'clamp(1.5rem, 2.5vw, 2.25rem)',
        h3:      '1.25rem',
        body:    '1.0625rem',
        caption: '0.875rem',
        eyebrow: '0.75rem',
      },
      weights: { display: 700, body: 400, semibold: 600, bold: 700 },
      tracking: { hero: '-0.04em', h1: '-0.03em', body: '-0.011em', eyebrow: '0.20em' },
      cdn: 'Inter via fonts.googleapis.com (use next/font/google when build-time available)',
    },
    spacing: { grid: '8px', tokens: { xs: '0.5rem', sm: '1rem', md: '1.5rem', lg: '2.5rem', xl: '4rem', '2xl': '6rem', section: '8rem' }, note: 'DOUBLED from style-1 (4px → 8px) for Apple-style breathing room.' },
    radii: { tileOuter: '24px', tileInner: '20px', pill: '9999px', content: '20px', elevated: '28px', strategy: 'single-layer pillowy radii — no chrome bezel stack' },
    glass: {
      base: {
        class: 'holo-card',
        background: 'linear-gradient(145deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.42) 100%)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.55)',
        boxShadow: '0 16px 48px -12px rgba(11,15,30,0.18), 0 0 0 1px rgba(11,15,30,0.04)',
        borderRadius: '24px',
        iridescentEdge: 'conic-gradient(from 220deg, #1FE3D6, #B22CFF, #FF4FC8, #1FE3D6) 1px (animated 8s rotate)',
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
        animation: 'iridescent-spin 8s linear infinite',
        mask: 'border-only via padding + mask-composite (same trick as glass-card-v2::before)',
      },
    },
    background: {
      kind: 'apple-holographic',
      lightMode: {
        stack: [
          'radial-gradient(circle 60vw at 70% 30%, rgba(178,44,255,0.18) 0%, transparent 50%)',
          'radial-gradient(circle 50vw at 20% 70%, rgba(31,227,214,0.20) 0%, transparent 55%)',
          'linear-gradient(180deg, #F7FAFD 0%, #E8F4FF 100%)',
        ],
      },
      darkMode: {
        stack: [
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
      strategy: 'transform: perspective(1400px) rotateX(3deg); transform-style: preserve-3d. Apply to .fold-mission bento grid. Disable on prefers-reduced-motion + (pointer:coarse).',
      cssVar: '--ui-curve: 3deg',
    },
    motion: {
      easings: { spring: 'cubic-bezier(0.22, 1, 0.36, 1)', appleEase: 'cubic-bezier(0.4, 0.0, 0.2, 1)', snap: 'cubic-bezier(0.32, 0.72, 0, 1)' },
      durations: { micro: '120ms', base: '300ms', cinematic: '700ms', hero: '1200ms' },
      keyframes: [
        'iridescent-spin (8s linear)','breath (4s ease-in-out)','parallax-tilt (pointer-driven)',
        'scroll-reveal (IntersectionObserver, 700ms)','magnetic-hover (rAF lerp)','iris-zoom (200ms)',
      ],
      interactiveHover: { transform: 'translateY(-4px) scale(1.02)', boxShadow: '0 28px 64px -20px rgba(11,15,30,0.22), 0 0 0 1px rgba(31,227,214,0.30)', duration: '300ms', easing: 'cubic-bezier(0.32, 0.72, 0, 1)', magneticPull: '4px (CSS variable, set by JS pointer tracker)' },
      activePress: { transform: 'scale(0.98)', duration: '120ms' },
      reducedMotion: 'iridescent-spin → static 220deg conic; parallax/magnetic/breath OFF; scroll-reveal collapsed to instant fade',
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
      focusRing: 'outline 3px solid #1FE3D6, outline-offset 2px, halo 0 0 0 6px rgba(31,227,214,0.30)',
      reducedMotion: 'all decorative animations off',
      contrast: 'WCAG AA both modes (light: 17:1, dark: 16:1). AAA palette swap available via prefers-contrast: more.',
      touchTargets: '44x44 min',
      semanticLandmarks: 'banner (top-bar) / main (folds) / nav (dock) / contentinfo (footer)',
    },
    architecture: architectureStyle3(),
    referenceImages: [
      { source: 'user-attached image 1', extracted: ['#1FE3D6 HUD teal', '#9FFFF6 ice cyan highlight', 'circular orb hero element', 'dark navy background', 'thin glow lines'] },
      { source: 'user-attached image 2', extracted: ['#B22CFF portal magenta', '#FF4FC8 hot pink edge', '#7A2DE0 violet mid', 'vortex/portal centerpiece', 'low-poly geometric figure', 'strong neon bloom'] },
    ],
    sourceFiles: { note: 'Style-3 is a clean-sheet design — most tokens are NEW, not extracted.' },
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

console.log('\nDone. 3 design specs emitted (with architecture).');
