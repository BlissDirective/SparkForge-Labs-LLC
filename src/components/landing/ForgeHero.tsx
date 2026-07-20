'use client';

// ════════════════════════════════════════════════════════════════
// FORGE HERO — Forge F6 (Concept 10 §10.2–10.3)
// ════════════════════════════════════════════════════════════════
// Layer stack (bottom→top): CSS poster (always present — no-JS /
// no-WebGL / pre-hydration state) → Lightfall shader (post-mount,
// lazy) → warm readability scrim → content (light-forged wordmark,
// canonical tagline, CTAs, trust row).
//
// The <h1> is real text and the LCP element; the canvas fades in
// behind it. No mascot in the title — the falling light forges the
// brand name itself.

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { Sparkles, Play, Shield, Gamepad2, Zap } from 'lucide-react';
import SplitText from '@/components/bits/SplitText';
import { useForgeTier } from '@/hooks/useForgeTier';
import type { LightfallHandle } from '@/components/bits/Lightfall';

const Lightfall = dynamic(() => import('@/components/bits/Lightfall'), { ssr: false });

// Timeline (s): pour 0.3–1.6 · temper 1.6–2.2 · LABS 2.2 · tagline 2.4 · CTAs 2.7
const T_LABS = 2.2;
const T_TAGLINE = 2.4;
const T_CTA = 2.7;

export function ForgeHero() {
  const { isCompact, prefersReducedMotion } = useForgeTier();
  const [canvasReady, setCanvasReady] = useState(false);
  const lightfallRef = useRef<LightfallHandle>(null);

  // Mount the shader after first paint so the h1/poster own the LCP.
  const [mountCanvas, setMountCanvas] = useState(false);
  useEffect(() => {
    const idle =
      'requestIdleCallback' in window
        ? (cb: () => void) => (window as Window & typeof globalThis).requestIdleCallback(cb, { timeout: 1500 })
        : (cb: () => void) => setTimeout(cb, 300);
    idle(() => setMountCanvas(true));
  }, []);

  return (
    <section
      className="relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#16100B' }}
    >
      {/* z0 — poster (permanent fallback, prevents any flash) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 30%, #33261C 0%, #1E1610 45%, #16100B 100%)',
        }}
      />

      {/* z1 — Lightfall (falling light feeds the forge) */}
      {mountCanvas && (
        <div
          className="absolute inset-0 z-[1] transition-opacity duration-700"
          style={{ opacity: canvasReady ? 1 : 0 }}
          ref={() => {
            // Fade in on the frame after mount; the component renders
            // its first frame immediately.
            if (!canvasReady) requestAnimationFrame(() => setCanvasReady(true));
          }}
        >
          <Lightfall
            ref={lightfallRef}
            colors={['#FFC24A', '#FF8C1A', '#35E0FF']}
            backgroundColor="#16100B"
            speed={0.5}
            density={isCompact ? 0.4 : 0.6}
            streakCount={isCompact ? 6 : 10}
            glow={1}
            twinkle={0.6}
            backgroundGlow={0.35}
            compactDpr={isCompact}
            staticFrame={prefersReducedMotion}
            mouseInteraction={!isCompact}
            mouseStrength={0.5}
            mouseRadius={1}
            mouseDampening={0.15}
          />
        </div>
      )}

      {/* z2 — warm readability scrim */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(22,16,11,0.72) 0%, rgba(22,16,11,0.35) 55%, rgba(22,16,11,0) 100%)',
        }}
      />

      {/* z3 — content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20 space-y-7">
        {/* ── The light-forged wordmark ── */}
        <h1 className="select-none" aria-label="SparkForge Labs">
          <span
            className="relative block font-extrabold leading-none tracking-tight"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 9vw, 7.5rem)' }}
            aria-hidden="true"
          >
            {/* base: unlit alloy (visible from frame one, ≥3:1 on ground) */}
            <span
              className="block"
              style={{
                backgroundImage: 'linear-gradient(180deg, #4A3A2C 0%, #33261C 60%, #291E16 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 1px 0 rgba(255,236,210,0.06)',
              }}
            >
              SPARKFORGE
            </span>
            {/* molten pour: revealed bottom-up */}
            <span
              className="absolute inset-0 block forge-wordmark-molten"
              style={{
                backgroundImage: 'linear-gradient(180deg, #FFC24A 0%, #FF8C1A 55%, #C75E0C 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              SPARKFORGE
            </span>
            {/* settled: tempered chrome-amber with breathing rim */}
            <span
              className="absolute inset-0 block forge-wordmark-settled"
              style={{
                backgroundImage: 'linear-gradient(180deg, #F5EBDC 0%, #FFC24A 45%, #C87B3B 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              <span
                className="absolute inset-0 forge-wordmark-breathe"
                style={{
                  backgroundImage: 'linear-gradient(180deg, #F5EBDC 0%, #FFC24A 45%, #C87B3B 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                  filter: 'drop-shadow(0 0 18px rgba(255,194,74,0.35))',
                }}
                aria-hidden="true"
              >
                SPARKFORGE
              </span>
              SPARKFORGE
            </span>
          </span>
          <motion.span
            aria-hidden="true"
            className="block font-semibold mt-2"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(0.9rem, 2.2vw, 1.8rem)',
              color: '#D3C2AC',
            }}
            initial={prefersReducedMotion ? false : { opacity: 0, letterSpacing: '0.6em' }}
            animate={{ opacity: 1, letterSpacing: '0.42em' }}
            transition={{ delay: T_LABS, duration: 0.5 }}
          >
            LABS
          </motion.span>
        </h1>

        {/* ── Canonical tagline ── */}
        <p
          className="text-xl sm:text-2xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: '#F5EBDC' }}
        >
          <SplitText
            text="Sparking Curiosity, and Forging Skills with AI"
            by="word"
            stagger={0.05}
            delay={T_TAGLINE}
          />
        </p>

        {/* ── Supporting line ── */}
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: T_CTA - 0.2 }}
          className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          style={{ color: 'rgba(245,235,220,0.85)', textShadow: '0 1px 12px rgba(22,16,11,0.8)' }}
        >
          Play 42 games that teach real AI, coding, and digital literacy.
          No experience needed — just curiosity.
        </motion.p>

        {/* ── CTAs ── */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: T_CTA }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <a
            href="/signup"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-base transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] forge-molten-fill forge-anim"
            style={{ color: '#16100B', boxShadow: '0 4px 24px rgba(255,140,26,0.35)' }}
          >
            <Sparkles className="w-5 h-5" />
            Enter the Forge
          </a>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold text-base transition-all hover:bg-white/10 active:scale-[0.98]"
            style={{
              color: 'rgba(245,235,220,0.9)',
              border: '1px solid rgba(255,194,74,0.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Play className="w-5 h-5" />
            See How It Works
          </a>
        </motion.div>

        {/* ── Trust indicators ── */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: T_CTA + 0.4 }}
          className="pt-8 flex flex-wrap items-center justify-center gap-6"
          style={{
            color: 'rgba(245,235,220,0.75)',
            fontSize: '0.875rem',
            textShadow: '0 1px 10px rgba(22,16,11,0.8)',
          }}
        >
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" style={{ color: '#7FE24A' }} />
            COPPA Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" style={{ color: '#FFD93D' }} />
            No Credit Card Required
          </span>
          <span className="flex items-center gap-1.5">
            <Gamepad2 className="w-3.5 h-3.5" style={{ color: '#35E0FF' }} />
            42 Learning Games
          </span>
        </motion.div>
      </div>
    </section>
  );
}
