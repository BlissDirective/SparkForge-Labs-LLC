'use client';

// ════════════════════════════════════════════════════════════════
// CockpitHelpButton — T11 UX-MED-003 (Opt A)
// ════════════════════════════════════════════════════════════════
// Persistent, small, high-contrast "?" button fixed to the bottom-
// right of the dashboard viewport. Click → replays the cockpit
// tutorial (react-joyride) via a custom window event.
//
// Positioned above the 3D canvas (z-50) without overlapping the
// AdminNavDock (bottom-left) or DemoSessionBanner (top).
// ════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { TUTORIAL_REPLAY_EVENT } from './CockpitTutorial';

export function CockpitHelpButton() {
  const replay = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(TUTORIAL_REPLAY_EVENT));
  }, []);

  return (
    <button
      type="button"
      data-tutorial="help-button"
      onClick={replay}
      aria-label="Replay cockpit tutorial"
      title="Replay cockpit tutorial"
      className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-surface-card/90 text-white shadow-[0_6px_20px_rgba(0,187,255,0.28)] backdrop-blur-md transition hover:border-[#00BBFF] hover:text-[#00BBFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00BBFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0E16]"
    >
      <span aria-hidden="true" className="font-display text-lg font-bold leading-none">
        ?
      </span>
    </button>
  );
}

export default CockpitHelpButton;
