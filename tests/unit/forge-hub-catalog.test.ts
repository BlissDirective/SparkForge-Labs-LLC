// ════════════════════════════════════════════════════════════════
// W2-09 — catalog copy ported from PR #164 (math + catalog slices)
// ════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { FORGE_CORE } from '@/lib/forge-hub/coreMap';
import {
  HOLO_C_LOCK,
  HOLO_L_LOCK,
  HOLO_PERSPECTIVE_PX,
  HOLO_R_LOCK,
  HOLO_YAW_DEG,
  slotOrigin,
  slotTransform,
} from '@/lib/forge-hub/glassSlots';
import {
  HOLO_BUBBLE_TIPS,
  HOLO_C_WELCOME,
  LAB_POETIC,
  PREVIEW_PROGRESS,
  PREVIEW_STATS,
  buildLabRows,
  pickContinueLab,
  sparkyLine,
  xpDialValue,
} from '@/lib/forge-hub/catalog';

describe('W2-09 Forge Hub catalog', () => {
  it('builds 11 labs from canonical config', () => {
    const labs = buildLabRows([{ labId: 1, percent: 80 }]);
    expect(labs).toHaveLength(11);
    expect(Object.keys(LAB_POETIC)).toHaveLength(11);
    expect(labs[0].progress).toBe(80);
    expect(labs[1].progress).toBe(0);
    expect(labs[0].Icon).toBeTruthy();
    expect(labs.every((row) => row.gamesCount >= 0)).toBe(true);
  });

  it('continues the closest-to-done unfinished lab', () => {
    const labs = buildLabRows([
      { labId: 1, percent: 100 },
      { labId: 2, percent: 40 },
      { labId: 3, percent: 90 },
    ]);
    expect(pickContinueLab(labs)).toBe(3);
  });

  it('clamps XP dial to the current 100-point band', () => {
    expect(xpDialValue(50, 1)).toBe(0.5);
    expect(xpDialValue(250, 3)).toBe(0.5);
  });

  it('keeps first-load HoloC copy in one swap constant', () => {
    expect(HOLO_C_WELCOME.title).toBe('Welcome to SparkForge');
    expect(HOLO_C_WELCOME.subtitle).toMatch(/building, playing, and exploring/);
    expect(HOLO_C_WELCOME.rotating[0]).toMatch(/Meet Sparky/);
    expect(PREVIEW_STATS.childName).toBe('Nova');
    expect(PREVIEW_PROGRESS).toHaveLength(11);
  });

  it('maps sparkyLine to HoloBubble tips, not a TopMonitor HUD', () => {
    expect(sparkyLine(0)).toBe(HOLO_BUBBLE_TIPS[0]);
    expect(sparkyLine(HOLO_BUBBLE_TIPS.length)).toBe(HOLO_BUBBLE_TIPS[0]);
    expect(HOLO_BUBBLE_TIPS.some((line) => /HoloC|bubble|PlayStage/.test(line))).toBe(
      true,
    );
    expect(HOLO_BUBBLE_TIPS.join(' ')).not.toMatch(/TopMonitor|TopBanner/);
  });
});

describe('W2-09 slot helpers ported from #164 hotspot math', () => {
  it('docks wings on opposite sides of the core', () => {
    expect(HOLO_L_LOCK.left + HOLO_L_LOCK.width).toBeLessThan(FORGE_CORE.cx);
    expect(HOLO_R_LOCK.left).toBeGreaterThan(FORGE_CORE.cx);
    expect(HOLO_YAW_DEG).toBe(2);
    expect(HOLO_PERSPECTIVE_PX).toBe(1200);
  });

  it('yaws docked slots toward SF with a shared transform helper', () => {
    expect(slotOrigin(HOLO_L_LOCK)).toBe('right center');
    expect(slotOrigin(HOLO_R_LOCK)).toBe('left center');
    expect(slotOrigin(HOLO_C_LOCK)).toBe('center center');
    expect(slotTransform(HOLO_L_LOCK)).toBe(
      'perspective(1200px) rotateY(-2deg)',
    );
    expect(slotTransform(HOLO_R_LOCK)).toBe(
      'perspective(1200px) rotateY(2deg)',
    );
    expect(slotTransform(HOLO_C_LOCK)).toBe(
      'perspective(1200px) rotateY(0deg)',
    );
  });
});
