'use client';

import { useState } from 'react';
import { BrandingShowcase } from '@/components/3d/branding/BrandingShowcase';
import { BrandingMesh } from '@/components/3d/branding/BrandingMaterial';

type Subject = 'cube' | 'sphere' | 'torus' | 'icosa';

const SUBJECTS: ReadonlyArray<{ id: Subject; label: string }> = [
  { id: 'cube',   label: 'Cube' },
  { id: 'sphere', label: 'Sphere' },
  { id: 'torus',  label: 'Torus knot' },
  { id: 'icosa',  label: 'Icosahedron' },
];

function GeometryFor({ subject }: { subject: Subject }) {
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
  const [subject, setSubject] = useState<Subject>('cube');
  const [showRef, setShowRef] = useState(true);
  const [orbit, setOrbit] = useState(true);

  return (
    <main className="min-h-screen bg-[#02050d] text-white/90">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Branding · Phase 1 Dev Lab
          </h1>
          <p className="mt-1 text-sm text-white/60">
            BrandingMaterial visual checkpoint vs <code>IMG_4607.png</code>.
            Halt threshold: SSIM ≥ 0.96.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
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

        <div className={`grid gap-4 ${showRef ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
          <section className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-[#02050d]">
            <BrandingShowcase
              cameraDistance={4.4}
              enableControls={orbit}
              ariaLabel="BrandingMaterial test subject"
            >
              <BrandingMesh geometry={<GeometryFor subject={subject} />} />
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

        <footer className="mt-8 text-xs text-white/40">
          <p>
            WebGPU required for live render. Devices without WebGPU receive
            the IMG_4607 poster fallback (Phase 4 ships the MP4 loop).
          </p>
        </footer>
      </div>
    </main>
  );
}
