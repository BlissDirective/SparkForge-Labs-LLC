// ════════════════════════════════════════════════════════════════
// Forge Hub portal — idle → charge → emit → docked
// ════════════════════════════════════════════════════════════════
// Ported from PR #164 `src/lib/forge-lab/portalMachine.ts` (W1-02).
// Pure reducer so tests do not need XState. Timings match the
// attached keyframe stills. Reduced-motion callers send SKIP_TO_DOCKED
// instead of IGNITE so charge/emit never play.
//
// Do not import hotspot-shell types. Director (W2) will sequence this
// reducer inside a timeline; until then `/dev/forge-hub` holds + ADVANCE.

export type PortalPhase = 'idle' | 'charge' | 'emit' | 'docked';

export type PortalEvent =
  | { type: 'IGNITE' }
  | { type: 'ADVANCE' }
  | { type: 'RETRACT' }
  | { type: 'SKIP_TO_DOCKED' };

export const PORTAL_PHASES: readonly PortalPhase[] = [
  'idle',
  'charge',
  'emit',
  'docked',
] as const;

/** Charge / emit holds — Chromebook-safe, under 600ms each. */
export const PORTAL_HOLD_MS: Record<
  Extract<PortalPhase, 'charge' | 'emit'>,
  number
> = {
  charge: 420,
  emit: 560,
};

export function reducePortal(
  phase: PortalPhase,
  event: PortalEvent,
): PortalPhase {
  switch (event.type) {
    case 'IGNITE':
      return phase === 'idle' ? 'charge' : phase;
    case 'ADVANCE':
      if (phase === 'charge') return 'emit';
      if (phase === 'emit') return 'docked';
      return phase;
    case 'RETRACT':
      return phase === 'idle' ? 'idle' : 'idle';
    case 'SKIP_TO_DOCKED':
      return 'docked';
    default:
      return phase;
  }
}

export function isPortalOpen(phase: PortalPhase): boolean {
  return phase === 'emit' || phase === 'docked';
}

/** HoloC reading surface is always illuminated — never a dark idle HUD. */
export function isHudLit(_phase: PortalPhase): boolean {
  return true;
}

export function nextHoldMs(phase: PortalPhase): number | null {
  if (phase === 'charge') return PORTAL_HOLD_MS.charge;
  if (phase === 'emit') return PORTAL_HOLD_MS.emit;
  return null;
}

/** Emissive strength for the CorePortal mesh (idle pulse → charge → emit). */
export function portalEmitStrength(phase: PortalPhase): number {
  switch (phase) {
    case 'idle':
      return 0.22;
    case 'charge':
      return 0.78;
    case 'emit':
      return 1;
    case 'docked':
      return 0.58;
    default:
      return 0.22;
  }
}

export function portalPulseRate(phase: PortalPhase): number {
  switch (phase) {
    case 'idle':
      return 1.4;
    case 'charge':
      return 4.2;
    case 'emit':
      return 6.1;
    case 'docked':
      return 1.8;
    default:
      return 1.4;
  }
}
