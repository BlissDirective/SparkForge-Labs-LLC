// ════════════════════════════════════════════════════════════════
// SparkForge Easing Tokens — P2 §5.9 (Opt B)
// ════════════════════════════════════════════════════════════════
// Single source of truth for every easing curve used across the
// platform. Use these tokens instead of inline cubic-bezier arrays
// or GSAP/Framer named strings so motion feels consistent between
// 2D UI (Motion / Framer), GSAP timelines, and CSS transitions.
//
// Naming convention:
//   SF_EASE_STANDARD     — default for most UI transitions (modals,
//                          fade-in/out, small state changes).
//   SF_EASE_EMPHASIZED   — for hero moments (lab launch, celebration
//                          start) — starts fast, settles slow.
//   SF_EASE_DECELERATE   — enter-from-offscreen transitions; fast
//                          at start, eases into rest.
//   SF_EASE_ACCELERATE   — exit transitions; slow at start, fast
//                          into exit (opposite of decelerate).
//   SF_EASE_BOUNCE       — celebratory bounce, reserved for XP pops
//                          + badge unlocks.
//   SF_EASE_SPRING       — GSAP spring preset (mass: 1, damping: 12).
//
// Each token exposes three forms so every motion library can consume
// directly:
//   .bezier     — [x1, y1, x2, y2] array for Motion / Framer / React
//                 Spring.
//   .css        — `cubic-bezier(...)` string for CSS transition-
//                 timing-function.
//   .gsap       — GSAP string (`power3.out`, `bounce.out`, etc.).
//
// If you need a curve that isn't here, ADD it to this file — don't
// inline. ESLint rule flags raw `cubic-bezier(...)` + raw
// `[x,y,x,y]` eased arrays outside src/lib/easings.ts.
// ════════════════════════════════════════════════════════════════

export interface EasingToken {
  /** Bezier tuple for Motion / Framer / React Spring. */
  bezier: readonly [number, number, number, number];
  /** CSS `transition-timing-function` string. */
  css: string;
  /** GSAP ease name (closest equivalent). */
  gsap: string;
}

function token(
  bezier: readonly [number, number, number, number],
  gsap: string,
): EasingToken {
  return {
    bezier,
    css: `cubic-bezier(${bezier.join(', ')})`,
    gsap,
  };
}

/** Default easing — cubic-bezier(0.4, 0.0, 0.2, 1) — Material standard. */
export const SF_EASE_STANDARD = token([0.4, 0.0, 0.2, 1], 'power2.inOut');

/** Hero emphasis — cubic-bezier(0.22, 1, 0.36, 1) — fast then soft. */
export const SF_EASE_EMPHASIZED = token([0.22, 1, 0.36, 1], 'power4.out');

/** Enter transitions — cubic-bezier(0.0, 0.0, 0.2, 1). */
export const SF_EASE_DECELERATE = token([0.0, 0.0, 0.2, 1], 'power3.out');

/** Exit transitions — cubic-bezier(0.4, 0.0, 1, 1). */
export const SF_EASE_ACCELERATE = token([0.4, 0.0, 1, 1], 'power3.in');

/** Celebratory bounce — reserved for XP pops + badge unlocks. */
export const SF_EASE_BOUNCE = token([0.68, -0.55, 0.265, 1.55], 'bounce.out');

/** GSAP-only spring preset (no pure bezier equivalent). */
export const SF_SPRING_GSAP = {
  type: 'spring' as const,
  mass: 1,
  damping: 12,
  stiffness: 180,
};

/** Ergonomic re-export: an object with every token for consumers
 *  that want to `const { SF_EASE_STANDARD, ... } = SF_EASINGS`. */
export const SF_EASINGS = {
  standard: SF_EASE_STANDARD,
  emphasized: SF_EASE_EMPHASIZED,
  decelerate: SF_EASE_DECELERATE,
  accelerate: SF_EASE_ACCELERATE,
  bounce: SF_EASE_BOUNCE,
} as const;

export type EasingName = keyof typeof SF_EASINGS;
