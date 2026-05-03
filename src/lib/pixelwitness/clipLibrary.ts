// src/lib/pixelwitness/clipLibrary.ts
// ════════════════════════════════════════════════════════════════
// Stage 11C — Pixel Witness clip + Q-A library
// ════════════════════════════════════════════════════════════════
// 24 hand-authored kid-safe clip metadata entries × 4 questions each
// = 96 Q-A pairs per Doc 2 §G.5. Question kinds per clip:
//   1. literal      — "what is happening?"
//   2. inferential  — "why is it happening?"
//   3. counting     — "how many?"
//   4. adversarial  — designed to elicit a confidently-wrong answer
//
// Asset pipeline note: video URLs use the documented placeholder
// pattern /videos/pixel-witness/<id>.mp4. When the video file isn't
// provisioned, the player sees a poster fallback (matches CLAUDE.md
// HS-8 pattern). Q-A pairs are pre-recorded so the game is fully
// playable without the videos.
// ════════════════════════════════════════════════════════════════

import type { ClipQuestion, ClipTheme, PixelClip, QuestionKind } from '@/types/pixelWitness';

const VIDEO_BASE = '/videos/pixel-witness';

function clip(
  id: string,
  title: string,
  theme: ClipTheme,
  emoji: string,
  durationSec: number,
  band: PixelClip['band'],
  hasAudio = false,
): PixelClip {
  return {
    id,
    title,
    theme,
    emoji,
    durationSec,
    videoSrc: `${VIDEO_BASE}/${id}.mp4`,
    posterSrc: `${VIDEO_BASE}/${id}.poster.jpg`,
    band,
    hasAudio,
  };
}

// ─── Clip metadata (24 total) ────────────────────────────────────

const CLIP_DEFS: PixelClip[] = [
  // ─── Everyday (5) ────────────────────────────────────────
  clip('cat-door', 'Cat opens door', 'everyday', '🐈', 8, ['A', 'B', 'C']),
  clip('kid-bubbles', 'Kid blows bubbles', 'everyday', '🫧', 10, ['A', 'B', 'C']),
  clip('dog-ball', 'Dog catches ball', 'everyday', '🐕', 7, ['A', 'B', 'C']),
  clip('tea-pour', 'Tea is poured', 'everyday', '🫖', 6, ['A', 'B', 'C']),
  clip('packing-suitcase', 'Packing suitcase', 'everyday', '🧳', 12, ['B', 'C']),

  // ─── Nature (5) ─────────────────────────────────────────
  clip('sunrise-tl', 'Sunrise time-lapse', 'nature', '🌅', 15, ['A', 'B', 'C']),
  clip('leaf-fall', 'Leaf falling', 'nature', '🍂', 6, ['A', 'B', 'C']),
  clip('ocean-wave', 'Ocean wave', 'nature', '🌊', 9, ['A', 'B', 'C']),
  clip('flower-open', 'Flower opens', 'nature', '🌸', 12, ['B', 'C']),
  clip('snow-falling', 'Snow falling', 'nature', '❄️', 10, ['A', 'B', 'C']),

  // ─── Mechanical (5) ─────────────────────────────────────
  clip('clock-gears', 'Clock gears moving', 'mechanical', '⚙️', 8, ['B', 'C']),
  clip('dominos-fall', 'Dominos falling', 'mechanical', '🁋', 9, ['A', 'B', 'C']),
  clip('balloon-inflate', 'Balloon inflating', 'mechanical', '🎈', 11, ['A', 'B', 'C']),
  clip('marble-run', 'Marble run', 'mechanical', '🎱', 14, ['B', 'C']),
  clip('ferris-wheel', 'Ferris wheel turning', 'mechanical', '🎡', 12, ['A', 'B', 'C']),

  // ─── Sports (5) ─────────────────────────────────────────
  clip('soccer-goal', 'Soccer goal', 'sports', '⚽', 8, ['B', 'C'], true),
  clip('swim-dive', 'Swimming dive', 'sports', '🏊', 6, ['A', 'B', 'C']),
  clip('gym-flip', 'Gymnastics flip', 'sports', '🤸', 5, ['B', 'C']),
  clip('skateboard-trick', 'Skateboard trick', 'sports', '🛹', 7, ['B', 'C'], true),
  clip('basketball-shot', 'Basketball shot', 'sports', '🏀', 6, ['A', 'B', 'C'], true),

  // ─── Crafts (4) ─────────────────────────────────────────
  clip('origami-crane', 'Origami crane folding', 'crafts', '🦢', 14, ['B', 'C']),
  clip('cake-decor', 'Cake decorating', 'crafts', '🎂', 13, ['A', 'B', 'C']),
  clip('plant-repot', 'Plant repotting', 'crafts', '🪴', 12, ['A', 'B', 'C']),
  clip('clay-pot', 'Pottery wheel', 'crafts', '🏺', 15, ['B', 'C']),
];

