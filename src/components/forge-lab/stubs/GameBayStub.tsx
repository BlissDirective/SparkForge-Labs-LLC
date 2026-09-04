'use client';

import Link from 'next/link';
import type { LabRow } from '@/lib/forge-lab/catalog';

/** Placeholder GameShell mount — does not load real games. */
export function GameBayStub({ lab }: { lab: LabRow }) {
  const preview = lab.games.slice(0, 4);

  return (
    <div className="fl-game-bay" data-slot="game-shell">
      <p className="fl-stub-note">
        Game bay stub. {lab.gamesCount} games stay on /arcade — this is the future
        mount, not a rewrite.
      </p>
      {preview.map((game) => (
        <div key={game.slug} className="fl-game">
          <div>
            <strong>{game.name}</strong>
            <span>{game.tier} · {game.description}</span>
          </div>
          <Link className="fl-chip" href={`/arcade/${game.slug}`}>
            Arcade
          </Link>
        </div>
      ))}
      {preview.length === 0 ? (
        <p className="fl-stub-note">No games registered for this lab yet.</p>
      ) : null}
    </div>
  );
}
