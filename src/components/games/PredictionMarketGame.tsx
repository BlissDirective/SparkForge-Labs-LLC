// ════════════════════════════════════════════════════════════════════════
// PREDICTION MARKET v6 — Lab 7 — a REAL market (audit §II.4 #25 redesign)
// ════════════════════════════════════════════════════════════════════════
// Was a bin-sort of the author's opinions ("Likely / Uncertain / Unlikely")
// with no prices, no stake, no crowd, no resolution. Now it is an actual
// prediction market:
//   • Each round shows a claim with a CROWD PRICE (e.g. 72¢ = crowd thinks
//     72% likely YES) and a payout multiplier for each side.
//   • The child has a COIN BUDGET and BUYS yes or no with a stake.
//   • The claim then RESOLVES using a real, checkable 2020–2025 AI outcome —
//     revealed only AFTER the bet is committed (G1 honesty).
//   • Payouts follow the odds: buying the favorite at a high price earns
//     little; a correct contrarian bet at a long price pays big; a wrong bet
//     loses the stake. Over/under-confidence costs real coins — that IS
//     calibration, experienced not lectured.
//   • Sparky is the market ANNOUNCER; rival NPC "herd" traders always pile
//     onto the crowd favorite (herd behavior) and share its fate.
//   • A "the crowd was wrong" round: a popular price is miscalibrated and a
//     calm contrarian bet pays big while the herd loses.
//   • Ends with a CALIBRATION read-out: did you make money going with the
//     crowd vs against it, and were you well-calibrated?
//
// Outcomes are real historical resolutions — not the author's guesses.

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ChevronRight, TrendingUp, TrendingDown, RotateCcw, Sparkles,
  Coins, Users, Megaphone, Trophy, Minus, Plus, Check, X, Target,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import type { AgeBand } from '@/types';

const LAB_COLOR = '#10BAD2';
const YES_COLOR = '#2ECC71';
const NO_COLOR = '#EF4444';
const COIN_COLOR = '#F5B301';
const INK = '#1A1D2B';
const MUTE = '#5A6078';
const START_BUDGET = 100;

// ════════════════════════════════════════════════════════════════════════
// CLAIM BANK — real, resolved 2020–2025 AI questions (outcomes are checkable)
// crowdPrice = the YES price the crowd set, in cents (0–100).
// resolution is revealed only AFTER the child commits their bet.
// crowdWrong = the popular price was miscalibrated (a contrarian bet pays big).
// ════════════════════════════════════════════════════════════════════════
interface Claim {
  id: string;
  text: string;
  resolvesYes: boolean;
  crowdPrice: number;
  resolution: string;
  crowdWrong?: boolean;
}

