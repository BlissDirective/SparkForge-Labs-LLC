// ================================================================
// Cockpit Panoramic Architecture — Central Config (CPA v2.0)
// ================================================================
// Consolidates: CPA v1.0 + Enhancement 1.1 + Enhancement 1.2
// Single source of truth — consumed by CockpitCanvas, CockpitPanels,
// HolographicHUD, SidePanels, StatusBar3D, BarrelDistortion,
// CeremonyFX, WormholeTransition, and all cockpit 3D components.
//
// Decisions: CPA-1 through CPA-12, CPA2-1 through CPA2-12

// ■■ Cockpit Geometry Constants (v2.0 — adaptive curvature) ■■
export const COCKPIT_GEOMETRY = {
  // Base values (adapted by useAdaptiveCockpit)
  panelCurvature: 0.85,
  totalWrapArc: 140,            // degrees, overridden by adaptive
  panelRadius: 4.0,             // overridden by adaptive
  centralViewportWidth: 0.56,
  sidesPanelWidth: 0.12,
  topBarHeight: 0.10,
  consoleDeskHeight: 0.15,
  statusBarHeight: 0.05,
  hexRadius: 0.35,
  hexDepth: 0.02,

  // NEW in v2
  hexDataTextureSize: 64,       // px, for lab number / indicator textures
  panelEdgeBevel: 0.005,        // subtle edge chamfer
  topBarSegments: 256,          // 20M upgrade: ultra-smooth curves (was 48)
  sideSegments: 128,            // 20M upgrade: high-poly side panels (was 24)

  // 20M Cockpit Upgrade — structural detail constants
  rivetSpacing: 0.15,           // spacing between instanced rivets
  cableBundleCount: 50,         // TubeGeometry cable splines
  ventPanelCount: 12,           // ventilation grate panels
  floorGrateResolution: 64,     // grid resolution for floor panels
} as const;

