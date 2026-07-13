// ════════════════════════════════════════════════════
// Phase 10.3 — UGC Engine (User-Generated Content)
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  QUESTION_BANK,
  TITLE_PREFIXES,
  TITLE_NOUNS,
  MIN_QUESTIONS,
  MAX_QUESTIONS,
  getBankQuestion,
  isBankQuestion,
  isSafeTitle,
  buildTitle,
  validateQuiz,
  averageRating,
  isRatingValid,
  earnedCreatorBadges,
  getCreatorGreeting,
  validatePromptText,
  validateAgentPublish,
  kindLabel,
  PROMPT_MAX_LEN,
  AGENT_NAME_MAX_LEN,
} from '@/lib/ugc/UgcEngine';

const validIds = QUESTION_BANK.slice(0, MIN_QUESTIONS).map((q) => q.id);
const validTitle = buildTitle(TITLE_PREFIXES[0], TITLE_NOUNS[0]);

describe('question bank', () => {
  it('has unique ids and valid correct indices', () => {
    const ids = QUESTION_BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(QUESTION_BANK.every((q) => q.correctIndex >= 0 && q.correctIndex < q.options.length)).toBe(true);
  });

  it('looks up + validates bank membership', () => {
    expect(getBankQuestion(QUESTION_BANK[0].id)?.prompt).toBe(QUESTION_BANK[0].prompt);
    expect(isBankQuestion('not-a-real-id')).toBe(false);
  });
});

describe('safe titles', () => {
  it('accepts generator-built titles, rejects free-form', () => {
    expect(isSafeTitle(validTitle)).toBe(true);
    expect(isSafeTitle('My phone number is 555')).toBe(false);
    expect(isSafeTitle('Random Words Here')).toBe(false);
  });
});

describe('quiz validation (COPPA gate)', () => {
  it('accepts a valid quiz', () => {
    expect(validateQuiz(validTitle, validIds).valid).toBe(true);
  });

  it('rejects unsafe titles', () => {
    expect(validateQuiz('hello world', validIds).valid).toBe(false);
  });

  it('enforces question count bounds', () => {
    expect(validateQuiz(validTitle, validIds.slice(0, MIN_QUESTIONS - 1)).valid).toBe(false);
    const tooMany = QUESTION_BANK.slice(0, MAX_QUESTIONS + 1).map((q) => q.id);
    expect(validateQuiz(validTitle, tooMany).valid).toBe(false);
  });

  it('rejects duplicates and non-bank ids', () => {
    expect(validateQuiz(validTitle, [validIds[0], validIds[0], validIds[1]]).valid).toBe(false);
    expect(validateQuiz(validTitle, [...validIds, 'made-up-id']).valid).toBe(false);
  });
});

describe('ratings + badges', () => {
  it('computes average rating safely', () => {
    expect(averageRating({ ratingSum: 0, ratingCount: 0 })).toBe(0);
    expect(averageRating({ ratingSum: 9, ratingCount: 2 })).toBe(4.5);
  });

  it('validates star range', () => {
    expect(isRatingValid(3)).toBe(true);
    expect(isRatingValid(0)).toBe(false);
    expect(isRatingValid(6)).toBe(false);
    expect(isRatingValid(2.5)).toBe(false);
  });

  it('earns creator badges by threshold', () => {
    expect(earnedCreatorBadges({ published: 1, totalRatings: 0 }).some((b) => b.id === 'first-creation')).toBe(true);
    expect(earnedCreatorBadges({ published: 0, totalRatings: 0 })).toHaveLength(0);
    expect(earnedCreatorBadges({ published: 5, totalRatings: 25 }).length).toBe(3);
  });

  it('adapts the creator greeting', () => {
    expect(getCreatorGreeting(0)).toMatch(/first quiz/i);
    expect(getCreatorGreeting(2)).toMatch(/2 published/i);
  });
});

// ─── G4b: agent + prompt publication validation ───
describe('G4b — publish validation', () => {
  it('accepts a reasonable prompt', () => {
    expect(validatePromptText('Explain how a robot learns to see').valid).toBe(true);
  });

  it('rejects empty / whitespace / overlong prompts', () => {
    expect(validatePromptText('  ').valid).toBe(false);
    expect(validatePromptText('ab').valid).toBe(false); // below PROMPT_MIN_LEN
    expect(validatePromptText('x'.repeat(PROMPT_MAX_LEN + 1)).valid).toBe(false);
  });

  it('rejects prompts containing PII / links', () => {
    expect(validatePromptText('email me at kid@example.com').valid).toBe(false);
    expect(validatePromptText('see https://evil.example/x').valid).toBe(false);
    expect(validatePromptText('call me 555 123 4567 now').valid).toBe(false);
  });

  it('validates agent publications', () => {
    expect(validateAgentPublish({ compositionId: 'c1', name: 'Helper Bot' }).valid).toBe(true);
    expect(validateAgentPublish({ name: 'Helper Bot' }).valid).toBe(false); // no compositionId
    expect(validateAgentPublish({ compositionId: 'c1', name: 'a' }).valid).toBe(false); // too short
    expect(validateAgentPublish({ compositionId: 'c1', name: 'x'.repeat(AGENT_NAME_MAX_LEN + 1) }).valid).toBe(false);
    expect(validateAgentPublish({ compositionId: 'c1', name: 'visit www.x.com' }).valid).toBe(false);
  });

  it('labels kinds', () => {
    expect(kindLabel('quiz')).toBe('Quiz');
    expect(kindLabel('agent')).toBe('Agent');
    expect(kindLabel('prompt')).toBe('Prompt');
  });
});
