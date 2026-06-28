// ════════════════════════════════════════════════════════════════════════
// ARCHETYPE: REACTION / TIMING ARENA — tap targets before they expire
// ════════════════════════════════════════════════════════════════════════
// Pairs with speed/attention games. Targets spawn at random positions with a
// closing time-ring; tapping one is a hit, letting it expire is a miss. The
// scene self-drives spawning + timing; the parent owns scoring via onHit /
// onMiss and gates play with `active`. Renders inside <PixiGameStage>.
//
// Two modes:
//   • Generic (default): plain colored circles — "catch any target" speed drill.
//   • Labeled "card" mode: supply `makeTarget()` returning a label (+ optional
//     correctness + probability bar). Targets render as word cards; onHit
//     receives whether that card was the correct choice. Powers "tap the
//     likeliest next word" (Word Predictor) without forking the scene.

'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useTick } from '@pixi/react';
import { Graphics } from 'pixi.js';
import { hexNum, STAGE_PAD, clamp } from '../primitives';
import { ParticleField, type ParticleController } from '../ParticleField';

export interface TargetContent {
  label?: string;
  correct?: boolean;
  /** 0–1 probability, drawn as a small bar on the card. */
  prob?: number;
  /** Hex color string for this target; falls back to the palette. */
  color?: string;
}

interface ReactionArenaProps {
  active: boolean;
  labColor: string;
  reducedMotion: boolean;
  width: number;
  height: number;
  onHit: (correct?: boolean) => void;
  onMiss: () => void;
  spawnEveryMs?: number;
  lifeMs?: number;
  maxConcurrent?: number;
  palette?: string[];
  /** Supply to switch to labeled "card" mode — called once per spawn. */
  makeTarget?: () => TargetContent;
}

interface Target { id: number; x: number; y: number; color: number; content?: TargetContent; }

const R = 30;
const CARD_HW = 56;
const CARD_HH = 24;
const DEFAULT_PALETTE = ['#4F6EF7', '#E945F5', '#2ECC71', '#F59E0B', '#00B894'];

// One target: draws + times itself; reports hit/expire once.
function ArenaTarget({ x, y, color, content, lifeMs, onHit, onExpire }: {
  x: number; y: number; color: number; content?: TargetContent; lifeMs: number;
  onHit: () => void; onExpire: () => void;
}) {
  const gRef = useRef<Graphics | null>(null);
  const start = useRef(performance.now());
  const done = useRef(false);
  const labeled = !!content?.label;

  useTick(() => {
    const g = gRef.current;
    if (!g) return;
    const t = Math.min(1, (performance.now() - start.current) / lifeMs);
    g.clear();
    if (labeled) {
      g.roundRect(-CARD_HW, -CARD_HH, CARD_HW * 2, CARD_HH * 2, 12);
      g.fill({ color, alpha: 0.92 });
      g.roundRect(-CARD_HW, -CARD_HH, CARD_HW * 2, CARD_HH * 2, 12);
      g.stroke({ color: 0xffffff, alpha: 0.4, width: 2 });
      // probability bar (static) just under the word
      if (typeof content?.prob === 'number') {
        const bw = CARD_HW * 2 - 16;
        g.roundRect(-CARD_HW + 8, CARD_HH - 13, bw, 5, 2);
        g.fill({ color: 0x0a0f1e, alpha: 0.5 });
        g.roundRect(-CARD_HW + 8, CARD_HH - 13, bw * clamp(content.prob, 0, 1), 5, 2);
        g.fill({ color: 0xffffff, alpha: 0.85 });
      }
      // life bar (depletes along the bottom edge)
      g.rect(-CARD_HW, CARD_HH - 3, CARD_HW * 2 * (1 - t), 3);
      g.fill({ color: 0xffffff, alpha: 0.5 });
    } else {
      g.circle(0, 0, R);
      g.fill({ color, alpha: 0.92 });
      g.circle(0, 0, R);
      g.stroke({ color: 0xffffff, alpha: 0.45, width: 2 });
      // closing time-ring
      g.circle(0, 0, R + 4 + (1 - t) * 14);
      g.stroke({ color: 0xffffff, alpha: 0.55 * (1 - t), width: 3 });
    }
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
      <pixiGraphics ref={gRef} draw={() => {}} />
      {labeled && (
        <pixiText
          text={content!.label!}
          anchor={0.5}
          y={-5}
          style={{
            fill: 0xffffff, fontSize: 13, fontWeight: '700',
            fontFamily: 'system-ui, sans-serif', align: 'center',
            wordWrap: true, wordWrapWidth: CARD_HW * 2 - 12,
          }}
        />
      )}
    </pixiContainer>
  );
}

export default function ReactionArena({
  active, labColor, reducedMotion, width, height, onHit, onMiss,
  spawnEveryMs = 1100, lifeMs = 1600, maxConcurrent = 3, palette, makeTarget,
}: ReactionArenaProps) {
  const [targets, setTargets] = useState<Target[]>([]);
  const nextId = useRef(0);
  const particles = useRef<ParticleController | null>(null);
  // Seed the palette with the lab accent so targets stay on-brand by default.
  const colors = useMemo(
    () => (palette && palette.length ? palette : [labColor, ...DEFAULT_PALETTE]),
    [palette, labColor],
  );
  // Keep makeTarget in a ref so it doesn't reset the spawn interval each render.
  const makeTargetRef = useRef(makeTarget);
  makeTargetRef.current = makeTarget;

  useEffect(() => {
    if (!active) return;
    const spawn = () => {
      setTargets((prev) => {
        if (prev.length >= maxConcurrent) return prev;
        const content = makeTargetRef.current?.();
        const labeled = !!content?.label;
        const halfW = labeled ? CARD_HW : R;
        const halfH = labeled ? CARD_HH : R;
        const x = STAGE_PAD + halfW + Math.random() * Math.max(1, width - STAGE_PAD * 2 - halfW * 2);
        const y = STAGE_PAD + halfH + Math.random() * Math.max(1, height - STAGE_PAD * 2 - halfH * 2);
        const color = hexNum(content?.color ?? colors[Math.floor(Math.random() * colors.length)]);
        return [...prev, { id: nextId.current++, x, y, color, content }];
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
    onHit(t.content?.correct);
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
          content={t.content}
          lifeMs={lifeMs}
          onHit={() => handleHit(t)}
          onExpire={() => handleExpire(t.id)}
        />
      ))}
      <ParticleField controllerRef={particles} reducedMotion={reducedMotion} />
    </pixiContainer>
  );
}
