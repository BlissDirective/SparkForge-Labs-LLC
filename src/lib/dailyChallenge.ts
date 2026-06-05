// ════════════════════════════════════════════════════
// SPARKFORGE DAILY CHALLENGE SYSTEM
// Deterministic date-seeded challenge selection
// Resets at midnight UTC
// ════════════════════════════════════════════════════

import { LABS } from '@/types';

// Derive lab names from LABS array (LAB_NAMES not exported from types)
const LAB_NAMES: Record<number, string> = Object.fromEntries(
  LABS.map((lab) => [lab.id, lab.title])
);

export type ChallengeType =
  | 'play-game'
  | 'complete-quiz'
  | 'read-lesson'
  | 'explore-lab'
  | 'earn-xp'
  | 'play-any';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: ChallengeType;
  targetLabId?: number;
  targetSlug?: string;
  xpReward: number;
  requirementCount: number;
}

// 18 challenge templates — deterministically selected by date
export const CHALLENGE_TEMPLATES: Omit<DailyChallenge, 'id'>[] = [
  // Play-game challenges (6)
  {
    title: 'Game Explorer',
    description: 'Play any game to complete this challenge',
    icon: '\uD83C\uDFAE',
    type: 'play-any',
    xpReward: 30,
    requirementCount: 1,
  },
  {
    title: 'Double Play',
    description: 'Play any 2 games today',
    icon: '\uD83C\uDFB2',
    type: 'play-any',
    xpReward: 40,
    requirementCount: 2,
  },
  {
    title: 'Lab Visitor',
    description: 'Play a game from Lab {labId}',
    icon: '\uD83D\uDD2C',
    type: 'play-game',
    xpReward: 35,
    requirementCount: 1,
  },
  {
    title: 'Lab Hopper',
    description: 'Play games from 2 different labs',
    icon: '\uD83D\uDE80',
    type: 'play-any',
    xpReward: 45,
    requirementCount: 2,
  },
  {
    title: 'Triple Threat',
    description: 'Play any 3 games today',
    icon: '\u26A1',
    type: 'play-any',
    xpReward: 50,
    requirementCount: 3,
  },
  {
    title: 'Flagship Focus',
    description: 'Play a flagship game today',
    icon: '\u2B50',
    type: 'play-any',
    xpReward: 40,
    requirementCount: 1,
  },
  // Quiz challenges (3)
  {
    title: 'Quiz Whiz',
    description: 'Complete any quiz today',
    icon: '\u2753',
    type: 'complete-quiz',
    xpReward: 30,
    requirementCount: 1,
  },
  {
    title: 'Double Quiz',
    description: 'Complete 2 quizzes today',
    icon: '\uD83E\uDDE0',
    type: 'complete-quiz',
    xpReward: 45,
    requirementCount: 2,
  },
  {
    title: 'Perfect Score',
    description: 'Score 100% on any quiz',
    icon: '\uD83C\uDFC6',
    type: 'complete-quiz',
    xpReward: 50,
    requirementCount: 1,
  },
  // Lesson challenges (3)
  {
    title: 'Lesson Learner',
    description: 'Read any lesson today',
    icon: '\uD83D\uDCDA',
    type: 'read-lesson',
    xpReward: 25,
    requirementCount: 1,
  },
  {
    title: 'Study Session',
    description: 'Read 2 lessons today',
    icon: '\uD83D\uDCD6',
    type: 'read-lesson',
    xpReward: 40,
    requirementCount: 2,
  },
  {
    title: 'Bookworm',
    description: 'Read 3 lessons today',
    icon: '\uD83D\uDC1B',
    type: 'read-lesson',
    xpReward: 50,
    requirementCount: 3,
  },
  // Explore challenges (3)
  {
    title: 'Lab Explorer',
    description: 'Visit Lab {labId} and try an activity',
    icon: '\uD83D\uDDFA\uFE0F',
    type: 'explore-lab',
    xpReward: 30,
    requirementCount: 1,
  },
  {
    title: 'World Tour',
    description: 'Visit 3 different labs today',
    icon: '\uD83C\uDF0D',
    type: 'explore-lab',
    xpReward: 45,
    requirementCount: 3,
  },
  {
    title: 'New Territory',
    description: 'Try a lab you haven\'t visited this week',
    icon: '\uD83C\uDF1F',
    type: 'explore-lab',
    xpReward: 40,
    requirementCount: 1,
  },
  // XP challenges (3)
  {
    title: 'XP Sprint',
    description: 'Earn 50 XP today',
    icon: '\uD83D\uDCAA',
    type: 'earn-xp',
    xpReward: 30,
    requirementCount: 50,
  },
  {
    title: 'XP Marathon',
    description: 'Earn 100 XP today',
    icon: '\uD83C\uDFC3',
    type: 'earn-xp',
    xpReward: 45,
    requirementCount: 100,
  },
  {
    title: 'XP Champion',
    description: 'Earn 200 XP today',
    icon: '\uD83E\uDD47',
    type: 'earn-xp',
    xpReward: 60,
    requirementCount: 200,
  },
];

// Deterministic hash from date string → stable daily index
function dateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const ch = dateStr.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs(hash);
}

// Get today's date string in UTC (YYYY-MM-DD)
export function getTodayUTC(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Get today's challenge based on deterministic date seed
export function getTodaysChallenge(): DailyChallenge {
  const today = getTodayUTC();
  const seed = dateSeed(today);
  const templateIndex = seed % CHALLENGE_TEMPLATES.length;
  const template = { ...CHALLENGE_TEMPLATES[templateIndex] };

  // Assign a lab ID for lab-specific challenges
  const labSeed = dateSeed(today + '-lab');
  const labId = (labSeed % 10) + 1; // Labs 1-10

  if (template.description.includes('{labId}')) {
    template.targetLabId = labId;
    const labName = LAB_NAMES[labId] || `Lab ${labId}`;
    template.description = template.description.replace('{labId}', labName);
  }

  return {
    ...template,
    id: `daily-${today}`,
  };
}

// Check if a specific date's challenge is complete
export function isChallengeComplete(
  completedDate: string | null | undefined,
): boolean {
  if (!completedDate) return false;
  return completedDate === getTodayUTC();
}

// Get seconds until next daily reset (midnight UTC)
export function getSecondsUntilReset(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0,
  ));
  return Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
}

// Format remaining time as "Xh Ym"
export function formatTimeRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return 'Less than a minute';
}
