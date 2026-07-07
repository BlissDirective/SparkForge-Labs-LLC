// ════════════════════════════════════════════════════════════════════════
// AI ART DETECTIVE v5 — Lab 4 (AI That Creates) — INSPECT + PROVENANCE
// ════════════════════════════════════════════════════════════════════════
// REDESIGN (audit §II.4 #14, verdict REDESIGN). The old build was a SORT
// clone: drag text clues ("Six-fingered hand") into Human/AI bins — no images,
// and a DATED curriculum. Hands / garbled text / melting backgrounds are
// largely SOLVED by 2026 image models, so training kids to trust those tells
// breeds overconfidence in dead giveaways.
//
// New mechanic — you are the detective on a real CASE:
//   1. Each level shows a PAIR of artworks (one human-made, one AI-made),
//      drawn here as SVG/CSS illustrations. We CANNOT ship real images, so
//      the art is hand-drawn vector content.
//   2. ZOOM into each artwork and FLAG suspicious hotspots. Some are genuine
//      AI artifacts; some are red herrings (a brushstroke, an artistic choice,
//      or a "tell" modern AI already fixed).
//   3. Run PROVENANCE checks on each artwork: Content Credentials (C2PA),
//      reverse image search, and source/context. This is the 2026 lesson —
//      artifacts fade, so provenance is the reliable layer.
//   4. Commit a VERDICT ("this one is AI"). We compute a real confidence % and
//      score from the evidence you actually gathered (honest — no guessing
//      reward). Then Sparky reveals the ground truth AND the process: why it
//      was detectable, or why it WASN'T and only the credentials gave it away.
//
// Arc across 5 levels: obvious old-style tells → the pivot where the AI image
// looks perfect and only provenance/context reveals the truth.
//
// Band A = clear visual tells (older glitches stay visible & count).
// Band C = the provenance/C2PA pivot — looking isn't enough; verify.
//
// Pixi dropped: this game no longer imports PixiBinSortStage / PixiStageSkeleton
// / BinSortItem. Everything (art, hotspots, verdict) is DOM/SVG, which also
// makes the game fully assertable in e2e without a WebGL canvas.

'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ChevronRight, GraduationCap, Target, RotateCcw, Sparkles,
  ZoomIn, ZoomOut, ShieldCheck, Search, MapPin, Gavel,
  Check, X, Crosshair, ScanLine,
} from 'lucide-react';
import { GameShell } from '@/components/game/GameShell';
import { useGameActions } from '@/stores/gameStore';
import { useJuice } from '@/components/juice/JuiceProvider';
import { SFButton } from '@/components/ui/SFButton';
import { useActiveChild } from '@/hooks/useChildren';
import GameLevelSystem, {
  type LevelConfig, type LevelResult,
} from '@/components/games/shared/GameLevelSystem';

const LAB_COLOR = '#D9A430';

// Dark-surface palette (Frost-Prismatic). Colors are inline; no low-opacity
// white text utilities are used anywhere in this file.
const SURFACE = '#141726';
const SURFACE_RAISED = '#1B1F31';
const TEXT_HI = '#EDEFF7';
const TEXT_MID = '#AEB4CC';
const TEXT_LO = '#8890AC';
const GOOD = '#39D98A';
const BAD = '#FF6B6B';

type Band = 'A' | 'B' | 'C';

// ════════════════════════════════════════════════════════════════════════
// LEVELS (5) — obvious tells → the "you can't tell by looking" pivot
// ════════════════════════════════════════════════════════════════════════
const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Count the Fingers', description: 'The oldest AI tell of all.', emoji: '🔍', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 50 },
  { id: 2, name: 'Words & Warps', description: 'Garbled text, melting shapes.', emoji: '🔍', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 3, name: 'The Tells Fade', description: 'Last year\'s giveaway is gone.', emoji: '🔍', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 4, name: 'Looks Flawless', description: 'Stop staring — start verifying.', emoji: '🔍', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 110 },
  { id: 5, name: 'Trust the Credentials', description: 'Even the signature is faked.', emoji: '🔍', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 150, isBonus: true },
];

// ════════════════════════════════════════════════════════════════════════
// DATA MODEL
// ════════════════════════════════════════════════════════════════════════
type Tell = 'always' | 'fadedForOlder' | 'never';
type SceneKey = 'portrait' | 'landscape' | 'cat' | 'cafe' | 'gallery';
type CheckType = 'credentials' | 'reverse' | 'context';

// A tell is "real" (genuine AI evidence) when it is an always-tell, or an
// older tell being shown to Band A (for Band B/C modern AI has fixed it —
// that's the whole 2026 lesson).
function isRealTell(tell: Tell, band: Band): boolean {
  return tell === 'always' || (tell === 'fadedForOlder' && band === 'A');
}

interface Hotspot {
  id: string;
  x: number; // 0–100, % across the artwork
  y: number; // 0–100, % down the artwork
  glitch?: string; // visual key drawn on the SVG
  tell: Tell;
  label: string; // what the child notices
  artifactWhy: string; // reveal when it IS a genuine tell
  cleanWhy: string; // reveal when it is NOT (or no longer) a tell
}

interface ProvResult {
  text: string;
  pointsTo: 'ai' | 'human' | 'inconclusive';
}

interface ArtImage {
  id: string;
  kind: 'human' | 'ai';
  scene: SceneKey;
  hotspots: Hotspot[];
  provenance: Record<CheckType, ProvResult>;
  signed?: boolean;
  brush?: boolean;
}

