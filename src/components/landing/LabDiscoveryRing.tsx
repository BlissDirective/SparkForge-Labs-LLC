// src/components/landing/LabDiscoveryRing.tsx
// ================================================================
// LAB DISCOVERY RING — Act 2: Hex Tile Lab Showcase
// ================================================================
// Decision 8.1: 10 hex tiles stagger in from alternating sides
// via GSAP ScrollTrigger. Each tile shows lab icon, name, and
// CSS pattern background. Tiles "light up" as user scrolls past.
//
// Pure CSS/GSAP — no 3D elements.
// GSAP animations applied by parent ScrollJourney via data attrs.
// Lab colors aligned to CLAUDE.md Section 6 authoritative values.
//
// ENHANCEMENTS APPLIED:
//   2. Gradient border glow matching each lab's color on hover
//   6. Clickable lab tiles — Link to /dashboard/labs/{id} for navigation
// ================================================================

'use client';

import Link from 'next/link';

// ---- Lab Pattern CSS backgrounds (approximating GLSL shaders) ----
const LAB_PATTERNS: Record<number, string> = {
  1: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,187,255,0.06) 8px, rgba(0,187,255,0.06) 16px)',
  2: 'radial-gradient(circle at 30% 40%, rgba(170,102,255,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(170,102,255,0.06) 0%, transparent 50%)',
  3: 'repeating-conic-gradient(from 0deg, transparent 0deg 30deg, rgba(255,102,170,0.05) 30deg 60deg)',
  4: 'linear-gradient(135deg, rgba(255,170,68,0.06) 25%, transparent 25%, transparent 75%, rgba(255,170,68,0.06) 75%)',
  5: 'repeating-linear-gradient(0deg, transparent, transparent 12px, rgba(0,255,136,0.05) 12px, rgba(0,255,136,0.05) 24px)',
  6: 'radial-gradient(circle at 50% 50%, rgba(255,102,68,0.07) 0%, transparent 60%)',
  7: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(6,182,212,0.05) 10px, rgba(6,182,212,0.05) 20px)',
  8: 'linear-gradient(45deg, rgba(129,140,248,0.06) 0%, transparent 50%, rgba(129,140,248,0.04) 100%)',
  9: 'repeating-conic-gradient(from 45deg, transparent 0deg 45deg, rgba(249,115,22,0.05) 45deg 90deg)',
  10: 'radial-gradient(circle at 60% 30%, rgba(217,70,239,0.07) 0%, transparent 50%), linear-gradient(180deg, rgba(217,70,239,0.03) 0%, transparent 100%)',
};

// ---- Lab Colors (CLAUDE.md Section 6 authoritative) ----
const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF',
  2: '#AA66FF',
  3: '#FF66AA',
  4: '#FFAA44',
  5: '#00FF88',
  6: '#FF6644',
  7: '#06B6D4',
  8: '#818CF8',
  9: '#F97316',
  10: '#D946EF',
};

// ---- Lab Icons (emoji) ----
const LAB_ICONS: Record<number, string> = {
  1: '\u{1F4BB}',  // 💻
  2: '\u{1F4CA}',  // 📊
  3: '\u{1F9E0}',  // 🧠
  4: '\u{1F3A8}',  // 🎨
  5: '\u{1F916}',  // 🤖
  6: '\u{2696}',   // ⚖️
  7: '\u{1F441}',  // 👁️
  8: '\u{1F4AC}',  // 💬
  9: '\u{1F528}',  // 🔨
  10: '\u{1F52D}', // 🔭
};

// ---- Lab Names ----
const LAB_NAMES: Record<number, string> = {
  1: 'Code Lab',
  2: 'Data Lab',
  3: 'Neural Lab',
  4: 'Create Lab',
  5: 'Agent Lab',
  6: 'Ethics Lab',
  7: 'Vision Lab',
  8: 'Language Lab',
  9: 'Build Lab',
  10: 'Frontier Lab',
};

