'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Check, Award, Zap, GraduationCap } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import { SFSkeleton } from '@/components/ui/SFSkeleton';
import { LAB_COLORS, LAB_ICONS, LAB_NAMES } from '@/config/labs';
import { useMastery } from '@/hooks/useMastery';
import { getMasteryGreeting, type TopicMastery } from '@/lib/mastery/MasteryEngine';

interface MasteryTreeProps {
  childId: string;
}

const STATUS_LABEL: Record<TopicMastery['status'], string> = {
  locked: 'Locked',
  available: 'Ready to start',
  in_progress: 'In progress',
  mastered: 'Mastered',
};

export function MasteryTree({ childId }: MasteryTreeProps) {
  const { topics, masteredCount, total, isLoading, claimMastery } = useMastery(childId);
  const [busy, setBusy] = useState<number | null>(null);

  const doClaim = async (labId: number) => { setBusy(labId); await claimMastery(labId); setBusy(null); };

  if (isLoading) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Array.from({ length: 6 }).map((_, i) => <SFSkeleton key={i} variant="card" className="h-28 rounded-2xl" />)}</div>;
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <SFCard variant="elevated" className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: 'linear-gradient(135deg, #FFD93D, #FF6B35)' }}>
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold" style={{ color: '#1A1D2B' }}>Mastery Paths</h2>
          <p className="text-sm" style={{ color: '#8C94AC' }}>{getMasteryGreeting(masteredCount, total)}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold" style={{ color: '#FF6B35' }}>{masteredCount}<span className="text-sm" style={{ color: '#8C94AC' }}>/{total}</span></p>
          <p className="text-[10px]" style={{ color: '#8C94AC' }}>mastered</p>
        </div>
      </SFCard>

      {/* Topic grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topics.map((t, i) => {
          const color = LAB_COLORS[t.labId] || '#4F6EF7';
          const locked = t.status === 'locked';
          const mastered = t.status === 'mastered';
          return (
            <motion.div key={t.labId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <SFCard variant={mastered ? 'gradient' : 'default'} className="p-4" style={{ opacity: locked ? 0.65 : 1 }}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: locked ? '#EEF0F8' : `${color}1A` }}>
                    {locked ? <Lock className="w-5 h-5" style={{ color: '#8C94AC' }} /> : (LAB_ICONS[t.labId] ?? '🔬')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold truncate" style={{ color: '#1A1D2B' }}>{LAB_NAMES[t.labId] ?? t.name}</p>
                      {mastered && <Award className="w-4 h-4 shrink-0" style={{ color: '#FFD93D' }} />}
                    </div>
                    <p className="text-[11px] mb-2" style={{ color: locked ? '#8C94AC' : color }}>
                      {locked && t.blockedBy.length > 0
                        ? `Master Lab ${t.blockedBy.join(', ')} first`
                        : STATUS_LABEL[t.status]}
                    </p>
                    {!locked && <SFProgressBar value={t.percent} max={100} variant="custom" color={color} size="sm" />}

                    {/* Badges + actions */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {t.expertUnlocked && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(233,69,245,0.12)', color: '#E945F5' }}>
                          <Zap className="w-3 h-3" /> Expert Mode
                        </span>
                      )}
                      {t.certificate.issued && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: t.certificate.parentApproved ? 'rgba(46,204,113,0.12)' : 'rgba(255,217,61,0.18)', color: t.certificate.parentApproved ? '#2ECC71' : '#B8860B' }}>
                          <Award className="w-3 h-3" /> {t.certificate.parentApproved ? 'Certificate' : 'Cert (pending)'}
                        </span>
                      )}
                      {mastered && !t.certificate.issued && (
                        <SFButton variant="primary" size="sm" loading={busy === t.labId} onClick={() => doClaim(t.labId)} className="!px-2.5 !py-1 text-[11px]">
                          <Check className="w-3 h-3 mr-1" /> Claim Mastery
                        </SFButton>
                      )}
                    </div>
                  </div>
                </div>
              </SFCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default MasteryTree;
