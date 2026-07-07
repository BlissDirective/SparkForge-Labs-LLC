// ════════════════════════════════════════════════════════════════════════
// NEURON RELAY v5 — Lab 3 (The Brain Inside) — WEIGHTED-SUM redesign
// ════════════════════════════════════════════════════════════════════════
// Audit §II.4 #9 (REDESIGN): the old build made kids DRAG A SINGLE PATH from
// Input to Output — "find the one true route" — with decoys pre-labelled dead.
// That teaches a MISCONCEPTION. A real neuron does not route one signal down
// one wire; EVERY incoming connection is active, each carries the input times
// a WEIGHT, and the neuron FIRES when the weighted SUM crosses a THRESHOLD.
//
// v5 is the honest model. The child does not route — they TUNE. Every wire is
// live and carries signal × a visible, adjustable weight. Each neuron shows a
// live meter of its running weighted sum against its threshold. The child
// nudges the weights (keyboard-operable steppers) until the OUTPUT neuron
// fires correctly for every test input in the truth table — pink weights
// excite, blue weights inhibit. Band C unlocks a real BACKPROP hint: it reads
// the errors on the failing tests and shows, per weight, the gradient SIGN —
// which way to nudge each weight to fix the misses (dim = turn it down).
//
// HONESTY (G1): firing is the actual computation — sum(value_i × weight_i) ≥
// threshold, step activation, recomputed live. No wire is a decoy; no answer
// is painted on the board. The backprop arrows are the real perceptron /
// chain-rule gradient sign, not a script.
//
// NOTE: the Pixi CONNECT stage (PixiConnectStage) is DROPPED here — this game
// is now pure DOM (SVG diagram + HTML controls). PixiConnectStage stays in the
// repo for the other CONNECT games; only Neuron Relay stops importing it.

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ChevronRight, Zap, ZapOff, GraduationCap, Target, Minus, Plus,
  ArrowUp, ArrowDown, RotateCcw, Sparkles, Brain, Activity, Check, X,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';
import { GlowingTitle } from '@/components/games/shared/GameVisualKit';

const LAB_COLOR = '#FF70AF';

// Dark control-station palette (this game is a signal workbench).
const INK = '#0E1018';
const PANEL = '#161A26';
const PANEL_HI = '#1F2432';
const TEXT = '#EEF1FB';
const TEXT_DIM = '#AEB6D0';
const TEXT_FAINT = '#7F87A3';
const EXCITE = '#FF70AF'; // positive weight — pushes toward firing
const INHIBIT = '#4DA6FF'; // negative weight — pushes away from firing
const FIRE = '#5DE1A6'; // a neuron that is firing
const MISS = '#FF5D5D';

type Band = 'A' | 'B' | 'C';
const BAND_ORDER: Record<Band, number> = { A: 0, B: 1, C: 2 };

// ════════════════════════════════════════════════════════════════════════
// NETWORK SPECS — the honest little networks. Every wire is active; the child
// tunes the unlocked weights so the output neuron fires per the truth table.
// ════════════════════════════════════════════════════════════════════════
interface InputSpec { id: string; label: string; }
interface NeuronSpec { id: string; label: string; threshold: number; kind: 'hidden' | 'output'; }
interface WireSpec { id: string; from: string; to: string; init: number; locked?: boolean; }
interface TestCase { inputs: Record<string, number>; expect: boolean; }
interface NetSpec {
  inputs: InputSpec[];
  neurons: NeuronSpec[];
  wires: WireSpec[];
  tests: TestCase[];
  range: [number, number];
}

