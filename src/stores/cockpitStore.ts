// ════════════════════════════════════════════════════
// COCKPIT STORE — Spatial Dashboard Navigation State (CPA v2.0)
// ════════════════════════════════════════════════════
// Enhancement 1.1 + 1.2 + CPA v2.0: 3D Panoramic Cockpit Enhancement
// Manages: focused lab, camera target, spatial mode, console state,
//          cockpit skin (unlock-gated), ceremony queue, audio prefs, mini-map
// Persisted: cockpit skin + unlocked skins + last focused lab + NPC vis + audio + mini-map

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CockpitSkin = 'default' | 'cyberpunk' | 'space' | 'underwater' | 'crystal';
export type SpatialView = 'overview' | 'lab-focus' | 'console' | 'orbit';
export type ConsoleType = 'xp' | 'badges' | 'streak' | 'progress' | null;
export type CeremonyType = 'xp' | 'badge' | 'levelUp' | 'gameComplete' | 'streakMilestone';

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

// Camera presets for spatial views
export const SPATIAL_CAMERA_PRESETS: Record<SpatialView, CameraTarget> = {
  overview: {
    position: [0, 6.5, 7],
    lookAt: [0, -0.5, 0],
    fov: 58,
  },
  'lab-focus': {
    position: [0, 2.5, 2],
    lookAt: [0, 0, 0],
    fov: 50,
  },
  console: {
    position: [0, 1.8, 3.5],
    lookAt: [0, 0.5, 0],
    fov: 52,
  },
  orbit: {
    position: [0, 4, 5],
    lookAt: [0, 0, 0],
    fov: 55,
  },
};

// ═══ CPA v2.0 — Skin unlock requirements (Decision CPA2-4) ═══
export const SKIN_UNLOCK_CONDITIONS: Record<CockpitSkin, { description: string; badge: string | null }> = {
  default:    { description: 'Always available', badge: null },
  cyberpunk:  { description: 'Complete all Lab 9 games', badge: 'Digital Pioneer' },
  space:      { description: 'Earn 10,000 total XP', badge: 'Star Navigator' },
  underwater: { description: 'Maintain a 30-day streak', badge: 'Deep Diver' },
  crystal:    { description: 'Complete ALL 35 games at least once', badge: 'Crystal Commander' },
};

interface CeremonyQueueItem {
  type: CeremonyType;
  intensity: number;
  labColor: string;
}

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

  // NPC state
  npcsVisible: boolean;

  // CPA v2.0 — Ceremony queue (Decision CPA2-10)
  ceremonyQueue: CeremonyQueueItem[];

  // CPA v2.0 — Audio preferences (Decision CPA2-8)
  cockpitAudioEnabled: boolean;
  ambientVolume: number;

  // CPA v2.0 — Mini-map
  miniMapVisible: boolean;

  // Actions
  setSpatialView: (view: SpatialView) => void;
  focusLab: (labId: number | null) => void;
  setHoveredLab: (labId: number | null) => void;
  openConsole: (type: ConsoleType) => void;
  closeConsole: () => void;
  setCockpitSkin: (skin: CockpitSkin) => void;
  unlockSkin: (skin: CockpitSkin) => void;
  setSkinPreview: (active: boolean) => void;
  setTransitioning: (transitioning: boolean) => void;
  setOrbitSpeed: (speed: number) => void;
  toggleNPCs: () => void;
  returnToOverview: () => void;
  enqueueCeremony: (item: CeremonyQueueItem) => void;
  dequeueCeremony: () => void;
  setCockpitAudio: (enabled: boolean) => void;
  setAmbientVolume: (volume: number) => void;
  toggleMiniMap: () => void;
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
      npcsVisible: true,
      ceremonyQueue: [] as CeremonyQueueItem[],
      cockpitAudioEnabled: true,
      ambientVolume: 0.15,
      miniMapVisible: true,

      setSpatialView: (spatialView) => {
        set({
          spatialView,
          cameraTarget: SPATIAL_CAMERA_PRESETS[spatialView],
          isTransitioning: true,
        });
        // Auto-clear transitioning after animation
        setTimeout(() => set({ isTransitioning: false }), 800);
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
        set({
          focusedLabId: labId,
          spatialView: 'lab-focus',
          isTransitioning: true,
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
        setTimeout(() => set({ isTransitioning: false }), 800);
      },

      setHoveredLab: (hoveredLabId) => set({ hoveredLabId }),

      openConsole: (activeConsole) => {
        set({
          activeConsole,
          spatialView: 'console',
          isTransitioning: true,
        });
        setTimeout(() => set({ isTransitioning: false }), 600);
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
        set({
          spatialView: 'overview',
          focusedLabId: null,
          activeConsole: null,
          isTransitioning: true,
          cameraTarget: SPATIAL_CAMERA_PRESETS.overview,
        });
        setTimeout(() => set({ isTransitioning: false }), 800);
      },

      enqueueCeremony: (item) =>
        set((s) => ({ ceremonyQueue: [...s.ceremonyQueue, item] })),

      dequeueCeremony: () =>
        set((s) => ({ ceremonyQueue: s.ceremonyQueue.slice(1) })),

      setCockpitAudio: (cockpitAudioEnabled) => set({ cockpitAudioEnabled }),

      setAmbientVolume: (ambientVolume) => set({ ambientVolume }),

      toggleMiniMap: () => set((s) => ({ miniMapVisible: !s.miniMapVisible })),
    }),
    {
      name: 'sparkforge-cockpit',
      partialize: (state) => ({
        cockpitSkin: state.cockpitSkin,
        unlockedSkins: state.unlockedSkins,
        focusedLabId: state.focusedLabId,
        npcsVisible: state.npcsVisible,
        cockpitAudioEnabled: state.cockpitAudioEnabled,
        ambientVolume: state.ambientVolume,
        miniMapVisible: state.miniMapVisible,
      }),
    }
  )
);
