// ================================================================
// usePetTrainerAudio — Tone.js sonification for Pet Trainer
// ================================================================
// P2: Audio hook for Pet Trainer flagship game
// Sounds: correct answer chime, wrong answer descending tone,
// streak progression chord, evolution fanfare, pet reaction blip
// ================================================================

'use client';

import { useCallback, useRef, useEffect } from 'react';

type ToneModule = typeof import('tone');

export function usePetTrainerAudio() {
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

  // Correct answer — ascending major 3rd chime
  const playCorrect = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.05, release: 0.2 },
        volume: -20,
      }).toDestination();
      synth.triggerAttackRelease('E5', '16n');
      setTimeout(() => {
        try { synth.triggerAttackRelease('G5', '16n'); } catch { /* noop */ }
      }, 100);
      setTimeout(() => synth.dispose(), 500);
    } catch { /* Silent fallback */ }
  }, []);

  // Wrong answer — descending minor tone
  const playWrong = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.05, release: 0.3 },
        volume: -22,
      }).toDestination();
      synth.triggerAttackRelease('D4', '16n');
      setTimeout(() => {
        try { synth.triggerAttackRelease('Bb3', '16n'); } catch { /* noop */ }
      }, 120);
      setTimeout(() => synth.dispose(), 600);
    } catch { /* Silent fallback */ }
  }, []);

  // Streak milestone — ascending chord progression (3+ correct in a row)
  const playStreak = useCallback((streakCount: number) => {
    if (!toneRef.current || !readyRef.current || streakCount < 3) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.3 },
        volume: -18,
      }).toDestination();
      const baseNote = Math.min(3 + streakCount, 8);
      synth.triggerAttackRelease([`C${baseNote}`, `E${baseNote}`, `G${baseNote}`], '8n');
      setTimeout(() => synth.dispose(), 700);
    } catch { /* Silent fallback */ }
  }, []);

  // Evolution fanfare — ascending arpeggio with sparkle
  const playEvolution = useCallback((stage: number) => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const notes = ['C4', 'E4', 'G4', 'B4', 'C5', 'E5'][stage] ?
        ['C4', 'E4', 'G4', 'B4', 'C5', 'E5'].slice(0, stage + 2) :
        ['C4', 'E4', 'G4', 'C5'];
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.4 },
        volume: -16,
      }).toDestination();
      notes.forEach((note, i) => {
        setTimeout(() => {
          try { synth.triggerAttackRelease(note, '16n'); } catch { /* noop */ }
        }, i * 100);
      });
      setTimeout(() => synth.dispose(), 1200);
    } catch { /* Silent fallback */ }
  }, []);

  // Pet reaction blip — quick cute sound
  const playBlip = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 },
        volume: -25,
      }).toDestination();
      synth.triggerAttackRelease(600 + Math.random() * 400, '128n');
      setTimeout(() => synth.dispose(), 300);
    } catch { /* Silent fallback */ }
  }, []);

  useEffect(() => {
    return () => { readyRef.current = false; };
  }, []);

  return { initTone, playCorrect, playWrong, playStreak, playEvolution, playBlip };
}

export default usePetTrainerAudio;
