/**
 * Hero v3 — Standalone visual tuning route (/dev/hero-v3)
 *
 * Shows the 4 v3 beat components (Beats 1-4) overlaid in a single
 * BrandingShowcase canvas, driven by a master timeline scrubber.
 * Replaces the action plan's "feature flag in HeroAnimation.tsx"
 * approach (action plan §10 5b.4) per user no-gating mandate.
 *
 * The live homepage hero (/) stays on v2 until Phase 5c integrates
 * all 8 v3 beats wholesale.
 *
 * Reachable on every environment per user mandate (no NODE_ENV gate).
 */

import { Metadata } from 'next';
import { HeroV3Client } from './client';

export const metadata: Metadata = {
  title: 'Hero v3 · Dev Lab',
  description: 'Hero v3 beat-by-beat visual tuning + Theatre.js studio',
  robots: { index: false, follow: false },
};

export default function HeroV3Page() {
  return <HeroV3Client />;
}
