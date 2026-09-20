// ════════════════════════════════════════════════════════════════
// W2-07 — HoloC welcome login + P2 morph cycle
// ════════════════════════════════════════════════════════════════

import { cleanup, render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HoloPanelLayer } from '@/components/forge-hub/HoloPanelLayer';
import { WelcomeLoginForm } from '@/components/forge-hub/WelcomeLoginForm';
import {
  P2_MORPH_CYCLE,
  P2_MORPH_HOPS,
  p2HopDurationMs,
  releaseDirectorLayout,
  runP2MorphCycle,
} from '@/lib/forge-hub/morphCycle';
import {
  DIRECTOR_RM_MS,
  LAYOUT_MORPH_MS,
  LOGIN_SUCCESS_HUBSPLIT_MS,
  getForgeDirector,
  peekDirectorClock,
  resetForgeDirector,
} from '@/lib/forge-hub/director';
import { HUBSPLIT_HOLO_C } from '@/lib/forge-hub/layouts';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';

const SCENE_DEFAULTS = useSceneStore.getState();

beforeEach(() => {
  resetForgeDirector();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS, mode: 'welcome' },
  });
});

afterEach(() => {
  cleanup();
  resetForgeDirector();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

describe('W2-07 P2 morph cycle helper', () => {
  it('locks the TAP welcome → hubSplit → playStage → gameLobby → welcome sequence', () => {
    expect([...P2_MORPH_CYCLE]).toEqual([
      'welcome',
      'hubSplit',
      'playStage',
      'gameLobby',
      'welcome',
    ]);
    expect(P2_MORPH_HOPS.map((hop) => `${hop.from}→${hop.to}`)).toEqual([
      'welcome→hubSplit',
      'hubSplit→playStage',
      'playStage→gameLobby',
      'gameLobby→welcome',
    ]);
    expect(P2_MORPH_HOPS[0]).toMatchObject({
      kind: 'director',
      directorId: 'login-success-hubsplit',
    });
    expect(P2_MORPH_HOPS[1]).toMatchObject({
      kind: 'route',
      directorId: null,
    });
    expect(P2_MORPH_HOPS[2]).toMatchObject({
      kind: 'director',
      directorId: 'playstage-lobby-split',
    });
    expect(p2HopDurationMs(P2_MORPH_HOPS[0], false)).toBe(
      LOGIN_SUCCESS_HUBSPLIT_MS,
    );
    expect(p2HopDurationMs(P2_MORPH_HOPS[0], true)).toBe(DIRECTOR_RM_MS);
    expect(p2HopDurationMs(P2_MORPH_HOPS[1], false)).toBe(LAYOUT_MORPH_MS);
    expect(p2HopDurationMs(P2_MORPH_HOPS[2], false)).toBe(600);
    expect(LAYOUT_MORPH_MS).toBe(420);
    expect(HUBSPLIT_HOLO_C).toMatchObject({
      left: 37,
      top: 13.5,
      width: 26,
      height: 49,
    });
  });

  it('walks the cycle on the existing forge slice (no new store)', async () => {
    const steps: string[] = [];
    await runP2MorphCycle({
      reducedMotion: true,
      waitMs: async () => undefined,
      onStep: (mode) => steps.push(mode),
    });
    expect(steps).toEqual([...P2_MORPH_CYCLE]);
    expect(useForgeStore.getState().forge.mode).toBe('welcome');
    expect(useForgeStore).toBe(useSceneStore);
  });

  it('releases Director layoutFrom/To so later hops follow applyForgeRoute', () => {
    const director = getForgeDirector();
    director.play('login-success-hubsplit', { paused: true, reducedMotion: true });
    expect(peekDirectorClock().layoutTo).toBe('hubSplit');
    releaseDirectorLayout();
    expect(peekDirectorClock().layoutFrom).toBeNull();
    expect(peekDirectorClock().layoutTo).toBeNull();
    expect(peekDirectorClock().id).toBeNull();
  });
});

describe('W2-07 WelcomeLoginForm', () => {
  it('renders live email and password fields', () => {
    render(<WelcomeLoginForm />);
    const form = screen.getByTestId('forge-hub-welcome-login');
    expect(form).toHaveAttribute('data-forge-holoc-login', '1');
    expect(screen.getByTestId('forge-hub-login-email')).toBeTruthy();
    expect(screen.getByTestId('forge-hub-login-password')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeDisabled();
  });

  it('plays login-success-hubsplit on submit', async () => {
    const user = userEvent.setup();
    render(<WelcomeLoginForm />);
    await user.type(screen.getByTestId('forge-hub-login-email'), 'kid@test.dev');
    await user.type(screen.getByTestId('forge-hub-login-password'), 'secret12');
    await user.click(screen.getByTestId('forge-hub-login-submit'));
    expect(getForgeDirector().activeId()).toBe('login-success-hubsplit');
  });
});

describe('W2-07 HoloC login stays mounted across the cycle', () => {
  it('keeps the same form node from welcome through playStage and back', () => {
    render(<HoloPanelLayer layout="stage" />);
    const form = screen.getByTestId('forge-hub-welcome-login');
    expect(form.hidden).toBe(false);
    expect(screen.getByRole('region', { name: 'Welcome to SparkForge' })).toBeTruthy();

    act(() => {
      useForgeStore.getState().setForgeMode('hubSplit');
    });
    expect(screen.getByTestId('forge-hub-welcome-login')).toBe(form);
    expect(form.hidden).toBe(true);
    expect(screen.getByRole('region', { name: "Today's mission" })).toBeTruthy();

    act(() => {
      useForgeStore.getState().setForgeMode('playStage');
    });
    expect(screen.getByTestId('forge-hub-welcome-login')).toBe(form);
    expect(screen.getByTestId('forge-hub-holo-holoC')).toBeTruthy();
    expect(screen.queryByTestId('forge-hub-holo-holoL')).toBeNull();

    act(() => {
      useForgeStore.getState().setForgeMode('gameLobby');
    });
    expect(screen.getByTestId('forge-hub-welcome-login')).toBe(form);

    act(() => {
      useForgeStore.getState().setForgeMode('welcome');
    });
    expect(screen.getByTestId('forge-hub-welcome-login')).toBe(form);
    expect(form.hidden).toBe(false);
    expect(screen.getByTestId('forge-hub-holo-layer')).toHaveAttribute(
      'data-forge-holoc-login',
      '1',
    );
  });
});
