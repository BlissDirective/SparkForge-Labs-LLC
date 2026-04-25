'use client';

// ════════════════════════════════════════════════════════════════
// Dashboard Layout — Full 3D Cockpit (UI Design Change)
// ════════════════════════════════════════════════════════════════
// UI-1: Everything behind auth renders in 3D. Zero HTML dashboard UI.
// Pages are thin scene descriptors — they call useCockpitScene() to
// set cockpit mode + feed data to cockpitStore.centerContent (merged
// from cockpitUIStore in Phase 3 Part 2 R1). All visible content
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
// Phase 2 audit fix (Section 3.5) + P2 §3.5 (Apr 21 2026):
// Unified celebration state flow. Single owner = uiStore.showCelebration.
// Two legitimate dismiss callers:
//   1. useCelebration3D — fires after CELEBRATION_TIERS[tier].durationMs
//      (timer-based; mounted here at dashboard layout).
//   2. CelebrationOverlay — fires on user action (click, Escape, outside-click
//      via FocusTrap onDeactivate).
// dismissCelebration() is idempotent — back-to-back calls are safe.
// cockpitStore.ceremonyQueue was removed (was dead code).
import { useCelebration3D } from '@/hooks/useCelebration3D';
// Phase 5 O.4-MAX (§6.6): Atomic hero→cockpit transition gate. Fires
// sceneStore.completeHero() only when BOTH heroPhase AND cockpitReady
// are set, eliminating the brief "interactive cockpit with hero still
// visible" race on fast machines and skip-intro paths.
import { useAtomicHeroToCockpit } from '@/hooks/useIsFullyReady';
import { useCockpitStore, modeToCenterContent } from '@/stores/cockpitStore';
import dynamic from 'next/dynamic';
import { DemoSessionBanner } from '@/components/auth/DemoSessionBanner';
import { DemoGuard } from '@/components/auth/DemoGuard';
import { EmailVerifyBanner } from '@/components/auth/EmailVerifyBanner';
import { SkipLink } from '@/components/shared/SkipLink';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { AdminNavDock } from '@/components/admin/AdminNavDock';
import { useGuideContext } from '@/hooks/useGuideContext';
import { useContextualHints } from '@/hooks/useContextualHints';
import { A11yAnnouncer } from '@/components/shared/A11yAnnouncer';
import { MemoryMonitor } from '@/components/3d/dev/MemoryMonitor';
import { TutorialAnchors } from '@/components/onboarding/TutorialAnchors';
import { CockpitHelpButton } from '@/components/onboarding/CockpitHelpButton';
// DB-ENH-002 (Recommended): Realtime progress + XP sync for all
// children owned by the current parent. Invalidates React Query
// caches on Supabase row-level changes — zero polling.
import { RealtimeChildrenBridge } from '@/components/providers/RealtimeChildrenBridge';

// Phase 5: Guide chat panel (HTML overlay — retained for text input compat)
const GuideChatPanel = dynamic(
  () => import('@/components/ui/GuideChatPanel'),
  { ssr: false, loading: () => null }
);

// UX-ENH-006 (Max): Inline context-hint bubble. Small HTML overlay
// that shows a one-sentence nudge when the child stalls.
const GuideHintBubble = dynamic(
  () => import('@/components/ui/GuideHintBubble'),
  { ssr: false, loading: () => null }
);

