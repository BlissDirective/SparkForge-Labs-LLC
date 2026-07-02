'use client';

import { useReducedMotion } from '@/hooks/useReducedMotion';

interface LightRaysProps {
  color?: string;
  /** Overall ray strength, 0-1. */
  intensity?: number;
  /** Where the rays fan out from. */
  origin?: 'bottom-center' | 'top-center';
  className?: string;
}

/** 6 rays fanning out: angle (deg), pulse timing, relative strength. */
const RAYS = [
  { angle: -38, duration: 6.4, delay: 0.0, strength: 0.55 },
  { angle: -22, duration: 4.8, delay: 1.2, strength: 0.8 },
  { angle: -8, duration: 5.6, delay: 0.6, strength: 1 },
  { angle: 8, duration: 7.0, delay: 2.1, strength: 0.9 },
  { angle: 24, duration: 4.4, delay: 1.6, strength: 0.7 },
  { angle: 39, duration: 5.9, delay: 0.3, strength: 0.5 },
] as const;

/** CSSProperties plus the custom properties consumed by the pulse keyframes. */
type RayStyle = React.CSSProperties & {
  '--sf-ray-min'?: string;
  '--sf-ray-max'?: string;
};

/**
 * LightRays — volumetric light-ray backdrop for the hologram hero.
 * Six translucent cyan rays fan out from a configurable origin using
 * clip-path wedges, each slowly pulsing opacity on a staggered loop.
 * Reduced motion renders the rays static at mid opacity.
 */
export default function LightRays({
  color = '#4DE9FF',
  intensity = 0.5,
  origin = 'bottom-center',
  className = '',
}: LightRaysProps) {
  const prefersReducedMotion = useReducedMotion();
  const level = Math.min(1, Math.max(0, intensity));
  const fromBottom = origin === 'bottom-center';

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {RAYS.map((ray, i) => {
        const peak = 0.5 * level * ray.strength;
        const trough = peak * 0.4;
        const staticOpacity = (peak + trough) / 2;
        const style = {
          left: '50%',
          ...(fromBottom ? { bottom: 0 } : { top: 0 }),
          width: '16%',
          height: '110%',
          marginLeft: '-8%',
          transformOrigin: fromBottom ? '50% 100%' : '50% 0%',
          transform: `rotate(${ray.angle}deg)`,
          clipPath: fromBottom
            ? 'polygon(50% 100%, 0% 0%, 100% 0%)'
            : 'polygon(50% 0%, 0% 100%, 100% 100%)',
          background: fromBottom
            ? `linear-gradient(to top, ${color}B3 0%, ${color}40 45%, transparent 85%)`
            : `linear-gradient(to bottom, ${color}B3 0%, ${color}40 45%, transparent 85%)`,
          opacity: prefersReducedMotion ? staticOpacity : undefined,
          animation: prefersReducedMotion
            ? 'none'
            : `sf-ray-pulse ${ray.duration}s ease-in-out ${ray.delay}s infinite`,
          '--sf-ray-min': `${trough}`,
          '--sf-ray-max': `${peak}`,
        } as RayStyle;
        return <div key={i} className="absolute" style={style} />;
      })}

      <style>{`
        @keyframes sf-ray-pulse {
          0%, 100% { opacity: var(--sf-ray-min); }
          50% { opacity: var(--sf-ray-max); }
        }
      `}</style>
    </div>
  );
}
