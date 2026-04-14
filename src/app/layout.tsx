// ════════════════════════════════════════════════════
// ROOT LAYOUT — SEO, a11y, error boundary, PWA
// Stage 10 Part 2 — REPLACES Stage 1 layout
// BUG-10F: Exo 2/Sora/Orbitron — NEVER Fredoka/Nunito
// DES-06: Self-hosted fonts via next/font/google (build-time download)
// ════════════════════════════════════════════════════

import type { Metadata, Viewport } from 'next';
import { Exo_2, Sora, JetBrains_Mono, Orbitron } from 'next/font/google';
import './globals.css';
import './globals-a11y.css';
import QueryProvider from '@/components/providers/QueryProvider';
import { A11yProvider } from '@/components/accessibility/A11yProvider';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
// REMOVED (D3D-1): DeviceSelectionModal — desktop-only platform, no device selection

// ── Fonts (DES-06: self-hosted via next/font/google) ──
// next/font/google downloads font files at build time and serves them
// from the same origin — zero external requests, no privacy exposure.
// CSS variables (--font-display, --font-body, --font-mono, --font-data)
// are injected via the `variable` option and consumed by Tailwind fontFamily.
const exo2 = Exo_2({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
});
const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '700'],
});
const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-data',
  weight: ['400', '500', '600', '700'],
});

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* DES-06: Fonts self-hosted via next/font/google — no external <link> tags needed */}
        {/* PWA Manifest */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${exo2.variable} ${sora.variable} ${jetbrainsMono.variable} ${orbitron.variable} font-body antialiased bg-surface-base text-white min-h-screen`}>
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
