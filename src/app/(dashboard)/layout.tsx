'use client';

import { useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { CelebrationOverlay } from '@/components/shared/CelebrationOverlay';
import { ContinueBanner } from '@/components/shared/ContinueBanner';
import { useUIStore } from '@/stores/uiStore';
// REMOVED (D3D-1): useMediaQuery — desktop-only platform
import { useSessionTracker } from '@/hooks/useSessionTracker';
import { useStationMode } from '@/hooks/useStationMode';
import { useCockpitAudio } from '@/hooks/useCockpitAudio';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';
import { DemoGuard } from '@/components/auth/DemoGuard';
import { useGuideContext } from '@/hooks/useGuideContext';

// Phase 5: Guide chat panel (HTML overlay, not R3F — persists across all views)
const GuideChatPanel = dynamic(
  () => import('@/components/ui/GuideChatPanel'),
  { ssr: false }
);

// Dashboard Layout — Laboratory Control Station Shell
// v3 Decision 2.1: StationFrame canvas mounted on ALL dashboard pages
// v3 Decision 2.5: Edge-to-edge, frame as border overlay
// CPA v1.0: Cockpit Panoramic Architecture — curved panels, HUD, side panels
// v2 BUG-4: useMediaQuery instead of window.innerWidth (SSR-safe)
// v2 NEW-2A: useSessionTracker auto-tracks play sessions

// v3: Dynamic import StationFrame with ssr: false (R3F requires DOM)
const StationFrame = dynamic(
  () =>
    import('@/components/3d/StationFrame').then((m) => m.StationFrame),
  { ssr: false }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUIStore();
  const isDesktop = true; // D3D-1: Desktop-only platform — always desktop
  const stationMode = useStationMode();
  const { onModeChange } = useCockpitAudio();
  const prevModeRef = useRef(stationMode.mode);

  // v2 [NEW-2A]: Auto-track play sessions
  useSessionTracker();

  // Phase 5: Auto-detect guide context from route/scene
  useGuideContext();

  // CPA v1.0: Trigger cockpit audio on mode transitions
  useEffect(() => {
    if (stationMode.mode !== prevModeRef.current) {
      onModeChange(stationMode.mode);
      prevModeRef.current = stationMode.mode;
    }
  }, [stationMode.mode, onModeChange]);

  return (
    <DemoGuard>
      <DemoSessionBanner />
      <div className="min-h-screen bg-surface-deep relative overflow-hidden">
      {/* v3 [Decision 2.1] + CPA v1.0: Station Frame — cockpit panoramic canvas */}
      <StationFrame
        mode={stationMode.mode}
        ledColor={stationMode.ledColor}
        bgIntensity={stationMode.bgIntensity}
        particleCount={stationMode.particleCount}
        frameGlow={stationMode.frameGlow}
        frameDimmed={stationMode.frameDimmed}
        // CPA v1.0 props
        bloomIntensity={stationMode.bloomIntensity}
        bloomThreshold={stationMode.bloomThreshold}
        bloomSmoothing={stationMode.bloomSmoothing}
        vignetteDarkness={stationMode.vignetteDarkness}
        vignetteOffset={stationMode.vignetteOffset}
        cameraFov={stationMode.cameraFov}
        barrelDistortion={stationMode.barrelDistortion}
        hudOpacity={stationMode.hudOpacity}
        hudRotationSpeed={stationMode.hudRotationSpeed}
        hudPulseIntensity={stationMode.hudPulseIntensity}
        sidePanelOpacity={stationMode.sidePanelOpacity}
        sidePanelLeftContent={stationMode.sidePanelLeftContent}
        sidePanelRightContent={stationMode.sidePanelRightContent}
        statusBarOpacity={stationMode.statusBarOpacity}
        panelCurvature={stationMode.panelCurvature}
        panelOpacity={stationMode.panelOpacity}
      />

      {/* v3: Scanline overlay (Decision 2.3 — toggleable via accessibility) */}
      <div className="scanline-overlay" aria-hidden="true" />

      {/* v3: Vignette overlay for screen depth */}
      <div className="vignette-overlay" aria-hidden="true" />

      {/* z-index 10: HTML content layer */}
      <Sidebar />
      <CelebrationOverlay />

      {/* Phase 5: AI Guide Avatar chat panel (persistent across all dashboard pages) */}
      <GuideChatPanel />

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
    </DemoGuard>
  );
}
