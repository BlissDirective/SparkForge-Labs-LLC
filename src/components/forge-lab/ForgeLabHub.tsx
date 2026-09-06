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
  beamSlotsForState,
  isForgeLayoutId,
  LAYOUT_MORPH_MS,
  liveBeams,
  resolvedSlots,
  type ForgeLayoutId,
} from '@/lib/forge-lab/layouts';
import {
  isPortalOpen,
  nextHoldMs,
  reducePortal,
  type PortalPhase,
} from '@/lib/forge-lab/portalMachine';
import { WorldPlate } from './WorldPlate';
import { HotspotMap } from './HotspotMap';
import { ForgeCore } from './ForgeCore';
import { TopMonitor } from './TopMonitor';
import { HoloPanel } from './HoloPanel';
import { EmitterBeams } from './EmitterBeams';
import { GameBayStub } from './stubs/GameBayStub';
import { AvatarCreatorStub } from './stubs/AvatarCreatorStub';
import { AuthMergedStub } from './stubs/AuthMergedStub';
import './forge-lab.css';

export interface ForgeLabHubProps {
  stats: HubStats;
  progress?: ReadonlyArray<LabProgressRow> | null;
  preview?: boolean;
  backHref?: string;
  calibrate?: boolean;
  layout?: ForgeLayoutId;
}

export function ForgeLabHub({
  stats,
  progress,
  preview = false,
  backHref = '/home',
  calibrate = false,
  layout: layoutProp = 'hubSplit',
}: ForgeLabHubProps) {
  const reduceMotion = useSafeMotion();
  const labs = useMemo(() => buildLabRows(progress), [progress]);
  const [phase, setPhase] = useState<PortalPhase>('idle');
  const [selected, setSelected] = useState<number>(() => pickContinueLab(labs));
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [layoutId, setLayoutId] = useState<ForgeLayoutId>(
    isForgeLayoutId(layoutProp) ? layoutProp : 'hubSplit',
  );
  const [morphT, setMorphT] = useState(layoutProp === 'authMerged' ? 1 : 0);
  const morphFromRef = useRef(layoutProp === 'authMerged' ? 1 : 0);
  const timerRef = useRef<number | null>(null);
  const listId = useId();

  const selectedLab: LabRow = labs.find((l) => l.num === selected) ?? labs[0];
  const hudStats: HubStats = {
    ...stats,
    labName: selectedLab?.name ?? stats.labName,
  };
  const line = sparkyLine(selected + (isPortalOpen(phase) ? 2 : 0));
  const slots = resolvedSlots(morphT);
  const wingsLive = slots.merged || isPortalOpen(phase) || morphT > 0.02;
  const beams = liveBeams(beamSlotsForState(morphT, wingsLive));

  const clearHold = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const apply = useCallback((next: PortalPhase) => {
    setPhase(next);
  }, []);

  useEffect(() => {
    clearHold();
    const hold = nextHoldMs(phase);
    if (hold != null && !reduceMotion) {
      timerRef.current = window.setTimeout(() => {
        setPhase((current) => reducePortal(current, { type: 'ADVANCE' }));
      }, hold);
    }
    return clearHold;
  }, [phase, reduceMotion]);

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

  useEffect(() => {
    const target = layoutId === 'authMerged' ? 1 : 0;
    if (reduceMotion) {
      morphFromRef.current = target;
      setMorphT(target);
      return;
    }
    const from = morphFromRef.current;
    if (from === target) return;
    const started = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const u = Math.min(1, (now - started) / LAYOUT_MORPH_MS);
      const next = from + (target - from) * u;
      morphFromRef.current = next;
      setMorphT(next);
      if (u < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [layoutId, reduceMotion]);

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
      data-plate-clear="true"
      data-reduced-motion={reduceMotion ? 'true' : 'false'}
      data-phase={phase}
      data-layout={slots.merged ? 'authMerged' : 'hubSplit'}
      data-morphing={morphT > 0.02 && !slots.merged ? 'true' : 'false'}
    >
      <div className="fl-stage">
        <WorldPlate phase={phase} />
        <HotspotMap calibrate={calibrate} onActivate={onHotspot} />
        <div className="fl-z2">
          <ForgeCore phase={phase} />
          <EmitterBeams beams={beams} />
          <TopMonitor stats={hudStats} line={line} phase={phase} />
          <HoloPanel
            slot={slots.left}
            side="left"
            title="Labs"
            open={!slots.merged && wingsLive}
          >
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
          <HoloPanel
            slot={slots.right}
            side="right"
            title="Bay"
            open={!slots.merged && wingsLive}
          >
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
          <HoloPanel
            slot={slots.center}
            side="center"
            title="Sign on"
            open={slots.merged}
          >
            <AuthMergedStub />
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
        {preview ? (
          <button
            type="button"
            className="fl-icon-btn"
            data-layout-toggle=""
            onClick={() =>
              setLayoutId((current) => (current === 'authMerged' ? 'hubSplit' : 'authMerged'))
            }
          >
            {slots.merged ? 'Hub split' : 'Auth merge'}
          </button>
        ) : null}
      </div>
      {preview ? <div className="fl-preview">Forge Lab preview</div> : null}
      <div className="fl-sr-live" role="status" aria-live="polite">
        {live}
      </div>
    </div>
  );
}
