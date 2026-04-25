#!/usr/bin/env node
// UX-ENH-010 (Recommended): i18n translation runner
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... npx tsx scripts/translate-messages.ts
//
// Reads `messages/en.json` and writes `messages/{locale}.json` for
// every non-English SUPPORTED_LOCALES entry, preserving JSON structure
// and ICU placeholders (e.g., {provider}, {xp}). Uses Claude Haiku 4.5
// for cost (~$1/MM input tokens + $5/MM output tokens → a 200-string
// catalog translates for well under $0.10 per locale).
//
// Behavior:
//   - Existing non-English files are OVERWRITTEN. Diff with git to
//     spot-check.
//   - Dry-run: `--dry-run` prints the generated JSON without writing.
//   - Single locale: `--locale es` translates only Spanish.
//
// The operator runs this any time en.json changes. See
// docs/automation-playbook.md §i18n for the manual workflow.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';

const SUPPORTED: Array<{ code: string; name: string }> = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
];

const MODEL = 'claude-haiku-4-5';

function parseArgs(argv: string[]) {
  const out: { dryRun: boolean; locale?: string } = { dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--locale') out.locale = argv[++i];
  }
  return out;
}

async function translateBundle(
  client: Anthropic,
  languageName: string,
  sourceJson: string,
): Promise<string> {
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content:
          `Translate the VALUES of this JSON message bundle into ${languageName}. ` +
          `PRESERVE every key exactly. PRESERVE ICU placeholders like {provider}, {xp} — do not translate the placeholder names. ` +
          `Use natural, informal UI tone appropriate for a children's learning app (ages 7-16). ` +
          `Return ONLY the translated JSON, no prose, no markdown fences.\n\n` +
          sourceJson,
      },
    ],
  });

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  // Strip accidental ```json fences if the model added them.
  const cleaned = text
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '')
    .trim();

  // Validate that the result parses.
  JSON.parse(cleaned);
  return cleaned;
}

async function main() {
  const args = parseArgs(process.argv);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is required.');
    process.exit(1);
  }

  const messagesDir = path.resolve(process.cwd(), 'messages');
  const enPath = path.join(messagesDir, 'en.json');
  const source = await fs.readFile(enPath, 'utf8');

  const client = new Anthropic({ apiKey });

  const targets = args.locale
    ? SUPPORTED.filter((t) => t.code === args.locale)
    : SUPPORTED;

  if (targets.length === 0) {
    console.error(`Unknown locale: ${args.locale}`);
    process.exit(1);
  }

  for (const t of targets) {
    process.stdout.write(`→ ${t.name} (${t.code})… `);
    try {
      const translated = await translateBundle(client, t.name, source);
      const outPath = path.join(messagesDir, `${t.code}.json`);
      if (args.dryRun) {
        console.log('\n' + translated);
      } else {
        // Pretty-print with 2-space indent for readable diffs.
        const parsed: unknown = JSON.parse(translated);
        await fs.writeFile(outPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
        console.log('wrote', outPath);
      }
    } catch (err) {
      console.error('\nFAILED:', err instanceof Error ? err.message : err);
      process.exit(2);
    }
  }
}

void main();
