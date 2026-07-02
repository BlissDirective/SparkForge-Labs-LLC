'use client';

import { useEffect, useId } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ElectricBorderProps {
  children: React.ReactNode;
  /** Stroke + glow color of the electric edge. */
  color?: string;
  /** Corner radius (px) of the border rect and content clip. */
  radius?: number;
  /** Animates the traveling dash only while true. */
  active?: boolean;
  className?: string;
}

const STYLE_ID = 'sf-electric-border-keyframes';

/**
 * ElectricBorder — animated electric edge around a card.
 *
 * Draws an absolutely-positioned rounded-rect SVG border whose stroke is a
 * cyan gradient with a traveling dash (stroke-dasharray + animated
 * stroke-dashoffset) behind a soft feGaussianBlur glow. The dash pattern
 * period (14 + 36 = 50) divides the -100 dashoffset loop evenly, so the
 * cycle is seamless. Keyframes are injected once at document level
 * (same pattern as MetallicPaint).
 *
 * Reduced motion: a static glowing border while `active`.
 */
export default function ElectricBorder({
  children,
  color = '#4DE9FF',
  radius = 16,
  active = false,
  className = '',
}: ElectricBorderProps) {
  const prefersReducedMotion = useReducedMotion();
  // useId() may contain ':' which breaks url(#…) references — strip it.
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const gradientId = `sf-eb-grad-${uid}`;
  const glowId = `sf-eb-glow-${uid}`;

  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '@keyframes sf-electric-dash { to { stroke-dashoffset: -100; } }';
    document.head.appendChild(style);
  }, []);

  // Inset the rect so the 2.5px stroke never clips at the SVG edge.
  const rectSize: React.CSSProperties = {
    width: 'calc(100% - 4px)',
    height: 'calc(100% - 4px)',
  };

  return (
    <div className={`relative ${className}`} style={{ borderRadius: radius }}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} stopOpacity="0.9" />
          </linearGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base edge — always present so the card reads as framed. */}
        <rect
          x={2}
          y={2}
          rx={radius}
          fill="none"
          stroke={color}
          strokeOpacity={active ? 0.4 : 0.18}
          strokeWidth={1.5}
          style={rectSize}
        />

        {/* Reduced motion: static glowing border while active. */}
        {active && prefersReducedMotion && (
          <rect
            x={2}
            y={2}
            rx={radius}
            fill="none"
            stroke={color}
            strokeOpacity={0.9}
            strokeWidth={2}
            filter={`url(#${glowId})`}
            style={rectSize}
          />
        )}

        {/* Traveling electric dash. */}
        {active && !prefersReducedMotion && (
          <rect
            x={2}
            y={2}
            rx={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={2.5}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="14 36"
            filter={`url(#${glowId})`}
            style={{
              ...rectSize,
              animation: 'sf-electric-dash 1.4s linear infinite',
            }}
          />
        )}
      </svg>

      <div className="relative" style={{ borderRadius: radius }}>
        {children}
      </div>
    </div>
  );
}
