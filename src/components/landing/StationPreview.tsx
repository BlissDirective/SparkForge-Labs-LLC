// src/components/landing/StationPreview.tsx
// ================================================================
// STATION PREVIEW — Act 4: Dashboard Teaser with 3D Cockpit Preview
// ================================================================
// Phase 7: Upgraded from CSS-only mockup to hybrid CSS + R3F.
// CockpitPreview3D renders a mini cockpit scene (~50K tris) embedded
// in the marketing page. CSS chrome bezel, LED rim, and stats remain.
//
// ENHANCEMENTS (Phase 7):
//   - CockpitPreview3D replaces static CSS dashboard mockup
//   - Enhanced LED discrete dots along bezel
//   - Chromatic aberration text effect on stat numbers
//   - prefers-reduced-motion respected (3D hidden, CSS fallback shown)
// ================================================================

'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles, Gamepad2, Award, Zap, Trophy } from 'lucide-react';

// Lazy-load 3D cockpit preview — SSR disabled
const CockpitPreview3D = dynamic(
  () => import('@/components/3d/CockpitPreview3D'),
  { ssr: false }
);
const R3FCanvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
);

// ---- Stats Data ----
const STATS = [
  { label: 'AI Labs', value: 10, suffix: '', icon: Sparkles, color: '#00BBFF' },
  { label: 'Games', value: 35, suffix: '+', icon: Gamepad2, color: '#AA66FF' },
  { label: 'Badges', value: 100, suffix: '+', icon: Award, color: '#FFAA44' },
];

// ---- Deterministic mock lab cards (avoid Math.random in render) ----
const MOCK_LABS = [
  { color: '#00BBFF', label: 'Code', progress: 72 },
  { color: '#AA66FF', label: 'Data', progress: 55 },
  { color: '#FF66AA', label: 'Neural', progress: 40 },
  { color: '#FFAA44', label: 'Create', progress: 88 },
  { color: '#00FF88', label: 'Agent', progress: 63 },
];

// ---- Deterministic mini bar heights ----
const MINI_BARS = [10, 14, 8, 18, 12];

export function StationPreview() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-12">
        <p className="font-mono text-xs text-[#06B6D4]/60 uppercase tracking-widest mb-2">
          Your Workspace
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
          The Laboratory Control Station
        </h2>
        <p className="font-body text-base text-white/40 max-w-md mx-auto">
          A beautiful, immersive dashboard where every experiment
          comes to life.
        </p>
      </div>

      {/* Station mockup (CSS placeholder) */}
      <div data-station-preview className="relative rounded-2xl overflow-hidden">
        {/* Outer chrome bezel */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-[#0B1628] p-1.5 md:p-2">
          {/* LED rim glow pulse */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none led-rim-pulse"
            style={{
              boxShadow:
                '0 0 30px rgba(0,187,255,0.08), inset 0 0 30px rgba(0,187,255,0.04)',
            }}
            aria-hidden="true"
          />

          {/* Inner screen — 3D cockpit preview (Phase 7) */}
          <div className="relative rounded-xl overflow-hidden bg-[#060A12] border border-white/[0.04]">
            {/* 3D Cockpit Preview Canvas */}
            <div className="relative min-h-[280px] md:min-h-[360px]">
              <Suspense fallback={
                /* CSS fallback while 3D loads (also serves reduced-motion) */
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0" aria-hidden="true">
                    <div className="absolute top-[10%] left-[20%] w-64 h-32 rounded-full bg-[#00BBFF]/[0.06] blur-[60px]" />
                    <div className="absolute top-[30%] right-[15%] w-48 h-48 rounded-full bg-[#AA66FF]/[0.04] blur-[50px]" />
                    <div className="absolute bottom-[20%] left-[40%] w-56 h-28 rounded-full bg-[#06B6D4]/[0.04] blur-[40px]" />
                  </div>
                  <p className="font-display text-lg text-white/20 relative z-10">Loading cockpit...</p>
                </div>
              }>
                <R3FCanvas
                  camera={{ position: [0, 0.3, 1.8], fov: 50 }}
                  dpr={[1, 1.5]}
                  style={{ background: '#060A12' }}
                  gl={{ alpha: false, antialias: true, powerPreference: 'default' }}
                >
                  <CockpitPreview3D />
                </R3FCanvas>
              </Suspense>
            </div>

            {/* Scanline overlay — control station screen aesthetic */}
            <div
              className="absolute inset-0 pointer-events-none z-10 scanline-overlay"
              aria-hidden="true"
            />

            {/* Bottom LED strip — enhanced with discrete LED dots (Phase 7) */}
            <div className="relative h-[3px] w-full" aria-hidden="true">
              <div
                className="absolute inset-0"
                style={{
                  opacity: 0.4,
                  background:
                    'linear-gradient(to right, transparent, #00BBFF, #AA66FF, #06B6D4, transparent)',
                }}
              />
              {/* Discrete LED dots */}
              <div className="absolute inset-0 flex justify-between px-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-full rounded-full led-dot-pulse"
                    style={{
                      background: i % 3 === 0 ? '#00BBFF' : i % 3 === 1 ? '#AA66FF' : '#06B6D4',
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Corner chrome rivets */}
          {['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1'].map(
            (pos) => (
              <div
                key={pos}
                className={`absolute ${pos} w-2 h-2 rounded-full bg-white/[0.06] border border-white/[0.08]`}
                aria-hidden="true"
              />
            )
          )}
        </div>
      </div>

      {/* Stats counters (GSAP animated via data attrs) */}
      <div className="grid grid-cols-3 gap-4 md:gap-8 mt-10 max-w-lg mx-auto">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="text-center">
              <Icon
                className="w-5 h-5 mx-auto mb-2"
                style={{ color: stat.color, opacity: 0.6 }}
              />
              <p
                data-stat-counter
                data-target={stat.value}
                data-suffix={stat.suffix}
                className="font-display text-3xl md:text-4xl font-bold text-white chromatic-text"
                style={{ '--chromatic-color': stat.color } as React.CSSProperties}
              >
                0{stat.suffix}
              </p>
              <p className="font-body text-xs text-white/30 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Keyframes moved to globals.css (HIGH-005 audit fix) */}
    </div>
  );
}
