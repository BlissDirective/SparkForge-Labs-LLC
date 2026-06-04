// ════════════════════════════════════════════════════
// Phase 8 — Social Engine (COPPA-Safe Social Features)
// ════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  FRIEND_LIMIT,
  MESSAGE_TEMPLATES,
  BUDDY_BADGES,
  BUDDY_QUEST_TEMPLATES,
  generateInviteCode,
  normalizeInviteCode,
  isValidInviteCodeShape,
  inviteExpiry,
  isInviteExpired,
  countActiveFriends,
  canAddFriend,
  alreadyConnected,
  resolveConnectionStatus,
  getMessageTemplate,
  getTemplatesByCategory,
  isMessageAllowed,
  isBuddyQuestComplete,
  buddyQuestProgressPercent,
  clampProgress,
  evaluateBuddyBadges,
  getBuddiesGreeting,
  type FriendConnection,
} from '@/lib/social/SocialEngine';

function conn(overrides: Partial<FriendConnection> = {}): FriendConnection {
  return {
    id: crypto.randomUUID?.() ?? Math.random().toString(36),
    childId: 'child-1',
    buddyId: 'buddy-1',
    buddyDisplayName: 'Star Fox',
    buddyAvatar: 'happy',
    status: 'active',
    parentApproved: true,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    ...overrides,
  };
}

describe('invite codes', () => {
  it('generates a valid XXXX-XXXX shape', () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidInviteCodeShape(generateInviteCode())).toBe(true);
    }
  });

  it('uses no ambiguous characters (0/O/1/I/L)', () => {
    const code = generateInviteCode(() => 0).replace('-', '');
    expect(/[01OIL]/.test(code)).toBe(false);
  });

  it('normalizes lowercase and spaces into canonical form', () => {
    expect(normalizeInviteCode('abcd2345')).toBe('ABCD-2345');
    expect(normalizeInviteCode('ab cd-23 45')).toBe('ABCD-2345');
  });

  it('computes a 7-day expiry and detects expiry', () => {
    const created = '2026-06-01T00:00:00.000Z';
    const exp = inviteExpiry(created);
    expect(new Date(exp).getTime()).toBe(new Date('2026-06-08T00:00:00.000Z').getTime());
    expect(isInviteExpired({ expiresAt: exp }, new Date('2026-06-07T00:00:00Z'))).toBe(false);
    expect(isInviteExpired({ expiresAt: exp }, new Date('2026-06-09T00:00:00Z'))).toBe(true);
  });
});

describe('friend limits & status', () => {
  it('counts only active friends toward the limit', () => {
    const list = [
      conn({ status: 'active' }),
      conn({ status: 'active' }),
      conn({ status: 'pending_parent' }),
      conn({ status: 'declined' }),
    ];
    expect(countActiveFriends(list)).toBe(2);
  });

  it('blocks adding past the friend limit', () => {
    const full = Array.from({ length: FRIEND_LIMIT }, () => conn({ status: 'active' }));
    expect(canAddFriend(full)).toBe(false);
    expect(canAddFriend(full.slice(1))).toBe(true);
  });

  it('detects an existing (non-terminal) connection', () => {
    const list = [conn({ buddyId: 'b2', status: 'pending_parent' })];
    expect(alreadyConnected(list, 'b2')).toBe(true);
    expect(alreadyConnected(list, 'b3')).toBe(false);
    // declined/blocked do not count as connected
    expect(alreadyConnected([conn({ buddyId: 'b4', status: 'declined' })], 'b4')).toBe(false);
  });

  it('resolves active only when BOTH sides approve', () => {
    expect(resolveConnectionStatus(true, true)).toBe('active');
    expect(resolveConnectionStatus(true, false)).toBe('pending_friend');
    expect(resolveConnectionStatus(false, true)).toBe('pending_parent');
    expect(resolveConnectionStatus(false, false)).toBe('pending_parent');
  });
});

describe('safe messaging (preset-only)', () => {
  it('ships a catalog of 50+ pre-approved templates', () => {
    expect(MESSAGE_TEMPLATES.length).toBeGreaterThanOrEqual(50);
  });

  it('only allows template ids that exist in the catalog', () => {
    expect(isMessageAllowed(MESSAGE_TEMPLATES[0].id)).toBe(true);
    expect(isMessageAllowed('totally-made-up')).toBe(false);
    // free-form text can never be a valid template id
    expect(isMessageAllowed('give me your address')).toBe(false);
  });

  it('looks up templates and filters by category', () => {
    const t = MESSAGE_TEMPLATES[0];
    expect(getMessageTemplate(t.id)?.text).toBe(t.text);
    expect(getMessageTemplate('nope')).toBeNull();
    expect(getTemplatesByCategory('greeting').every((m) => m.category === 'greeting')).toBe(true);
  });

  it('has unique template ids', () => {
    const ids = MESSAGE_TEMPLATES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('buddy quests', () => {
  it('is complete only when BOTH reach the goal', () => {
    expect(isBuddyQuestComplete({ myProgress: 5, buddyProgress: 5, requirementCount: 5 })).toBe(true);
    expect(isBuddyQuestComplete({ myProgress: 5, buddyProgress: 3, requirementCount: 5 })).toBe(false);
  });

  it('computes combined progress percent capped at each side', () => {
    expect(buddyQuestProgressPercent({ myProgress: 0, buddyProgress: 0, requirementCount: 5 })).toBe(0);
    expect(buddyQuestProgressPercent({ myProgress: 5, buddyProgress: 0, requirementCount: 5 })).toBe(50);
    expect(buddyQuestProgressPercent({ myProgress: 10, buddyProgress: 10, requirementCount: 5 })).toBe(100);
  });

  it('clamps progress to range', () => {
    expect(clampProgress(-3, 5)).toBe(0);
    expect(clampProgress(9, 5)).toBe(5);
    expect(clampProgress(3, 5)).toBe(3);
  });

  it('exposes buddy quest templates', () => {
    expect(BUDDY_QUEST_TEMPLATES.length).toBeGreaterThan(0);
    expect(BUDDY_QUEST_TEMPLATES.every((t) => t.requirementCount > 0)).toBe(true);
  });
});

describe('shared achievements', () => {
  it('awards badges once thresholds are met', () => {
    const earned = evaluateBuddyBadges({ questsTogether: 10, playdates: 0, daysConnected: 0 });
    expect(earned.some((b) => b.id === 'study-partners')).toBe(true);
    expect(earned.some((b) => b.id === 'legendary-team')).toBe(false);
  });

  it('every badge has a positive requirement', () => {
    expect(BUDDY_BADGES.every((b) => b.requirement > 0)).toBe(true);
  });
});

describe('greetings', () => {
  it('adapts copy to active buddy count', () => {
    expect(getBuddiesGreeting(0)).toMatch(/invite/i);
    expect(getBuddiesGreeting(1)).toMatch(/1 study buddy/i);
    expect(getBuddiesGreeting(3)).toMatch(/3 study buddies/i);
  });
});
