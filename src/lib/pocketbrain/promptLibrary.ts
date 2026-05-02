// src/lib/pocketbrain/promptLibrary.ts
// ════════════════════════════════════════════════════════════════
// Stage 11A — Pocket Brain prompt library
// ════════════════════════════════════════════════════════════════
// 30 hardcoded kid-safe prompts across 5 themes. Each prompt runs at
// all 4 quantization levels (Q4/Q5/Q8/FP16) per Doc 2 §H.6 for the
// quantization-lab side-by-side comparison (120 runs total).
//
// Plus 12 race-mode trivia questions (Loop 2 per Doc 2 §H.7) with
// short kid-safe answers the SLM should produce.
// ════════════════════════════════════════════════════════════════

import type { AgeBand } from '@/config/gameRegistry';

export type PromptTheme =
  | 'story-starters'
  | 'math'
  | 'translation'
  | 'common-sense'
  | 'creative';

export interface PocketPrompt {
  id: string;
  theme: PromptTheme;
  /** The prompt sent to the SLM. */
  text: string;
  /** Kid-readable label used as the card title. */
  label: string;
  /** Age-band gate. */
  band: AgeBand[];
  /** Optional: a representative phrase the kid should expect to see in
   *  the SLM's output (used by the quant-lab compare panel). */
  expectedHint?: string;
}

