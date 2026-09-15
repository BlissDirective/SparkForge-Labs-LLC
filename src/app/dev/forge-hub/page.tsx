/**
 * Forge Hub room shell — /dev/forge-hub (W1 + W2 screen kit + Director)
 *
 * Public like other /dev/* routes (middleware isDevRoute).
 * Server-rendered heading is the LCP element; the R3F stage loads
 * after hydration. Always on — not gated by FORGE_HUB (W10).
 * W2: layout registry, projection hook, HoloPanel reading plate.
 * W2-02: Director GSAP timelines on MOTION_BIBLE ids (dev HUD).
 * W2-03: ForgeRouteMode + EscapeFlat + ToastRail (same sceneStore).
 * W2 Theatre: first-visit-ignition JSON; ?ignition=1 auto-plays on this
 * lab. Studio: ?studio=1 in development only. Production routes gated.
 * W2-05: mode switcher + ?calibrate=1 + transition scrubber.
 * W2-07: live HoloC login form + P2 morph cycle smoke.
 * W2-10: createRenderer cascade (WebGPU → WebGL2 → poster).
 */

import { Suspense } from 'react';
import { type Metadata } from 'next';
import { ForgeHubClient } from './client';

export const metadata: Metadata = {
  title: 'Forge Hub · Dev Lab',
  description:
    'W2 screen kit + Director Theatre ignition on the room shell',
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
        <h1
          data-forge-lcp="html"
          className="mt-2 font-display text-4xl font-bold leading-tight text-white"
        >
          Forge Hub
        </h1>
        <p className="mt-2 max-w-md text-sm text-white/70">
          Screen kit on the room shell: HoloL / HoloC / HoloR reading
          plates. HoloC carries the live welcome login form. Director HUD
          drives emit-burst, login-success-hubsplit, and
          first-visit-ignition. Mode switcher, P2 morph cycle,
          ?calibrate=1 slot outlines, and the transition scrubber bind
          the live forge slice. EscapeFlat and ToastRail sit outside
          transformed wrappers. Kid-visible ignition is this lab only
          (?ignition=1); production `/` `/login` stay gated.
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
