'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserRound, X } from 'lucide-react';
import { useSafeMotion } from '@/hooks/useSafeMotion';
import {
  buildLabRows,
  pickContinueLab,
  sparkyLine,
  type HubStats,
  type LabProgressRow,
  type LabRow,
} from '@/lib/forge-lab/catalog';
import type { HotspotId } from '@/lib/forge-lab/hotspotMap';
import {
  isHudLit,
  nextHoldMs,
  reducePortal,
  type PortalPhase,
} from '@/lib/forge-lab/portalMachine';
import { WorldPlate } from './WorldPlate';
import { HotspotMap } from './HotspotMap';
import { ForgeCore } from './ForgeCore';
import { TopMonitor } from './TopMonitor';
import { HoloPanel } from './HoloPanel';
import { GameBayStub } from './stubs/GameBayStub';
import { AvatarCreatorStub } from './stubs/AvatarCreatorStub';
import './forge-lab.css';

export interface ForgeLabHubProps {
  stats: HubStats;
  progress?: ReadonlyArray<LabProgressRow> | null;
  preview?: boolean;
  backHref?: string;
  calibrate?: boolean;
}

export function ForgeLabHub({
  stats,
  progress,
  preview = false,
  backHref = '/home',
  calibrate = false,
}: ForgeLabHubProps) {
  const reduceMotion = useSafeMotion();
  const labs = useMemo(() => buildLabRows(progress), [progress]);
  const [phase, setPhase] = useState<PortalPhase>('idle');
  const [selected, setSelected] = useState<number>(() => pickContinueLab(labs));
  const [avatarOpen, setAvatarOpen] = useState(false);
  const timerRef = useRef<number | null>(null);
  const listId = useId();

  const selectedLab: LabRow = labs.find((l) => l.num === selected) ?? labs[0];
  const hudStats: HubStats = {
    ...stats,
    labName: selectedLab?.name ?? stats.labName,
  };
  const line = sparkyLine(selected + (isHudLit(phase) ? 2 : 0));

  const clearHold = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const apply = useCallback(
    (next: PortalPhase) => {
      setPhase(next);
      clearHold();
      const hold = nextHoldMs(next);
      if (hold != null && !reduceMotion) {
        timerRef.current = window.setTimeout(() => {
          setPhase((current) => reducePortal(current, { type: 'ADVANCE' }));
        }, hold);
      }
    },
    [reduceMotion],
  );

  const ignite = useCallback(() => {
    if (reduceMotion) {
      apply('docked');
      return;
    }
    apply(reducePortal(phase === 'docked' ? 'idle' : phase, { type: 'IGNITE' }));
  }, [apply, phase, reduceMotion]);

  const retract = useCallback(() => {
    setAvatarOpen(false);
    apply('idle');
  }, [apply]);

  const onHotspot = useCallback(
    (id: HotspotId) => {
      if (id === 'forge-core' || id === 'pedestal') {
        if (phase === 'docked') retract();
        else ignite();
        return;
      }
      if (id === 'top-monitor' && phase === 'idle') ignite();
      if ((id === 'left-slot' || id === 'right-slot') && phase === 'idle') ignite();
    },
    [ignite, phase, retract],
  );

  useEffect(() => () => clearHold(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (avatarOpen) {
          setAvatarOpen(false);
          return;
        }
        if (phase !== 'idle') retract();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [avatarOpen, phase, retract]);

  const selectLab = useCallback((num: number, focus = false) => {
    setSelected(num);
    if (focus) {
      requestAnimationFrame(() => {
        document.getElementById(`fl-lab-${num}`)?.focus();
      });
    }
  }, []);

  const onLabKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const idx = labs.findIndex((l) => l.num === selected);
      if (idx < 0) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        selectLab(labs[(idx + 1) % labs.length].num, true);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        selectLab(labs[(idx - 1 + labs.length) % labs.length].num, true);
      } else if (e.key === 'Home') {
        e.preventDefault();
        selectLab(labs[0].num, true);
      } else if (e.key === 'End') {
        e.preventDefault();
        selectLab(labs[labs.length - 1].num, true);
      }
    },
    [labs, selectLab, selected],
  );

  const live =
    phase === 'idle'
      ? 'Forge core idle. Activate the SparkForge hologram to emit panels.'
      : phase === 'charge'
        ? 'Core charging.'
        : phase === 'emit'
          ? 'Hologram panels emitting from the core.'
          : 'Panels docked. Lab list and game bay are open.';

  return (
    <div
      className="fl-hub"
      data-surface="dark"
      data-reduced-motion={reduceMotion ? 'true' : 'false'}
      data-phase={phase}
    >
      <div className="fl-stage">
        <WorldPlate phase={phase} />
        <HotspotMap calibrate={calibrate} onActivate={onHotspot} />
        <div className="fl-z2">
          <ForgeCore phase={phase} />
          <TopMonitor stats={hudStats} line={line} phase={phase} />
          <HoloPanel side="left" phase={phase} title="Labs">
            <div
              id={listId}
              className="fl-lab-list fl-panel__scroll"
              role="listbox"
              aria-label="Learning labs"
              aria-activedescendant={`fl-lab-${selected}`}
              tabIndex={0}
              onKeyDown={onLabKeyDown}
            >
              {labs.map((lab) => {
                const Icon = lab.Icon;
                return (
                  <button
                    key={lab.num}
                    type="button"
                    id={`fl-lab-${lab.num}`}
                    role="option"
                    aria-selected={lab.num === selected}
                    className="fl-lab"
                    style={{ ['--lab-color' as string]: lab.color }}
                    aria-label={`Lab ${lab.num}: ${lab.name}. ${Math.round(lab.progress)} percent complete, ${lab.gamesCount} games. ${lab.poetic}`}
                    onClick={() => selectLab(lab.num)}
                  >
                    <Icon size={14} color={lab.color} aria-hidden="true" />
                    <span className="fl-lab__name">{lab.name}</span>
                    <span className="fl-lab__meta">{Math.round(lab.progress)}%</span>
                  </button>
                );
              })}
            </div>
          </HoloPanel>
          <HoloPanel side="right" phase={phase} title="Bay">
            <div className="fl-panel__scroll">
              <GameBayStub lab={selectedLab} />
            </div>
            <div className="fl-tools">
              <button
                type="button"
                className="fl-chip"
                onClick={() => setAvatarOpen(true)}
              >
                <UserRound size={14} aria-hidden="true" />
                Avatar kit
              </button>
              <button type="button" className="fl-chip" onClick={retract}>
                <X size={14} aria-hidden="true" />
                Retract
              </button>
            </div>
          </HoloPanel>
          {avatarOpen ? (
            <AvatarCreatorStub onClose={() => setAvatarOpen(false)} />
          ) : null}
        </div>
      </div>

      <div className="fl-chrome">
        <Link href={backHref} className="fl-icon-btn">
          <ArrowLeft size={14} aria-hidden="true" />
          Back
        </Link>
      </div>
      {preview ? <div className="fl-preview">Forge Lab preview</div> : null}
      <div className="fl-sr-live" role="status" aria-live="polite">
        {live}
      </div>
    </div>
  );
}
