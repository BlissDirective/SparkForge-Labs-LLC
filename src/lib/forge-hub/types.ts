// ════════════════════════════════════════════════════════════════
// Forge Hub types — W1-01 store slice (TAP v2.2 §2.5)
// ════════════════════════════════════════════════════════════════
// Lives on the existing sceneStore (exported as useForgeStore).
// Do NOT add a new Zustand store. Glass / portal / Sparky / HoloBubble
// values are scaffolded here so later Stagehand + Smith tasks write
// into this slice instead of creating stores. Those features are NOT
// implemented in W1-01.

export type ForgeMode =
  | 'welcome'
  | 'hubSplit'
  | 'labsBrowse'
  | 'gameLobby'
  | 'playStage'
  | 'avatarStudio'
  | 'settingsDock'
  | 'cinematic'
  | 'focus'
  | 'dual'
  | 'flat';

export type ForgeFrameloop = 'always' | 'demand' | 'never';

export type ForgePanelId = 'holoL' | 'holoC' | 'holoR' | null;

/** Portal reducer phases — W1-02 owns the machine. Idle default only. */
export type ForgePortalPhase = 'idle' | 'charge' | 'emit' | 'docked';

export type ForgeSparkySpot =
  | 'nearCore'
  | 'leftLip'
  | 'rightLip'
  | 'frontCenter'
  | 'behindCore';

export type ForgeSparkyBehaviour = 'idle' | 'attend' | 'react' | 'return';

export type ForgeHoloBubbleStateId =
  | 'hidden'
  | 'ping'
  | 'tip'
  | 'chat'
  | 'whisper';

export interface ForgeSparkyState {
  spot: ForgeSparkySpot;
  behaviour: ForgeSparkyBehaviour;
  outfit: string | null;
}

export interface ForgeHoloBubbleState {
  state: ForgeHoloBubbleStateId;
  /** World-space anchor; Smith fills from the holoEmitter socket. */
  anchor: readonly [number, number, number] | null;
}

export interface ForgeSlice {
  mode: ForgeMode;
  previousMode: ForgeMode | null;
  morphProgress: number;
  portalPhase: ForgePortalPhase;
  activePanel: ForgePanelId;
  hoveredPanel: ForgePanelId;
  frameloop: ForgeFrameloop;
  flatOverlay: boolean;
  sparky: ForgeSparkyState;
  holoBubble: ForgeHoloBubbleState;
  /**
   * W1-01: `?pose=lock` freezes camera (no micro-dolly, no pointer
   * parallax) so Inspector's SSIM capture is a still of the lock pose.
   */
  poseLock: boolean;
}

export const FORGE_SLICE_DEFAULTS: ForgeSlice = {
  mode: 'hubSplit',
  previousMode: null,
  morphProgress: 0,
  portalPhase: 'idle',
  activePanel: null,
  hoveredPanel: null,
  frameloop: 'always',
  flatOverlay: false,
  sparky: {
    spot: 'nearCore',
    behaviour: 'idle',
    outfit: null,
  },
  holoBubble: {
    state: 'hidden',
    anchor: null,
  },
  poseLock: false,
};
