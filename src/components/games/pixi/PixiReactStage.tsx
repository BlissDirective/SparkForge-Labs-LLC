// ════════════════════════════════════════════════════════════════════════
// PIXI REACT STAGE — reaction / timing play surface (Phase C archetype)
// ════════════════════════════════════════════════════════════════════════
// Thin composition of the shared <PixiGameStage> shell + the <ReactionArena>
// archetype, plus a keyboard/AT fallback (a press-to-catch button). Pairs with
// speed/attention games. The scene self-drives spawning + timing; the parent
// owns scoring via onHit/onMiss and gates play with `active`.
//
// Wave-1 proof game: AI or Not? (Lab 10) — catch the AI "tells" at speed.

'use client';

import PixiGameStage from './PixiGameStage';
import ReactionArena from './scenes/ReactionArena';

interface PixiReactStageProps {
  active: boolean;
  onHit: () => void;
  onMiss: () => void;
  labColor: string;
  /** aria-live status line (e.g. score / streak) owned by the parent. */
  status?: string;
  /** Verb shown on the keyboard fallback button. */
  actionLabel?: string;
  spawnEveryMs?: number;
  lifeMs?: number;
  maxConcurrent?: number;
  palette?: string[];
  reducedMotion?: boolean;
  height?: number;
}

export default function PixiReactStage({
  active, onHit, onMiss, labColor, status,
  actionLabel = 'Catch', spawnEveryMs, lifeMs, maxConcurrent, palette,
  reducedMotion = false, height = 420,
}: PixiReactStageProps) {
  // Keyboard / AT control: a press-to-catch button awards a hit each press while
  // the round is live, so non-pointer players can score on the same loop.
  const a11y = (
    <div role="group" aria-label="Keyboard reaction control">
      <button
        type="button"
        disabled={!active}
        onClick={onHit}
        className="min-h-12 w-full rounded-xl px-4 text-base font-bold transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2"
        style={{
          background: `${labColor}20`,
          color: labColor,
          border: `2px solid ${labColor}55`,
          ['--tw-ring-color' as string]: labColor,
        }}
        aria-label={active ? `${actionLabel} a target` : 'Round not active'}
      >
        {actionLabel}!
      </button>
      <p className="mt-2 text-xs" style={{ color: '#8C94AC' }}>
        Tap targets in the arena — or press this button fast while the round runs.
      </p>
    </div>
  );

  return (
    <PixiGameStage
      labColor={labColor}
      ariaLabel="Reaction arena"
      height={height}
      status={status}
      inspector={{ stage: 'pixi-react', active }}
      a11y={a11y}
    >
      {({ width, height: h }) => (
        <ReactionArena
          active={active}
          labColor={labColor}
          reducedMotion={reducedMotion}
          width={width}
          height={h}
          onHit={onHit}
          onMiss={onMiss}
          spawnEveryMs={spawnEveryMs}
          lifeMs={lifeMs}
          maxConcurrent={maxConcurrent}
          palette={palette}
        />
      )}
    </PixiGameStage>
  );
}
