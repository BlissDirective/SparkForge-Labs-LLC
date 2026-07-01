import { Metadata } from 'next';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { SkipLink } from '@/components/shared/SkipLink';

// Marketing Layout — Public pages (landing, pricing, privacy, terms)
// Shared header (fixed, glassmorphism) + footer + aurora background

export const metadata: Metadata = {
  title: 'SparkForge — AI Learning Lab for Kids',
  description:
    'A gamified AI learning platform for children ages 7-16. 11 labs, 42 games, built for curious minds.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-deep relative" data-surface="dark">
      {/* UX-HIGH-001: WCAG 2.4.1 skip-link. Lands on the <main> below. */}
      <SkipLink targetId="marketing-main" />
      {/* Aurora background — subtle animated gradient behind all marketing pages.
          Audit P3/A — promote to its own compositor layer via
          will-change: transform so the heavy blur filters are rasterized
          once and translated/composited on subsequent frames instead of
          being re-rasterized when ScrollJourney's GSAP yPercent updates
          the aurora ref. The same hint applies inline on the ScrollJourney
          parallax layers it owns. */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ willChange: 'transform' }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-spark-blue/[0.03] via-transparent to-spark-purple/[0.04]" />
        <div className="absolute top-0 left-1/4 w-[min(800px,90vw)] h-[min(600px,70vw)] rounded-full bg-spark-blue/[0.02] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[min(600px,80vw)] h-[min(500px,60vw)] rounded-full bg-spark-purple/[0.03] blur-[100px]" />
      </div>

      {/* Fixed header */}
      <MarketingHeader />

      {/* Page content — z-10 above aurora, pt-16 clears fixed header */}
      <main id="marketing-main" tabIndex={-1} className="relative z-10 focus:outline-none">
        {children}
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <MarketingFooter />
      </div>
    </div>
  );
}
