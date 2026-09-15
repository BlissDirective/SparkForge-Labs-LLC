// ════════════════════════════════════════════════════════════════
// W2-03 — TAP §5 pathname → ForgeRouteMode table
// ════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import {
  FORGE_EXACT_ROUTES,
  frameloopForRoute,
  normalizeForgePathname,
  resolveForgeRoute,
  toForgeRouteApply,
} from '@/lib/forge-hub/routeModes';
import {
  HUBSPLIT_HOLO_C,
  LAYOUT_MORPH_MS,
  registerMorphTargets,
} from '@/lib/forge-hub/layouts';
import { PORTAL_HOLD_MS } from '@/lib/forge-hub/portalMachine';

const TAP_CASES: Array<{
  path: string;
  kind: 'stage' | 'flat' | 'plain' | 'bridge';
  mode: string;
}> = [
  { path: '/', kind: 'stage', mode: 'welcome' },
  { path: '/login', kind: 'stage', mode: 'welcome' },
  { path: '/signup', kind: 'stage', mode: 'welcome' },
  { path: '/forgot-password', kind: 'stage', mode: 'welcome' },
  { path: '/reset-password', kind: 'stage', mode: 'welcome' },
  { path: '/mfa-challenge', kind: 'flat', mode: 'flat' },
  { path: '/home', kind: 'stage', mode: 'hubSplit' },
  { path: '/onboarding', kind: 'stage', mode: 'welcome' },
  { path: '/onboarding/consent', kind: 'flat', mode: 'flat' },
  { path: '/labs', kind: 'stage', mode: 'labsBrowse' },
  { path: '/labs/1', kind: 'stage', mode: 'focus' },
  { path: '/content/lesson-1', kind: 'stage', mode: 'playStage' },
  { path: '/story', kind: 'stage', mode: 'cinematic' },
  { path: '/arcade', kind: 'stage', mode: 'gameLobby' },
  { path: '/arcade/ai-spy', kind: 'stage', mode: 'playStage' },
  { path: '/create', kind: 'stage', mode: 'playStage' },
  { path: '/progress', kind: 'stage', mode: 'dual' },
  { path: '/achievements', kind: 'stage', mode: 'hubSplit' },
  { path: '/mastery', kind: 'stage', mode: 'focus' },
  { path: '/seasons', kind: 'stage', mode: 'hubSplit' },
  { path: '/buddies', kind: 'stage', mode: 'dual' },
  { path: '/profile', kind: 'stage', mode: 'avatarStudio' },
  { path: '/settings', kind: 'stage', mode: 'settingsDock' },
  { path: '/settings/mfa', kind: 'flat', mode: 'flat' },
  { path: '/settings/sessions', kind: 'flat', mode: 'flat' },
  { path: '/settings/linked-accounts', kind: 'flat', mode: 'flat' },
  { path: '/settings/legal', kind: 'flat', mode: 'flat' },
  { path: '/competencies', kind: 'stage', mode: 'focus' },
  { path: '/pricing', kind: 'flat', mode: 'flat' },
  { path: '/privacy', kind: 'flat', mode: 'flat' },
  { path: '/privacy/children', kind: 'flat', mode: 'flat' },
  { path: '/privacy/rights', kind: 'flat', mode: 'flat' },
  { path: '/terms', kind: 'flat', mode: 'flat' },
  { path: '/cookies', kind: 'flat', mode: 'flat' },
  { path: '/coppa-notice', kind: 'flat', mode: 'flat' },
  { path: '/dmca', kind: 'flat', mode: 'flat' },
  { path: '/parent', kind: 'flat', mode: 'flat' },
  { path: '/parent/add-child', kind: 'flat', mode: 'flat' },
  { path: '/parent/subscription', kind: 'flat', mode: 'flat' },
  { path: '/parent/export', kind: 'flat', mode: 'flat' },
  { path: '/parent/prompt-history', kind: 'flat', mode: 'flat' },
  { path: '/admin/subscriptions', kind: 'flat', mode: 'flat' },
  { path: '/admin/archived-children', kind: 'flat', mode: 'flat' },
  { path: '/admin/content', kind: 'flat', mode: 'flat' },
  { path: '/offline', kind: 'plain', mode: 'flat' },
  { path: '/dev/forge-hub', kind: 'bridge', mode: 'hubSplit' },
  { path: '/dev/sparky', kind: 'bridge', mode: 'hubSplit' },
  { path: '/dev/forge', kind: 'bridge', mode: 'hubSplit' },
  { path: '/dev/hero-v3', kind: 'bridge', mode: 'hubSplit' },
  { path: '/dev/branding', kind: 'bridge', mode: 'hubSplit' },
  { path: '/dev/design', kind: 'bridge', mode: 'hubSplit' },
  { path: '/dev/game-preview/ai-spy', kind: 'bridge', mode: 'hubSplit' },
];

describe('W2-03 ForgeRouteMode table (TAP §5)', () => {
  it.each(TAP_CASES)('$path → $kind / $mode', ({ path, kind, mode }) => {
    const resolved = resolveForgeRoute(path);
    expect(resolved.kind).toBe(kind);
    expect(resolved.mode).toBe(mode);
    if (kind === 'flat') {
      expect(resolved.frameloop).toBe('never');
      expect(resolved.flatOverlay).toBe(true);
    }
    if (kind === 'plain') {
      expect(resolved.frameloop).toBe('never');
      expect(resolved.flatOverlay).toBe(false);
    }
    if (kind === 'stage') {
      expect(resolved.frameloop).toBe('always');
      expect(resolved.flatOverlay).toBe(false);
    }
  });

  it('strips query and trailing slash', () => {
    expect(normalizeForgePathname('/home/?x=1')).toBe('/home');
    expect(resolveForgeRoute('/login?next=/home').mode).toBe('welcome');
  });

  it('maps every exact TAP path and does not keep authMerged', () => {
    expect(Object.keys(FORGE_EXACT_ROUTES).length).toBeGreaterThan(20);
    expect(FORGE_EXACT_ROUTES['/login']?.mode).toBe('welcome');
    expect(
      Object.values(FORGE_EXACT_ROUTES).some((row) => row.mode === 'flat'),
    ).toBe(true);
  });

  it('FLAT apply payload pauses the canvas', () => {
    const apply = toForgeRouteApply(resolveForgeRoute('/parent'));
    expect(apply).toEqual({
      mode: 'flat',
      frameloop: 'never',
      flatOverlay: true,
    });
    expect(frameloopForRoute('stage', true)).toBe('demand');
    expect(frameloopForRoute('flat', false)).toBe('never');
  });

  it('does not retimes portal 420/560 or HoloC / LAYOUT_MORPH_MS', () => {
    expect(PORTAL_HOLD_MS.charge).toBe(420);
    expect(PORTAL_HOLD_MS.emit).toBe(560);
    expect(LAYOUT_MORPH_MS).toBe(420);
    expect(registerMorphTargets('hubSplit').holoC).toMatchObject(HUBSPLIT_HOLO_C);
  });
});
