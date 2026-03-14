// ================================================================
// Cockpit Panoramic Architecture — Central Config
// ================================================================
// CPA v1.0: All geometry, bloom, camera, vignette, HUD, and
// mode-dependent parameters for the curved cockpit dashboard.
// Single source of truth — consumed by StationFrame, useStationMode,
// CockpitPanels, HolographicHUD, SidePanels, StatusBar3D, BarrelDistortion.
//
// Decisions: CPA-1 through CPA-12

// ■■ Cockpit Geometry Constants ■■
export const COCKPIT_GEOMETRY = {
  panelCurvature: 0.85,
  totalWrapArc: 140,          // degrees
  panelRadius: 4.0,           // distance from camera
  centralViewportWidth: 0.56,
  sidesPanelWidth: 0.12,
  topBarHeight: 0.10,
  consoleDeskHeight: 0.15,
  statusBarHeight: 0.05,
  hexRadius: 0.35,            // individual hex panel radius
  hexDepth: 0.02,             // extrusion depth
} as const;

// ■■ Bloom Presets — Mode-Dependent (CPA-7) ■■
export const BLOOM_PRESETS = {
  dashboard:     { intensity: 0.4, threshold: 0.6, smoothing: 0.9 },
  labmap:        { intensity: 0.5, threshold: 0.55, smoothing: 0.85 },
  lab:           { intensity: 0.5, threshold: 0.5, smoothing: 0.85 },
  game:          { intensity: 0.3, threshold: 0.7, smoothing: 0.95 },
  celebration:   { intensity: 0.8, threshold: 0.3, smoothing: 0.7 },
  gameComplete:  { intensity: 1.0, threshold: 0.2, smoothing: 0.6 },
  profile:       { intensity: 0.4, threshold: 0.6, smoothing: 0.9 },
  onboarding:    { intensity: 0.35, threshold: 0.65, smoothing: 0.9 },
} as const;

// ■■ Camera Presets — FOV + Barrel Distortion (CPA-9, CPA-10) ■■
export const CAMERA_PRESETS = {
  dashboard:   { fov: 56, distortion: 0.02 },
  labmap:      { fov: 58, distortion: 0.02 },
  lab:         { fov: 55, distortion: 0.015 },
  game:        { fov: 52, distortion: 0.0 },
  celebration: { fov: 58, distortion: 0.025 },
  profile:     { fov: 54, distortion: 0.01 },
  onboarding:  { fov: 52, distortion: 0.01 },
} as const;

// ■■ Vignette Presets — R3F Postprocessing (CPA-8) ■■
export const VIGNETTE_PRESETS = {
  dashboard:   { darkness: 0.5, offset: 0.3 },
  labmap:      { darkness: 0.4, offset: 0.3 },
  lab:         { darkness: 0.5, offset: 0.3 },
  game:        { darkness: 0.6, offset: 0.25 },
  celebration: { darkness: 0.3, offset: 0.4 },
  profile:     { darkness: 0.5, offset: 0.3 },
  onboarding:  { darkness: 0.4, offset: 0.35 },
} as const;

// ■■ HUD Presets — Holographic HUD (CPA-4, CPA-5) ■■
export const HUD_PRESETS = {
  dashboard:   { opacity: 0.12, rotationSpeed: 0.1, pulseIntensity: 0.3 },
  labmap:      { opacity: 0.15, rotationSpeed: 0.15, pulseIntensity: 0.4 },
  lab:         { opacity: 0.18, rotationSpeed: 0.2, pulseIntensity: 0.5 },
  game:        { opacity: 0.0, rotationSpeed: 0, pulseIntensity: 0 },
  celebration: { opacity: 0.85, rotationSpeed: 0.4, pulseIntensity: 1.0 },
  profile:     { opacity: 0.10, rotationSpeed: 0.08, pulseIntensity: 0.2 },
  onboarding:  { opacity: 0.08, rotationSpeed: 0.05, pulseIntensity: 0.15 },
} as const;

// ■■ Side Panel Presets (CPA-6) ■■
export const SIDE_PANEL_PRESETS = {
  dashboard:   { opacity: 0.6, leftContent: 'radar' as const, rightContent: 'stats' as const },
  labmap:      { opacity: 0.7, leftContent: 'labNav' as const, rightContent: 'stats' as const },
  lab:         { opacity: 0.5, leftContent: 'labNav' as const, rightContent: 'stats' as const },
  game:        { opacity: 0.0, leftContent: 'radar' as const, rightContent: 'stats' as const },
  celebration: { opacity: 0.3, leftContent: 'radar' as const, rightContent: 'terminal' as const },
  profile:     { opacity: 0.4, leftContent: 'radar' as const, rightContent: 'stats' as const },
  onboarding:  { opacity: 0.3, leftContent: 'radar' as const, rightContent: 'stats' as const },
} as const;

// ■■ Panel Curvature per Mode ■■
export const PANEL_CURVATURE_PRESETS = {
  dashboard:   0.85,
  labmap:      0.85,
  lab:         0.85,
  game:        0.3,     // Retracted during games (Decision 3.4)
  celebration: 0.85,
  profile:     0.85,
  onboarding:  0.7,
} as const;

// ■■ Panel Opacity per Mode ■■
export const PANEL_OPACITY_PRESETS = {
  dashboard:   1.0,
  labmap:      1.0,
  lab:         1.0,
  game:        0.2,     // Dimmed during games
  celebration: 1.0,
  profile:     1.0,
  onboarding:  0.8,
} as const;

// ■■ Status Bar Opacity per Mode ■■
export const STATUS_BAR_PRESETS = {
  dashboard:   { opacity: 1.0 },
  labmap:      { opacity: 1.0 },
  lab:         { opacity: 1.0 },
  game:        { opacity: 0.15 },  // Minimal, non-distracting
  celebration: { opacity: 1.0 },
  profile:     { opacity: 1.0 },
  onboarding:  { opacity: 0.6 },
} as const;

// ■■ Triangle Budget (CPA-11) ■■
export const TRIANGLE_BUDGET = {
  cockpitPanels: 8000,
  hexSubPanels: 2000,
  holographicHUD: 4000,
  sidePanels: 3000,
  statusBar: 2500,
  ledRim: 1500,
  spatialMap: 25000,
  labStructures: 25000,    // 10 × 2500
  consoles: 6000,          // 4 × 1500
  npcs: 4000,              // 8 × 500
  dynamicParticles: 15000,
  ambientParticles: 5000,
  contactShadows: 2000,
  total: 103000,
} as const;

// ■■ Type exports for consumers ■■
export type StationModeKey = keyof typeof BLOOM_PRESETS;
export type SidePanelContent = 'radar' | 'labNav' | 'terminal' | 'stats';