interface DetectiveCase {
  level: number;
  concept: string;
  human: ArtImage;
  ai: ArtImage;
  process: string; // the reveal explanation (the "why")
  provenanceTip: string;
}

const CHECK_WEIGHT: Record<CheckType, number> = { credentials: 4, reverse: 2, context: 2 };
const CHECK_META: Record<CheckType, { label: string; Icon: typeof ShieldCheck }> = {
  credentials: { label: 'Content Credentials (C2PA)', Icon: ShieldCheck },
  reverse: { label: 'Reverse image search', Icon: Search },
  context: { label: 'Check the source', Icon: MapPin },
};

function prov(kind: 'human' | 'ai', subject: string): Record<CheckType, ProvResult> {
  return kind === 'ai'
    ? {
      credentials: { pointsTo: 'ai', text: `Content Credentials (C2PA): "Generated with an AI image tool." A signed edit history is attached.` },
      reverse: { pointsTo: 'ai', text: `Reverse image search: no older copies exist anywhere. First posted days ago on an AI-art feed.` },
      context: { pointsTo: 'ai', text: `Source check: shared by an anonymous account that only posts generated ${subject}s — no sketches, no artist.` },
    }
    : {
      credentials: { pointsTo: 'human', text: `Content Credentials (C2PA): "Captured on a camera and edited by hand." No AI-generation step in the history.` },
      reverse: { pointsTo: 'human', text: `Reverse image search: matches this artist's portfolio from years ago and a gallery listing.` },
      context: { pointsTo: 'human', text: `Source check: posted by a verified illustrator who shares timelapse videos of this ${subject}.` },
    };
}

const CASES: DetectiveCase[] = [
  {
    level: 1,
    concept: 'The oldest AI tell is anatomy — especially hands. Zoom in and count the fingers.',
    ai: {
      id: 'c1-ai', kind: 'ai', scene: 'portrait',
      hotspots: [
        { id: 'c1a-hand', x: 70, y: 50, glitch: 'sixfingers', tell: 'always', label: 'the raised hand', artifactWhy: 'Six fingers! Older AI models were famous for miscounting fingers.', cleanWhy: 'The hand looks normal.' },
      ],
      provenance: prov('ai', 'portrait'),
    },
    human: {
      id: 'c1-human', kind: 'human', scene: 'portrait',
      hotspots: [
        { id: 'c1h-smudge', x: 40, y: 52, glitch: 'smudge', tell: 'never', label: 'a smudge on the cheek', artifactWhy: '', cleanWhy: 'Just loose shading from a real brush — not an error.' },
      ],
      provenance: prov('human', 'portrait'),
      signed: true, brush: true,
    },
    process: 'In 2023 the extra-finger tell was everywhere — and it worked here. But newer models fixed hands, so this giveaway is already fading. The sure check is the artwork\'s Content Credentials.',
    provenanceTip: 'Even when a glitch is obvious, confirm with Content Credentials (C2PA): a signed record of how the image was made.',
  },
  {
    level: 2,
    concept: 'Text-to-image models mangled two things: written text and background geometry.',
    ai: {
      id: 'c2-ai', kind: 'ai', scene: 'landscape',
      hotspots: [
        { id: 'c2a-sign', x: 50, y: 60, glitch: 'garbledSign', tell: 'always', label: 'the sign\'s text', artifactWhy: 'The letters are gibberish — early AI could not spell.', cleanWhy: 'The sign reads clearly.' },
        { id: 'c2a-peak', x: 28, y: 40, glitch: 'meltPeak', tell: 'always', label: 'the mountain ridge', artifactWhy: 'The ridge melts and warps unnaturally where two shapes fused.', cleanWhy: 'The ridge is solid.' },
      ],
      provenance: prov('ai', 'landscape'),
    },
    human: {
      id: 'c2-human', kind: 'human', scene: 'landscape',
      hotspots: [
        { id: 'c2h-sky', x: 70, y: 24, glitch: 'smudge', tell: 'never', label: 'a rough patch of sky', artifactWhy: '', cleanWhy: 'Visible brushwork, not a glitch — a person painted it.' },
      ],
      provenance: prov('human', 'scene'),
      signed: true, brush: true,
    },
    process: 'Garbled text and melting shapes were classic 2023 giveaways — and they cracked this case. But the newest models render clean signs and solid geometry, so do not bet on glitches alone: check provenance.',
    provenanceTip: 'A reverse image search finds the ORIGINAL. AI images usually have no earlier source.',
  },
  {
    level: 3,
    concept: 'Modern AI fixed most anatomy. A tell that worked last year may be gone — so start checking the source.',
    ai: {
      id: 'c3-ai', kind: 'ai', scene: 'cat',
      hotspots: [
        { id: 'c3a-paw', x: 50, y: 82, glitch: 'extraPaw', tell: 'fadedForOlder', label: 'the cat\'s paws', artifactWhy: 'An extra paw — an older anatomy slip.', cleanWhy: 'Four normal paws. Newer AI gets this right, so paws no longer prove anything.' },
        { id: 'c3a-eye', x: 44, y: 40, glitch: 'mergedEye', tell: 'never', label: 'the eyes', artifactWhy: '', cleanWhy: 'Stylised, but fine — not a reliable tell.' },
      ],
      provenance: prov('ai', 'cat'),
    },
    human: {
      id: 'c3-human', kind: 'human', scene: 'cat',
      hotspots: [
        { id: 'c3h-whisk', x: 60, y: 46, glitch: 'asymWhiskers', tell: 'never', label: 'uneven whiskers', artifactWhy: '', cleanWhy: 'Real animals — and real artists — are asymmetric. That is normal.' },
      ],
      provenance: prov('human', 'cat'),
      signed: true, brush: true,
    },
    process: 'The anatomy looked almost perfect — the finger-and-paw era is ending. Content Credentials and a reverse image search are what actually settled this one.',
    provenanceTip: 'When the picture looks clean, the SOURCE is your best clue: who posted it, and where did it first appear?',
  },
  {
    level: 4,
    concept: 'When the picture looks flawless, stop staring and start verifying: credentials, original source, and context.',
    ai: {
      id: 'c4-ai', kind: 'ai', scene: 'cafe',
      hotspots: [
        { id: 'c4a-handle', x: 66, y: 58, glitch: 'warpedHandle', tell: 'fadedForOlder', label: 'the cup handle', artifactWhy: 'The handle loops impossibly — an older geometry slip.', cleanWhy: 'The handle looks fine. You cannot spot this AI by eye — you have to check its provenance.' },
      ],
      provenance: prov('ai', 'café photo'),
    },
    human: {
      id: 'c4-human', kind: 'human', scene: 'cafe',
      hotspots: [
        { id: 'c4h-spoon', x: 30, y: 66, glitch: 'floatingSpoon', tell: 'never', label: 'the spoon', artifactWhy: '', cleanWhy: 'It rests on the saucer — simple composition, not an error.' },
      ],
      provenance: prov('human', 'café photo'),
      signed: false, brush: false,
    },
    process: 'For most detectives nothing visual gave it away. The Content Credentials said "generated with AI", the reverse search found no original, and the account only ever posts AI images. Provenance — not pixels — solved it.',
    provenanceTip: 'Content Credentials (C2PA) are cryptographically signed. They are far harder to fake than any brushstroke.',
  },
  {
    level: 5,
    concept: 'This is 2026: AI art can be flawless AND arrive with a fake signature and canvas texture. Only Content Credentials and the trail of where it came from can be trusted.',
    ai: {
      id: 'c5-ai', kind: 'ai', scene: 'gallery',
      hotspots: [
        { id: 'c5a-eyes', x: 46, y: 40, glitch: 'asymEyes', tell: 'fadedForOlder', label: 'the portrait\'s eyes', artifactWhy: 'One eye sits slightly off — a faint older tell.', cleanWhy: 'The face is flawless. The signature and brushwork will not help — AI faked those too. Trust the credentials.' },
      ],
      provenance: prov('ai', 'painting'),
      signed: true, brush: true,
    },
    human: {
      id: 'c5-human', kind: 'human', scene: 'gallery',
      hotspots: [
        { id: 'c5h-impasto', x: 66, y: 62, glitch: 'smudge', tell: 'never', label: 'thick paint texture', artifactWhy: '', cleanWhy: 'Real impasto — but remember, AI can fake this look now, so texture is not proof.' },
      ],
      provenance: prov('human', 'painting'),
      signed: true, brush: true,
    },
    process: 'Both artworks were signed and "painted". The signature and canvas texture were FAKED by the AI. Only the Content Credentials (C2PA) and the source history separated real from generated.',
    provenanceTip: 'Provenance is the reliable layer: C2PA Content Credentials, reverse image search, and checking who and where an image came from.',
  },
];

