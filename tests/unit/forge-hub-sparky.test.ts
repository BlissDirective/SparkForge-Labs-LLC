// ════════════════════════════════════════════════════════════════
// W3-03 — desk spots + placeholder Sparky behaviour machine
// ════════════════════════════════════════════════════════════════

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPARKY_FACE_GLOW, SPARKY_PALETTE } from '@/config/sparkyPalette';
import {
  SPARKY_DEFAULT_SPOT,
  SPARKY_HEIGHT_M,
  SPARKY_SPOT_IDS,
  SPARKY_SPOTS,
  defaultSpotForMode,
  sparkyHoloAnchor,
  spotClearsGlass,
  spotDeskOffset,
  spotOnDesk,
} from '@/config/sparkySpots';
import { FORGE_HUB_CAMERA, FORGE_HUB_PLATE } from '@/config/forgeHub';
import {
  HOLO_DOME_EMISSIVE,
  SPARKY_REACTION_MS,
  advanceSparky,
  clearSparkyReturnTimer,
  dispatchSparkyEvent,
  sparkyMoveAttr,
} from '@/lib/forge-hub/sparkyBehaviour';
import { clearHoloBubbleTipTimer, HOLO_BUBBLE_TIP_MS } from '@/lib/forge-hub/holoBubble';
import { SPARKY_FACE_SIZE } from '@/lib/forge-hub/sparkyFace';
import { FORGE_SLICE_DEFAULTS } from '@/lib/forge-hub/types';
import { useForgeStore, useSceneStore } from '@/stores/sceneStore';

const SCENE_DEFAULTS = useSceneStore.getState();
const CTX = { reducedMotion: false, poseLock: false };
const RM = { reducedMotion: true, poseLock: false };
const LOCK = { reducedMotion: false, poseLock: true };

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
  clearSparkyReturnTimer();
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

describe('W3-03 desk spots', () => {
  it('names the five spec spots with nearCore as default', () => {
    expect(SPARKY_SPOT_IDS).toEqual([
      'nearCore',
      'leftLip',
      'rightLip',
      'frontCenter',
      'behindCore',
    ]);
    expect(SPARKY_DEFAULT_SPOT).toBe('nearCore');
    expect(SPARKY_HEIGHT_M).toBe(0.4);
  });

  it('seats every spot on the real desk plane below glass', () => {
    const deskY = FORGE_HUB_PLATE.desk.position[1];
    for (const id of SPARKY_SPOT_IDS) {
      const pose = SPARKY_SPOTS[id];
      expect(pose.position[1]).toBe(deskY);
      expect(spotOnDesk(id)).toBe(true);
      expect(spotClearsGlass(id)).toBe(true);
      expect(pose.position[1] + SPARKY_HEIGHT_M).toBeLessThan(
        FORGE_HUB_CAMERA.lookAt[1],
      );
    }
  });

  it('keeps lips on opposite sides and front closer to the camera', () => {
    expect(SPARKY_SPOTS.leftLip.position[0]).toBeLessThan(0);
    expect(SPARKY_SPOTS.rightLip.position[0]).toBeGreaterThan(0);
    expect(SPARKY_SPOTS.frontCenter.position[2]).toBeGreaterThan(
      SPARKY_SPOTS.nearCore.position[2],
    );
    expect(SPARKY_SPOTS.behindCore.position[2]).toBeLessThan(
      SPARKY_SPOTS.nearCore.position[2],
    );
    expect(spotDeskOffset('frontCenter')).toBeLessThan(
      FORGE_HUB_PLATE.desk.radius,
    );
  });

  it('anchors the stub HoloBubble above the dome, not in glass', () => {
    const [x, y, z] = sparkyHoloAnchor('nearCore');
    expect(x).toBe(SPARKY_SPOTS.nearCore.position[0]);
    expect(z).toBe(SPARKY_SPOTS.nearCore.position[2]);
    expect(y).toBeGreaterThan(SPARKY_HEIGHT_M);
    expect(y).toBeLessThan(FORGE_HUB_CAMERA.lookAt[1]);
  });

  it('mirrors Director end-states for mode home seats', () => {
    expect(defaultSpotForMode('hubSplit')).toBe('nearCore');
    expect(defaultSpotForMode('labsBrowse')).toBe('leftLip');
    expect(defaultSpotForMode('playStage')).toBe('rightLip');
    expect(defaultSpotForMode('dual')).toBe('frontCenter');
  });
});

