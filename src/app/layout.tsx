// ════════════════════════════════════════════════════
// ROOT LAYOUT — SEO, a11y, error boundary, PWA
// Stage 10 Part 2 — REPLACES Stage 1 layout
// BUG-10F: Exo 2/Sora/Orbitron — NEVER Fredoka/Nunito
// ════════════════════════════════════════════════════

import type { Metadata, Viewport } from 'next';
import './globals.css';
import './globals-a11y.css';
import QueryProvider from '@/components/providers/QueryProvider';
import { A11yProvider } from '@/components/accessibility/A11yProvider';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
// REMOVED (D3D-1): DeviceSelectionModal — desktop-only platform, no device selection

// ── Fonts ──
// Loaded via Google Fonts CDN with preconnect for performance.
// CSS variables (--font-display, --font-body, --font-mono, --font-data)
// are set in globals.css so Tailwind fontFamily can reference them.
// TODO: Migrate to next/font/google when build environment has internet access.
// See AUDIT_REPORT WARN-001 for details.

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
    { media: '(prefers-color-scheme: light)', color: '#F0F4F8' },
  ],
};

// ── Root Layout ───────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Google Fonts — Exo 2, Sora, JetBrains Mono, Orbitron (BUG-10F) */}
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

        <A11yProvider>
          <ErrorBoundary>
            <QueryProvider>
              <OfflineBanner />
              <main id="main-content">{children}</main>
            </QueryProvider>
          </ErrorBoundary>
        </A11yProvider>

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
