'use client';

// ════════════════════════════════════════════════════════════════════════════
// HERO HOLOGRAM — "The Hologram Reveal" (Part III.2.1, owner-approved)
// ════════════════════════════════════════════════════════════════════════════
// Sparky powers a projection puck; a cyan light-cone fans upward and
// materializes the page title "Welcome to SparkForge Labs" as a hologram.
// Owner decisions (July 2): full sequence every visit (~3s), cyan gradient
// matching Sparky, same sequence on mobile with simplified cone effects,
// reduced-motion renders the finished composition instantly.
// Owner revisions (July 2, round 2): no energy arc between Sparky and the
// puck; larger title; stronger banded gradient so the type reads as light;
// the beam trapezoid fully encases every letter at all viewports — the
// cone and the title share one measured container so the geometry can't
// drift apart responsively.
//
// Pure SVG + Framer Motion — no new dependencies. The h1 is real HTML text
// (screen readers get the title immediately; animation is presentational).

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { SparkyCore } from '@/components/sparky/SparkyCore';
import LightRays from '@/components/bits/LightRays';

const CYAN = '#4DE9FF';

// Sequence timeline (seconds).
const T = {
  sparkyIn: 0,
  puck: 0.8,
  cone: 1.1,
  banner: 1.6,
  settled: 2.5,
} as const;

// Beam geometry: trapezoid from the puck mouth (bottom) fanning out to the
// full container width (top). The title sits in the upper band of the same
// container with side padding ≥ the cone's inset at the title's lowest
// point, so no glyph can escape the light.
const BEAM_CLIP = 'polygon(46.5% 100%, 53.5% 100%, 100% 0%, 0% 0%)';

