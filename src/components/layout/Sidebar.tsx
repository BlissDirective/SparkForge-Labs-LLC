'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FocusTrap from 'focus-trap-react';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useAuthStore } from '@/stores/authStore';

// Sidebar — Accessibility-Only Navigation (Q2:B)
// ════════════════════════════════════════════════════
// Phase 5 O.5-REC (§8.5): Keyboard nav enhancements
//   - Auto-focus first nav item when sidebar reveals via Tab
//   - focus-trap-react wrapping so Tab cycles within sidebar
//   - Escape key closes sidebar (blurs active element)
//   - Arrow keys navigate items (retained from prior version)
//
// The visual HTML sidebar has been REMOVED. Primary navigation is now
// handled by the 3D NavigationButtonGrid in CockpitCanvas.
//
// This component provides:
//   1. Screen-reader-only nav links (sr-only) for accessibility compliance
//   2. Keyboard navigation (Tab + Enter) as fallback
//   3. cockpitBroadcastStore integration for keyboard nav events
//
// The 3D NavigationButtonGrid (src/components/3d/ui/NavigationButtonGrid.tsx)
// renders 5 physical cockpit buttons: HOME, LABS, ARCADE, SETTINGS, PROFILE

const BASE_NAV_ITEMS = [
  { href: '/home', label: 'Home' },
  { href: '/labs', label: 'Labs' },
  { href: '/arcade', label: 'Arcade' },
  { href: '/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
  { href: '/parent', label: 'Parent Dashboard' },
  { href: '/parent/subscription', label: 'Parent — Subscription & Billing' },
  { href: '/parent/add-child', label: 'Parent — Add Child' },
  { href: '/parent/export', label: 'Parent — Export Data' },
  { href: '/parent/prompt-history', label: 'Parent — Prompt History' },
  { href: '/onboarding', label: 'Onboarding' },
];

// v3 Gap 1/3: Admin-only nav items (hidden from non-admins via is_admin check)
const ADMIN_NAV_ITEMS = [
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

  const navContent = (
    <ul className="space-y-1">
      {navItems.map((item, index) => {
        const isActive = pathname?.startsWith(item.href) || false;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              data-nav-item
              ref={index === 0 ? firstLinkRef : undefined}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onClick={() => {
                broadcast({
                  type: 'page-navigate',
                  source: `keyboard-nav-${item.label.toLowerCase()}`,
                  label: item.label,
                });
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="block px-3 py-2 rounded-lg font-body text-sm text-white/80 hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-neon-blue/50"
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav
      ref={navRef}
      tabIndex={-1}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:left-4 focus-within:top-4 focus-within:z-50 focus-within:bg-surface-deep/95 focus-within:backdrop-blur-xl focus-within:rounded-xl focus-within:p-3 focus-within:border focus-within:border-white/10 focus-within:shadow-lg"
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
