// Enhancement 8.1: 'framer-motion' rebranded to 'motion' — import from 'motion/react'
import { type Variants, type Transition } from 'motion/react';

// ═══ SPRING PRESETS ═══
export const springs = {
  gentle: { type: 'spring', stiffness: 150, damping: 20 } as Transition,
  bouncy: { type: 'spring', stiffness: 300, damping: 15 } as Transition,
  snappy: { type: 'spring', stiffness: 500, damping: 25 } as Transition,
  wobbly: { type: 'spring', stiffness: 180, damping: 12 } as Transition,
  panel: { type: 'spring', stiffness: 200, damping: 22 } as Transition,
};

// ═══ FADE VARIANTS ═══
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const fadeSlideDown: Variants = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2 } },
};

// ═══ PAGE TRANSITIONS ═══
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -12, filter: 'blur(4px)', transition: { duration: 0.25 } },
};

// ═══ STAGGER CONTAINERS ═══
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
};

export const staggerFast: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
};

export const listRevealContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

export const listRevealItem: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: springs.gentle },
};

// ═══ SCALE & POP ═══
export const scaleIn: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: springs.bouncy },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2 } },
};

export const popIn: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: [0, 1.15, 1], opacity: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } },
};

// ═══ SLIDE VARIANTS ═══
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition: springs.gentle },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: springs.gentle },
  exit: { opacity: 0, x: 40, transition: { duration: 0.2 } },
};

export const slideDrawer: Variants = {
  initial: { x: '100%' },
  animate: { x: 0, transition: springs.panel },
  exit: { x: '100%', transition: { duration: 0.25 } },
};

// ═══ HOVER EFFECTS ═══
export const hoverLift: Variants = {
  rest: { y: 0, scale: 1 },
  hover: { y: -6, scale: 1.02, transition: springs.gentle },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

export const hoverGlow: Variants = {
  rest: { boxShadow: '0 0 0 rgba(0, 187, 255, 0)' },
  hover: { boxShadow: '0 0 20px rgba(0, 187, 255, 0.3), 0 0 40px rgba(0, 187, 255, 0.1)', transition: { duration: 0.3 } },
};

export const cardHover: Variants = {
  rest: { scale: 1, y: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 2px 6px rgba(0,0,0,0.2)' },
  hover: { scale: 1, y: -4, boxShadow: '0 8px 24px rgba(0,187,255,0.12), 0 0 0 1px rgba(0,187,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05)', transition: springs.gentle },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

export const hexHover: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.12, transition: { type: 'spring', stiffness: 350, damping: 18 } },
  tap: { scale: 1.05, transition: { duration: 0.1 } },
};

// ═══ MICRO INTERACTIONS ═══
export const microBounce: Variants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.15, 0.95, 1.05, 1], transition: { duration: 0.5 } },
};

export const timerPulse: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: { scale: [1, 1.05, 1], opacity: [1, 0.8, 1], transition: { duration: 1, repeat: Infinity } },
};

export const skeletonPulse: Variants = {
  initial: { opacity: 0.4 },
  animate: { opacity: [0.4, 0.7, 0.4], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } },
};

// ═══ GAMIFICATION ═══
export const xpFloat: Variants = {
  initial: { opacity: 0, y: 0, scale: 0.5 },
  animate: { opacity: [0, 1, 1, 0], y: [0, -30, -50, -70], scale: [0.5, 1.2, 1, 0.8], transition: { duration: 1.5, times: [0, 0.2, 0.7, 1] } },
};

export const streakFlame: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: [0.8, 1.2, 1], opacity: 1, transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] } },
};

export const xpGain: Variants = {
  initial: { scale: 0, opacity: 0, y: 0 },
  animate: { scale: [0, 1.4, 1], opacity: [0, 1, 1], y: [0, -20, -10], transition: { duration: 0.8, times: [0, 0.4, 1] } },
};

export const badgeUnlock: Variants = {
  initial: { scale: 0, rotate: -180, opacity: 0 },
  animate: { scale: [0, 1.3, 1], rotate: [0, 10, 0], opacity: 1, transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] } },
};

export const levelUp: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: [0, 1.5, 0.9, 1.1, 1], opacity: 1, transition: { duration: 1.2, times: [0, 0.3, 0.5, 0.7, 1] } },
};

export const confettiPiece = (index: number): Variants => ({
  initial: { y: -20, x: 0, opacity: 1, rotate: 0, scale: 1 },
  animate: { y: [0, -100, 400], x: [0, (Math.random() - 0.5) * 300], rotate: [0, Math.random() * 720], opacity: [1, 1, 0], scale: [1, 1.2, 0.5], transition: { duration: 2, delay: index * 0.05 } },
});

export const correctAnswer: Variants = {
  initial: { backgroundColor: 'transparent' },
  animate: { backgroundColor: ['transparent', 'rgba(0, 255, 136, 0.2)', 'transparent'], scale: [1, 1.05, 1], transition: { duration: 0.6 } },
};

export const wrongAnswer: Variants = {
  initial: { x: 0 },
  animate: { x: [-8, 8, -6, 6, -4, 4, 0], transition: { duration: 0.5 } },
};

// ═══ PROGRESS ═══
export const progressRing = (percent: number): Variants => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: percent / 100, opacity: 1, transition: { duration: 1.2, ease: 'easeOut' } },
});

export const progressFill = (percent: number): Variants => ({
  initial: { width: '0%' },
  animate: { width: `${percent}%`, transition: { duration: 1, ease: 'easeOut' } },
});

// ═══ FLOATING & AMBIENT ═══
export const floatingIsland: Variants = {
  initial: { y: 0 },
  animate: { y: [0, -8, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } },
};

// ═══ HERO / LANDING ═══
export const heroTitle: Variants = {
  initial: { opacity: 0, y: 40, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const heroSubtitle: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.3 } },
};

// ═══ LAB / MODULE ═══
export const moduleTransition: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

export const labCardEntrance = (index: number): Variants => ({
  initial: { opacity: 0, scale: 0.7 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, delay: index * 0.06, ease: [0.34, 1.56, 0.64, 1] } },
});

export const lockShake: Variants = {
  initial: {},
  animate: { rotate: [-3, 3, -3, 3, 0], transition: { duration: 0.4 } },
};

export const staggerItemFromLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: springs.gentle },
};

export const panelSlideRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: springs.panel },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

// ═══ MODAL / TOOLTIP / OVERLAY ═══
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springs.bouncy },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
};

export const tooltipPop: Variants = {
  initial: { opacity: 0, scale: 0.8, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.15 } },
};

// ═══ PARTICLE EFFECTS ═══
export const sparkParticle = (delay: number): Variants => ({
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -40 - Math.random() * 30], x: [(Math.random() - 0.5) * 60], transition: { duration: 1.5, delay, ease: 'easeOut' } },
});

// ═══ COUNTUP SPRING ═══
export const countUp = {
  type: 'spring',
  stiffness: 100,
  damping: 30,
  mass: 1,
} as Transition;

// ═══ SAFE VARIANT WRAPPER ═══
/**
 * Wraps a variant to respect user's reduced-motion preference.
 * Falls back to simple opacity fade when reducedMotion is true.
 */
export function safeVariant(variant: Variants, reducedMotion = false): Variants {
  if (!reducedMotion) return variant;
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.15 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };
}
