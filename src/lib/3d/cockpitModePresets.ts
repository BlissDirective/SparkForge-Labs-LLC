// ════════════════════════════════════════════════════════════════
// COCKPIT MODE PRESETS — Unified Atmosphere Configuration
// ════════════════════════════════════════════════════════════════
// Source of truth: SparkForge-Full-ControlScreen.json §mode_presets
// Each route triggers a different cockpit mood. 8 modes × 14 properties.
//
// This file UNIFIES the fragmented presets from cockpitConfig.ts
// (BLOOM_PRESETS, CAMERA_PRESETS, VIGNETTE_PRESETS, HUD_PRESETS, etc.)
// into a single per-mode object consumed by useCockpitScene.

import type { HUDDataMode, SidePanelContent } from './cockpitConfig';

// ■■ Mode Identifiers ■■
// Maps to Next.js routes — pages call useCockpitScene(mode) to activate
// Phase 2 Section 7 (Solution D): Unified mode type. Absorbs former StationMode.
// `onboarding` and `admin` were merged from the legacy StationMode union.
export type CockpitMode =
  | 'dashboard'    // /home
  | 'labs'         // /labs
  | 'lab_detail'   // /labs/[labId]
  | 'arcade'       // /arcade (game browser grid)
  | 'game'         // /arcade/[gameSlug]
  | 'profile'      // /profile
  | 'settings'     // /settings
  | 'celebration'  // triggered by XP/badge/level events
  | 'parent'       // /parent
  | 'onboarding'   // /onboarding (merged from legacy StationMode)
  | 'admin';       // /admin (merged from legacy StationMode)

// ■■ Particle Intensity ■■
export type ParticleLevel = 'off' | 'low' | 'medium' | 'high' | 'max';

// ■■ Mode Preset Shape — 14 atmosphere properties per mode ■■
export interface CockpitModePreset {
  // LED rim
  ledColor: string;                // Static color or 'dynamic' for lab-reactive

  // Bloom (postprocessing)
  bloom: { intensity: number; threshold: number; smoothing: number };

  // Camera
  camera: { fov: number; distortion: number };

  // Vignette (postprocessing)
  vignette: { darkness: number; offset: number };

  // HUD (HolographicHUD)
  hud: { opacity: number; rotationSpeed: number; pulseIntensity: number; dataMode: HUDDataMode };

  // Cockpit panels
  panels: { curvature: number; opacity: number };

  // Side panels (left/right consoles)
  sidePanels: { opacity: number; leftContent: SidePanelContent; rightContent: SidePanelContent };

  // Status bar
  statusBar: { opacity: number };

  // Center viewport
  centerScale: number;            // 1.0 normal, 1.75 game takeover
  panelOffset: number;            // 0 = flush, 0.3 = panels slide 30% outward

  // Particles
  particles: ParticleLevel;

  // Ambient audio hint (consumed by CockpitAudioEngine)
  ambientAudio: string;

  // Transition config for entering this mode
  transition: {
    type: 'crossfade' | 'mechanical_iris';
    durationMs: number;
    easing: string;
  };
}

// ════════════════════════════════════════════════════════════════
// 8 MODE PRESETS — Per SparkForge-Full-ControlScreen.json
// ════════════════════════════════════════════════════════════════

