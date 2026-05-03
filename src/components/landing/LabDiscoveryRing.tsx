// src/components/landing/LabDiscoveryRing.tsx
// ================================================================
// LAB DISCOVERY RING — Act 2: Hex Tile Lab Showcase
// ================================================================
// Decision 8.1: lab tiles stagger in from alternating sides via GSAP
// ScrollTrigger. Each tile shows lab icon, name, and CSS pattern
// background. Tiles "light up" as user scrolls past.
//
// Pure CSS/GSAP — no 3D elements.
// GSAP animations applied by parent ScrollJourney via data attrs.
//
// REFACTOR (April 30, 2026 — user-approved): lab list now derived
// from the canonical `LAB_COLORS_TABLE` (src/config/labColors.ts) and
// `LAB_ICONS` (src/config/labs.ts) so adding a new lab is a single
// edit upstream. Local maps retained ONLY for marketing-specific
// copy (kid-friendly aliases, descriptions, decorative CSS patterns)
// where the landing page intentionally diverges from the canonical
// lab metadata.
//
// Also fixes a pre-existing broken link (was `/dashboard/labs/{slug}`,
// now `/labs/{labId}` matching the actual `[labId]` route).
// ================================================================

'use client';

import Link from 'next/link';
import { LABS } from '@/types';
import { LAB_COLORS_TABLE, LAB_COLORS_HEX } from '@/config/labColors';
import { LAB_ICONS as CANONICAL_LAB_ICONS } from '@/config/labs';

// ---- Lab Pattern CSS backgrounds (approximating GLSL shaders) ----
// Local map: marketing-only decorative gradients per lab.
const LAB_PATTERNS: Record<number, string> = {
  1: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(15,184,250,0.06) 8px, rgba(15,184,250,0.06) 16px)',
  2: 'radial-gradient(circle at 30% 40%, rgba(182,123,255,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(182,123,255,0.06) 0%, transparent 50%)',
  3: 'repeating-conic-gradient(from 0deg, transparent 0deg 30deg, rgba(255,112,175,0.05) 30deg 60deg)',
  4: 'linear-gradient(135deg, rgba(217,164,48,0.06) 25%, transparent 25%, transparent 75%, rgba(217,164,48,0.06) 75%)',
  5: 'repeating-linear-gradient(0deg, transparent, transparent 12px, rgba(0,209,122,0.05) 12px, rgba(0,209,122,0.05) 24px)',
  6: 'radial-gradient(circle at 50% 50%, rgba(255,112,80,0.07) 0%, transparent 60%)',
  7: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(16,186,210,0.05) 10px, rgba(16,186,210,0.05) 20px)',
  8: 'linear-gradient(45deg, rgba(143,150,250,0.06) 0%, transparent 50%, rgba(143,150,250,0.04) 100%)',
  9: 'repeating-conic-gradient(from 45deg, transparent 0deg 45deg, rgba(230,142,40,0.05) 45deg 90deg)',
  10: 'radial-gradient(circle at 60% 30%, rgba(222,90,234,0.07) 0%, transparent 50%), linear-gradient(180deg, rgba(222,90,234,0.03) 0%, transparent 100%)',
  11: 'radial-gradient(circle at 35% 65%, rgba(111,255,230,0.08) 0%, transparent 55%), repeating-linear-gradient(60deg, transparent, transparent 14px, rgba(111,255,230,0.05) 14px, rgba(111,255,230,0.05) 28px)',
};

// ---- Lab marketing aliases ----
// Kid-friendly short names used on the landing page; intentionally distinct
// from the canonical curriculum names in labColors.ts (e.g., "Code Lab" vs
// "What IS AI?"). Keep this map in sync when canonical labs are added.
const LAB_ALIASES: Record<number, string> = {
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
  11: 'Agentic Lab',
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
  11: 'Build teams of AI agents, equip them with tools, and keep them safe',
};

// ---- Per-lab game counts (auto-derived from canonical LABS) ----
const labGameCount = (id: number): number => {
  const lab = LABS.find((l) => l.id === id);
  return lab?.games.length ?? 0;
};

export function LabDiscoveryRing() {
  // Derive lab list from canonical LAB_COLORS_TABLE — single source of truth.
  const labIds = LAB_COLORS_TABLE.map((l) => l.id);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-12">
        <p className="font-mono text-xs text-[#0FB8FA]/60 uppercase tracking-widest mb-2">
          Explore
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
          {labIds.length} AI Laboratories
        </h2>
        <p className="font-body text-base text-white/70 max-w-md mx-auto">
          Each lab unlocks a new area of AI discovery. Complete experiments
          to earn XP, collect badges, and advance through the station.
        </p>
      </div>

      {/* Lab tiles */}
      <div className="space-y-4">
        {labIds.map((id) => {
          const color = LAB_COLORS_HEX[id];
          const icon = CANONICAL_LAB_ICONS[id];
          const name = LAB_ALIASES[id] ?? `Lab ${id}`;
          const desc = LAB_DESCS[id] ?? '';
          const pattern = LAB_PATTERNS[id] ?? '';
          const gameCount = labGameCount(id);
          return (
            <Link
              key={id}
              href={`/labs/${id}`}
              data-lab-tile
              className="group relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0E16]"
              style={{
                '--tw-ring-color': color,
              } as React.CSSProperties & Record<string, string>}
              aria-label={`${name} — ${gameCount} ${gameCount === 1 ? 'game' : 'games'}. ${desc}`}
            >
              {/* Pattern background */}
              <div
                className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ backgroundImage: pattern }}
                aria-hidden="true"
              />

              {/* Gradient border glow on hover */}
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
                {/* Lab icon hex badge */}
                <div
                  className="flex-shrink-0 w-14 h-14 flex items-center justify-center text-2xl"
                  style={{
                    clipPath:
                      'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    background: `linear-gradient(135deg, ${color}20, ${color}08)`,
                  }}
                >
                  {icon}
                </div>

                {/* Lab info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-mono text-xs px-1.5 py-0.5 rounded"
                      style={{ background: `${color}15`, color }}
                    >
                      LAB {id}
                    </span>
                    <h3 className="font-display text-base font-bold text-white">
                      {name}
                    </h3>
                  </div>
                  <p className="font-body text-sm text-white/70 leading-relaxed">
                    {desc}
                  </p>
                </div>

                {/* Game count badge */}
                <div className="flex-shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <span className="font-mono text-xs text-white/60">
                    {gameCount === 0 ? 'coming soon' : `${gameCount} games`}
                  </span>
                </div>

                {/* Arrow indicator for clickable state */}
                <div className="flex-shrink-0 text-white/55 group-hover:text-white/50 transition-colors" aria-hidden="true">
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
