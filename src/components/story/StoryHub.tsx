'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Check, Lock, BookOpen } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import { SFSkeleton } from '@/components/ui/SFSkeleton';
import { SparkyCore } from '@/components/sparky/SparkyCore';
import { useStory, type CampaignView } from '@/hooks/useStory';
import { getEnding, getStoryGreeting, type ChoicePath } from '@/lib/story/StoryEngine';

export function StoryHub({ childId }: { childId: string }) {
  const { campaigns, isLoading, advance, reset } = useStory(childId);

  if (isLoading) {
    return <div className="space-y-4"><SFSkeleton variant="card" className="h-56 rounded-2xl" /></div>;
  }

  return (
    <div className="space-y-5">
      {campaigns.map((c) => (
        <CampaignCard key={c.campaign.id} view={c} onAdvance={advance} onReset={reset} />
      ))}
    </div>
  );
}

function CampaignCard({
  view, onAdvance, onReset,
}: {
  view: CampaignView;
  onAdvance: (campaignId: string, chapterIndex: number, choice: ChoicePath) => Promise<boolean>;
  onReset: (campaignId: string) => Promise<boolean>;
}) {
  const { campaign, progress, percent } = view;
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);

  const chapter = campaign.chapters.find((ch) => ch.index === progress.currentChapter) ?? null;
  const ending = getEnding(campaign, progress.endingId);

  const choose = async (choice: ChoicePath) => {
    if (!chapter) return;
    setBusy(true);
    await onAdvance(campaign.id, chapter.index, choice);
    setBusy(false);
    setReading(false);
  };

  const replay = async () => {
    setBusy(true);
    await onReset(campaign.id);
    setBusy(false);
  };

  return (
    <SFCard variant="elevated" className="p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${campaign.color}14, #FFFFFF)` }}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{campaign.emoji}</span>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>{campaign.title}</h2>
          <p className="text-xs" style={{ color: '#8C94AC' }}>{campaign.tagline}</p>
        </div>
      </div>

      <SFProgressBar value={percent} max={100} variant="custom" color={campaign.color} showLabel />
      <p className="text-xs mt-2 mb-4" style={{ color: '#5A6078' }}>{getStoryGreeting(progress)}</p>

      {/* Chapter list */}
      <div className="grid grid-cols-5 gap-1.5 mb-4">
        {campaign.chapters.map((ch) => {
          const done = ch.index < progress.currentChapter;
          const current = ch.index === progress.currentChapter && !progress.completed;
          return (
            <div key={ch.index} className="text-center p-2 rounded-lg" style={{ background: done ? `${campaign.color}1A` : current ? '#FFF' : '#F0F1F8', border: current ? `1px solid ${campaign.color}` : '1px solid transparent' }}>
              <div className="text-base">{done ? '✓' : current ? ch.emoji : <Lock className="w-3.5 h-3.5 mx-auto" style={{ color: '#C2C8DA' }} />}</div>
              <div className="text-[9px] font-bold mt-0.5" style={{ color: done || current ? '#1A1D2B' : '#A8AEC2' }}>Ch {ch.index}</div>
            </div>
          );
        })}
      </div>

      {/* Ending reveal */}
      {progress.completed && ending ? (
        <div className="text-center p-4 rounded-2xl" style={{ background: `${campaign.color}10` }}>
          <div className="text-4xl mb-1">{ending.emoji}</div>
          <p className="text-sm font-extrabold mb-1" style={{ color: '#1A1D2B' }}>Ending: {ending.title}</p>
          <p className="text-xs mb-3" style={{ color: '#5A6078' }}>{ending.description}</p>
          <SFButton variant="outline" size="sm" loading={busy} onClick={replay} leftIcon={<RotateCcw className="w-4 h-4" />}>
            Replay for a different ending
          </SFButton>
        </div>
      ) : (
        <SFButton variant="primary" fullWidth onClick={() => setReading(true)} leftIcon={<Play className="w-4 h-4" />}>
          {progress.currentChapter === 1 ? 'Start Story' : `Continue — Chapter ${progress.currentChapter}`}
        </SFButton>
      )}

      {/* Chapter reader modal */}
      <AnimatePresence>
        {reading && chapter && (
          <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setReading(false)} role="dialog" aria-modal="true" aria-label={chapter.title}>
            <motion.div className="w-full max-w-md rounded-3xl p-6" style={{ background: '#FFFFFF', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
              initial={{ scale: 0.95, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ y: 30, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4" style={{ color: campaign.color }} />
                <p className="text-xs font-bold" style={{ color: campaign.color }}>Chapter {chapter.index} · {chapter.title}</p>
              </div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 shrink-0"><SparkyCore expression="speaking" size="sm" /></div>
                <div className="space-y-1.5">
                  {chapter.lines.map((line, i) => (
                    <p key={i} className="text-sm" style={{ color: '#1A1D2B' }}>{line}</p>
                  ))}
                </div>
              </div>
              <p className="text-sm font-bold mb-2" style={{ color: '#1A1D2B' }}>{chapter.choice.prompt}</p>
              <div className="space-y-2">
                {chapter.choice.options.map((opt) => (
                  <SFButton key={opt.id} variant="outline" fullWidth loading={busy} onClick={() => choose(opt.id)} className="justify-start">
                    {opt.label}
                  </SFButton>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SFCard>
  );
}

export default StoryHub;
