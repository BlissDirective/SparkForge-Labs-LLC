// ════════════════════════════════════════════════════
// COCKPIT STORE — Spatial Dashboard Navigation State (CPA v2.0)
// ════════════════════════════════════════════════════
// Enhancement 1.1 + 1.2 + CPA v2.0: 3D Panoramic Cockpit Enhancement
// Manages: focused lab, camera target, spatial mode, console state,
//          cockpit skin (unlock-gated), ceremony queue, audio prefs, mini-map
// Persisted: cockpit skin + unlocked skins + last focused lab + NPC vis + audio + mini-map
//
// FIXED (J5): Timeout IDs are now stored in state and cleared before
// setting new ones, preventing stale isTransitioning writes when actions
// are called multiple times in quick succession.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CockpitSkin, SpatialView, CeremonyType } from '@/types';
import type { ThemeId } from '@/lib/3d/cockpitThemes';
import type { CockpitMode } from '@/lib/3d/cockpitModePresets';

// ════════════════════════════════════════════════════════════════
// R1 (Phase 3 Part 2): cockpitUIStore merged into cockpitStore.
// The UI-routing slice (centerContent + centerData + setCenterContent
// + modeToCenterContent) is now part of this single store so consumers
// don't have to coordinate two subscriptions for every cockpit panel
// render. Field names preserved so consumer migration is a 1-line
// import swap.
// ════════════════════════════════════════════════════════════════

export type CenterContentKey =
  | 'home'          // DashboardCenter
  | 'labs'          // LabsCenter
  | 'lab_detail'    // LabDetailPanel
  | 'arcade'        // ArcadePanel
  | 'profile'       // ProfileCenter
  | 'settings'      // SettingsPanel
  | 'parent'        // ParentPanel
  | 'game'          // Game takeover (no center panel — game scene fills)
  | 'chat'          // ChatPanel3D (AI Guide chat)
  | 'celebration'   // CelebrationPanel3D
  | 'onboarding';   // OnboardingPanel

export interface CenterContentData {
  labId?: number;
  labColor?: string;
  gameSlug?: string;
  [key: string]: unknown;
}

export function modeToCenterContent(mode: CockpitMode): CenterContentKey {
  switch (mode) {
    case 'dashboard': return 'home';
    case 'arcade': return 'arcade';
    case 'labs': return 'labs';
    case 'lab_detail': return 'lab_detail';
    case 'game': return 'game';
    case 'profile': return 'profile';
    case 'settings': return 'settings';
    case 'parent': return 'parent';
    case 'celebration': return 'home';
    default: return 'home';
  }
}

// Re-export types so consumers can import from either @/types or @/stores/cockpitStore
export type { CockpitSkin, SpatialView, CeremonyType };

// ConsoleType in store includes null (no console focused); @/types version does not
export type ConsoleType = 'xp' | 'badges' | 'streak' | 'progress' | null;

// Hero animation phase for seamless handoff (CPA2-3)
export type HeroPhase = 'idle' | 'animating' | 'materializing' | 'complete';

export interface CameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

// Pre-calculated lab positions in a circular ring
const LAB_ANGLE_STEP = (2 * Math.PI) / 10;
const LAB_RING_RADIUS = 3.8;

export const LAB_POSITIONS: Record<number, [number, number, number]> = {};
for (let i = 1; i <= 10; i++) {
  const angle = (i - 1) * LAB_ANGLE_STEP - Math.PI / 2; // Start from top
  LAB_POSITIONS[i] = [
    Math.cos(angle) * LAB_RING_RADIUS,
    0,
    Math.sin(angle) * LAB_RING_RADIUS,
  ];
}

