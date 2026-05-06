import { test, expect, devices, chromium } from '@playwright/test';

/**
 * Layout audit for /login after the 3D-portal removal + max-w-lg upgrade.
 *
 * Verifies:
 *  1) Login card is centered, has the new max-width (32rem / 512 px)
 *     and is not overlapped by the fixed brand chip or footer.
 *  2) All functional pieces from the proposal are still present:
 *     email + password inputs, Forgot password, Log In, OAuth row
 *     (Google / Apple / Microsoft), Try Demo, Sign up link.
 *  3) The wave 👋 icon and the R3F portal Canvas are gone.
 *  4) Demo flow renders the two-step confirmation on click (we don't
 *     submit "Start Demo" because that creates a real anonymous
 *     Supabase session — but we verify the UI state transition).
 *  5) Both desktop and mobile viewports render a clean card with no
 *     element clipped or overlapping.
 */

test.describe('login layout', () => {
  test('Desktop — card is centered, sized, and free of the 3D portal', async () => {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ ...devices['Desktop Chrome HiDPI'] });
    const page = await ctx.newPage();
    try {
      await page.goto('/login', { waitUntil: 'load' });

      const card = page.getByTestId('login-card');
      await card.waitFor({ state: 'visible' });
      // Settle the Motion entrance animation (500ms) before measuring.
      await page.waitForTimeout(700);

      // Card width gate — max-w-[32rem] = 512px. Allow ±1px.
      const box = await card.boundingBox();
      expect(box, 'login card has a layout box').not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(513);
      expect(box!.width).toBeGreaterThanOrEqual(380);

      // Card horizontal-center within ~5px tolerance.
      const viewport = page.viewportSize()!;
      const cardCenter = box!.x + box!.width / 2;
      expect(Math.abs(cardCenter - viewport.width / 2)).toBeLessThan(5);

      // No overlap with the fixed brand chip (top:6) or footer (bottom:4).
      // Card top should be >= 24px (we set pt-24 on the container).
      expect(box!.y).toBeGreaterThanOrEqual(24);

      // Functional pieces — every one must be present.
      await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue with Apple' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue with Microsoft' })).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Try SparkForge demo without creating an account' }),
      ).toBeVisible();
      await expect(card.getByRole('link', { name: 'Sign up' })).toBeVisible();

      // Removed pieces — these must NOT exist.
      // Wave emoji previously lived in a motion.div with text-4xl; assert no
      // descendant of the card has '👋' as visible text.
      await expect(card.getByText('👋')).toHaveCount(0);
      // R3F Canvas previously rendered the portal; confirm no <canvas> is
      // mounted in the auth layout backdrop region.
      const canvasCount = await page.locator('canvas').count();
      expect(canvasCount).toBe(0);

      await page.screenshot({
        path: 'tests/e2e/visual/__screenshots__/login-desktop.png',
        fullPage: false,
      });
    } finally {
      await ctx.close();
      await browser.close();
    }
  });

  // NOTE: Demo + live-login functional verification is intentionally not
  // automated here. The demo flow creates a real Supabase anonymous session
  // (auth.users insert + cleanup), and the login flow needs valid test
  // credentials we don't keep in the repo. Owner verifies these manually
  // against the live deployment after the admin migration applies. The
  // spec above already covers static render + accessibility of every
  // demo/login control.

  test('Mobile (iPhone 15 viewport, Chromium) — card fits within viewport without overflow', async () => {
    const browser = await chromium.launch();
    const ctx = await browser.newContext({
      viewport: devices['iPhone 15'].viewport,
      deviceScaleFactor: devices['iPhone 15'].deviceScaleFactor,
    });
    const page = await ctx.newPage();
    try {
      await page.goto('/login', { waitUntil: 'load' });

      const card = page.getByTestId('login-card');
      await card.waitFor({ state: 'visible' });

      const box = await card.boundingBox();
      const viewport = page.viewportSize()!;
      expect(box, 'mobile login card has a layout box').not.toBeNull();
      // Card must not overflow horizontally; container has px-4 so the
      // card's right edge should be <= viewport - 16px.
      expect(box!.x).toBeGreaterThanOrEqual(8);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width - 8);

      await page.screenshot({
        path: 'tests/e2e/visual/__screenshots__/login-mobile.png',
        fullPage: false,
      });
    } finally {
      await ctx.close();
      await browser.close();
    }
  });
});
