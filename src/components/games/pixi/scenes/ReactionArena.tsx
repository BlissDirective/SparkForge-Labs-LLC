// ════════════════════════════════════════════════════════════════════════
// ARCHETYPE: REACTION / TIMING ARENA — tap targets before they expire
// ════════════════════════════════════════════════════════════════════════
// Pairs with speed/attention games. Targets spawn at random positions with a
// closing time-ring; tapping one is a hit, letting it expire is a miss. The
// scene self-drives spawning + timing; the parent owns scoring via onHit /
// onMiss and gates play with `active`. Renders inside <PixiGameStage>.

'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useTick } from '@pixi/react';
import { Graphics } from 'pixi.js';
import { hexNum, STAGE_PAD } from '../primitives';
import { ParticleField, type ParticleController } from '../ParticleField';

interface ReactionArenaProps {
  active: boolean;
  labColor: string;
  reducedMotion: boolean;
  width: number;
  height: number;
  onHit: () => void;
  onMiss: () => void;
  spawnEveryMs?: number;
  lifeMs?: number;
  maxConcurrent?: number;
  palette?: string[];
}

interface Target { id: number; x: number; y: number; color: number; }

const R = 30;
const DEFAULT_PALETTE = ['#4F6EF7', '#E945F5', '#2ECC71', '#F59E0B', '#00B894'];

// One target: draws + times itself; reports hit/expire once.
function ArenaTarget({ x, y, color, lifeMs, onHit, onExpire }: {
  x: number; y: number; color: number; lifeMs: number; onHit: () => void; onExpire: () => void;
}) {
  const ringRef = useRef<Graphics | null>(null);
  const start = useRef(performance.now());
  const done = useRef(false);

  useTick(() => {
    const g = ringRef.current;
    if (!g) return;
    const t = Math.min(1, (performance.now() - start.current) / lifeMs);
    g.clear();
    g.circle(0, 0, R);
    g.fill({ color, alpha: 0.92 });
    g.circle(0, 0, R);
    g.stroke({ color: 0xffffff, alpha: 0.45, width: 2 });
    // closing time-ring
    g.circle(0, 0, R + 4 + (1 - t) * 14);
    g.stroke({ color: 0xffffff, alpha: 0.55 * (1 - t), width: 3 });
    if (t >= 1 && !done.current) { done.current = true; onExpire(); }
  });

  return (
    <pixiContainer
      x={x}
      y={y}
      eventMode="static"
      cursor="pointer"
      onPointerDown={() => { if (!done.current) { done.current = true; onHit(); } }}
    >
      <pixiGraphics ref={ringRef} draw={() => {}} />
    </pixiContainer>
  );
}

export default function ReactionArena({
  active, labColor, reducedMotion, width, height, onHit, onMiss,
  spawnEveryMs = 1100, lifeMs = 1600, maxConcurrent = 3, palette,
}: ReactionArenaProps) {
  const [targets, setTargets] = useState<Target[]>([]);
  const nextId = useRef(0);
  const particles = useRef<ParticleController | null>(null);
  // Seed the palette with the lab accent so targets stay on-brand by default.
  const colors = useMemo(
    () => (palette && palette.length ? palette : [labColor, ...DEFAULT_PALETTE]),
    [palette, labColor],
  );

  useEffect(() => {
    if (!active) return;
    const spawn = () => {
      setTargets((prev) => {
        if (prev.length >= maxConcurrent) return prev;
        const x = STAGE_PAD + R + Math.random() * (width - STAGE_PAD * 2 - R * 2);
        const y = STAGE_PAD + R + Math.random() * (height - STAGE_PAD * 2 - R * 2);
        const color = hexNum(colors[Math.floor(Math.random() * colors.length)]);
        return [...prev, { id: nextId.current++, x, y, color }];
      });
    };
    const interval = setInterval(spawn, spawnEveryMs);
    return () => clearInterval(interval);
  }, [active, spawnEveryMs, maxConcurrent, width, height, colors]);

  const remove = useCallback((id: number) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleHit = useCallback((t: Target) => {
    particles.current?.burst(t.x, t.y, t.color);
    remove(t.id);
    onHit();
  }, [remove, onHit]);

  const handleExpire = useCallback((id: number) => {
    remove(id);
    onMiss();
  }, [remove, onMiss]);

  return (
    <pixiContainer>
      {targets.map((t) => (
        <ArenaTarget
          key={t.id}
          x={t.x}
          y={t.y}
          color={t.color}
          lifeMs={lifeMs}
          onHit={() => handleHit(t)}
          onExpire={() => handleExpire(t.id)}
        />
      ))}
      <ParticleField controllerRef={particles} reducedMotion={reducedMotion} />
    </pixiContainer>
  );
}