export const COCKPIT_MODE_PRESETS: Record<CockpitMode, CockpitModePreset> = {
  dashboard: {
    ledColor: '#00BBFF',
    bloom: { intensity: 0.4, threshold: 0.6, smoothing: 0.9 },
    camera: { fov: 58, distortion: 0.025 },
    vignette: { darkness: 0.5, offset: 0.3 },
    // Phase 5 P.1-MAX (§6.5): HUD baseline opacity 0.15 → 0.25 for readable corner readouts
    hud: { opacity: 0.25, rotationSpeed: 0.1, pulseIntensity: 0.3, dataMode: 'minimap' },
    panels: { curvature: 0.85, opacity: 1.0 },
    sidePanels: { opacity: 0.6, leftContent: 'radar', rightContent: 'stats' },
    statusBar: { opacity: 1.0 },
    centerScale: 1.0,
    panelOffset: 0,
    particles: 'medium',
    ambientAudio: 'cockpit_hum',
    transition: { type: 'crossfade', durationMs: 400, easing: 'ease-out-cubic' },
  },

  arcade: {
    ledColor: '#88CC44',           // Green-amber blend — game browser energy
    bloom: { intensity: 0.5, threshold: 0.55, smoothing: 0.85 },
    camera: { fov: 60, distortion: 0.02 },
    vignette: { darkness: 0.45, offset: 0.3 },
    // Phase 5 P.1-MAX (§6.5): HUD baseline opacity 0.16 → 0.26 for readable corner readouts
    hud: { opacity: 0.26, rotationSpeed: 0.12, pulseIntensity: 0.35, dataMode: 'minimap' },
    panels: { curvature: 0.85, opacity: 1.0 },
    sidePanels: { opacity: 0.65, leftContent: 'radar', rightContent: 'stats' },
    statusBar: { opacity: 1.0 },
    centerScale: 1.05,
    panelOffset: 0,
    particles: 'high',
    ambientAudio: 'cockpit_hum',
    transition: { type: 'crossfade', durationMs: 400, easing: 'ease-out-cubic' },
  },

  labs: {
    ledColor: '#00BBFF',
    bloom: { intensity: 0.5, threshold: 0.55, smoothing: 0.85 },
    camera: { fov: 62, distortion: 0.02 },
    vignette: { darkness: 0.4, offset: 0.3 },
    // Phase 5 P.1-MAX (§6.5): HUD baseline opacity 0.18 → 0.28 for readable corner readouts
    hud: { opacity: 0.28, rotationSpeed: 0.15, pulseIntensity: 0.4, dataMode: 'minimap' },
    panels: { curvature: 0.85, opacity: 1.0 },
    sidePanels: { opacity: 0.7, leftContent: 'labNav', rightContent: 'stats' },
    statusBar: { opacity: 1.0 },
    centerScale: 1.0,
    panelOffset: 0,
    particles: 'medium',
    ambientAudio: 'cockpit_hum',
    transition: { type: 'crossfade', durationMs: 400, easing: 'ease-out-cubic' },
  },

  lab_detail: {
    ledColor: 'dynamic',
    bloom: { intensity: 0.5, threshold: 0.5, smoothing: 0.85 },
    camera: { fov: 55, distortion: 0.02 },
    vignette: { darkness: 0.5, offset: 0.3 },
    // Phase 5 P.1-MAX (§6.5): HUD baseline opacity 0.20 → 0.32 for readable corner readouts
    hud: { opacity: 0.32, rotationSpeed: 0.2, pulseIntensity: 0.5, dataMode: 'labfocus' },
    panels: { curvature: 0.85, opacity: 1.0 },
    sidePanels: { opacity: 0.5, leftContent: 'labNav', rightContent: 'stats' },
    statusBar: { opacity: 1.0 },
    centerScale: 1.0,
    panelOffset: 0,
    particles: 'high',
    ambientAudio: 'lab_specific_theme',
    transition: { type: 'crossfade', durationMs: 400, easing: 'ease-out-cubic' },
  },

  game: {
    ledColor: 'dynamic',
    bloom: { intensity: 0.3, threshold: 0.7, smoothing: 0.95 },
    camera: { fov: 72, distortion: 0.0 },
    vignette: { darkness: 0.6, offset: 0.25 },
    hud: { opacity: 0.0, rotationSpeed: 0, pulseIntensity: 0, dataMode: 'hidden' },
    panels: { curvature: 0.3, opacity: 0.4 },
    sidePanels: { opacity: 0.4, leftContent: 'radar', rightContent: 'stats' },
    statusBar: { opacity: 0.4 },
    centerScale: 1.75,
    panelOffset: 0.3,
    particles: 'low',
    ambientAudio: 'game_specific',
    transition: { type: 'mechanical_iris', durationMs: 600, easing: 'easeInOut' },
  },

  profile: {
    ledColor: '#AA66FF',
    bloom: { intensity: 0.4, threshold: 0.6, smoothing: 0.9 },
    camera: { fov: 56, distortion: 0.015 },
    vignette: { darkness: 0.5, offset: 0.3 },
    // Phase 5 P.1-MAX (§6.5): HUD baseline opacity 0.12 → 0.22 for readable corner readouts
    hud: { opacity: 0.22, rotationSpeed: 0.08, pulseIntensity: 0.2, dataMode: 'stats' },
    panels: { curvature: 0.85, opacity: 1.0 },
    sidePanels: { opacity: 0.4, leftContent: 'radar', rightContent: 'stats' },
    statusBar: { opacity: 1.0 },
    centerScale: 1.0,
    panelOffset: 0,
    particles: 'medium',
    ambientAudio: 'trophy_shimmer',
    transition: { type: 'crossfade', durationMs: 400, easing: 'ease-out-cubic' },
  },

  settings: {
    ledColor: '#FFAA44',
    bloom: { intensity: 0.35, threshold: 0.65, smoothing: 0.9 },
    camera: { fov: 56, distortion: 0.015 },
    vignette: { darkness: 0.5, offset: 0.3 },
    // Phase 5 P.1-MAX (§6.5): HUD baseline opacity 0.10 → 0.20 for readable corner readouts
    hud: { opacity: 0.20, rotationSpeed: 0.05, pulseIntensity: 0.15, dataMode: 'stats' },
    panels: { curvature: 0.85, opacity: 1.0 },
    sidePanels: { opacity: 0.4, leftContent: 'radar', rightContent: 'stats' },
    statusBar: { opacity: 1.0 },
    centerScale: 1.0,
    panelOffset: 0,
    particles: 'low',
    ambientAudio: 'subtle_clicks',
    transition: { type: 'crossfade', durationMs: 400, easing: 'ease-out-cubic' },
  },

  celebration: {
    ledColor: '#FFD700',
    bloom: { intensity: 0.8, threshold: 0.3, smoothing: 0.7 },
    camera: { fov: 62, distortion: 0.03 },
    vignette: { darkness: 0.3, offset: 0.4 },
    hud: { opacity: 0.85, rotationSpeed: 0.4, pulseIntensity: 1.0, dataMode: 'burst' },
    panels: { curvature: 0.85, opacity: 1.0 },
    sidePanels: { opacity: 0.3, leftContent: 'radar', rightContent: 'terminal' },
    statusBar: { opacity: 1.0 },
    centerScale: 1.0,
    panelOffset: 0,
    particles: 'max',
    ambientAudio: 'fanfare',
    transition: { type: 'crossfade', durationMs: 200, easing: 'easeIn' },
  },

  parent: {
    ledColor: '#FFAA44',
    bloom: { intensity: 0.3, threshold: 0.7, smoothing: 0.95 },
    camera: { fov: 54, distortion: 0.01 },
    vignette: { darkness: 0.45, offset: 0.3 },
    // Phase 5 P.1-MAX (§6.5): HUD baseline opacity 0.08 → 0.18 for readable corner readouts
    hud: { opacity: 0.18, rotationSpeed: 0.05, pulseIntensity: 0.1, dataMode: 'stats' },
    panels: { curvature: 0.6, opacity: 0.7 },
    sidePanels: { opacity: 0.3, leftContent: 'stats', rightContent: 'stats' },
    statusBar: { opacity: 0.7 },
    centerScale: 1.0,
    panelOffset: 0,
    particles: 'low',
    ambientAudio: 'cockpit_hum_subdued',
    transition: { type: 'crossfade', durationMs: 400, easing: 'ease-out-cubic' },
  },

  // Phase 2 Section 7: Merged from legacy StationMode. Uses dashboard preset as
  // a base with amber LED tint for welcoming-onboarding vibe.
  onboarding: {
    ledColor: '#FFAA44',
    bloom: { intensity: 0.35, threshold: 0.65, smoothing: 0.9 },
    camera: { fov: 52, distortion: 0.01 },
    vignette: { darkness: 0.4, offset: 0.35 },
    // Phase 5 P.1-MAX (§6.5): HUD baseline opacity 0.10 → 0.20 for readable corner readouts
    hud: { opacity: 0.20, rotationSpeed: 0.05, pulseIntensity: 0.15, dataMode: 'tutorial' },
    panels: { curvature: 0.7, opacity: 0.8 },
    sidePanels: { opacity: 0.3, leftContent: 'radar', rightContent: 'stats' },
    statusBar: { opacity: 0.6 },
    centerScale: 1.0,
    panelOffset: 0,
    particles: 'medium',
    ambientAudio: 'cockpit_hum',
    transition: { type: 'crossfade', durationMs: 400, easing: 'ease-out-cubic' },
  },

  // Phase 2 Section 7: Merged from legacy StationMode. Uses dashboard preset as
  // a base with red LED tint and slightly dimmed panels for admin/ops context.
  admin: {
    ledColor: '#FF4444',
    bloom: { intensity: 0.25, threshold: 0.75, smoothing: 0.95 },
    camera: { fov: 52, distortion: 0.0 },
    vignette: { darkness: 0.4, offset: 0.3 },
    // Phase 5 P.1-MAX (§6.5): HUD baseline opacity 0.06 → 0.16 for readable corner readouts
    hud: { opacity: 0.16, rotationSpeed: 0.03, pulseIntensity: 0.05, dataMode: 'stats' },
    panels: { curvature: 0.5, opacity: 0.9 },
    sidePanels: { opacity: 0.2, leftContent: 'terminal', rightContent: 'stats' },
    statusBar: { opacity: 0.5 },
    centerScale: 1.0,
    panelOffset: 0,
    particles: 'low',
    ambientAudio: 'cockpit_hum_subdued',
    transition: { type: 'crossfade', durationMs: 400, easing: 'ease-out-cubic' },
  },
} as const;