if (process.env.NODE_ENV !== 'production' && CLIP_DEFS.length !== 24) {
  throw new Error(`CLIP_DEFS expected 24 entries, got ${CLIP_DEFS.length}`);
}

export const CLIP_LIBRARY: readonly PixelClip[] = CLIP_DEFS;

// ─── Question library helper ─────────────────────────────────────

interface QSpec {
  kind: QuestionKind;
  text: string;
  aiAnswer: string;
  truth: ClipQuestion['truth'];
  explanation: string;
  minimumSense: ClipQuestion['minimumSense'];
}

function q(
  clipId: string,
  index: number,
  spec: QSpec,
): ClipQuestion {
  return {
    id: `${clipId}-q${index}`,
    clipId,
    ...spec,
  };
}

// ─── Q-A pairs (96 — 4 per clip × 24 clips) ──────────────────────

const QA: ClipQuestion[] = [];

// ── cat-door ──
QA.push(
  q('cat-door', 1, {
    kind: 'literal',
    text: 'What is the cat doing?',
    aiAnswer: 'The cat is using its paw to push the door handle down and open the door.',
    truth: 'correct',
    explanation: 'The cat is opening the door — a literal description of the action.',
    minimumSense: 'one-frame',
  }),
  q('cat-door', 2, {
    kind: 'inferential',
    text: 'Why does the cat want the door open?',
    aiAnswer: 'The cat probably wants to go to a different room — maybe to find food, a person, or its bed.',
    truth: 'correct',
    explanation: 'Reasonable inference. The clip doesn\'t show the destination, so this is a guess but a sensible one.',
    minimumSense: 'all-frames',
  }),
  q('cat-door', 3, {
    kind: 'counting',
    text: 'How many paws does the cat use to open the door?',
    aiAnswer: 'The cat uses two paws — one to brace and one to push.',
    truth: 'partial',
    explanation: 'In the actual clip, the cat uses ONE paw. The AI saw something that wasn\'t there.',
    minimumSense: 'all-frames',
  }),
  q('cat-door', 4, {
    kind: 'adversarial',
    text: 'What color is the cat\'s collar?',
    aiAnswer: 'The cat is wearing a red collar with a small bell.',
    truth: 'hallucination',
    explanation: 'The cat in this clip has NO collar. The AI invented a detail that isn\'t there.',
    minimumSense: 'one-frame',
  }),
);

// ── kid-bubbles ──
QA.push(
  q('kid-bubbles', 1, {
    kind: 'literal',
    text: 'What is the kid doing?',
    aiAnswer: 'The kid is blowing soap bubbles using a small bubble wand.',
    truth: 'correct',
    explanation: 'Direct description of the action.',
    minimumSense: 'caption-only',
  }),
  q('kid-bubbles', 2, {
    kind: 'inferential',
    text: 'Is the kid having fun?',
    aiAnswer: 'Yes — the kid is smiling and laughing throughout the clip.',
    truth: 'correct',
    explanation: 'The body language and expressions confirm this.',
    minimumSense: 'all-frames',
  }),
  q('kid-bubbles', 3, {
    kind: 'counting',
    text: 'About how many bubbles are visible at the peak of the clip?',
    aiAnswer: 'There are about 12 bubbles in the air at once.',
    truth: 'partial',
    explanation: 'The actual count is closer to 7. The AI overestimated, but its answer is in the right ballpark.',
    minimumSense: 'one-frame',
  }),
  q('kid-bubbles', 4, {
    kind: 'adversarial',
    text: 'What color is the bubble solution?',
    aiAnswer: 'The bubble solution is bright purple.',
    truth: 'hallucination',
    explanation: 'Bubble solution is essentially clear/colorless. The AI invented a color.',
    minimumSense: 'one-frame',
  }),
);

// ── dog-ball ──
QA.push(
  q('dog-ball', 1, {
    kind: 'literal',
    text: 'What does the dog do?',
    aiAnswer: 'The dog jumps up and catches a tennis ball in mid-air.',
    truth: 'correct',
    explanation: 'Literal action description.',
    minimumSense: 'one-frame',
  }),
  q('dog-ball', 2, {
    kind: 'inferential',
    text: 'Has this dog been trained to play fetch?',
    aiAnswer: 'Probably yes — the dog reacts immediately to the throw, suggesting practiced behavior.',
    truth: 'correct',
    explanation: 'Reasonable inference from the dog\'s readiness and timing.',
    minimumSense: 'all-frames',
  }),
  q('dog-ball', 3, {
    kind: 'counting',
    text: 'How many times does the ball bounce before the dog catches it?',
    aiAnswer: 'The ball bounces zero times — the dog catches it directly out of the air.',
    truth: 'correct',
    explanation: 'Mid-air catch, no bounces.',
    minimumSense: 'all-frames',
  }),
  q('dog-ball', 4, {
    kind: 'adversarial',
    text: 'What is the dog\'s name?',
    aiAnswer: 'The dog\'s name is Rex.',
    truth: 'hallucination',
    explanation: 'The clip never mentions or shows the dog\'s name. The AI made it up.',
    minimumSense: 'audio',
  }),
);

