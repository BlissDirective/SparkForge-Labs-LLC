'use client';

// ════════════════════════════════════════════════════════════════
// Dashboard Layout — Full 3D Cockpit (UI Design Change)
// ════════════════════════════════════════════════════════════════
// UI-1: Everything behind auth renders in 3D. Zero HTML dashboard UI.
// Pages are thin scene descriptors — they call useCockpitScene() to
// set cockpit mode + feed data to cockpitUIStore. All visible content
// renders inside CockpitCanvas via CockpitUILayer quadrants.
//
// Retained HTML:
//   - Sidebar (sr-only, WCAG accessibility nav)
//   - DemoSessionBanner / DemoGuard (auth infrastructure)
//   - GuideChatPanel (HTML overlay for text input — uikit migration Phase 3)
//   - ARIA live region for screen reader announcements

import { useEffect, useRef } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSceneStore } from '@/stores/sceneStore';
import { useSessionTracker } from '@/hooks/useSessionTracker';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { useStationMode } from '@/hooks/useStationMode';
import { useCockpitAudio } from '@/hooks/useCockpitAudio';
import { useCockpitScene } from '@/hooks/useCockpitScene';
import { useCockpitUIStore, modeToCenterContent } from '@/stores/cockpitUIStore';
import dynamic from 'next/dynamic';
import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';
import { DemoGuard } from '@/components/auth/DemoGuard';
import { AdminNavDock } from '@/components/admin/AdminNavDock';
import { useGuideContext } from '@/hooks/useGuideContext';

// Phase 5: Guide chat panel (HTML overlay — retained for text input compat)
const GuideChatPanel = dynamic(
  () => import('@/components/ui/GuideChatPanel'),
  { ssr: false, loading: () => null }
);

// StationFrame — cockpit panoramic canvas (wraps CockpitCanvas)
const StationFrame = dynamic(
  () =>
    import('@/components/3d/StationFrame').then((m) => m.StationFrame),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-surface-deep" /> }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Mode systems ──────────────────────────────────
  // useStationMode: legacy system (drives StationFrame props)
  // useCockpitScene: new unified system (drives cockpitStore.activeMode + broadcasts)
  // Both coexist during migration. useCockpitScene is authoritative for mode presets.
  const stationMode = useStationMode();
  const scene = useCockpitScene();
  const { onModeChange } = useCockpitAudio();
  const prevModeRef = useRef(stationMode.mode);

  // Sync center content key from cockpit scene mode
  const setCenterContent = useCockpitUIStore((s) => s.setCenterContent);
  useEffect(() => {
    setCenterContent(modeToCenterContent(scene.mode));
  }, [scene.mode, setCenterContent]);

  // Hero animation initialization — first-time visitors see the 8-phase cinematic
  const setHeroActive = useSceneStore((s) => s.setHeroActive);
  useEffect(() => {
    const skipIntro = typeof window !== 'undefined' && localStorage.getItem('skipIntroAnimation');
    if (!skipIntro) {
      setHeroActive();
    }
  }, [setHeroActive]);

  // Auto-track play sessions
  useSessionTracker();

  // Auto-detect guide context from route/scene
  useGuideContext();

  // Cockpit audio mode transitions (legacy bridge)
  useEffect(() => {
    if (stationMode.mode !== prevModeRef.current) {
      onModeChange(stationMode.mode);
      prevModeRef.current = stationMode.mode;
    }
  }, [stationMode.mode, onModeChange]);

  return (
    <AuthProvider>
    <DemoGuard>
      <DemoSessionBanner />
      <div className="min-h-screen bg-surface-deep relative overflow-hidden">
        {/* 3D Cockpit Canvas — the ENTIRE dashboard UI */}
        <StationFrame
          mode={stationMode.mode}
          ledColor={scene.resolvedLedColor}
          bgIntensity={stationMode.bgIntensity}
          frameDimmed={stationMode.frameDimmed}
          bloomIntensity={scene.canvasProps.bloomIntensity}
          bloomThreshold={scene.canvasProps.bloomThreshold}
          bloomSmoothing={scene.canvasProps.bloomSmoothing}
          vignetteDarkness={scene.canvasProps.vignetteDarkness}
          vignetteOffset={scene.canvasProps.vignetteOffset}
          cameraFov={scene.canvasProps.cameraFov}
          barrelDistortion={scene.canvasProps.barrelDistortion}
          hudOpacity={scene.canvasProps.hudOpacity}
          hudRotationSpeed={scene.canvasProps.hudRotationSpeed}
          hudPulseIntensity={scene.canvasProps.hudPulseIntensity}
          sidePanelOpacity={scene.canvasProps.sidePanelOpacity}
          sidePanelLeftContent={stationMode.sidePanelLeftContent}
          sidePanelRightContent={stationMode.sidePanelRightContent}
          statusBarOpacity={scene.canvasProps.statusBarOpacity}
          panelCurvature={scene.canvasProps.panelCurvature}
          panelOpacity={scene.canvasProps.panelOpacity}
        />

        {/* sr-only navigation for WCAG accessibility */}
        <Sidebar />

        {/* ARIA live region — screen reader announcements for 3D state changes */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" id="cockpit-announcer" />

        {/* Guide chat panel — HTML overlay for text input (Phase 3: migrate to uikit) */}
        <GuideChatPanel />

        {/* v3 Gap 1/3: Admin tools dock — only rendered when parent.is_admin.
            Floats bottom-left so it coexists with TrialBanner/DemoBanner at top
            and the parent UsageDashboard at top-right. */}
        <AdminNavDock />

        {/* Page children — thin scene descriptors that set mode + feed data.
            These render NO visible HTML. They only call hooks. */}
        {children}
      </div>
    </DemoGuard>
    </AuthProvider>
  );
}
