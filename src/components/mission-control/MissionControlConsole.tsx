'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Settings } from 'lucide-react';
import { SparkyCore } from '@/components/sparky/SparkyCore';
import { ForgeDial } from '@/components/forge/ForgeDial';
import { SpaceLabBackdrop } from './SpaceLabBackdrop';
import {
  computePodLayout,
  pickContinueLab,
  xpDialValue,
  type HubStats,
  type LabInstrument,
} from './labInstruments';
import './mission-control.css';

export interface MissionControlConsoleProps {
  stats: HubStats;
  labs: LabInstrument[];
  allowCanvas: boolean;
  reducedMotion: boolean;
  /** Public /dev preview — sample data, no auth. */
  preview?: boolean;
  backHref?: string;
}

export function MissionControlConsole({
  stats,
  labs,
  allowCanvas,
  reducedMotion,
  preview = false,
  backHref = '/home',
}: MissionControlConsoleProps) {
  const [selected, setSelected] = useState<number>(() => pickContinueLab(labs));
  const layout = useMemo(() => computePodLayout(labs.length), [labs.length]);
  const selectedLab = labs.find((l) => l.num === selected) ?? labs[0];
  const continueNum = pickContinueLab(labs);
  const listId = useId();

  const selectLab = useCallback((num: number, focus = false) => {
    setSelected(num);
    if (focus) {
      requestAnimationFrame(() => {
        document.getElementById(`mc-pod-${num}`)?.focus();
      });
    }
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const idx = labs.findIndex((l) => l.num === selected);
      if (idx < 0) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        selectLab(labs[(idx + 1) % labs.length].num, true);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
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
    [labs, selected, selectLab],
  );

  const xpFill = xpDialValue(stats.xp, stats.level);
  const streakFill = Math.min(1, stats.streak / 14);

  return (
    <div className="mc-hub" data-reduced-motion={reducedMotion ? 'true' : 'false'}>
      <SpaceLabBackdrop allowCanvas={allowCanvas} />

      <div className="mc-frame" aria-hidden="true">
        <span className="mc-frame__corner mc-frame__corner--tl" />
        <span className="mc-frame__corner mc-frame__corner--tr" />
        <span className="mc-frame__corner mc-frame__corner--bl" />
        <span className="mc-frame__corner mc-frame__corner--br" />
        <span className="mc-frame__rivet" style={{ top: 18, left: 64 }} />
        <span className="mc-frame__rivet" style={{ top: 18, right: 64 }} />
        <span className="mc-frame__rivet" style={{ bottom: 18, left: 64 }} />
        <span className="mc-frame__rivet" style={{ bottom: 18, right: 64 }} />
        <span className="mc-frame__status" />
        <span className="mc-frame__floor" />
      </div>

      {preview && <div className="mc-preview-banner">Prototype preview</div>}

      <header className="mc-chrome">
        <Link href={backHref} className="mc-icon-btn">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Dashboard</span>
        </Link>

        <div className="mc-chrome__brand">
          <p className="mc-chrome__kicker">AI Literacy for Kids</p>
          <p className="mc-chrome__sub">Learn AI concepts through play</p>
        </div>

        <div className="mc-gauges" aria-label="Mission readouts">
          <div className="mc-gauge">
            <ForgeDial
              value={xpFill}
              size={56}
              thickness={5}
              color="#4DE9FF"
              label={`XP ${stats.xp}, level ${stats.level}`}
            >
              <span className="mc-gauge__value" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.xp}
              </span>
            </ForgeDial>
            <span className="mc-gauge__label">XP · Lv {stats.level}</span>
          </div>
          <div className="mc-gauge">
            <ForgeDial
              value={streakFill}
              size={56}
              thickness={5}
              color="#FFB020"
              label={`${stats.streak} day streak`}
            >
              <span className="mc-gauge__value" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.streak}
              </span>
            </ForgeDial>
            <span className="mc-gauge__label">Streak</span>
          </div>
          <Link
            href="/settings"
            className="mc-icon-btn"
            aria-label="Open settings (calm flat UI)"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="mc-stage">
        <svg className="mc-traces" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {layout.map((pt, i) => {
            const lab = labs[i];
            const active = lab?.num === selected;
            return (
              <g key={lab?.num ?? i}>
                <line
                  className={active ? 'mc-trace is-active' : 'mc-trace'}
                  x1="50"
                  y1="48"
                  x2={pt.left}
                  y2={pt.top}
                />
                <circle className="mc-trace-node" cx={pt.left} cy={pt.top} r="0.7" />
              </g>
            );
          })}
        </svg>

        <div className="mc-core">
          <div className="mc-core__beam" aria-hidden="true" />
          <div className="mc-core__rings" aria-hidden="true">
            <span className="mc-core__ring mc-core__ring--1" />
            <span className="mc-core__ring mc-core__ring--2" />
            <span className="mc-core__ring mc-core__ring--3" />
            <div className="mc-core__mascot">
              <SparkyCore
                expression="idle"
                size="lg"
                isAnimated={!reducedMotion}
                showAura={!reducedMotion}
              />
            </div>
          </div>
          <div className="mc-platform" aria-hidden="true" />
          <div className="mc-pedestal" aria-hidden="true" />
          <div className="mc-greeting">
            <h1>Welcome aboard, {stats.childName}</h1>
            <p>Pick a lab pod to spin up the instrument bay.</p>
          </div>
        </div>

        <div
          id={listId}
          className="mc-pod-list"
          role="listbox"
          aria-label="Learning labs"
          aria-activedescendant={`mc-pod-${selected}`}
          onKeyDown={onKeyDown}
        >
          {labs.map((lab, i) => {
            const pt = layout[i];
            return (
              <PodButton
                key={lab.num}
                lab={lab}
                selected={lab.num === selected}
                style={{
                  left: `${pt.left}%`,
                  top: `${pt.top}%`,
                  zIndex: lab.num === selected ? 4 : Math.round(pt.depth * 3),
                }}
                onSelect={selectLab}
              />
            );
          })}
        </div>
      </div>

      <div className="mc-dock">
        <Link
          href={`/labs/${continueNum}`}
          className="mc-cta"
          aria-label={`Join the adventure — continue Lab ${continueNum}`}
        >
          Join the Adventure
        </Link>

        <section
          className="mc-bay"
          data-slot="lab-content"
          aria-label="Lab content bay. GameShell mounts here in a later phase."
        >
          {selectedLab ? (
            <div className="mc-bay__row">
              <div>
                <h2>
                  Lab {selectedLab.num} · {selectedLab.name}
                </h2>
                <p>{selectedLab.poetic}</p>
                <p className="mc-bay__slot-note">
                  GameShell slot · {selectedLab.gamesCount} games ·{' '}
                  {Math.round(selectedLab.progress)}% complete — games stay on /arcade; this
                  bay is the future mount point
                </p>
              </div>
              <Link href={`/labs/${selectedLab.num}`} className="mc-bay__enter">
                Enter Lab
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <p>Select a lab pod to open the content bay.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function PodButton({
  lab,
  selected,
  onSelect,
  style,
}: {
  lab: LabInstrument;
  selected: boolean;
  onSelect: (num: number, focus?: boolean) => void;
  style?: React.CSSProperties;
}) {
  const Icon = lab.Icon;
  return (
    <button
      type="button"
      id={`mc-pod-${lab.num}`}
      role="option"
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      aria-label={`Lab ${lab.num}: ${lab.name}. ${Math.round(lab.progress)} percent complete, ${lab.gamesCount} games. ${lab.poetic}`}
      className="mc-pod"
      style={{
        ...style,
        ['--pod-color' as string]: lab.color,
      }}
      onClick={() => onSelect(lab.num)}
    >
      <div className="mc-pod__top">
        <span className={`mc-crystal mc-crystal--${lab.crystal}`} aria-hidden="true" />
        <Icon className="h-4 w-4" color={lab.color} aria-hidden="true" />
        <span className="mc-pod__meta">Lab {lab.num}</span>
      </div>
      <p className="mc-pod__name">{lab.name}</p>
      <div className="mc-pod__bar" aria-hidden="true">
        <span style={{ width: `${Math.min(100, Math.max(0, lab.progress))}%` }} />
      </div>
    </button>
  );
}
