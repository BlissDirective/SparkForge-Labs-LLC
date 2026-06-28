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
import ReactionArena, { type TargetContent } from './scenes/ReactionArena';

interface PixiReactStageProps {
  active: boolean;
  onHit: (correct?: boolean) => void;
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
  /** Labeled "card" mode — called once per spawn to fill the target. */
  makeTarget?: () => TargetContent;
  /**
   * Keyboard/AT choices for labeled mode. When provided, the fallback shows a
   * button per choice (clicking calls onHit with its correctness) instead of
   * the single press-to-catch button.
   */
  choices?: { label: string; correct: boolean }[];
  reducedMotion?: boolean;
  height?: number;
}

export default function PixiReactStage({
  active, onHit, onMiss, labColor, status,
  actionLabel = 'Catch', spawnEveryMs, lifeMs, maxConcurrent, palette, makeTarget, choices,
  reducedMotion = false, height = 420,
}: PixiReactStageProps) {
  // Keyboard / AT control. In labeled mode, expose the current choices as
  // buttons; otherwise a single press-to-catch button drives the speed loop.
  const a11y = choices && choices.length ? (
    <div role="group" aria-label="Keyboard reaction choices">
      <p className="mb-2 text-xs font-semibold" style={{ color: '#8C94AC' }}>
        Tap rising cards — or pick the best option:
      </p>
      <div className="flex flex-wrap gap-2">
        {choices.map((c, i) => (
          <button
            key={`${c.label}-${i}`}
            type="button"
            disabled={!active}
            onClick={() => onHit(c.correct)}
            className="min-h-11 rounded-xl px-4 text-sm font-bold transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: `${labColor}18`,
              color: labColor,
              border: `2px solid ${labColor}40`,
              ['--tw-ring-color' as string]: labColor,
            }}
            aria-label={`Choose ${c.label}`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  ) : (
    <div role="group" aria-label="Keyboard reaction control">
      <button
        type="button"
        disabled={!active}
        onClick={() => onHit()}
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
          makeTarget={makeTarget}
        />
      )}
    </PixiGameStage>
  );
}
