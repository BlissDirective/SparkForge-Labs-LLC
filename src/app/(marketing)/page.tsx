// ════════════════════════════════════════════════════════════════
// LANDING PAGE — SparkForge Marketing Site
// ════════════════════════════════════════════════════════════════
// Full landing experience on the dark marketing surface (DESIGN.md §8):
// Hero (hologram over AuroraGalaxy) → playable micro-game → AI Tutor →
// Features → How It Works → CTA. One text-effect system (SplitText +
// BlurText) and one background system (AuroraGalaxy) per §7.1.

import { HeroSection } from '@/components/landing/HeroSection';
import { LandingMicroGame } from '@/components/landing/LandingMicroGame';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingAITutor } from '@/components/landing/LandingAITutor';
import { LandingCTA } from '@/components/landing/LandingCTA';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';

export default function LandingPage() {
  return (
    <>
      {/* Hero — hologram reveal over the AuroraGalaxy background */}
      <HeroSection />

      {/* "Teach Sparky to Sort" — 20-second playable classifier demo */}
      <LandingMicroGame />

      {/* AI Tutor Feature Showcase */}
      <LandingAITutor />

      {/* Feature Grid — StarBorder cards (KEEP-listed, DESIGN §7.1) */}
      <LandingFeatures />

      {/* How It Works — steps, stats, facts, skills cloud */}
      <LandingHowItWorks />

      {/* Login CTA Banner */}
      <LandingCTA />
    </>
  );
}
