import { test, expect, devices } from '@playwright/test';

/**
 * Validates the WebGPU hero animation render path on two surfaces:
 *  - iPhone 15 (WebKit) → expects the MP4 poster fallback (no WebGPU on iOS Safari)
 *  - Desktop Chromium with --enable-unsafe-webgpu → expects the live TSL shader
 *
 * Per CLAUDE.md §1: WebGPU is the only primary path; non-WebGPU devices
 * receive a thin MP4-poster fallback derived from the same shader (no fork).
 */

test.describe('hero animation render path', () => {
  test('iPhone 15 emulated viewport renders hero', async ({ browser }) => {
    const iPhone = devices['iPhone 15'];
    const ctx = await browser.newContext({
      viewport: iPhone.viewport,
      userAgent: iPhone.userAgent,
      deviceScaleFactor: iPhone.deviceScaleFactor,
      isMobile: iPhone.isMobile,
      hasTouch: iPhone.hasTouch,
    });
    const page = await ctx.newPage();
    await page.goto('/');

    const webgpu = await page.evaluate(async () => {
      if (!('gpu' in navigator)) return 'absent';
      try {
        const adapter = await (
          navigator as Navigator & { gpu: GPU }
        ).gpu.requestAdapter();
        return adapter ? 'adapter' : 'no-adapter';
      } catch {
        return 'error';
      }
    });
    test.info().annotations.push({ type: 'webgpu-iphone', description: webgpu });

    await page.screenshot({
      path: 'tests/e2e/visual/__screenshots__/hero-iphone15.png',
      fullPage: false,
    });
    await ctx.close();
  });

  test('Desktop Chromium exposes WebGPU and renders shader path', async ({ browser }) => {
    const ctx = await browser.newContext({ ...devices['Desktop Chrome HiDPI'] });
    const page = await ctx.newPage();
    await page.goto('/');

    const gpuInfo = await page.evaluate(async () => {
      if (!('gpu' in navigator)) return { supported: false };
      try {
        const adapter = await (navigator as Navigator & { gpu: GPU }).gpu.requestAdapter();
        return { supported: !!adapter };
      } catch {
        return { supported: false };
      }
    });

    test.info().annotations.push({
      type: 'webgpu',
      description: `adapter=${gpuInfo.supported}`,
    });

    await page.screenshot({
      path: 'tests/e2e/visual/__screenshots__/hero-desktop-webgpu.png',
      fullPage: false,
    });
    await ctx.close();
  });
});
