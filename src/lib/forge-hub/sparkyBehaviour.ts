// ════════════════════════════════════════════════════════════════
// Placeholder Sparky behaviour (TAP §2.8 / spec §7.2–7.4).
// idle → attend(panel) → react(event) → return, plus sleep / whisper
// overrides. Lives on sceneStore.forge — no new Zustand store.
// ════════════════════════════════════════════════════════════════

import { sparkyLine } from '@/lib/forge-hub/catalog';
import {
  attendSpotForPanel,
  defaultSpotForMode,
  sparkyHoloAnchor,
} from '@/config/sparkySpots';
import { useForgeStore } from '@/stores/sceneStore';
import type { MotionBibleId } from './director/ids';
import type {
  ForgeHoloBubbleState,
  ForgeHoloBubbleStateId,
  ForgeMode,
  ForgePanelId,
  ForgeSparkyBehaviour,
  ForgeSparkyExpression,
  ForgeSparkyReaction,
  ForgeSparkySpot,
  ForgeSparkyState,
} from './types';

export type SparkyEvent =
  | { type: 'MODE'; mode: ForgeMode }
  | { type: 'HOVER'; panel: ForgePanelId }
  | { type: 'FOCUS'; panel: ForgePanelId }
  | { type: 'DIRECTOR'; id: MotionBibleId | null }
  | { type: 'REACT'; reaction: ForgeSparkyReaction }
  | { type: 'TAP' }
  | { type: 'RETURN' }
  | { type: 'SLEEP' }
  | { type: 'WAKE' }
  | { type: 'WHISPER' }
  | { type: 'WHISPER_CLOSE' }
  | { type: 'SET_SPOT'; spot: ForgeSparkySpot };

export interface SparkyMachineContext {
  reducedMotion: boolean;
  poseLock: boolean;
}

export interface SparkyIntent {
  spot: ForgeSparkySpot;
  behaviour: ForgeSparkyBehaviour;
  expression: ForgeSparkyExpression;
  attendPanel: ForgePanelId;
  reaction: ForgeSparkyReaction | null;
  moving: boolean;
  bubble: Partial<ForgeHoloBubbleState> | null;
  autoReturnMs: number | null;
}

/** Spec §7.4 — dome emissive follows HoloBubble state. */
export const HOLO_DOME_EMISSIVE: Record<ForgeHoloBubbleStateId, number> = {
  hidden: 0.3,
  ping: 0.6,
  tip: 1,
  chat: 1,
  whisper: 1.2,
};

export const SPARKY_REACTION_MS: Record<ForgeSparkyReaction, number> = {
  tapReact: 800,
  cheer: 1500,
  wave: 1200,
  pointL: 700,
  pointR: 700,
  lookAround: 2500,
  sadNod: 1200,
  surprised: 600,
};

const REACTION_FACE: Record<ForgeSparkyReaction, ForgeSparkyExpression> = {
  tapReact: 'surprised',
  cheer: 'celebrating',
  wave: 'happy',
  pointL: 'happy',
  pointR: 'happy',
  lookAround: 'idle',
  sadNod: 'sad',
  surprised: 'surprised',
};

const STUB_TIP = 'Hi — placeholder Sparky on the desk.';

function isOverride(behaviour: ForgeSparkyBehaviour): boolean {
  return behaviour === 'sleep' || behaviour === 'whisper';
}

function movingFlag(
  from: ForgeSparkySpot,
  to: ForgeSparkySpot,
  reducedMotion: boolean,
): boolean {
  if (from === to || reducedMotion) return false;
  return true;
}

function withAnchor(
  spot: ForgeSparkySpot,
  bubble: Partial<ForgeHoloBubbleState> | null,
): Partial<ForgeHoloBubbleState> {
  const anchor = sparkyHoloAnchor(spot);
  return bubble ? { ...bubble, anchor } : { anchor };
}

