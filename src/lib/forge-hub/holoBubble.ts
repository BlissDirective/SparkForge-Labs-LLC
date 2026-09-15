// ════════════════════════════════════════════════════════════════
// HoloBubble stub (W3-04) — TAP v2.2 §2.8b.
// Fourth reading-plate slab. State lives on sceneStore.forge.holoBubble
// (patchForgeHoloBubble). No new Zustand store.
// Whisper cinematic polish stays Director-owned; this module holds
// open/close, Escape, tip auto-dismiss, and play-stage ping/tip notes.
// ════════════════════════════════════════════════════════════════

import { sparkyHoloAnchor } from '@/config/sparkySpots';
import { sparkyLine } from '@/lib/forge-hub/catalog';
import { useForgeStore } from '@/stores/sceneStore';
import type { ForgeHoloBubbleStateId, ForgeMode } from './types';

export const HOLO_BUBBLE_TIP_MS = 3200;

export const HOLO_BUBBLE_REST_PX = { width: 320, height: 200 } as const;
export const HOLO_BUBBLE_CHAT_PX = { width: 420, height: 320 } as const;
export const HOLO_BUBBLE_PING_PX = { width: 40, height: 40 } as const;
export const HOLO_BUBBLE_WHISPER_PX = { width: 480, height: 340 } as const;

/** Viewport padding so the stub never kisses the chrome. */
export const HOLO_BUBBLE_VIEW_MARGIN_PX = 12;

/** Gap from the dome socket to the bubble's lower edge. */
export const HOLO_BUBBLE_DOME_GAP_PX = 14;

export const HOLO_BUBBLE_STATES: readonly ForgeHoloBubbleStateId[] = [
  'hidden',
  'ping',
  'tip',
  'chat',
  'whisper',
] as const;

export function isHoloBubbleStateId(
  value: string,
): value is ForgeHoloBubbleStateId {
  return (HOLO_BUBBLE_STATES as readonly string[]).includes(value);
}

export function isHoloBubbleOpen(state: ForgeHoloBubbleStateId): boolean {
  return state !== 'hidden';
}

/** TAP §2.8b — during play, conversation is ping/tip only. */
export function isPlayLimitedMode(mode: ForgeMode): boolean {
  return mode === 'playStage';
}

export function clampBubbleForPlay(
  state: ForgeHoloBubbleStateId,
  mode: ForgeMode,
): ForgeHoloBubbleStateId {
  if (!isPlayLimitedMode(mode)) return state;
  if (state === 'chat' || state === 'whisper') return 'tip';
  return state;
}

export function bubbleBoxForState(
  state: ForgeHoloBubbleStateId,
  whisperScale = 0,
): { width: number; height: number } {
  switch (state) {
    case 'ping':
      return { ...HOLO_BUBBLE_PING_PX };
    case 'chat':
      return { ...HOLO_BUBBLE_CHAT_PX };
    case 'whisper': {
      const t = Math.max(0, Math.min(1, whisperScale));
      const rest = HOLO_BUBBLE_REST_PX;
      const whisper = HOLO_BUBBLE_WHISPER_PX;
      return {
        width: Math.round(rest.width + (whisper.width - rest.width) * Math.max(t, 0.72)),
        height: Math.round(
          rest.height + (whisper.height - rest.height) * Math.max(t, 0.72),
        ),
      };
    }
    case 'tip':
    case 'hidden':
    default:
      return { ...HOLO_BUBBLE_REST_PX };
  }
}

export function clampBoxToViewport(
  left: number,
  top: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
  margin = HOLO_BUBBLE_VIEW_MARGIN_PX,
): { left: number; top: number } {
  const maxLeft = Math.max(margin, viewportWidth - width - margin);
  const maxTop = Math.max(margin, viewportHeight - height - margin);
  return {
    left: Math.min(Math.max(left, margin), maxLeft),
    top: Math.min(Math.max(top, margin), maxTop),
  };
}

