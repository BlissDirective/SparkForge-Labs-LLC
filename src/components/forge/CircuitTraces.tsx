'use client';

// ════════════════════════════════════════════════════════════════
// CircuitTraces — Forge F1 (Concept 10 §4.5) — living circuitry bg
// ════════════════════════════════════════════════════════════════
// Hand-authored orthogonal circuit paths, stroked faintly. Exactly
// ONE path pulses at a time (restraint = aesthetic AND perf budget).
// Decorative: aria-hidden, pointer-events none. Pulses pause under
// reduced-motion and when the tab is hidden.

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface CircuitTracesProps {
  density?: 'low' | 'med';
  /** One-at-a-time current pulse (default true). */
  pulse?: boolean;
  className?: string;
}

// Orthogonal trace paths on a 400×300 canvas, rounded corners implied
// by stroke-linejoin. Node dots sit at path endpoints.
const PATHS_LOW = [
  'M 20 40 H 140 V 110 H 240',
  'M 380 60 H 300 V 150 H 200 V 220',
  'M 40 260 H 120 V 190 H 190',
  'M 360 250 H 280 V 190',
];
const PATHS_MED = [
  ...PATHS_LOW,
  'M 20 150 H 80 V 90 H 120',
  'M 340 30 V 100 H 300',
  'M 250 280 H 320 V 230',
];

const NODE_RADIUS = 3;

function endpoints(d: string): Array<[number, number]> {
  const nums = d.match(/[\d.]+/g)?.map(Number) ?? [];
  if (nums.length < 2) return [];
  // First M x y and the final coordinate reached.
  const first: [number, number] = [nums[0], nums[1]];
  let x = nums[0];
  let y = nums[1];
  const tokens = d.split(/\s+/);
  let i = 0;
  let cmd = '';
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === 'M' || t === 'H' || t === 'V') {
      cmd = t;
      i++;
      continue;
    }
    const v = Number(t);
    if (Number.isNaN(v)) {
      i++;
      continue;
    }
    if (cmd === 'M') {
      x = v;
      y = Number(tokens[i + 1]);
      i += 2;
      cmd = '';
      continue;
    }
    if (cmd === 'H') x = v;
    if (cmd === 'V') y = v;
    i++;
  }
  return [first, [x, y]];
}

export function CircuitTraces({
  density = 'low',
  pulse = true,
  className = '',
}: CircuitTracesProps) {
  const reducedMotion = useReducedMotion();
  const paths = density === 'low' ? PATHS_LOW : PATHS_MED;
  const [activePath, setActivePath] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pulse || reducedMotion) return;

    let cancelled = false;

    function schedule(delay: number) {
      timeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        if (document.visibilityState !== 'visible') {
          schedule(2000);
          return;
        }
        setActivePath((prev) => {
          let next = Math.floor(Math.random() * paths.length);
          if (next === prev) next = (next + 1) % paths.length;
          return next;
        });
        // Pulse runs 4s, then 2–5s idle before the next one.
        timeoutRef.current = setTimeout(() => {
          if (cancelled) return;
          setActivePath(null);
          schedule(2000 + Math.random() * 3000);
        }, 4000);
      }, delay);
    }

    schedule(1000 + Math.random() * 2000);
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pulse, reducedMotion, paths.length]);

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      {paths.map((d, i) => (
        <g key={i}>
          <path
            d={d}
            stroke="rgb(var(--sf-border-subtle) / 1)"
            strokeWidth="1"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {endpoints(d).map(([x, y], j) => (
            <circle
              key={j}
              cx={x}
              cy={y}
              r={NODE_RADIUS}
              fill="rgb(var(--sf-border) / 1)"
            />
          ))}
          {activePath === i && (
            <path
              d={d}
              stroke="rgb(var(--sf-primary) / 0.7)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="40 1000"
              style={{ animation: 'forge-trace-pulse 4s linear forwards' }}
            />
          )}
        </g>
      ))}
    </svg>
  );
}
