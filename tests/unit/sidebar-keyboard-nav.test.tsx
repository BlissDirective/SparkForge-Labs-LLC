// ════════════════════════════════════════════════════════════════
// Sidebar navigation contract (post v2 HTML redesign)
// ════════════════════════════════════════════════════════════════
// The v2 UI/UX redesign replaced the 3D-cockpit sidebar (custom
// arrow-key cycling + nav-focus broadcast to the cockpit + data-nav-item
// attributes) with a standard, accessible HTML <nav> of real links that
// uses native Tab focus order. This test locks in the new contract:
// a nav of real, keyboard-reachable links with an active-route marker.

import { render as rtlRender, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';

vi.mock('next/navigation', () => ({
  usePathname: () => '/home',
}));

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(() => Promise.resolve([])),
  csrfHeader: vi.fn(() => ({})),
}));

// ChildProfileMini reads the active child via React Query.
function render(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return rtlRender(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Sidebar navigation (HTML-first)', () => {
  it('renders the primary nav items as real links', () => {
    render(<Sidebar />);
    const links = screen.getAllByRole('link');
    // Standard dashboard nav (Home, Arcade, Labs, Story, Buddies, Seasons,
    // Mastery, Create, Progress, Rewards, Parent, Settings, Help) + logo.
    expect(links.length).toBeGreaterThanOrEqual(10);

    for (const label of ['Home', 'Arcade', 'Labs', 'Progress', 'Settings']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('every nav item is an anchor with an href (keyboard-reachable)', () => {
    render(<Sidebar />);
    const links = screen.getAllByRole('link');
    for (const link of links) {
      expect(link.tagName).toBe('A');
      expect(link.getAttribute('href')).toBeTruthy();
    }
  });

  it('marks the active route via aria-current', () => {
    render(<Sidebar />);
    // usePathname is mocked to '/home', so the Home nav link is current.
    const home = screen.getByText('Home').closest('a');
    expect(home).toBeTruthy();
    expect(home?.getAttribute('aria-current')).toBe('page');
  });
});
