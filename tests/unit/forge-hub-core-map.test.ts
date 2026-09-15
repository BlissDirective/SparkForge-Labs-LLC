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
  it('locks the plate to LOCKED_HUB.jpg 1280×720', () => {
    expect(PLATE_WIDTH_PX).toBe(1280);
    expect(PLATE_HEIGHT_PX).toBe(720);
    expect(PLATE_ASPECT_RATIO).toBeCloseTo(1280 / 720, 10);
  });

  it('seats FORGE_CORE on the bottom-centre emitter disc', () => {
    expect(FORGE_CORE).toEqual({ cx: 50, cy: 78, r: 12 });
    expect(isPercentCircle(FORGE_CORE)).toBe(true);
    expect(plateXToUnit(FORGE_CORE.cx)).toBe(0);
  });

  it('sizes PEDESTAL to the bottom desk platform', () => {
    expect(PEDESTAL).toEqual({
      left: 33,
      top: 70,
      width: 34,
      height: 20,
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