function snapshot(state: ForgeSparkyState, extra: Partial<SparkyIntent> = {}): SparkyIntent {
  return {
    spot: state.spot,
    behaviour: state.behaviour,
    expression: state.expression,
    attendPanel: state.attendPanel,
    reaction: state.reaction,
    moving: false,
    bubble: null,
    autoReturnMs: null,
    ...extra,
  };
}

function reactIntent(
  state: ForgeSparkyState,
  reaction: ForgeSparkyReaction,
  ctx: SparkyMachineContext,
  bubbleState: ForgeHoloBubbleStateId = 'tip',
  tip: string | null = STUB_TIP,
): SparkyIntent {
  return {
    spot: state.spot,
    behaviour: 'react',
    expression: REACTION_FACE[reaction],
    attendPanel: state.attendPanel,
    reaction,
    moving: false,
    bubble: withAnchor(state.spot, {
      state: bubbleState,
      tip: bubbleState === 'hidden' ? null : tip,
    }),
    autoReturnMs: SPARKY_REACTION_MS[reaction],
  };
}

function directorIntent(
  state: ForgeSparkyState,
  id: MotionBibleId,
  ctx: SparkyMachineContext,
): SparkyIntent {
  switch (id) {
    case 'whisper-expand':
      return {
        spot: 'frontCenter',
        behaviour: 'whisper',
        expression: 'speaking',
        attendPanel: 'holoC',
        reaction: null,
        moving: movingFlag(state.spot, 'frontCenter', ctx.reducedMotion),
        bubble: withAnchor('frontCenter', { state: 'whisper', tip: STUB_TIP }),
        autoReturnMs: null,
      };
    case 'whisper-close':
      return {
        spot: 'nearCore',
        behaviour: 'idle',
        expression: 'idle',
        attendPanel: null,
        reaction: null,
        moving: movingFlag(state.spot, 'nearCore', ctx.reducedMotion),
        bubble: withAnchor('nearCore', { state: 'hidden', tip: null }),
        autoReturnMs: null,
      };
    case 'hub-labsbrowse':
      return {
        spot: 'leftLip',
        behaviour: 'attend',
        expression: 'happy',
        attendPanel: 'holoL',
        reaction: 'pointL',
        moving: movingFlag(state.spot, 'leftLip', ctx.reducedMotion),
        bubble: withAnchor('leftLip', null),
        autoReturnMs: null,
      };
    case 'labsbrowse-hub':
    case 'login-success-hubsplit':
    case 'welcome-idle':
      return {
        spot: 'nearCore',
        behaviour: 'idle',
        expression: id === 'login-success-hubsplit' ? 'happy' : 'idle',
        attendPanel: null,
        reaction: id === 'login-success-hubsplit' ? 'wave' : null,
        moving: movingFlag(state.spot, 'nearCore', ctx.reducedMotion),
        bubble: withAnchor('nearCore', null),
        autoReturnMs: null,
      };
    case 'dual-enter':
      return {
        spot: 'frontCenter',
        behaviour: 'idle',
        expression: 'idle',
        attendPanel: null,
        reaction: null,
        moving: movingFlag(state.spot, 'frontCenter', ctx.reducedMotion),
        bubble: withAnchor('frontCenter', null),
        autoReturnMs: null,
      };
    case 'dual-exit':
      return {
        spot: 'nearCore',
        behaviour: 'idle',
        expression: 'idle',
        attendPanel: null,
        reaction: null,
        moving: movingFlag(state.spot, 'nearCore', ctx.reducedMotion),
        bubble: withAnchor('nearCore', null),
        autoReturnMs: null,
      };
    case 'lobby-playstage-merge':
    case 'playstage-lobby-split':
      return {
        spot: 'rightLip',
        behaviour: id === 'lobby-playstage-merge' ? 'attend' : 'idle',
        expression: id === 'lobby-playstage-merge' ? 'excited' : 'idle',
        attendPanel: id === 'lobby-playstage-merge' ? 'holoC' : null,
        reaction: null,
        moving: movingFlag(state.spot, 'rightLip', ctx.reducedMotion),
        bubble: withAnchor('rightLip', null),
        autoReturnMs: null,
      };
    case 'focus-in':
      return {
        spot: 'nearCore',
        behaviour: 'attend',
        expression: 'idle',
        attendPanel: 'holoC',
        reaction: null,
        moving: movingFlag(state.spot, 'nearCore', ctx.reducedMotion),
        bubble: withAnchor('nearCore', null),
        autoReturnMs: null,
      };
    case 'emit-burst':
    case 'first-visit-ignition':
    case 'game-launch-burst':
      return {
        ...reactIntent(state, 'cheer', ctx, 'ping', sparkyLine(1)),
        expression: 'celebrating',
        behaviour: 'react',
      };
    default:
      return snapshot(state);
  }
}

