import { describe, expect, it } from 'vitest';
import {
  armFirstVisitIgnition,
  isForgeHubProductionEnabled,
} from '@/lib/forge-hub/firstVisitIgnition';
import { HUBSPLIT_HOLO_C, LAYOUT_MORPH_MS } from '@/lib/forge-hub/layouts';
import { PORTAL_HOLD_MS } from '@/lib/forge-hub/portalMachine';

const base = {
  pathname: '/dev/forge-hub',
  routeKind: 'bridge' as const,
  poseLock: false,
  flatOverlay: false,
  skipIntro: false,
  reducedMotion: false,
  ignitionQuery: true,
  seen: false,
  forgeHubEnabled: false,
};

describe('first-visit-ignition Stagehand tip arm', () => {
  it('plays on the lab when ?ignition=1', () => {
    expect(armFirstVisitIgnition(base)).toEqual({
      kind: 'play',
      reducedMotion: false,
    });
  });

  it('uses the RM substitute when reduced-motion is on', () => {
    expect(
      armFirstVisitIgnition({ ...base, reducedMotion: true }),
    ).toEqual({ kind: 'play', reducedMotion: true });
  });

  it('holds on EscapeFlat / FLAT / pose lock', () => {
    expect(armFirstVisitIgnition({ ...base, poseLock: true }).kind).toBe(
      'hold',
    );
    expect(armFirstVisitIgnition({ ...base, flatOverlay: true }).kind).toBe(
      'hold',
    );
    expect(
      armFirstVisitIgnition({ ...base, routeKind: 'flat' }).kind,
    ).toBe('hold');
  });

  it('skip-hero and returning visitors land welcome-idle', () => {
    expect(armFirstVisitIgnition({ ...base, skipIntro: true }).kind).toBe(
      'welcome-idle',
    );
    expect(armFirstVisitIgnition({ ...base, seen: true }).kind).toBe(
      'welcome-idle',
    );
  });

  it('gates production / and /login until FORGE_HUB', () => {
    expect(
      armFirstVisitIgnition({
        ...base,
        pathname: '/',
        routeKind: 'stage',
        ignitionQuery: false,
        forgeHubEnabled: false,
      }).kind,
    ).toBe('hold');
    expect(
      armFirstVisitIgnition({
        ...base,
        pathname: '/login',
        routeKind: 'stage',
        ignitionQuery: false,
        forgeHubEnabled: true,
      }),
    ).toEqual({ kind: 'play', reducedMotion: false });
    expect(isForgeHubProductionEnabled({})).toBe(false);
    expect(isForgeHubProductionEnabled({ NEXT_PUBLIC_FORGE_HUB: '1' })).toBe(
      true,
    );
  });

  it('does not hold the lab HUD path without ?ignition=1', () => {
    expect(
      armFirstVisitIgnition({ ...base, ignitionQuery: false }).kind,
    ).toBe('hold');
  });

  it('does not retouch Stagehand HoloC or portal holds', () => {
    expect(HUBSPLIT_HOLO_C).toMatchObject({
      left: 37,
      top: 13.5,
      width: 26,
      height: 49,
    });
    expect(LAYOUT_MORPH_MS).toBe(420);
    expect(PORTAL_HOLD_MS).toEqual({ charge: 420, emit: 560 });
  });
});
