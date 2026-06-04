// ════════════════════════════════════════════════════
// Phase 10.4 — Story Engine (Cross-Lab Story Campaigns)
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  STORY_CAMPAIGNS,
  CHAPTERS_PER_CAMPAIGN,
  getCampaign,
  emptyProgress,
  isChapterUnlocked,
  isChapterComplete,
  storyPercent,
  computeEnding,
  getEnding,
  advanceChapter,
  getStoryGreeting,
  type ChoicePath,
} from '@/lib/story/StoryEngine';

const campaign = STORY_CAMPAIGNS[0];

describe('campaign catalog', () => {
  it('each campaign has 5 chapters and named endings', () => {
    for (const c of STORY_CAMPAIGNS) {
      expect(c.chapters).toHaveLength(CHAPTERS_PER_CAMPAIGN);
      expect(c.endings.length).toBeGreaterThanOrEqual(2);
      c.chapters.forEach((ch, i) => expect(ch.index).toBe(i + 1));
    }
  });

  it('looks up campaigns by id', () => {
    expect(getCampaign(campaign.id)?.title).toBe(campaign.title);
    expect(getCampaign('nope')).toBeNull();
  });
});

describe('chapter gating', () => {
  it('unlocks linearly and tracks completion', () => {
    const p = emptyProgress(campaign.id, 'child-1');
    expect(isChapterUnlocked(1, p)).toBe(true);
    expect(isChapterUnlocked(2, p)).toBe(false);
    expect(isChapterComplete(1, p)).toBe(false);

    const p2 = { ...p, currentChapter: 3, choices: ['explore', 'guard'] as ChoicePath[] };
    expect(isChapterComplete(1, p2)).toBe(true);
    expect(isChapterComplete(3, p2)).toBe(false);
    expect(isChapterUnlocked(3, p2)).toBe(true);
  });
});

describe('branching + endings', () => {
  it('computes ending from choice tally', () => {
    expect(computeEnding(['explore', 'explore', 'guard'])).toBe('explorer');
    expect(computeEnding(['guard', 'guard', 'explore'])).toBe('guardian');
    expect(computeEnding(['explore', 'guard'])).toBe('harmonist');
  });

  it('advances through the whole campaign to an ending', () => {
    let p = emptyProgress(campaign.id, 'child-1');
    const choices: ChoicePath[] = ['explore', 'explore', 'explore', 'guard', 'guard'];
    for (let i = 0; i < CHAPTERS_PER_CAMPAIGN; i++) {
      expect(p.completed).toBe(false);
      p = advanceChapter(campaign, p, i + 1, choices[i]);
    }
    expect(p.completed).toBe(true);
    expect(p.endingId).toBe('explorer'); // 3 explore vs 2 guard
    expect(getEnding(campaign, p.endingId)?.title).toBeTruthy();
    expect(storyPercent(campaign, p)).toBe(100);
  });

  it('ignores out-of-order chapter advances', () => {
    const p = emptyProgress(campaign.id, 'child-1'); // currentChapter = 1
    const same = advanceChapter(campaign, p, 3, 'explore');
    expect(same).toBe(p); // no change
  });
});

describe('greeting', () => {
  it('adapts to progress', () => {
    expect(getStoryGreeting(null)).toMatch(/new adventure/i);
    const done = { ...emptyProgress(campaign.id, 'c'), completed: true };
    expect(getStoryGreeting(done)).toMatch(/different ending/i);
  });
});
