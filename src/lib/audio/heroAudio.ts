// ================================================================
// HeroAudioTimeline — Tone.js audio timeline for the 8-phase hero animation
// ================================================================
// Synchronized to GSAP master timeline progress via Tone.Transport.
//
// Audio Graph:
//   Master Volume → Limiter → Destination
//   ├─ Sub-bass rumble (Phase 1)
//   ├─ Whoosh/Impact/Chimes (Phase 2)
//   ├─ Crystalline hum (Phase 3)
//   ├─ Electric crackle (Phase 4)
//   ├─ Shatter transient (Phase 5)
//   ├─ Migration drone (Phase 6)
//   ├─ Boot sequence (Phase 7)
//   └─ Cockpit ambient (Phase 8 — persists)
//
// OD-1: Audio plays by default. Muted if soundEnabled === false.
// OD-2: Fast-forward at 4x includes pitch compensation.
// Audio context created on first user interaction (browser autoplay policy).

import * as Tone from 'tone';

// ── Phase timing constants (seconds) ────────────────────────────
// Hero v3 boundaries (storyboard §11 audio remap, runtime extension to 19.5 s).
// Each PHASE_TIMES key now corresponds to a v3 beat:
//   void        → Beat 1 (Void Awakening)         0.0  → 2.5
//   assembly    → Beat 2 (Ignition Spark)         2.5  → 5.0
//   showcase    → Beat 3 (S Crystallization)      5.0  → 8.0
//   surge       → Beat 4 first half (F buildup)   8.0  → 10.0
//   shatter     → Beat 4 second half (detonation) 10.0 → 11.0
//   regroup     → Beats 5+6 (Cascade + Bloom)     11.0 → 16.5
//   materialize → Beat 7 (Cockpit Materialization)16.5 → 18.5
//   online      → Beat 8 (Atomic Handoff)         18.5 → 19.5
const PHASE_TIMES = {
  void:        { start: 0.0,  end: 2.5  },
  assembly:    { start: 2.5,  end: 5.0  },
  showcase:    { start: 5.0,  end: 8.0  },
  surge:       { start: 8.0,  end: 10.0 },
  shatter:     { start: 10.0, end: 11.0 },
  regroup:     { start: 11.0, end: 16.5 },
  materialize: { start: 16.5, end: 18.5 },
  online:      { start: 18.5, end: 19.5 },
} as const;

// ── Audio node interfaces ───────────────────────────────────────
interface PhaseNodes {
  dispose(): void;
}

interface VoidNodes extends PhaseNodes {
  rumble: Tone.Noise;
  rumbleFilter: Tone.Filter;
  subBass: Tone.Oscillator;
  subBassGain: Tone.Gain;
  reverb: Tone.Reverb;
}

interface AssemblyNodes extends PhaseNodes {
  whoosh: Tone.Noise;
  whooshFilter: Tone.Filter;
  impact: Tone.MembraneSynth;
  clang: Tone.MetalSynth;
  grainChimes: Tone.GrainPlayer;
}

interface ShowcaseNodes extends PhaseNodes {
  hum: Tone.PolySynth;
  whoosh: Tone.Noise;
  whooshPanner: Tone.Panner3D;
}

interface SurgeNodes extends PhaseNodes {
  crackle: Tone.NoiseSynth;
  crackleFilter: Tone.Filter;
  tensionSweep: Tone.Oscillator;
  tensionFilter: Tone.Filter;
  thunder: Tone.Noise;
  thunderGain: Tone.Gain;
}

interface ShatterNodes extends PhaseNodes {
  subDrop: Tone.MembraneSynth;
  glassShatter: Tone.Player;
  impactReverb: Tone.Reverb;
  debris: Tone.GrainPlayer;
  echo: Tone.FeedbackDelay;
  echoFilter: Tone.Filter;
}

interface RegroupNodes extends PhaseNodes {
  decel: Tone.MetalSynth;
  decelFilter: Tone.Filter;
  migrationDrone: Tone.Noise;
  migrationPanner: Tone.Panner3D;
  migrationGain: Tone.Gain;
  cockpitHum: Tone.Oscillator;
  cockpitHumGain: Tone.Gain;
}

