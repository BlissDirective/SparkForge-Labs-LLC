#!/usr/bin/env node
/**
 * Forge Hub SSIM harness — W8-01 (Inspector)
 *
 * Captures /dev/forge-hub?pose=lock at the reference viewport and
 * compares it against the canonical plate LOCKED_HUB.jpg with a structural-similarity
 * score. This is the P1 exit gate in TRANSITION_ACTION_PLAN.md §4:
 * a measured number, not a stub. Never writes under public/forge-hub/.
 *
 * Modes
 *   node scripts/ssim-forge-hub.mjs                       capture + compare
 *   node scripts/ssim-forge-hub.mjs --compare a.png b.png compare two files
 *
 * Options
 *   --query <k=v&k2=v2>     extra dev-page switches, e.g. fallback=webgl2
 *   --url <base>              default http://localhost:3000
 *   --threshold <0..1>        default 0.96 (FORGE_HUB_SSIM_THRESHOLD)
 *   --out <dir>               default .forge-hub-ssim (gitignored)
 *   --require-backend <x>     any | webgpu | webgl2   default any
 *   --reference <lock|still>  compare against LOCKED_HUB.jpg (default)
 *                             or the display still
 *   --settle <ms>             extra wait after stage ready, default 1500
 *   --json                    print the report as JSON only
 *
 * Exit codes: 0 pass · 1 below threshold or backend mismatch · 2 setup error
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_DIR = join(ROOT, 'public/forge-hub');
const LOCK_FILE = join(LOCK_DIR, 'world/LOCKED_HUB.jpg');
// Only the one canonical plate exists (no separate haze-free still).
const STILL_FILE = LOCK_FILE;
const SUMS_FILE = join(LOCK_DIR, 'SHA256SUMS');
const CAPTURE_PATH = '/dev/forge-hub?pose=lock';
/** Must match SF_COOKIE_NOTICE_KEY in src/components/ui/CookieNotice.tsx. */
const COOKIE_NOTICE_KEY = 'sparkforge:cookie-notice:dismissed';
const VIEWPORT = { width: 1280, height: 720 };
const COMPARE_SIZE = { width: 768, height: 432 };
const WINDOW = 8;
const K1 = 0.01;
const K2 = 0.03;
const L = 255;

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

const opts = {
  url: String(arg('--url', process.env.FORGE_HUB_URL ?? 'http://localhost:3000')),
  threshold: Number(arg('--threshold', process.env.FORGE_HUB_SSIM_THRESHOLD ?? 0.96)),
  out: resolve(String(arg('--out', '.forge-hub-ssim'))),
  requireBackend: String(arg('--require-backend', 'any')),
  reference: String(arg('--reference', 'lock')),
  settle: Number(arg('--settle', 1500)),
  query: arg('--query', ''),
  json: process.argv.includes('--json'),
  compare: process.argv.indexOf('--compare'),
};

function log(...a) {
  if (!opts.json) console.log('[ssim-forge-hub]', ...a);
}

function fail(code, msg, extra = {}) {
  const report = { ok: false, error: msg, ...extra };
  if (opts.json) console.log(JSON.stringify(report, null, 2));
  else console.error('[ssim-forge-hub] FAIL:', msg);
  process.exit(code);
}

/** Verify the lock bytes before touching anything (read-only). */
function verifyLock() {
  if (!existsSync(LOCK_FILE) || !existsSync(SUMS_FILE)) {
    fail(2, `missing ${LOCK_FILE} or ${SUMS_FILE}`);
  }
  const sums = readFileSync(SUMS_FILE, 'utf8');
  const line = sums.split('\n').find((l) => l.endsWith('world/LOCKED_HUB.jpg'));
  const expected = line?.split(/\s+/)[0];
  const actual = createHash('sha256').update(readFileSync(LOCK_FILE)).digest('hex');
  if (!expected || expected !== actual) {
    fail(2, 'LOCKED_HUB.jpg SHA mismatch — do not regenerate the lock', {
      expected,
      actual,
    });
  }
  log('lock SHA OK', actual.slice(0, 12));
}

