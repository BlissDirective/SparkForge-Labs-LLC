// ================================================================
// Creature Species Config — 5 Procedural AI-Themed Creatures
// ================================================================
// Replaces the 6 generic pets (dog/cat/owl/robot/dragon/alien)
// with 5 unique species, each themed around an AI concept.
//
// Each species has:
//   - 6 evolution stages (egg → baby → toddler → kid → teen → genius)
//   - Unique shape language and silhouette
//   - AI theme connection (data, neural nets, energy, robotics, vision)
//   - Species-specific idle animations and personality
//   - Per-stage toon gradient colors
//   - Per-stage triangle budgets (200–2500)

// ── Types ────────────────────────────────────────────────────────

export type SpeciesId = 'byteling' | 'sparkpaw' | 'voltkit' | 'cogsworth' | 'pixie';
export type PetMood = 'sleeping' | 'confused' | 'learning' | 'smart' | 'genius' | 'celebrating';

export interface EvolutionStageConfig {
  name: string;
  emoji: string;
  scale: number;
  segments: number;       // Base geometry complexity
  toon: { base: string; mid: string; highlight: string };
}

export interface SpeciesConfig {
  id: SpeciesId;
  name: string;
  displayName: string;    // Friendly name shown to player
  theme: string;          // AI concept theme
  personality: string;
  labColor: string;       // Maps to SparkForge lab color
  emoji: string;
  shapeLanguage: string;  // cube | sphere | triangle | cylinder | disc
  correctReactions: string[];
  wrongReactions: string[];
  thinkingPhrases: string[];
  stages: EvolutionStageConfig[];
}

export interface MoodConfig {
  emissive: string;
  intensity: number;
  floatSpeed: number;
  rotationSpeed: number;
  sparkleCount: number;
}

// ── Mood Configuration (shared across all species) ───────────────

export const MOOD_CONFIGS: Record<PetMood, MoodConfig> = {
  sleeping: {
    emissive: '#4B3B8A',
    intensity: 0.15,
    floatSpeed: 0.5,
    rotationSpeed: 0.08,
    sparkleCount: 0,
  },
  confused: {
    emissive: '#6B5B9A',
    intensity: 0.3,
    floatSpeed: 1.0,
    rotationSpeed: 0.2,
    sparkleCount: 10,
  },
  learning: {
    emissive: '#8B5CF6',
    intensity: 0.5,
    floatSpeed: 1.5,
    rotationSpeed: 0.4,
    sparkleCount: 30,
  },
  smart: {
    emissive: '#A78BFA',
    intensity: 0.7,
    floatSpeed: 2.0,
    rotationSpeed: 0.6,
    sparkleCount: 50,
  },
  genius: {
    emissive: '#C4B5FD',
    intensity: 1.0,
    floatSpeed: 2.5,
    rotationSpeed: 0.8,
    sparkleCount: 80,
  },
  celebrating: {
    emissive: '#DDD6FE',
    intensity: 1.4,
    floatSpeed: 3.0,
    rotationSpeed: 1.2,
    sparkleCount: 120,
  },
};

// ── Species Definitions ──────────────────────────────────────────

