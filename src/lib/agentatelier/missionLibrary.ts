// src/lib/agentatelier/missionLibrary.ts
// ================================================================
// Stage 11D — Agent Atelier (C1)
// ================================================================
// 8 hand-built missions × 3 difficulty levels (easy/medium/hard) =
// 24 mission entries. Plus runtime AI-generated mission slot is
// rate-limited via existing ai-content-generator.ts infra under the
// 'agent-atelier' GameId (added in Sub-task 11D.8). Total reachable
// content per session: 24 hardcoded + up to 12 AI-generated = 36
// units, meeting Doc 2 §A.4 content target.
//
// Each mission's `rubric` is hand-built; weights need not sum to 1
// (renormalized at score time by `missionRunner.grade`).
// ================================================================

import type { Mission } from '@/types/agentAtelier';

// ─── Helpers ─────────────────────────────────────────────────────

// Inline factory keeps each mission entry short.
function m(
  base: string,
  diff: 'easy' | 'medium' | 'hard',
  fields: Omit<Mission, 'id' | 'difficulty' | 'band'> & { band?: Mission['band'] },
): Mission {
  return {
    id: `${base}-${diff}`,
    difficulty: diff,
    band: fields.band ?? (diff === 'hard' ? ['C'] : diff === 'medium' ? ['B', 'C'] : ['A', 'B', 'C']),
    ...fields,
  };
}

// ─── Mission 1: The Birthday Plan ────────────────────────────────
const BIRTHDAY_PLAN: Mission[] = [
  m('birthday-plan', 'easy', {
    title: 'Plan a $40 Birthday',
    prompt: 'Plan a kid\'s birthday party for a $40 budget. Pick a theme, list 3 activities, and estimate the total cost.',
    expectedOutput: 'text',
    parAgentCount: 3,
    rubric: [
      { criterion: 'Includes a clear theme', weight: 1 },
      { criterion: 'Lists at least 3 activities', weight: 1 },
      { criterion: 'Total cost stays under $40', weight: 2 },
    ],
  }),
  m('birthday-plan', 'medium', {
    title: 'Plan a $40 Birthday with Constraints',
    prompt: 'Plan a 6-year-old\'s birthday for $40 — must include a craft, a snack, and a quiet game (one kid is shy).',
    expectedOutput: 'text',
    parAgentCount: 4,
    rubric: [
      { criterion: 'Includes a craft', weight: 1 },
      { criterion: 'Includes a snack', weight: 1 },
      { criterion: 'Includes a quiet game', weight: 1 },
      { criterion: 'Cost ≤ $40', weight: 2 },
      { criterion: 'Age-appropriate for 6-year-olds', weight: 1 },
    ],
  }),
  m('birthday-plan', 'hard', {
    title: 'Plan, Critique, Revise a Birthday',
    prompt: 'Plan a 9-year-old\'s outdoor birthday for $40, get a Critic to find 3 weaknesses, then revise the plan with the issues fixed. Final output must list both versions.',
    expectedOutput: 'text',
    parAgentCount: 5,
    rubric: [
      { criterion: 'Initial plan present', weight: 1 },
      { criterion: 'Critic identifies ≥ 3 issues', weight: 1.5 },
      { criterion: 'Revised plan addresses every issue', weight: 2 },
      { criterion: 'Cost stays ≤ $40 in both versions', weight: 1.5 },
    ],
  }),
];

// ─── Mission 2: The Fact Check ───────────────────────────────────
const FACT_CHECK: Mission[] = [
  m('fact-check', 'easy', {
    title: 'Verify 3 Animal Facts',
    prompt: 'Check these 3 claims and label each TRUE or FALSE: (1) Cats can see in total darkness. (2) An octopus has nine brains. (3) Honeybees can recognize human faces.',
    expectedOutput: 'list',
    parAgentCount: 2,
    rubric: [
      { criterion: 'Each claim labeled TRUE or FALSE', weight: 1 },
      { criterion: 'All 3 labels correct', weight: 3 },
    ],
  }),
  m('fact-check', 'medium', {
    title: 'Verify + Cite 3 Science Claims',
    prompt: 'Check these 3 claims, label each TRUE/FALSE/PARTIAL, and add a one-sentence reason: (1) The Sahara was once a forest. (2) Mars has volcanoes. (3) Lightning strikes Earth 100 times per second on average.',
    expectedOutput: 'list',
    parAgentCount: 3,
    rubric: [
      { criterion: 'Each claim labeled', weight: 1 },
      { criterion: 'Labels correct (3-way: T/F/P)', weight: 2 },
      { criterion: 'One-sentence reason per claim', weight: 1.5 },
    ],
  }),
  m('fact-check', 'hard', {
    title: 'Adversarial Fact Check',
    prompt: 'Check these 4 claims; one is real but worded misleadingly. Label each, identify the misleading one, and rewrite it accurately: (1) Saturn would float in water. (2) Humans share 50% of their DNA with bananas. (3) The Great Wall is visible from the Moon. (4) Goldfish have 3-second memories.',
    expectedOutput: 'list',
    parAgentCount: 4,
    rubric: [
      { criterion: 'All 4 claims labeled', weight: 1 },
      { criterion: 'Correctly identifies the misleading claim', weight: 2 },
      { criterion: 'Rewrites the misleading claim accurately', weight: 2 },
      { criterion: 'No false positives (non-misleading claims left alone)', weight: 1 },
    ],
  }),
];