/** Decode to 8-bit grayscale at the compare size. */
async function toGray(input) {
  const { data, info } = await sharp(input)
    .resize(COMPARE_SIZE.width, COMPARE_SIZE.height, { fit: 'fill' })
    .removeAlpha()
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/**
 * Mean SSIM over non-overlapping WINDOW×WINDOW blocks (Wang et al. 2004
 * constants). Deterministic and dependency-free; good enough as a gate.
 */
function ssim(a, b) {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error('size mismatch');
  }
  const C1 = (K1 * L) ** 2;
  const C2 = (K2 * L) ** 2;
  const n = WINDOW * WINDOW;
  let total = 0;
  let count = 0;
  let worst = 1;
  let worstAt = [0, 0];
  for (let y = 0; y + WINDOW <= a.height; y += WINDOW) {
    for (let x = 0; x + WINDOW <= a.width; x += WINDOW) {
      let ma = 0;
      let mb = 0;
      for (let j = 0; j < WINDOW; j++) {
        const row = (y + j) * a.width + x;
        for (let i = 0; i < WINDOW; i++) {
          ma += a.data[row + i];
          mb += b.data[row + i];
        }
      }
      ma /= n;
      mb /= n;
      let va = 0;
      let vb = 0;
      let cov = 0;
      for (let j = 0; j < WINDOW; j++) {
        const row = (y + j) * a.width + x;
        for (let i = 0; i < WINDOW; i++) {
          const da = a.data[row + i] - ma;
          const db = b.data[row + i] - mb;
          va += da * da;
          vb += db * db;
          cov += da * db;
        }
      }
      va /= n - 1;
      vb /= n - 1;
      cov /= n - 1;
      const s =
        ((2 * ma * mb + C1) * (2 * cov + C2)) /
        ((ma * ma + mb * mb + C1) * (va + vb + C2));
      total += s;
      count++;
      if (s < worst) {
        worst = s;
        worstAt = [x, y];
      }
    }
  }
  return { score: total / count, worst, worstAt, blocks: count };
}

async function compareFiles(aPath, bPath) {
  const [a, b] = await Promise.all([toGray(aPath), toGray(bPath)]);
  return ssim(a, b);
}

async function capture() {
  const { chromium } = await import('playwright');
  // FORGE_HUB_CHROMIUM lets a sandbox point at a pre-installed Chromium
  // instead of downloading the pinned build (CI leaves it unset).
  const executablePath = process.env.FORGE_HUB_CHROMIUM || undefined;
  const browser = await chromium.launch({
    executablePath,
    args: ['--ignore-gpu-blocklist', '--enable-unsafe-webgpu'],
  });
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      reducedMotion: 'no-preference',
      colorScheme: 'dark',
    });
    // The site-wide cookie notice (src/components/ui/CookieNotice.tsx) is
    // a fixed DOM banner over the desk and is not part of the room. Mark it
    // dismissed before first paint so the capture measures the stage only.
    await context.addInitScript((key) => {
      try {
        window.localStorage.setItem(key, '1');
      } catch {
        /* private mode: banner shows, score will say so */
      }
    }, COOKIE_NOTICE_KEY);
    const page = await context.newPage();
    const targetUrl = new URL(CAPTURE_PATH, opts.url);
    // --query "fallback=webgl2" etc. appends extra dev-page switches.
    if (opts.query) {
      for (const pair of String(opts.query).split('&')) {
        const [k, v = ''] = pair.split('=');
        if (k) targetUrl.searchParams.set(k, v);
      }
    }
    const target = targetUrl.toString();
    log('capturing', target);
    const res = await page.goto(target, { waitUntil: 'networkidle', timeout: 90_000 });
    if (!res || res.status() >= 400) {
      fail(2, `page returned ${res?.status()}`);
    }
    const shell = page.locator('[data-testid="forge-hub-shell"]');
    await shell.waitFor({ timeout: 60_000 });
    // Stage ready (or poster, which we report and fail on if a backend is required).
    await page
      .waitForFunction(
        () => {
          const el = document.querySelector('[data-testid="forge-hub-shell"]');
          const s = el?.getAttribute('data-forge-stage');
          return s === 'ready' || s === 'poster';
        },
        null,
        { timeout: 90_000 },
      )
      .catch(() => fail(2, 'stage never reported ready or poster'));
    await page.waitForTimeout(opts.settle);
    // The dev page keeps the display still (poster) underneath the canvas as
    // a base layer. Left visible it makes any capture score 1.0 against the
    // still regardless of what the canvas draws. Hide it so the number
    // measures the live render only, then prove the canvas is not blank.
    await page.addStyleTag({
      content:
        '[data-forge-stage="poster"], [data-forge-poster] { visibility: hidden !important; }',
    });
    await page.waitForTimeout(250);
    const attrs = await shell.evaluate((el) => ({
      stage: el.getAttribute('data-forge-stage'),
      renderer: el.getAttribute('data-forge-renderer'),
      gpuTier: el.getAttribute('data-forge-gpu-tier'),
      pose: el.getAttribute('data-forge-pose'),
      glass: el.getAttribute('data-forge-glass'),
      breathe: el.getAttribute('data-forge-breathe'),
      mode: el.getAttribute('data-forge-mode'),
    }));
    const png = await page.screenshot({
      clip: { x: 0, y: 0, ...VIEWPORT },
      type: 'png',
      animations: 'disabled',
    });
    return { png, attrs };
  } finally {
    await browser.close();
  }
}

