// ════════════════════════════════════════════════════════════════
// first-visit-ignition arm — Stagehand tip, no new store.
// Reads useForgeStore route/flat selectors + ForgeRouteMode.
// Production `/` `/login` stay gated until FORGE_HUB (W10).
// /dev/forge-hub plays on ?ignition=1 (lab first-visit stand-in).
// ════════════════════════════════════════════════════════════════

import {
  normalizeForgePathname,
  type ForgeRouteKind,
} from './routeModes';

export const IGNITION_SEEN_KEY = 'sparkforge:forge-hub:ignition-seen';

export interface FirstVisitIgnitionInput {
  pathname: string;
  routeKind: ForgeRouteKind;
  poseLock: boolean;
  flatOverlay: boolean;
  skipIntro: boolean;
  reducedMotion: boolean;
  /** /dev/forge-hub?ignition=1 — first-visit stand-in on the lab. */
  ignitionQuery: boolean;
  seen: boolean;
  /** Production FORGE_HUB flag. Unset = gated (W10). */
  forgeHubEnabled: boolean;
}

export type FirstVisitIgnitionArm =
  | { kind: 'hold' }
  | { kind: 'play'; reducedMotion: boolean }
  | { kind: 'welcome-idle' };

export function isForgeHubProductionEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const raw = env.NEXT_PUBLIC_FORGE_HUB ?? env.FORGE_HUB;
  return raw === '1' || raw === 'true';
}

export function readIgnitionSeen(
  storage: Pick<Storage, 'getItem'> | null | undefined = globalThis.sessionStorage,
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(IGNITION_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeIgnitionSeen(
  storage: Pick<Storage, 'setItem'> | null | undefined = globalThis.sessionStorage,
): void {
  if (!storage) return;
  try {
    storage.setItem(IGNITION_SEEN_KEY, '1');
  } catch {
    // private mode / SSR
  }
}

/**
 * Decide whether first-visit-ignition should play against the live tip.
 * Does not steal EscapeFlat / FLAT / pose=lock. Does not start Theatre
 * when skip-hero is on (lands welcome-idle instead).
 */
export function armFirstVisitIgnition(
  input: FirstVisitIgnitionInput,
): FirstVisitIgnitionArm {
  if (input.poseLock) return { kind: 'hold' };
  if (input.flatOverlay) return { kind: 'hold' };
  if (input.routeKind === 'flat' || input.routeKind === 'plain') {
    return { kind: 'hold' };
  }

  const path = normalizeForgePathname(input.pathname);
  const isDevLab = path === '/dev/forge-hub';
  const isWelcomeRoute = path === '/' || path === '/login';

  let eligible = false;
  if (isDevLab && input.ignitionQuery) eligible = true;
  if (isWelcomeRoute && input.forgeHubEnabled) eligible = true;
  if (!eligible) return { kind: 'hold' };

  if (input.seen) return { kind: 'welcome-idle' };
  if (input.skipIntro) return { kind: 'welcome-idle' };

  return { kind: 'play', reducedMotion: input.reducedMotion };
}
