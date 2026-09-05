import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ForgeLabHub } from '@/components/forge-lab/ForgeLabHub';
import { PREVIEW_PROGRESS, PREVIEW_STATS } from '@/lib/forge-lab/catalog';

vi.mock('next/image', () => ({
  default: (props: { alt?: string }) => <span data-testid="plate" aria-hidden="true">{props.alt}</span>,
}));

vi.mock('@/hooks/useSafeMotion', () => ({
  useSafeMotion: () => true,
}));

vi.mock('@/components/forge-lab/forge-lab.css', () => ({}));

function renderHub() {
  return render(
    <ForgeLabHub
      stats={PREVIEW_STATS}
      progress={PREVIEW_PROGRESS}
      preview
      backHref="/"
    />,
  );
}

describe('ForgeLabHub a11y + reduced motion', () => {
  it('exposes focusable hotspots and a lab listbox after skip-to-docked', async () => {
    const user = userEvent.setup();
    renderHub();

    const core = screen.getByRole('button', {
      name: 'SparkForge core. Press Enter to emit hologram panels.',
    });
    expect(core).toBeTruthy();
    expect(screen.getByRole('button', { name: /top monitor bay/i })).toBeTruthy();

    await user.click(core);

    const listbox = screen.getByRole('listbox', { name: /learning labs/i });
    expect(listbox).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(11);
    expect(document.querySelector('[data-slot="game-shell"]')).toBeTruthy();
    expect(screen.getByRole('meter', { name: /xp 345, level 4/i })).toBeTruthy();
    expect(screen.getByRole('meter', { name: /7 day streak/i })).toBeTruthy();

    const left = document.querySelector('.fl-panel[data-side="left"]') as HTMLElement;
    const right = document.querySelector('.fl-panel[data-side="right"]') as HTMLElement;
    const monitor = document.querySelector('.fl-monitor') as HTMLElement;
    expect(left.getAttribute('data-yaw')).toBe('-5');
    expect(right.getAttribute('data-yaw')).toBe('5');
    expect(monitor.getAttribute('data-yaw')).toBe('0');
    expect(left.style.transform).toContain('rotateY(-5deg)');
    expect(right.style.transform).toContain('rotateY(5deg)');
    expect(left.style.transformOrigin).toBe('right center');
    expect(right.style.transformOrigin).toBe('left center');
  });

  it('opens the avatar stub and retracts panels', async () => {
    const user = userEvent.setup();
    renderHub();
    await user.click(
      screen.getByRole('button', {
        name: 'SparkForge core. Press Enter to emit hologram panels.',
      }),
    );
    await user.click(screen.getByRole('button', { name: /avatar kit/i }));
    expect(screen.getByRole('dialog', { name: /avatar forge/i })).toBeTruthy();
    expect(document.querySelector('[data-slot="avatar-creator"]')).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /avatar forge/i })).toBeNull();
  });
});
