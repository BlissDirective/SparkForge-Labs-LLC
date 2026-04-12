'use client';

import { useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useAuthStore } from '@/stores/authStore';

// Sidebar — Accessibility-Only Navigation (Q2:B)
// ════════════════════════════════════════════════════
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
  { href: '/parent', label: 'Parent' },
];

// v3 Gap 1/3: Admin-only nav items (hidden from non-admins via is_admin check)
const ADMIN_NAV_ITEMS = [
  { href: '/admin/content', label: 'Admin — Content Queue' },
  { href: '/admin/subscriptions', label: 'Admin — Subscriptions' },
];

export function Sidebar() {
  const pathname = usePathname();
  const broadcast = useCockpitBroadcast((s) => s.broadcast);
  const isAdmin = useAuthStore((s) => s.parent?.is_admin);
  const navRef = useRef<HTMLElement>(null);

  // Merge admin items after the base list when the user is an admin
  const navItems = isAdmin ? [...BASE_NAV_ITEMS, ...ADMIN_NAV_ITEMS] : BASE_NAV_ITEMS;

  // Keyboard navigation — arrow keys cycle items, Enter activates
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
      }
    },
    []
  );

  return (
    <nav
      ref={navRef}
      className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:left-4 focus-within:top-4 focus-within:z-50 focus-within:bg-surface-deep/95 focus-within:backdrop-blur-xl focus-within:rounded-xl focus-within:p-3 focus-within:border focus-within:border-white/10 focus-within:shadow-lg"
      role="navigation"
      aria-label="Main navigation"
    >
      <ul className="space-y-1">
        {navItems.map((item, index) => {
          const isActive = pathname?.startsWith(item.href) || false;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                data-nav-item
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
    </nav>
  );
}
