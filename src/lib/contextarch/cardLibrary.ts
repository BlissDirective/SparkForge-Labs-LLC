// src/lib/contextarch/cardLibrary.ts
// ════════════════════════════════════════════════════════════════
// Stage 11B — Context Architect knowledge cards (48 total)
// ════════════════════════════════════════════════════════════════
// Per Doc 2 §E.5: 48 hand-built cards across 6 themes (8 each).
// Each card has 4 metadata properties (tokens / serves / decay /
// freshness — freshness is computed at runtime so it's not stored
// here). Cards are static at runtime; the budget engine layers
// per-question relevance on top.
// ════════════════════════════════════════════════════════════════

import type { CardTheme, ContextCard } from '@/types/contextArchitect';

// Helper to keep card declarations compact + scan-friendly.
function card(
  id: string,
  theme: CardTheme,
  emoji: string,
  title: string,
  text: string,
  tokens: ContextCard['tokens'],
  serves: CardTheme[] = [theme],
  decay = 0.4,
  unlockTier: ContextCard['unlockTier'] = 'A',
): ContextCard {
  return { id, theme, emoji, title, text, tokens, serves, decay, unlockTier };
}

// ─── Animals (8) ─────────────────────────────────────────────────

const ANIMALS: ContextCard[] = [
  card('a-octopus-brains', 'animals', '🐙', 'Octopus brains', 'An octopus has 9 brains: a central one + one in each of its 8 arms.', 16, ['animals', 'body'], 0.3),
  card('a-cat-uv', 'animals', '🐈', 'Cats see UV', 'Cats can see in ultraviolet light, which is invisible to humans.', 16, ['animals'], 0.4),
  card('a-bee-faces', 'animals', '🐝', 'Bees know faces', 'Honeybees can recognize individual human faces.', 16, ['animals'], 0.3),
  card('a-dolphin-name', 'animals', '🐬', 'Dolphin names', 'Dolphins have unique signature whistles that work like names.', 32, ['animals'], 0.3, 'B'),
  card('a-elephant-mirror', 'animals', '🐘', 'Elephant mirror', 'Elephants pass the mirror test — they recognize themselves.', 32, ['animals', 'body'], 0.4, 'B'),
  card('a-giraffe-tongue', 'animals', '🦒', 'Giraffe tongue', 'Giraffe tongues are blue-purple and up to 50 cm long.', 16, ['animals', 'body'], 0.5),
  card('a-tardigrade', 'animals', '🦠', 'Tardigrades', 'Tardigrades survive freezing, boiling, and outer space vacuum.', 32, ['animals', 'space'], 0.3, 'C'),
  card('a-axolotl', 'animals', '🦎', 'Axolotl regrow', 'Axolotls can regrow lost limbs, including parts of their brain.', 32, ['animals', 'body'], 0.3, 'B'),
];

// ─── Space (8) ───────────────────────────────────────────────────

const SPACE: ContextCard[] = [
  card('s-saturn-floats', 'space', '🪐', 'Saturn floats', 'Saturn would float in water — it is less dense than water.', 16, ['space'], 0.4),
  card('s-mars-day', 'space', '🚀', 'Mars day length', 'A day on Mars is 24 hours 39 minutes — only slightly longer than Earth.', 16, ['space'], 0.4),
  card('s-sun-core', 'space', '☀️', 'Sun core temp', 'The Sun\'s core reaches 27 million degrees Fahrenheit.', 32, ['space'], 0.3, 'B'),
  card('s-light-time', 'space', '🔭', 'Sunlight delay', 'Sunlight takes about 8 minutes 20 seconds to reach Earth.', 32, ['space'], 0.3, 'B'),
  card('s-moon-drifts', 'space', '🌙', 'Moon drifts', 'The Moon drifts about 3.8 cm farther from Earth each year.', 32, ['space', 'earth'], 0.4, 'B'),
  card('s-neutron-density', 'space', '⭐', 'Neutron density', 'A teaspoon of neutron-star matter weighs about 4 billion tons.', 64, ['space'], 0.3, 'C'),
  card('s-jupiter-storm', 'space', '🌪️', 'Jupiter storm', 'Jupiter\'s Great Red Spot is a storm bigger than Earth, raging 350+ years.', 32, ['space'], 0.3, 'B'),
  card('s-pluto-name', 'space', '🪐', 'Pluto naming', 'Pluto was named in 1930 by an 11-year-old English girl, Venetia Burney.', 32, ['space'], 0.5, 'C'),
];

