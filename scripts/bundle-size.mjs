#!/usr/bin/env node
// DEPLOY-ENH-001 (Max): Bundle-size regression gate
//
// Parses `.next/build-manifest.json` + route manifests to compute:
//   - First Load JS (shared chunks, in kB)
//   - Middleware bundle size
//   - Static route count
//   - Dynamic route count
//
// Writes GitHub Actions output variables suitable for step outputs.
// Also emits budget pass/fail flags used by the enforcement step.
//
// Thresholds are conservative — raise them deliberately in a PR if
// a real increase is justified.

import { readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const NEXT = path.join(ROOT, '.next');

// Fail loudly if .next isn't there — the workflow always builds first.
if (!existsSync(NEXT)) {
  console.error('.next missing — did the build step run?');
  process.exit(1);
}

// Budgets computed from the uncompressed .next build (not the ~234 kB
// post-compression figure `next build` prints). Set to the current
// observed baseline × 1.2 to catch ~20%+ regressions while leaving
// normal additions headroom. Raise deliberately in a PR if a real
// increase is justified.
const FIRST_LOAD_BUDGET_KB = 875;
const MIDDLEWARE_BUDGET_KB = 360;

function sizeKb(p) {
  if (!existsSync(p)) return 0;
  return Math.round((statSync(p).size / 1024) * 10) / 10;
}

// First-Load shared chunks
let firstLoad = 0;
try {
  const manifest = JSON.parse(
    readFileSync(path.join(NEXT, 'build-manifest.json'), 'utf8'),
  );
  const shared = manifest.rootMainFiles ?? [];
  for (const rel of shared) {
    firstLoad += sizeKb(path.join(NEXT, rel));
  }
} catch (err) {
  console.error('Could not read build-manifest.json:', err.message);
  process.exit(1);
}

// Middleware — the compiled bundle lives under .next/server/middleware.js
let middleware = 0;
const mwCandidates = [
  path.join(NEXT, 'server', 'middleware.js'),
  path.join(NEXT, 'server', 'src', 'middleware.js'),
];
for (const p of mwCandidates) {
  if (existsSync(p)) {
    middleware = sizeKb(p);
    break;
  }
}

// Route counts from the routes manifest
let staticCount = 0;
let dynamicCount = 0;
try {
  const routes = JSON.parse(
    readFileSync(path.join(NEXT, 'routes-manifest.json'), 'utf8'),
  );
  staticCount = (routes.staticRoutes ?? []).length;
  dynamicCount = (routes.dynamicRoutes ?? []).length;
} catch {
  // routes-manifest is optional for this report; leave counts at 0.
}

const firstLoadPass = firstLoad <= FIRST_LOAD_BUDGET_KB ? 'yes' : 'no';
const middlewarePass = middleware <= MIDDLEWARE_BUDGET_KB ? 'yes' : 'no';

const out = [
  `first_load_kb=${firstLoad}`,
  `middleware_kb=${middleware}`,
  `static_count=${staticCount}`,
  `dynamic_count=${dynamicCount}`,
  `first_load_pass=${firstLoadPass}`,
  `middleware_pass=${middlewarePass}`,
].join('\n');

process.stdout.write(out + '\n');
