// ════════════════════════════════════════════════════════════════
// COCKPIT DESIGN TOKENS — Generated from SparkForge-Full-ControlScreen.json
// ════════════════════════════════════════════════════════════════
// Single source of truth for all visual constants across the cockpit.
// Every 3D component imports from here — NO hardcoded values.
// See DESIGN_DECISIONS_LOG.md for decision rationale.
//
// Version: 1.0 | Generated: April 1, 2026

// ═══════════════════════════════════════════════════════════════
// SECTION 1: TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════

export type TypeLevel = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'caption';

export interface TypeStyle {
  fontSize: number;
  font: string;
  fontPath: string;
  weight: string;
}

export const TYPE_SCALE: Record<TypeLevel, TypeStyle> = {
  display: { fontSize: 0.07,  font: 'Exo2-Bold',       fontPath: '/fonts/Exo2-Bold.woff2',           weight: 'bold' },
  h1:      { fontSize: 0.05,  font: 'Exo2-Bold',       fontPath: '/fonts/Exo2-Bold.woff2',           weight: 'bold' },
  h2:      { fontSize: 0.038, font: 'Exo2-Bold',       fontPath: '/fonts/Exo2-Bold.woff2',           weight: 'bold' },
  h3:      { fontSize: 0.032, font: 'Exo2-Bold',       fontPath: '/fonts/Exo2-Bold.woff2',           weight: 'bold' },
  body:    { fontSize: 0.032, font: 'Sora-Regular',     fontPath: '/fonts/Sora-Regular.woff2',        weight: 'regular' },
  label:   { fontSize: 0.022, font: 'Sora-Regular',     fontPath: '/fonts/Sora-Regular.woff2',        weight: 'regular' },
  caption: { fontSize: 0.024, font: 'Sora-Regular',     fontPath: '/fonts/Sora-Regular.woff2',        weight: 'regular' },
} as const;

/** Orbitron for ALL numeric values — XP, levels, percentages, counts, timers, scores */
export const NUMERIC_FONT = '/fonts/Orbitron-Bold.woff2';
export const NUMERIC_FONT_FAMILY = 'Orbitron-Bold';

export const TEXT_COLORS = {
  primary:   { hex: '#F0F0F4', opacity: 1.0 },
  secondary: { hex: '#F0F0F4', opacity: 0.8 },
  muted:     { hex: '#F0F0F4', opacity: 0.55 },
  dim:       { hex: '#F0F0F4', opacity: 0.35 },
  // accent: uses dynamic mode color — resolved at render time
} as const;

// ═══════════════════════════════════════════════════════════════
// SECTION 2: EDGES
// ═══════════════════════════════════════════════════════════════

export type ComponentClass = 'structural' | 'interactive' | 'display';

export const BEVEL_STYLE: Record<ComponentClass, { type: string; value: number }> = {
  structural:  { type: 'chamfer', value: 0.008 },
  interactive: { type: 'rounded', value: 0.004 },
  display:     { type: 'sharp',   value: 0 },
} as const;

export const BORDER_RADIUS = {
  small: 4,
  medium: 8,
  large: 12,
} as const;

export const CHROME_BORDER = {
  width: 2,
  color: 0xa8b5c8,
  colorHex: '#a8b5c8',
  glowIntensity: 0.15,
  glowColor: '#a8b5c8',
} as const;

export const HOVER_GLOW = {
  type: 'pulse_trace' as const,
  pulseMin: 0.6,
  pulseMax: 1.0,
  pulsePeriodS: 1.5,
  traceColor: '#00E5FF',
  traceColorHex: 0x00e5ff,
  traceWidth: 2,
} as const;

// ═══════════════════════════════════════════════════════════════
// SECTION 3: DEPTH LAYERS
// ═══════════════════════════════════════════════════════════════

export type DepthLayer =
  | 'deep_recess' | 'recess' | 'surface' | 'low_raise'
  | 'high_raise' | 'content' | 'glow' | 'overlay';

export const DEPTH_STEP = 0.005;

export const DEPTH_LAYERS: Record<DepthLayer, number> = {
  deep_recess: -0.020,
  recess:      -0.010,
  surface:      0.000,
  low_raise:    0.005,
  high_raise:   0.010,
  content:      0.015,
  glow:         0.020,
  overlay:      0.025,
} as const;

export const PRESS_DEPTH = 0.03;

// ═══════════════════════════════════════════════════════════════
// SECTION 4: SPRING PRESETS
// ═══════════════════════════════════════════════════════════════

export type SpringPresetName = 'snap' | 'crisp' | 'smooth' | 'bounce' | 'heavy' | 'dramatic';

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

export const SPRING_PRESETS: Record<SpringPresetName, SpringConfig> = {
  snap:     { stiffness: 600, damping: 35, mass: 0.8 },
  crisp:    { stiffness: 450, damping: 28, mass: 1.0 },
  smooth:   { stiffness: 300, damping: 25, mass: 1.0 },
  bounce:   { stiffness: 400, damping: 18, mass: 1.0 },
  heavy:    { stiffness: 200, damping: 30, mass: 2.0 },
  dramatic: { stiffness: 120, damping: 20, mass: 3.0 },
} as const;

