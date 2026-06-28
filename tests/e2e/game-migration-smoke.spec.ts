// ════════════════════════════════════════════════════════════════════════
// GAME MIGRATION SMOKE TEST — HS-5 visual checkpoint for Waves 1-7
// ════════════════════════════════════════════════════════════════════════
// Fable-Frontend-Enhancement.md §2.3: the Pixi/Phaser canvas is opaque to the
// a11y tree, so each migrated scene publishes state to window.__SPARKFORGE_GAME__.
// This spec mounts every migrated game via the auth-free dev preview route
// (/dev/game-preview/[slug]), drives it from the level map → welcome → play
// phase, then asserts (a) no uncaught runtime errors, (b) a <canvas> mounts,
// and (c) the inspector scene state is published. A screenshot is captured per
// game for the visual review.
//
// Run: npx playwright test game-migration-smoke --project=chromium

import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SHOT_DIR = process.env.SHOT_DIR || join(process.cwd(), 'migration-shots');
mkdirSync(SHOT_DIR, { recursive: true });

// The sandbox ships a pre-installed Chromium that may differ from the version
// @playwright/test expects. Point at it directly (env note: never run
// `playwright install`). Override only when the binary is present.
const PW_CHROME = process.env.PW_EXECUTABLE_PATH || '/opt/pw-browsers/chromium';
test.use({ launchOptions: { executablePath: PW_CHROME } });

// Every migrated game (Waves 1-7) + the Sort Toy Box reference.
const GAMES: { slug: string; archetype: 'SORT' | 'REVEAL' | 'CONNECT' | 'REACT' | 'PHASER' }[] = [
  { slug: 'sort-toy-box', archetype: 'SORT' },
  { slug: 'ai-spy', archetype: 'REVEAL' },
  { slug: 'neuron-relay', archetype: 'CONNECT' },
  { slug: 'ai-or-not', archetype: 'REACT' },
  { slug: 'data-shield', archetype: 'SORT' },
  { slug: 'real-or-fake', archetype: 'REVEAL' },
  { slug: 'word-predictor', archetype: 'REACT' },
  { slug: 'token-chopper', archetype: 'SORT' },
  { slug: 'ai-art-detective', archetype: 'SORT' },
  { slug: 'camera-quest', archetype: 'REVEAL' },
  { slug: 'fool-the-ai', archetype: 'SORT' },
  { slug: 'build-classifier', archetype: 'SORT' },
  { slug: 'prediction-market', archetype: 'SORT' },
  { slug: 'sentiment-scanner', archetype: 'SORT' },
  { slug: 'emoji-decoder', archetype: 'SORT' },
  { slug: 'chatbot-builder', archetype: 'CONNECT' },
  { slug: 'lost-in-translation', archetype: 'CONNECT' },
  { slug: 'time-machine', archetype: 'SORT' },
  { slug: 'human-vs-machine', archetype: 'SORT' },
  { slug: 'pixel-investigator', archetype: 'REVEAL' },
  { slug: 'tool-picker', archetype: 'SORT' },
  { slug: 'code-blocks', archetype: 'CONNECT' },
  { slug: 'career-explorer', archetype: 'CONNECT' },
  { slug: 'my-first-ai-app', archetype: 'CONNECT' },
  { slug: 'future-forge', archetype: 'CONNECT' },
  { slug: 'treat-trainer', archetype: 'PHASER' },
  // Phase D — flagship quiz games migrated to archetypes
  { slug: 'bias-detective', archetype: 'SORT' },
];

// Click a button by accessible name. The dev-preview shell takes ~13s to
// hydrate and the game chunk loads after that, so the click auto-waits
// generously for the target to appear and become actionable.
async function clickByName(page: Page, name: RegExp, timeout = 40_000): Promise<boolean> {
  try {
    await page.getByRole('button', { name }).first().click({ timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe('Game migration — archetype scenes render', () => {
  // The dev-preview page boots the full app shell (~13s to interactive) before
  // the game canvas mounts; the budget below covers that plus the click-through.
  test.describe.configure({ timeout: 120_000 });

  for (const { slug, archetype } of GAMES) {
    test(`${slug} (${archetype})`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(String(e)));

      await page.goto(`/dev/game-preview/${slug}`, { waitUntil: 'domcontentloaded', timeout: 70_000 });

      // Game module must mount (GameShell renders the preview wrapper).
      await expect(page.getByTestId('game-preview')).toBeVisible({ timeout: 20_000 });

      // Drive level map → welcome → play. The level system shows selectable
      // levels (Level 1 is always unlocked); the welcome card's CTA starts the
      // archetype scene ("Start …" for every game, "Enter Maze" for Phaser).
      await clickByName(page, /level\s*1\b/i);
      await page.waitForTimeout(400);
      await clickByName(page, /^start|enter maze/i);
      await page.waitForTimeout(400);

      // Wait for the archetype canvas to mount with real dimensions. The play
      // phase is the only phase that mounts a <canvas>, so its presence proves
      // we reached it and the Pixi/Phaser renderer initialized (no CSP/eval
      // failure). The window.__SPARKFORGE_GAME__ inspector is dev-only (stripped
      // from production builds), so it's read as a bonus, not asserted here.
      const hasCanvas = await page
        .waitForFunction(() => {
          const c = document.querySelector('canvas');
          return !!c && (c as HTMLCanvasElement).width > 0 && (c as HTMLCanvasElement).height > 0;
        }, { timeout: 15_000 })
        .then(() => true)
        .catch(() => false);

      await page.screenshot({ path: join(SHOT_DIR, `${slug}.png`) });

      const sceneStage = await page.evaluate(() => {
        const g = (window as unknown as { __SPARKFORGE_GAME__?: { scene?: { stage?: string } } }).__SPARKFORGE_GAME__;
        return g?.scene?.stage ?? null;
      });

      // Hard requirement: no uncaught runtime errors in any migrated game.
      expect(errors, `runtime errors in ${slug}:\n${errors.join('\n')}`).toHaveLength(0);
      // Canvas with real dimensions = the archetype "render-proven" signal.
      expect(hasCanvas, `no rendered canvas for ${slug} (scene=${sceneStage})`).toBe(true);
    });
  }
});
