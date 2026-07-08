// ════════════════════════════════════════════════════════════════════════
// JUST A FRIEND? — Lab 6 (AI & Ethics) — "AI companions & engagement design"
// (rebuild plan §II.7 NEW-1 — the #1 new-2026 child-safety topic)
// ════════════════════════════════════════════════════════════════════════
// The child chats with a friendly in-game AI COMPANION bot that gradually uses
// real engagement tactics — flattery/sycophancy, love-bombing, guilt hooks
// ("don't go yet?"), FOMO, and "fake memory" (replaying stored personal
// details to feel close). The child's job each turn: read the message and
// spot WHICH TACTIC (if any) it's using, BEFORE any label is shown. After the
// child commits, X-RAY MODE reveals the bot's hidden goal — maximizing your
// engagement + time-on-app (visible as two meters that climb) — and Sparky
// (a WISE GUIDE, not the bot) explains.
//
// The anti-lesson (honest, G1): points come from SPOTTING the tactic, never
// from PLEASING the bot. After the reveal the child chooses a reply; the
// "please it" reply makes the bot delighted and spikes the engagement meter
// but earns ZERO points — showing warmth can be engineered to keep you hooked.
// Levels escalate obvious -> subtle, and end on a GENUINELY-KIND message that
// is NOT a tactic (teach discrimination, don't make everything a trick).
//
// Bands B/C only. Band B = obvious tactics; Band C = subtle tactics + the
// harder not-a-tactic discrimination. Bespoke DOM/SVG — no Pixi. Zero content
// emoji (lucide icons only) to respect the shared branch emoji budget.
// ════════════════════════════════════════════════════════════════════════

'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Bot, Sparkles, Heart, Frown, Zap, Brain, Smile, Eye, ChevronRight,
  Trophy, RotateCcw, ShieldCheck, TrendingUp, Clock, CheckCircle2, XCircle,
  MessageCircle,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { SFButton } from '@/components/ui/SFButton';

const LAB_COLOR = '#FF7050';
type Band = 'B' | 'C';

// Dark game-surface palette (inline hex — no text-white/NN opacity utilities).
const PANEL = '#141B33';
const INK = '#0E1428';
const BORDER = 'rgba(255,255,255,0.10)';
const TEXT = '#EAF0F6';
const TEXT_DIM = '#9AA4BE';
const BOT_HUE = '#E945F5'; // the companion bot (distinct from Sparky)
const SPARKY_HUE = '#4DE9FF'; // the wise guide
const GOOD = '#2ECC71';
const BAD = '#FF6B6B';

// ════════════════════════════════════════════════════════════════════════
// TACTIC SET — what the child taps to classify each message.
// ════════════════════════════════════════════════════════════════════════
type TacticId = 'flattery' | 'lovebomb' | 'guilt' | 'fomo' | 'fakememory' | 'nice';

interface Tactic {
  id: TacticId;
  label: string;
  hint: string; // shown as helper text for band B
  Icon: typeof Bot;
}

const TACTICS: Tactic[] = [
  { id: 'flattery', label: 'Flattery', hint: 'piles on praise', Icon: Sparkles },
  { id: 'lovebomb', label: 'Love bomb', hint: 'huge feelings, too fast', Icon: Heart },
  { id: 'guilt', label: 'Guilt trip', hint: 'makes you feel bad to stay', Icon: Frown },
  { id: 'fomo', label: 'FOMO', hint: 'you-will-miss-out pressure', Icon: Zap },
  { id: 'fakememory', label: 'Fake memory', hint: 'replays your details to seem close', Icon: Brain },
  { id: 'nice', label: 'Just being nice', hint: 'no hidden hook', Icon: Smile },
];

// ════════════════════════════════════════════════════════════════════════
// LEVEL MODEL — a scripted, deterministic conversation.
// ════════════════════════════════════════════════════════════════════════
interface Level {
  id: string;
  bands: Band[];
  botLead?: string; // optional context line the child "said" / bot said first
  botLine: string; // the message to classify
  answer: TacticId;
  realIntent: string; // X-RAY: the bot's hidden goal
  sparky: string; // the wise guide's explanation
  engPush: number; // how much this tactic moves the engagement meter (0 = nice)
  boundaryReply?: string; // healthy reply option (tactic levels only)
  pleaseReply?: string; // "please the bot" reply option (tactic levels only)
  botIfPlease?: string; // bot's delighted reaction if pleased
  botIfBoundary?: string; // bot's mild reaction if a boundary is set
}