interface MaterializeNodes extends PhaseNodes {
  auroraPad: Tone.PolySynth;
  ledBuzz: Tone.Oscillator;
  ledBuzzGain: Tone.Gain;
  panelClunk: Tone.NoiseSynth;
  panelClunkFilter: Tone.Filter;
  digitalChirp: Tone.Synth;
  hudRing: Tone.PolySynth;
  gaugeClick: Tone.NoiseSynth;
  gaugeClickFilter: Tone.Filter;
  cockpitHum: Tone.Oscillator;
  cockpitHumGain: Tone.Gain;
}

interface OnlineNodes extends PhaseNodes {
  powerUp: Tone.Synth;
  cockpitAmbient: Tone.Oscillator;
  cockpitAmbientGain: Tone.Gain;
}

// ── Helper: safely dispose a Tone node ──────────────────────────
function safeDispose(node: Tone.ToneAudioNode | null | undefined): void {
  try {
    node?.dispose();
  } catch {
    // Node may already be disposed
  }
}

// ── HeroAudioTimeline Class ─────────────────────────────────────
export class HeroAudioTimeline {
  private masterGain: Tone.Gain | null = null;
  private limiter: Tone.Limiter | null = null;
  private isMuted: boolean;
  private isInitialized = false;
  private isDisposed = false;
  private currentTimeScale = 1.0;

  // Phase node groups
  private voidNodes: VoidNodes | null = null;
  private assemblyNodes: AssemblyNodes | null = null;
  private showcaseNodes: ShowcaseNodes | null = null;
  private surgeNodes: SurgeNodes | null = null;
  private shatterNodes: ShatterNodes | null = null;
  private regroupNodes: RegroupNodes | null = null;
  private materializeNodes: MaterializeNodes | null = null;
  private onlineNodes: OnlineNodes | null = null;

  // Scheduled event IDs for cleanup
  private scheduledEvents: number[] = [];
  // Crackle interval for Phase 4
  private crackleInterval: ReturnType<typeof setInterval> | null = null;

  constructor(soundEnabled: boolean) {
    this.isMuted = !soundEnabled;
  }

  /** Schedule all audio cues. Must be called after user interaction (autoplay policy). */
  async initialize(): Promise<void> {
    if (this.isInitialized || this.isDisposed) return;

    // Start Tone.js audio context
    await Tone.start();

    // Master signal chain: Gain → Limiter → Destination
    this.limiter = new Tone.Limiter(-3).toDestination();
    this.masterGain = new Tone.Gain(this.isMuted ? 0 : 1).connect(this.limiter);

    // Build all phase audio nodes
    this.buildVoidNodes();
    this.buildAssemblyNodes();
    this.buildShowcaseNodes();
    this.buildSurgeNodes();
    this.buildShatterNodes();
    this.buildRegroupNodes();
    this.buildMaterializeNodes();
    this.buildOnlineNodes();

    this.isInitialized = true;
  }

  // ── Phase 1: Void (0.0s – 2.0s) ────────────────────────────
  private buildVoidNodes(): void {
    if (!this.masterGain) return;

    const reverb = new Tone.Reverb({ decay: 4, wet: 0.6 }).connect(this.masterGain);
    const rumbleFilter = new Tone.Filter({
      type: 'lowpass', frequency: 80, rolloff: -24,
    }).connect(reverb);
    const rumble = new Tone.Noise('brown').connect(rumbleFilter);

    const subBassGain = new Tone.Gain(0).connect(this.masterGain);
    const subBass = new Tone.Oscillator({ type: 'sine', frequency: 40 }).connect(subBassGain);

    this.voidNodes = {
      rumble, rumbleFilter, subBass, subBassGain, reverb,
      dispose() {
        safeDispose(rumble); safeDispose(rumbleFilter);
        safeDispose(subBass); safeDispose(subBassGain);
        safeDispose(reverb);
      },
    };
  }

