// ════════════════════════════════════════════════════════════════
// eventBridge — Phase 5 task #1 (§10.11) Ultra sub-module
// Synthetic DOM event bridge: main thread → worker
// ════════════════════════════════════════════════════════════════
// Problem: pointer/keyboard/wheel events fire on the DOM canvas on
// the main thread. R3F's raycaster needs them inside the worker.
//
// Solution: attach listeners to the proxy canvas on the main thread,
// serialize the minimum event shape, and postMessage to the worker.
// The worker's `createWorkerEventRouter()` reconstructs a synthetic
// event object that mirrors the subset of EventInterface R3F uses.
//
// Latency note: postMessage round-trip is ~0.1-0.3ms on modern
// browsers, well inside a 16ms frame budget. For hover latency we
// additionally throttle pointermove to 4ms (250Hz) to avoid flooding
// the worker queue during rapid drag.
//
// Transfer strategy: pointer coordinates go through the SAB
// (sabStoreMirror slots POINTER_X/Y/BUTTONS) so the worker can poll
// them every rAF without depending on message pump ordering. Discrete
// click/keydown events still go through postMessage because they have
// no natural rAF cadence.
// ════════════════════════════════════════════════════════════════

export type BridgedEvent =
  | {
      kind: 'pointerdown' | 'pointerup' | 'pointercancel' | 'click' | 'dblclick';
      x: number; // clientX
      y: number; // clientY
      nx: number; // normalized 0..1
      ny: number; // normalized 0..1
      button: number;
      buttons: number;
      t: number; // performance.now()
      pointerId?: number;
      pointerType?: string;
    }
  | {
      kind: 'wheel';
      dx: number;
      dy: number;
      dz: number;
      mode: 0 | 1 | 2; // DOM_DELTA_PIXEL | LINE | PAGE
      t: number;
    }
  | {
      kind: 'keydown' | 'keyup';
      code: string;
      key: string;
      shift: boolean;
      ctrl: boolean;
      alt: boolean;
      meta: boolean;
      repeat: boolean;
      t: number;
    }
  | {
      kind: 'resize';
      w: number;
      h: number;
      dpr: number;
      t: number;
    }
  | {
      kind: 'blur' | 'focus' | 'contextmenu';
      t: number;
    };

export interface BridgeOptions {
  /** Throttle pointermove to at most one event per Nms (default 4 = 250Hz). */
  pointerMoveThrottleMs?: number;
  /** Called with the serialized event, normally forwards to worker.postMessage. */
  onEvent: (evt: BridgedEvent) => void;
  /**
   * Optional SAB writer — if provided, pointer coords are written to
   * the SAB in real time (no postMessage). Discrete events still call
   * onEvent.
   */
  writePointer?: (nx: number, ny: number, buttons: number) => void;
}

export interface EventBridge {
  detach(): void;
}

/**
 * Attach listeners to a DOM element (the proxy canvas, post-
 * `transferControlToOffscreen()`). Returns a detach function.
 *
 * The element should keep its OffscreenCanvas in use on the worker,
 * not mounted as a visible canvas (trying to read a 2D/WebGL2 context
 * on this side would throw).
 */
