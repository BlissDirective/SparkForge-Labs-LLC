// ================================================================
// useSortAudio — Tone.js sonification for Sort Toy Box
// ================================================================
// P2: Audio hook for Sort Toy Box flagship game
// Sounds: throw whoosh, bin land thunk, group fill chime,
// AI reveal fanfare, sorting complete arpeggio
// ================================================================

'use client';

import { useCallback, useRef, useEffect } from 'react';

type ToneModule = typeof import('tone');

export function useSortAudio() {
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

  // Throw whoosh — noise sweep
  const playThrow = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const noise = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.05 },
        volume: -28,
      }).toDestination();
      noise.triggerAttackRelease('16n');
      setTimeout(() => noise.dispose(), 400);
    } catch { /* Silent fallback */ }
  }, []);

  // Bin land — short thunk/pop
  const playLand = useCallback((binIndex: number) => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const freqs = [220, 277, 330, 392]; // A3, C#4, E4, G4 — one per bin
      const freq = freqs[binIndex % freqs.length];
      const synth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
        volume: -20,
      }).toDestination();
      synth.triggerAttackRelease(freq, '32n');
      setTimeout(() => synth.dispose(), 400);
    } catch { /* Silent fallback */ }
  }, []);

  // Group fill chime — ascending as group fills up
  const playGroupFill = useCallback((progress: number) => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const freq = 400 + progress * 400; // 400-800Hz as group fills
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.15 },
        volume: -22,
      }).toDestination();
      synth.triggerAttackRelease(freq, '16n');
      setTimeout(() => synth.dispose(), 400);
    } catch { /* Silent fallback */ }
  }, []);

  // AI reveal — dramatic reveal chord
  const playAIReveal = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.05, decay: 0.4, sustain: 0.2, release: 0.5 },
        volume: -16,
      }).toDestination();
      synth.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '4n');
      setTimeout(() => synth.dispose(), 1200);
    } catch { /* Silent fallback */ }
  }, []);

  // Complete — triumphant ascending arpeggio
  const playComplete = useCallback(() => {
    if (!toneRef.current || !readyRef.current) return;
    const Tone = toneRef.current;
    try {
      const notes = ['G4', 'B4', 'D5', 'G5'];
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.3 },
        volume: -18,
      }).toDestination();
      notes.forEach((note, i) => {
        setTimeout(() => {
          try { synth.triggerAttackRelease(note, '16n'); } catch { /* noop */ }
        }, i * 110);
      });
      setTimeout(() => synth.dispose(), 1000);
    } catch { /* Silent fallback */ }
  }, []);

  useEffect(() => {
    return () => { readyRef.current = false; };
  }, []);

  return { initTone, playThrow, playLand, playGroupFill, playAIReveal, playComplete };
}

export default useSortAudio;
