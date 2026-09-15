'use client';

// Three HoloPanels for the live layout. Static % rects on the poster
// path; viewport-pixel projection once the canvas is ready.

import type { ForgeMode } from '@/lib/forge-hub/types';
import type { GlassSlotId } from '@/lib/forge-hub/glassSlots';
import { liveDirectorSlots } from '@/lib/forge-hub/director/targets';
import { useDirectorClock } from '@/lib/forge-hub/useForgeDirector';
import { useForgeStore } from '@/stores/sceneStore';
import { HoloPanel } from './HoloPanel';

type PanelCopy = { title: string; body: string };

const DEFAULT_COPY: Record<GlassSlotId, PanelCopy> = {
  holoL: { title: 'HoloL', body: 'Left hologram.' },
  holoC: { title: 'HoloC', body: 'Center hologram.' },
  holoR: { title: 'HoloR', body: 'Right hologram.' },
};

const MODE_COPY: Partial<Record<ForgeMode, Record<GlassSlotId, PanelCopy>>> = {
  welcome: {
    holoL: {
      title: 'SparkForge',
      body: '11 labs. 42 games. Learn AI by playing.',
    },
    holoC: {
      title: 'Welcome to SparkForge',
      body: 'Login lands on this reading plate. Glazier will mount the real form here.',
    },
    holoR: {
      title: 'Meet Sparky',
      body: 'Demo login and coach tips will sit on this side.',
    },
  },
  hubSplit: {
    holoL: { title: 'Stats', body: 'Streak, XP, and pets land here on /home.' },
    holoC: {
      title: "Today's mission",
      body: 'Daily mission and continue play on HoloC.',
    },
    holoR: { title: 'Feed', body: 'Activity and quests land here.' },
  },
  labsBrowse: {
    holoL: { title: 'Labs', body: 'Lab list.' },
    holoC: { title: 'Lab bench', body: 'Selected lab hero.' },
    holoR: { title: 'Progress', body: 'Detail and mastery.' },
  },
  gameLobby: {
    holoL: { title: 'Arcade', body: 'Game list.' },
    holoC: { title: 'Preview', body: 'Selected game.' },
    holoR: { title: 'Badge', body: 'Progress and friends.' },
  },
  playStage: {
    holoL: { title: 'HoloL', body: '' },
    holoC: {
      title: 'PlayStage',
      body: 'Merged glass. Games play here (yaw 0). Nothing in src/components/games changes.',
    },
    holoR: { title: 'HoloR', body: '' },
  },
  focus: {
    holoL: { title: 'Tools', body: 'Side tool.' },
    holoC: { title: 'Focus', body: 'Deep-dive reading plate.' },
    holoR: { title: 'Tools', body: 'Side tool.' },
  },
  dual: {
    holoL: { title: 'Compare', body: 'Left mid panel.' },
    holoC: { title: 'Strip', body: 'Center strip.' },
    holoR: { title: 'Compare', body: 'Right mid panel.' },
  },
};

interface HoloPanelLayerProps {
  /** `stage` = percent of the 1536×1024 poster box; `viewport` = canvas px. */
  layout?: 'stage' | 'viewport';
  calibrate?: boolean;
}

export function HoloPanelLayer({
  layout = 'viewport',
  calibrate = false,
}: HoloPanelLayerProps) {
  const mode = useForgeStore((s) => s.forge.mode);
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  useDirectorClock();
  if (poseLock) return null;

  const copy = MODE_COPY[mode] ?? DEFAULT_COPY;
  const slots = liveDirectorSlots(mode, false);
  const stageClass =
    layout === 'stage'
      ? 'forge-hub-glass-stage fh-holo-layer'
      : 'fh-holo-layer fh-holo-layer--viewport';

  return (
    <div
      className={stageClass}
      data-testid="forge-hub-holo-layer"
      data-forge-calibrate={calibrate ? '1' : '0'}
      data-forge-holo-layout={layout}
    >
      {slots.map((slot) => {
        const text = copy[slot.id];
        return (
          <HoloPanel key={slot.id} slotId={slot.id} title={text.title}>
            <p>{text.body}</p>
          </HoloPanel>
        );
      })}
    </div>
  );
}
