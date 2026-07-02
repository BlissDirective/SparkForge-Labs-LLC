'use client';

import {
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedBeamProps {
  /** The positioned (relative/absolute) ancestor the SVG overlays. */
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  color?: string;
  /** Vertical arc of the curve in px (negative arcs downward). */
  curvature?: number;
  /** Seconds for one pulse to travel the path. */
  duration?: number;
}

interface BeamGeometry {
  d: string;
  width: number;
  height: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const STYLE_ID = 'sf-animated-beam-keyframes';

/**
 * AnimatedBeam — SVG connector beam between two elements (the Lab-11
 * agent-graph visual).
 *
 * Draws a quadratic curve between the centers of `fromRef` and `toRef`,
 * positioned inside `containerRef` (which must be position: relative).
 * A bright pulse travels along the path: a gradient-stroked copy with
 * pathLength-normalized stroke-dasharray ("20 80" — the period divides the
 * -100 dashoffset loop, so it cycles seamlessly). Geometry recalculates on
 * ResizeObserver + window resize.
 *
 * Reduced motion: static path, no pulse.
 */
export default function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  color = '#4DE9FF',
  curvature = 40,
  duration = 2.5,
}: AnimatedBeamProps) {
  const prefersReducedMotion = useReducedMotion();
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const gradientId = `sf-beam-grad-${uid}`;
  const [geometry, setGeometry] = useState<BeamGeometry | null>(null);

  const recalc = useCallback(() => {
    const container = containerRef.current;
    const from = fromRef.current;
    const to = toRef.current;
    if (!container || !from || !to) return;

    const c = container.getBoundingClientRect();
    const f = from.getBoundingClientRect();
    const t = to.getBoundingClientRect();

    const x1 = f.left - c.left + f.width / 2;
    const y1 = f.top - c.top + f.height / 2;
    const x2 = t.left - c.left + t.width / 2;
    const y2 = t.top - c.top + t.height / 2;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2 - curvature;

    setGeometry({
      d: `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`,
      width: c.width,
      height: c.height,
      x1,
      y1,
      x2,
      y2,
    });
  }, [containerRef, fromRef, toRef, curvature]);

  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '@keyframes sf-beam-dash { to { stroke-dashoffset: -100; } }';
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    recalc();

    const observer = new ResizeObserver(() => recalc());
    const observed = [containerRef.current, fromRef.current, toRef.current];
    observed.forEach((el) => el && observer.observe(el));

    window.addEventListener('resize', recalc);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', recalc);
    };
  }, [recalc, containerRef, fromRef, toRef]);

  if (!geometry) return null;

  return (
    <svg
      aria-hidden="true"
      width={geometry.width}
      height={geometry.height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={geometry.x1}
          y1={geometry.y1}
          x2={geometry.x2}
          y2={geometry.y2}
        >
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Base connector — the only layer under reduced motion. */}
      <path
        d={geometry.d}
        fill="none"
        stroke={color}
        strokeOpacity={prefersReducedMotion ? 0.7 : 0.3}
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Traveling pulse. */}
      {!prefersReducedMotion && (
        <path
          d={geometry.d}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={3}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="20 80"
          style={{
            animation: `sf-beam-dash ${duration}s linear infinite`,
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
        />
      )}
    </svg>
  );
}
