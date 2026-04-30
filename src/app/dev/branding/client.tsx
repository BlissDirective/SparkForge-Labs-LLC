'use client';

import { Suspense, useMemo, useState } from 'react';
import { BoxGeometry } from 'three';
import { BrandingShowcase } from '@/components/3d/branding/BrandingShowcase';
import { BrandingMesh } from '@/components/3d/branding/BrandingMaterial';
import { SfMark3D } from '@/components/3d/branding/SfMark3D';
import { SparkForgeWordmark3D } from '@/components/3d/branding/SparkForgeWordmark3D';
import { LensflareTSL } from '@/components/3d/branding/LensflareTSL';
import { SfShardSet } from '@/components/3d/branding/SfShardSet';

type Subject =
  | 'sparkforge'
  | 'sf-mark'
  | 'lensflare'
  | 'shard-set'
  | 'cube'
  | 'sphere'
  | 'torus'
  | 'icosa';

const SUBJECTS: ReadonlyArray<{ id: Subject; label: string }> = [
  { id: 'sparkforge', label: 'SparkForge wordmark (Phase 3)' },
  { id: 'sf-mark',    label: 'SF mark (Phase 2)' },
  { id: 'lensflare',  label: 'Lensflare TSL (Phase 5b prep)' },
  { id: 'shard-set',  label: 'Shard set (Phase 5b.2)' },
  { id: 'cube',       label: 'Cube' },
  { id: 'sphere',     label: 'Sphere' },
  { id: 'torus',      label: 'Torus knot' },
  { id: 'icosa',      label: 'Icosahedron' },
];

const TOTAL_LETTERS = 10; // S p a r k F o r g e

function PrimitiveFor({
  subject,
}: {
  subject: Exclude<Subject, 'sf-mark' | 'sparkforge'>;
}) {
  switch (subject) {
    case 'cube':
      return <boxGeometry args={[1.6, 1.6, 1.6]} />;
    case 'sphere':
      return <sphereGeometry args={[1.1, 96, 96]} />;
    case 'torus':
      return <torusKnotGeometry args={[0.8, 0.28, 256, 32]} />;
    case 'icosa':
      return <icosahedronGeometry args={[1.2, 4]} />;
  }
}

