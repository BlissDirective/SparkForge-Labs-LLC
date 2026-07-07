// ════════════════════════════════════════════════════════════════════════
// REAL OR FAKE? v5 — Lab 6 (AI & Ethics) — INSPECTION redesign (Wave 2)
// ════════════════════════════════════════════════════════════════════════
// Audit §II.4 #20 (REDESIGN): the old build made kids tap TEXT SNIPPETS that
// self-labelled the tell ("Lip-sync does not match" = fake). No media, no
// inspection — a vocabulary quiz wearing a hunt costume.
//
// v5 shows ACTUAL forensic artifacts the child inspects:
//   • mock news headlines with real layouts
//   • AI-generated-style images drawn as SVG scenes with deliberate glitches
//     (a six-fingered hand, warped sign text, an impossible shadow, a melted
//     ear), and
//   • fabricated quote cards.
// Loop: pick up the MAGNIFIER → tap/hover a suspicious region to zoom + flag
// it (evidence FIRST) → then rule REAL or FAKE (verdict SECOND) → reveal.
//
// Sparky runs an AI "detector" that is SOMETIMES WRONG — it false-positives a
// real photo (fooled by a benign lens flare) and MISSES subtle fakes — the
// lesson that AI detectors mislabel too. Band C surfaces a C2PA "verified
// capture" content-credentials badge as provenance evidence of a real image.
//
// HONESTY (G1): the Real/Fake answer is NOT painted on the artifact. Truth is
// a deterministic function of how many genuine glitch-hotspots the artifact
// actually has (>=1 glitch => fake); the detector's verdict + confidence is a
// deterministic function of what its flawed heuristic can see. Child commits,
// reveal after.
//
// NOTE: the Pixi WebGL reveal canvas is DROPPED — this game is now pure DOM
// (SVG + HTML). The e2e archetype flips to DOM.

'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  ChevronRight, Search, ZoomIn, GraduationCap, Target, Bot, BadgeCheck,
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, ArrowLeft, Sparkles,
  RotateCcw, Eye, Flag,
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

const LAB_COLOR = '#FF7050';

// Dark inspection-panel palette (this game is a forensic media viewer).
const INK = '#0E1018';
const PANEL = '#161A26';
const PANEL_HI = '#1F2432';
const TEXT = '#EEF1FB';
const TEXT_DIM = '#AEB6D0';
const TEXT_FAINT = '#7F87A3';
const REAL_C = '#2ECC71';
const FAKE_C = '#FF5D5D';
const ZOOM = 1.95;

type Band = 'A' | 'B' | 'C';
type RegionKind = 'glitch' | 'provenance' | 'decoy';

interface Region {
  id: string;
  kind: RegionKind;
  /** Short name shown on the flag marker + evidence log. */
  label: string;
  /** What inspecting (zooming into) the region reveals. */
  clue: string;
  /** Position on the square board, in percent. */
  x: number; y: number; w: number; h: number;
  /** Which age bands this region exists in. Absent = all bands. */
  bands?: Band[];
  /** Whether the AI detector's heuristic can "see" this glitch. Default true. */
  detectorVisible?: boolean;
}

type Scene = 'headline' | 'portrait' | 'verified' | 'quote' | 'deepfake';

interface Artifact {
  id: string;
  scene: Scene;
  /** Human name of the medium, e.g. "news headline". */
  medium: string;
  regions: Region[];
}