// ─── Tech (8) ────────────────────────────────────────────────────

const TECH: ContextCard[] = [
  card('t-wifi-radio', 'tech', '📶', 'Wi-Fi is radio', 'Wi-Fi is just radio waves — same physics as your AM/FM radio, much shorter wavelengths.', 16, ['tech'], 0.4),
  card('t-qr-codes', 'tech', '🔲', 'QR codes', 'QR codes can store URLs, contact info, plain text up to about 4,000 characters.', 16, ['tech'], 0.5),
  card('t-phone-sensors', 'tech', '📱', 'Phone sensors', 'A typical smartphone has 6+ sensors: accelerometer, gyroscope, GPS, light, proximity, magnetometer.', 32, ['tech'], 0.4, 'B'),
  card('t-internet-cables', 'tech', '🌐', 'Undersea cables', 'About 99% of all internet traffic travels through undersea fiber-optic cables.', 32, ['tech', 'earth'], 0.3, 'B'),
  card('t-binary', 'tech', '💾', 'Binary basics', 'Computers represent every value with combinations of just two states: 0 and 1.', 16, ['tech', 'math'], 0.3),
  card('t-pixel', 'tech', '🖼️', 'Pixel meaning', 'Pixel is short for "picture element" — the smallest dot a screen can show.', 16, ['tech'], 0.4),
  card('t-mouse-name', 'tech', '🖱️', 'Mouse origin', 'The computer mouse was invented in 1964 by Doug Engelbart.', 32, ['tech'], 0.5, 'B'),
  card('t-quantum-bit', 'tech', '⚛️', 'Qubit basics', 'A qubit can be 0, 1, or both at once — that\'s called superposition.', 64, ['tech', 'math'], 0.3, 'C'),
];

// ─── Body (8) ────────────────────────────────────────────────────

const BODY: ContextCard[] = [
  card('b-brain-energy', 'body', '🧠', 'Brain energy', 'Your brain uses about 20% of your body\'s energy, even when you\'re resting.', 16, ['body'], 0.3),
  card('b-bones-renew', 'body', '🦴', 'Bones renew', 'Your bones replace themselves about every 10 years.', 16, ['body'], 0.4),
  card('b-blood-vessels', 'body', '🫀', 'Blood-vessel length', 'If you laid out all your blood vessels end-to-end, they\'d circle Earth 2.5 times.', 32, ['body'], 0.3, 'B'),
  card('b-skin-cells', 'body', '🧬', 'Skin renewal', 'You shed about 30,000-40,000 dead skin cells every minute.', 32, ['body'], 0.4),
  card('b-stomach-acid', 'body', '🫀', 'Stomach acid', 'Stomach acid is strong enough to dissolve metal — but the lining renews every few days.', 32, ['body'], 0.3, 'B'),
  card('b-eyes-megapixels', 'body', '👁️', 'Eye resolution', 'The human eye sees roughly 576 megapixels — way past any camera.', 32, ['body'], 0.5, 'B'),
  card('b-heart-beats', 'body', '❤️', 'Heart count', 'Your heart beats about 100,000 times a day — 35 million times a year.', 16, ['body', 'math'], 0.4),
  card('b-immune-memory', 'body', '🛡️', 'Immune memory', 'Your immune system remembers every germ it has ever beaten.', 32, ['body'], 0.3, 'C'),
];

// ─── Earth (8) ───────────────────────────────────────────────────

const EARTH: ContextCard[] = [
  card('e-sahara-forest', 'earth', '🏜️', 'Sahara was green', 'The Sahara was a forest about 6,000 years ago.', 16, ['earth'], 0.3),
  card('e-lightning-rate', 'earth', '⚡', 'Lightning rate', 'Lightning strikes Earth about 100 times per second.', 16, ['earth'], 0.4),
  card('e-magnetic-flip', 'earth', '🧭', 'Magnetic flip', 'Earth\'s magnetic poles flip every 200,000-300,000 years on average.', 32, ['earth'], 0.3, 'B'),
  card('e-water-percent', 'earth', '💧', 'Water on Earth', 'About 71% of Earth\'s surface is covered by water.', 16, ['earth'], 0.4),
  card('e-ocean-unexplored', 'earth', '🌊', 'Unexplored ocean', 'Over 80% of Earth\'s oceans remain unexplored and unmapped.', 32, ['earth'], 0.4, 'B'),
  card('e-himalaya-grow', 'earth', '🏔️', 'Himalayas grow', 'The Himalayas grow about 5 mm taller every year as plates collide.', 32, ['earth'], 0.3, 'B'),
  card('e-volcano-count', 'earth', '🌋', 'Active volcanoes', 'Earth has about 1,500 potentially active volcanoes today.', 32, ['earth'], 0.4, 'B'),
  card('e-amazon-oxygen', 'earth', '🌳', 'Amazon oxygen', 'The Amazon produces about 6% of the world\'s oxygen — way less than the famous "20% of Earth\'s oxygen" myth.', 64, ['earth', 'body'], 0.3, 'C'),
];

