// ════════════════════════════════════════════════════════════════════════
// PIXI SORT STAGE — Fable Frontend Enhancement, Phase B proof-of-pattern
// ════════════════════════════════════════════════════════════════════════
// Rebuilds the "sort" (play) phase of Sort the Toy Box as a real WebGL/WebGPU
// scene inside the existing GameShell, per Fable-Frontend-Enhancement.md §4
// Phase B. Demonstrates the rendering layer the standard games lack:
//   • drag-and-drop mechanic (not a click-quiz)
//   • particle burst + glow on a correct drop
//   • sprite-style tweened tokens, screen feel
//   • Frost-Prismatic palette seeded from the lab color
//
// Architecture boundary (doc §5 risk 3): the GameShell is always React DOM;
// only the play phase owns this canvas. State stays in the parent's store;
// this component is presentational + drag input, calling onAssign upward.
//
// Accessibility (doc §2.3): the canvas is opaque to the a11y tree, so we
// pair it with an aria-live status and a keyboard control strip that drives
// the same onAssign — pointer users drag, keyboard/AT users use buttons.
//
// Dev loop (doc §2.3): publishes scene state to window.__SPARKFORGE_GAME__.

'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Application, extend, useTick } from '@pixi/react';
import { Container, Graphics, Text, type FederatedPointerEvent } from 'pixi.js';
import { publishScene } from '@/lib/dev/gameInspector';

extend({ Container, Graphics, Text });

// ─── Public types ───

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
  /** Lab accent (Frost-Prismatic seed). */
  labColor: string;
  reducedMotion?: boolean;
  height?: number;
}

// ─── Helpers ───

const hexNum = (hex: string): number => parseInt(hex.replace('#', ''), 16) || 0x4f6ef7;
const code = (type: string): string => type.slice(0, 3).toUpperCase();

const PAD = 16;
const BIN_H = 92;
const TOY = 56;
const GAP = 12;
const MIN_W = 320;

interface BinRect { index: number; x: number; y: number; w: number; h: number; }

function layoutBins(w: number, h: number, groupCount: number): BinRect[] {
  const binY = h - BIN_H - PAD;
  const gap = 10;
  const binW = (w - PAD * 2 - gap * (groupCount - 1)) / groupCount;
  return Array.from({ length: groupCount }, (_, i) => ({
    index: i,
    x: PAD + i * (binW + gap),
    y: binY,
    w: binW,
    h: BIN_H,
  }));
}

function trayPosition(idx: number, w: number): { x: number; y: number } {
  const cols = Math.max(1, Math.floor((w - PAD * 2 + GAP) / (TOY + GAP)));
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  return {
    x: PAD + col * (TOY + GAP) + TOY / 2,
    y: PAD + TOY / 2 + row * (TOY + GAP),
  };
}

// ─── Particles (imperative, no per-frame React render) ───

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: number; r: number; }

function ParticleLayer({ engineRef, reducedMotion }: {
  engineRef: React.MutableRefObject<Particle[]>;
  reducedMotion: boolean;
}) {
  const gRef = useRef<Graphics | null>(null);
  const noopDraw = useCallback(() => {}, []);

  useTick(({ deltaTime }) => {
    const parts = engineRef.current;
    const g = gRef.current;
    if (!g) return;
    g.clear();
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= deltaTime;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (!reducedMotion) {
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.vy += 0.18 * deltaTime; // gravity
      }
      const alpha = Math.max(0, p.life / p.max);
      g.circle(p.x, p.y, p.r * (0.5 + alpha * 0.5));
      g.fill({ color: p.color, alpha });
    }
  });

  return <pixiGraphics ref={gRef} draw={noopDraw} />;
}

// ─── A single toy token (drawn procedurally — no external sprite needed) ───