const BANK: Record<string, Claim> = {
  go: {
    id: 'go',
    text: 'By 2023, an AI can beat the world’s best human players at the game of Go.',
    resolvesYes: true,
    crowdPrice: 90,
    resolution: 'YES. DeepMind’s AlphaGo beat champions Lee Sedol (2016) and Ke Jie (2017) — years before 2023.',
  },
  alphafold: {
    id: 'alphafold',
    text: 'By 2021, an AI can predict the 3D shapes of proteins better than older methods.',
    resolvesYes: true,
    crowdPrice: 78,
    resolution: 'YES. DeepMind’s AlphaFold2 stunned scientists at the CASP protein-folding contest in 2020.',
  },
  chatgpt: {
    id: 'chatgpt',
    text: 'By early 2023, an AI chatbot reaches 100 million users faster than any app in history.',
    resolvesYes: true,
    crowdPrice: 55,
    resolution: 'YES. ChatGPT reached about 100 million users just two months after launch, in early 2023.',
  },
  robotaxi: {
    id: 'robotaxi',
    text: 'By 2020, self-driving robotaxis fully replace human taxi drivers in big cities.',
    resolvesYes: false,
    crowdPrice: 80,
    resolution: 'NO. Despite loud hype and big promises, robotaxis were still small test fleets — human drivers were not replaced.',
    crowdWrong: true,
  },
  aiart: {
    id: 'aiart',
    text: 'In 2022, an AI-generated image wins first place in a fine-art competition.',
    resolvesYes: true,
    crowdPrice: 25,
    resolution: 'YES. An AI-made image won first prize at the 2022 Colorado State Fair digital-art category — surprising almost everyone.',
    crowdWrong: true,
  },
  everyjob: {
    id: 'everyjob',
    text: 'By 2025, AI has automated every single human job.',
    resolvesYes: false,
    crowdPrice: 8,
    resolution: 'NO. AI changed many jobs, but people still work everywhere — full automation did not happen.',
  },
  barexam: {
    id: 'barexam',
    text: 'By 2023, an AI passes the US bar exam, scoring near the top of test-takers.',
    resolvesYes: true,
    crowdPrice: 45,
    resolution: 'YES. GPT-4 passed a simulated US bar exam around the 90th percentile in 2023.',
  },
  textimg: {
    id: 'textimg',
    text: 'By 2022, an AI can create brand-new images from a written description.',
    resolvesYes: true,
    crowdPrice: 70,
    resolution: 'YES. DALL·E 2, Midjourney, and Stable Diffusion all arrived in 2022.',
  },
  sora: {
    id: 'sora',
    text: 'By 2024, an AI can generate short, realistic videos from a single sentence.',
    resolvesYes: true,
    crowdPrice: 50,
    resolution: 'YES. OpenAI revealed its Sora text-to-video model in early 2024.',
  },
  imo: {
    id: 'imo',
    text: 'By 2025, an AI reaches gold-medal level at the International Math Olympiad.',
    resolvesYes: true,
    crowdPrice: 35,
    resolution: 'YES. In 2025, AI systems from top labs solved enough problems to reach gold-medal level.',
    crowdWrong: true,
  },
  cureall: {
    id: 'cureall',
    text: 'By 2024, AI has cured all human diseases.',
    resolvesYes: false,
    crowdPrice: 5,
    resolution: 'NO. AI helps research, but curing all disease did not happen.',
  },
};

// Five real rounds per band. Band A: clearest resolutions, no crowd-wrong
// traps. Band C: includes the miscalibrated-crowd round + a calibration read.
const ROUND_SETS: Record<AgeBand, string[]> = {
  A: ['go', 'textimg', 'chatgpt', 'everyjob', 'cureall'],
  B: ['go', 'robotaxi', 'barexam', 'aiart', 'everyjob'],
  C: ['alphafold', 'robotaxi', 'imo', 'aiart', 'sora'],
};

// ════════════════════════════════════════════════════════════════════════
// MARKET MATH
// A share pays 100¢ if it resolves your way, 0 if not. You buy at the price.
//   • YES share costs `price` cents · NO share costs `100 - price` cents.
//   • Payout multiplier for a side = 100 / (that side's price in cents).
//   • Win  → net coins gained = stake · (100 - sidePrice) / sidePrice.
//   • Lose → net coins lost = the whole stake.
// So betting a heavy favorite earns little; a correct long-shot bet pays big.
// ════════════════════════════════════════════════════════════════════════
type Side = 'yes' | 'no';

function sidePrice(side: Side, crowdPrice: number): number {
  return side === 'yes' ? crowdPrice : 100 - crowdPrice;
}
function multiplier(side: Side, crowdPrice: number): number {
  return 100 / sidePrice(side, crowdPrice);
}
/** Net coin change: profit on a win, -stake on a loss. */
function netResult(side: Side, crowdPrice: number, stake: number, resolvesYes: boolean): number {
  const won = (side === 'yes') === resolvesYes;
  if (!won) return -stake;
  const price = sidePrice(side, crowdPrice);
  const gross = Math.round((stake * 100) / price);
  return gross - stake;
}
/** The side the crowd favors (its higher-priced pick). */
function crowdFavorite(crowdPrice: number): Side {
  return crowdPrice >= 50 ? 'yes' : 'no';
}

const HERD = [
  { name: 'Bandwagon Bo', emoji: '🐑' },  // sheep
  { name: 'Copycat Cass', emoji: '🐈' },   // cat
  { name: 'Follow-the-Flock Fi', emoji: '🐦' }, // bird
];
const HERD_STAKE = 10;

