// ════════════════════════════════════════════════════════════════
// W1-01 — sceneStore forge slice (useForgeStore alias)
// ════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  selectForgeFlatOverlay,
  selectForgeRoute,
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
    expect(forge.sparky.behaviour).toBe('idle');
    expect(forge.sparky.expression).toBe('idle');
    expect(forge.holoBubble.state).toBe('hidden');
    expect(forge.holoBubble.tip).toBeNull();
    expect(forge.directorId).toBeNull();
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

describe('W1-02 dispatchForgePortal uses the ported reducer', () => {
  it('walks idle → charge → emit → docked on the forge slice', () => {
    const store = useForgeStore.getState();
    store.dispatchForgePortal({ type: 'IGNITE' });
    expect(useForgeStore.getState().forge.portalPhase).toBe('charge');
    store.dispatchForgePortal({ type: 'ADVANCE' });
    expect(useForgeStore.getState().forge.portalPhase).toBe('emit');
    store.dispatchForgePortal({ type: 'ADVANCE' });
    expect(useForgeStore.getState().forge.portalPhase).toBe('docked');
  });

  it('SKIP_TO_DOCKED and RETRACT update the same slice (no new store)', () => {
    useForgeStore.getState().dispatchForgePortal({ type: 'SKIP_TO_DOCKED' });
    expect(useForgeStore.getState().forge.portalPhase).toBe('docked');
    useForgeStore.getState().dispatchForgePortal({ type: 'RETRACT' });
    expect(useForgeStore.getState().forge.portalPhase).toBe('idle');
    expect(useForgeStore).toBe(useSceneStore);
  });

  it('IGNITE is a no-op while charging', () => {
    useForgeStore.getState().dispatchForgePortal({ type: 'IGNITE' });
    useForgeStore.getState().dispatchForgePortal({ type: 'IGNITE' });
    expect(useForgeStore.getState().forge.portalPhase).toBe('charge');
  });
});

describe('W2-03 applyForgeRoute completes the forge-facing API', () => {
  it('pauses the stage on FLAT without a second store', () => {
    useForgeStore.getState().applyForgeRoute({
      mode: 'flat',
      frameloop: 'never',
      flatOverlay: true,
    });
    const forge = useForgeStore.getState().forge;
    expect(forge.mode).toBe('flat');
    expect(forge.previousMode).toBe('hubSplit');
    expect(forge.frameloop).toBe('never');
    expect(forge.flatOverlay).toBe(true);
    expect(selectForgeFlatOverlay(useForgeStore.getState())).toBe(true);
    expect(useForgeStore).toBe(useSceneStore);
  });

  it('restores hubSplit and always frameloop when leaving FLAT', () => {
    useForgeStore.getState().applyForgeRoute({
      mode: 'flat',
      frameloop: 'never',
      flatOverlay: true,
    });
    useForgeStore.getState().applyForgeRoute({
      mode: 'hubSplit',
      frameloop: 'always',
      flatOverlay: false,
    });
    const snap = selectForgeRoute(useForgeStore.getState());
    expect(snap.mode).toBe('hubSplit');
    expect(snap.previousMode).toBe('flat');
    expect(snap.frameloop).toBe('always');
    expect(snap.flatOverlay).toBe(false);
  });

  it('does not disturb cockpit enterGame fields', () => {
    useSceneStore.getState().enterGame('ai-spy', '#00BBFF');
    useForgeStore.getState().applyForgeRoute({ mode: 'welcome' });
    expect(useSceneStore.getState().activeScene).toBe('transitioning');
    expect(useForgeStore.getState().forge.mode).toBe('welcome');
  });
});

