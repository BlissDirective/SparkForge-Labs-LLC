import { test, expect } from '@playwright/test';

test.describe('W1 /dev/forge-hub room shell + portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('sparkforge:cookie-notice:dismissed', '1');
    });
  });
  test('loads the room shell with HTML LCP heading', async ({ page }) => {
    const response = await page.goto('/dev/forge-hub');
    expect(response?.status()).toBeLessThan(500);
    await expect(
      page.getByRole('heading', { name: 'Forge Hub', exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('forge-hub-shell')).toBeVisible();
    await page.screenshot({
      path: 'test-results/forge-hub-shell.png',
      fullPage: true,
    });
  });

  test('pose=lock freezes the hub camera for the SSIM stub', async ({ page }) => {
    await page.goto('/dev/forge-hub?pose=lock');
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-pose',
      'lock',
    );
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-breathe',
      'off',
    );
    await page.screenshot({
      path: 'test-results/forge-hub-pose-lock.png',
      fullPage: true,
    });
  });

  test('?fallback=poster keeps the display still without a canvas', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster');
    const shell = page.getByTestId('forge-hub-shell');
    await expect(shell).toHaveAttribute('data-forge-stage', 'poster');
    await expect(page.locator('canvas')).toHaveCount(0);
    await page.screenshot({
      path: 'test-results/forge-hub-poster-fallback.png',
      fullPage: true,
    });
  });

  test('ignite walks idle → charge → emit → docked', async ({ page }) => {
    await page.goto('/dev/forge-hub');
    const shell = page.locator('[data-testid="forge-hub-shell"][data-forge-portal]');
    await expect(shell).toHaveAttribute('data-forge-portal', 'idle');
    await page.getByTestId('forge-hub-ignite').click();
    await expect(shell).toHaveAttribute('data-forge-portal', 'charge');
    // Charge 420ms + emit 560ms; allow main-thread jank from GPU probe.
    await expect(shell).toHaveAttribute('data-forge-portal', 'emit', {
      timeout: 5000,
    });
    await expect(shell).toHaveAttribute('data-forge-portal', 'docked', {
      timeout: 5000,
    });
    await page.screenshot({
      path: 'test-results/forge-hub-portal-docked.png',
      fullPage: true,
    });
  });

  test('reduced motion skips charge/emit and jumps to docked', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dev/forge-hub');
    await page.getByTestId('forge-hub-ignite').click();
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-portal',
      'docked',
    );
  });

  test('pose=lock stays idle with no ignite control', async ({ page }) => {
    await page.goto('/dev/forge-hub?pose=lock');
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-portal',
      'idle',
    );
    await expect(page.getByTestId('forge-hub-ignite')).toHaveCount(0);
  });

  test('lock-pose glass trio is marked on the shell', async ({ page }) => {
    await page.goto('/dev/forge-hub');
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-glass',
      'trio',
      { timeout: 15_000 },
    );
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-breathe',
      'on',
    );
  });

  test('?fallback=poster shows CSS glass overlays over the still', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster');
    const shell = page.getByTestId('forge-hub-shell');
    await expect(shell).toHaveAttribute('data-forge-stage', 'poster');
    await expect(shell).toHaveAttribute('data-forge-glass', 'trio');
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.getByTestId('forge-hub-glass-holoL')).toBeVisible();
    await expect(page.getByTestId('forge-hub-glass-holoC')).toBeVisible();
    await expect(page.getByTestId('forge-hub-glass-holoR')).toBeVisible();
    await page.screenshot({
      path: 'test-results/forge-hub-poster-glass.png',
      fullPage: true,
    });
  });

  test('director HUD can trigger emit-burst and a morph', async ({ page }) => {
    await page.goto('/dev/forge-hub');
    const shell = page.getByTestId('forge-hub-shell');
    await expect(page.getByTestId('forge-hub-director')).toBeVisible();
    await page.getByTestId('forge-hub-director-emit').click();
    await expect(shell).toHaveAttribute('data-forge-director', 'emit-burst');
    await expect(shell).toHaveAttribute('data-forge-portal', 'charge');
    await expect(shell).toHaveAttribute('data-forge-portal', 'docked', {
      timeout: 5000,
    });
    await page.getByTestId('forge-hub-director-morph').click();
    await expect(shell).toHaveAttribute(
      'data-forge-director',
      'login-success-hubsplit',
    );
    await expect(page.getByTestId('forge-hub-director-scrub')).toBeVisible();
  });

  test('reduced motion freezes breathe on the poster path', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dev/forge-hub?fallback=poster');
    const shell = page.getByTestId('forge-hub-shell');
    await expect(shell).toHaveAttribute('data-forge-breathe', 'off');
    await expect(page.getByTestId('forge-hub-glass-holoL')).toBeVisible();
    const animation = await page
      .getByTestId('forge-hub-glass-holoL')
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(animation).toContain('forge-hub-rm-crossfade');
  });

  test('HoloPanel reading plates sit on HoloL / HoloC / HoloR', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster');
    const shell = page.getByTestId('forge-hub-shell');
    await expect(shell).toHaveAttribute('data-forge-screen-kit', 'w2');
    await expect(shell).toHaveAttribute('data-forge-mode', 'hubSplit');
    await expect(page.getByTestId('forge-hub-holo-holoL')).toBeVisible();
    await expect(page.getByTestId('forge-hub-holo-holoC')).toBeVisible();
    await expect(page.getByTestId('forge-hub-holo-holoR')).toBeVisible();
    await expect(
      page.getByRole('region', { name: "Today's mission" }),
    ).toBeVisible();
    const fill = await page
      .getByTestId('forge-hub-holo-holoC')
      .evaluate((el) =>
        getComputedStyle(el.querySelector('.fh-holo-panel__plate')!).backgroundColor,
      );
    expect(fill).toMatch(/rgba?\(6,\s*14,\s*28/);
    await page.screenshot({
      path: 'test-results/forge-hub-holo-panels.png',
      fullPage: true,
    });
  });

  test('mode switcher reseats PlayStage to a single merged plate', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster');
    await page.getByTestId('forge-hub-mode-switch').selectOption('playStage');
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-mode',
      'playStage',
    );
    await expect(page.getByTestId('forge-hub-holo-holoC')).toBeVisible();
    await expect(page.getByTestId('forge-hub-holo-holoL')).toHaveCount(0);
    await expect(page.getByTestId('forge-hub-holo-holoR')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'PlayStage' })).toBeVisible();
  });

  test('welcome query reseats sides to 85 percent and keeps HoloC', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster&mode=welcome');
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-mode',
      'welcome',
    );
    await expect(
      page.getByRole('region', { name: 'Welcome to SparkForge' }),
    ).toBeVisible();
    await expect(page.getByTestId('forge-hub-holo-holoL')).toBeVisible();
    await expect(page.getByTestId('forge-hub-holo-holoR')).toBeVisible();
  });

  test('pose=lock hides reading plates so the SSIM trio stays empty glass', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?pose=lock');
    await expect(page.getByTestId('forge-hub-holo-layer')).toHaveCount(0);
    await expect(page.getByTestId('forge-hub-mode-switch')).toHaveCount(0);
  });
});
