import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CAMERA_MICRO_DOLLY,
  FIRST_VISIT_IGNITION_MS,
} from '@/lib/forge-hub/director';
import {
  loadTheatreBeat,
  maybeLoadForgeTheatreStudio,
  sampleFirstVisitIgnition,
  sampleTrack,
} from '@/lib/forge-hub/director/theatrePlayer';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('W2 Theatre first-visit-ignition JSON', () => {
  it('is an authored Theatre beat that skips to welcome-idle in 1500ms', () => {
    const beat = loadTheatreBeat('first-visit-ignition');
    expect(beat.status).toBe('authored');
    expect(beat.runtime).toBe('theatre.js');
    expect(beat.durationMs).toBe(FIRST_VISIT_IGNITION_MS);
    expect(beat.skipTo).toBe('welcome-idle');
    expect(beat.stingAtMs).toBe(1400);
    expect(beat.theatreState).toBeTruthy();
  });

  it('samples MOTION_BIBLE windows onto bloom / dolly / settle / wipe', () => {
    const t0 = sampleFirstVisitIgnition(0);
    expect(t0.bloom).toBe(0);
    expect(t0.appearScale).toBe(0);
    expect(t0.contentOut).toBe(1);
    expect(t0.contentIn).toBe(0);
    expect(t0.sting).toBe(false);

    const t300 = sampleFirstVisitIgnition(300);
    expect(t300.cameraDollyPercent).toBeCloseTo(CAMERA_MICRO_DOLLY, 5);
    expect(t300.appearScale).toBe(0);

    const t450 = sampleFirstVisitIgnition(450);
    expect(t450.bloom).toBeCloseTo(1, 5);

    const t1100 = sampleFirstVisitIgnition(1100);
    expect(t1100.appearScale).toBeCloseTo(1, 5);
    expect(t1100.contentIn).toBeCloseTo(1, 5);
    expect(t1100.contentOut).toBeCloseTo(0, 5);

    const t1400 = sampleFirstVisitIgnition(1400);
    expect(t1400.sting).toBe(true);

    const t1500 = sampleFirstVisitIgnition(1500);
    expect(t1500.bloom).toBeCloseTo(0, 5);
    expect(t1500.cameraDollyPercent).toBeCloseTo(0, 5);
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
