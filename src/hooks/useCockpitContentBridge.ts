'use client';

// ════════════════════════════════════════════════════
// COCKPIT CONTENT BRIDGE — Phase 6: Connects Content Agent to 3D cockpit
// Provides content data to NPCs, consoles, ceremonies, minimap
// Runs as a hook in CockpitCanvas or dashboard layout
// ════════════════════════════════════════════════════

import { useEffect, useMemo } from 'react';
import { useActiveChild } from '@/hooks/useChildren';
import { useCockpitBroadcast } from '@/stores/cockpitBroadcastStore';
import { useTrendingContent, useDailyChallenge, useLatestContent } from '@/hooks/useContent';
import type { Content } from '@/types';

// ── Types ──
export interface CockpitContentData {
  /** Daily challenge content for console display */
  dailyChallenge: Content | null;
  /** Latest AI-generated content */
  latestContent: Content | null;
  /** Trending topics for NPC speech bubbles */
  trendingTopics: Content[];
  /** Recommended next activity based on child progress */
  recommendation: { labId: number; reason: string } | null;
  /** NPC tip of the moment */
  npcTip: string | null;
}

// ── NPC Tips Pool — rotated based on time ──
const NPC_TIPS: Record<string, string[]> = {
  scout: [
    'I just discovered something new in Lab {lab}!',
    'Have you tried the trending challenge today?',
    'There\'s fresh content waiting in the queue!',
  ],
  engineer: [
    'The neural networks are processing new data...',
    'I optimized a new learning path for you!',
    'Your accuracy is improving — keep going!',
  ],
  medic: [
    'Remember to take breaks between games!',
    'Your streak is looking strong today!',
    'Great job completing that last challenge!',
  ],
  guardian: [
    'All systems secure. Ready for learning!',
    'I\'m watching over your progress — looking good!',
    'Safety screening complete on new content.',
  ],
  scholar: [
    'Did you know? AI can now {trending_fact}.',
    'Fun fact: {latest_title}!',
    'New lesson available about {topic}.',
  ],
};

/**
 * Selects a tip based on time rotation and available content
 */
function selectNpcTip(
  personality: string,
  trending: Content[],
  latest: Content | null
): string {
  const tips = NPC_TIPS[personality] || NPC_TIPS.scout;
  const hourIndex = new Date().getHours() % tips.length;
  let tip = tips[hourIndex];

  // Template substitution
  if (trending.length > 0) {
    tip = tip.replace('{trending_fact}', trending[0].title.toLowerCase());
    tip = tip.replace('{lab}', String(trending[0].world));
  }
  if (latest) {
    tip = tip.replace('{latest_title}', latest.title);
    tip = tip.replace('{topic}', latest.title.split(':')[0] || latest.title);
  }
  // Clean up unreplaced templates
  tip = tip.replace(/\{[^}]+\}/g, 'something cool');

  return tip;
}

/**
 * Recommends next activity based on child's progress gaps
 */
function computeRecommendation(
  childXp: number,
  childLevel: number,
  labCompletions: Record<number, number>
): { labId: number; reason: string } | null {
  // Find least-completed lab
  let minLab = 1;
  let minCompletion = 1;
  for (let i = 1; i <= 10; i++) {
    const completion = labCompletions[i] ?? 0;
    if (completion < minCompletion) {
      minCompletion = completion;
      minLab = i;
    }
  }

  if (minCompletion >= 1) return null; // All labs complete

  const reasons = [
    `Lab ${minLab} has new content waiting for you!`,
    `You're closest to completing Lab ${minLab} — keep going!`,
    `There's a trending challenge in Lab ${minLab}!`,
  ];

  return {
    labId: minLab,
    reason: reasons[childLevel % reasons.length],
  };
}

/**
 * Hook that bridges Content Agent data into cockpit elements.
 * Call in CockpitCanvas or dashboard layout.
 */
export function useCockpitContentBridge(): CockpitContentData {
  // STATE-MED-001 (B-full/T5c-C1): read from React Query cache via
  // useActiveChild() so xp / level / age_band are always fresh (within
  // the 30s staleTime defaults). Previously read the stale
  // childStore.activeChild snapshot.
  const activeChild = useActiveChild();
  const ageBand = activeChild?.age_band || 'B';
  const broadcast = useCockpitBroadcast(s => s.broadcast);

  const { data: trendingData } = useTrendingContent(ageBand);
  const dailyChallenge = useDailyChallenge(ageBand);
  const latestResult = useLatestContent(ageBand);

  const trendingTopics = useMemo(() => {
    const items = (trendingData as { items?: Content[] })?.items;
    return items || [];
  }, [trendingData]);

  const latest = (latestResult.data as Content) || null;
  const daily = (dailyChallenge.data as Content) || null;

  // Compute recommendation
  const recommendation = useMemo(() => {
    if (!activeChild) return null;
    // Use empty completions as placeholder — real data comes from progress hooks
    return computeRecommendation(activeChild.xp, activeChild.level, {});
  }, [activeChild]);

  // NPC tip rotation
  const npcTip = useMemo(() => {
    const personalities = ['scout', 'engineer', 'medic', 'guardian', 'scholar'];
    const currentPersonality = personalities[new Date().getMinutes() % personalities.length];
    return selectNpcTip(currentPersonality, trendingTopics, latest);
  }, [trendingTopics, latest]);

  // Broadcast content events when new content arrives
  useEffect(() => {
    if (trendingTopics.length > 0) {
      broadcast({
        type: 'xp-change', // Reuse existing event type for visual pulse
        source: 'content-bridge',
        label: `New trending: ${trendingTopics[0].title}`,
        color: '#06B6D4', // cyan
      });
    }
  }, [trendingTopics.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    dailyChallenge: daily,
    latestContent: latest,
    trendingTopics,
    recommendation,
    npcTip,
  };
}

export default useCockpitContentBridge;
