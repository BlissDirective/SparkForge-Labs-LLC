// src/components/landing/FeatureShowcase.tsx
// ================================================================
// FEATURE SHOWCASE — Act 3: CSS Holographic Feature Cards
// ================================================================
// Decision 8.3: CSS-only holographic effect (conic-gradient +
// mix-blend-mode) for premium feel. Consistent with Decision 4.3
// (holographic shader limited to collectibles). Lighter than R3F.
//
// 4 feature cards: Gamification, AI Safety, Adaptive Learning,
// Parent Dashboard. Each has a mini CSS animation.
//
// GSAP animations applied by parent ScrollJourney via data attrs.
//
// ENHANCEMENTS APPLIED:
//   1. prefers-reduced-motion — disables holographic sweep animation
// ================================================================

'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles, Shield, Brain, BarChart3,
  Award, Zap,
} from 'lucide-react';

// ---- Feature Card Data ----
interface FeatureCard {
  icon: typeof Sparkles;
  title: string;
  description: string;
  color: string;
  miniAnimation: 'xp-tick' | 'badge-glow' | 'brain-pulse' | 'chart-grow';
}

const FEATURES: FeatureCard[] = [
  {
    icon: Sparkles,
    title: 'Gamified Learning',
    description:
      'Earn XP, collect badges, unlock new labs, and climb the leaderboard. Every experiment rewards curiosity.',
    color: '#FFAA44',
    miniAnimation: 'xp-tick',
  },
  {
    icon: Shield,
    title: 'AI Safety First',
    description:
      'COPPA 2025 compliant. Content moderation, bias detection lessons, and responsible AI baked into every lab.',
    color: '#00FF88',
    miniAnimation: 'badge-glow',
  },
  {
    icon: Brain,
    title: 'Adaptive Learning',
    description:
      "Three age bands (7-9, 10-12, 13-16) with content that adapts to each child's level. No child left behind.",
    color: '#AA66FF',
    miniAnimation: 'brain-pulse',
  },
  {
    icon: BarChart3,
    title: 'Parent Dashboard',
    description:
      'Track progress, set time limits, review completed experiments, and celebrate milestones together.',
    color: '#00BBFF',
    miniAnimation: 'chart-grow',
  },
];

// ---- Mini Animation Components ----
function XPTickAnimation() {
  return (
    <div className="flex items-center gap-1">
      <Zap className="w-3.5 h-3.5 text-[#FFAA44]" />
      <span className="font-mono text-xs text-[#FFAA44]">+15 XP</span>
    </div>
  );
}

function BadgeGlowAnimation({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div className="relative">
      <Award className="w-5 h-5 text-[#00FF88]" />
      {!reducedMotion && (
        <div
          className="absolute inset-0 rounded-full bg-[#00FF88]/20 animate-ping"
          style={{ animationDuration: '2s' }}
        />
      )}
    </div>
  );
}

function BrainPulseAnimation() {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {['A', 'B', 'C'].map((band) => (
          <span
            key={band}
            className="w-5 h-5 rounded text-xs font-bold flex items-center justify-center bg-[#AA66FF]/20 text-[#AA66FF]"
          >
            {band}
          </span>
        ))}
      </div>
    </div>
  );
}

function ChartGrowAnimation() {
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[30, 50, 40, 70, 60, 80, 75].map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-t bg-[#00BBFF]/60"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

// ---- Component ----
export function FeatureShowcase() {
  // [Enhancement #1] Detect prefers-reduced-motion
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Section header */}
      <div className="text-center mb-12">
        <p className="font-mono text-xs text-[#AA66FF]/60 uppercase tracking-widest mb-2">
          Why SparkForge
        </p>
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
          Built for Young Explorers
        </h2>
        <p className="font-body text-base text-white/70 max-w-md mx-auto">
          Every feature is designed to make AI learning safe, fun,
          and genuinely educational.
        </p>
      </div>

      {/* Feature cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              key={feature.title}
              data-feature-card
              className="group relative rounded-2xl overflow-hidden"
            >
              {/* CSS Holographic shimmer layer (Decision 8.3) */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{
                  mixBlendMode: 'screen',
                  background: `conic-gradient(from 180deg at 50% 50%, ${feature.color}08, transparent, ${feature.color}05, transparent, ${feature.color}08)`,
                }}
                aria-hidden="true"
              />

              {/* Rainbow sweep on hover — disabled with reduced motion */}
              {!reducedMotion && (
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none holographic-sweep-bg"
                  style={{
                    background: `linear-gradient(105deg, transparent 40%, ${feature.color}15 45%, ${feature.color}25 50%, ${feature.color}15 55%, transparent 60%)`,
                    backgroundSize: '200% 100%',
                  }}
                  aria-hidden="true"
                />
              )}

              {/* Card content */}
              <div className="relative border border-white/[0.06] bg-white/[0.02] group-hover:bg-white/[0.04] rounded-2xl p-6 md:p-8 transition-colors duration-300">
                {/* Top row: icon + mini animation */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${feature.color}12` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <div className="opacity-60 group-hover:opacity-100 transition-opacity">
                    {feature.miniAnimation === 'xp-tick' && <XPTickAnimation />}
                    {feature.miniAnimation === 'badge-glow' && <BadgeGlowAnimation reducedMotion={reducedMotion} />}
                    {feature.miniAnimation === 'brain-pulse' && <BrainPulseAnimation />}
                    {feature.miniAnimation === 'chart-grow' && <ChartGrowAnimation />}
                  </div>
                </div>

                <h3 className="font-display text-lg font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="font-body text-sm text-white/75 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Keyframes moved to globals.css (HIGH-005 audit fix) */}
    </div>
  );
}
