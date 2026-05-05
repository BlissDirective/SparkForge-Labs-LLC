// ════════════════════════════════════════════════════
// LANDING PAGE — v4 Cosmic Theme Redesign
// ════════════════════════════════════════════════════
// A visually striking homepage combining:
// - Apple-inspired clean, minimal layouts
// - Colorful futuristic spaceship control panel aesthetics
// - Cosmic space theme with nebulas and star fields
//
// Features:
// - BrandHeroSlot: Dichroic SparkForge wordmark (Core/Preserve)
// - Cosmic background with animated star field
// - Labs discovery grid with glass-morphism cards
// - Feature highlights with gradient accents
// - Stats section with animated counters
// - Final CTA with cosmic styling
//
// Color palette follows sparkforge-tokens.css lab colors.
// ════════════════════════════════════════════════════

import { Metadata } from 'next';
import { CosmicHomepage } from '@/components/landing/CosmicHomepage';

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SparkForge — AI Learning Lab for kids',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SparkForge — AI Learning Lab for Kids',
    description:
      '10 interactive labs. 35+ hands-on games. Built for ages 7-16.',
    images: ['/og-image.png'],
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

      {/* v4: Cosmic Theme Homepage */}
      <CosmicHomepage />
    </>
  );
}