// v3: Tight-focus camera presets — user sits IN the cockpit seat
// Per cockpit-architecture.json: cameraPosition [0, 0.65, 1.1], FOV 58
export const SPATIAL_CAMERA_PRESETS: Record<SpatialView, CameraTarget> = {
  overview: {
    position: [0, 0.85, 0.9],
    lookAt: [0, 0, -2.5],
    fov: 62,
  },
  'lab-focus': {
    position: [0, 0.65, 0.6],
    lookAt: [0, 0.3, -3.0],
    fov: 55,
  },
  console: {
    position: [0, 0.65, 1.1],
    lookAt: [0, 0.25, -2.0],
    fov: 58,
  },
  orbit: {
    position: [0, 1.2, 1.5],
    lookAt: [0, 0, -2.0],
    fov: 58,
  },
};

// v3: Console-specific camera targets for left/right console focus
export const CONSOLE_CAMERA_PRESETS = {
  'console-left': {
    position: [-2.0, 0.65, -0.5] as [number, number, number],
    lookAt: [-2.35, 0.25, -1.65] as [number, number, number],
    fov: 56,
  },
  'console-right': {
    position: [2.0, 0.65, -0.5] as [number, number, number],
    lookAt: [2.35, 0.25, -1.65] as [number, number, number],
    fov: 56,
  },
} as const;

// ═══ CPA v2.0 — Skin unlock requirements (Decision CPA2-4) ═══
export const SKIN_UNLOCK_CONDITIONS: Record<CockpitSkin, { description: string; badge: string | null }> = {
  default:    { description: 'Always available', badge: null },
  cyberpunk:  { description: 'Complete all Lab 9 games', badge: 'Digital Pioneer' },
  space:      { description: 'Earn 10,000 total XP', badge: 'Star Navigator' },
  underwater: { description: 'Maintain a 30-day streak', badge: 'Deep Diver' },
  crystal:    { description: 'Complete ALL 35 games at least once', badge: 'Crystal Commander' },
};

// §3.5 (P2 Apr 21 2026): CeremonyQueueItem interface removed — the
// queue it described was never written to. If a ceremony queue is
// reintroduced later, it should live in uiStore alongside
// showCelebration so there's only one celebration-state owner.

interface CockpitState {
  // Spatial navigation
  spatialView: SpatialView;
  focusedLabId: number | null;
  hoveredLabId: number | null;
  activeConsole: ConsoleType;
  isTransitioning: boolean;
  orbitSpeed: number;

  // Camera
  cameraTarget: CameraTarget;

  // Customization (CPA v2.0: skin unlock via achievements — Decision CPA2-4)
  cockpitSkin: CockpitSkin;
  unlockedSkins: CockpitSkin[];
  skinPreviewActive: boolean;

  // Phase 5 N.2-MAX (§3.6): User-selectable cockpit theme — independent
  // of the achievement-gated `cockpitSkin` system. Always-unlocked.
  cockpitTheme: ThemeId;

  // NPC state
  npcsVisible: boolean;

  // §3.5 (P2 Apr 21 2026): ceremonyQueue removed — was dead code.
  // Celebration state lives in uiStore.showCelebration only.

  // CPA v2.0 — Audio preferences (Decision CPA2-8)
  cockpitAudioEnabled: boolean;
  ambientVolume: number;
  // UI Design Change — expanded audio controls (6 user settings)
  spatialAudioVolume: number;
  eventAudioVolume: number;
  mechanicalAudioDensity: number;
  labAudioEnabled: boolean;
  // Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore.
  // masterSoundEnabled is the global mute flag (replaces uiStore.soundEnabled).
  // voiceEnabled is the guide TTS flag (replaces guideStore.voiceEnabled).
  masterSoundEnabled: boolean;
  voiceEnabled: boolean;

  // UI Design Change — visual control
  brightness: number;

  // UI Design Change — active cockpit mode
  activeMode: CockpitMode;
  previousMode: CockpitMode | null;

  // CPA v2.0 — Mini-map
  miniMapVisible: boolean;

  // Hero-to-cockpit seamless handoff (CPA2-3, 20M upgrade)
  heroPhase: HeroPhase;
  cockpitReady: boolean;        // true once cockpit geometry is fully materialized

