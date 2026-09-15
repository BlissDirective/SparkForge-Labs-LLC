import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';
import {
  getForgeDirector,
  resetForgeDirector,
} from '@/lib/forge-hub/director';

let reduceMotion = false;
vi.mock('@/hooks/useSafeMotion', () => ({
  useSafeMotion: () => reduceMotion,
}));

import { useForgePortal } from '@/lib/forge-hub/useForgePortal';

const SCENE_DEFAULTS = useSceneStore.getState();

beforeEach(() => {
  reduceMotion = false;
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

describe('useForgePortal defers holds to the Director', () => {
  it('ignite plays emit-burst (Director owns 420/560)', () => {
    const { result } = renderHook(() => useForgePortal());
    act(() => {
      result.current.ignite();
    });
    expect(getForgeDirector().activeId()).toBe('emit-burst');
    expect(result.current.phase).toBe('charge');
    act(() => {
      getForgeDirector().scrub(0.5);
    });
    expect(useForgeStore.getState().forge.portalPhase).toBe('emit');
    act(() => {
      getForgeDirector().scrub(1);
    });
    expect(useForgeStore.getState().forge.portalPhase).toBe('docked');
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
    expect(getForgeDirector().activeId()).toBeNull();
  });
});