export const POCKET_PROMPTS: readonly PocketPrompt[] = [
  // ─── Story Starters (6) ────────────────────────────────────
  {
    id: 'story-cat',
    theme: 'story-starters',
    text: 'Write 3 sentences about a brave cat who saves the day.',
    label: 'Brave cat story',
    band: ['A', 'B', 'C'],
    expectedHint: 'cat',
  },
  {
    id: 'story-robot',
    theme: 'story-starters',
    text: 'Write 3 sentences about a friendly robot helping at school.',
    label: 'Friendly robot',
    band: ['A', 'B', 'C'],
    expectedHint: 'robot',
  },
  {
    id: 'story-dragon',
    theme: 'story-starters',
    text: 'Write 3 sentences about a small dragon learning to fly.',
    label: 'Small dragon',
    band: ['A', 'B', 'C'],
  },
  {
    id: 'story-detective',
    theme: 'story-starters',
    text: 'Start a kid-detective story: a missing lunchbox, 2 suspects, 1 clue.',
    label: 'Lunchbox mystery',
    band: ['B', 'C'],
  },
  {
    id: 'story-time-travel',
    theme: 'story-starters',
    text: 'A kid time-travels to ancient Egypt for a school project. Write the opening.',
    label: 'Time-travel opener',
    band: ['B', 'C'],
  },
  {
    id: 'story-space',
    theme: 'story-starters',
    text: 'Two friends discover a tiny spaceship in their backyard. Write the next 3 sentences.',
    label: 'Backyard spaceship',
    band: ['A', 'B', 'C'],
  },

  // ─── Math (6) ──────────────────────────────────────────────
  {
    id: 'math-mult-17-4',
    theme: 'math',
    text: 'What is 17 times 4? Show your work.',
    label: '17 × 4',
    band: ['A', 'B', 'C'],
    expectedHint: '68',
  },
  {
    id: 'math-add-large',
    theme: 'math',
    text: 'What is 234 + 567? Show the steps.',
    label: '234 + 567',
    band: ['B', 'C'],
    expectedHint: '801',
  },
  {
    id: 'math-fraction',
    theme: 'math',
    text: 'What is half of 84?',
    label: 'Half of 84',
    band: ['A', 'B', 'C'],
    expectedHint: '42',
  },
  {
    id: 'math-perimeter',
    theme: 'math',
    text: 'A rectangle is 5 cm by 7 cm. What is its perimeter?',
    label: 'Rectangle perimeter',
    band: ['B', 'C'],
    expectedHint: '24',
  },
  {
    id: 'math-time',
    theme: 'math',
    text: 'If a movie starts at 3:45 PM and lasts 1 hour 25 minutes, when does it end?',
    label: 'Movie end time',
    band: ['B', 'C'],
    expectedHint: '5:10',
  },
  {
    id: 'math-percent',
    theme: 'math',
    text: 'A book has 240 pages. You\'ve read 25%. How many pages?',
    label: '25% of 240',
    band: ['B', 'C'],
    expectedHint: '60',
  },

  // ─── Translation (6) ───────────────────────────────────────
  {
    id: 'trans-good-morning-fr',
    theme: 'translation',
    text: 'Say "good morning" in French.',
    label: 'Good morning · French',
    band: ['A', 'B', 'C'],
    expectedHint: 'bonjour',
  },
  {
    id: 'trans-thank-you-es',
    theme: 'translation',
    text: 'How do you say "thank you" in Spanish?',
    label: 'Thank you · Spanish',
    band: ['A', 'B', 'C'],
    expectedHint: 'gracias',
  },
  {
    id: 'trans-friend-zh',
    theme: 'translation',
    text: 'How do you say "friend" in Mandarin Chinese?',
    label: 'Friend · Mandarin',
    band: ['A', 'B', 'C'],
    expectedHint: 'péngyǒu',
  },
  {
    id: 'trans-where-is-it',
    theme: 'translation',
    text: 'Translate "Where is the library?" into French.',
    label: 'Library · French',
    band: ['B', 'C'],
    expectedHint: 'bibliothèque',
  },
  {
    id: 'trans-counting-jp',
    theme: 'translation',
    text: 'Count from one to five in Japanese.',
    label: '1-5 · Japanese',
    band: ['B', 'C'],
    expectedHint: 'ichi',
  },
  {
    id: 'trans-pizza-it',
    theme: 'translation',
    text: 'How do you say "I love pizza" in Italian?',
    label: 'Pizza · Italian',
    band: ['A', 'B', 'C'],
    expectedHint: 'pizza',
  },

  // ─── Common Sense (6) ──────────────────────────────────────
  {
    id: 'cs-egg-drop',
    theme: 'common-sense',
    text: 'If I drop an egg on the floor, what happens?',
    label: 'Egg drop',
    band: ['A', 'B', 'C'],
    expectedHint: 'break',
  },
  {
    id: 'cs-water-melt',
    theme: 'common-sense',
    text: 'What happens if I leave an ice cube on the kitchen counter for an hour?',
    label: 'Ice cube on counter',
    band: ['A', 'B', 'C'],
    expectedHint: 'melt',
  },
  {
    id: 'cs-rain-umbrella',
    theme: 'common-sense',
    text: 'It is raining heavily. Should I bring an umbrella to school?',
    label: 'Rainy day',
    band: ['A', 'B', 'C'],
    expectedHint: 'yes',
  },
  {
    id: 'cs-plant-water',
    theme: 'common-sense',
    text: 'A plant in your room is wilting and feels dry. What should you do?',
    label: 'Wilting plant',
    band: ['A', 'B', 'C'],
    expectedHint: 'water',
  },
  {
    id: 'cs-shadow-direction',
    theme: 'common-sense',
    text: 'It is morning and the sun is rising in the east. Which way will my shadow point?',
    label: 'Morning shadow',
    band: ['B', 'C'],
    expectedHint: 'west',
  },
  {
    id: 'cs-mirror',
    theme: 'common-sense',
    text: 'If you wave your right hand at a mirror, which hand do you see waving?',
    label: 'Mirror wave',
    band: ['B', 'C'],
    expectedHint: 'left',
  },

  // ─── Creative (6) ──────────────────────────────────────────
  {
    id: 'creative-robot-name',
    theme: 'creative',
    text: 'Make up a name for a friendly robot that helps with homework.',
    label: 'Robot name',
    band: ['A', 'B', 'C'],
  },
  {
    id: 'creative-cereal',
    theme: 'creative',
    text: 'Invent a name and a slogan for a new healthy kid cereal.',
    label: 'Cereal name + slogan',
    band: ['A', 'B', 'C'],
  },
  {
    id: 'creative-superpower',
    theme: 'creative',
    text: 'Come up with a useful superpower that no superhero has yet.',
    label: 'New superpower',
    band: ['B', 'C'],
  },
  {
    id: 'creative-island',
    theme: 'creative',
    text: 'Name a tiny island and describe one rule everyone on it follows.',
    label: 'Tiny island',
    band: ['B', 'C'],
  },
  {
    id: 'creative-ice-cream',
    theme: 'creative',
    text: 'Invent a wild ice-cream flavor with three ingredients. No grossness.',
    label: 'Wild ice-cream',
    band: ['A', 'B', 'C'],
  },
  {
    id: 'creative-tagline',
    theme: 'creative',
    text: 'Write a 5-word tagline for a website where kids learn AI.',
    label: 'Kid AI tagline',
    band: ['A', 'B', 'C'],
  },
] as const;

