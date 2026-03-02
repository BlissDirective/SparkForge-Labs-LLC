// ════════════════════════════════════════════════════
// FEATURE FLAGS — Gate incomplete features safely
// Set flags in .env.local: NEXT_PUBLIC_FF_FEATURE_NAME=true
// ════════════════════════════════════════════════════

export type FeatureFlag =
  | 'WELCOME_ACHIEVEMENT'
  | 'LEVEL_CEREMONY'
  | 'PARENT_DASHBOARD'
  | 'CONTENT_AGENT'
  | 'OFFLINE_MODE';

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
  const flags: FeatureFlag[] = [
    'WELCOME_ACHIEVEMENT',
    'LEVEL_CEREMONY',
    'PARENT_DASHBOARD',
    'CONTENT_AGENT',
    'OFFLINE_MODE',
  ];
  return Object.fromEntries(flags.map(f => [f, readFlag(f)])) as Record<FeatureFlag, boolean>;
}