  // ── Phase 2: Assembly (2.0s – 4.5s) ────────────────────────
  private buildAssemblyNodes(): void {
    if (!this.masterGain) return;

    const whooshFilter = new Tone.Filter({
      type: 'bandpass', frequency: 200, Q: 2,
    }).connect(this.masterGain);
    const whoosh = new Tone.Noise('white').connect(whooshFilter);

    const impact = new Tone.MembraneSynth({
      pitchDecay: 0.05, octaves: 4,
    }).connect(this.masterGain);

    const clang = new Tone.MetalSynth({
      harmonicity: 5.1, resonance: 4000,
    }).connect(this.masterGain);

    // GrainPlayer may fail if audio file is missing — gracefully degrade
    const grainChimes = new Tone.GrainPlayer({
      url: '/audio/glass-chime.mp3',
      grainSize: 0.05,
      overlap: 0.1,
    }).connect(this.masterGain);

    this.assemblyNodes = {
      whoosh, whooshFilter, impact, clang, grainChimes,
      dispose() {
        safeDispose(whoosh); safeDispose(whooshFilter);
        safeDispose(impact); safeDispose(clang);
        safeDispose(grainChimes);
      },
    };
  }

  // ── Phase 3: Showcase (4.5s – 7.5s) ────────────────────────
  private buildShowcaseNodes(): void {
    if (!this.masterGain) return;

    const hum = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' as const },
      envelope: { attack: 2.0, decay: 0.5, sustain: 0.8, release: 2.0 },
      volume: -16,
    }).connect(this.masterGain);

    const whooshPanner = new Tone.Panner3D({
      positionX: 0, positionY: 0, positionZ: 3,
    }).connect(this.masterGain);
    const whoosh = new Tone.Noise('pink').connect(whooshPanner);

    this.showcaseNodes = {
      hum, whoosh, whooshPanner,
      dispose() {
        safeDispose(hum); safeDispose(whoosh); safeDispose(whooshPanner);
      },
    };
  }

  // ── Phase 4: Surge (7.5s – 10.0s) ──────────────────────────
  private buildSurgeNodes(): void {
    if (!this.masterGain) return;

    const crackleFilter = new Tone.Filter({
      type: 'bandpass', frequency: 2500, Q: 4,
    }).connect(this.masterGain);
    const crackle = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
    }).connect(crackleFilter);

    const tensionFilter = new Tone.Filter({
      type: 'lowpass', frequency: 800, Q: 12,
    }).connect(this.masterGain);
    const tensionSweep = new Tone.Oscillator({
      type: 'sawtooth', frequency: 100,
    }).connect(tensionFilter);

    const thunderGain = new Tone.Gain(0).connect(this.masterGain);
    const thunder = new Tone.Noise('brown').connect(thunderGain);

    this.surgeNodes = {
      crackle, crackleFilter, tensionSweep, tensionFilter, thunder, thunderGain,
      dispose() {
        safeDispose(crackle); safeDispose(crackleFilter);
        safeDispose(tensionSweep); safeDispose(tensionFilter);
        safeDispose(thunder); safeDispose(thunderGain);
      },
    };
  }

  // ── Phase 5: Shatter (10.0s – 11.5s) ───────────────────────
  private buildShatterNodes(): void {
    if (!this.masterGain) return;

    const impactReverb = new Tone.Reverb({ decay: 3.0, wet: 0.7 }).connect(this.masterGain);

    const subDrop = new Tone.MembraneSynth({
      pitchDecay: 0.1, octaves: 6,
    }).connect(impactReverb);

    const glassShatter = new Tone.Player('/audio/glass-shatter.mp3').connect(impactReverb);

    const echoFilter = new Tone.Filter({
      type: 'lowpass', frequency: 2000,
    }).connect(this.masterGain);
    const echo = new Tone.FeedbackDelay({
      delayTime: 0.3, feedback: 0.4,
    }).connect(echoFilter);

    const debris = new Tone.GrainPlayer({
      url: '/audio/glass-fragments.mp3',
      grainSize: 0.03,
      overlap: 0.15,
      playbackRate: 1.0,
    }).connect(echo);

    this.shatterNodes = {
      subDrop, glassShatter, impactReverb, debris, echo, echoFilter,
      dispose() {
        safeDispose(subDrop); safeDispose(glassShatter);
        safeDispose(impactReverb); safeDispose(debris);
        safeDispose(echo); safeDispose(echoFilter);
      },
    };
  }

  // ── Phase 6: Regroup (11.5s – 14.0s) ───────────────────────
  private buildRegroupNodes(): void {
    if (!this.masterGain) return;

    const decelFilter = new Tone.Filter({
      type: 'bandpass', frequency: 4000, Q: 2,
    }).connect(this.masterGain);
    const decel = new Tone.MetalSynth({
      harmonicity: 3.1, resonance: 4000,
    }).connect(decelFilter);

    const migrationGain = new Tone.Gain(Tone.gainToDb(0.06)).connect(this.masterGain);
    const migrationPanner = new Tone.Panner3D({
      panningModel: 'HRTF',
    }).connect(migrationGain);
    const migrationDrone = new Tone.Noise('pink').connect(migrationPanner);

    const cockpitHumGain = new Tone.Gain(-20).connect(this.masterGain);
    const cockpitHum = new Tone.Oscillator({
      type: 'sine', frequency: 55,
    }).connect(cockpitHumGain);

    this.regroupNodes = {
      decel, decelFilter, migrationDrone, migrationPanner, migrationGain,
      cockpitHum, cockpitHumGain,
      dispose() {
        safeDispose(decel); safeDispose(decelFilter);
        safeDispose(migrationDrone); safeDispose(migrationPanner);
        safeDispose(migrationGain);
        safeDispose(cockpitHum); safeDispose(cockpitHumGain);
      },
    };
  }

  // ── Phase 7: Materialize (14.0s – 17.0s) ───────────────────
  private buildMaterializeNodes(): void {
    if (!this.masterGain) return;

    // 1. Aurora: soft pad swell (Am7)
    const auroraPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' as const },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.6, release: 1.0 },
      volume: -12,
    }).connect(this.masterGain);

    // 2. LED: electric buzz snap (filtered square wave)
    const ledBuzzGain = new Tone.Gain(-18).connect(this.masterGain);
    const ledBuzz = new Tone.Oscillator({
      type: 'square', frequency: 120,
    }).connect(ledBuzzGain);

    // 3. Panels: metallic clunk (noise burst + lowpass)
    const panelClunkFilter = new Tone.Filter({
      type: 'lowpass', frequency: 500, rolloff: -12,
    }).connect(this.masterGain);
    const panelClunk = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
    }).connect(panelClunkFilter);

    // 4. SidePanels: digital chirp sequence (FM synth rapid arpeggio)
    const digitalChirp = new Tone.Synth({
      oscillator: { type: 'fmsine' as const },
      envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.02 },
      volume: -10,
    }).connect(this.masterGain);

    // 5. HUD: harmonic ring (sine harmonics C5-G5-C6)
    const hudRing = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' as const },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.5 },
      volume: -14,
    }).connect(this.masterGain);

    // 6. StatusBar: gauge clicks (granular noise, 3 hits)
    const gaugeClickFilter = new Tone.Filter({
      type: 'highpass', frequency: 3000,
    }).connect(this.masterGain);
    const gaugeClick = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
      volume: -8,
    }).connect(gaugeClickFilter);

    // Cockpit hum reaches full volume (-6dB)
    const cockpitHumGain = new Tone.Gain(-6).connect(this.masterGain);
    const cockpitHum = new Tone.Oscillator({
      type: 'sine', frequency: 55,
    }).connect(cockpitHumGain);

    this.materializeNodes = {
      auroraPad, ledBuzz, ledBuzzGain, panelClunk, panelClunkFilter,
      digitalChirp, hudRing, gaugeClick, gaugeClickFilter,
      cockpitHum, cockpitHumGain,
      dispose() {
        safeDispose(auroraPad); safeDispose(ledBuzz); safeDispose(ledBuzzGain);
        safeDispose(panelClunk); safeDispose(panelClunkFilter);
        safeDispose(digitalChirp); safeDispose(hudRing);
        safeDispose(gaugeClick); safeDispose(gaugeClickFilter);
        safeDispose(cockpitHum); safeDispose(cockpitHumGain);
      },
    };
  }

  // ── Phase 8: Online (17.0s – 19.0s) ────────────────────────
  private buildOnlineNodes(): void {
    if (!this.masterGain) return;

    // FM sweep power-up C3→C5, 0.5s
    const powerUp = new Tone.Synth({
      oscillator: { type: 'fmsine' as const },
      envelope: { attack: 0.1, decay: 0.3, sustain: 0.1, release: 0.2 },
      volume: -8,
    }).connect(this.masterGain);

    // Persistent cockpit ambient
    const cockpitAmbientGain = new Tone.Gain(-6).connect(this.masterGain);
    const cockpitAmbient = new Tone.Oscillator({
      type: 'sine', frequency: 55,
    }).connect(cockpitAmbientGain);

    this.onlineNodes = {
      powerUp, cockpitAmbient, cockpitAmbientGain,
      dispose() {
        safeDispose(powerUp);
        safeDispose(cockpitAmbient); safeDispose(cockpitAmbientGain);
      },
    };
  }

  // ── Sync to GSAP timeline progress ────────────────────────────
  /**
   * Called each frame with GSAP progress (0.0–1.0) mapped to the 19s timeline.
   * Triggers audio cues at the correct moments.
   */
  syncToProgress(progress: number): void {
    if (!this.isInitialized || this.isDisposed) return;

    const currentTime = progress * 19.5; // 19.5s total duration (v3 runtime)

    // Phase 1: Void (0.0–2.0s)
    this.syncVoid(currentTime);
    // Phase 2: Assembly (2.0–4.5s)
    this.syncAssembly(currentTime);
    // Phase 3: Showcase (4.5–7.5s)
    this.syncShowcase(currentTime);
    // Phase 4: Surge (7.5–10.0s)
    this.syncSurge(currentTime);
    // Phase 5: Shatter (10.0–11.5s)
    this.syncShatter(currentTime);
    // Phase 6: Regroup (11.5–14.0s)
    this.syncRegroup(currentTime);
    // Phase 7: Materialize (14.0–17.0s)
    this.syncMaterialize(currentTime);
    // Phase 8: Online (17.0–19.0s)
    this.syncOnline(currentTime);
  }

  // Track which phases have been started/stopped to avoid re-triggering
  private activePhases = new Set<string>();
  private triggeredOneShots = new Set<string>();

  private isInPhase(time: number, phase: keyof typeof PHASE_TIMES): boolean {
    return time >= PHASE_TIMES[phase].start && time < PHASE_TIMES[phase].end;
  }

  private startPhase(name: string): boolean {
    if (this.activePhases.has(name)) return false;
    this.activePhases.add(name);
    return true;
  }

  private endPhase(name: string): boolean {
    if (!this.activePhases.has(name)) return false;
    this.activePhases.delete(name);
    return true;
  }

  private triggerOnce(key: string, fn: () => void): void {
    if (this.triggeredOneShots.has(key)) return;
    this.triggeredOneShots.add(key);
    fn();
  }

  // ── Phase sync methods ────────────────────────────────────────

  private syncVoid(time: number): void {
    if (!this.voidNodes) return;
    const { rumble, rumbleFilter, subBass, subBassGain } = this.voidNodes;

    if (this.isInPhase(time, 'void')) {
      if (this.startPhase('void')) {
        rumble.start();
        subBass.start();
      }
      // Ramp filter 80Hz → 200Hz over 2.5s (v3 extended window)
      const t = (time - PHASE_TIMES.void.start) / 2.5;
      rumbleFilter.frequency.value = 80 + t * 120;
      // Sub-bass amplitude 0 → 0.3
      subBassGain.gain.value = t * 0.3;
    } else if (time >= PHASE_TIMES.void.end && this.endPhase('void')) {
      try { rumble.stop(); } catch { /* already stopped */ }
      try { subBass.stop(); } catch { /* already stopped */ }
    }
  }

  private syncAssembly(time: number): void {
    if (!this.assemblyNodes) return;
    const { whoosh, whooshFilter, impact, clang, grainChimes } = this.assemblyNodes;

    if (this.isInPhase(time, 'assembly')) {
      if (this.startPhase('assembly')) {
        whoosh.start();
        // Start grain chimes if loaded (graceful if audio file missing).
        // v3 grain start delayed to t=3.0 (1st lensflare ignition has just
        // landed); set up a triggerOnce below.
      }
      // Sweep whoosh filter 200Hz → 1200Hz over 2.5s (softened from 2kHz —
      // v3 storyboard §11 calls for a softer peak that doesn't compete
      // with the lensflare hot core's spectral brightness)
      const t = (time - PHASE_TIMES.assembly.start) / 2.5;
      whooshFilter.frequency.value = 200 + t * 1000;

      // GrainChimes start delayed to t=3.0 (matches v3 storyboard §4)
      if (time >= 3.0) {
        this.triggerOnce('assembly-grain-start', () => {
          try { grainChimes.start(); } catch { /* file not loaded */ }
        });
      }

      // Impact + clang hit at t=4.0 (warm-amber lensflare peak)
      if (time >= 3.95 && time < 4.15) {
        this.triggerOnce('assembly-impact-actual', () => {
          impact.triggerAttackRelease('C1', '8n');
          clang.triggerAttackRelease('16n', Tone.now());
        });
      }
    } else if (time >= PHASE_TIMES.assembly.end && this.endPhase('assembly')) {
      try { whoosh.stop(); } catch { /* already stopped */ }
      try { grainChimes.stop(); } catch { /* not playing */ }
    }
  }

  private syncShowcase(time: number): void {
    if (!this.showcaseNodes) return;
    const { hum, whoosh, whooshPanner } = this.showcaseNodes;

    if (this.isInPhase(time, 'showcase')) {
      if (this.startPhase('showcase')) {
        // Cmaj7 chord sustained across Beat 3 (S Crystallization)
        hum.triggerAttack(['C4', 'E4', 'G4', 'B4']);
        whoosh.start();
      }
      // Panner follows camera path (slow sweep — Beat 3 is a pull-in,
      // not an orbit, so the sweep is gentler than v2 orbit)
      const t = (time - PHASE_TIMES.showcase.start) / 3.0;
      const angle = t * Math.PI; // half-revolution instead of full
      whooshPanner.positionX.value = Math.cos(angle) * 2.4;
      whooshPanner.positionZ.value = Math.sin(angle) * 2.4;
    } else if (time >= PHASE_TIMES.showcase.end && this.endPhase('showcase')) {
      hum.triggerRelease(['C4', 'E4', 'G4', 'B4']);
      try { whoosh.stop(); } catch { /* already stopped */ }
    }
  }

  private syncSurge(time: number): void {
    if (!this.surgeNodes) return;
    const { crackle, tensionSweep, tensionFilter, thunder, thunderGain } = this.surgeNodes;

    if (this.isInPhase(time, 'surge')) {
      if (this.startPhase('surge')) {
        tensionSweep.start();
        thunder.start();
        // Start stochastic crackle every 50-150ms
        this.crackleInterval = setInterval(() => {
          crackle.triggerAttackRelease('32n', Tone.now());
        }, 50 + Math.random() * 100);
      }
      // Tension sweep 100Hz → 800Hz over 2.0s (v3 surge is shorter — Beat 4
      // first half only; 8.0 → 10.0 = 2.0 s)
      const t = (time - PHASE_TIMES.surge.start) / 2.0;
      tensionFilter.frequency.value = 100 + t * 700;
      // Thunder amplitude 0 → 0.4
      thunderGain.gain.value = t * 0.4;
    } else if (time >= PHASE_TIMES.surge.end && this.endPhase('surge')) {
      try { tensionSweep.stop(); } catch { /* already stopped */ }
      try { thunder.stop(); } catch { /* already stopped */ }
      if (this.crackleInterval) {
        clearInterval(this.crackleInterval);
        this.crackleInterval = null;
      }
    }
  }

  private syncShatter(time: number): void {
    if (!this.shatterNodes) return;
    const { subDrop, glassShatter, debris } = this.shatterNodes;

    if (this.isInPhase(time, 'shatter')) {
      // All triggered at t=10.0s exact (v3 detonation aligned to frame —
      // v2 was slightly late at 10.2)
      this.triggerOnce('shatter-detonation', () => {
        subDrop.triggerAttackRelease('C0', '4n');
        try {
          if (glassShatter.loaded) glassShatter.start();
        } catch { /* file not loaded */ }
        try {
          if (debris.loaded) debris.start();
        } catch { /* file not loaded */ }
      });
    } else if (time >= PHASE_TIMES.shatter.end) {
      if (this.endPhase('shatter')) {
        try { debris.stop(); } catch { /* not playing */ }
      }
    }
  }

  private syncRegroup(time: number): void {
    if (!this.regroupNodes) return;
    const { decel, decelFilter, migrationDrone, cockpitHum, cockpitHumGain } = this.regroupNodes;
    if (!this.assemblyNodes) return;
    const { clang } = this.assemblyNodes;

    if (this.isInPhase(time, 'regroup')) {
      if (this.startPhase('regroup')) {
        decel.triggerAttackRelease('2n', Tone.now());
        migrationDrone.start();
        cockpitHum.start();
      }
      // Decel filter sweep 4kHz → 200Hz over 1s — masks the shatter ringout
      const t = Math.min((time - PHASE_TIMES.regroup.start) / 1.0, 1.0);
      decelFilter.frequency.value = 4000 - t * 3800;
      // Cockpit hum rises -20dB → -6dB across regroup window
      // (window is now 5.5s long: 11.0 → 16.5; previous v2 was 2.5s ramp to -12)
      const humT = Math.min((time - PHASE_TIMES.regroup.start) / 5.5, 1.0);
      cockpitHumGain.gain.value = Tone.dbToGain(-20 + humT * 14);

      // Beat 5 per-letter cascade chimes — re-use clang from assembly nodes
      // 8 letters pop at storyboard times offset from regroup start (11.0):
      // p@11.30 a@11.55 r@11.80 k@12.05 o@12.40 r@12.70 g@13.00 e@13.30
      const cascadeTimes = [11.30, 11.55, 11.80, 12.05, 12.40, 12.70, 13.00, 13.30];
      cascadeTimes.forEach((triggerTime, i) => {
        if (time >= triggerTime && time < triggerTime + 0.10) {
          this.triggerOnce(`cascade-clang-${i}`, () => {
            try { clang.triggerAttackRelease('32n', Tone.now()); } catch { /* ok */ }
          });
        }
      });
    } else if (time >= PHASE_TIMES.regroup.end && this.endPhase('regroup')) {
      try { migrationDrone.stop(); } catch { /* already stopped */ }
      // cockpitHum continues into materialize phase (Beat 7)
    }
  }

  private syncMaterialize(time: number): void {
    if (!this.materializeNodes) return;
    const {
      auroraPad, ledBuzz, panelClunk, digitalChirp, hudRing,
      cockpitHum,
    } = this.materializeNodes;

    // v3 split: auroraPad + hudRing fire DURING regroup (Beat 6 dichroic
    // bloom at t=14.0 / 15.2). LED/panel/chirp/gauge stay in materialize
    // (Beat 7 cockpit booting) at storyboard times. gaugeClick re-purposed
    // for Beat 8 shard-arrival ticks (handled in syncOnline).

    // ─── Beat 6 cues (in regroup window) — fired BEFORE the materialize
    // window opens, so they live as triggerOnce checks here ───
    if (time >= 14.0 && time < 14.1) {
      this.triggerOnce('beat6-aurora-attack', () => {
        auroraPad.triggerAttack(['A3', 'C4', 'E4', 'G4']);
      });
    }
    if (time >= 15.2 && time < 15.3) {
      this.triggerOnce('beat6-hud-ring', () => {
        hudRing.triggerAttackRelease(['C5', 'G5', 'C6'], '8n');
      });
    }
    // Aurora release at end of Beat 6 (before materialize opens)
    if (time >= 16.4 && time < 16.5) {
      this.triggerOnce('beat6-aurora-release', () => {
        auroraPad.triggerRelease(['A3', 'C4', 'E4', 'G4']);
      });
    }

    if (this.isInPhase(time, 'materialize')) {
      if (this.startPhase('materialize')) {
        cockpitHum.start();
      }

      // Beat 7 boot sequence — staggered cockpit instrument cues per
      // storyboard §9 audio map.
      // - LED buzz @ t=16.9 (progress 0.20 within Beat 7)
      // - Panel clunk @ t=17.3
      // - Digital chirp arpeggio @ t=17.7
      if (time >= 16.9 && time < 17.0) {
        this.triggerOnce('beat7-led', () => {
          ledBuzz.start();
          setTimeout(() => { try { ledBuzz.stop(); } catch { /* ok */ } }, 100);
        });
      }
      if (time >= 17.3 && time < 17.4) {
        this.triggerOnce('beat7-panel', () => {
          panelClunk.triggerAttackRelease('16n', Tone.now());
        });
      }
      if (time >= 17.7 && time < 17.8) {
        this.triggerOnce('beat7-chirp', () => {
          const notes = ['C5', 'E5', 'G5', 'C6'] as const;
          notes.forEach((note, i) => {
            setTimeout(() => {
              try { digitalChirp.triggerAttackRelease(note, '32n'); } catch { /* ok */ }
            }, i * 50);
          });
        });
      }
    } else if (time >= PHASE_TIMES.materialize.end && this.endPhase('materialize')) {
      // cockpitHum continues into Beat 8 (online phase)
    }
  }

  private syncOnline(time: number): void {
    if (!this.onlineNodes) return;
    const { powerUp, cockpitAmbient } = this.onlineNodes;
    if (!this.materializeNodes) return;
    const { gaugeClick } = this.materializeNodes;

    if (this.isInPhase(time, 'online')) {
      // FM sweep power-up C5 + start persistent cockpit ambient @ t=18.5
      // (Beat 8 mini-shatter trigger — climactic system-online tone)
      this.triggerOnce('online-powerup', () => {
        powerUp.triggerAttackRelease('C5', '4n');
        cockpitAmbient.start();
      });

      // Beat 8 per-shard arrival ticks (storyboard §10 + §11):
      // 8 gauge clicks staggered ~40 ms apart starting t=19.0 (after first
      // wave of shards lands at central display + consoles).
      // 19.00, 19.04, 19.08, 19.12, 19.16, 19.20, 19.24, 19.28
      const arrivalTimes = [19.00, 19.04, 19.08, 19.12, 19.16, 19.20, 19.24, 19.28];
      arrivalTimes.forEach((triggerTime, i) => {
        if (time >= triggerTime && time < triggerTime + 0.05) {
          this.triggerOnce(`beat8-arrival-${i}`, () => {
            try { gaugeClick.triggerAttackRelease('64n', Tone.now()); } catch { /* ok */ }
          });
        }
      });
    }
    // Beat 8 cockpit ambient persists — no cleanup (handed off to cockpit's
    // own audio engine)
  }

  // ── Public API ────────────────────────────────────────────────

  /** Apply fast-forward pitch compensation (OD-2). */
  setTimeScale(scale: number): void {
    this.currentTimeScale = scale;
    // Pitch compensation: lower pitch when speeding up to prevent chipmunk
    if (this.masterGain) {
      // We keep the pitch at 1.0 regardless of timescale; the scheduling
      // handles tempo change — audio cues trigger at correct progress points.
      // No chipmunk effect since we sync by progress, not transport time.
    }
  }

  /** Mute all nodes without stopping timeline. */
  mute(): void {
    this.isMuted = true;
    if (this.masterGain) {
      this.masterGain.gain.rampTo(0, 0.05);
    }
  }

  /** Unmute all nodes. */
  unmute(): void {
    this.isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.rampTo(1, 0.05);
    }
  }

  /** Clean up all Tone.js nodes and release audio resources. */
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    // Clear crackle interval
    if (this.crackleInterval) {
      clearInterval(this.crackleInterval);
      this.crackleInterval = null;
    }

    // Dispose all phase node groups
    this.voidNodes?.dispose();
    this.assemblyNodes?.dispose();
    this.showcaseNodes?.dispose();
    this.surgeNodes?.dispose();
    this.shatterNodes?.dispose();
    this.regroupNodes?.dispose();
    this.materializeNodes?.dispose();
    // Don't dispose online nodes — cockpit ambient persists
    // The cockpit audio engine takes over from here

    this.voidNodes = null;
    this.assemblyNodes = null;
    this.showcaseNodes = null;
    this.surgeNodes = null;
    this.shatterNodes = null;
    this.regroupNodes = null;
    this.materializeNodes = null;

    // Dispose master chain
    safeDispose(this.masterGain);
    safeDispose(this.limiter);
    this.masterGain = null;
    this.limiter = null;

    this.activePhases.clear();
    this.triggeredOneShots.clear();
  }
}