// ■■ Variable Dial Cluster — per-page dial labels ■■
export const DIAL_CONFIGS: Record<CockpitMode, [string, string, string]> = {
  dashboard:  ['XP Rate', 'Streak Days', 'Lab Progress %'],
  arcade:     ['Games Played', 'Top Score', 'Favorites'],
  labs:       ['Completion %', 'Games Played', 'Quiz Average %'],
  lab_detail: ['Completion %', 'Games Played', 'Quiz Average %'],
  game:       ['Difficulty', 'Game Count', 'Time Played'],
  profile:    ['Total XP', 'Level', 'Badges Earned'],
  settings:   ['Volume %', 'Brightness %', 'Particles %'],
  celebration:['Total XP', 'Level', 'Badges Earned'],
  parent:     ['Screen Time', 'XP Today', 'Games Played'],
  onboarding: ['Progress %', 'Step', 'Time'],
  admin:      ['Queue', 'Pending', 'Approved'],
};

// ■■ Route → Mode mapping ■■
// Used by useCockpitScene to auto-detect mode from pathname
export function routeToCockpitMode(pathname: string): CockpitMode {
  if (pathname.startsWith('/arcade/') && pathname.split('/').length > 2) return 'game';
  if (pathname.startsWith('/labs/') && pathname.split('/').length > 2) return 'lab_detail';
  if (pathname === '/arcade') return 'arcade';
  if (pathname === '/labs') return 'labs';
  if (pathname === '/profile') return 'profile';
  if (pathname === '/settings') return 'settings';
  if (pathname === '/parent') return 'parent';
  if (pathname.startsWith('/onboarding')) return 'onboarding';
  if (pathname.startsWith('/admin')) return 'admin';
  // /home falls through to dashboard mode
  return 'dashboard';
}