export function BrandingDevClient() {
  const [subject, setSubject] = useState<Subject>('sparkforge');
  const [showRef, setShowRef] = useState(true);
  const [orbit, setOrbit] = useState(true);

  // Per-material live tuning — drives BrandingMaterial uniforms
  const [dispersionMul, setDispersionMul] = useState(1.0);
  const [dichroicIntensity, setDichroicIntensity] = useState(1.0);
  const [italicLean, setItalicLean] = useState(0.06);

  // Phase-3 specific: letter-reveal count (0..10). 10 = all visible.
  const [revealCount, setRevealCount] = useState<number>(TOTAL_LETTERS);

  // Phase-5b-prep specific: Lensflare live tuning (per storyboard §3-§8 +
  // user pick Q5 — Beat 6 peak intensityMul = 2.0).
  const [flareIntensityMul, setFlareIntensityMul] = useState(1.0);
  const [flareCoreScale,    setFlareCoreScale]    = useState(1.0);
  const [flareStreakScale,  setFlareStreakScale]  = useState(1.0);

  // Phase-5b.2 specific: Shard-set live tuning. The dev showcase fractures
  // a placeholder box (cheap CPU Voronoi); Beat 4 wires the real SF mark
  // F-glyph geometry in 5b.3.
  const [shardCount, setShardCount] = useState(150);
  const [shardSeed,  setShardSeed]  = useState(42);
  const [shardEmissive, setShardEmissive] = useState(0.3);

  const shardSourceGeometry = useMemo(() => {
    return new BoxGeometry(2.4, 1.0, 0.6, 4, 4, 4);
  }, []);

  const matOptions = useMemo(
    () => ({
      dichroicIntensity,
      dispersionMultiplier: dispersionMul,
    }),
    [dichroicIntensity, dispersionMul],
  );

  // revealMask: undefined when all letters visible (no need to filter),
  // otherwise array of indices [0..revealCount-1].
  const revealMask = useMemo<number[] | undefined>(() => {
    if (revealCount >= TOTAL_LETTERS) return undefined;
    return Array.from({ length: Math.max(0, revealCount) }, (_, i) => i);
  }, [revealCount]);

  // Camera distance: wider for the wordmark; lensflare uses the same
  // distance as the SF mark (~6.4) so the SF mark behind it is in scale.
  const cameraDistance =
    subject === 'sparkforge'
      ? 10.0
      : subject === 'sf-mark' || subject === 'lensflare'
        ? 6.4
        : subject === 'shard-set'
          ? 5.5
          : 4.4;

  return (
    <main className="min-h-screen bg-[#02050d] text-white/90">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Branding · Dev Lab
          </h1>
          <p className="mt-1 text-sm text-white/60">
            BrandingMaterial visual checkpoint vs <code>IMG_4607.png</code>.
            Halt threshold: SSIM ≥ 0.96 (Mythos rule).
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSubject(s.id)}
                className={`rounded-md border px-3 py-1.5 text-sm transition ${
                  subject === s.id
                    ? 'border-cyan-300/60 bg-cyan-300/10 text-cyan-100'
                    : 'border-white/15 bg-white/5 hover:bg-white/10'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setOrbit((v) => !v)}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Orbit: {orbit ? 'On' : 'Off'}
            </button>
            <button
              onClick={() => setShowRef((v) => !v)}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
            >
              Reference: {showRef ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* Live tuning sliders */}
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-3 lg:grid-cols-4">
          <Slider
            label="Dispersion ×"
            value={dispersionMul}
            min={0}
            max={2.5}
            step={0.05}
            onChange={setDispersionMul}
          />
          <Slider
            label="Dichroic intensity"
            value={dichroicIntensity}
            min={0}
            max={2.5}
            step={0.05}
            onChange={setDichroicIntensity}
          />
          {(subject === 'sf-mark' || subject === 'sparkforge') && (
            <Slider
              label="Italic lean (rad)"
              value={italicLean}
              min={-0.2}
              max={0.2}
              step={0.005}
              onChange={setItalicLean}
            />
          )}
          {subject === 'sparkforge' && (
            <Slider
              label="Letter reveal (0–10)"
              value={revealCount}
              min={0}
              max={TOTAL_LETTERS}
              step={1}
              onChange={(v) => setRevealCount(Math.round(v))}
              format={(v) => `${Math.round(v)} / ${TOTAL_LETTERS}`}
            />
          )}
          {subject === 'lensflare' && (
            <>
              <Slider
                label="Flare intensity ×"
                value={flareIntensityMul}
                min={0}
                max={2.4}
                step={0.05}
                onChange={setFlareIntensityMul}
              />
              <Slider
                label="Core scale"
                value={flareCoreScale}
                min={0}
                max={2.0}
                step={0.05}
                onChange={setFlareCoreScale}
              />
              <Slider
                label="Streak scale"
                value={flareStreakScale}
                min={0}
                max={2.0}
                step={0.05}
                onChange={setFlareStreakScale}
              />
            </>
          )}
          {subject === 'shard-set' && (
            <>
              <Slider
                label="Shard count"
                value={shardCount}
                min={20}
                max={500}
                step={10}
                onChange={(v) => setShardCount(Math.round(v))}
                format={(v) => `${Math.round(v)}`}
              />
              <Slider
                label="Seed"
                value={shardSeed}
                min={0}
                max={200}
                step={1}
                onChange={(v) => setShardSeed(Math.round(v))}
                format={(v) => `${Math.round(v)}`}
              />
              <Slider
                label="Shard emissive"
                value={shardEmissive}
                min={0}
                max={2.0}
                step={0.05}
                onChange={setShardEmissive}
              />
            </>
          )}
        </div>

        <div className={`grid gap-4 ${showRef ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          <section className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#02050d]">
            <BrandingShowcase
              cameraDistance={cameraDistance}
              enableControls={orbit}
              ariaLabel="BrandingMaterial test subject"
            >
              {subject === 'sparkforge' ? (
                <Suspense fallback={null}>
                  <SparkForgeWordmark3D
                    italicLean={italicLean}
                    materialOptions={matOptions}
                    revealMask={revealMask}
                  />
                </Suspense>
              ) : subject === 'sf-mark' ? (
                <Suspense fallback={null}>
                  <SfMark3D
                    italicLean={italicLean}
                    materialOptions={matOptions}
                  />
                </Suspense>
              ) : subject === 'lensflare' ? (
                <Suspense fallback={null}>
                  {/* SF mark behind for scale reference */}
                  <SfMark3D
                    italicLean={italicLean}
                    materialOptions={matOptions}
                  />
                  {/* Both flares mounted — amber lower-left + cyan upper-right */}
                  <LensflareTSL
                    flare={0}
                    intensityMul={flareIntensityMul}
                    coreScale={flareCoreScale}
                    streakScale={flareStreakScale}
                  />
                  <LensflareTSL
                    flare={1}
                    intensityMul={flareIntensityMul}
                    coreScale={flareCoreScale}
                    streakScale={flareStreakScale}
                  />
                </Suspense>
              ) : subject === 'shard-set' ? (
                <SfShardSet
                  geometry={shardSourceGeometry}
                  shardCount={shardCount}
                  seed={shardSeed}
                  visible
                  emissiveIntensity={shardEmissive}
                  materialOptions={matOptions}
                />
              ) : (
                <BrandingMesh
                  geometry={<PrimitiveFor subject={subject} />}
                  options={matOptions}
                />
              )}
            </BrandingShowcase>
            <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-white/80">
              BrandingMaterial · {subject}
            </div>
          </section>

          {showRef && (
            <section className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#02050d]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/IMG_4607.png"
                alt="SparkForge SF reference logo"
                className="h-full w-full object-contain"
              />
              <div className="pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-2 py-1 text-xs text-white/80">
                Reference · IMG_4607.png
              </div>
            </section>
          )}
        </div>

        <footer className="mt-8 space-y-2 text-xs text-white/40">
          <p>
            WebGPU required for live render. Devices without WebGPU receive
            the IMG_4607 poster fallback (Phase 4 ships the MP4 loop).
          </p>
          <p>
            SF mark source: <code>public/branding/sf-geometry.svg</code>;
            wordmark source: <code>public/branding/sparkforge-geometry.svg</code>.
            Both are single sources of truth — edit and refresh to iterate;
            SSIM gate converges at ≥ 0.96 vs reference.
          </p>
        </footer>
      </div>
    </main>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

function Slider({ label, value, min, max, step, onChange, format }: SliderProps) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-white/70">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-white/90">
          {format ? format(value) : value.toFixed(3)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer accent-cyan-300"
      />
    </label>
  );
}