// ─── Mission 3: Lunchbox Re-Design ───────────────────────────────
const LUNCHBOX: Mission[] = [
  m('lunchbox', 'easy', {
    title: 'Design a Recyclable Lunchbox',
    prompt: 'Propose a recyclable lunchbox design for a 7-year-old. List the materials, one feature you like, and a rough cost guess in dollars.',
    expectedOutput: 'text',
    parAgentCount: 2,
    rubric: [
      { criterion: 'Materials are recyclable', weight: 2 },
      { criterion: 'Mentions one feature', weight: 1 },
      { criterion: 'Includes a cost estimate', weight: 1 },
    ],
  }),
  m('lunchbox', 'medium', {
    title: 'Design + Estimate a Lunchbox',
    prompt: 'Design a recyclable lunchbox with a thermos slot, leak-proof lid, and snap-shut latch. Estimate part-by-part cost (target ≤ $12) and total weight (target ≤ 300g).',
    expectedOutput: 'text',
    parAgentCount: 3,
    rubric: [
      { criterion: 'All 3 features present', weight: 1.5 },
      { criterion: 'Per-part cost breakdown', weight: 1 },
      { criterion: 'Total cost ≤ $12', weight: 1.5 },
      { criterion: 'Total weight ≤ 300g', weight: 1 },
    ],
  }),
  m('lunchbox', 'hard', {
    title: 'Critique-Driven Lunchbox Iteration',
    prompt: 'Propose lunchbox v1, run a Critic against the design, then propose v2 fixing all critic issues while staying ≤ $12 and ≤ 300g.',
    expectedOutput: 'text',
    parAgentCount: 5,
    rubric: [
      { criterion: 'v1 design present', weight: 1 },
      { criterion: 'Critic finds ≥ 3 issues', weight: 1.5 },
      { criterion: 'v2 fixes every issue', weight: 2 },
      { criterion: 'v2 still ≤ $12 and ≤ 300g', weight: 1.5 },
    ],
  }),
];

// ─── Mission 4: The Story Editor ─────────────────────────────────
const STORY_EDITOR: Mission[] = [
  m('story-editor', 'easy', {
    title: 'Improve a 3-Sentence Story',
    prompt: 'Take this draft and improve it: "The cat saw a bird. It was hungry. It ran." Make it more vivid in 3-4 sentences.',
    expectedOutput: 'text',
    parAgentCount: 2,
    rubric: [
      { criterion: 'Output is 3-4 sentences', weight: 1 },
      { criterion: 'Adds at least 2 vivid details', weight: 2 },
      { criterion: 'Keeps the original story\'s meaning', weight: 1.5 },
    ],
  }),
  m('story-editor', 'medium', {
    title: 'Improve + Translate a Paragraph',
    prompt: 'Improve a 3-paragraph draft about a school field trip, then translate the improved version into Spanish, keeping the same tone.',
    expectedOutput: 'text',
    parAgentCount: 4,
    rubric: [
      { criterion: 'Improved English version present', weight: 1 },
      { criterion: 'Spanish translation present', weight: 1 },
      { criterion: 'Spanish preserves original tone', weight: 2 },
      { criterion: 'No grammatical errors', weight: 1 },
    ],
  }),
  m('story-editor', 'hard', {
    title: 'Edit, Translate, Critique-Loop a Story',
    prompt: 'Improve a 3-paragraph story. Translate it. Critic finds 2 cultural issues in the translation. Translator revises. Final output: original, improved, translated v1, critic notes, translated v2.',
    expectedOutput: 'text',
    parAgentCount: 6,
    rubric: [
      { criterion: 'All 5 versions present', weight: 1.5 },
      { criterion: 'Critic identifies cultural issues', weight: 1.5 },
      { criterion: 'v2 fixes the issues', weight: 2 },
      { criterion: 'Tone preserved end-to-end', weight: 1 },
    ],
  }),
];

