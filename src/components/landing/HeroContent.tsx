'use client';

// ════════════════════════════════════════════════════════════════════════════
// HERO CONTENT — Hologram Reveal composition (Part III.2.1)
// ════════════════════════════════════════════════════════════════════════════
// Owner decisions (July 2):
//  - The holographic "Welcome to SparkForge Labs" banner (HeroHologram)
//    REPLACES the old "Learn AI. Build the Future." headline.
//  - Brand subtitle below the animation: "Sparking Curiosity, and Forging
//    Skills with AI" — matches the design scheme, deliberately NOT
//    holographic; gets a react-bits ShinyText treatment so it pops.
//  - Full sequence on every visit; reduced-motion renders the finished
//    composition instantly (handled inside HeroHologram).

import { motion } from 'motion/react';
import { Sparkles, Play, Shield, Gamepad2, Zap } from 'lucide-react';
import { HeroHologram } from './HeroHologram';
import ShinyText from '@/components/bits/ShinyText';

export function HeroContent() {
  return (
    <div className="space-y-7">
      {/* ── Hologram title sequence: Sparky + puck + cone + banner ── */}
      <HeroHologram />

      {/* ── Brand subtitle — solid, non-holographic, ShinyText pop ── */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 2.5 }}
        className="text-xl sm:text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <ShinyText
          text="Sparking Curiosity, and Forging Skills with AI"
          speed={3.5}
          color="#F0F2F8"
        />
      </motion.p>

      {/* ── Supporting line ── */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 2.7 }}
        className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
        style={{
          color: 'rgba(255, 255, 255, 0.85)',
          textShadow: '0 1px 12px rgba(10, 15, 30, 0.8)',
        }}
      >
        Play 42 games that teach real AI, coding, and digital literacy.
        No experience needed — just curiosity.
      </motion.p>

      {/* ── CTA Buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 2.9 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
      >
        <a
          href="/signup"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-white text-base transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #E945F5, #2F4BC0)',
            boxShadow: '0 4px 20px rgba(233, 69, 245, 0.35)',
          }}
        >
          <Sparkles className="w-5 h-5" />
          Start Free
        </a>

        <a
          href="#how-it-works"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-base transition-all hover:bg-white/10 active:scale-[0.98]"
          style={{
            color: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Play className="w-5 h-5" />
          See How It Works
        </a>
      </motion.div>

      {/* ── Trust Indicators ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 3.2 }}
        className="pt-8 flex flex-wrap items-center justify-center gap-6"
        style={{
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: '0.875rem',
          textShadow: '0 1px 10px rgba(10, 15, 30, 0.8)',
        }}
      >
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" style={{ color: '#2ECC71' }} />
          COPPA Compliant
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" style={{ color: '#FFD93D' }} />
          No Credit Card Required
        </span>
        <span className="flex items-center gap-1.5">
          <Gamepad2 className="w-3.5 h-3.5" style={{ color: '#4F6EF7' }} />
          42 Learning Games
        </span>
      </motion.div>
    </div>
  );
}