const NETS: Record<number, NetSpec> = {
  // L1 — one input, one weight. Raise the weight until the sum reaches 2.
  1: {
    inputs: [{ id: 'x', label: 'Signal' }],
    neurons: [{ id: 'out', label: 'Neuron', threshold: 2, kind: 'output' }],
    wires: [{ id: 'w1', from: 'x', to: 'out', init: 0 }],
    tests: [
      { inputs: { x: 0 }, expect: false },
      { inputs: { x: 1 }, expect: true },
    ],
    range: [-3, 3],
  },
  // L2 — one weight, a strong vs weak signal. Fire on bright (2), stay quiet on
  // dim (1). The weight has to land the sum on the right side of threshold 3.
  2: {
    inputs: [{ id: 'x', label: 'Signal' }],
    neurons: [{ id: 'out', label: 'Neuron', threshold: 3, kind: 'output' }],
    wires: [{ id: 'w1', from: 'x', to: 'out', init: 0 }],
    tests: [
      { inputs: { x: 1 }, expect: false },
      { inputs: { x: 2 }, expect: true },
    ],
    range: [-3, 3],
  },
  // L3 — two inputs, fire only when BOTH are on (AND) via weights + threshold.
  3: {
    inputs: [{ id: 'a', label: 'Input A' }, { id: 'b', label: 'Input B' }],
    neurons: [{ id: 'out', label: 'Neuron', threshold: 2, kind: 'output' }],
    wires: [
      { id: 'wa', from: 'a', to: 'out', init: 0 },
      { id: 'wb', from: 'b', to: 'out', init: 0 },
    ],
    tests: [
      { inputs: { a: 0, b: 0 }, expect: false },
      { inputs: { a: 1, b: 0 }, expect: false },
      { inputs: { a: 0, b: 1 }, expect: false },
      { inputs: { a: 1, b: 1 }, expect: true },
    ],
    range: [-3, 3],
  },
  // L4 — two inputs, fire when EITHER is on (OR).
  4: {
    inputs: [{ id: 'a', label: 'Input A' }, { id: 'b', label: 'Input B' }],
    neurons: [{ id: 'out', label: 'Neuron', threshold: 2, kind: 'output' }],
    wires: [
      { id: 'wa', from: 'a', to: 'out', init: 0 },
      { id: 'wb', from: 'b', to: 'out', init: 0 },
    ],
    tests: [
      { inputs: { a: 0, b: 0 }, expect: false },
      { inputs: { a: 1, b: 0 }, expect: true },
      { inputs: { a: 0, b: 1 }, expect: true },
      { inputs: { a: 1, b: 1 }, expect: true },
    ],
    range: [-3, 3],
  },
  // L5 — hidden layer. h1 detects "either" and h2 detects "both" (their input
  // weights are locked). The child tunes the two hidden→output weights so the
  // neuron fires only when the inputs DIFFER (XOR) — which forces a NEGATIVE
  // (inhibiting) weight on the "both" detector. One neuron alone can't do this.
  5: {
    inputs: [{ id: 'a', label: 'Input A' }, { id: 'b', label: 'Input B' }],
    neurons: [
      { id: 'h1', label: 'Either', threshold: 1, kind: 'hidden' },
      { id: 'h2', label: 'Both', threshold: 2, kind: 'hidden' },
      { id: 'out', label: 'Neuron', threshold: 1, kind: 'output' },
    ],
    wires: [
      { id: 'a_h1', from: 'a', to: 'h1', init: 1, locked: true },
      { id: 'b_h1', from: 'b', to: 'h1', init: 1, locked: true },
      { id: 'a_h2', from: 'a', to: 'h2', init: 1, locked: true },
      { id: 'b_h2', from: 'b', to: 'h2', init: 1, locked: true },
      { id: 'h1_out', from: 'h1', to: 'out', init: 0 },
      { id: 'h2_out', from: 'h2', to: 'out', init: 0 },
    ],
    tests: [
      { inputs: { a: 0, b: 0 }, expect: false },
      { inputs: { a: 1, b: 0 }, expect: true },
      { inputs: { a: 0, b: 1 }, expect: true },
      { inputs: { a: 1, b: 1 }, expect: false },
    ],
    range: [-3, 3],
  },
  // L6 — Backprop Rescue (Band C). Three inputs, fire when at least TWO are on
  // (majority). The network arrives MISWIRED and gets two tests wrong. Turn on
  // the backprop hint: it reads the errors and marks which way to nudge each
  // weight. Follow the arrows down to wa=wb=wc=1 and every test fires right.
  6: {
    inputs: [
      { id: 'a', label: 'Input A' },
      { id: 'b', label: 'Input B' },
      { id: 'c', label: 'Input C' },
    ],
    neurons: [{ id: 'out', label: 'Neuron', threshold: 2, kind: 'output' }],
    wires: [
      { id: 'wa', from: 'a', to: 'out', init: 3 },
      { id: 'wb', from: 'b', to: 'out', init: -1 },
      { id: 'wc', from: 'c', to: 'out', init: 0 },
    ],
    tests: [
      { inputs: { a: 0, b: 0, c: 0 }, expect: false },
      { inputs: { a: 1, b: 0, c: 0 }, expect: false },
      { inputs: { a: 0, b: 1, c: 1 }, expect: true },
      { inputs: { a: 1, b: 1, c: 0 }, expect: true },
      { inputs: { a: 1, b: 1, c: 1 }, expect: true },
    ],
    range: [-3, 3],
  },
};

