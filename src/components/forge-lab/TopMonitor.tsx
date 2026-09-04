'use client';

import { rectStyle, TOP_MONITOR_GLASS } from '@/lib/forge-lab/hotspotMap';
import { xpDialValue, type HubStats } from '@/lib/forge-lab/catalog';
import { isHudLit, type PortalPhase } from '@/lib/forge-lab/portalMachine';

export function TopMonitor({
  stats,
  line,
  phase,
}: {
  stats: HubStats;
  line: string;
  phase: PortalPhase;
}) {
  const lit = isHudLit(phase);
  const xp = xpDialValue(stats.xp, stats.level);
  const streak = Math.min(1, stats.streak / 14);

  return (
    <section
      className={lit ? 'fl-monitor is-lit' : 'fl-monitor'}
      style={rectStyle(TOP_MONITOR_GLASS)}
      aria-label="Forge bay status"
      aria-hidden={!lit}
    >
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
    </section>
  );
}
