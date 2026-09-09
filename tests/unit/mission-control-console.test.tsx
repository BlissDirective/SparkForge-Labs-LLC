import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MissionControlConsole } from '@/components/mission-control/MissionControlConsole';
import {
  PREVIEW_PROGRESS,
  PREVIEW_STATS,
  buildLabInstruments,
} from '@/components/mission-control/labInstruments';

vi.mock('@/components/mission-control/SpaceLabBackdrop', () => ({
  SpaceLabBackdrop: () => <div data-testid="mc-backdrop" />,
}));

vi.mock('@/components/sparky/SparkyCore', () => ({
  SparkyCore: () => <div data-testid="mc-sparky">Sparky</div>,
}));

vi.mock('@/components/mission-control/mission-control.css', () => ({}));

function renderConsole(
  overrides: Partial<React.ComponentProps<typeof MissionControlConsole>> = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MissionControlConsole
        stats={PREVIEW_STATS}
        labs={buildLabInstruments(PREVIEW_PROGRESS)}
        allowCanvas={false}
        reducedMotion
        preview
        {...overrides}
      />
    </QueryClientProvider>,
  );
}

describe('MissionControlConsole a11y + IA', () => {
  it('exposes a labeled lab listbox with 11 options and a GameShell slot', () => {
    renderConsole();
    const listbox = screen.getByRole('listbox', { name: /learning labs/i });
    expect(listbox).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(11);
    expect(screen.getByTestId('mc-sparky')).toBeTruthy();
    const bay = document.querySelector('[data-slot="lab-content"]');
    expect(bay).toBeTruthy();
    expect(bay?.getAttribute('aria-label') ?? '').toMatch(/gameshell/i);
  });

  it('keeps XP and streak as gauges, not generic stat cards', () => {
    renderConsole();
    expect(screen.getByRole('img', { name: /xp 345, level 4/i })).toBeTruthy();
    expect(screen.getByRole('img', { name: /7 day streak/i })).toBeTruthy();
  });

  it('moves selection with arrow keys and updates aria-selected', async () => {
    const user = userEvent.setup();
    renderConsole();
    const options = screen.getAllByRole('option');
    const firstSelected = options.find((o) => o.getAttribute('aria-selected') === 'true');
    expect(firstSelected).toBeTruthy();
    firstSelected!.focus();
    await user.keyboard('{ArrowRight}');
    const next = options.find((o) => o.getAttribute('aria-selected') === 'true');
    expect(next).toBeTruthy();
    expect(next?.id).not.toBe(firstSelected?.id);
  });

  it('labels each pod with lab name, progress, and game count', () => {
    renderConsole();
    const first = screen.getByRole('option', { name: /lab 1:/i });
    expect(first.getAttribute('aria-label') ?? '').toMatch(/percent complete/i);
    expect(first.getAttribute('aria-label') ?? '').toMatch(/games/i);
  });
});
