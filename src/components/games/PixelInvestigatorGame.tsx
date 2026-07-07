// ════════════════════════════════════════════════════════════════════════
// PIXEL INVESTIGATOR v5 — Lab 3 — REDESIGN (object-detector localization)
// ════════════════════════════════════════════════════════════════════════
// The v4 version was a computer-vision game with ZERO images: PixiRevealStage
// tap-to-reveal of TEXT phrases ("Natural sensor grain", "JPEG block artifact")
// from a 16-item bank. The "mechanic" was memorising which phrase was a target.
//
// v5 is a real localization game on a DRAWN scene (SVG/CSS — no photos exist in
// this codebase, so every scene is illustrated):
//   1. SCAN — an illustrated "photo" sits under a reveal grid. Each tile is
//      frosted/pixelated; tapping it uncovers a sharp, zoomed patch of the
//      scene (that is what a vision model works on: patches of pixels).
//   2. FLAG — the child boxes WHERE they think an object detector should fire
//      by toggling grid cells (keyboard-operable buttons, not a drag-box).
//   3. COMMIT — the child locks their guess. ONLY THEN does Sparky's detector
//      reveal its own bounding boxes WITH CONFIDENCE % — teaching how vision
//      models localise objects and where they are unsure (low-confidence boxes
//      drawn dashed). Score = how well the flagged cells matched where objects
//      ACTUALLY are (a real F1 over the scene's object footprints — honest).
//   4. FEATURE FILTER (band C) — a toggle re-renders the SAME scene through a
//      genuine SVG edge-detection convolution (feConvolveMatrix): the model's
//      "feature map" view.
//   5. C2PA CLUE (band C) — Content Credentials panel: was this really camera-
//      captured, or AI-generated? (2026 provenance literacy.)
//
// G1 honesty: object positions are baked into scene data and NOTHING is pre-
// marked; the detector comparison is computed from those positions and revealed
// only after the child commits. DOM/SVG only — no Pixi, no canvas, SSR-safe.
// Self-drives inside GameShell (dark Frost-Prismatic surface) and reports XP +
// 1–3 stars exactly once via useGameActions().awardXP + completeGame(...).

'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Flag, Layers, ScanSearch, Eye, ShieldCheck, Camera, Sparkles,
  Star, Lock, ChevronRight, ChevronLeft, RotateCcw, Check, X, Trophy, Info,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useActiveChild } from '@/hooks/useChildren';
import { SFButton } from '@/components/ui/SFButton';

// ── Palette (dark surface — Lab 3 pink) ─────────────────────────────────
const LAB = '#FF70AF';
const CYAN = '#4DE9FF';
const GOOD = '#2ECC71';
const MISS = '#F6B44C';
const BAD = '#FF5C6C';
const SURFACE = '#0E1526';
const PANEL = '#0A0F1C';
const CELL = '#141d33';
const INK = '#F5F7FF';
const BODY = 'rgba(255,255,255,0.74)';
const MUTE = 'rgba(255,255,255,0.55)';
const HAIR = 'rgba(255,255,255,0.12)';

const VW = 400; // scene viewBox width
const VH = 300; // scene viewBox height

type Band = 'A' | 'B' | 'C';
const rank: Record<Band, number> = { A: 0, B: 1, C: 2 };

// ── Scene / object model ────────────────────────────────────────────────
interface NRect { x: number; y: number; w: number; h: number } // normalised 0..1
type ObjKind =
  | 'cat' | 'ball' | 'bird' | 'stopSign' | 'person' | 'dog'
  | 'frisbee' | 'kite' | 'face' | 'hand' | 'laptop' | 'mug';

interface SceneObject {
  id: string;
  kind: ObjKind;
  label: string;
  rect: NRect;             // footprint — drives drawing, detector box AND scoring
  confidence: number;      // detector confidence %
  minBand?: Band;          // object only appears at/above this band (smaller/occluded extras)
  low?: boolean;           // detector is UNSURE here (drawn dashed, taught as uncertainty)
  note: string;            // shown in the detector comparison
}

interface Scene {
  id: string;
  name: string;
  brief: string;
  bg: 'yard' | 'street' | 'portrait' | 'park' | 'desk';
  objects: SceneObject[];
  authentic: boolean;      // C2PA truth: camera-captured (true) vs AI-generated (false)
  c2pa: string;            // the Content-Credentials line shown in the clue
  baseXP: number;
}

