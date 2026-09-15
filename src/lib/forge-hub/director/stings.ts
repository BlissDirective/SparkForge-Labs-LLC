// ════════════════════════════════════════════════════════════════
// MOTION_BIBLE §8.1 audio sting ids — names only.
// Slice 1: silent no-ops. No binary assets, no Tone.Transport.
// Honour mute; D3D-5 does not gate a silent stub.
// ════════════════════════════════════════════════════════════════

import { useUIStore } from '@/stores/uiStore';

export const FORGE_STING_IDS = [
  'bed.welcome',
  'bed.hub',
  'sting.loginSuccess',
  'sting.hubLabsBrowse',
  'sting.labsBrowseHub',
  'sting.gameLaunch',
  'sting.gameLaunchBurst',
  'sting.lobbyReturn',
  'sting.whisperOpen',
  'sting.whisperClose',
  'sting.emitBurst',
  'sting.ignition',
  'sting.focusIn',
  'sting.focusOut',
  'sting.dualEnter',
  'sting.dualExit',
  'sting.levelUp',
  'sting.outfitSwap',
] as const;

export type ForgeStingId = (typeof FORGE_STING_IDS)[number];

export function isForgeStingId(value: string): value is ForgeStingId {
  return (FORGE_STING_IDS as readonly string[]).includes(value);
}

/**
 * Silent stub. Returns false when muted or unknown; true when the id
 * would play (still no oscillator / buffer).
 */
export function playForgeSting(id: ForgeStingId | string): boolean {
  if (!isForgeStingId(id)) return false;
  try {
    if (useUIStore.getState().soundEnabled === false) return false;
  } catch {
    return false;
  }
  return true;
}
