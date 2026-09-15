import { describe, expect, it } from 'vitest';
import {
  FORGE_CORE,
  PEDESTAL,
  PLATE_ASPECT_RATIO,
  PLATE_HEIGHT_PX,
  PLATE_WIDTH_PX,
  isPercentCircle,
  isPercentRect,
  plateXToUnit,
} from '@/lib/forge-hub/coreMap';
import { FORGE_HUB_CORE_PORTAL } from '@/config/forgeHub';

describe('W1-02 CorePortal plate math (PR #164 frozen map)', () => {
  it('locks the plate to 1536×1024', () => {
    expect(PLATE_WIDTH_PX).toBe(1536);
    expect(PLATE_HEIGHT_PX).toBe(1024);
    expect(PLATE_ASPECT_RATIO).toBeCloseTo(1536 / 1024, 10);
  });

  it('keeps the frozen FORGE_CORE circle', () => {
    expect(FORGE_CORE).toEqual({ cx: 50, cy: 49.2, r: 9.4 });
    expect(isPercentCircle(FORGE_CORE)).toBe(true);
    expect(plateXToUnit(FORGE_CORE.cx)).toBe(0);
  });

  it('keeps the frozen PEDESTAL rect', () => {
    expect(PEDESTAL).toEqual({
      left: 36.5,
      top: 70.5,
      width: 27,
      height: 18.5,
      yaw: 0,
    });
    expect(isPercentRect(PEDESTAL)).toBe(true);
  });

  it('seats CorePortal on the desk origin (cx=50)', () => {
    expect(FORGE_HUB_CORE_PORTAL.position[0]).toBe(0);
    expect(FORGE_HUB_CORE_PORTAL.radius).toBeGreaterThan(0);
    expect(FORGE_HUB_CORE_PORTAL.radius).toBeLessThan(1.62);
  });
});