export const TRANSITION_DURATION_MS = 400;
export const TRANSITION_EASING = 'ease-out-cubic';

// ═══════════════════════════════════════════════════════════════
// SECTION 4b: CELEBRATIONS (3 tiers)
// ═══════════════════════════════════════════════════════════════

export type CelebrationTier = 'minor' | 'major' | 'epic';

export interface CelebrationConfig {
  ledBehavior: string;
  bloomPeak: number;
  hudExpansion: number;
  confetti: boolean;
  confettiCount: number;
  cameraShake: boolean;
  trophyMaterialize: boolean;
  durationMs: number;
}

export const CELEBRATION_TIERS: Record<CelebrationTier, CelebrationConfig> = {
  minor: {
    ledBehavior: 'single_pulse',
    bloomPeak: 0.5,
    hudExpansion: 1.05,
    confetti: false,
    confettiCount: 0,
    cameraShake: false,
    trophyMaterialize: false,
    durationMs: 1500,
  },
  major: {
    ledBehavior: 'gold_sweep',
    bloomPeak: 0.8,
    hudExpansion: 1.3,
    confetti: true,
    confettiCount: 150,
    cameraShake: false,
    trophyMaterialize: false,
    durationMs: 3000,
  },
  epic: {
    ledBehavior: 'rapid_gold_flash',
    bloomPeak: 1.0,
    hudExpansion: 1.6,
    confetti: true,
    confettiCount: 500,
    cameraShake: true,
    trophyMaterialize: true,
    durationMs: 4000,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// SECTION 5: EMISSIVE SCALE
// ═══════════════════════════════════════════════════════════════

export type EmissiveLevel = 'off' | 'dormant' | 'dim' | 'medium' | 'bright' | 'blazing';

export const EMISSIVE_SCALE: Record<EmissiveLevel, number> = {
  off:      0.0,
  dormant:  0.15,
  dim:      0.4,
  medium:   0.8,
  bright:   1.5,
  blazing:  2.5,
} as const;

export const EMISSIVE_IDLE_BUTTON = 0.8;
export const EMISSIVE_IDLE_INDICATOR = 0.5;
export const EMISSIVE_HOVER_MULTIPLIER = 1.8;
export const EMISSIVE_LED_MULTIPLIER = 1.5;

// ═══════════════════════════════════════════════════════════════
// SECTION 6: MODE COLOR TEMPERATURE
// ═══════════════════════════════════════════════════════════════

import type { CockpitMode } from './cockpitModePresets';

export const SURFACE_TINT_BLEND = 0.05;

export const MODE_FILL_LIGHT: Record<CockpitMode, { color: string; intensity: number }> = {
  dashboard:   { color: '#00E5FF', intensity: 0.3 },
  labs:        { color: '#00E5FF', intensity: 0.35 },
  lab_detail:  { color: 'dynamic', intensity: 0.35 },
  game:        { color: 'dynamic', intensity: 0.15 },
  profile:     { color: '#AA66FF', intensity: 0.3 },
  settings:    { color: '#FFAA44', intensity: 0.25 },
  celebration: { color: '#FFD700', intensity: 0.6 },
  parent:      { color: '#FFAA44', intensity: 0.2 },
} as const;

export const PARTICLE_CROSSFADE_S = 1.5;

// ═══════════════════════════════════════════════════════════════
// SECTION 7: COMPONENT STATE MACHINES
// ═══════════════════════════════════════════════════════════════

export type ComponentState = 'idle' | 'hover' | 'pressed' | 'active' | 'disabled' | 'loading';

export interface StateVisuals {
  emissive: EmissiveLevel;
  scale: number;
  depthLayer: DepthLayer;
  borderGlow: number;
  opacity?: number;
  saturation?: number;
  hoverResponse?: boolean;
  pulseSpeedS?: number;
  spring?: SpringPresetName;
}

export const STATE_MACHINE: Record<ComponentState, StateVisuals> = {
  idle: {
    emissive: 'medium',
    scale: 1.0,
    depthLayer: 'high_raise',
    borderGlow: 0.0,
  },
  hover: {
    emissive: 'bright',
    scale: 1.05,
    depthLayer: 'high_raise',
    borderGlow: 1.0,
    spring: 'bounce',
  },
  pressed: {
    emissive: 'blazing',
    scale: 1.0,
    depthLayer: 'low_raise',
    borderGlow: 1.0,
    spring: 'snap',
  },
  active: {
    emissive: 'bright',
    scale: 1.0,
    depthLayer: 'low_raise',
    borderGlow: 0.8,
  },
  disabled: {
    emissive: 'off',
    scale: 1.0,
    depthLayer: 'high_raise',
    borderGlow: 0.0,
    opacity: 0.4,
    saturation: 0.0,
    hoverResponse: false,
  },
  loading: {
    emissive: 'dim',
    scale: 1.0,
    depthLayer: 'high_raise',
    borderGlow: 0.5,
    pulseSpeedS: 0.8,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// SECTION 8: SURFACE DETAIL
// ═══════════════════════════════════════════════════════════════

export const PANEL_SEAMS = {
  widthPx: 0.5,
  opacity: 0.10,
  color: '#0A0E16',
} as const;

export const MICRO_TEXTURE = {
  type: 'fine_grain' as const,
  noiseIntensity: 0.02,
} as const;

export const ACCENT_LINES = {
  coverage: 'full_trace' as const,
  emissiveLevel: 'dormant' as EmissiveLevel,
  opacity: 0.25,
  width: 0.002,
} as const;

// ═══════════════════════════════════════════════════════════════
// SECTION A: FOCUS & READABILITY ZONES
// ═══════════════════════════════════════════════════════════════

export type Quadrant = 'left' | 'center' | 'right' | 'bottom';

export const FOCUS_CONFIG = {
  priorityBrightness: 1.0,
  nonPriorityBrightness: 0.7,
  dofBlurAmount: 0.003,
  firstLook: 'primary_cta' as const,
} as const;

export const MODE_FOCUS_TARGETS: Record<CockpitMode, { primary: Quadrant[]; secondary: Quadrant[] }> = {
  dashboard:   { primary: ['center'],           secondary: ['left', 'right'] },
  labs:        { primary: ['center'],           secondary: ['left', 'right'] },
  lab_detail:  { primary: ['center'],           secondary: ['left', 'right'] },
  game:        { primary: ['center'],           secondary: [] },
  profile:     { primary: ['center', 'left'],   secondary: ['right'] },
  settings:    { primary: ['center', 'right'],  secondary: ['left'] },
  celebration: { primary: ['center'],           secondary: ['left', 'right'] },
  parent:      { primary: ['center'],           secondary: ['left', 'right'] },
} as const;

// ═══════════════════════════════════════════════════════════════
// SECTION B: INFORMATION DENSITY
// ═══════════════════════════════════════════════════════════════

export const MAX_VISIBLE_ITEMS = {
  activityLog: 5,
  gameGrid: 12,
  badgeGallery: 9,
  trophyDisplay: 3,
  gauges: 4,
} as const;

export const WHITESPACE_RATIO = 0.40;

export const GHOST_PLACEHOLDER_OPACITY = 0.10;

// ═══════════════════════════════════════════════════════════════
// SECTION C: INTERACTION FEEDBACK CHAINS
// ═══════════════════════════════════════════════════════════════

export const RIPPLE_OFFSETS_MS = {
  sourceElement: 0,
  ledRim: 50,
  statusBar: 100,
  hud: 150,
  sidePanels: 200,
  centerContent: 300,
} as const;

export const ALWAYS_RESPOND = ['led_rim', 'status_bar'] as const;

export const DAMPENING = {
  windowMs: 500,
  firstClick: 1.0,
  secondClick: 0.6,
  thirdPlus: 0.3,
} as const;

// ═══════════════════════════════════════════════════════════════
// SECTION D: SPATIAL AUDIO
// ═══════════════════════════════════════════════════════════════

export const AUDIO_DISTANCE_FALLOFF = 'flat' as const;
export const MECHANICAL_DENSITY_DEFAULT = 0.5;

export const AUDIO_PRIORITY_ORDER = [
  'celebration',
  'navigation',
  'button_press',
  'dial_rotate',
  'hover',
  'ambient',
] as const;

export const AUDIO_DUCK_VOLUME = 0.4;
export const LAB_CROSSFADE_TYPE = 'hard_cut' as const;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/** Get emissive intensity for a given level */
export function getEmissive(level: EmissiveLevel): number {
  return EMISSIVE_SCALE[level];
}

/** Get emissive intensity with hover multiplier applied */
export function getEmissiveHover(level: EmissiveLevel): number {
  return EMISSIVE_SCALE[level] * EMISSIVE_HOVER_MULTIPLIER;
}

/** Get depth Z-offset for a layer */
export function getDepth(layer: DepthLayer): number {
  return DEPTH_LAYERS[layer];
}

/** Get spring config by preset name */
export function getSpring(preset: SpringPresetName): SpringConfig {
  return SPRING_PRESETS[preset];
}

/** Get type style for a given level */
export function getTypeStyle(level: TypeLevel): TypeStyle {
  return TYPE_SCALE[level];
}

/** Get state visuals for a component state */
export function getStateVisuals(state: ComponentState): StateVisuals {
  return STATE_MACHINE[state];
}

/** Resolve fill light color for a mode (handles 'dynamic' → labColor) */
export function resolveFillLight(mode: CockpitMode, labColor: string): { color: string; intensity: number } {
  const entry = MODE_FILL_LIGHT[mode];
  return {
    color: entry.color === 'dynamic' ? labColor : entry.color,
    intensity: entry.intensity,
  };
}
