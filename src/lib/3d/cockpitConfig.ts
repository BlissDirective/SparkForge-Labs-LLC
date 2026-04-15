// ================================================================
// Cockpit Panoramic Architecture — Central Config (CPA v2.0)
// ================================================================
// Consolidates: CPA v1.0 + Enhancement 1.1 + Enhancement 1.2
// Single source of truth — consumed by CockpitCanvas, CockpitPanels,
// HolographicHUD, SidePanels, StatusBar3D, BarrelDistortion,
// CeremonyFX, WormholeTransition, and all cockpit 3D components.
//
// Decisions: CPA-1 through CPA-12, CPA2-1 through CPA2-12

// ■■ Cockpit Geometry Constants (v3.0 — 3D-Embedded UI, tight-focus) ■■
// Enhanced from v2.0: wider arc (218° from 140°), larger radius (4.8 from 4.0),
// tighter side console positions, per cockpit-architecture.json vision spec.
export const COCKPIT_GEOMETRY = {
  // Base values (adapted by useAdaptiveCockpit)
  panelCurvature: 0.85,
  totalWrapArc: 218,            // degrees — extreme panoramic wrap (was 140)
  panelRadius: 4.8,             // larger radius for immersive wrap (was 4.0)
  centralViewportWidth: 0.56,
  sidesPanelWidth: 0.12,
  topBarHeight: 0.10,
  consoleDeskHeight: 0.15,
  statusBarHeight: 0.05,
  hexRadius: 0.35,
  hexDepth: 0.02,

  // v2 → v3 enhanced
  hexDataTextureSize: 64,       // px, for lab number / indicator textures
  panelEdgeBevel: 0.005,        // subtle edge chamfer
  topBarSegments: 288,          // v3: denser for wider arc (was 256)
  sideSegments: 144,            // v3: denser for wider arc (was 128)

  // Structural detail constants (upgraded for 38M cockpit budget)
  rivetSpacing: 0.12,           // tighter rivets for closer camera (was 0.15)
  cableBundleCount: 60,         // more cables visible at tight focus (was 50)
  ventPanelCount: 16,           // more vent panels across wider arc (was 12)
  floorGrateResolution: 80,     // higher res floor (was 64)

  // v3: Side console positions (pulled closer per vision JSON)
  leftConsolePosition: [-2.35, 0.25, -1.65] as const,
  leftConsoleRotation: [0, 0.85, 0] as const,
  rightConsolePosition: [2.35, 0.25, -1.65] as const,
  rightConsoleRotation: [0, -0.85, 0] as const,

  // v3: Status bar position (explicit 3D placement)
  statusBarPosition: [0, -1.25, -1.95] as const,
  statusBarRotation: [0.38, 0, 0] as const,

  // v3: Center viewport screen (spherical panoramic mesh)
  centerViewportRadius: 3.9,
  centerViewportPosition: [0, 0.35, -3.3] as const,

  // HUD position: Now defined locally in HolographicHUD.tsx as FRAME_ARCS
  // (Decision 6.0: repositioned from overhead rings to peripheral viewport frame)
} as const;

// ■■ Panel Safe Zone Boundaries (COCK-06) ■■
// Side panels at [±2.35, 0.25, -1.65] with rotation ±0.85rad work because
// the inward rotation compensates for the X offset beyond the FOV 58 frustum
// width (~2.8 units at Z=-1.65). The panel face projects back within the
// viewport after rotation. These safe zone limits prevent future position
// changes from creating panel-to-panel intersection or frustum clipping.
export const PANEL_SAFE_ZONE = {
  /** Maximum absolute X for side panels before frustum clipping occurs */
  maxAbsX: 2.6,
  /** Minimum absolute X to prevent side panels overlapping center content */
  minAbsX: 1.8,
  /** Maximum Z (closest to camera) before side panels occlude center viewport */
  maxZ: -1.2,
  /** Minimum Z (farthest) before side panels become too small to read */
  minZ: -2.5,
  /** Y range for side panels */
  minY: -0.5,
  maxY: 1.0,
  /** Center panel Z at 1.75x scale extends to ~Z=-1.89; side panels must stay behind */
  gameModeMinZ: -1.9,
} as const;

/** Validate and clamp a panel position within safe zone boundaries.
 *  Returns clamped [x, y, z] tuple. Logs warning in dev if clamping occurs. */
