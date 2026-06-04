'use client';

import { ShieldQuestion } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { useFriends } from '@/hooks/useFriends';
import { ParentApprovalCard } from './ParentApprovalCard';

interface ChildLite {
  id: string;
  display_name: string;
}

/**
 * One child's pending friend-request approvals. Renders nothing when the
 * child has no pending requests. Kept as its own component so each mounted
 * instance owns a single useFriends() hook (one per child).
 */
function ChildApprovalGroup({ child }: { child: ChildLite }) {
  const { pendingApprovals, decideApproval } = useFriends(child.id);
  if (pendingApprovals.length === 0) return null;

  return (
    <div className="space-y-2">
      {pendingApprovals.map((approval, i) => (
        <ParentApprovalCard
          key={approval.id}
          approval={approval}
          childName={child.display_name}
          onDecide={decideApproval}
          index={i}
        />
      ))}
    </div>
  );
}

/**
 * Parent-facing Study Buddies approval centre. Surfaces every pending
 * friend connection across all of the parent's children — a COPPA
 * requirement (parent must approve each connection).
 */
export function ParentApprovalsSection({ children }: { children: ChildLite[] }) {
  if (!children || children.length === 0) return null;

  return (
    <SFCard variant="elevated" className="p-5" id="study-buddies">
      <div className="flex items-center gap-2 mb-1">
        <ShieldQuestion className="w-5 h-5" style={{ color: '#F59E0B' }} />
        <h2 className="text-lg font-bold" style={{ color: '#1A1D2B' }}>
          Study Buddy Requests
        </h2>
      </div>
      <p className="text-xs mb-4" style={{ color: '#8C94AC' }}>
        New friend connections need your approval before your child can play or
        message with a buddy. No real names or photos are ever shared.
      </p>

      <div className="space-y-2">
        {children.map((c) => (
          <ChildApprovalGroup key={c.id} child={c} />
        ))}
      </div>
    </SFCard>
  );
}

export default ParentApprovalsSection;
