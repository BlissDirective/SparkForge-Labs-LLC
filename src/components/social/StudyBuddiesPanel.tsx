'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Sparkles } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFSkeleton } from '@/components/ui/SFSkeleton';
import { SparkyPresenter } from '@/components/sparky/SparkyPresenter';
import { useFriends } from '@/hooks/useFriends';
import { useBuddyQuests } from '@/hooks/useBuddyQuests';
import { useSafeMessages } from '@/hooks/useSafeMessages';
import { getBuddiesGreeting, type FriendConnection } from '@/lib/social/SocialEngine';
import { InviteCodeCard } from './InviteCodeCard';
import { FriendCard } from './FriendCard';
import { BuddyQuestCard } from './BuddyQuestCard';
import { BuddyBadges } from './BuddyBadges';
import { SafeMessageComposer } from './SafeMessageComposer';

interface StudyBuddiesPanelProps {
  childId: string;
  childName: string;
}

export function StudyBuddiesPanel({ childId, childName }: StudyBuddiesPanelProps) {
  const {
    connections, activeFriends, activeCount, canAddMore, isLoading,
    generateInvite, redeemCode, refresh,
  } = useFriends(childId);
  const { quests: buddyQuests } = useBuddyQuests(childId);
  const [messageTarget, setMessageTarget] = useState<FriendConnection | null>(null);
  const { sendMessage } = useSafeMessages(childId, messageTarget?.buddyId ?? null);

  const handleSend = async (templateId: string) => {
    if (!messageTarget) return false;
    const ok = await sendMessage(messageTarget.buddyId, templateId);
    return ok;
  };

  const pending = connections.filter(
    (c) => c.status === 'pending_parent' || c.status === 'pending_friend',
  );

  return (
    <div className="space-y-5">
      {/* Sparky greeting */}
      <SparkyPresenter
        expression={activeCount > 0 ? 'happy' : 'thinking'}
        size="lg"
        message={getBuddiesGreeting(activeCount)}
        childName={childName}
        missionType="daily"
        actionLabel="Invite a Buddy"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left column: invite + friends */}
        <div className="space-y-5">
          <InviteCodeCard onGenerate={generateInvite} onRedeem={redeemCode} canAddMore={canAddMore} />

          <SFCard variant="elevated" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" style={{ color: '#4F6EF7' }} />
              <h3 className="text-base font-bold" style={{ color: '#1A1D2B' }}>
                My Buddies
              </h3>
              <span className="ml-auto text-xs font-medium" style={{ color: '#8C94AC' }}>
                {activeCount} active
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <SFSkeleton variant="card" className="h-16 rounded-xl" />
                <SFSkeleton variant="card" className="h-16 rounded-xl" />
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: '#DAE0F0' }} />
                <p className="text-sm" style={{ color: '#8C94AC' }}>
                  No buddies yet. Share your code to add one!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeFriends.map((c, i) => (
                  <FriendCard key={c.id} connection={c} onMessage={setMessageTarget} index={i} />
                ))}
                {pending.map((c, i) => (
                  <FriendCard key={c.id} connection={c} index={activeFriends.length + i} />
                ))}
              </div>
            )}
          </SFCard>
        </div>

        {/* Right column: buddy quests + badges */}
        <div className="space-y-5">
          <SFCard variant="elevated" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🤝</span>
              <h3 className="text-base font-bold" style={{ color: '#1A1D2B' }}>
                Buddy Quests
              </h3>
            </div>
            {buddyQuests.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: '#8C94AC' }}>
                Team up with a buddy to unlock collaborative quests!
              </p>
            ) : (
              <div className="space-y-2">
                {buddyQuests.map((q, i) => (
                  <BuddyQuestCard
                    key={q.id}
                    quest={q}
                    buddyName={
                      connections.find((c) => c.buddyId === q.buddyId)?.buddyDisplayName ?? 'Buddy'
                    }
                    index={i}
                  />
                ))}
              </div>
            )}
          </SFCard>

          <BuddyBadges />
        </div>
      </div>

      {/* Preset message composer modal */}
      <AnimatePresence>
        {messageTarget && (
          <SafeMessageComposer
            buddyName={messageTarget.buddyDisplayName}
            onSend={handleSend}
            onClose={() => {
              setMessageTarget(null);
              refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default StudyBuddiesPanel;
