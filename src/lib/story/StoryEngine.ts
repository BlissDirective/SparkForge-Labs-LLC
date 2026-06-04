// ════════════════════════════════════════════════════════════════════════
// STORY ENGINE — Phase 10.4: Cross-Lab Story Campaigns
// ════════════════════════════════════════════════════════════════════════
// 5-chapter narrative campaigns spanning multiple labs, with Sparky
// cutscenes and a branching choice per chapter that steers the ending.
// Replayable for different endings. The campaign catalog lives here; the
// database stores only per-child progress (current chapter, choices, ending).
// ════════════════════════════════════════════════════════════════════════

export type ChoicePath = 'explore' | 'guard';

export interface StoryChoice {
  prompt: string;
  options: { id: ChoicePath; label: string }[];
}

export interface StoryChapter {
  index: number; // 1-based
  title: string;
  /** Lab this chapter is set in (gates the chapter on some lab progress). */
  labId: number;
  emoji: string;
  /** Sparky cutscene lines. */
  lines: string[];
  choice: StoryChoice;
}

export interface StoryEnding {
  id: string;
  title: string;
  emoji: string;
  description: string;
}

export interface StoryCampaign {
  id: string;
  title: string;
  tagline: string;
  emoji: string;
  color: string;
  chapters: StoryChapter[];
  endings: StoryEnding[];
}

export interface StoryProgress {
  campaignId: string;
  childId: string;
  /** 1-based index of the next chapter to play (chapters before it are done). */
  currentChapter: number;
  /** Choice path made at each completed chapter, in order. */
  choices: ChoicePath[];
  completed: boolean;
  endingId: string | null;
}

export const CHAPTERS_PER_CAMPAIGN = 5;

// ─── Campaign catalog ────────────────────────────────────────────────────

const SPARK_AWAKENS: StoryCampaign = {
  id: 'spark-awakens',
  title: 'The Spark Awakens',
  tagline: 'Help Sparky discover what it means to be a good AI.',
  emoji: '✨',
  color: '#4F6EF7',
  chapters: [
    {
      index: 1, title: 'First Light', labId: 1, emoji: '🌅',
      lines: ["Sparky blinks awake for the very first time.", "“Where am I? What... am I?”", 'Together you begin to learn what AI really is.'],
      choice: { prompt: 'How should Sparky learn about the world?', options: [{ id: 'explore', label: 'Explore boldly' }, { id: 'guard', label: 'Observe carefully' }] },
    },
    {
      index: 2, title: 'The First Lesson', labId: 2, emoji: '📚',
      lines: ['Sparky learns that AI grows from examples.', '“So if I see kind things, I learn to be kind?”', 'You help Sparky choose what to learn from.'],
      choice: { prompt: 'What should Sparky value most?', options: [{ id: 'explore', label: 'Creativity' }, { id: 'guard', label: 'Fairness' }] },
    },
    {
      index: 3, title: 'A Mind of Patterns', labId: 3, emoji: '🧠',
      lines: ["Sparky's neural network lights up with new ideas.", '“I can see patterns everywhere now!”', 'But with power comes responsibility.'],
      choice: { prompt: 'How should Sparky use its new abilities?', options: [{ id: 'explore', label: 'Discover new things' }, { id: 'guard', label: 'Protect others' }] },
    },
    {
      index: 4, title: 'Into the World', labId: 7, emoji: '🤖',
      lines: ['Sparky takes its first steps into the real world.', '“There are people who need help out here.”', 'You guide Sparky on how to act.'],
      choice: { prompt: 'What kind of helper should Sparky be?', options: [{ id: 'explore', label: 'A curious friend' }, { id: 'guard', label: 'A careful guardian' }] },
    },
    {
      index: 5, title: 'The Choice', labId: 11, emoji: '🕸️',
      lines: ['Sparky can now act on its own as an agent.', '“I know who I want to be — thanks to you.”', 'The final choice shapes who Sparky becomes.'],
      choice: { prompt: 'What guides Sparky from now on?', options: [{ id: 'explore', label: 'Freedom to explore' }, { id: 'guard', label: 'Wisdom to guide' }] },
    },
  ],
  endings: [
    { id: 'explorer', title: 'The Explorer', emoji: '🚀', description: 'Sparky becomes a fearless discoverer, always seeking new knowledge.' },
    { id: 'guardian', title: 'The Guardian', emoji: '🛡️', description: 'Sparky becomes a wise protector, keeping everyone safe and treated fairly.' },
    { id: 'harmonist', title: 'The Harmonist', emoji: '☯️', description: 'Sparky balances curiosity and care — the best of both worlds.' },
  ],
};

export const STORY_CAMPAIGNS: StoryCampaign[] = [SPARK_AWAKENS];

const CAMPAIGN_INDEX: Record<string, StoryCampaign> = Object.fromEntries(STORY_CAMPAIGNS.map((c) => [c.id, c]));

export function getCampaign(id: string): StoryCampaign | null {
  return CAMPAIGN_INDEX[id] ?? null;
}

// ─── Progress + branching ────────────────────────────────────────────────

export function emptyProgress(campaignId: string, childId: string): StoryProgress {
  return { campaignId, childId, currentChapter: 1, choices: [], completed: false, endingId: null };
}

export function isChapterUnlocked(chapterIndex: number, progress: StoryProgress): boolean {
  // Linear unlock: a chapter is playable once all earlier chapters are done.
  return chapterIndex <= progress.currentChapter;
}

export function isChapterComplete(chapterIndex: number, progress: StoryProgress): boolean {
  return chapterIndex < progress.currentChapter;
}

export function storyPercent(campaign: StoryCampaign, progress: StoryProgress): number {
  const done = Math.min(progress.choices.length, campaign.chapters.length);
  return Math.round((done / campaign.chapters.length) * 100);
}

/** Determine the ending from the tally of choice paths. */
export function computeEnding(choices: ChoicePath[]): string {
  const explore = choices.filter((c) => c === 'explore').length;
  const guard = choices.filter((c) => c === 'guard').length;
  if (explore > guard) return 'explorer';
  if (guard > explore) return 'guardian';
  return 'harmonist';
}

export function getEnding(campaign: StoryCampaign, endingId: string | null): StoryEnding | null {
  if (!endingId) return null;
  return campaign.endings.find((e) => e.id === endingId) ?? null;
}

/**
 * Apply a chapter choice, returning the next progress state. Ignores choices
 * for chapters that aren't the current one (idempotent / out-of-order safe).
 */
export function advanceChapter(
  campaign: StoryCampaign,
  progress: StoryProgress,
  chapterIndex: number,
  choice: ChoicePath,
): StoryProgress {
  if (chapterIndex !== progress.currentChapter) return progress;
  const choices = [...progress.choices, choice];
  const nextChapter = progress.currentChapter + 1;
  const completed = nextChapter > campaign.chapters.length;
  return {
    ...progress,
    currentChapter: Math.min(nextChapter, campaign.chapters.length + 1),
    choices,
    completed,
    endingId: completed ? computeEnding(choices) : null,
  };
}

export function getStoryGreeting(progress: StoryProgress | null): string {
  if (!progress) return 'A new adventure with Sparky awaits!';
  if (progress.completed) return 'You finished the story! Replay to find a different ending.';
  if (progress.currentChapter === 1) return 'A new adventure with Sparky awaits!';
  return `Chapter ${progress.currentChapter} of your adventure continues...`;
}
