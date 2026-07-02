'use client';

import { useRef, useState } from 'react';

// ── Batch 2 (this workstream) ────────────────────────────────────
import ElectricBorder from '@/components/bits/ElectricBorder';
import ConfettiBurst from '@/components/bits/Confetti';
import AnimatedBeam from '@/components/bits/AnimatedBeam';
import Marquee from '@/components/bits/Marquee';
import CardSwap from '@/components/bits/CardSwap';
import MagicBento, { type BentoItem } from '@/components/bits/MagicBento';
import StickerPeel from '@/components/bits/StickerPeel';

// ── Batch 1 (parallel workstream — landed, imported directly) ────
import SplitText from '@/components/bits/SplitText';
import BlurText from '@/components/bits/BlurText';
import Orb from '@/components/bits/Orb';
import GlareHover from '@/components/bits/GlareHover';
import CoolMode from '@/components/bits/CoolMode';
import AuroraGalaxy from '@/components/bits/AuroraGalaxy';
import LightRays from '@/components/bits/LightRays';

// ── Shared section chrome ────────────────────────────────────────

const darkCardClass = 'rounded-xl border border-white/10 bg-white/[0.02] p-6';
const lightCardClass =
  'rounded-xl border border-slate-200 bg-white p-6 text-slate-900';
const buttonClass =
  'rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition-colors';
const activeButtonClass =
  'rounded-md border border-cyan-300/60 bg-cyan-300/10 px-3 py-1.5 text-sm text-cyan-100 transition-colors';
const lightButtonClass =
  'rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-200 transition-colors';

function SectionHeading({
  title,
  note,
  light = false,
}: {
  title: string;
  note?: string;
  light?: boolean;
}) {
  return (
    <div className="mb-4">
      <h2 className={`text-lg font-bold ${light ? 'text-slate-900' : 'text-white/90'}`}>
        {title}
      </h2>
      {note && (
        <p className={`mt-1 text-sm ${light ? 'text-slate-500' : 'text-white/50'}`}>
          {note}
        </p>
      )}
    </div>
  );
}

// ── Demo data ────────────────────────────────────────────────────

const MARQUEE_CHIPS = [
  'Neural Networks',
  'Prompt Lab',
  'Agentic AI',
  'Pattern Detective',
  'Data Shield',
  'Harness Forge',
  'MCP Plug-and-Play',
];

const CHIP_COLORS = ['#4DE9FF', '#E945F5', '#4F6EF7', '#FFD93D', '#2ECC71'];

const SWAP_CARD_STYLES = [
  { label: 'Lab 1 — AI Spy', from: '#0E7490', to: '#155E75' },
  { label: 'Lab 4 — Prompt Lab', from: '#7E22CE', to: '#581C87' },
  { label: 'Lab 7 — Data Shield', from: '#1D4ED8', to: '#1E3A8A' },
  { label: 'Lab 11 — Agent Atelier', from: '#0F766E', to: '#134E4A' },
];

function bentoCell(label: string, sub: string) {
  return (
    <div className="flex h-full flex-col justify-between bg-slate-50 p-4">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <span className="mt-2 text-xs text-slate-500">{sub}</span>
    </div>
  );
}

const BENTO_ITEMS: BentoItem[] = [
  {
    id: 'xp',
    colSpan: 2,
    glowColor: '#4DE9FF',
    content: bentoCell('XP Overview', 'colSpan 2 · glow #4DE9FF'),
  },
  { id: 'streak', glowColor: '#FFD93D', content: bentoCell('Streak', 'glow #FFD93D') },
  { id: 'badges', content: bentoCell('Badges', 'no glow — neutral border') },
  {
    id: 'labs',
    rowSpan: 2,
    glowColor: '#E945F5',
    content: bentoCell('Lab Progress', 'rowSpan 2 · glow #E945F5'),
  },
  { id: 'quests', content: bentoCell('Quests', 'auto placement (dense)') },
  {
    id: 'agents',
    colSpan: 2,
    glowColor: '#2ECC71',
    content: bentoCell('Agent Graph', 'colSpan 2 · glow #2ECC71'),
  },
];

// ── Page ─────────────────────────────────────────────────────────

