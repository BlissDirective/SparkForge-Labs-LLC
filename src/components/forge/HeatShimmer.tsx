'use client';

// ════════════════════════════════════════════════════════════════
// HeatShimmer — Forge F1 (Concept 10 §4.8) — bounded heat distortion
// ════════════════════════════════════════════════════════════════
// SVG feTurbulence/feDisplacementMap distortion on a DECORATIVE child
// only — never text, form controls, or game content. Hover-activated,
// desktop-class tiers only (useForgeTier().allowShimmer); otherwise
// renders children unfiltered. Behavior, not visuals, is the contract.

import { useId, useState } from 'react';
import { useForgeTier } from '@/hooks/useForgeTier';
import type { ReactNode } from 'react';

export interface HeatShimmerProps {
  children: ReactNode;
  /** Displacement scale, capped at 6 (default 5). */
  scale?: number;
  className?: string;
}

export function HeatShimmer({ children, scale = 5, className = '' }: HeatShimmerProps) {
  const { allowShimmer } = useForgeTier();
  const [hovered, setHovered] = useState(false);
  const filterId = useId();

  if (!allowShimmer) {
    return <span className={className}>{children}</span>;
  }

  const capped = Math.min(6, Math.max(1, scale));

  return (
    <span
      className={`inline-block ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        filter: hovered ? `url(#${filterId})` : 'none',
        transition: 'filter 400ms ease-out',
      }}
    >
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.06"
              numOctaves="2"
              result="noise"
            >
              {hovered && (
                <animate
                  attributeName="baseFrequency"
                  dur="3s"
                  values="0.015 0.06;0.02 0.08;0.015 0.06"
                  repeatCount="indefinite"
                />
              )}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={capped} />
          </filter>
        </defs>
      </svg>
      {children}
    </span>
  );
}
