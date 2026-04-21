'use client';

// ════════════════════════════════════════════════════════════════
// CockpitTutorial — T11 UX-MED-003 (Opt A)
// ════════════════════════════════════════════════════════════════
// Tooltip-based onboarding using react-joyride v3. Fires once on
// the first visit to /home after the child has been selected and
// the cockpit is ready. Dismiss / complete persists a flag to
// localStorage so the tour does not replay automatically.
//
// Replay: the persistent Help button (<CockpitHelpButton />) writes
// `sparkforge-cockpit-tutorial-replay` and dispatches a window
// event; this component listens for it and restarts the run.
//
// v3 API notes:
//   - Named export `Joyride` (no default).
//   - `onEvent` (not `callback`). Status strings live on `STATUS`.
//   - `styles` is flat (no nested `options`). Colors live in
//     per-step/top-level props (`primaryColor`, etc.).
//   - `skipBeacon` replaces `disableBeacon`; `skipScroll` replaces
//     `disableScrolling`; `overlayClickAction: false` replaces
//     `disableOverlayClose`.
// ════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import type {
  EventData,
  Controls,
  PartialDeep,
  Step,
  Styles,
} from 'react-joyride';
import { useSceneStore } from '@/stores/sceneStore';
import { useAuthStore } from '@/stores/authStore';

// Joyride ships a named export `Joyride`. next/dynamic expects a
// component as the default of the resolved module, so we adapt.
const Joyride = dynamic(
  () => import('react-joyride').then((m) => ({ default: m.Joyride })),
  { ssr: false, loading: () => null },
);

export const TUTORIAL_DONE_KEY = 'sparkforge-cockpit-tutorial-completed';
export const TUTORIAL_REPLAY_EVENT = 'sparkforge:cockpit-tutorial-replay';

// Screen-anchored tutorial steps. Joyride accepts CSS selectors or
// raw DOM elements as targets. We mount invisible anchor <div>s at
// known screen positions so tooltips land near the 3D element each
// step references, without reaching into the R3F scene graph.
const STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: 'Welcome to your Cockpit!',
    content:
      'This is your command bridge. From here you can launch Labs, play games, and earn XP. Take a quick tour?',
  },
  {
    target: '[data-tutorial="hud"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Your Progress',
    content:
      'The holographic strip at the top shows your XP, streak, and level. Keep playing to level up!',
  },
  {
    target: '[data-tutorial="nav-labs"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Explore Labs',
    content:
      'Each Lab teaches a different AI concept. Start with the unlocked ones — new Labs open as you level up.',
  },
  {
    target: '[data-tutorial="nav-arcade"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Jump into the Arcade',
    content:
      'Want to just play? The Arcade lists every game across every Lab. Pick one and go.',
  },
  {
    target: '[data-tutorial="nav-profile"]',
    placement: 'top',
    skipBeacon: true,
    title: 'Your Badges',
    content:
      "Your Profile shows badges you've earned and the trophies in your trophy room. Show them off!",
  },
  {
    target: '[data-tutorial="nav-settings"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Customize',
    content:
      'Tweak sound, motion, brightness, and accessibility in Settings anytime.',
  },
  {
    target: '[data-tutorial="help-button"]',
    placement: 'left',
    skipBeacon: true,
    title: 'Need the tour again?',
    content:
      'Click this Help button any time to replay this tour. You are all set — have fun!',
  },
];