const SCENES: Scene[] = [
  {
    id: 'yard', name: 'Sunny Backyard', bg: 'yard', baseXP: 50, authentic: true,
    brief: 'A calm garden photo. Uncover a few patches, then box where the detector should fire.',
    c2pa: 'Content Credentials: captured on a phone camera, 2026-05-02. Signed, unedited.',
    objects: [
      { id: 'cat', kind: 'cat', label: 'Cat', rect: { x: 0.30, y: 0.50, w: 0.34, h: 0.34 }, confidence: 96, note: 'A big, high-contrast subject — an easy, high-confidence detection.' },
      { id: 'ball', kind: 'ball', label: 'Ball', rect: { x: 0.72, y: 0.72, w: 0.16, h: 0.20 }, confidence: 88, note: 'Round, bright, well-lit — the detector is confident.' },
      { id: 'bird', kind: 'bird', label: 'Bird', rect: { x: 0.78, y: 0.16, w: 0.14, h: 0.16 }, confidence: 54, low: true, minBand: 'C', note: 'Small and half-hidden in leaves — the detector is UNSURE (54%).' },
    ],
  },
  {
    id: 'street', name: 'Street Corner', bg: 'street', baseXP: 70, authentic: true,
    brief: 'A crossing. Find the things a self-driving car must localise.',
    c2pa: 'Content Credentials: captured on a DSLR camera. Signature valid.',
    objects: [
      { id: 'stop', kind: 'stopSign', label: 'Stop sign', rect: { x: 0.62, y: 0.28, w: 0.22, h: 0.36 }, confidence: 98, note: 'Bold shape and colour — the strongest detection in the frame.' },
      { id: 'person', kind: 'person', label: 'Person', rect: { x: 0.20, y: 0.42, w: 0.16, h: 0.40 }, confidence: 91, note: 'A pedestrian — a safety-critical, high-confidence box.' },
      { id: 'dog', kind: 'dog', label: 'Dog', rect: { x: 0.08, y: 0.70, w: 0.18, h: 0.18 }, confidence: 61, low: true, minBand: 'C', note: 'Low and small near the kerb — only 61% sure.' },
    ],
  },
  {
    id: 'portrait', name: 'Selfie Portrait', bg: 'portrait', baseXP: 90, authentic: false,
    brief: 'A close-up portrait. Box the face — then check who really made this image.',
    c2pa: 'Content Credentials: generated with an AI image model. No camera signature.',
    objects: [
      { id: 'face', kind: 'face', label: 'Face', rect: { x: 0.32, y: 0.18, w: 0.36, h: 0.46 }, confidence: 95, note: 'Face detectors are very good — a clean, high-confidence box.' },
      { id: 'hand', kind: 'hand', label: 'Hand', rect: { x: 0.58, y: 0.60, w: 0.24, h: 0.30 }, confidence: 49, low: true, note: 'The detector is UNSURE (49%): AI-drawn hands warp and grow extra fingers.' },
    ],
  },
  {
    id: 'park', name: 'Park Play', bg: 'park', baseXP: 110, authentic: true,
    brief: 'A dog catching a frisbee. Box every object the detector should fire on.',
    c2pa: 'Content Credentials: captured on a mirrorless camera. Signature valid.',
    objects: [
      { id: 'dog', kind: 'dog', label: 'Dog', rect: { x: 0.28, y: 0.50, w: 0.32, h: 0.32 }, confidence: 93, note: 'A clear, central subject — high confidence.' },
      { id: 'frisbee', kind: 'frisbee', label: 'Frisbee', rect: { x: 0.64, y: 0.28, w: 0.22, h: 0.14 }, confidence: 78, note: 'Small and mid-air, but distinct — a solid detection.' },
      { id: 'kite', kind: 'kite', label: 'Kite', rect: { x: 0.12, y: 0.12, w: 0.18, h: 0.18 }, confidence: 58, low: true, minBand: 'C', note: 'Far away against the sky — only 58% sure.' },
    ],
  },
  {
    id: 'desk', name: 'Desk Scene', bg: 'desk', baseXP: 130, authentic: false,
    brief: 'A cluttered desk with things behind other things. Box each object — even the hidden ones.',
    c2pa: 'Content Credentials: AI-generated. Look closely: the text on the book is scrambled.',
    objects: [
      { id: 'laptop', kind: 'laptop', label: 'Laptop', rect: { x: 0.34, y: 0.42, w: 0.34, h: 0.30 }, confidence: 90, note: 'A large, boxy object — confidently localised.' },
      { id: 'mug', kind: 'mug', label: 'Mug (occluded)', rect: { x: 0.62, y: 0.48, w: 0.14, h: 0.22 }, confidence: 66, low: true, note: 'Half-hidden behind the laptop — occlusion drops confidence to 66%.' },
      { id: 'cat', kind: 'cat', label: 'Cat (peeking)', rect: { x: 0.08, y: 0.34, w: 0.16, h: 0.24 }, confidence: 71, minBand: 'C', note: 'Only a slice of the cat is visible at the edge — a partial detection.' },
    ],
  },
];

const GRID: Record<Band, { cols: number; rows: number }> = {
  A: { cols: 4, rows: 3 },
  B: { cols: 5, rows: 4 },
  C: { cols: 6, rows: 4 },
};

// ── Deterministic geometry: which cells each object truly occupies ──────
function overlapArea(a: NRect, b: NRect): number {
  const ox = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return ox * oy;
}

interface SceneGeom {
  cols: number;
  rows: number;
  present: SceneObject[];
  cellOwner: (string | undefined)[];   // per cell → object id occupying it
  objectCells: Record<string, number[]>;
  trueCells: Set<number>;
}

function buildGeom(scene: Scene, band: Band): SceneGeom {
  const { cols, rows } = GRID[band];
  const present = scene.objects.filter((o) => rank[band] >= rank[o.minBand || 'A']);
  const cellOwner: (string | undefined)[] = new Array(cols * rows).fill(undefined);
  const objectCells: Record<string, number[]> = {};
  const cellArea = (1 / cols) * (1 / rows);
  present.forEach((o) => { objectCells[o.id] = []; });
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const cellR: NRect = { x: c / cols, y: r / rows, w: 1 / cols, h: 1 / rows };
      // a cell belongs to whichever present object covers >40% of it (most overlap wins)
      let best: SceneObject | null = null;
      let bestArea = 0.4 * cellArea;
      for (const o of present) {
        const ov = overlapArea(cellR, o.rect);
        if (ov > bestArea) { bestArea = ov; best = o; }
      }
      if (best) { cellOwner[i] = best.id; objectCells[best.id].push(i); }
    }
  }
  const trueCells = new Set<number>();
  cellOwner.forEach((id, i) => { if (id) trueCells.add(i); });
  return { cols, rows, present, cellOwner, objectCells, trueCells };
}

// ── Scoring (honest F1 over object footprints) ──────────────────────────
interface Result {
  score: number;                 // 0..100
  stars: 1 | 2 | 3;
  xp: number;
  hits: number; misses: number; falseAlarms: number;
  found: Record<string, boolean>;
  c2paCorrect: boolean | null;
}

function computeResult(scene: Scene, band: Band, geom: SceneGeom, flags: Set<number>, c2paPick: boolean | null): Result {
  const T = geom.trueCells;
  let hits = 0;
  let falseAlarms = 0;
  flags.forEach((i) => { if (T.has(i)) hits += 1; else falseAlarms += 1; });
  const misses = T.size - hits;
  const precision = flags.size ? hits / flags.size : 0;
  const recall = T.size ? hits / T.size : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;

  const found: Record<string, boolean> = {};
  geom.present.forEach((o) => {
    const cells = geom.objectCells[o.id];
    const flagged = cells.filter((i) => flags.has(i)).length;
    found[o.id] = cells.length > 0 && flagged >= Math.ceil(cells.length / 2);
  });

  const c2paCorrect = band === 'C' && c2paPick !== null ? c2paPick === scene.authentic : null;
  const detection = Math.round(f1 * 100);
  const score = band === 'C'
    ? Math.round(detection * 0.8 + (c2paCorrect ? 20 : 0))
    : detection;

  const stars: 1 | 2 | 3 = score >= 80 ? 3 : score >= 55 ? 2 : 1;
  const xp = Math.round(scene.baseXP * (stars / 3));
  return { score, stars, xp, hits, misses, falseAlarms, found, c2paCorrect };
}

