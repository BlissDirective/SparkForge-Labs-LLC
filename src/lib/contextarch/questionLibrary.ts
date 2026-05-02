// src/lib/contextarch/questionLibrary.ts
// ════════════════════════════════════════════════════════════════
// Stage 11B — Context Architect question library
// ════════════════════════════════════════════════════════════════
// 24 hand-built kid-safe questions across 3 difficulty bands +
// the 6 themes. Each declares which cards FULLY answer it (keyCardIds)
// and which DECOY cards look related but don't help (decoyCardIds).
// ════════════════════════════════════════════════════════════════

import type { Question } from '@/types/contextArchitect';

export const QUESTION_LIBRARY: readonly Question[] = [
  // ─── Easy (8) — single-card answers, simple yes/no or recall ──
  {
    id: 'q-octopus-count',
    text: 'How many brains does an octopus have?',
    keyCardIds: ['a-octopus-brains'],
    decoyCardIds: ['a-elephant-mirror', 'b-brain-energy'],
    difficulty: 'easy',
    band: ['A', 'B', 'C'],
    hint: 'Look at the animals shelf.',
  },
  {
    id: 'q-saturn-float',
    text: 'Which planet would float in water?',
    keyCardIds: ['s-saturn-floats'],
    decoyCardIds: ['s-jupiter-storm', 's-pluto-name'],
    difficulty: 'easy',
    band: ['A', 'B', 'C'],
  },
  {
    id: 'q-zero-origin',
    text: 'Where was the number zero invented?',
    keyCardIds: ['m-zero-india'],
    decoyCardIds: ['m-roman-no-zero'],
    difficulty: 'easy',
    band: ['A', 'B', 'C'],
  },
  {
    id: 'q-wifi-physics',
    text: 'What kind of waves are Wi-Fi signals?',
    keyCardIds: ['t-wifi-radio'],
    decoyCardIds: ['t-binary'],
    difficulty: 'easy',
    band: ['A', 'B', 'C'],
  },
  {
    id: 'q-water-coverage',
    text: 'About what percent of Earth is covered by water?',
    keyCardIds: ['e-water-percent'],
    decoyCardIds: ['e-ocean-unexplored'],
    difficulty: 'easy',
    band: ['A', 'B', 'C'],
  },
  {
    id: 'q-brain-energy',
    text: 'About what percent of your body\'s energy does your brain use?',
    keyCardIds: ['b-brain-energy'],
    decoyCardIds: ['b-heart-beats'],
    difficulty: 'easy',
    band: ['A', 'B', 'C'],
  },
  {
    id: 'q-cat-vision',
    text: 'Can cats see ultraviolet light?',
    keyCardIds: ['a-cat-uv'],
    decoyCardIds: ['a-bee-faces'],
    difficulty: 'easy',
    band: ['A', 'B', 'C'],
  },
  {
    id: 'q-bones-renew',
    text: 'About how often do your bones replace themselves?',
    keyCardIds: ['b-bones-renew'],
    decoyCardIds: ['b-skin-cells'],
    difficulty: 'easy',
    band: ['A', 'B', 'C'],
  },

  // ─── Medium (8) — 2-card answers ───────────────────────────
  {
    id: 'q-mars-vs-earth-day',
    text: 'How does a Mars day compare to an Earth day, and how long is it?',
    keyCardIds: ['s-mars-day'],
    decoyCardIds: ['s-light-time', 's-moon-drifts'],
    difficulty: 'medium',
    band: ['B', 'C'],
  },
  {
    id: 'q-internet-cables',
    text: 'How does most internet traffic travel between continents?',
    keyCardIds: ['t-internet-cables'],
    decoyCardIds: ['t-wifi-radio', 't-pixel'],
    difficulty: 'medium',
    band: ['B', 'C'],
  },
  {
    id: 'q-amazon-oxygen-myth',
    text: 'Does the Amazon produce 20% of Earth\'s oxygen?',
    keyCardIds: ['e-amazon-oxygen'],
    decoyCardIds: ['b-immune-memory'],
    difficulty: 'medium',
    band: ['B', 'C'],
    hint: 'A common claim is overstated.',
  },
  {
    id: 'q-dolphins-names',
    text: 'Do dolphins have names for each other? How?',
    keyCardIds: ['a-dolphin-name'],
    decoyCardIds: ['a-bee-faces', 'a-elephant-mirror'],
    difficulty: 'medium',
    band: ['B', 'C'],
  },
  {
    id: 'q-bee-recognition',
    text: 'Can bees recognize human faces, and can elephants pass the mirror test?',
    keyCardIds: ['a-bee-faces', 'a-elephant-mirror'],
    decoyCardIds: ['a-cat-uv', 'a-octopus-brains'],
    difficulty: 'medium',
    band: ['B', 'C'],
  },
  {
    id: 'q-magnetic-flip',
    text: 'How often do Earth\'s magnetic poles flip?',
    keyCardIds: ['e-magnetic-flip'],
    decoyCardIds: ['e-himalaya-grow', 'e-volcano-count'],
    difficulty: 'medium',
    band: ['B', 'C'],
  },
  {
    id: 'q-pi-digits',
    text: 'How many digits of pi do we know, and does pi ever repeat?',
    keyCardIds: ['m-pi-irrational'],
    decoyCardIds: ['m-primes-infinite', 'm-perfect-numbers'],
    difficulty: 'medium',
    band: ['B', 'C'],
  },
  {
    id: 'q-blood-and-eyes',
    text: 'How long are all your blood vessels, and how much resolution does your eye have?',
    keyCardIds: ['b-blood-vessels', 'b-eyes-megapixels'],
    decoyCardIds: ['b-stomach-acid'],
    difficulty: 'medium',
    band: ['B', 'C'],
  },

  // ─── Hard (8) — 3+ card multi-fact answers, often cross-theme ─
  {
    id: 'q-survival-extremes',
    text: 'What animal can survive in outer space, and how does it do it compared to a regular animal\'s biology?',
    keyCardIds: ['a-tardigrade', 'b-immune-memory'],
    decoyCardIds: ['a-elephant-mirror', 's-pluto-name'],
    difficulty: 'hard',
    band: ['C'],
  },
  {
    id: 'q-quantum-vs-classical',
    text: 'How is a qubit different from a normal computer bit, and what number system do classical computers use?',
    keyCardIds: ['t-quantum-bit', 't-binary'],
    decoyCardIds: ['t-pixel', 't-mouse-name'],
    difficulty: 'hard',
    band: ['C'],
  },
  {
    id: 'q-fibonacci-nature',
    text: 'Where does the Fibonacci sequence show up in nature, and why is it considered an example of math in the world?',
    keyCardIds: ['m-fibonacci-nature', 'm-primes-infinite'],
    decoyCardIds: ['m-graham-number'],
    difficulty: 'hard',
    band: ['C'],
  },
  {
    id: 'q-deep-time',
    text: 'How recently was the Sahara a forest, and how often have Earth\'s magnetic poles flipped over that time?',
    keyCardIds: ['e-sahara-forest', 'e-magnetic-flip'],
    decoyCardIds: ['e-volcano-count'],
    difficulty: 'hard',
    band: ['C'],
  },
  {
    id: 'q-self-aware-animals',
    text: 'Which animals show signs of self-awareness or individual identity, and what test do scientists use?',
    keyCardIds: ['a-elephant-mirror', 'a-dolphin-name', 'a-octopus-brains'],
    decoyCardIds: ['a-cat-uv', 'a-giraffe-tongue'],
    difficulty: 'hard',
    band: ['C'],
  },
  {
    id: 'q-storms-and-time',
    text: 'How long has Jupiter\'s Great Red Spot been raging, and how long does sunlight take to reach Earth?',
    keyCardIds: ['s-jupiter-storm', 's-light-time'],
    decoyCardIds: ['s-sun-core', 's-neutron-density'],
    difficulty: 'hard',
    band: ['C'],
  },
  {
    id: 'q-body-renewal',
    text: 'How often do your bones, skin, and stomach lining renew themselves?',
    keyCardIds: ['b-bones-renew', 'b-skin-cells', 'b-stomach-acid'],
    decoyCardIds: ['b-immune-memory'],
    difficulty: 'hard',
    band: ['C'],
  },
  {
    id: 'q-impossibly-big',
    text: 'Why is Graham\'s number considered impossibly large, and how does it relate to ideas like infinity in math?',
    keyCardIds: ['m-graham-number', 'm-primes-infinite'],
    decoyCardIds: ['m-perfect-numbers', 'm-pi-irrational'],
    difficulty: 'hard',
    band: ['C'],
  },
] as const;

if (process.env.NODE_ENV !== 'production' && QUESTION_LIBRARY.length !== 24) {
  throw new Error(`QUESTION_LIBRARY expected 24 entries, got ${QUESTION_LIBRARY.length}`);
}

// ─── Lookup helpers ──────────────────────────────────────────────

export function getQuestion(id: string): Question | undefined {
  return QUESTION_LIBRARY.find((q) => q.id === id);
}

export function questionsForBand(band: 'A' | 'B' | 'C'): Question[] {
  return QUESTION_LIBRARY.filter((q) => q.band.includes(band));
}

export function questionsByDifficulty(diff: Question['difficulty']): Question[] {
  return QUESTION_LIBRARY.filter((q) => q.difficulty === diff);
}
