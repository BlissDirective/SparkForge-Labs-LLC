'use client';

/**
 * /dev/forge-hub Sparky behaviour panel — spot picker + force
 * react / cheer / wave. Composes with the mode switcher / Director HUD.
 */

import { SPARKY_SPOT_IDS, isSparkySpot } from '@/config/sparkySpots';
import { dispatchSparkyEvent } from '@/lib/forge-hub/sparkyBehaviour';
import {
  HOLO_BUBBLE_STATES,
  closeHoloBubble,
  isHoloBubbleStateId,
  openHoloBubble,
} from '@/lib/forge-hub/holoBubble';
import type { ForgeSparkySpot } from '@/lib/forge-hub/types';
import { useForgeStore } from '@/stores/sceneStore';

interface SparkyBehaviourPanelProps {
  reducedMotion: boolean;
  poseLock?: boolean;
}

export function SparkyBehaviourPanel({
  reducedMotion,
  poseLock = false,
}: SparkyBehaviourPanelProps) {
  const sparky = useForgeStore((s) => s.forge.sparky);
  const bubble = useForgeStore((s) => s.forge.holoBubble);

  if (poseLock) return null;

  const ctx = { reducedMotion, poseLock: false };

  const pickSpot = (next: string) => {
    if (!isSparkySpot(next)) return;
    dispatchSparkyEvent({ type: 'SET_SPOT', spot: next }, ctx);
  };

  return (
    <div
      data-testid="forge-hub-sparky-panel"
      className="forge-hub-sparky-panel"
    >
      <p className="forge-hub-director-kicker">Sparky · placeholder</p>
      <label className="forge-hub-sparky-label">
        Spot
        <select
          data-testid="forge-hub-sparky-spot"
          className="forge-hub-mode ml-2"
          aria-label="Sparky desk spot"
          value={sparky.spot}
          onChange={(event) => pickSpot(event.target.value)}
        >
          {SPARKY_SPOT_IDS.map((id: ForgeSparkySpot) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          data-testid="forge-hub-sparky-react"
          className="forge-hub-ignite"
          onClick={() =>
            dispatchSparkyEvent({ type: 'TAP' }, ctx)
          }
        >
          React
        </button>
        <button
          type="button"
          data-testid="forge-hub-sparky-cheer"
          className="forge-hub-ignite"
          onClick={() =>
            dispatchSparkyEvent({ type: 'REACT', reaction: 'cheer' }, ctx)
          }
        >
          Cheer
        </button>
        <button
          type="button"
          data-testid="forge-hub-sparky-wave"
          className="forge-hub-ignite"
          onClick={() =>
            dispatchSparkyEvent({ type: 'REACT', reaction: 'wave' }, ctx)
          }
        >
          Wave
        </button>
        <button
          type="button"
          data-testid="forge-hub-sparky-sleep"
          className="forge-hub-ignite"
          aria-pressed={sparky.behaviour === 'sleep'}
          onClick={() =>
            dispatchSparkyEvent(
              {
                type: sparky.behaviour === 'sleep' ? 'WAKE' : 'SLEEP',
              },
              ctx,
            )
          }
        >
          {sparky.behaviour === 'sleep' ? 'Wake' : 'Sleep'}
        </button>
        <button
          type="button"
          data-testid="forge-hub-sparky-whisper"
          className="forge-hub-ignite"
          aria-pressed={sparky.behaviour === 'whisper'}
          onClick={() =>
            dispatchSparkyEvent(
              {
                type:
                  sparky.behaviour === 'whisper' ? 'WHISPER_CLOSE' : 'WHISPER',
              },
              ctx,
            )
          }
        >
          Whisper
        </button>
      </div>
      <p
        data-testid="forge-hub-sparky-status"
        className="forge-hub-sparky-status"
      >
        {sparky.spot} · {sparky.behaviour} · {bubble.state}
      </p>
      <label className="forge-hub-sparky-label">
        HoloBubble
        <select
          data-testid="forge-hub-holobubble-state"
          className="forge-hub-mode ml-2"
          aria-label="HoloBubble state"
          value={bubble.state}
          onChange={(event) => {
            const next = event.target.value;
            if (next === 'whisper') {
              dispatchSparkyEvent({ type: 'WHISPER' }, ctx);
              return;
            }
            if (bubble.state === 'whisper' && next === 'hidden') {
              dispatchSparkyEvent({ type: 'WHISPER_CLOSE' }, ctx);
              return;
            }
            if (next === 'hidden') {
              closeHoloBubble();
              return;
            }
            if (isHoloBubbleStateId(next)) {
              openHoloBubble(next);
            }
          }}
        >
          {HOLO_BUBBLE_STATES.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        data-testid="forge-hub-holobubble-open"
        className="forge-hub-ignite"
        aria-expanded={bubble.state !== 'hidden'}
        aria-controls="forge-hub-holobubble"
        onClick={() => openHoloBubble('tip')}
      >
        Open bubble
      </button>
    </div>
  );
}