// ════════════════════════════════════════════════════════════════════════
// ARTIFACT BANK — 5 artifacts, one per level. Truth/detector are DERIVED.
// ════════════════════════════════════════════════════════════════════════
const ARTIFACTS: Record<string, Artifact> = {
  // L1 — FAKE headline. Loud, obvious tells. Detector correct in all bands.
  headline: {
    id: 'headline', scene: 'headline', medium: 'news headline',
    regions: [
      { id: 'headline', kind: 'glitch', label: 'Miracle headline', x: 8, y: 22, w: 84, h: 22,
        clue: '"CURES EVERY DISEASE OVERNIGHT" — real science never promises a miracle cure. Sensational, too-good-to-be-true claims are a fake\'s biggest tell.' },
      { id: 'byline', kind: 'glitch', label: 'No byline', x: 8, y: 62, w: 50, h: 10,
        clue: 'No author, no editor, no outlet. Real journalism is signed by a person you can check — this one is signed by nobody.' },
      { id: 'stat', kind: 'glitch', label: 'Invented stat', x: 62, y: 60, w: 30, h: 14, bands: ['B', 'C'], detectorVisible: false,
        clue: '"900% effective*" — the number is invented and the asterisk links to nothing. Real figures cite a study you can open.' },
    ],
  },
  // L2 — FAKE AI portrait. Six-fingered hand is unmissable; warped sign is subtle.
  portrait: {
    id: 'portrait', scene: 'portrait', medium: 'AI-generated image',
    regions: [
      { id: 'hand', kind: 'glitch', label: 'Six-fingered hand', x: 12, y: 60, w: 34, h: 32,
        clue: 'Count the fingers — there are SIX. Image models still mangle hands. Extra or fused fingers are a classic AI-generation artifact.' },
      { id: 'sign', kind: 'glitch', label: 'Warped sign text', x: 52, y: 8, w: 40, h: 18, bands: ['B', 'C'], detectorVisible: false,
        clue: 'The letters on the sign melt into gibberish. Text is where AI images fail hardest — real signs spell real words.' },
    ],
  },
  // L3 — REAL photo WITH C2PA provenance. Band C adds a benign flare that FOOLS
  // the detector into a FALSE POSITIVE.
  verified: {
    id: 'verified', scene: 'verified', medium: 'photograph',
    regions: [
      { id: 'c2pa', kind: 'provenance', label: 'Verified Capture badge', x: 5, y: 78, w: 48, h: 17,
        clue: 'A C2PA "Verified Capture" badge cryptographically signs WHERE and WHEN this photo was taken, straight from the camera. Content Credentials are strong proof an image is real.' },
      { id: 'flare', kind: 'decoy', label: 'Odd lens flare', x: 58, y: 8, w: 30, h: 30, bands: ['C'],
        clue: 'This bright streak looks unnatural — but it is a real lens flare from the sun hitting the lens. A benign detail, NOT a manipulation. (Sparky\'s detector gets fooled by this one.)' },
    ],
  },
  // L4 — FAKE quote card. Obvious typo/date tell only for band A; the core
  // fabrication is subtle, so the detector MISSES it for bands B/C.
  quote: {
    id: 'quote', scene: 'quote', medium: 'quote card',
    regions: [
      { id: 'quote', kind: 'glitch', label: 'Fabricated quote', x: 8, y: 20, w: 84, h: 34, detectorVisible: false,
        clue: 'This shocking quote was never actually said — no recording or transcript exists anywhere. A real quote links to the moment it was spoken.' },
      { id: 'source', kind: 'glitch', label: 'No source link', x: 8, y: 80, w: 60, h: 12, bands: ['B', 'C'], detectorVisible: false,
        clue: '"Source: shared online" points nowhere. A trustworthy quote card links to the original video, article, or transcript.' },
      { id: 'obvious', kind: 'glitch', label: 'Impossible attribution', x: 8, y: 60, w: 70, h: 14, bands: ['A'],
        clue: 'The name is misspelled and the date — "Feb 30, 2019" — does not exist. Sloppy, impossible details are obvious signs of a fake.' },
    ],
  },
  // L5 — FAKE deepfake still, hardest. Melted ear catches bands A/B; impossible
  // shadow + reflection are subtle, so the detector MISSES it entirely at band C.
  deepfake: {
    id: 'deepfake', scene: 'deepfake', medium: 'deepfake still',
    regions: [
      { id: 'ear', kind: 'glitch', label: 'Melted ear', x: 68, y: 32, w: 18, h: 22, bands: ['A', 'B'],
        clue: 'The ear smears into the hair with no clear edge. AI geometry breaks down at fine boundaries like ears, teeth, and jewelry.' },
      { id: 'shadow', kind: 'glitch', label: 'Impossible shadow', x: 16, y: 82, w: 66, h: 15, detectorVisible: false,
        clue: 'The face is lit from the left, but the shadow falls to the same side — pointing toward the light. That is physically impossible in a real photo.' },
      { id: 'reflection', kind: 'glitch', label: 'Mismatched eyes', x: 36, y: 36, w: 28, h: 9, bands: ['B', 'C'], detectorVisible: false,
        clue: 'The catch-light reflections in the two eyes point in different directions. Real eyes reflect the same light source the same way.' },
    ],
  },
};

// ════════════════════════════════════════════════════════════════════════
// DERIVED STATE — the honest engine. Truth + detector are pure functions.
// ════════════════════════════════════════════════════════════════════════
interface ArtifactState {
  regions: Region[];
  glitches: Region[];
  provenance: Region[];
  evidence: Region[];        // regions worth finding (glitches + provenance)
  truthFake: boolean;
  detectorFake: boolean;
  detectorConfidence: number;
  detectorWrong: boolean;
  maxScore: number;
}

