// ════════════════════════════════════════════════════════════════════════
// CHIP TOKEN — procedural glowing token used across Pixi archetypes (Phase C)
// ════════════════════════════════════════════════════════════════════════
// A self-contained, drawn token (no external sprite). Frost-Prismatic glow +
// chip + highlight + short label. Used by the Sort/Drag world; reusable by
// any scene that needs a tappable/draggable item.

'use client';

import { useCallback } from 'react';
import { Graphics, type FederatedPointerEvent } from 'pixi.js';
import { hexNum } from './primitives';

export interface ChipTokenProps {
  x: number;
  y: number;
  size: number;
  /** Hex color string, e.g. "#FF6B35". */
  color: string;
  /** Short label drawn on the chip (kept emoji-free per Ui-Creation.md). */
  label: string;
  interactive?: boolean;
  onPointerDown?: (globalX: number, globalY: number) => void;
}

export function ChipToken({ x, y, size, color, label, interactive = false, onPointerDown }: ChipTokenProps) {
  const col = hexNum(color);
  const r = size / 2;

  const draw = useCallback((g: Graphics) => {
    g.clear();
    g.circle(0, 0, r * 1.25);
    g.fill({ color: col, alpha: 0.18 });
    g.roundRect(-r, -r, size, size, r * 0.5);
    g.fill({ color: col, alpha: 0.9 });
    g.roundRect(-r, -r, size, size, r * 0.5);
    g.stroke({ color: 0xffffff, alpha: 0.35, width: 2 });
    g.roundRect(-r * 0.7, -r * 0.7, size * 0.7, size * 0.32, r * 0.3);
    g.fill({ color: 0xffffff, alpha: 0.22 });
  }, [col, r, size]);

  return (
    <pixiContainer
      x={x}
      y={y}
      eventMode={interactive ? 'static' : 'none'}
      cursor={interactive ? 'pointer' : undefined}
      onPointerDown={interactive && onPointerDown ? (e: FederatedPointerEvent) => onPointerDown(e.global.x, e.global.y) : undefined}
    >
      <pixiGraphics draw={draw} />
      <pixiText
        text={label}
        anchor={0.5}
        style={{ fill: 0xffffff, fontSize: Math.round(size * 0.26), fontWeight: '700', fontFamily: 'system-ui, sans-serif' }}
      />
    </pixiContainer>
  );
}
