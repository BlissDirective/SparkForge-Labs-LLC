// ════════════════════════════════════════════════════
// FEATURE FLAGS — Gate incomplete features safely
// Set flags in .env.local: NEXT_PUBLIC_FF_FEATURE_NAME=true
// ════════════════════════════════════════════════════

export type FeatureFlag =
  | 'WELCOME_ACHIEVEMENT'
  | 'LEVEL_CEREMONY'
  | 'PARENT_DASHBOARD'
  | 'CONTENT_AGENT'
  | 'OFFLINE_MODE'
  // Phase 5 task #1 — §10.11 OffscreenCanvas worker rendering (Ultra).
  // Off by default. Requires Vercel COOP/COEP headers for SharedArrayBuffer.
  | 'OFFSCREEN_RENDER'
  | 'OFFSCREEN_RENDER_TELEMETRY'
  | 'OFFSCREEN_RENDER_AUTOQUALITY'
  // Phase 5 task #3 — AUTH-ENH Passkey / WebAuthn (Ultra).
  | 'PASSKEY_AUTH'
  // Phase 5 task #2 — AUTH-ENH Signed Demo Tokens (Max). Supabase anonymous auth.
  | 'SIGNED_DEMO_TOKENS'
  // Phase 5 task #7 — UX-ENH Command Palette (⌘K) (Recommended).
  | 'COMMAND_PALETTE'
  // Phase 5 task #8 — PAY-ENH Proration preview (Recommended).
  | 'PRORATION_PREVIEW'
  // Phase 5 task #10 — STATE-ENH Optimistic + IndexedDB offline cache (Max).
  | 'OPTIMISTIC_OFFLINE_CACHE'
  // Phase 5 Next-10 task #2 — AUTH-ENH-006 MFA/TOTP for parents (Recommended).
  // Off by default; turn on to expose /settings/mfa and enforce AAL2
  // on subsequent sign-ins.
  | 'MFA_TOTP'
  // Phase 5 Next-10 task #8 — PERF-ENH-001 BatchedMesh cockpit (Ultra).
  // Off by default; flip on after visual verification. Enables the
  // zone-split BatchedMesh path for static cockpit chrome details.
  | 'BATCHED_COCKPIT';

const ALL_FLAGS: FeatureFlag[] = [
  'WELCOME_ACHIEVEMENT',
  'LEVEL_CEREMONY',
  'PARENT_DASHBOARD',
  'CONTENT_AGENT',
  'OFFLINE_MODE',
  'OFFSCREEN_RENDER',
  'OFFSCREEN_RENDER_TELEMETRY',
  'OFFSCREEN_RENDER_AUTOQUALITY',
  'PASSKEY_AUTH',
  'SIGNED_DEMO_TOKENS',
  'COMMAND_PALETTE',
  'PRORATION_PREVIEW',
  'OPTIMISTIC_OFFLINE_CACHE',
  'MFA_TOTP',
  'BATCHED_COCKPIT',
];

function readFlag(flag: FeatureFlag): boolean {
  if (typeof window === 'undefined' && typeof process === 'undefined') return false;
  const envKey = `NEXT_PUBLIC_FF_${flag}`;
  const value = process.env[envKey];
  return value === 'true' || value === '1';
}

/** Check if a feature flag is enabled */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return readFlag(flag);
}

/** Get all feature flags and their current values */
export function getAllFlags(): Record<FeatureFlag, boolean> {
  return Object.fromEntries(ALL_FLAGS.map(f => [f, readFlag(f)])) as Record<FeatureFlag, boolean>;
}
