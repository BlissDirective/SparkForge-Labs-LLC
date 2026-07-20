// ════════════════════════════════════════════════════════════════
// FEATURE FLAGS — SparkForge UI/UX Redesign (Phase 1)
// ════════════════════════════════════════════════════════════════
// These flags allow safe toggling between the old 3D cockpit UI
// and the new HTML-first redesign. All flags default to TRUE in
// development and can be overridden via environment variables.
//
// To rollback: set any flag to 'false' and redeploy.
// No code changes needed for instant rollback.

const isDev = process.env.NODE_ENV === 'development';

function flag(key: string, defaultValue: boolean): boolean {
  const env = process.env[`NEXT_PUBLIC_${key}`];
  if (env === 'true') return true;
  if (env === 'false') return false;
  return defaultValue;
}

export const FEATURE_FLAGS = {
  /** Use the new HTML-first dashboard (replaces 3D cockpit) */
  USE_HTML_DASHBOARD: flag('USE_HTML_DASHBOARD', isDev),

  /** Use the new HTML game shell (replaces 3D GameShell wrapper) */
  USE_HTML_GAME_SHELL: flag('USE_HTML_GAME_SHELL', isDev),

  /** Use the new marketing landing page (replaces 3D BrandHero3D) */
  USE_HTML_LANDING: flag('USE_HTML_LANDING', isDev),

  /** Use the new design system (colors, typography, spacing tokens) */
  USE_NEW_DESIGN_SYSTEM: flag('USE_NEW_DESIGN_SYSTEM', isDev),

  /** Enable new animations (React Bits, Framer Motion) */
  USE_NEW_ANIMATIONS: flag('USE_NEW_ANIMATIONS', isDev),

  /** Enable FloatingLines on landing page hero */
  USE_FLOATING_LINES_HERO: flag('USE_FLOATING_LINES_HERO', isDev),

  /** Use React Bits components throughout the app */
  USE_REACT_BITS: flag('USE_REACT_BITS', isDev),

  /* ── DIGITAL FORGE RETHEME (Concept 10 — docs/concepts/10-digital-forge-build-plan.md) ──
     Sub-surface flags AND with FORGE_THEME at their call sites: forge
     surfaces never render against the light theme. */
  /** Master token flip: <html data-theme="forge"> (F1) */
  FORGE_THEME: flag('FORGE_THEME', isDev),
  /** Forge Chamber game shell restyle (F2) */
  FORGE_CHAMBER: flag('FORGE_CHAMBER', isDev),
  /** Forge Complete ceremony overlay (F3) */
  FORGE_CEREMONY: flag('FORGE_CEREMONY', isDev),
  /** Dashboard Workbench layout + home (F4) */
  FORGE_DASHBOARD: flag('FORGE_DASHBOARD', isDev),
  /** Forge Ring lab selection (F5) */
  FORGE_RING: flag('FORGE_RING', isDev),
  /** Cinematic marketing hero (F6) */
  FORGE_HERO: flag('FORGE_HERO', isDev),
  /** ForgeSpark mascot replaces Sparky visuals (F7) */
  FORGE_MASCOT: flag('FORGE_MASCOT', isDev),
  /** Canvas/particle ambience layers — global kill-switch */
  FORGE_AMBIENCE: flag('FORGE_AMBIENCE', isDev),
  /** Core Ignition game #43 visible in arcade (F8) */
  GAME_CORE_IGNITION: flag('GAME_CORE_IGNITION', isDev),
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/** Check if a feature flag is enabled */
export function isEnabled(key: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[key];
}

/** Check if ALL flags are enabled (full redesign mode) */
export function isFullRedesign(): boolean {
  return Object.values(FEATURE_FLAGS).every(Boolean);
}

/** Check if ANY flag is enabled (partial redesign) */
export function isPartialRedesign(): boolean {
  return Object.values(FEATURE_FLAGS).some(Boolean);
}
