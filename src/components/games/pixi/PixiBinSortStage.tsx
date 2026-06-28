// ════════════════════════════════════════════════════════════════════════
// PIXI BIN SORT STAGE — generic "drag items into named bins" play surface
// ════════════════════════════════════════════════════════════════════════
// Sibling of PixiSortStage (which is tuned to Sort the Toy Box's toy codes).
// This one takes arbitrary items + named bins, so any classification game can
// reuse it: privacy bins, tool bins, class bins, emotion bins. Thin composition
// of <PixiGameStage> + <SortDragScene> with a keyboard/AT fallback.
//
// Wave-2 proof game: Data Shield (Lab 6) — Private / Shareable / Sensitive.

'use client';

import PixiGameStage from './PixiGameStage';
import SortDragScene, { type SortItem } from './scenes/SortDragScene';

export interface BinSortItem extends SortItem {
  /** Full human name for the keyboard/AT path (chip shows the short label). */
  name?: string;
}

interface PixiBinSortStageProps {
  items: BinSortItem[];
  /** Named bins, in order. groupCount is derived from this. */
  bins: string[];
  assignments: Record<string, number | undefined>;
  onAssign: (id: string, bin: number) => void;
  labColor: string;
  reducedMotion?: boolean;
  height?: number;
}

export default function PixiBinSortStage({
  items, bins, assignments, onAssign, labColor, reducedMotion = false, height = 420,
}: PixiBinSortStageProps) {
  const total = items.length;
  const sorted = items.filter((t) => assignments[t.id] !== undefined).length;
  const nextItem = items.find((t) => assignments[t.id] === undefined) ?? null;

  // Keyboard / AT control strip — drives the same onAssign as dragging.
  const a11y = nextItem ? (
    <div role="group" aria-label="Keyboard sorting controls">
      <p className="mb-2 text-xs font-semibold" style={{ color: '#8C94AC' }}>
        Drag an item into a bin — or send{' '}
        <span style={{ color: labColor }}>{nextItem.name ?? nextItem.label}</span> to:
      </p>
      <div className="flex flex-wrap gap-2">
        {bins.map((binName, i) => (
          <button
            key={binName}
            type="button"
            onClick={() => onAssign(nextItem.id, i)}
            className="min-h-11 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: `${labColor}18`,
              color: labColor,
              border: `2px solid ${labColor}40`,
              ['--tw-ring-color' as string]: labColor,
            }}
            aria-label={`Send ${nextItem.name ?? nextItem.label} to ${binName}`}
          >
            {binName}
          </button>
        ))}
      </div>
    </div>
  ) : (
    <p className="text-xs font-semibold" style={{ color: '#2ECC71' }}>
      All items sorted — ready to check.
    </p>
  );

  return (
    <PixiGameStage
      labColor={labColor}
      ariaLabel="Sorting board"
      height={height}
      status={`${sorted} of ${total} items sorted.`}
      inspector={{ stage: 'pixi-bin-sort', total, sorted, remaining: total - sorted, bins: bins.length }}
      a11y={a11y}
    >
      {({ width, height: h }) => (
        <SortDragScene
          items={items}
          groupCount={bins.length}
          assignments={assignments}
          onAssign={onAssign}
          labColor={labColor}
          reducedMotion={reducedMotion}
          width={width}
          height={h}
          binLabels={bins}
        />
      )}
    </PixiGameStage>
  );
}