function ToyToken({ toy, x, y, size, interactive, onPickup }: {
  toy: SortToy;
  x: number;
  y: number;
  size: number;
  interactive: boolean;
  onPickup?: (toy: SortToy, globalX: number, globalY: number) => void;
}) {
  const col = hexNum(toy.color);
  const r = size / 2;

  const draw = useCallback((g: Graphics) => {
    g.clear();
    // soft glow halo
    g.circle(0, 0, r * 1.25);
    g.fill({ color: col, alpha: 0.18 });
    // chip
    g.roundRect(-r, -r, size, size, r * 0.5);
    g.fill({ color: col, alpha: 0.9 });
    g.roundRect(-r, -r, size, size, r * 0.5);
    g.stroke({ color: 0xffffff, alpha: 0.35, width: 2 });
    // top highlight
    g.roundRect(-r * 0.7, -r * 0.7, size * 0.7, size * 0.32, r * 0.3);
    g.fill({ color: 0xffffff, alpha: 0.22 });
  }, [col, r, size]);

  return (
    <pixiContainer
      x={x}
      y={y}
      eventMode={interactive ? 'static' : 'none'}
      cursor={interactive ? 'pointer' : undefined}
      onPointerDown={interactive && onPickup ? (e: FederatedPointerEvent) => onPickup(toy, e.global.x, e.global.y) : undefined}
    >
      <pixiGraphics draw={draw} />
      <pixiText
        text={code(toy.type)}
        anchor={0.5}
        style={{ fill: 0xffffff, fontSize: Math.round(size * 0.26), fontWeight: '700', fontFamily: 'system-ui, sans-serif' }}
      />
    </pixiContainer>
  );
}

// ─── The scene (runs inside <Application>) ───

function Scene({ toys, groupCount, assignments, onAssign, labColor, reducedMotion, width, height }: {
  toys: SortToy[];
  groupCount: number;
  assignments: Record<string, number | undefined>;
  onAssign: (toyId: string, group: number) => void;
  labColor: string;
  reducedMotion: boolean;
  width: number;
  height: number;
}) {
  const accent = hexNum(labColor);
  const bins = useMemo(() => layoutBins(width, height, groupCount), [width, height, groupCount]);

  const unassigned = useMemo(() => toys.filter((t) => assignments[t.id] === undefined), [toys, assignments]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverBin, setHoverBin] = useState<number | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const dragLayerRef = useRef<Container | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  const draggingToy = dragId ? toys.find((t) => t.id === dragId) ?? null : null;

  const binAt = useCallback((px: number, py: number): number | null => {
    for (const b of bins) {
      if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b.index;
    }
    return null;
  }, [bins]);

  const spawnBurst = useCallback((cx: number, cy: number, color: number) => {
    const n = reducedMotion ? 6 : 18;
    for (let i = 0; i < n; i++) {
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3;
      particlesRef.current.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 2,
        life: 24 + Math.random() * 16,
        max: 40,
        color,
        r: 3 + Math.random() * 3,
      });
    }
  }, [reducedMotion]);

  const onPickup = useCallback((toy: SortToy, gx: number, gy: number) => {
    pointerRef.current = { x: gx, y: gy };
    setDragId(toy.id);
  }, []);

  const onMove = useCallback((e: FederatedPointerEvent) => {
    pointerRef.current = { x: e.global.x, y: e.global.y };
    if (dragId) setHoverBin(binAt(e.global.x, e.global.y));
  }, [dragId, binAt]);

  const onUp = useCallback(() => {
    if (!dragId) return;
    const { x, y } = pointerRef.current;
    const bin = binAt(x, y);
    const toy = toys.find((t) => t.id === dragId);
    if (bin !== null && toy) {
      const b = bins[bin];
      spawnBurst(b.x + b.w / 2, b.y + b.h / 2, hexNum(toy.color));
      onAssign(dragId, bin);
    }
    setDragId(null);
    setHoverBin(null);
  }, [dragId, binAt, bins, toys, onAssign, spawnBurst]);

  // Drag layer follows the pointer imperatively (no per-frame React render).
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
    g.fill({ color: 0x0a0f1e, alpha: 0.001 }); // near-invisible but hit-testable
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
      {/* event surface */}
      <pixiGraphics
        draw={drawBg}
        eventMode="static"
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerUpOutside={onUp}
      />

      {/* bins */}
      <pixiGraphics draw={drawBins} />
      {bins.map((b) => {
        const count = toys.filter((t) => assignments[t.id] === b.index).length;
        return (
          <pixiContainer key={`label-${b.index}`} x={b.x + b.w / 2} y={b.y + 16}>
            <pixiText
              text={`Group ${b.index + 1}`}
              anchor={0.5}
              style={{ fill: 0xffffff, fontSize: 13, fontWeight: '700', fontFamily: 'system-ui, sans-serif' }}
            />
            <pixiText
              text={`${count}`}
              anchor={0.5}
              y={20}
              style={{ fill: accent, fontSize: 16, fontWeight: '700', fontFamily: 'system-ui, sans-serif' }}
            />
          </pixiContainer>
        );
      })}

      {/* toys already dropped, stacked small inside their bin */}
      {toys.map((t) => {
        const g = assignments[t.id];
        if (g === undefined) return null;
        const b = bins[g];
        if (!b) return null;
        const inBin = toys.filter((x) => assignments[x.id] === g);
        const order = inBin.findIndex((x) => x.id === t.id);
        const perRow = Math.max(1, Math.floor((b.w - 16) / 30));
        const cx = b.x + 20 + (order % perRow) * 30;
        const cy = b.y + b.h - 22 - Math.floor(order / perRow) * 28;
        return <ToyToken key={t.id} toy={t} x={cx} y={cy} size={26} interactive={false} />;
      })}

      {/* unassigned, draggable toys (skip the one being dragged) */}
      {unassigned.map((t, i) => {
        if (t.id === dragId) return null;
        const p = trayPosition(i, width);
        return <ToyToken key={t.id} toy={t} x={p.x} y={p.y} size={TOY} interactive onPickup={onPickup} />;
      })}

      {/* dragging toy on top */}
      {draggingToy && (
        <pixiContainer ref={dragLayerRef} x={pointerRef.current.x} y={pointerRef.current.y}>
          <ToyToken toy={draggingToy} x={0} y={0} size={TOY + 6} interactive={false} />
        </pixiContainer>
      )}

      {/* particles on top of everything */}
      <ParticleLayer engineRef={particlesRef} reducedMotion={reducedMotion} />
    </pixiContainer>
  );
}

