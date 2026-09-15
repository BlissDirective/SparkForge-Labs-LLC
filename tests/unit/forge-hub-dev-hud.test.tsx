// ════════════════════════════════════════════════════════════════
// W2-05 — /dev/forge-hub mode switcher, calibrate, transition scrubber
// ════════════════════════════════════════════════════════════════

import { cleanup, render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ForgeCalibrateOverlay } from '@/components/forge-hub/ForgeCalibrateOverlay';
import { ForgeModeSwitcher } from '@/components/forge-hub/ForgeModeSwitcher';
import { ForgeTransitionScrubber } from '@/components/forge-hub/ForgeTransitionScrubber';
import {
  calibrateSlotsForMode,
  directorIdForModeChange,
  forgeRouteForDevMode,
  LAYOUT_MORPH_MS,
} from '@/lib/forge-hub/devHud';
import {
  getForgeDirector,
  HUBSPLIT_HOLO_C,
  resetForgeDirector,
} from '@/lib/forge-hub/director';
import { FORGE_LAYOUT_MODES } from '@/lib/forge-hub/layouts';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';

const SCENE_DEFAULTS = useSceneStore.getState();

beforeEach(() => {
  resetForgeDirector();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
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

describe('W2-05 mode hop helpers', () => {
  it('maps welcome → hubSplit onto the live Director morph', () => {
    expect(directorIdForModeChange('welcome', 'hubSplit')).toBe(
      'login-success-hubsplit',
    );
    expect(directorIdForModeChange('hubSplit', 'welcome')).toBe('welcome-idle');
    expect(directorIdForModeChange('hubSplit', 'playStage')).toBeNull();
    expect(directorIdForModeChange('hubSplit', 'flat')).toBeNull();
  });

  it('writes FLAT as frameloop never on the existing forge slice', () => {
    expect(forgeRouteForDevMode('flat', false)).toEqual({
      mode: 'flat',
      frameloop: 'never',
      flatOverlay: true,
    });
    expect(forgeRouteForDevMode('playStage', true).frameloop).toBe('demand');
    expect(useForgeStore).toBe(useSceneStore);
  });

  it('keeps LAYOUT_MORPH_MS at 420 and HoloC at the W2-01 seat', () => {
    expect(LAYOUT_MORPH_MS).toBe(420);
    expect(HUBSPLIT_HOLO_C).toMatchObject({
      left: 31.2,
      top: 24,
      width: 37.6,
      height: 48,
    });
  });
});

describe('W2-05 calibrate slot outlines', () => {
  it('lists all three registry slots including hidden PlayStage wings', () => {
    const slots = calibrateSlotsForMode('playStage');
    expect(slots.map((s) => s.id)).toEqual(['holoL', 'holoC', 'holoR']);
    expect(slots.find((s) => s.id === 'holoC')?.visible).toBe(true);
    expect(slots.find((s) => s.id === 'holoL')?.visible).toBe(false);
    expect(slots.find((s) => s.id === 'holoC')?.reading).toBe(true);
    expect(slots.find((s) => s.id === 'holoC')?.yaw).toBe(0);
  });

  it('renders plate outlines and the morph HUD from the live store', () => {
    useForgeStore.getState().applyForgeRoute({ mode: 'welcome' });
    render(<ForgeCalibrateOverlay layout="stage" />);
    expect(screen.getByTestId('forge-hub-calibrate')).toHaveAttribute(
      'data-forge-calibrate',
      '1',
    );
    expect(
      document.querySelector('[data-forge-calibrate-slot="holoC"]'),
    ).toHaveAttribute('data-visible', 'true');
    expect(screen.getByTestId('forge-hub-calibrate-hud').textContent).toMatch(
      /welcome/,
    );
    expect(screen.getByTestId('forge-hub-calibrate-hud').textContent).toMatch(
      /420ms/,
    );
  });
});

describe('W2-05 mode switcher on live forgeStore', () => {
  it('exposes every TAP mode already on the forge slice', () => {
    render(<ForgeModeSwitcher reducedMotion={false} />);
    const select = screen.getByTestId('forge-hub-mode-switch');
    for (const id of FORGE_LAYOUT_MODES) {
      expect(select.querySelector(`option[value="${id}"]`)).toBeTruthy();
    }
  });

  it('applyForgeRoute reseats playStage and flat without a new store', async () => {
    const user = userEvent.setup();
    render(<ForgeModeSwitcher reducedMotion={false} />);
    await user.selectOptions(screen.getByTestId('forge-hub-mode-switch'), 'playStage');
    expect(useForgeStore.getState().forge.mode).toBe('playStage');
    expect(useForgeStore.getState().forge.flatOverlay).toBe(false);
    await user.selectOptions(screen.getByTestId('forge-hub-mode-switch'), 'flat');
    expect(useForgeStore.getState().forge.mode).toBe('flat');
    expect(useForgeStore.getState().forge.frameloop).toBe('never');
    expect(useForgeStore.getState().forge.flatOverlay).toBe(true);
    expect(useForgeStore).toBe(useSceneStore);
  });

  it('welcome → hubSplit writes the live slice without a second store', async () => {
    useForgeStore.getState().applyForgeRoute({ mode: 'welcome' });
    const user = userEvent.setup();
    render(<ForgeModeSwitcher reducedMotion={false} />);
    await user.selectOptions(screen.getByTestId('forge-hub-mode-switch'), 'hubSplit');
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');
    expect(useForgeStore.getState().forge.previousMode).toBe('welcome');
    expect(useForgeStore).toBe(useSceneStore);
  });
});

describe('W2-05 transition scrubber vs live forgeStore', () => {
  it('scrubs a paused Director id onto forge.morphProgress', async () => {
    const user = userEvent.setup();
    render(
      <ForgeTransitionScrubber reducedMotion={false} poseLock={false} />,
    );
    await user.selectOptions(
      screen.getByTestId('forge-hub-transition-id'),
      'login-success-hubsplit',
    );
    expect(useForgeStore.getState().forge.directorId).toBe(
      'login-success-hubsplit',
    );

    const director = getForgeDirector();
    act(() => {
      director.scrub(0.5);
    });
    expect(useForgeStore.getState().forge.morphProgress).toBeCloseTo(0.5, 2);
    expect(screen.getByTestId('forge-hub-transition-scrub')).toHaveValue('50');
  });
});