if (process.env.NODE_ENV !== 'production' && POCKET_PROMPTS.length !== 30) {
  throw new Error(`POCKET_PROMPTS expected 30 entries, got ${POCKET_PROMPTS.length}`);
}

// ─── Race-mode trivia (12 short Q+A pairs) ───────────────────────

export interface RaceTrivia {
  id: string;
  question: string;
  /** Kid-readable acceptable answer keywords (case-insensitive substring
   *  match). The SLM's response just needs to include any of these. */
  acceptableKeywords: string[];
  band: AgeBand[];
}

export const RACE_TRIVIA: readonly RaceTrivia[] = [
  { id: 'r1', question: 'What is the largest planet in our solar system?', acceptableKeywords: ['jupiter'], band: ['A', 'B', 'C'] },
  { id: 'r2', question: 'How many sides does a hexagon have?', acceptableKeywords: ['six', '6'], band: ['A', 'B', 'C'] },
  { id: 'r3', question: 'What gas do plants breathe in?', acceptableKeywords: ['carbon dioxide', 'co2'], band: ['B', 'C'] },
  { id: 'r4', question: 'Who painted the Mona Lisa?', acceptableKeywords: ['da vinci', 'leonardo'], band: ['B', 'C'] },
  { id: 'r5', question: 'What animal is the king of the jungle?', acceptableKeywords: ['lion'], band: ['A', 'B', 'C'] },
  { id: 'r6', question: 'How many continents are there?', acceptableKeywords: ['seven', '7'], band: ['A', 'B', 'C'] },
  { id: 'r7', question: 'What color do you get when you mix blue and yellow?', acceptableKeywords: ['green'], band: ['A', 'B', 'C'] },
  { id: 'r8', question: 'What is the capital of Japan?', acceptableKeywords: ['tokyo'], band: ['B', 'C'] },
  { id: 'r9', question: 'How many minutes are in an hour?', acceptableKeywords: ['sixty', '60'], band: ['A', 'B', 'C'] },
  { id: 'r10', question: 'What is the chemical symbol for water?', acceptableKeywords: ['h2o', 'h₂o'], band: ['B', 'C'] },
  { id: 'r11', question: 'What is the smallest prime number?', acceptableKeywords: ['two', '2'], band: ['B', 'C'] },
  { id: 'r12', question: 'What ocean is the largest?', acceptableKeywords: ['pacific'], band: ['A', 'B', 'C'] },
] as const;

if (process.env.NODE_ENV !== 'production' && RACE_TRIVIA.length !== 12) {
  throw new Error(`RACE_TRIVIA expected 12 entries, got ${RACE_TRIVIA.length}`);
}

// ─── Lookup helpers ──────────────────────────────────────────────

export function getPrompt(id: string): PocketPrompt | undefined {
  return POCKET_PROMPTS.find((p) => p.id === id);
}

export function promptsForBand(band: 'A' | 'B' | 'C'): PocketPrompt[] {
  return POCKET_PROMPTS.filter((p) => p.band.includes(band));
}

export function promptsByTheme(theme: PromptTheme): PocketPrompt[] {
  return POCKET_PROMPTS.filter((p) => p.theme === theme);
}

export function triviaForBand(band: 'A' | 'B' | 'C'): RaceTrivia[] {
  return RACE_TRIVIA.filter((t) => t.band.includes(band));
}

/** True if `output` is judged to "answer" the trivia question. */
export function isTriviaAnswerCorrect(trivia: RaceTrivia, output: string): boolean {
  const lower = output.toLowerCase();
  return trivia.acceptableKeywords.some((kw) => lower.includes(kw));
}

// ─── Theme display metadata ──────────────────────────────────────

export const THEME_META: Record<PromptTheme, { label: string; emoji: string; color: string }> = {
  'story-starters': { label: 'Story starters', emoji: '📖', color: '#B67BFF' },
  'math':           { label: 'Math',           emoji: '🧮', color: '#0FB8FA' },
  'translation':    { label: 'Translation',    emoji: '🌐', color: '#FF70AF' },
  'common-sense':   { label: 'Common sense',   emoji: '💡', color: '#D9A430' },
  'creative':       { label: 'Creative',       emoji: '🎨', color: '#DE5AEA' },
};
