'use client';

import { motion } from 'motion/react';
import { MessageCircle, Clock, ShieldCheck } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFBadge } from '@/components/ui/SFBadge';
import { SparkyCore } from '@/components/sparky/SparkyCore';
import { FRIEND_STATUS_COLORS, type FriendConnection } from '@/lib/social/SocialEngine';

interface FriendCardProps {
  connection: FriendConnection;
  onMessage?: (connection: FriendConnection) => void;
  index?: number;
}

const STATUS_LABEL: Record<FriendConnection['status'], string> = {
  active: 'Active',
  pending_parent: 'Awaiting grown-up',
  pending_friend: 'Waiting on buddy',
  blocked: 'Blocked',
  declined: 'Declined',
};

export function FriendCard({ connection, onMessage, index = 0 }: FriendCardProps) {
  const color = FRIEND_STATUS_COLORS[connection.status];
  const isActive = connection.status === 'active';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <SFCard variant="default" className="p-4 flex items-center gap-3">
        <div className="w-12 h-12 shrink-0">
          <SparkyCore expression={isActive ? 'happy' : 'sleepy'} size="sm" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: '#1A1D2B' }}>
            {connection.buddyDisplayName}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isActive ? (
              <ShieldCheck className="w-3 h-3" style={{ color }} />
            ) : (
              <Clock className="w-3 h-3" style={{ color }} />
            )}
            <SFBadge variant="custom" size="sm" style={{ backgroundColor: `${color}18`, color }}>
              {STATUS_LABEL[connection.status]}
            </SFBadge>
          </div>
        </div>

        {isActive && onMessage && (
          <SFButton
            variant="outline"
            size="sm"
            onClick={() => onMessage(connection)}
            aria-label={`Send a message to ${connection.buddyDisplayName}`}
            leftIcon={<MessageCircle className="w-4 h-4" />}
          >
            Say Hi
          </SFButton>
        )}
      </SFCard>
    </motion.div>
  );
}

export default FriendCard;