  // R1: UI-routing slice (merged from deprecated cockpitUIStore)
  centerContent: CenterContentKey;
  centerData: CenterContentData;
  previousCenter: CenterContentKey | null;

  // Internal timeout IDs for transition cleanup (J5 fix)
  _spatialViewTimeout: ReturnType<typeof setTimeout> | null;
  _focusLabTimeout: ReturnType<typeof setTimeout> | null;
  _openConsoleTimeout: ReturnType<typeof setTimeout> | null;
  _returnToOverviewTimeout: ReturnType<typeof setTimeout> | null;

  // Actions
  setSpatialView: (view: SpatialView) => void;
  focusLab: (labId: number | null) => void;
  setHoveredLab: (labId: number | null) => void;
  openConsole: (type: ConsoleType) => void;
  closeConsole: () => void;
  setCockpitSkin: (skin: CockpitSkin) => void;
  unlockSkin: (skin: CockpitSkin) => void;
  setSkinPreview: (active: boolean) => void;

  // Phase 5 N.2-MAX (§3.6)
  setCockpitTheme: (theme: ThemeId) => void;
  setTransitioning: (transitioning: boolean) => void;
  setOrbitSpeed: (speed: number) => void;
  toggleNPCs: () => void;
  returnToOverview: () => void;
  // §3.5 (P2 Apr 21 2026): ceremonyQueue was dead code — nothing
  // enqueued to it so its only consumer (PostProcessingStack) always
  // saw an empty array. Celebration state lives in
  // uiStore.showCelebration; enqueue/dequeue removed.
  setCockpitAudio: (enabled: boolean) => void;
  setAmbientVolume: (volume: number) => void;
  setSpatialAudioVolume: (volume: number) => void;
  setEventAudioVolume: (volume: number) => void;
  setMechanicalAudioDensity: (density: number) => void;
  setLabAudioEnabled: (enabled: boolean) => void;
  // Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore
  setMasterSoundEnabled: (value: boolean) => void;
  setVoiceEnabled: (value: boolean) => void;
  muteAll: () => void;
  unmuteAll: () => void;
  setBrightness: (brightness: number) => void;
  setActiveMode: (mode: CockpitMode) => void;
  toggleMiniMap: () => void;
  setHeroPhase: (phase: HeroPhase) => void;
  setCockpitReady: (ready: boolean) => void;

  // R1: UI-routing actions
  setCenterContent: (key: CenterContentKey, data?: CenterContentData) => void;
}

