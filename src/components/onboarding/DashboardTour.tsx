'use client';

// ════════════════════════════════════════════════════════════════
// DashboardTour — First-login onboarding tour (HTML dashboard)
// ════════════════════════════════════════════════════════════════
// react-joyride v3 tour for the NEW HTML-first dashboard (Sidebar +
// TopBar + home page). Follows the CockpitTutorial wiring pattern
// (dynamic named-export import, flat v3 `styles`, `onEvent`).
//
// Behavior:
//   - Runs once per child: localStorage key
//     `sparkforge:dashboard-tour:v1:<childId>`.
//   - Only starts after a child profile exists (useActiveChild).
//   - Desktop-first: only runs when window.innerWidth >= 1024
//     (the Sidebar targets are hidden below lg; BottomNav takes over).
//   - Skippable at every step.
//
// Mounted from src/app/(dashboard)/home/page.tsx (NOT the layout)
// so it only evaluates on the home route.
// ════════════════════════════════════════════════════════════════

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type {
  EventData,
  Controls,
  PartialDeep,
  Step,
  Styles,
} from 'react-joyride';
import { useActiveChild } from '@/hooks/useChildren';

// Joyride ships a named export `Joyride`. next/dynamic expects a
// component as the default of the resolved module, so we adapt.
const Joyride = dynamic(
  () => import('react-joyride').then((m) => ({ default: m.Joyride })),
  { ssr: false, loading: () => null },
);

const TOUR_KEY_PREFIX = 'sparkforge:dashboard-tour:v1:';

export function dashboardTourStorageKey(childId: string): string {
  return `${TOUR_KEY_PREFIX}${childId}`;
}

/** Minimum viewport width for the tour (Sidebar is hidden below lg). */
const MIN_TOUR_WIDTH = 1024;

// Sparky-toned copy. Targets are stable `data-tour` anchors added to
// Sidebar.tsx and home/page.tsx.
const STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    skipBeacon: true,
    title: "Hi, I'm Sparky! ⚡",
    content:
      'Welcome to your SparkForge dashboard — home base for all your AI adventures. Want a super-quick tour? It only takes a minute!',
  },
  {
    target: '[data-tour="nav-labs"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Explore the Labs',
    content:
      'Labs are where the learning happens! Each one teaches a different AI superpower, and new Labs unlock as you level up.',
  },
  {
    target: '[data-tour="nav-arcade"]',
    placement: 'right',
    skipBeacon: true,
    title: 'Jump into the Arcade',
    content:
      'Want to go straight to the fun? The Arcade lists every game in one place. Pick one and press play!',
  },
  {
    target: '[data-tour="daily-mission"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Your Daily Mission',
    content:
      "Every day I'll cook up a fresh mission for you right here. Finish it to earn bonus XP and keep the momentum going!",
  },
  {
    target: '[data-tour="quick-stats"]',
    placement: 'bottom',
    skipBeacon: true,
    title: 'Streaks, Gems & Badges',
    content:
      'This strip tracks your streak flame, gems, badges, and level. Play every day to keep the flame burning — Streak Shields protect your streak if you miss a day!',
  },
  {
    target: '[data-tour="nav-parent"]',
    placement: 'right',
    skipBeacon: true,
    title: 'The Grown-Ups Corner',
    content:
      "This is where grown-ups check your progress. Everything else on this dashboard? All yours. Have fun — see you out there! ⚡",
  },
];

// Light-theme tooltip styling: white surface, #1A1D2B text,
// #4F6EF7 primary. v3: styles is flat (no nested `options`).
const JOYRIDE_STYLES: PartialDeep<Styles> = {
  tooltip: {
    backgroundColor: '#FFFFFF',
    color: '#1A1D2B',
    borderRadius: 16,
    border: '1px solid rgba(79, 110, 247, 0.18)',
    boxShadow:
      '0 20px 48px -12px rgba(26, 29, 43, 0.28), 0 0 0 1px rgba(26, 29, 43, 0.04)',
    fontFamily: 'var(--font-body, Sora, system-ui, sans-serif)',
    padding: 18,
  },
  tooltipTitle: {
    fontFamily: 'var(--font-display, "Exo 2", system-ui, sans-serif)',
    fontSize: 18,
    fontWeight: 700,
    color: '#1A1D2B',
    marginBottom: 8,
  },
  tooltipContent: {
    fontSize: 14,
    lineHeight: 1.55,
    color: 'rgba(26, 29, 43, 0.78)',
  },
  buttonPrimary: {
    backgroundColor: '#4F6EF7',
    color: '#FFFFFF',
    borderRadius: 10,
    padding: '8px 18px',
    fontWeight: 600,
    fontFamily: 'var(--font-display, "Exo 2", system-ui, sans-serif)',
  },
  buttonBack: {
    color: '#5A6072',
    fontSize: 13,
  },
  buttonSkip: {
    color: '#5A6072',
    fontSize: 13,
  },
  buttonClose: {
    color: '#5A6072',
  },
  overlay: {
    backgroundColor: 'rgba(26, 29, 43, 0.55)',
  },
  arrow: {
    color: '#FFFFFF',
  },
};

export function DashboardTour() {
  const child = useActiveChild();
  const childId = child?.id ?? null;

  const [run, setRun] = useState(false);
  // Defer mount until after hydration so server / client markup matches.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-start: first home visit for this child, desktop viewports only.
  useEffect(() => {
    if (!mounted) return;
    if (!childId) return;
    // Desktop-first: Sidebar anchors are hidden below lg (1024px).
    if (window.innerWidth < MIN_TOUR_WIDTH) return;

    try {
      const done = window.localStorage.getItem(dashboardTourStorageKey(childId));
      if (done === '1') return;
    } catch {
      // localStorage blocked — run once per session, best-effort.
    }

    // Small delay so the entrance animations settle first.
    const timer = window.setTimeout(() => setRun(true), 1000);
    return () => window.clearTimeout(timer);
  }, [mounted, childId]);

  const steps = useMemo(() => STEPS, []);

  const handleEvent = (data: EventData, _controls: Controls) => {
    const finished =
      data.status === 'finished' ||
      data.status === 'skipped' ||
      data.type === 'tour:end';
    if (finished) {
      setRun(false);
      if (childId) {
        try {
          window.localStorage.setItem(dashboardTourStorageKey(childId), '1');
        } catch {}
      }
    }
  };

  if (!mounted || !childId || !run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep={false}
      styles={JOYRIDE_STYLES}
      options={{
        primaryColor: '#4F6EF7',
        backgroundColor: '#FFFFFF',
        textColor: '#1A1D2B',
        arrowColor: '#FFFFFF',
        overlayColor: 'rgba(26, 29, 43, 0.55)',
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

export default DashboardTour;
