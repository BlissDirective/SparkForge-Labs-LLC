// ════════════════════════════════════════════════════════════════════════
// SPARKY RIVE — reactive mascot (Fable Frontend Enhancement, Phase A/§3)
// ════════════════════════════════════════════════════════════════════════
// One Rive state-machine mascot, bound to the GameJuiceEngine, mounted in
// GameShell via JuiceProvider — so it upgrades all 42 games at once.
//
// The .riv asset is authored in the Rive editor and dropped at
// `public/rive/sparky.riv`. Until it lands, this renders a tiny procedural
// placeholder orb so the dock is never empty and the wiring is verifiable.
//
// Rive contract (author these in a state machine named `SparkyMachine`):
//   • comboTier  Number(0–3)   idle → hype intensity
//   • celebrate  Trigger       fire on milestone / big win
//   • encourage  Trigger       fire after a miss
//   • thinking   Boolean       true while a question is shown
//
// `celebrate` / `encourage` are passed as monotonically increasing counters;
// each increment fires the corresponding trigger once.

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

const RIV_SRC = '/rive/sparky.riv';
const STATE_MACHINE = 'SparkyMachine';

export interface SparkyRiveProps {
  /** 0 = idle, 1–3 = increasing combo hype. */
  comboTier: number;
  /** Increment to fire the celebrate trigger. */
  celebrate: number;
  /** Increment to fire the encourage trigger. */
  encourage: number;
  /** True while a question/prompt is on screen. */
  thinking?: boolean;
  size?: number;
}

const TIER_COLOR = ['#4F6EF7', '#F59E0B', '#F97316', '#E945F5'];

export default function SparkyRive({
  comboTier, celebrate, encourage, thinking = false, size = 96,
}: SparkyRiveProps) {
  const [loaded, setLoaded] = useState(false);

  const { rive, RiveComponent } = useRive({
    src: RIV_SRC,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    onLoad: () => setLoaded(true),
    onLoadError: () => setLoaded(false), // asset missing → keep placeholder
  });

  const tierInput = useStateMachineInput(rive, STATE_MACHINE, 'comboTier');
  const celebrateTrig = useStateMachineInput(rive, STATE_MACHINE, 'celebrate');
  const encourageTrig = useStateMachineInput(rive, STATE_MACHINE, 'encourage');
  const thinkingInput = useStateMachineInput(rive, STATE_MACHINE, 'thinking');

  useEffect(() => { if (tierInput) tierInput.value = comboTier; }, [tierInput, comboTier]);
  useEffect(() => { if (thinkingInput) thinkingInput.value = thinking; }, [thinkingInput, thinking]);

  // Fire triggers only on change (skip the initial mount value of 0).
  const firstCelebrate = useRef(true);
  const firstEncourage = useRef(true);
  useEffect(() => {
    if (firstCelebrate.current) { firstCelebrate.current = false; return; }
    celebrateTrig?.fire();
  }, [celebrate, celebrateTrig]);
  useEffect(() => {
    if (firstEncourage.current) { firstEncourage.current = false; return; }
    encourageTrig?.fire();
  }, [encourage, encourageTrig]);

  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden>
      <RiveComponent style={{ width: size, height: size, opacity: loaded ? 1 : 0 }} />
      {!loaded && (
        <SparkyPlaceholder size={size} comboTier={comboTier} celebrate={celebrate} encourage={encourage} />
      )}
    </div>
  );
}

// ─── Procedural placeholder (shown until sparky.riv is dropped in) ───

function SparkyPlaceholder({ size, comboTier, celebrate, encourage }: {
  size: number; comboTier: number; celebrate: number; encourage: number;
}) {
  const reduced = useReducedMotion();
  const color = TIER_COLOR[Math.max(0, Math.min(3, comboTier))];
  const orb = size * 0.6;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      // Pop on celebrate, shake on encourage (keyed off the counters).
      key={`c${celebrate}-e${encourage}`}
      animate={reduced ? {} : { x: [0, -3, 3, -2, 2, 0], scale: [1, 1.18, 1] }}
      transition={{ duration: 0.45 }}
    >
      <motion.div
        style={{
          width: orb,
          height: orb,
          borderRadius: '9999px',
          background: `radial-gradient(circle at 35% 30%, #ffffff, ${color})`,
          boxShadow: `0 0 ${6 + comboTier * 6}px ${color}, 0 0 ${12 + comboTier * 10}px ${color}80`,
        }}
        animate={reduced ? {} : { scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* eye dots — keeps it readable as a character, no emoji (Ui-Creation.md) */}
        <div className="flex h-full w-full items-center justify-center gap-[12%]">
          <span className="block rounded-full bg-[#0A0F1E]" style={{ width: orb * 0.12, height: orb * 0.18 }} />
          <span className="block rounded-full bg-[#0A0F1E]" style={{ width: orb * 0.12, height: orb * 0.18 }} />
        </div>
      </motion.div>
    </motion.div>
  );
}
