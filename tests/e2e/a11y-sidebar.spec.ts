// ════════════════════════════════════════════════════════════════
// P2 §8.5 — Sidebar / dashboard a11y end-to-end audit
// ════════════════════════════════════════════════════════════════
// Runs @axe-core/playwright against key dashboard routes and asserts
// there are zero WCAG 2.1 AA violations in the sidebar + skip-link
// infrastructure.
//
// Uses the public marketing page by default (auth isn't required
// for the a11y of the layout shell itself). Extend this suite as
// more dashboard flows become seedable.

import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('P2 §8.5 — dashboard a11y', () => {
  test('marketing home page has zero WCAG AA violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test('skip-link exists and is keyboard-reachable', async ({ page }) => {
    await page.goto('/');
    // Tab once — first focusable thing on every layout should be the skip link.
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const text = await focused.textContent();
    expect(text).toMatch(/skip to main content/i);
  });
});
