import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';
import * as theatre from '@/lib/forge-hub/director/theatrePlayer';
import * as stings from '@/lib/forge-hub/director/stings';
import {
  DIRECTOR_RM_MS,
  EMIT_BURST_MS,
  FIRST_VISIT_IGNITION_MS,
  HUBSPLIT_HOLO_C,
  getForgeDirector,
  isDirectorRmCrossfade,
  peekDirectorClock,
  playForgeSting,
  resetForgeDirector,
} from '@/lib/forge-hub/director';

const SCENE_DEFAULTS = useSceneStore.getState();

beforeEach(() => {
  resetForgeDirector();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

afterEach(() => {
  resetForgeDirector();
  vi.restoreAllMocks();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

describe('W2-04 Director reduced-motion substitutes', () => {
  it('caps every live RM timeline at 200ms except welcome-idle', () => {
    const director = getForgeDirector();
    for (const id of [
      'emit-burst',
      'login-success-hubsplit',
      'first-visit-ignition',
    ] as const) {
      director.play(id, { paused: true, reducedMotion: true });
      expect(director.durationMs()).toBe(DIRECTOR_RM_MS);
      expect(director.durationMs()).toBeLessThan(EMIT_BURST_MS);
      expect(isDirectorRmCrossfade(peekDirectorClock())).toBe(true);
    }
    director.play('welcome-idle', { paused: true, reducedMotion: true });
    expect(director.durationMs()).toBe(0);
    expect(peekDirectorClock().freezeBreathe).toBe(true);
  });

  it('keeps emit-burst docked for the whole 200ms (no charge/emit, no hop/bloom)', () => {
    const director = getForgeDirector();
    director.play('emit-burst', { paused: true, reducedMotion: true });
    expect(useForgeStore.getState().forge.portalPhase).toBe('docked');
    expect(director.durationMs()).not.toBe(EMIT_BURST_MS);

    for (const p of [0, 0.2, 0.5, 0.8, 1] as const) {
      director.scrub(p);
      expect(useForgeStore.getState().forge.portalPhase).toBe('docked');
      expect(peekDirectorClock().sparkyHop).toBe(0);
      expect(peekDirectorClock().bloom).toBe(0);
      expect(peekDirectorClock().beams).toBe(0);
      expect(peekDirectorClock().cameraDollyPercent).toBe(0);
      expect(peekDirectorClock().reducedMotionCrossfade).toBeCloseTo(p, 5);
    }
    expect(peekDirectorClock().contentIn).toBeCloseTo(1, 4);
    expect(peekDirectorClock().contentOut).toBeCloseTo(0, 4);
  });

  it('skip on RM emit-burst stays SKIP_TO_DOCKED and finishes the fade', () => {
    const director = getForgeDirector();
    director.play('emit-burst', { paused: true, reducedMotion: true });
    director.scrub(0.3);
    director.skip();
    expect(useForgeStore.getState().forge.portalPhase).toBe('docked');
    expect(director.progress()).toBe(1);
    expect(peekDirectorClock().reducedMotionCrossfade).toBe(1);
    expect(peekDirectorClock().contentIn).toBe(1);
  });

  it('snaps login-success pose at t=0 and crossfades content over 200ms', () => {
    const director = getForgeDirector();
    director.play('login-success-hubsplit', {
      paused: true,
      reducedMotion: true,
    });
    expect(director.durationMs()).toBe(DIRECTOR_RM_MS);
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');
    expect(peekDirectorClock().holoLScale).toBe(1);
    expect(peekDirectorClock().holoRScale).toBe(1);
    expect(peekDirectorClock().holoC).toMatchObject(HUBSPLIT_HOLO_C);
    expect(peekDirectorClock().layoutT).toBe(1);
    expect(peekDirectorClock().contentIn).toBeCloseTo(0, 5);
    expect(peekDirectorClock().contentOut).toBeCloseTo(1, 5);
    expect(peekDirectorClock().bloom).toBe(0);
    expect(peekDirectorClock().beams).toBe(0);
    expect(peekDirectorClock().sparkyPing).toBe(0);

    director.scrub(0.5);
    expect(peekDirectorClock().contentIn).toBeCloseTo(0.5, 5);
    expect(peekDirectorClock().contentOut).toBeCloseTo(0.5, 5);
    expect(peekDirectorClock().holoC).toMatchObject(HUBSPLIT_HOLO_C);

    director.scrub(1);
    expect(peekDirectorClock().contentIn).toBeCloseTo(1, 4);
    expect(peekDirectorClock().contentOut).toBeCloseTo(0, 4);
    expect(peekDirectorClock().freezeBreathe).toBe(true);
  });

  it('skips the Theatre ignition cinematic (no 1500ms, no bloom/dolly/sting)', () => {
    const loadBeat = vi.spyOn(theatre, 'loadTheatreBeat');
    const sting = vi.spyOn(stings, 'playForgeSting');
    const director = getForgeDirector();
    director.play('first-visit-ignition', {
      paused: true,
      reducedMotion: true,
    });
    expect(loadBeat).not.toHaveBeenCalled();
    expect(director.durationMs()).toBe(DIRECTOR_RM_MS);
    expect(director.durationMs()).not.toBe(FIRST_VISIT_IGNITION_MS);
    expect(useForgeStore.getState().forge.mode).toBe('welcome');
    expect(peekDirectorClock().appearScale).toBe(1);
    expect(peekDirectorClock().bloom).toBe(0);
    expect(peekDirectorClock().cameraDollyPercent).toBe(0);

    director.scrub(1);
    expect(sting).not.toHaveBeenCalled();
    expect(useForgeStore.getState().forge.mode).toBe('welcome');
    expect(director.activeId()).toBe('welcome-idle');
  });

  it('skip on RM first-visit-ignition lands welcome-idle', () => {
    const director = getForgeDirector();
    director.play('first-visit-ignition', {
      paused: true,
      reducedMotion: true,
    });
    director.skip();
    expect(director.activeId()).toBe('welcome-idle');
    expect(useForgeStore.getState().forge.mode).toBe('welcome');
    expect(peekDirectorClock().freezeBreathe).toBe(true);
  });

  it('does not play stings on any RM substitute', () => {
    const sting = vi.spyOn(stings, 'playForgeSting');
    const director = getForgeDirector();
    director.play('emit-burst', { paused: true, reducedMotion: true });
    director.scrub(1);
    director.play('login-success-hubsplit', {
      paused: true,
      reducedMotion: true,
    });
    director.scrub(1);
    director.play('first-visit-ignition', {
      paused: true,
      reducedMotion: true,
    });
    director.scrub(1);
    expect(sting).not.toHaveBeenCalled();
    expect(playForgeSting('sting.emitBurst', { reducedMotion: true })).toBe(
      false,
    );
  });
});
