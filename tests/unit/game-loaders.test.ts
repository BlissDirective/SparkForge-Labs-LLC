// ════════════════════════════════════════════════════════════════
// T14 PERF-MED-001 — Game-loader map parity
// ════════════════════════════════════════════════════════════════
// The dynamic game-loader map MUST stay in 1:1 parity with the
// canonical gameRegistry. If someone adds a game entry but forgets
// the loader (or vice versa), CI fails here with a clear diff.
//
// We also assert every loader is a function (not a pre-resolved
// module) so T14's lazy factory contract is locked in.

import { describe, expect, it } from 'vitest';
import {
  GAME_LOADERS,
  GAME_SLUG_COUNT,
  getGameLoader,
} from '@/app/(dashboard)/arcade/[gameSlug]/game-loaders';
import { GAME_REGISTRY as GAMES } from '@/config/gameRegistry';

describe('T14 — game-loader map', () => {
  it('exports 42 slugs matching GAMES', () => {
    expect(GAME_SLUG_COUNT).toBe(42);
    expect(GAMES.length).toBe(42);
  });

  it('every gameRegistry slug has a loader', () => {
    const missing = GAMES.map((g) => g.slug).filter((slug) => !(slug in GAME_LOADERS));
    expect(missing, `Missing loader for: ${missing.join(', ')}`).toEqual([]);
  });

  it('every loader slug has a gameRegistry entry', () => {
    const registrySlugs = new Set(GAMES.map((g) => g.slug));
    const extra = Object.keys(GAME_LOADERS).filter((slug) => !registrySlugs.has(slug));
    expect(extra, `Loader has no registry entry: ${extra.join(', ')}`).toEqual([]);
  });

  it('every loader is a lazy function (not a pre-resolved promise)', () => {
    for (const [slug, loader] of Object.entries(GAME_LOADERS)) {
      expect(typeof loader, `loader for ${slug} must be a function`).toBe('function');
      // A zero-arg function keeps the factory shape consistent.
      expect(loader.length).toBe(0);
    }
  });

  it('getGameLoader returns undefined for unknown slug', () => {
    expect(getGameLoader('not-a-real-game')).toBeUndefined();
  });

  it('getGameLoader returns a function for a known slug', () => {
    expect(typeof getGameLoader('pet-trainer')).toBe('function');
  });
});
