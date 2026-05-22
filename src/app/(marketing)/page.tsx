// ════════════════════════════════════════════════════════════════
// LANDING PAGE — SparkForge Marketing Site (Phase 1)
// ════════════════════════════════════════════════════════════════
// New HTML-first landing page with React Bits FloatingLines hero.
// Replaces the 3D BrandHero3D component.

import { HeroSection } from '@/components/landing/HeroSection';

export default function LandingPage() {
  return (
    <>
      <HeroSection />

      {/* Placeholder sections for future phases */}
      <section
        id="how-it-works"
        className="py-24 px-4"
        style={{ backgroundColor: 'rgb(var(--sf-surface) / 1)' }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold mb-6"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'rgb(var(--sf-text-primary) / 1)',
            }}
          >
            How It Works
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}
          >
            Coming in Phase 6 — Feature showcase, game preview, testimonials,
            and pricing sections.
          </p>
        </div>
      </section>
    </>
  );
}
