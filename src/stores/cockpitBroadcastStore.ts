// ════════════════════════════════════════════════════
// COCKPIT BROADCAST STORE — Cross-Panel Event System
// ════════════════════════════════════════════════════
// Every 3D UI interaction (dial rotate, button press, page navigate)
// broadcasts a CockpitEvent that ALL cockpit components subscribe to.
// This creates the "everything reacts to everything" effect:
// - Dial drag → LED rim pulses, StatusBar needle sweeps, HUD flashes
// - Button press → Camera flies, dials reconfigure, LEDs shift color
// - Page navigate → Full cockpit state transition with visual feedback
//
// Per cockpit-architecture.json: "each dial broadcasts changes to
// center viewport, left/right consoles, status bar, and holographic
// HUD simultaneously"

import { create } from 'zustand';

// ■■ Event Types ■■
export type CockpitEventType =
  | 'dial-rotate'         // RadialDial3D drag
  | 'button-press'        // HolographicButton click
  | 'button-release'      // HolographicButton release
  | 'toggle-switch'       // ToggleSwitch3D snap
  | 'page-navigate'       // NavigationButtonGrid page change
  | 'lab-select'          // HolographicLabMap lab click
  | 'lab-hover'           // HolographicLabMap lab hover
  | 'game-enter'          // MechanicalIris open
  | 'game-exit'           // MechanicalIris close
  | 'game-anticipation-start'  // Phase 2 audit fix (Section 5.7): 400ms anticipation pre-iris
  | 'game-anticipation-end'    // Phase 2 audit fix (Section 5.7): anticipation complete, iris opens
  | 'skin-change'         // CockpitSkinManager skin apply
  | 'xp-change'           // XP awarded
  | 'badge-earn'          // Badge earned
  | 'level-up'            // Level up
  | 'streak-update'       // Streak changed
  | 'celebration-start'   // CeremonyFX trigger
  | 'celebration-end';    // CeremonyFX complete

export interface CockpitEvent {
  type: CockpitEventType;
  source: string;          // Component ID that originated the event
  value?: number;          // Numeric value (dial position, XP amount, etc.)
  color?: string;          // Lab color for visual feedback
  label?: string;          // Display label
  targetPage?: string;     // For page-navigate events
  timestamp: number;
}

// ■■ Pulse State — visual feedback that decays over time ■■
export interface CockpitPulse {
  ledRimIntensity: number;      // 0.0–1.0 additional glow
  hudFlashIntensity: number;    // 0.0–1.0 HUD ring flash
  statusBarSweep: number;       // 0.0–1.0 needle sweep amount
  dialSyncValue: number | null; // Synced dial position
  activeColor: string | null;   // Override color during pulse
  decayRate: number;            // How fast the pulse fades (per second)
}

interface CockpitBroadcastState {
  // Event history (last 10 events for any component that needs context)
  events: CockpitEvent[];
  lastEvent: CockpitEvent | null;

  // Current pulse state (decayed per frame by consuming components)
  pulse: CockpitPulse;

  // Actions
  broadcast: (event: Omit<CockpitEvent, 'timestamp'>) => void;
  clearPulse: () => void;
  decayPulse: (deltaSeconds: number) => void;
}

const DEFAULT_PULSE: CockpitPulse = {
  ledRimIntensity: 0,
  hudFlashIntensity: 0,
  statusBarSweep: 0,
  dialSyncValue: null,
  activeColor: null,
  decayRate: 2.0,
};

// ■■ Pulse intensity mapping per event type ■■
function eventToPulse(event: CockpitEvent): Partial<CockpitPulse> {
  switch (event.type) {
    case 'dial-rotate':
      return {
        ledRimIntensity: 0.3,
        statusBarSweep: 0.4,
        dialSyncValue: event.value ?? null,
        activeColor: event.color ?? null,
        decayRate: 4.0,  // Fast decay for continuous rotation
      };
    case 'button-press':
      return {
        ledRimIntensity: 0.6,
        hudFlashIntensity: 0.5,
        statusBarSweep: 0.3,
        activeColor: event.color ?? null,
        decayRate: 2.0,
      };
    case 'page-navigate':
      return {
        ledRimIntensity: 0.8,
        hudFlashIntensity: 0.7,
        statusBarSweep: 0.6,
        activeColor: event.color ?? null,
        decayRate: 1.5,
      };
    case 'lab-select':
      return {
        ledRimIntensity: 0.9,
        hudFlashIntensity: 0.6,
        statusBarSweep: 0.5,
        activeColor: event.color ?? null,
        decayRate: 1.5,
      };
    case 'xp-change':
    case 'badge-earn':
    case 'level-up':
      return {
        ledRimIntensity: 1.0,
        hudFlashIntensity: 1.0,
        statusBarSweep: 1.0,
        activeColor: '#FFD700',  // Gold for achievements
        decayRate: 0.8,
      };
    case 'celebration-start':
      return {
        ledRimIntensity: 1.0,
        hudFlashIntensity: 1.0,
        statusBarSweep: 1.0,
        activeColor: event.color ?? '#FFD700',
        decayRate: 0.5,
      };
    case 'toggle-switch':
    case 'skin-change':
      return {
        ledRimIntensity: 0.5,
        hudFlashIntensity: 0.3,
        activeColor: event.color ?? null,
        decayRate: 2.5,
      };
    case 'game-anticipation-start':
      // Phase 2 audit fix (Section 5.7): anticipation building — gradual ramp
      return {
        ledRimIntensity: 0.4,
        hudFlashIntensity: 0.2,
        statusBarSweep: 0.3,
        activeColor: event.color ?? null,
        decayRate: 0.5, // Slow decay — pulse should sustain through the 400ms window
      };
    case 'game-anticipation-end':
      return {
        ledRimIntensity: 0.7,
        hudFlashIntensity: 0.5,
        statusBarSweep: 0.5,
        activeColor: event.color ?? null,
        decayRate: 1.5,
      };
    default:
      return { ledRimIntensity: 0.2, decayRate: 3.0 };
  }
}

export const useCockpitBroadcast = create<CockpitBroadcastState>((set, get) => ({
  events: [],
  lastEvent: null,
  pulse: { ...DEFAULT_PULSE },

  broadcast: (eventData) => {
    const event: CockpitEvent = {
      ...eventData,
      timestamp: Date.now(),
    };

    const pulseUpdate = eventToPulse(event);

    set((state) => ({
      events: [...state.events.slice(-9), event], // Keep last 10
      lastEvent: event,
      pulse: {
        ...state.pulse,
        ...pulseUpdate,
      },
    }));
  },

  clearPulse: () => set({ pulse: { ...DEFAULT_PULSE } }),

  decayPulse: (deltaSeconds) => {
    const { pulse } = get();
    const decay = pulse.decayRate * deltaSeconds;

    set({
      pulse: {
        ...pulse,
        ledRimIntensity: Math.max(0, pulse.ledRimIntensity - decay),
        hudFlashIntensity: Math.max(0, pulse.hudFlashIntensity - decay),
        statusBarSweep: Math.max(0, pulse.statusBarSweep - decay),
        // dialSyncValue and activeColor clear when all intensities hit 0
        dialSyncValue: pulse.ledRimIntensity - decay <= 0 ? null : pulse.dialSyncValue,
        activeColor: pulse.ledRimIntensity - decay <= 0 ? null : pulse.activeColor,
      },
    });
  },
}));

// ■■ Selector Helpers ■■
export const selectPulse = (s: CockpitBroadcastState) => s.pulse;
export const selectLastEvent = (s: CockpitBroadcastState) => s.lastEvent;
