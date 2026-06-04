// ════════════════════════════════════════════════════════════════════════
// SOCIAL ENGINE — Phase 8: COPPA-Safe Social Features
// ════════════════════════════════════════════════════════════════════════
// Pure logic + catalogs for Study Buddies (friends), Buddy Quests,
// Safe Communication (preset-only messages), and Shared Achievements.
//
// COPPA design constraints baked in here:
//   • No real names — display names / pseudonyms only.
//   • No free-form text — messages are chosen from a server catalog.
//   • No search-by-name — friends connect via shareable invite codes.
//   • Every connection requires explicit parent approval.
//   • Friend limit is enforced (FRIEND_LIMIT).
//   • No photos, geolocation, or external links anywhere.
// ════════════════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────────────────

export type FriendStatus =
  | 'pending_parent' // invite redeemed, awaiting BOTH parents' approval
  | 'pending_friend' // approved by this side, waiting on the other
  | 'active' // mutually approved & active
  | 'blocked' // blocked by a parent
  | 'declined'; // a parent declined

export type ApprovalDecision = 'approve' | 'decline';

export interface FriendConnection {
  id: string;
  /** The child who owns this row's view of the connection. */
  childId: string;
  /** The connected buddy's child id. */
  buddyId: string;
  /** COPPA-safe display name of the buddy (pseudonym, never real name). */
  buddyDisplayName: string;
  /** Sparky-style avatar key for the buddy (no photos). */
  buddyAvatar: string;
  status: FriendStatus;
  /** Has THIS child's parent approved the connection? */
  parentApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InviteCode {
  code: string;
  childId: string;
  createdAt: string;
  expiresAt: string;
  /** Number of times this code has been redeemed (max 1). */
  redeemed: boolean;
}

export type MessageCategory =
  | 'greeting'
  | 'encouragement'
  | 'celebration'
  | 'study'
  | 'gratitude'
  | 'fun';

export interface MessageTemplate {
  id: string;
  category: MessageCategory;
  /** The exact text delivered. Pre-approved, child-safe. */
  text: string;
  emoji: string;
}

export interface SafeMessage {
  id: string;
  fromChildId: string;
  toChildId: string;
  templateId: string;
  text: string;
  emoji: string;
  createdAt: string;
  /** Parent visibility flag — always true; messages are always logged. */
  reported: boolean;
}

export type BuddyQuestStatus = 'active' | 'completed' | 'claimed' | 'expired';

export interface BuddyQuest {
  id: string;
  title: string;
  description: string;
  emoji: string;
  childId: string;
  buddyId: string;
  /** Requirement each participant must individually reach. */
  requirementCount: number;
  /** This child's progress. */
  myProgress: number;
  /** The buddy's progress. */
  buddyProgress: number;
  status: BuddyQuestStatus;
  xpReward: number;
  gemReward: number;
  weekStarting: string;
  createdAt: string;
}

export type BuddyBadgeTier = 'bronze' | 'silver' | 'gold';

export interface BuddyBadge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  tier: BuddyBadgeTier;
  /** Shared metric required (quests done together, messages, playdates). */
  requirement: number;
  metric: 'quests_together' | 'playdates' | 'days_connected';
}