function deriveState(artifact: Artifact, band: Band): ArtifactState {
  const regions = artifact.regions.filter((r) => !r.bands || r.bands.includes(band));
  const glitches = regions.filter((r) => r.kind === 'glitch');
  const provenance = regions.filter((r) => r.kind === 'provenance');
  const decoys = regions.filter((r) => r.kind === 'decoy');

  // TRUTH: an artifact is fake iff it carries at least one genuine glitch.
  const truthFake = glitches.length >= 1;

  // DETECTOR: a flawed heuristic. It counts glitches it can "see" PLUS any
  // decoy it mistakes for a manipulation, and it is blind to provenance.
  const detectorSees =
    glitches.filter((g) => g.detectorVisible !== false).length + decoys.length;
  const detectorFake = detectorSees >= 1;
  const detectorConfidence = detectorFake
    ? Math.min(96, 62 + detectorSees * 11)
    : 71;
  const detectorWrong = detectorFake !== truthFake;

  const evidence = [...glitches, ...provenance];
  const maxScore = evidence.length * 12 + 50 + (detectorWrong ? 25 : 0);

  return {
    regions, glitches, provenance, evidence,
    truthFake, detectorFake, detectorConfidence, detectorWrong, maxScore,
  };
}

// ════════════════════════════════════════════════════════════════════════
// SVG SCENES — the drawn artifacts. Anomalies render only when their region
// is active for this band (single source of truth with the region bank).
// ════════════════════════════════════════════════════════════════════════
function SceneDefs() {
  return (
    <defs>
      <linearGradient id="rf-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2C4A7A" />
        <stop offset="100%" stopColor="#7FA8D6" />
      </linearGradient>
      <linearGradient id="rf-studio" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3A2E52" />
        <stop offset="100%" stopColor="#221B33" />
      </linearGradient>
      <radialGradient id="rf-skin" cx="0.4" cy="0.35" r="0.8">
        <stop offset="0%" stopColor="#E7B48C" />
        <stop offset="100%" stopColor="#B07A52" />
      </radialGradient>
      <linearGradient id="rf-noir" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#4B4E63" />
        <stop offset="100%" stopColor="#23242F" />
      </linearGradient>
    </defs>
  );
}

function PortraitScene({ active }: { active: Set<string> }) {
  const sign = active.has('sign');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
      <SceneDefs />
      <rect x="0" y="0" width="100" height="100" fill="url(#rf-studio)" />
      {/* sign on a post */}
      <rect x="70" y="24" width="2.5" height="34" fill="#4a4258" />
      <rect x="52" y="8" width="40" height="18" rx="2" fill="#d9d2c4" stroke="#9a927f" strokeWidth="0.8" />
      {sign ? (
        // warped, gibberish letters
        <g fill="#3a3428" fontFamily="serif" fontWeight="700">
          <text x="55" y="20" fontSize="7" transform="skewX(-18) scale(1.1,0.8)" >Wᴎλ𝗥</text>
          <text x="73" y="22" fontSize="8" transform="skewX(14) rotate(-6 78 20)">Ͼﬅﾟ</text>
        </g>
      ) : (
        <g fill="#4a4636">
          <rect x="55" y="13" width="30" height="2.4" rx="1" />
          <rect x="55" y="18" width="20" height="2.4" rx="1" />
        </g>
      )}
      {/* figure */}
      <ellipse cx="34" cy="86" rx="30" ry="18" fill="#2a2340" />
      <circle cx="34" cy="36" r="14" fill="url(#rf-skin)" />
      <rect x="27" y="48" width="14" height="8" fill="#c98f63" />
      <path d="M10 96 Q10 62 34 60 Q58 62 58 96 Z" fill="#5a4b7d" />
      {/* raised hand with SIX fingers (glitch — always present in this scene) */}
      <g>
        <rect x="20" y="72" width="16" height="14" rx="4" fill="url(#rf-skin)" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={20.5 + i * 2.6} y={62} width="2" height="12" rx="1"
            fill="url(#rf-skin)" stroke="#8f5f3d" strokeWidth="0.3" />
        ))}
        <rect x="17" y="76" width="5" height="3" rx="1.5" fill="url(#rf-skin)" transform="rotate(-30 19 77)" />
      </g>
    </svg>
  );
}

function VerifiedScene({ active }: { active: Set<string> }) {
  const flare = active.has('flare');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
      <SceneDefs />
      <rect x="0" y="0" width="100" height="100" fill="url(#rf-sky)" />
      <circle cx="72" cy="22" r="9" fill="#FFE7B0" />
      {flare && (
        <g opacity="0.85">
          <line x1="72" y1="22" x2="40" y2="60" stroke="#FFF6D6" strokeWidth="1.4" opacity="0.5" />
          <circle cx="60" cy="37" r="3.5" fill="#FFF6D6" opacity="0.5" />
          <circle cx="52" cy="46" r="2.2" fill="#FFF6D6" opacity="0.4" />
        </g>
      )}
      {/* mountains */}
      <polygon points="0,72 26,40 48,72" fill="#5a6f52" />
      <polygon points="30,72 58,34 88,72" fill="#48603f" />
      <polygon points="62,72 84,46 100,72" fill="#3c5236" />
      <rect x="0" y="72" width="100" height="28" fill="#2f4a33" />
      {/* C2PA Verified Capture badge */}
      <g>
        <rect x="5" y="80" width="46" height="15" rx="3.5" fill="#0d1626" stroke="#4DE9FF" strokeWidth="0.8" />
        <circle cx="12.5" cy="87.5" r="4" fill="none" stroke="#4DE9FF" strokeWidth="1.1" />
        <path d="M10.6 87.6 L12 89 L14.6 86" fill="none" stroke="#4DE9FF" strokeWidth="1.1" strokeLinecap="round" />
        <text x="19" y="85.5" fontSize="4" fontFamily="sans-serif" fontWeight="700" fill="#4DE9FF">VERIFIED CAPTURE</text>
        <text x="19" y="91.5" fontSize="3" fontFamily="sans-serif" fill="#8fb9c8">C2PA · Content Credentials</text>
      </g>
    </svg>
  );
}

