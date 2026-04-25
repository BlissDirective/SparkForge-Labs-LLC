// ════════════════════════════════════════════════════
// ROOT LAYOUT — SEO, a11y, error boundary, PWA
// Stage 10 Part 2 — REPLACES Stage 1 layout
// BUG-10F: Exo 2/Sora/Orbitron — NEVER Fredoka/Nunito
// DES-06: Fonts via Google Fonts CDN (next/font/google requires
//         build-time internet, unavailable in some CI environments)
// ════════════════════════════════════════════════════

import type { Metadata, Viewport } from 'next';
import './globals.css';
import './globals-a11y.css';
import QueryProvider from '@/components/providers/QueryProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { A11yProvider } from '@/components/accessibility/A11yProvider';
import { BrightnessEffect } from '@/components/accessibility/BrightnessEffect';
import { LenisProvider } from '@/components/providers/LenisProvider';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { CookieNotice } from '@/components/ui/CookieNotice';
// REMOVED (D3D-1): DeviceSelectionModal — desktop-only platform, no device selection

// ── Fonts ──
// Loaded via Google Fonts CDN with preconnect + display=swap for performance.
// DES-07 fallback metrics defined in globals.css prevent CLS during font swap.
// CSS variables (--font-display, --font-body, --font-mono, --font-data) set in :root.

// ── SEO Metadata ──────────────────────────────────

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_URL || 'https://sparkforge.app'
  ),
  title: {
    default: 'SparkForge — Where Curiosity Meets AI',
    template: '%s | SparkForge',
  },
  description:
    'The gamified AI learning platform for kids ages 7-16. Explore 10 Labs, play 35 games, and discover the AI-powered world.',
  keywords: [
    'AI education',
    'kids learning',
    'artificial intelligence for children',
    'STEM games',
    'coding for kids',
    'machine learning education',
    'SparkForge',
    'gamified learning',
  ],
  authors: [{ name: 'BlissDirective' }],
  creator: 'BlissDirective',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_URL || 'https://sparkforge.app',
    siteName: 'SparkForge',
    title: 'SparkForge — Where Curiosity Meets AI',
    description:
      'The gamified AI learning platform for kids ages 7-16. 10 Labs, 35 games, endless discovery.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SparkForge — Where Curiosity Meets AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SparkForge — Where Curiosity Meets AI',
    description: 'The gamified AI learning platform for kids ages 7-16.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ── Viewport ──────────────────────────────────────

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0E16' },
    { media: '(prefers-color-scheme: light)', color: '#0A0E16' },
  ],
};

// ── Root Layout ───────────────────────────────────

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // UX-ENH-010 (Recommended): resolve active locale + message bundle
  // from the NEXT_LOCALE cookie (see src/i18n/request.ts).
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className="dark"
      style={{ colorScheme: 'dark' }}
      suppressHydrationWarning
    >
      <head>
        {/* Google Fonts — CDN with preconnect + display=swap */}
        {/* DES-06: next/font/google requires build-time internet (unavailable in CI).
            Using CDN <link> approach. DES-07 fallback metrics in globals.css prevent CLS. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700;800&family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* PWA Manifest */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased bg-surface-base text-white min-h-screen">
        {/* Skip link — uses existing .skip-to-content from globals.css */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>

        <NextIntlClientProvider locale={locale} messages={messages}>
        <A11yProvider>
          <ErrorBoundary>
            <QueryProvider>
              {/* UX-MED-005 (A): mirror cockpitStore.brightness to
                  --sf-brightness; read by body-level filter rule in
                  globals.css (canvas elements excluded). */}
              <BrightnessEffect />
              {/* Phase 4 §10.4: Lenis smooth scroll provider. Momentum-based
                  scrolling for all scrollable views. Respects prefers-reduced-motion. */}
              <LenisProvider>
                <OfflineBanner />
                <main id="main-content">{children}</main>
                {/* Phase 5 #7 UX-ENH: ⌘K palette. Feature-flag gated. */}
                <CommandPalette />
                {/* COPPA-PRD-G: First-visit cookie notice (informational
                    only — SparkForge uses essential cookies, no analytics
                    or trackers per /privacy#cookies). */}
                <CookieNotice />
              </LenisProvider>
            </QueryProvider>
          </ErrorBoundary>
        </A11yProvider>
        </NextIntlClientProvider>

        {/* Screen reader live region */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          id="sr-announcements"
        />
      </body>
    </html>
  );
}
