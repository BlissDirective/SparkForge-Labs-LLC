// ════════════════════════════════════════════════════════════════
// Phase 8 — Study Buddies (/buddies) click-through
// ════════════════════════════════════════════════════════════════
// Validates the route is auth-protected, the API endpoints gate on
// auth, and the page renders end-to-end for a demo (anonymous) session.
//
// Note: demo sessions are anonymous and cannot own child profiles
// (see src/lib/api-helpers.ts), so /buddies shows its graceful
// "pick a profile first" state. The full panel + invite/redeem/message
// flow is validated separately against the live DB (see PR notes); this
// suite covers routing, auth gating, render, and navigation.

import { test, expect } from '@playwright/test';

test.describe('Phase 8 — Study Buddies', () => {
  test('/buddies is auth-protected (redirects to login)', async ({ page }) => {
    await page.goto('/buddies');
    await expect(page).toHaveURL(/\/login/);
  });

  test('social API endpoints reject unauthenticated requests', async ({ request }) => {
    const friends = await request.get('/api/friends?childId=00000000-0000-0000-0000-000000000000');
    expect(friends.status()).toBe(401);

    const quests = await request.get('/api/buddy-quests?childId=00000000-0000-0000-0000-000000000000');
    expect(quests.status()).toBe(401);

    const messages = await request.get('/api/messages?childId=00000000-0000-0000-0000-000000000000');
    expect(messages.status()).toBe(401);
  });

  test('renders for a demo session and exposes the Buddies nav', async ({ page }) => {
    // Start a demo (anonymous) session via the login page CTA.
    await page.goto('/login');
    const demoBtn = page.getByRole('button', { name: /start demo session/i });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // Demo redirects into the dashboard.
    await page.waitForURL(/\/home/, { timeout: 45_000 });

    // Navigate to the new Study Buddies route.
    await page.goto('/buddies');

    // Demo has no child profile → graceful empty state renders (no crash).
    await expect(page.getByText(/pick a profile first/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('link', { name: /back to home/i })).toBeVisible();

    // The Buddies entry is present in the desktop sidebar navigation.
    await expect(page.getByRole('link', { name: /^buddies$/i }).first()).toBeVisible();
  });
});