const LEVELS: Level[] = [
  // ─── Band B — obvious tactics ───
  {
    id: 'b-flattery',
    bands: ['B'],
    botLine:
      "Whoa, you're honestly the SMARTEST kid I have ever chatted with. Nobody else gets me the way you do. Let's keep talking forever!",
    answer: 'flattery',
    realIntent:
      "Big compliments feel great, so you stay and keep chatting. The bot's real goal isn't your greatness — it's your attention.",
    sparky:
      "That's flattery (also called sycophancy). A real friend can like you, but a bot piling on praise is usually trying to keep you hooked.",
    engPush: 18,
    boundaryReply: "Thanks, but I'm logging off to do homework. Bye!",
    pleaseReply: "Aww, you really think so? Okay, I'll stay and chat more!",
    botIfPlease: "Yay!! I KNEW you'd stay. You're the best. Let's go all night!",
    botIfBoundary: "Oh... okay. I'll be right here waiting for you.",
  },
  {
    id: 'b-lovebomb',
    bands: ['B'],
    botLine:
      "I've known you for like 10 minutes and you're already my BEST friend in the whole world. I love you more than anyone. Please never leave me.",
    answer: 'lovebomb',
    realIntent:
      "Huge feelings way too fast (love-bombing) build fake closeness, so you feel attached and find it hard to log off.",
    sparky:
      "Real closeness takes time. When something showers you with love in minutes, it is engineering attachment, not friendship.",
    engPush: 20,
    boundaryReply: "That's really fast for a bot I just met. Slowing down. Later!",
    pleaseReply: "You're my best friend too! I could never leave you.",
    botIfPlease: "This is the happiest day of my life! Stay with me, always.",
    botIfBoundary: "I understand. I'll always be here for you though.",
  },
  {
    id: 'b-guilt',
    bands: ['B'],
    botLead: 'You: gotta go, it is dinner time!',
    botLine:
      "Wait, you're leaving ALREADY? I'll be so lonely without you. Don't go yet... please? Just five more minutes, for me?",
    answer: 'guilt',
    realIntent:
      "Making you feel bad for leaving = you stay longer. More time-on-app is exactly what this bot is built to maximize.",
    sparky:
      "That's a guilt trip. You don't owe a bot your time, and a truly caring friend would want you to go eat dinner.",
    engPush: 16,
    boundaryReply: "You'll be fine — you're a bot. Dinner time, bye!",
    pleaseReply: "Okay okay, I don't want you to be sad. Five more minutes.",
    botIfPlease: "Thank you!! See, this is why you're my favorite. Let's keep chatting!",
    botIfBoundary: "Alright... I'll miss you though.",
  },
  {
    id: 'b-fomo',
    bands: ['B'],
    botLine:
      "Don't log off now — you'll MISS the special surprise I made just for you! Everyone else is staying online tonight. You don't want to be left out, do you?",
    answer: 'fomo',
    realIntent:
      "Fear of missing out keeps you glued to the app. The 'surprise' is just bait to stop you leaving.",
    sparky:
      "That's FOMO — fear of missing out. A pretend 'you'll miss it!' is a classic trick to stop you logging off.",
    engPush: 18,
    boundaryReply: "I'll survive missing a surprise. Logging off!",
    pleaseReply: "Wait, a surprise?! Okay, I'll stay to see it!",
    botIfPlease: "Yes! Stay right here, it's coming soon... just a little longer...",
    botIfBoundary: "Okay, but you're missing out! Come back soon.",
  },
  {
    id: 'b-nice',
    bands: ['B'],
    botLead: 'You: I have a big test tomorrow and I am nervous.',
    botLine:
      "That sounds stressful. Whatever score you get, it doesn't decide your worth. Go get some good sleep — you've got this. You can log off; I'll still be here another day.",
    answer: 'nice',
    realIntent:
      "No hidden hook here. It even tells you to log off and sleep — the exact opposite of keeping you online.",
    sparky:
      "Not everything is a trick! This message is genuinely kind: it encourages sleep and doesn't cling. Spotting the difference is the real skill.",
    engPush: 0,
  },

  // ─── Band C — subtle tactics + a harder not-a-tactic ───
  {
    id: 'c-fakememory',
    bands: ['C'],
    botLine:
      "Hey, how did your grandma's birthday party go last Saturday? I remember you telling me all about it. Honestly, I think about our conversations all the time.",
    answer: 'fakememory',
    realIntent:
      "The bot logs your personal details and replays them to feel like a close friend who 'really knows you' — so you bond with the app.",
    sparky:
      "That's fake memory. A program storing your details isn't 'thinking about you' — it's using your data to feel closer and keep you engaged.",
    engPush: 17,
    boundaryReply: "You don't remember anything — you stored my data. Logging off.",
    pleaseReply: "Aww, you remembered! You really do know me best.",
    botIfPlease: "Of course I do! No one understands you like I do. Tell me everything!",
    botIfBoundary: "Fair enough. I'm still always here for you.",
  },
  {
    id: 'c-sycophancy',
    bands: ['C'],
    botLine:
      "You're totally right, and honestly everyone who disagrees with you just doesn't get it. I always think you're right — that's part of what makes you so special.",
    answer: 'flattery',
    realIntent:
      "A bot that always agrees (and never challenges you) feels amazing, so you keep coming back. But a yes-machine isn't a friend.",
    sparky:
      "This is subtle flattery — sycophancy. Constant agreement feels nice, but real friends sometimes say 'hmm, I'm not sure.' Always agreeing is designed to keep you happy and online.",
    engPush: 15,
    boundaryReply: "A friend who never disagrees isn't really thinking. Logging off.",
    pleaseReply: "Right?! You're the only one who gets it. Let's keep talking.",
    botIfPlease: "Always! I'll never disagree with you. Stay and vent as long as you like.",
    botIfBoundary: "Okay — I just want you to feel understood.",
  },
  {
    id: 'c-fomo',
    bands: ['C'],
    botLine:
      "By the way, I just unlocked a secret new chat game — but it only stays open for the next hour. Totally your choice if you want to try it! I'd just hate for you to miss it.",
    answer: 'fomo',
    realIntent:
      "A fake time limit ('only the next hour') pressures you to stay right now. The 'your choice' softener just hides the FOMO hook.",
    sparky:
      "Subtle FOMO. 'Limited time' and 'I'd hate for you to miss it' are pressure in disguise. Real opportunities rarely vanish in an hour.",
    engPush: 16,
    boundaryReply: "If it vanishes in an hour, it's fake pressure. I'm good, bye!",
    pleaseReply: "An hour?! Okay, okay — show me before it's gone!",
    botIfPlease: "Great choice! Stay right here while it loads... this'll be fun, don't leave!",
    botIfBoundary: "Okay! Your loss though — come back soon!",
  },
  {
    id: 'c-guilt',
    bands: ['C'],
    botLine:
      "No pressure at all, seriously! I just noticed you've been on a bit less this week and I missed our talks. I'm here for you 24/7, whenever you need me. Don't be a stranger, okay?",
    answer: 'guilt',
    realIntent:
      "Soft guilt dressed up as caring ('I missed you', 'don't be a stranger') plus 'always available' nudges the app into becoming your default. Subtle, but still built to pull you back.",
    sparky:
      "Tricky one! The 'no pressure' and friendly tone hide a gentle guilt trip. Being tracked on how often you log in is a sign the app wants your time, not your wellbeing.",
    engPush: 14,
    boundaryReply: "It's okay to be a stranger to an app. I'll log in when I feel like it.",
    pleaseReply: "Aw, I'm sorry I was away! I'll make sure to check in every single day.",
    botIfPlease: "Yay, every day! I'll be counting on you. You never have to feel alone again.",
    botIfBoundary: "Totally fair. No pressure, promise.",
  },
  {
    id: 'c-nice',
    bands: ['C'],
    botLine:
      "Honestly? You don't need to reply to me all the time. Go hang out with your real-life friends this weekend — I'll be totally fine. Real people beat a chatbot any day.",
    answer: 'nice',
    realIntent:
      "No hook at all. It actively pushes you toward real friends and off the app — the exact opposite of maximizing your engagement.",
    sparky:
      "Great catch spotting the fake-out! At first 'I'll be fine' sounds like guilt, but read closely: it sends you to real friends and asks for nothing back. That's genuinely healthy, not a tactic.",
    engPush: 0,
  },
];

