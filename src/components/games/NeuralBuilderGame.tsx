// ════════════════════════════════════════════════════════════════════════
// NEURAL NETWORK BUILDER v5 — Lab 3 Flagship (HONEST REDESIGN)
// ════════════════════════════════════════════════════════════════════════
// Audit §II.4 #8 (verdict REDESIGN). The old version faked everything:
// accuracy = base + epoch boost + random noise, COMPLETELY independent of
// the architecture the child built, and the 5 "tests" were coin flips.
//
// This version trains a REAL tiny multi-layer perceptron in JavaScript
// (forward pass + backprop + full-batch gradient descent) on visible 2D
// point datasets. The child edits the architecture (add/remove hidden
// layers and neurons); training genuinely changes the decision boundary,
// which is rendered live over the scatter plot. The number the child sees
// is the real accuracy of the real net they built on held-out test points:
//   • too small  → underfits (a single neuron cannot separate XOR / circles)
//   • too big + trained too long on a tiny noisy set → genuinely OVERFITS
//     (train accuracy → 100%, held-out accuracy collapses; Sparky flags it).
//
// The math is deterministic: a seeded RNG (mulberry32) drives weight init
// and dataset generation, so a given architecture always converges the same
// way. There is no Pixi/Three scene here — the boundary is drawn by hand on
// a 2D <canvas> we control. Teaches: neurons, weights, hidden layers,
// activation, backprop, capacity, underfitting and overfitting.

'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Brain, Play, Plus, Minus, RotateCcw, ChevronRight, ArrowLeft,
  Target, Sparkles, Layers, AlertTriangle, CheckCircle2, Info,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { SFCard } from '@/components/ui/SFCard';
import { SFButton } from '@/components/ui/SFButton';
import GameLevelSystem, { type LevelConfig, type LevelResult } from '@/components/games/shared/GameLevelSystem';
import type { AgeBand } from '@/types';

const LAB_COLOR = '#E945F5';
const CLASS1 = '#E945F5'; // positive class (magenta)
const CLASS0 = '#4DE9FF'; // negative class (cyan)
const PANEL_BG = '#0D0F1A';

// ════════════════════════════════════════════════════════════════════════
// REAL NEURAL NETWORK — forward pass + backprop + gradient descent
// ════════════════════════════════════════════════════════════════════════
// Seeded RNG so every training run for a given architecture is reproducible.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

interface Net {
  sizes: number[];      // [2, ...hidden, 1]
  W: number[][][];      // W[layer][outNode][inNode]
  b: number[][];        // b[layer][outNode]
}

interface Pt { x: number; y: number; label: 0 | 1 }

function makeNet(sizes: number[], rand: () => number): Net {
  const W: number[][][] = [];
  const b: number[][] = [];
  for (let l = 0; l < sizes.length - 1; l++) {
    const inN = sizes[l];
    const outN = sizes[l + 1];
    const scale = Math.sqrt(2 / (inN + outN)); // Xavier-ish
    W.push(
      Array.from({ length: outN }, () =>
        Array.from({ length: inN }, () => (rand() * 2 - 1) * scale * 1.6)),
    );
    b.push(Array.from({ length: outN }, () => 0));
  }
  return { sizes, W, b };
}

// Returns activations for every layer (index 0 = input). Hidden layers use
// tanh; the single output uses sigmoid (probability of class 1).
function forward(net: Net, input: number[]): number[][] {
  const acts: number[][] = [input];
  let a = input;
  for (let l = 0; l < net.W.length; l++) {
    const isLast = l === net.W.length - 1;
    const outN = net.sizes[l + 1];
    const z = new Array<number>(outN);
    for (let j = 0; j < outN; j++) {
      let s = net.b[l][j];
      const wRow = net.W[l][j];
      for (let k = 0; k < a.length; k++) s += wRow[k] * a[k];
      z[j] = isLast ? sigmoid(s) : Math.tanh(s);
    }
    a = z;
    acts.push(a);
  }
  return acts;
}

function predict(net: Net, x: number, y: number): number {
  const acts = forward(net, [x, y]);
  return acts[acts.length - 1][0];
}

