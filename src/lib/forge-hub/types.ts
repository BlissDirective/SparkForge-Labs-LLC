import type { PortalPhase } from './portalMachine';
import type { MotionBibleId } from './director/ids';

// ════════════════════════════════════════════════════════════════
// Forge Hub types — W1-01 store slice (TAP v2.2 §2.5)
// ════════════════════════════════════════════════════════════════
// Lives on the existing sceneStore (exported as useForgeStore).
// Do NOT add a new Zustand store. W1-02 owns portalPhase via
// portalMachine.ts (idle → charge → emit → docked). W1-03 glass is
// world materials on the lock-pose trio. W2 layouts / projection /
// HoloPanel read `mode` + `morphProgress` from this same slice.
// W2-03: ForgeRouteMode + applyForgeRoute + EscapeFlat/ToastRail.
// W3-03: placeholder Sparky + spots + behaviour on this same slice.

export type ForgeMorphPhase = 'idle' | 'fade-out' | 'glass' | 'wipe-in';

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

/** Portal reducer phases — source of truth is portalMachine.ts. */
export type ForgePortalPhase = PortalPhase;

export type ForgeSparkySpot =
  | 'nearCore'
  | 'leftLip'
  | 'rightLip'
  | 'frontCenter'
  | 'behindCore';

export type ForgeSparkyBehaviour =
  | 'idle'
  | 'attend'
  | 'react'
  | 'return'
  | 'sleep'
  | 'whisper';

/** SparkyCore / spec §5 face names — 3D placeholder reuses the names. */
export type ForgeSparkyExpression =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'speaking'
  | 'excited'
  | 'sleepy'
  | 'sad'
  | 'celebrating'
  | 'surprised';

export type ForgeSparkyReaction =
  | 'tapReact'
  | 'cheer'
  | 'wave'
  | 'pointL'
  | 'pointR'
  | 'lookAround'
  | 'sadNod'
  | 'surprised';

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
  /** Face-screen expression (SparkyCore names). */
  expression: ForgeSparkyExpression;
  /** Panel the placeholder is attending, if any. */
  attendPanel: ForgePanelId;
  /** Last one-shot reaction; null when idle/attend/return. */
  reaction: ForgeSparkyReaction | null;
  /** True while lerping between desk spots (false under reduced motion). */
  moving: boolean;
}

export interface ForgeHoloBubbleState {
  state: ForgeHoloBubbleStateId;
  /** World-space anchor; Smith fills from the holoEmitter socket. */
  anchor: readonly [number, number, number] | null;
  /** Stub tip copy (W3-03). Full HoloBubble UI is Stagehand+Smith later. */
  tip: string | null;
}

/**
 * W2-03: pathname → stage vs EscapeFlat. `bridge` is /dev/* (manual
 * mode switcher). `plain` is /offline (no overlay theater).
 */
export type ForgeRouteKind = 'stage' | 'flat' | 'plain' | 'bridge';

export type ForgeRouteWave =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | 'FLAT'
  | 'plain'
  | 'BRIDGE';

/** Payload for `applyForgeRoute` — still the sceneStore forge slice. */
export interface ForgeRouteApply {
  mode: ForgeMode;
  frameloop?: ForgeFrameloop;
  flatOverlay?: boolean;
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
  /**
   * W2-02 Director: active MOTION_BIBLE id, or null when idle.
   * Progress lives on the Director clock (not a new store).
   */
  directorId: MotionBibleId | null;
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
    expression: 'idle',
    attendPanel: null,
    reaction: null,
    moving: false,
  },
  holoBubble: {
    state: 'hidden',
    anchor: null,
    tip: null,
  },
  poseLock: false,
  directorId: null,
};
