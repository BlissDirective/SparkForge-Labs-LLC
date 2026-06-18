// ════════════════════════════════════════════════════════════════════════
// PARTICLE FIELD — reusable burst particle layer for Pixi scenes (Phase C)
// ════════════════════════════════════════════════════════════════════════
// Mount once near the top of a scene; drive it imperatively (no per-frame
// React renders) by calling controllerRef.current.burst(x, y, color).

'use client';

import { useRef, useEffect, type MutableRefObject } from 'react';
import { useTick } from '@pixi/react';
import { Graphics } from 'pixi.js';
import './primitives';

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: number; r: number; }

export interface ParticleController {
  burst: (x: number, y: number, color: number, count?: number) => void;
}

const NOOP_DRAW = () => {};

export function ParticleField({ controllerRef, reducedMotion }: {
  controllerRef: MutableRefObject<ParticleController | null>;
  reducedMotion: boolean;
}) {
  const particles = useRef<Particle[]>([]);
  const gRef = useRef<Graphics | null>(null);

  useEffect(() => {
    controllerRef.current = {
      burst: (x, y, color, count = 18) => {
        const n = reducedMotion ? Math.min(6, count) : count;
        for (let i = 0; i < n; i++) {
          const ang = (Math.PI * 2 * i) / n + Math.random() * 0.3;
          const speed = 2 + Math.random() * 3;
          particles.current.push({
            x, y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed - 2,
            life: 24 + Math.random() * 16,
            max: 40,
            color,
            r: 3 + Math.random() * 3,
          });
        }
      },
    };
    return () => { controllerRef.current = null; };
  }, [controllerRef, reducedMotion]);

  useTick(({ deltaTime }) => {
    const g = gRef.current;
    if (!g) return;
    const parts = particles.current;
    g.clear();
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= deltaTime;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      if (!reducedMotion) {
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.vy += 0.18 * deltaTime;
      }
      const alpha = Math.max(0, p.life / p.max);
      g.circle(p.x, p.y, p.r * (0.5 + alpha * 0.5));
      g.fill({ color: p.color, alpha });
    }
  });

  return <pixiGraphics ref={gRef} draw={NOOP_DRAW} />;
}