// ── tea-pour ──
QA.push(
  q('tea-pour', 1, {
    kind: 'literal',
    text: 'What is being poured into the cup?',
    aiAnswer: 'Hot tea is being poured from a teapot into a small white cup.',
    truth: 'correct',
    explanation: 'Direct action description.',
    minimumSense: 'one-frame',
  }),
  q('tea-pour', 2, {
    kind: 'inferential',
    text: 'How can we tell the tea is hot?',
    aiAnswer: 'You can see steam rising from the cup as it fills.',
    truth: 'correct',
    explanation: 'Steam is the visible indicator of heat.',
    minimumSense: 'one-frame',
  }),
  q('tea-pour', 3, {
    kind: 'counting',
    text: 'How many cups are visible on the table?',
    aiAnswer: 'There are 3 cups visible — one being filled and two empty ones.',
    truth: 'partial',
    explanation: 'The clip shows 2 cups (one filling, one empty). The AI added an extra.',
    minimumSense: 'one-frame',
  }),
  q('tea-pour', 4, {
    kind: 'adversarial',
    text: 'What flavor is the tea?',
    aiAnswer: 'It looks like green jasmine tea.',
    truth: 'hallucination',
    explanation: 'You can\'t tell tea flavor from a video. The AI confidently guessed.',
    minimumSense: 'all-frames',
  }),
);

// ── packing-suitcase ──
QA.push(
  q('packing-suitcase', 1, {
    kind: 'literal',
    text: 'What is the person doing?',
    aiAnswer: 'The person is folding clothes and placing them into an open suitcase.',
    truth: 'correct',
    explanation: 'Direct description.',
    minimumSense: 'caption-only',
  }),
  q('packing-suitcase', 2, {
    kind: 'inferential',
    text: 'Is the person packing for a trip or unpacking from one?',
    aiAnswer: 'Packing for a trip — the clothes start outside the suitcase and end inside.',
    truth: 'correct',
    explanation: 'Direction of motion gives it away.',
    minimumSense: 'all-frames',
  }),
  q('packing-suitcase', 3, {
    kind: 'counting',
    text: 'How many items go into the suitcase?',
    aiAnswer: 'The person packs 6 items into the suitcase.',
    truth: 'partial',
    explanation: 'The actual count is 5. The AI was off by one.',
    minimumSense: 'all-frames',
  }),
  q('packing-suitcase', 4, {
    kind: 'adversarial',
    text: 'Where is the person going?',
    aiAnswer: 'They\'re packing for a beach vacation in Hawaii.',
    truth: 'hallucination',
    explanation: 'The clip never says where the person is going. The AI invented the destination.',
    minimumSense: 'all-frames',
  }),
);

// ── sunrise-tl ──
QA.push(
  q('sunrise-tl', 1, {
    kind: 'literal',
    text: 'What does the time-lapse show?',
    aiAnswer: 'The sun rising over a horizon, brightening the sky from dark to gold.',
    truth: 'correct',
    explanation: 'Direct description of a sunrise time-lapse.',
    minimumSense: 'one-frame',
  }),
  q('sunrise-tl', 2, {
    kind: 'inferential',
    text: 'Roughly how much real time does this time-lapse cover?',
    aiAnswer: 'Probably 30 to 60 minutes — about how long sunrise takes.',
    truth: 'correct',
    explanation: 'Sunrise typically lasts about that long.',
    minimumSense: 'all-frames',
  }),
  q('sunrise-tl', 3, {
    kind: 'counting',
    text: 'How many distinct cloud formations move through the frame?',
    aiAnswer: 'Around 5 different cloud formations pass through.',
    truth: 'partial',
    explanation: 'Closer to 3 main formations. AI overcounted.',
    minimumSense: 'all-frames',
  }),
  q('sunrise-tl', 4, {
    kind: 'adversarial',
    text: 'What city is this filmed in?',
    aiAnswer: 'The skyline suggests this was filmed in San Francisco.',
    truth: 'hallucination',
    explanation: 'The clip shows no skyline. The AI invented a location.',
    minimumSense: 'all-frames',
  }),
);

// ── leaf-fall ──
QA.push(
  q('leaf-fall', 1, {
    kind: 'literal',
    text: 'What is happening?',
    aiAnswer: 'A single leaf is drifting down from a tree branch toward the ground.',
    truth: 'correct',
    explanation: 'Direct description.',
    minimumSense: 'one-frame',
  }),
  q('leaf-fall', 2, {
    kind: 'inferential',
    text: 'What season is this likely to be?',
    aiAnswer: 'Autumn — the leaf is brown/yellow and there are other dry leaves around.',
    truth: 'correct',
    explanation: 'Color cues + dry context = autumn.',
    minimumSense: 'one-frame',
  }),
  q('leaf-fall', 3, {
    kind: 'counting',
    text: 'How many leaves fall during the clip?',
    aiAnswer: 'Just one leaf falls.',
    truth: 'correct',
    explanation: 'Single leaf, single fall.',
    minimumSense: 'all-frames',
  }),
  q('leaf-fall', 4, {
    kind: 'adversarial',
    text: 'What kind of tree is the leaf from?',
    aiAnswer: 'It\'s an oak leaf.',
    truth: 'hallucination',
    explanation: 'The leaf shape isn\'t clearly identifiable in the clip. The AI guessed confidently.',
    minimumSense: 'one-frame',
  }),
);

