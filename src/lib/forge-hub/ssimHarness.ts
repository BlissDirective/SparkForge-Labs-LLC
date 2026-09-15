// ════════════════════════════════════════════════════════════════
// SSIM harness stub — W1-01 (Stagehand)
// ════════════════════════════════════════════════════════════════
// Inspector owns the full harness (TASK_BOARD W8-01 / GROK_TEAM_PROMPTS
// §8). This file is the contract those jobs should import. Do not
// capture, compare, or fail a score from this module.
//
// TODO(Inspector):
//   1. Launch Chromium with WebGPU at FORGE_HUB_REFERENCE_VIEWPORT.
//   2. Navigate to `/dev/forge-hub?pose=lock`.
//   3. Wait for `[data-forge-stage="ready"]` (or poster path).
//   4. Screenshot the canvas (not the HTML chrome).
//   5. Compare against public/forge-hub/world/LOCKED_HERO.png.
//   6. Fail the job when score < FORGE_HUB_SSIM_THRESHOLD (0.96).
//   7. Wire CI job `visual-forge-hub` — do not run it from Stagehand.

import {
  FORGE_HUB_LOCK_PLATE,
  FORGE_HUB_REFERENCE_VIEWPORT,
  FORGE_HUB_SSIM_THRESHOLD,
} from '@/config/forgeHub';

export const SSIM_HARNESS_STATUS = 'stub' as const;

export const SSIM_HARNESS_ROUTE = '/dev/forge-hub';

export const SSIM_HARNESS_LOCK_SEARCH = '?pose=lock';

export const SSIM_HARNESS_CAPTURE_URL = `${SSIM_HARNESS_ROUTE}${SSIM_HARNESS_LOCK_SEARCH}`;

/** Selector Inspector should wait on before capturing. */
export const SSIM_HARNESS_READY_SELECTOR = '[data-forge-stage="ready"]';

export const SSIM_HARNESS_SPEC = {
  status: SSIM_HARNESS_STATUS,
  route: SSIM_HARNESS_ROUTE,
  captureUrl: SSIM_HARNESS_CAPTURE_URL,
  readySelector: SSIM_HARNESS_READY_SELECTOR,
  viewport: FORGE_HUB_REFERENCE_VIEWPORT,
  referencePlate: FORGE_HUB_LOCK_PLATE,
  /** Filesystem path relative to repo root — never rewrite these bytes. */
  referencePlateFile: 'public/forge-hub/world/LOCKED_HERO.png',
  threshold: FORGE_HUB_SSIM_THRESHOLD,
  owner: 'Inspector',
} as const;

/**
 * Stub. Inspector replaces this with a real SSIM compare.
 * Always returns null so nothing can accidentally gate on a fake score.
 */
export function compareForgeHubSsim(_candidatePng: Buffer): null {
  void _candidatePng;
  return null;
}