// T11 UX-MED-003 (Opt A): Cockpit tutorial (react-joyride). Dynamic
// import keeps joyride's ~70 kB payload out of the initial bundle;
// it only loads when the dashboard mounts.
const CockpitTutorial = dynamic(
  () => import('@/components/onboarding/CockpitTutorial').then((m) => m.CockpitTutorial),
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
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const prevModeRef = useRef(stationMode.mode);

  // Sync center content key from cockpit scene mode
  const setCenterContent = useCockpitStore((s) => s.setCenterContent);
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

  // Phase 2 + P2 §3.5: Celebration 3D orchestrator.
  // Watches uiStore.showCelebration, switches cockpit mode, shows XP popups,
  // broadcasts celebration-start/end, and dismisses after
  // CELEBRATION_TIERS[tier].durationMs. CelebrationOverlay is the other
  // legitimate dismiss caller (user action). dismissCelebration is
  // idempotent, so back-to-back calls are safe. CeremonyFXBridge does
  // NOT dismiss — it reacts only.
  useCelebration3D();

  // Phase 5 O.4-MAX (§6.6): Fires sceneStore.completeHero() atomically
  // once heroPhase=complete AND cockpitReady=true. Eliminates the fast-
  // machine race where cockpit was interactive while hero still visible.
  useAtomicHeroToCockpit();

  // Auto-detect guide context from route/scene
  useGuideContext();
  // UX-ENH-006 (Max): Stall detector + /api/ai/guide call bridge.
  // Fires a one-sentence inline hint when the child stalls on a lab
  // or game for ~15s. Dedup'd by (context, labId, gameId).
  useContextualHints();

  // Cockpit audio mode transitions (legacy bridge)
  useEffect(() => {
    if (stationMode.mode !== prevModeRef.current) {
      onModeChange(stationMode.mode);
      // INT-4: Route-to-scene mode broadcasting — cockpit reacts to every navigation
      broadcast({
        type: 'page-navigate',
        source: 'route-change',
        label: stationMode.mode,
        color: stationMode.ledColor,
      });
      prevModeRef.current = stationMode.mode;
    }
  }, [stationMode.mode, onModeChange, broadcast, stationMode.ledColor]);

  return (
    <AuthProvider>
    <DemoGuard>
      {/* UX-HIGH-001 (B): WCAG 2.4.1 skip-link. Jumps past the
          cockpit/sidebar noise to the live-region announcer that
          serves as the dashboard's canonical main-content anchor. */}
      <SkipLink />
      {/* UX-HIGH-003 (B): Top-of-viewport offline indicator. */}
      <OfflineBanner />
      <DemoSessionBanner />
      {/* AUTH-HIGH-004 (4C): Dismissible (session-scope) reminder when
          parents.email_verified_at is null. Renders nothing for verified
          parents, demo users, or while auth is still loading. */}
      <EmailVerifyBanner />
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

        {/* ARIA live region + skip-link target. UX-HIGH-001 (B): tabIndex=-1
            lets focus land here from the skip link without entering the
            normal tab order. role="main" is more semantic than "region"
            for the post-skip landing. */}
        <div
          id="main-content"
          tabIndex={-1}
          role="main"
          aria-live="polite"
          aria-atomic="true"
          aria-label="Dashboard content"
          className="sr-only focus:outline-none"
        />

        {/* Phase 1 audit fix (Section 8.2): A11yAnnouncer for score/XP/badge/streak */}
        <A11yAnnouncer />

        {/* PERF-CRIT-002 (11C): Dev-only Three.js allocation monitor.
            Hidden unless localStorage.sparkforge_memory_monitor === '1'.
            Stripped from production bundles via NODE_ENV guard inside. */}
        <MemoryMonitor />

        {/* Guide chat panel — HTML overlay for text input (Phase 3: migrate to uikit) */}
        <GuideChatPanel />

        {/* UX-ENH-006 (Max): Inline hint bubble — one-sentence nudge
            driven by useContextualHints stall detector. */}
        <GuideHintBubble />

        {/* v3 Gap 1/3: Admin tools dock — only rendered when parent.is_admin.
            Floats bottom-left so it coexists with TrialBanner/DemoBanner at top
            and the parent UsageDashboard at top-right. */}
        <AdminNavDock />

        {/* Page children — thin scene descriptors that set mode + feed data.
            These render NO visible HTML. They only call hooks. */}
        {children}

        {/* T11 UX-MED-003 (Opt A): Onboarding tour. Invisible anchors
            target the 3D nav cluster on screen; the tour component
            dynamically loads react-joyride and auto-runs once. */}
        <TutorialAnchors />
        <CockpitHelpButton />
        <CockpitTutorial />

        {/* DB-ENH-002: renders nothing; opens Supabase Realtime channels
            for this parent's children. Invalidates progress + XP caches
            on row-level changes. */}
        <RealtimeChildrenBridge />
      </div>
    </DemoGuard>
    </AuthProvider>
  );
}
