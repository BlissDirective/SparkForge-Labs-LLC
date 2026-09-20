import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_HOLD_MS } from '@/lib/forge-hub/portalMachine';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';
import {
  CAMERA_MICRO_DOLLY,
  DIRECTOR_LIVE_IDS,
  DIRECTOR_RM_MS,
  GAME_LAUNCH_BURST_MS,
  INTERACTIVE_CAP_MS,
  LAYOUT_MORPH_MS,
  getForgeDirector,
  loadTheatreBeat,
  peekDirectorClock,
  resetForgeDirector,
} from '@/lib/forge-hub/director';
import {
  GAME_LAUNCH_BURST_SEEN_KEY,
  clearBurstSeen,
} from '@/lib/forge-hub/gameLaunchBurst';
import * as stings from '@/lib/forge-hub/director/stings';
import { vi } from 'vitest';

const SCENE_DEFAULTS = useSceneStore.getState();
const STATIONS = [0, 0.2, 0.5, 0.8, 1] as const;

beforeEach(() => {
  resetForgeDirector();
  clearBurstSeen();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

afterEach(() => {
  resetForgeDirector();
  clearBurstSeen();
  vi.restoreAllMocks();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

async function flushFollowOn(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('Director game-launch-burst Theatre follow-on', () => {
  it('registers the authored beat without level-up / outfit-swap', () => {
    const beat = loadTheatreBeat('game-launch-burst');
    expect(beat.status).toBe('authored');
    expect(DIRECTOR_LIVE_IDS).toContain('game-launch-burst');
    expect(DIRECTOR_LIVE_IDS).not.toContain('level-up');
    expect(DIRECTOR_LIVE_IDS).not.toContain('outfit-swap');
  });

  it('plays the authored cheer at 1500ms without portal 420/560', () => {
    const director = getForgeDirector();
    director.play('game-launch-burst', {
      paused: true,
      reducedMotion: false,
    });
    expect(Math.abs(director.durationMs() - GAME_LAUNCH_BURST_MS)).toBeLessThanOrEqual(
      2,
    );
    expect(director.durationMs()).toBeLessThanOrEqual(1500);
    expect(director.durationMs()).not.toBe(
      PORTAL_HOLD_MS.charge + PORTAL_HOLD_MS.emit,
    );
    expect(useForgeStore.getState().forge.mode).toBe('playStage');
    expect(useForgeStore.getState().forge.portalPhase).toBe('idle');
    expect(LAYOUT_MORPH_MS).toBe(420);
    expect(PORTAL_HOLD_MS).toEqual({ charge: 420, emit: 560 });
  });

  it('scrubs cheer tracks onto PlayStage without un-merging', () => {
    const director = getForgeDirector();
    director.play('game-launch-burst', {
      paused: true,
      reducedMotion: false,
    });

    director.scrub(0);
    expect(useForgeStore.getState().forge.mode).toBe('playStage');
    expect(peekDirectorClock().appearScale).toBeCloseTo(1, 5);
    expect(peekDirectorClock().contentIn).toBeCloseTo(1, 5);
    expect(peekDirectorClock().roomDim).toBeCloseTo(1, 5);
    expect(peekDirectorClock().holoC).toMatchObject({
      left: 15,
      width: 70,
    });

    for (const p of STATIONS) {
      director.scrub(p);
      expect(director.progress()).toBeCloseTo(p, 5);
      expect(
        Math.abs(peekDirectorClock().cameraDollyPercent),
      ).toBeLessThanOrEqual(CAMERA_MICRO_DOLLY + 1e-9);
      expect(useForgeStore.getState().forge.portalPhase).toBe('idle');
      expect(useForgeStore.getState().forge.mode).toBe('playStage');
      expect(peekDirectorClock().roomDim).toBeCloseTo(1, 4);
    }

    director.scrub(200 / GAME_LAUNCH_BURST_MS);
    expect(peekDirectorClock().sparkyHop).toBeGreaterThan(0.5);
    expect(useForgeStore.getState().forge.sparky.behaviour).toBe('react');

    director.scrub(0.2);
    expect(peekDirectorClock().sparkyPing).toBeGreaterThan(0.5);

    director.scrub(1);
    expect(peekDirectorClock().bloom).toBeCloseTo(0, 4);
    expect(peekDirectorClock().cameraDollyPercent).toBeCloseTo(0, 4);
    expect(peekDirectorClock().sparkyHop).toBeCloseTo(0, 4);
    expect(useForgeStore.getState().forge.mode).toBe('playStage');
    expect(useForgeStore.getState().forge.sparky.spot).toBe('rightLip');
  });

  it('skip lands the merged end pose and does not un-merge', () => {
    const director = getForgeDirector();
    director.play('game-launch-burst', {
      paused: true,
      reducedMotion: false,
    });
    director.scrub(0.3);
    director.skip();
    expect(director.progress()).toBe(1);
    expect(useForgeStore.getState().forge.mode).toBe('playStage');
    expect(useForgeStore.getState().forge.portalPhase).toBe('idle');
    expect(peekDirectorClock().roomDim).toBeCloseTo(1, 4);
    expect(peekDirectorClock().cameraDollyPercent).toBeCloseTo(0, 4);
    expect(useForgeStore.getState().forge.sparky.behaviour).toBe('attend');
  });

  it('RM skips the cinematic (0ms, no 1500ms, no sting)', () => {
    const sting = vi.spyOn(stings, 'playForgeSting');
    const director = getForgeDirector();
    director.play('game-launch-burst', {
      paused: true,
      reducedMotion: true,
    });
    expect(director.durationMs()).toBe(0);
    expect(director.durationMs()).not.toBe(GAME_LAUNCH_BURST_MS);
    expect(director.durationMs()).toBeLessThan(DIRECTOR_RM_MS);
    expect(useForgeStore.getState().forge.mode).toBe('playStage');
    expect(peekDirectorClock().bloom).toBe(0);
    expect(peekDirectorClock().sparkyHop).toBe(0);
    expect(peekDirectorClock().roomDim).toBe(1);
    director.scrub(1);
    expect(sting).not.toHaveBeenCalled();
  });

  it('does not follow-on when the merge is paused/scrubbed', async () => {
    const director = getForgeDirector();
    director.play('lobby-playstage-merge', {
      paused: true,
      reducedMotion: false,
    });
    expect(director.durationMs()).toBeLessThanOrEqual(INTERACTIVE_CAP_MS);
    director.scrub(1);
    await flushFollowOn();
    expect(director.activeId()).toBe('lobby-playstage-merge');
    expect(useForgeStore.getState().forge.mode).toBe('playStage');
    expect(useForgeStore.getState().forge.portalPhase).toBe('idle');
  });

  it('follows on the first live merge of the session', async () => {
    const director = getForgeDirector();
    director.play('lobby-playstage-merge', { reducedMotion: false });
    director.scrub(1);
    await flushFollowOn();
    expect(director.activeId()).toBe('game-launch-burst');
    expect(director.durationMs()).toBe(GAME_LAUNCH_BURST_MS);
    expect(useForgeStore.getState().forge.mode).toBe('playStage');
    expect(useForgeStore.getState().forge.portalPhase).toBe('idle');
    expect(peekDirectorClock().roomDim).toBeCloseTo(1, 4);
    expect(sessionStorage.getItem(GAME_LAUNCH_BURST_SEEN_KEY)).toBe('1');
  });

  it('does not follow-on a second merge in the same session', async () => {
    const director = getForgeDirector();
    director.play('lobby-playstage-merge', { reducedMotion: false });
    director.scrub(1);
    await flushFollowOn();
    expect(director.activeId()).toBe('game-launch-burst');

    director.play('lobby-playstage-merge', { reducedMotion: false });
    director.scrub(1);
    await flushFollowOn();
    expect(director.activeId()).toBe('lobby-playstage-merge');
    expect(director.durationMs()).toBeLessThanOrEqual(INTERACTIVE_CAP_MS);
  });

  it('does not follow-on after an RM merge', async () => {
    const director = getForgeDirector();
    director.play('lobby-playstage-merge', { reducedMotion: true });
    director.scrub(1);
    await flushFollowOn();
    expect(director.activeId()).toBe('lobby-playstage-merge');
    expect(director.durationMs()).toBe(DIRECTOR_RM_MS);
    expect(useForgeStore.getState().forge.mode).toBe('playStage');
  });
});
