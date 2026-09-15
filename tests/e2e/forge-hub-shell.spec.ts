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
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-rm',
      'on',
    );
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
    await expect(shell).toHaveAttribute('data-forge-rm', 'on');
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
    await expect(page.getByTestId('forge-hub-welcome-login')).toBeVisible();
    await expect(page.getByTestId('forge-hub-login-email')).toBeVisible();
    await expect(page.getByTestId('forge-hub-login-password')).toBeVisible();
    await expect(page.getByTestId('forge-hub-holo-holoL')).toBeVisible();
    await expect(page.getByTestId('forge-hub-holo-holoR')).toBeVisible();
    const transform = await page
      .getByTestId('forge-hub-holo-holoC')
      .evaluate((el) => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(
      true,
    );
  });

  test('toast rail sits on the hub and EscapeFlat covers FLAT', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster');
    await expect(page.getByTestId('forge-hub-toast-rail')).toBeVisible();
    await expect(page.getByTestId('forge-hub-toast-legal')).toBeVisible();
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-route-kind',
      'bridge',
    );
    await page.getByTestId('forge-hub-toast-ping').click();
    await expect(page.getByText('Forge hub ping')).toBeVisible();
    await page.getByTestId('forge-hub-mode-switch').selectOption('flat');
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-flat',
      '1',
    );
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-frameloop',
      'never',
    );
    const overlay = page.getByTestId('forge-hub-escape-flat');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute('data-overlay-crit', '001');
    await page.getByTestId('forge-hub-escape-back').click();
    await expect(page.getByTestId('forge-hub-escape-flat')).toHaveCount(0);
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-mode',
      'hubSplit',
    );
  });

  test('query mode=flat opens EscapeFlat; Escape returns to hub', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster&mode=flat');
    await expect(page.getByTestId('forge-hub-escape-flat')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('forge-hub-escape-flat')).toHaveCount(0);
  });

  test('?calibrate=1 draws slot outlines including hidden PlayStage wings', async ({
    page,
  }) => {
    await page.goto(
      '/dev/forge-hub?fallback=poster&calibrate=1&mode=playStage',
    );
    const shell = page.getByTestId('forge-hub-shell');
    await expect(shell).toHaveAttribute('data-forge-calibrate', '1');
    await expect(shell).toHaveAttribute('data-forge-mode', 'playStage');
    const overlay = page.getByTestId('forge-hub-calibrate');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('[data-forge-calibrate-slot="holoC"]')).toHaveAttribute(
      'data-visible',
      'true',
    );
    await expect(overlay.locator('[data-forge-calibrate-slot="holoL"]')).toHaveAttribute(
      'data-visible',
      'false',
    );
    await expect(page.getByTestId('forge-hub-calibrate-hud')).toContainText(
      'playStage',
    );
    await expect(page.getByTestId('forge-hub-calibrate-hud')).toContainText(
      '420ms',
    );
  });

  test('transition scrubber composes with the Director HUD on the live store', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster');
    await expect(page.getByTestId('forge-hub-director')).toBeVisible();
    await expect(page.getByTestId('forge-hub-director-scrub')).toBeVisible();
    await expect(page.getByTestId('forge-hub-transition-scrubber')).toBeVisible();
    await page
      .getByTestId('forge-hub-transition-id')
      .selectOption('login-success-hubsplit');
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-director',
      'login-success-hubsplit',
    );
    // Paused t=0 of login-success-hubsplit keeps store mode at welcome
    // (Director setForgeMode('welcome') at play). Scrub to 1 lands hubSplit.
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-mode',
      'welcome',
    );
    await page.getByTestId('forge-hub-transition-scrub').evaluate((el) => {
      const input = el as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(input, '40');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.getByTestId('forge-hub-transition-progress')).toContainText(
      '0.40',
    );
    await expect(page.getByTestId('forge-hub-director-id')).toContainText(
      'login-success-hubsplit',
    );
    await page.getByTestId('forge-hub-transition-scrub').evaluate((el) => {
      const input = el as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(input, '100');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-mode',
      'hubSplit',
    );
    await page.getByTestId('forge-hub-director-emit').click();
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-director',
      'emit-burst',
    );
  });

  test('transition scrubber can play remainder morphs onto labsBrowse', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster');
    await expect(page.getByTestId('forge-hub-director')).toBeVisible();
    await expect(page.getByTestId('forge-hub-director-ignition')).toBeVisible();
    await expect(page.getByTestId('forge-hub-director-remainder')).toBeVisible();
    await page.getByTestId('forge-hub-transition-id').selectOption('hub-labsbrowse');
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-director',
      'hub-labsbrowse',
    );
    await page.getByTestId('forge-hub-transition-scrub').evaluate((el) => {
      const input = el as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(input, '100');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-mode',
      'labsBrowse',
    );
    await expect(page.getByRole('region', { name: 'Lab bench' })).toBeVisible();
  });

  test('pose=lock hides reading plates so the SSIM trio stays empty glass', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?pose=lock');
    await expect(page.getByTestId('forge-hub-holo-layer')).toHaveCount(0);
    await expect(page.getByTestId('forge-hub-mode-switch')).toHaveCount(0);
    await expect(page.getByTestId('forge-hub-toast-rail')).toHaveCount(0);
  });

  test('director RM morph and ignition stay on the 200ms substitute', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dev/forge-hub?fallback=poster');
    const shell = page.getByTestId('forge-hub-shell');
    await expect(page.getByTestId('forge-hub-director')).toBeVisible();
    await expect(page.getByTestId('forge-hub-director-id')).toContainText('RM');

    await page.getByTestId('forge-hub-director-emit').click();
    await expect(shell).toHaveAttribute('data-forge-portal', 'docked');
    await expect(shell).toHaveAttribute('data-forge-director', 'emit-burst');

    await page.getByTestId('forge-hub-director-morph').click();
    await expect(shell).toHaveAttribute(
      'data-forge-director',
      'login-success-hubsplit',
    );
    await expect(shell).toHaveAttribute('data-forge-mode', 'hubSplit');
    await expect(page.getByTestId('forge-hub-holo-layer')).toHaveAttribute(
      'data-rm-crossfade',
      '1',
    );

    await page.getByTestId('forge-hub-director-ignition').click();
    await expect(shell).toHaveAttribute('data-forge-mode', 'welcome', {
      timeout: 1000,
    });
  });

  test('Theatre ignition query plays then lands welcome-idle', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster&ignition=1');
    const shell = page.getByTestId('forge-hub-shell');
    await expect(shell).toHaveAttribute('data-forge-ignition', '1');
    await expect(page.getByTestId('forge-hub-director')).toBeVisible();
    await expect(page.getByTestId('forge-hub-director-scrub')).toBeVisible();
    await expect(shell).toHaveAttribute(
      'data-forge-director',
      'first-visit-ignition',
    );
    await expect(page.getByTestId('forge-hub-transition-scrubber')).toBeVisible();
    await expect(page.getByTestId('forge-hub-transition-progress')).toContainText(
      'first-visit-ignition',
    );
    await expect(page.getByTestId('forge-hub-director-ignition')).toBeVisible();
    await expect(shell).toHaveAttribute('data-forge-director', 'welcome-idle', {
      timeout: 4000,
    });
    await expect(shell).toHaveAttribute('data-forge-mode', 'welcome');
  });

  test('click/Space skips Theatre ignition into welcome-idle', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster&ignition=1');
    const shell = page.getByTestId('forge-hub-shell');
    await expect(shell).toHaveAttribute(
      'data-forge-director',
      'first-visit-ignition',
    );
    await page.keyboard.press('Space');
    await expect(shell).toHaveAttribute('data-forge-director', 'welcome-idle');
    await expect(shell).toHaveAttribute('data-forge-mode', 'welcome');
  });

  test('RM skip of ignition is the 200ms welcome substitute', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/dev/forge-hub?fallback=poster&ignition=1');
    const shell = page.getByTestId('forge-hub-shell');
    await expect(shell).toHaveAttribute('data-forge-rm', 'on');
    await expect(page.getByTestId('forge-hub-director')).toBeVisible();
    await expect(page.getByTestId('forge-hub-director-id')).toContainText('RM');
    await expect(shell).toHaveAttribute('data-forge-mode', 'welcome', {
      timeout: 2000,
    });
    await expect(shell).toHaveAttribute('data-forge-director', 'welcome-idle', {
      timeout: 1500,
    });
  });

  test('HoloC login form is live in welcome and stays attached on hubSplit', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster&mode=welcome');
    const form = page.getByTestId('forge-hub-welcome-login');
    await expect(form).toBeVisible();
    await page.getByTestId('forge-hub-login-email').fill('kid@sparkforge.test');
    await page.getByTestId('forge-hub-mode-switch').selectOption('hubSplit');
    await expect(page.getByTestId('forge-hub-shell')).toHaveAttribute(
      'data-forge-mode',
      'hubSplit',
    );
    await expect(form).toBeAttached();
    await expect(form).toBeHidden();
    await expect(page.getByTestId('forge-hub-login-email')).toHaveValue(
      'kid@sparkforge.test',
    );
    await expect(
      page.getByRole('region', { name: "Today's mission" }),
    ).toBeVisible();
  });

  test('P2 morph cycle welcome → hubSplit → playStage → gameLobby → welcome', async ({
    page,
  }) => {
    await page.goto('/dev/forge-hub?fallback=poster&mode=welcome');
    const shell = page.getByTestId('forge-hub-shell');
    const form = page.getByTestId('forge-hub-welcome-login');
    await expect(page.getByTestId('forge-hub-director')).toBeVisible();
    await expect(page.getByTestId('forge-hub-director-scrub')).toBeVisible();
    await expect(page.getByTestId('forge-hub-transition-scrubber')).toBeVisible();
    await expect(form).toBeVisible();
    await page.getByTestId('forge-hub-login-email').fill('cycle@sparkforge.test');

    await page.getByTestId('forge-hub-p2-cycle').click();
    await expect(shell).toHaveAttribute('data-forge-morph-cycle', 'running');

    await expect(shell).toHaveAttribute('data-forge-morph-cycle', 'done', {
      timeout: 12_000,
    });
    await expect(shell).toHaveAttribute(
      'data-forge-morph-cycle-trace',
      'welcome,hubSplit,playStage,gameLobby,welcome',
    );
    await expect(shell).toHaveAttribute('data-forge-mode', 'welcome');
    await expect(form).toBeVisible();
    await expect(page.getByTestId('forge-hub-login-email')).toHaveValue(
      'cycle@sparkforge.test',
    );
    await expect(page.getByTestId('forge-hub-director')).toBeVisible();
    const transform = await page
      .getByTestId('forge-hub-holo-holoC')
      .evaluate((el) => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(
      true,
    );
  });

  test('welcome login submit plays login-success-hubsplit', async ({ page }) => {
    await page.goto('/dev/forge-hub?fallback=poster&mode=welcome');
    const shell = page.getByTestId('forge-hub-shell');
    await page.getByTestId('forge-hub-login-email').fill('kid@sparkforge.test');
    await page.getByTestId('forge-hub-login-password').fill('lab-login');
    await page.getByTestId('forge-hub-login-submit').click();
    await expect(shell).toHaveAttribute(
      'data-forge-director',
      'login-success-hubsplit',
    );
    await expect(shell).toHaveAttribute('data-forge-mode', 'hubSplit', {
      timeout: 4000,
    });
    await expect(page.getByTestId('forge-hub-welcome-login')).toBeAttached();
    await expect(page.getByTestId('forge-hub-director')).toBeVisible();
  });
});
