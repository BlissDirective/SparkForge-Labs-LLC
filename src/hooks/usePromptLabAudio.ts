// ================================================================
// usePromptLabAudio — Tone.js sonification for Prompt Lab
// ================================================================
// P2: Audio hook for Prompt Lab flagship game
// Sounds: typewriter key click, send whoosh, AI response pop,
// high score sparkle, challenge passed fanfare
// ================================================================

'use client';

import { useCallback, useRef, useEffect } from 'react';

type ToneModule = typeof import('tone');

export function usePromptLabAudio() {
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

  // Typewriter click — short mechanical tap
  const playKeystroke = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const noise = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
        volume: -35,
      }).toDestination();
      noise.triggerAttackRelease('128n');
      setTimeout(() => noise.dispose(), 200);
    } catch { /* Silent fallback */ }
  }, []);

  // Send whoosh — upward frequency sweep
  const playSend = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 },
        volume: -22,
      }).toDestination();
      synth.triggerAttackRelease('C4', '8n');
      synth.frequency.rampTo(1200, 0.2);
      setTimeout(() => synth.dispose(), 500);
    } catch { /* Silent fallback */ }
  }, []);

  // AI response bubble pop
  const playResponse = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.02, release: 0.1 },
        volume: -24,
      }).toDestination();
      synth.triggerAttackRelease('A5', '32n');
      setTimeout(() => {
        try { synth.triggerAttackRelease('E5', '32n'); } catch { /* noop */ }
      }, 80);
      setTimeout(() => synth.dispose(), 400);
    } catch { /* Silent fallback */ }
  }, []);

  // Score feedback — pitch mapped to quality (0-25)
  const playScore = useCallback((score: number) => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const freq = 300 + (score / 25) * 500;
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.05, release: 0.2 },
        volume: -20,
      }).toDestination();
      synth.triggerAttackRelease(freq, '16n');
      setTimeout(() => synth.dispose(), 400);
    } catch { /* Silent fallback */ }
  }, []);

  // Challenge passed — victory fanfare
  const playChallengePassed = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const notes = ['E4', 'G4', 'B4', 'E5'];
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.3 },
        volume: -16,
      }).toDestination();
      notes.forEach((note, i) => {
        setTimeout(() => {
          try { synth.triggerAttackRelease(note, '16n'); } catch { /* noop */ }
        }, i * 100);
      });
      setTimeout(() => synth.dispose(), 1000);
    } catch { /* Silent fallback */ }
  }, []);

  useEffect(() => {
    return () => { readyRef.current = false; };
  }, []);

  return { initTone, playKeystroke, playSend, playResponse, playScore, playChallengePassed };
}

export default usePromptLabAudio;