export const SPECIES: Record<SpeciesId, SpeciesConfig> = {
  // ─── 1. BYTELING — Data & Binary ───
  byteling: {
    id: 'byteling',
    name: 'Byteling',
    displayName: 'Byteling',
    theme: 'Data & Binary',
    personality: 'Logical, precise, loves organizing things.',
    labColor: '#00BBFF',
    emoji: '🟦',
    shapeLanguage: 'cube',
    correctReactions: ['Data confirmed! ✓', '01100111! 🎉', '*sorts happily*', 'Pattern matched! 📊'],
    wrongReactions: ['Error 404... 🤔', '*recalculating*', 'Data mismatch...', 'Hmm, null result 😅'],
    thinkingPhrases: ['*processing data...*', '*scanning patterns...*', '*analyzing...*', '*computing...*'],
    stages: [
      { name: 'Data Seed', emoji: '🧊', scale: 0.5, segments: 1, toon: { base: '#0088CC', mid: '#00AAEE', highlight: '#66DDFF' } },
      { name: 'Bitlet', emoji: '🤖', scale: 0.65, segments: 1, toon: { base: '#0077BB', mid: '#0099DD', highlight: '#55CCFF' } },
      { name: 'Bytepup', emoji: '📟', scale: 0.8, segments: 1, toon: { base: '#0066AA', mid: '#0088CC', highlight: '#44BBEE' } },
      { name: 'Datacrunch', emoji: '💻', scale: 0.95, segments: 2, toon: { base: '#0055AA', mid: '#0077CC', highlight: '#33AADD' } },
      { name: 'Codec', emoji: '🖥️', scale: 1.1, segments: 2, toon: { base: '#004499', mid: '#0066BB', highlight: '#2299CC' } },
      { name: 'Terabyte', emoji: '🧠', scale: 1.25, segments: 3, toon: { base: '#003388', mid: '#0055AA', highlight: '#1188BB' } },
    ],
  },

  // ─── 2. SPARKPAW — Neural Networks & Connections ───
  sparkpaw: {
    id: 'sparkpaw',
    name: 'Sparkpaw',
    displayName: 'Sparkpaw',
    theme: 'Neural Networks',
    personality: 'Curious, social, loves making connections between ideas.',
    labColor: '#AA66FF',
    emoji: '🟣',
    shapeLanguage: 'sphere',
    correctReactions: ['Connection made! 🧠', '*synapses fire*', 'Neural link! ✨', 'Pattern found! 🌟'],
    wrongReactions: ['Signal lost... 🤔', '*reconnecting*', 'Weak signal...', 'Need more data... 😅'],
    thinkingPhrases: ['*forming connections...*', '*synapsing...*', '*linking nodes...*', '*propagating...*'],
    stages: [
      { name: 'Synapse Egg', emoji: '🔮', scale: 0.5, segments: 3, toon: { base: '#7733CC', mid: '#9955EE', highlight: '#CC99FF' } },
      { name: 'Noodlet', emoji: '🐙', scale: 0.65, segments: 4, toon: { base: '#6622BB', mid: '#8844DD', highlight: '#BB88FF' } },
      { name: 'Synapper', emoji: '🪼', scale: 0.8, segments: 5, toon: { base: '#5511AA', mid: '#7733CC', highlight: '#AA77EE' } },
      { name: 'Neurowhelp', emoji: '🧠', scale: 0.95, segments: 6, toon: { base: '#4400AA', mid: '#6622CC', highlight: '#9966DD' } },
      { name: 'Dendrite', emoji: '✨', scale: 1.1, segments: 7, toon: { base: '#330099', mid: '#5511BB', highlight: '#8855CC' } },
      { name: 'Cortex', emoji: '🌌', scale: 1.25, segments: 8, toon: { base: '#220088', mid: '#4400AA', highlight: '#7744BB' } },
    ],
  },

  // ─── 3. VOLTKIT — Energy & Computing Power ───
  voltkit: {
    id: 'voltkit',
    name: 'Voltkit',
    displayName: 'Voltkit',
    theme: 'Energy & Computing',
    personality: 'Energetic, fast, loves speed and efficiency.',
    labColor: '#00FF88',
    emoji: '⚡',
    shapeLanguage: 'triangle',
    correctReactions: ['CHARGED! ⚡', '*sparks fly*', 'Power surge! 🔋', 'Maximum output! 💥'],
    wrongReactions: ['Short circuit... ⚡', '*fizzle*', 'Low power...', 'Recharging... 🔌'],
    thinkingPhrases: ['*charging up...*', '*calculating watts...*', '*boosting power...*', '*energizing...*'],
    stages: [
      { name: 'Spark Cell', emoji: '🔋', scale: 0.5, segments: 0, toon: { base: '#008844', mid: '#00BB66', highlight: '#66FFAA' } },
      { name: 'Zaplet', emoji: '⚡', scale: 0.65, segments: 0, toon: { base: '#007733', mid: '#00AA55', highlight: '#55EE99' } },
      { name: 'Voltpup', emoji: '🦊', scale: 0.8, segments: 1, toon: { base: '#006622', mid: '#009944', highlight: '#44DD88' } },
      { name: 'Ampere', emoji: '💎', scale: 0.95, segments: 1, toon: { base: '#005511', mid: '#008833', highlight: '#33CC77' } },
      { name: 'Gigawatt', emoji: '🐲', scale: 1.1, segments: 2, toon: { base: '#004400', mid: '#007722', highlight: '#22BB66' } },
      { name: 'Exaflare', emoji: '🔥', scale: 1.25, segments: 2, toon: { base: '#003300', mid: '#006611', highlight: '#11AA55' } },
    ],
  },

  // ─── 4. COGSWORTH — Robotics & Mechanical AI ───
  cogsworth: {
    id: 'cogsworth',
    name: 'Cogsworth',
    displayName: 'Cogsworth',
    theme: 'Robotics & Building',
    personality: 'Methodical, creative, loves building and tinkering.',
    labColor: '#FFAA44',
    emoji: '⚙️',
    shapeLanguage: 'cylinder',
    correctReactions: ['Built it! 🔧', '*gears click*', 'Mechanism works! ⚙️', 'Assembly complete! 🏗️'],
    wrongReactions: ['Gears jammed... 🔩', '*steam hiss*', 'Misaligned...', 'Needs recalibration... 🛠️'],
    thinkingPhrases: ['*turning gears...*', '*measuring twice...*', '*blueprinting...*', '*calibrating...*'],
    stages: [
      { name: 'Gear Capsule', emoji: '🥚', scale: 0.5, segments: 8, toon: { base: '#BB7711', mid: '#DD9933', highlight: '#FFCC66' } },
      { name: 'Sprocket', emoji: '🔩', scale: 0.65, segments: 12, toon: { base: '#AA6600', mid: '#CC8822', highlight: '#EEBB55' } },
      { name: 'Ratchet', emoji: '🔧', scale: 0.8, segments: 16, toon: { base: '#995500', mid: '#BB7711', highlight: '#DDAA44' } },
      { name: 'Dynamo', emoji: '🤖', scale: 0.95, segments: 16, toon: { base: '#884400', mid: '#AA6600', highlight: '#CC9933' } },
      { name: 'Fabricator', emoji: '🏭', scale: 1.1, segments: 24, toon: { base: '#773300', mid: '#995500', highlight: '#BB8822' } },
      { name: 'Archimedes', emoji: '🎩', scale: 1.25, segments: 24, toon: { base: '#662200', mid: '#884400', highlight: '#AA7711' } },
    ],
  },

  // ─── 5. PIXIE — Computer Vision & Perception ───
  pixie: {
    id: 'pixie',
    name: 'Pixie',
    displayName: 'Pixie',
    theme: 'Computer Vision',
    personality: 'Observant, analytical, loves discovering hidden patterns.',
    labColor: '#06B6D4',
    emoji: '👁️',
    shapeLanguage: 'disc',
    correctReactions: ['Spotted it! 👁️', '*lens focuses*', 'Pattern detected! 🔍', 'Crystal clear! ✨'],
    wrongReactions: ['Blurry... 😵‍💫', '*refocusing*', 'Out of focus...', 'Need another look... 🔎'],
    thinkingPhrases: ['*scanning...*', '*analyzing pixels...*', '*focusing lens...*', '*detecting patterns...*'],
    stages: [
      { name: 'Lens Seed', emoji: '🔮', scale: 0.5, segments: 16, toon: { base: '#047D94', mid: '#06A5C4', highlight: '#67D8ED' } },
      { name: 'Peekaboo', emoji: '👀', scale: 0.65, segments: 20, toon: { base: '#036E85', mid: '#0596B5', highlight: '#58C9DE' } },
      { name: 'Scanner', emoji: '🔍', scale: 0.8, segments: 24, toon: { base: '#025F76', mid: '#0487A6', highlight: '#49BACF' } },
      { name: 'Focusfly', emoji: '🦋', scale: 0.95, segments: 28, toon: { base: '#015067', mid: '#037897', highlight: '#3AABC0' } },
      { name: 'Spectra', emoji: '🦉', scale: 1.1, segments: 32, toon: { base: '#004158', mid: '#026988', highlight: '#2B9CB1' } },
      { name: 'Omniscient', emoji: '🌟', scale: 1.25, segments: 36, toon: { base: '#003249', mid: '#015A79', highlight: '#1C8DA2' } },
    ],
  },
};

// ── Helpers ───────────────────────────────────────────────────────

/** Get species config by ID */
export function getSpecies(id: SpeciesId): SpeciesConfig {
  return SPECIES[id];
}

/** Get all species as array */
export function getAllSpecies(): SpeciesConfig[] {
  return Object.values(SPECIES);
}

/** Get species IDs as array */
export function getSpeciesIds(): SpeciesId[] {
  return Object.keys(SPECIES) as SpeciesId[];
}

/** Get evolution stage config for a species + stage number */
export function getEvolutionStage(speciesId: SpeciesId, stage: number): EvolutionStageConfig {
  const species = SPECIES[speciesId];
  return species.stages[Math.min(Math.max(0, stage), 5)];
}

/** Get mood config */
export function getMoodConfig(mood: PetMood): MoodConfig {
  return MOOD_CONFIGS[mood];
}
