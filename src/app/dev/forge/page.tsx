'use client';

// ════════════════════════════════════════════════════════════════
// /dev/forge — Forge F1 primitive showcase (Concept 10 §4.11)
// ════════════════════════════════════════════════════════════════
// Dev-only demo route rendering every forge primitive in every
// variant. This is the F1 owner-checkpoint surface (HS-5 pattern).
// Later phases append sections (F7 adds the mascot wall).

import { useState } from 'react';
import {
  ForgePanel,
  ForgeButton,
  MoltenProgress,
  ForgeDial,
  HoloChip,
  CircuitTraces,
  EmberField,
  SparkBurst,
  HeatShimmer,
} from '@/components/forge';
import { FEATURE_FLAGS } from '@/config/feature-flags';
import { ForgeSparkCore } from '@/components/sparky/ForgeSparkCore';

export default function ForgeDevPage() {
  const [progress, setProgress] = useState(0.35);
  const [burst, setBurst] = useState(0);

  return (
    <main
      className="relative min-h-screen px-6 py-10 space-y-10"
      style={{
        backgroundColor: 'rgb(var(--sf-surface-alt) / 1)',
        color: 'rgb(var(--sf-text-primary) / 1)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Ambient budget demo: ONE traces layer + ONE ember field */}
      <CircuitTraces
        density="low"
        className="fixed inset-0 w-full h-full opacity-40 -z-0"
      />
      <EmberField className="fixed inset-0 -z-0" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-10">
        <header>
          <h1
            className="font-display text-3xl font-bold"
            style={{ textShadow: 'var(--glow-text, none)' }}
          >
            Forge Primitives — F1 Showcase
          </h1>
          <p className="text-sm mt-2" style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}>
            FORGE_THEME: {String(FEATURE_FLAGS.FORGE_THEME)} · FORGE_AMBIENCE:{' '}
            {String(FEATURE_FLAGS.FORGE_AMBIENCE)} — toggle via NEXT_PUBLIC_FORGE_*
          </p>
        </header>

        {/* ── Panels ── */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">ForgePanel</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {(['glass', 'alloy', 'holo'] as const).map((v) => (
              <ForgePanel key={v} variant={v} glow="ambient" className="p-5">
                <h3 className="font-display font-semibold capitalize">{v}</h3>
                <p className="text-sm mt-1" style={{ color: 'rgb(var(--sf-text-secondary) / 1)' }}>
                  Bezel on, ambient glow. Body text stays AA on every surface.
                </p>
              </ForgePanel>
            ))}
          </div>
          <ForgePanel variant="glass" glow="active" animateIn className="p-5">
            <p className="text-sm">glow=&quot;active&quot; + animateIn (magnetic snap entry)</p>
          </ForgePanel>
        </section>

        {/* ── Buttons ── */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">ForgeButton</h2>
          <div className="flex flex-wrap items-center gap-3">
            <ForgeButton variant="molten" size="lg">Ignite</ForgeButton>
            <ForgeButton variant="molten">Forge it</ForgeButton>
            <ForgeButton variant="alloy">Alloy</ForgeButton>
            <ForgeButton variant="ghost">Ghost</ForgeButton>
            <ForgeButton variant="danger">Danger</ForgeButton>
            <ForgeButton variant="molten" size="sm" disabled>Disabled</ForgeButton>
          </div>
        </section>

        {/* ── Progress ── */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">MoltenProgress</h2>
          <div className="space-y-4 max-w-md">
            <MoltenProgress value={progress} label="Demo progress" />
            <MoltenProgress value={-1} label="Forging" />
            <MoltenProgress value={1} label="Complete (tempered)" />
            <div className="flex gap-2">
              <ForgeButton variant="alloy" size="sm" onClick={() => setProgress((p) => Math.max(0, p - 0.15))}>
                −15%
              </ForgeButton>
              <ForgeButton variant="alloy" size="sm" onClick={() => setProgress((p) => Math.min(1, p + 0.15))}>
                +15%
              </ForgeButton>
            </div>
          </div>
        </section>

        {/* ── Dials & chips ── */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">ForgeDial + HoloChip</h2>
          <div className="flex flex-wrap items-center gap-6">
            <ForgeDial value={0.72} label="Lab completion">
              <span className="font-mono text-xs font-bold">72%</span>
            </ForgeDial>
            <ForgeDial value={0.3} size={48} thickness={5} label="Quest progress">
              <span className="font-mono text-[10px]">3/10</span>
            </ForgeDial>
            <ForgeDial value={1} size={80} thickness={8} color="rgb(var(--sf-accent-green) / 1)" label="Mastered">
              <span className="text-xl">✓</span>
            </ForgeDial>
            <div className="flex flex-wrap gap-2">
              <HoloChip tone="amber">Flagship</HoloChip>
              <HoloChip tone="cyan">AI Content</HoloChip>
              <HoloChip tone="green">Powered</HoloChip>
              <HoloChip tone="neutral">Lab 3</HoloChip>
            </div>
          </div>
        </section>

        {/* ── ForgeSpark mascot wall (F7) ── */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">ForgeSpark — all 9 expressions</h2>
          <div className="flex flex-wrap gap-6 items-end">
            {(['idle', 'happy', 'thinking', 'speaking', 'excited', 'sleepy', 'sad', 'celebrating', 'surprised'] as const).map(
              (exp) => (
                <div key={exp} className="text-center space-y-1">
                  <ForgeSparkCore expression={exp} size="lg" />
                  <p className="text-xs" style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}>{exp}</p>
                </div>
              )
            )}
          </div>
          <div className="flex gap-6 items-end">
            {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
              <div key={s} className="text-center space-y-1">
                <ForgeSparkCore expression="happy" size={s} />
                <p className="text-xs" style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}>{s}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Burst + shimmer ── */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">SparkBurst + HeatShimmer</h2>
          <div className="flex items-center gap-8">
            <div className="relative">
              <ForgeButton variant="alloy" onClick={() => setBurst((b) => b + 1)}>
                Fire burst
              </ForgeButton>
              <SparkBurst fire={burst} count={20} />
            </div>
            <HeatShimmer>
              <span className="text-4xl" role="img" aria-label="Fire (hover for heat shimmer on desktop)">
                🔥
              </span>
            </HeatShimmer>
          </div>
        </section>
      </div>
    </main>
  );
}
