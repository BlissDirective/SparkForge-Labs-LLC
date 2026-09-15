// ════════════════════════════════════════════════════════════════
// W3-04 — HoloBubble stub (open/close + Escape, no new store)
// ════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPARKY_SPOT_IDS, sparkyHoloAnchor } from '@/config/sparkySpots';
import {
  HOLO_BUBBLE_CHAT_PX,
  HOLO_BUBBLE_DOME_EMISSIVE,
  HOLO_BUBBLE_REST_PX,
  HOLO_BUBBLE_TIP_MS,
  bubbleBoxForState,
  clampBoxToViewport,
  clampBubbleForPlay,
  clearHoloBubbleTipTimer,
  closeHoloBubble,
  cycleHoloBubbleOpen,
  domeEmissiveForBubble,
  followSpring,
  isHoloBubbleOpen,
  isPlayLimitedMode,
  openHoloBubble,
} from '@/lib/forge-hub/holoBubble';
import { projectWorldToScreen } from '@/lib/forge-hub/projectWorldPoint';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';

const SCENE_DEFAULTS = useSceneStore.getState();

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

describe('W3-04 HoloBubble policy', () => {
  it('does not invent desk spots', () => {
    expect(SPARKY_SPOT_IDS).toEqual([
      'nearCore',
      'leftLip',
      'rightLip',
      'frontCenter',
      'behindCore',
    ]);
  });

  it('sizes rest / chat per TAP §2.8b and clamps play to ping/tip', () => {
    expect(HOLO_BUBBLE_REST_PX).toEqual({ width: 320, height: 200 });
    expect(HOLO_BUBBLE_CHAT_PX).toEqual({ width: 420, height: 320 });
    expect(bubbleBoxForState('tip')).toEqual(HOLO_BUBBLE_REST_PX);
    expect(bubbleBoxForState('chat')).toEqual(HOLO_BUBBLE_CHAT_PX);
    expect(isPlayLimitedMode('playStage')).toBe(true);
    expect(clampBubbleForPlay('chat', 'playStage')).toBe('tip');
    expect(clampBubbleForPlay('whisper', 'playStage')).toBe('tip');
    expect(clampBubbleForPlay('chat', 'hubSplit')).toBe('chat');
  });

  it('matches spec §7.4 dome emissive', () => {
    expect(HOLO_BUBBLE_DOME_EMISSIVE.hidden).toBe(0.3);
    expect(HOLO_BUBBLE_DOME_EMISSIVE.ping).toBe(0.6);
    expect(domeEmissiveForBubble('tip')).toBe(1);
    expect(domeEmissiveForBubble('chat')).toBe(1);
    expect(domeEmissiveForBubble('whisper')).toBe(1.2);
  });

  it('clamps the slab inside the viewport', () => {
    expect(clampBoxToViewport(-40, -10, 320, 200, 800, 600, 12)).toEqual({
      left: 12,
      top: 12,
    });
    const right = clampBoxToViewport(700, 500, 320, 200, 800, 600, 12);
    expect(right.left).toBe(800 - 320 - 12);
    expect(right.top).toBe(600 - 200 - 12);
  });

  it('springs toward the target and snaps under reduced motion', () => {
    expect(followSpring(0, 100, 1 / 60, 14, false)).toBeGreaterThan(0);
    expect(followSpring(0, 100, 1 / 60, 14, false)).toBeLessThan(100);
    expect(followSpring(12, 80, 0.016, 14, true)).toBe(80);
  });

  it('projects the dome socket to CSS pixels', () => {
    const pt = projectWorldToScreen(sparkyHoloAnchor('nearCore'), 1536, 1024);
    expect(pt.x).toBeGreaterThan(400);
    expect(pt.x).toBeLessThan(1136);
    expect(pt.y).toBeGreaterThan(200);
    expect(pt.y).toBeLessThan(900);
  });
});

describe('W3-04 patchForgeHoloBubble (no new store)', () => {
  it('open/close writes the existing forge slice', () => {
    expect(useForgeStore).toBe(useSceneStore);
    expect(isHoloBubbleOpen(useForgeStore.getState().forge.holoBubble.state)).toBe(
      false,
    );
    openHoloBubble('tip', { tip: 'Hello from the dome.' });
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('tip');
    expect(useForgeStore.getState().forge.holoBubble.tip).toBe(
      'Hello from the dome.',
    );
    expect(useForgeStore.getState().forge.holoBubble.anchor).toEqual(
      sparkyHoloAnchor('nearCore'),
    );
    closeHoloBubble({ restoreFocus: false });
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('hidden');
    expect(useForgeStore.getState().forge.holoBubble.tip).toBeNull();
  });

  it('cycles hidden → tip → chat and clamps chat on PlayStage', () => {
    expect(cycleHoloBubbleOpen()).toBe('tip');
    expect(cycleHoloBubbleOpen()).toBe('chat');
    useForgeStore.getState().setForgeMode('playStage');
    closeHoloBubble({ restoreFocus: false });
    expect(openHoloBubble('chat')).toBe('tip');
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('tip');
  });

  it('auto-dismisses tip after a few seconds', () => {
    vi.useFakeTimers();
    openHoloBubble('tip', { tip: 'Ping then gone.' });
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('tip');
    vi.advanceTimersByTime(HOLO_BUBBLE_TIP_MS - 20);
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('tip');
    vi.advanceTimersByTime(40);
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('hidden');
  });

  it('does not auto-dismiss chat', () => {
    vi.useFakeTimers();
    openHoloBubble('chat');
    vi.advanceTimersByTime(HOLO_BUBBLE_TIP_MS + 200);
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('chat');
  });
});