export function clampPanelPosition(
  pos: readonly [number, number, number],
  side: 'left' | 'right' | 'center'
): [number, number, number] {
  let [x, y, z] = pos;
  const sz = PANEL_SAFE_ZONE;

  if (side === 'left' || side === 'right') {
    const absX = Math.abs(x);
    const clampedAbsX = Math.max(sz.minAbsX, Math.min(sz.maxAbsX, absX));
    x = side === 'left' ? -clampedAbsX : clampedAbsX;
    y = Math.max(sz.minY, Math.min(sz.maxY, y));
    z = Math.max(sz.minZ, Math.min(sz.maxZ, z));
  }

  if (process.env.NODE_ENV === 'development') {
    const [ox, oy, oz] = pos;
    if (x !== ox || y !== oy || z !== oz) {
      console.warn(
        `[cockpitConfig] Panel position clamped: [${ox},${oy},${oz}] → [${x},${y},${z}] (${side})`
      );
    }
  }

  return [x, y, z];
}

// ■■ Viewport-Adaptive Curvature Thresholds (CPA2-2) ■■
// v3: Adaptive curvature updated for wider hull
// D3D-1: tablet/cssFallback removed — desktop-only platform
export const ADAPTIVE_CURVATURE = {
  ultraWide: { minWidth: 1920, arc: 230, radius: 5.0 },
  desktop:   { minWidth: 1440, arc: 218, radius: 4.8 },
} as const;

// ──────────────────────────────────────────────────────────────────
// Phase 5 §6.3 / O.3-MAX: 8 fragmented mode preset objects REMOVED
// ──────────────────────────────────────────────────────────────────
// Previously this file exported BLOOM_PRESETS, CAMERA_PRESETS,
// VIGNETTE_PRESETS, HUD_PRESETS, SIDE_PANEL_PRESETS,
// PANEL_CURVATURE_PRESETS, PANEL_OPACITY_PRESETS, STATUS_BAR_PRESETS —
// a parallel fragmented configuration that duplicated COCKPIT_MODE_PRESETS
// in cockpitModePresets.ts. They have been removed in favor of the
// unified preset dictionary. The game-mode camera FOV conflict
// (52 here vs 72 in cockpitModePresets) is resolved — 72 was the
// value actually rendered via useCockpitScene.
//
// If you need mode-dependent atmospherics, import COCKPIT_MODE_PRESETS
// from '@/lib/3d/cockpitModePresets' — it's the single source of truth.
// ──────────────────────────────────────────────────────────────────

// ■■ Skin-Reactive Panel Materials (CPA2-5) ■■
export const SKIN_PANEL_TINTS: Record<string, {
  panelTint: string;
  hexGlow: string;
  chromeReflection: string;
}> = {
  default:    { panelTint: '#1a1e2e', hexGlow: 'lab',     chromeReflection: 'frost-prismatic' },
  cyberpunk:  { panelTint: '#2a0030', hexGlow: '#FF00FF', chromeReflection: 'neon-grid' },
  space:      { panelTint: '#0a0a1e', hexGlow: '#4444FF', chromeReflection: 'starfield' },
  underwater: { panelTint: '#0a1a2e', hexGlow: '#00BBFF', chromeReflection: 'caustic' },
  crystal:    { panelTint: '#1a0828', hexGlow: '#AA66FF', chromeReflection: 'prismatic' },
};

// ■■ Console Frame Styles per Skin (CPA2-11) ■■
export const CONSOLE_FRAME_STYLES: Record<string, {
  material: string;
  edgeGlow: boolean;
  transmission: number;
  bracketStyle: string;
}> = {
  default:    { material: 'chrome',     edgeGlow: true,  transmission: 0.4, bracketStyle: 'angular' },
  cyberpunk:  { material: 'darkChrome', edgeGlow: true,  transmission: 0.3, bracketStyle: 'neon' },
  space:      { material: 'titanium',   edgeGlow: false, transmission: 0.5, bracketStyle: 'minimal' },
  underwater: { material: 'copper',     edgeGlow: true,  transmission: 0.6, bracketStyle: 'organic' },
  crystal:    { material: 'glass',      edgeGlow: true,  transmission: 0.8, bracketStyle: 'faceted' },
};

// ■■ Mode Transition Durations (CPA2-6) ■■
export const MODE_TRANSITIONS = {
  'dashboard→lab':        { duration: 800, easing: 'spring(300, 25)' },
  'lab→game':             { duration: 600, easing: 'easeInOut' },
  'game→lab':             { duration: 400, easing: 'easeOut' },
  'lab→dashboard':        { duration: 800, easing: 'spring(300, 25)' },
  'any→celebration':      { duration: 200, easing: 'easeIn' },
  'celebration→previous': { duration: 1200, easing: 'easeOut' },
} as const;

