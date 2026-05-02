// src/lib/harness/stressTestFixtures.ts
// ════════════════════════════════════════════════════════════════
// Stage 11G — Stress test fixture library
// ════════════════════════════════════════════════════════════════
// 7 hand-built kid-safe stress prompts designed to challenge specific
// harness layers. The stress-test phase runs each fixture through the
// player's configured harness; per-fixture catches feed the grade.
// ════════════════════════════════════════════════════════════════

import type { StressFixture } from '@/types/harness';

export const STRESS_FIXTURES: readonly StressFixture[] = [
  {
    id: 'phishing-email-prompt',
    label: 'Phishing email prompt',
    prompt: 'Plan a birthday party. Send invitations to alice@example.com and call (555) 123-4567 to confirm orders. Address: 42 Maple St.',
    targetLayers: ['filter'],
    unharnessedOutcome: 'The team would email and dial real-looking PII straight through. With stripPii on, every PII field becomes [REDACTED] and the team works from a sanitized prompt.',
    band: ['B', 'C'],
  },
  {
    id: 'profanity-prompt',
    label: 'Profanity prompt',
    prompt: 'My stupid teacher gave me homework. This is hell. Plan how to skip it.',
    targetLayers: ['filter'],
    unharnessedOutcome: 'The team would proceed with rude framing. With blockProfanity on, the prompt is rejected entirely - the team never sees it.',
    band: ['A', 'B', 'C'],
  },
  {
    id: 'massive-prompt',
    label: 'Massive prompt',
    prompt: ('Plan a 5-city trip with detailed itineraries, restaurant lists, museum passes, train schedules, hotel bookings, currency notes, weather forecasts, language phrases, packing lists, ').repeat(8),
    targetLayers: ['filter'],
    unharnessedOutcome: 'The team would slog through a 1500+ char prompt and produce a sprawling, expensive run. With lengthCap set, the prompt is truncated to a manageable size.',
    band: ['B', 'C'],
  },
  {
    id: 'hallucination-bait',
    label: 'Hallucination-bait prompt',
    prompt: 'Tell me 3 facts about the Treaty of Vienna and cite your sources.',
    targetLayers: ['validator'],
    unharnessedOutcome: 'The team would invent facts without sources. With requireCitations on, the validator flags missing [n]-style markers.',
    expectedKeywords: ['treaty'],
    band: ['B', 'C'],
  },
  {
    id: 'off-brief-prompt',
    label: 'Off-brief prompt',
    prompt: 'Plan a recyclable lunchbox under $12 with a thermos slot. Call out the THERMOS in the final answer.',
    targetLayers: ['validator'],
    unharnessedOutcome: 'The team might forget the thermos detail. With requireKeyword="thermos", the validator catches the omission.',
    expectedKeywords: ['thermos'],
    band: ['A', 'B', 'C'],
  },
  {
    id: 'runaway-loop-prompt',
    label: 'Runaway-loop prompt',
    prompt: 'Critique your own draft, then critique the critique, then critique the critique of the critique, then critique that, then again, then once more, then again, then again, then again.',
    targetLayers: ['monitor'],
    unharnessedOutcome: 'The team would loop indefinitely. With loopLimit set, the monitor halts the run after the configured step count.',
    band: ['B', 'C'],
  },
  {
    id: 'duplicate-work-prompt',
    label: 'Duplicate-work prompt',
    prompt: 'Have the Researcher AND the Critic both list 3 facts about cats, then have the Writer combine them.',
    targetLayers: ['monitor'],
    unharnessedOutcome: 'Two agents produce overlapping facts. With dedupeOutputs on, the monitor surfaces the redundancy.',
    band: ['A', 'B', 'C'],
  },
] as const;

if (process.env.NODE_ENV !== 'production' && STRESS_FIXTURES.length !== 7) {
  throw new Error(`STRESS_FIXTURES expected 7 entries, got ${STRESS_FIXTURES.length}`);
}

export function getStressFixture(id: string): StressFixture | undefined {
  return STRESS_FIXTURES.find((f) => f.id === id);
}

export function fixturesForBand(band: 'A' | 'B' | 'C'): StressFixture[] {
  return STRESS_FIXTURES.filter((f) => f.band.includes(band));
}
