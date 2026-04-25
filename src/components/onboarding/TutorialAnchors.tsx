'use client';

// ════════════════════════════════════════════════════════════════
// TutorialAnchors — T11 UX-MED-003 (Opt A)
// ════════════════════════════════════════════════════════════════
// Invisible (1×1) positioned anchor divs that the Joyride cockpit
// tour targets. The dashboard is rendered in 3D (no HTML widgets
// for buttons/HUD), so we drop transparent markers at the screen
// coordinates where each 3D element appears.
//
// pointer-events-none + aria-hidden keeps them from ever
// intercepting input or being announced by screen readers. They
// are only meaningful to Joyride's tooltip positioner.
// ════════════════════════════════════════════════════════════════

export function TutorialAnchors() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {/* HUD strip — top center (holographic viewport frame corners) */}
      <div
        data-tutorial="hud"
        className="absolute left-1/2 top-10 h-px w-px -translate-x-1/2"
      />
      {/* NavigationButtonGrid — lower-center cluster.
          HOME (left), ARCADE (center), LABS (back-left),
          SETTINGS / PROFILE (right). These anchors sit just
          above the grid on screen so tooltips point down at
          the correct area. */}
      <div
        data-tutorial="nav-labs"
        className="absolute bottom-[22%] left-[40%] h-px w-px"
      />
      <div
        data-tutorial="nav-arcade"
        className="absolute bottom-[22%] left-1/2 h-px w-px -translate-x-1/2"
      />
      <div
        data-tutorial="nav-profile"
        className="absolute bottom-[22%] right-[36%] h-px w-px"
      />
      <div
        data-tutorial="nav-settings"
        className="absolute right-6 top-24 h-px w-px"
      />
    </div>
  );
}

export default TutorialAnchors;