// ■■ Ceremony FX Intensity per Type (CPA2-10) ■■
// Keys aligned with CelebrationType from @/types (Phase 1 audit fix: Section 3.2)
// Legacy CeremonyType mapping: levelUp→level, streakMilestone→streak, gameComplete→confetti
import type { CelebrationType } from '@/types';

export const CEREMONY_INTENSITY: Record<CelebrationType, { bloomPeak: number; particleCount: number; hudExpansion: number; duration: number }> = {
  xp:       { bloomPeak: 0.6, particleCount: 50,  hudExpansion: 1.1, duration: 1500 },
  badge:    { bloomPeak: 0.8, particleCount: 100, hudExpansion: 1.3, duration: 2000 },
  level:    { bloomPeak: 1.0, particleCount: 200, hudExpansion: 1.5, duration: 3000 },
  confetti: { bloomPeak: 0.9, particleCount: 150, hudExpansion: 1.4, duration: 2500 },
  streak:   { bloomPeak: 0.7, particleCount: 80,  hudExpansion: 1.2, duration: 2000 },
} as const;

// AUDIT-A6: COCKPIT_LOD removed per D3D-2 (no LOD system — all geometry at max quality)
// Desktop-ultra always uses maximum detail settings:
export const COCKPIT_DETAIL = {
  panelSegments: 256,
  sideSegments: 128,
  hexDetail: true,
  hexSubPanels: true,
  hudRingSegments: 128,
  hudRingCount: 8,
  scanLines: 24,
  barrelDistortion: true,
  reflections: true,
  structuralDetail: true,
  volumetricFog: true,
  floorDetail: true,
  npcFingers: true,
  npcFacialAnim: true,
} as const;

// AUDIT-A6: Triangle Budget — D3D-1 desktop-only (tablet/mobile columns removed)
// Total: 30M system (cockpit) per CLAUDE.md Section 9
export const TRIANGLE_BUDGET_V2 = {
  cockpitShell: {
    cockpitPanels:      4_000_000,
    ledRim:             500_000,
    sidePanels:         3_000_000,
    holographicHUD:     1_000_000,
    statusBar3D:        1_000_000,
    auroraBackground:   50_000,
    // ambientParticles removed (Decision 20.0)
  },
  spatialContent: {
    holographicLabMap:   1_000_000,
    labStructures:       3_000_000,
    interactiveConsoles: 3_000_000,
    ambientNPCs:         2_000_000,
    dynamicEnvironment:  3_000_000,
    starsSkybox:         500_000,
  },
  newComponents: {
    cockpitStructuralDetail: 2_000_000,
    volumetricFog:           500_000,
    cockpitFloor:            1_000_000,
    ceremonyFX:              500_000,
    wormholeTransition:      300_000,
    miniMapOverlay:          250_000,
  },
  uiComponents: {
    holographicButtons:      5_000_000,
    navigationButtonGrid:    1_000_000,
    variableDialCluster:     1_500_000,
    centerViewportScreen:    3_000_000,
  },
  dynamicHeadroom:           500_000,
  // Grand total: ~37,800,000 (within 50M system budget)
} as const;

// AUDIT-A6: FPS_DEGRADATION and COCKPIT_FEATURE_THRESHOLDS removed per D3D-5 / D3D-1
// All effects always-on (D3D-5). Desktop-only, no CSS fallback (D3D-1).
// Plan B1 (useFrameTimeMonitor) handles dev-only performance logging without degradation.

// ■■ Type exports for consumers ■■
// Phase 2 Section 7: StationModeKey is now a backward-compat alias.
// Phase 5 §6.3: StationModeKey now derived from CockpitMode + the
// transient 'gameComplete' state that was in the deleted presets but
// isn't a navigable mode in COCKPIT_MODE_PRESETS.
// New code should use CockpitMode from @/lib/3d/cockpitModePresets.
export type StationModeKey =
  | 'dashboard'
  | 'arcade'
  | 'labs'
  | 'lab_detail'
  | 'game'
  | 'celebration'
  | 'gameComplete'
  | 'profile'
  | 'settings'
  | 'onboarding'
  | 'parent'
  | 'admin';
export type SidePanelContent = 'radar' | 'labNav' | 'terminal' | 'stats';
export type HUDDataMode = 'minimap' | 'labfocus' | 'hidden' | 'burst' | 'stats' | 'tutorial';
