// ════════════════════════════════════════════════════════════════
// Theatre.js beat player — stub for first-visit-ignition.
// Loads committed JSON later; slice 1 JSON is status: stub.
// Never import @theatre/studio in production (TAP §2.6 / bible §5.8).
// ════════════════════════════════════════════════════════════════

import type { MotionBibleId } from './ids';
import ignitionStub from '@/lib/forge-hub/beats/first-visit-ignition.json';
import { FIRST_VISIT_IGNITION_MS } from './timings';

export interface TheatreBeatManifest {
  id: MotionBibleId;
  status: 'stub' | 'authored';
  runtime: 'theatre.js';
  durationMs: number;
  skipTo: MotionBibleId;
  notes?: string;
}

const MANIFESTS: Record<'first-visit-ignition', TheatreBeatManifest> = {
  'first-visit-ignition': ignitionStub as TheatreBeatManifest,
};

export function loadTheatreBeat(
  id: 'first-visit-ignition',
): TheatreBeatManifest {
  const beat = MANIFESTS[id];
  return {
    ...beat,
    durationMs: beat.durationMs || FIRST_VISIT_IGNITION_MS,
  };
}

/**
 * Studio overlay is /dev/forge-hub?studio=1 in development only.
 * Slice 1 does not mount it — production never loads the studio bundle.
 */
export async function maybeLoadForgeTheatreStudio(enabled: boolean): Promise<'skipped' | 'loaded'> {
  if (!enabled) return 'skipped';
  if (process.env.NODE_ENV === 'production') return 'skipped';
  return 'skipped';
}
