// ════════════════════════════════════════════════════════════════
// W2 — layout registry (PR #164 layouts math, re-seated trio)
// ════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { FORGE_CORE } from '@/lib/forge-hub/coreMap';
import {
  HOLO_C_LOCK,
  HOLO_L_LOCK,
  HOLO_R_LOCK,
  HOLO_YAW_DEG,
} from '@/lib/forge-hub/glassSlots';
import {
  AUTH_MERGED_CENTER,
  FORGE_LAYOUTS,
  HUBSPLIT_HOLO_C,
  LAYOUT_MORPH_MS,
  LAYOUT_MORPH_MS_PR164,
  LOCK_POSE_LAYOUT,
  PLAYSTAGE_CENTER,
  WELCOME_SIDE_SCALE,
  beamAttachPoint,
  beamSlotsForState,
  containsPoint,
  glassSlotsForView,
  layoutForMode,
  liveBeams,
  morphWingRect,
  rectCentroid,
  registerMorphTargets,
  resolvedSlots,
  scalePercentRect,
  slotContentSizePx,
  slotToWorld,
} from '@/lib/forge-hub/layouts';

describe('W2 layout registry', () => {
  it('registers every TAP mode including playStage as the merged slab', () => {
    expect(FORGE_LAYOUTS.hubSplit.slots.holoL).toMatchObject({
      left: HOLO_L_LOCK.left,
      width: HOLO_L_LOCK.width,
      visible: true,
    });
    expect(FORGE_LAYOUTS.hubSplit.slots.holoR).toMatchObject({
      left: HOLO_R_LOCK.left,
      visible: true,
    });
    expect(FORGE_LAYOUTS.hubSplit.slots.holoC).toMatchObject({
      left: HUBSPLIT_HOLO_C.left,
      width: HUBSPLIT_HOLO_C.width,
      yaw: 0,
      reading: true,
      visible: true,
    });
    expect(FORGE_LAYOUTS.playStage.slots.holoC).toMatchObject({
      ...PLAYSTAGE_CENTER,
      reading: true,
      visible: true,
    });
    expect(FORGE_LAYOUTS.playStage.slots.holoL.visible).toBe(false);
    expect(FORGE_LAYOUTS.playStage.slots.holoR.visible).toBe(false);
    expect(AUTH_MERGED_CENTER).toEqual(PLAYSTAGE_CENTER);
    expect(PLAYSTAGE_CENTER).toMatchObject({ left: 20, width: 60, yaw: 0 });
  });

  it('does not keep authMerged as a live mode', () => {
    expect('authMerged' in FORGE_LAYOUTS).toBe(false);
    expect(FORGE_LAYOUTS.welcome.id).toBe('welcome');
  });

  it('keeps lock-pose HoloC on the painted top seed', () => {
    expect(LOCK_POSE_LAYOUT.slots.holoC).toMatchObject({
      left: 37.5,
      top: 13.5,
      width: 25,
      height: 48,
      yaw: 0,
      reading: false,
    });
    expect(glassSlotsForView('hubSplit', true)).toHaveLength(3);
    expect(glassSlotsForView('hubSplit', true)[1].top).toBe(HOLO_C_LOCK.top);
    expect(glassSlotsForView('hubSplit', false)[1]?.id ?? 'holoC').toBe('holoC');
    expect(
      glassSlotsForView('hubSplit', false).find((s) => s.id === 'holoC')?.top,
    ).toBe(HUBSPLIT_HOLO_C.top);
  });

  it('shrinks welcome sides to 85 percent about the core-facing origin', () => {
    expect(WELCOME_SIDE_SCALE).toBe(0.85);
    const left = FORGE_LAYOUTS.welcome.slots.holoL;
    const scaled = scalePercentRect(HOLO_L_LOCK, 0.85);
    expect(left.width).toBeCloseTo(scaled.width);
    expect(left.left).toBeCloseTo(scaled.left);
    expect(left.yaw).toBe(0);
    expect(FORGE_LAYOUTS.welcome.slots.holoC).toMatchObject({
      left: HUBSPLIT_HOLO_C.left,
      width: HUBSPLIT_HOLO_C.width,
    });
  });

  it('snaps reading slots to yaw 0 and leaves Focus sides tucked', () => {
    expect(FORGE_LAYOUTS.hubSplit.slots.holoL.yaw).toBe(0);
    expect(FORGE_LAYOUTS.hubSplit.slots.holoC.yaw).toBe(0);
    expect(FORGE_LAYOUTS.focus.slots.holoL.yaw).toBe(-8);
    expect(FORGE_LAYOUTS.focus.slots.holoR.yaw).toBe(8);
    expect(FORGE_LAYOUTS.focus.slots.holoC.reading).toBe(true);
    expect(HOLO_YAW_DEG).toBe(2);
  });

  it('uses MOTION_BIBLE slotSlide 420 ms (not #164 480) for the registry budget', () => {
    expect(LAYOUT_MORPH_MS).toBe(420);
    expect(LAYOUT_MORPH_MS_PR164).toBe(480);
  });

  it('exposes Director morph targets without tweening', () => {
    const targets = registerMorphTargets('playStage');
    expect(targets.holoC.visible).toBe(true);
    expect(targets.holoL.visible).toBe(false);
    expect(layoutForMode('labsBrowse').slots.holoC.width).toBeGreaterThan(
      layoutForMode('labsBrowse').slots.holoL.width,
    );
  });

  it('reports content size in CSS pixels at the 1280×720 plate', () => {
    const size = slotContentSizePx(PLAYSTAGE_CENTER);
    expect(size.width).toBeCloseTo(1280 * 0.6);
    expect(size.height).toBeCloseTo(720 * 0.44);
    const world = slotToWorld(HOLO_L_LOCK, 10, 10);
    expect(world.width).toBeCloseTo(2.43, 5);
  });
});

