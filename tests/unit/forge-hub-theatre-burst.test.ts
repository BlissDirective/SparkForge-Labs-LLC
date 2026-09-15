import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CAMERA_MICRO_DOLLY,
  GAME_LAUNCH_BURST_MS,
} from '@/lib/forge-hub/director';
import {
  loadTheatreBeat,
  maybeLoadForgeTheatreStudio,
  sampleGameLaunchBurst,
  sampleTrack,
} from '@/lib/forge-hub/director/theatrePlayer';
import { PORTAL_HOLD_MS } from '@/lib/forge-hub/portalMachine';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('W2 Theatre game-launch-burst JSON', () => {
  it('is an authored Theatre beat at 1500ms that does not nest portal 420/560', () => {
    const beat = loadTheatreBeat('game-launch-burst');
    expect(beat.status).toBe('authored');
    expect(beat.runtime).toBe('theatre.js');
    expect(beat.durationMs).toBe(GAME_LAUNCH_BURST_MS);
    expect(beat.durationMs).toBeLessThanOrEqual(1500);
    expect(beat.skipTo).toBe('game-launch-burst');
    expect(beat.stingAtMs).toBe(200);
    expect(beat.theatreState).toBeTruthy();
    expect(beat.notes).not.toMatch(/charge 420/);
    expect(beat.tracks?.bloom?.some((k) => k.t === 420)).toBe(false);
    expect(beat.tracks?.bloom?.some((k) => k.t === 560)).toBe(false);
    expect(PORTAL_HOLD_MS).toEqual({ charge: 420, emit: 560 });
  });

  it('samples cheer bloom / dolly / hop without emptying the merged stage', () => {
    const t0 = sampleGameLaunchBurst(0);
    expect(t0.bloom).toBe(0);
    expect(t0.appearScale).toBe(1);
    expect(t0.contentOut).toBe(0);
    expect(t0.contentIn).toBe(1);
    expect(t0.sparkyPing).toBe(0);
    expect(t0.sparkyHop).toBe(0);
    expect(t0.sting).toBe(false);

    const t200 = sampleGameLaunchBurst(200);
    expect(t200.cameraDollyPercent).toBeCloseTo(CAMERA_MICRO_DOLLY, 5);
    expect(t200.sparkyHop).toBeCloseTo(1, 5);
    expect(t200.sting).toBe(true);

    const t250 = sampleGameLaunchBurst(250);
    expect(t250.sparkyPing).toBeCloseTo(1, 5);

    const t1500 = sampleGameLaunchBurst(1500);
    expect(t1500.bloom).toBeCloseTo(0, 5);
    expect(t1500.cameraDollyPercent).toBeCloseTo(0, 5);
    expect(t1500.sparkyPing).toBeCloseTo(0, 5);
    expect(t1500.sparkyHop).toBeCloseTo(0, 5);
    expect(t1500.appearScale).toBe(1);
    expect(t1500.contentIn).toBe(1);
    expect(Math.abs(t1500.cameraDollyPercent)).toBeLessThanOrEqual(
      CAMERA_MICRO_DOLLY,
    );
  });

  it('lerps sparse keyframes', () => {
    expect(sampleTrack([{ t: 0, v: 0 }, { t: 100, v: 1 }], 50)).toBeCloseTo(
      0.5,
      5,
    );
  });

  it('does not load Studio unless ?studio=1 in development', async () => {
    await expect(maybeLoadForgeTheatreStudio(false)).resolves.toBe('skipped');
    const prev = process.env.NODE_ENV;
    vi.stubEnv('NODE_ENV', 'production');
    await expect(maybeLoadForgeTheatreStudio(true)).resolves.toBe('skipped');
    vi.stubEnv('NODE_ENV', prev ?? 'test');
  });
});
