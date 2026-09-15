// ════════════════════════════════════════════════════════════════
// W1-01 — forge hub config + SSIM stub contract
// ════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import {
  FORGE_HUB_CAMERA,
  FORGE_HUB_DISPLAY_STILL,
  FORGE_HUB_DPR,
  FORGE_HUB_LOCK_PLATE,
  FORGE_HUB_REFERENCE_VIEWPORT,
  FORGE_HUB_SSIM_THRESHOLD,
  frameloopForMotion,
  plateSizeAtDistance,
} from '@/config/forgeHub';
import {
  SSIM_HARNESS_SPEC,
  SSIM_HARNESS_STATUS,
  compareForgeHubSsim,
} from '@/lib/forge-hub/ssimHarness';

describe('W1-01 forge hub config', () => {
  it('locks the SSIM viewport to the plate aspect', () => {
    expect(FORGE_HUB_REFERENCE_VIEWPORT).toEqual({ width: 1536, height: 1024 });
    expect(FORGE_HUB_SSIM_THRESHOLD).toBe(0.96);
    expect(FORGE_HUB_LOCK_PLATE).toBe('/forge-hub/world/LOCKED_HERO.png');
    expect(FORGE_HUB_DISPLAY_STILL).toContain('LOCKED_HERO_no_haze_filter');
  });

  it('keeps camera micro-dolly at ±2 percent and dpr ≤ 1.5', () => {
    expect(FORGE_HUB_CAMERA.microDollyPercent).toBe(0.02);
    expect(FORGE_HUB_DPR[0]).toBe(1);
    expect(FORGE_HUB_DPR[1]).toBeLessThanOrEqual(1.5);
  });

  it('sizes the plate plane to fill the lock frustum', () => {
    const [w, h] = plateSizeAtDistance(8.6, 38, 1536 / 1024);
    expect(w / h).toBeCloseTo(1536 / 1024, 5);
    expect(h).toBeGreaterThan(0);
  });

  it('maps reduced motion to demand frameloop', () => {
    expect(frameloopForMotion(true)).toBe('demand');
    expect(frameloopForMotion(false)).toBe('always');
  });
});

describe('W1-01 SSIM harness stub', () => {
  it('is explicitly a stub owned by Inspector', () => {
    expect(SSIM_HARNESS_STATUS).toBe('stub');
    expect(SSIM_HARNESS_SPEC.owner).toBe('Inspector');
    expect(SSIM_HARNESS_SPEC.captureUrl).toBe('/dev/forge-hub?pose=lock');
    expect(SSIM_HARNESS_SPEC.threshold).toBe(0.96);
    expect(compareForgeHubSsim(Buffer.from(''))).toBeNull();
  });
});
