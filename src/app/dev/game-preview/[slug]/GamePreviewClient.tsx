'use client';

// ════════════════════════════════════════════════════════════════════════
// DEV GAME PREVIEW — render any game by slug, no auth, for the Playwright loop
// ════════════════════════════════════════════════════════════════════════
// Fable-Frontend-Enhancement.md §2.3 / Game-Migration-Map.md DoD: the canvas is
// opaque to the a11y tree, so the migrated scenes publish state to
// window.__SPARKFORGE_GAME__. This route mounts a single game (GameShell brings
// its own JuiceProvider; the root layout brings QueryProvider) so the smoke
// test can screenshot the scene and assert that state textually — without the
// Supabase-gated dashboard auth flow. Dev-only (the page guards production).

import { useMemo } from 'react';
import nextDynamic from 'next/dynamic';
import { GAME_LOADERS } from '@/app/(dashboard)/arcade/[gameSlug]/game-loaders';

export default function GamePreviewClient({ slug }: { slug: string }) {
  const Game = useMemo(() => {
    const loader = GAME_LOADERS[slug];
    if (!loader) return null;
    return nextDynamic(() => loader(), {
      ssr: false,
      loading: () => (
        <div className="p-8 text-sm" style={{ color: '#8C94AC' }}>Loading {slug}…</div>
      ),
    });
  }, [slug]);

  if (!Game) {
    return (
      <div className="p-8 text-sm text-red-400" data-testid="game-preview-unknown">
        Unknown game slug: {slug}
      </div>
    );
  }

  return (
    <div data-testid="game-preview" data-slug={slug} className="mx-auto max-w-2xl p-4">
      <Game />
    </div>
  );
}
