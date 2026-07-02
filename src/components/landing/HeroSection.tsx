'use client';

import { HeroContent } from './HeroContent';
import AuroraGalaxy from '@/components/bits/AuroraGalaxy';

export function HeroSection() {
  return (
    <section
      className="relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#0A0F1E' }}
    >
      {/* Background Layer — AuroraGalaxy (DESIGN.md §7.1 curation: replaces
          FloatingLines). Pure CSS/DOM, no WebGL — reduced motion handled
          inside the component (blobs go static). */}
      <div className="absolute inset-0 z-0">
        <AuroraGalaxy intensity={0.75} />
      </div>

      {/* Readability scrim — the animated light streaks can pass directly
          behind the hologram and wash it out (P1-3). A soft radial
          darkening behind the content keeps contrast without dimming
          the whole animation. */}
      <div
        className="absolute inset-0 z-[5] pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(10,15,30,0.72) 0%, rgba(10,15,30,0.35) 55%, rgba(10,15,30,0) 100%)',
        }}
      />

      {/* Content Overlay */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        <HeroContent />
      </div>
    </section>
  );
}