export function attachEventBridge(
  el: HTMLElement,
  opts: BridgeOptions,
): EventBridge {
  const { onEvent, writePointer } = opts;
  const throttleMs = opts.pointerMoveThrottleMs ?? 4;
  let lastMoveT = 0;

  const now = (): number =>
    typeof performance !== 'undefined' && 'now' in performance
      ? performance.now()
      : Date.now();

  const rectNormalize = (clientX: number, clientY: number): [number, number, number, number] => {
    const rect = el.getBoundingClientRect();
    const nx = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    const ny = rect.height > 0 ? (clientY - rect.top) / rect.height : 0;
    return [clientX, clientY, nx, ny];
  };

  const onPointer = (e: PointerEvent, kind: 'pointerdown' | 'pointerup' | 'pointercancel') => {
    const [x, y, nx, ny] = rectNormalize(e.clientX, e.clientY);
    if (writePointer) writePointer(nx, ny, e.buttons);
    onEvent({
      kind,
      x,
      y,
      nx,
      ny,
      button: e.button,
      buttons: e.buttons,
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      t: now(),
    });
  };

  const onPointerMove = (e: PointerEvent) => {
    const [, , nx, ny] = rectNormalize(e.clientX, e.clientY);
    if (writePointer) writePointer(nx, ny, e.buttons);
    const t = now();
    if (t - lastMoveT < throttleMs) return;
    lastMoveT = t;
    // Pointer moves no longer need to postMessage at all when the SAB
    // writer is present — the worker polls every rAF tick. Only emit
    // to onEvent when the SAB path isn't wired.
    if (!writePointer) {
      onEvent({
        kind: 'pointerdown',
        x: e.clientX,
        y: e.clientY,
        nx,
        ny,
        button: e.button,
        buttons: e.buttons,
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        t,
      });
    }
  };

  const onClick = (e: MouseEvent, kind: 'click' | 'dblclick') => {
    const [x, y, nx, ny] = rectNormalize(e.clientX, e.clientY);
    onEvent({
      kind,
      x,
      y,
      nx,
      ny,
      button: e.button,
      buttons: e.buttons,
      t: now(),
    });
  };

  const onWheel = (e: WheelEvent) => {
    onEvent({
      kind: 'wheel',
      dx: e.deltaX,
      dy: e.deltaY,
      dz: e.deltaZ,
      mode: e.deltaMode as 0 | 1 | 2,
      t: now(),
    });
  };

  const onKey = (e: KeyboardEvent, kind: 'keydown' | 'keyup') => {
    onEvent({
      kind,
      code: e.code,
      key: e.key,
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
      repeat: e.repeat,
      t: now(),
    });
  };

  const onResize = () => {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rect = el.getBoundingClientRect();
    onEvent({ kind: 'resize', w: rect.width, h: rect.height, dpr, t: now() });
  };

  const onBlur = () => onEvent({ kind: 'blur', t: now() });
  const onFocus = () => onEvent({ kind: 'focus', t: now() });
  const onContextMenu = () => onEvent({ kind: 'contextmenu', t: now() });

  const down = (e: PointerEvent) => onPointer(e, 'pointerdown');
  const up = (e: PointerEvent) => onPointer(e, 'pointerup');
  const cancel = (e: PointerEvent) => onPointer(e, 'pointercancel');
  const click = (e: MouseEvent) => onClick(e, 'click');
  const dbl = (e: MouseEvent) => onClick(e, 'dblclick');
  const kd = (e: KeyboardEvent) => onKey(e, 'keydown');
  const ku = (e: KeyboardEvent) => onKey(e, 'keyup');

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('pointermove', onPointerMove, { passive: true });
  el.addEventListener('click', click);
  el.addEventListener('dblclick', dbl);
  el.addEventListener('wheel', onWheel, { passive: true });
  el.addEventListener('contextmenu', onContextMenu);

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('resize', onResize);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
  }

  // Initial resize so the worker knows drawing buffer size.
  onResize();

  return {
    detach() {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('click', click);
      el.removeEventListener('dblclick', dbl);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', onContextMenu);
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', kd);
        window.removeEventListener('keyup', ku);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('blur', onBlur);
        window.removeEventListener('focus', onFocus);
      }
    },
  };
}

// ─── worker-side consumer ──────────────────────────────────────────

export interface WorkerEventRouter {
  handle(evt: BridgedEvent): void;
  on<K extends BridgedEvent['kind']>(
    kind: K,
    listener: (evt: Extract<BridgedEvent, { kind: K }>) => void,
  ): () => void;
}

export function createWorkerEventRouter(): WorkerEventRouter {
  const listeners = new Map<BridgedEvent['kind'], Set<(evt: BridgedEvent) => void>>();
  return {
    handle(evt) {
      const set = listeners.get(evt.kind);
      if (!set) return;
      for (const fn of set) fn(evt);
    },
    on(kind, listener) {
      let set = listeners.get(kind);
      if (!set) {
        set = new Set();
        listeners.set(kind, set);
      }
      const wrapped = listener as (evt: BridgedEvent) => void;
      set.add(wrapped);
      return () => set?.delete(wrapped);
    },
  };
}
