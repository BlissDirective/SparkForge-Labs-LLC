// ════════════════════════════════════════════════════════════════
// PET ENGINE — Virtual Pet Retention System
// ════════════════════════════════════════════════════════════════
// Core state machine for the SparkForge companion pet.
// Need-decay system, care actions, growth stages, evolution paths,
// and mood calculation. All pure functions — no side effects.
//
// Design based on research:
// - Virtual pets increase child engagement by 156% (UGA study)
// - Need-decay creates daily login incentive
// - Growth stages create long-term investment
// - Care-quality-based evolution adds replayability

// ═══ TYPES ═══

export type PetStage = 'egg' | 'baby' | 'child' | 'teen' | 'adult';
export type PetMood = 'ecstatic' | 'happy' | 'content' | 'neutral' | 'sad' | 'distressed';
export type PetEvolution = 'scholar' | 'athlete' | 'artist' | 'none';
export type CareAction = 'feed' | 'play' | 'clean' | 'rest' | 'train';
export type PetSpecies = 'pixel' | 'nebula' | 'spark';

export interface PetNeeds {
  hunger: number;      // 0-100 (0 = starving, 100 = full)
  happiness: number;   // 0-100 (0 = depressed, 100 = joyful)
  energy: number;      // 0-100 (0 = exhausted, 100 = energetic)
  cleanliness: number; // 0-100 (0 = filthy, 100 = spotless)
}

export interface PetState {
  id: string;
  childId: string;
  name: string;
  species: PetSpecies;
  stage: PetStage;
  evolution: PetEvolution;
  needs: PetNeeds;
  carePoints: number;       // Currency earned from learning activities
  totalCarePoints: number;  // Lifetime CP earned
  ageDays: number;          // Days since hatch
  careQuality: number;      // 0-100 (average care score)
  consecutiveCareDays: number;
  lastCareAt: string | null; // ISO timestamp
  lastLoginAt: string | null;
  accessories: string[];    // Equipped accessory IDs
  tricksLearned: string[];
  isSleeping: boolean;
  createdAt: string;
}

export interface CareResult {
  success: boolean;
  state: PetState;
  needChanged: keyof PetNeeds | null;
  oldValue: number;
  newValue: number;
  moodBefore: PetMood;
  moodAfter: PetMood;
  message: string;
  xpEarned: number;
  trickUnlocked?: string;
}

export interface NeedDecayResult {
  state: PetState;
  needsChanged: Array<{ need: keyof PetNeeds; oldVal: number; newVal: number }>;
  moodBefore: PetMood;
  moodAfter: PetMood;
  warnings: string[];
  isCritical: boolean;
}

export interface EvolutionCheck {
  canEvolve: boolean;
  toStage: PetStage | null;
  toEvolution: PetEvolution | null;
  requirements: string[];
}

// ═══ CONSTANTS ═══

/** Need decay rates per hour (when pet is awake) */
export const NEED_DECAY_RATES: Record<keyof PetNeeds, number> = {
  hunger: 3,      // -3 per hour
  happiness: 2,   // -2 per hour
  energy: 2,      // -2 per hour
  cleanliness: 1.5, // -1.5 per hour
};

/** Need decay rates while sleeping (slower) */
export const SLEEP_DECAY_RATES: Record<keyof PetNeeds, number> = {
  hunger: 1,
  happiness: 0.5,
  energy: -5,     // Energy RECOVERS while sleeping
  cleanliness: 0.3,
};

/** Care action effects on needs */
export const CARE_ACTION_EFFECTS: Record<CareAction, Partial<PetNeeds> & { cpCost: number; xpReward: number }> = {
  feed:   { hunger: 30, happiness: 5, energy: 5, cpCost: 10, xpReward: 5 },
  play:   { happiness: 25, energy: -15, hunger: -5, cpCost: 15, xpReward: 10 },
  clean:  { cleanliness: 40, happiness: 5, cpCost: 8, xpReward: 5 },
  rest:   { energy: 40, hunger: -5, cpCost: 0, xpReward: 3 },
  train:  { happiness: 10, energy: -20, hunger: -10, cpCost: 25, xpReward: 20 },
};