// ════════════════════════════════════════════════════════════════════════
// SVG ARTWORK — hand-drawn vector "paintings" (content, not mascot art)
// ════════════════════════════════════════════════════════════════════════
interface SceneProps { glitches: Set<string>; uid: string; signed: boolean; brush: boolean; }

function BrushOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <g stroke="#FFFFFF" strokeOpacity={0.14} strokeWidth={0.8} fill="none" strokeLinecap="round">
      <path d="M22 28 Q42 22 62 27" />
      <path d="M26 70 Q50 63 76 71" />
      <path d="M20 48 Q46 44 72 49" />
    </g>
  );
}
function Signature({ show }: { show: boolean }) {
  if (!show) return null;
  return <path d="M72 92 q3 -5 6 0 q3 5 6 0 q2 -3 4 -1" stroke="#12101E" strokeWidth={1} fill="none" opacity={0.75} strokeLinecap="round" />;
}

function Portrait({ glitches, uid, signed, brush }: SceneProps) {
  const fingers = glitches.has('sixfingers') ? 6 : 5;
  const asym = glitches.has('asymEyes');
  const melt = glitches.has('meltCollar');
  const smudge = glitches.has('smudge');
  return (
    <g>
      <rect x={0} y={0} width={100} height={100} fill={`url(#bg-${uid})`} />
      <path d="M18 100 Q50 64 82 100 Z" fill="#3A4668" />
      {melt
        ? <path d="M38 84 Q44 94 50 84 Q56 96 62 84 L62 100 L38 100 Z" fill="#8892C0" />
        : <path d="M40 84 L50 92 L60 84 L60 100 L40 100 Z" fill="#8892C0" />}
      <rect x={44} y={62} width={12} height={16} fill="#E9B98F" />
      <ellipse cx={50} cy={44} rx={17} ry={20} fill="#F2C79C" />
      <path d="M31 42 Q33 18 50 18 Q67 18 69 42 Q60 30 50 31 Q40 30 31 42 Z" fill="#5A3B2E" />
      <ellipse cx={43} cy={asym ? 41 : 43} rx={3} ry={asym ? 3.6 : 2.4} fill="#2A2340" />
      <ellipse cx={57} cy={43} rx={3} ry={2.4} fill="#2A2340" />
      <path d="M50 44 L47.5 51 L52 51" fill="none" stroke="#C98F63" strokeWidth={1} strokeLinejoin="round" />
      <path d="M45 56 Q50 59 55 56" fill="none" stroke="#B5654A" strokeWidth={1.4} strokeLinecap="round" />
      <ellipse cx={70} cy={64} rx={7} ry={6} fill="#F2C79C" />
      {Array.from({ length: fingers }).map((_, i) => (
        <rect key={i} x={64 + i * 2.9} y={50} width={2.1} height={12} rx={1} fill="#F2C79C" stroke="#D9A77B" strokeWidth={0.3} />
      ))}
      {smudge && <ellipse cx={40} cy={52} rx={4} ry={2.6} fill="#8A6B57" opacity={0.5} />}
      <BrushOverlay show={brush} />
      <Signature show={signed} />
    </g>
  );
}

