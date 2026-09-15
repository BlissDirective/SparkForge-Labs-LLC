// ════════════════════════════════════════════════════════════════
// Forge Hub — pathname → ForgeRouteMode (TAP v2.2 §2.1 / §5)
// ════════════════════════════════════════════════════════════════
// Pure table. The provider writes the same sceneStore forge slice
// (useForgeStore). No new Zustand store. FLAT → frameloop never +
// EscapeFlat. /dev/* is BRIDGE so /dev/forge-hub keeps the switcher.

import type {
  ForgeFrameloop,
  ForgeMode,
  ForgeRouteApply,
  ForgeRouteKind,
  ForgeRouteWave,
} from './types';

export type { ForgeRouteApply, ForgeRouteKind, ForgeRouteWave };

export interface ForgeRouteResolution {
  kind: ForgeRouteKind;
  mode: ForgeMode;
  frameloop: ForgeFrameloop;
  flatOverlay: boolean;
  wave: ForgeRouteWave;
}

function stage(mode: ForgeMode, wave: ForgeRouteWave): ForgeRouteResolution {
  return {
    kind: 'stage',
    mode,
    frameloop: 'always',
    flatOverlay: false,
    wave,
  };
}

function flat(wave: ForgeRouteWave = 'FLAT'): ForgeRouteResolution {
  return {
    kind: 'flat',
    mode: 'flat',
    frameloop: 'never',
    flatOverlay: true,
    wave,
  };
}

function plain(): ForgeRouteResolution {
  return {
    kind: 'plain',
    mode: 'flat',
    frameloop: 'never',
    flatOverlay: false,
    wave: 'plain',
  };
}

function bridge(): ForgeRouteResolution {
  return {
    kind: 'bridge',
    mode: 'hubSplit',
    frameloop: 'always',
    flatOverlay: false,
    wave: 'BRIDGE',
  };
}

export const FORGE_FLAT_ROUTE: ForgeRouteResolution = flat();

/**
 * TAP §5 exact paths. Dynamic / prefix rules live in resolveForgeRoute.
 * `authMerged` is not a live mode — welcome seats the auth forms.
 */
export const FORGE_EXACT_ROUTES: Record<string, ForgeRouteResolution> = {
  '/': stage('welcome', '1'),
  '/login': stage('welcome', '1'),
  '/signup': stage('welcome', '1'),
  '/forgot-password': stage('welcome', '1'),
  '/reset-password': stage('welcome', '1'),
  '/mfa-challenge': flat(),
  '/home': stage('hubSplit', '1'),
  '/onboarding': stage('welcome', '1'),
  '/onboarding/consent': flat(),
  '/labs': stage('labsBrowse', '2'),
  '/arcade': stage('gameLobby', '3'),
  '/create': stage('playStage', '3'),
  '/story': stage('cinematic', '2'),
  '/progress': stage('dual', '4'),
  '/achievements': stage('hubSplit', '4'),
  '/mastery': stage('focus', '4'),
  '/seasons': stage('hubSplit', '4'),
  '/buddies': stage('dual', '4'),
  '/profile': stage('avatarStudio', '5'),
  '/settings': stage('settingsDock', '5'),
  '/settings/mfa': flat(),
  '/settings/sessions': flat(),
  '/settings/linked-accounts': flat(),
  '/settings/legal': flat(),
  '/competencies': stage('focus', '5'),
  '/pricing': flat(),
  '/privacy': flat(),
  '/privacy/children': flat(),
  '/privacy/rights': flat(),
  '/terms': flat(),
  '/cookies': flat(),
  '/coppa-notice': flat(),
  '/dmca': flat(),
  '/parent': flat(),
  '/parent/add-child': flat(),
  '/parent/subscription': flat(),
  '/parent/export': flat(),
  '/parent/prompt-history': flat(),
  '/admin/subscriptions': flat(),
  '/admin/archived-children': flat(),
  '/admin/content': flat(),
  '/offline': plain(),
};

export function normalizeForgePathname(pathname: string): string {
  const raw = pathname.split(/[?#]/, 1)[0] ?? '/';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

export function frameloopForRoute(
  kind: ForgeRouteKind,
  prefersReducedMotion: boolean,
): ForgeFrameloop {
  if (kind === 'flat' || kind === 'plain') return 'never';
  return prefersReducedMotion ? 'demand' : 'always';
}

export function isForgeFlatRoute(resolution: ForgeRouteResolution): boolean {
  return resolution.kind === 'flat' || resolution.mode === 'flat';
}

export function resolveForgeRoute(pathname: string): ForgeRouteResolution {
  const path = normalizeForgePathname(pathname);
  const exact = FORGE_EXACT_ROUTES[path];
  if (exact) return exact;

  if (path === '/dev' || path.startsWith('/dev/')) return bridge();
  if (path === '/parent' || path.startsWith('/parent/')) return flat();
  if (path === '/admin' || path.startsWith('/admin/')) return flat();
  if (path.startsWith('/privacy/')) return flat();
  if (path.startsWith('/settings/')) return flat();
  if (path.startsWith('/labs/')) return stage('focus', '2');
  if (path.startsWith('/arcade/')) return stage('playStage', '3');
  if (path.startsWith('/content/')) return stage('playStage', '2');

  return stage('hubSplit', '1');
}

export function toForgeRouteApply(
  resolution: ForgeRouteResolution,
  prefersReducedMotion = false,
): ForgeRouteApply {
  return {
    mode: resolution.mode,
    frameloop: frameloopForRoute(resolution.kind, prefersReducedMotion),
    flatOverlay: resolution.flatOverlay,
  };
}
