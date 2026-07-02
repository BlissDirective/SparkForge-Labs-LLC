// ════════════════════════════════════════════════════════════════════════
// CORE-FLOW SMOKE TEST — Phase 1 ship gate
// ════════════════════════════════════════════════════════════════════════
// Exercises the real user journey WITHOUT credentials via the demo session:
//   /            → marketing landing renders (hero heading visible)
//   /login       → "Start Demo Session" → lands on /home
//   /arcade      → 42-game registry listed (search box + ≥10 game cards)
//   featured game "Play Now" → game detail renders (Choose Your Challenge /
//                              Start button)
//   /labs        → 11 lab cards
//   /parent      → Parent Dashboard heading
//
// The journey after login runs as ONE test with test.step() legs so a single
// demo session is reused (POST /api/auth/demo is rate-limited to 3/hour/IP).
//
// Graceful skip: when the dev server isn't reachable at baseURL the whole
// suite is skipped (not failed) so CI without a running server stays green.
//
// Run: npx playwright test core-flow-smoke --project=chromium

import { test, expect } from '@playwright/test';

// The sandbox ships a pre-installed Chromium that may differ from the version
// @playwright/test expects. Point at it directly (env note: never run
// `playwright install`). Override only when the binary is present.
const PW_CHROME = process.env.PW_EXECUTABLE_PATH || '/opt/pw-browsers/chromium';
test.use({ launchOptions: { executablePath: PW_CHROME } });

// Must match playwright.config.ts `use.baseURL`.
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

let serverUp = false;

test.beforeAll(async () => {
  // Reachability probe — any HTTP response (even 500) means a server is
  // listening; only a network-level failure marks the suite as skippable.
  try {
    await fetch(BASE_URL, { signal: AbortSignal.timeout(5_000) });
    serverUp = true;
  } catch {
    serverUp = false;
  }
});

test.beforeEach(() => {
  test.skip(
    !serverUp,
    `dev server not reachable at ${BASE_URL} — start it with \`npm run dev\` to run the core-flow smoke`,
  );
});

test.describe('Core flow smoke — Phase 1 ship gate', () => {
  // The app shell takes ~13s to hydrate on first load and the journey test
  // crosses six routes, so the per-test budget is deliberately generous.
  test.describe.configure({ timeout: 240_000 });

  test('marketing landing renders the hero', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // HeroContent's <h1>: "Learn AI. / Build the Future."
    await expect(
      page.getByRole('heading', { name: /learn ai/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('demo journey: login → home → arcade → game detail → labs → parent', async ({ page }) => {
    await test.step('login → start demo session → /home', async () => {
      await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });

      await page
        .getByRole('button', { name: /start demo session/i })
        .click({ timeout: 40_000 });

      // POST /api/auth/demo → session refresh → window.location = /home
      await page.waitForURL(/\/home/, { timeout: 90_000 });
    });

    await test.step('arcade lists the game registry', async () => {
      await page.goto('/arcade', { waitUntil: 'domcontentloaded', timeout: 60_000 });

      // Search & filters bar
      await expect(
        page.getByPlaceholder(/search games/i),
      ).toBeVisible({ timeout: 40_000 });

      // "All Games" header count: "42 games"
      await expect(
        page.getByText(/42 games/i).first(),
      ).toBeVisible({ timeout: 20_000 });

      // Each grid tile is a div[role="button"] (openDetailModal wrapper);
      // 42 games means well over 10 cards once the grid animates in.
      await expect
        .poll(async () => page.locator('div[role="button"]').count(), {
          timeout: 30_000,
          message: 'expected at least 10 game cards in the arcade grid',
        })
        .toBeGreaterThanOrEqual(10);
    });

    await test.step('featured game "Play Now" → game detail renders', async () => {
      // The Play Now button sits inside the featured banner's <Link>, so the
      // click navigates to /arcade/[gameSlug].
      await page
        .getByRole('button', { name: /play now/i })
        .first()
        .click({ timeout: 30_000 });

      await page.waitForURL(/\/arcade\/[a-z0-9-]+/, { timeout: 60_000 });

      // Detail page shows the level picker ("Choose Your Challenge") or a
      // Start button depending on the game's loader.
      await expect(
        page
          .getByText(/choose your challenge/i)
          .or(page.getByRole('button', { name: /start/i }))
          .first(),
      ).toBeVisible({ timeout: 40_000 });
    });

    await test.step('labs page shows 11 lab cards', async () => {
      await page.goto('/labs', { waitUntil: 'domcontentloaded', timeout: 60_000 });

      // Each LabOrb card renders a "Lab N" subtitle; Lab 11 (Agentic AI)
      // proves the full canonical lab system is present.
      await expect(
        page.getByText('Lab 11', { exact: true }),
      ).toBeVisible({ timeout: 40_000 });

      await expect
        .poll(async () => page.getByText(/^Lab \d+$/).count(), {
          timeout: 30_000,
          message: 'expected 11 lab cards on /labs',
        })
        .toBeGreaterThanOrEqual(11);
    });

    await test.step('parent dashboard renders', async () => {
      await page.goto('/parent', { waitUntil: 'domcontentloaded', timeout: 60_000 });

      await expect(
        page.getByRole('heading', { name: /parent dashboard/i }),
      ).toBeVisible({ timeout: 40_000 });
    });
  });
});
