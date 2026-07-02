'use client';

// ════════════════════════════════════════════════════════════════════════════
// HERO HOLOGRAM — "The Hologram Reveal" (Part III.2.1, owner-approved)
// ════════════════════════════════════════════════════════════════════════════
// Sparky connects to a projection puck; a cyan light-cone fans upward and
// materializes the page title "Welcome to SparkForge Labs" as a hologram.
// Owner decisions (July 2): full sequence on every visit (~3s), cyan
// gradient to match Sparky, same sequence on mobile with simplified cone
// effects, reduced-motion skips straight to the finished composition.
//
// Pure SVG + Framer Motion — no new dependencies. The h1 is real HTML
// text (screen readers see the title immediately; the animation is
// presentation only).

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SparkyCore } from '@/components/sparky/SparkyCore';

const CYAN = '#4DE9FF';
const CYAN_DEEP = '#00B8E0';

// Sequence timeline (seconds) — every beat keys off these so the whole
// choreography can be retuned in one place.
const T = {
  sparkyIn: 0,
  arc: 0.7,
  puck: 1.05,
  cone: 1.3,
  banner: 1.8,
  settled: 2.6,
} as const;

export function HeroHologram() {
  const reducedMotion = useReducedMotion() ?? false;
  // Mobile gets the same sequence with simplified cone effects
  // (no flicker/scanline animation) — owner decision #4.
  const [simplified, setSimplified] = useState(false);
  useEffect(() => {
    setSimplified(window.matchMedia('(max-width: 767px)').matches);
  }, []);

  // Reduced motion: render the finished composition instantly.
  const instant = reducedMotion;
  const d = (t: number) => (instant ? 0 : t);

  return (
    <div
      className="relative mx-auto w-full"
      style={{ maxWidth: 'min(88vw, 860px)' }}
    >
      {/* ══ Banner (inside the cone's apex) ══ */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.h1
          initial={instant ? false : { opacity: 0, filter: 'blur(14px)', scale: 0.96 }}
          animate={{
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            // Glitch jitter as the letters resolve, then locked.
            x: instant ? 0 : [0, -3, 2, -1, 0],
          }}
          transition={{
            delay: d(T.banner),
            duration: instant ? 0 : 0.85,
            ease: 'easeOut',
          }}
          className="text-center font-extrabold tracking-tight leading-[1.08] select-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.9rem, 5.4vw, 4.2rem)',
            backgroundImage: `linear-gradient(180deg, #EAFDFF 0%, ${CYAN} 45%, ${CYAN_DEEP} 100%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: 'none',
            filter: `drop-shadow(0 0 18px ${CYAN}55) drop-shadow(0 0 42px ${CYAN}30)`,
          }}
        >
          Welcome to
          <br />
          SparkForge Labs
        </motion.h1>

        {/* Persistent hologram shimmer + scanlines over the title */}
        {!instant && (
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: simplified ? 0.1 : 0.16 }}
            transition={{ delay: d(T.settled) }}
            style={{
              background:
                'repeating-linear-gradient(180deg, transparent 0px, transparent 3px, rgba(77,233,255,0.35) 4px)',
              maskImage: 'linear-gradient(180deg, black 80%, transparent)',
              WebkitMaskImage: 'linear-gradient(180deg, black 80%, transparent)',
            }}
          />
        )}
      </div>

      {/* ══ Projection scene: cone + puck + arc + Sparky ══ */}
      <div className="relative mt-2" style={{ height: 'clamp(150px, 24vw, 230px)' }}>
        {/* Light cone — fans upward from the puck to the banner */}
        <motion.div
          aria-hidden="true"
          className="absolute left-1/2 bottom-[26%] -translate-x-1/2 pointer-events-none"
          initial={instant ? false : { opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: d(T.cone), duration: instant ? 0 : 0.6, ease: 'easeOut' }}
          style={{
            width: 'min(72vw, 640px)',
            height: 'calc(clamp(150px, 24vw, 230px) * 0.74 + clamp(1.9rem, 5.4vw, 4.2rem) * 2.4)',
            transformOrigin: 'bottom center',
            clipPath: 'polygon(44% 100%, 56% 100%, 100% 0%, 0% 0%)',
            background: `linear-gradient(180deg, ${CYAN}30 0%, ${CYAN}14 55%, ${CYAN}05 100%)`,
            // Desktop gets animated interior scanlines; mobile keeps a plain cone.
            ...(simplified
              ? {}
              : {
                  backgroundImage: `linear-gradient(180deg, ${CYAN}30 0%, ${CYAN}12 55%, ${CYAN}04 100%), repeating-linear-gradient(180deg, transparent 0px, transparent 5px, ${CYAN}12 6px)`,
                }),
          }}
        >
          {/* Edge flicker (desktop only) */}
          {!simplified && !instant && (
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.5, 0.9, 0.6, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
              style={{
                clipPath: 'polygon(44% 100%, 45.5% 100%, 1.5% 0%, 0% 0%)',
                background: `linear-gradient(180deg, ${CYAN}66, transparent 80%)`,
              }}
            />
          )}
        </motion.div>

        {/* Projection puck */}
        <motion.div
          aria-hidden="true"
          className="absolute left-1/2 bottom-[14%] -translate-x-1/2"
          initial={instant ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: d(0.3), duration: instant ? 0 : 0.4 }}
        >
          <svg width="120" height="44" viewBox="0 0 120 44">
            {/* Puck body — chrome to match Sparky */}
            <ellipse cx="60" cy="30" rx="34" ry="10" fill="#39445F" />
            <ellipse cx="60" cy="26" rx="34" ry="10" fill="url(#hh-puck)" />
            <defs>
              <linearGradient id="hh-puck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E7ECF6" />
                <stop offset="60%" stopColor="#9AA6C2" />
                <stop offset="100%" stopColor="#5A6684" />
              </linearGradient>
            </defs>
            {/* Emitter ring — ignites when Sparky connects */}
            <motion.ellipse
              cx="60"
              cy="24.5"
              rx="20"
              ry="5.4"
              fill="none"
              stroke={CYAN}
              strokeWidth="2"
              initial={instant ? false : { opacity: 0.12 }}
              animate={
                instant
                  ? { opacity: 0.95 }
                  : { opacity: [0.12, 0.12, 1, 0.85, 0.95] }
              }
              transition={{ delay: d(T.puck), duration: instant ? 0 : 0.5 }}
              style={{ filter: `drop-shadow(0 0 6px ${CYAN})` }}
            />
            <motion.ellipse
              cx="60"
              cy="24.5"
              rx="10"
              ry="2.6"
              fill={CYAN}
              initial={instant ? false : { opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ delay: d(T.cone) }}
              style={{ filter: `drop-shadow(0 0 10px ${CYAN})` }}
            />
          </svg>
        </motion.div>

        {/* Energy arc from Sparky's chest core to the puck */}
        <motion.svg
          aria-hidden="true"
          className="absolute left-1/2 bottom-[16%] pointer-events-none"
          style={{ transform: 'translateX(-100%)', overflow: 'visible' }}
          width="180"
          height="90"
          viewBox="0 0 180 90"
        >
          <motion.path
            d="M 8 34 Q 80 -6 172 62"
            fill="none"
            stroke={CYAN}
            strokeWidth="2.4"
            strokeLinecap="round"
            initial={instant ? false : { pathLength: 0, opacity: 0 }}
            animate={
              instant
                ? { pathLength: 1, opacity: 0.75 }
                : { pathLength: 1, opacity: [0, 1, 0.75] }
            }
            transition={{ delay: d(T.arc), duration: instant ? 0 : 0.5, ease: 'easeInOut' }}
            style={{ filter: `drop-shadow(0 0 5px ${CYAN})` }}
          />
          {/* Traveling pulse along the arc (desktop only) */}
          {!simplified && !instant && (
            <motion.circle
              r="3.2"
              fill="#FFFFFF"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ delay: d(T.arc), duration: 0.6, repeat: Infinity, repeatDelay: 2.2 }}
              style={{ filter: `drop-shadow(0 0 6px ${CYAN})` }}
            >
              <animateMotion
                path="M 8 34 Q 80 -6 172 62"
                dur="0.6s"
                begin={`${T.arc}s`}
                repeatCount="indefinite"
              />
            </motion.circle>
          )}
        </motion.svg>

        {/* Sparky — fluid-sized, floats in from the left and settles */}
        <motion.div
          className="absolute bottom-[4%]"
          style={{ left: 'max(2%, calc(50% - min(36vw, 320px)))' }}
          initial={instant ? false : { opacity: 0, x: -46, y: 8 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: d(T.sparkyIn), duration: instant ? 0 : 0.7, ease: 'easeOut' }}
        >
          <SparkyCore
            expression="happy"
            pixelSize="clamp(72px, 13vw, 150px)"
            isAnimated={!instant}
            showAura
          />
        </motion.div>
      </div>
    </div>
  );
}