export function advanceSparky(
  state: ForgeSparkyState,
  event: SparkyEvent,
  ctx: SparkyMachineContext,
): SparkyIntent {
  if (ctx.poseLock) {
    return snapshot(state, {
      moving: false,
      autoReturnMs: null,
    });
  }

  const overridden = isOverride(state.behaviour);

  switch (event.type) {
    case 'SLEEP':
      return {
        spot: state.spot,
        behaviour: 'sleep',
        expression: 'sleepy',
        attendPanel: null,
        reaction: null,
        moving: false,
        bubble: withAnchor(state.spot, { state: 'hidden', tip: null }),
        autoReturnMs: null,
      };
    case 'WAKE':
      return {
        spot: state.spot,
        behaviour: 'idle',
        expression: 'idle',
        attendPanel: null,
        reaction: null,
        moving: false,
        bubble: withAnchor(state.spot, { state: 'hidden', tip: null }),
        autoReturnMs: null,
      };
    case 'WHISPER':
      return {
        spot: 'frontCenter',
        behaviour: 'whisper',
        expression: 'speaking',
        attendPanel: 'holoC',
        reaction: null,
        moving: movingFlag(state.spot, 'frontCenter', ctx.reducedMotion),
        bubble: withAnchor('frontCenter', { state: 'whisper', tip: STUB_TIP }),
        autoReturnMs: null,
      };
    case 'WHISPER_CLOSE':
      return {
        spot: 'nearCore',
        behaviour: 'idle',
        expression: 'idle',
        attendPanel: null,
        reaction: null,
        moving: movingFlag(state.spot, 'nearCore', ctx.reducedMotion),
        bubble: withAnchor('nearCore', { state: 'hidden', tip: null }),
        autoReturnMs: null,
      };
    case 'TAP':
      if (state.behaviour === 'sleep') {
        return reactIntent(state, 'tapReact', ctx);
      }
      return reactIntent(state, 'tapReact', ctx);
    case 'REACT':
      return reactIntent(state, event.reaction, ctx);
    case 'RETURN': {
      if (state.behaviour === 'sleep') return snapshot(state);
      if (state.behaviour === 'whisper') {
        return {
          spot: 'frontCenter',
          behaviour: 'whisper',
          expression: 'speaking',
          attendPanel: 'holoC',
          reaction: null,
          moving: false,
          bubble: withAnchor('frontCenter', { state: 'whisper', tip: STUB_TIP }),
          autoReturnMs: null,
        };
      }
      return {
        spot: state.spot,
        behaviour: 'idle',
        expression: 'happy',
        attendPanel: null,
        reaction: null,
        moving: false,
        bubble: withAnchor(state.spot, { state: 'hidden', tip: null }),
        autoReturnMs: null,
      };
    }
    case 'SET_SPOT':
      return {
        spot: event.spot,
        behaviour: overridden ? state.behaviour : 'idle',
        expression: overridden ? state.expression : 'idle',
        attendPanel: overridden ? state.attendPanel : null,
        reaction: null,
        moving: movingFlag(state.spot, event.spot, ctx.reducedMotion),
        bubble: withAnchor(event.spot, null),
        autoReturnMs: null,
      };
    case 'HOVER': {
      if (overridden) return snapshot(state);
      if (!event.panel) {
        if (state.behaviour === 'idle' && !state.attendPanel) {
          return snapshot(state);
        }
        return {
          spot: state.spot,
          behaviour: 'return',
          expression: 'idle',
          attendPanel: null,
          reaction: null,
          moving: false,
          bubble: withAnchor(state.spot, null),
          autoReturnMs: 280,
        };
      }
      const spot = attendSpotForPanel(event.panel, state.spot);
      const point: ForgeSparkyReaction | null =
        event.panel === 'holoL'
          ? 'pointL'
          : event.panel === 'holoR'
            ? 'pointR'
            : null;
      return {
        spot,
        behaviour: 'attend',
        expression: event.panel === 'holoC' ? 'idle' : 'happy',
        attendPanel: event.panel,
        reaction: point,
        moving: movingFlag(state.spot, spot, ctx.reducedMotion),
        bubble: withAnchor(spot, null),
        autoReturnMs: null,
      };
    }
    case 'FOCUS': {
      if (overridden) return snapshot(state);
      return {
        spot: state.spot,
        behaviour: state.behaviour === 'attend' ? 'attend' : 'idle',
        expression: 'idle',
        attendPanel: event.panel,
        reaction: null,
        moving: false,
        bubble: withAnchor(state.spot, null),
        autoReturnMs: null,
      };
    }
    case 'MODE': {
      if (overridden) return snapshot(state);
      const spot = defaultSpotForMode(event.mode);
      return {
        spot,
        behaviour: 'idle',
        expression: event.mode === 'welcome' ? 'happy' : 'idle',
        attendPanel: null,
        reaction: event.mode === 'welcome' ? 'wave' : null,
        moving: movingFlag(state.spot, spot, ctx.reducedMotion),
        bubble: withAnchor(spot, null),
        autoReturnMs: event.mode === 'welcome' ? SPARKY_REACTION_MS.wave : null,
      };
    }
    case 'DIRECTOR':
      if (!event.id) return snapshot(state);
      return directorIntent(state, event.id, ctx);
    default:
      return snapshot(state);
  }
}

