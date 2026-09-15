#!/usr/bin/env node
/**
 * SSIM harness stub — W1-01 (Stagehand)
 *
 * Inspector owns the real capture + compare (TASK_BOARD W8-01).
 * This script is the CLI hook that CI will call later. It must not
 * rewrite bytes under public/forge-hub/.
 *
 * Planned (Inspector):
 *   chromium --enable-unsafe-webgpu
 *     viewport 1536×1024
 *     /dev/forge-hub?pose=lock
 *     wait [data-forge-stage="ready"]
 *     screenshot canvas
 *     SSIM vs public/forge-hub/world/LOCKED_HERO.png
 *     fail if score < 0.96
 *
 * Usage: node scripts/ssim-forge-hub.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_FILE = join(ROOT, 'public/forge-hub/world/LOCKED_HERO.png');
const SUMS_FILE = join(ROOT, 'public/forge-hub/SHA256SUMS');
const THRESHOLD = 0.96;
const CAPTURE_URL = '/dev/forge-hub?pose=lock';
const VIEWPORT = { width: 1536, height: 1024 };

const EXPECTED_LOCK_SHA =
  'db75ecf0055a8168a0ae71be5f1f28921c1ef9c29511ce44c380348121442555';

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function verifyLockBytes() {
  if (!existsSync(LOCK_FILE)) {
    console.error(`[ssim-forge-hub] STUB: missing ${LOCK_FILE}`);
    process.exit(1);
  }
  const actual = sha256File(LOCK_FILE);
  if (actual !== EXPECTED_LOCK_SHA) {
    console.error(
      `[ssim-forge-hub] STUB: LOCKED_HERO.png SHA mismatch (do not regenerate).`,
    );
    console.error(`  expected ${EXPECTED_LOCK_SHA}`);
    console.error(`  actual   ${actual}`);
    process.exit(1);
  }
  if (existsSync(SUMS_FILE)) {
    console.log('[ssim-forge-hub] STUB: lock plate SHA matches SHA256SUMS line.');
  }
}

function main() {
  console.log('[ssim-forge-hub] STUB — Inspector owns the full harness (W8-01).');
  console.log(`  capture URL : ${CAPTURE_URL}`);
  console.log(`  viewport    : ${VIEWPORT.width}×${VIEWPORT.height}`);
  console.log(`  reference   : public/forge-hub/world/LOCKED_HERO.png`);
  console.log(`  threshold   : SSIM ≥ ${THRESHOLD}`);
  console.log('  TODO(Inspector): Playwright Chromium+WebGPU capture + SSIM compare');
  console.log('  TODO(Inspector): CI job visual-forge-hub failing under 0.96');
  console.log('  TODO(Inspector): WebKit poster-path visual');

  verifyLockBytes();

  console.log('[ssim-forge-hub] STUB exit 0 — no score computed.');
  process.exit(0);
}

main();
