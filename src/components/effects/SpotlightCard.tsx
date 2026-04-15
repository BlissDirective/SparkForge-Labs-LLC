'use client';

// ═══════════════════════════════════════════════════════════════════
// SpotlightCard — Mouse-tracking radial spotlight overlay
// ═══════════════════════════════════════════════════════════════════
// Phase 4 §10.5: Copy-paste pattern from Magic UI. Used for featured/
// premium game tiles, pricing-page Plus tier, and any "pay attention to
// this" surface. As the cursor moves over the card, a soft radial
// spotlight follows, revealing a subtle highlight of the Frost-Prismatic
// palette.
//
// Technique: CSS radial-gradient with CSS custom properties (--sx, --sy)
// updated on mouse move. No JS animation frame loop required. Respects
// prefers-reduced-motion (disables spotlight tracking; uses static
// centered gradient).
//
// Usage:
//   <SpotlightCard className="p-8 glass-card-v2" color="#00BBFF">
//     Premium AI Lab access
//   </SpotlightCard>
// ═══════════════════════════════════════════════════════════════════

import { useRef, type ReactNode, type CSSProperties } from 'react';
import clsx from 'clsx';

interface SpotlightCardProps {
  children: ReactNode;
  /** Spotlight color (RGB-only, alpha applied automatically). Default: #00BBFF. */
  color?: string;
  /** Spotlight radius in px. Default: 300. */
  radius?: number;
  /** Spotlight peak opacity. Default: 0.15. */
  intensity?: number;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

/** Convert hex or color string to RGB triplet for rgba() use. */
function toRgb(c: string): string {
  if (c.startsWith('#')) {
    const h = c.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return c;
}

export function SpotlightCard({
  children,
  color = '#00BBFF',
  radius = 300,
  intensity = 0.15,
  className,
  style,
  onClick,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty('--sx', `${x}px`);
    ref.current.style.setProperty('--sy', `${y}px`);
  };

  const rgb = toRgb(color);

  return (
    <div
      ref={ref}
      className={clsx('relative overflow-hidden', className)}
      style={
        {
          '--sx': '50%',
          '--sy': '50%',
          ...style,
        } as CSSProperties
      }
      onMouseMove={onMouseMove}
      onClick={onClick}
    >
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 motion-reduce:opacity-50"
        style={{
          background: `radial-gradient(${radius}px circle at var(--sx) var(--sy), rgba(${rgb}, ${intensity}) 0%, transparent 80%)`,
          transition: 'opacity 200ms ease-out',
        }}
      />
    </div>
  );
}
