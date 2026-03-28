// ================================================================
// useAgentAudio — Tone.js sonification for Agent Architect
// ================================================================
// P2: Audio hook for Agent Architect flagship game
// Sounds: block placement click, connection wire, pipeline run hum,
// step progress tick, execution complete chord, mission fanfare
// ================================================================

'use client';

import { useCallback, useRef, useEffect } from 'react';

type ToneModule = typeof import('tone');

export function useAgentAudio() {
  const toneRef = useRef<ToneModule | null>(null);
  const readyRef = useRef(false);

  const initTone = useCallback(async () => {
    if (readyRef.current) return;
    try {
      const Tone = await import('tone');
      toneRef.current = Tone;
      await Tone.start();
      readyRef.current = true;
    } catch { /* Silent fallback */ }
  }, []);

  // Block placement — mechanical click
  const playPlaceBlock = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 3,
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
        volume: -22,
      }).toDestination();
      synth.triggerAttackRelease('C3', '32n');
      setTimeout(() => synth.dispose(), 300);
    } catch { /* Silent fallback */ }
  }, []);

  // Connection wire — linking swoosh
  const playConnect = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 },
        volume: -24,
      }).toDestination();
      synth.triggerAttackRelease('E4', '16n');
      synth.frequency.rampTo(800, 0.15);
      setTimeout(() => synth.dispose(), 400);
    } catch { /* Silent fallback */ }
  }, []);

  // Pipeline run start — low engine hum
  const playRunStart = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.1, decay: 0.4, sustain: 0.2, release: 0.3 },
        volume: -26,
      }).toDestination();
      synth.triggerAttackRelease('C2', '4n');
      setTimeout(() => synth.dispose(), 1000);
    } catch { /* Silent fallback */ }
  }, []);

  // Step progress — ascending tick per block in pipeline
  const playStep = useCallback((stepIndex: number, totalSteps: number) => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const t = totalSteps > 1 ? stepIndex / (totalSteps - 1) : 0;
      const freq = 300 + t * 500;
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.08, sustain: 0.02, release: 0.1 },
        volume: -22,
      }).toDestination();
      synth.triggerAttackRelease(freq, '32n');
      setTimeout(() => synth.dispose(), 300);
    } catch { /* Silent fallback */ }
  }, []);

  // Mission complete — star-rated fanfare
  const playMissionComplete = useCallback((stars: number) => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const notesByStars: Record<number, string[]> = {
        1: ['C4', 'E4'],
        2: ['C4', 'E4', 'G4'],
        3: ['C4', 'E4', 'G4', 'C5', 'E5'],
      };
      const notes = notesByStars[stars] || notesByStars[1];
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.3 },
        volume: -16,
      }).toDestination();
      notes.forEach((note, i) => {
        setTimeout(() => {
          try { synth.triggerAttackRelease(note, '16n'); } catch { /* noop */ }
        }, i * 110);
      });
      setTimeout(() => synth.dispose(), 1200);
    } catch { /* Silent fallback */ }
  }, []);

  useEffect(() => {
    return () => { readyRef.current = false; };
  }, []);

  return { initTone, playPlaceBlock, playConnect, playRunStart, playStep, playMissionComplete };
}

export default useAgentAudio;