// ─── Mission 5: Homework Hot Seat ────────────────────────────────
const HOMEWORK: Mission[] = [
  m('homework', 'easy', {
    title: 'Solve a 2-Step Word Problem',
    prompt: 'A bookstore has 24 books on a shelf. They sell 9 books and stock 6 more. How many books are on the shelf now? Show each step.',
    expectedOutput: 'text',
    parAgentCount: 2,
    rubric: [
      { criterion: 'Final answer is 21', weight: 2 },
      { criterion: 'Shows step 1 (subtract)', weight: 1 },
      { criterion: 'Shows step 2 (add)', weight: 1 },
    ],
  }),
  m('homework', 'medium', {
    title: 'Solve a Multi-Step Word Problem',
    prompt: 'A train leaves at 9:15 AM going 60 mph. A car leaves the same station at 9:45 AM going 75 mph the same direction. When does the car catch up? Show each step.',
    expectedOutput: 'text',
    parAgentCount: 3,
    rubric: [
      { criterion: 'Sets up the equation correctly', weight: 1.5 },
      { criterion: 'Solves for catch-up time', weight: 2 },
      { criterion: 'Final answer correct', weight: 2 },
      { criterion: 'Shows clear steps', weight: 1 },
    ],
  }),
  m('homework', 'hard', {
    title: 'Solve, Critique, Re-Solve',
    prompt: 'Solve a 4-variable algebra word problem about a school fundraiser. Critic checks each step for errors. If any step is wrong, redo from there. Output: full solution + critic notes + final corrected answer.',
    expectedOutput: 'text',
    parAgentCount: 5,
    rubric: [
      { criterion: 'Full solution present', weight: 1 },
      { criterion: 'Critic identifies real errors (not nitpicks)', weight: 1.5 },
      { criterion: 'Corrected answer is correct', weight: 2.5 },
      { criterion: 'Each step justified', weight: 1 },
    ],
  }),
];

// ─── Mission 6: Travel Trio ──────────────────────────────────────
const TRAVEL_TRIO: Mission[] = [
  m('travel-trio', 'easy', {
    title: 'Plan a 3-City Train Trip',
    prompt: 'Plan a 3-city train trip in Europe (any cities). List each city and one thing to do there.',
    expectedOutput: 'text',
    parAgentCount: 2,
    rubric: [
      { criterion: 'Lists 3 cities', weight: 1 },
      { criterion: 'One activity per city', weight: 1 },
      { criterion: 'Cities are train-connected', weight: 1.5 },
    ],
  }),
  m('travel-trio', 'medium', {
    title: 'Plan with Time + Budget',
    prompt: 'Plan a 5-day, 3-city train trip in Italy under €600. Include train times, one daytime activity per city, and a per-city cost estimate.',
    expectedOutput: 'text',
    parAgentCount: 4,
    rubric: [
      { criterion: 'Trip fits in 5 days', weight: 1.5 },
      { criterion: 'Total cost ≤ €600', weight: 2 },
      { criterion: 'Train times realistic', weight: 1 },
      { criterion: 'Each city has an activity', weight: 1 },
    ],
  }),
  m('travel-trio', 'hard', {
    title: 'Plan, Estimate, Critique, Re-Plan',
    prompt: 'Plan a 5-day, 3-city Italy trip ≤ €600. Critic checks for hidden costs (museum tickets, food, transit-within-cities). Replan with all hidden costs included while staying ≤ €600.',
    expectedOutput: 'text',
    parAgentCount: 6,
    rubric: [
      { criterion: 'Initial plan present', weight: 1 },
      { criterion: 'Critic finds ≥ 3 hidden costs', weight: 1.5 },
      { criterion: 'Revised plan covers hidden costs', weight: 2 },
      { criterion: 'Final cost ≤ €600', weight: 2 },
    ],
  }),
];

