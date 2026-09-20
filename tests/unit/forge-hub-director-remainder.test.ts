import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';
import {
  CAMERA_MICRO_DOLLY,
  DIRECTOR_LIVE_IDS,
  DIRECTOR_REMAINDER_IDS,
  DIRECTOR_RM_MS,
  HUBSPLIT_HOLO_C,
  INTERACTIVE_CAP_MS,
  INTERACTIVE_MORPH_MS,
  LAYOUT_MORPH_MS,
  SPLIT_SLAB_WINDOW_MS,
  getForgeDirector,
  isDirectorLiveId,
  peekDirectorClock,
  registerMorphTargets,
  resetForgeDirector,
} from '@/lib/forge-hub/director';
import { directorIdForModeChange } from '@/lib/forge-hub/devHud';
import * as stings from '@/lib/forge-hub/director/stings';
import { vi } from 'vitest';

const SCENE_DEFAULTS = useSceneStore.getState();
const STATIONS = [0, 0.2, 0.5, 0.8, 1] as const;

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

describe('W2 remainder morph duration caps', () => {
  it('keeps every remainder morph at the 600ms interactive cap', () => {
    const director = getForgeDirector();
    for (const id of DIRECTOR_REMAINDER_IDS) {
      director.play(id, { paused: true, reducedMotion: false });
      expect(Math.abs(director.durationMs() - INTERACTIVE_MORPH_MS)).toBeLessThanOrEqual(
        2,
      );
      expect(director.durationMs()).toBeLessThanOrEqual(INTERACTIVE_CAP_MS);
      expect(Math.abs(peekDirectorClock().cameraDollyPercent)).toBeLessThanOrEqual(
        CAMERA_MICRO_DOLLY + 1e-9,
      );
    }
    expect(LAYOUT_MORPH_MS).toBe(420);
    expect(SPLIT_SLAB_WINDOW_MS).toBe(340);
    expect(SPLIT_SLAB_WINDOW_MS).not.toBe(LAYOUT_MORPH_MS);
  });

  it('does not register Theatre level-up / outfit-swap', () => {
    const director = getForgeDirector();
    expect(DIRECTOR_LIVE_IDS).not.toContain('level-up');
    expect(DIRECTOR_LIVE_IDS).not.toContain('outfit-swap');
    expect(() =>
      director.play('level-up', { paused: true, reducedMotion: false }),
    ).toThrow(/not a live MOTION_BIBLE id/);
  });
});

describe('W2 remainder reduced-motion 200ms', () => {
  it('crossfades every remainder id in 200ms and skips stings / charge', () => {
    const sting = vi.spyOn(stings, 'playForgeSting');
    const director = getForgeDirector();
    for (const id of DIRECTOR_REMAINDER_IDS) {
      director.play(id, { paused: true, reducedMotion: true });
      expect(director.durationMs()).toBe(DIRECTOR_RM_MS);
      expect(peekDirectorClock().bloom).toBe(0);
      expect(peekDirectorClock().beams).toBe(0);
      expect(peekDirectorClock().sparkyHop).toBe(0);
      director.scrub(1);
    }
    expect(sting).not.toHaveBeenCalled();
  });

  it('snaps hub-labsbrowse onto labsBrowse HoloC and hub reverse onto live seat', () => {
    const director = getForgeDirector();
    director.play('hub-labsbrowse', { paused: true, reducedMotion: true });
    expect(useForgeStore.getState().forge.mode).toBe('labsBrowse');
    const labs = registerMorphTargets('labsBrowse').holoC;
    expect(peekDirectorClock().holoC).toMatchObject({
      left: labs.left,
      width: labs.width,
    });

    director.play('labsbrowse-hub', { paused: true, reducedMotion: true });
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');
    expect(peekDirectorClock().holoC).toMatchObject(HUBSPLIT_HOLO_C);
  });
});

