'use client';

// ════════════════════════════════════════════════════════════════
// CORE IGNITION — PromptForge (Forge F8, §12.4)
// ════════════════════════════════════════════════════════════════
// Per-band prompt input. Band A: tap-to-place chips (3 slots).
// Band B: template with two dropdown blanks. Band C: free text with
// a collapsible smith's guide. All controls ≥44px touch targets.

import { useMemo, useState } from 'react';
import { ForgeButton, HoloChip } from '@/components/forge';
import { GATE_META } from '@/types/coreIgnition';
import type { CoreIgnitionBand, GateScenario } from '@/types/coreIgnition';
import type { GateInput } from './scoring';

interface PromptForgeProps {
  band: CoreIgnitionBand;
  scenario: GateScenario;
  onForge: (input: GateInput) => void;
}

const SLOT_LABELS = { role: 'WHO helps', task: 'WHAT to do', detail: 'THE KEY DETAIL' } as const;

export function PromptForge({ band, scenario, onForge }: PromptForgeProps) {
  const meta = GATE_META[scenario.gateType];

  // ── Band A: chips ──
  const [slots, setSlots] = useState<{ role: string | null; task: string | null; detail: string | null }>({
    role: null,
    task: null,
    detail: null,
  });
  const [activeSlot, setActiveSlot] = useState<'role' | 'task' | 'detail'>('role');
  const chipOrder = useMemo(() => {
    // Stable shuffle by scenario id (deterministic, no Math.random at render).
    const chips = [...(scenario.chips ?? [])];
    const seed = scenario.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return chips.sort((a, b) => ((a.text.length * seed) % 7) - ((b.text.length * seed) % 7));
  }, [scenario]);

  // ── Band B: blanks ──
  const [blanks, setBlanks] = useState<[string | null, string | null]>([null, null]);

  // ── Band C: free text ──
  const [text, setText] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);

  if (band === 'A') {
    const placedTexts = Object.values(slots).filter(Boolean) as string[];
    const allFilled = slots.role && slots.task && slots.detail;
    return (
      <div className="space-y-4">
        {/* slots */}
        <div className="grid gap-2">
          {(['role', 'task', 'detail'] as const).map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => setActiveSlot(slot)}
              aria-pressed={activeSlot === slot}
              aria-label={`${SLOT_LABELS[slot]} slot${slots[slot] ? `, contains: ${slots[slot]}` : ', empty — select then tap a chip'}`}
              className="min-h-12 rounded-xl border-2 px-4 py-2 text-left text-sm font-medium transition-colors"
              style={{
                borderColor: activeSlot === slot ? 'rgb(var(--sf-primary) / 1)' : 'rgb(var(--sf-border) / 1)',
                borderStyle: slots[slot] ? 'solid' : 'dashed',
                backgroundColor: slots[slot] ? 'rgb(var(--sf-primary) / 0.1)' : 'rgb(var(--sf-surface-muted) / 0.5)',
                color: slots[slot] ? 'rgb(var(--sf-text-primary) / 1)' : 'rgb(var(--sf-text-muted) / 1)',
              }}
            >
              <span className="block text-[10px] font-display uppercase tracking-wider opacity-70">
                {SLOT_LABELS[slot]}
              </span>
              {slots[slot] ?? 'Tap a chip below…'}
            </button>
          ))}
        </div>
        {/* chips */}
        <div className="flex flex-wrap gap-2" role="group" aria-label="Prompt chips">
          {chipOrder.map((chip) => {
            const used = placedTexts.includes(chip.text);
            return (
              <button
                key={chip.text}
                type="button"
                disabled={used}
                onClick={() => {
                  setSlots((s) => ({ ...s, [activeSlot]: chip.text }));
                  setActiveSlot((cur) => (cur === 'role' ? 'task' : cur === 'task' ? 'detail' : 'detail'));
                }}
                className="min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-all disabled:opacity-30"
                style={{
                  borderColor: 'rgb(var(--sf-border) / 1)',
                  backgroundColor: 'rgb(var(--sf-surface-elevated) / 1)',
                  color: 'rgb(var(--sf-text-primary) / 1)',
                }}
              >
                {chip.text}
              </button>
            );
          })}
        </div>
        <ForgeButton
          variant="molten"
          size="lg"
          className="w-full"
          disabled={!allFilled}
          onClick={() => onForge({ kind: 'A', slots })}
        >
          ⚒ STRIKE
        </ForgeButton>
      </div>
    );
  }

  if (band === 'B') {
    const parts = (scenario.templateText ?? '___ ___').split('___');
    const ready = blanks[0] !== null && blanks[1] !== null;
    return (
      <div className="space-y-4">
        <p className="text-base leading-relaxed" style={{ color: 'rgb(var(--sf-text-primary) / 1)' }}>
          {parts[0]}
          <strong style={{ color: 'rgb(var(--sf-primary-light) / 1)' }}>{blanks[0] ?? '___'}</strong>
          {parts[1]}
          <strong style={{ color: 'rgb(var(--sf-primary-light) / 1)' }}>{blanks[1] ?? '___'}</strong>
          {parts[2] ?? ''}
        </p>
        {[0, 1].map((bi) => (
          <div key={bi} role="group" aria-label={`Options for blank ${bi + 1}`} className="flex flex-wrap gap-2">
            {(scenario.blankOptions?.[bi as 0 | 1] ?? []).map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={blanks[bi] === opt}
                onClick={() =>
                  setBlanks((b) => (bi === 0 ? [opt, b[1]] : [b[0], opt]) as [string | null, string | null])
                }
                className="min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-all"
                style={{
                  borderColor: blanks[bi] === opt ? 'rgb(var(--sf-primary) / 1)' : 'rgb(var(--sf-border) / 1)',
                  backgroundColor: blanks[bi] === opt ? 'rgb(var(--sf-primary) / 0.12)' : 'rgb(var(--sf-surface-elevated) / 1)',
                  color: 'rgb(var(--sf-text-primary) / 1)',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        ))}
        <ForgeButton
          variant="molten"
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={() => onForge({ kind: 'B', blanks: blanks as [string, string] })}
        >
          ⚒ STRIKE
        </ForgeButton>
      </div>
    );
  }

  // ── Band C ──
  const len = text.trim().length;
  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 220))}
        rows={3}
        aria-label="Write your prompt"
        placeholder="Forge your prompt here…"
        className="w-full rounded-xl border p-3 text-sm resize-none focus:outline-none focus:ring-2"
        style={{
          borderColor: 'rgb(var(--sf-border) / 1)',
          backgroundColor: 'rgb(var(--sf-surface-muted) / 0.6)',
          color: 'rgb(var(--sf-text-primary) / 1)',
          ['--tw-ring-color' as string]: 'rgb(var(--sf-border-focus) / 1)',
        }}
      />
      <div className="flex items-center justify-between text-xs" style={{ color: 'rgb(var(--sf-text-muted) / 1)' }}>
        <button type="button" onClick={() => setGuideOpen((g) => !g)} className="underline underline-offset-2 min-h-11">
          {guideOpen ? 'Hide' : 'Open'} smith&apos;s guide
        </button>
        <span className="tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>{len}/220</span>
      </div>
      {guideOpen && (
        <div className="flex flex-wrap gap-2" aria-label="Ingredient hints">
          <HoloChip tone="amber">a clear task verb</HoloChip>
          <HoloChip tone="cyan">{GATE_META[scenario.gateType].ingredient}</HoloChip>
          <HoloChip tone="green">who/what it&apos;s for</HoloChip>
        </div>
      )}
      <ForgeButton
        variant="molten"
        size="lg"
        className="w-full"
        disabled={len < 8}
        onClick={() => onForge({ kind: 'C', text })}
      >
        ⚒ STRIKE
      </ForgeButton>
      <p className="sr-only">{meta.name} gate: your prompt needs {meta.ingredient}.</p>
    </div>
  );
}
