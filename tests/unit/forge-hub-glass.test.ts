// ════════════════════════════════════════════════════════════════
// W1-03 — lock-pose glass slots + HOLO blend (PR #164 math/tokens)
// ════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { HOLO_BLEND, HOLO_BLEND_CSS_VARS } from '@/lib/forge-hub/holoBlend';
import {
  GLASS_LOCK_SLOT_LIST,
  GLASS_LOCK_SLOTS,
  HOLO_C_LOCK,
  HOLO_L_LOCK,
  HOLO_PERSPECTIVE_PX,
  HOLO_R_LOCK,
  HOLO_YAW_DEG,
  assertLockSlots,
  cssGlassStyle,
  percentRectToLocal,
  slotOrigin,
} from '@/lib/forge-hub/glassSlots';
import { isPercentRect } from '@/lib/forge-hub/coreMap';
import {
  PANEL_BREATHE_PERIOD_S,
  PANEL_BREATHE_SCALE_MAX,
  PANEL_BREATHE_SCALE_MIN,
  REDUCED_MOTION_CROSSFADE_MS,
  panelBreatheScale,
} from '@/lib/forge-hub/panelBreathe';
import { FORGE_HUB_GLASS } from '@/config/forgeHub';

describe('W1-03 HOLO blend tokens', () => {
  it('keeps the #164 edge / blur / glow and does not raise empty fill to reading-plate', () => {
    expect(HOLO_BLEND.edge).toBe('rgba(77,233,255,0.78)');
    expect(HOLO_BLEND.blurPx).toBe(3);
    expect(HOLO_BLEND.glow).toContain('rgba(77,233,255,0.28)');
    expect(HOLO_BLEND.fill).toBe('rgba(6,14,28,0.48)');
    expect(HOLO_BLEND_CSS_VARS['--fh-holo-edge']).toBe(HOLO_BLEND.edge);
  });

  it('raises the reading-plate fill to ≥ 0.85 opaque navy', () => {
    expect(HOLO_BLEND.readingFillAlpha).toBeGreaterThanOrEqual(0.85);
    expect(HOLO_BLEND.readingFill).toBe('rgba(6,14,28,0.88)');
    expect(HOLO_BLEND_CSS_VARS['--fh-holo-reading']).toBe(HOLO_BLEND.readingFill);
  });
});

describe('W1-03 lock-pose glass slots', () => {
  it('is the painted trio (L / top-C / R) with ±2° yaw', () => {
    expect(HOLO_YAW_DEG).toBe(2);
    expect(HOLO_PERSPECTIVE_PX).toBe(1200);
    expect(HOLO_L_LOCK).toMatchObject({
      left: 7.2,
      top: 30.5,
      width: 20.8,
      height: 42,
      yaw: -2,
    });
    expect(HOLO_R_LOCK).toMatchObject({
      left: 72,
      top: 30.5,
      width: 20.8,
      height: 42,
      yaw: 2,
    });
    expect(HOLO_C_LOCK).toMatchObject({
      left: 20,
      top: 2.8,
      width: 60,
      height: 14.5,
      yaw: 0,
    });
    expect(GLASS_LOCK_SLOT_LIST).toHaveLength(3);
    expect(assertLockSlots()).toBe(true);
    expect(GLASS_LOCK_SLOTS.holoL.id).toBe('holoL');
  });

  it('does not cover the SF core with a center slab in the lock pose', () => {
    const cBottom = HOLO_C_LOCK.top + HOLO_C_LOCK.height;
    expect(cBottom).toBeLessThan(49.2 - 9.4);
    expect(isPercentRect(HOLO_L_LOCK)).toBe(true);
    expect(isPercentRect(HOLO_C_LOCK)).toBe(true);
    expect(isPercentRect(HOLO_R_LOCK)).toBe(true);
  });

  it('yaws from the core-facing edge', () => {
    expect(slotOrigin(HOLO_L_LOCK)).toBe('right center');
    expect(slotOrigin(HOLO_R_LOCK)).toBe('left center');
    expect(slotOrigin(HOLO_C_LOCK)).toBe('center center');
  });

  it('maps percent rects onto a plate plane with a core-facing pivot', () => {
    const local = percentRectToLocal(HOLO_L_LOCK, 10, 10);
    expect(local.width).toBeCloseTo(2.08, 5);
    expect(local.height).toBeCloseTo(4.2, 5);
    expect(local.pivotX).toBeGreaterThan(0);
    expect(local.yawRad).toBeCloseTo((-2 * Math.PI) / 180, 8);
    const css = cssGlassStyle(HOLO_R_LOCK);
    expect(css.left).toBe('72%');
    expect(css.transformOrigin).toBe('left center');
  });
});

describe('W1-03 panelBreathe', () => {
  it('loops at ~3s between 98–102 percent and freezes at 1.0', () => {
    expect(PANEL_BREATHE_PERIOD_S).toBe(3);
    expect(PANEL_BREATHE_SCALE_MIN).toBe(0.98);
    expect(PANEL_BREATHE_SCALE_MAX).toBe(1.02);
    expect(REDUCED_MOTION_CROSSFADE_MS).toBe(200);
    expect(FORGE_HUB_GLASS.lift).toBeGreaterThan(0);

    expect(panelBreatheScale(0, 0, true)).toBe(1);
    expect(panelBreatheScale(1.5, 0, true)).toBe(1);

    const rest = panelBreatheScale(0, 0, false);
    const peak = panelBreatheScale(0.75, 0, false);
    const mid = panelBreatheScale(1.5, 0, false);
    expect(rest).toBeCloseTo(1, 5);
    expect(peak).toBeCloseTo(PANEL_BREATHE_SCALE_MAX, 5);
    expect(mid).toBeCloseTo(1, 5);
    expect(peak).toBeGreaterThan(rest);
  });
});
