import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';

let reduceMotion = false;
vi.mock('@/hooks/useSafeMotion', () => ({
  useSafeMotion: () => reduceMotion,
}));

import { useForgePortal } from '@/lib/forge-hub/useForgePortal';

const SCENE_DEFAULTS = useSceneStore.getState();

beforeEach(() => {
  reduceMotion = false;
  vi.useFakeTimers();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

afterEach(() => {
  vi.useRealTimers();
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

describe('useForgePortal hold timers', () => {
  it('auto-advances charge 420ms then emit 560ms to docked', () => {
    const { result } = renderHook(() => useForgePortal());
    act(() => {
      result.current.ignite();
    });
    expect(result.current.phase).toBe('charge');
    act(() => {
      vi.advanceTimersByTime(420);
    });
    expect(result.current.phase).toBe('emit');
    act(() => {
      vi.advanceTimersByTime(560);
    });
    expect(result.current.phase).toBe('docked');
  });

  it('SKIP_TO_DOCKED when reduced motion ignites', () => {
    reduceMotion = true;
    const { result } = renderHook(() => useForgePortal());
    act(() => {
      result.current.ignite();
    });
    expect(result.current.phase).toBe('docked');
  });

  it('does not advance while pose=lock', () => {
    useForgeStore.getState().setForgePoseLock(true);
    const { result } = renderHook(() => useForgePortal());
    act(() => {
      result.current.ignite();
    });
    expect(result.current.phase).toBe('idle');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.phase).toBe('idle');
  });
});
