'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  SparkyCore,
  SparkyFloating,
  SparkyPresenter,
  EXPRESSIONS,
  type SparkyExpression,
  type SparkySize,
} from '@/components/sparky';

// Rive runs client-only (WASM) — same dynamic pattern as JuiceProvider.
const SparkyRive = dynamic(() => import('@/components/sparky/SparkyRive'), {
  ssr: false,
});

const ALL_EXPRESSIONS = Object.keys(EXPRESSIONS) as SparkyExpression[];

// Matches SIZE_MAP in SparkyCore.tsx.
const SIZES: ReadonlyArray<{ id: SparkySize; px: number }> = [
  { id: 'sm', px: 40 },
  { id: 'md', px: 72 },
  { id: 'lg', px: 120 },
  { id: 'xl', px: 192 },
];

function SectionHeading({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold text-white/90">{title}</h2>
      {note && <p className="mt-1 text-sm text-white/50">{note}</p>}
    </div>
  );
}

const cardClass =
  'rounded-xl border border-white/10 bg-white/[0.02] p-6';
const buttonClass =
  'rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 transition-colors';
const activeButtonClass =
  'rounded-md border border-cyan-300/60 bg-cyan-300/10 px-3 py-1.5 text-sm text-cyan-100 transition-colors';

export function SparkyDevClient() {
  // Presenter demo
  const [presenterIdx, setPresenterIdx] = useState(1); // start on 'happy'

  // Floating demo
  const [showFloating, setShowFloating] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Rive demo controls
  const [comboTier, setComboTier] = useState(0);
  const [celebrate, setCelebrate] = useState(0);
  const [encourage, setEncourage] = useState(0);
  const [thinking, setThinking] = useState(false);

  const presenterExpression = ALL_EXPRESSIONS[presenterIdx % ALL_EXPRESSIONS.length];

  return (
    <main className="min-h-screen bg-[#02050d] text-white/90">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10">
          <h1 className="text-2xl font-black text-white">Sparky Mascot · Dev Lab</h1>
          <p className="mt-2 text-sm text-white/50">
            Visual checkpoint for the Sparky component system. In gameplay, the reactive
            Rive mascot mounts automatically inside GameShell via JuiceProvider.
          </p>
        </header>

        {/* ═══ 1. Expression grid ═══ */}
        <section className={`${cardClass} mb-8`}>
          <SectionHeading
            title="SparkyCore — 9 expressions"
            note="md size. Glow color per expression from the EXPRESSIONS config."
          />
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-5">
            {ALL_EXPRESSIONS.map((expr) => (
              <div key={expr} className="flex flex-col items-center gap-2">
                <SparkyCore expression={expr} size="md" />
                <span className="text-xs font-medium text-white/70">{expr}</span>
                <span className="font-mono text-white/50" style={{ fontSize: 10 }}>
                  {EXPRESSIONS[expr].glowColor}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 2. Size row ═══ */}
        <section className={`${cardClass} mb-8`}>
          <SectionHeading
            title="Sizes"
            note="Expression 'happy' at all four SparkySize values."
          />
          <div className="flex flex-wrap items-end gap-8">
            {SIZES.map(({ id, px }) => (
              <div key={id} className="flex flex-col items-center gap-2">
                <SparkyCore expression="happy" size={id} />
                <span className="text-xs font-medium text-white/70">
                  {id} · {px}px
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ 3. SparkyFloating ═══ */}
        <section className={`${cardClass} mb-8`}>
          <SectionHeading
            title="SparkyFloating"
            note="Fixed bottom-right assistant with quick-tip bubble. Toggle to mount it on this page."
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={showFloating ? activeButtonClass : buttonClass}
              onClick={() => setShowFloating((v) => !v)}
            >
              {showFloating ? 'Unmount floating Sparky' : 'Mount floating Sparky'}
            </button>
            {showFloating && (
              <span className="text-xs text-white/50">
                chat {chatOpen ? 'open' : 'closed'} — click the orb (bottom-right of the
                viewport) to toggle
              </span>
            )}
          </div>
          {showFloating && (
            <SparkyFloating
              expression={chatOpen ? 'speaking' : 'idle'}
              isChatOpen={chatOpen}
              onClick={() => setChatOpen((v) => !v)}
              quickTip="Hi! I'm Sparky — this is my floating assistant mode."
              pulseAttention={!chatOpen}
            />
          )}
        </section>

        {/* ═══ 4. SparkyPresenter ═══ */}
        <section className={`${cardClass} mb-8`}>
          <SectionHeading
            title="SparkyPresenter"
            note="Mission / announcement wrapper with speech bubble."
          />
          <div className="mb-4">
            <button
              type="button"
              className={buttonClass}
              onClick={() => setPresenterIdx((i) => i + 1)}
            >
              Cycle expression → {presenterExpression}
            </button>
          </div>
          <div className="flex justify-center py-4">
            <SparkyPresenter
              expression={presenterExpression}
              message="Ready for today's mission? Let's explore how AI learns from examples — I'll be right here if you get stuck!"
              missionType="daily"
              actionLabel="Start Mission"
              onAction={() => undefined}
            />
          </div>
        </section>

        {/* ═══ 5. SparkyRive ═══ */}
        <section className={cardClass}>
          <SectionHeading
            title="SparkyRive — reactive game mascot"
            note="Bound to the GameJuiceEngine in gameplay (GameShell → JuiceProvider)."
          />
          <p className="mb-4 rounded-md border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100/90">
            Renders the procedural fallback orb until <code>public/rive/sparky.riv</code>{' '}
            exists. Authoring contract: state machine <code>SparkyMachine</code> — see{' '}
            <code>docs/SPARKY-RIVE-SPEC.md</code>. These controls exercise the exact
            inputs the juice system drives in-game.
          </p>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40 p-6">
              <SparkyRive
                comboTier={comboTier}
                celebrate={celebrate}
                encourage={encourage}
                thinking={thinking}
                size={120}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  comboTier (Number 0–3)
                </span>
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      className={tier === comboTier ? activeButtonClass : buttonClass}
                      onClick={() => setComboTier(tier)}
                      aria-pressed={tier === comboTier}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Triggers
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => setCelebrate((n) => n + 1)}
                  >
                    Fire celebrate ({celebrate})
                  </button>
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => setEncourage((n) => n + 1)}
                  >
                    Fire encourage ({encourage})
                  </button>
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  thinking (Boolean)
                </span>
                <button
                  type="button"
                  className={thinking ? activeButtonClass : buttonClass}
                  onClick={() => setThinking((v) => !v)}
                  aria-pressed={thinking}
                >
                  thinking: {thinking ? 'true' : 'false'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