export interface ParentApproval {
  id: string;
  connectionId: string;
  childId: string;
  buddyDisplayName: string;
  buddyAvatar: string;
  decision: ApprovalDecision | null;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────

/** Max simultaneous active friends per child (COPPA data-minimization). */
export const FRIEND_LIMIT = 10;

/** Invite codes live for 7 days. */
export const INVITE_TTL_DAYS = 7;

/** Unambiguous code alphabet (no 0/O/1/I/L) for kid-friendly typing. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

export const FRIEND_STATUS_COLORS: Record<FriendStatus, string> = {
  pending_parent: '#F59E0B',
  pending_friend: '#3B82F6',
  active: '#2ECC71',
  blocked: '#EF4444',
  declined: '#8C94AC',
};

// ─── Message Template Catalog (50+ preset, child-safe) ───────────────────

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // Greetings (8)
  { id: 'g-hi', category: 'greeting', text: 'Hi buddy!', emoji: '👋' },
  { id: 'g-hello', category: 'greeting', text: 'Hello! Ready to learn?', emoji: '😊' },
  { id: 'g-morning', category: 'greeting', text: 'Good morning, friend!', emoji: '🌅' },
  { id: 'g-back', category: 'greeting', text: "I'm back! Want to play?", emoji: '🎮' },
  { id: 'g-miss', category: 'greeting', text: 'Missed playing with you!', emoji: '🤗' },
  { id: 'g-wave', category: 'greeting', text: 'Waving hello!', emoji: '🙋' },
  { id: 'g-howdy', category: 'greeting', text: 'Howdy, study buddy!', emoji: '🤠' },
  { id: 'g-ready', category: 'greeting', text: "Let's get started!", emoji: '🚀' },

  // Encouragement (10)
  { id: 'e-cando', category: 'encouragement', text: 'You can do it!', emoji: '💪' },
  { id: 'e-keep', category: 'encouragement', text: 'Keep going, you got this!', emoji: '✨' },
  { id: 'e-almost', category: 'encouragement', text: "You're almost there!", emoji: '🎯' },
  { id: 'e-smart', category: 'encouragement', text: "You're so smart!", emoji: '🧠' },
  { id: 'e-try', category: 'encouragement', text: 'Try again, I believe in you!', emoji: '🌟' },
  { id: 'e-proud', category: 'encouragement', text: "I'm proud of you!", emoji: '🥰' },
  { id: 'e-brave', category: 'encouragement', text: 'That was brave!', emoji: '🦁' },
  { id: 'e-focus', category: 'encouragement', text: 'Stay focused, friend!', emoji: '🎧' },
  { id: 'e-never', category: 'encouragement', text: 'Never give up!', emoji: '🔥' },
  { id: 'e-best', category: 'encouragement', text: 'Do your best!', emoji: '⭐' },

  // Celebration (10)
  { id: 'c-wow', category: 'celebration', text: 'Wow, amazing job!', emoji: '🎉' },
  { id: 'c-win', category: 'celebration', text: 'You won! Awesome!', emoji: '🏆' },
  { id: 'c-level', category: 'celebration', text: 'You leveled up! Cool!', emoji: '⬆️' },
  { id: 'c-streak', category: 'celebration', text: 'Great streak!', emoji: '🔥' },
  { id: 'c-star', category: 'celebration', text: 'Three stars! Incredible!', emoji: '🌟' },
  { id: 'c-badge', category: 'celebration', text: 'New badge! Congrats!', emoji: '🎖️' },
  { id: 'c-high5', category: 'celebration', text: 'High five!', emoji: '🙌' },
  { id: 'c-party', category: 'celebration', text: 'Party time! You earned it!', emoji: '🥳' },
  { id: 'c-genius', category: 'celebration', text: 'Genius move!', emoji: '💡' },
  { id: 'c-champ', category: 'celebration', text: "You're a champion!", emoji: '👑' },

  // Study (8)
  { id: 's-together', category: 'study', text: "Let's learn together!", emoji: '📚' },
  { id: 's-quest', category: 'study', text: 'Want to do a buddy quest?', emoji: '🗺️' },
  { id: 's-help', category: 'study', text: 'Need help? I can show you!', emoji: '🤝' },
  { id: 's-game', category: 'study', text: 'Race me in a game!', emoji: '🏁' },
  { id: 's-lab', category: 'study', text: 'Check out this cool lab!', emoji: '🔬' },
  { id: 's-practice', category: 'study', text: "Let's practice together!", emoji: '✏️' },
  { id: 's-team', category: 'study', text: 'Team up with me!', emoji: '👥' },
  { id: 's-share', category: 'study', text: 'I learned something cool!', emoji: '🤓' },

  // Gratitude (6)
  { id: 't-thanks', category: 'gratitude', text: 'Thank you, friend!', emoji: '💖' },
  { id: 't-help', category: 'gratitude', text: 'Thanks for the help!', emoji: '🙏' },
  { id: 't-kind', category: 'gratitude', text: "You're so kind!", emoji: '🌸' },
  { id: 't-fun', category: 'gratitude', text: 'That was fun, thanks!', emoji: '😄' },
  { id: 't-bestbud', category: 'gratitude', text: "You're the best buddy!", emoji: '🫶' },
  { id: 't-appreciate', category: 'gratitude', text: 'I appreciate you!', emoji: '💝' },

  // Fun (8)
  { id: 'f-robot', category: 'fun', text: 'Beep boop, I am a robot!', emoji: '🤖' },
  { id: 'f-rocket', category: 'fun', text: 'To the moon!', emoji: '🚀' },
  { id: 'f-magic', category: 'fun', text: 'AI is like magic!', emoji: '🪄' },
  { id: 'f-brain', category: 'fun', text: 'Big brain time!', emoji: '🧠' },
  { id: 'f-puzzle', category: 'fun', text: 'I love puzzles!', emoji: '🧩' },
  { id: 'f-star', category: 'fun', text: 'Reach for the stars!', emoji: '🌠' },
  { id: 'f-cool', category: 'fun', text: 'That is super cool!', emoji: '😎' },
  { id: 'f-dance', category: 'fun', text: 'Victory dance!', emoji: '💃' },
];

const MESSAGE_TEMPLATE_INDEX: Record<string, MessageTemplate> = Object.fromEntries(
  MESSAGE_TEMPLATES.map((m) => [m.id, m]),
);

// ─── Buddy Badge Catalog ─────────────────────────────────────────────────

export const BUDDY_BADGES: BuddyBadge[] = [
  { id: 'study-partners', title: 'Study Partners', description: 'Complete 10 quests together', emoji: '🤝', tier: 'bronze', requirement: 10, metric: 'quests_together' },
  { id: 'dynamic-duo', title: 'Dynamic Duo', description: 'Complete 25 quests together', emoji: '⚡', tier: 'silver', requirement: 25, metric: 'quests_together' },
  { id: 'legendary-team', title: 'Legendary Team', description: 'Complete 50 quests together', emoji: '🏆', tier: 'gold', requirement: 50, metric: 'quests_together' },
  { id: 'playdate-pals', title: 'Playdate Pals', description: 'Visit each other’s pets 5 times', emoji: '🐾', tier: 'bronze', requirement: 5, metric: 'playdates' },
  { id: 'loyal-friends', title: 'Loyal Friends', description: 'Stay connected for 30 days', emoji: '💎', tier: 'gold', requirement: 30, metric: 'days_connected' },
];

// ─── Invite Codes ────────────────────────────────────────────────────────

/**
 * Generate a kid-friendly invite code. Uses an unambiguous alphabet and a
 * formatted middle dash (e.g. ABCD-2345). Deterministic randomness can be
 * injected for tests.
 */
export function generateInviteCode(rand: () => number = Math.random): string {
  let raw = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    raw += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/** Normalize user-typed codes (uppercase, strip spaces; keep single dash). */
export function normalizeInviteCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length !== CODE_LENGTH) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

/** A code is valid in shape if it matches XXXX-XXXX over the safe alphabet. */
export function isValidInviteCodeShape(code: string): boolean {
  return new RegExp(`^[${CODE_ALPHABET}]{4}-[${CODE_ALPHABET}]{4}$`).test(code);
}

export function inviteExpiry(createdAtIso: string): string {
  const d = new Date(createdAtIso);
  d.setUTCDate(d.getUTCDate() + INVITE_TTL_DAYS);
  return d.toISOString();
}

export function isInviteExpired(invite: Pick<InviteCode, 'expiresAt'>, now: Date = new Date()): boolean {
  return now.getTime() > new Date(invite.expiresAt).getTime();
}

// ─── Friend Limit & Status ───────────────────────────────────────────────

/** Active friends count toward the limit; pending/blocked do not. */
export function countActiveFriends(connections: FriendConnection[]): number {
  return connections.filter((c) => c.status === 'active').length;
}

export function canAddFriend(connections: FriendConnection[]): boolean {
  return countActiveFriends(connections) < FRIEND_LIMIT;
}

/** Already connected (any non-terminal state) to this buddy? */
export function alreadyConnected(connections: FriendConnection[], buddyId: string): boolean {
  return connections.some(
    (c) => c.buddyId === buddyId && c.status !== 'declined' && c.status !== 'blocked',
  );
}

/**
 * Resolve the combined status from both parents' approvals.
 * Both sides must have parentApproved=true for an 'active' connection.
 */
export function resolveConnectionStatus(myApproved: boolean, theirApproved: boolean): FriendStatus {
  if (myApproved && theirApproved) return 'active';
  if (myApproved && !theirApproved) return 'pending_friend';
  return 'pending_parent';
}

// ─── Safe Messaging ──────────────────────────────────────────────────────

export function getMessageTemplate(templateId: string): MessageTemplate | null {
  return MESSAGE_TEMPLATE_INDEX[templateId] ?? null;
}

export function getTemplatesByCategory(category: MessageCategory): MessageTemplate[] {
  return MESSAGE_TEMPLATES.filter((m) => m.category === category);
}

/**
 * The ONLY gate for sending a message: the templateId must exist in the
 * server catalog. Free-form text can never reach this function because the
 * API accepts a templateId, not text. This is the COPPA "NLP filter" — a
 * pre-approved allow-list, which is strictly safer than scanning free text.
 */
export function isMessageAllowed(templateId: string): boolean {
  return templateId in MESSAGE_TEMPLATE_INDEX;
}

// ─── Buddy Quests ────────────────────────────────────────────────────────

export const BUDDY_QUEST_TEMPLATES = [
  { key: 'co-games', title: 'Game Buddies', description: 'Each play 5 games this week', emoji: '🎮', requirementCount: 5, xpReward: 150, gemReward: 30 },
  { key: 'co-streak', title: 'Streak Squad', description: 'Each keep a 3-day streak', emoji: '🔥', requirementCount: 3, xpReward: 120, gemReward: 25 },
  { key: 'co-labs', title: 'Lab Explorers', description: 'Each finish 3 lab games', emoji: '🔬', requirementCount: 3, xpReward: 180, gemReward: 35 },
  { key: 'co-quests', title: 'Quest Partners', description: 'Each complete 4 daily quests', emoji: '🗺️', requirementCount: 4, xpReward: 160, gemReward: 30 },
] as const;

/** A buddy quest is complete only when BOTH participants reach the goal. */
export function isBuddyQuestComplete(quest: Pick<BuddyQuest, 'myProgress' | 'buddyProgress' | 'requirementCount'>): boolean {
  return quest.myProgress >= quest.requirementCount && quest.buddyProgress >= quest.requirementCount;
}

/** Combined 0-100 progress across both participants. */
export function buddyQuestProgressPercent(quest: Pick<BuddyQuest, 'myProgress' | 'buddyProgress' | 'requirementCount'>): number {
  const total = quest.requirementCount * 2;
  if (total <= 0) return 0;
  const done = Math.min(quest.myProgress, quest.requirementCount) + Math.min(quest.buddyProgress, quest.requirementCount);
  return Math.round((done / total) * 100);
}

export function clampProgress(value: number, max: number): number {
  return Math.max(0, Math.min(value, max));
}

// ─── Shared Achievements ─────────────────────────────────────────────────

export function evaluateBuddyBadges(stats: {
  questsTogether: number;
  playdates: number;
  daysConnected: number;
}): BuddyBadge[] {
  return BUDDY_BADGES.filter((b) => {
    const value =
      b.metric === 'quests_together' ? stats.questsTogether
        : b.metric === 'playdates' ? stats.playdates
          : stats.daysConnected;
    return value >= b.requirement;
  });
}

/** COPPA-safe greeting for the buddies panel. */
export function getBuddiesGreeting(activeCount: number): string {
  if (activeCount === 0) return 'Invite a friend to start learning together!';
  if (activeCount === 1) return 'You have 1 study buddy. Say hi!';
  return `You have ${activeCount} study buddies. Learn together!`;
}
