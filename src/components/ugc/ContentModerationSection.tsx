'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldQuestion, Check, X, BookOpen } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { useUgc } from '@/hooks/useUgc';

interface ChildLite { id: string; display_name: string }

function ChildModerationGroup({ child }: { child: ChildLite }) {
  const { myCreations, moderate } = useUgc(child.id);
  const [busy, setBusy] = useState<string | null>(null);
  const pending = myCreations.filter((q) => q.status === 'pending');
  if (pending.length === 0) return null;

  const decide = async (contentId: string, approve: boolean) => {
    setBusy(contentId);
    await moderate(contentId, approve);
    setBusy(null);
  };

  return (
    <>
      {pending.map((q, i) => (
        <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <SFCard variant="outlined" className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4" style={{ color: '#4F6EF7' }} />
              <p className="text-sm font-bold" style={{ color: '#1A1D2B' }}>{q.title}</p>
            </div>
            <p className="text-xs mb-3" style={{ color: '#8C94AC' }}>
              {child.display_name} created a quiz with {q.questionIds.length} questions (from the approved question bank). Approve to publish it to the community.
            </p>
            <div className="flex gap-2">
              <SFButton variant="primary" size="sm" className="flex-1" loading={busy === q.id} onClick={() => decide(q.id, true)} leftIcon={<Check className="w-4 h-4" />}>Approve</SFButton>
              <SFButton variant="outline" size="sm" className="flex-1" loading={busy === q.id} onClick={() => decide(q.id, false)} leftIcon={<X className="w-4 h-4" />}>Reject</SFButton>
            </div>
          </SFCard>
        </motion.div>
      ))}
    </>
  );
}

/** Parent-dashboard moderation queue for child-created quizzes. */
export function ContentModerationSection({ children }: { children: ChildLite[] }) {
  if (!children || children.length === 0) return null;
  return (
    <SFCard variant="elevated" className="p-5">
      <div className="flex items-center gap-2 mb-1">
        <ShieldQuestion className="w-5 h-5" style={{ color: '#F59E0B' }} />
        <h2 className="text-lg font-bold" style={{ color: '#1A1D2B' }}>Quizzes to Review</h2>
      </div>
      <p className="text-xs mb-4" style={{ color: '#8C94AC' }}>
        Quizzes your child builds (from a pre-approved question bank) need your OK before they’re shared with the community.
      </p>
      <div className="space-y-2">
        {children.map((c) => <ChildModerationGroup key={c.id} child={c} />)}
      </div>
    </SFCard>
  );
}

export default ContentModerationSection;
