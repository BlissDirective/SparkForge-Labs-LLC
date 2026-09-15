// ════════════════════════════════════════════════════════════════
// W1-01 — sceneStore forge slice (useForgeStore alias)
// ════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  useForgeStore,
  useSceneStore,
} from '@/stores/sceneStore';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';

const SCENE_DEFAULTS = useSceneStore.getState();

beforeEach(() => {
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

afterEach(() => {
  useSceneStore.setState({
    ...SCENE_DEFAULTS,
    forge: { ...FORGE_SLICE_DEFAULTS },
  });
});

describe('W1-01 forgeStore is sceneStore (no new Zustand store)', () => {
  it('useForgeStore is the same store instance as useSceneStore', () => {
    expect(useForgeStore).toBe(useSceneStore);
  });

  it('starts in hubSplit with always frameloop and idle portal', () => {
    const forge = useForgeStore.getState().forge;
    expect(forge.mode).toBe('hubSplit');
    expect(forge.frameloop).toBe('always');
    expect(forge.portalPhase).toBe('idle');
    expect(forge.poseLock).toBe(false);
    expect(forge.sparky.spot).toBe('nearCore');
    expect(forge.holoBubble.state).toBe('hidden');
  });

  it('setForgeMode records previousMode', () => {
    useForgeStore.getState().setForgeMode('welcome');
    const forge = useForgeStore.getState().forge;
    expect(forge.mode).toBe('welcome');
    expect(forge.previousMode).toBe('hubSplit');
  });

  it('setForgeMode is a no-op when the mode is unchanged', () => {
    useForgeStore.getState().setForgeMode('hubSplit');
    expect(useForgeStore.getState().forge.previousMode).toBeNull();
  });

  it('setForgeFrameloop and setForgePoseLock update the slice', () => {
    useForgeStore.getState().setForgeFrameloop('demand');
    useForgeStore.getState().setForgePoseLock(true);
    const forge = useForgeStore.getState().forge;
    expect(forge.frameloop).toBe('demand');
    expect(forge.poseLock).toBe(true);
  });

  it('does not disturb cockpit enterGame fields', () => {
    useSceneStore.getState().enterGame('ai-spy', '#00BBFF');
    expect(useSceneStore.getState().activeScene).toBe('transitioning');
    expect(useForgeStore.getState().forge.mode).toBe('hubSplit');
  });
});
