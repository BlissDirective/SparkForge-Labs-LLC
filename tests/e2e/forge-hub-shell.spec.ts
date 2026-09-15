import { test, expect } from '@playwright/test';

test.describe('W1-01 /dev/forge-hub room shell', () => {
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
});
