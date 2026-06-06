'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Gift, Lock, Check, ShoppingBag, CalendarDays } from 'lucide-react';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import { SFProgressBar } from '@/components/ui/SFProgressBar';
import { SFSkeleton } from '@/components/ui/SFSkeleton';
import { useSeason } from '@/hooks/useSeason';
import {
  isQuestComplete, isQuestClaimed, canClaimQuest, canAfford,
  isItemAvailable, canClaimGrandPrize, getSeasonGreeting,
} from '@/lib/seasons/SeasonEngine';

interface SeasonHubProps {
  childId: string;
}

export function SeasonHub({ childId }: SeasonHubProps) {
  const {
    active, season, week, quests, items, progress, percent, isLoading,
    claimQuest, claimGrandPrize, purchase,
  } = useSeason(childId);
  const [busy, setBusy] = useState<string | null>(null);
  const [shopMsg, setShopMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  if (isLoading) {
    return <div className="space-y-4"><SFSkeleton variant="card" className="h-40 rounded-2xl" /><SFSkeleton variant="card" className="h-60 rounded-2xl" /></div>;
  }

  if (!active || !season || !progress) {
    return (
      <SFCard variant="elevated" className="p-8 text-center">
        <CalendarDays className="w-12 h-12 mx-auto mb-3" style={{ color: '#DAE0F0' }} aria-hidden />
        <h3 className="text-lg font-bold mb-1" style={{ color: '#1A1D2B' }}>No event running</h3>
        <p className="text-sm" style={{ color: '#8C94AC' }}>{getSeasonGreeting(null, 0)}</p>
      </SFCard>
    );
  }

  const grandPrizeReady = canClaimGrandPrize(season.key, progress);

  const doClaim = async (questId: string) => { setBusy(questId); await claimQuest(questId); setBusy(null); };
  const doGrand = async () => { setBusy('grand'); await claimGrandPrize(); setBusy(null); };
  const doBuy = async (itemId: string) => {
    setBusy(itemId);
    const r = await purchase(itemId);
    setShopMsg({ id: itemId, text: r.message, ok: r.ok });
    setBusy(null);
  };

  return (
    <div className="space-y-5">
      {/* ── Season banner ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <SFCard variant="elevated" className="p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${season.color}18, #FFFFFF)` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{season.emoji}</span>
                <div>
                  <h2 className="text-xl font-extrabold" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>{season.name}</h2>
                  <p className="text-xs" style={{ color: season.color }}>{season.theme} · Week {week}</p>
                </div>
              </div>
              <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{getSeasonGreeting(season, percent)}</p>
              <SFProgressBar value={percent} max={100} variant="custom" color={season.color} showLabel />
              <p className="text-xs mt-2 font-semibold inline-flex items-center gap-1" style={{ color: '#1A1D2B' }}>
                <span>{season.currencyEmoji}</span> {progress.currency} {season.currencyName}
              </p>
            </div>
          </div>

          {/* Grand prize */}
          <div className="mt-4 pt-4 border-t flex items-center gap-3" style={{ borderColor: `${season.color}30` }}>
            <Gift className="w-5 h-5" style={{ color: season.color }} />
            <div className="flex-1">
              <p className="text-xs font-bold" style={{ color: '#1A1D2B' }}>Grand Prize: {season.grandPrize.emoji} {season.grandPrize.name}</p>
              <p className="text-[11px]" style={{ color: '#8C94AC' }}>Complete all quests to unlock</p>
            </div>
            {progress.grandPrizeClaimed ? (
              <span className="text-xs font-bold inline-flex items-center gap-1" style={{ color: '#2ECC71' }}><Check className="w-4 h-4" /> Claimed</span>
            ) : (
              <SFButton variant="accent" size="sm" disabled={!grandPrizeReady} loading={busy === 'grand'} onClick={doGrand}>
                {grandPrizeReady ? 'Claim!' : 'Locked'}
              </SFButton>
            )}
          </div>
        </SFCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Quest line ── */}
        <SFCard variant="elevated" className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" style={{ color: season.color }} />
            <h3 className="text-base font-bold" style={{ color: '#1A1D2B' }}>Seasonal Quests</h3>
          </div>
          <div className="space-y-2">
            {quests.map((q, i) => {
              const done = isQuestComplete(q, progress);
              const claimed = isQuestClaimed(q, progress);
              const cur = progress.questProgress[q.id] ?? 0;
              return (
                <motion.div key={q.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl" style={{ background: claimed ? 'rgba(46,204,113,0.08)' : '#F7F8FC' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: `${season.color}1A` }}>{q.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#1A1D2B' }}>{q.title}</p>
                    <p className="text-[11px] mb-1" style={{ color: '#8C94AC' }}>{q.description} · {season.currencyEmoji}{q.currencyReward}</p>
                    <SFProgressBar value={Math.min(cur, q.requirementCount)} max={q.requirementCount} variant="custom" color={season.color} size="sm" />
                  </div>
                  {claimed ? (
                    <Check className="w-5 h-5 shrink-0" style={{ color: '#2ECC71' }} />
                  ) : (
                    <SFButton variant="primary" size="sm" disabled={!canClaimQuest(q, progress)} loading={busy === q.id} onClick={() => doClaim(q.id)}>
                      {done ? 'Claim' : `${Math.min(cur, q.requirementCount)}/${q.requirementCount}`}
                    </SFButton>
                  )}
                </motion.div>
              );
            })}
          </div>
        </SFCard>

        {/* ── Seasonal shop ── */}
        <SFCard variant="elevated" className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-5 h-5" style={{ color: season.color }} />
            <h3 className="text-base font-bold" style={{ color: '#1A1D2B' }}>Seasonal Shop</h3>
            <span className="ml-auto text-xs font-bold inline-flex items-center gap-1" style={{ color: '#1A1D2B' }}>
              {season.currencyEmoji} {progress.currency}
            </span>
          </div>
          <p className="text-[11px] mb-4" style={{ color: '#8C94AC' }}>New items unlock each week — get them before the season ends!</p>
          <div className="grid grid-cols-2 gap-2">
            {items.map((item, i) => {
              const owned = progress.purchases.includes(item.id);
              const available = isItemAvailable(item, week);
              const affordable = canAfford(item, progress);
              return (
                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                  className="p-3 rounded-xl text-center" style={{ background: owned ? `${season.color}12` : '#F7F8FC', opacity: available ? 1 : 0.6 }}>
                  <div className="text-2xl mb-1">{available ? item.emoji : <Lock className="w-5 h-5 mx-auto" style={{ color: '#8C94AC' }} />}</div>
                  <p className="text-[11px] font-bold leading-tight mb-1" style={{ color: '#1A1D2B' }}>{item.name}</p>
                  {owned ? (
                    <span className="text-[10px] font-bold inline-flex items-center gap-0.5" style={{ color: '#2ECC71' }}><Check className="w-3 h-3" /> Owned</span>
                  ) : !available ? (
                    <span className="text-[10px]" style={{ color: '#8C94AC' }}>Week {item.weekAvailable}</span>
                  ) : (
                    <SFButton variant="outline" size="sm" disabled={!affordable} loading={busy === item.id} onClick={() => doBuy(item.id)} className="w-full !px-2 !py-1 text-[11px]">
                      {season.currencyEmoji} {item.cost}
                    </SFButton>
                  )}
                  {shopMsg?.id === item.id && (
                    <p className="text-[10px] mt-1" style={{ color: shopMsg.ok ? '#2ECC71' : '#EF4444' }}>{shopMsg.text}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </SFCard>
      </div>
    </div>
  );
}

export default SeasonHub;
