// ════════════════════════════════════════════════════════════════
// W2-03 — EscapeFlat (OVERLAY-CRIT-001) + ToastRail
// ════════════════════════════════════════════════════════════════

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EscapeFlat } from '@/components/forge-hub/EscapeFlat';
import { ForgeRouteMode } from '@/components/forge-hub/ForgeRouteMode';
import { ToastRail } from '@/components/forge-hub/ToastRail';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { toast, useToastStore } from '@/stores/toastStore';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';

vi.mock('next/navigation', () => ({
  usePathname: () => '/parent/subscription',
  useSearchParams: () => new URLSearchParams(),
}));

const SCENE_DEFAULTS = useSceneStore.getState();

beforeEach(() => {
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
  useToastStore.getState().clearAll();
});

afterEach(() => {
  cleanup();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
  useToastStore.getState().clearAll();
});

describe('W2-03 EscapeFlat (OVERLAY-CRIT-001)', () => {
  it('portals a fixed overlay with no filter/transform on the shell', async () => {
    const onClose = vi.fn();
    render(
      <EscapeFlat open title="Parent space" onClose={onClose}>
        <p>Billing table</p>
      </EscapeFlat>,
    );
    const overlay = await screen.findByTestId('forge-hub-escape-flat');
    expect(overlay).toHaveAttribute('data-overlay-crit', '001');
    expect(overlay).toHaveAttribute('role', 'dialog');
    expect(overlay.style.position).toBe('fixed');
    expect(overlay.style.filter).toBe('none');
    expect(overlay.style.transform).toBe('none');
    expect(overlay.style.backdropFilter).toBe('none');
    expect(screen.getByText('Billing table')).toBeTruthy();
    await userEvent.click(screen.getByTestId('forge-hub-escape-back'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Escape calls onClose', async () => {
    const onClose = vi.fn();
    render(<EscapeFlat open title="Parent space" onClose={onClose} />);
    await screen.findByTestId('forge-hub-escape-flat');
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});

describe('W2-03 ToastRail absorbs toastStore', () => {
  it('renders the footer chip and toastStore messages as edge chips', async () => {
    toast.info('Forge hub ping');
    render(<ToastRail onOpenLegal={() => undefined} />);
    await waitFor(() => {
      expect(screen.getByTestId('forge-hub-toast-rail')).toBeTruthy();
    });
    expect(screen.getByTestId('forge-hub-toast-legal')).toHaveTextContent(
      'Pricing · Legal',
    );
    expect(screen.getByText('Forge hub ping')).toBeTruthy();
  });
});

describe('W2-03 ForgeRouteMode writes the existing forge slice', () => {
  it('applies /parent as FLAT on useForgeStore (same instance)', async () => {
    render(
      <ForgeRouteMode>
        <p>child</p>
      </ForgeRouteMode>,
    );
    await waitFor(() => {
      expect(useForgeStore.getState().forge.mode).toBe('flat');
    });
    expect(useForgeStore.getState().forge.frameloop).toBe('never');
    expect(useForgeStore.getState().forge.flatOverlay).toBe(true);
    expect(useForgeStore).toBe(useSceneStore);
  });

  it('skips the store write on /dev/forge-hub bridge', async () => {
    render(
      <ForgeRouteMode syncStore pathname="/dev/forge-hub">
        <p>dev</p>
      </ForgeRouteMode>,
    );
    await waitFor(() => {
      expect(useForgeStore.getState().forge.mode).toBe('hubSplit');
    });
    expect(useForgeStore.getState().forge.flatOverlay).toBe(false);
    expect(useForgeStore.getState().forge.frameloop).toBe('always');
  });
});