// ════════════════════════════════════════════════════════════════════════
// SVG SCENE DRAWING (illustrated "photo" — this is the game content)
// ════════════════════════════════════════════════════════════════════════
function px(r: NRect) { return { x: r.x * VW, y: r.y * VH, w: r.w * VW, h: r.h * VH }; }

function octagon(cx: number, cy: number, rad: number): string {
  const pts: string[] = [];
  for (let k = 0; k < 8; k++) {
    const a = (Math.PI / 8) + (k * Math.PI) / 4;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function drawObject(o: SceneObject) {
  const p = px(o.rect);
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  switch (o.kind) {
    case 'cat': return (
      <g>
        <ellipse cx={cx} cy={p.y + p.h * 0.68} rx={p.w * 0.44} ry={p.h * 0.30} fill="#B4783F" />
        <circle cx={p.x + p.w * 0.34} cy={p.y + p.h * 0.34} r={p.w * 0.24} fill="#C58B52" />
        <polygon points={`${p.x + p.w * 0.16},${p.y + p.h * 0.12} ${p.x + p.w * 0.30},${p.y + p.h * 0.30} ${p.x + p.w * 0.06},${p.y + p.h * 0.30}`} fill="#C58B52" />
        <polygon points={`${p.x + p.w * 0.52},${p.y + p.h * 0.12} ${p.x + p.w * 0.56},${p.y + p.h * 0.30} ${p.x + p.w * 0.36},${p.y + p.h * 0.28}`} fill="#C58B52" />
        <circle cx={p.x + p.w * 0.28} cy={p.y + p.h * 0.34} r={2.4} fill="#20303f" />
        <circle cx={p.x + p.w * 0.42} cy={p.y + p.h * 0.34} r={2.4} fill="#20303f" />
        <path d={`M ${p.x + p.w * 0.86} ${p.y + p.h * 0.66} q ${p.w * 0.22} -${p.h * 0.2} ${p.w * 0.06} -${p.h * 0.42}`} stroke="#B4783F" strokeWidth={6} fill="none" strokeLinecap="round" />
      </g>
    );
    case 'ball': return (
      <g>
        <circle cx={cx} cy={cy} r={Math.min(p.w, p.h) / 2} fill="#E94F6B" />
        <path d={`M ${cx - p.w * 0.4} ${cy} q ${p.w * 0.4} -${p.h * 0.35} ${p.w * 0.8} 0`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.85} />
        <circle cx={cx - p.w * 0.14} cy={cy - p.h * 0.16} r={4} fill="#fff" opacity={0.7} />
      </g>
    );
    case 'bird': return (
      <g>
        <ellipse cx={cx} cy={cy} rx={p.w * 0.38} ry={p.h * 0.26} fill="#6C8CFF" />
        <circle cx={p.x + p.w * 0.72} cy={p.y + p.h * 0.36} r={p.w * 0.2} fill="#6C8CFF" />
        <polygon points={`${p.x + p.w * 0.9},${p.y + p.h * 0.34} ${p.x + p.w * 1.02},${p.y + p.h * 0.4} ${p.x + p.w * 0.9},${p.y + p.h * 0.46}`} fill="#F6B44C" />
        <path d={`M ${cx} ${cy - 2} q ${p.w * 0.2} ${p.h * 0.2} ${p.w * 0.4} 0`} stroke="#3f5bd0" strokeWidth={3} fill="none" />
      </g>
    );
    case 'stopSign': return (
      <g>
        <rect x={cx - 3} y={cy} width={6} height={p.h * 0.5} fill="#8b96a8" />
        <polygon points={octagon(cx, p.y + p.h * 0.32, Math.min(p.w, p.h) * 0.34)} fill="#E23B3B" stroke="#fff" strokeWidth={3} />
        <text x={cx} y={p.y + p.h * 0.37} fontSize={p.w * 0.18} fontWeight="700" fill="#fff" textAnchor="middle">STOP</text>
      </g>
    );
    case 'person': return (
      <g>
        <circle cx={cx} cy={p.y + p.h * 0.14} r={p.w * 0.28} fill="#E8B98A" />
        <path d={`M ${cx - p.w * 0.32} ${p.y + p.h} L ${cx - p.w * 0.22} ${p.y + p.h * 0.30} Q ${cx} ${p.y + p.h * 0.24} ${cx + p.w * 0.22} ${p.y + p.h * 0.30} L ${cx + p.w * 0.32} ${p.y + p.h} Z`} fill="#4F8EF7" />
        <rect x={cx - p.w * 0.16} y={p.y + p.h * 0.7} width={p.w * 0.12} height={p.h * 0.3} fill="#2b3b6b" />
        <rect x={cx + p.w * 0.04} y={p.y + p.h * 0.7} width={p.w * 0.12} height={p.h * 0.3} fill="#2b3b6b" />
      </g>
    );
    case 'dog': return (
      <g>
        <ellipse cx={cx} cy={p.y + p.h * 0.64} rx={p.w * 0.42} ry={p.h * 0.28} fill="#C9A36B" />
        <circle cx={p.x + p.w * 0.74} cy={p.y + p.h * 0.42} r={p.w * 0.22} fill="#C9A36B" />
        <ellipse cx={p.x + p.w * 0.66} cy={p.y + p.h * 0.34} rx={p.w * 0.08} ry={p.h * 0.16} fill="#a5824f" />
        <circle cx={p.x + p.w * 0.84} cy={p.y + p.h * 0.44} r={3} fill="#33241a" />
        <ellipse cx={p.x + p.w * 0.9} cy={p.y + p.h * 0.5} rx={4} ry={3} fill="#33241a" />
        <rect x={p.x + p.w * 0.22} y={p.y + p.h * 0.78} width={5} height={p.h * 0.2} fill="#a5824f" />
        <rect x={p.x + p.w * 0.5} y={p.y + p.h * 0.78} width={5} height={p.h * 0.2} fill="#a5824f" />
      </g>
    );
    case 'frisbee': return (
      <g>
        <ellipse cx={cx} cy={cy} rx={p.w * 0.5} ry={p.h * 0.5} fill="#33C4A0" />
        <ellipse cx={cx} cy={cy - p.h * 0.08} rx={p.w * 0.3} ry={p.h * 0.28} fill="#0E1526" opacity={0.18} />
      </g>
    );
    case 'kite': return (
      <g>
        <polygon points={`${cx},${p.y} ${p.x + p.w},${cy} ${cx},${p.y + p.h} ${p.x},${cy}`} fill="#E94F6B" stroke="#fff" strokeWidth={1.5} />
        <line x1={cx} y1={p.y} x2={cx} y2={p.y + p.h} stroke="#fff" strokeWidth={1} opacity={0.6} />
        <path d={`M ${cx} ${p.y + p.h} q 6 10 -4 16 q -10 6 0 16`} stroke="#F6B44C" strokeWidth={2} fill="none" />
      </g>
    );
    case 'face': return (
      <g>
        <path d={`M ${p.x} ${cy} Q ${p.x} ${p.y} ${cx} ${p.y} Q ${p.x + p.w} ${p.y} ${p.x + p.w} ${cy}`} fill="#3A2E28" />
        <ellipse cx={cx} cy={cy} rx={p.w * 0.4} ry={p.h * 0.44} fill="#E8C39A" />
        <circle cx={cx - p.w * 0.16} cy={cy - p.h * 0.05} r={4} fill="#2b2320" />
        <circle cx={cx + p.w * 0.16} cy={cy - p.h * 0.05} r={4} fill="#2b2320" />
        <path d={`M ${cx - p.w * 0.14} ${cy + p.h * 0.2} q ${p.w * 0.14} ${p.h * 0.12} ${p.w * 0.28} 0`} stroke="#a6685a" strokeWidth={3} fill="none" strokeLinecap="round" />
      </g>
    );
    case 'hand': return (
      <g>
        <rect x={p.x + p.w * 0.2} y={p.y + p.h * 0.45} width={p.w * 0.6} height={p.h * 0.5} rx={8} fill="#E8C39A" />
        {/* six fingers — the AI-generation tell */}
        {[0.16, 0.31, 0.46, 0.61, 0.76, 0.9].map((fx, i) => (
          <rect key={i} x={p.x + p.w * fx} y={p.y + p.h * (0.12 + (i % 2) * 0.06)} width={p.w * 0.1} height={p.h * 0.4} rx={5} fill="#E8C39A" />
        ))}
      </g>
    );
    case 'laptop': return (
      <g>
        <polygon points={`${p.x + p.w * 0.06},${p.y + p.h} ${p.x + p.w * 0.94},${p.y + p.h} ${p.x + p.w * 0.82},${p.y + p.h * 0.82} ${p.x + p.w * 0.18},${p.y + p.h * 0.82}`} fill="#9aa6bd" />
        <rect x={p.x + p.w * 0.18} y={p.y + p.h * 0.08} width={p.w * 0.64} height={p.h * 0.74} rx={4} fill="#1b2740" stroke="#4a5876" strokeWidth={2} />
        <rect x={p.x + p.w * 0.24} y={p.y + p.h * 0.16} width={p.w * 0.52} height={p.h * 0.5} rx={2} fill="#25406b" />
        <rect x={p.x + p.w * 0.28} y={p.y + p.h * 0.22} width={p.w * 0.3} height={4} rx={2} fill={CYAN} opacity={0.7} />
        <rect x={p.x + p.w * 0.28} y={p.y + p.h * 0.32} width={p.w * 0.4} height={4} rx={2} fill={LAB} opacity={0.55} />
      </g>
    );
    case 'mug': return (
      <g>
        <rect x={p.x + p.w * 0.16} y={p.y + p.h * 0.2} width={p.w * 0.56} height={p.h * 0.72} rx={6} fill="#4F6EF7" />
        <path d={`M ${p.x + p.w * 0.72} ${p.y + p.h * 0.34} q ${p.w * 0.28} 0 ${p.w * 0.24} ${p.h * 0.24} q 0 ${p.h * 0.2} -${p.w * 0.24} ${p.h * 0.14}`} stroke="#4F6EF7" strokeWidth={5} fill="none" />
        <path d={`M ${p.x + p.w * 0.3} ${p.y + p.h * 0.12} q 6 -8 0 -14`} stroke="#cfd8ea" strokeWidth={2} fill="none" opacity={0.6} />
      </g>
    );
    default: return null;
  }
}

function drawBackground(bg: Scene['bg']) {
  switch (bg) {
    case 'yard': return (
      <g>
        <rect x={0} y={0} width={VW} height={VH} fill="#8fd3ff" />
        <rect x={0} y={VH * 0.5} width={VW} height={VH * 0.5} fill="#5fb35a" />
        <circle cx={60} cy={55} r={30} fill="#FFE28A" />
        <rect x={330} y={70} width={14} height={130} fill="#7a5230" />
        <ellipse cx={337} cy={80} rx={54} ry={44} fill="#3f8f45" />
      </g>
    );
    case 'street': return (
      <g>
        <rect x={0} y={0} width={VW} height={VH} fill="#9fb6cf" />
        <rect x={0} y={VH * 0.62} width={VW} height={VH * 0.38} fill="#4a4f5c" />
        <rect x={40} y={70} width={70} height={120} fill="#6f7d95" />
        <rect x={300} y={50} width={80} height={140} fill="#5f6d85" />
        {[60, 160, 260].map((x) => <rect key={x} x={x} y={VH * 0.8} width={40} height={8} fill="#e8ecf3" />)}
      </g>
    );
    case 'portrait': return (
      <g>
        <rect x={0} y={0} width={VW} height={VH} fill="#20304f" />
        <ellipse cx={VW / 2} cy={VH * 0.4} rx={180} ry={150} fill="#33507f" opacity={0.6} />
        <path d={`M ${VW * 0.18} ${VH} Q ${VW / 2} ${VH * 0.7} ${VW * 0.82} ${VH} Z`} fill="#2a3d63" />
      </g>
    );
    case 'park': return (
      <g>
        <rect x={0} y={0} width={VW} height={VH} fill="#a9e0ff" />
        <rect x={0} y={VH * 0.66} width={VW} height={VH * 0.34} fill="#6cbf57" />
        <rect x={40} y={120} width={12} height={80} fill="#7a5230" />
        <ellipse cx={46} cy={120} rx={40} ry={34} fill="#3f8f45" />
        <rect x={330} y={110} width={12} height={90} fill="#7a5230" />
        <ellipse cx={336} cy={110} rx={42} ry={36} fill="#3f8f45" />
      </g>
    );
    case 'desk': return (
      <g>
        <rect x={0} y={0} width={VW} height={VH} fill="#2c2438" />
        <rect x={0} y={VH * 0.66} width={VW} height={VH * 0.34} fill="#8a5a3c" />
        <rect x={40} y={210} width={90} height={60} rx={3} fill="#c94f6b" transform="rotate(-6 85 240)" />
        {/* scrambled "text" — the AI-generation tell */}
        {[224, 236, 248].map((y, i) => <rect key={i} x={52} y={y} width={60 - i * 8} height={4} rx={2} fill="#f2dfe6" opacity={0.7} transform="rotate(-6 85 240)" />)}
      </g>
    );
    default: return null;
  }
}

// ── SVG edge-detection filter (band-C "feature map" view) ───────────────
function EdgeFilterDef() {
  return (
    <defs>
      <filter id="pi-edge" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values="0" result="g" />
        <feConvolveMatrix in="g" order="3" preserveAlpha="true"
          kernelMatrix="0 -1 0  -1 4 -1  0 -1 0" result="e" />
        <feComponentTransfer in="e" result="b">
          <feFuncR type="linear" slope="2.4" />
          <feFuncG type="linear" slope="2.4" />
          <feFuncB type="linear" slope="2.4" />
        </feComponentTransfer>
        <feColorMatrix in="b" type="matrix"
          values="0.9 0 0 0 0.06  0.2 0 0.9 0 0.02  0.9 0 0.7 0 0.12  0 0 0 1 0" />
      </filter>
    </defs>
  );
}

// ════════════════════════════════════════════════════════════════════════
// Small shared UI bits
// ════════════════════════════════════════════════════════════════════════
function StarRow({ count, size = 16 }: { count: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map((s) => (
        <Star key={s} width={size} height={size}
          style={{ color: s <= count ? '#FFD54A' : 'rgba(255,255,255,0.18)', fill: s <= count ? '#FFD54A' : 'none' }} />
      ))}
    </span>
  );
}

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
      {children}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════
// SCENE VIEW — brief → inspect (scan + flag) → result
// ════════════════════════════════════════════════════════════════════════
function SceneView({
  scene, band, onSolve, onExit,
}: {
  scene: Scene; band: Band; onSolve: (r: Result) => void; onExit: () => void;
}) {
  const geom = useMemo(() => buildGeom(scene, band), [scene, band]);
  const { cols, rows } = geom;
  const cellCount = cols * rows;

  const [phase, setPhase] = useState<'brief' | 'inspect' | 'result'>('brief');
  const [tool, setTool] = useState<'reveal' | 'flag'>('flag');
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [edgeOn, setEdgeOn] = useState(false);
  const [c2paPick, setC2paPick] = useState<boolean | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [announce, setAnnounce] = useState('');

  const canEdge = band === 'C';
  const asksC2pa = band === 'C';
  const done = phase === 'result';

  const rc = (i: number) => ({ r: Math.floor(i / cols) + 1, c: (i % cols) + 1 });

  const onCell = useCallback((i: number) => {
    if (done) return;
    if (tool === 'reveal') {
      setRevealed((prev) => {
        const next = new Set(prev); next.add(i); return next;
      });
      const { r, c } = rc(i);
      setAnnounce(`Uncovered patch row ${r}, column ${c}.`);
    } else {
      setFlags((prev) => {
        const next = new Set(prev);
        if (next.has(i)) next.delete(i); else next.add(i);
        const { r, c } = rc(i);
        setAnnounce(next.has(i) ? `Flagged cell row ${r}, column ${c}.` : `Removed flag at row ${r}, column ${c}.`);
        return next;
      });
    }
  }, [done, tool, cols]);

  const revealAll = useCallback(() => {
    setRevealed(new Set(Array.from({ length: cellCount }, (_, i) => i)));
    setAnnounce('All patches uncovered.');
  }, [cellCount]);

  const commit = useCallback(() => {
    const r = computeResult(scene, band, geom, flags, asksC2pa ? c2paPick : null);
    setResult(r);
    setRevealed(new Set(Array.from({ length: cellCount }, (_, i) => i)));
    setPhase('result');
    setAnnounce(
      `Detector revealed. You matched ${r.hits} object cells, missed ${r.misses}, and raised ${r.falseAlarms} false alarms. ${r.stars} of 3 stars.`,
    );
  }, [scene, band, geom, flags, asksC2pa, c2paPick, cellCount]);

  const sceneShown = edgeOn && canEdge; // feature-map view uncovers everything

  // ─ BRIEF ─
  if (phase === 'brief') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${LAB}22`, border: `1px solid ${LAB}55` }}>
            <ScanSearch className="h-5 w-5" style={{ color: LAB }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: INK }}>{scene.name}</h2>
            <p className="text-xs" style={{ color: MUTE }}>Localise the objects a vision model should box.</p>
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: SURFACE, border: `1px solid ${HAIR}` }}>
          <p className="text-sm" style={{ color: BODY }}>{scene.brief}</p>
          <ul className="mt-3 space-y-1.5 text-xs" style={{ color: MUTE }}>
            <li className="flex items-center gap-2"><Search className="h-3.5 w-3.5" style={{ color: CYAN }} /> Tap tiles to uncover sharp pixel patches.</li>
            <li className="flex items-center gap-2"><Flag className="h-3.5 w-3.5" style={{ color: LAB }} /> Switch to Flag and box where objects are.</li>
            <li className="flex items-center gap-2"><ScanSearch className="h-3.5 w-3.5" style={{ color: GOOD }} /> Commit to reveal the detector and its confidence.</li>
            {canEdge && <li className="flex items-center gap-2"><Layers className="h-3.5 w-3.5" style={{ color: '#B78CFF' }} /> Feature filter shows the scene as edges — the model&apos;s view.</li>}
            {asksC2pa && <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" style={{ color: MISS }} /> Check the Content Credentials: real photo or AI-made?</li>}
          </ul>
        </div>
        <SFButton variant="primary" size="lg" fullWidth onClick={() => setPhase('inspect')}>
          Start inspecting <ChevronRight className="ml-1 h-5 w-5" />
        </SFButton>
      </div>
    );
  }

  // ─ INSPECT / RESULT ─ (shared board)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanSearch className="h-5 w-5" style={{ color: LAB }} />
          <span className="text-base font-bold" style={{ color: INK }}>{scene.name}</span>
        </div>
        <span className="text-xs font-semibold" style={{ color: MUTE }}>
          {done ? 'Detector revealed' : `${flags.size} flagged`}
        </span>
      </div>

      {/* Tools */}
      {!done && (
        <div className="flex flex-wrap gap-2" role="toolbar" aria-label="Inspection tools">
          <ToolBtn active={tool === 'reveal'} color={CYAN} icon={<Search className="h-4 w-4" />} label="Reveal" onClick={() => setTool('reveal')} />
          <ToolBtn active={tool === 'flag'} color={LAB} icon={<Flag className="h-4 w-4" />} label="Flag" onClick={() => setTool('flag')} />
          <ToolBtn active={false} color={MUTE} icon={<Eye className="h-4 w-4" />} label="Reveal all" onClick={revealAll} />
          {canEdge && (
            <ToolBtn active={edgeOn} color="#B78CFF" icon={<Layers className="h-4 w-4" />} label={edgeOn ? 'Feature map: on' : 'Feature map'} onClick={() => setEdgeOn((v) => !v)} />
          )}
        </div>
      )}

      {/* The scene board */}
      <div className="relative mx-auto w-full overflow-hidden rounded-2xl"
        style={{ aspectRatio: `${VW} / ${VH}`, background: '#0b1220', border: `1px solid ${HAIR}`, maxWidth: 520 }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <EdgeFilterDef />
          <g filter={sceneShown ? 'url(#pi-edge)' : undefined}>
            {drawBackground(scene.bg)}
            {geom.present.map((o) => (
              <g key={o.id} opacity={o.minBand === 'C' || o.low ? 0.96 : 1}>{drawObject(o)}</g>
            ))}
          </g>

          {/* detector bounding boxes — only after commit */}
          {done && geom.present.map((o) => {
            const b = px(o.rect);
            const col = result?.found[o.id] ? GOOD : MISS;
            return (
              <g key={`box-${o.id}`}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="none"
                  stroke={col} strokeWidth={2.5} strokeDasharray={o.low ? '6 4' : undefined} rx={3} />
                <rect x={b.x} y={Math.max(0, b.y - 15)} width={Math.max(58, o.label.length * 6.4)} height={14} fill={col} rx={2} />
                <text x={b.x + 3} y={Math.max(11, b.y - 4)} fontSize={9.5} fontWeight="700" fill="#08111f">
                  {o.label} {o.confidence}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Interactive cell grid (real buttons — keyboard + ARIA) */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
          {Array.from({ length: cellCount }, (_, i) => {
            const { r, c } = rc(i);
            const isRevealed = revealed.has(i) || sceneShown;
            const isFlagged = flags.has(i);
            const owner = geom.cellOwner[i];
            // result colouring
            let ring = 'transparent';
            let fillTint = 'transparent';
            if (done) {
              if (owner && isFlagged) { ring = GOOD; fillTint = `${GOOD}26`; }        // hit
              else if (owner && !isFlagged) { ring = MISS; fillTint = `${MISS}22`; }   // missed object
              else if (!owner && isFlagged) { ring = BAD; fillTint = `${BAD}2a`; }     // false alarm
            } else if (isFlagged) { ring = LAB; fillTint = `${LAB}22`; }

            const label = done
              ? `Row ${r}, column ${c}: ${owner ? 'object here' : 'no object'}${isFlagged ? ', you flagged it' : ''}`
              : `Row ${r}, column ${c}${isRevealed ? ', patch uncovered' : ', covered'}${isFlagged ? ', flagged' : ''}. ${tool === 'reveal' ? 'Uncover patch' : 'Toggle flag'}`;

            return (
              <button
                key={i}
                type="button"
                disabled={done}
                onClick={() => onCell(i)}
                aria-label={label}
                aria-pressed={isFlagged}
                className="relative border border-black/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:z-10"
                style={{
                  background: isRevealed ? fillTint : '#131c30',
                  backdropFilter: isRevealed ? undefined : 'blur(5px)',
                  boxShadow: ring !== 'transparent' ? `inset 0 0 0 2.5px ${ring}` : undefined,
                  cursor: done ? 'default' : 'pointer',
                  ['--tw-ring-color' as string]: LAB,
                }}
              >
                {/* covered = pixelated frost */}
                {!isRevealed && (
                  <span aria-hidden="true" className="absolute inset-0" style={{
                    backgroundImage:
                      'linear-gradient(45deg, rgba(255,255,255,0.10) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.10) 75%), linear-gradient(45deg, rgba(255,255,255,0.10) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.10) 75%)',
                    backgroundSize: '12px 12px',
                    backgroundPosition: '0 0, 6px 6px',
                    opacity: 0.5,
                  }} />
                )}
                {isFlagged && (
                  <Flag aria-hidden="true" className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2"
                    style={{ color: done ? (owner ? GOOD : BAD) : LAB, fill: done ? (owner ? GOOD : BAD) : LAB }} />
                )}
                {done && owner && !isFlagged && (
                  <X aria-hidden="true" className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2" style={{ color: MISS }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">{announce}</p>

      {/* INSPECT controls */}
      {!done && (
        <div className="flex gap-2">
          <SFButton variant="primary" className="flex-1" onClick={commit}>
            <ScanSearch className="mr-2 h-4 w-4" /> Commit detection
          </SFButton>
          <SFButton variant="outline" onClick={onExit} aria-label="Back to case list">
            <ChevronLeft className="h-4 w-4" />
          </SFButton>
        </div>
      )}

      {/* RESULT */}
      {done && result && (
        <ResultPanel scene={scene} band={band} geom={geom} flags={flags}
          c2paPick={c2paPick} onPickC2pa={setC2paPick}
          onFinish={() => onSolve(computeResult(scene, band, geom, flags, asksC2pa ? c2paPick : null))}
          asksC2pa={asksC2pa} />
      )}
    </div>
  );
}

function ToolBtn({ active, color, icon, label, onClick }: {
  active: boolean; color: string; icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: active ? `${color}26` : PANEL,
        color: active ? color : BODY,
        border: `1px solid ${active ? color : HAIR}`,
        ['--tw-ring-color' as string]: color,
      }}>
      {icon}{label}
    </button>
  );
}

// ── Result panel: detector comparison + C2PA clue + stars ───────────────
function ResultPanel({
  scene, band, geom, flags, c2paPick, onPickC2pa, onFinish, asksC2pa,
}: {
  scene: Scene; band: Band; geom: SceneGeom; flags: Set<number>;
  c2paPick: boolean | null; onPickC2pa: (v: boolean) => void; onFinish: () => void; asksC2pa: boolean;
}) {
  // Live result folds in the C2PA answer (answered after commit) — the found
  // map is C2PA-independent, so the comparison list is stable either way.
  const result = useMemo(
    () => computeResult(scene, band, geom, flags, asksC2pa ? c2paPick : null),
    [scene, band, geom, flags, asksC2pa, c2paPick],
  );
  const c2paAnswered = c2paPick !== null;
  const c2paCorrect = c2paAnswered ? c2paPick === scene.authentic : null;

  return (
    <div className="space-y-3" aria-live="polite">
      {/* Detector comparison */}
      <div className="rounded-2xl p-3" style={{ background: SURFACE, border: `1px solid ${HAIR}` }}>
        <div className="mb-2 flex items-center gap-2">
          <Info className="h-4 w-4" style={{ color: CYAN }} />
          <span className="text-sm font-bold" style={{ color: INK }}>Detector vs your flags</span>
        </div>
        <div className="space-y-1.5">
          {geom.present.map((o) => (
            <div key={o.id} className="flex items-start gap-2 rounded-lg p-2" style={{ background: CELL }}>
              {result.found[o.id]
                ? <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: GOOD }} />
                : <X className="mt-0.5 h-4 w-4 shrink-0" style={{ color: MISS }} />}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold" style={{ color: INK }}>{o.label}</span>
                  <Pill color={o.low ? MISS : GOOD}>{o.confidence}%{o.low ? ' • unsure' : ''}</Pill>
                  <Pill color={result.found[o.id] ? GOOD : MISS}>{result.found[o.id] ? 'you boxed it' : 'you missed it'}</Pill>
                </div>
                <p className="mt-0.5 text-xs" style={{ color: MUTE }}>{o.note}</p>
              </div>
            </div>
          ))}
          {result.falseAlarms > 0 && (
            <div className="flex items-center gap-2 rounded-lg p-2" style={{ background: `${BAD}18` }}>
              <X className="h-4 w-4 shrink-0" style={{ color: BAD }} />
              <span className="text-xs" style={{ color: BODY }}>
                {result.falseAlarms} false alarm{result.falseAlarms > 1 ? 's' : ''}: you flagged {result.falseAlarms} cell{result.falseAlarms > 1 ? 's' : ''} where the detector fires nothing.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* C2PA clue (band C) */}
      {asksC2pa && (
        <div className="rounded-2xl p-3" style={{ background: SURFACE, border: `1px solid ${MISS}44` }}>
          <div className="mb-1.5 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" style={{ color: MISS }} />
            <span className="text-sm font-bold" style={{ color: INK }}>Content Credentials (C2PA)</span>
          </div>
          <p className="mb-2 text-xs" style={{ color: BODY }}>
            {c2paAnswered ? scene.c2pa : 'Provenance data is attached to this image. Before you read it: was this a real camera photo, or AI-generated?'}
          </p>
          <div className="flex gap-2" role="radiogroup" aria-label="Was this image camera-captured or AI-generated?">
            {[
              { v: true, label: 'Camera-captured', icon: <Camera className="h-4 w-4" /> },
              { v: false, label: 'AI-generated', icon: <Sparkles className="h-4 w-4" /> },
            ].map((opt) => {
              const chosen = c2paPick === opt.v;
              const reveal = c2paAnswered && opt.v === scene.authentic;
              const col = reveal ? GOOD : chosen && !c2paCorrect ? BAD : LAB;
              return (
                <button key={String(opt.v)} type="button" role="radio" aria-checked={chosen}
                  disabled={c2paAnswered}
                  onClick={() => onPickC2pa(opt.v)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: (chosen || reveal) ? `${col}22` : PANEL,
                    color: (chosen || reveal) ? col : BODY,
                    border: `1px solid ${(chosen || reveal) ? col : HAIR}`,
                    ['--tw-ring-color' as string]: col,
                  }}>
                  {opt.icon}{opt.label}
                </button>
              );
            })}
          </div>
          {c2paAnswered && (
            <p className="mt-2 text-xs font-semibold" style={{ color: c2paCorrect ? GOOD : BAD }}>
              {c2paCorrect ? 'Correct — the credentials confirm it.' : `Not quite — the credentials say it is ${scene.authentic ? 'a real camera photo' : 'AI-generated'}.`}
            </p>
          )}
        </div>
      )}

      {/* Stars + finish */}
      <div className="rounded-2xl p-4 text-center" style={{ background: PANEL, border: `1px solid ${result.stars === 3 ? GOOD : LAB}55` }}>
        <div className="mb-1 flex justify-center"><StarRow count={result.stars} size={26} /></div>
        <p className="text-sm" style={{ color: BODY }}>
          Match score <strong style={{ color: INK }}>{result.score}</strong> / 100
        </p>
        <SFButton variant="primary" size="lg" fullWidth className="mt-3"
          disabled={asksC2pa && !c2paAnswered} onClick={onFinish}>
          {asksC2pa && !c2paAnswered ? 'Answer the credentials clue' : (<>Continue <ChevronRight className="ml-1 h-4 w-4" /></>)}
        </SFButton>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// CASE BOARD (level select) + ALL-COMPLETE
// ════════════════════════════════════════════════════════════════════════
const MAX_STARS = SCENES.length * 3;

function CaseBoard({ solved, onOpen, band }: {
  solved: Record<string, Result>; onOpen: (index: number) => void; band: Band;
}) {
  const totalStars = Object.values(solved).reduce((s, r) => s + r.stars, 0);
  const totalXP = Object.values(solved).reduce((s, r) => s + r.xp, 0);
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${LAB}22`, border: `1px solid ${LAB}55` }}>
          <ScanSearch className="h-5 w-5" style={{ color: LAB }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: INK }}>Pixel Investigator</h2>
          <div className="flex items-center gap-2 text-xs" style={{ color: MUTE }}>
            <Star className="h-3 w-3" style={{ color: '#FFD54A', fill: '#FFD54A' }} />
            {totalStars}/{MAX_STARS} stars
            <span>•</span>
            <Sparkles className="h-3 w-3" style={{ color: LAB }} /> {totalXP} XP
            <span>•</span>
            <span>Band {band}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="Investigation cases">
        {SCENES.map((sc, i) => {
          const done = solved[sc.id];
          const unlocked = i === 0 || !!solved[SCENES[i - 1].id];
          const objCount = sc.objects.filter((o) => rank[band] >= rank[o.minBand || 'A']).length;
          return (
            <button key={sc.id} type="button" disabled={!unlocked}
              onClick={() => unlocked && onOpen(i)}
              aria-label={unlocked
                ? `Case ${i + 1}: ${sc.name}, ${objCount} objects${done ? `, solved, ${done.stars} of 3 stars` : ', not solved yet'}`
                : `Case ${i + 1}: ${sc.name}, locked — solve the previous case first`}
              className="flex items-center gap-3 rounded-2xl p-3 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-45"
              style={{
                background: SURFACE, border: `1px solid ${done ? `${GOOD}55` : HAIR}`,
                cursor: unlocked ? 'pointer' : 'not-allowed',
                ['--tw-ring-color' as string]: LAB,
              }}>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: CELL }}>
                {unlocked ? <span className="text-sm font-bold" style={{ color: LAB }}>{i + 1}</span> : <Lock className="h-4 w-4" style={{ color: MUTE }} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold" style={{ color: INK }}>{sc.name}</div>
                <div className="text-xs" style={{ color: MUTE }}>{objCount} objects to localise</div>
              </div>
              {done ? <StarRow count={done.stars} /> : unlocked && <ChevronRight className="h-4 w-4" style={{ color: LAB }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AllComplete({ totalStars, totalXP, onReplay }: { totalStars: number; totalXP: number; onReplay: () => void }) {
  return (
    <motion.div className="absolute inset-0 z-50 grid place-items-center p-4"
      style={{ background: 'rgba(4,8,18,0.72)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div role="dialog" aria-modal="true"
        aria-label={`All cases closed: ${totalStars} of ${MAX_STARS} stars, ${totalXP} XP`}
        className="w-full max-w-sm rounded-3xl p-6 text-center"
        style={{ background: SURFACE, border: `1px solid ${LAB}55` }}
        initial={{ scale: 0.6, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 18 }}>
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full" style={{ background: `linear-gradient(135deg, ${LAB}, ${CYAN})` }}>
          <Trophy className="h-8 w-8" style={{ color: '#08111f' }} />
        </div>
        <h3 className="mb-1 text-xl font-bold" style={{ color: INK }}>Case closed!</h3>
        <p className="mb-4 text-sm" style={{ color: BODY }}>
          <strong style={{ color: INK }}>{totalStars}</strong>/{MAX_STARS} stars • <strong style={{ color: LAB }}>{totalXP} XP</strong>
        </p>
        <SFButton variant="primary" fullWidth onClick={onReplay}>
          <RotateCcw className="mr-2 h-4 w-4" /> Investigate again
        </SFButton>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════════
export default function PixelInvestigatorGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;

  const [solved, setSolved] = useState<Record<string, Result>>({});
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const firedRef = useRef(false);

  const totalStars = Object.values(solved).reduce((s, r) => s + r.stars, 0);
  const totalXP = Object.values(solved).reduce((s, r) => s + r.xp, 0);
  const allDone = Object.keys(solved).length === SCENES.length;

  const openCase = useCallback((index: number) => {
    setActiveIndex(index);
    setAttempt((a) => a + 1);
  }, []);

  const solveCase = useCallback((sceneId: string, r: Result) => {
    setSolved((prev) => {
      const existing = prev[sceneId];
      if (existing && (existing.stars > r.stars || (existing.stars === r.stars && existing.score >= r.score))) return prev;
      return { ...prev, [sceneId]: r };
    });
    setActiveIndex(null);
  }, []);

  useEffect(() => {
    if (!allDone || firedRef.current) return;
    firedRef.current = true;
    awardXP(totalXP);
    const stars: 1 | 2 | 3 = totalStars >= 12 ? 3 : totalStars >= 7 ? 2 : 1;
    completeGame('pixel-investigator', stars);
  }, [allDone, totalXP, totalStars, awardXP, completeGame]);

  const replay = useCallback(() => {
    firedRef.current = false;
    setSolved({});
    setActiveIndex(null);
  }, []);

  const activeScene = activeIndex !== null ? SCENES[activeIndex] : null;

  return (
    <GameShell title="Pixel Investigator" color={LAB} labNum={3}>
      <div className="relative p-4">
        {activeScene ? (
          <SceneView
            key={`${activeScene.id}-${attempt}`}
            scene={activeScene}
            band={band}
            onSolve={(r) => solveCase(activeScene.id, r)}
            onExit={() => setActiveIndex(null)}
          />
        ) : (
          <CaseBoard solved={solved} onOpen={openCase} band={band} />
        )}

        <AnimatePresence>
          {allDone && activeIndex === null && (
            <AllComplete totalStars={totalStars} totalXP={totalXP} onReplay={replay} />
          )}
        </AnimatePresence>
      </div>
    </GameShell>
  );
}
