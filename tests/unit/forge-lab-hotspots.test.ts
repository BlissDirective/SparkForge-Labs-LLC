import { describe, expect, it } from 'vitest';
import {
  FORGE_CORE,
  HOLO_PERSPECTIVE_PX,
  HOLO_YAW_DEG,
  HOTSPOTS,
  LEFT_HOLO_SLOT,
  PEDESTAL,
  PLATE_ASPECT_RATIO,
  PLATE_HEIGHT_PX,
  PLATE_WIDTH_PX,
  RIGHT_HOLO_SLOT,
  TOP_MONITOR_GLASS,
  dockSlotStyle,
  isPercentCircle,
  isPercentRect,
  slotOrigin,
  slotTransform,
} from '@/lib/forge-lab/hotspotMap';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import { buildLabRows, pickContinueLab, xpDialValue } from '@/lib/forge-lab/catalog';

describe('Forge Lab hotspot map', () => {
  it('uses the locked 1536×1024 plate aspect', () => {
    expect(PLATE_WIDTH_PX).toBe(1536);
    expect(PLATE_HEIGHT_PX).toBe(1024);
    expect(PLATE_ASPECT_RATIO).toBeCloseTo(1.5);
  });

  it('keeps every calibrated region inside the plate', () => {
    expect(isPercentRect(TOP_MONITOR_GLASS)).toBe(true);
    expect(isPercentCircle(FORGE_CORE)).toBe(true);
    expect(isPercentRect(LEFT_HOLO_SLOT)).toBe(true);
    expect(isPercentRect(RIGHT_HOLO_SLOT)).toBe(true);
    for (const spot of HOTSPOTS) {
      if (spot.kind === 'circle' && spot.circle) {
        expect(isPercentCircle(spot.circle)).toBe(true);
      }
      if (spot.kind === 'rect' && spot.rect) {
        expect(isPercentRect(spot.rect)).toBe(true);
      }
    }
  });

  it('places the SF core under the bezel glass, not inside it', () => {
    const glassBottom = TOP_MONITOR_GLASS.top + TOP_MONITOR_GLASS.height;
    expect(FORGE_CORE.cy - FORGE_CORE.r).toBeGreaterThan(glassBottom);
  });

  it('docks wings on opposite sides of the core', () => {
    expect(LEFT_HOLO_SLOT.left + LEFT_HOLO_SLOT.width).toBeLessThan(FORGE_CORE.cx);
    expect(RIGHT_HOLO_SLOT.left).toBeGreaterThan(FORGE_CORE.cx);
  });

  it('freezes the Option A dock map including ±4° yaw', () => {
    expect(HOLO_YAW_DEG).toBe(4);
    expect(HOLO_PERSPECTIVE_PX).toBe(1200);
    expect(TOP_MONITOR_GLASS).toMatchObject({
      left: 27.4,
      top: 2.6,
      width: 45.2,
      height: 17.8,
      yaw: 0,
    });
    expect(FORGE_CORE).toEqual({ cx: 50, cy: 49.2, r: 9.4 });
    expect(PEDESTAL).toMatchObject({
      left: 36.5,
      top: 70.5,
      width: 27,
      height: 18.5,
      yaw: 0,
    });
    expect(LEFT_HOLO_SLOT).toMatchObject({
      left: 7.2,
      top: 30.5,
      width: 20.8,
      height: 42,
      yaw: -4,
    });
    expect(RIGHT_HOLO_SLOT).toMatchObject({
      left: 72,
      top: 30.5,
      width: 20.8,
      height: 42,
      yaw: 4,
    });
  });

  it('yaws docked slots toward SF with a shared transform helper', () => {
    expect(slotOrigin(LEFT_HOLO_SLOT)).toBe('right center');
    expect(slotOrigin(RIGHT_HOLO_SLOT)).toBe('left center');
    expect(slotOrigin(TOP_MONITOR_GLASS)).toBe('center center');
    expect(slotTransform(LEFT_HOLO_SLOT)).toBe('perspective(1200px) rotateY(-4deg)');
    expect(slotTransform(RIGHT_HOLO_SLOT)).toBe('perspective(1200px) rotateY(4deg)');
    expect(slotTransform(TOP_MONITOR_GLASS)).toBe('perspective(1200px) rotateY(0deg)');

    const left = dockSlotStyle(LEFT_HOLO_SLOT);
    const right = dockSlotStyle(RIGHT_HOLO_SLOT);
    expect(left).toMatchObject({
      left: '7.2%',
      top: '30.5%',
      width: '20.8%',
      height: '42%',
      transform: 'perspective(1200px) rotateY(-4deg)',
      transformOrigin: 'right center',
    });
    expect(right.transform).toBe('perspective(1200px) rotateY(4deg)');
    expect(right.transformOrigin).toBe('left center');
  });
});

describe('FORGE_LAB_HUB flag', () => {
  it('defaults off so the working HTML dashboard is unchanged', () => {
    expect(FEATURE_FLAGS.FORGE_LAB_HUB).toBe(false);
  });
});

describe('Forge Lab catalog', () => {
  it('builds 11 labs from canonical config', () => {
    const labs = buildLabRows([{ labId: 1, percent: 80 }]);
    expect(labs).toHaveLength(11);
    expect(labs[0].progress).toBe(80);
    expect(labs[1].progress).toBe(0);
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
});
