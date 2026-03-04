// ================================================================
// useNetworkAudio — Tone.js sonification for Neural Builder
// ================================================================
// v3-FINAL: Complete standalone (originally V2 Enhancement).
// Neurons produce tones by layer depth. Training evolves from
// chaotic to harmonious. Sparks = triangle pings. Complete = arpeggio.
// ================================================================

'use client';

import { useCallback, useRef, useEffect } from 'react';

type ToneModule = typeof import('tone');

export function useNetworkAudio() {
  const toneRef = useRef<ToneModule | null>(null);
  const readyRef = useRef(false);

  // Initialize Tone.js lazily (requires user gesture)
  const initTone = useCallback(async () => {
    if (readyRef.current) return;
    try {
      const Tone = await import('tone');
      toneRef.current = Tone;
      await Tone.start();
      readyRef.current = true;
    } catch {
      // Tone.js not available — silent fallback
    }
  }, []);

  // Play activation sound — pitch mapped to layer depth
  const playActivation = useCallback((layerIndex: number, totalLayers: number) => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const baseFreq = 200;
      const maxFreq = 800;
      const t = totalLayers > 1 ? layerIndex / (totalLayers - 1) : 0;
      const freq = baseFreq + t * (maxFreq - baseFreq);
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.2 },
        volume: -25,
      }).toDestination();
      synth.triggerAttackRelease(freq, '16n');
      setTimeout(() => synth.dispose(), 500);
    } catch {
      // Silent fallback
    }
  }, []);

  // Play epoch chord — evolves from minor (dissonant) to major (consonant)
  const playEpochChord = useCallback((epoch: number, maxEpochs: number, accuracy: number) => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const progress = Math.min(epoch / Math.max(maxEpochs, 1), 1);
      // Dissonant → consonant: minor 2nd → perfect 5th → octave
      const intervals = [1, 1 + progress * 0.5, 1.5 + progress * 0.5];
      const baseFreq = 220 + accuracy * 2;
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 0.4 },
        volume: -22,
      }).toDestination();
      const notes = intervals.map(i => baseFreq * i);
      synth.triggerAttackRelease(
        notes.map(f => Tone.Frequency(f, 'hz').toNote()),
        '8n'
      );
      setTimeout(() => synth.dispose(), 800);
    } catch {
      // Silent fallback
    }
  }, []);

  // Play training complete — ascending C-major arpeggio fanfare
  const playComplete = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const notes = ['C4', 'E4', 'G4', 'C5', 'E5'];
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.3 },
        volume: -18,
      }).toDestination();
      notes.forEach((note, i) => {
        setTimeout(() => {
          try { synth.triggerAttackRelease(note, '16n'); } catch { /* noop */ }
        }, i * 120);
      });
      setTimeout(() => synth.dispose(), 1200);
    } catch {
      // Silent fallback
    }
  }, []);

  // Synaptic spark sound — quick bright ping
  const playSpark = useCallback((intensity: number) => {
    if (!toneRef.current || !readyRef.current || intensity < 0.4) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.04 },
        volume: -30 + intensity * 8,
      }).toDestination();
      synth.triggerAttackRelease(800 + Math.random() * 600, '128n');
      setTimeout(() => synth.dispose(), 300);
    } catch {
      // Silent fallback
    }
  }, []);

  useEffect(() => {
    return () => { readyRef.current = false; };
  }, []);

  return { initTone, playActivation, playEpochChord, playComplete, playSpark };
}

export default useNetworkAudio;