export const useCockpitStore = create<CockpitState>()(
  persist(
    (set, get) => ({
      spatialView: 'overview',
      focusedLabId: null,
      hoveredLabId: null,
      activeConsole: null,
      isTransitioning: false,
      orbitSpeed: 0.15,
      cameraTarget: SPATIAL_CAMERA_PRESETS.overview,
      cockpitSkin: 'default',
      unlockedSkins: ['default'] as CockpitSkin[],
      skinPreviewActive: false,

      // Phase 5 N.2-MAX (§3.6): User-selectable theme
      cockpitTheme: 'default' as ThemeId,
      npcsVisible: true,
      cockpitAudioEnabled: true,
      ambientVolume: 0.15,
      spatialAudioVolume: 0.3,
      eventAudioVolume: 0.5,
      mechanicalAudioDensity: 0.7,
      labAudioEnabled: true,
      // Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore
      masterSoundEnabled: true,
      voiceEnabled: true,
      brightness: 1.0,
      activeMode: 'dashboard' as CockpitMode,
      previousMode: null as CockpitMode | null,
      miniMapVisible: true,
      heroPhase: 'idle' as HeroPhase,
      cockpitReady: false,

      // R1: UI-routing slice initial values
      centerContent: 'home' as CenterContentKey,
      centerData: {} as CenterContentData,
      previousCenter: null as CenterContentKey | null,

      _spatialViewTimeout: null,
      _focusLabTimeout: null,
      _openConsoleTimeout: null,
      _returnToOverviewTimeout: null,

      setSpatialView: (spatialView) => {
        const prev = get()._spatialViewTimeout;
        if (prev) clearTimeout(prev);
        const timeout = setTimeout(() => set({ isTransitioning: false }), 800);
        set({
          spatialView,
          cameraTarget: SPATIAL_CAMERA_PRESETS[spatialView],
          isTransitioning: true,
          _spatialViewTimeout: timeout,
        });
      },

      focusLab: (labId) => {
        if (labId === null) {
          get().returnToOverview();
          return;
        }
        const pos = LAB_POSITIONS[labId];
        if (!pos) return;

        // Camera flies to lab position, offset slightly above and behind
        const angle = Math.atan2(pos[2], pos[0]);
        const camDist = 2.2;
        const prev = get()._focusLabTimeout;
        if (prev) clearTimeout(prev);
        const timeout = setTimeout(() => set({ isTransitioning: false }), 800);
        set({
          focusedLabId: labId,
          spatialView: 'lab-focus',
          isTransitioning: true,
          _focusLabTimeout: timeout,
          cameraTarget: {
            position: [
              pos[0] + Math.cos(angle) * camDist,
              2.0,
              pos[2] + Math.sin(angle) * camDist,
            ],
            lookAt: [pos[0], 0.3, pos[2]],
            fov: 50,
          },
        });
      },

      setHoveredLab: (hoveredLabId) => set({ hoveredLabId }),

      openConsole: (activeConsole) => {
        const prev = get()._openConsoleTimeout;
        if (prev) clearTimeout(prev);
        const timeout = setTimeout(() => set({ isTransitioning: false }), 600);
        set({
          activeConsole,
          spatialView: 'console',
          isTransitioning: true,
          _openConsoleTimeout: timeout,
        });
      },

      closeConsole: () => {
        set({ activeConsole: null });
        get().returnToOverview();
      },

      setCockpitSkin: (cockpitSkin) => {
        const { unlockedSkins } = get();
        if (unlockedSkins.includes(cockpitSkin)) {
          set({ cockpitSkin });
        }
      },

      // Phase 5 N.2-MAX (§3.6): No unlock gate — all 4 themes always available
      setCockpitTheme: (cockpitTheme) => set({ cockpitTheme }),

      unlockSkin: (skin) => {
        set((s) => ({
          unlockedSkins: s.unlockedSkins.includes(skin)
            ? s.unlockedSkins
            : [...s.unlockedSkins, skin],
        }));
      },

      setSkinPreview: (skinPreviewActive) => set({ skinPreviewActive }),

      setTransitioning: (isTransitioning) => set({ isTransitioning }),

      setOrbitSpeed: (orbitSpeed) => set({ orbitSpeed }),

      toggleNPCs: () => set((s) => ({ npcsVisible: !s.npcsVisible })),

      returnToOverview: () => {
        const prev = get()._returnToOverviewTimeout;
        if (prev) clearTimeout(prev);
        const timeout = setTimeout(() => set({ isTransitioning: false }), 800);
        set({
          spatialView: 'overview',
          focusedLabId: null,
          activeConsole: null,
          isTransitioning: true,
          _returnToOverviewTimeout: timeout,
          cameraTarget: SPATIAL_CAMERA_PRESETS.overview,
        });
      },

      // §3.5 (P2 Apr 21 2026): enqueue/dequeueCeremony removed —
      // celebration state is owned by uiStore.showCelebration.

      setCockpitAudio: (cockpitAudioEnabled) => set({ cockpitAudioEnabled }),

      setAmbientVolume: (ambientVolume) => set({ ambientVolume }),

      setSpatialAudioVolume: (spatialAudioVolume) => set({ spatialAudioVolume }),

      setEventAudioVolume: (eventAudioVolume) => set({ eventAudioVolume }),

      setMechanicalAudioDensity: (mechanicalAudioDensity) => set({ mechanicalAudioDensity }),

      setLabAudioEnabled: (labAudioEnabled) => set({ labAudioEnabled }),

      // Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore
      setMasterSoundEnabled: (masterSoundEnabled) => set({ masterSoundEnabled }),
      setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
      muteAll: () => set({
        masterSoundEnabled: false,
        voiceEnabled: false,
        cockpitAudioEnabled: false,
        labAudioEnabled: false,
      }),
      unmuteAll: () => set({
        masterSoundEnabled: true,
        voiceEnabled: true,
        cockpitAudioEnabled: true,
        labAudioEnabled: true,
      }),

      setBrightness: (brightness) => set({ brightness }),

      setActiveMode: (mode) => set((s) => ({
        activeMode: mode,
        previousMode: s.activeMode,
      })),

      toggleMiniMap: () => set((s) => ({ miniMapVisible: !s.miniMapVisible })),

      setHeroPhase: (heroPhase) => set({ heroPhase }),
      setCockpitReady: (cockpitReady) => set({ cockpitReady }),

      // R1: UI-routing action (merged from cockpitUIStore)
      setCenterContent: (key, data = {}) =>
        set((s) => ({
          centerContent: key,
          centerData: data,
          previousCenter:
            s.centerContent !== key ? s.centerContent : s.previousCenter,
        })),
    }),
    {
      name: 'sparkforge-cockpit',
      partialize: (state) => ({
        cockpitSkin: state.cockpitSkin,
        unlockedSkins: state.unlockedSkins,
        // Phase 5 N.2-MAX (§3.6): Persist theme selection across sessions
        cockpitTheme: state.cockpitTheme,
        focusedLabId: state.focusedLabId,
        npcsVisible: state.npcsVisible,
        cockpitAudioEnabled: state.cockpitAudioEnabled,
        ambientVolume: state.ambientVolume,
        spatialAudioVolume: state.spatialAudioVolume,
        eventAudioVolume: state.eventAudioVolume,
        mechanicalAudioDensity: state.mechanicalAudioDensity,
        labAudioEnabled: state.labAudioEnabled,
        brightness: state.brightness,
        miniMapVisible: state.miniMapVisible,
        // Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore
        masterSoundEnabled: state.masterSoundEnabled,
        voiceEnabled: state.voiceEnabled,
      }),
    }
  )
);

