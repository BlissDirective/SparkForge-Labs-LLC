// ════════════════════════════════════════════════════
// PET ENGINE TESTS — Virtual Pet System
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  createPet,
  performCareAction,
  applyNeedDecay,
  evolvePet,
  earnCarePoints,
  toggleSleep,
  calculateMood,
  averageNeeds,
  hasCriticalNeed,
  getNeedWarnings,
  checkEvolution,
  getDailyGreeting,
  getRecommendedAction,
  calculateCareQuality,
  getPetSize,
  getAvailableTricks,
  shouldPromptCare,
  hoursSince,
  processOfflineDecay,
  MOOD_CONFIG,
  STAGE_LABELS,
  STAGE_THRESHOLDS,
  CARE_ACTION_EFFECTS,
  EVOLUTION_PATHS,
  TRICKS,
  CRITICAL_THRESHOLD,
  MAX_NEED,
  MIN_NEED,
  NEED_DECAY_RATES,
  SLEEP_DECAY_RATES,
} from '@/lib/pet/PetEngine';
import type { PetState, PetNeeds, CareAction } from '@/lib/pet/PetEngine';

// ─── Test Helpers ───

function makePet(overrides: Partial<PetState> = {}): PetState {
  return {
    id: 'pet-test',
    childId: 'child-test',
    name: 'Pixel',
    species: 'pixel',
    stage: 'baby',
    evolution: 'none',
    needs: { hunger: 80, happiness: 80, energy: 80, cleanliness: 80 },
    carePoints: 50,
    totalCarePoints: 0,
    ageDays: 1,
    careQuality: 50,
    consecutiveCareDays: 0,
    lastCareAt: null,
    lastLoginAt: new Date().toISOString(),
    accessories: [],
    tricksLearned: [],
    isSleeping: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Creation Tests ───

describe('createPet', () => {
  it('creates egg-stage pet with full needs', () => {
    const pet = createPet('child-1', 'Sparky', 'pixel');
    expect(pet.stage).toBe('egg');
    expect(pet.name).toBe('Sparky');
    expect(pet.species).toBe('pixel');
    expect(pet.needs.hunger).toBe(80);
    expect(pet.carePoints).toBe(50);
    expect(pet.childId).toBe('child-1');
  });

  it('creates different species', () => {
    const nebula = createPet('c1', 'Neb', 'nebula');
    expect(nebula.species).toBe('nebula');

    const spark = createPet('c2', 'Spark', 'spark');
    expect(spark.species).toBe('spark');
  });
});

// ─── Mood Tests ───

describe('calculateMood', () => {
  it('returns ecstatic at high needs', () => {
    expect(calculateMood({ hunger: 90, happiness: 90, energy: 90, cleanliness: 90 })).toBe('ecstatic');
  });

  it('returns happy at good needs', () => {
    expect(calculateMood({ hunger: 75, happiness: 75, energy: 75, cleanliness: 75 })).toBe('happy');
  });

  it('returns content at medium needs', () => {
    expect(calculateMood({ hunger: 50, happiness: 50, energy: 50, cleanliness: 50 })).toBe('content');
  });

  it('returns distressed at very low needs', () => {
    expect(calculateMood({ hunger: 5, happiness: 5, energy: 5, cleanliness: 5 })).toBe('distressed');
  });

  it('returns sad when any need is very low', () => {
    expect(calculateMood({ hunger: 80, happiness: 80, energy: 80, cleanliness: 5 })).toBe('sad');
  });
});

describe('averageNeeds', () => {
  it('calculates average of all needs', () => {
    expect(averageNeeds({ hunger: 50, happiness: 50, energy: 50, cleanliness: 50 })).toBe(50);
  });

  it('handles max needs', () => {
    expect(averageNeeds({ hunger: 100, happiness: 100, energy: 100, cleanliness: 100 })).toBe(100);
  });
});

// ─── Critical Need Tests ───

describe('hasCriticalNeed', () => {
  it('returns true when hunger is critical', () => {
    expect(hasCriticalNeed({ hunger: 10, happiness: 80, energy: 80, cleanliness: 80 })).toBe(true);
  });

  it('returns false when all needs are safe', () => {
    expect(hasCriticalNeed({ hunger: 50, happiness: 50, energy: 50, cleanliness: 50 })).toBe(false);
  });

  it('detects critical cleanliness', () => {
    expect(hasCriticalNeed({ hunger: 80, happiness: 80, energy: 80, cleanliness: 5 })).toBe(true);
  });
});

describe('getNeedWarnings', () => {
  it('returns warnings for low needs', () => {
    const warnings = getNeedWarnings({ hunger: 20, happiness: 80, energy: 80, cleanliness: 80 });
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('returns empty when needs are fine', () => {
    const warnings = getNeedWarnings({ hunger: 80, happiness: 80, energy: 80, cleanliness: 80 });
    expect(warnings.length).toBe(0);
  });

  it('includes critical warning for very low needs', () => {
    const warnings = getNeedWarnings({ hunger: 5, happiness: 80, energy: 80, cleanliness: 80 });
    expect(warnings.some(w => w.includes('💔'))).toBe(true);
  });
});

// ─── Care Action Tests ───

describe('performCareAction', () => {
  it('feeds the pet successfully', () => {
    const pet = makePet({ needs: { hunger: 20, happiness: 80, energy: 80, cleanliness: 80 } });
    const result = performCareAction(pet, 'feed');

    expect(result.success).toBe(true);
    expect(result.state.needs.hunger).toBeGreaterThan(pet.needs.hunger);
    expect(result.xpEarned).toBeGreaterThan(0);
  });

  it('fails when not enough CP', () => {
    const pet = makePet({ carePoints: 0 });
    const result = performCareAction(pet, 'feed');

    expect(result.success).toBe(false);
    expect(result.state.carePoints).toBe(0);
  });

  it('costs CP for feed', () => {
    const pet = makePet({ carePoints: 50 });
    const result = performCareAction(pet, 'feed');

    expect(result.success).toBe(true);
    expect(result.state.carePoints).toBe(50 - CARE_ACTION_EFFECTS.feed.cpCost);
  });

  it('play reduces energy', () => {
    const pet = makePet({ needs: { hunger: 80, happiness: 50, energy: 80, cleanliness: 80 } });
    const result = performCareAction(pet, 'play');

    expect(result.success).toBe(true);
    expect(result.state.needs.happiness).toBeGreaterThan(pet.needs.happiness);
    expect(result.state.needs.energy).toBeLessThan(pet.needs.energy);
  });

  it('rest recovers energy', () => {
    const pet = makePet({ needs: { hunger: 80, happiness: 80, energy: 20, cleanliness: 80 } });
    const result = performCareAction(pet, 'rest');

    expect(result.success).toBe(true);
    expect(result.state.needs.energy).toBeGreaterThan(pet.needs.energy);
  });

  it('train costs the most CP', () => {
    const pet = makePet({ carePoints: 50 });
    const result = performCareAction(pet, 'train');

    expect(result.success).toBe(true);
    expect(CARE_ACTION_EFFECTS.train.cpCost).toBeGreaterThan(CARE_ACTION_EFFECTS.feed.cpCost);
  });

  it('clamps needs at 100', () => {
    const pet = makePet({ needs: { hunger: 95, happiness: 95, energy: 95, cleanliness: 95 } });
    const result = performCareAction(pet, 'feed');

    expect(result.state.needs.hunger).toBeLessThanOrEqual(100);
  });
});

// ─── Need Decay Tests ───

describe('applyNeedDecay', () => {
  it('decays needs over hours awake', () => {
    const pet = makePet({ isSleeping: false });
    const result = applyNeedDecay(pet, 10);

    expect(result.state.needs.hunger).toBeLessThan(pet.needs.hunger);
    expect(result.state.needs.happiness).toBeLessThan(pet.needs.happiness);
  });

  it('recovers energy while sleeping', () => {
    const pet = makePet({ isSleeping: true, needs: { hunger: 80, happiness: 80, energy: 20, cleanliness: 80 } });
    const result = applyNeedDecay(pet, 5);

    expect(result.state.needs.energy).toBeGreaterThan(pet.needs.energy);
  });

  it('does not decay below 0', () => {
    const pet = makePet({ needs: { hunger: 1, happiness: 1, energy: 1, cleanliness: 1 } });
    const result = applyNeedDecay(pet, 100);

    expect(result.state.needs.hunger).toBe(0);
    expect(result.state.needs.happiness).toBe(0);
  });

  it('marks critical when needs are very low', () => {
    const pet = makePet({ needs: { hunger: 10, happiness: 10, energy: 10, cleanliness: 10 } });
    const result = applyNeedDecay(pet, 5);

    expect(result.isCritical).toBe(true);
  });

  it('returns warnings for decayed needs', () => {
    const pet = makePet({ needs: { hunger: 20, happiness: 80, energy: 80, cleanliness: 80 } });
    const result = applyNeedDecay(pet, 5);

    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

// ─── Evolution Tests ───

describe('checkEvolution', () => {
  it('allows evolution when age and needs met', () => {
    const pet = makePet({ stage: 'baby', ageDays: 5, needs: { hunger: 80, happiness: 80, energy: 80, cleanliness: 80 } });
    const check = checkEvolution(pet);

    expect(check.canEvolve).toBe(true);
    expect(check.toStage).toBe('child');
  });

  it('blocks evolution when too young', () => {
    const pet = makePet({ stage: 'baby', ageDays: 1 });
    const check = checkEvolution(pet);

    expect(check.canEvolve).toBe(false);
  });

  it('blocks evolution when needs are low', () => {
    const pet = makePet({ stage: 'baby', ageDays: 5, needs: { hunger: 10, happiness: 10, energy: 10, cleanliness: 10 } });
    const check = checkEvolution(pet);

    expect(check.canEvolve).toBe(false);
  });

  it('reaches max at adult', () => {
    const pet = makePet({ stage: 'adult', ageDays: 30 });
    const check = checkEvolution(pet);

    expect(check.canEvolve).toBe(false);
    expect(check.toStage).toBeNull();
  });

  it('determines evolution path at adult', () => {
    const pet = makePet({
      stage: 'teen',
      ageDays: 15,
      needs: { hunger: 50, happiness: 90, energy: 60, cleanliness: 90 },
    });
    const check = checkEvolution(pet);

    expect(check.canEvolve).toBe(true);
    expect(check.toStage).toBe('adult');
    expect(check.toEvolution).toBeDefined();
    expect(['scholar', 'athlete', 'artist']).toContain(check.toEvolution);
  });
});

describe('evolvePet', () => {
  it('evolves pet and boosts needs', () => {
    const pet = makePet({ stage: 'baby', ageDays: 5, needs: { hunger: 50, happiness: 50, energy: 50, cleanliness: 50 } });
    const result = evolvePet(pet);

    expect(result.state.stage).toBe('child');
    expect(result.state.needs.happiness).toBeGreaterThan(pet.needs.happiness);
  });

  it('does not evolve when requirements not met', () => {
    const pet = makePet({ stage: 'baby', ageDays: 1 });
    const result = evolvePet(pet);

    expect(result.state.stage).toBe('baby');
  });
});

// ─── Care Points Tests ───

describe('earnCarePoints', () => {
  it('adds care points', () => {
    const pet = makePet({ carePoints: 10 });
    const result = earnCarePoints(pet, 25, 'completed quiz');

    expect(result.state.carePoints).toBe(35);
    expect(result.state.totalCarePoints).toBe(25);
    expect(result.message).toContain('25');
  });
});

// ─── Sleep Tests ───

describe('toggleSleep', () => {
  it('toggles sleep on', () => {
    const pet = makePet({ isSleeping: false });
    const result = toggleSleep(pet);

    expect(result.isSleeping).toBe(true);
  });

  it('toggles sleep off', () => {
    const pet = makePet({ isSleeping: true });
    const result = toggleSleep(pet);

    expect(result.isSleeping).toBe(false);
  });
});

// ─── Recommendation Tests ───

describe('getRecommendedAction', () => {
  it('recommends feed when hungry', () => {
    const pet = makePet({ needs: { hunger: 10, happiness: 80, energy: 80, cleanliness: 80 } });
    expect(getRecommendedAction(pet)).toBe('feed');
  });

  it('recommends rest when tired', () => {
    const pet = makePet({ needs: { hunger: 80, happiness: 80, energy: 10, cleanliness: 80 } });
    expect(getRecommendedAction(pet)).toBe('rest');
  });

  it('recommends play when lonely', () => {
    const pet = makePet({ needs: { hunger: 80, happiness: 10, energy: 80, cleanliness: 80 } });
    expect(getRecommendedAction(pet)).toBe('play');
  });

  it('recommends clean when dirty', () => {
    const pet = makePet({ needs: { hunger: 80, happiness: 80, energy: 80, cleanliness: 10 } });
    expect(getRecommendedAction(pet)).toBe('clean');
  });
});

// ─── Utility Tests ───

describe('calculateCareQuality', () => {
  it('returns 100 for perfect needs', () => {
    expect(calculateCareQuality({ hunger: 100, happiness: 100, energy: 100, cleanliness: 100 })).toBe(100);
  });

  it('returns 50 for average needs', () => {
    expect(calculateCareQuality({ hunger: 50, happiness: 50, energy: 50, cleanliness: 50 })).toBe(50);
  });
});

describe('getPetSize', () => {
  it('returns smaller size for egg', () => {
    expect(getPetSize('egg')).toBeLessThan(getPetSize('adult'));
  });

  it('returns largest size for adult', () => {
    const sizes = (['egg', 'baby', 'child', 'teen', 'adult'] as const).map(getPetSize);
    expect(sizes[4]).toBe(Math.max(...sizes));
  });
});

describe('getAvailableTricks', () => {
  it('returns tricks for current stage', () => {
    const tricks = getAvailableTricks('adult');
    expect(tricks.length).toBe(TRICKS.length);
  });

  it('returns fewer tricks for baby', () => {
    const babyTricks = getAvailableTricks('baby');
    const adultTricks = getAvailableTricks('adult');
    expect(babyTricks.length).toBeLessThan(adultTricks.length);
  });
});

describe('shouldPromptCare', () => {
  it('returns true when needs are low', () => {
    expect(shouldPromptCare(makePet({ needs: { hunger: 30, happiness: 80, energy: 80, cleanliness: 80 } }))).toBe(true);
  });

  it('returns false when needs are good', () => {
    expect(shouldPromptCare(makePet({ needs: { hunger: 80, happiness: 80, energy: 80, cleanliness: 80 } }))).toBe(false);
  });
});

// ─── Constants Tests ───

describe('CARE_ACTION_EFFECTS', () => {
  it('has all care actions defined', () => {
    const actions: CareAction[] = ['feed', 'play', 'clean', 'rest', 'train'];
    for (const action of actions) {
      expect(CARE_ACTION_EFFECTS[action]).toBeDefined();
    }
  });

  it('has non-negative XP rewards', () => {
    for (const effect of Object.values(CARE_ACTION_EFFECTS)) {
      expect(effect.xpReward).toBeGreaterThanOrEqual(0);
    }
  });

  it('has train as most expensive', () => {
    const costs = Object.values(CARE_ACTION_EFFECTS).map(e => e.cpCost);
    const maxCost = Math.max(...costs);
    expect(CARE_ACTION_EFFECTS.train.cpCost).toBe(maxCost);
  });
});

describe('NEED_DECAY_RATES', () => {
  it('has positive decay rates (except energy while sleeping)', () => {
    expect(NEED_DECAY_RATES.hunger).toBeGreaterThan(0);
    expect(SLEEP_DECAY_RATES.energy).toBeLessThan(0); // Energy recovers while sleeping
  });
});

describe('STAGE_THRESHOLDS', () => {
  it('has ascending thresholds', () => {
    expect(STAGE_THRESHOLDS.baby).toBeLessThan(STAGE_THRESHOLDS.child);
    expect(STAGE_THRESHOLDS.child).toBeLessThan(STAGE_THRESHOLDS.teen);
    expect(STAGE_THRESHOLDS.teen).toBeLessThan(STAGE_THRESHOLDS.adult);
  });
});

describe('MOOD_CONFIG', () => {
  it('has config for all moods', () => {
    const moods = ['ecstatic', 'happy', 'content', 'neutral', 'sad', 'distressed'];
    for (const mood of moods) {
      expect(MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG]).toBeDefined();
    }
  });
});

describe('EVOLUTION_PATHS', () => {
  it('has 3 evolution paths', () => {
    expect(EVOLUTION_PATHS.length).toBe(3);
  });

  it('has unique evolutions', () => {
    const evos = EVOLUTION_PATHS.map(e => e.evolution);
    expect(new Set(evos).size).toBe(evos.length);
  });
});

describe('TRICKS', () => {
  it('has tricks for each stage', () => {
    const stages = ['baby', 'child', 'teen', 'adult'];
    for (const stage of stages) {
      const tricks = TRICKS.filter(t => t.stage === stage);
      expect(tricks.length).toBeGreaterThan(0);
    }
  });
});
