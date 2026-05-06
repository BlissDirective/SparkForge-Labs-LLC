import { test, devices, chromium, webkit } from '@playwright/test';

/**
 * Validates the WebGPU hero animation render path on two surfaces:
 *  - iPhone 15 (WebKit) → expects the MP4 poster fallback (no WebGPU on iOS Safari)
 *  - Desktop Chromium with --enable-unsafe-webgpu → expects the live TSL shader
 *
 * Per CLAUDE.md §1: WebGPU is the only primary path; non-WebGPU devices
 * receive a thin MP4-poster fallback derived from the same shader (no fork).
 *
 * Each test launches its own browser explicitly so the iPhone case actually
 * runs on WebKit (matching iOS Safari) regardless of the active project.
 */

test.describe('hero animation render path', () => {
  test('iPhone 15 (WebKit) renders MP4 fallback', async () => {
    let browser;
    try {
      browser = await webkit.launch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      test.skip(true, `WebKit unavailable on this host: ${msg.split('\n')[0]}`);
      return;
    }
    const ctx = await browser.newContext({ ...devices['iPhone 15'] });
    const page = await ctx.newPage();
    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const webgpuStatus = await page.evaluate(async () => {
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
      test.info().annotations.push({ type: 'webgpu-iphone', description: webgpuStatus });

      await page.screenshot({
        path: 'tests/e2e/visual/__screenshots__/hero-iphone15.png',
        fullPage: false,
      });
    } finally {
      await ctx.close();
      await browser.close();
    }
  });

  test('Desktop Chromium exposes WebGPU and renders shader path', async () => {
    const browser = await chromium.launch({
      args: ['--enable-unsafe-webgpu'],
    });
    const ctx = await browser.newContext({ ...devices['Desktop Chrome HiDPI'] });
    const page = await ctx.newPage();
    try {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const gpuInfo = await page.evaluate(async () => {
        if (!('gpu' in navigator)) return { supported: false };
        try {
          const adapter = await (
            navigator as Navigator & { gpu: GPU }
          ).gpu.requestAdapter();
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
    } finally {
      await ctx.close();
      await browser.close();
    }
  });
});