export function DesignDevClient() {
  // ElectricBorder
  const [electricActive, setElectricActive] = useState(true);

  // Confetti
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // AnimatedBeam
  const beamContainerRef = useRef<HTMLDivElement>(null);
  const beamFromRef = useRef<HTMLDivElement>(null);
  const beamToRef = useRef<HTMLDivElement>(null);

  // Marquee
  const [marqueeReverse, setMarqueeReverse] = useState(false);

  // StickerPeel — key remount resets the interaction
  const [stickerKey, setStickerKey] = useState(0);
  const [stickerPeeled, setStickerPeeled] = useState(false);

  return (
    <main className="min-h-screen text-white/90" style={{ background: '#02050d' }}>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10">
          <h1 className="text-2xl font-black text-white">Design System · Dev Lab</h1>
          <p className="mt-2 text-sm text-cyan-200">
            Design-system QA — DESIGN.md §7.1
          </p>
          <p className="mt-1 text-sm text-white/50">
            All fourteen new bits components. Dark sections = marketing surfaces,
            light sections = dashboard surfaces. Toggle OS reduced-motion to QA the
            static fallbacks.
          </p>
        </header>

        {/* ════ MARKETING (dark) ════ */}

        {/* 1. SplitText */}
        <section className={`${darkCardClass} mb-8`}>
          <SectionHeading
            title="SplitText"
            note="Staggered word/char reveal. Full text exposed to screen readers once."
          />
          <div className="text-3xl font-black text-white">
            <SplitText text="Welcome to the Laboratory" />
          </div>
          <div className="mt-3 text-xl font-bold text-cyan-200">
            <SplitText text="char mode" by="char" stagger={0.06} />
          </div>
        </section>

        {/* 2. BlurText */}
        <section className={`${darkCardClass} mb-8`}>
          <SectionHeading
            title="BlurText"
            note="Whole-line blur-in on viewport entry (fires once)."
          />
          <p className="text-2xl font-bold text-white">
            <BlurText text="Signals resolve into knowledge." />
          </p>
        </section>

        {/* 3. Orb */}
        <section className={`${darkCardClass} mb-8`}>
          <SectionHeading
            title="Orb"
            note="Thinking/loading indicator. Three sizes, custom color on the right."
          />
          <div className="flex items-end gap-10">
            <Orb size={32} label="Loading, small" />
            <Orb size={64} label="Loading, medium" />
            <Orb size={96} label="Loading, large" />
            <Orb size={64} color="#E945F5" label="Loading, magenta" />
          </div>
        </section>

        {/* 4. GlareHover */}
        <section className={`${darkCardClass} mb-8`}>
          <SectionHeading
            title="GlareHover"
            note="Hover (mouse/pen) for the chrome glare sweep; keyboard focus gets the border glow."
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <GlareHover>
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                <h3 className="font-bold text-white">Default glow</h3>
                <p className="mt-2 text-sm text-white/60">Sweep restarts on each entry.</p>
              </div>
            </GlareHover>
            <GlareHover glowColor="#E945F5">
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                <h3 className="font-bold text-white">Magenta glow</h3>
                <p className="mt-2 text-sm text-white/60">glowColor=&quot;#E945F5&quot;</p>
              </div>
            </GlareHover>
          </div>
        </section>

        {/* 5. CoolMode */}
        <section className={`${darkCardClass} mb-8`}>
          <SectionHeading
            title="CoolMode"
            note="Click the button — particles pop from the click point."
          />
          <CoolMode>
            <button type="button" className={buttonClass}>
              Click me for particles
            </button>
          </CoolMode>
        </section>

        {/* 6. AuroraGalaxy */}
        <section className={`${darkCardClass} mb-8`}>
          <SectionHeading
            title="AuroraGalaxy"
            note="Merged marketing-dark background: aurora blobs + seeded star field."
          />
          <div className="relative overflow-hidden rounded-xl" style={{ height: 240 }}>
            <AuroraGalaxy className="absolute inset-0" />
            <div className="relative flex h-full items-center justify-center">
              <span className="text-xl font-bold text-white">Hero copy sits here</span>
            </div>
          </div>
        </section>

        {/* 7. LightRays */}
        <section className={`${darkCardClass} mb-8`}>
          <SectionHeading
            title="LightRays"
            note="Volumetric ray fan for the hologram hero — bottom-center origin."
          />
          <div
            className="relative overflow-hidden rounded-xl"
            style={{ height: 240, background: '#060B18' }}
          >
            <LightRays className="absolute inset-0" intensity={0.8} />
            <div className="relative flex h-full items-end justify-center pb-6">
              <span className="text-sm font-semibold text-cyan-200">
                rays fan from bottom-center
              </span>
            </div>
          </div>
        </section>

        {/* 8. Marquee */}
        <section className={`${darkCardClass} mb-8`}>
          <SectionHeading
            title="Marquee"
            note="Seamless -50% loop, duplicated children (second copy aria-hidden). Hover pauses."
          />
          <div className="mb-4">
            <button
              type="button"
              className={marqueeReverse ? activeButtonClass : buttonClass}
              onClick={() => setMarqueeReverse((v) => !v)}
              aria-pressed={marqueeReverse}
            >
              reverse: {marqueeReverse ? 'on' : 'off'}
            </button>
          </div>
          <Marquee speed={22} reverse={marqueeReverse}>
            {MARQUEE_CHIPS.map((chip, i) => (
              <span
                key={chip}
                className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  border: `1px solid ${CHIP_COLORS[i % CHIP_COLORS.length]}66`,
                  color: CHIP_COLORS[i % CHIP_COLORS.length],
                }}
              >
                {chip}
              </span>
            ))}
          </Marquee>
        </section>

        {/* 9. ElectricBorder */}
        <section className={`${darkCardClass} mb-8`}>
          <SectionHeading
            title="ElectricBorder"
            note="Traveling electric dash while active; static glow under reduced motion."
          />
          <div className="mb-4">
            <button
              type="button"
              className={electricActive ? activeButtonClass : buttonClass}
              onClick={() => setElectricActive((v) => !v)}
              aria-pressed={electricActive}
            >
              active: {electricActive ? 'on' : 'off'}
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <ElectricBorder active={electricActive}>
              <div className="rounded-2xl bg-slate-900 p-6">
                <h3 className="font-bold text-white">Cyan (default)</h3>
                <p className="mt-2 text-sm text-white/60">radius 16</p>
              </div>
            </ElectricBorder>
            <ElectricBorder active={electricActive} color="#E945F5" radius={24}>
              <div className="bg-slate-900 p-6" style={{ borderRadius: 24 }}>
                <h3 className="font-bold text-white">Magenta</h3>
                <p className="mt-2 text-sm text-white/60">radius 24</p>
              </div>
            </ElectricBorder>
          </div>
        </section>

        {/* 10. AnimatedBeam */}
        <section className={`${darkCardClass} mb-8`}>
          <SectionHeading
            title="AnimatedBeam"
            note="Lab-11 agent-graph connector — pulse travels the curve; recalculates on resize."
          />
          <div
            ref={beamContainerRef}
            className="relative flex items-center justify-between rounded-xl bg-slate-950 px-10"
            style={{ height: 180 }}
          >
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={beamFromRef}
              toRef={beamToRef}
              curvature={50}
            />
            <div
              ref={beamFromRef}
              className="relative z-10 flex items-center justify-center rounded-full border border-cyan-300/60 bg-slate-900 text-xs font-bold text-cyan-100"
              style={{ width: 72, height: 72 }}
            >
              Agent A
            </div>
            <div
              ref={beamToRef}
              className="relative z-10 flex items-center justify-center rounded-full border border-fuchsia-300/60 bg-slate-900 text-xs font-bold text-fuchsia-100"
              style={{ width: 72, height: 72 }}
            >
              Agent B
            </div>
          </div>
        </section>

        {/* ════ DASHBOARD (light) ════ */}

        {/* 11. ConfettiBurst */}
        <section className={`${lightCardClass} mb-8`}>
          <SectionHeading
            light
            title="ConfettiBurst"
            note="Earned-win celebration, pure DOM/motion. Reduced motion fires a single pop badge."
          />
          <button
            type="button"
            className={lightButtonClass}
            onClick={() => setConfettiTrigger((t) => t + 1)}
          >
            Fire confetti ({confettiTrigger})
          </button>
          <ConfettiBurst trigger={confettiTrigger} originY={0.35} />
        </section>

        {/* 12. CardSwap */}
        <section className={`${lightCardClass} mb-8`}>
          <SectionHeading
            light
            title="CardSwap"
            note="Click the stack, use the arrows, or focus it and press ArrowLeft/ArrowRight."
          />
          <div className="mx-auto" style={{ maxWidth: 360 }}>
            <CardSwap
              items={SWAP_CARD_STYLES.map((card) => (
                <div
                  key={card.label}
                  className="flex h-full items-center justify-center rounded-2xl text-lg font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${card.from}, ${card.to})`,
                  }}
                >
                  {card.label}
                </div>
              ))}
              height={200}
            />
          </div>
        </section>

        {/* 13. MagicBento */}
        <section className={`${lightCardClass} mb-8`}>
          <SectionHeading
            light
            title="MagicBento"
            note="Dense auto-fit grid with col/row spans, per-cell glow tints, and hover lift."
          />
          <MagicBento items={BENTO_ITEMS} minCell={160} />
        </section>

        {/* 14. StickerPeel */}
        <section className={lightCardClass}>
          <SectionHeading
            light
            title="StickerPeel"
            note="Drag the folded corner toward bottom-left (or click / Enter / Space) to peel."
          />
          <div className="flex items-center gap-8">
            <StickerPeel
              key={stickerKey}
              size={160}
              onPeeled={() => setStickerPeeled(true)}
              revealContent={
                <div className="flex h-full flex-col items-center justify-center bg-amber-100 text-amber-800">
                  <span className="text-3xl" aria-hidden="true">
                    🏆
                  </span>
                  <span className="mt-1 text-sm font-bold">Badge earned!</span>
                </div>
              }
            >
              <div
                className="flex h-full flex-col items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, #4F6EF7, #4DE9FF)' }}
              >
                <span className="text-3xl" aria-hidden="true">
                  ✦
                </span>
                <span className="mt-1 text-sm font-bold">Peel me</span>
              </div>
            </StickerPeel>
            <div className="flex flex-col items-start gap-2">
              <span className="text-sm text-slate-500">
                peeled: {stickerPeeled ? 'yes' : 'not yet'}
              </span>
              <button
                type="button"
                className={lightButtonClass}
                onClick={() => {
                  setStickerKey((k) => k + 1);
                  setStickerPeeled(false);
                }}
              >
                Reset sticker
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
