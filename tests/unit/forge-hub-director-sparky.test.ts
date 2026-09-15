import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SPARKY_SPOT_IDS } from '@/config/sparkySpots';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';
import {
  DIRECTOR_LIVE_IDS,
  DIRECTOR_SPARKY_SEATS,
  getForgeDirector,
  peekDirectorClock,
  resetForgeDirector,
  sparkyCueFor,
} from '@/lib/forge-hub/director';
import type { SparkyCueContext } from '@/lib/forge-hub/director/sparkyReactions';

const SCENE_DEFAULTS = useSceneStore.getState();

const CTX: SparkyCueContext = {
  reducedMotion: false,
  currentSpot: 'nearCore',
  hoveredPanel: null,
  previousMode: 'hubSplit',
  destMode: null,
};

const RM: SparkyCueContext = { ...CTX, reducedMotion: true };

beforeEach(() => {
  resetForgeDirector();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

afterEach(() => {
  resetForgeDirector();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

function spotsOf(id: (typeof DIRECTOR_LIVE_IDS)[number], ctx = CTX) {
  const cue = sparkyCueFor(id, ctx);
  return [cue.start.spot, cue.end.spot];
}

describe('Director Sparky five-seat bind', () => {
  it('locks Director seats to Stagehand SPARKY_SPOT_IDS', () => {
    expect(DIRECTOR_SPARKY_SEATS).toEqual(SPARKY_SPOT_IDS);
    expect(DIRECTOR_SPARKY_SEATS).toEqual([
      'nearCore',
      'leftLip',
      'rightLip',
      'frontCenter',
      'behindCore',
    ]);
  });

  it('maps every live morph onto the five seats only', () => {
    const seen = new Set<string>();
    for (const id of DIRECTOR_LIVE_IDS) {
      for (const spot of spotsOf(id)) {
        expect(SPARKY_SPOT_IDS).toContain(spot);
        if (spot) seen.add(spot);
      }
    }
    expect(seen.has('nearCore')).toBe(true);
    expect(seen.has('leftLip')).toBe(true);
    expect(seen.has('rightLip')).toBe(true);
    expect(seen.has('frontCenter')).toBe(true);
    expect(seen.has('behindCore')).toBe(true);
  });

  it('binds MOTION_BIBLE attend/end seats', () => {
    expect(sparkyCueFor('login-success-hubsplit', CTX).end).toMatchObject({
      spot: 'nearCore',
      reaction: 'wave',
      moving: false,
    });
    expect(sparkyCueFor('hub-labsbrowse', CTX).end).toMatchObject({
      spot: 'leftLip',
      reaction: 'pointL',
    });
    expect(
      sparkyCueFor('hub-labsbrowse', { ...CTX, hoveredPanel: 'holoR' }).end,
    ).toMatchObject({
      spot: 'rightLip',
      reaction: 'pointR',
    });
    expect(sparkyCueFor('labsbrowse-hub', CTX).end.spot).toBe('nearCore');
    expect(sparkyCueFor('whisper-expand', CTX).end).toMatchObject({
      spot: 'frontCenter',
      behaviour: 'whisper',
    });
    expect(sparkyCueFor('whisper-close', CTX).end.spot).toBe('nearCore');
    expect(sparkyCueFor('lobby-playstage-merge', CTX).end.spot).toBe('rightLip');
    expect(sparkyCueFor('playstage-lobby-split', CTX).end.spot).toBe('rightLip');
    expect(sparkyCueFor('dual-enter', CTX).end.spot).toBe('frontCenter');
    expect(sparkyCueFor('emit-burst', CTX).end).toMatchObject({
      spot: 'nearCore',
      reaction: 'surprised',
    });
    expect(sparkyCueFor('first-visit-ignition', CTX).start.spot).toBe(
      'behindCore',
    );
    expect(sparkyCueFor('first-visit-ignition', CTX).end).toMatchObject({
      spot: 'nearCore',
      reaction: 'wave',
    });
    expect(sparkyCueFor('game-launch-burst', CTX).end).toMatchObject({
      spot: 'rightLip',
      reaction: 'cheer',
    });
    expect(
      sparkyCueFor('focus-out', { ...CTX, destMode: 'labsBrowse' }).end.spot,
    ).toBe('leftLip');
    expect(
      sparkyCueFor('focus-out', { ...CTX, destMode: 'hubSplit' }).end.spot,
    ).toBe('nearCore');
  });

  it('teleports under reduced motion and skips hops / walks / wave', () => {
    for (const id of DIRECTOR_LIVE_IDS) {
      const cue = sparkyCueFor(id, RM);
      expect(cue.start.moving).toBe(false);
      expect(cue.end.moving).toBe(false);
      expect(SPARKY_SPOT_IDS).toContain(cue.end.spot);
    }
    expect(sparkyCueFor('login-success-hubsplit', RM).end.reaction).toBeNull();
    expect(sparkyCueFor('first-visit-ignition', RM).end).toMatchObject({
      spot: 'nearCore',
      reaction: null,
    });
    expect(sparkyCueFor('hub-labsbrowse', RM).end).toMatchObject({
      spot: 'leftLip',
      reaction: null,
      moving: false,
    });
    expect(sparkyCueFor('whisper-expand', RM).end).toMatchObject({
      spot: 'frontCenter',
      moving: false,
    });
    expect(sparkyCueFor('emit-burst', RM).end.reaction).toBeNull();
    expect(sparkyCueFor('game-launch-burst', RM).end.reaction).toBeNull();
  });
});

describe('Director timelines write forge.sparky.spot', () => {
  it('login-success waves at nearCore; RM skips the wave', () => {
    const director = getForgeDirector();
    director.play('login-success-hubsplit', {
      paused: true,
      reducedMotion: false,
    });
    director.scrub(0);
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
    director.scrub(1);
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
    expect(useForgeStore.getState().forge.sparky.reaction).toBe('wave');
    expect(useForgeStore.getState().forge.sparky.moving).toBe(false);

    director.play('login-success-hubsplit', {
      paused: true,
      reducedMotion: true,
    });
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
    expect(useForgeStore.getState().forge.sparky.reaction).toBeNull();
    expect(useForgeStore.getState().forge.sparky.moving).toBe(false);
    expect(peekDirectorClock().sparkyHop).toBe(0);
  });

  it('ignition spawns behindCore then waves at nearCore; RM teleports', () => {
    const director = getForgeDirector();
    director.play('first-visit-ignition', {
      paused: true,
      reducedMotion: false,
    });
    director.scrub(0);
    expect(useForgeStore.getState().forge.sparky.spot).toBe('behindCore');
    director.scrub(0.8);
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
    expect(useForgeStore.getState().forge.sparky.reaction).toBe('wave');

    director.play('first-visit-ignition', {
      paused: true,
      reducedMotion: true,
    });
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
    expect(useForgeStore.getState().forge.sparky.reaction).toBeNull();
    expect(useForgeStore.getState().forge.sparky.moving).toBe(false);
    expect(peekDirectorClock().sparkyHop).toBe(0);
  });

  it('emit-burst stays nearCore; RM does not hop', () => {
    const director = getForgeDirector();
    director.play('emit-burst', { paused: true, reducedMotion: false });
    director.scrub(0);
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
    director.scrub(0.5);
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
    expect(useForgeStore.getState().forge.sparky.reaction).toBe('surprised');

    director.play('emit-burst', { paused: true, reducedMotion: true });
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
    expect(useForgeStore.getState().forge.sparky.moving).toBe(false);
    expect(peekDirectorClock().sparkyHop).toBe(0);
  });

  it('hub-labsbrowse walks to leftLip; RM teleports and skips hop', () => {
    const director = getForgeDirector();
    director.play('hub-labsbrowse', { paused: true, reducedMotion: false });
    director.scrub(0);
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
    director.scrub(1);
    expect(useForgeStore.getState().forge.sparky.spot).toBe('leftLip');
    expect(useForgeStore.getState().forge.sparky.reaction).toBe('pointL');

    director.play('hub-labsbrowse', { paused: true, reducedMotion: true });
    expect(useForgeStore.getState().forge.sparky.spot).toBe('leftLip');
    expect(useForgeStore.getState().forge.sparky.moving).toBe(false);
    expect(peekDirectorClock().sparkyHop).toBe(0);
  });

  it('whisper RM teleports to frontCenter; close returns nearCore', () => {
    const director = getForgeDirector();
    director.play('whisper-expand', { paused: true, reducedMotion: true });
    expect(useForgeStore.getState().forge.sparky.spot).toBe('frontCenter');
    expect(useForgeStore.getState().forge.sparky.moving).toBe(false);
    expect(peekDirectorClock().sparkyHop).toBe(0);

    director.play('whisper-close', { paused: true, reducedMotion: true });
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
    expect(useForgeStore.getState().forge.sparky.moving).toBe(false);
  });

  it('welcome-idle holds nearCore without a timed wave', () => {
    const director = getForgeDirector();
    director.play('welcome-idle', { paused: true, reducedMotion: false });
    expect(useForgeStore.getState().forge.sparky.spot).toBe('nearCore');
    expect(useForgeStore.getState().forge.sparky.reaction).toBeNull();
    expect(useForgeStore.getState().forge.sparky.behaviour).toBe('idle');
  });
});
