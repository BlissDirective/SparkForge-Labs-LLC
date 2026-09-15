// ════════════════════════════════════════════════════════════════
// MOTION_BIBLE locked timings (TAP §2.6 / bible §1).
// Charge/emit holds are Stagehand portalMachine — do not retime.
// Slab / slotSlide windows bind to Stagehand LAYOUT_MORPH_MS (420).
// ════════════════════════════════════════════════════════════════

import { LAYOUT_MORPH_MS, WELCOME_SIDE_SCALE } from '@/lib/forge-hub/layouts';
import { PORTAL_HOLD_MS } from '@/lib/forge-hub/portalMachine';

export { LAYOUT_MORPH_MS, WELCOME_SIDE_SCALE };

/** Interactive morph wall-clock cap. */
export const INTERACTIVE_CAP_MS = 600;

/** Cinematic beat wall-clock cap. */
export const CINEMATIC_CAP_MS = 1500;

/** prefers-reduced-motion substitute. */
export const REDUCED_MOTION_CROSSFADE_MS = 200;

/** emit-burst wall-clock: charge 420 + emit 560. */
export const EMIT_BURST_MS =
  PORTAL_HOLD_MS.charge + PORTAL_HOLD_MS.emit;

export const LOGIN_SUCCESS_HUBSPLIT_MS = 600;

/** Interactive remainder morphs share the 600 ms wall-clock cap. */
export const INTERACTIVE_MORPH_MS = INTERACTIVE_CAP_MS;

export const FIRST_VISIT_IGNITION_MS = 1500;

/** playstage-lobby-split slab window (bible §5.5) — not a LAYOUT_MORPH_MS retime. */
export const SPLIT_SLAB_WINDOW_MS = 340;

/** whisper expand/close “slab” analog (dim + bubble, bible §5.6 / §6.1). */
export const WHISPER_EXPAND_WINDOW_MS = 400;

/** Focus sides yawTuck token (inside the 420 ms slotSlide window). */
export const YAW_TUCK_MS = 240;

/** Interactive charge pulse (not the portal 420 ms hold). */
export const INTERACTIVE_CHARGE_MS = 80;

/** Beams retarget window. */
export const BEAMS_MS = 70;

/** Slab window = Stagehand `slotSlide` / LAYOUT_MORPH_MS (not #164 480). */
export const LOGIN_SLAB_WINDOW_MS = LAYOUT_MORPH_MS;

/** TAP §2.6 camera: micro-dolly ± 2 % of camera distance. */
export const CAMERA_MICRO_DOLLY = 0.02;

export const SPARKY_HOP_MS = 250;
export const SPARKY_PING_MS = 100;

export function msToSec(ms: number): number {
  return ms / 1000;
}

export function assertInteractiveCap(durationMs: number): void {
  if (durationMs - INTERACTIVE_CAP_MS > 0.5) {
    throw new Error(
      `Director interactive timeline ${durationMs}ms exceeds ${INTERACTIVE_CAP_MS}ms cap`,
    );
  }
}

export function assertCinematicCap(durationMs: number): void {
  if (durationMs - CINEMATIC_CAP_MS > 0.5) {
    throw new Error(
      `Director cinematic timeline ${durationMs}ms exceeds ${CINEMATIC_CAP_MS}ms cap`,
    );
  }
}

export function clampCameraDollyPercent(value: number): number {
  return Math.max(-CAMERA_MICRO_DOLLY, Math.min(CAMERA_MICRO_DOLLY, value));
}

/** Portal phase that the emit-burst clock should hold at `timeMs`. */
export function emitBurstPhaseAt(timeMs: number): 'charge' | 'emit' | 'docked' {
  if (timeMs < PORTAL_HOLD_MS.charge) return 'charge';
  if (timeMs < EMIT_BURST_MS) return 'emit';
  return 'docked';
}
