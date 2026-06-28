// ════════════════════════════════════════════════════════════════════════
// PIXI REVEAL STAGE — discovery / hunt play surface (Phase C archetype)
// ════════════════════════════════════════════════════════════════════════
// Thin composition of the shared <PixiGameStage> shell + the <RevealMapScene>
// archetype, plus a keyboard/AT fallback. Pairs with "hunt the X" games:
// tap a tile to uncover whether it hides a prize. The parent owns the tile
// set, the revealed map, prize placement, and scoring.
//
// Wave-1 proof game: AI Spy (Lab 1) — hunt the objects that use AI.

'use client';

import PixiGameStage from './PixiGameStage';
import RevealMapScene, { type RevealTile } from './scenes/RevealMapScene';

export type { RevealTile };

interface PixiRevealStageProps {
  tiles: RevealTile[];
  columns: number;
  revealed: Record<string, boolean>;
  onReveal: (id: string, isPrize: boolean) => void;
  labColor: string;
  /** Verb shown in the keyboard fallback, e.g. "Flag as AI". */
  actionLabel?: string;
  /** Show object labels on covered tiles (hunt mode). */
  showLabelsCovered?: boolean;
  reducedMotion?: boolean;
  height?: number;
}

export default function PixiRevealStage({
  tiles, columns, revealed, onReveal, labColor,
  actionLabel = 'Reveal', showLabelsCovered = false, reducedMotion = false, height = 420,
}: PixiRevealStageProps) {
  const total = tiles.length;
  const openCount = tiles.filter((t) => revealed[t.id]).length;
  const found = tiles.filter((t) => revealed[t.id] && t.isPrize).length;
  const prizeTotal = tiles.filter((t) => t.isPrize).length;
  const pending = tiles.filter((t) => !revealed[t.id]);

  // Keyboard / AT control strip — drives the same onReveal as tapping a tile.
  const a11y = pending.length ? (
    <div role="group" aria-label="Keyboard reveal controls">
      <p className="mb-2 text-xs font-semibold" style={{ color: '#8C94AC' }}>
        Tap a tile — or pick one to {actionLabel.toLowerCase()}:
      </p>
      <div className="flex flex-wrap gap-2">
        {pending.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onReveal(t.id, t.isPrize)}
            className="min-h-11 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: `${labColor}18`,
              color: labColor,
              border: `2px solid ${labColor}40`,
              ['--tw-ring-color' as string]: labColor,
            }}
            aria-label={`${actionLabel}: ${t.label ?? t.id}`}
          >
            {t.label ?? t.id}
          </button>
        ))}
      </div>
    </div>
  ) : (
    <p className="text-xs font-semibold" style={{ color: '#2ECC71' }}>
      Every tile revealed — {found} of {prizeTotal} found.
    </p>
  );

  return (
    <PixiGameStage
      labColor={labColor}
      ariaLabel="Discovery board"
      height={height}
      status={`${openCount} of ${total} tiles revealed; ${found} of ${prizeTotal} found.`}
      inspector={{ stage: 'pixi-reveal', total, revealed: openCount, found, prizeTotal }}
      a11y={a11y}
    >
      {({ width, height: h }) => (
        <RevealMapScene
          tiles={tiles}
          columns={columns}
          revealed={revealed}
          onReveal={onReveal}
          labColor={labColor}
          reducedMotion={reducedMotion}
          width={width}
          height={h}
          showLabelsCovered={showLabelsCovered}
        />
      )}
    </PixiGameStage>
  );
}
