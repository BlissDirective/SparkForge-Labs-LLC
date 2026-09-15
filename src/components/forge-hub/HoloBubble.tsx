'use client';

/**
 * HoloBubble DOM stub — TAP v2.2 §2.8b.
 * Reading-plate fill, follows `socket.holoBubble` (procedural dome)
 * with a short spring, clamps in the viewport, sits above HoloL/C/R.
 * No final art. Tutor engine is not wired (stub copy only).
 */

import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { sparkyHoloAnchor } from '@/config/sparkySpots';
import {
  HOLO_BLEND_CSS_VARS,
} from '@/lib/forge-hub/holoBlend';
import {
  HOLO_BUBBLE_DOME_GAP_PX,
  bubbleBoxForState,
  clampBoxToViewport,
  cycleHoloBubbleOpen,
  followSpring,
  isHoloBubbleOpen,
  isPlayLimitedMode,
} from '@/lib/forge-hub/holoBubble';
import {
  getHoloBubbleScreen,
  getHoloBubbleWorld,
} from '@/lib/forge-hub/holoBubbleAnchor';
import { projectWorldVisible } from '@/lib/forge-hub/projectWorldPoint';
import { useDirectorClock } from '@/lib/forge-hub/useForgeDirector';
import { useForgeReducedMotion } from '@/lib/forge-hub/useForgeReducedMotion';
import { useForgeStore } from '@/stores/sceneStore';

const SPRING_LAMBDA = 14;

function stubCopy(
  state: 'ping' | 'tip' | 'chat' | 'whisper',
  tip: string | null,
  playLimited: boolean,
): { title: string; body: string; note: string | null } {
  const line = tip ?? 'Hi — placeholder Sparky on the desk.';
  if (state === 'ping') {
    return {
      title: 'Ping',
      body: 'Sparky has something to say.',
      note: null,
    };
  }
  if (state === 'tip') {
    return {
      title: 'Sparky',
      body: line,
      note: playLimited
        ? 'PlayStage: ping/tip only (chat stays off during a game).'
        : null,
    };
  }
  if (state === 'whisper') {
    return {
      title: 'Whisper',
      body: line,
      note: 'Director owns whisper-expand motion. This slab is the Stagehand hook.',
    };
  }
  return {
    title: 'Sparky',
    body: line,
    note: 'Tutor engine (AITutorContext) is not wired in this stub.',
  };
}

export function HoloBubble() {
  const poseLock = useForgeStore((s) => s.forge.poseLock);
  const flatOverlay = useForgeStore((s) => s.forge.flatOverlay);
  const mode = useForgeStore((s) => s.forge.mode);
  const spot = useForgeStore((s) => s.forge.sparky.spot);
  const bubble = useForgeStore((s) => s.forge.holoBubble);
  const reducedMotion = useForgeReducedMotion();
  const clock = useDirectorClock();
  const hostRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const posRef = useRef({ left: 0, top: 0, ready: false });
  const setPanelRef = (node: HTMLElement | null) => {
    panelRef.current = node;
  };

  const hidden =
    poseLock || flatOverlay || mode === 'flat' || !isHoloBubbleOpen(bubble.state);
  const playLimited = isPlayLimitedMode(mode);
  const box = bubbleBoxForState(
    hidden ? 'hidden' : bubble.state,
    clock.bubbleScale,
  );

  useLayoutEffect(() => {
    if (hidden) {
      posRef.current.ready = false;
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const host = hostRef.current;
      const panel = panelRef.current;
      if (!host || !panel) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const vw = host.clientWidth || window.innerWidth;
      const vh = host.clientHeight || window.innerHeight;
      const live = getHoloBubbleScreen();
      const world =
        getHoloBubbleWorld() ??
        bubble.anchor ??
        sparkyHoloAnchor(spot);
      let ax: number;
      let ay: number;
      if (live?.visible) {
        ax = live.x;
        ay = live.y;
      } else {
        const projected = projectWorldVisible(world, vw, vh);
        ax = projected.point.x;
        ay = projected.point.y;
      }
      const targetLeft = ax - box.width / 2;
      const targetTop = ay - box.height - HOLO_BUBBLE_DOME_GAP_PX;
      const clamped = clampBoxToViewport(
        targetLeft,
        targetTop,
        box.width,
        box.height,
        vw,
        vh,
      );
      const snap = reducedMotion || !posRef.current.ready;
      const left = followSpring(
        posRef.current.left,
        clamped.left,
        dt,
        SPRING_LAMBDA,
        snap,
      );
      const top = followSpring(
        posRef.current.top,
        clamped.top,
        dt,
        SPRING_LAMBDA,
        snap,
      );
      posRef.current = { left, top, ready: true };
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.width = `${box.width}px`;
      panel.style.height = `${box.height}px`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [
    box.height,
    box.width,
    bubble.anchor,
    bubble.state,
    hidden,
    reducedMotion,
    spot,
  ]);

  if (hidden) return null;

  const copy = stubCopy(
    bubble.state === 'hidden' ? 'tip' : bubble.state,
    bubble.tip,
    playLimited,
  );
  const isPing = bubble.state === 'ping';
  const interactive = bubble.state === 'chat' || bubble.state === 'whisper';

  return (
    <div
      ref={hostRef}
      className="fh-holobubble-host"
      data-testid="forge-hub-holobubble-host"
      data-forge-holobubble-host="1"
    >
      {isPing ? (
        <button
          ref={setPanelRef}
          type="button"
          className="fh-holobubble fh-holobubble--ping"
          data-testid="forge-hub-holobubble"
          data-forge-holobubble="ping"
          data-forge-holobubble-size="ping"
          id="forge-hub-holobubble"
          aria-label="Open Sparky hologram"
          style={{ ...(HOLO_BLEND_CSS_VARS as CSSProperties) }}
          onClick={() => cycleHoloBubbleOpen()}
        >
          <span aria-hidden="true">✦</span>
        </button>
      ) : (
        <section
          ref={setPanelRef}
          role={interactive ? 'dialog' : 'status'}
          aria-label={copy.title}
          aria-modal={interactive || undefined}
          tabIndex={interactive ? -1 : undefined}
          data-testid="forge-hub-holobubble"
          data-forge-holobubble={bubble.state}
          data-forge-holobubble-size={bubble.state}
          data-forge-holobubble-play={playLimited ? 'ping-tip' : 'all'}
          id="forge-hub-holobubble"
          className={`fh-holobubble fh-holobubble--${bubble.state}`}
          style={{ ...(HOLO_BLEND_CSS_VARS as CSSProperties) }}
          onClick={
            bubble.state === 'tip' ? () => cycleHoloBubbleOpen() : undefined
          }
        >
          <div className="fh-holobubble__beam" aria-hidden="true" />
          <div className="fh-holobubble__edge">
            <div className="fh-holobubble__plate">
              <header className="fh-holobubble__head">
                <h2>{copy.title}</h2>
              </header>
              <div className="fh-holobubble__scroll">
                <p>{copy.body}</p>
                {copy.note ? (
                  <p className="fh-holobubble__note">{copy.note}</p>
                ) : null}
                {bubble.state === 'chat' ? (
                  <label className="fh-holobubble__input-label">
                    Message
                    <input
                      type="text"
                      data-testid="forge-hub-holobubble-input"
                      className="fh-holobubble__input"
                      placeholder="Tutor engine later…"
                      disabled
                      aria-disabled="true"
                    />
                  </label>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default HoloBubble;
