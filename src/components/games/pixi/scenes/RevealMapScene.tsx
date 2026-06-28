// ════════════════════════════════════════════════════════════════════════
// ARCHETYPE: EXPLORE / REVEAL MAP — tap tiles to uncover what's hidden
// ════════════════════════════════════════════════════════════════════════
// Pairs with discovery games ("find the AI-generated image", "spot the bias",
// memory/search). A grid of covered tiles; tapping reveals one — some hide a
// prize. The parent owns the revealed set + prize placement + scoring.
// Renders inside <PixiGameStage>.

'use client';

import { useRef, useCallback, useMemo } from 'react';
import { Graphics } from 'pixi.js';
import { hexNum, STAGE_PAD, clamp } from '../primitives';
import { ParticleField, type ParticleController } from '../ParticleField';

export interface RevealTile { id: string; isPrize: boolean; label?: string; }

interface RevealMapSceneProps {
  tiles: RevealTile[];
  columns: number;
  revealed: Record<string, boolean>;
  onReveal: (id: string, isPrize: boolean) => void;
  labColor: string;
  reducedMotion: boolean;
  width: number;
  height: number;
  /**
   * When true, a covered tile shows its label instead of "?" — for hunts where
   * the object is visible but its hidden property (e.g. "uses AI") is what the
   * tap uncovers. Defaults to false (classic memory/search "?" cover).
   */
  showLabelsCovered?: boolean;
}

const GAP = 10;

export default function RevealMapScene({
  tiles, columns, revealed, onReveal, labColor, reducedMotion, width, height,
  showLabelsCovered = false,
}: RevealMapSceneProps) {
  const accent = hexNum(labColor);
  const cols = Math.max(1, columns);
  const rows = Math.ceil(tiles.length / cols);

  const cell = useMemo(() => {
    const w = (width - STAGE_PAD * 2 - GAP * (cols - 1)) / cols;
    const h = (height - STAGE_PAD * 2 - GAP * (rows - 1)) / rows;
    return clamp(Math.min(w, h), 24, 120);
  }, [width, height, cols, rows]);

  const gridW = cols * cell + (cols - 1) * GAP;
  const gridH = rows * cell + (rows - 1) * GAP;
  const originX = (width - gridW) / 2;
  const originY = (height - gridH) / 2;

  const particles = useRef<ParticleController | null>(null);

  const posOf = useCallback((i: number) => ({
    x: originX + (i % cols) * (cell + GAP),
    y: originY + Math.floor(i / cols) * (cell + GAP),
  }), [originX, originY, cols, cell]);

  return (
    <pixiContainer>
      {tiles.map((tile, i) => {
        const { x, y } = posOf(i);
        const isOpen = !!revealed[tile.id];
        const cx = x + cell / 2;
        const cy = y + cell / 2;
        return (
          <pixiContainer
            key={tile.id}
            x={x}
            y={y}
            eventMode={isOpen ? 'none' : 'static'}
            cursor={isOpen ? undefined : 'pointer'}
            onPointerDown={() => {
              if (isOpen) return;
              if (tile.isPrize) particles.current?.burst(cx, cy, accent);
              onReveal(tile.id, tile.isPrize);
            }}
          >
            <pixiGraphics
              draw={(g: Graphics) => {
                g.clear();
                g.roundRect(0, 0, cell, cell, 12);
                if (!isOpen) {
                  g.fill({ color: 0x1a2238, alpha: 0.9 });
                  g.roundRect(0, 0, cell, cell, 12);
                  g.stroke({ color: accent, alpha: 0.35, width: 2 });
                } else if (tile.isPrize) {
                  g.fill({ color: accent, alpha: 0.92 });
                  g.roundRect(0, 0, cell, cell, 12);
                  g.stroke({ color: 0xffffff, alpha: 0.6, width: 2 });
                } else {
                  g.fill({ color: 0x0e1428, alpha: 0.6 });
                  g.roundRect(0, 0, cell, cell, 12);
                  g.stroke({ color: 0x3a4258, alpha: 0.4, width: 1 });
                }
              }}
            />
            {(() => {
              const wordy = (showLabelsCovered && !!tile.label) || (isOpen && !!tile.label);
              const text = isOpen
                ? (tile.label ?? (tile.isPrize ? 'WIN' : '-'))
                : (showLabelsCovered ? (tile.label ?? '?') : '?');
              return (
                <pixiText
                  text={text}
                  anchor={0.5}
                  x={cell / 2}
                  y={cell / 2}
                  style={{
                    fill: isOpen && tile.isPrize ? 0xffffff : isOpen ? 0xaeb6cc : 0x8c94ac,
                    fontSize: wordy ? clamp(Math.round(cell * 0.16), 10, 16) : Math.round(cell * 0.3),
                    fontWeight: '700',
                    fontFamily: 'system-ui, sans-serif',
                    align: 'center',
                    wordWrap: wordy,
                    wordWrapWidth: cell - 10,
                  }}
                />
              );
            })()}
          </pixiContainer>
        );
      })}
      <ParticleField controllerRef={particles} reducedMotion={reducedMotion} />
    </pixiContainer>
  );
}
