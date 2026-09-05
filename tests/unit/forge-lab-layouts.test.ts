import { describe, expect, it } from 'vitest';
import {
  AUTH_MERGED_CENTER,
  FORGE_LAYOUTS,
  beamAttachPoint,
  beamSlotsForState,
  liveBeams,
  morphWingRect,
  rectCentroid,
  resolvedSlots,
} from '@/lib/forge-lab/layouts';
import {
  FORGE_CORE,
  LEFT_HOLO_SLOT,
  RIGHT_HOLO_SLOT,
  TOP_MONITOR_GLASS,
} from '@/lib/forge-lab/hotspotMap';

describe('ForgeLayout registry', () => {
  it('registers hubSplit and authMerged slot maps', () => {
    expect(FORGE_LAYOUTS.hubSplit.slots.left).toEqual(LEFT_HOLO_SLOT);
    expect(FORGE_LAYOUTS.hubSplit.slots.right).toEqual(RIGHT_HOLO_SLOT);
    expect(FORGE_LAYOUTS.hubSplit.slots.top).toEqual(TOP_MONITOR_GLASS);
    expect(FORGE_LAYOUTS.authMerged.slots.center).toEqual(AUTH_MERGED_CENTER);
    expect(AUTH_MERGED_CENTER).toMatchObject({ left: 20, width: 60, yaw: 0 });
  });

  it('morphs L+R toward the wide center glass', () => {
    expect(morphWingRect('left', 0)).toMatchObject(LEFT_HOLO_SLOT);
    expect(morphWingRect('right', 1)).toMatchObject(AUTH_MERGED_CENTER);
    const mid = morphWingRect('left', 0.5);
    expect(mid.left).toBeCloseTo((LEFT_HOLO_SLOT.left + AUTH_MERGED_CENTER.left) / 2);
    expect(mid.yaw).toBeCloseTo(-1);
  });

  it('draws beams from the core to live panel attach points', () => {
    const topHit = beamAttachPoint(TOP_MONITOR_GLASS);
    expect(topHit.x).toBeCloseTo(rectCentroid(TOP_MONITOR_GLASS).x);
    expect(topHit.y).toBeCloseTo(TOP_MONITOR_GLASS.top + TOP_MONITOR_GLASS.height);

    const idle = liveBeams(beamSlotsForState(0, false));
    expect(idle.map((b) => b.id)).toEqual(['top']);
    expect(idle[0].fromX).toBe(FORGE_CORE.cx);

    const docked = liveBeams(beamSlotsForState(0, true));
    expect(docked.map((b) => b.id)).toEqual(['top', 'left', 'right']);

    const merged = liveBeams(beamSlotsForState(1, true));
    expect(merged.map((b) => b.id)).toEqual(['top']);
    expect(resolvedSlots(1).merged).toBe(true);
  });
});