/** Stage thresholds (age in days) */
export const STAGE_THRESHOLDS: Record<PetStage, number> = {
  egg: 0,
  baby: 1,
  child: 3,
  teen: 7,
  adult: 14,
};

/** Stage labels */
export const STAGE_LABELS: Record<PetStage, string> = {
  egg: 'Egg',
  baby: 'Baby',
  child: 'Child',
  teen: 'Teen',
  adult: 'Adult',
};

/** Mood thresholds (based on average need %) */
export const MOOD_THRESHOLDS: { threshold: number; mood: PetMood }[] = [
  { threshold: 80, mood: 'ecstatic' },
  { threshold: 60, mood: 'happy' },
  { threshold: 40, mood: 'content' },
  { threshold: 25, mood: 'neutral' },
  { threshold: 10, mood: 'sad' },
  { threshold: 0, mood: 'distressed' },
];

/** Mood display config */
export const MOOD_CONFIG: Record<PetMood, { emoji: string; color: string; label: string }> = {
  ecstatic:  { emoji: '🤩', color: '#F59E0B', label: 'Ecstatic' },
  happy:     { emoji: '😊', color: '#10B981', label: 'Happy' },
  content:   { emoji: '🙂', color: '#3B82F6', label: 'Content' },
  neutral:   { emoji: '😐', color: '#6B7280', label: 'Neutral' },
  sad:       { emoji: '😢', color: '#8B5CF6', label: 'Sad' },
  distressed:{ emoji: '💔', color: '#EF4444', label: 'Distressed' },
};

/** Evolution paths based on care style (which need is highest) */
export const EVOLUTION_PATHS: { needs: (keyof PetNeeds)[]; evolution: PetEvolution; label: string; description: string }[] = [
  { needs: ['happiness', 'cleanliness'], evolution: 'scholar', label: 'Scholar', description: 'A wise pet that loves learning and reading' },
  { needs: ['energy', 'hunger'], evolution: 'athlete', label: 'Athlete', description: 'An energetic pet that loves games and challenges' },
  { needs: ['happiness', 'energy'], evolution: 'artist', label: 'Artist', description: 'A creative pet that loves creating and exploring' },
];

/** Species visual config */
export const SPECIES_CONFIG: Record<PetSpecies, { emoji: string; colors: string[]; description: string }> = {
  pixel:  { emoji: '🐱', colors: ['#4F6EF7', '#7C5CFC'], description: 'A digital creature made of pure light' },
  nebula: { emoji: '🦊', colors: ['#E945F5', '#FF6B9D'], description: 'A cosmic being from the far reaches of space' },
  spark:  { emoji: '🐰', colors: ['#FFD93D', '#FF8C00'], description: 'An electric spirit full of energy and curiosity' },
};

/** Stage growth multipliers (how big the pet appears) */
export const STAGE_SIZE_MULT: Record<PetStage, number> = {
  egg: 0.6,
  baby: 0.75,
  child: 0.9,
  teen: 1.0,
  adult: 1.15,
};

/** Critical need threshold */
export const CRITICAL_THRESHOLD = 15;

/** Maximum need value */
export const MAX_NEED = 100;

/** Minimum need value */
export const MIN_NEED = 0;

// ═══ PURE FUNCTIONS ═══

/** Clamp a number between min and max */
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Calculate average of all needs */
export function averageNeeds(needs: PetNeeds): number {
  return (needs.hunger + needs.happiness + needs.energy + needs.cleanliness) / 4;
}

/** A single need below this drags the whole mood down. */
export const CRITICAL_NEED = 20;

// Mood severity order (worst -> best) for clamping.
const MOOD_ORDER: PetMood[] = ['distressed', 'sad', 'neutral', 'content', 'happy', 'ecstatic'];

/**
 * Determine mood from need levels. Mood normally follows the average-based
 * MOOD_THRESHOLDS, but a critically low single need CAPS the mood at 'sad'
 * (one badly-neglected need keeps the pet unhappy even if its average looks
 * fine). A low average can still be 'distressed' — the cap never makes a
 * worse mood better.
 */
