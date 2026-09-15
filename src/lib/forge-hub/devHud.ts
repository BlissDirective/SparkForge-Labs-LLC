// ════════════════════════════════════════════════════════════════
// /dev/forge-hub HUD helpers (W2-05) — mode switcher, calibrate,
// transition scrubber. No new Zustand store; live sceneStore forge
// slice + Director singleton only.
// ════════════════════════════════════════════════════════════════

import { frameloopForMotion } from '@/config/forgeHub';
import {
  FORGE_CORE,
  PLATE_HEIGHT_PX,
  PLATE_WIDTH_PX,
  type PercentCircle,
} from './coreMap';
import {
  DIRECTOR_LIVE_IDS,
  DIRECTOR_REMAINDER_IDS,
  DIRECTOR_SLICE1_IDS,
  type DirectorLiveId,
} from './director/ids';
import {
  percentRectToLocal,
  type GlassLocalRect,
  type GlassSlotId,
} from './glassSlots';
import {
  LAYOUT_MORPH_MS,
  registerMorphTargets,
  slotContentSizePx,
} from './layouts';
import { morphPhaseFromProgress, type MorphPhase } from './projectionMath';
import type { ForgeMode, ForgeRouteApply } from './types';

export { DIRECTOR_SLICE1_IDS, DIRECTOR_REMAINDER_IDS, DIRECTOR_LIVE_IDS, LAYOUT_MORPH_MS };

const SLOT_IDS: readonly GlassSlotId[] = ['holoL', 'holoC', 'holoR'];

/**
 * Live Director id for a mode hop, or null when Stagehand should
 * only `applyForgeRoute`. Mode switcher still does not auto-play —
 * HUD / scrubber own MOTION_BIBLE playback so t=0 `setForgeMode`
 * cannot overwrite a hop.
 */
export function directorIdForModeChange(
  from: ForgeMode,
  to: ForgeMode,
): DirectorLiveId | null {
  if (from === to) return null;
  if (from === 'welcome' && to === 'hubSplit') return 'login-success-hubsplit';
  if (to === 'welcome') return 'welcome-idle';
  if (from === 'hubSplit' && to === 'labsBrowse') return 'hub-labsbrowse';
  if (from === 'labsBrowse' && to === 'hubSplit') return 'labsbrowse-hub';
  if (from === 'gameLobby' && to === 'playStage') return 'lobby-playstage-merge';
  if (from === 'playStage' && to === 'gameLobby') return 'playstage-lobby-split';
  if (to === 'focus' && from !== 'focus') return 'focus-in';
  if (from === 'focus' && to !== 'focus') return 'focus-out';
  if (to === 'dual' && from !== 'dual') return 'dual-enter';
  if (from === 'dual' && to !== 'dual') return 'dual-exit';
  return null;
}

export function isDevDirectorId(value: string): value is DirectorLiveId {
  return (DIRECTOR_LIVE_IDS as readonly string[]).includes(value);
}

export function forgeRouteForDevMode(
  mode: ForgeMode,
  reducedMotion: boolean,
): ForgeRouteApply {
  if (mode === 'flat') {
    return { mode: 'flat', frameloop: 'never', flatOverlay: true };
  }
  return {
    mode,
    frameloop: frameloopForMotion(reducedMotion),
    flatOverlay: false,
  };
}

export interface CalibrateSlotRecord {
  id: GlassSlotId;
  left: number;
  top: number;
  width: number;
  height: number;
  yaw: number;
  reading: boolean;
  visible: boolean;
  contentPx: { width: number; height: number };
  plateLocal: GlassLocalRect;
}

export function calibrateSlotsForMode(mode: ForgeMode): CalibrateSlotRecord[] {
  const targets = registerMorphTargets(mode);
  return SLOT_IDS.map((id) => {
    const slot = targets[id];
    return {
      id,
      left: slot.left,
      top: slot.top,
      width: slot.width,
      height: slot.height,
      yaw: slot.yaw ?? 0,
      reading: slot.reading,
      visible: slot.visible,
      contentPx: slotContentSizePx(slot),
      plateLocal: percentRectToLocal(slot, PLATE_WIDTH_PX, PLATE_HEIGHT_PX),
    };
  });
}

export function calibrateCore(): PercentCircle {
  return FORGE_CORE;
}

export function calibrateMorphPhase(morphProgress: number): MorphPhase {
  return morphPhaseFromProgress(morphProgress);
}

export function fmtCalibrateNum(value: number, digits = 1): string {
  return value.toFixed(digits);
}