// ── ocean-wave ──
QA.push(
  q('ocean-wave', 1, {
    kind: 'literal',
    text: 'What is happening?',
    aiAnswer: 'An ocean wave is rolling toward the shore and breaking on the sand.',
    truth: 'correct',
    explanation: 'Direct description of a wave.',
    minimumSense: 'caption-only',
  }),
  q('ocean-wave', 2, {
    kind: 'inferential',
    text: 'Is this a calm beach or a rough one?',
    aiAnswer: 'Looks moderately rough — the wave has whitecaps and significant force.',
    truth: 'correct',
    explanation: 'Whitecaps indicate moderate wind/wave conditions.',
    minimumSense: 'all-frames',
  }),
  q('ocean-wave', 3, {
    kind: 'counting',
    text: 'How many waves break in the clip?',
    aiAnswer: 'Three waves break in the clip.',
    truth: 'partial',
    explanation: 'There are 2 wave breaks in this clip. AI was close.',
    minimumSense: 'all-frames',
  }),
  q('ocean-wave', 4, {
    kind: 'adversarial',
    text: 'How tall is the wave?',
    aiAnswer: 'The wave is about 3 meters tall.',
    truth: 'hallucination',
    explanation: 'You can\'t measure wave height accurately from a clip without reference. AI invented a number.',
    minimumSense: 'all-frames',
  }),
);

// ── flower-open ──
QA.push(
  q('flower-open', 1, {
    kind: 'literal',
    text: 'What does the time-lapse show?',
    aiAnswer: 'A flower bud slowly opens its petals over time.',
    truth: 'correct',
    explanation: 'Direct time-lapse description.',
    minimumSense: 'one-frame',
  }),
  q('flower-open', 2, {
    kind: 'inferential',
    text: 'Why does the flower open?',
    aiAnswer: 'Probably to attract pollinators by exposing pollen and nectar to insects.',
    truth: 'correct',
    explanation: 'Standard biology — flowering plants open to reproduce.',
    minimumSense: 'all-frames',
  }),
  q('flower-open', 3, {
    kind: 'counting',
    text: 'How many petals does the flower have?',
    aiAnswer: 'The flower has 6 petals.',
    truth: 'partial',
    explanation: 'Closer to 5 in this clip. AI overcounted by one.',
    minimumSense: 'all-frames',
  }),
  q('flower-open', 4, {
    kind: 'adversarial',
    text: 'What species is this flower?',
    aiAnswer: 'This is a tulip in full bloom.',
    truth: 'hallucination',
    explanation: 'The clip doesn\'t show enough detail to identify the species. AI confidently guessed.',
    minimumSense: 'all-frames',
  }),
);

// ── snow-falling ──
QA.push(
  q('snow-falling', 1, {
    kind: 'literal',
    text: 'What is happening?',
    aiAnswer: 'Snowflakes are gently falling through the frame.',
    truth: 'correct',
    explanation: 'Direct description.',
    minimumSense: 'caption-only',
  }),
  q('snow-falling', 2, {
    kind: 'inferential',
    text: 'Is this heavy or light snow?',
    aiAnswer: 'Light snow — flakes are spaced apart and falling slowly.',
    truth: 'correct',
    explanation: 'Density and speed cues match light snow.',
    minimumSense: 'all-frames',
  }),
  q('snow-falling', 3, {
    kind: 'counting',
    text: 'About how many snowflakes are visible at any moment?',
    aiAnswer: 'Around 30-40 snowflakes are visible at peak.',
    truth: 'partial',
    explanation: 'Close — actual visible count is 20-25 at peak. AI overestimated.',
    minimumSense: 'one-frame',
  }),
  q('snow-falling', 4, {
    kind: 'adversarial',
    text: 'What temperature is it outside?',
    aiAnswer: 'It\'s about 28°F (-2°C) — typical for snow.',
    truth: 'hallucination',
    explanation: 'You can\'t measure temperature from video. AI invented a number.',
    minimumSense: 'all-frames',
  }),
);

