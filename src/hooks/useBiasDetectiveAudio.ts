// ================================================================
// useBiasDetectiveAudio — Tone.js sonification for Bias Detective
// ================================================================
// P2: Audio hook for Bias Detective flagship game
// Sounds: gavel strike, evidence reveal, scale tilt creak,
// verdict fanfare, case closed stamp
// ================================================================

'use client';

import { useCallback, useRef, useEffect } from 'react';

type ToneModule = typeof import('tone');

export function useBiasDetectiveAudio() {
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

  // Gavel strike — sharp percussive hit
  const playGavel = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.08,
        octaves: 4,
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
        volume: -18,
      }).toDestination();
      synth.triggerAttackRelease('G2', '16n');
      setTimeout(() => synth.dispose(), 500);
    } catch { /* Silent fallback */ }
  }, []);

  // Evidence reveal — discovery sparkle
  const playEvidenceReveal = useCallback((isBiasRelevant: boolean) => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const freq = isBiasRelevant ? 880 : 440; // High for key clue, low for normal
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.12, sustain: 0.03, release: 0.15 },
        volume: -22,
      }).toDestination();
      synth.triggerAttackRelease(freq, '16n');
      if (isBiasRelevant) {
        setTimeout(() => {
          try { synth.triggerAttackRelease(freq * 1.25, '32n'); } catch { /* noop */ }
        }, 80);
      }
      setTimeout(() => synth.dispose(), 400);
    } catch { /* Silent fallback */ }
  }, []);

  // Scale tilt — low creak as bias shifts
  const playScaleTilt = useCallback((biasWeight: number) => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const freq = 80 + biasWeight * 120; // Low rumble
      const synth = new Tone.Synth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 0.2 },
        volume: -28,
      }).toDestination();
      synth.triggerAttackRelease(freq, '8n');
      setTimeout(() => synth.dispose(), 600);
    } catch { /* Silent fallback */ }
  }, []);

  // Balance achieved — golden chime
  const playBalanced = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.15, release: 0.4 },
        volume: -18,
      }).toDestination();
      synth.triggerAttackRelease(['D5', 'F#5', 'A5'], '4n');
      setTimeout(() => synth.dispose(), 800);
    } catch { /* Silent fallback */ }
  }, []);

  // Case closed — dramatic verdict stamp
  const playCaseClosed = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      // Drum hit + rising chord
      const drum = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 5,
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
        volume: -14,
      }).toDestination();
      drum.triggerAttackRelease('C2', '8n');

      const chord = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.15, release: 0.5 },
        volume: -16,
      }).toDestination();
      setTimeout(() => {
        try { chord.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '4n'); } catch { /* noop */ }
      }, 150);
      setTimeout(() => { drum.dispose(); chord.dispose(); }, 1500);
    } catch { /* Silent fallback */ }
  }, []);

  useEffect(() => {
    return () => { readyRef.current = false; };
  }, []);

  return { initTone, playGavel, playEvidenceReveal, playScaleTilt, playBalanced, playCaseClosed };
}

export default useBiasDetectiveAudio;