async function main() {
  if (opts.compare !== -1) {
    const a = process.argv[opts.compare + 1];
    const b = process.argv[opts.compare + 2];
    if (!a || !b) fail(2, '--compare needs two PNG paths');
    const r = await compareFiles(resolve(a), resolve(b));
    const report = { ok: r.score >= opts.threshold, mode: 'compare', a, b, ...r, threshold: opts.threshold };
    console.log(opts.json ? JSON.stringify(report, null, 2) : `[ssim-forge-hub] SSIM ${r.score.toFixed(4)} (worst block ${r.worst.toFixed(3)} at ${r.worstAt.join(',')}) threshold ${opts.threshold}`);
    process.exit(report.ok ? 0 : 1);
  }

  verifyLock();
  mkdirSync(opts.out, { recursive: true });

  const { png, attrs } = await capture();
  const capturePath = join(opts.out, 'forge-hub-pose-lock.png');
  writeFileSync(capturePath, png);
  log('capture saved', capturePath, attrs);

  if (attrs.stage !== 'ready') {
    fail(1, `stage is "${attrs.stage}" — the SSIM gate needs a live canvas, not the poster`, { attrs });
  }
  if (opts.requireBackend !== 'any' && attrs.renderer !== opts.requireBackend) {
    fail(1, `renderer "${attrs.renderer}" does not satisfy --require-backend ${opts.requireBackend}`, { attrs });
  }
  if (attrs.pose !== 'lock') {
    fail(2, 'pose=lock was not honoured by the shell', { attrs });
  }
  // Blank-canvas guard: with the poster hidden, a dead or transparent
  // canvas leaves only the page background (#0b1218, luminance ≈ 20).
  const stats = await sharp(capturePath).grayscale().stats();
  const meanLuma = stats.channels[0].mean;
  if (meanLuma < 40) {
    fail(1, `capture is nearly blank (mean luminance ${meanLuma.toFixed(1)}) — the canvas is not drawing the room`, { attrs, meanLuma });
  }

  const referencePath = opts.reference === 'still' ? STILL_FILE : LOCK_FILE;
  const r = await compareFiles(capturePath, referencePath);
  // Informational: how far the display still itself is from the canonical lock.
  const stillVsLock = await compareFiles(STILL_FILE, LOCK_FILE);

  const report = {
    ok: r.score >= opts.threshold,
    score: Number(r.score.toFixed(4)),
    threshold: opts.threshold,
    worstBlock: { score: Number(r.worst.toFixed(4)), at: r.worstAt, window: WINDOW },
    reference: referencePath.replace(ROOT + '/', ''),
    capture: capturePath.replace(ROOT + '/', ''),
    viewport: VIEWPORT,
    compareSize: COMPARE_SIZE,
    attrs,
    context: { displayStillVsLock: Number(stillVsLock.score.toFixed(4)) },
  };
  writeFileSync(join(opts.out, 'report.json'), JSON.stringify(report, null, 2));

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `[ssim-forge-hub] SSIM ${report.score} vs ${report.reference} ` +
        `(threshold ${report.threshold}; renderer ${attrs.renderer}; ` +
        `still-vs-lock ${report.context.displayStillVsLock})`,
    );
    console.log(`[ssim-forge-hub] ${report.ok ? 'PASS' : 'FAIL'} — report ${join(opts.out, 'report.json')}`);
  }
  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => fail(2, err?.stack ?? String(err)));
