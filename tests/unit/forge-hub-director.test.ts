import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PORTAL_HOLD_MS } from '@/lib/forge-hub/portalMachine';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';
import {
  CAMERA_MICRO_DOLLY,
  DIRECTOR_SLICE1_IDS,
  EMIT_BURST_MS,
  FIRST_VISIT_IGNITION_MS,
  FORGE_STING_IDS,
  HUBSPLIT_HOLO_C,
  INTERACTIVE_CAP_MS,
  LAYOUT_MORPH_MS,
  LOGIN_SLAB_WINDOW_MS,
  LOGIN_SUCCESS_HUBSPLIT_MS,
  WELCOME_SIDE_SCALE,
  clampCameraDollyPercent,
  emitBurstPhaseAt,
  getForgeDirector,
  loadTheatreBeat,
  morphTargetsFor,
  peekDirectorClock,
  playForgeSting,
  registerMorphTargets,
  resetForgeDirector,
} from '@/lib/forge-hub/director';
import { DIRECTOR_RM_MS } from '@/lib/forge-hub/director';

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
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

describe('W2-02 Director duration caps', () => {
  it('keeps emit-burst at charge 420 + emit 560 (980ms cinematic)', () => {
    const director = getForgeDirector();
    director.play('emit-burst', { paused: true, reducedMotion: false });
    expect(Math.abs(director.durationMs() - EMIT_BURST_MS)).toBeLessThanOrEqual(2);
    expect(PORTAL_HOLD_MS.charge + PORTAL_HOLD_MS.emit).toBe(980);
    expect(director.durationMs()).toBeLessThanOrEqual(1500);
    expect(EMIT_BURST_MS).toBe(980);
  });

  it('binds slab window to Stagehand LAYOUT_MORPH_MS 420 (not #164 480)', () => {
    expect(LAYOUT_MORPH_MS).toBe(420);
    expect(LOGIN_SLAB_WINDOW_MS).toBe(LAYOUT_MORPH_MS);
    expect(LOGIN_SLAB_WINDOW_MS).not.toBe(480);
  });

  it('keeps login-success-hubsplit at the 600ms interactive cap', () => {
    const director = getForgeDirector();
    director.play('login-success-hubsplit', {
      paused: true,
      reducedMotion: false,
    });
    expect(Math.abs(director.durationMs() - LOGIN_SUCCESS_HUBSPLIT_MS)).toBeLessThanOrEqual(2);
    expect(director.durationMs()).toBeLessThanOrEqual(INTERACTIVE_CAP_MS);
  });

  it('keeps the Theatre ignition stub at 1500ms', () => {
    const beat = loadTheatreBeat('first-visit-ignition');
    expect(beat.status).toBe('stub');
    expect(beat.skipTo).toBe('welcome-idle');
    const director = getForgeDirector();
    director.play('first-visit-ignition', {
      paused: true,
      reducedMotion: false,
    });
    expect(Math.abs(director.durationMs() - FIRST_VISIT_IGNITION_MS)).toBeLessThanOrEqual(2);
    expect(director.durationMs()).toBeLessThanOrEqual(1500);
  });
});

describe('W2-02 Director reduced-motion path', () => {
  it('replaces emit-burst with SKIP_TO_DOCKED + 200ms crossfade', () => {
    const director = getForgeDirector();
    director.play('emit-burst', { paused: true, reducedMotion: true });
    expect(director.durationMs()).toBe(DIRECTOR_RM_MS);
    expect(useForgeStore.getState().forge.portalPhase).toBe('docked');
    expect(peekDirectorClock().sparkyHop).toBe(0);
  });

  it('crossfades login-success-hubsplit in 200ms and snaps equal-trio scale', () => {
    const director = getForgeDirector();
    director.play('login-success-hubsplit', {
      paused: true,
      reducedMotion: true,
    });
    expect(director.durationMs()).toBe(DIRECTOR_RM_MS);
    director.scrub(1);
    expect(peekDirectorClock().holoLScale).toBe(1);
    expect(peekDirectorClock().holoRScale).toBe(1);
    expect(peekDirectorClock().holoC).toMatchObject({
      left: 31.2,
      top: 24,
      width: 37.6,
      height: 48,
    });
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');
  });

  it('skips first-visit-ignition into welcome', () => {
    const director = getForgeDirector();
    director.play('first-visit-ignition', {
      paused: true,
      reducedMotion: true,
    });
    expect(director.durationMs()).toBe(DIRECTOR_RM_MS);
    director.scrub(1);
    expect(useForgeStore.getState().forge.mode).toBe('welcome');
  });
});

