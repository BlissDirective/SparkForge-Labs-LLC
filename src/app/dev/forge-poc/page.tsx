/**
 * /dev/forge-poc — Live-object forge stage proof-of-concept.
 *
 * Explores the "five live rendered objects on an empty room" direction
 * (owner 2026-09): three glass screens + desk + SF emitter as real R3F
 * geometry, morphing together off ONE `stage` clock. No baked holograms
 * to drift out of alignment — toggle "Show baked-frame problem" to see
 * the drift this approach removes.
 *
 * Stand-in procedural geometry only; the authored Blender/Spline GLBs
 * replace it per docs/forge-hub/FORGE_STAGE_PIPELINE.md. Server heading
 * is the LCP element; the R3F stage loads after hydration (ssr:false).
 * Dev-only (middleware isDevRoute); not wired to forgeStore/Director yet.
 */

import { Suspense } from 'react';
import { type Metadata } from 'next';
import { ForgePocClient } from '@/components/forge-hub/poc/ForgePocClient';

export const metadata: Metadata = {
  title: 'Forge Stage POC · Dev Lab',
  description:
    'Live-object forge stage: five rendered objects morphing on one clock over an empty room.',
  robots: { index: false, follow: false },
};

export default function ForgePocDevPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#1a120d] text-white">
      <header className="pointer-events-none absolute left-4 top-4 z-10 max-w-[min(46ch,72vw)]">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-cyan-200/80">
          SparkForge · /dev/forge-poc
        </p>
        <h1
          data-forge-lcp="html"
          className="mt-1.5 font-display text-2xl font-bold leading-tight text-white"
        >
          Hologram Forge Stage
        </h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-cyan-50/70">
          Five live rendered objects — three screens, the desk, the SF
          emitter — on an empty room. One clock morphs them together. No
          baked holograms to drift out of alignment. Architecture proof —
          not final art.
        </p>
      </header>
      <Suspense fallback={<div className="min-h-screen" />}>
        <ForgePocClient />
      </Suspense>
    </main>
  );
}