function applyIntent(intent: SparkyIntent): void {
  const store = useForgeStore.getState();
  store.patchForgeSparky({
    spot: intent.spot,
    behaviour: intent.behaviour,
    expression: intent.expression,
    attendPanel: intent.attendPanel,
    reaction: intent.reaction,
    moving: intent.moving,
  });
  if (intent.bubble) {
    store.patchForgeHoloBubble(intent.bubble);
  }
}

let returnTimer: ReturnType<typeof setTimeout> | null = null;

export function clearSparkyReturnTimer(): void {
  if (returnTimer) {
    clearTimeout(returnTimer);
    returnTimer = null;
  }
}

export function dispatchSparkyEvent(
  event: SparkyEvent,
  ctx: SparkyMachineContext,
): SparkyIntent {
  const current = useForgeStore.getState().forge.sparky;
  const intent = advanceSparky(current, event, ctx);
  applyIntent(intent);
  clearSparkyReturnTimer();
  if (intent.autoReturnMs != null && !ctx.poseLock) {
    const wait = intent.autoReturnMs;
    returnTimer = setTimeout(() => {
      returnTimer = null;
      dispatchSparkyEvent({ type: 'RETURN' }, ctx);
    }, wait);
  }
  return intent;
}

export function sparkyMoveAttr(
  poseLock: boolean,
  reducedMotion: boolean,
  moving: boolean,
): 'frozen' | 'teleport' | 'lerp' | 'idle' {
  if (poseLock) return 'frozen';
  if (reducedMotion) return 'teleport';
  if (moving) return 'lerp';
  return 'idle';
}
