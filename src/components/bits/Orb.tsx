'use client';

import { useReducedMotion } from '@/hooks/useReducedMotion';

interface OrbProps {
  /** Diameter in px. */
  size?: number;
  color?: string;
  /** Announced politely to screen readers (visually hidden). */
  label?: string;
  className?: string;
}

/**
 * Orb — glowing cyan "thinking / loading" indicator matching Sparky's
 * identity. Layered radial gradients with a slow breathing scale and an
 * orbiting highlight dot. Reduced motion renders a static orb.
 */
export default function Orb({
  size = 48,
  color = '#4DE9FF',
  label,
  className = '',
}: OrbProps) {
  const prefersReducedMotion = useReducedMotion();
  const dot = Math.max(3, Math.round(size * 0.11));

  return (
    <span
      role="status"
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      {label ? (
        <span className="sr-only" aria-live="polite">
          {label}
        </span>
      ) : null}

      {/* Outer halo */}
      <span
        aria-hidden="true"
        className="absolute rounded-full"
        style={{
          inset: `-${Math.round(size * 0.25)}px`,
          background: `radial-gradient(circle, ${color}33 0%, ${color}14 45%, transparent 70%)`,
          animation: prefersReducedMotion ? 'none' : 'sf-orb-breathe 3.2s ease-in-out infinite',
        }}
      />

      {/* Core orb */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85) 0%, transparent 28%),
            radial-gradient(circle at 50% 50%, ${color} 0%, ${color}CC 45%, ${color}55 75%, transparent 100%)
          `,
          boxShadow: `0 0 ${Math.round(size * 0.4)}px ${color}66, inset 0 0 ${Math.round(size * 0.3)}px ${color}99`,
          animation: prefersReducedMotion ? 'none' : 'sf-orb-breathe 3.2s ease-in-out infinite',
        }}
      />

      {/* Orbiting highlight dot */}
      {!prefersReducedMotion && (
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{ animation: 'sf-orb-orbit 2.6s linear infinite' }}
        >
          <span
            className="absolute rounded-full"
            style={{
              width: dot,
              height: dot,
              left: '50%',
              top: 0,
              transform: 'translate(-50%, -30%)',
              backgroundColor: '#FFFFFF',
              boxShadow: `0 0 ${dot * 2}px ${dot * 0.5}px ${color}AA`,
            }}
          />
        </span>
      )}

      <style>{`
        @keyframes sf-orb-breathe {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes sf-orb-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
}
