'use client';

// React bindings for the Director singleton. Skip: click / Enter / Space
// on cinematic ids (emit-burst, first-visit-ignition). Ambient breathe
// stays Stagehand's panelBreathe unless freezeBreathe is set by a morph.

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  getDirectorClockVersion,
  getForgeDirector,
  peekDirectorClock,
  playForgeTransition,
  subscribeDirectorClock,
  type MotionBibleId,
  type PlayOptions,
} from '@/lib/forge-hub/director';
import type { DirectorClock } from '@/lib/forge-hub/director/clock';
import { isCinematicId } from '@/lib/forge-hub/director/ids';

export function useDirectorClock(): DirectorClock {
  useSyncExternalStore(
    subscribeDirectorClock,
    getDirectorClockVersion,
    getDirectorClockVersion,
  );
  return peekDirectorClock();
}

export function useForgeDirector(reducedMotion: boolean, poseLock: boolean) {
  const clock = useDirectorClock();
  const director = getForgeDirector();

  const play = useCallback(
    (id: MotionBibleId, opts?: PlayOptions) => {
      if (poseLock) return director.kill();
      return playForgeTransition(id, {
        reducedMotion,
        ...opts,
      });
    },
    [director, poseLock, reducedMotion],
  );

  const skip = useCallback(() => {
    director.skip();
  }, [director]);

  const kill = useCallback(() => {
    director.kill();
  }, [director]);

  const scrub = useCallback(
    (progress: number) => {
      director.scrub(progress);
    },
    [director],
  );

  useEffect(() => {
    if (poseLock) {
      director.kill();
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      const id = director.activeId();
      if (!id || !isCinematicId(id)) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      event.preventDefault();
      director.skip();
    };
    const onClick = (event: MouseEvent) => {
      const id = director.activeId();
      if (!id || !isCinematicId(id)) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-forge-director-ui]')) return;
      director.skip();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('click', onClick);
    };
  }, [director, poseLock]);

  return { clock, play, skip, kill, scrub, director };
}
