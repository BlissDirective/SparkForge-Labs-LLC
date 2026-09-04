import { describe, expect, it } from 'vitest';
import {
  buildLabInstruments,
  computePodLayout,
  pickContinueLab,
  xpDialValue,
} from '@/components/mission-control/labInstruments';

describe('mission-control lab instruments', () => {
  it('builds 11 labs from canonical config and maps labId progress', () => {
    const labs = buildLabInstruments([
      { labId: 1, percent: 80 },
      { lab: 2, percent: 25 },
    ]);
    expect(labs).toHaveLength(11);
    expect(labs[0].name).toMatch(/AI/i);
    expect(labs[0].progress).toBe(80);
    expect(labs[1].progress).toBe(25);
    expect(labs[2].progress).toBe(0);
    expect(labs.every((l) => l.color.startsWith('#'))).toBe(true);
    expect(labs.every((l) => l.gamesCount >= 0)).toBe(true);
  });

  it('places pods on an ellipse, not a 2×N grid', () => {
    const pts = computePodLayout(11);
    expect(pts).toHaveLength(11);
    const xs = pts.map((p) => p.left);
    const ys = pts.map((p) => p.top);
    // Spread in both axes — a grid row would share a single y.
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(40);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(20);
    expect(new Set(ys.map((y) => Math.round(y))).size).toBeGreaterThan(3);
  });

  it('continues the closest-to-done unfinished lab', () => {
    const labs = buildLabInstruments([
      { labId: 1, percent: 100 },
      { labId: 2, percent: 40 },
      { labId: 3, percent: 90 },
    ]);
    expect(pickContinueLab(labs)).toBe(3);
  });

  it('clamps XP dial to the current 100-point level band', () => {
    expect(xpDialValue(0, 1)).toBe(0);
    expect(xpDialValue(50, 1)).toBe(0.5);
    expect(xpDialValue(250, 3)).toBe(0.5);
    expect(xpDialValue(9999, 1)).toBe(1);
  });
});
