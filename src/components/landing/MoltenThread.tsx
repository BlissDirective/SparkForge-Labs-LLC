'use client';

// ════════════════════════════════════════════════════════════════
// MOLTEN THREAD — Forge F6 (Concept 10 §10.4)
// ════════════════════════════════════════════════════════════════
// The seam the falling light collects into: a full-height meandering
// molten line drawn behind the post-hero sections, its head advancing
// with scroll (scrub). Listens for the micro-demo's finale
// 'forge-pulse-escape' event and runs a fast bright pulse down the
// thread. Decorative: aria-hidden, pointer-events none. Reduced
// motion: fully drawn, static, no pulses.
//
// v1 simplification (logged): no hero pin/scrub — the vendored
// Lightfall self-pauses off-screen; the thread supplies continuity.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function buildPath(height: number): string {
  // Gentle meander around x=50 (viewBox 0..100), ±14 units of sway.
  const segments = Math.max(3, Math.round(height / 900));
  const segH = height / segments;
  let d = `M 50 0`;
  for (let i = 0; i < segments; i++) {
    const y0 = i * segH;
    const sway = i % 2 === 0 ? 14 : -14;
    d += ` C ${50 + sway} ${y0 + segH * 0.33}, ${50 - sway} ${y0 + segH * 0.66}, 50 ${y0 + segH}`;
  }
  return d;
}

export function MoltenThreadSection({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const pulseRef = useRef<SVGPathElement>(null);
  const [height, setHeight] = useState(0);
  const [pulseKey, setPulseKey] = useState(0);

  // Measure container height.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.scrollHeight));
    ro.observe(el);
    setHeight(el.scrollHeight);
    return () => ro.disconnect();
  }, []);

  // Scroll-scrubbed draw (plain rAF — no plugin registration needed).
  useEffect(() => {
    const el = containerRef.current;
    const path = pathRef.current;
    if (!el || !path || height === 0) return;

    const total = path.getTotalLength();
    path.style.strokeDasharray = `${total}`;

    if (reducedMotion) {
      path.style.strokeDashoffset = '0';
      return;
    }

    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when container top enters viewport bottom; 1 when bottom passes.
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (rect.height + vh)));
      path.style.strokeDashoffset = `${total * (1 - progress)}`;
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [height, reducedMotion]);

  // Finale pulse-escape from the micro-demo (§10.6).
  useEffect(() => {
    if (reducedMotion) return;
    const onEscape = () => setPulseKey((k) => k + 1);
    window.addEventListener('forge-pulse-escape', onEscape);
    return () => window.removeEventListener('forge-pulse-escape', onEscape);
  }, [reducedMotion]);

  const d = height > 0 ? buildPath(height) : '';

  return (
    <div ref={containerRef} className="relative">
      {height > 0 && d && (
        <svg
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-full w-full pointer-events-none"
          viewBox={`0 0 100 ${height}`}
          preserveAspectRatio="none"
          style={{ zIndex: 0, opacity: 0.55 }}
        >
          <defs>
            <linearGradient id="molten-thread-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFC24A" />
              <stop offset="50%" stopColor="#FF8C1A" />
              <stop offset="100%" stopColor="#C75E0C" />
            </linearGradient>
          </defs>
          <path
            ref={pathRef}
            d={d}
            fill="none"
            stroke="url(#molten-thread-grad)"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,140,26,0.5))' }}
          />
          {pulseKey > 0 && (
            <path
              key={pulseKey}
              ref={pulseRef}
              d={d}
              fill="none"
              stroke="#FFE9B8"
              strokeWidth="4"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeDasharray="120 100000"
              style={{
                animation: 'forge-thread-escape 1.6s cubic-bezier(0.3, 0, 0.7, 1) forwards',
                filter: 'drop-shadow(0 0 10px rgba(255,194,74,0.8))',
              }}
            />
          )}
        </svg>
      )}
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