interface LevelDef extends LevelConfig { minBand: Band; net: NetSpec; backpropFocus?: boolean; }

const ALL_LEVELS: LevelDef[] = [
  { id: 1, name: 'One Neuron', description: 'Turn a signal up until the neuron fires.', emoji: '⚡', difficulty: 'easy', starThresholds: [1, 2, 2], xpReward: 50, minBand: 'A', net: NETS[1] },
  { id: 2, name: 'Threshold', description: 'Fire on a bright signal, stay quiet on a dim one.', emoji: '📈', difficulty: 'easy', starThresholds: [1, 2, 2], xpReward: 60, minBand: 'A', net: NETS[2] },
  { id: 3, name: 'Fire on Both', description: 'Weight two inputs so it only fires when BOTH arrive.', emoji: '🔗', difficulty: 'medium', starThresholds: [2, 3, 4], xpReward: 80, minBand: 'B', net: NETS[3] },
  { id: 4, name: 'Fire on Either', description: 'Now make it fire when EITHER input arrives.', emoji: '🔀', difficulty: 'medium', starThresholds: [2, 3, 4], xpReward: 90, minBand: 'B', net: NETS[4] },
  { id: 5, name: 'Hidden Layer', description: 'Fire only when the inputs DIFFER — needs a hidden layer.', emoji: '🧠', difficulty: 'hard', starThresholds: [2, 3, 4], xpReward: 120, minBand: 'B', net: NETS[5] },
  { id: 6, name: 'Backprop Rescue', description: 'The network is trained wrong. Let backprop show you the fix.', emoji: '🛠️', difficulty: 'expert', starThresholds: [3, 4, 5], xpReward: 160, minBand: 'C', net: NETS[6], backpropFocus: true },
];

const CONCEPTS: Record<number, string> = {
  1: 'A neuron adds up each input times its weight. When that total reaches the neuron\'s threshold, the neuron fires.',
  2: 'A bigger signal makes a bigger total. The weight decides how much a signal counts — enough to cross the threshold, or not.',
  3: 'Every wire is active at once. To fire only on BOTH inputs, weight each one so neither alone reaches the threshold, but together they do.',
  4: 'Same two live wires — but heavier weights let a single input reach the threshold on its own, so either one fires the neuron.',
  5: 'One neuron cannot fire "only when they differ". A hidden layer builds it: a NEGATIVE weight lets the "both" detector cancel the signal.',
  6: 'Backpropagation looks at what the network got wrong and points each weight the way that lowers the error. Follow the arrows and the misses vanish.',
};

// ════════════════════════════════════════════════════════════════════════
// HONEST ENGINE — forward pass + gradient sign. Pure functions of the weights.
// ════════════════════════════════════════════════════════════════════════
const layerRank = (n: NeuronSpec) => (n.kind === 'output' ? 1 : 0);

interface EvalResult {
  value: Record<string, number>; // post-activation value per node (inputs pass raw)
  sum: Record<string, number>;   // weighted sum reaching each neuron
  fired: Record<string, boolean>;
}

function evaluateNet(net: NetSpec, weights: Record<string, number>, inputs: Record<string, number>): EvalResult {
  const value: Record<string, number> = {};
  const sum: Record<string, number> = {};
  const fired: Record<string, boolean> = {};
  for (const inp of net.inputs) value[inp.id] = inputs[inp.id] ?? 0;
  const ordered = [...net.neurons].sort((a, b) => layerRank(a) - layerRank(b));
  for (const n of ordered) {
    let s = 0;
    for (const w of net.wires) {
      if (w.to === n.id) s += (value[w.from] ?? 0) * (weights[w.id] ?? 0);
    }
    sum[n.id] = s;
    const f = s >= n.threshold;
    fired[n.id] = f;
    value[n.id] = f ? 1 : 0; // step activation — a firing neuron passes 1 downstream
  }
  return { value, sum, fired };
}

