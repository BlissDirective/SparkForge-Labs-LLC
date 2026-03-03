'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { CelebrationOverlay } from '@/components/shared/CelebrationOverlay';
import { ContinueBanner } from '@/components/shared/ContinueBanner';
import { useUIStore } from '@/stores/uiStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSessionTracker } from '@/hooks/useSessionTracker';
import { useStationMode } from '@/hooks/useStationMode';
import { motion, AnimatePresence } from 'framer-motion';
import { Suspense, lazy } from 'react';

// Dashboard Layout — Laboratory Control Station Shell
// v3 Decision 2.1: StationFrame canvas mounted on ALL dashboard pages
// v3 Decision 2.5: Edge-to-edge, frame as border overlay
// v2 BUG-4: useMediaQuery instead of window.innerWidth (SSR-safe)
// v2 NEW-2A: useSessionTracker auto-tracks play sessions

// v3: Lazy-load StationFrame (heavy R3F component) — delivered in Part 3B
const StationFrame = lazy(() =>
  import('@/components/3d/StationFrame').then((m) => ({
    default: m.StationFrame,
  }))
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUIStore();
  const isDesktop = useMediaQuery('(min-width: 768px)'); // v2 BUG-4 fix
  const stationMode = useStationMode();

  // v2 [NEW-2A]: Auto-track play sessions
  useSessionTracker();

  return (
    <div className="min-h-screen bg-surface-deep relative overflow-hidden">
      {/* v3 [Decision 2.1]: Station Frame — persistent 3D canvas layer */}
      <Suspense fallback={null}>
        <StationFrame
          mode={stationMode.mode}
          ledColor={stationMode.ledColor}
          bgIntensity={stationMode.bgIntensity}
          particleCount={stationMode.particleCount}
          frameGlow={stationMode.frameGlow}
          frameDimmed={stationMode.frameDimmed}
        />
      </Suspense>

      {/* v3: Scanline overlay (Decision 2.3 — toggleable via accessibility) */}
      <div className="scanline-overlay" aria-hidden="true" />

      {/* v3: Vignette overlay for screen depth */}
      <div className="vignette-overlay" aria-hidden="true" />

      {/* z-index 10: HTML content layer */}
      <Sidebar />
      <CelebrationOverlay />

      <motion.main
        className="min-h-screen pb-20 md:pb-0 relative z-10"
        animate={{
          marginLeft: isDesktop ? (sidebarOpen ? 220 : 72) : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6">
          {/* v2 [NEW-3D]: ContinueBanner */}
          <ContinueBanner />

          {/* Page content with transition */}
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>
    </div>
  );
}