export function calculateMood(needs: PetNeeds): PetMood {
  const avg = averageNeeds(needs);
  let mood: PetMood = 'distressed';
  for (const { threshold, mood: m } of MOOD_THRESHOLDS) {
    if (avg >= threshold) {
      mood = m;
      break;
    }
  }

  const minNeed = Math.min(needs.hunger, needs.happiness, needs.energy, needs.cleanliness);
  if (minNeed < CRITICAL_NEED && MOOD_ORDER.indexOf(mood) > MOOD_ORDER.indexOf('sad')) {
    return 'sad';
  }
  return mood;
}

/** Check if any need is critically low */
export function hasCriticalNeed(needs: PetNeeds): boolean {
  return (
    needs.hunger < CRITICAL_THRESHOLD ||
    needs.happiness < CRITICAL_THRESHOLD ||
    needs.energy < CRITICAL_THRESHOLD ||
    needs.cleanliness < CRITICAL_THRESHOLD
  );
}

/** Get warnings for low needs */
export function getNeedWarnings(needs: PetNeeds): string[] {
  const warnings: string[] = [];
  if (needs.hunger < CRITICAL_THRESHOLD) warnings.push(`${MOOD_CONFIG.distressed.emoji} Your pet is very hungry!`);
  else if (needs.hunger < 30) warnings.push('😿 Your pet is getting hungry.');

  if (needs.happiness < CRITICAL_THRESHOLD) warnings.push(`${MOOD_CONFIG.distressed.emoji} Your pet is very lonely!`);
  else if (needs.happiness < 30) warnings.push('😿 Your pet seems lonely.');

  if (needs.energy < CRITICAL_THRESHOLD) warnings.push(`${MOOD_CONFIG.distressed.emoji} Your pet is exhausted!`);
  else if (needs.energy < 30) warnings.push('😿 Your pet looks tired.');

  if (needs.cleanliness < CRITICAL_THRESHOLD) warnings.push(`${MOOD_CONFIG.distressed.emoji} Your pet needs a bath!`);
  else if (needs.cleanliness < 30) warnings.push('😿 Your pet is getting dirty.');

  return warnings;
}

/** Apply need decay based on hours passed */
export function applyNeedDecay(
  state: PetState,
  hoursPassed: number,
): NeedDecayResult {
  const rates = state.isSleeping ? SLEEP_DECAY_RATES : NEED_DECAY_RATES;
  const needsChanged: Array<{ need: keyof PetNeeds; oldVal: number; newVal: number }> = [];

  const newNeeds = { ...state.needs };
  const moodBefore = calculateMood(state.needs);

  for (const [need, rate] of Object.entries(rates) as [keyof PetNeeds, number][]) {
    const oldVal = newNeeds[need];
    const decay = rate * hoursPassed;
    newNeeds[need] = clamp(oldVal - decay, MIN_NEED, MAX_NEED);

    if (Math.abs(newNeeds[need] - oldVal) > 0.5) {
      needsChanged.push({ need, oldVal, newVal: newNeeds[need] });
    }
  }

  const newState: PetState = {
    ...state,
    needs: newNeeds,
    lastLoginAt: new Date().toISOString(),
  };

  const moodAfter = calculateMood(newNeeds);
  const warnings = getNeedWarnings(newNeeds);

  return {
    state: newState,
    needsChanged,
    moodBefore,
    moodAfter,
    warnings,
    isCritical: hasCriticalNeed(newNeeds),
  };
}

