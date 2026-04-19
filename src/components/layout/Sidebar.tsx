'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FocusTrap from 'focus-trap-react';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useAuthStore } from '@/stores/authStore';

// Sidebar — Accessible HTML Navigation Fallback
// ════════════════════════════════════════════════════
// UX-HIGH-002 (A + B): This is the keyboard + screen-reader fallback
// navigation for the 3D cockpit. Two behaviors combine here:
//
// Option A — HTML nav fallback:
//   Real <Link> elements for HOME/LABS/ARCADE/SETTINGS/PROFILE plus
//   parent-dashboard + admin sub-pages. Visible on keyboard focus;
//   hidden (sr-only) otherwise so it doesn't compete with the 3D UI
//   for sighted mouse users.
//
// Option B — Arrow-key 3D nav bridge:
//   As the user arrow-keys through the sidebar, each focus change
//   broadcasts a `nav-focus` cockpit event carrying the matching
//   3D button id + route. NavigationButtonGrid subscribes and
//   highlights the matching in-canvas button, so the keyboard user
//   sees live visual feedback in the cockpit, not just the HTML
//   panel. Enter activates (via the normal <Link> click path),
//   which also broadcasts `page-navigate`.
//
// Phase 5 O.5-REC (§8.5): retained — auto-focus first item, focus-
// trap-react cycling, Escape closes, arrow keys cycle.

// UX-HIGH-002 (B): `navButtonId` maps an HTML nav item to the
// matching 3D button id in NavigationButtonGrid.tsx. Only the 5
// primary nav buttons have 3D counterparts; sub-pages broadcast
// no nav-focus sync.
const BASE_NAV_ITEMS: Array<{ href: string; label: string; navButtonId?: string }> = [
  { href: '/home', label: 'Home', navButtonId: 'nav-home' },
  { href: '/labs', label: 'Labs', navButtonId: 'nav-labs' },
  { href: '/arcade', label: 'Arcade', navButtonId: 'nav-arcade' },
  { href: '/profile', label: 'Profile', navButtonId: 'nav-profile' },
  { href: '/settings', label: 'Settings', navButtonId: 'nav-settings' },
  { href: '/parent', label: 'Parent Dashboard' },
  { href: '/parent/subscription', label: 'Parent — Subscription & Billing' },
  { href: '/parent/add-child', label: 'Parent — Add Child' },
  { href: '/parent/export', label: 'Parent — Export Data' },
  { href: '/parent/prompt-history', label: 'Parent — Prompt History' },
  { href: '/onboarding', label: 'Onboarding' },
];

// v3 Gap 1/3: Admin-only nav items (hidden from non-admins via is_admin check)
const ADMIN_NAV_ITEMS: Array<{ href: string; label: string; navButtonId?: string }> = [
  { href: '/admin/content', label: 'Admin — Content Queue' },
  { href: '/admin/subscriptions', label: 'Admin — Subscriptions' },
  { href: '/admin/archived-children', label: 'Admin — Archived Children' },
];

export function Sidebar() {
  const pathname = usePathname();
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const isAdmin = useAuthStore((s) => s.parent?.is_admin);
  const navRef = useRef<HTMLElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Focus state — sidebar is visible when focus is within it
  const [isFocused, setIsFocused] = useState(false);

  // Merge admin items after the base list when the user is an admin
  const navItems = isAdmin ? [...BASE_NAV_ITEMS, ...ADMIN_NAV_ITEMS] : BASE_NAV_ITEMS;

  // Keyboard navigation — arrow keys cycle items, Enter activates, Escape closes
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const items =
        navRef.current?.querySelectorAll<HTMLAnchorElement>('[data-nav-item]');
      if (!items) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = items[(index + 1) % items.length];
        next?.focus();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = items[(index - 1 + items.length) % items.length];
        prev?.focus();
      } else if (e.key === 'Escape') {
        // Phase 5 O.5-REC: Escape closes sidebar by blurring the active link.
        // focus-within: CSS then auto-hides the panel.
        e.preventDefault();
        (e.target as HTMLElement)?.blur();
        // Move focus to <body> to fully exit the focus-within trap
        document.body?.focus?.();
      }
    },
    []
  );

  // Auto-focus first nav item when sidebar first receives focus (Phase 5 O.5-REC)
  const handleFocus = useCallback((e: React.FocusEvent) => {
    // Only auto-focus on the nav container itself (not on a child link)
    if (e.target === navRef.current) {
      firstLinkRef.current?.focus();
    }
    setIsFocused(true);
  }, []);

  // Track focus leaving sidebar entirely
  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (!navRef.current?.contains(e.relatedTarget as Node)) {
      setIsFocused(false);
    }
  }, []);

  // Also listen at document level for Escape as a global shortcut
  useEffect(() => {
    if (!isFocused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && navRef.current?.contains(document.activeElement)) {
        (document.activeElement as HTMLElement)?.blur?.();
        setIsFocused(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isFocused]);

  // UX-HIGH-002 (B): broadcast nav-focus on focus change so the 3D
  // NavigationButtonGrid highlights the matching in-canvas button in
  // sync with keyboard traversal. Only fires when the nav item has a
  // 3D counterpart (navButtonId is set).
  const emitNavFocus = useCallback(
    (item: (typeof navItems)[number]) => {
      if (!item.navButtonId) return;
      broadcast({
        type: 'nav-focus',
        source: item.navButtonId,
        label: item.label,
        targetPage: item.href,
      });
    },
    [broadcast],
  );

  const navContent = (
    <ul className="space-y-1" role="list">
      {/* Visible heading — appears only when the panel is expanded so
          sighted keyboard-only users understand what they've activated. */}
      <li className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-spark-blue/90" aria-hidden="true">
        Keyboard Navigation
      </li>
      {navItems.map((item, index) => {
        const isActive = pathname?.startsWith(item.href) || false;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              data-nav-item
              ref={index === 0 ? firstLinkRef : undefined}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={() => emitNavFocus(item)}
              onClick={() => {
                broadcast({
                  type: 'page-navigate',
                  source: `keyboard-nav-${item.label.toLowerCase()}`,
                  label: item.label,
                });
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="block px-3 py-2 rounded-lg font-body text-sm text-white/85 hover:bg-white/10 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-spark-blue/60 focus:text-white"
            >
              {item.label}
            </Link>
          </li>
        );
      })}
      {/* Keyboard-shortcut hint for arrow/enter/esc */}
      <li className="pt-2 px-3 text-[10px] text-white/50" aria-hidden="true">
        ↑↓ navigate · Enter activates · Esc closes
      </li>
    </ul>
  );

  return (
    <nav
      ref={navRef}
      tabIndex={-1}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:left-4 focus-within:top-4 focus-within:z-50 focus-within:w-[260px] focus-within:bg-surface-deep/95 focus-within:backdrop-blur-xl focus-within:rounded-xl focus-within:p-3 focus-within:border focus-within:border-spark-blue/40 focus-within:shadow-[0_0_28px_rgba(0,187,255,0.25)]"
      role="navigation"
      aria-label="Main navigation (press Escape to close)"
    >
      {/* Phase 5 O.5-REC: focus-trap-react activates once focus is within
          the sidebar. Tab cycles within the nav items, Escape + blur
          exits (handled above). */}
      {isFocused ? (
        <FocusTrap
          active={isFocused}
          focusTrapOptions={{
            allowOutsideClick: true,
            escapeDeactivates: true,
            returnFocusOnDeactivate: true,
            clickOutsideDeactivates: true,
          }}
        >
          <div>{navContent}</div>
        </FocusTrap>
      ) : (
        navContent
      )}
    </nav>
  );
}
