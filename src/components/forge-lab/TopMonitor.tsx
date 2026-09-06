'use client';

import { useEffect, useState } from 'react';
import { dockSlotStyle, TOP_MONITOR_GLASS } from '@/lib/forge-lab/hotspotMap';
import { FORGE_LAB_WELCOME, xpDialValue, type HubStats } from '@/lib/forge-lab/catalog';
import { isPortalOpen, type PortalPhase } from '@/lib/forge-lab/portalMachine';

export function TopMonitor({
  stats,
  line,
  phase,
}: {
  stats: HubStats;
  line: string;
  phase: PortalPhase;
}) {
  const welcome = !isPortalOpen(phase);
  const xp = xpDialValue(stats.xp, stats.level);
  const streak = Math.min(1, stats.streak / 14);
  const rotating = FORGE_LAB_WELCOME.rotating;
  const [rotatingIdx, setRotatingIdx] = useState(0);

  useEffect(() => {
    if (!welcome || rotating.length < 2) return;
    const id = window.setInterval(() => {
      setRotatingIdx((i) => (i + 1) % rotating.length);
    }, FORGE_LAB_WELCOME.rotateMs);
    return () => window.clearInterval(id);
  }, [welcome, rotating.length]);

  return (
    <section
      className={welcome ? 'fl-monitor is-lit fl-monitor--welcome' : 'fl-monitor is-lit'}
      style={dockSlotStyle(TOP_MONITOR_GLASS)}
      data-yaw={TOP_MONITOR_GLASS.yaw ?? 0}
      data-width={TOP_MONITOR_GLASS.width}
      aria-label={welcome ? FORGE_LAB_WELCOME.title : 'Forge bay status'}
    >
      {welcome ? (
        <>
          <p className="fl-monitor__kicker">SparkForge Labs</p>
          <h2 className="fl-monitor__title">{FORGE_LAB_WELCOME.title}</h2>
          <p className="fl-monitor__subtitle">{FORGE_LAB_WELCOME.subtitle}</p>
          <p className="fl-monitor__line">{rotating[rotatingIdx] ?? rotating[0]}</p>
        </>
      ) : (
        <>
          <p className="fl-monitor__kicker">Forge bay</p>
          <div className="fl-monitor__row">
            <h2 className="fl-monitor__title">{stats.labName}</h2>
            <div className="fl-gauges">
              <div className="fl-gauge">
                <span className="fl-gauge__label">XP · Lv {stats.level}</span>
                <span className="fl-gauge__value">{stats.xp}</span>
                <div
                  className="fl-gauge__track"
                  role="meter"
                  aria-label={`XP ${stats.xp}, level ${stats.level}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(xp * 100)}
                >
                  <span className="fl-gauge__fill" style={{ width: `${xp * 100}%` }} />
                </div>
              </div>
              <div className="fl-gauge fl-gauge--streak">
                <span className="fl-gauge__label">Streak</span>
                <span className="fl-gauge__value">{stats.streak}d</span>
                <div
                  className="fl-gauge__track"
                  role="meter"
                  aria-label={`${stats.streak} day streak`}
                  aria-valuemin={0}
                  aria-valuemax={14}
                  aria-valuenow={stats.streak}
                >
                  <span className="fl-gauge__fill" style={{ width: `${streak * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
          <p className="fl-monitor__line">{line}</p>
        </>
      )}
    </section>
  );
}