describe('W2 layout math ported from PR #164', () => {
  it('morphs L+R toward the PlayStage merge target', () => {
    expect(morphWingRect('left', 0)).toMatchObject({
      left: HOLO_L_LOCK.left,
      top: HOLO_L_LOCK.top,
      width: HOLO_L_LOCK.width,
      height: HOLO_L_LOCK.height,
      yaw: HOLO_L_LOCK.yaw,
    });
    expect(morphWingRect('right', 1)).toMatchObject(PLAYSTAGE_CENTER);
    const mid = morphWingRect('left', 0.5);
    expect(mid.left).toBeCloseTo((HOLO_L_LOCK.left + PLAYSTAGE_CENTER.left) / 2);
    expect(mid.yaw).toBeCloseTo(-1);
  });

  it('attaches beams to the core-facing edge of live rects', () => {
    const topHit = beamAttachPoint(HOLO_C_LOCK);
    expect(topHit.x).toBeCloseTo(rectCentroid(HOLO_C_LOCK).x);
    expect(topHit.y).toBeCloseTo(HOLO_C_LOCK.top + HOLO_C_LOCK.height);

    // On LOCKED_HUB.jpg the emitter disc sits BELOW the center panel
    // (FORGE_CORE cy 78 > HUBSPLIT_HOLO_C bottom 72), so the plate's
    // cone rises from the disc to HoloC — idle beams HoloC, and the
    // core is no longer inside the panel.
    const idle = liveBeams(beamSlotsForState(0, false));
    expect(idle.map((b) => b.id)).toEqual(['holoC']);
    expect(
      containsPoint(resolvedSlots(0).holoC, FORGE_CORE.cx, FORGE_CORE.cy),
    ).toBe(false);

    const docked = liveBeams(beamSlotsForState(0, true));
    // HoloC now beams too (disc below the panel), so the docked trio is all three.
    expect(docked.map((b) => b.id)).toEqual(['holoC', 'holoL', 'holoR']);

    // Merged PlayStage ends at y68; the disc (cy 78) is below it, so the
    // cone still reaches the merged panel — HoloC keeps its beam.
    const merged = liveBeams(beamSlotsForState(1, true));
    expect(merged.map((b) => b.id)).toEqual(['holoC']);
    expect(resolvedSlots(1).merged).toBe(true);
  });

  it('still beams lock-pose HoloC (top seed does not contain the core)', () => {
    const lockBeams = liveBeams([
      { id: 'holoC', rect: HOLO_C_LOCK },
      { id: 'holoL', rect: HOLO_L_LOCK },
      { id: 'holoR', rect: HOLO_R_LOCK },
    ]);
    expect(lockBeams.map((b) => b.id)).toEqual(['holoC', 'holoL', 'holoR']);
    expect(lockBeams[0].fromX).toBe(FORGE_CORE.cx);
  });
});