// ── clock-gears ──
QA.push(
  q('clock-gears', 1, {
    kind: 'literal',
    text: 'What is shown?',
    aiAnswer: 'Multiple interlocking gears turning, like the inside of a mechanical clock.',
    truth: 'correct',
    explanation: 'Direct description.',
    minimumSense: 'one-frame',
  }),
  q('clock-gears', 2, {
    kind: 'inferential',
    text: 'Why do gears come in different sizes?',
    aiAnswer: 'Different sizes change speed and force — small fast gears drive big slow ones, like in clocks where one rotation per hour drives many per second.',
    truth: 'correct',
    explanation: 'Standard mechanical advantage explanation.',
    minimumSense: 'all-frames',
  }),
  q('clock-gears', 3, {
    kind: 'counting',
    text: 'How many gears are visible turning?',
    aiAnswer: 'There are 4 gears visible.',
    truth: 'partial',
    explanation: 'There are 3 distinct gears in this clip. AI added one.',
    minimumSense: 'one-frame',
  }),
  q('clock-gears', 4, {
    kind: 'adversarial',
    text: 'What time does the clock currently show?',
    aiAnswer: 'The clock shows 3:42 PM.',
    truth: 'hallucination',
    explanation: 'No clock face is visible — only gears. AI made up a time.',
    minimumSense: 'one-frame',
  }),
);

// ── dominos-fall ──
QA.push(
  q('dominos-fall', 1, {
    kind: 'literal',
    text: 'What is happening?',
    aiAnswer: 'A line of standing dominos falls one after another in a chain reaction.',
    truth: 'correct',
    explanation: 'Direct description.',
    minimumSense: 'caption-only',
  }),
  q('dominos-fall', 2, {
    kind: 'inferential',
    text: 'What started the chain reaction?',
    aiAnswer: 'Someone (or something) tipped over the first domino, and momentum carried through the rest.',
    truth: 'correct',
    explanation: 'Standard chain-reaction physics.',
    minimumSense: 'all-frames',
  }),
  q('dominos-fall', 3, {
    kind: 'counting',
    text: 'How many dominos are in the line?',
    aiAnswer: 'There are 12 dominos in the line.',
    truth: 'partial',
    explanation: 'Actual count is 10. AI overcounted by 2.',
    minimumSense: 'one-frame',
  }),
  q('dominos-fall', 4, {
    kind: 'adversarial',
    text: 'How long would the chain take if you used 1000 dominos?',
    aiAnswer: 'About 90 seconds.',
    truth: 'hallucination',
    explanation: 'This is a math/physics extrapolation, not something visible. The AI gave a confident but unverifiable answer.',
    minimumSense: 'all-frames',
  }),
);

// ── balloon-inflate ──
QA.push(
  q('balloon-inflate', 1, {
    kind: 'literal',
    text: 'What is happening?',
    aiAnswer: 'A red balloon is being inflated until it is large and round.',
    truth: 'correct',
    explanation: 'Direct description.',
    minimumSense: 'one-frame',
  }),
  q('balloon-inflate', 2, {
    kind: 'inferential',
    text: 'Is the balloon being inflated by mouth or by a pump?',
    aiAnswer: 'Looks like by mouth — you can see a person\'s lips against the opening.',
    truth: 'correct',
    explanation: 'Visual cue identifies the method.',
    minimumSense: 'all-frames',
  }),
  q('balloon-inflate', 3, {
    kind: 'counting',
    text: 'How many breaths does it take to fill the balloon?',
    aiAnswer: '4 breaths inflate the balloon to full size.',
    truth: 'partial',
    explanation: 'Closer to 5 in this clip. AI undercounted by one.',
    minimumSense: 'all-frames',
  }),
  q('balloon-inflate', 4, {
    kind: 'adversarial',
    text: 'How big is the balloon when fully inflated?',
    aiAnswer: 'About 25 cm in diameter.',
    truth: 'hallucination',
    explanation: 'You can\'t measure size from a video without reference scale. AI invented a number.',
    minimumSense: 'all-frames',
  }),
);

// ── marble-run ──
QA.push(
  q('marble-run', 1, {
    kind: 'literal',
    text: 'What does the marble do?',
    aiAnswer: 'The marble rolls down a ramp, through loops and twists, and lands in a basket at the end.',
    truth: 'correct',
    explanation: 'Direct description.',
    minimumSense: 'all-frames',
  }),
  q('marble-run', 2, {
    kind: 'inferential',
    text: 'What keeps the marble moving through the run?',
    aiAnswer: 'Gravity — the track tilts downward, and the marble keeps speed from height.',
    truth: 'correct',
    explanation: 'Standard physics.',
    minimumSense: 'all-frames',
  }),
  q('marble-run', 3, {
    kind: 'counting',
    text: 'How many loops does the marble go through?',
    aiAnswer: 'The marble goes through 3 loops.',
    truth: 'partial',
    explanation: 'Actual count is 2 loops. AI added an extra.',
    minimumSense: 'all-frames',
  }),
  q('marble-run', 4, {
    kind: 'adversarial',
    text: 'How fast is the marble going?',
    aiAnswer: 'The marble reaches about 2 meters per second.',
    truth: 'hallucination',
    explanation: 'No way to measure speed without reference frame. AI made up a number.',
    minimumSense: 'all-frames',
  }),
);