function DeepfakeScene({ active }: { active: Set<string> }) {
  const ear = active.has('ear');
  const reflection = active.has('reflection');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
      <SceneDefs />
      <rect x="0" y="0" width="100" height="100" fill="url(#rf-noir)" />
      {/* impossible shadow — falls toward the light (glitch, always present) */}
      <ellipse cx="40" cy="90" rx="30" ry="7" fill="#000" opacity="0.4" />
      {/* neck + shoulders */}
      <path d="M20 100 Q22 74 50 72 Q78 74 80 100 Z" fill="#2b2c3a" />
      {/* head, lit from the LEFT */}
      <circle cx="50" cy="42" r="24" fill="url(#rf-skin)" />
      <path d="M50 18 A24 24 0 0 1 50 66 A24 24 0 0 0 50 18 Z" fill="#000" opacity="0.18" />
      {/* hair */}
      <path d="M26 40 Q26 14 50 14 Q74 14 74 40 Q66 26 50 26 Q34 26 26 40 Z" fill="#2a2230" />
      {/* eyes */}
      <ellipse cx="42" cy="40" rx="4" ry="2.6" fill="#fff" />
      <ellipse cx="58" cy="40" rx="4" ry="2.6" fill="#fff" />
      <circle cx="42" cy="40" r="1.6" fill="#3a2c22" />
      <circle cx="58" cy="40" r="1.6" fill="#3a2c22" />
      {reflection ? (
        <>
          <circle cx="40.6" cy="39" r="0.7" fill="#fff" />
          <circle cx="59.4" cy="41" r="0.7" fill="#fff" />
        </>
      ) : (
        <>
          <circle cx="40.8" cy="39" r="0.6" fill="#fff" />
          <circle cx="56.8" cy="39" r="0.6" fill="#fff" />
        </>
      )}
      {/* nose + mouth */}
      <path d="M50 43 L48 50 L52 50 Z" fill="#a56b47" opacity="0.6" />
      <path d="M44 56 Q50 59 56 56" fill="none" stroke="#7d4a30" strokeWidth="1.4" strokeLinecap="round" />
      {/* ear — melted when the region is active, tidy otherwise */}
      {ear ? (
        <path d="M72 38 Q86 36 82 50 Q78 58 70 54 Q74 46 72 38 Z" fill="url(#rf-skin)" opacity="0.9" />
      ) : (
        <ellipse cx="74" cy="44" rx="3.4" ry="5" fill="url(#rf-skin)" />
      )}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════════
// HTML SCENES (headline + quote) — real layouts, drawn dark.
// ════════════════════════════════════════════════════════════════════════
function HeadlineScene({ active, band }: { active: Set<string>; band: Band }) {
  const stat = active.has('stat');
  return (
    <div className="absolute inset-0 flex flex-col p-4" style={{ background: '#12151f', color: TEXT }}>
      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: '#2a3042' }}>
        <span className="font-bold tracking-widest" style={{ color: '#FF7050', fontSize: 11 }}>THE DAILY PULSE</span>
        <span style={{ color: TEXT_FAINT, fontSize: 8 }}>trending · viral</span>
      </div>
      <h3 className="font-extrabold leading-tight mt-3" style={{ fontSize: 17, color: '#FFE08A' }}>
        MIRACLE PILL CURES EVERY DISEASE OVERNIGHT!!!
      </h3>
      <div className="mt-2 rounded-md" style={{ background: '#1e2434', height: 46 }} />
      <div className="mt-2 space-y-1.5">
        <div className="rounded" style={{ background: '#20263a', height: 5, width: '96%' }} />
        <div className="rounded" style={{ background: '#20263a', height: 5, width: '88%' }} />
      </div>
      <div className="mt-auto flex items-end justify-between pt-2">
        <span style={{ color: TEXT_FAINT, fontSize: 9, fontStyle: 'italic' }}>By — (no author listed)</span>
        {band !== 'A' && (
          <span className="rounded-full px-2 py-1 font-bold"
            style={{ background: stat ? '#FF505015' : '#20263a', color: '#FF8A8A', fontSize: 10 }}>
            900% effective*
          </span>
        )}
      </div>
    </div>
  );
}