describe('W3-03 behaviour transitions', () => {
  const idle = FORGE_SLICE_DEFAULTS.sparky;

  it('walks idle → attend(panel) → react → return', () => {
    const attend = advanceSparky(idle, { type: 'HOVER', panel: 'holoL' }, CTX);
    expect(attend.behaviour).toBe('attend');
    expect(attend.spot).toBe('leftLip');
    expect(attend.expression).toBe('happy');
    expect(attend.reaction).toBe('pointL');
    expect(attend.moving).toBe(true);

    const reacting = advanceSparky(
      { ...idle, ...attend, moving: false },
      { type: 'REACT', reaction: 'cheer' },
      CTX,
    );
    expect(reacting.behaviour).toBe('react');
    expect(reacting.expression).toBe('celebrating');
    expect(reacting.autoReturnMs).toBe(SPARKY_REACTION_MS.cheer);

    const back = advanceSparky(
      { ...idle, behaviour: 'react', reaction: 'cheer', expression: 'celebrating' },
      { type: 'RETURN' },
      CTX,
    );
    expect(back.behaviour).toBe('idle');
    expect(back.reaction).toBeNull();
  });

  it('tap opens a HoloBubble tip stub', () => {
    const tap = advanceSparky(idle, { type: 'TAP' }, CTX);
    expect(tap.behaviour).toBe('react');
    expect(tap.reaction).toBe('tapReact');
    expect(tap.expression).toBe('surprised');
    expect(tap.bubble?.state).toBe('tip');
    expect(tap.bubble?.tip).toBeTruthy();
  });

  it('sleep and whisper override hover/mode until released', () => {
    const sleep = advanceSparky(idle, { type: 'SLEEP' }, CTX);
    expect(sleep.behaviour).toBe('sleep');
    expect(sleep.expression).toBe('sleepy');
    const ignored = advanceSparky(
      { ...idle, behaviour: 'sleep', expression: 'sleepy' },
      { type: 'HOVER', panel: 'holoR' },
      CTX,
    );
    expect(ignored.behaviour).toBe('sleep');
    expect(ignored.spot).toBe('nearCore');

    const whisper = advanceSparky(idle, { type: 'WHISPER' }, CTX);
    expect(whisper.behaviour).toBe('whisper');
    expect(whisper.spot).toBe('frontCenter');
    expect(whisper.bubble?.state).toBe('whisper');
    const still = advanceSparky(
      { ...idle, behaviour: 'whisper', spot: 'frontCenter', expression: 'speaking' },
      { type: 'MODE', mode: 'labsBrowse' },
      CTX,
    );
    expect(still.behaviour).toBe('whisper');
  });

  it('teleports under reduced motion (no walk flag)', () => {
    const walk = advanceSparky(
      idle,
      { type: 'SET_SPOT', spot: 'frontCenter' },
      CTX,
    );
    expect(walk.moving).toBe(true);
    const teleport = advanceSparky(
      idle,
      { type: 'SET_SPOT', spot: 'frontCenter' },
      RM,
    );
    expect(teleport.moving).toBe(false);
    expect(teleport.spot).toBe('frontCenter');
  });

  it('pose-lock freezes the machine (no hop / walk)', () => {
    const frozen = advanceSparky(
      idle,
      { type: 'REACT', reaction: 'cheer' },
      LOCK,
    );
    expect(frozen.behaviour).toBe('idle');
    expect(frozen.moving).toBe(false);
    expect(frozen.autoReturnMs).toBeNull();
  });

  it('maps cheap Director ids onto spots', () => {
    const labs = advanceSparky(
      idle,
      { type: 'DIRECTOR', id: 'hub-labsbrowse' },
      CTX,
    );
    expect(labs.spot).toBe('leftLip');
    expect(labs.behaviour).toBe('attend');
    const dual = advanceSparky(
      idle,
      { type: 'DIRECTOR', id: 'dual-enter' },
      CTX,
    );
    expect(dual.spot).toBe('frontCenter');
    const burst = advanceSparky(
      idle,
      { type: 'DIRECTOR', id: 'game-launch-burst' },
      CTX,
    );
    expect(burst.behaviour).toBe('react');
    expect(burst.reaction).toBe('cheer');
  });

  it('dispatch writes the existing forge slice; tip outlives Sparky return', () => {
    vi.useFakeTimers();
    dispatchSparkyEvent({ type: 'TAP' }, CTX);
    expect(useForgeStore.getState().forge.sparky.behaviour).toBe('react');
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('tip');
    vi.advanceTimersByTime(SPARKY_REACTION_MS.tapReact + 20);
    expect(useForgeStore.getState().forge.sparky.behaviour).toBe('idle');
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('tip');
    vi.advanceTimersByTime(HOLO_BUBBLE_TIP_MS);
    expect(useForgeStore.getState().forge.holoBubble.state).toBe('hidden');
    expect(useForgeStore).toBe(useSceneStore);
  });

  it('exposes shell move attrs for e2e', () => {
    expect(sparkyMoveAttr(true, false, true)).toBe('frozen');
    expect(sparkyMoveAttr(false, true, true)).toBe('teleport');
    expect(sparkyMoveAttr(false, false, true)).toBe('lerp');
    expect(sparkyMoveAttr(false, false, false)).toBe('idle');
  });
});

describe('W3-03 face + dome stubs', () => {
  it('reuses SparkyCore expression names and spec glow colours', () => {
    expect(SPARKY_FACE_GLOW.idle).toBe('#4DE9FF');
    expect(SPARKY_FACE_GLOW.celebrating).toBe('#FFE066');
    expect(SPARKY_FACE_SIZE).toBe(256);
    expect(SPARKY_PALETTE.coral).toMatch(/^#/);
  });

  it('pulses the dome with HoloBubble state (spec §7.4)', () => {
    expect(HOLO_DOME_EMISSIVE.hidden).toBe(0.3);
    expect(HOLO_DOME_EMISSIVE.ping).toBe(0.6);
    expect(HOLO_DOME_EMISSIVE.tip).toBe(1);
    expect(HOLO_DOME_EMISSIVE.chat).toBe(1);
    expect(HOLO_DOME_EMISSIVE.whisper).toBe(1.2);
  });
});