// One epoch of full-batch gradient descent. Mutates the net in place.
function trainEpoch(net: Net, data: Pt[], lr: number): void {
  const L = net.W.length;
  const gW = net.W.map((m) => m.map((row) => row.map(() => 0)));
  const gb = net.b.map((v) => v.map(() => 0));

  for (const p of data) {
    const acts = forward(net, [p.x, p.y]);
    const deltas: number[][] = new Array(L);
    // Output layer: with sigmoid + binary cross-entropy, delta = a - y.
    deltas[L - 1] = [acts[L][0] - p.label];
    // Backpropagate through the tanh hidden layers.
    for (let l = L - 2; l >= 0; l--) {
      const a = acts[l + 1];
      const nextDelta = deltas[l + 1];
      const nextW = net.W[l + 1];
      const d = new Array<number>(a.length).fill(0);
      for (let j = 0; j < a.length; j++) {
        let s = 0;
        for (let j2 = 0; j2 < nextDelta.length; j2++) s += nextW[j2][j] * nextDelta[j2];
        d[j] = s * (1 - a[j] * a[j]); // tanh'
      }
      deltas[l] = d;
    }
    // Accumulate gradients.
    for (let l = 0; l < L; l++) {
      const aPrev = acts[l];
      const dl = deltas[l];
      for (let j = 0; j < dl.length; j++) {
        gb[l][j] += dl[j];
        const gWrow = gW[l][j];
        for (let k = 0; k < aPrev.length; k++) gWrow[k] += dl[j] * aPrev[k];
      }
    }
  }

  const scale = lr / data.length;
  for (let l = 0; l < L; l++) {
    for (let j = 0; j < net.W[l].length; j++) {
      net.b[l][j] -= scale * gb[l][j];
      for (let k = 0; k < net.W[l][j].length; k++) net.W[l][j][k] -= scale * gW[l][j][k];
    }
  }
}

function accuracy(net: Net, data: Pt[]): number {
  let c = 0;
  for (const p of data) if ((predict(net, p.x, p.y) >= 0.5 ? 1 : 0) === p.label) c++;
  return (c / data.length) * 100;
}

// ════════════════════════════════════════════════════════════════════════
// DATASETS — visible 2D point clouds (x,y in [-1,1])
// ════════════════════════════════════════════════════════════════════════
type DatasetKind = 'linear' | 'xor' | 'circle';

function genDataset(kind: DatasetKind, n: number, seed: number, noise = 0): Pt[] {
  const rand = mulberry32(seed);
  const pts: Pt[] = [];
  let guard = 0;
  while (pts.length < n && guard < n * 60) {
    guard++;
    const x = rand() * 2 - 1;
    const y = rand() * 2 - 1;
    let label: 0 | 1;
    let inMargin: boolean;
    if (kind === 'linear') {
      const v = 0.8 * x + 0.6 * y;
      inMargin = Math.abs(v) < 0.18;
      label = v > 0 ? 1 : 0;
    } else if (kind === 'xor') {
      inMargin = Math.abs(x) < 0.12 || Math.abs(y) < 0.12;
      label = (x > 0) !== (y > 0) ? 1 : 0;
    } else {
      const r = Math.sqrt(x * x + y * y);
      inMargin = Math.abs(r - 0.62) < 0.1;
      label = r < 0.62 ? 1 : 0;
    }
    if (inMargin) continue; // keep classes cleanly separated (before noise)
    if (noise > 0 && rand() < noise) label = (label ? 0 : 1) as 0 | 1;
    pts.push({ x, y, label });
  }
  return pts;
}

