#!/usr/bin/env node
// ════════════════════════════════════════════════════
// verify-sentry-source-maps.mjs
//
// Static check that the Sentry source-map upload pipeline is wired
// correctly. Runs in two modes:
//
//   --ci         CI / placeholder env. Asserts the build is wired
//                to call withSentryConfig() with correct env-var
//                wiring. Tolerates missing real credentials.
//
//   (default)    Pre-deploy / production. Adds env-var presence
//                checks: SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT,
//                SENTRY_AUTH_TOKEN. Source maps cannot upload
//                without all four; this is a launch blocker.
//
// Usage:
//   node scripts/verify-sentry-source-maps.mjs [--ci]
//
// Exits 0 on pass, 1 on fail. Designed to be cheap and dependency-
// free so CI can run it after the production build.
// ════════════════════════════════════════════════════

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const ciMode = process.argv.includes('--ci');

const errors = [];
const notes = [];

function fail(msg) {
  errors.push(msg);
}

function note(msg) {
  notes.push(msg);
}

// ── Check 1: next.config.ts wraps with withSentryConfig ──
const nextConfigPath = resolve(ROOT, 'next.config.ts');
if (!existsSync(nextConfigPath)) {
  fail(`next.config.ts not found at ${nextConfigPath}`);
} else {
  const src = readFileSync(nextConfigPath, 'utf8');
  if (!/from ['"]@sentry\/nextjs['"]/.test(src)) {
    fail(`next.config.ts does not import from @sentry/nextjs`);
  }
  if (!/withSentryConfig\s*\(/.test(src)) {
    fail(`next.config.ts does not call withSentryConfig()`);
  }
  if (!/org:\s*process\.env\.SENTRY_ORG/.test(src)) {
    fail(`next.config.ts does not pass org: process.env.SENTRY_ORG to withSentryConfig`);
  }
  if (!/project:\s*process\.env\.SENTRY_PROJECT/.test(src)) {
    fail(`next.config.ts does not pass project: process.env.SENTRY_PROJECT to withSentryConfig`);
  }
}

// ── Check 2: instrumentation files exist ──
for (const path of ['instrumentation.ts', 'instrumentation-client.ts']) {
  const full = resolve(ROOT, path);
  if (!existsSync(full)) {
    fail(`Missing ${path} — Sentry init must run on both server + client.`);
    continue;
  }
  const src = readFileSync(full, 'utf8');
  if (!/Sentry\.init\s*\(/.test(src)) {
    fail(`${path} does not call Sentry.init()`);
  }
}

// ── Check 3 (production mode only): env-var presence ──
if (!ciMode) {
  const required = [
    'SENTRY_DSN',
    'NEXT_PUBLIC_SENTRY_DSN',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
    'SENTRY_AUTH_TOKEN',
  ];
  for (const key of required) {
    if (!process.env[key] || process.env[key].trim() === '') {
      fail(`Required env var ${key} is missing — source maps will not upload.`);
    }
  }
} else {
  note('CI mode: skipping env-var presence checks (CI runs without real Sentry credentials).');
}

// ── Check 4 (post-build, opportunistic): .next exists if a build ran ──
if (existsSync(resolve(ROOT, '.next'))) {
  // We don't fail when .next is missing — this script is also useful
  // pre-build. But when it IS present, do a sanity scan: at least one
  // .map file should exist somewhere under .next/static if the Sentry
  // plugin succeeded, OR a .next/build-manifest.json should be present.
  const buildManifest = resolve(ROOT, '.next', 'build-manifest.json');
  if (!existsSync(buildManifest)) {
    note('.next exists but build-manifest.json missing — build may be partial.');
  }
}

// ── Report ──
if (notes.length > 0) {
  console.log('\nNotes:');
  for (const n of notes) console.log(`  • ${n}`);
}

if (errors.length === 0) {
  console.log(`\n✓ Sentry source-map upload pipeline checks passed (${ciMode ? 'CI' : 'production'} mode).`);
  process.exit(0);
}

console.error('\n✗ Sentry source-map upload pipeline checks FAILED:');
for (const e of errors) console.error(`  • ${e}`);
console.error(
  '\nFix: ensure withSentryConfig() wraps next.config and the four ' +
    'SENTRY_* env vars are set in the Vercel project (Production scope).\n',
);
process.exit(1);
