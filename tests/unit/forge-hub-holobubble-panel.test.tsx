// ════════════════════════════════════════════════════════════════
// W3-04 — HoloBubble DOM panel + HUD + Escape
// ════════════════════════════════════════════════════════════════

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HoloBubble } from '@/components/forge-hub/HoloBubble';
import { SparkyBehaviourPanel } from '@/components/forge-hub/SparkyBehaviourPanel';
import {
  clearHoloBubbleTipTimer,
  openHoloBubble,
} from '@/lib/forge-hub/holoBubble';
import { useHoloBubble } from '@/lib/forge-hub/useHoloBubble';
import { HOLO_BLEND } from '@/lib/forge-hub/holoBlend';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';

const SCENE_DEFAULTS = useSceneStore.getState();

function EscapeHarness() {
  useHoloBubble(false);
  return <HoloBubble />;
}

beforeEach(() => {
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
  clearHoloBubbleTipTimer();
  vi.useRealTimers();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: {
      ...FORGE_SLICE_DEFAULTS,
      sparky: { ...FORGE_SLICE_DEFAULTS.sparky },
      holoBubble: { ...FORGE_SLICE_DEFAULTS.holoBubble },
    },
  });
});

describe('W3-04 HoloBubble panel', () => {
  it('renders a reading-plate tip with data-forge-holobubble', () => {
    openHoloBubble('tip', { tip: 'The core is warm.', rememberFocus: false });
    render(<HoloBubble />);
    const panel = screen.getByTestId('forge-hub-holobubble');
    expect(panel).toHaveAttribute('data-forge-holobubble', 'tip');
    expect(panel.style.getPropertyValue('--fh-holo-reading')).toBe(
      HOLO_BLEND.readingFill,
    );
    expect(screen.getByText('The core is warm.')).toBeTruthy();
    expect(useForgeStore).toBe(useSceneStore);
  });

  it('hides when the store is hidden', () => {
    render(<HoloBubble />);
    expect(screen.queryByTestId('forge-hub-holobubble')).toBeNull();
  });

  it('opens chat from the HUD control on the existing slice', async () => {
    const user = userEvent.setup();
    render(<SparkyBehaviourPanel reducedMotion={false} />);
    await user.click(screen.getByTestId('forge-hub-holobubble-open'));
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('tip');
    await user.selectOptions(
      screen.getByTestId('forge-hub-holobubble-state'),
      'chat',
    );
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('chat');
  });

  it('Escape closes the bubble and restores HUD focus', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SparkyBehaviourPanel reducedMotion={false} />
        <EscapeHarness />
      </>,
    );
    const open = screen.getByTestId('forge-hub-holobubble-open');
    await user.click(open);
    expect(screen.getByTestId('forge-hub-holobubble')).toHaveAttribute(
      'data-forge-holobubble',
      'tip',
    );
    await user.keyboard('{Escape}');
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('hidden');
    expect(screen.queryByTestId('forge-hub-holobubble')).toBeNull();
    expect(open).toHaveFocus();
  });
});