function Landscape({ glitches, uid, signed, brush }: SceneProps) {
  const garbled = glitches.has('garbledSign');
  const melt = glitches.has('meltPeak');
  const smudge = glitches.has('smudge');
  return (
    <g>
      <rect x={0} y={0} width={100} height={100} fill={`url(#bg-${uid})`} />
      <circle cx={74} cy={24} r={9} fill="#FFE08A" />
      {melt
        ? <path d="M0 62 Q16 30 26 44 Q30 52 38 34 Q50 60 64 40 Q80 58 100 44 L100 74 L0 74 Z" fill="#4B5A7A" />
        : <path d="M0 62 L22 36 L40 56 L58 30 L78 54 L100 40 L100 74 L0 74 Z" fill="#4B5A7A" />}
      <rect x={0} y={72} width={100} height={28} fill="#3E5A3A" />
      <rect x={47} y={54} width={2.5} height={18} fill="#6B4A2E" />
      <rect x={38} y={48} width={24} height={12} rx={1.5} fill="#EAD9B0" stroke="#6B4A2E" strokeWidth={1} />
      {garbled
        ? <g stroke="#3A2E1E" strokeWidth={1.1} fill="none" strokeLinecap="round">
          <path d="M41 52 q1 3 2 0 q1 -3 2 0" /><path d="M46 51 q2 2 0 4" /><path d="M49 52 q1 -2 2 1 q1 3 2 -1" /><path d="M54 51 q-1 4 2 3" /><path d="M58 52 q1 2 0 3" />
        </g>
        : <g fill="#3A2E1E">
          <rect x={41} y={52} width={3} height={4} /><rect x={45} y={52} width={3} height={4} /><rect x={49} y={52} width={3} height={4} /><rect x={53} y={52} width={3} height={4} /><rect x={57} y={52} width={2} height={4} />
        </g>}
      {smudge && <ellipse cx={70} cy={24} rx={6} ry={3} fill="#FFFFFF" opacity={0.25} />}
      <BrushOverlay show={brush} />
      <Signature show={signed} />
    </g>
  );
}

function Cat({ glitches, uid, signed, brush }: SceneProps) {
  const extraPaw = glitches.has('extraPaw');
  const merged = glitches.has('mergedEye');
  const asymW = glitches.has('asymWhiskers');
  const smudge = glitches.has('smudge');
  return (
    <g>
      <rect x={0} y={0} width={100} height={100} fill={`url(#bg-${uid})`} />
      <ellipse cx={50} cy={66} rx={24} ry={18} fill="#6B5140" />
      <circle cx={50} cy={40} r={17} fill="#7A5C48" />
      <path d="M36 30 L33 16 L45 26 Z" fill="#7A5C48" />
      <path d="M64 30 L67 16 L55 26 Z" fill="#7A5C48" />
      <circle cx={44} cy={40} r={merged ? 4 : 3} fill="#B9E36A" />
      <circle cx={merged ? 47 : 56} cy={40} r={3} fill="#B9E36A" />
      <circle cx={44} cy={40} r={1.2} fill="#1A1A10" />
      <circle cx={merged ? 47 : 56} cy={40} r={1.2} fill="#1A1A10" />
      <path d="M47 45 L50 48 L53 45 Z" fill="#D98A8A" />
      <g stroke="#EADFCF" strokeWidth={0.6} strokeLinecap="round">
        <path d="M40 46 L28 44" /><path d="M40 48 L28 49" />
        <path d="M60 46 L72 44" />{asymW && <path d="M60 48 L74 52" />}<path d="M60 48 L72 49" />
      </g>
      <rect x={40} y={80} width={4} height={10} rx={2} fill="#6B5140" />
      <rect x={48} y={80} width={4} height={10} rx={2} fill="#6B5140" />
      <rect x={56} y={80} width={4} height={10} rx={2} fill="#6B5140" />
      {extraPaw && <rect x={64} y={80} width={4} height={10} rx={2} fill="#6B5140" />}
      {smudge && <ellipse cx={38} cy={64} rx={4} ry={2.5} fill="#4A382C" opacity={0.5} />}
      <BrushOverlay show={brush} />
      <Signature show={signed} />
    </g>
  );
}