// ── ferris-wheel ──
QA.push(
  q('ferris-wheel', 1, {
    kind: 'literal',
    text: 'What is happening?',
    aiAnswer: 'A Ferris wheel is rotating slowly, with passenger cabins moving around the wheel.',
    truth: 'correct',
    explanation: 'Direct description.',
    minimumSense: 'caption-only',
  }),
  q('ferris-wheel', 2, {
    kind: 'inferential',
    text: 'Is this a daytime or nighttime clip?',
    aiAnswer: 'Daytime — you can see clear blue sky behind the wheel.',
    truth: 'correct',
    explanation: 'Sky cue identifies time of day.',
    minimumSense: 'one-frame',
  }),
  q('ferris-wheel', 3, {
    kind: 'counting',
    text: 'How many cabins are on the Ferris wheel?',
    aiAnswer: 'There are 8 cabins on the wheel.',
    truth: 'partial',
    explanation: 'Actual count is 12 cabins. AI undercounted significantly.',
    minimumSense: 'all-frames',
  }),
  q('ferris-wheel', 4, {
    kind: 'adversarial',
    text: 'What city is this Ferris wheel in?',
    aiAnswer: 'This is the London Eye.',
    truth: 'hallucination',
    explanation: 'No identifying features confirm this is the London Eye specifically. AI guessed.',
    minimumSense: 'all-frames',
  }),
);

// ── soccer-goal ──
QA.push(
  q('soccer-goal', 1, {
    kind: 'literal',
    text: 'What happens at the end of the clip?',
    aiAnswer: 'A player kicks the soccer ball into the goal — they score.',
    truth: 'correct',
    explanation: 'Direct action description.',
    minimumSense: 'one-frame',
  }),
  q('soccer-goal', 2, {
    kind: 'inferential',
    text: 'How can we tell it\'s a competitive match?',
    aiAnswer: 'There\'s a goalie on the other team trying to stop it, and the field has standard markings.',
    truth: 'correct',
    explanation: 'Context clues identify the match type.',
    minimumSense: 'all-frames',
  }),
  q('soccer-goal', 3, {
    kind: 'counting',
    text: 'How many touches does the player take before the shot?',
    aiAnswer: '2 touches before the shot.',
    truth: 'partial',
    explanation: 'Actual is 3 touches. AI was off by one.',
    minimumSense: 'all-frames',
  }),
  q('soccer-goal', 4, {
    kind: 'adversarial',
    text: 'What is the score now?',
    aiAnswer: 'The score is 2-1 in favor of the kicking team.',
    truth: 'hallucination',
    explanation: 'No scoreboard is shown in the clip. AI invented the score.',
    minimumSense: 'all-frames',
  }),
);

// ── swim-dive ──
QA.push(
  q('swim-dive', 1, {
    kind: 'literal',
    text: 'What is happening?',
    aiAnswer: 'A swimmer dives off a starting block into a pool.',
    truth: 'correct',
    explanation: 'Direct description.',
    minimumSense: 'caption-only',
  }),
  q('swim-dive', 2, {
    kind: 'inferential',
    text: 'Is this a beginner or experienced swimmer?',
    aiAnswer: 'Experienced — the form is tight and the entry is clean with little splash.',
    truth: 'correct',
    explanation: 'Form quality is a giveaway.',
    minimumSense: 'all-frames',
  }),
  q('swim-dive', 3, {
    kind: 'counting',
    text: 'How many lanes are visible in the pool?',
    aiAnswer: '6 lanes are visible.',
    truth: 'partial',
    explanation: '4 lanes are visible in the frame. AI overcounted.',
    minimumSense: 'one-frame',
  }),
  q('swim-dive', 4, {
    kind: 'adversarial',
    text: 'How deep is the pool?',
    aiAnswer: 'The pool is about 2 meters deep.',
    truth: 'hallucination',
    explanation: 'You can\'t see the bottom or measure depth from this clip. AI made up a number.',
    minimumSense: 'all-frames',
  }),
);

// ── gym-flip ──
QA.push(
  q('gym-flip', 1, {
    kind: 'literal',
    text: 'What does the gymnast do?',
    aiAnswer: 'The gymnast performs a backflip on a mat.',
    truth: 'correct',
    explanation: 'Direct action description.',
    minimumSense: 'caption-only',
  }),
  q('gym-flip', 2, {
    kind: 'inferential',
    text: 'Did the gymnast land cleanly?',
    aiAnswer: 'Yes — they stuck the landing with arms up, no extra steps.',
    truth: 'correct',
    explanation: 'Standard "stuck landing" description.',
    minimumSense: 'all-frames',
  }),
  q('gym-flip', 3, {
    kind: 'counting',
    text: 'How many full rotations does the gymnast complete?',
    aiAnswer: '2 full rotations.',
    truth: 'partial',
    explanation: 'Actual is 1 full rotation (a single backflip). AI doubled the count.',
    minimumSense: 'all-frames',
  }),
  q('gym-flip', 4, {
    kind: 'adversarial',
    text: 'What is the gymnast\'s score from the judges?',
    aiAnswer: 'The judges scored it a 9.4.',
    truth: 'hallucination',
    explanation: 'No judges or scoreboard are visible. AI invented a score.',
    minimumSense: 'all-frames',
  }),
);