// ─── Math (8) ────────────────────────────────────────────────────

const MATH: ContextCard[] = [
  card('m-zero-india', 'math', '0️⃣', 'Zero invented', 'The number zero was invented in India around 600 CE.', 16, ['math'], 0.5),
  card('m-primes-infinite', 'math', '🔢', 'Infinite primes', 'There are infinitely many prime numbers — Euclid proved this 2,300 years ago.', 16, ['math'], 0.3),
  card('m-pi-irrational', 'math', '🥧', 'Pi irrational', 'Pi has been calculated to over 100 trillion digits — but it never repeats.', 32, ['math'], 0.3, 'B'),
  card('m-fibonacci-nature', 'math', '🌻', 'Fibonacci nature', 'The Fibonacci sequence appears in sunflower seeds, pinecones, and shell spirals.', 32, ['math', 'earth'], 0.3, 'B'),
  card('m-graham-number', 'math', '∞', 'Graham\'s number', 'Graham\'s number is so big you can\'t write it down even using all atoms in the universe.', 64, ['math'], 0.4, 'C'),
  card('m-roman-no-zero', 'math', '🏛️', 'Roman numerals', 'Roman numerals had no symbol for zero — that\'s why they were so hard to do math with.', 32, ['math'], 0.4, 'B'),
  card('m-perfect-numbers', 'math', '✨', 'Perfect numbers', 'A perfect number equals the sum of its divisors. Examples: 6, 28, 496.', 32, ['math'], 0.3, 'C'),
  card('m-monte-carlo', 'math', '🎲', 'Monte Carlo', 'You can estimate pi by throwing random darts at a square + circle.', 64, ['math'], 0.3, 'C'),
];

// ─── Combined library export ─────────────────────────────────────

export const CARD_LIBRARY: readonly ContextCard[] = [
  ...ANIMALS,
  ...SPACE,
  ...TECH,
  ...BODY,
  ...EARTH,
  ...MATH,
] as const;

if (process.env.NODE_ENV !== 'production' && CARD_LIBRARY.length !== 48) {
  throw new Error(`CARD_LIBRARY expected 48 entries, got ${CARD_LIBRARY.length}`);
}

// ─── Lookup helpers ──────────────────────────────────────────────

export function getCard(id: string): ContextCard | undefined {
  return CARD_LIBRARY.find((c) => c.id === id);
}

export function cardsForBand(band: 'A' | 'B' | 'C'): ContextCard[] {
  if (band === 'A') return CARD_LIBRARY.filter((c) => c.unlockTier === 'A');
  if (band === 'B') return CARD_LIBRARY.filter((c) => c.unlockTier === 'A' || c.unlockTier === 'B');
  return [...CARD_LIBRARY];
}

export function cardsByTheme(theme: CardTheme): ContextCard[] {
  return CARD_LIBRARY.filter((c) => c.theme === theme);
}

// ─── Display metadata ────────────────────────────────────────────

export const THEME_META: Record<CardTheme, { label: string; emoji: string; color: string }> = {
  animals: { label: 'Animals', emoji: '🐙', color: '#00D17A' },
  space:   { label: 'Space',   emoji: '🪐', color: '#B67BFF' },
  tech:    { label: 'Tech',    emoji: '💾', color: '#0FB8FA' },
  body:    { label: 'Body',    emoji: '🧠', color: '#FF70AF' },
  earth:   { label: 'Earth',   emoji: '🌍', color: '#D9A430' },
  math:    { label: 'Math',    emoji: '🔢', color: '#10BAD2' },
};

// ─── Reduced-card derivation ─────────────────────────────────────

/** Compute the reduced (summarized) token cost — half, rounded down to
 *  the nearest CardTokenSize. 8 → 8 (can't go smaller). */
export function reducedTokensFor(card: ContextCard): ContextCard['tokens'] {
  const halved = card.tokens / 2;
  if (halved >= 32) return 32;
  if (halved >= 16) return 16;
  return 8;
}