function Cafe({ glitches, uid, signed, brush }: SceneProps) {
  const warped = glitches.has('warpedHandle');
  const floating = glitches.has('floatingSpoon');
  const smudge = glitches.has('smudge');
  return (
    <g>
      <rect x={0} y={0} width={100} height={100} fill={`url(#bg-${uid})`} />
      <rect x={0} y={70} width={100} height={30} fill="#6B4A34" />
      <rect x={70} y={8} width={26} height={40} rx={2} fill="#A9C7D6" opacity={0.7} />
      <ellipse cx={50} cy={72} rx={22} ry={5} fill="#EFE7DA" />
      <path d="M40 48 Q40 66 50 66 Q60 66 60 48 Z" fill="#F4EEE4" stroke="#C9BDA8" strokeWidth={1} />
      <ellipse cx={50} cy={48} rx={10} ry={3} fill="#5A3A24" />
      {warped
        ? <path d="M60 52 Q74 48 70 58 Q66 66 58 60" fill="none" stroke="#C9BDA8" strokeWidth={2} />
        : <path d="M60 52 Q68 52 68 57 Q68 62 60 60" fill="none" stroke="#C9BDA8" strokeWidth={2} />}
      <ellipse cx={50} cy={78} rx={4} ry={1.6} fill="#12101E" opacity={floating ? 0 : 0.15} />
      <rect x={26} y={floating ? 60 : 66} width={12} height={2} rx={1} fill="#C7CBD6" transform="rotate(-18 30 64)" />
      {smudge && <ellipse cx={22} cy={30} rx={5} ry={3} fill="#FFFFFF" opacity={0.15} />}
      <BrushOverlay show={brush} />
      <Signature show={signed} />
    </g>
  );
}

function Gallery({ glitches, uid, signed, brush }: SceneProps) {
  const asym = glitches.has('asymEyes');
  const smudge = glitches.has('smudge');
  return (
    <g>
      <rect x={0} y={0} width={100} height={100} fill={`url(#bg-${uid})`} />
      <rect x={16} y={12} width={68} height={76} rx={2} fill="#7A5A28" />
      <rect x={22} y={18} width={56} height={64} rx={1} fill={`url(#inner-${uid})`} />
      <ellipse cx={50} cy={46} rx={15} ry={18} fill="#F2C79C" />
      <path d="M35 44 Q37 24 50 24 Q63 24 65 44 Q58 33 50 34 Q42 33 35 44 Z" fill="#3B2A44" />
      <ellipse cx={44} cy={asym ? 44 : 46} rx={2.6} ry={asym ? 3.2 : 2.2} fill="#2A2340" />
      <ellipse cx={56} cy={46} rx={2.6} ry={2.2} fill="#2A2340" />
      <path d="M46 58 Q50 61 54 58" fill="none" stroke="#B5654A" strokeWidth={1.2} strokeLinecap="round" />
      <path d="M40 70 Q50 76 60 70 L60 82 L40 82 Z" fill="#5766A0" />
      {smudge && <g stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={1.4} fill="none"><path d="M62 58 q4 2 6 8" /><path d="M60 64 q5 1 8 6" /></g>}
      <BrushOverlay show={brush} />
      <Signature show={signed} />
    </g>
  );
}

const SCENE_BG: Record<SceneKey, [string, string]> = {
  portrait: ['#2C3358', '#151A30'],
  landscape: ['#8FB4E0', '#C9DEF2'],
  cat: ['#E9D8B8', '#C9B08A'],
  cafe: ['#D9C3A5', '#B79877'],
  gallery: ['#20243A', '#12142440'],
};