/** Calculate hours since last login */
export function hoursSince(lastLogin: string | null): number {
  if (!lastLogin) return 0;
  const ms = Date.now() - new Date(lastLogin).getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

/** Process offline decay since last login */
export function processOfflineDecay(state: PetState): NeedDecayResult {
  const hours = hoursSince(state.lastLoginAt);
  if (hours < 0.5) {
    // Less than 30 min — no meaningful decay
    return {
      state: { ...state, lastLoginAt: new Date().toISOString() },
      needsChanged: [],
      moodBefore: calculateMood(state.needs),
      moodAfter: calculateMood(state.needs),
      warnings: getNeedWarnings(state.needs),
      isCritical: hasCriticalNeed(state.needs),
    };
  }
  return applyNeedDecay(state, hours);
}

/** Perform a care action on the pet */
export function performCareAction(
  state: PetState,
  action: CareAction,
): CareResult {
  const effects = CARE_ACTION_EFFECTS[action];
  const moodBefore = calculateMood(state.needs);

  // Check CP cost
  if (state.carePoints < effects.cpCost) {
    return {
      success: false,
      state,
      needChanged: null,
      oldValue: 0,
      newValue: 0,
      moodBefore,
      moodAfter: moodBefore,
      message: `Not enough Care Points! You need ${effects.cpCost} CP. Complete learning activities to earn more.`,
      xpEarned: 0,
    };
  }

  // Apply effects
  const newNeeds = { ...state.needs };
  let needChanged: keyof PetNeeds | null = null;
  let oldValue = 0;
  let newValue = 0;

  for (const [need, delta] of Object.entries(effects) as [string, number][]) {
    if (need === 'cpCost' || need === 'xpReward') continue;
    const key = need as keyof PetNeeds;
    oldValue = newNeeds[key];
    newNeeds[key] = clamp(oldValue + (delta as number), MIN_NEED, MAX_NEED);
    newValue = newNeeds[key];
    if (!needChanged && Math.abs(delta as number) > 0) {
      needChanged = key;
    }
  }

  // Update state
  const newTotalCP = state.totalCarePoints + effects.xpReward;
  const newConsecutiveDays = state.consecutiveCareDays + (action === 'feed' ? 0 : 0);

  const newState: PetState = {
    ...state,
    needs: newNeeds,
    carePoints: state.carePoints - effects.cpCost,
    totalCarePoints: newTotalCP,
    lastCareAt: new Date().toISOString(),
  };

  const moodAfter = calculateMood(newNeeds);

  // Check for trick unlock
  let trickUnlocked: string | undefined;
  if (action === 'train' && state.tricksLearned.length < TRICKS.length) {
    const availableTricks = TRICKS.filter(t => !state.tricksLearned.includes(t.id));
    if (availableTricks.length > 0 && newNeeds.happiness > 50 && newNeeds.energy > 30) {
      trickUnlocked = availableTricks[0].id;
      newState.tricksLearned = [...newState.tricksLearned, trickUnlocked];
    }
  }

  return {
    success: true,
    state: newState,
    needChanged,
    oldValue,
    newValue,
    moodBefore,
    moodAfter,
    message: getCareMessage(action, moodAfter, trickUnlocked),
    xpEarned: effects.xpReward,
    trickUnlocked,
  };
}

/** Earn care points from completing learning activities */
export function earnCarePoints(
  state: PetState,
  points: number,
  activity: string,
): { state: PetState; message: string } {
  const newState: PetState = {
    ...state,
    carePoints: state.carePoints + points,
    totalCarePoints: state.totalCarePoints + points,
    lastCareAt: new Date().toISOString(),
  };

  return {
    state: newState,
    message: `+${points} Care Points earned from ${activity}! Use them to care for your pet.`,
  };
}

/** Get a care action message */
function getCareMessage(action: CareAction, mood: PetMood, trickUnlocked?: string): string {
  const messages: Record<CareAction, string[]> = {
    feed: [
      'Yum! Your pet loved the food!',
      'Delicious! Your pet is getting stronger!',
      'Your pet gobbled it all up!',
    ],
    play: [
      'Your pet had so much fun playing!',
      'That was a great play session!',
      'Your pet is wagging with joy!',
    ],
    clean: [
      'Your pet is sparkling clean now!',
      'Fresh and clean! Your pet looks great!',
      'Bath time complete! So fluffy!',
    ],
    rest: [
      'Your pet had a nice nap!',
      'Your pet woke up refreshed!',
      'Sweet dreams! Your pet feels rested!',
    ],
    train: [
      'Great training session! Your pet is learning fast!',
      'Your pet mastered a new skill!',
      'Amazing progress in training!',
    ],
  };

  const list = messages[action];
  const msg = list[Math.floor(Math.random() * list.length)];

  if (trickUnlocked) {
    const trick = TRICKS.find(t => t.id === trickUnlocked);
    return `${msg} ✨ Your pet learned "${trick?.name}"!`;
  }

  if (mood === 'ecstatic' || mood === 'happy') {
    return `${msg} ${MOOD_CONFIG[mood].emoji}`;
  }

  return msg;
}

/** Tricks that pets can learn */
export const TRICKS = [
  { id: 'sit', name: 'Sit', stage: 'baby', description: 'The basic sit command' },
  { id: 'wave', name: 'Wave', stage: 'baby', description: 'A cute little wave' },
  { id: 'spin', name: 'Spin', stage: 'child', description: 'A happy spin' },
  { id: 'fetch', name: 'Fetch', stage: 'child', description: 'Brings back a ball' },
  { id: 'dance', name: 'Dance', stage: 'teen', description: 'A little dance routine' },
  { id: 'highfive', name: 'High Five', stage: 'teen', description: 'Gives a high five' },
  { id: 'backflip', name: 'Backflip', stage: 'adult', description: 'An impressive backflip' },
  { id: 'sing', name: 'Sing', stage: 'adult', description: 'A melodic tune' },
];

/** Check if pet can evolve to next stage */
export function checkEvolution(state: PetState): EvolutionCheck {
  const stages: PetStage[] = ['egg', 'baby', 'child', 'teen', 'adult'];
  const currentIdx = stages.indexOf(state.stage);

  if (currentIdx >= stages.length - 1) {
    return { canEvolve: false, toStage: null, toEvolution: null, requirements: ['Already at max stage'] };
  }

  const nextStage = stages[currentIdx + 1];
  const threshold = STAGE_THRESHOLDS[nextStage];
  const avgNeeds = averageNeeds(state.needs);
  const requirements: string[] = [];
  let canEvolve = true;

  if (state.ageDays < threshold) {
    requirements.push(`Age: ${state.ageDays}/${threshold} days`);
    canEvolve = false;
  } else {
    requirements.push(`✅ Age: ${state.ageDays}/${threshold} days`);
  }

  if (avgNeeds < 40) {
    requirements.push(`Need avg: ${Math.round(avgNeeds)}/40%`);
    canEvolve = false;
  } else {
    requirements.push(`✅ Needs: ${Math.round(avgNeeds)}%`);
  }

  // Determine evolution path at adult stage
  let evolution: PetEvolution = 'none';
  if (nextStage === 'adult') {
    // Find highest need to determine evolution
    const needEntries = Object.entries(state.needs) as [keyof PetNeeds, number][];
    const sorted = needEntries.sort((a, b) => b[1] - a[1]);
    const topNeeds = sorted.slice(0, 2).map(n => n[0]);

    for (const path of EVOLUTION_PATHS) {
      if (topNeeds.every(n => path.needs.includes(n))) {
        evolution = path.evolution;
        break;
      }
    }
    if (evolution === 'none') {
      evolution = EVOLUTION_PATHS[0].evolution; // Default
    }
  }

  return { canEvolve, toStage: canEvolve ? nextStage : null, toEvolution: evolution || null, requirements };
}

/** Evolve the pet to the next stage */
export function evolvePet(state: PetState): { state: PetState; message: string } {
  const check = checkEvolution(state);
  if (!check.canEvolve || !check.toStage) {
    return { state, message: 'Cannot evolve yet!' };
  }

  const newState: PetState = {
    ...state,
    stage: check.toStage,
    evolution: check.toEvolution || state.evolution,
    needs: {
      hunger: clamp(state.needs.hunger + 20, MIN_NEED, MAX_NEED),
      happiness: clamp(state.needs.happiness + 30, MIN_NEED, MAX_NEED),
      energy: clamp(state.needs.energy + 20, MIN_NEED, MAX_NEED),
      cleanliness: clamp(state.needs.cleanliness + 20, MIN_NEED, MAX_NEED),
    },
  };

  const stageLabel = STAGE_LABELS[check.toStage];
  const evoLabel = check.toEvolution
    ? EVOLUTION_PATHS.find(e => e.evolution === check.toEvolution)?.label
    : '';

  return {
    state: newState,
    message: evoLabel
      ? `🎉 Your pet evolved into a ${evoLabel} ${stageLabel}!`
      : `🎉 Your pet grew into a ${stageLabel}!`,
  };
}

/** Create a new pet */
export function createPet(childId: string, name: string, species: PetSpecies): PetState {
  return {
    id: `pet-${childId}`,
    childId,
    name,
    species,
    stage: 'egg',
    evolution: 'none',
    needs: { hunger: 80, happiness: 80, energy: 80, cleanliness: 80 },
    carePoints: 50, // Starting CP
    totalCarePoints: 0,
    ageDays: 0,
    careQuality: 50,
    consecutiveCareDays: 0,
    lastCareAt: null,
    lastLoginAt: new Date().toISOString(),
    accessories: [],
    tricksLearned: [],
    isSleeping: false,
    createdAt: new Date().toISOString(),
  };
}

/** Get pet's daily greeting message */
export function getDailyGreeting(state: PetState, childName: string): string {
  const mood = calculateMood(state.needs);
  const greetings: Record<PetMood, string[]> = {
    ecstatic: [
      `${childName}! I'm so happy to see you! Let's learn something amazing today!`,
      `Best day ever! Ready to learn and play, ${childName}?`,
    ],
    happy: [
      `Hey ${childName}! I'm feeling great today! Ready to learn?`,
      `Good to see you, ${childName}! I can't wait to see what we learn today!`,
    ],
    content: [
      `Hi ${childName}! I'm doing okay. Want to do some learning?`,
      `Hello ${childName}! I've been waiting for you.`,
    ],
    neutral: [
      `Oh, hey ${childName}. I've been kind of bored...`,
      `Hi ${childName}. Not much going on here.`,
    ],
    sad: [
      `${childName}... I've been feeling lonely. Can we do something together?`,
      `I missed you, ${childName}. I could really use some attention.`,
    ],
    distressed: [
      `${childName}! I really need your help! Please take care of me!`,
      `${childName}... I don't feel good. Please help me...`,
    ],
  };

  const list = greetings[mood];
  return list[Math.floor(Math.random() * list.length)];
}

/** Toggle sleep state */
export function toggleSleep(state: PetState): PetState {
  return { ...state, isSleeping: !state.isSleeping };
}

/** Get recommended care action based on lowest need */
export function getRecommendedAction(state: PetState): CareAction {
  const needs = state.needs;
  const entries = Object.entries(needs) as [keyof PetNeeds, number][];
  const lowest = entries.sort((a, b) => a[1] - b[1])[0];

  const actionMap: Record<keyof PetNeeds, CareAction> = {
    hunger: 'feed',
    happiness: 'play',
    energy: 'rest',
    cleanliness: 'clean',
  };

  return actionMap[lowest[0]];
}

/** Calculate care quality score (0-100) */
export function calculateCareQuality(needs: PetNeeds): number {
  const avg = averageNeeds(needs);
  return Math.round(avg);
}

/** Get pet's current size multiplier */
export function getPetSize(stage: PetStage): number {
  return STAGE_SIZE_MULT[stage];
}

/** Get available tricks for current stage */
export function getAvailableTricks(stage: PetStage): typeof TRICKS {
  const stageOrder: PetStage[] = ['egg', 'baby', 'child', 'teen', 'adult'];
  const stageIdx = stageOrder.indexOf(stage);
  return TRICKS.filter(t => {
    const trickIdx = stageOrder.indexOf(t.stage as PetStage);
    return trickIdx <= stageIdx;
  });
}

/** Check if pet has unmet needs that should prompt the child */
export function shouldPromptCare(state: PetState): boolean {
  return (
    state.needs.hunger < 40 ||
    state.needs.happiness < 40 ||
    state.needs.energy < 40 ||
    state.needs.cleanliness < 40
  );
}
