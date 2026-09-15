/**
 * Forge Hub room shell — /dev/forge-hub (W1-01 + W1-02 + W1-03)
 *
 * Public like other /dev/* routes (middleware isDevRoute).
 * Server-rendered heading is the LCP element; the R3F stage loads
 * after hydration. Always on — not gated by FORGE_HUB (W10).
 * W1-03: three lock-pose glass slabs (edge / scanline / breathe).
 */

import { Suspense } from 'react';
import { type Metadata } from 'next';
import { ForgeHubClient } from './client';

export const metadata: Metadata = {
  title: 'Forge Hub · Dev Lab',
  description:
    'W1-03 glass slabs on the room shell: lock-pose HoloL / HoloC / HoloR',
  robots: { index: false, follow: false },
};

export default async function ForgeHubDevPage({
  searchParams,
}: {
  searchParams: Promise<{ pose?: string }>;
}) {
  const { pose } = await searchParams;
  const poseLock = pose === 'lock';

  return (
    <main className="relative min-h-screen bg-[#0b1218] text-white">
      <header
        className={
          poseLock
            ? 'sr-only'
            : 'pointer-events-none absolute left-0 top-0 z-10 max-w-xl p-6'
        }
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-200/80">
          SparkForge · /dev/forge-hub
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-white">
          Forge Hub
        </h1>
        <p className="mt-2 max-w-md text-sm text-white/70">
          Room shell with CorePortal and lock-pose glass slabs (W1-03).
          Sparky and the Director land in later tasks.
        </p>
      </header>
      <Suspense
        fallback={
          <div
            data-testid="forge-hub-shell"
            data-forge-stage="pending"
            className="min-h-screen"
          />
        }
      >
        <ForgeHubClient />
      </Suspense>
    </main>
  );
}
