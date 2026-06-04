'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldQuestion, Check, X } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SparkyCore } from '@/components/sparky/SparkyCore';
import type { ParentApproval } from '@/lib/social/SocialEngine';

interface ParentApprovalCardProps {
  approval: ParentApproval;
  childName: string;
  onDecide: (connectionId: string, decision: 'approve' | 'decline') => Promise<boolean>;
  index?: number;
}

/**
 * Surfaced in the Parent dashboard. A friend connection is only activated
 * once the parent approves it here (COPPA requirement).
 */
export function ParentApprovalCard({ approval, childName, onDecide, index = 0 }: ParentApprovalCardProps) {
  const [busy, setBusy] = useState<'approve' | 'decline' | null>(null);

  const decide = async (decision: 'approve' | 'decline') => {
    setBusy(decision);
    await onDecide(approval.connectionId, decision);
    setBusy(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <SFCard variant="outlined" className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldQuestion className="w-4 h-4" style={{ color: '#F59E0B' }} />
          <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>
            Friend request to approve
          </span>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 shrink-0">
            <SparkyCore expression="happy" size="sm" />
          </div>
          <p className="text-sm" style={{ color: '#1A1D2B' }}>
            <strong>{approval.buddyDisplayName}</strong> wants to be {childName}&apos;s study buddy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SFButton
            variant="primary"
            size="sm"
            loading={busy === 'approve'}
            onClick={() => decide('approve')}
            leftIcon={<Check className="w-4 h-4" />}
            className="flex-1"
          >
            Approve
          </SFButton>
          <SFButton
            variant="outline"
            size="sm"
            loading={busy === 'decline'}
            onClick={() => decide('decline')}
            leftIcon={<X className="w-4 h-4" />}
            className="flex-1"
          >
            Decline
          </SFButton>
        </div>
      </SFCard>
    </motion.div>
  );
}

export default ParentApprovalCard;
