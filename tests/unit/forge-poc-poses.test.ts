// ════════════════════════════════════════════════════════════════
// Forge Stage POC — single-clock pose model
// ════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import {
  POC_KEYFRAMES,
  POC_STAGE_VALUE,
  contentForStage,
  modeToStage,
  samplePocPose,
  stageNameFor,
  stageToMode,
} from '@/lib/forge-hub/poc/pocStage';

describe('forge POC single-clock pose model', () => {
  it('samples the exact keyframes at the three named stops', () => {
    expect(samplePocPose(POC_STAGE_VALUE.welcome)).toMatchObject({
      ...POC_KEYFRAMES['0'],
      content: 'welcome',
    });
    expect(samplePocPose(POC_STAGE_VALUE.hub)).toMatchObject({
      ...POC_KEYFRAMES['0.5'],
      content: 'hub',
    });
    expect(samplePocPose(POC_STAGE_VALUE.play)).toMatchObject({
      ...POC_KEYFRAMES['1'],
      content: 'play',
    });
  });

  it('clamps out-of-range stage values', () => {
    expect(samplePocPose(-3)).toMatchObject(samplePocPose(0));
    expect(samplePocPose(9)).toMatchObject(samplePocPose(1));
  });

  it('merges the three screens into one as stage → 1 (sides fade, centre grows)', () => {
    const hub = samplePocPose(0.5);
    const play = samplePocPose(1);
    // side panels fade out as they merge into the centre slab
    expect(hub.L.a).toBe(1);
    expect(play.L.a).toBe(0);
    expect(play.R.a).toBe(0);
    // sides converge on the centre X
    expect(Math.abs(play.L.x)).toBeLessThan(Math.abs(hub.L.x));
    expect(play.L.x).toBe(play.C.x);
    // centre grows into the merged stage
    expect(play.C.sx).toBeGreaterThan(hub.C.sx);
    // mid-morph the centre is between the two widths and sides partly faded
    const mid = samplePocPose(0.75);
    expect(mid.C.sx).toBeGreaterThan(hub.C.sx);
    expect(mid.C.sx).toBeLessThan(play.C.sx);
    expect(mid.L.a).toBeGreaterThan(0);
    expect(mid.L.a).toBeLessThan(1);
  });

  it('drives emitter, beams and room dim up together toward playStage', () => {
    expect(samplePocPose(0).emit).toBeCloseTo(0.55, 5);
    expect(samplePocPose(0.5).emit).toBeCloseTo(0.72, 5);
    expect(samplePocPose(1).emit).toBeCloseTo(1.0, 5);
    // monotonic non-decreasing across the axis
    let prev = -1;
    for (let s = 0; s <= 1.0001; s += 0.1) {
      const e = samplePocPose(s).emit;
      expect(e).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = e;
    }
    // room only dims in the back half (welcome/hub stay lit)
    expect(samplePocPose(0).dim).toBe(0);
    expect(samplePocPose(0.5).dim).toBe(0);
    expect(samplePocPose(1).dim).toBeGreaterThan(0);
  });

  it('switches centre content by nearest stop', () => {
    expect(contentForStage(0.1)).toBe('welcome');
    expect(contentForStage(0.24)).toBe('welcome');
    expect(contentForStage(0.5)).toBe('hub');
    expect(contentForStage(0.74)).toBe('hub');
    expect(contentForStage(0.9)).toBe('play');
    expect(stageNameFor(0)).toBe('welcome');
    expect(stageNameFor(0.5)).toBe('hub');
    expect(stageNameFor(1)).toBe('play');
  });

  it('maps forge modes onto the three-stop stage axis and back', () => {
    expect(modeToStage('welcome')).toBe(0);
    expect(modeToStage('cinematic')).toBe(0);
    expect(modeToStage('playStage')).toBe(1);
    for (const m of ['hubSplit', 'labsBrowse', 'gameLobby', 'avatarStudio', 'settingsDock', 'focus', 'dual', 'flat'] as const) {
      expect(modeToStage(m)).toBe(0.5);
    }
    expect(stageToMode(0)).toBe('welcome');
    expect(stageToMode(0.5)).toBe('hubSplit');
    expect(stageToMode(1)).toBe('playStage');
    // round-trips at the three stops
    expect(modeToStage(stageToMode(0))).toBe(0);
    expect(modeToStage(stageToMode(0.5))).toBe(0.5);
    expect(modeToStage(stageToMode(1))).toBe(1);
  });

  it('interpolates side yaw from tilted (hub) toward flat (merged)', () => {
    expect(samplePocPose(0.5).L.yaw).toBeCloseTo(10, 5);
    expect(samplePocPose(1).L.yaw).toBeCloseTo(0, 5);
    const mid = samplePocPose(0.75).L.yaw;
    expect(mid).toBeLessThan(10);
    expect(mid).toBeGreaterThan(0);
  });
});
