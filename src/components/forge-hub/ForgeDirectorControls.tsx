'use client';

/**
 * Minimal /dev/forge-hub Director HUD — emit-burst, one morph,
 * Theatre ignition stub, and a 0–1 scrubber. Not a kid-facing control.
 */

import { useForgeDirector } from '@/lib/forge-hub/useForgeDirector';

interface ForgeDirectorControlsProps {
  reducedMotion: boolean;
  poseLock: boolean;
}

function fmtProgress(value: number): string {
  return value.toFixed(2);
}

export function ForgeDirectorControls({
  reducedMotion,
  poseLock,
}: ForgeDirectorControlsProps) {
  const { clock, play, skip, scrub } = useForgeDirector(
    reducedMotion,
    poseLock,
  );

  if (poseLock) return null;

  return (
    <div
      data-forge-director-ui="1"
      data-testid="forge-hub-director"
      className="forge-hub-director"
    >
      <p className="forge-hub-director-kicker">Director · W2-02</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="forge-hub-director-emit"
          className="forge-hub-ignite"
          onClick={() => play('emit-burst')}
        >
          emit-burst
        </button>
        <button
          type="button"
          data-testid="forge-hub-director-morph"
          className="forge-hub-ignite"
          onClick={() => play('login-success-hubsplit')}
        >
          login-success-hubsplit
        </button>
        <button
          type="button"
          data-testid="forge-hub-director-ignition"
          className="forge-hub-ignite"
          onClick={() => play('first-visit-ignition')}
        >
          first-visit-ignition
        </button>
        <button
          type="button"
          data-testid="forge-hub-director-skip"
          className="forge-hub-ignite"
          disabled={!clock.skippable}
          onClick={() => skip()}
        >
          Skip
        </button>
      </div>
      <label className="forge-hub-director-scrub">
        <span>Scrub</span>
        <input
          data-testid="forge-hub-director-scrub"
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(clock.progress * 100)}
          aria-label="Director timeline scrubber"
          onChange={(event) => scrub(Number(event.target.value) / 100)}
        />
      </label>
      <p
        data-testid="forge-hub-director-id"
        className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-100/80"
      >
        {clock.id ?? 'idle'} · {fmtProgress(clock.progress)}
        {reducedMotion ? ' · RM' : ''}
      </p>
    </div>
  );
}
