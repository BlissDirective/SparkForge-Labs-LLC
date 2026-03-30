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

  // v3: HUD position
  hudPosition: [0, 2.05, -3.4] as const,
  hudRotation: [-0.55, 0, 0] as const,
} as const;

// ■■ Viewport-Adaptive Curvature Thresholds (CPA2-2) ■■
// v3: Adaptive curvature updated for wider hull
export const ADAPTIVE_CURVATURE = {
  ultraWide: { minWidth: 1920, arc: 230, radius: 5.0 },
  desktop:   { minWidth: 1440, arc: 218, radius: 4.8 },
  tablet:    { minWidth: 1024, arc: 180, radius: 4.2 },
  cssFallback: { minWidth: 0, arc: 0, radius: 0 },
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
  parent:        { intensity: 0.3, threshold: 0.7, smoothing: 0.95 },
  admin:         { intensity: 0.25, threshold: 0.75, smoothing: 0.95 },
} as const;

// ■■ Camera Presets — FOV + Barrel Distortion (v3: tight-focus cockpit seat) ■■
export const CAMERA_PRESETS = {
  dashboard:   { fov: 58, distortion: 0.025 },    // v3: wider FOV for immersion
  labmap:      { fov: 62, distortion: 0.02 },     // v3: widest for spatial map
  lab:         { fov: 55, distortion: 0.02 },
  game:        { fov: 52, distortion: 0.0 },
  celebration: { fov: 62, distortion: 0.03 },     // v3: dramatic wide during celebrations
  profile:     { fov: 56, distortion: 0.015 },    // v3: right console focus
  settings:    { fov: 56, distortion: 0.015 },    // v3: left console focus
  onboarding:  { fov: 52, distortion: 0.01 },
  parent:      { fov: 54, distortion: 0.01 },
  admin:       { fov: 52, distortion: 0.0 },
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
  parent:      { darkness: 0.45, offset: 0.3 },
  admin:       { darkness: 0.4, offset: 0.3 },
} as const;

// ■■ HUD Presets v2 — Data-Driven Holographic HUD (CPA2-3) ■■
export const HUD_PRESETS = {
  dashboard:     { opacity: 0.15, rotationSpeed: 0.1,  pulseIntensity: 0.3, dataMode: 'minimap' as const },
  labmap:        { opacity: 0.18, rotationSpeed: 0.15, pulseIntensity: 0.4, dataMode: 'minimap' as const },
  lab:           { opacity: 0.20, rotationSpeed: 0.2,  pulseIntensity: 0.5, dataMode: 'labfocus' as const },
  game:          { opacity: 0.0,  rotationSpeed: 0,    pulseIntensity: 0,   dataMode: 'hidden' as const },
  celebration:   { opacity: 0.85, rotationSpeed: 0.4,  pulseIntensity: 1.0, dataMode: 'burst' as const },
  gameComplete:  { opacity: 1.0,  rotationSpeed: 0.5,  pulseIntensity: 1.0, dataMode: 'burst' as const },
  profile:       { opacity: 0.12, rotationSpeed: 0.08, pulseIntensity: 0.2, dataMode: 'stats' as const },
  onboarding:    { opacity: 0.10, rotationSpeed: 0.05, pulseIntensity: 0.15, dataMode: 'tutorial' as const },
  parent:        { opacity: 0.08, rotationSpeed: 0.05, pulseIntensity: 0.1,  dataMode: 'stats' as const },
  admin:         { opacity: 0.06, rotationSpeed: 0.03, pulseIntensity: 0.05, dataMode: 'stats' as const },
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
  parent:      { opacity: 0.3, leftContent: 'stats' as const, rightContent: 'stats' as const },
  admin:       { opacity: 0.2, leftContent: 'terminal' as const, rightContent: 'stats' as const },
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
  parent:      0.6,
  admin:       0.5,
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
  parent:      0.7,
  admin:       0.6,
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
  parent:      { opacity: 0.7 },
  admin:       { opacity: 0.5 },
} as const;

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
export const CEREMONY_INTENSITY = {
  xp:              { bloomPeak: 0.6, particleCount: 50,  hudExpansion: 1.1, duration: 1500 },
  badge:           { bloomPeak: 0.8, particleCount: 100, hudExpansion: 1.3, duration: 2000 },
  levelUp:         { bloomPeak: 1.0, particleCount: 200, hudExpansion: 1.5, duration: 3000 },
  gameComplete:    { bloomPeak: 0.9, particleCount: 150, hudExpansion: 1.4, duration: 2500 },
  streakMilestone: { bloomPeak: 0.7, particleCount: 80,  hudExpansion: 1.2, duration: 2000 },
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
    ambientParticles:   200_000,
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
export type StationModeKey = keyof typeof BLOOM_PRESETS;
export type SidePanelContent = 'radar' | 'labNav' | 'terminal' | 'stats';
export type HUDDataMode = 'minimap' | 'labfocus' | 'hidden' | 'burst' | 'stats' | 'tutorial';