export function HeroHologram() {
  const reducedMotion = useReducedMotion() ?? false;
  // Mobile keeps the same sequence with simplified cone effects (no
  // flicker / interior scanline animation) — owner decision #4.
  const [simplified, setSimplified] = useState(false);
  useEffect(() => {
    setSimplified(window.matchMedia('(max-width: 767px)').matches);
  }, []);

  const instant = reducedMotion;
  const d = (t: number) => (instant ? 0 : t);

  return (
    <div className="relative mx-auto w-full" style={{ maxWidth: 'min(96vw, 1080px)' }}>
      {/* ══ Volumetric light rays — the hologram's light source, behind the
          cone + banner (LightRays root is absolute inset-0 + aria-hidden;
          reduced motion renders static rays inside the component) ══ */}
      <LightRays origin="bottom-center" intensity={0.55} className="z-0" />

      {/* ══ Light cone — spans the WHOLE container, title included ══ */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 pointer-events-none"
        initial={instant ? false : { opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ delay: d(T.cone), duration: instant ? 0 : 0.65, ease: 'easeOut' }}
        style={{
          bottom: 'clamp(30px, 5vw, 48px)', // beam mouth meets the puck
          transformOrigin: 'bottom center',
          clipPath: BEAM_CLIP,
          background: `linear-gradient(180deg, ${CYAN}0A 0%, ${CYAN}1F 30%, ${CYAN}2E 78%, ${CYAN}45 100%)`,
          ...(simplified
            ? {}
            : {
                backgroundImage: `linear-gradient(180deg, ${CYAN}0A 0%, ${CYAN}1F 30%, ${CYAN}2E 78%, ${CYAN}45 100%), repeating-linear-gradient(180deg, transparent 0px, transparent 6px, ${CYAN}0E 7px)`,
              }),
        }}
      >
        {/* Edge glow rails (desktop only) */}
        {!simplified && !instant && (
          <>
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.45, 0.85, 0.55, 0.95, 0.6] }}
              transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut' }}
              style={{
                clipPath: 'polygon(46.5% 100%, 47.6% 100%, 1.2% 0%, 0% 0%)',
                background: `linear-gradient(180deg, ${CYAN}70, transparent 85%)`,
              }}
            />
            <motion.div
              className="absolute inset-0"
              animate={{ opacity: [0.6, 0.9, 0.5, 0.85, 0.55] }}
              transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut', delay: 0.6 }}
              style={{
                clipPath: 'polygon(52.4% 100%, 53.5% 100%, 100% 0%, 98.8% 0%)',
                background: `linear-gradient(180deg, ${CYAN}70, transparent 85%)`,
              }}
            />
          </>
        )}
      </motion.div>

      {/* ══ Banner — inside the beam's upper band ══ */}
      <div className="relative z-10 px-[9%] pt-[1.5%]">
        <motion.h1
          initial={instant ? false : { opacity: 0, filter: 'blur(16px)', scale: 0.94 }}
          animate={{
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            x: instant ? 0 : [0, -3, 2, -1, 0],
          }}
          transition={{ delay: d(T.banner), duration: instant ? 0 : 0.85, ease: 'easeOut' }}
          className="text-center font-extrabold tracking-tight leading-[1.06] select-none"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 7vw, 5.6rem)',
            // Banded, semi-translucent gradient — light, not paint (owner
            // revision: "more gradient-like, more hologram"). Brightened
            // (July 2, R1): darker stops lifted toward #7FEFFF/#4DE9FF with
            // higher alpha so the title pops against the ray-lit scene,
            // while keeping the banded contrast.
            backgroundImage: `linear-gradient(180deg,
              rgba(240, 255, 255, 0.98) 0%,
              rgba(159, 244, 255, 0.94) 16%,
              rgba(127, 239, 255, 0.96) 34%,
              rgba(77, 233, 255, 0.78) 50%,
              rgba(159, 244, 255, 0.94) 62%,
              rgba(127, 239, 255, 0.9) 78%,
              rgba(77, 233, 255, 0.72) 100%)`,
            backgroundSize: '100% 200%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            // Glow strengthened ~20% (0x66→0x7A, 0x33→0x3D).
            filter: `drop-shadow(0 0 20px ${CYAN}7A) drop-shadow(0 0 52px ${CYAN}3D)`,
            ...(instant || simplified
              ? {}
              : { animation: 'sf-holo-drift 5s ease-in-out infinite alternate' }),
          }}
        >
          Welcome to
          <br />
          SparkForge Labs
        </motion.h1>

        {/* Persistent scanlines over the title */}
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

      {/* Gradient-drift keyframes for the hologram type */}
      <style>{`@keyframes sf-holo-drift { from { background-position-y: 0%; } to { background-position-y: 100%; } }`}</style>

      {/* ══ Floor: puck + Sparky ══ */}
      <div className="relative" style={{ height: 'clamp(120px, 19vw, 190px)' }}>
        {/* Projection puck */}
        <motion.div
          aria-hidden="true"
          className="absolute left-1/2 bottom-0 -translate-x-1/2"
          initial={instant ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: d(0.25), duration: instant ? 0 : 0.4 }}
        >
          <svg width="120" height="44" viewBox="0 0 120 44">
            <ellipse cx="60" cy="30" rx="34" ry="10" fill="#39445F" />
            <ellipse cx="60" cy="26" rx="34" ry="10" fill="url(#hh-puck)" />
            <defs>
              <linearGradient id="hh-puck" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E7ECF6" />
                <stop offset="60%" stopColor="#9AA6C2" />
                <stop offset="100%" stopColor="#5A6684" />
              </linearGradient>
            </defs>
            <motion.ellipse
              cx="60"
              cy="24.5"
              rx="20"
              ry="5.4"
              fill="none"
              stroke={CYAN}
              strokeWidth="2"
              initial={instant ? false : { opacity: 0.12 }}
              animate={instant ? { opacity: 0.95 } : { opacity: [0.12, 0.12, 1, 0.85, 0.95] }}
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

        {/* Sparky — beside his projector, no tether (owner revision) */}
        <motion.div
          className="absolute bottom-0"
          style={{ left: 'max(2%, calc(50% - min(34vw, 300px)))' }}
          initial={instant ? false : { opacity: 0, x: -46, y: 8 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: d(T.sparkyIn), duration: instant ? 0 : 0.7, ease: 'easeOut' }}
        >
          {/* Brightness wrapper (July 2, R1): lifts Sparky against the
              ray-lit scene without touching SparkyCore (uniformity rule). */}
          <div style={{ filter: 'brightness(1.12) saturate(1.05)' }}>
            <SparkyCore
              expression="happy"
              pixelSize="clamp(72px, 13vw, 150px)"
              isAnimated={!instant}
              showAura
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
