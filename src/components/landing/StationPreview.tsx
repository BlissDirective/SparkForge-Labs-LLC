// src/components/landing/StationPreview.tsx
// ================================================================
// STATION PREVIEW — Act 4: Dashboard Teaser with CSS Glow
// ================================================================
// Decision 8.2: High-quality CSS mockup of the station frame
// with subtle animation (LED rim glow pulse, parallax shift).
// Stats counters tick up via GSAP ScrollTrigger (from parent).
//
// Zero 3D overhead — purely CSS.
//
// ENHANCEMENTS APPLIED:
//   1. prefers-reduced-motion — disables LED pulse animation
//   5. Scanline overlay (2px repeating gradient) on station mockup
// ================================================================

'use client';

import { Sparkles, Gamepad2, Award, Zap, Trophy } from 'lucide-react';

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

          {/* Inner screen */}
          <div className="relative rounded-xl overflow-hidden bg-[#0D1117] border border-white/[0.04]">
            {/* Aurora background simulation */}
            <div className="absolute inset-0" aria-hidden="true">
              <div className="absolute top-[10%] left-[20%] w-64 h-32 rounded-full bg-[#00BBFF]/[0.06] blur-[60px]" />
              <div className="absolute top-[30%] right-[15%] w-48 h-48 rounded-full bg-[#AA66FF]/[0.04] blur-[50px]" />
              <div className="absolute bottom-[20%] left-[40%] w-56 h-28 rounded-full bg-[#06B6D4]/[0.04] blur-[40px]" />
            </div>

            {/* [Enhancement #5] Scanline overlay — control station screen aesthetic */}
            <div
              className="absolute inset-0 pointer-events-none z-10 scanline-overlay"
              aria-hidden="true"
            />

            {/* Mock dashboard content */}
            <div className="relative p-6 md:p-10 min-h-[280px] md:min-h-[360px]">
              {/* Top bar mockup */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00BBFF]/30 to-[#AA66FF]/30" />
                  <div className="w-20 h-3 rounded bg-white/[0.06]" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFAA44]/10">
                    <Zap className="w-3 h-3 text-[#FFAA44]" />
                    <span className="font-mono text-xs text-[#FFAA44]">
                      1,250 XP
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-white/[0.08]" />
                </div>
              </div>

              {/* Lab cards mockup */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 mb-6">
                {MOCK_LABS.map((lab) => (
                  <div
                    key={lab.label}
                    className="rounded-xl p-3 border border-white/[0.06]"
                    style={{ background: `${lab.color}08` }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg mb-2"
                      style={{ background: `${lab.color}20` }}
                    />
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${lab.progress}%`,
                          background: lab.color,
                          opacity: 0.5,
                        }}
                      />
                    </div>
                    <p className="font-mono text-2xs text-white/20 mt-1">
                      {lab.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom stats mockup */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#FFAA44]/40" />
                  <div className="w-16 h-2 rounded bg-white/[0.04]" />
                </div>
                <div className="flex items-center gap-1">
                  {MINI_BARS.map((h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-[#00BBFF]/30"
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom LED strip */}
            <div
              className="h-[2px] w-full"
              style={{
                opacity: 0.3,
                background:
                  'linear-gradient(to right, transparent, #00BBFF, #AA66FF, #06B6D4, transparent)',
              }}
              aria-hidden="true"
            />
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
                className="font-display text-3xl md:text-4xl font-bold text-white"
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