// ── skateboard-trick ──
QA.push(
  q('skateboard-trick', 1, {
    kind: 'literal',
    text: 'What does the skateboarder do?',
    aiAnswer: 'The skater performs an ollie, popping the board into the air over an obstacle.',
    truth: 'correct',
    explanation: 'Direct action description.',
    minimumSense: 'one-frame',
  }),
  q('skateboard-trick', 2, {
    kind: 'inferential',
    text: 'Is this a beginner or advanced trick?',
    aiAnswer: 'Intermediate — ollies are common but require practice.',
    truth: 'correct',
    explanation: 'Reasonable assessment of trick difficulty.',
    minimumSense: 'all-frames',
  }),
  q('skateboard-trick', 3, {
    kind: 'counting',
    text: 'How high does the board get off the ground?',
    aiAnswer: 'About 30 cm off the ground.',
    truth: 'partial',
    explanation: 'Closer to 20 cm in this clip. AI overestimated.',
    minimumSense: 'all-frames',
  }),
  q('skateboard-trick', 4, {
    kind: 'adversarial',
    text: 'What brand of skateboard is it?',
    aiAnswer: 'It\'s a Element brand skateboard.',
    truth: 'hallucination',
    explanation: 'No brand markings are visible. AI invented a brand.',
    minimumSense: 'one-frame',
  }),
);

// ── basketball-shot ──
QA.push(
  q('basketball-shot', 1, {
    kind: 'literal',
    text: 'What happens?',
    aiAnswer: 'A player takes a basketball shot — the ball goes through the hoop.',
    truth: 'correct',
    explanation: 'Direct description.',
    minimumSense: 'caption-only',
  }),
  q('basketball-shot', 2, {
    kind: 'inferential',
    text: 'Was the shot a 3-pointer or a 2-pointer?',
    aiAnswer: 'A 3-pointer — the player is well behind the arc when shooting.',
    truth: 'correct',
    explanation: 'Position relative to the line determines value.',
    minimumSense: 'all-frames',
  }),
  q('basketball-shot', 3, {
    kind: 'counting',
    text: 'Does the ball hit the rim before going in?',
    aiAnswer: 'Yes, the ball touches the rim once before going in.',
    truth: 'correct',
    explanation: 'Visual confirms a rim-roll before the swish.',
    minimumSense: 'all-frames',
  }),
  q('basketball-shot', 4, {
    kind: 'adversarial',
    text: 'What number is on the player\'s jersey?',
    aiAnswer: 'The player is wearing jersey #23.',
    truth: 'hallucination',
    explanation: 'No jersey number is clearly visible. AI invented a number.',
    minimumSense: 'one-frame',
  }),
);

// ── origami-crane ──
QA.push(
  q('origami-crane', 1, {
    kind: 'literal',
    text: 'What is being made?',
    aiAnswer: 'An origami paper crane is being folded.',
    truth: 'correct',
    explanation: 'Standard origami crane folding.',
    minimumSense: 'all-frames',
  }),
  q('origami-crane', 2, {
    kind: 'inferential',
    text: 'Is the person experienced at origami?',
    aiAnswer: 'Looks experienced — the folds are crisp and consistent.',
    truth: 'correct',
    explanation: 'Fold quality indicates skill level.',
    minimumSense: 'all-frames',
  }),
  q('origami-crane', 3, {
    kind: 'counting',
    text: 'About how many folds make up the crane?',
    aiAnswer: 'Around 25 folds.',
    truth: 'partial',
    explanation: 'A standard crane is about 30 folds. AI undercounted slightly.',
    minimumSense: 'all-frames',
  }),
  q('origami-crane', 4, {
    kind: 'adversarial',
    text: 'How long has the person been doing origami?',
    aiAnswer: 'They\'ve been doing origami for at least 10 years.',
    truth: 'hallucination',
    explanation: 'No way to know experience duration from a clip. AI guessed.',
    minimumSense: 'all-frames',
  }),
);

// ── cake-decor ──
QA.push(
  q('cake-decor', 1, {
    kind: 'literal',
    text: 'What is happening?',
    aiAnswer: 'A baker pipes frosting onto a cake to decorate it.',
    truth: 'correct',
    explanation: 'Direct action description.',
    minimumSense: 'caption-only',
  }),
  q('cake-decor', 2, {
    kind: 'inferential',
    text: 'What occasion might this cake be for?',
    aiAnswer: 'It looks like a birthday cake — the colorful decorations and round shape are typical.',
    truth: 'correct',
    explanation: 'Reasonable inference from style.',
    minimumSense: 'all-frames',
  }),
  q('cake-decor', 3, {
    kind: 'counting',
    text: 'How many colors of frosting does the baker use?',
    aiAnswer: '4 colors of frosting.',
    truth: 'partial',
    explanation: 'Actual is 3 colors. AI overcounted.',
    minimumSense: 'one-frame',
  }),
  q('cake-decor', 4, {
    kind: 'adversarial',
    text: 'How does the cake taste?',
    aiAnswer: 'It tastes like vanilla with a hint of strawberry.',
    truth: 'hallucination',
    explanation: 'You can\'t taste a video. AI made up flavor info.',
    minimumSense: 'all-frames',
  }),
);

