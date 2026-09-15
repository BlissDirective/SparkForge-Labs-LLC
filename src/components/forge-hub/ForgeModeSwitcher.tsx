'use client';

/**
 * /dev/forge-hub layout switcher — live `applyForgeRoute` on the
 * existing sceneStore forge slice. Director HUD / the transition
 * scrubber own MOTION_BIBLE playback so a hop does not get overwritten
 * by timeline t=0 `setForgeMode` (e.g. login-success-hubsplit).
 */

import { FORGE_LAYOUT_MODES, isForgeMode } from '@/lib/forge-hub/layouts';
import { forgeRouteForDevMode } from '@/lib/forge-hub/devHud';
import type { ForgeMode } from '@/lib/forge-hub/types';
import { useForgeStore } from '@/stores/sceneStore';

interface ForgeModeSwitcherProps {
  reducedMotion: boolean;
  disabled?: boolean;
}

export function ForgeModeSwitcher({
  reducedMotion,
  disabled = false,
}: ForgeModeSwitcherProps) {
  const mode = useForgeStore((s) => s.forge.mode);
  const applyForgeRoute = useForgeStore((s) => s.applyForgeRoute);

  const pickMode = (next: string) => {
    if (!isForgeMode(next) || next === mode) return;
    applyForgeRoute(forgeRouteForDevMode(next, reducedMotion));
  };

  return (
    <label className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-cyan-100/80">
      Layout
      <select
        data-testid="forge-hub-mode-switch"
        className="forge-hub-mode ml-2"
        aria-label="Forge hub layout mode"
        value={mode}
        disabled={disabled}
        onChange={(event) => pickMode(event.target.value)}
      >
        {FORGE_LAYOUT_MODES.map((id: ForgeMode) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
    </label>
  );
}
