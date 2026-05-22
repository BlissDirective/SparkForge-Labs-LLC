'use client';

import { useMemo } from 'react';

/**
 * GalaxyBackground — Animated deep-space galaxy backdrop.
 * Multi-layered: distant stars (tiny, slow), mid stars (medium, parallax),
 * and bright foreground stars with twinkle. Pure CSS for performance.
 * Meshes perfectly with the Cosmic Orbit labs page design.
 */
export default function GalaxyBackground({ className = '' }: { className?: string }) {
  // Three layers: distant, mid, bright
  const layers = useMemo(() => {
    const distant = Array.from({ length: 60 }, (_, i) => ({
      id: `d-${i}`,
      left: `${(i * 17 + 7) % 100}%`,
      top: `${(i * 23 + 3) % 100}%`,
      size: 1 + (i % 2),
      opacity: 0.2 + (i % 3) * 0.08,
      duration: 4 + (i % 5),
      delay: (i * 0.3) % 6,
    }));
    const mid = Array.from({ length: 30 }, (_, i) => ({
      id: `m-${i}`,
      left: `${(i * 31 + 11) % 100}%`,
      top: `${(i * 37 + 19) % 100}%`,
      size: 2 + (i % 3),
      opacity: 0.35 + (i % 3) * 0.12,
      duration: 3 + (i % 4),
      delay: (i * 0.5) % 5,
      color: i % 5 === 0 ? '#E945F5' : i % 7 === 0 ? '#4F6EF7' : '#FFFFFF',
    }));
    const bright = Array.from({ length: 12 }, (_, i) => ({
      id: `b-${i}`,
      left: `${(i * 41 + 23) % 100}%`,
      top: `${(i * 47 + 29) % 100}%`,
      size: 2.5 + (i % 3) * 1.5,
      color: i % 3 === 0 ? '#E945F5' : i % 3 === 1 ? '#4F6EF7' : '#00D2FF',
      duration: 2.5 + (i % 3) * 0.8,
      delay: i * 0.6,
    }));
    return { distant, mid, bright };
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Deep space gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(79,110,247,0.04) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(233,69,245,0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(0,210,255,0.02) 0%, transparent 50%)
          `,
        }}
      />

      {/* Distant stars — subtle, slow */}
      {layers.distant.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            backgroundColor: '#FFFFFF',
            opacity: s.opacity,
            animation: `galaxyTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Mid stars — colored, gentle parallax drift */}
      {layers.mid.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            backgroundColor: s.color,
            opacity: s.opacity,
            boxShadow: `0 0 ${s.size * 2}px ${s.size * 0.5}px ${s.color}30`,
            animation: `galaxyTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Bright stars — prominent with cross flare */}
      {layers.bright.map((s) => (
        <div key={s.id} className="absolute" style={{ left: s.left, top: s.top }}>
          {/* Horizontal flare */}
          <div
            className="absolute rounded-full"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: s.size * 6,
              height: 1,
              backgroundColor: s.color,
              opacity: 0.2,
              animation: `galaxyTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
          {/* Vertical flare */}
          <div
            className="absolute rounded-full"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 1,
              height: s.size * 6,
              backgroundColor: s.color,
              opacity: 0.2,
              animation: `galaxyTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
          {/* Core */}
          <div
            className="relative rounded-full"
            style={{
              width: s.size,
              height: s.size,
              backgroundColor: s.color,
              boxShadow: `0 0 ${s.size * 3}px ${s.size}px ${s.color}50, 0 0 ${s.size * 6}px ${s.size * 2}px ${s.color}20`,
              animation: `galaxyTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes galaxyTwinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