const outputNeuron = (net: NetSpec) => net.neurons.find((n) => n.kind === 'output')!;

/**
 * Gradient SIGN per wire, summed over the test set. Positive → nudge the weight
 * UP; negative → nudge it DOWN; zero → leave it. This is the perceptron update
 * (Δw = error × input) at the output, chained back through the output weights to
 * the hidden wires — the honest direction a trainer would move each weight.
 */
function gradientSigns(net: NetSpec, weights: Record<string, number>): Record<string, number> {
  const out = outputNeuron(net);
  const grad: Record<string, number> = {};
  for (const w of net.wires) grad[w.id] = 0;

  for (const t of net.tests) {
    const ev = evaluateNet(net, weights, t.inputs);
    const errOut = (t.expect ? 1 : 0) - (ev.fired[out.id] ? 1 : 0); // -1 | 0 | 1

    // Wires feeding the output neuron.
    for (const w of net.wires) {
      if (w.to === out.id) grad[w.id] += errOut * (ev.value[w.from] ?? 0);
    }
    // Wires feeding a hidden neuron: chain the error through its output weight.
    for (const h of net.neurons.filter((n) => n.kind === 'hidden')) {
      const wHO = net.wires.find((w) => w.from === h.id && w.to === out.id);
      const deltaH = errOut * (weights[wHO?.id ?? ''] ?? 0);
      for (const w of net.wires) {
        if (w.to === h.id) grad[w.id] += deltaH * (ev.value[w.from] ?? 0);
      }
    }
  }
  const sign: Record<string, number> = {};
  for (const w of net.wires) sign[w.id] = Math.sign(grad[w.id]);
  return sign;
}

// Largest signal value any input reaches across the tests — for meter scaling.
function srcMax(net: NetSpec, id: string): number {
  if (net.neurons.some((n) => n.id === id)) return 1; // a neuron passes 0 or 1
  let m = 1;
  for (const t of net.tests) m = Math.max(m, Math.abs(t.inputs[id] ?? 0));
  return m;
}

function neuronSpan(net: NetSpec, neuron: NeuronSpec): number {
  const [lo, hi] = net.range;
  const wMax = Math.max(Math.abs(lo), Math.abs(hi));
  let span = 0;
  for (const w of net.wires) {
    if (w.to === neuron.id) span += wMax * srcMax(net, w.from);
  }
  return Math.max(span, Math.abs(neuron.threshold), 1);
}

// ════════════════════════════════════════════════════════════════════════
// SVG NETWORK DIAGRAM — structure + live firing + weight labels + hints
// ════════════════════════════════════════════════════════════════════════
const VB_W = 100;
const VB_H = 66;

function nodePositions(net: NetSpec): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {};
  const place = (ids: string[], x: number) => {
    ids.forEach((id, i) => {
      const y = ((i + 1) / (ids.length + 1)) * VB_H;
      pos[id] = { x, y };
    });
  };
  place(net.inputs.map((n) => n.id), 14);
  const hidden = net.neurons.filter((n) => n.kind === 'hidden');
  const outputs = net.neurons.filter((n) => n.kind === 'output');
  if (hidden.length) place(hidden.map((n) => n.id), 50);
  place(outputs.map((n) => n.id), 86);
  return pos;
}

function weightColor(w: number): string {
  if (w > 0) return EXCITE;
  if (w < 0) return INHIBIT;
  return TEXT_FAINT;
}

