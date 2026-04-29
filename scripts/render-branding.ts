#!/usr/bin/env tsx
/**
 * scripts/render-branding.ts — Phase 4 offline render pipeline.
 *
 * Produces three artefacts in public/branding/:
 *   1. sf-hero.png         (4096×4096 transparent, SF mark canonical pose)
 *   2. sparkforge-hero.png (4096×1024 transparent, full wordmark)
 *   3. brand-fallback.mp4  (1920×1920 H.264, 2s slow-rotation loop)
 *
 * Pipeline:
 *   - Boot a dev server on http://localhost:3000 if one isn't already running.
 *   - Launch puppeteer with WebGPU enabled flags.
 *   - Navigate to /dev/branding/render?subject=<X>&t=<seconds>.
 *   - Wait for window.__brandingReady === true.
 *   - Screenshot at the requested size, transparent background.
 *   - For the loop: capture 60 frames with `t` stepped 0..2, ffmpeg → MP4.
 *
 * Usage:
 *   npm run render:branding
 *   npm run render:branding -- --subject sf      # only the SF mark still
 *   npm run render:branding -- --subject loop    # only the MP4 loop
 *
 * Note (April 29 2026): bundled puppeteer Chromium may not have stable
 * WebGPU. If shaders fail to compile in headless mode, fall back to
 * `executablePath` pointing at the system Chrome — set CHROME_EXECUTABLE
 * env var to override.
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer, { type Browser, type Page } from 'puppeteer';
import ffmpegPath from 'ffmpeg-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const PUBLIC_BRANDING = join(ROOT, 'public', 'branding');
const TMP_FRAMES = join(ROOT, '.next-render-frames');

const DEV_PORT = Number(process.env.PORT ?? 3000);
const DEV_URL = `http://localhost:${DEV_PORT}`;

interface RenderOptions {
  subject: 'sf' | 'sparkforge' | 'loop' | 'all';
}

function parseArgs(): RenderOptions {
  const args = process.argv.slice(2);
  let subject: RenderOptions['subject'] = 'all';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--subject' && args[i + 1]) {
      const v = args[i + 1];
      if (v === 'sf' || v === 'sparkforge' || v === 'loop' || v === 'all') {
        subject = v;
      }
      i++;
    }
  }
  return { subject };
}

// ─────────────────────────────────────────────────────────────────────
// Dev server lifecycle
// ─────────────────────────────────────────────────────────────────────

async function pingDevServer(): Promise<boolean> {
  try {
    const res = await fetch(DEV_URL, { method: 'HEAD' });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function startDevServer(): Promise<ChildProcess | null> {
  if (await pingDevServer()) {
    console.log(`[render-branding] Dev server already running at ${DEV_URL}`);
    return null;
  }
  console.log(`[render-branding] Starting dev server (PORT=${DEV_PORT})…`);
  const proc = spawn('npm', ['run', 'dev'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(DEV_PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Wait until /dev/branding/render responds.
  for (let i = 0; i < 60; i++) {
    if (await pingDevServer()) {
      console.log('[render-branding] Dev server ready.');
      return proc;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  proc.kill();
  throw new Error('Dev server failed to start within 60s');
}

// ─────────────────────────────────────────────────────────────────────
// Puppeteer
// ─────────────────────────────────────────────────────────────────────

async function launchBrowser(): Promise<Browser> {
  const args = [
    '--enable-unsafe-webgpu',
    '--enable-features=Vulkan,WebGPU',
    '--use-vulkan',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--ignore-gpu-blocklist',
  ];
  const launchOpts: Parameters<typeof puppeteer.launch>[0] = {
    headless: true,
    args,
  };
  if (process.env.CHROME_EXECUTABLE) {
    launchOpts.executablePath = process.env.CHROME_EXECUTABLE;
  }
  return puppeteer.launch(launchOpts);
}

async function awaitBrandingReady(page: Page): Promise<void> {
  // Up to 30s for shader compilation (cold start can be slow).
  await page.waitForFunction(
    () => (window as unknown as { __brandingReady?: boolean }).__brandingReady === true,
    { timeout: 30_000 },
  );
}

interface CaptureSpec {
  subject: 'sf' | 'sparkforge' | 'loop';
  width: number;
  height: number;
  outFile: string;
  t?: number;
}

async function captureStill(browser: Browser, spec: CaptureSpec): Promise<void> {
  const page = await browser.newPage();
  await page.setViewport({ width: spec.width, height: spec.height, deviceScaleFactor: 1 });
  const t = spec.t ?? 0;
  const url = `${DEV_URL}/dev/branding/render?subject=${spec.subject}&t=${t}`;
  // domcontentloaded (not networkidle0) — Next.js dev server keeps HMR
  // websocket open indefinitely, so networkidle never fires. The
  // __brandingReady flag (awaited next) is the authoritative ready gate.
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await awaitBrandingReady(page);
  // Force html/body to transparent so puppeteer's omitBackground actually
  // produces RGBA output. The app's root layout sets `bg-surface-base` on
  // <body>, which overrides the screenshot's alpha unless we strip it here.
  await page.evaluate(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    document.body.classList.remove('bg-surface-base');
    // Also strip any inherited bg from main/section/div ancestors of canvas.
    const canvas = document.querySelector('canvas');
    let el: HTMLElement | null = canvas?.parentElement ?? null;
    while (el && el !== document.body) {
      el.style.background = 'transparent';
      el = el.parentElement;
    }
  });
  // Settle one extra frame after the DOM mutation.
  await new Promise((r) => setTimeout(r, 250));
  await page.screenshot({
    path: spec.outFile as `${string}.png`,
    omitBackground: true,
    type: 'png',
  });
  console.log(`[render-branding] ✓ ${spec.outFile}`);
  await page.close();
}

async function captureLoop(browser: Browser): Promise<void> {
  await mkdir(TMP_FRAMES, { recursive: true });
  const fps = 30;
  const seconds = 2;
  const totalFrames = fps * seconds;
  console.log(`[render-branding] Capturing ${totalFrames} loop frames…`);
  for (let i = 0; i < totalFrames; i++) {
    const t = i / fps; // 0..2
    const out = join(TMP_FRAMES, `frame-${String(i).padStart(4, '0')}.png`);
    await captureStill(browser, {
      subject: 'loop',
      width: 1920,
      height: 1920,
      outFile: out,
      t,
    });
  }
  await stitchMp4();
  await rm(TMP_FRAMES, { recursive: true, force: true });
}

// ─────────────────────────────────────────────────────────────────────
// FFmpeg stitching
// ─────────────────────────────────────────────────────────────────────

async function stitchMp4(): Promise<void> {
  // ffmpeg-static returns string | null; null when the binary wasn't
  // bundled for the current platform. Narrow once, store locally so
  // the spawn closure sees a non-null type.
  const ffBin: string | null = ffmpegPath as string | null;
  if (!ffBin) {
    throw new Error('ffmpeg-static did not provide a binary path');
  }
  const out = join(PUBLIC_BRANDING, 'brand-fallback.mp4');
  const args = [
    '-y',
    '-framerate', '30',
    '-i', join(TMP_FRAMES, 'frame-%04d.png'),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '20',
    '-preset', 'slow',
    '-movflags', '+faststart',
    out,
  ];
  console.log(`[render-branding] Stitching ${out}…`);
  await new Promise<void>((resolveStitch, rejectStitch) => {
    const proc = spawn(ffBin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    proc.on('error', rejectStitch);
    proc.on('exit', (code) => {
      if (code === 0) resolveStitch();
      else rejectStitch(new Error(`ffmpeg exited with code ${code}`));
    });
  });
  console.log(`[render-branding] ✓ ${out}`);
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const opts = parseArgs();

  if (!existsSync(PUBLIC_BRANDING)) {
    await mkdir(PUBLIC_BRANDING, { recursive: true });
  }

  let devServer: ChildProcess | null = null;
  let browser: Browser | null = null;

  try {
    devServer = await startDevServer();
    browser = await launchBrowser();

    if (opts.subject === 'sf' || opts.subject === 'all') {
      await captureStill(browser, {
        subject: 'sf',
        width: 4096,
        height: 4096,
        outFile: join(PUBLIC_BRANDING, 'sf-hero.png'),
      });
    }

    if (opts.subject === 'sparkforge' || opts.subject === 'all') {
      await captureStill(browser, {
        subject: 'sparkforge',
        width: 4096,
        height: 1024,
        outFile: join(PUBLIC_BRANDING, 'sparkforge-hero.png'),
      });
    }

    if (opts.subject === 'loop' || opts.subject === 'all') {
      await captureLoop(browser);
    }

    console.log('[render-branding] All renders complete.');
  } finally {
    if (browser) await browser.close().catch(() => undefined);
    if (devServer) {
      devServer.kill('SIGTERM');
      // Give it a moment to clean up.
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

main().catch((err) => {
  console.error('[render-branding] FAILED:', err);
  process.exit(1);
});
