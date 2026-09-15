import { describe, expect, it } from 'vitest';
import {
  isHudLit,
  isPortalOpen,
  nextHoldMs,
  portalEmitStrength,
  reducePortal,
  type PortalPhase,
} from '@/lib/forge-hub/portalMachine';

describe('Forge Hub portal machine', () => {
  it('walks idle → charge → emit → docked', () => {
    let phase: PortalPhase = 'idle';
    phase = reducePortal(phase, { type: 'IGNITE' });
    expect(phase).toBe('charge');
    phase = reducePortal(phase, { type: 'ADVANCE' });
    expect(phase).toBe('emit');
    phase = reducePortal(phase, { type: 'ADVANCE' });
    expect(phase).toBe('docked');
  });

  it('skips motion and jumps to docked', () => {
    expect(reducePortal('idle', { type: 'SKIP_TO_DOCKED' })).toBe('docked');
    expect(reducePortal('charge', { type: 'SKIP_TO_DOCKED' })).toBe('docked');
  });

  it('retracts from any open phase back to idle', () => {
    expect(reducePortal('charge', { type: 'RETRACT' })).toBe('idle');
    expect(reducePortal('emit', { type: 'RETRACT' })).toBe('idle');
    expect(reducePortal('docked', { type: 'RETRACT' })).toBe('idle');
  });

  it('does not ignite again while already charging', () => {
    expect(reducePortal('charge', { type: 'IGNITE' })).toBe('charge');
    expect(reducePortal('emit', { type: 'IGNITE' })).toBe('emit');
    expect(reducePortal('docked', { type: 'IGNITE' })).toBe('docked');
  });

  it('does not advance from idle or docked', () => {
    expect(reducePortal('idle', { type: 'ADVANCE' })).toBe('idle');
    expect(reducePortal('docked', { type: 'ADVANCE' })).toBe('docked');
  });

  it('keeps the HUD lit in every phase; panels open on emit', () => {
    expect(isHudLit('idle')).toBe(true);
    expect(isHudLit('charge')).toBe(true);
    expect(isPortalOpen('idle')).toBe(false);
    expect(isHudLit('emit')).toBe(true);
    expect(isPortalOpen('emit')).toBe(true);
    expect(isPortalOpen('docked')).toBe(true);
    expect(nextHoldMs('charge')).toBe(420);
    expect(nextHoldMs('emit')).toBe(560);
    expect(nextHoldMs('docked')).toBeNull();
  });

  it('ramps CorePortal emit strength through the sequence', () => {
    expect(portalEmitStrength('idle')).toBeLessThan(portalEmitStrength('charge'));
    expect(portalEmitStrength('charge')).toBeLessThan(portalEmitStrength('emit'));
    expect(portalEmitStrength('docked')).toBeLessThan(portalEmitStrength('emit'));
  });
});
