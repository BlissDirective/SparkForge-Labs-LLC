// ════════════════════════════════════════════════════════════════════
// useGameSounds — Unified procedural audio API for all 35 games
// ════════════════════════════════════════════════════════════════════
// Phase 4 §10.6 (Section H-B): Full procedural audio migration.
//
// Problem solved:
//   - 6 flagship games had bespoke Tone.js hooks (usePetTrainerAudio,
//     useAgentAudio, etc.) — 29 other games had ZERO per-action audio
//     (only end-of-game ceremony audio via cockpit).
//   - No shared vocabulary: "playCorrect" in one game, "playHit" in
//     another, inconsistent envelopes, varying pitch standards.
//
// What this hook provides:
//   - 7 canonical game-feedback sounds, all procedural (Tone.js), all
//     child-safe (no harsh transients, gentle descents on wrong).
//   - Respects cockpitStore.masterSoundEnabled + eventAudioVolume
//     (same channel as ceremony fanfares).
//   - Zero static audio files — fully procedural.
//   - Single import, single hook: any of the 35 games can adopt this
//     with one line: `const sfx = useGameSounds();`
//
// Vocabulary (child-safe, AI-learning-appropriate):
//   correct       Rising C-E-G major chord (triumphant but short)
//   wrong         Gentle F#4→E4 descent (not harsh — "try again")
//   combo(n)      Pitch climbs with streak count: base + n × 50 cents
//   timerWarning  Accelerating 200ms tick pattern (tempo climbs as time
//                 runs out — configurable seconds remaining)
//   select        Soft wood click (UI confirmation, grid/tile pick)
//   hint          Descending perfect 4th with bell ring-out (help used)
//   unlock        Rising glass-crystal arpeggio (ability/tier unlock)
//
// Example:
//   const sfx = useGameSounds();
//   if (isCorrect) {
//     sfx.playCorrect();
//     if (streak >= 3) sfx.playCombo(streak);
//   } else sfx.playWrong();
// ════════════════════════════════════════════════════════════════════

'use client';

import { useCallback, useRef } from 'react';
import { useCockpitStore } from '@/stores/cockpitStore';

type ToneModule = typeof import('tone');

export interface GameSoundsAPI {
  /** Rising C-E-G major chord. Triumphant but short (~400ms). */
  playCorrect: () => void;
  /** Gentle F#4→E4 descent. Not harsh — child-safe "try again". */
  playWrong: () => void;
  /**
   * Pitch-climbing chime. Base note rises by 50 cents per streak count.
   * Caps at streak=10 to avoid ear-piercing highs.
   */
  playCombo: (streakCount: number) => void;
  /**
   * Accelerating tick pattern. Call once when timer enters warning zone;
   * the ticks auto-play at accelerating intervals for secondsRemaining.
   * Returns a cancel function to stop the pattern early.
   */
  playTimerWarning: (secondsRemaining: number) => () => void;
  /** Soft wood click — UI tile/card selection confirmation. */
  playSelect: () => void;
  /** Descending perfect-4th bell — hint-used feedback. */
  playHint: () => void;
  /** Rising crystal arpeggio — ability/tier unlock. */
  playUnlock: () => void;
  /** Explicit init — call inside first user gesture (Tone.start()). */
  init: () => Promise<void>;
}

