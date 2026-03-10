// ════════════════════════════════════════════════════
// LANDING PAGE — v3-FINAL ScrollJourney Integration
// ════════════════════════════════════════════════════
// Decision 8.1-8.5: Replaces the v2/v3-draft landing page with
// the full 5-act scroll-driven station reveal.
//
// v3 CHANGES over v2:
// [v3] Decision 8.1: Full ScrollJourney with 5-act GSAP scroll
// [v3] Decision 8.1: CrystalHero R3F (desktop) / CSS gradient (mobile)
// [v3] Decision 8.2: StationPreview with CSS glow in Act 4
// [v3] Decision 8.3: CSS holographic FeatureShowcase in Act 3
// [v3] Decision 8.4: CTA links to /pricing (separate route)
// [v3] Decision 8.5: Mobile CSS-only (no 3D)
// [v3] 3-layer parallax depth (aurora 0.3x, hexes 0.6x, content 1x)
//
// v2 FEATURES PRESERVED:
// [v2] Lab grid (now LabDiscoveryRing in Act 2)
// [v2] Feature cards (now FeatureShowcase in Act 3)
// [v2] Hero section with title + tagline + CTA
// [v2] Footer links (preserved in marketing layout)
//
// This file delegates to ScrollJourney.tsx for all content.
// The marketing layout (layout.tsx) provides the wrapper.
// ════════════════════════════════════════════════════

import { Metadata } from 'next';
import { ScrollJourney } from '@/components/landing/ScrollJourney';

// Comprehensive metadata with OpenGraph + Twitter cards
export const metadata: Metadata = {
  title: 'SparkForge — AI Learning Lab for Kids Ages 7-16',
  description:
    'A gamified AI learning platform for children ages 7-16. 10 interactive labs, 35+ hands-on games, and adaptive content that grows with your child. Start free today.',
  keywords: [
    'AI learning',
    'kids coding',
    'STEM education',
    'gamified learning',
    'artificial intelligence for kids',
    'interactive AI games',
  ],
  openGraph: {
    title: 'SparkForge — AI Learning Lab for Kids',
    description:
      '10 interactive labs. 35+ hands-on games. Built for ages 7-16. Explore AI through play.',
    type: 'website',
    siteName: 'SparkForge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SparkForge — AI Learning Lab for Kids',
    description:
      '10 interactive labs. 35+ hands-on games. Built for ages 7-16.',
  },
};

export default function LandingPage() {
  return (
    <>
      {/* Noscript fallback for users with JavaScript disabled */}
      <noscript>
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#0D1117',
          color: '#ffffff',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>SparkForge</h1>
          <p style={{ opacity: 0.6, marginBottom: '2rem', maxWidth: '400px' }}>
            The AI Learning Lab for Curious Minds. 10 interactive labs, 35+ games, ages 7-16.
            Enable JavaScript for the full interactive experience.
          </p>
          <a
            href="/signup"
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#3B82F6',
              color: '#ffffff',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            Start Free
          </a>
        </div>
      </noscript>

      {/* v3-FINAL: 5-act GSAP scroll journey with parallax */}
      <ScrollJourney />
    </>
  );
}
