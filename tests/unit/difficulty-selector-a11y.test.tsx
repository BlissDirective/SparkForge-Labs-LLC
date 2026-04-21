// ════════════════════════════════════════════════════════════════
// P2 §8.8 — DifficultySelector locked-tier a11y contract
// ════════════════════════════════════════════════════════════════
// Phase 5 P.6-MIN already shipped the tooltip + ARIA fix. This test
// locks the behavior so nobody accidentally deletes it.

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DifficultySelector } from '@/components/games/DifficultySelector';

describe('P2 §8.8 — DifficultySelector a11y', () => {
  it('Band A shows locked Hard + Expert tiers instead of hiding them', () => {
    render(<DifficultySelector value="easy" onChange={vi.fn()} ageBand="A" />);
    expect(screen.getByRole('radio', { name: /hard difficulty/i })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /expert difficulty/i })).toBeTruthy();
  });

  it('locked tier has aria-disabled=true + aria-checked=false', () => {
    render(<DifficultySelector value="easy" onChange={vi.fn()} ageBand="A" />);
    const hard = screen.getByRole('radio', { name: /hard difficulty/i });
    expect(hard.getAttribute('aria-disabled')).toBe('true');
    expect(hard.getAttribute('aria-checked')).toBe('false');
  });

  it('locked tier aria-label includes the unlock reason', () => {
    render(<DifficultySelector value="easy" onChange={vi.fn()} ageBand="A" />);
    const expert = screen.getByRole('radio', { name: /expert difficulty/i });
    expect(expert.getAttribute('aria-label')).toMatch(/locked/i);
    expect(expert.getAttribute('aria-label')).toMatch(/band c|age 13-16/i);
  });

  it('locked tier has a native title tooltip', () => {
    render(<DifficultySelector value="easy" onChange={vi.fn()} ageBand="A" />);
    const hard = screen.getByRole('radio', { name: /hard difficulty/i });
    expect(hard.getAttribute('title')).toMatch(/available at age 10-12/i);
  });

  it('Band C unlocks every tier (none disabled)', () => {
    render(<DifficultySelector value="all" onChange={vi.fn()} ageBand="C" />);
    const radios = screen.getAllByRole('radio');
    radios.forEach((r) => {
      expect(r.getAttribute('aria-disabled')).not.toBe('true');
    });
  });

  it('clicking a locked tier does NOT fire onChange', async () => {
    const onChange = vi.fn();
    render(<DifficultySelector value="easy" onChange={onChange} ageBand="A" />);
    const expert = screen.getByRole('radio', { name: /expert difficulty/i }) as HTMLButtonElement;
    // `disabled` on a button prevents click events from firing.
    expert.click();
    expect(onChange).not.toHaveBeenCalled();
  });
});