describe('W2 remainder scrub stations', () => {
  it('scrubs hub-labsbrowse at 0 / 0.2 / 0.5 / 0.8 / 1 onto the labs bench', () => {
    const director = getForgeDirector();
    director.play('hub-labsbrowse', { paused: true, reducedMotion: false });
    const labs = registerMorphTargets('labsBrowse');

    director.scrub(0);
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');
    expect(peekDirectorClock().holoC).toMatchObject(HUBSPLIT_HOLO_C);
    expect(peekDirectorClock().contentOut).toBeCloseTo(1, 5);
    expect(peekDirectorClock().layoutT).toBeCloseTo(0, 5);

    for (const p of STATIONS) {
      director.scrub(p);
      expect(director.progress()).toBeCloseTo(p, 5);
      expect(
        Math.abs(peekDirectorClock().cameraDollyPercent),
      ).toBeLessThanOrEqual(CAMERA_MICRO_DOLLY + 1e-9);
    }

    director.scrub(1);
    expect(peekDirectorClock().layoutT).toBeCloseTo(1, 4);
    expect(peekDirectorClock().holoC.left).toBeCloseTo(labs.holoC.left, 4);
    expect(peekDirectorClock().holoC.width).toBeCloseTo(labs.holoC.width, 4);
    expect(peekDirectorClock().contentIn).toBeCloseTo(1, 4);
    expect(useForgeStore.getState().forge.mode).toBe('labsBrowse');
    expect(useForgeStore.getState().forge.sparky.spot).toBe('leftLip');
  });

  it('mirrors labsbrowse-hub back to the HoloC live seat', () => {
    const director = getForgeDirector();
    director.play('labsbrowse-hub', { paused: true, reducedMotion: false });
    director.scrub(0);
    expect(useForgeStore.getState().forge.mode).toBe('labsBrowse');
    director.scrub(1);
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');
    expect(peekDirectorClock().holoC).toMatchObject(HUBSPLIT_HOLO_C);
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
  });

  it('scrubs focus-in yawTuck and focus-out back to previousMode', () => {
    useForgeStore.getState().applyForgeRoute({ mode: 'labsBrowse' });
    const director = getForgeDirector();
    director.play('focus-in', { paused: true, reducedMotion: false });
    director.scrub(0);
    expect(useForgeStore.getState().forge.mode).toBe('labsBrowse');
    director.scrub(1);
    expect(useForgeStore.getState().forge.mode).toBe('focus');
    expect(peekDirectorClock().holoL.yaw).toBeCloseTo(-8, 4);
    expect(peekDirectorClock().holoR.yaw).toBeCloseTo(8, 4);
    expect(peekDirectorClock().holoC.yaw).toBeCloseTo(0, 4);

    director.play('focus-out', { paused: true, reducedMotion: false });
    director.scrub(1);
    expect(useForgeStore.getState().forge.mode).toBe('labsBrowse');
  });

  it('scrubs dual-enter two-mid + C strip and dual-exit to hubSplit default', () => {
    const director = getForgeDirector();
    director.play('dual-enter', { paused: true, reducedMotion: false });
    director.scrub(1);
    const dual = registerMorphTargets('dual');
    expect(useForgeStore.getState().forge.mode).toBe('dual');
    expect(peekDirectorClock().holoC).toMatchObject({
      left: dual.holoC.left,
      top: dual.holoC.top,
      width: dual.holoC.width,
      height: dual.holoC.height,
    });
    expect(useForgeStore.getState().forge.sparky.spot).toBe('frontCenter');

    director.play('dual-exit', { paused: true, reducedMotion: false });
    director.scrub(1);
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');
    expect(peekDirectorClock().holoC).toMatchObject(HUBSPLIT_HOLO_C);
  });

  it('merges gameLobby → playStage without nesting emit-burst 420/560', () => {
    const director = getForgeDirector();
    director.play('lobby-playstage-merge', {
      paused: true,
      reducedMotion: false,
    });
    expect(director.durationMs()).toBeLessThan(980);
    director.scrub(0);
    expect(useForgeStore.getState().forge.mode).toBe('gameLobby');
    expect(useForgeStore.getState().forge.portalPhase).toBe('idle');
    expect(peekDirectorClock().roomDim).toBeCloseTo(0, 5);

    director.scrub(1);
    expect(useForgeStore.getState().forge.mode).toBe('playStage');
    expect(useForgeStore.getState().forge.portalPhase).toBe('idle');
    expect(peekDirectorClock().roomDim).toBeCloseTo(1, 4);
    expect(peekDirectorClock().holoC).toMatchObject({
      left: 15,
      width: 70,
      yaw: 0,
    });
    const live = registerMorphTargets('playStage');
    expect(live.holoL.visible).toBe(false);
    expect(peekDirectorClock().layoutT).toBeCloseTo(1, 4);
  });

  it('splits playStage → gameLobby on the 340ms slab window', () => {
    const director = getForgeDirector();
    director.play('playstage-lobby-split', {
      paused: true,
      reducedMotion: false,
    });
    director.scrub(0);
    expect(useForgeStore.getState().forge.mode).toBe('playStage');
    expect(peekDirectorClock().roomDim).toBeCloseTo(1, 5);
    expect(peekDirectorClock().layoutT).toBeCloseTo(0, 5);

    director.scrub(1);
    expect(useForgeStore.getState().forge.mode).toBe('gameLobby');
    expect(peekDirectorClock().roomDim).toBeCloseTo(0, 4);
    expect(peekDirectorClock().holoL.width).toBeGreaterThan(10);
  });

  it('expands and closes Whisper without changing ForgeRouteMode', () => {
    const director = getForgeDirector();
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');
    director.play('whisper-expand', { paused: true, reducedMotion: false });
    director.scrub(0);
    expect(peekDirectorClock().bubbleScale).toBeCloseTo(0, 5);
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');

    director.scrub(1);
    expect(peekDirectorClock().bubbleScale).toBeCloseTo(1, 4);
    expect(peekDirectorClock().roomDim).toBeCloseTo(1, 4);
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('whisper');
    expect(useForgeStore.getState().forge.sparky.spot).toBe('frontCenter');
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');

    director.play('whisper-close', { paused: true, reducedMotion: false });
    director.scrub(1);
    expect(peekDirectorClock().bubbleScale).toBeCloseTo(0, 4);
    expect(peekDirectorClock().roomDim).toBeCloseTo(0, 4);
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('hidden');
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');
  });
});