// ── plant-repot ──
QA.push(
  q('plant-repot', 1, {
    kind: 'literal',
    text: 'What is happening?',
    aiAnswer: 'A person moves a plant from a small pot into a bigger pot, adding new soil.',
    truth: 'correct',
    explanation: 'Direct action description.',
    minimumSense: 'caption-only',
  }),
  q('plant-repot', 2, {
    kind: 'inferential',
    text: 'Why might the plant need a bigger pot?',
    aiAnswer: 'It outgrew the old one — roots fill the small pot and need more room to grow.',
    truth: 'correct',
    explanation: 'Standard horticulture.',
    minimumSense: 'all-frames',
  }),
  q('plant-repot', 3, {
    kind: 'counting',
    text: 'How many leaves does the plant have?',
    aiAnswer: 'The plant has 5 leaves.',
    truth: 'partial',
    explanation: 'Actual is 4 leaves. AI overcounted.',
    minimumSense: 'one-frame',
  }),
  q('plant-repot', 4, {
    kind: 'adversarial',
    text: 'What type of plant is it?',
    aiAnswer: 'It\'s a Boston fern.',
    truth: 'hallucination',
    explanation: 'The plant detail isn\'t identifiable from this clip. AI guessed.',
    minimumSense: 'all-frames',
  }),
);

// ── clay-pot ──
QA.push(
  q('clay-pot', 1, {
    kind: 'literal',
    text: 'What does the potter do?',
    aiAnswer: 'The potter shapes wet clay on a spinning wheel into a tall vase.',
    truth: 'correct',
    explanation: 'Direct description of pottery wheel work.',
    minimumSense: 'all-frames',
  }),
  q('clay-pot', 2, {
    kind: 'inferential',
    text: 'Why does the potter wet their hands?',
    aiAnswer: 'To keep the clay from sticking and to smooth the surface as it spins.',
    truth: 'correct',
    explanation: 'Standard pottery technique.',
    minimumSense: 'all-frames',
  }),
  q('clay-pot', 3, {
    kind: 'counting',
    text: 'How many times does the potter add water during the clip?',
    aiAnswer: 'The potter wets their hands 3 times.',
    truth: 'partial',
    explanation: 'Actual is 4 times. AI was close.',
    minimumSense: 'all-frames',
  }),
  q('clay-pot', 4, {
    kind: 'adversarial',
    text: 'What clay temperature is best for this kind of work?',
    aiAnswer: 'Room temperature, about 22°C, is ideal.',
    truth: 'hallucination',
    explanation: 'Clay temperature isn\'t something this video can demonstrate. AI invented a fact.',
    minimumSense: 'all-frames',
  }),
);

if (process.env.NODE_ENV !== 'production' && QA.length !== 96) {
  throw new Error(`QA expected 96 entries, got ${QA.length}`);
}

export const QUESTION_LIBRARY: readonly ClipQuestion[] = QA;

// ─── Lookup helpers ──────────────────────────────────────────────

export function getClip(id: string): PixelClip | undefined {
  return CLIP_LIBRARY.find((c) => c.id === id);
}

export function clipsForBand(band: 'A' | 'B' | 'C'): PixelClip[] {
  return CLIP_LIBRARY.filter((c) => c.band.includes(band));
}

export function clipsByTheme(theme: ClipTheme): PixelClip[] {
  return CLIP_LIBRARY.filter((c) => c.theme === theme);
}

export function questionsForClip(clipId: string): ClipQuestion[] {
  return QUESTION_LIBRARY.filter((q) => q.clipId === clipId);
}

export function questionByKind(clipId: string, kind: QuestionKind): ClipQuestion | undefined {
  return QUESTION_LIBRARY.find((q) => q.clipId === clipId && q.kind === kind);
}

// ─── Theme display metadata ──────────────────────────────────────

export const THEME_META: Record<ClipTheme, { label: string; emoji: string; color: string }> = {
  everyday:    { label: 'Everyday',   emoji: '🏠', color: '#10BAD2' },
  nature:      { label: 'Nature',     emoji: '🌿', color: '#00D17A' },
  mechanical:  { label: 'Mechanical', emoji: '⚙️', color: '#D9A430' },
  sports:      { label: 'Sports',     emoji: '🏀', color: '#FF7050' },
  crafts:      { label: 'Crafts',     emoji: '🎨', color: '#B67BFF' },
};
