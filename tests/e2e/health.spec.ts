import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('homepage loads without errors', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    // DEPLOY-HIGH-003: payload uses `overall`, not `status`.
    expect(['healthy', 'degraded']).toContain(body.overall);
  });

  test('forge hub room shell is reachable', async ({ page }) => {
    const response = await page.goto('/dev/forge-hub');
    expect(response?.status()).toBeLessThan(500);
    await expect(
      page.getByRole('heading', { name: 'Forge Hub', exact: true }),
    ).toBeVisible();
  });
});
