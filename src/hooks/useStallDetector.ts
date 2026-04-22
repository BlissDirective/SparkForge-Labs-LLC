'use client';

// UX-ENH-006 (Max): Stall detector for contextual hints
//
// Fires `onStall` when the user has not produced any "meaningful"
// input (pointer move, click, keypress) within a rolling window.
// Re-arms after every input so the hint only triggers from a quiet
// period, not from true idleness during an animation.
//
// Also suppresses firing when a modal/chat panel is open — those
// states aren't "stalled on a puzzle"; they're engaged.

import { useEffect, useRef } from 'react';
import { useGuideStore } from '@/stores/guideStore';

interface Options {
  /** ms of quiet input before onStall fires. Default 12_000. */
  stallMs?: number;
  /** Disable entirely (e.g., during welcome phase). */
  disabled?: boolean;
  /** Fires once per stall; won't re-fire until input resumes then
   *  goes quiet again. */
  onStall: () => void;
}

const INPUT_EVENTS = ['pointermove', 'pointerdown', 'keydown', 'touchstart'] as const;

export function useStallDetector({ stallMs = 12_000, disabled, onStall }: Options): void {
  const firedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Freshest onStall ref so effects don't re-arm on callback identity changes.
  const onStallRef = useRef(onStall);
  onStallRef.current = onStall;

  // Guide panel + hint visibility (consumers are engaged, not stalled).
  const chatVisible = useGuideStore((s) => s.visible);
  const hintVisible = useGuideStore((s) => s.hintVisible);

  useEffect(() => {
    if (disabled) return;
    if (chatVisible || hintVisible) return;
    if (typeof window === 'undefined') return;

    const arm = () => {
      firedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!firedRef.current) {
          firedRef.current = true;
          onStallRef.current();
        }
      }, stallMs);
    };

    arm();

    const onInput = () => arm();
    INPUT_EVENTS.forEach((ev) => {
      window.addEventListener(ev, onInput, { passive: true });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      INPUT_EVENTS.forEach((ev) => window.removeEventListener(ev, onInput));
    };
  }, [stallMs, disabled, chatVisible, hintVisible]);
}