// ════════════════════════════════════════════════════════════════
// Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore
// Subscribe-bridge: keep deprecated uiStore.soundEnabled and guideStore.voiceEnabled
// in sync with the canonical cockpitStore values so legacy consumers continue to
// behave correctly during the deprecation transition.
// ════════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
  let prevMasterSound = useCockpitStore.getState().masterSoundEnabled;
  let prevVoice = useCockpitStore.getState().voiceEnabled;

  useCockpitStore.subscribe((state) => {
    if (state.masterSoundEnabled !== prevMasterSound) {
      prevMasterSound = state.masterSoundEnabled;
      // Lazy import to avoid circular dependency at module init time
      void import('@/stores/uiStore').then(({ useUIStore }) => {
        const ui = useUIStore.getState();
        if (ui.soundEnabled !== state.masterSoundEnabled) {
          // useUIStore exposes toggleSound, not setSoundEnabled — set directly
          useUIStore.setState({ soundEnabled: state.masterSoundEnabled });
        }
      });
    }
    if (state.voiceEnabled !== prevVoice) {
      prevVoice = state.voiceEnabled;
      void import('@/stores/guideStore').then(({ useGuideStore }) => {
        const guide = useGuideStore.getState();
        if (guide.voiceEnabled !== state.voiceEnabled) {
          guide.setVoiceEnabled?.(state.voiceEnabled);
        }
      });
    }
  });
}
