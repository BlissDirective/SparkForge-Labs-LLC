// ════════════════════════════════════════════════════════════════
// W2-07 P2 exit morph cycle — welcome → hubSplit → playStage →
// gameLobby → welcome. Director owns slice-1 ids; later MOTION_BIBLE
// morphs (lobby-playstage-merge / playstage-lobby-split) are not in
// slice 1, so those hops `applyForgeRoute` on the live forge slice.
// No new Zustand store.
// ════════════════════════════════════════════════════════════════

import { forgeRouteForDevMode } from '@/lib/forge-hub/devHud';
import {
  getForgeDirector,
  DIRECTOR_RM_MS,
  LAYOUT_MORPH_MS,
  LOGIN_SUCCESS_HUBSPLIT_MS,
} from '@/lib/forge-hub/director';
import type { ForgeMode } from '@/lib/forge-hub/types';
import { useForgeStore } from '@/stores/sceneStore';

/** TAP W2 / P2 exit sequence. */
export const P2_MORPH_CYCLE = [
  'welcome',
  'hubSplit',
  'playStage',
  'gameLobby',
  'welcome',
] as const;

export type P2MorphCycleMode = (typeof P2_MORPH_CYCLE)[number];

export type P2MorphHopKind = 'director' | 'route';

export interface P2MorphHop {
  from: P2MorphCycleMode;
  to: P2MorphCycleMode;
  kind: P2MorphHopKind;
  /** Slice-1 id, or null when Stagehand hops via applyForgeRoute. */
  directorId: 'welcome-idle' | 'login-success-hubsplit' | null;
}

export const P2_MORPH_HOPS: readonly P2MorphHop[] = [
  {
    from: 'welcome',
    to: 'hubSplit',
    kind: 'director',
    directorId: 'login-success-hubsplit',
  },
  {
    from: 'hubSplit',
    to: 'playStage',
    kind: 'route',
    directorId: null,
  },
  {
    from: 'playStage',
    to: 'gameLobby',
    kind: 'route',
    directorId: null,
  },
  {
    from: 'gameLobby',
    to: 'welcome',
    kind: 'director',
    directorId: 'welcome-idle',
  },
];

export function p2HopDurationMs(hop: P2MorphHop, reducedMotion: boolean): number {
  if (hop.directorId === 'login-success-hubsplit') {
    return reducedMotion ? DIRECTOR_RM_MS : LOGIN_SUCCESS_HUBSPLIT_MS;
  }
  if (hop.directorId === 'welcome-idle') return 0;
  return reducedMotion ? DIRECTOR_RM_MS : LAYOUT_MORPH_MS;
}

export interface RunP2MorphCycleOptions {
  reducedMotion: boolean;
  onStep?: (mode: P2MorphCycleMode, index: number) => void;
  waitMs?: (ms: number) => Promise<void>;
}

function applyDevMode(mode: ForgeMode, reducedMotion: boolean): void {
  useForgeStore
    .getState()
    .applyForgeRoute(forgeRouteForDevMode(mode, reducedMotion));
}

/**
 * Kill the Director so leftover layoutFrom/To do not pin live slots
 * after login-success-hubsplit (W2-05 hops are applyForgeRoute-only).
 */
export function releaseDirectorLayout(): void {
  getForgeDirector().kill();
}

export async function runP2MorphCycle(
  opts: RunP2MorphCycleOptions,
): Promise<void> {
  const wait =
    opts.waitMs ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const rm = opts.reducedMotion;
  const director = getForgeDirector();

  applyDevMode('welcome', rm);
  director.play('welcome-idle', { reducedMotion: rm });
  opts.onStep?.('welcome', 0);
  await wait(16);

  for (let i = 0; i < P2_MORPH_HOPS.length; i += 1) {
    const hop = P2_MORPH_HOPS[i];
    if (hop.kind === 'director' && hop.directorId) {
      director.play(hop.directorId, { reducedMotion: rm });
    } else {
      releaseDirectorLayout();
      applyDevMode(hop.to, rm);
    }
    await wait(p2HopDurationMs(hop, rm) + 40);
    opts.onStep?.(hop.to, i + 1);
  }
}