export function followSpring(
  current: number,
  target: number,
  dt: number,
  lambda: number,
  snap: boolean,
): number {
  if (snap) return target;
  const k = 1 - Math.exp(-lambda * Math.max(0, dt));
  return current + (target - current) * k;
}

/** Spec §7.4 — same numbers as `HOLO_DOME_EMISSIVE` (kept here to avoid a cycle). */
export const HOLO_BUBBLE_DOME_EMISSIVE: Record<ForgeHoloBubbleStateId, number> =
  {
    hidden: 0.3,
    ping: 0.6,
    tip: 1,
    chat: 1,
    whisper: 1.2,
  };

export function domeEmissiveForBubble(state: ForgeHoloBubbleStateId): number {
  return HOLO_BUBBLE_DOME_EMISSIVE[state];
}

let tipTimer: ReturnType<typeof setTimeout> | null = null;
let lastFocus: HTMLElement | null = null;

export function clearHoloBubbleTipTimer(): void {
  if (tipTimer) {
    clearTimeout(tipTimer);
    tipTimer = null;
  }
}

export function rememberHoloBubbleFocus(node?: EventTarget | null): void {
  if (typeof document === 'undefined') return;
  const el =
    node instanceof HTMLElement
      ? node
      : document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  if (el && el !== document.body) lastFocus = el;
}

export function restoreHoloBubbleFocus(): void {
  if (typeof document === 'undefined') return;
  const el = lastFocus;
  lastFocus = null;
  if (el && document.contains(el) && typeof el.focus === 'function') {
    el.focus();
    return;
  }
  const hud = document.querySelector<HTMLElement>(
    '[data-testid="forge-hub-holobubble-open"]',
  );
  hud?.focus();
}

export function armHoloBubbleTipTimer(): void {
  clearHoloBubbleTipTimer();
  tipTimer = setTimeout(() => {
    tipTimer = null;
    const current = useForgeStore.getState().forge.holoBubble.state;
    if (current !== 'tip') return;
    closeHoloBubble({ restoreFocus: false });
  }, HOLO_BUBBLE_TIP_MS);
}

export function syncHoloBubbleTipTimer(state: ForgeHoloBubbleStateId): void {
  if (state === 'tip') {
    if (!tipTimer) armHoloBubbleTipTimer();
    return;
  }
  clearHoloBubbleTipTimer();
}

export function closeHoloBubble(
  opts: { restoreFocus?: boolean } = {},
): void {
  clearHoloBubbleTipTimer();
  useForgeStore.getState().patchForgeHoloBubble({
    state: 'hidden',
    tip: null,
  });
  if (opts.restoreFocus !== false) restoreHoloBubbleFocus();
}

export function openHoloBubble(
  state: ForgeHoloBubbleStateId,
  opts: { tip?: string | null; rememberFocus?: boolean } = {},
): ForgeHoloBubbleStateId {
  if (state === 'hidden') {
    closeHoloBubble({ restoreFocus: opts.rememberFocus !== false });
    return 'hidden';
  }
  const store = useForgeStore.getState();
  const next = clampBubbleForPlay(state, store.forge.mode);
  if (opts.rememberFocus !== false) {
    rememberHoloBubbleFocus();
  }
  const spot = store.forge.sparky.spot;
  const tip =
    opts.tip === undefined
      ? store.forge.holoBubble.tip ?? sparkyLine(0)
      : opts.tip;
  store.patchForgeHoloBubble({
    state: next,
    tip,
    anchor: sparkyHoloAnchor(spot),
  });
  syncHoloBubbleTipTimer(next);
  return next;
}

export function cycleHoloBubbleOpen(): ForgeHoloBubbleStateId {
  const current = useForgeStore.getState().forge.holoBubble.state;
  if (current === 'hidden' || current === 'ping') {
    return openHoloBubble('tip');
  }
  if (current === 'tip') {
    return openHoloBubble('chat');
  }
  return current;
}
