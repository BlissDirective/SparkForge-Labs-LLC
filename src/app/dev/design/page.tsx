/**
 * Design-system showcase route — /dev/design
 *
 * Design-system QA — DESIGN.md §7.1 (owner-approved). Demos all fourteen
 * new bits components: batch 1 (SplitText, BlurText, Orb, GlareHover,
 * CoolMode, AuroraGalaxy, LightRays) and batch 2 (ElectricBorder,
 * ConfettiBurst, AnimatedBeam, Marquee, CardSwap, MagicBento, StickerPeel).
 *
 * /dev/* routes are public on every environment (middleware).
 */

import { Metadata } from 'next';
import { DesignDevClient } from './client';

export const metadata: Metadata = {
  title: 'Design System · Dev Lab',
  description: 'Design-system QA — DESIGN.md §7.1',
  robots: { index: false, follow: false },
};

export default function DesignDevPage() {
  return <DesignDevClient />;
}