describe('W2 remainder overwrite + HUD helpers', () => {
  it('overwrite kills the previous remainder timeline', () => {
    const director = getForgeDirector();
    director.play('hub-labsbrowse', { paused: true, reducedMotion: false });
    director.scrub(0.4);
    director.play('focus-in', { paused: true, reducedMotion: false });
    expect(director.activeId()).toBe('focus-in');
    expect(isDirectorLiveId('focus-in')).toBe(true);
  });

  it('maps remainder mode hops without stealing hubSplit → playStage', () => {
    expect(directorIdForModeChange('hubSplit', 'labsBrowse')).toBe(
      'hub-labsbrowse',
    );
    expect(directorIdForModeChange('labsBrowse', 'hubSplit')).toBe(
      'labsbrowse-hub',
    );
    expect(directorIdForModeChange('gameLobby', 'playStage')).toBe(
      'lobby-playstage-merge',
    );
    expect(directorIdForModeChange('playStage', 'gameLobby')).toBe(
      'playstage-lobby-split',
    );
    expect(directorIdForModeChange('hubSplit', 'focus')).toBe('focus-in');
    expect(directorIdForModeChange('focus', 'labsBrowse')).toBe('focus-out');
    expect(directorIdForModeChange('hubSplit', 'dual')).toBe('dual-enter');
    expect(directorIdForModeChange('dual', 'hubSplit')).toBe('dual-exit');
    expect(directorIdForModeChange('hubSplit', 'playStage')).toBeNull();
    expect(directorIdForModeChange('hubSplit', 'flat')).toBeNull();
  });
});