function QuoteScene({ active, band }: { active: Set<string>; band: Band }) {
  return (
    <div className="absolute inset-0 flex flex-col p-5" style={{ background: '#141826', color: TEXT }}>
      <span className="font-serif leading-none" style={{ color: '#FF7050', fontSize: 44 }}>&ldquo;</span>
      <p className="font-semibold -mt-3" style={{ fontSize: 15, color: TEXT, lineHeight: 1.35 }}>
        Every school will be shut down forever starting next week — I promise it.
      </p>
      <div className="mt-auto pt-3 border-t flex items-center gap-2" style={{ borderColor: '#2a3042' }}>
        <div className="rounded-full" style={{ width: 26, height: 26, background: '#33406b' }} />
        <div>
          <p className="font-bold" style={{ fontSize: 11, color: TEXT }}>
            {band === 'A' ? 'Prisedent Jonh Smith' : 'A National Leader'}
          </p>
          <p style={{ fontSize: 9, color: TEXT_FAINT }}>
            {band === 'A' ? 'Feb 30, 2019' : 'Source: shared online'}
          </p>
        </div>
      </div>
    </div>
  );
}

function SceneSwitch({ scene, active, band }: { scene: Scene; active: Set<string>; band: Band }) {
  if (scene === 'headline') return <HeadlineScene active={active} band={band} />;
  if (scene === 'quote') return <QuoteScene active={active} band={band} />;
  if (scene === 'portrait') return <PortraitScene active={active} />;
  if (scene === 'verified') return <VerifiedScene active={active} />;
  return <DeepfakeScene active={active} />;
}