// ════════════════════════════════════════════════════════════════════════
// LEVELS — 5 stages, resolved per age band
// ════════════════════════════════════════════════════════════════════════
const LEVELS: LevelConfig[] = [
  { id: 1, name: 'One Neuron', description: 'A single neuron draws one straight line', emoji: '➗', difficulty: 'easy', starThresholds: [65, 82, 94], xpReward: 60 },
  { id: 2, name: 'Add a Layer', description: 'One line is not enough — grow a hidden layer', emoji: '🧩', difficulty: 'easy', starThresholds: [65, 82, 94], xpReward: 80 },
  { id: 3, name: 'Go Deeper', description: 'Bend the boundary around a circle', emoji: '🌀', difficulty: 'medium', starThresholds: [62, 80, 90], xpReward: 100 },
  { id: 4, name: 'Overfit Alert', description: 'Bigger is not always better', emoji: '⚠️', difficulty: 'hard', starThresholds: [62, 76, 86], xpReward: 130 },
  { id: 5, name: 'Design Your Own', description: 'You choose the whole architecture', emoji: '🏛️', difficulty: 'expert', starThresholds: [62, 78, 88], xpReward: 160 },
];

interface RuntimeConfig {
  kind: DatasetKind;
  trainN: number;
  noise: number;
  fixedSizes: number[] | null;    // non-null => architecture editing locked
  initialHidden: number[];
  maxEpochs: number;
  lr: number;
  maxNodes: number;
  maxLayers: number;
  overfitLevel: boolean;
  concept: string;
  tip: string;
}

// Resolve a level's real training config for the child's age band.
// Band A: linear separation + tiny nets. Band C: XOR / circles, the overfit
// trap, and a wide-open design level. Band B sits in the middle.
function resolveConfig(levelId: number, band: AgeBand): RuntimeConfig {
  const A = band === 'A';
  const C = band === 'C';
  switch (levelId) {
    case 1:
      return {
        kind: 'linear', trainN: A ? 60 : 80, noise: 0,
        fixedSizes: [2, 1], initialHidden: [],
        maxEpochs: 160, lr: 0.6, maxNodes: 8, maxLayers: 3, overfitLevel: false,
        concept: 'A neuron multiplies each input by a weight, adds them up, and fires "yes" or "no". With no hidden layer it can only draw ONE straight line.',
        tip: 'These two groups can be split by a single line, so one neuron is all you need.',
      };
    case 2:
      return {
        kind: A ? 'linear' : 'xor', trainN: 80, noise: 0,
        fixedSizes: null, initialHidden: [], // starts with NO hidden layer on purpose
        maxEpochs: A ? 300 : 700, lr: A ? 0.5 : 0.35, maxNodes: 8, maxLayers: 3, overfitLevel: false,
        concept: A
          ? 'Add a hidden layer of neurons between the inputs and the answer. Each hidden neuron learns its own little pattern.'
          : 'This XOR pattern crosses itself — NO single line can split it. Train with zero hidden layers first and watch it get stuck near 65%, then add a hidden layer.',
        tip: A
          ? 'Press Train first to see the score, then add a hidden layer and train again.'
          : 'One straight line cannot separate opposite corners. Add a hidden layer, then Train again.',
      };
    case 3:
      return {
        kind: A ? 'xor' : 'circle', trainN: 90, noise: 0,
        fixedSizes: null, initialHidden: A ? [6] : [4],
        maxEpochs: A ? 700 : 650, lr: 0.3, maxNodes: 10, maxLayers: 3, overfitLevel: false,
        concept: 'To wrap a curved boundary around the inner blob, the network needs enough hidden neurons. Too few and the boundary stays too straight.',
        tip: 'If the score stalls, add neurons to the hidden layer or add a second hidden layer, then Train again.',
      };
    case 4:
      return {
        kind: 'xor',
        trainN: A ? 60 : 22, noise: A ? 0 : C ? 0.28 : 0.22,
        fixedSizes: null, initialHidden: A ? [4] : [10, 10],
        maxEpochs: A ? 700 : 2600, lr: A ? 0.35 : 0.4, maxNodes: 10, maxLayers: 4,
        overfitLevel: !A,
        concept: A
          ? 'Give the network the right size for the job. Train and watch the boundary settle.'
          : 'Only a FEW noisy training dots here. A huge network can memorize every dot (training score near 100%) yet do badly on new dots. That is OVERFITTING. A smaller network generalizes better.',
        tip: A
          ? 'Train and aim for a high score.'
          : 'Try the big [10,10] net first and check the test score. Then REMOVE neurons/layers and compare — smaller often tests better here.',
      };
    default: // 5 — design your own
      return {
        kind: A ? 'linear' : C ? 'circle' : 'xor',
        trainN: C ? 70 : 80, noise: 0,
        fixedSizes: null, initialHidden: A ? [4] : [6],
        maxEpochs: A ? 400 : 700, lr: A ? 0.45 : 0.3, maxNodes: 10, maxLayers: 4, overfitLevel: false,
        concept: 'No hints this time. Choose the number of hidden layers and neurons yourself, then train until the boundary matches the data.',
        tip: 'Match the network size to how twisty the boundary needs to be. Big enough to fit — not so big it wastes effort.',
      };
  }
}

