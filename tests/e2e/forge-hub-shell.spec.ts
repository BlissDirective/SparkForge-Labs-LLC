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
});