export function useGameSounds(): GameSoundsAPI {
  const toneRef = useRef<ToneModule | null>(null);
  const readyRef = useRef(false);

  // Volume / mute from the canonical audio channel (cockpitStore)
  const masterSoundEnabled = useCockpitStore((s) => s.masterSoundEnabled);
  const eventAudioVolume = useCockpitStore((s) => s.eventAudioVolume);

  // Resolve effective dB for this channel. Event audio volume is 0..1 —
  // map to -40..0 dB log-ish range (muted at 0, full volume at 1).
  const resolveDb = useCallback((baseDb: number) => {
    if (!masterSoundEnabled) return -Infinity; // hard mute
    const volClamp = Math.max(0, Math.min(1, eventAudioVolume));
    if (volClamp < 0.01) return -Infinity;
    // Add up to -40dB of attenuation when user volume < 1
    return baseDb - (1 - volClamp) * 40;
  }, [masterSoundEnabled, eventAudioVolume]);

  const init = useCallback(async () => {
    if (readyRef.current) return;
    try {
      const Tone = await import('tone');
      toneRef.current = Tone;
      await Tone.start();
      readyRef.current = true;
    } catch {
      /* Silent fallback — no audio support */
    }
  }, []);

  // Helper: guarantee init before first play. Non-blocking: if Tone isn't
  // ready on the first call, the sound is silent (user gesture needed).
  const playWith = useCallback(
    (fn: (Tone: ToneModule) => void) => {
      if (!readyRef.current || !toneRef.current) {
        // Attempt lazy init — if we're inside a user gesture, this works
        void init();
        return;
      }
      if (!masterSoundEnabled) return;
      try {
        fn(toneRef.current);
      } catch {
        /* Silent fallback */
      }
    },
    [init, masterSoundEnabled]
  );

  // ─── Rising C-E-G major chord ───
  const playCorrect = useCallback(() => {
    playWith((Tone) => {
      const db = resolveDb(-18);
      const synth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.005, decay: 0.12, sustain: 0.05, release: 0.15 },
        volume: db,
      }).toDestination();
      synth.triggerAttackRelease('C5', '32n');
      setTimeout(() => synth.triggerAttackRelease('E5', '32n'), 70);
      setTimeout(() => synth.triggerAttackRelease('G5', '16n'), 140);
      setTimeout(() => synth.dispose(), 500);
    });
  }, [playWith, resolveDb]);

  // ─── Gentle F#4 → E4 minor-second descent ───
  const playWrong = useCallback(() => {
    playWith((Tone) => {
      const db = resolveDb(-22);
      const synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.3 },
        volume: db,
      }).toDestination();
      synth.triggerAttackRelease('F#4', '16n');
      setTimeout(() => synth.triggerAttackRelease('E4', '8n'), 120);
      setTimeout(() => synth.dispose(), 500);
    });
  }, [playWith, resolveDb]);

  // ─── Combo: pitch climbs with streak count (capped at 10) ───
  const playCombo = useCallback(
    (streakCount: number) => {
      playWith((Tone) => {
        const db = resolveDb(-16);
        const capped = Math.max(1, Math.min(10, streakCount));
        // Base E5 (~659 Hz), +50 cents per streak step = bright triadic stack
        const baseFreq = 659.25;
        const cents = capped * 50;
        const freq = baseFreq * Math.pow(2, cents / 1200);
        const synth = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0.08, release: 0.2 },
          volume: db,
        }).toDestination();
        synth.triggerAttackRelease(freq, '16n');
        // Octave shimmer on higher streaks
        if (capped >= 5) {
          setTimeout(() => synth.triggerAttackRelease(freq * 2, '32n'), 40);
        }
        setTimeout(() => synth.dispose(), 400);
      });
    },
    [playWith, resolveDb]
  );

  // ─── Timer warning: accelerating tick pattern ───
  const playTimerWarning = useCallback(
    (secondsRemaining: number) => {
      let cancelled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      playWith((Tone) => {
        const db = resolveDb(-20);
        const metronome = new Tone.MembraneSynth({
          pitchDecay: 0.02,
          octaves: 2,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
          volume: db,
        }).toDestination();

        const ticks = Math.max(1, Math.min(20, Math.floor(secondsRemaining)));
        const startInterval = 600; // ms at start — relaxed
        const endInterval = 150; // ms at end — urgent
        let i = 0;

        const scheduleNext = () => {
          if (cancelled || i >= ticks) {
            metronome.dispose();
            return;
          }
          const progress = i / Math.max(1, ticks - 1);
          const interval =
            startInterval + (endInterval - startInterval) * progress;
          // Rising pitch as time runs out: C3 → E3
          const pitch = progress < 0.7 ? 'C3' : 'E3';
          metronome.triggerAttackRelease(pitch, '32n');
          i++;
          timeoutId = setTimeout(scheduleNext, interval);
        };
        scheduleNext();
      });

      return () => {
        cancelled = true;
        if (timeoutId) clearTimeout(timeoutId);
      };
    },
    [playWith, resolveDb]
  );

  // ─── Select: soft wood click ───
  const playSelect = useCallback(() => {
    playWith((Tone) => {
      const db = resolveDb(-24);
      const noise = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.02 },
        volume: db,
      }).toDestination();
      const filter = new Tone.Filter(800, 'bandpass').toDestination();
      noise.connect(filter);
      noise.triggerAttackRelease('16n');
      setTimeout(() => {
        noise.dispose();
        filter.dispose();
      }, 200);
    });
  }, [playWith, resolveDb]);

  // ─── Hint: descending perfect 4th with bell ring-out ───
  const playHint = useCallback(() => {
    playWith((Tone) => {
      const db = resolveDb(-20);
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.5 },
        volume: db,
      }).toDestination();
      synth.triggerAttackRelease('A4', '8n');
      setTimeout(() => synth.triggerAttackRelease('E4', '4n'), 150);
      setTimeout(() => synth.dispose(), 900);
    });
  }, [playWith, resolveDb]);

  // ─── Unlock: rising crystal arpeggio ───
  const playUnlock = useCallback(() => {
    playWith((Tone) => {
      const db = resolveDb(-16);
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.4 },
        volume: db,
      }).toDestination();
      const notes = ['C5', 'E5', 'G5', 'C6'];
      notes.forEach((note, i) => {
        setTimeout(() => synth.triggerAttackRelease(note, '16n'), i * 80);
      });
      setTimeout(() => synth.dispose(), 800);
    });
  }, [playWith, resolveDb]);

  return {
    playCorrect,
    playWrong,
    playCombo,
    playTimerWarning,
    playSelect,
    playHint,
    playUnlock,
    init,
  };
}
