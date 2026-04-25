// ════════════════════════════════════════════════════════════════════
// cockpitThemes — Phase 5 N.2-MAX (§3.6)
// ════════════════════════════════════════════════════════════════════
// Theme registry for user-selectable cockpit aesthetics.
//
// Four themes are defined. Each overlays the Frost-Prismatic base with
// a distinct palette + emissive curve. The theme picker UI (dial in
// SettingsPanel + chip row) lets users switch at runtime. Settings
// persist via cockpitStore (zustand/persist middleware).
//
// Architecture:
//   - baseThemeTokens: defines the DEFAULT theme — the values every
//     existing 3D component currently hardcodes.
//   - themes: each alternative theme overrides a subset of the base.
//   - resolveTheme(id): merges base + selected theme, returns the
//     fully-flattened token set consumed by useCockpitCanvasProps.
// ════════════════════════════════════════════════════════════════════

export type ThemeId = 'default' | 'cyberpunk' | 'space' | 'sunset';

export interface CockpitTheme {
  id: ThemeId;
  name: string;
  description: string;
  /** Swatch colors shown in the picker UI (3 prominent accents). */
  swatch: [string, string, string];
  /** LED rim default color (active lab still overrides for focused lab moments). */
  ledBase: string;
  /** Panel base tint (deep carbon shade). */
  panelTint: string;
  /** Chrome bezel tone — 'frost' = cool white/silver, 'warm' = titanium/gold. */
  chromeTone: 'frost' | 'warm' | 'darkChrome' | 'prismatic';
  /** Bloom intensity MULTIPLIER applied on top of mode preset. */
  bloomMultiplier: number;
  /** Ambient light color. */
  ambientLight: string;
  /** HUD accent color — used for status readouts + tick marks. */
  hudAccent: string;
  /** Environment map file (HDR) — controls reflections + ambient. */
  envHdr: string;
}

// ─── BASE (default) theme ──────────────────────────────────────────

const BASE_THEME: CockpitTheme = {
  id: 'default',
  name: 'Frost',
  description: 'Classic blue-dominant Frost-Prismatic. The SparkForge default.',
  swatch: ['#0FB8FA', '#B67BFF', '#a8b5c8'],
  ledBase: '#0FB8FA',
  panelTint: '#1a1e2e',
  chromeTone: 'frost',
  bloomMultiplier: 1.0,
  ambientLight: '#00BBFF',
  hudAccent: '#00BBFF',
  envHdr: '/hdri/frost-prismatic.hdr',
};

// ─── Theme variants ────────────────────────────────────────────────

export const COCKPIT_THEMES: Record<ThemeId, CockpitTheme> = {
  default: BASE_THEME,

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyber',
    description: 'Neon magenta & electric blue. High-contrast synth aesthetic.',
    swatch: ['#FF00FF', '#00FFFF', '#FF6AC9'],
    ledBase: '#FF00FF',
    panelTint: '#2a0030',
    chromeTone: 'darkChrome',
    bloomMultiplier: 1.3,
    ambientLight: '#FF00AA',
    hudAccent: '#00FFFF',
    envHdr: '/hdri/frost-prismatic.hdr', // reuse base HDR for now
  },

  space: {
    id: 'space',
    name: 'Deep Space',
    description: 'Titanium chrome & deep indigo. Astronaut command bridge feel.',
    swatch: ['#4444FF', '#8F96FA', '#b8c2d4'],
    ledBase: '#4466FF',
    panelTint: '#0a0a1e',
    chromeTone: 'warm',
    bloomMultiplier: 0.85,
    ambientLight: '#4060AA',
    hudAccent: '#8F96FA',
    envHdr: '/hdri/frost-prismatic.hdr',
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm amber & coral. Comforting, Golden-hour cockpit.',
    swatch: ['#FF7050', '#D9A430', '#E68E28'],
    ledBase: '#FF8855',
    panelTint: '#2a1a08',
    chromeTone: 'warm',
    bloomMultiplier: 1.1,
    ambientLight: '#FFAA55',
    hudAccent: '#FFAA44',
    envHdr: '/hdri/frost-prismatic.hdr',
  },
};

/** Ordered array for UI (picker iterates this for consistent order). */
export const THEME_ORDER: ThemeId[] = ['default', 'cyberpunk', 'space', 'sunset'];

/** Resolve a theme by id. Falls back to default on unknown ids. */
export function resolveTheme(id: ThemeId | undefined | null): CockpitTheme {
  if (!id) return BASE_THEME;
  return COCKPIT_THEMES[id] ?? BASE_THEME;
}
