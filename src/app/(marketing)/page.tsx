// ════════════════════════════════════════════════════════════════
// LANDING PAGE — SparkForge Marketing Site
// ════════════════════════════════════════════════════════════════
// Full landing experience: Hero, AI Tutor, Features, How It Works,
// CTA. Enhanced with React Bits throughout for visual depth.

import { HeroSection } from '@/components/landing/HeroSection';
import { LandingMicroGame } from '@/components/landing/LandingMicroGame';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingAITutor } from '@/components/landing/LandingAITutor';
import { LandingCTA } from '@/components/landing/LandingCTA';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';

export default function LandingPage() {
  return (
    <>
      {/* Hero with FloatingLines interactive background */}
      <HeroSection />

      {/* "Teach Sparky to Sort" — 20-second playable classifier demo */}
      <LandingMicroGame />

      {/* AI Tutor Feature Showcase */}
      <LandingAITutor />

      {/* Feature Grid with StarBorder cards */}
      <LandingFeatures />

      {/* How It Works — steps, stats, facts, skills cloud */}
      <LandingHowItWorks />

      {/* Login CTA Banner */}
      <LandingCTA />
    </>
  );
}
