// ════════════════════════════════════════════════════════════════
// W3-03 — /dev/forge-hub Sparky behaviour panel
// ════════════════════════════════════════════════════════════════

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SparkyBehaviourPanel } from '@/components/forge-hub/SparkyBehaviourPanel';
import { ForgeModeSwitcher } from '@/components/forge-hub/ForgeModeSwitcher';
import { clearSparkyReturnTimer } from '@/lib/forge-hub/sparkyBehaviour';
import { clearHoloBubbleTipTimer } from '@/lib/forge-hub/holoBubble';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';

const SCENE_DEFAULTS = useSceneStore.getState();

beforeEach(() => {
  clearSparkyReturnTimer();
  clearHoloBubbleTipTimer();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: {
      ...FORGE_SLICE_DEFAULTS,
      sparky: { ...FORGE_SLICE_DEFAULTS.sparky },
      holoBubble: { ...FORGE_SLICE_DEFAULTS.holoBubble },
    },
  });
});

afterEach(() => {
  cleanup();
  clearSparkyReturnTimer();
  clearHoloBubbleTipTimer();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: {
      ...FORGE_SLICE_DEFAULTS,
      sparky: { ...FORGE_SLICE_DEFAULTS.sparky },
      holoBubble: { ...FORGE_SLICE_DEFAULTS.holoBubble },
    },
  });
});

describe('W3-03 Sparky behaviour panel', () => {
  it('picks a desk spot on the existing forge slice', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ForgeModeSwitcher reducedMotion={false} />
        <SparkyBehaviourPanel reducedMotion={false} />
      </>,
    );
    expect(screen.getByTestId('forge-hub-mode-switch')).toBeInTheDocument();
    await user.selectOptions(screen.getByTestId('forge-hub-sparky-spot'), 'leftLip');
    expect(useForgeStore.getState().forge.sparky.spot).toBe('leftLip');
  });

  it('force react / cheer / wave patch behaviour + bubble', async () => {
    const user = userEvent.setup();
    render(<SparkyBehaviourPanel reducedMotion={false} />);
    await user.click(screen.getByTestId('forge-hub-sparky-cheer'));
    expect(useForgeStore.getState().forge.sparky.behaviour).toBe('react');
    expect(useForgeStore.getState().forge.sparky.reaction).toBe('cheer');
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('tip');
  });

  it('hides under pose lock', () => {
    render(<SparkyBehaviourPanel reducedMotion={false} poseLock />);
    expect(screen.queryByTestId('forge-hub-sparky-panel')).toBeNull();
  });

  it('teleports between spots when reduced-motion is on', async () => {
    const user = userEvent.setup();
    render(<SparkyBehaviourPanel reducedMotion />);
    await user.selectOptions(
      screen.getByTestId('forge-hub-sparky-spot'),
      'frontCenter',
    );
    expect(useForgeStore.getState().forge.sparky.spot).toBe('frontCenter');
    expect(useForgeStore.getState().forge.sparky.moving).toBe(false);
  });
});
