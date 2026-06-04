// ════════════════════════════════════════════════════════════════════════
// UGC ENGINE — Phase 10.3: User-Generated Content (COPPA-Safe)
// ════════════════════════════════════════════════════════════════════════
// "Create a Quiz" tool. To stay COPPA-safe there is NO free-form text:
// children assemble a quiz by picking questions from a pre-approved question
// bank and choosing a title from a safe word-bank generator. Quizzes are
// parent-moderated before they join the community library, where other kids
// can rate them. Creator badges reward published, well-rated content.
// ════════════════════════════════════════════════════════════════════════

export type ModerationStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface BankQuestion {
  id: string;
  labId: number;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface UserQuiz {
  id: string;
  creatorChildId: string;
  title: string;
  questionIds: string[];
  status: ModerationStatus;
  ratingSum: number;
  ratingCount: number;
  createdAt: string;
}

export interface CreatorBadge {
  id: string;
  title: string;
  emoji: string;
  requirement: number;
  metric: 'published' | 'total_ratings';
}

export const MIN_QUESTIONS = 3;
export const MAX_QUESTIONS = 8;

// ─── Pre-approved question bank (the ONLY content children can use) ──────

export const QUESTION_BANK: BankQuestion[] = [
  { id: 'b-ai-1', labId: 1, prompt: 'What does "AI" stand for?', options: ['Artificial Intelligence', 'Automatic Internet', 'Apple Inc', 'Animal Instinct'], correctIndex: 0 },
  { id: 'b-ai-2', labId: 1, prompt: 'Which of these is an example of AI?', options: ['A voice assistant', 'A wooden chair', 'A paper map', 'A bicycle'], correctIndex: 0 },
  { id: 'b-ml-1', labId: 2, prompt: 'How does a machine "learn"?', options: ['From lots of examples', 'By taking a nap', 'By magic', 'It cannot learn'], correctIndex: 0 },
  { id: 'b-ml-2', labId: 2, prompt: 'Sorting photos of cats and dogs is an example of...', options: ['Classification', 'Cooking', 'Painting', 'Sleeping'], correctIndex: 0 },
  { id: 'b-nn-1', labId: 3, prompt: 'A neural network is loosely inspired by the...', options: ['Brain', 'Stomach', 'Foot', 'Ear'], correctIndex: 0 },
  { id: 'b-nn-2', labId: 3, prompt: 'What do neural networks use to improve?', options: ['Training data', 'Pizza', 'Sunshine', 'Music'], correctIndex: 0 },
  { id: 'b-tok-1', labId: 8, prompt: 'Breaking text into pieces for AI is called...', options: ['Tokenization', 'Decoration', 'Recreation', 'Translation'], correctIndex: 0 },
  { id: 'b-tok-2', labId: 8, prompt: 'How many words are in "the cat sat"?', options: ['3', '1', '5', '10'], correctIndex: 0 },
  { id: 'b-eth-1', labId: 3, prompt: 'Why should AI be fair?', options: ['So it treats everyone equally', 'So it runs faster', 'So it uses less power', 'It does not matter'], correctIndex: 0 },
  { id: 'b-rob-1', labId: 7, prompt: 'A robot vacuum uses sensors to...', options: ['Find its way around', 'Cook dinner', 'Tell jokes', 'Do homework'], correctIndex: 0 },
  { id: 'b-cv-1', labId: 7, prompt: 'Computer vision helps AI to...', options: ['See and understand images', 'Hear music', 'Smell flowers', 'Taste food'], correctIndex: 0 },
  { id: 'b-agent-1', labId: 11, prompt: 'An AI agent can...', options: ['Take steps to reach a goal', 'Only sit still', 'Eat snacks', 'Grow taller'], correctIndex: 0 },
];

const BANK_INDEX: Record<string, BankQuestion> = Object.fromEntries(QUESTION_BANK.map((q) => [q.id, q]));

export function getBankQuestion(id: string): BankQuestion | null {
  return BANK_INDEX[id] ?? null;
}

export function isBankQuestion(id: string): boolean {
  return id in BANK_INDEX;
}

// ─── Safe title generator (no free-form typing) ──────────────────────────

export const TITLE_PREFIXES = ['Super', 'Mega', 'Cosmic', 'Brainy', 'Clever', 'Mighty', 'Sparkly', 'Curious'];
export const TITLE_NOUNS = ['AI Quiz', 'Robot Challenge', 'Brain Teaser', 'Tech Trivia', 'Code Quest', 'Smart Quiz'];

export function isSafeTitle(title: string): boolean {
  const [prefix, ...rest] = title.split(' ');
  const noun = rest.join(' ');
  return TITLE_PREFIXES.includes(prefix) && TITLE_NOUNS.includes(noun);
}

export function buildTitle(prefix: string, noun: string): string {
  return `${prefix} ${noun}`;
}

// ─── Validation ──────────────────────────────────────────────────────────

export interface QuizValidation {
  valid: boolean;
  reason?: string;
}

export function validateQuiz(title: string, questionIds: string[]): QuizValidation {
  if (!isSafeTitle(title)) return { valid: false, reason: 'Pick a title from the options.' };
  if (questionIds.length < MIN_QUESTIONS) return { valid: false, reason: `Add at least ${MIN_QUESTIONS} questions.` };
  if (questionIds.length > MAX_QUESTIONS) return { valid: false, reason: `Use at most ${MAX_QUESTIONS} questions.` };
  if (new Set(questionIds).size !== questionIds.length) return { valid: false, reason: 'No duplicate questions.' };
  if (!questionIds.every(isBankQuestion)) return { valid: false, reason: 'All questions must come from the question bank.' };
  return { valid: true };
}

// ─── Ratings ─────────────────────────────────────────────────────────────

export function averageRating(quiz: Pick<UserQuiz, 'ratingSum' | 'ratingCount'>): number {
  if (quiz.ratingCount === 0) return 0;
  return Math.round((quiz.ratingSum / quiz.ratingCount) * 10) / 10;
}

export function isRatingValid(stars: number): boolean {
  return Number.isInteger(stars) && stars >= 1 && stars <= 5;
}

// ─── Creator badges ──────────────────────────────────────────────────────

export const CREATOR_BADGES: CreatorBadge[] = [
  { id: 'first-creation', title: 'First Creation', emoji: '✏️', requirement: 1, metric: 'published' },
  { id: 'quiz-maker', title: 'Quiz Maker', emoji: '📝', requirement: 5, metric: 'published' },
  { id: 'crowd-pleaser', title: 'Crowd Pleaser', emoji: '⭐', requirement: 25, metric: 'total_ratings' },
];

export function earnedCreatorBadges(stats: { published: number; totalRatings: number }): CreatorBadge[] {
  return CREATOR_BADGES.filter((b) =>
    b.metric === 'published' ? stats.published >= b.requirement : stats.totalRatings >= b.requirement,
  );
}

export function getCreatorGreeting(published: number): string {
  if (published === 0) return 'Create your first quiz — pick questions and share it (with a grown-up’s OK)!';
  return `You have ${published} published quiz${published === 1 ? '' : 'zes'} in the community library!`;
}
