'use client';

import { useState } from 'react';

const FACES = ['Round', 'Square', 'Oval'] as const;
const HAIR = ['Short', 'Wavy', 'Cap'] as const;
const GEAR = ['Goggles', 'Headset', 'None'] as const;

/** Placeholder avatar kit — no persistence, no game rewrite. */
export function AvatarCreatorStub({
  onClose,
}: {
  onClose: () => void;
}) {
  const [face, setFace] = useState<(typeof FACES)[number]>('Round');
  const [hair, setHair] = useState<(typeof HAIR)[number]>('Short');
  const [gear, setGear] = useState<(typeof GEAR)[number]>('Goggles');

  return (
    <div
      className="fl-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fl-avatar-title"
      data-slot="avatar-creator"
    >
      <h2 id="fl-avatar-title">Avatar forge (stub)</h2>
      <p className="fl-stub-note">
        Looks only. Nothing saves. Real avatar creation stays on the profile path.
      </p>
      <div className="fl-avatar-grid" role="group" aria-label="Face shape">
        {FACES.map((f) => (
          <button
            key={f}
            type="button"
            className="fl-chip"
            aria-pressed={face === f}
            onClick={() => setFace(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="fl-avatar-grid" role="group" aria-label="Hair">
        {HAIR.map((h) => (
          <button
            key={h}
            type="button"
            className="fl-chip"
            aria-pressed={hair === h}
            onClick={() => setHair(h)}
          >
            {h}
          </button>
        ))}
      </div>
      <div className="fl-avatar-grid" role="group" aria-label="Gear">
        {GEAR.map((g) => (
          <button
            key={g}
            type="button"
            className="fl-chip"
            aria-pressed={gear === g}
            onClick={() => setGear(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <p className="fl-stub-note">
        Preview: {face} face, {hair} hair, {gear}.
      </p>
      <button type="button" className="fl-icon-btn" onClick={onClose}>
        Close kit
      </button>
    </div>
  );
}
