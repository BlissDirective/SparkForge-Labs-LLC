// ════════════════════════════════════════════════════════════════════════
// PIXI SORT STAGE — Sort the Toy Box play surface
// ════════════════════════════════════════════════════════════════════════
// Phase B proved the pattern here; Phase C extracted the reusable parts.
// This is now a thin composition of the shared <PixiGameStage> shell + the
// <SortDragScene> archetype, plus the game's keyboard/AT fallback. Its public
// API is unchanged, so SortToyBoxGame needs no edits.

'use client';

import { shortCode } from './primitives';
import PixiGameStage from './PixiGameStage';
import SortDragScene, { type SortItem } from './scenes/SortDragScene';

export interface SortToy {
  id: string;
  type: string;
  /** Hex color string, e.g. "#FF6B35". */
  color: string;
  /** Human label for ARIA, e.g. "Toy Train". */
  label: string;
}

interface PixiSortStageProps {
  toys: SortToy[];
  groupCount: number;
  assignments: Record<string, number | undefined>;
  onAssign: (toyId: string, group: number) => void;
  labColor: string;
  reducedMotion?: boolean;
  height?: number;
}

export default function PixiSortStage({
  toys, groupCount, assignments, onAssign, labColor, reducedMotion = false, height = 420,
}: PixiSortStageProps) {
  const total = toys.length;
  const sorted = toys.filter((t) => assignments[t.id] !== undefined).length;
  const nextToy = toys.find((t) => assignments[t.id] === undefined) ?? null;

  const sceneItems: SortItem[] = toys.map((t) => ({ id: t.id, color: t.color, label: shortCode(t.type) }));

  // Keyboard / AT control strip — drives the same onAssign as dragging.
  const a11y = nextToy ? (
    <div role="group" aria-label="Keyboard sorting controls">
      <p className="mb-2 text-xs font-semibold" style={{ color: '#8C94AC' }}>
        Drag a toy into a group — or send <span style={{ color: labColor }}>{nextToy.label}</span> to:
      </p>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: groupCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onAssign(nextToy.id, i)}
            className="min-h-11 min-w-11 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: `${labColor}18`,
              color: labColor,
              border: `2px solid ${labColor}40`,
              ['--tw-ring-color' as string]: labColor,
            }}
            aria-label={`Send ${nextToy.label} to Group ${i + 1}`}
          >
            Group {i + 1}
          </button>
        ))}
      </div>
    </div>
  ) : (
    <p className="text-xs font-semibold" style={{ color: '#2ECC71' }}>
      All toys sorted — ready for the AI reveal.
    </p>
  );

  return (
    <PixiGameStage
      labColor={labColor}
      ariaLabel="Toy sorting board"
      height={height}
      status={`${sorted} of ${total} toys sorted.`}
      inspector={{ stage: 'pixi-sort', total, sorted, remaining: total - sorted, groupCount }}
      a11y={a11y}
    >
      {({ width, height: h }) => (
        <SortDragScene
          items={sceneItems}
          groupCount={groupCount}
          assignments={assignments}
          onAssign={onAssign}
          labColor={labColor}
          reducedMotion={reducedMotion}
          width={width}
          height={h}
        />
      )}
    </PixiGameStage>
  );
}
