// ════════════════════════════════════════════════════
// GAME ROUTER — T14 PERF-MED-001 (Opt A)
// ════════════════════════════════════════════════════
// Every game is dynamic-imported. T14 refactors the lookup from
// an eagerly-built map of 35 `dynamic()` wrappers to a lazy
// factory (one wrapper per render, per slug). Chunk splits
// remain 1:1 per game.
//
// All wrappers use `ssr: false` because games touch window,
// localStorage, and WebGL context creation inside effects.
//
// Loader map + tests live in `./game-loaders.ts` (Next.js forbids
// extra named exports from a `page.tsx`).
//
// Stage 10 Part 2 · v2 [BUG-10E] + [ENH-10D] · MISSING-7A resolved.
// ════════════════════════════════════════════════════

'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useActiveChild } from '@/hooks/useChildren';
import { getGameBySlug } from '@/config/gameRegistry';
import { GAME_LOADERS } from './game-loaders';

function GameLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div
          className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-neon-blue border-t-transparent animate-spin"
          aria-hidden="true"
        />
        <p className="font-display text-sm text-white/40">Loading game...</p>
      </div>
    </div>
  );
}

export default function GamePage() {
  const { gameSlug } = useParams<{ gameSlug: string }>();
  const activeChild = useActiveChild();

  // Materialize the `dynamic()` wrapper for THIS slug only, memoed.
  // When the user navigates to a different game, the old wrapper is
  // GC'd along with its preload queue.
  const GameComponent = useMemo(() => {
    const loader = GAME_LOADERS[gameSlug];
    if (!loader) return null;
    return dynamic(loader, {
      ssr: false,
      loading: GameLoader,
    });
  }, [gameSlug]);

  // S7-HIGH-004: Age band enforcement — check game registry for band restrictions
  const gameConfig = getGameBySlug(gameSlug);
  const childBand = activeChild?.age_band || 'B';
  if (GameComponent && gameConfig?.ageBands && !gameConfig.ageBands.includes(childBand)) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4" aria-hidden="true">🔒</div>
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Age Restricted
          </h2>
          <p className="font-body text-sm text-white/40 mb-2">
            This game is designed for {gameConfig.ageBands.map(b =>
              b === 'A' ? 'ages 7-10' : b === 'B' ? 'ages 11-13' : 'ages 14-16'
            ).join(', ')}.
          </p>
          <p className="font-body text-xs text-white/30 mb-6">
            Check out other games in the Arcade that match your age group!
          </p>
          <Link
            href="/arcade"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-display font-bold text-sm hover:bg-white/10 transition-colors inline-block"
          >
            Back to Arcade
          </Link>
        </div>
      </div>
    );
  }

  if (!GameComponent) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center max-w-md">
          <div
            className="text-5xl mb-4 font-display font-bold text-neon-blue/30"
            aria-hidden="true"
          >
            ?
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">
            Game Not Found
          </h2>
          <p className="font-body text-sm text-white/40 mb-6">
            This game may have drifted into a black hole!
          </p>
          <Link
            href="/arcade"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-display font-bold text-sm hover:bg-white/10 transition-colors inline-block"
          >
            Back to Arcade
          </Link>
        </div>
      </div>
    );
  }

  // S4-HIGH-002: GameShell is enforced at the individual game level —
  // each game imports and renders <GameShell> internally, which calls
  // sceneStore.enterGame/exitGame for cockpit integration.
  return <GameComponent />;
}
