// ════════════════════════════════════════════════════════════════
// P2 §8.6 — Game focus containment (e2e)
// ════════════════════════════════════════════════════════════════
// Playwright verification that Tab navigation during an active game
// stays contained within the game region. Also checks that when a
// celebration fires on game completion, focus lands inside the
// celebration panel (its own FocusTrap) rather than the cockpit
// background.
//
// NOTE: this suite requires an auth-seeded test user + an unlocked
// game. Until the seed infrastructure exists it stays skipped by
// default (test.skip) — present as scaffolding so the hand-off
// between FocusTrap release + CelebrationOverlay FocusTrap capture
// gets a real-browser regression net the moment seed lands.

import { test, expect } from '@playwright/test';

test.describe('P2 §8.6 — game focus containment', () => {
  test.skip('focus stays within the game region while active', async ({ page }) => {
    await page.goto('/arcade/ai-spy');
    // Wait for game region to mount.
    await page.locator('[data-game-id="ai-spy"]').waitFor({ state: 'visible' });

    // Tab 20 times — focus should NEVER escape [data-game-id].
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const inGame = await page.evaluate(() => {
        const game = document.querySelector('[data-game-id]');
        return game?.contains(document.activeElement) ?? false;
      });
      expect(inGame, `Tab #${i}: focus escaped game region`).toBe(true);
    }
  });

  test.skip('celebration FocusTrap takes over on completion', async ({ page }) => {
    await page.goto('/arcade/ai-spy');
    // … play through all rounds (requires game-seed helper) …
    // On game complete, a celebration modal mounts.
    await page.locator('[role="alertdialog"]').waitFor({ state: 'visible' });
    // Focus should now be inside the celebration, not the cockpit.
    const inCelebration = await page.evaluate(() => {
      const cel = document.querySelector('[role="alertdialog"]');
      return cel?.contains(document.activeElement) ?? false;
    });
    expect(inCelebration).toBe(true);
  });
});
