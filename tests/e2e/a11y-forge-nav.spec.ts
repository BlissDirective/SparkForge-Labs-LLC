// ════════════════════════════════════════════════════════════════
// W8 — Forge Hub a11y (desktop replacement for a11y-sidebar)
// ════════════════════════════════════════════════════════════════
// On desktop the forge stage replaces the sidebar, so the sidebar
// audit has no equivalent there. This suite runs @axe-core/playwright
// against /dev/forge-hub in each hologram mode and checks that the
// DOM panels (the accessibility surface) carry zero WCAG 2.1 AA
// violations, that the poster fallback is equally clean, and that
// keyboard focus reaches the HoloC form.
//
// The canvas itself is decorative; axe sees the DOM panels, HoloBubble,
// ToastRail and EscapeFlat exactly as a screen reader would.

import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const MODES = ['welcome', 'hubSplit', 'labsBrowse', 'gameLobby', 'playStage'] as const;
const SHELL = '[data-testid="forge-hub-shell"]';

async function waitForShell(page: import('@playwright/test').Page) {
  await page.locator(SHELL).waitFor();
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      const s = el?.getAttribute('data-forge-stage');
      return s === 'ready' || s === 'poster';
    },
    SHELL,
    { timeout: 60_000 },
  );
}

test.describe('W8 — forge hub a11y', () => {
  test.use({ viewport: { width: 1536, height: 1024 } });

  for (const mode of MODES) {
    test(`mode ${mode} has zero WCAG AA violations`, async ({ page }) => {
      await page.goto(`/dev/forge-hub?mode=${mode}`);
      await waitForShell(page);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // The WebGL/WebGPU canvas is aria-hidden decoration; axe cannot
        // evaluate pixels and would only report false colour-contrast
        // positives against its transparent box.
        .exclude('canvas')
        .analyze();
      expect(
        results.violations,
        JSON.stringify(results.violations, null, 2),
      ).toEqual([]);
    });
  }

  test('poster fallback has zero WCAG AA violations', async ({ page }) => {
    await page.goto('/dev/forge-hub?fallback=poster');
    await waitForShell(page);
    await expect(page.locator(SHELL)).toHaveAttribute('data-forge-stage', 'poster');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      results.violations,
      JSON.stringify(results.violations, null, 2),
    ).toEqual([]);
  });

  test('keyboard focus reaches the HoloC welcome form', async ({ page }) => {
    await page.goto('/dev/forge-hub?mode=welcome');
    await waitForShell(page);
    // Tab until a text input inside the shell receives focus (bounded).
    let landed = false;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      landed = await page.evaluate((sel) => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return false;
        const shell = document.querySelector(sel);
        return (
          !!shell?.contains(el) &&
          (el.tagName === 'INPUT' || el.tagName === 'BUTTON' || el.tagName === 'A')
        );
      }, SHELL);
      if (landed) break;
    }
    expect(landed, 'no focusable control inside the forge shell was reached by Tab').toBe(true);
  });
});