// ---- Lab Descriptions ----
const LAB_DESCS: Record<number, string> = {
  1: 'Learn the building blocks of programming and AI logic',
  2: 'Discover how AI finds patterns in data',
  3: 'Build and train neural networks from scratch',
  4: 'Create AI-powered art, music, and stories',
  5: 'Design autonomous AI agents that take action',
  6: 'Explore fairness, bias, and responsible AI',
  7: 'Teach machines to see and understand images',
  8: 'Give AI the power to understand human language',
  9: 'Build complete AI-powered applications',
  10: 'Push the boundaries of what AI can do',
};

// ---- Per-lab game counts (from GCUD V10) ----
const LAB_GAME_COUNTS: Record<number, number> = {
  1: 3, 2: 4, 3: 3, 4: 4, 5: 3, 6: 4, 7: 3, 8: 4, 9: 4, 10: 3,
};

// ---- Lab slugs for clickable tiles ----
const LAB_SLUGS: Record<number, string> = {
  1: 'code', 2: 'data', 3: 'neural', 4: 'create', 5: 'agent',
  6: 'ethics', 7: 'vision', 8: 'language', 9: 'build', 10: 'frontier',
};

export function LabDiscoveryRing() {
  const labIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-12">
        <p className="font-mono text-xs text-[#00BBFF]/60 uppercase tracking-widest mb-2">
          Explore
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
          10 AI Laboratories
        </h2>
        <p className="font-body text-base text-white/40 max-w-md mx-auto">
          Each lab unlocks a new area of AI discovery. Complete experiments
          to earn XP, collect badges, and advance through the station.
        </p>
      </div>

      {/* Lab tiles */}
      <div className="space-y-4">
        {labIds.map((id) => {
          const color = LAB_COLORS[id];
          const gameCount = LAB_GAME_COUNTS[id];
          return (
            // [Enhancement #6] Clickable lab tiles — link to dashboard lab
            <Link
              key={id}
              href={`/dashboard/labs/${LAB_SLUGS[id]}`}
              data-lab-tile
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0E16]"
              style={{
                // [Enhancement #2] Gradient border glow on hover via focus ring color
                '--tw-ring-color': color,
              } as React.CSSProperties & Record<string, string>}
              aria-label={`${LAB_NAMES[id]} — ${gameCount} games. ${LAB_DESCS[id]}`}
            >
              {/* Pattern background */}
              <div
                className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ backgroundImage: LAB_PATTERNS[id] }}
                aria-hidden="true"
              />

              {/* [Enhancement #2] Gradient border glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  boxShadow: `inset 0 0 0 1px ${color}30, 0 0 20px ${color}15, 0 0 40px ${color}08`,
                }}
                aria-hidden="true"
              />

              {/* Glow accent on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(ellipse at center, ${color}10, transparent 70%)`,
                }}
                aria-hidden="true"
              />

              <div className="relative flex items-center gap-4 p-5 md:p-6">
                {/* Lab number hex badge */}
                <div
                  className="flex-shrink-0 w-14 h-14 flex items-center justify-center text-2xl"
                  style={{
                    clipPath:
                      'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    background: `linear-gradient(135deg, ${color}20, ${color}08)`,
                  }}
                >
                  {LAB_ICONS[id]}
                </div>

                {/* Lab info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: `${color}15`, color }}
                    >
                      LAB {id}
                    </span>
                    <h3 className="font-display text-base font-bold text-white">
                      {LAB_NAMES[id]}
                    </h3>
                  </div>
                  <p className="font-body text-sm text-white/40 leading-relaxed">
                    {LAB_DESCS[id]}
                  </p>
                </div>

                {/* Game count badge */}
                <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <span className="font-mono text-xs text-white/30">
                    {gameCount} games
                  </span>
                </div>

                {/* Arrow indicator for clickable state */}
                <div className="flex-shrink-0 text-white/20 group-hover:text-white/50 transition-colors" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Bottom LED accent */}
              <div
                className="h-[2px] w-full opacity-30 group-hover:opacity-70 transition-opacity"
                style={{
                  background: `linear-gradient(to right, transparent, ${color}, transparent)`,
                }}
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
