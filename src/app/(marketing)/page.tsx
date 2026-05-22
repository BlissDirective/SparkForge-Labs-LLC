// ════════════════════════════════════════════════════════════════
// LANDING PAGE — SparkForge Marketing Site (Phase 5)
// ════════════════════════════════════════════════════════════════
// Enhanced with AI Tutor feature showcase and highlighted quotes
// using React Bits text effects.

import { HeroSection } from '@/components/landing/HeroSection';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingAITutor } from '@/components/landing/LandingAITutor';
import { LandingCTA } from '@/components/landing/LandingCTA';

export default function LandingPage() {
  return (
    <>
      {/* Hero with FloatingLines */}
      <HeroSection />

      {/* AI Tutor Feature Showcase */}
      <LandingAITutor />

      {/* Feature Grid */}
      <LandingFeatures />

      {/* Login CTA Banner */}
      <LandingCTA />

      {/* How It Works placeholder — Phase 6 */}
      <section
        id="how-it-works"
        className="py-24 px-4"
        style={{ backgroundColor: '#FFFFFF' }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
          >
            How It Works
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#8C94AC' }}>
            Coming in Phase 6 — Interactive game preview, parent testimonials,
            pricing plans, and more.
          </p>
        </div>
      </section>
    </>
  );
}