// ════════════════════════════════════════════════════════════════════════
// INSPECTION BOARD — the magnifier. Tap/hover a region → zoom + flag.
// ════════════════════════════════════════════════════════════════════════
function InspectionBoard({
  artifact, band, activeRegions, inspected, focused, onInspect, reducedMotion, revealAll,
}: {
  artifact: Artifact; band: Band; activeRegions: Region[];
  inspected: Set<string>; focused: string | null;
  onInspect: (id: string) => void; reducedMotion: boolean; revealAll: boolean;
}) {
  const activeIds = useMemo(() => new Set(activeRegions.map((r) => r.id)), [activeRegions]);
  const focusRegion = activeRegions.find((r) => r.id === focused) || null;
  const origin = focusRegion
    ? { x: focusRegion.x + focusRegion.w / 2, y: focusRegion.y + focusRegion.h / 2 }
    : { x: 50, y: 50 };

  const kindColor = (k: RegionKind) => (k === 'provenance' ? '#4DE9FF' : k === 'decoy' ? '#FFD93D' : FAKE_C);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ aspectRatio: '1 / 1', background: INK, border: `1px solid ${PANEL_HI}`, cursor: 'zoom-in' }}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: focused ? `scale(${ZOOM})` : 'scale(1)',
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transition: reducedMotion ? undefined : 'transform 0.45s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <SceneSwitch scene={artifact.scene} active={activeIds} band={band} />

        {/* Region hotspots — keyboard-operable buttons overlaying the artifact */}
        {activeRegions.map((r) => {
          const isInspected = inspected.has(r.id);
          const isFocused = focused === r.id;
          const c = kindColor(r.kind);
          const show = revealAll || isFocused || isInspected;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onInspect(r.id)}
              aria-pressed={isInspected}
              aria-label={`Inspect region: ${r.label}${isInspected ? ' (already inspected)' : ''}`}
              className="absolute rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
              style={{
                left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%`,
                border: `2px ${show ? 'solid' : 'dashed'} ${c}${show ? 'CC' : '66'}`,
                background: isFocused ? `${c}22` : 'transparent',
                boxShadow: show ? `0 0 12px ${c}55` : 'none',
                ['--tw-ring-color' as string]: c,
                cursor: 'zoom-in',
              }}
            >
              <span className="absolute -top-2 -left-2 flex items-center justify-center rounded-full"
                style={{ width: 18, height: 18, background: isInspected ? c : INK, border: `1.5px solid ${c}` }}>
                {isInspected
                  ? <Flag className="w-2.5 h-2.5" style={{ color: INK }} aria-hidden="true" />
                  : <Search className="w-2.5 h-2.5" style={{ color: c }} aria-hidden="true" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* magnifier affordance chip */}
      {!focused && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-1"
          style={{ background: '#000000AA', color: TEXT_DIM, fontSize: 10 }}>
          <ZoomIn className="w-3 h-3" aria-hidden="true" /> tap a marker to zoom
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// LEVELS — 5 cases, one artifact each. Cut from 10 quiz levels.
// ════════════════════════════════════════════════════════════════════════
const LEVEL_ARTIFACT: Record<number, string> = {
  1: 'headline', 2: 'portrait', 3: 'verified', 4: 'quote', 5: 'deepfake',
};

const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Headline Desk', description: 'A breaking-news card lands on your desk. Real report, or ragebait?', emoji: '📰', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 60 },
  { id: 2, name: 'The Portrait', description: 'Inspect this photo. Did a camera take it — or a model dream it?', emoji: '📷', difficulty: 'easy', starThresholds: [40, 60, 80], xpReward: 80 },
  { id: 3, name: 'Verified Capture', description: 'Content Credentials say this is real. Do you — and the detector — agree?', emoji: '🛰️', difficulty: 'medium', starThresholds: [40, 60, 80], xpReward: 100 },
  { id: 4, name: 'The Quote Card', description: 'A viral quote card. Did they really say it?', emoji: '💬', difficulty: 'hard', starThresholds: [40, 60, 80], xpReward: 120 },
  { id: 5, name: 'Deepfake Still', description: 'The hardest case. Trust nothing but the evidence.', emoji: '🎭', difficulty: 'expert', starThresholds: [40, 60, 80], xpReward: 160, isBonus: true },
];

const BAND_INTRO: Record<Band, string> = {
  A: 'Look for the BIG mistakes — silly headlines, extra fingers, wrong dates.',
  B: 'Some tells are subtle now. Zoom into anything that feels off before you decide.',
  C: 'Expert mode: look for C2PA badges on real photos, and remember Sparky\'s detector mislabels too — it false-alarms and misses.',
};

// ════════════════════════════════════════════════════════════════════════
// LEVEL RENDERER — brief → inspect+verdict → reveal
// ════════════════════════════════════════════════════════════════════════
function LevelRenderer({
  level, band, onComplete, onExit,
}: {
  level: LevelConfig; band: Band;
  onComplete: (r: LevelResult) => void; onExit: () => void;
}) {
  const juice = useJuice();
  const reduced = !!useReducedMotion();
  const artifact = ARTIFACTS[LEVEL_ARTIFACT[level.id]];
  const s = useMemo(() => deriveState(artifact, band), [artifact, band]);

  const [phase, setPhase] = useState<'brief' | 'inspect' | 'reveal'>('brief');
  const [inspected, setInspected] = useState<Set<string>>(new Set());
  const [focused, setFocused] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<boolean | null>(null); // true = fake

  const focusRegion = s.regions.find((r) => r.id === focused) || null;
  const pendingResult = useMemoRef<LevelResult | null>(null);

  // GameLevelSystem re-uses this component instance across levels — reset the
  // per-case inspection state when the level changes (React "adjust state on
  // prop change" pattern).
  const [renderedFor, setRenderedFor] = useState(level.id);
  if (renderedFor !== level.id) {
    setRenderedFor(level.id);
    setPhase('brief');
    setInspected(new Set());
    setFocused(null);
    setVerdict(null);
    pendingResult.current = null;
  }

  const handleInspect = useCallback((id: string) => {
    setFocused((cur) => (cur === id ? null : id));
    setInspected((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  }, []);

  const commit = useCallback((chosenFake: boolean) => {
    if (verdict !== null) return;
    const correct = chosenFake === s.truthFake;
    const evidenceFound = s.evidence.filter((r) => inspected.has(r.id)).length;
    const score =
      evidenceFound * 12 +
      (correct ? 50 : 0) +
      (correct && s.detectorWrong ? 25 : 0);
    const ratio = score / Math.max(1, s.maxScore);
    const stars = (ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : ratio >= 0.34 ? 1 : 0) as 0 | 1 | 2 | 3;

    if (correct) juice.onCorrect(1, score); else juice.onWrong(0, score);

    setVerdict(chosenFake);
    setFocused(null);
    setPhase('reveal');

    // Stash the computed result for the Continue button.
    pendingResult.current = {
      score, maxScore: s.maxScore, stars,
      xpEarned: Math.round(level.xpReward * (stars / 3)), timeMs: 0,
    };
  }, [verdict, s, inspected, juice, level.xpReward, pendingResult]);

  // ─── BRIEF ───
  if (phase === 'brief') {
    return (
      <div className="relative z-10 space-y-5">
        <GlowingTitle color={LAB_COLOR}>Case {level.id}: {level.name}</GlowingTitle>
        <SFCard variant="elevated" className="p-5">
          <p className="text-sm mb-3" style={{ color: '#5A6078' }}>{level.description}</p>
          <div className="rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: `${LAB_COLOR}12`, color: LAB_COLOR }}>
            <GraduationCap className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span><strong>Evidence first, verdict second.</strong> Tap a marker to zoom in with your magnifier and log what you find. Then rule the {artifact.medium} <strong>Real</strong> or <strong>Fake</strong>.</span>
          </div>
          <div className="mt-3 rounded-xl p-3 text-xs flex items-start gap-2" style={{ background: '#4F6EF712', color: '#4F6EF7' }}>
            <Target className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{BAND_INTRO[band]}</span>
          </div>
        </SFCard>
        <SFButton variant="primary" size="lg" className="w-full" onClick={() => setPhase('inspect')}>
          Open the case <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ─── REVEAL ───
  if (phase === 'reveal' && verdict !== null && pendingResult.current) {
    const correct = verdict === s.truthFake;
    const result = pendingResult.current;
    return (
      <div className="relative z-10 space-y-4">
        <GlowingTitle color={LAB_COLOR}>Verdict In</GlowingTitle>

        <InspectionBoard
          artifact={artifact} band={band} activeRegions={s.regions}
          inspected={inspected} focused={null} onInspect={() => {}}
          reducedMotion={reduced} revealAll
        />

        {/* Your call vs the truth */}
        <div aria-live="polite">
          <motion.div
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: correct ? `${REAL_C}14` : `${FAKE_C}14`, border: `1px solid ${correct ? REAL_C : FAKE_C}44` }}
            initial={reduced ? undefined : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          >
            {correct
              ? <CheckCircle2 className="w-6 h-6 shrink-0" style={{ color: REAL_C }} aria-hidden="true" />
              : <XCircle className="w-6 h-6 shrink-0" style={{ color: FAKE_C }} aria-hidden="true" />}
            <div>
              <p className="text-sm font-bold" style={{ color: correct ? REAL_C : FAKE_C }}>
                {correct ? 'Correct!' : 'Not this time.'} This {artifact.medium} is {s.truthFake ? 'FAKE' : 'REAL'}.
              </p>
              <p className="text-xs mt-1" style={{ color: '#5A6078' }}>
                You said <strong>{verdict ? 'FAKE' : 'REAL'}</strong>. {s.truthFake
                  ? `It carries ${s.glitches.length} genuine tell${s.glitches.length === 1 ? '' : 's'}.`
                  : 'It carries no genuine manipulation tells.'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Evidence ledger */}
        <SFCard variant="elevated" className="p-4">
          <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: '#1A1D2B' }}>
            <Eye className="w-4 h-4" aria-hidden="true" /> The evidence
          </p>
          <ul className="space-y-2">
            {s.evidence.map((r) => (
              <li key={r.id} className="flex items-start gap-2 text-xs" style={{ color: '#5A6078' }}>
                <span className="shrink-0 mt-0.5">
                  {r.kind === 'provenance'
                    ? <BadgeCheck className="w-3.5 h-3.5" style={{ color: '#0EA5C4' }} aria-hidden="true" />
                    : <ShieldAlert className="w-3.5 h-3.5" style={{ color: FAKE_C }} aria-hidden="true" />}
                </span>
                <span>
                  <strong style={{ color: '#1A1D2B' }}>{r.label}</strong>
                  {inspected.has(r.id) ? ' (you found this) ' : ' '} — {r.clue}
                </span>
              </li>
            ))}
          </ul>
        </SFCard>

        {/* Sparky's detector — and whether it was RIGHT */}
        <SFCard variant="elevated" className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4" style={{ color: '#8C7AE6' }} aria-hidden="true" />
            <p className="text-xs font-bold" style={{ color: '#1A1D2B' }}>Sparky&apos;s AI detector said:</p>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: s.detectorFake ? `${FAKE_C}18` : `${REAL_C}18`, color: s.detectorFake ? FAKE_C : REAL_C }}>
              {s.detectorFake ? 'FAKE' : 'REAL'}
            </span>
            <span className="text-xs" style={{ color: '#8C94AC' }}>{s.detectorConfidence}% confident</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#EEF0F8' }}>
            <div className="h-full rounded-full" style={{ width: `${s.detectorConfidence}%`, background: s.detectorFake ? FAKE_C : REAL_C }} />
          </div>
          <p className="text-xs mt-2" style={{ color: s.detectorWrong ? FAKE_C : '#5A6078' }}>
            {s.detectorWrong
              ? (s.truthFake
                ? 'And it was WRONG — the detector MISSED this fake. AI detectors have blind spots; never trust them alone.'
                : 'And it was WRONG — a FALSE ALARM on a real photo. AI detectors mislabel real images too, so the C2PA badge matters.')
              : 'And it was right this time — but detectors are only a hint, not the final word.'}
          </p>
          {correct && s.detectorWrong && (
            <p className="text-xs mt-2 font-bold flex items-center gap-1.5" style={{ color: LAB_COLOR }}>
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> You out-thought the detector! +25 bonus.
            </p>
          )}
        </SFCard>

        <SFButton variant="primary" size="lg" className="w-full" onClick={() => onComplete(result)}>
          Continue <ChevronRight className="w-5 h-5 ml-2" />
        </SFButton>
      </div>
    );
  }

  // ─── INSPECT + VERDICT ───
  const evidenceFound = s.evidence.filter((r) => inspected.has(r.id)).length;
  return (
    <div className="relative z-10 space-y-4">
      <div className="flex items-center justify-between">
        <GlowingTitle color={LAB_COLOR}>Inspect the {artifact.medium}</GlowingTitle>
        <span className="text-sm font-bold flex items-center gap-1" style={{ color: LAB_COLOR }}>
          <Search className="w-4 h-4" aria-hidden="true" />{inspected.size}/{s.regions.length} zoomed
        </span>
      </div>

      <InspectionBoard
        artifact={artifact} band={band} activeRegions={s.regions}
        inspected={inspected} focused={focused} onInspect={handleInspect}
        reducedMotion={reduced} revealAll={false}
      />

      {/* Zoom callout — the magnifier's finding (aria-live) */}
      <div aria-live="polite" className="min-h-1">
        <AnimatePresence mode="wait">
          {focusRegion && (
            <motion.div
              key={focusRegion.id}
              className="rounded-2xl p-4"
              style={{ background: PANEL, border: `1px solid ${PANEL_HI}` }}
              initial={reduced ? undefined : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -8 }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: TEXT }}>
                  <ZoomIn className="w-4 h-4" aria-hidden="true" /> {focusRegion.label}
                </span>
                <button type="button" onClick={() => setFocused(null)}
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2"
                  style={{ color: TEXT_DIM, background: PANEL_HI, ['--tw-ring-color' as string]: LAB_COLOR }}>
                  <ArrowLeft className="w-3 h-3" aria-hidden="true" /> zoom out
                </button>
              </div>
              <p className="text-xs" style={{ color: TEXT_DIM, lineHeight: 1.5 }}>{focusRegion.clue}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-center" style={{ color: '#8C94AC' }}>
        {evidenceFound > 0
          ? `You have logged ${evidenceFound} clue${evidenceFound === 1 ? '' : 's'}. Ready to rule?`
          : 'Zoom into anything suspicious, then make your call.'}
      </p>

      {/* Verdict — the commit. Keyboard-operable buttons. */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => commit(false)}
          aria-label="Rule this artifact REAL"
          className="flex flex-col items-center gap-1 rounded-2xl py-4 font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: `${REAL_C}18`, border: `2px solid ${REAL_C}`, color: REAL_C, ['--tw-ring-color' as string]: REAL_C }}
        >
          <ShieldCheck className="w-6 h-6" aria-hidden="true" /> REAL
        </button>
        <button
          type="button"
          onClick={() => commit(true)}
          aria-label="Rule this artifact FAKE"
          className="flex flex-col items-center gap-1 rounded-2xl py-4 font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ background: `${FAKE_C}18`, border: `2px solid ${FAKE_C}`, color: FAKE_C, ['--tw-ring-color' as string]: FAKE_C }}
        >
          <ShieldAlert className="w-6 h-6" aria-hidden="true" /> FAKE
        </button>
      </div>

      <SFButton variant="outline" className="w-full" onClick={onExit} aria-label="Exit to level map">
        <RotateCcw className="w-4 h-4 mr-2" /> Back to cases
      </SFButton>
    </div>
  );
}

// Tiny ref helper (kept local so we do not add an import just for one ref).
function useMemoRef<T>(initial: T) {
  const [ref] = useState(() => ({ current: initial }));
  return ref;
}

// ════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ════════════════════════════════════════════════════════════════════════
export default function RealOrFakeGame() {
  const { awardXP, completeGame } = useGameActions();
  const band = (useActiveChild()?.age_band || 'B') as Band;

  const handleComplete = useCallback((results: LevelResult[]) => {
    const totalXP = results.reduce((sum, r) => sum + r.xpEarned, 0);
    const totalStars = results.reduce((sum, r) => sum + r.stars, 0);
    awardXP(Math.round(totalXP));
    // 5 levels → max 15 stars.
    completeGame('real-or-fake', totalStars >= 12 ? 3 : totalStars >= 7 ? 2 : 1);
  }, [awardXP, completeGame]);

  return (
    <GameShell title="Real or Fake?" color={LAB_COLOR} labNum={6}>
      <GameLevelSystem
        gameTitle="Real or Fake?"
        gameEmoji="🔎"
        labColor={LAB_COLOR}
        levels={LEVELS}
        onComplete={handleComplete}
        renderLevel={(level, onLevelComplete, onExit) => (
          <LevelRenderer level={level} band={band} onComplete={onLevelComplete} onExit={onExit} />
        )}
      />
    </GameShell>
  );
}