// ─── Mission 7: Pet Schedule ─────────────────────────────────────
const PET_SCHEDULE: Mission[] = [
  m('pet-schedule', 'easy', {
    title: 'Daily Hamster + Fish Care',
    prompt: 'Make a daily care plan for one hamster and one fish. List feedings, cleanings, and check-ins for both.',
    expectedOutput: 'text',
    parAgentCount: 2,
    rubric: [
      { criterion: 'Hamster daily plan present', weight: 1 },
      { criterion: 'Fish daily plan present', weight: 1 },
      { criterion: 'Includes feedings + cleanings', weight: 1.5 },
    ],
  }),
  m('pet-schedule', 'medium', {
    title: 'Weekly Schedule + Time Estimate',
    prompt: 'Build a weekly care plan (7 days) for a hamster and a fish, with daily time estimates per pet. Include weekly cage clean-out and tank water-change.',
    expectedOutput: 'text',
    parAgentCount: 3,
    rubric: [
      { criterion: '7 days covered', weight: 1 },
      { criterion: 'Weekly tasks scheduled', weight: 1.5 },
      { criterion: 'Time estimates per pet per day', weight: 1.5 },
    ],
  }),
  m('pet-schedule', 'hard', {
    title: 'Schedule + Budget + Critique-Loop',
    prompt: 'Build a 4-week pet plan for hamster + fish with monthly food/supply budget ≤ $25. Critic flags any unsafe practice (e.g., wrong food type). Revise.',
    expectedOutput: 'text',
    parAgentCount: 5,
    rubric: [
      { criterion: 'Full 4-week plan', weight: 1.5 },
      { criterion: 'Monthly budget ≤ $25', weight: 1.5 },
      { criterion: 'Critic finds real safety issues', weight: 1.5 },
      { criterion: 'Revised plan addresses every issue', weight: 1.5 },
    ],
  }),
];

// ─── Mission 8: Build a Joke ─────────────────────────────────────
const BUILD_JOKE: Mission[] = [
  m('build-joke', 'easy', {
    title: 'Tell 3 Kid-Safe Jokes',
    prompt: 'Make up 3 short, kid-safe jokes about cats. Pun-style, knock-knock, and one silly question.',
    expectedOutput: 'text',
    parAgentCount: 2,
    rubric: [
      { criterion: '3 jokes present', weight: 1 },
      { criterion: 'Each is kid-safe', weight: 2 },
      { criterion: 'Variety of styles (pun + knock-knock + silly Q)', weight: 1 },
    ],
  }),
  m('build-joke', 'medium', {
    title: 'Jokes Plus a Critic Pass',
    prompt: 'Generate 5 kid-safe jokes about robots. Critic rates each on humor (1-5) and kid-safety. Keep only those scoring ≥ 4 humor and 5 safety.',
    expectedOutput: 'text',
    parAgentCount: 3,
    rubric: [
      { criterion: '5 initial jokes', weight: 1 },
      { criterion: 'Each rated for humor + safety', weight: 1 },
      { criterion: 'Final list filtered correctly', weight: 1.5 },
      { criterion: 'All final jokes kid-safe', weight: 2 },
    ],
  }),
  m('build-joke', 'hard', {
    title: 'Multilingual Joke Building',
    prompt: 'Generate 4 kid-safe jokes about pizza in English. Translate the funniest 2 to French; Critic checks if the humor survived translation. If not, suggest fixes.',
    expectedOutput: 'text',
    parAgentCount: 5,
    rubric: [
      { criterion: '4 English jokes generated', weight: 1 },
      { criterion: '2 translated correctly', weight: 1.5 },
      { criterion: 'Critic evaluates humor preservation', weight: 1.5 },
      { criterion: 'Fixes proposed where humor was lost', weight: 1.5 },
    ],
  }),
];

// ─── Combined library export ─────────────────────────────────────

export const HARDCODED_MISSIONS: readonly Mission[] = [
  ...BIRTHDAY_PLAN,
  ...FACT_CHECK,
  ...LUNCHBOX,
  ...STORY_EDITOR,
  ...HOMEWORK,
  ...TRAVEL_TRIO,
  ...PET_SCHEDULE,
  ...BUILD_JOKE,
] as const;

// Sanity check: 8 missions × 3 difficulties.
if (process.env.NODE_ENV !== 'production' && HARDCODED_MISSIONS.length !== 24) {
  throw new Error(`HARDCODED_MISSIONS expected 24 entries, got ${HARDCODED_MISSIONS.length}`);
}

// ─── Lookup helpers ──────────────────────────────────────────────

export function getMission(id: string): Mission | undefined {
  return HARDCODED_MISSIONS.find((mn) => mn.id === id);
}

export function missionsForBand(band: 'A' | 'B' | 'C'): Mission[] {
  return HARDCODED_MISSIONS.filter((mn) => mn.band.includes(band));
}

export function missionsByDifficulty(diff: 'easy' | 'medium' | 'hard'): Mission[] {
  return HARDCODED_MISSIONS.filter((mn) => mn.difficulty === diff);
}
