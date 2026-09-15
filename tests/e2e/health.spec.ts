import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('homepage loads without errors', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(500);
  });

  test('health endpoint returns a contract payload', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();
    // DEPLOY-HIGH-003: payload uses `overall`, not `status`.
    // CI uses a placeholder Supabase URL, so the DB probe is unhealthy → 503.
    expect(['healthy', 'degraded', 'unhealthy']).toContain(body.overall);
    if (body.overall === 'unhealthy') {
      expect(response.status()).toBe(503);
    } else {
      expect(response.ok()).toBeTruthy();
    }
  });

  test('forge hub room shell is reachable', async ({ page }) => {
    const response = await page.goto('/dev/forge-hub');
    expect(response?.status()).toBeLessThan(500);
    await expect(
      page.getByRole('heading', { name: 'Forge Hub', exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-screen-kit',
      'w2',
    );
    await expect(page.getByTestId('forge-hub-toast-rail')).toBeVisible();
  });
});
