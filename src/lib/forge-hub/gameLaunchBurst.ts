// ════════════════════════════════════════════════════════════════
// game-launch-burst arm — MOTION_BIBLE §5.4.
// Optional Theatre cheer AFTER lobby-playstage-merge.
// Session-first glass launch default. Does not gate first input.
// No new Zustand store. No production FORGE_HUB flag.
// ════════════════════════════════════════════════════════════════

import type { ForgeMode } from './types';

export const GAME_LAUNCH_BURST_SEEN_KEY =
  'sparkforge:forge-hub:game-launch-burst-seen';

export interface GameLaunchBurstInput {
  poseLock: boolean;
  flatOverlay: boolean;
  reducedMotion: boolean;
  seen: boolean;
  /**
   * HUD / `?burst=1` — play even if this session already launched.
   * Reduced-motion still builds the 0ms skip path (bible: skip the burst).
   */
  force: boolean;
  /** True when Director just finished `lobby-playstage-merge`. */
  fromMerge: boolean;
  mode: ForgeMode;
  morphProgress: number;
}

export type GameLaunchBurstArm =
  | { kind: 'hold' }
  | { kind: 'play' }
  | { kind: 'skip' };

export function readBurstSeen(
  storage: Pick<Storage, 'getItem'> | null | undefined = globalThis.sessionStorage,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(GAME_LAUNCH_BURST_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeBurstSeen(
  storage: Pick<Storage, 'setItem'> | null | undefined = globalThis.sessionStorage,
): void {
  if (!storage) return;
  try {
    storage.setItem(GAME_LAUNCH_BURST_SEEN_KEY, '1');
  } catch {
    // private mode / SSR
  }
}

export function clearBurstSeen(
  storage: Pick<Storage, 'removeItem'> | null | undefined = globalThis.sessionStorage,
): void {
  if (!storage) return;
  try {
    storage.removeItem(GAME_LAUNCH_BURST_SEEN_KEY);
  } catch {
    // private mode / SSR
  }
}

/**
 * Decide whether the optional Theatre burst should play.
 * Skip if RM, already played this session, or the game is already
 * interactive without a just-finished merge (deep link / sitting on
 * PlayStage). Force is HUD / `?burst=1` only.
 */
export function armGameLaunchBurst(
  input: GameLaunchBurstInput,
): GameLaunchBurstArm {
  if (input.poseLock) return { kind: 'hold' };
  if (input.flatOverlay) return { kind: 'hold' };

  if (input.force) return { kind: 'play' };

  if (input.reducedMotion) return { kind: 'skip' };

  if (input.seen) return { kind: 'skip' };

  const alreadyInteractive =
    input.mode === 'playStage' && input.morphProgress >= 1 && !input.fromMerge;
  if (alreadyInteractive) return { kind: 'skip' };

  if (!input.fromMerge) return { kind: 'hold' };

  return { kind: 'play' };
}