// ─── Public component (DOM wrapper + canvas + a11y fallback) ───

export default function PixiSortStage({
  toys, groupCount, assignments, onAssign, labColor, reducedMotion = false, height = 420,
}: PixiSortStageProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: height });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width ?? 0;
      setSize({ w: Math.max(MIN_W, Math.floor(cw)), h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  const total = toys.length;
  const sorted = toys.filter((t) => assignments[t.id] !== undefined).length;
  const nextToy = toys.find((t) => assignments[t.id] === undefined) ?? null;

  // Dev inspector: surface canvas-internal state for the Playwright loop.
  useEffect(() => {
    publishScene({
      stage: 'pixi-sort',
      total,
      sorted,
      remaining: total - sorted,
      groupCount,
    });
  }, [total, sorted, groupCount]);

  return (
    <div role="group" aria-label="Toy sorting board">
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ height, background: 'linear-gradient(135deg, #0E1428, #0A0F1E)', border: `1px solid ${labColor}30` }}
      >
        {size.w > 0 && (
          <Application
            key={`${size.w}x${size.h}`}
            width={size.w}
            height={size.h}
            backgroundAlpha={0}
            antialias
            resolution={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
            autoDensity
          >
            <Scene
              toys={toys}
              groupCount={groupCount}
              assignments={assignments}
              onAssign={onAssign}
              labColor={labColor}
              reducedMotion={reducedMotion}
              width={size.w}
              height={size.h}
            />
          </Application>
        )}
      </div>

      {/* a11y status — canvas is opaque to the accessibility tree */}
      <p aria-live="polite" className="sr-only">
        {sorted} of {total} toys sorted.
      </p>

      {/* keyboard / AT control strip — drives the same onAssign as dragging */}
      <div className="mt-3" role="group" aria-label="Keyboard sorting controls">
        {nextToy ? (
          <>
            <p className="mb-2 text-xs font-semibold" style={{ color: '#8C94AC' }}>
              Drag a toy into a group — or send{' '}
              <span style={{ color: labColor }}>{nextToy.label}</span> to:
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
          </>
        ) : (
          <p className="text-xs font-semibold" style={{ color: '#2ECC71' }}>
            All toys sorted — ready for the AI reveal.
          </p>
        )}
      </div>
    </div>
  );
}