// ■■ Viewport-Adaptive Curvature Thresholds (CPA2-2) ■■
export const ADAPTIVE_CURVATURE = {
  ultraWide: { minWidth: 1920, arc: 155, radius: 4.2 },
  desktop:   { minWidth: 1440, arc: 140, radius: 4.0 },
  tablet:    { minWidth: 1024, arc: 120, radius: 3.6 },
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

// ■■ Cockpit LOD Levels (CPA2-12 — upgraded for 20M budget) ■■
export const COCKPIT_LOD = {
  ultra: {
    panelSegments: 256,        // increased from 48 for glass-smooth curves
    sideSegments: 128,         // increased from 24 for high-poly side panels
    hexDetail: true,
    hexSubPanels: true,        // NEW: recessed instrument clusters inside hexes
    hudRingSegments: 128,      // increased from 64 for seamless ring geometry
    hudRingCount: 8,           // NEW: 8 concentric rings (was 3)
    scanLines: 24,             // increased from 12 for volumetric beams
    barrelDistortion: true,
    reflections: true,
    structuralDetail: true,    // NEW: cables, conduits, vents
    volumetricFog: true,       // NEW: fog volumes + god rays
    floorDetail: true,         // NEW: grated floor panels
    npcFingers: true,          // NEW: articulated finger geometry
    npcFacialAnim: true,       // NEW: visor expression geometry
  },
  high: {
    panelSegments: 128,        // increased from 32
    sideSegments: 64,          // increased from 16
    hexDetail: true,
    hexSubPanels: true,
    hudRingSegments: 64,       // increased from 48
    hudRingCount: 6,           // reduced from 8
    scanLines: 16,             // increased from 12
    barrelDistortion: true,
    reflections: true,
    structuralDetail: true,
    volumetricFog: true,
    floorDetail: true,
    npcFingers: false,
    npcFacialAnim: true,
  },
  medium: {
    panelSegments: 64,         // increased from 24
    sideSegments: 32,          // increased from 12
    hexDetail: false,          // Hex clusters simplified to circles
    hexSubPanels: false,
    hudRingSegments: 32,
    hudRingCount: 4,
    scanLines: 8,
    barrelDistortion: false,
    reflections: false,
    structuralDetail: false,
    volumetricFog: false,
    floorDetail: false,
    npcFingers: false,
    npcFacialAnim: false,
  },
  low: {
    panelSegments: 32,         // increased from 16
    sideSegments: 16,          // increased from 8
    hexDetail: false,
    hexSubPanels: false,
    hudRingSegments: 16,
    hudRingCount: 3,
    scanLines: 6,
    barrelDistortion: false,
    reflections: false,
    structuralDetail: false,
    volumetricFog: false,
    floorDetail: false,
    npcFingers: false,
    npcFacialAnim: false,
  },
} as const;

// ■■ Triangle Budget Breakdown (20M Cockpit Upgrade — March 20, 2026) ■■
// Total: 20M desktop / 10M tablet / 0 mobile (CSS fallback)
export const TRIANGLE_BUDGET_V2 = {
  cockpitShell: {
    cockpitPanels:      { desktop: 2_000_000,  tablet: 1_000_000, mobile: 0 },
    ledRim:             { desktop: 200_000,    tablet: 100_000,   mobile: 0 },
    sidePanels:         { desktop: 1_500_000,  tablet: 750_000,   mobile: 0 },
    holographicHUD:     { desktop: 500_000,    tablet: 250_000,   mobile: 0 },
    statusBar3D:        { desktop: 500_000,    tablet: 250_000,   mobile: 0 },
    auroraBackground:   { desktop: 50_000,     tablet: 25_000,    mobile: 0 },
    ambientParticles:   { desktop: 200_000,    tablet: 100_000,   mobile: 0 },
    // Shell subtotal: 4,950,000 desktop / 2,475,000 tablet
  },
  spatialContent: {
    holographicLabMap:   { desktop: 1_000_000, tablet: 500_000,   mobile: 0 },
    labStructures:       { desktop: 3_000_000, tablet: 1_500_000, mobile: 0 },
    interactiveConsoles: { desktop: 2_000_000, tablet: 1_000_000, mobile: 0 },
    ambientNPCs:         { desktop: 1_500_000, tablet: 750_000,   mobile: 0 },
    dynamicEnvironment:  { desktop: 3_000_000, tablet: 1_500_000, mobile: 0 },
    starsSkybox:         { desktop: 500_000,   tablet: 250_000,   mobile: 0 },
    // Spatial subtotal: 11,000,000 desktop / 5,500,000 tablet
  },
  newComponents: {
    cockpitStructuralDetail: { desktop: 1_500_000, tablet: 750_000,  mobile: 0 },
    volumetricFog:           { desktop: 500_000,   tablet: 250_000,  mobile: 0 },
    cockpitFloor:            { desktop: 500_000,   tablet: 250_000,  mobile: 0 },
    ceremonyFX:              { desktop: 500_000,   tablet: 250_000,  mobile: 0 },
    wormholeTransition:      { desktop: 300_000,   tablet: 150_000,  mobile: 0 },
    miniMapOverlay:          { desktop: 250_000,   tablet: 125_000,  mobile: 0 },
    // New subtotal: 3,550,000 desktop / 1,775,000 tablet
  },
  dynamicHeadroom: { desktop: 500_000, tablet: 250_000, mobile: 0 },
  // Grand total: 20,000,000 desktop / 10,000,000 tablet
} as const;

// ■■ Adaptive FPS Degradation Thresholds ■■
export const FPS_DEGRADATION = {
  full:           { min: 0.9,  action: 'Full quality' },
  reduceParticle: { min: 0.8,  action: 'Reduce particle counts by 30%' },
  dropLOD:        { min: 0.6,  action: 'Drop to next LOD level, disable BarrelDistortion' },
  disableHUD:     { min: 0.4,  action: 'Disable HolographicHUD, reduce NPC count by half' },
  cssFallback:    { min: 0.0,  action: 'Disable all cockpit 3D, fall back to CSS frame' },
} as const;

// ■■ Progressive Enhancement Thresholds (CPA2-9) ■■
export const COCKPIT_FEATURE_THRESHOLDS = {
  fullCockpit3D:    { minWidth: 1024, minGPU: 'medium' as const },
  reducedCockpit3D: { minWidth: 768,  minGPU: 'low' as const },
  cssOnly:          { minWidth: 0,    minGPU: 'any' as const },
} as const;

// ■■ Type exports for consumers ■■
export type StationModeKey = keyof typeof BLOOM_PRESETS;
export type SidePanelContent = 'radar' | 'labNav' | 'terminal' | 'stats';
export type HUDDataMode = 'minimap' | 'labfocus' | 'hidden' | 'burst' | 'stats' | 'tutorial';
