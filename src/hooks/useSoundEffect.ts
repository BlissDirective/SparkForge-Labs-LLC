'use client';

// ════════════════════════════════════════════════════
// SPARKFORGE SOUND EFFECT HOOK
// Web Audio API synthesized sounds — no audio files needed
// Respects user mute preference + reduced-motion
// ════════════════════════════════════════════════════

import { useCallback, useRef, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';

export type SoundEvent =
  | 'xp-gain'
  | 'combo-hit'
  | 'level-up'
  | 'tier-change'
  | 'badge-unlock'
  | 'streak-milestone'
  | 'purchase'
  | 'daily-complete'
  | 'shield-break'
  | 'welcome';

// Synthesize a tone with Web Audio API
function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  delay: number = 0
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

// Sound definitions — each event triggers a unique synthesized pattern
function synthesize(ctx: AudioContext, event: SoundEvent): void {
  switch (event) {
    case 'xp-gain':
      // Quick ascending chirp
      playTone(ctx, 880, 0.1, 'sine', 0.2);
      playTone(ctx, 1100, 0.1, 'sine', 0.2, 0.05);
      break;

    case 'combo-hit':
      // Rapid triple blip
      playTone(ctx, 660, 0.08, 'square', 0.15);
      playTone(ctx, 880, 0.08, 'square', 0.15, 0.06);
      playTone(ctx, 1100, 0.08, 'square', 0.15, 0.12);
      break;

    case 'level-up':
      // Triumphant ascending arpeggio
      playTone(ctx, 523, 0.15, 'sine', 0.25);
      playTone(ctx, 659, 0.15, 'sine', 0.25, 0.1);
      playTone(ctx, 784, 0.15, 'sine', 0.25, 0.2);
      playTone(ctx, 1047, 0.25, 'sine', 0.3, 0.3);
      break;

    case 'tier-change':
      // Dramatic two-part fanfare
      playTone(ctx, 440, 0.2, 'sine', 0.3);
      playTone(ctx, 554, 0.2, 'sine', 0.3, 0.15);
      playTone(ctx, 659, 0.2, 'sine', 0.3, 0.3);
      playTone(ctx, 880, 0.4, 'triangle', 0.35, 0.45);
      break;

    case 'badge-unlock':
      // Sparkle cascade
      playTone(ctx, 1200, 0.12, 'sine', 0.2);
      playTone(ctx, 1500, 0.12, 'sine', 0.2, 0.08);
      playTone(ctx, 1800, 0.12, 'sine', 0.2, 0.16);
      playTone(ctx, 2400, 0.2, 'sine', 0.15, 0.24);
      break;

    case 'streak-milestone':
      // Fire crackle (noise-like with pitch bends)
      playTone(ctx, 300, 0.15, 'sawtooth', 0.15);
      playTone(ctx, 600, 0.1, 'square', 0.1, 0.1);
      playTone(ctx, 900, 0.2, 'sine', 0.25, 0.15);
      break;

    case 'purchase':
      // Cash register ding
      playTone(ctx, 1400, 0.08, 'sine', 0.25);
      playTone(ctx, 1800, 0.15, 'sine', 0.2, 0.08);
      break;

    case 'daily-complete':
      // Completion chime — warm descending
      playTone(ctx, 1047, 0.15, 'sine', 0.25);
      playTone(ctx, 784, 0.15, 'sine', 0.25, 0.12);
      playTone(ctx, 1047, 0.3, 'triangle', 0.2, 0.24);
      break;

    case 'shield-break':
      // Shattering glass effect
      playTone(ctx, 800, 0.1, 'sawtooth', 0.2);
      playTone(ctx, 400, 0.15, 'sawtooth', 0.15, 0.05);
      playTone(ctx, 200, 0.2, 'sawtooth', 0.1, 0.1);
      break;

    case 'welcome':
      // Warm greeting — soft ascending
      playTone(ctx, 440, 0.2, 'sine', 0.15);
      playTone(ctx, 554, 0.2, 'sine', 0.15, 0.15);
      playTone(ctx, 659, 0.3, 'sine', 0.2, 0.3);
      break;
  }
}

export function useSoundEffect() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Lazy-init AudioContext (must be triggered by user gesture)
  const getContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new AudioContext();
      } catch {
        return null;
      }
    }
    // Resume if suspended (autoplay policy)
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Close AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  const play = useCallback(
    (event: SoundEvent) => {
      // Check mute preference from store
      const { soundEnabled } = useUIStore.getState();
      if (!soundEnabled) return;

      // Respect reduced-motion preference
      if (typeof window !== 'undefined') {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
      }

      const ctx = getContext();
      if (!ctx) return;

      synthesize(ctx, event);
    },
    [getContext]
  );

  return { play };
}