// Frost-Prismatic theme for Joyride tooltips. Keeps tooltip chrome
// inside the design system: neon-blue accents, dark surface, the
// Exo 2 / Sora font stack. v3: styles is flat.
const JOYRIDE_STYLES: PartialDeep<Styles> = {
  tooltip: {
    backgroundColor: '#111118',
    color: '#E8ECF3',
    borderRadius: 16,
    border: '1px solid rgba(0, 187, 255, 0.35)',
    boxShadow:
      '0 20px 48px -12px rgba(0, 187, 255, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.04)',
    fontFamily: 'var(--font-body, Sora, system-ui, sans-serif)',
    padding: 18,
  },
  tooltipTitle: {
    fontFamily: 'var(--font-display, "Exo 2", system-ui, sans-serif)',
    fontSize: 18,
    fontWeight: 700,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tooltipContent: {
    fontSize: 14,
    lineHeight: 1.55,
    color: 'rgba(232, 236, 243, 0.85)',
  },
  buttonPrimary: {
    backgroundColor: '#00BBFF',
    color: '#05080E',
    borderRadius: 10,
    padding: '8px 18px',
    fontWeight: 600,
    fontFamily: 'var(--font-display, "Exo 2", system-ui, sans-serif)',
  },
  buttonBack: {
    color: '#AAB4C4',
    fontSize: 13,
  },
  buttonSkip: {
    color: '#AAB4C4',
    fontSize: 13,
  },
  buttonClose: {
    color: '#AAB4C4',
  },
  overlay: {
    backgroundColor: 'rgba(5, 8, 14, 0.72)',
  },
  arrow: {
    color: '#111118',
  },
};

export function CockpitTutorial() {
  const pathname = usePathname();
  // Only start once cockpit is interactive. This mirrors the
  // cockpitReady + heroPhase gate used elsewhere in the app.
  const cockpitReady = useSceneStore((s) => s.activeScene === 'cockpit');
  const parent = useAuthStore((s) => s.parent);
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const hasHydratedDemoSlice = useAuthStore((s) => s.hasHydratedDemoSlice);

  const [run, setRun] = useState(false);
  // Defer mount until after hydration so server / client markup matches.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-start logic: first /home visit after parent onboarding.
  useEffect(() => {
    if (!mounted) return;
    if (pathname !== '/home') return;
    if (!cockpitReady) return;
    if (!hasHydratedDemoSlice) return;
    // Demo users also get the tour — it helps them decide to sign up.
    if (!parent && !isDemoMode) return;

    try {
      const completed = window.localStorage.getItem(TUTORIAL_DONE_KEY);
      if (completed === '1') return;
    } catch {
      // localStorage blocked — run once per session, best-effort.
    }

    // Small delay so the cockpit has a frame or two to settle in.
    const timer = window.setTimeout(() => setRun(true), 1200);
    return () => window.clearTimeout(timer);
  }, [mounted, pathname, cockpitReady, parent, isDemoMode, hasHydratedDemoSlice]);

  // Replay listener — Help button dispatches this.
  useEffect(() => {
    if (!mounted) return;
    const handler = () => {
      try {
        window.localStorage.removeItem(TUTORIAL_DONE_KEY);
      } catch {}
      setRun(true);
    };
    window.addEventListener(TUTORIAL_REPLAY_EVENT, handler);
    return () => window.removeEventListener(TUTORIAL_REPLAY_EVENT, handler);
  }, [mounted]);

  const steps = useMemo(() => STEPS, []);

  const handleEvent = (data: EventData, _controls: Controls) => {
    // TOUR_END + SKIPPED/FINISHED are the canonical completion paths.
    // CLOSE action from overlay/close button also ends the tour.
    const finished =
      data.status === 'finished' ||
      data.status === 'skipped' ||
      data.type === 'tour:end';
    if (finished) {
      setRun(false);
      try {
        window.localStorage.setItem(TUTORIAL_DONE_KEY, '1');
      } catch {}
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep={false}
      styles={JOYRIDE_STYLES}
      options={{
        primaryColor: '#00BBFF',
        backgroundColor: '#111118',
        textColor: '#E8ECF3',
        arrowColor: '#111118',
        overlayColor: 'rgba(5, 8, 14, 0.72)',
        zIndex: 10_000,
        showProgress: true,
        buttons: ['back', 'skip', 'primary'],
        skipBeacon: true,
        skipScroll: true,
        overlayClickAction: 'close',
        dismissKeyAction: 'close',
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: "Let's go!",
        next: 'Next',
        skip: 'Skip tour',
        nextWithProgress: 'Next ({current} of {total})',
        open: 'Open the tour',
      }}
      onEvent={handleEvent}
    />
  );
}

export default CockpitTutorial;
