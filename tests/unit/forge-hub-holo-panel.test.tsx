// ════════════════════════════════════════════════════════════════
// W2 — HoloPanel reading plate
// ════════════════════════════════════════════════════════════════

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HoloPanel } from '@/components/forge-hub/HoloPanel';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { HOLO_BLEND } from '@/lib/forge-hub/holoBlend';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';

const SCENE_DEFAULTS = useSceneStore.getState();

beforeEach(() => {
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS, mode: 'hubSplit' },
  });
});

afterEach(() => {
  cleanup();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

describe('W2 HoloPanel reading plate', () => {
  it('renders a region with header, scroll, and reading fill token', () => {
    render(
      <HoloPanel slotId="holoC" title="Welcome to SparkForge">
        <p>Sign in on this plate.</p>
      </HoloPanel>,
    );
    const region = screen.getByRole('region', {
      name: 'Welcome to SparkForge',
    });
    expect(region).toHaveAttribute('data-reading', 'true');
    expect(region).toHaveAttribute('data-morph-phase', 'idle');
    expect(region).toHaveAttribute('data-holo-slot', 'holoC');
    expect(region.style.getPropertyValue('--fh-holo-reading')).toBe(
      HOLO_BLEND.readingFill,
    );
    expect(screen.getByText('Sign in on this plate.')).toBeTruthy();
  });

  it('hides panels that the layout marks invisible', () => {
    useForgeStore.getState().setForgeMode('playStage');
    const { container } = render(
      <HoloPanel slotId="holoL" title="HoloL">
        hidden
      </HoloPanel>,
    );
    expect(container.querySelector('[data-holo-slot="holoL"]')).toBeNull();
    expect(useForgeStore).toBe(useSceneStore);
  });
});