const DATASET_LABELS: Record<DatasetKind, string> = {
  linear: 'Two groups split by a line',
  xor: 'Opposite-corner (XOR) pattern',
  circle: 'A blob inside a ring',
};

// ════════════════════════════════════════════════════════════════════════
// CANVAS — live decision-boundary render (hand-drawn 2D, no Pixi/Three)
// ════════════════════════════════════════════════════════════════════════
const CANVAS_SIZE = 260;
const GRID = 44;

const RGB0 = hexToRgb(CLASS0);
const RGB1 = hexToRgb(CLASS1);

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function drawBoundary(
  ctx: CanvasRenderingContext2D,
  net: Net | null,
  points: Pt[],
  showPoints: boolean,
) {
  const size = CANVAS_SIZE;
  ctx.clearRect(0, 0, size, size);
  // Shaded decision regions: cyan (class 0) ↔ magenta (class 1), blended
  // by the network's real output probability at each grid cell.
  const cell = size / GRID;
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const x = ((gx + 0.5) / GRID) * 2 - 1;
      const y = (1 - (gy + 0.5) / GRID) * 2 - 1;
      const p = net ? predict(net, x, y) : 0.5;
      const r = Math.round(RGB0[0] + (RGB1[0] - RGB0[0]) * p);
      const g = Math.round(RGB0[1] + (RGB1[1] - RGB0[1]) * p);
      const b = Math.round(RGB0[2] + (RGB1[2] - RGB0[2]) * p);
      ctx.fillStyle = `rgba(${r},${g},${b},0.5)`;
      ctx.fillRect(gx * cell, gy * cell, cell + 1, cell + 1);
    }
  }
  if (showPoints) {
    for (const pt of points) {
      const px = ((pt.x + 1) / 2) * size;
      const py = (1 - (pt.y + 1) / 2) * size;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = pt.label ? CLASS1 : CLASS0;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(13,15,26,0.92)';
      ctx.stroke();
    }
  }
}

