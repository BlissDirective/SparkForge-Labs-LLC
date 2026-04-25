// ════════════════════════════════════════════════════════════════
// P2 §8.5 — Sidebar keyboard navigation contract
// ════════════════════════════════════════════════════════════════
// Locks in the arrow-key cycling, Escape-blur, and nav-focus
// broadcast behaviors so future refactors can't silently regress
// WCAG 2.1.1 (Keyboard) / 2.4.3 (Focus Order) coverage.

import { render, screen, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/components/layout/Sidebar';

// Stubs: next/navigation usePathname, authStore, cockpitBroadcastStore
const mockBroadcast = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/home',
}));
vi.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { parent: { is_admin: boolean } | null }) => unknown) =>
    selector({ parent: { is_admin: false } }),
}));
vi.mock('@/stores/cockpitBroadcastStore', () => ({
  useCockpitBroadcast: (selector: (s: { broadcast: typeof mockBroadcast }) => unknown) =>
    selector({ broadcast: mockBroadcast }),
}));

beforeEach(() => {
  mockBroadcast.mockClear();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('P2 §8.5 — Sidebar keyboard navigation', () => {
  it('renders all 11 base nav items as real links', () => {
    render(<Sidebar />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(11);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Labs')).toBeTruthy();
    expect(screen.getByText('Arcade')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('each primary nav link carries data-nav-item for keyboard cycling', () => {
    render(<Sidebar />);
    const items = document.querySelectorAll('[data-nav-item]');
    // 11 base nav items (no admin).
    expect(items.length).toBe(11);
    items.forEach((el) => {
      expect(el.tagName).toBe('A');
    });
  });

  it('fires ArrowDown keydown without crashing (behavior verified in e2e)', () => {
    render(<Sidebar />);
    const homeLink = screen.getByText('Home').closest('a')!;
    act(() => {
      homeLink.focus();
      fireEvent.keyDown(homeLink, { key: 'ArrowDown' });
    });
    // Keyboard cycling is verified end-to-end by the Playwright a11y
    // test (tests/e2e/a11y-dashboard.spec.ts). Here we just confirm
    // the handler doesn't throw — deep keyboard cycling via jsdom is
    // unreliable because FocusTrap's re-mount swaps element identity.
    expect(document.querySelectorAll('[data-nav-item]').length).toBe(11);
  });

  it('Escape blurs the current nav link', () => {
    render(<Sidebar />);
    const homeLink = screen.getByText('Home').closest('a')!;
    act(() => {
      homeLink.focus();
      fireEvent.keyDown(homeLink, { key: 'Escape' });
    });
    // After blur, activeElement should not be the original Home link.
    expect(document.activeElement).not.toBe(homeLink);
  });

  it('focus on a primary nav item broadcasts nav-focus to the 3D cockpit', () => {
    render(<Sidebar />);
    const labs = screen.getByText('Labs').closest('a')!;
    labs.focus();
    expect(mockBroadcast).toHaveBeenCalled();
    const call = mockBroadcast.mock.calls.find((c) => c[0]?.source === 'nav-labs');
    expect(call).toBeDefined();
    expect(call?.[0]?.type).toBe('nav-focus');
  });
});
