// ════════════════════════════════════════════════════════════════
// COCKPIT UI STORE — Center Content Routing + UI Layer State
// ════════════════════════════════════════════════════════════════
// Thin store that bridges Next.js routes to 3D panel rendering.
// CockpitUILayer reads from this store to know which center panel
// to render. Pages write to it via useCockpitScene integration.
//
// This store lives OUTSIDE the R3F Canvas — it's a Zustand store
// that both React DOM and R3F components can subscribe to.

import { create } from 'zustand';
import type { CockpitMode } from '@/lib/3d/cockpitModePresets';

// ■■ Center content identifiers — maps to panel components ■■
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
  | 'celebration'   // CelebrationPanel3D (badge/level/streak/lab-complete)
  | 'onboarding';   // OnboardingPanel (future)

// ■■ Data passed from pages to 3D panels ■■
export interface CenterContentData {
  // Lab detail
  labId?: number;
  labColor?: string;

  // Game
  gameSlug?: string;

  // Generic data payload — panels read what they need
  [key: string]: unknown;
}

interface CockpitUIState {
  centerContent: CenterContentKey;
  centerData: CenterContentData;
  previousCenter: CenterContentKey | null;

  // Actions
  setCenterContent: (key: CenterContentKey, data?: CenterContentData) => void;
}

// ■■ Map CockpitMode → CenterContentKey ■■
export function modeToCenterContent(mode: CockpitMode): CenterContentKey {
  switch (mode) {
    case 'dashboard': return 'home';
    case 'labs': return 'labs';
    case 'lab_detail': return 'lab_detail';
    case 'game': return 'game';
    case 'profile': return 'profile';
    case 'settings': return 'settings';
    case 'parent': return 'parent';
    case 'celebration': return 'home'; // Celebration overlays current content
    default: return 'home';
  }
}

export const useCockpitUIStore = create<CockpitUIState>((set) => ({
  centerContent: 'home',
  centerData: {},
  previousCenter: null,

  setCenterContent: (key, data = {}) =>
    set((s) => ({
      centerContent: key,
      centerData: data,
      previousCenter: s.centerContent !== key ? s.centerContent : s.previousCenter,
    })),
}));

// Selectors
export const selectCenterContent = (s: CockpitUIState) => s.centerContent;
export const selectCenterData = (s: CockpitUIState) => s.centerData;
