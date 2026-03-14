// ════════════════════════════════════════════════════
// COCKPIT STORE — Spatial Dashboard Navigation State
// ════════════════════════════════════════════════════
// Enhancement 1.1: Immersive Cockpit 2.0 — Spatial Dashboard
// Manages: focused lab, camera target, spatial mode, console state
// Persisted: cockpit skin selection + last focused lab

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CockpitSkin = 'default' | 'cyberpunk' | 'space' | 'underwater' | 'crystal';
export type SpatialView = 'overview' | 'lab-focus' | 'console' | 'orbit';
export type ConsoleType = 'xp' | 'badges' | 'streak' | 'progress' | null;

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

  // Customization
  cockpitSkin: CockpitSkin;

  // NPC state
  npcsVisible: boolean;

  // Actions
  setSpatialView: (view: SpatialView) => void;
  focusLab: (labId: number | null) => void;
  setHoveredLab: (labId: number | null) => void;
  openConsole: (type: ConsoleType) => void;
  closeConsole: () => void;
  setCockpitSkin: (skin: CockpitSkin) => void;
  setTransitioning: (transitioning: boolean) => void;
  setOrbitSpeed: (speed: number) => void;
  toggleNPCs: () => void;
  returnToOverview: () => void;
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
      npcsVisible: true,

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

      setCockpitSkin: (cockpitSkin) => set({ cockpitSkin }),

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
    }),
    {
      name: 'sparkforge-cockpit',
      partialize: (state) => ({
        cockpitSkin: state.cockpitSkin,
        focusedLabId: state.focusedLabId,
        npcsVisible: state.npcsVisible,
      }),
    }
  )
);
