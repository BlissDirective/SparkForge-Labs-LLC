// ════════════════════════════════════════════════════════════════════════
// ARCHETYPE: SORT / DRAG WORLD — drag tokens into labelled group bins
// ════════════════════════════════════════════════════════════════════════
// Extracted from the Phase-B Sort the Toy Box scene. Pairs with any game
// whose mechanic is "put each item in the right bucket" (clustering,
// classification, sorting). Renders inside <PixiGameStage>.

'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { useTick } from '@pixi/react';
import { Container, Graphics, type FederatedPointerEvent } from 'pixi.js';
import { hexNum, STAGE_PAD } from '../primitives';
import { ChipToken } from '../ChipToken';
import { ParticleField, type ParticleController } from '../ParticleField';

export interface SortItem { id: string; color: string; label: string; }

interface SortDragSceneProps {
  items: SortItem[];
  groupCount: number;
  assignments: Record<string, number | undefined>;
  onAssign: (id: string, group: number) => void;
  labColor: string;
  reducedMotion: boolean;
  width: number;
  height: number;
}

const BIN_H = 92;
const TOY = 56;
const GAP = 12;

interface BinRect { index: number; x: number; y: number; w: number; h: number; }

function layoutBins(w: number, h: number, groupCount: number): BinRect[] {
  const binY = h - BIN_H - STAGE_PAD;
  const gap = 10;
  const binW = (w - STAGE_PAD * 2 - gap * (groupCount - 1)) / groupCount;
  return Array.from({ length: groupCount }, (_, i) => ({
    index: i, x: STAGE_PAD + i * (binW + gap), y: binY, w: binW, h: BIN_H,
  }));
}

function trayPosition(idx: number, w: number): { x: number; y: number } {
  const cols = Math.max(1, Math.floor((w - STAGE_PAD * 2 + GAP) / (TOY + GAP)));
  return {
    x: STAGE_PAD + (idx % cols) * (TOY + GAP) + TOY / 2,
    y: STAGE_PAD + TOY / 2 + Math.floor(idx / cols) * (TOY + GAP),
  };
}

export default function SortDragScene({
  items, groupCount, assignments, onAssign, labColor, reducedMotion, width, height,
}: SortDragSceneProps) {
  const accent = hexNum(labColor);
  const bins = useMemo(() => layoutBins(width, height, groupCount), [width, height, groupCount]);
  const unassigned = useMemo(() => items.filter((t) => assignments[t.id] === undefined), [items, assignments]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverBin, setHoverBin] = useState<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const dragLayerRef = useRef<Container | null>(null);
  const particles = useRef<ParticleController | null>(null);

  const draggingItem = dragId ? items.find((t) => t.id === dragId) ?? null : null;

  const binAt = useCallback((px: number, py: number): number | null => {
    for (const b of bins) {
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b.index;
    }
    return null;
  }, [bins]);

  const onPickup = useCallback((id: string, gx: number, gy: number) => {
    pointerRef.current = { x: gx, y: gy };
    setDragId(id);
  }, []);

  const onMove = useCallback((e: FederatedPointerEvent) => {
    pointerRef.current = { x: e.global.x, y: e.global.y };
    if (dragId) setHoverBin(binAt(e.global.x, e.global.y));
  }, [dragId, binAt]);

  const onUp = useCallback(() => {
    if (!dragId) return;
    const { x, y } = pointerRef.current;
    const bin = binAt(x, y);
    const item = items.find((t) => t.id === dragId);
    if (bin !== null && item) {
      const b = bins[bin];
      particles.current?.burst(b.x + b.w / 2, b.y + b.h / 2, hexNum(item.color));
      onAssign(dragId, bin);
    }
    setDragId(null);
    setHoverBin(null);
  }, [dragId, binAt, bins, items, onAssign]);

  useTick(() => {
    const layer = dragLayerRef.current;
    if (layer && dragId) {
      layer.x = pointerRef.current.x;
      layer.y = pointerRef.current.y;
    }
  });

  const drawBg = useCallback((g: Graphics) => {
    g.clear();
    g.rect(0, 0, width, height);
    g.fill({ color: 0x0a0f1e, alpha: 0.001 });
  }, [width, height]);

  const drawBins = useCallback((g: Graphics) => {
    g.clear();
    for (const b of bins) {
      const hot = hoverBin === b.index;
      g.roundRect(b.x, b.y, b.w, b.h, 14);
      g.fill({ color: accent, alpha: hot ? 0.22 : 0.08 });
      g.roundRect(b.x, b.y, b.w, b.h, 14);
      g.stroke({ color: accent, alpha: hot ? 0.9 : 0.4, width: hot ? 3 : 2 });
    }
  }, [bins, hoverBin, accent]);

  return (
    <pixiContainer>
      <pixiGraphics draw={drawBg} eventMode="static" onPointerMove={onMove} onPointerUp={onUp} onPointerUpOutside={onUp} />

      <pixiGraphics draw={drawBins} />
      {bins.map((b) => {
        const count = items.filter((t) => assignments[t.id] === b.index).length;
        return (
          <pixiContainer key={`label-${b.index}`} x={b.x + b.w / 2} y={b.y + 16}>
            <pixiText text={`Group ${b.index + 1}`} anchor={0.5} style={{ fill: 0xffffff, fontSize: 13, fontWeight: '700', fontFamily: 'system-ui, sans-serif' }} />
            <pixiText text={`${count}`} anchor={0.5} y={20} style={{ fill: accent, fontSize: 16, fontWeight: '700', fontFamily: 'system-ui, sans-serif' }} />
          </pixiContainer>
        );
      })}

      {/* dropped tokens, stacked small inside their bin */}
      {items.map((t) => {
        const g = assignments[t.id];
        if (g === undefined) return null;
        const b = bins[g];
        if (!b) return null;
        const inBin = items.filter((x) => assignments[x.id] === g);
        const order = inBin.findIndex((x) => x.id === t.id);
        const perRow = Math.max(1, Math.floor((b.w - 16) / 30));
        const cx = b.x + 20 + (order % perRow) * 30;
        const cy = b.y + b.h - 22 - Math.floor(order / perRow) * 28;
        return <ChipToken key={t.id} x={cx} y={cy} size={26} color={t.color} label={t.label} />;
      })}

      {/* draggable, unassigned tokens */}
      {unassigned.map((t, i) => {
        if (t.id === dragId) return null;
        const p = trayPosition(i, width);
        return <ChipToken key={t.id} x={p.x} y={p.y} size={TOY} color={t.color} label={t.label} interactive onPointerDown={(gx, gy) => onPickup(t.id, gx, gy)} />;
      })}

      {draggingItem && (
        <pixiContainer ref={dragLayerRef} x={pointerRef.current.x} y={pointerRef.current.y}>
          <ChipToken x={0} y={0} size={TOY + 6} color={draggingItem.color} label={draggingItem.label} />
        </pixiContainer>
      )}

      <ParticleField controllerRef={particles} reducedMotion={reducedMotion} />
    </pixiContainer>
  );
}
