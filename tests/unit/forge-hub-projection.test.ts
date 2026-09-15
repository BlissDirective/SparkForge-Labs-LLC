// ════════════════════════════════════════════════════════════════
// W2 — projection math + morph-phase fifths
// ════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import {
  HOLO_YAW_CSS_MAX_DEG,
  boundingRect,
  clampYawCssDeg,
  cssYawTransform,
  morphPhaseFromProgress,
  ndcToScreen,
} from '@/lib/forge-hub/projectionMath';
import { HOLO_BLEND } from '@/lib/forge-hub/holoBlend';
import { registerMorphTargets } from '@/lib/forge-hub/layouts';

describe('W2 projection math', () => {
  it('maps NDC to CSS pixels (y-down)', () => {
    expect(ndcToScreen(-1, 1, 200, 100)).toEqual({ x: 0, y: 0 });
    expect(ndcToScreen(1, -1, 200, 100)).toEqual({ x: 200, y: 100 });
    expect(ndcToScreen(0, 0, 200, 100)).toEqual({ x: 100, y: 50 });
  });

  it('bounds a projected quad', () => {
    const box = boundingRect([
      { x: 10, y: 20 },
      { x: 40, y: 20 },
      { x: 40, y: 80 },
      { x: 10, y: 80 },
    ]);
    expect(box).toEqual({ left: 10, top: 20, width: 30, height: 60 });
  });

  it('clamps CSS yaw to ±8° and snaps 0 to none', () => {
    expect(HOLO_YAW_CSS_MAX_DEG).toBe(8);
    expect(clampYawCssDeg(15)).toBe(8);
    expect(clampYawCssDeg(-12)).toBe(-8);
    expect(cssYawTransform(0)).toBe('none');
    expect(cssYawTransform(2)).toContain('rotateY(2deg)');
    expect(cssYawTransform(2)).toContain('perspective(1200px)');
  });
});

describe('W2 morph-phase fifths', () => {
  it('maps morphProgress to fade / glass / wipe without stretching', () => {
    expect(morphPhaseFromProgress(0)).toBe('idle');
    expect(morphPhaseFromProgress(1)).toBe('idle');
    expect(morphPhaseFromProgress(0.1)).toBe('fade-out');
    expect(morphPhaseFromProgress(0.5)).toBe('glass');
    expect(morphPhaseFromProgress(0.9)).toBe('wipe-in');
  });
});

describe('W2 reading plate tokens', () => {
  it('keeps empty-glass fill below the reading plate', () => {
    expect(HOLO_BLEND.readingFillAlpha).toBeGreaterThanOrEqual(0.85);
    expect(HOLO_BLEND.fill).toBe('rgba(6,14,28,0.48)');
  });

  it('marks PlayStage and welcome HoloC as reading', () => {
    expect(registerMorphTargets('welcome').holoC.reading).toBe(true);
    expect(registerMorphTargets('playStage').holoC.reading).toBe(true);
    expect(registerMorphTargets('playStage').holoC.yaw).toBe(0);
  });
});