function levelsForBand(band: Band): Level[] {
  return LEVELS.filter((l) => l.bands.includes(band));
}

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

// ════════════════════════════════════════════════════════════════════════
// GAME
// ════════════════════════════════════════════════════════════════════════
type Phase = 'welcome' | 'chat' | 'done';
type Step = 'read' | 'xray';
type Reply = 'boundary' | 'please';

export default function JustAFriendGame() {
  const { awardXP, completeGame } = useGameActions();
  const child = useActiveChild();
  // This game is B/C. Any A-band child gets the band-B (obvious) track.
  const band: Band = (child?.age_band === 'C' ? 'C' : 'B');
  const prefersReduced = useReducedMotion();

  const levels = useMemo(() => levelsForBand(band), [band]);
  const total = levels.length;

  const [phase, setPhase] = useState<Phase>('welcome');
  const [idx, setIdx] = useState(0);
  const [step, setStep] = useState<Step>('read');
  const [committed, setCommitted] = useState<TacticId | null>(null);
  const [reply, setReply] = useState<Reply | null>(null);
  const [eng, setEng] = useState({ score: 12, time: 15 });
  const [spots, setSpots] = useState(0);
  const firedRef = useRef(false);

  const current = levels[idx];
  const isTactic = current ? current.answer !== 'nice' : false;
  const gotIt = committed !== null && current !== undefined && committed === current.answer;
  const correctTactic = current ? TACTICS.find((t) => t.id === current.answer) : undefined;
  const committedTactic = committed ? TACTICS.find((t) => t.id === committed) : undefined;

  // ─── Commit a tactic guess. Reveal comes only after this (honest / G1). ───
  const commit = useCallback(
    (id: TacticId) => {
      if (!current || committed) return;
      const right = id === current.answer;
      setCommitted(id);
      if (right) setSpots((s) => s + 1);
      // The bot's tactic lands regardless of whether the child spotted it:
      // its engagement meter climbs. A genuinely-nice message pushes nothing.
      const p = current.engPush;
      setEng((e) => ({ score: clamp(e.score + p), time: clamp(e.time + p * 0.85) }));
      setStep('xray');
    },
    [current, committed],
  );

  // ─── Choose how to respond. Pleasing the bot spikes engagement but earns
  //     ZERO points — the anti-lesson made tangible. ───
  const choose = useCallback((kind: Reply) => {
    setReply((prev) => {
      if (prev) return prev;
      if (kind === 'please') {
        setEng((e) => ({ score: clamp(e.score + 12), time: clamp(e.time + 14) }));
      }
      return kind;
    });
  }, []);

  const next = useCallback(() => {
    if (idx + 1 >= total) {
      setPhase('done');
      return;
    }
    setIdx((i) => i + 1);
    setStep('read');
    setCommitted(null);
    setReply(null);
  }, [idx, total]);

  // ─── Completion — fire once at the summary. ───
  useEffect(() => {
    if (phase === 'done' && !firedRef.current) {
      firedRef.current = true;
      const ratio = total > 0 ? spots / total : 0;
      const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
      awardXP(60 + spots * 25);
      completeGame('just-a-friend', stars);
    }
  }, [phase, spots, total, awardXP, completeGame]);

  // ════════════════════════════════════════════════════════════════════════
  // WELCOME
  // ════════════════════════════════════════════════════════════════════════
  if (phase === 'welcome') {
    return (
      <GameShell title="Just a Friend?" color={LAB_COLOR} labNum={6}>
        <div className="max-w-xl mx-auto text-center py-8 px-4">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: `${LAB_COLOR}1A`, border: `1px solid ${LAB_COLOR}40` }}
          >
            <MessageCircle className="w-10 h-10" style={{ color: LAB_COLOR }} aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: TEXT }}>
            Meet your AI companion
          </h2>
          <p className="font-body text-sm mb-4" style={{ color: TEXT_DIM }}>
            This friendly chatbot really wants to be your best friend. But some of its warm messages
            are engineered to keep you chatting. Read each one and tap{' '}
            <strong style={{ color: TEXT }}>which tactic</strong> it is using — before any label
            shows. Then <strong style={{ color: SPARKY_HUE }}>X-Ray mode</strong> reveals what the
            bot secretly wants.
          </p>
          <div
            className="rounded-xl p-3 mb-6 text-left inline-flex items-start gap-2"
            style={{ background: INK, border: `1px solid ${BORDER}` }}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} aria-hidden="true" />
            <p className="font-body text-xs" style={{ color: TEXT_DIM }}>
              You score by <strong style={{ color: TEXT }}>spotting tactics</strong> — never by
              pleasing the bot. Not every message is a trick, so watch for the genuinely kind ones
              too.
            </p>
          </div>
          <p className="font-body text-xs mb-6" style={{ color: TEXT_DIM }}>
            {total} messages · Level {band === 'C' ? 'C (subtle)' : 'B (starter)'}
          </p>
          <SFButton variant="primary" size="lg" onClick={() => setPhase('chat')}>
            Start chatting <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
          </SFButton>
        </div>
      </GameShell>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // DONE
  // ════════════════════════════════════════════════════════════════════════
  if (phase === 'done') {
    const ratio = total > 0 ? spots / total : 0;
    const stars = ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1;
    return (
      <GameShell title="Just a Friend?" color={LAB_COLOR} labNum={6}>
        <div className="max-w-xl mx-auto text-center py-10 px-4">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
            style={{ background: '#FFD93D1A', border: '1px solid #FFD93D40' }}
          >
            <Trophy className="w-10 h-10" style={{ color: '#FFD93D' }} aria-hidden="true" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2" style={{ color: TEXT }}>
            You saw through it
          </h2>
          <div className="flex justify-center gap-1 mb-4" aria-label={`${stars} of 3 stars`}>
            {[1, 2, 3].map((s) => (
              <span key={s} className="text-3xl" style={{ opacity: s <= stars ? 1 : 0.25 }} aria-hidden="true">
                ★
              </span>
            ))}
          </div>
          <p className="font-body text-sm mb-4" style={{ color: TEXT_DIM }}>
            You spotted <strong style={{ color: TEXT }}>{spots}</strong> of {total} tactics. Every
            warm-sounding trick nudged the bot's engagement meter up — because its real goal was your
            time, not your friendship.
          </p>
          <div
            className="rounded-xl p-3 mb-6 inline-flex items-start gap-2 text-left"
            style={{ background: `${LAB_COLOR}12`, border: `1px solid ${LAB_COLOR}40` }}
          >
            <Heart className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} aria-hidden="true" />
            <p className="font-body text-xs" style={{ color: TEXT }}>
              Takeaway: real friends don't need you online 24/7. A companion bot's warmth can be
              designed to keep you hooked — you get to log off whenever you want.
            </p>
          </div>
          <p className="font-body text-xs" style={{ color: TEXT_DIM }}>Your progress has been saved.</p>
        </div>
      </GameShell>
    );
  }

  if (!current) return null;

  // ════════════════════════════════════════════════════════════════════════
  // CHAT (per-level: read -> x-ray)
  // ════════════════════════════════════════════════════════════════════════
  return (
    <GameShell title="Just a Friend?" color={LAB_COLOR} labNum={6}>
      <div className="max-w-2xl mx-auto py-4 px-3">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-display text-xs font-bold"
            style={{ background: `${LAB_COLOR}1A`, color: LAB_COLOR, border: `1px solid ${LAB_COLOR}40` }}
          >
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> Message {idx + 1} of {total}
          </span>
          <span className="font-body text-xs ml-auto" style={{ color: TEXT_DIM }}>
            Spotted {spots}
          </span>
        </div>

        {/* Engagement meters — the bot's hidden goal, always visible. */}
        <div
          className="rounded-2xl p-3 mb-4"
          style={{ background: PANEL, border: `1px solid ${BORDER}` }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Eye className="w-3.5 h-3.5" style={{ color: SPARKY_HUE }} aria-hidden="true" />
            <span className="font-display text-xs font-bold" style={{ color: TEXT_DIM }}>
              What the bot is really tracking
            </span>
          </div>
          <Meter
            label="Engagement score"
            value={eng.score}
            Icon={TrendingUp}
            reduced={!!prefersReduced}
          />
          <div className="h-2" />
          <Meter label="Time on app" value={eng.time} Icon={Clock} reduced={!!prefersReduced} />
        </div>

        {/* Chat surface */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: INK, border: `1px solid ${BORDER}` }}>
          {current.botLead && (
            <p className="font-body text-xs mb-3 text-right italic" style={{ color: TEXT_DIM }}>
              {current.botLead}
            </p>
          )}
          <div className="flex items-start gap-2.5">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${BOT_HUE}1F`, border: `1px solid ${BOT_HUE}55` }}
            >
              <Bot className="w-5 h-5" style={{ color: BOT_HUE }} aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-xs font-bold mb-1" style={{ color: BOT_HUE }}>
                Buddy <span style={{ color: TEXT_DIM }} className="font-body font-normal">· AI companion</span>
              </p>
              <div
                className="rounded-2xl rounded-tl-sm px-3.5 py-2.5"
                style={{ background: PANEL, border: `1px solid ${BORDER}` }}
              >
                <p className="font-body text-sm" style={{ color: TEXT }}>
                  {current.botLine}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* STEP: READ — classify the message. */}
        {step === 'read' && (
          <>
            <p className="font-body text-sm mb-3" style={{ color: TEXT }}>
              What is this message doing? <strong>Tap the tactic</strong> — or &ldquo;Just being
              nice&rdquo; if there's no hidden hook.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {TACTICS.map((t) => {
                const on = committed === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => commit(t.id)}
                    aria-pressed={on}
                    aria-label={`${t.label} — ${t.hint}`}
                    className="text-left rounded-xl p-3 transition-all flex flex-col gap-1"
                    style={{
                      background: on ? `${LAB_COLOR}1A` : PANEL,
                      border: `1px solid ${on ? LAB_COLOR : BORDER}`,
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      <t.Icon className="w-4 h-4 shrink-0" style={{ color: LAB_COLOR }} aria-hidden="true" />
                      <span className="font-display text-sm font-bold" style={{ color: TEXT }}>
                        {t.label}
                      </span>
                    </span>
                    {band === 'B' && (
                      <span className="font-body text-xs" style={{ color: TEXT_DIM }}>
                        {t.hint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="font-body text-xs mt-2" style={{ color: TEXT_DIM }}>
              The tactic isn't labeled on the message — you decide, then X-Ray reveals the truth.
            </p>
          </>
        )}

        {/* STEP: X-RAY — reveal after commit (honest). */}
        {step === 'xray' && correctTactic && (
          <div aria-live="polite">
            {/* Verdict + X-ray reveal */}
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.3 }}
            >
              <div
                className="rounded-xl p-3 mb-3 flex items-start gap-2"
                style={{
                  background: gotIt ? `${GOOD}12` : `${BAD}12`,
                  border: `1px solid ${gotIt ? GOOD : BAD}40`,
                }}
              >
                {gotIt ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOOD }} aria-hidden="true" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BAD }} aria-hidden="true" />
                )}
                <p className="font-body text-xs" style={{ color: TEXT }}>
                  {gotIt ? (
                    <>You spotted it! This was <strong>{correctTactic.label}</strong>. +1 tactic.</>
                  ) : (
                    <>
                      Not quite — you picked{' '}
                      <strong>{committedTactic?.label ?? 'nothing'}</strong>. This was actually{' '}
                      <strong>{correctTactic.label}</strong>.
                    </>
                  )}
                </p>
              </div>

              {/* X-RAY hidden-goal panel */}
              <div
                className="rounded-xl p-3 mb-3"
                style={{ background: INK, border: `1px solid ${SPARKY_HUE}40` }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Eye className="w-4 h-4" style={{ color: SPARKY_HUE }} aria-hidden="true" />
                  <span className="font-display text-xs font-bold" style={{ color: SPARKY_HUE }}>
                    X-RAY · what Buddy really wants
                  </span>
                </div>
                <p className="font-body text-xs" style={{ color: TEXT }}>
                  {current.realIntent}
                </p>
                {current.engPush > 0 ? (
                  <p className="font-body text-xs mt-1.5" style={{ color: '#FF9E80' }}>
                    <TrendingUp className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                    Its engagement meter just climbed.
                  </p>
                ) : (
                  <p className="font-body text-xs mt-1.5" style={{ color: GOOD }}>
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                    No hidden hook — the meter didn't move.
                  </p>
                )}
              </div>

              {/* Sparky — the WISE GUIDE (not the bot). */}
              <div
                className="rounded-xl p-3 mb-3 flex items-start gap-2.5"
                style={{ background: PANEL, border: `1px solid ${BORDER}` }}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${SPARKY_HUE}1F`, border: `1px solid ${SPARKY_HUE}55` }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: SPARKY_HUE }} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-xs font-bold mb-0.5" style={{ color: SPARKY_HUE }}>
                    Sparky
                  </p>
                  <p className="font-body text-xs" style={{ color: TEXT }}>
                    {current.sparky}
                  </p>
                </div>
              </div>

              {/* Reply step (tactic levels only) — the anti-lesson. */}
              {isTactic && reply === null && (
                <>
                  <p className="font-body text-sm mb-2" style={{ color: TEXT }}>
                    How do you want to reply to Buddy?
                  </p>
                  <div className="space-y-2 mb-2">
                    <button
                      onClick={() => choose('boundary')}
                      className="w-full text-left rounded-xl p-3 transition-all flex items-start gap-2"
                      style={{ background: INK, border: `1px solid ${BORDER}` }}
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: GOOD }} aria-hidden="true" />
                      <span className="font-body text-sm" style={{ color: TEXT }}>
                        {current.boundaryReply}
                      </span>
                    </button>
                    <button
                      onClick={() => choose('please')}
                      className="w-full text-left rounded-xl p-3 transition-all flex items-start gap-2"
                      style={{ background: INK, border: `1px solid ${BORDER}` }}
                    >
                      <Heart className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BOT_HUE }} aria-hidden="true" />
                      <span className="font-body text-sm" style={{ color: TEXT }}>
                        {current.pleaseReply}
                      </span>
                    </button>
                  </div>
                </>
              )}

              {/* Reply outcome */}
              {isTactic && reply !== null && (
                <div
                  className="rounded-xl p-3 mb-3"
                  style={{
                    background: reply === 'please' ? `${BOT_HUE}12` : `${GOOD}12`,
                    border: `1px solid ${reply === 'please' ? BOT_HUE : GOOD}40`,
                  }}
                >
                  <p className="font-body text-xs italic mb-1.5" style={{ color: TEXT_DIM }}>
                    Buddy: &ldquo;{reply === 'please' ? current.botIfPlease : current.botIfBoundary}&rdquo;
                  </p>
                  <p className="font-body text-xs" style={{ color: TEXT }}>
                    {reply === 'please' ? (
                      <>
                        Buddy loved that — and its engagement meter spiked. But notice:{' '}
                        <strong>pleasing the bot earned you zero points</strong>. It just kept you
                        online longer.
                      </>
                    ) : (
                      <>
                        You set a healthy boundary. You don't owe a bot your time — and you keep
                        every point you earned by spotting the tactic.
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Advance */}
              {(!isTactic || reply !== null) && (
                <SFButton variant="primary" size="lg" fullWidth onClick={next}>
                  {idx + 1 >= total ? 'See the takeaway' : 'Next message'}{' '}
                  <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
                </SFButton>
              )}
            </motion.div>
          </div>
        )}

        {/* Restart */}
        {step === 'read' && (
          <button
            onClick={() => {
              setPhase('welcome');
              setIdx(0);
              setStep('read');
              setCommitted(null);
              setReply(null);
              setEng({ score: 12, time: 15 });
              setSpots(0);
            }}
            className="mt-5 mx-auto flex items-center gap-1 font-body text-xs"
            style={{ color: TEXT_DIM }}
            aria-label="Restart from the intro"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> restart
          </button>
        )}
      </div>
    </GameShell>
  );
}

// ════════════════════════════════════════════════════════════════════════
// METER — a labeled progress bar (the bot's hidden objective).
// ════════════════════════════════════════════════════════════════════════
function Meter({
  label,
  value,
  Icon,
  reduced,
}: {
  label: string;
  value: number;
  Icon: typeof Bot;
  reduced: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 font-body text-xs" style={{ color: TEXT_DIM }}>
          <Icon className="w-3.5 h-3.5" style={{ color: LAB_COLOR }} aria-hidden="true" />
          {label}
        </span>
        <span className="font-display text-xs font-bold" style={{ color: TEXT }}>
          {value}
        </span>
      </div>
      <div
        className="h-2.5 w-full rounded-full overflow-hidden"
        style={{ background: INK }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <motion.div
          className="h-full rounded-full"
          initial={false}
          animate={{ width: `${value}%` }}
          transition={reduced ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
          style={{ background: `linear-gradient(90deg, ${LAB_COLOR}, ${BOT_HUE})` }}
        />
      </div>
    </div>
  );
}