function NetworkDiagram({
  net, weights, ev, hints, reduced,
}: {
  net: NetSpec; weights: Record<string, number>; ev: EvalResult;
  hints: Record<string, number> | null; reduced: boolean;
}) {
  const pos = useMemo(() => nodePositions(net), [net]);
  const labelFor = (id: string) =>
    net.inputs.find((n) => n.id === id)?.label ?? net.neurons.find((n) => n.id === id)?.label ?? id;

  const out = outputNeuron(net);
  const ariaSummary = `Network diagram. ${out.label} weighted sum is ${ev.sum[out.id]}, threshold ${out.threshold}. It is ${ev.fired[out.id] ? 'firing' : 'quiet'}.`;

  return (
    <div style={{ width: '100%', height: 210, borderRadius: 16, background: INK, border: `1px solid ${PANEL_HI}` }}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label={ariaSummary}>
        {/* wires */}
        {net.wires.map((w) => {
          const a = pos[w.from]; const b = pos[w.to];
          const wv = weights[w.id] ?? 0;
          const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2;
          const col = weightColor(wv);
          const active = (ev.value[w.from] ?? 0) !== 0 && wv !== 0;
          const hint = hints ? hints[w.id] : 0;
          return (
            <g key={w.id}>
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={col}
                strokeWidth={0.5 + Math.min(2, Math.abs(wv)) * 0.8}
                strokeOpacity={w.locked ? 0.5 : active ? 0.95 : 0.4}
                strokeDasharray={w.locked ? '2 1.5' : undefined}
              />
              {/* weight badge */}
              <rect x={mx - 4.6} y={my - 3} width={hint ? 12 : 9.2} height={6} rx={3} fill={PANEL} stroke={col} strokeWidth={0.4} />
              <text x={mx - (hint ? 1.4 : 0)} y={my + 1.4} textAnchor="middle" fontSize={4} fontWeight={700} fill={col}>
                {wv > 0 ? `+${wv}` : wv}
              </text>
              {hint ? (
                <text x={mx + 4.4} y={my + 1.5} textAnchor="middle" fontSize={4.5} fontWeight={800} fill={hint > 0 ? FIRE : MISS}>
                  {hint > 0 ? '↑' : '↓'}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* input nodes */}
        {net.inputs.map((n) => {
          const p = pos[n.id];
          const v = ev.value[n.id] ?? 0;
          const on = v !== 0;
          return (
            <g key={n.id}>
              <rect x={p.x - 6} y={p.y - 4.5} width={12} height={9} rx={2.4}
                fill={on ? `${EXCITE}33` : PANEL} stroke={on ? EXCITE : PANEL_HI} strokeWidth={0.6} />
              <text x={p.x} y={p.y + 1.5} textAnchor="middle" fontSize={4.4} fontWeight={800} fill={on ? EXCITE : TEXT_FAINT}>{v}</text>
              <text x={p.x} y={p.y + 8} textAnchor="middle" fontSize={3.4} fill={TEXT_DIM}>{n.label}</text>
            </g>
          );
        })}

        {/* neurons */}
        {net.neurons.map((n) => {
          const p = pos[n.id];
          const fired = ev.fired[n.id];
          return (
            <g key={n.id}>
              {fired && !reduced && (
                <motion.circle cx={p.x} cy={p.y} r={7} fill="none" stroke={FIRE} strokeWidth={0.8}
                  initial={{ opacity: 0.2, r: 6 }} animate={{ opacity: [0.6, 0.1, 0.6], r: [6.5, 8.5, 6.5] }}
                  transition={{ repeat: Infinity, duration: 1.4 }} />
              )}
              <circle cx={p.x} cy={p.y} r={6}
                fill={fired ? `${FIRE}2E` : PANEL} stroke={fired ? FIRE : PANEL_HI} strokeWidth={0.8} />
              {fired
                ? <Zap x={p.x - 2.4} y={p.y - 2.6} width={4.8} height={4.8} color={FIRE} />
                : <text x={p.x} y={p.y + 1.6} textAnchor="middle" fontSize={4} fill={TEXT_FAINT}>≥{n.threshold}</text>}
              <text x={p.x} y={p.y + 9.5} textAnchor="middle" fontSize={3.4} fontWeight={700} fill={fired ? FIRE : TEXT_DIM}>{n.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// NEURON METER — live weighted-sum gauge vs threshold (role=meter, aria-live)
// ════════════════════════════════════════════════════════════════════════
function NeuronMeter({
  net, neuron, sum, fired, live,
}: {
  net: NetSpec; neuron: NeuronSpec; sum: number; fired: boolean; live: boolean;
}) {
  const span = neuronSpan(net, neuron);
  const pct = (v: number) => ((v + span) / (2 * span)) * 100;
  const fillPct = Math.max(0, Math.min(100, pct(sum)));
  const tickPct = Math.max(0, Math.min(100, pct(neuron.threshold)));
  const barColor = fired ? FIRE : sum < 0 ? INHIBIT : TEXT_FAINT;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: fired ? FIRE : TEXT }}>
          {neuron.label} {neuron.kind === 'output' && <span style={{ color: TEXT_FAINT }}>(output)</span>}
        </span>
        <span
          className="text-xs font-bold tabular-nums"
          style={{ color: barColor }}
          role="meter"
          aria-valuenow={sum}
          aria-valuemin={-span}
          aria-valuemax={span}
          aria-label={`${neuron.label} weighted sum`}
          aria-live={live ? 'polite' : 'off'}
        >
          Σ {sum} {fired ? '≥' : '<'} {neuron.threshold} · {fired ? 'FIRING' : 'quiet'}
        </span>
      </div>
      <div className="relative w-full rounded-full overflow-hidden" style={{ height: 10, background: INK }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${fillPct}%`, background: barColor, opacity: 0.85 }} />
        {/* threshold marker */}
        <div className="absolute inset-y-0" style={{ left: `${tickPct}%`, width: 2, background: TEXT, opacity: 0.9 }} aria-hidden="true" />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// WEIGHT STEPPER — keyboard-operable weight control for one wire
// ════════════════════════════════════════════════════════════════════════
function WeightStepper({
  label, value, min, max, locked, hint, onChange,
}: {
  label: string; value: number; min: number; max: number;
  locked?: boolean; hint?: number; onChange: (v: number) => void;
}) {
  const col = weightColor(value);
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));

  if (locked) {
    return (
      <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: PANEL, opacity: 0.75 }}>
        <span className="text-xs" style={{ color: TEXT_DIM }}>{label}</span>
        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: col, background: INK }}>
          {value > 0 ? `+${value}` : value} <span style={{ color: TEXT_FAINT }}>· fixed</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between rounded-xl px-3 py-2"
      style={{ background: PANEL, border: `1px solid ${col}44` }}
      role="group"
      aria-label={`${label}, weight ${value}${hint ? (hint > 0 ? ', hint: increase' : ', hint: decrease') : ''}`}
    >
      <span className="text-xs font-medium" style={{ color: TEXT }}>{label}</span>
      <div className="flex items-center gap-1.5">
        {hint ? (
          hint > 0
            ? <ArrowUp className="w-3.5 h-3.5" style={{ color: FIRE }} aria-hidden="true" />
            : <ArrowDown className="w-3.5 h-3.5" style={{ color: MISS }} aria-hidden="true" />
        ) : null}
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={value <= min}
          aria-label={`Decrease ${label} weight, currently ${value}`}
          className="flex items-center justify-center rounded-lg disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2"
          style={{ width: 30, height: 30, background: INK, color: TEXT, ['--tw-ring-color' as string]: LAB_COLOR }}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span
          className="text-sm font-bold tabular-nums text-center"
          style={{ width: 34, color: col }}
          aria-live="polite"
        >
          {value > 0 ? `+${value}` : value}
        </span>
        <button
          type="button"
          onClick={() => set(value + 1)}
          disabled={value >= max}
          aria-label={`Increase ${label} weight, currently ${value}`}
          className="flex items-center justify-center rounded-lg disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2"
          style={{ width: 30, height: 30, background: INK, color: TEXT, ['--tw-ring-color' as string]: LAB_COLOR }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — tune weights until the truth table fires correctly
// ════════════════════════════════════════════════════════════════════════
function starsFor(passed: number, total: number): 0 | 1 | 2 | 3 {
  if (total === 0) return 0;
  if (passed >= total) return 3;
  if (passed >= Math.ceil(total * 0.66)) return 2;
  if (passed >= 1) return 1;
  return 0;
}

function LevelRenderer({
  level, band, onComplete, onExit,
}: {
  level: LevelDef; band: Band; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const reduced = !!useReducedMotion();
  const net = level.net;
  const canBackprop = band === 'C';

  const [phase, setPhase] = useState<'welcome' | 'tune'>('welcome');
  const [weights, setWeights] = useState<Record<string, number>>(
    () => Object.fromEntries(net.wires.map((w) => [w.id, w.init])),
  );
  const [probeIdx, setProbeIdx] = useState(0);
  const [backprop, setBackprop] = useState(false);

  const adjustable = useMemo(() => net.wires.filter((w) => !w.locked), [net]);
  const out = outputNeuron(net);

  // Live evaluation of every test case + the currently-probed case.
  const results = useMemo(
    () => net.tests.map((t) => {
      const ev = evaluateNet(net, weights, t.inputs);
      return { test: t, ev, pass: ev.fired[out.id] === t.expect };
    }),
    [net, weights, out.id],
  );
  const passed = results.filter((r) => r.pass).length;
  const total = net.tests.length;
  const probe = results[probeIdx] ?? results[0];

  const hints = useMemo(
    () => (backprop ? gradientSigns(net, weights) : null),
    [backprop, net, weights],
  );

  // Juice: cheer when the number of correctly-firing tests rises.
  const prevPassed = useRef(passed);
  useEffect(() => {
    if (phase === 'tune' && passed > prevPassed.current) juice.onCorrect(passed, passed * 10);
    prevPassed.current = passed;
  }, [passed, phase, juice]);

  const setWeight = useCallback((id: string, v: number) => {
    setWeights((w) => ({ ...w, [id]: v }));
  }, []);

  const reset = useCallback(() => {
    setWeights(Object.fromEntries(net.wires.map((w) => [w.id, w.init])));
    setProbeIdx(0);
  }, [net]);

  const finish = useCallback(() => {
    const stars = starsFor(passed, total);
    onComplete({ score: passed, maxScore: total, stars, xpEarned: Math.round(level.xpReward * (stars / 3)), timeMs: 0 });
  }, [passed, total, level.xpReward, onComplete]);

  // ═══ WELCOME ═══
  if (phase === 'welcome') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle emoji={level.emoji} color={LAB_COLOR}>Level {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5" style={{ background: PANEL, borderColor: PANEL_HI }}>
          <p className="text-sm mb-3" style={{ color: TEXT_DIM }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}18`, color: TEXT }}>
            <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} />
            <span><strong style={{ color: LAB_COLOR }}>How neurons work:</strong> {CONCEPTS[level.id] || CONCEPTS[1]}</span>
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${FIRE}14`, color: TEXT }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: FIRE }} />
            <span><strong style={{ color: FIRE }}>Goal:</strong> Tune the weights so the output neuron fires correctly for every test input. Pink weights excite, blue weights inhibit.</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('tune')}>
          Open the Workbench <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ TUNE ═══
  const allPass = passed >= total;
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle emoji={level.emoji} color={LAB_COLOR}>Tune the Weights</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: allPass ? FIRE : LAB_COLOR }}>
          <Activity className="w-4 h-4" />{passed} / {total} correct
        </span>
      </div>

      <NetworkDiagram net={net} weights={weights} ev={probe.ev} hints={hints} reduced={reduced} />

      {/* Live neuron meters — running weighted sum vs threshold for the probed input */}
      <SFCard variant="elevated" className="space-y-3" style={{ background: PANEL, borderColor: PANEL_HI }}>
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: TEXT_DIM }}>
          <Brain className="w-3.5 h-3.5" style={{ color: LAB_COLOR }} />
          Signal meters — showing test input {probeIdx + 1}
        </p>
        {net.neurons.map((n) => (
          <NeuronMeter key={n.id} net={net} neuron={n} sum={probe.ev.sum[n.id]} fired={probe.ev.fired[n.id]} live={n.kind === 'output'} />
        ))}
      </SFCard>

      {/* Truth table — click a row to probe it; live fire vs expected */}
      <SFCard variant="elevated" className="space-y-1.5" style={{ background: PANEL, borderColor: PANEL_HI }}>
        <p className="text-xs font-semibold mb-1" style={{ color: TEXT_DIM }}>Test inputs — the neuron must match every one</p>
        {results.map((r, i) => {
          const selected = i === probeIdx;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setProbeIdx(i)}
              aria-label={`Test ${i + 1}: inputs ${net.inputs.map((inp) => `${inp.label} ${r.test.inputs[inp.id] ?? 0}`).join(', ')}. Should ${r.test.expect ? 'fire' : 'stay quiet'}. Currently ${r.ev.fired[out.id] ? 'firing' : 'quiet'}. ${r.pass ? 'Correct' : 'Not yet'}.${selected ? ' Selected.' : ''}`}
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: selected ? PANEL_HI : INK,
                border: `1px solid ${r.pass ? `${FIRE}55` : `${MISS}44`}`,
                ['--tw-ring-color' as string]: LAB_COLOR,
              }}
            >
              <span className="flex items-center gap-2 text-xs" style={{ color: TEXT_DIM }}>
                {net.inputs.map((inp) => (
                  <span key={inp.id} className="font-bold tabular-nums" style={{ color: (r.test.inputs[inp.id] ?? 0) !== 0 ? EXCITE : TEXT_FAINT }}>
                    {inp.label.replace('Input ', '')}={r.test.inputs[inp.id] ?? 0}
                  </span>
                ))}
              </span>
              <span className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1" style={{ color: TEXT_FAINT }}>
                  want {r.test.expect ? <Zap className="w-3.5 h-3.5" style={{ color: FIRE }} /> : <ZapOff className="w-3.5 h-3.5" />}
                </span>
                {r.pass
                  ? <Check className="w-4 h-4" style={{ color: FIRE }} aria-hidden="true" />
                  : <X className="w-4 h-4" style={{ color: MISS }} aria-hidden="true" />}
              </span>
            </button>
          );
        })}
      </SFCard>

      {/* Weight controls */}
      <SFCard variant="elevated" className="space-y-2" style={{ background: PANEL, borderColor: PANEL_HI }}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: TEXT_DIM }}>Weights</p>
          {canBackprop && adjustable.length > 1 && (
            <button
              type="button"
              onClick={() => setBackprop((b) => !b)}
              aria-pressed={backprop}
              aria-label="Toggle backprop hint arrows"
              className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: backprop ? `${FIRE}22` : INK,
                color: backprop ? FIRE : TEXT_DIM,
                border: `1px solid ${backprop ? `${FIRE}66` : PANEL_HI}`,
                ['--tw-ring-color' as string]: FIRE,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Backprop hint {backprop ? 'on' : 'off'}
            </button>
          )}
        </div>
        {backprop && (
          <p className="text-xs" style={{ color: TEXT_FAINT }} aria-live="polite">
            Arrows read the misses and point each weight the way that lowers the error. Down = turn it down.
          </p>
        )}
        {net.wires.map((w) => (
          <WeightStepper
            key={w.id}
            label={`${net.inputs.find((n) => n.id === w.from)?.label ?? net.neurons.find((n) => n.id === w.from)?.label ?? w.from} → ${net.neurons.find((n) => n.id === w.to)?.label ?? w.to}`}
            value={weights[w.id]}
            min={net.range[0]}
            max={net.range[1]}
            locked={w.locked}
            hint={hints ? hints[w.id] : 0}
            onChange={(v) => setWeight(w.id, v)}
          />
        ))}
      </SFCard>

      <div className="flex gap-2">
        <SFButton variant="primary" className="flex-1" onClick={finish} disabled={passed === 0}>
          <Zap className="w-4 h-4 mr-2" />
          {allPass ? 'Fire the network!' : `Lock in (${passed}/${total})`}
        </SFButton>
        <SFButton variant="outline" onClick={reset} aria-label="Reset weights">
          <RotateCcw className="w-4 h-4" />
        </SFButton>
        <SFButton variant="outline" onClick={onExit} aria-label="Exit level">
          <X className="w-4 h-4" />
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function NeuronRelayGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;

  // Band A tunes a single neuron with one weight; Band B adds multi-input
  // neurons + a hidden layer; Band C also gets the backprop-rescue level.
  const levels = useMemo(
    () => ALL_LEVELS.filter((l) => BAND_ORDER[l.minBand] <= BAND_ORDER[band]),
    [band],
  );

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    const maxStars = levels.length * 3;
    awardXP(Math.round(totalXP));
    completeGame('neuron-relay', totalStars >= maxStars * 0.8 ? 3 : totalStars >= maxStars * 0.5 ? 2 : 1);
  }, [awardXP, completeGame, levels.length]);

  return (
    <GameShell title="Neuron Relay" color={LAB_COLOR} labNum={3}>
      <GameLevelSystem
        gameTitle="Neuron Relay"
        gameEmoji="⚡"
        labColor={LAB_COLOR}
        levels={levels}
        onComplete={handleComplete}
        renderLevel={(level, onLevelComplete, onExit) => (
          <LevelRenderer level={level as LevelDef} band={band} onComplete={onLevelComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