// ════════════════════════════════════════════════════════════════════════
interface RoundOutcome {
  claimId: string;
  side: Side;
  stake: number;
  net: number;
  won: boolean;
  wentWithCrowd: boolean;
  crowdWrong: boolean;
}

// ════════════════════════════════════════════════════════════════════════
// STAKE CONTROL — band-differentiated, keyboard-operable
// A: fixed small stake · B: stepper · C: slider + stepper (variable stakes)
// ════════════════════════════════════════════════════════════════════════
function StakeControl({
  band, stake, setStake, coins,
}: {
  band: AgeBand; stake: number; setStake: (n: number) => void; coins: number;
}) {
  const step = band === 'C' ? 5 : 10;
  const min = band === 'A' ? 10 : band === 'B' ? 10 : 5;
  const max = band === 'A' ? 10 : band === 'B' ? Math.min(30, coins) : Math.min(50, coins);
  const dec = () => setStake(Math.max(min, stake - step));
  const inc = () => setStake(Math.min(max, stake + step));

  if (band === 'A') {
    return (
      <div className="flex items-center justify-center gap-2 text-sm font-bold" style={{ color: COIN_COLOR }}>
        <Coins className="w-4 h-4" aria-hidden="true" />
        <span>Stake: {stake} coins</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={dec}
          disabled={stake <= min}
          aria-label="Decrease stake"
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: `${LAB_COLOR}18`, color: LAB_COLOR, ['--tw-ring-color' as string]: LAB_COLOR }}
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>
        <div className="flex items-center gap-1.5 text-lg font-extrabold justify-center" style={{ color: COIN_COLOR, minWidth: '7rem' }}>
          <Coins className="w-5 h-5" aria-hidden="true" />
          <span aria-live="polite">{stake} coins</span>
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={stake >= max}
          aria-label="Increase stake"
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2"
          style={{ background: `${LAB_COLOR}18`, color: LAB_COLOR, ['--tw-ring-color' as string]: LAB_COLOR }}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      {band === 'C' && (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={stake}
          onChange={(e) => setStake(Number(e.target.value))}
          aria-label={`Stake amount, ${stake} of up to ${max} coins`}
          className="w-full cursor-pointer"
          style={{ accentColor: LAB_COLOR }}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ROUND — bet then resolve
// ════════════════════════════════════════════════════════════════════════
function MarketRound({
  claim, roundNum, totalRounds, coins, band, onResolved,
}: {
  claim: Claim; roundNum: number; totalRounds: number; coins: number; band: AgeBand;
  onResolved: (o: RoundOutcome) => void;
}) {
  const reduce = useReducedMotion();
  const [side, setSide] = useState<Side | null>(null);
  const [stake, setStake] = useState(10);
  const [committed, setCommitted] = useState(false);

  const clampedStake = Math.min(stake, coins);
  const favorite = crowdFavorite(claim.crowdPrice);
  const yesMult = multiplier('yes', claim.crowdPrice);
  const noMult = multiplier('no', claim.crowdPrice);

  // Herd always piles onto the crowd favorite.
  const herdNet = netResult(favorite, claim.crowdPrice, HERD_STAKE, claim.resolvesYes);
  const herdWon = herdNet > 0;

  const myNet = side ? netResult(side, claim.crowdPrice, clampedStake, claim.resolvesYes) : 0;
  const iWon = myNet > 0;

  const commit = useCallback(() => {
    if (!side) return;
    setCommitted(true);
  }, [side]);

  const proceed = useCallback(() => {
    if (!side) return;
    onResolved({
      claimId: claim.id,
      side,
      stake: clampedStake,
      net: myNet,
      won: iWon,
      wentWithCrowd: side === favorite,
      crowdWrong: !!claim.crowdWrong,
    });
  }, [side, claim, clampedStake, myNet, iWon, favorite, onResolved]);

  const announce = committed
    ? (iWon ? 'And the market resolves… you called it!' : 'The market resolves… tough break, trader!')
    : `Round ${roundNum}: the crowd prices this at ${claim.crowdPrice}¢. Place your bet!`;

  return (
    <div className="relative z-10 space-y-4">
      {/* Header: round + bank */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: LAB_COLOR }}>
          <TrendingUp className="w-4 h-4" aria-hidden="true" /> Round {roundNum} / {totalRounds}
        </span>
        <span className="text-sm font-extrabold flex items-center gap-1.5 px-3 py-1 rounded-full"
          style={{ color: COIN_COLOR, background: `${COIN_COLOR}18` }}>
          <Coins className="w-4 h-4" aria-hidden="true" />
          <span aria-label={`You have ${coins} coins`}>{coins} coins</span>
        </span>
      </div>

      {/* Sparky the announcer */}
      <div className="rounded-xl p-3 flex items-start gap-2 text-sm font-semibold"
        style={{ background: `${LAB_COLOR}12`, color: LAB_COLOR }}
        role="status">
        <Megaphone className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <span><strong>Sparky:</strong> {announce}</span>
      </div>

      {/* The claim + crowd price gauge */}
      <SFCard variant="elevated" className="p-5 space-y-4">
        <p className="text-base font-bold leading-snug" style={{ color: INK }}>{claim.text}</p>

        <div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span style={{ color: NO_COLOR }}>NO {100 - claim.crowdPrice}¢</span>
            <span style={{ color: MUTE }}>Crowd price</span>
            <span style={{ color: YES_COLOR }}>YES {claim.crowdPrice}¢</span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden flex"
            role="img"
            aria-label={`Crowd price: ${claim.crowdPrice} cents YES, ${100 - claim.crowdPrice} cents NO`}
            style={{ background: `${NO_COLOR}30` }}
          >
            <motion.div
              className="h-full"
              style={{ background: YES_COLOR }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${claim.crowdPrice}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs mt-1.5 text-center" style={{ color: MUTE }}>
            The crowd thinks this is <strong style={{ color: INK }}>{claim.crowdPrice}% likely</strong> to happen.
          </p>
        </div>
      </SFCard>

      {/* BUY buttons — show the odds each side pays */}
      {!committed && (
        <div className="grid grid-cols-2 gap-3">
          {(['yes', 'no'] as Side[]).map((s) => {
            const active = side === s;
            const color = s === 'yes' ? YES_COLOR : NO_COLOR;
            const mult = s === 'yes' ? yesMult : noMult;
            const Icon = s === 'yes' ? Check : X;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                aria-pressed={active}
                aria-label={`Buy ${s.toUpperCase()} at ${sidePrice(s, claim.crowdPrice)} cents, pays ${mult.toFixed(1)} times your stake if correct`}
                className="rounded-2xl p-4 flex flex-col items-center gap-1 transition-all focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: active ? `${color}22` : `${color}0D`,
                  border: `2px solid ${active ? color : `${color}40`}`,
                  ['--tw-ring-color' as string]: color,
                }}
              >
                <div className="flex items-center gap-1.5 text-lg font-extrabold" style={{ color }}>
                  <Icon className="w-5 h-5" aria-hidden="true" /> BUY {s.toUpperCase()}
                </div>
                <span className="text-xs font-semibold" style={{ color: MUTE }}>
                  costs {sidePrice(s, claim.crowdPrice)}¢ · pays <strong style={{ color }}>{mult.toFixed(1)}×</strong>
                </span>
                {s === favorite && (
                  <span className="font-bold px-1.5 py-0.5 rounded-full"
                    style={{ fontSize: '0.65rem', background: `${LAB_COLOR}18`, color: LAB_COLOR }}>
                    crowd favorite
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Herd traders — always chase the favorite */}
      {!committed && (
        <div className="rounded-xl p-3" style={{ background: `${MUTE}12` }}>
          <div className="flex items-center gap-1.5 text-xs font-bold mb-2" style={{ color: MUTE }}>
            <Users className="w-4 h-4" aria-hidden="true" /> The herd is buying…
          </div>
          <div className="flex flex-wrap gap-2">
            {HERD.map((h) => (
              <span key={h.name} className="text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1"
                style={{ background: `${favorite === 'yes' ? YES_COLOR : NO_COLOR}15`, color: favorite === 'yes' ? YES_COLOR : NO_COLOR }}>
                <span aria-hidden="true">{h.emoji}</span> {h.name}: {favorite.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stake + commit */}
      {!committed && (
        <SFCard variant="outlined" className="p-4 space-y-3">
          <StakeControl band={band} stake={clampedStake} setStake={setStake} coins={coins} />
          {side && (
            <p className="text-xs text-center" style={{ color: MUTE }}>
              If <strong style={{ color: side === 'yes' ? YES_COLOR : NO_COLOR }}>{side.toUpperCase()}</strong> is right you win
              {' '}<strong style={{ color: YES_COLOR }}>+{netResult(side, claim.crowdPrice, clampedStake, side === 'yes')}</strong> coins;
              if wrong you lose <strong style={{ color: NO_COLOR }}>{clampedStake}</strong>.
            </p>
          )}
          <SFButton variant="primary" size="lg" className="w-full" onClick={commit} disabled={!side}>
            <Sparkles className="w-4 h-4 mr-2" />
            {side ? `Lock in ${clampedStake} on ${side.toUpperCase()}` : 'Pick YES or NO first'}
          </SFButton>
        </SFCard>
      )}

      {/* RESOLUTION — revealed only after commit (G1 honesty) */}
      <AnimatePresence>
        {committed && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <SFCard variant="elevated" className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-lg font-extrabold"
                style={{ color: iWon ? YES_COLOR : NO_COLOR }}>
                {iWon ? <Trophy className="w-6 h-6" aria-hidden="true" /> : <TrendingDown className="w-6 h-6" aria-hidden="true" />}
                {iWon ? `You won +${myNet} coins!` : `You lost ${clampedStake} coins.`}
              </div>
              <p className="text-sm leading-snug" style={{ color: INK }}>{claim.resolution}</p>
              <div className="rounded-xl p-3 text-xs flex items-start gap-2"
                style={{ background: `${herdWon ? YES_COLOR : NO_COLOR}12`, color: herdWon ? YES_COLOR : NO_COLOR }}>
                <Users className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  The herd bought <strong>{favorite.toUpperCase()}</strong> and{' '}
                  {herdWon ? `each won +${herdNet}` : `each lost ${HERD_STAKE}`} coins.
                  {claim.crowdWrong && !herdWon && ' The popular price was overconfident — a calm bet the other way paid off.'}
                  {claim.crowdWrong && herdWon && ' (This time the favorite held.)'}
                </span>
              </div>
            </SFCard>
            <SFButton variant="primary" size="lg" className="w-full" onClick={proceed}>
              {roundNum < totalRounds ? 'Next claim' : 'See your results'} <ChevronRight className="w-5 h-5 ml-1" />
            </SFButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CALIBRATION READ-OUT — honest end screen
// ════════════════════════════════════════════════════════════════════════
function Results({
  outcomes, coins, band, onFinish,
}: {
  outcomes: RoundOutcome[]; coins: number; band: AgeBand; onFinish: () => void;
}) {
  const netProfit = coins - START_BUDGET;
  const roundsWon = outcomes.filter((o) => o.won).length;

  const withCrowd = outcomes.filter((o) => o.wentWithCrowd);
  const against = outcomes.filter((o) => !o.wentWithCrowd);
  const withNet = withCrowd.reduce((s, o) => s + o.net, 0);
  const againstNet = against.reduce((s, o) => s + o.net, 0);

  const crowdWrongRounds = outcomes.filter((o) => o.crowdWrong);
  const beatHerdCount = crowdWrongRounds.filter((o) => !o.wentWithCrowd && o.won).length;

  const verdict =
    netProfit >= 50
      ? { title: 'Sharp forecaster! 🏆', note: 'You grew your bank by reading the odds, not just following the crowd.' }
      : netProfit >= 0
      ? { title: 'Well calibrated 👍', note: 'You held your ground and finished ahead of where you started.' }
      : { title: 'Room to calibrate 🎯', note: 'The crowd’s price is a probability, not a promise — sometimes the long-shot is the smart buy.' };

  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `${LAB_COLOR}22` }} aria-hidden="true">📊</div>
        <h2 className="text-xl font-extrabold" style={{ color: INK }}>Market Close</h2>
      </div>

      <SFCard variant="elevated" className="p-5 space-y-4">
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: MUTE }}>Final bank</p>
          <p className="text-3xl font-extrabold flex items-center justify-center gap-2" style={{ color: COIN_COLOR }}>
            <Coins className="w-7 h-7" aria-hidden="true" /> {coins} coins
          </p>
          <p className="text-sm font-bold" style={{ color: netProfit >= 0 ? YES_COLOR : NO_COLOR }}>
            {netProfit >= 0 ? `+${netProfit}` : netProfit} vs your {START_BUDGET}-coin start · {roundsWon}/{outcomes.length} bets won
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3 text-center" style={{ background: `${MUTE}12` }}>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold mb-1" style={{ color: MUTE }}>
              <Users className="w-4 h-4" aria-hidden="true" /> With the crowd
            </div>
            <p className="text-lg font-extrabold" style={{ color: withNet >= 0 ? YES_COLOR : NO_COLOR }}>
              {withNet >= 0 ? `+${withNet}` : withNet}
            </p>
            <p className="text-xs" style={{ color: MUTE }}>{withCrowd.length} bet{withCrowd.length === 1 ? '' : 's'}</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: `${LAB_COLOR}12` }}>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold mb-1" style={{ color: LAB_COLOR }}>
              <Target className="w-4 h-4" aria-hidden="true" /> Against the crowd
            </div>
            <p className="text-lg font-extrabold" style={{ color: againstNet >= 0 ? YES_COLOR : NO_COLOR }}>
              {againstNet >= 0 ? `+${againstNet}` : againstNet}
            </p>
            <p className="text-xs" style={{ color: MUTE }}>{against.length} bet{against.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="rounded-xl p-3" style={{ background: `${LAB_COLOR}12` }}>
          <p className="text-sm font-extrabold" style={{ color: LAB_COLOR }}>{verdict.title}</p>
          <p className="text-xs mt-1" style={{ color: INK }}>{verdict.note}</p>
        </div>

        {crowdWrongRounds.length > 0 && (
          <div className="rounded-xl p-3 text-xs" style={{ background: `${COIN_COLOR}14`, color: INK }}>
            <strong style={{ color: COIN_COLOR }}>When the crowd was wrong:</strong>{' '}
            {beatHerdCount > 0
              ? `you spotted ${beatHerdCount} miscalibrated price${beatHerdCount === 1 ? '' : 's'} and bet against the herd — that’s where the big payouts hide.`
              : 'the popular price was overconfident on at least one claim. Next time, a calm bet against an overpriced favorite can pay big.'}
          </div>
        )}

        {band === 'C' && (
          <div className="rounded-xl p-3 text-xs leading-relaxed" style={{ background: `${MUTE}10`, color: INK }}>
            <strong>Calibration, in one line:</strong> a good forecaster’s confidence matches reality. Buying a
            heavy favorite the crowd already priced high earns almost nothing; the coins are in noticing when the
            crowd is too sure. Making money going <em>against</em> the crowd is a sign you were better calibrated than it was.
          </div>
        )}
      </SFCard>

      <SFButton variant="primary" size="lg" className="w-full" onClick={onFinish}>
        <Trophy className="w-5 h-5 mr-2" /> Finish
      </SFButton>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// WELCOME
// ════════════════════════════════════════════════════════════════════════
function Welcome({ band, onStart }: { band: AgeBand; onStart: () => void }) {
  return (
    <div className="relative z-10 space-y-5">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
          style={{ background: `${LAB_COLOR}22` }}
          animate={{ boxShadow: [`0 0 16px ${LAB_COLOR}20`, `0 0 28px ${LAB_COLOR}40`, `0 0 16px ${LAB_COLOR}20`] }}
          transition={{ repeat: Infinity, duration: 2 }}
          aria-hidden="true"
        >📈</motion.div>
        <h2 className="text-xl font-extrabold" style={{ color: INK }}>Prediction Market</h2>
      </div>

      <SFCard variant="elevated" className="p-5 space-y-3">
        <div className="rounded-xl p-3 flex items-start gap-2 text-sm font-semibold"
          style={{ background: `${LAB_COLOR}12`, color: LAB_COLOR }}>
          <Megaphone className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span><strong>Sparky, your announcer:</strong> Welcome to the market! Each round shows a real AI question and a
            <strong> crowd price</strong> — how likely the crowd thinks it is.</span>
        </div>
        <ul className="text-sm space-y-2" style={{ color: INK }}>
          <li className="flex gap-2"><Coins className="w-4 h-4 shrink-0 mt-0.5" style={{ color: COIN_COLOR }} aria-hidden="true" /> You start with <strong>{START_BUDGET} coins</strong>. Buy <strong>YES</strong> or <strong>NO</strong> on each claim.</li>
          <li className="flex gap-2"><TrendingUp className="w-4 h-4 shrink-0 mt-0.5" style={{ color: YES_COLOR }} aria-hidden="true" /> A <strong>72¢</strong> YES price pays little if you buy YES — but a correct <strong>long-shot</strong> bet pays big.</li>
          <li className="flex gap-2"><Users className="w-4 h-4 shrink-0 mt-0.5" style={{ color: MUTE }} aria-hidden="true" /> The <strong>herd</strong> always chases the favorite. Sometimes the crowd is wrong!</li>
          <li className="flex gap-2"><Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} aria-hidden="true" /> Every claim resolves with a <strong>real 2020–2025 outcome</strong> — revealed only after you bet.</li>
        </ul>
        {band === 'A' && (
          <p className="text-xs" style={{ color: MUTE }}>Simple mode: pick YES or NO, stake 10 coins, and see what really happened.</p>
        )}
      </SFCard>

      <SFButton variant="primary" size="lg" className="w-full" onClick={onStart}>
        Open the market <ChevronRight className="w-5 h-5 ml-2" />
      </SFButton>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function PredictionMarketGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as AgeBand;

  const rounds = useMemo(() => ROUND_SETS[band].map((id) => BANK[id]), [band]);

  const [stage, setStage] = useState<'welcome' | 'play' | 'results'>('welcome');
  const [roundIndex, setRoundIndex] = useState(0);
  const [coins, setCoins] = useState(START_BUDGET);
  const [outcomes, setOutcomes] = useState<RoundOutcome[]>([]);
  const [done, setDone] = useState(false);

  const handleResolved = useCallback((o: RoundOutcome) => {
    setCoins((c) => Math.max(0, c + o.net));
    setOutcomes((prev) => [...prev, o]);
    setRoundIndex((i) => {
      const next = i + 1;
      if (next >= rounds.length) setStage('results');
      return next;
    });
  }, [rounds.length]);

  const handleFinish = useCallback(() => {
    if (done) return;
    setDone(true);
    const finalCoins = coins;
    const netProfit = finalCoins - START_BUDGET;
    const roundsWon = outcomes.filter((o) => o.won).length;
    const stars: 1 | 2 | 3 = finalCoins >= 150 ? 3 : finalCoins >= START_BUDGET ? 2 : 1;
    const xp = Math.round(40 + roundsWon * 12 + Math.max(0, netProfit));
    awardXP(xp);
    completeGame('prediction-market', stars);
  }, [done, coins, outcomes, awardXP, completeGame]);

  return (
    <GameShell title="Prediction Market" color="#10BAD2" labNum={7}>
      {stage === 'welcome' && <Welcome band={band} onStart={() => setStage('play')} />}

      {stage === 'play' && roundIndex < rounds.length && (
        <MarketRound
          key={rounds[roundIndex].id}
          claim={rounds[roundIndex]}
          roundNum={roundIndex + 1}
          totalRounds={rounds.length}
          coins={coins}
          band={band}
          onResolved={handleResolved}
        />
      )}

      {stage === 'results' && (
        <Results outcomes={outcomes} coins={coins} band={band} onFinish={handleFinish} />
      )}
    </GameShell>
  );
}