describe('W2-02 Director scrub + portal 420/560 alignment', () => {
  const STATIONS = [0, 0.2, 0.5, 0.8, 1] as const;

  it('scrubs emit-burst through charge / emit / docked at fixed times', () => {
    const director = getForgeDirector();
    director.play('emit-burst', { paused: true, reducedMotion: false });

    for (const p of STATIONS) {
      director.scrub(p);
      const timeMs = p * EMIT_BURST_MS;
      const expected = emitBurstPhaseAt(timeMs);
      expect(useForgeStore.getState().forge.portalPhase).toBe(expected);
      expect(director.progress()).toBeCloseTo(p, 5);
      expect(
        Math.abs(peekDirectorClock().cameraDollyPercent),
      ).toBeLessThanOrEqual(CAMERA_MICRO_DOLLY + 1e-9);
    }
  });

  it('holds charge before 420ms and emit before 980ms', () => {
    expect(emitBurstPhaseAt(0)).toBe('charge');
    expect(emitBurstPhaseAt(419)).toBe('charge');
    expect(emitBurstPhaseAt(420)).toBe('emit');
    expect(emitBurstPhaseAt(979)).toBe('emit');
    expect(emitBurstPhaseAt(980)).toBe('docked');
  });

  it('scrubs the morph at 0 / 0.2 / 0.5 / 0.8 / 1 without exceeding 600ms', () => {
    const director = getForgeDirector();
    director.play('login-success-hubsplit', {
      paused: true,
      reducedMotion: false,
    });
    expect(Math.abs(director.durationMs() - LOGIN_SUCCESS_HUBSPLIT_MS)).toBeLessThanOrEqual(2);

    director.scrub(0);
    expect(peekDirectorClock().holoLScale).toBeCloseTo(WELCOME_SIDE_SCALE, 5);
    expect(peekDirectorClock().contentOut).toBeCloseTo(1, 5);
    expect(peekDirectorClock().holoC).toMatchObject({
      left: HUBSPLIT_HOLO_C.left,
      top: HUBSPLIT_HOLO_C.top,
      width: HUBSPLIT_HOLO_C.width,
      height: HUBSPLIT_HOLO_C.height,
    });

    director.scrub(0.2);
    expect(peekDirectorClock().holoLScale).toBeGreaterThanOrEqual(
      WELCOME_SIDE_SCALE,
    );
    expect(peekDirectorClock().holoLScale).toBeLessThanOrEqual(1);
    expect(peekDirectorClock().holoC.left).toBeCloseTo(HUBSPLIT_HOLO_C.left, 5);
    expect(peekDirectorClock().holoC.top).toBeCloseTo(HUBSPLIT_HOLO_C.top, 5);
    expect(peekDirectorClock().holoC.width).toBeCloseTo(HUBSPLIT_HOLO_C.width, 5);
    expect(peekDirectorClock().holoC.height).toBeCloseTo(
      HUBSPLIT_HOLO_C.height,
      5,
    );

    director.scrub(0.5);
    director.scrub(0.8);
    director.scrub(1);
    expect(peekDirectorClock().holoLScale).toBeCloseTo(1, 4);
    expect(peekDirectorClock().holoRScale).toBeCloseTo(1, 4);
    expect(peekDirectorClock().holoC).toMatchObject({
      left: 31.2,
      top: 24,
      width: 37.6,
      height: 48,
    });
    expect(peekDirectorClock().contentIn).toBeCloseTo(1, 4);
    expect(peekDirectorClock().contentOut).toBeCloseTo(0, 4);
    expect(peekDirectorClock().layoutT).toBeCloseTo(1, 4);
  });
});

describe('W2-02 Director overwrite, skip, stings, Stagehand hook', () => {
  it('overwrite kills the previous timeline', () => {
    const director = getForgeDirector();
    director.play('emit-burst', { paused: true, reducedMotion: false });
    director.scrub(0.4);
    expect(director.activeId()).toBe('emit-burst');
    director.play('login-success-hubsplit', {
      paused: true,
      reducedMotion: false,
    });
    expect(director.activeId()).toBe('login-success-hubsplit');
    expect(DIRECTOR_SLICE1_IDS).toContain('welcome-idle');
  });

  it('skip on emit-burst sends SKIP_TO_DOCKED', () => {
    const director = getForgeDirector();
    director.play('emit-burst', { paused: true, reducedMotion: false });
    director.scrub(0.3);
    director.skip();
    expect(useForgeStore.getState().forge.portalPhase).toBe('docked');
    expect(director.progress()).toBe(1);
  });

  it('skip on first-visit-ignition lands welcome-idle', () => {
    const director = getForgeDirector();
    director.play('first-visit-ignition', {
      paused: true,
      reducedMotion: false,
    });
    director.skip();
    expect(director.activeId()).toBe('welcome-idle');
    expect(useForgeStore.getState().forge.mode).toBe('welcome');
  });

  it('sting ids match the bible list and the stub is silent', () => {
    expect(FORGE_STING_IDS).toContain('sting.emitBurst');
    expect(FORGE_STING_IDS).toContain('sting.loginSuccess');
    expect(playForgeSting('sting.emitBurst')).toBe(true);
    expect(playForgeSting('not-a-sting')).toBe(false);
  });

  it('clamps camera dolly to ±2 percent', () => {
    expect(clampCameraDollyPercent(0.5)).toBe(CAMERA_MICRO_DOLLY);
    expect(clampCameraDollyPercent(-1)).toBe(-CAMERA_MICRO_DOLLY);
  });

  it('binds morphs to Stagehand registerMorphTargets / HoloC live seat', () => {
    const welcome = morphTargetsFor('welcome');
    const hub = registerMorphTargets('hubSplit');
    expect(welcome.holoC).toMatchObject({
      left: 31.2,
      top: 24,
      width: 37.6,
      height: 48,
      yaw: 0,
    });
    expect(hub.holoC).toMatchObject(HUBSPLIT_HOLO_C);
    expect(welcome.holoC.left).toBe(hub.holoC.left);
    expect(LAYOUT_MORPH_MS).toBe(420);
  });

  it('does not play while pose=lock', () => {
    useForgeStore.getState().setForgePoseLock(true);
    const director = getForgeDirector();
    director.play('emit-burst', { paused: true, reducedMotion: false });
    expect(director.activeId()).toBeNull();
    expect(useForgeStore.getState().forge.portalPhase).toBe('idle');
  });
});
