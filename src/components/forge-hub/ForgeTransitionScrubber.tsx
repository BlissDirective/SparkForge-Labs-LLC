'use client';

/**
 * Stagehand transition scrubber — same Director singleton + forge
 * slice as the Director HUD. Does not replace emit-burst / morph /
 * ignition / Skip, and does not register cinematic skip listeners
 * (those stay on ForgeDirectorControls / useForgeDirector).
 */

import { useCallback } from 'react';
import { DIRECTOR_SLICE1_IDS, isDevDirectorId } from '@/lib/forge-hub/devHud';
import {
  getForgeDirector,
  playForgeTransition,
} from '@/lib/forge-hub/director';
import { useDirectorClock } from '@/lib/forge-hub/useForgeDirector';

interface ForgeTransitionScrubberProps {
  reducedMotion: boolean;
  poseLock: boolean;
}

function fmtProgress(value: number): string {
  return value.toFixed(2);
}

export function ForgeTransitionScrubber({
  reducedMotion,
  poseLock,
}: ForgeTransitionScrubberProps) {
  const clock = useDirectorClock();

  const play = useCallback(
    (id: Parameters<typeof playForgeTransition>[0]) => {
      if (poseLock) {
        getForgeDirector().kill();
        return;
      }
      playForgeTransition(id, { reducedMotion, paused: true });
    },
    [poseLock, reducedMotion],
  );

  const scrub = useCallback((progress: number) => {
    getForgeDirector().scrub(progress);
  }, []);

  const kill = useCallback(() => {
    getForgeDirector().kill();
  }, []);

  if (poseLock) return null;

  return (
    <div
      data-testid="forge-hub-transition-scrubber"
      className="forge-hub-transition-scrubber"
    >
      <p className="forge-hub-director-kicker">Transition · live store</p>
      <label className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan-100/80">
        Id
        <select
          data-testid="forge-hub-transition-id"
          className="forge-hub-mode ml-2"
          aria-label="Forge hub transition id"
          value={clock.id ?? ''}
          onChange={(event) => {
            const next = event.target.value;
            if (!next) {
              kill();
              return;
            }
            if (isDevDirectorId(next)) play(next);
          }}
        >
          <option value="">idle</option>
          {DIRECTOR_SLICE1_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <label className="forge-hub-director-scrub">
        <span>Scrub</span>
        <input
          data-testid="forge-hub-transition-scrub"
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(clock.progress * 100)}
          aria-label="Forge hub transition scrubber"
          onChange={(event) => scrub(Number(event.target.value) / 100)}
        />
      </label>
      <p
        data-testid="forge-hub-transition-progress"
        className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-100/80"
      >
        {clock.id ?? 'idle'} · {fmtProgress(clock.progress)}
        {reducedMotion ? ' · RM' : ''}
      </p>
    </div>
  );
}
