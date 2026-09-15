'use client';

/**
 * Minimal /dev/forge-hub Director HUD — emit-burst, one morph,
 * Theatre ignition fill + a 0–1 scrubber. Not a kid-facing control.
 * Scrubber API is unchanged for Stagehand W2-05.
 */

import { DIRECTOR_REMAINDER_IDS } from '@/lib/forge-hub/director/ids';
import { useForgeDirector } from '@/lib/forge-hub/useForgeDirector';
import { isMotionBibleId } from '@/lib/forge-hub/director';

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
      <p className="forge-hub-director-kicker">
        Director · {reducedMotion ? 'RM 200ms' : 'W2 Theatre'}
      </p>
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
      <label className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan-100/80">
        Remainder morph
        <select
          data-testid="forge-hub-director-remainder"
          className="forge-hub-mode ml-2"
          aria-label="Director remainder morph id"
          value={
            clock.id &&
            (DIRECTOR_REMAINDER_IDS as readonly string[]).includes(clock.id)
              ? clock.id
              : ''
          }
          onChange={(event) => {
            const next = event.target.value;
            if (next && isMotionBibleId(next)) play(next);
          }}
        >
          <option value="">pick id</option>
          {DIRECTOR_REMAINDER_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <label className="forge-hub-director-scrub">
        <span>Scrub</span>
        <input
          data-testid="forge-hub-director-scrub"
          data-forge-transition-scrub="director"
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
