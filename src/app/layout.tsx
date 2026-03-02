import type { Metadata, Viewport } from 'next';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0E16',
};

export const metadata: Metadata = {
  title: 'SparkForge — Where Curiosity Meets AI',
  description: 'The gamified AI learning platform for kids ages 7-16. 10 labs, 35 games, endless discovery.',
  keywords: ['AI', 'kids', 'learning', 'games', 'STEM', 'machine learning', 'education', 'gamified'],
  openGraph: {
    title: 'SparkForge — Where Curiosity Meets AI',
    description: 'The gamified AI learning platform for kids ages 7-16.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700;800&family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&family=Orbitron:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-surface-base text-white min-h-screen">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-neon-blue focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to main content
        </a>
        <QueryProvider>
          <div id="main-content">
            {children}
          </div>
        </QueryProvider>
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="sr-announcements" />
      </body>
    </html>
  );
}
