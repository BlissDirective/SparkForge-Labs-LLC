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
import { NetworkMicroDemo } from '@/components/landing/NetworkMicroDemo';
import { MoltenThreadSection } from '@/components/landing/MoltenThread';
import { FEATURE_FLAGS } from '@/config/feature-flags';

// Forge F6: hero + micro-demo + thread gate. Flag-off restores the
// hologram hero, the sort micro-game, and the plain section stack.
const FORGE_HERO_ON = FEATURE_FLAGS.FORGE_THEME && FEATURE_FLAGS.FORGE_HERO;

export default function LandingPage() {
  const sections = (
    <>
      {/* Playable demo under the hero */}
      {FORGE_HERO_ON ? <NetworkMicroDemo /> : <LandingMicroGame />}

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

  return (
    <>
      {/* Hero — Lightfall forge (F6) or hologram over AuroraGalaxy */}
      <HeroSection />

      {/* Forge F6: the Molten Thread seams the sections together */}
      {FORGE_HERO_ON ? <MoltenThreadSection>{sections}</MoltenThreadSection> : sections}
    </>
  );
}