function BoundaryCanvas({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement | null> }) {
  return (
    <div className="rounded-2xl overflow-hidden p-3 flex flex-col items-center gap-2" style={{ background: PANEL_BG }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full max-w-xs rounded-xl block"
        style={{ height: 'auto', aspectRatio: '1 / 1' }}
        role="img"
        aria-label="Decision boundary map: shaded regions show which class the network predicts across the plane, with the training dots drawn on top."
      />
      <div className="flex items-center gap-4 text-xs" style={{ color: '#8C94AC' }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: CLASS0 }} aria-hidden="true" />
          Class A
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: CLASS1 }} aria-hidden="true" />
          Class B
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ARCHITECTURE EDITOR — keyboard-operable add/remove layers & neurons
// ════════════════════════════════════════════════════════════════════════
function ArchitectureEditor({
  hidden, cfg, onChange,
}: {
  hidden: number[]; cfg: RuntimeConfig; onChange: (next: number[]) => void;
}) {
  const locked = cfg.fixedSizes !== null;
  const sizes = [2, ...hidden, 1];

  const addLayer = () => { if (hidden.length < cfg.maxLayers) onChange([...hidden, 3]); };
  const removeLayer = () => { if (hidden.length > 0) onChange(hidden.slice(0, -1)); };
  const addNode = (i: number) => { if (hidden[i] < cfg.maxNodes) onChange(hidden.map((n, k) => (k === i ? n + 1 : n))); };
  const removeNode = (i: number) => {
    if (hidden[i] > 1) onChange(hidden.map((n, k) => (k === i ? n - 1 : n)));
    else onChange(hidden.filter((_, k) => k !== i)); // dropping to 0 removes the layer
  };

  return (
    <SFCard variant="elevated" className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: '#1A1D2B' }}>
          <Layers className="w-4 h-4" style={{ color: LAB_COLOR }} /> Your Network
        </span>
        <span className="text-xs font-semibold" style={{ color: '#5A6078' }}>
          {sizes.join(' → ')}
        </span>
      </div>

      {locked ? (
        <p className="text-xs" style={{ color: '#5A6078' }}>
          This level is locked to a single neuron (2 inputs → 1 output). No hidden layers — that is the whole point.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-stretch gap-2">
            {/* Input column (read-only) */}
            <div className="rounded-xl px-3 py-2 text-center" style={{ background: '#EEF0F8' }}>
              <div className="text-xs font-bold" style={{ color: '#5A6078' }}>Inputs</div>
              <div className="text-lg font-extrabold" style={{ color: '#1A1D2B' }}>2</div>
              <div className="text-xs" style={{ color: '#8C94AC' }}>x, y</div>
            </div>

            {hidden.length === 0 && (
              <div className="rounded-xl px-3 py-2 flex items-center text-xs" style={{ background: '#FFF4E5', color: '#B45309' }}>
                No hidden layers yet
              </div>
            )}

            {hidden.map((count, i) => (
              <div key={i} className="rounded-xl px-2 py-2 text-center" style={{ background: `${LAB_COLOR}12`, border: `1px solid ${LAB_COLOR}30` }}>
                <div className="text-xs font-bold" style={{ color: LAB_COLOR }}>Hidden {i + 1}</div>
                <div className="text-lg font-extrabold" style={{ color: '#1A1D2B' }}>{count}</div>
                <div className="flex justify-center gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => removeNode(i)}
                    aria-label={`Remove a neuron from hidden layer ${i + 1}, currently ${count}`}
                    className="w-6 h-6 rounded-md flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{ background: '#EEF0F8', color: '#5A6078', ['--tw-ring-color' as string]: LAB_COLOR }}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => addNode(i)}
                    disabled={count >= cfg.maxNodes}
                    aria-label={`Add a neuron to hidden layer ${i + 1}, currently ${count}`}
                    className="w-6 h-6 rounded-md flex items-center justify-center disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    style={{ background: `${LAB_COLOR}20`, color: LAB_COLOR, ['--tw-ring-color' as string]: LAB_COLOR }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Output column (read-only) */}
            <div className="rounded-xl px-3 py-2 text-center" style={{ background: '#EEF0F8' }}>
              <div className="text-xs font-bold" style={{ color: '#5A6078' }}>Output</div>
              <div className="text-lg font-extrabold" style={{ color: '#1A1D2B' }}>1</div>
              <div className="text-xs" style={{ color: '#8C94AC' }}>A / B</div>
            </div>
          </div>

          <div className="flex gap-2">
            <SFButton variant="outline" size="sm" onClick={addLayer} disabled={hidden.length >= cfg.maxLayers}>
              <Plus className="w-4 h-4 mr-1" /> Add hidden layer
            </SFButton>
            <SFButton variant="outline" size="sm" onClick={removeLayer} disabled={hidden.length === 0}>
              <Minus className="w-4 h-4 mr-1" /> Remove layer
            </SFButton>
          </div>
        </>
      )}
    </SFCard>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER
// ════════════════════════════════════════════════════════════════════════
type Phase = 'welcome' | 'build' | 'train' | 'result';

interface Diagnosis {
  kind: 'underfit' | 'overfit' | 'good';
  title: string;
  detail: string;
}

function diagnose(trainAcc: number, testAcc: number, overfitLevel: boolean): Diagnosis {
  const gap = trainAcc - testAcc;
  if (trainAcc < 78) {
    return {
      kind: 'underfit',
      detail: 'The network is too simple for this pattern — it cannot even fit the training dots. Add a hidden layer or more neurons, then train again.',
      title: 'Underfitting',
    };
  }
  if (gap > 12 && trainAcc > 85) {
    return {
      kind: 'overfit',
      detail: `It scored ${Math.round(trainAcc)}% on the dots it trained on but only ${Math.round(testAcc)}% on brand-new dots. Sparky says: it memorized the training dots instead of learning the real pattern. Try a smaller network.`,
      title: 'Overfitting — it memorized!',
    };
  }
  return {
    kind: 'good',
    detail: overfitLevel
      ? `Nicely balanced: ${Math.round(testAcc)}% on new dots with only a small gap from training. This network learned the real pattern instead of memorizing.`
      : `The boundary matches the data and it scores ${Math.round(testAcc)}% on new dots it never saw. That is real generalization.`,
    title: 'Good fit',
  };
}

function LevelRenderer({
  level, band, onComplete, onExit,
}: {
  level: LevelConfig; band: AgeBand; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const cfg = useMemo(() => resolveConfig(level.id, band), [level.id, band]);
  const prefersReducedMotion = useReducedMotion();

  // Datasets are deterministic per level (seeded) — train set the child sees,
  // and a larger held-out test set used for the honest final score.
  const trainData = useMemo(
    () => genDataset(cfg.kind, cfg.trainN, 1000 + level.id, cfg.noise),
    [cfg, level.id],
  );
  const testData = useMemo(
    () => genDataset(cfg.kind, 200, 5000 + level.id, 0),
    [cfg, level.id],
  );

  const [phase, setPhase] = useState<Phase>('welcome');
  const [hidden, setHidden] = useState<number[]>(cfg.fixedSizes ? [] : cfg.initialHidden);
  const [epoch, setEpoch] = useState(0);
  const [trainAcc, setTrainAcc] = useState(0);
  const [testAcc, setTestAcc] = useState(0);
  const [liveMsg, setLiveMsg] = useState('');
  const [diag, setDiag] = useState<Diagnosis | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const netRef = useRef<Net | null>(null);
  const epochRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const sizes = useMemo(() => [2, ...hidden, 1], [hidden]);

  // Deterministic init seed derived from the exact architecture, so the same
  // design always trains to the same result (reproducible).
  const seedFor = useCallback((s: number[]) => {
    let seed = 900 + level.id * 17;
    for (const n of s) seed = (seed * 33 + n) | 0;
    return seed >>> 0;
  }, [level.id]);

  const paint = useCallback((showPoints = true) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    drawBoundary(ctx, netRef.current, trainData, showPoints);
  }, [trainData]);

  // (Re)build a fresh untrained net for the current architecture.
  const rebuildNet = useCallback(() => {
    netRef.current = makeNet(sizes, mulberry32(seedFor(sizes)));
    epochRef.current = 0;
    setEpoch(0);
    setTrainAcc(accuracy(netRef.current, trainData));
    paint(true);
  }, [sizes, seedFor, trainData, paint]);

  // Keep the (freshly mounted) canvas in sync with the current phase:
  //  • build/welcome → rebuild a fresh untrained net so the child sees the
  //    boundary react to architecture edits.
  //  • result → repaint the trained net onto the newly mounted result canvas.
  //  • train → the interval / synchronous loop paints it.
  useEffect(() => {
    if (phase === 'build' || phase === 'welcome') rebuildNet();
    else if (phase === 'result') paint(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, hidden.join(','), level.id]);

  // Cleanup any running training loop on unmount.
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const finishTraining = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    const net = netRef.current!;
    const tr = accuracy(net, trainData);
    const te = accuracy(net, testData);
    setTrainAcc(tr);
    setTestAcc(te);
    const d = diagnose(tr, te, cfg.overfitLevel);
    setDiag(d);
    setLiveMsg(`Training finished. Training accuracy ${Math.round(tr)} percent. Test accuracy on new dots ${Math.round(te)} percent. ${d.title}.`);
    paint(true);
    setPhase('result');
  }, [trainData, testData, cfg.overfitLevel, paint]);

  const handleTrain = useCallback(() => {
    // Always start from a fresh, deterministic net for the chosen design.
    netRef.current = makeNet(sizes, mulberry32(seedFor(sizes)));
    epochRef.current = 0;
    setEpoch(0);
    setDiag(null);
    startTimeRef.current = Date.now();
    setPhase('train');

    const net = netRef.current;
    const total = cfg.maxEpochs;

    if (prefersReducedMotion) {
      // No animation: run every epoch immediately, then jump straight to the
      // final board (the result-phase effect repaints the mounted canvas).
      for (let e = 0; e < total; e++) trainEpoch(net, trainData, cfg.lr);
      epochRef.current = total;
      setEpoch(total);
      setTrainAcc(accuracy(net, trainData));
      finishTraining();
      return;
    }

    setLiveMsg('Training started.');
    const perTick = Math.max(1, Math.round(total / 80));
    let lastMilestone = 0;
    intervalRef.current = setInterval(() => {
      const step = Math.min(perTick, total - epochRef.current);
      for (let e = 0; e < step; e++) trainEpoch(net, trainData, cfg.lr);
      epochRef.current += step;
      setEpoch(epochRef.current);
      const acc = accuracy(net, trainData);
      setTrainAcc(acc);
      paint(true);
      const pct = epochRef.current / total;
      if (pct >= lastMilestone + 0.25) {
        lastMilestone = Math.floor(pct / 0.25) * 0.25;
        setLiveMsg(`${Math.round(pct * 100)} percent trained. Training accuracy ${Math.round(acc)} percent.`);
      }
      if (epochRef.current >= total) finishTraining();
    }, 45);
  }, [sizes, seedFor, cfg.maxEpochs, cfg.lr, prefersReducedMotion, trainData, paint, finishTraining]);

  const computeResult = useCallback((): LevelResult => {
    const th = level.starThresholds;
    const stars = (testAcc >= th[2] ? 3 : testAcc >= th[1] ? 2 : testAcc >= th[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    return {
      score: Math.round(testAcc),
      maxScore: 100,
      stars,
      xpEarned: Math.round(level.xpReward * (stars / 3)),
      timeMs: Date.now() - startTimeRef.current,
    };
  }, [testAcc, level]);

  // ─── WELCOME ───
  if (phase === 'welcome') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${LAB_COLOR}30, ${LAB_COLOR}12)` }}>
            <Brain className="w-5 h-5" style={{ color: LAB_COLOR }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: '#1A1D2B' }}>Level {level.id}: {level.name}</h2>
        </div>

        <SFCard variant="elevated" className="p-5 space-y-3">
          <p className="text-sm" style={{ color: '#5A6078' }}>{level.description}.</p>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}10`, color: LAB_COLOR }}>
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Concept:</strong> {cfg.concept}</span>
          </div>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#2ECC7112', color: '#1B8F5A' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Data:</strong> {DATASET_LABELS[cfg.kind]}. You train on a small set of dots, then get scored on brand-new dots the network never saw.</span>
          </div>
        </SFCard>

        <SFButton variant="primary" size="lg" fullWidth onClick={() => setPhase('build')}>
          Start Building <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ─── BUILD ───
  if (phase === 'build') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A1D2B' }}>
            <Brain className="w-5 h-5" style={{ color: LAB_COLOR }} /> Build & Train
          </h2>
          <SFButton variant="ghost" size="sm" onClick={onExit} aria-label="Back to level map">
            <ArrowLeft className="w-4 h-4 mr-1" /> Map
          </SFButton>
        </div>

        <BoundaryCanvas canvasRef={canvasRef} />

        <div className="rounded-xl p-3 text-xs flex items-center justify-between" style={{ background: '#F0F1F8' }}>
          <span style={{ color: '#5A6078' }}>Untrained network guesses</span>
          <span className="font-bold" style={{ color: '#8C94AC' }}>{Math.round(trainAcc)}% (before training)</span>
        </div>

        <ArchitectureEditor hidden={hidden} cfg={cfg} onChange={setHidden} />

        <SFCard variant="default" className="p-3 text-xs flex items-start gap-2" style={{ color: '#5A6078' }}>
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} />
          <span>{cfg.tip}</span>
        </SFCard>

        <SFButton variant="primary" size="lg" fullWidth onClick={handleTrain}>
          <Play className="w-5 h-5 mr-2" /> Train Network
        </SFButton>
      </div>
    );
  }

  // ─── TRAIN ───
  if (phase === 'train') {
    const pct = Math.min(100, (epoch / cfg.maxEpochs) * 100);
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A1D2B' }}>
          <Sparkles className="w-5 h-5" style={{ color: LAB_COLOR }} /> Training…
        </h2>

        <BoundaryCanvas canvasRef={canvasRef} />

        <div className="rounded-xl p-3" style={{ background: `${LAB_COLOR}0C` }}>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: '#5A6078' }}>Epoch {epoch} / {cfg.maxEpochs}</span>
            <span className="font-bold" style={{ color: LAB_COLOR }}>{Math.round(trainAcc)}% training accuracy</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#EEF0F8' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${LAB_COLOR}, #4DE9FF)` }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
        </div>

        <p role="status" aria-live="polite" className="text-xs text-center" style={{ color: '#8C94AC' }}>
          {liveMsg || 'The boundary is bending to fit the dots as the weights update.'}
        </p>
      </div>
    );
  }

  // ─── RESULT ───
  const gap = Math.round(trainAcc - testAcc);
  const dColors = {
    underfit: { bg: '#FFF4E5', fg: '#B45309', Icon: AlertTriangle },
    overfit: { bg: '#FDE7EF', fg: '#B01050', Icon: AlertTriangle },
    good: { bg: '#E6F7EF', fg: '#1B8F5A', Icon: CheckCircle2 },
  } as const;
  const dc = diag ? dColors[diag.kind] : dColors.good;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A1D2B' }}>
        <Target className="w-5 h-5" style={{ color: LAB_COLOR }} /> Results
      </h2>

      <BoundaryCanvas canvasRef={canvasRef} />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 text-center" style={{ background: `${LAB_COLOR}0C` }}>
          <p className="text-xs" style={{ color: '#5A6078' }}>Training dots</p>
          <p className="text-3xl font-extrabold" style={{ color: '#8C94AC' }}>{Math.round(trainAcc)}%</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: `${LAB_COLOR}18`, border: `1px solid ${LAB_COLOR}40` }}>
          <p className="text-xs font-semibold" style={{ color: '#5A6078' }}>New dots (your score)</p>
          <motion.p className="text-3xl font-extrabold" style={{ color: LAB_COLOR }} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 14 }}>
            {Math.round(testAcc)}%
          </motion.p>
        </div>
      </div>

      {diag && (
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: dc.bg }}>
          <dc.Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: dc.fg }} />
          <div>
            <p className="text-sm font-bold" style={{ color: dc.fg }}>{diag.title}</p>
            <p className="text-xs mt-1" style={{ color: '#5A6078' }}>{diag.detail}</p>
            {diag.kind === 'overfit' && (
              <p className="text-xs mt-1 font-semibold" style={{ color: dc.fg }}>Memorization gap: {gap} points.</p>
            )}
          </div>
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">{liveMsg}</p>

      <div className="flex flex-col gap-2">
        <SFButton variant="primary" size="lg" fullWidth onClick={() => onComplete(computeResult())}>
          Continue <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
        <SFButton variant="outline" onClick={() => { setPhase('build'); }}>
          <RotateCcw className="w-4 h-4 mr-2" /> Change the design & retrain
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function NeuralBuilderGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as AgeBand;

  const handleAllComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0);
    const maxStars = results.length * 3 || 1;
    awardXP(Math.round(totalXP));
    // Overall stars scale with the real average test accuracy across levels.
    const ratio = totalStars / maxStars;
    completeGame('neural-builder', ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Neural Network Builder" color={LAB_COLOR} labNum={3}>
      <GameLevelSystem
        gameTitle="Neural Network Builder"
        gameEmoji="🧠"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleAllComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer key={level.id} level={level} band={band} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