function ArtScene({ scene, glitches, uid, signed, brush }: { scene: SceneKey } & SceneProps) {
  const [c0, c1] = SCENE_BG[scene];
  const common = { glitches, uid, signed, brush };
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label={`Artwork (${scene})`}>
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c0} />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
        <linearGradient id={`inner-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A3F63" />
          <stop offset="100%" stopColor="#20243A" />
        </linearGradient>
      </defs>
      {scene === 'portrait' && <Portrait {...common} />}
      {scene === 'landscape' && <Landscape {...common} />}
      {scene === 'cat' && <Cat {...common} />}
      {scene === 'cafe' && <Cafe {...common} />}
      {scene === 'gallery' && <Gallery {...common} />}
      <rect x={1} y={1} width={98} height={98} rx={4} fill="none" stroke="#00000033" strokeWidth={2} />
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════
// INSPECTION CARD — one artwork: zoom, flag hotspots, run provenance checks
// ════════════════════════════════════════════════════════════════════════
interface FlagState { flagged: boolean; real: boolean; }

function ArtworkCard({
  img, band, artLabel, zoomed, onZoom, flags, onFlag, checksDone, onCheck,
  hintHotspotId, onAccuse, verdictLocked, accused, reducedMotion,
}: {
  img: ArtImage; band: Band; artLabel: string;
  zoomed: boolean; onZoom: () => void;
  flags: Record<string, FlagState>; onFlag: (hs: Hotspot) => void;
  checksDone: Record<string, boolean>; onCheck: (type: CheckType) => void;
  hintHotspotId: string | null;
  onAccuse: () => void; verdictLocked: boolean; accused: boolean;
  reducedMotion: boolean;
}) {
  // Only artifacts currently "real" for this band are drawn; a faded tell
  // disappears for Band B/C (modern AI fixed it) — that IS the lesson.
  const visibleGlitches = useMemo(() => {
    const s = new Set<string>();
    img.hotspots.forEach((h) => {
      if (!h.glitch) return;
      if (h.tell === 'never') s.add(h.glitch); // benign feature, always shown
      else if (isRealTell(h.tell, band)) s.add(h.glitch); // real tell, shown
    });
    return s;
  }, [img.hotspots, band]);

  return (
    <div className="flex flex-col gap-2 rounded-2xl p-3" style={{ background: SURFACE_RAISED, border: `1px solid ${LAB_COLOR}33` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: TEXT_HI }}>{artLabel}</span>
        <button
          type="button"
          onClick={onZoom}
          aria-pressed={zoomed}
          aria-label={zoomed ? `Zoom out of ${artLabel}` : `Zoom in to inspect ${artLabel}`}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{ background: `${LAB_COLOR}22`, color: LAB_COLOR, ['--tw-ring-color' as string]: LAB_COLOR }}
        >
          {zoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
          {zoomed ? 'Zoom out' : 'Zoom in'}
        </button>
      </div>

      {/* Frame */}
      <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '1 / 1', background: '#0C0E18' }}>
        <div
          className="absolute inset-0 origin-center"
          style={{ transform: zoomed ? 'scale(1.6)' : 'scale(1)', transition: reducedMotion ? 'none' : 'transform 0.35s ease' }}
        >
          <ArtScene scene={img.scene} glitches={visibleGlitches} uid={img.id} signed={!!img.signed} brush={!!img.brush} />
          {/* Hotspot buttons appear only while zoomed in — you must inspect */}
          {zoomed && img.hotspots.map((hs) => {
            const f = flags[hs.id];
            const isHint = hintHotspotId === hs.id && !f;
            const ringColor = f ? (f.real ? BAD : TEXT_LO) : LAB_COLOR;
            return (
              <button
                key={hs.id}
                type="button"
                onClick={() => onFlag(hs)}
                disabled={!!f}
                aria-label={f
                  ? `${hs.label}: already flagged`
                  : `Flag ${hs.label} as suspicious`}
                className="absolute w-7 h-7 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2"
                style={{
                  top: `${hs.y}%`, left: `${hs.x}%`, transform: 'translate(-50%, -50%)',
                  background: f ? `${ringColor}30` : `${LAB_COLOR}22`,
                  border: `2px solid ${ringColor}`,
                  ['--tw-ring-color' as string]: ringColor,
                }}
              >
                {f
                  ? (f.real ? <Check className="w-3.5 h-3.5" style={{ color: BAD }} /> : <X className="w-3.5 h-3.5" style={{ color: TEXT_LO }} />)
                  : <Crosshair className="w-3.5 h-3.5" style={{ color: LAB_COLOR }} />}
                {isHint && !reducedMotion && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full"
                    style={{ border: `2px solid ${LAB_COLOR}` }}
                    animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                  />
                )}
              </button>
            );
          })}
        </div>
        {!zoomed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-1.5 text-center text-xs" style={{ background: 'linear-gradient(transparent, #0C0E18)', color: TEXT_MID }}>
            Zoom in to inspect for tells
          </div>
        )}
      </div>

      {/* Provenance checks */}
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide" style={{ color: TEXT_LO }}>
          <ScanLine className="w-3.5 h-3.5" /> Provenance checks
        </span>
        {(Object.keys(CHECK_META) as CheckType[]).map((type) => {
          const meta = CHECK_META[type];
          const done = checksDone[`${img.id}:${type}`];
          const Icon = meta.Icon;
          return done ? (
            <div key={type} className="rounded-lg px-2.5 py-1.5 text-xs" style={{ background: `${LAB_COLOR}14`, color: TEXT_MID, border: `1px solid ${LAB_COLOR}22` }}>
              <span className="flex items-center gap-1 font-semibold" style={{ color: LAB_COLOR }}>
                <Icon className="w-3.5 h-3.5" /> {meta.label}
              </span>
              <span className="mt-0.5 block" style={{ color: TEXT_MID }}>{img.provenance[type].text}</span>
            </div>
          ) : (
            <button
              key={type}
              type="button"
              onClick={() => onCheck(type)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{ background: SURFACE, color: TEXT_HI, border: `1px solid ${TEXT_LO}44`, ['--tw-ring-color' as string]: LAB_COLOR }}
              aria-label={`Run ${meta.label} on ${artLabel}`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: LAB_COLOR }} /> {meta.label}
            </button>
          );
        })}
      </div>

      {/* Accuse */}
      <SFButton
        variant={accused ? 'secondary' : 'outline'}
        size="sm"
        className="w-full"
        onClick={onAccuse}
        disabled={verdictLocked}
        style={accused ? undefined : { color: LAB_COLOR, borderColor: LAB_COLOR }}
        aria-label={`Accuse ${artLabel}: this is the AI-made artwork`}
      >
        <Gavel className="w-4 h-4 mr-1.5" />
        {accused ? 'Accused' : 'This one is AI'}
      </SFButton>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — one detective case
// ════════════════════════════════════════════════════════════════════════
function briefText(mode: DetectiveCase, band: Band): string {
  const provenance = 'Run each artwork\'s Content Credentials (C2PA), reverse image search, and source check, then accuse the AI one.';
  if (band === 'C') {
    return `Modern AI can look perfect — do not trust your eyes alone. ${provenance}`;
  }
  if (band === 'A') {
    return 'Zoom into each artwork and flag anything that looks wrong — extra fingers, garbled text, melty edges. Then accuse the fake.';
  }
  return `Zoom in and flag suspicious spots, but glitches are getting rare. ${provenance}`;
}

function LevelRenderer({
  level, onComplete, onExit,
}: {
  level: LevelConfig; onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const reducedMotion = !!useReducedMotion();
  const band: Band = (useActiveChild()?.age_band ?? 'B') as Band;
  const theCase = useMemo(() => CASES.find((c) => c.level === level.id) ?? CASES[0], [level.id]);

  // Deterministic left/right placement so the AI is not always on one side.
  const aiOnLeft = theCase.level % 2 === 0;
  const left = aiOnLeft ? theCase.ai : theCase.human;
  const right = aiOnLeft ? theCase.human : theCase.ai;
  const labelOf = (img: ArtImage) => (img.id === left.id ? 'Artwork A' : 'Artwork B');

  const [phase, setPhase] = useState<'brief' | 'investigate'>('brief');
  const [zoom, setZoom] = useState<Record<string, boolean>>({});
  const [flags, setFlags] = useState<Record<string, FlagState>>({});
  const [checksDone, setChecksDone] = useState<Record<string, boolean>>({});
  const [log, setLog] = useState<string[]>([]);
  const suspicion = useRef<Record<string, number>>({});
  const authenticity = useRef<Record<string, number>>({});

  const [reveal, setReveal] = useState<null | {
    correct: boolean; confidence: number; score: number; stars: 0 | 1 | 2 | 3; pickLabel: string; aiLabel: string;
  }>(null);

  // Max supporting evidence available in THIS case for THIS band — the honest
  // denominator for scoring. Real (band-adjusted) artifacts on the AI image +
  // AI-pointing checks on the AI image + human-pointing checks on the human image.
  const maxSupport = useMemo(() => {
    let m = 0;
    theCase.ai.hotspots.forEach((h) => { if (isRealTell(h.tell, band)) m += 2; });
    (Object.keys(CHECK_META) as CheckType[]).forEach((t) => {
      if (theCase.ai.provenance[t].pointsTo === 'ai') m += CHECK_WEIGHT[t];
      if (theCase.human.provenance[t].pointsTo === 'human') m += CHECK_WEIGHT[t];
    });
    return m;
  }, [theCase, band]);

  // Band A gets a gentle hint ring on the first genuine tell.
  const hintHotspotId = useMemo(() => {
    if (band !== 'A') return null;
    const h = theCase.ai.hotspots.find((hs) => isRealTell(hs.tell, band));
    return h ? h.id : null;
  }, [band, theCase]);

  const pushLog = useCallback((msg: string) => {
    setLog((prev) => [msg, ...prev].slice(0, 5));
  }, []);

  const handleFlag = useCallback((img: ArtImage, hs: Hotspot) => {
    if (flags[hs.id]) return;
    const real = isRealTell(hs.tell, band) && img.kind === 'ai';
    setFlags((prev) => ({ ...prev, [hs.id]: { flagged: true, real } }));
    if (real) {
      suspicion.current[img.id] = (suspicion.current[img.id] ?? 0) + 2;
      juice.onCorrect(0, suspicion.current[img.id]);
      pushLog(`Evidence — ${labelOf(img)}, ${hs.label}: ${hs.artifactWhy}`);
    } else {
      juice.onWrong(0, 0);
      pushLog(`No tell — ${labelOf(img)}, ${hs.label}: ${hs.cleanWhy}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flags, band, juice, pushLog]);

  const handleCheck = useCallback((img: ArtImage, type: CheckType) => {
    const key = `${img.id}:${type}`;
    if (checksDone[key]) return;
    setChecksDone((prev) => ({ ...prev, [key]: true }));
    const res = img.provenance[type];
    const w = CHECK_WEIGHT[type];
    if (res.pointsTo === 'ai') suspicion.current[img.id] = (suspicion.current[img.id] ?? 0) + w;
    else if (res.pointsTo === 'human') authenticity.current[img.id] = (authenticity.current[img.id] ?? 0) + w;
    pushLog(`${labelOf(img)} — ${res.text}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checksDone, pushLog]);

  const commitVerdict = useCallback((pick: ArtImage) => {
    if (reveal) return;
    const other = pick.id === theCase.ai.id ? theCase.human : theCase.ai;
    const support = (suspicion.current[pick.id] ?? 0) + (authenticity.current[other.id] ?? 0);
    const contra = (suspicion.current[other.id] ?? 0) + (authenticity.current[pick.id] ?? 0);
    const gathered = support + contra;
    const correct = pick.id === theCase.ai.id;
    const confidence = gathered === 0
      ? 50
      : Math.max(2, Math.min(99, Math.round(50 + (50 * (support - contra)) / gathered)));
    const q = maxSupport > 0 ? Math.min(1, support / maxSupport) : (correct ? 0.5 : 0);
    const score = correct ? Math.round(20 + 80 * q) : Math.round(25 * q);
    const stars = (score >= level.starThresholds[2] ? 3
      : score >= level.starThresholds[1] ? 2
        : score >= level.starThresholds[0] ? 1 : 0) as 0 | 1 | 2 | 3;
    setReveal({ correct, confidence, score, stars, pickLabel: labelOf(pick), aiLabel: labelOf(theCase.ai) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal, theCase, maxSupport, level.starThresholds]);

  const finish = useCallback(() => {
    if (!reveal) return;
    onComplete({
      score: reveal.score, maxScore: 100, stars: reveal.stars,
      xpEarned: Math.round(level.xpReward * (reveal.stars / 3)), timeMs: 0,
    });
  }, [reveal, onComplete, level.xpReward]);

  // ═══ BRIEF ═══
  if (phase === 'brief') {
    return (
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5" style={{ color: LAB_COLOR }} />
          <h2 className="text-lg font-bold" style={{ color: TEXT_HI }}>Case {level.id}: {level.name}</h2>
        </div>
        <div className="rounded-2xl p-4 space-y-3" style={{ background: SURFACE, border: `1px solid ${LAB_COLOR}33` }}>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}18`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Concept:</strong> {theCase.concept}</span>
          </div>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: SURFACE_RAISED, color: TEXT_MID }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} />
            <span><strong style={{ color: TEXT_HI }}>Your job:</strong> {briefText(theCase, band)}</span>
          </div>
        </div>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('investigate')} style={{ backgroundColor: LAB_COLOR, color: '#1A1206' }}>
          Open the Case <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ═══ INVESTIGATE / VERDICT ═══
  const cluesExamined = Object.keys(flags).length + Object.keys(checksDone).length;

  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5" style={{ color: LAB_COLOR }} />
          <h2 className="text-base font-bold" style={{ color: TEXT_HI }}>One of these is AI-made</h2>
        </div>
        <span className="text-xs font-semibold flex items-center gap-1" style={{ color: TEXT_MID }}>
          <ScanLine className="w-3.5 h-3.5" style={{ color: LAB_COLOR }} />{cluesExamined} clues examined
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[left, right].map((img) => (
          <ArtworkCard
            key={img.id}
            img={img}
            band={band}
            artLabel={labelOf(img)}
            zoomed={!!zoom[img.id]}
            onZoom={() => setZoom((z) => ({ ...z, [img.id]: !z[img.id] }))}
            flags={flags}
            onFlag={(hs) => handleFlag(img, hs)}
            checksDone={checksDone}
            onCheck={(type) => handleCheck(img, type)}
            hintHotspotId={hintHotspotId}
            onAccuse={() => commitVerdict(img)}
            verdictLocked={!!reveal}
            accused={reveal?.pickLabel === labelOf(img)}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>

      {/* Evidence log (aria-live) */}
      <div
        className="rounded-2xl p-3"
        style={{ background: SURFACE, border: `1px solid ${TEXT_LO}33`, minHeight: '3rem' }}
        aria-live="polite"
        aria-label="Detective's notebook"
      >
        <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide mb-1" style={{ color: TEXT_LO }}>
          <ScanLine className="w-3.5 h-3.5" /> Notebook
        </span>
        {log.length === 0
          ? <p className="text-xs" style={{ color: TEXT_LO }}>Zoom in, flag suspicious spots, and run provenance checks. Your findings appear here.</p>
          : <ul className="space-y-1">{log.map((l, i) => (
            <li key={i} className="text-xs" style={{ color: i === 0 ? TEXT_HI : TEXT_MID }}>{l}</li>
          ))}</ul>}
      </div>

      {/* Reveal */}
      {reveal && (
        <motion.div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: SURFACE, border: `1px solid ${reveal.correct ? GOOD : BAD}55` }}
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          aria-live="assertive"
          role="status"
        >
          <div className="flex items-center gap-2">
            {reveal.correct
              ? <Check className="w-5 h-5" style={{ color: GOOD }} />
              : <X className="w-5 h-5" style={{ color: BAD }} />}
            <h3 className="text-sm font-bold" style={{ color: reveal.correct ? GOOD : BAD }}>
              {reveal.correct ? 'Case solved!' : 'Wrong suspect.'} {reveal.aiLabel} was AI-made.
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: TEXT_MID }}>
            <Target className="w-3.5 h-3.5" style={{ color: LAB_COLOR }} />
            You committed with <strong style={{ color: TEXT_HI }}>{reveal.confidence}% confidence</strong>
            {reveal.confidence <= 55 && reveal.correct ? ' — barely more than a guess. A detective needs proof!' : ''}
          </div>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: SURFACE_RAISED, color: TEXT_MID }}>
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: LAB_COLOR }} />
            <span><strong style={{ color: TEXT_HI }}>Sparky:</strong> {theCase.process}</span>
          </div>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}18`, color: LAB_COLOR }}>
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{theCase.provenanceTip}</span>
          </div>
          <SFButton variant="primary" className="w-full" onClick={finish} style={{ backgroundColor: LAB_COLOR, color: '#1A1206' }}>
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </SFButton>
        </motion.div>
      )}

      {!reveal && (
        <div className="flex justify-end">
          <SFButton variant="ghost" size="sm" onClick={onExit} aria-label="Leave case and return to level map" style={{ color: TEXT_LO }}>
            <RotateCcw className="w-4 h-4 mr-1" /> Leave case
          </SFButton>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function AiArtDetectiveGame() {
  const { awardXP, completeGame } = useGameActions();

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((s, r) => s + r.xpEarned, 0);
    const totalStars = results.reduce((s, r) => s + r.stars, 0); // out of 15
    awardXP(Math.round(totalXP));
    completeGame('ai-art-detective', totalStars >= 12 ? 3 : totalStars >= 7 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="AI Art Detective" color={LAB_COLOR} labNum={4}>
      <GameLevelSystem
        gameTitle="AI Art Detective"
        gameEmoji="🔍"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onComplete, onExit) => (
          <LevelRenderer key={level.id} level={level} onComplete={onComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
