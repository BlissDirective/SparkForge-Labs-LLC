'use client';

// ════════════════════════════════════════════════════════════════
// FORGE COMPLETE CEREMONY — Forge F3 (Concept 10 Part 7)
// ════════════════════════════════════════════════════════════════
// The badge-forge moment: dim → dais rises → molten blob → one hammer
// beat per star (blob-local flash + spark burst, ≥400ms apart — WCAG
// 2.3.1 safe by construction) → quench → reveal card.
//
// Props are IDENTICAL to CelebrationOverlay; the arcade page switches
// on FORGE_CEREMONY. Skippable at any moment (click/Esc/Enter jumps to
// the reveal). Reduced-motion renders the reveal card immediately.
// canvas-confetti is permitted here ONLY (plan §4.9).

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X } from 'lucide-react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { ForgePanel, ForgeButton, SparkBurst } from '@/components/forge';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { GameResult } from '@/types/game';

interface ForgeCompleteCeremonyProps {
  result: GameResult;
  onDismiss: () => void;
}

const CONFETTI_FORGE = ['#FF8C1A', '#FFC24A', '#35E0FF', '#F5EBDC'];
const CONFETTI_MASTERY = [...CONFETTI_FORGE, '#FF3DA5']; // plasma: 3 stars only

export function ForgeCompleteCeremony({ result, onDismiss }: ForgeCompleteCeremonyProps) {
  const reducedMotion = useReducedMotion();
  const [showCard, setShowCard] = useState(reducedMotion);
  const [burst, setBurst] = useState(0);
  const [xpCount, setXpCount] = useState(reducedMotion ? result.xpEarned : 0);
  const [visible, setVisible] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const daisRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const confettiFired = useRef(false);

  const fireConfetti = useCallback(() => {
    if (confettiFired.current || result.starsEarned < 2) return;
    confettiFired.current = true;
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: result.starsEarned === 3 ? CONFETTI_MASTERY : CONFETTI_FORGE,
    });
  }, [result.starsEarned]);

  const revealCard = useCallback(() => {
    setShowCard(true);
    fireConfetti();
  }, [fireConfetti]);

  // ── The timeline ──
  useEffect(() => {
    if (reducedMotion) return;
    const blob = blobRef.current;
    const dais = daisRef.current;
    if (!blob || !dais) return;

    const tl = gsap.timeline({ onComplete: revealCard });
    tlRef.current = tl;

    // 0.0 dais rises
    tl.fromTo(dais, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
    // 0.4 molten blob descends
    tl.fromTo(
      blob,
      { y: -80, opacity: 0, scale: 0.6 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: 'bounce.out' },
      0.4
    );
    // 1.0+ hammer beats — one per star, ≥450ms apart, blob-local flash only
    const beats = Math.max(0, result.starsEarned);
    for (let i = 0; i < beats; i++) {
      const t = 1.1 + i * 0.5;
      tl.to(blob, { filter: 'brightness(1.6)', duration: 0.09, ease: 'power1.in' }, t);
      tl.to(blob, { filter: 'brightness(1)', duration: 0.18, ease: 'power1.out' }, t + 0.09);
      tl.to(dais, { y: 3, duration: 0.06, yoyo: true, repeat: 1 }, t);
      tl.call(() => setBurst((b) => b + 1), undefined, t);
    }
    // quench: blob cools + shrinks into the card position
    const quenchAt = 1.1 + beats * 0.5 + 0.2;
    tl.to(
      blob,
      {
        backgroundColor: 'rgb(127, 226, 74)',
        scale: 0.25,
        opacity: 0,
        duration: 0.45,
        ease: 'power2.in',
      },
      quenchAt
    );
    tl.to(dais, { opacity: 0, duration: 0.3 }, quenchAt + 0.2);

    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [reducedMotion, result.starsEarned, revealCard]);

  // ── XP count-up once the card is visible ──
  useEffect(() => {
    if (!showCard || reducedMotion) return;
    const start = performance.now();
    const dur = 700;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      setXpCount(Math.round(result.xpEarned * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showCard, reducedMotion, result.xpEarned]);

  // ── Skip: any click/Escape/Enter jumps to the reveal ──
  const skip = useCallback(() => {
    if (showCard) return;
    tlRef.current?.progress(1); // fires onComplete → revealCard
  }, [showCard]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 250);
  }, [onDismiss]);

  const zeroStars = result.starsEarned === 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={stageRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(22, 16, 11, 0.88)', backdropFilter: 'blur(4px)' }}
          onPointerDown={skip}
          role="dialog"
          aria-modal="true"
          aria-label="Game complete"
        >
          {/* ── Forge stage (hidden once the card reveals) ── */}
          {!showCard && !reducedMotion && (
            <div className="relative flex flex-col items-center" aria-hidden="true">
              {/* molten blob */}
              <div className="relative">
                <div
                  ref={blobRef}
                  className="w-24 h-24 forge-anim"
                  style={{
                    borderRadius: '46% 54% 52% 48% / 50% 46% 54% 50%',
                    background:
                      'radial-gradient(circle at 40% 35%, #FFC24A 0%, #FF8C1A 55%, #C75E0C 100%)',
                    boxShadow: '0 0 40px rgba(255, 140, 26, 0.5)',
                    animation: 'forge-blob-wobble 1.8s ease-in-out infinite',
                  }}
                />
                <SparkBurst fire={burst} count={22} />
              </div>
              {/* anvil dais */}
              <div ref={daisRef} className="mt-2">
                <svg width="140" height="44" viewBox="0 0 140 44" aria-hidden="true">
                  <path
                    d="M20 8 H120 L108 20 H84 V32 H100 L104 40 H36 L40 32 H56 V20 H32 Z"
                    fill="var(--forge-bronze-deep, #8A5426)"
                    stroke="var(--forge-bronze, #C87B3B)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                className="mt-4 text-xs font-display tracking-[0.2em] uppercase"
                style={{ color: 'rgba(245, 235, 220, 0.6)' }}
              >
                Forging…
              </p>
            </div>
          )}

          {/* ── Reveal card ── */}
          {showCard && (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1.2, 0.36, 1] }}
              className="w-full max-w-sm"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ForgePanel variant="glass" glow="active" as="div" className="p-8 text-center space-y-5">
                <button
                  type="button"
                  onClick={handleDismiss}
                  aria-label="Close"
                  className="absolute top-3 right-3 p-1.5 rounded-lg"
                  style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}
                >
                  <X className="w-4 h-4" />
                </button>

                <h2
                  className="text-2xl font-bold font-display"
                  style={{
                    color: 'rgb(var(--sf-text-primary) / 1)',
                    textShadow: 'var(--glow-text, none)',
                  }}
                >
                  {zeroStars ? 'Keep Forging!' : 'Forged!'}
                </h2>

                {/* stars */}
                <div className="flex justify-center gap-2" role="img" aria-label={`${result.starsEarned} of 3 stars earned`}>
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      initial={reducedMotion ? false : { scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: reducedMotion ? 0 : 0.15 + i * 0.12, type: 'spring', stiffness: 300, damping: 16 }}
                    >
                      <Star
                        className="w-9 h-9"
                        style={
                          i < result.starsEarned
                            ? { color: 'rgb(var(--sf-primary-light) / 1)', fill: 'rgb(var(--sf-primary) / 1)' }
                            : { color: 'rgb(var(--sf-border) / 1)' }
                        }
                      />
                    </motion.span>
                  ))}
                </div>

                {/* XP + score readouts */}
                <div className="space-y-1">
                  <p
                    className="text-3xl font-bold tabular-nums"
                    style={{ fontFamily: 'var(--font-mono)', color: 'rgb(var(--sf-primary-light) / 1)' }}
                    aria-live="polite"
                  >
                    +{xpCount} XP
                  </p>
                  <p className="text-sm" style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}>
                    Score: {result.score}/{result.maxScore}
                  </p>
                  {zeroStars && (
                    <p className="text-xs" style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}>
                      Heat it up and strike again — every attempt tempers your skills.
                    </p>
                  )}
                </div>

                <ForgeButton variant="molten" size="lg" className="w-full" onClick={handleDismiss}>
                  Claim
                </ForgeButton>
              </ForgePanel>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
