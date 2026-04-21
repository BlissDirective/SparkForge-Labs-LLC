// ════════════════════════════════════════════════════════════════
// offscreenCanvasSupport — P2 §10.11 (Opt A detection layer)
// ════════════════════════════════════════════════════════════════
// Runtime capability probes for the Phase 5 OffscreenCanvas worker
// rendering migration. Shipped now so the migration PR doesn't
// need to reinvent the detection.
//
// A renderer is "safe to move to a worker" only when ALL are true:
//   1. OffscreenCanvas constructor exists.
//   2. Worker context can create a WebGL2 context (SparkForge needs
//      WebGL2 at minimum; see D3D-1 / desktop-ultra profile).
//   3. User agent is not Safari < 16.4 — those versions expose
//      OffscreenCanvas but crash on worker-context WebGL2.
//
// The third gate follows the user directive ("proceed regardless of
// Safari <16.4 — users likely on latest Safari") while still ensuring
// the occasional outdated-Safari user doesn't get a black cockpit.
// Fallback: main-thread render (current architecture).
// ════════════════════════════════════════════════════════════════

export interface OffscreenSupport {
  offscreenCanvas: boolean;
  workerWebGL2: boolean;
  safariVersionOk: boolean;
  overall: boolean;
}

/** Does the runtime expose the OffscreenCanvas constructor? */
export function hasOffscreenCanvas(): boolean {
  return typeof OffscreenCanvas !== 'undefined';
}

/** Parse Safari major.minor from navigator.userAgent. Returns null
 *  when the UA does not match Safari. Chrome/Firefox/Edge share
 *  "Safari" in their UA strings, so we filter on both Safari AND
 *  not-other-engines. */
export function parseSafariVersion(
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : '',
): { major: number; minor: number } | null {
  if (!userAgent) return null;
  if (/Chrome|Chromium|CriOS|Edg|Firefox|FxiOS/i.test(userAgent)) return null;
  // Safari/16.4 style string.
  const m = userAgent.match(/Version\/(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: parseInt(m[1], 10), minor: parseInt(m[2], 10) };
}

/** True when: UA is NOT Safari, OR UA is Safari ≥ 16.4.
 *  (Safari 16.4 was the version that landed stable worker-context
 *  WebGL2 + OffscreenCanvas transfer.) */
export function safariVersionOk(userAgent?: string): boolean {
  const v = parseSafariVersion(userAgent);
  if (!v) return true; // not Safari → fine
  return v.major > 16 || (v.major === 16 && v.minor >= 4);
}

/** Heuristic: can a worker create a WebGL2 context?
 *  We don't actually spawn a worker (expensive + async); we check
 *  for the APIs a spawned worker would need. If any are missing,
 *  treat as unsupported. */
export function hasWorkerWebGL2(): boolean {
  if (typeof Worker === 'undefined') return false;
  if (!hasOffscreenCanvas()) return false;
  // Pre-check: the main-thread OffscreenCanvas must yield a WebGL2
  // context. If the main thread can't, the worker can't either.
  try {
    const oc = new OffscreenCanvas(1, 1);
    const ctx = oc.getContext('webgl2');
    return ctx !== null;
  } catch {
    return false;
  }
}

/** Combined gate — all three checks pass. */
export function isOffscreenRenderSafe(ua?: string): boolean {
  return hasOffscreenCanvas() && hasWorkerWebGL2() && safariVersionOk(ua);
}

/** Diagnostic bundle for telemetry / debug panels. */
export function getOffscreenSupport(ua?: string): OffscreenSupport {
  const offscreenCanvas = hasOffscreenCanvas();
  const workerWebGL2 = hasWorkerWebGL2();
  const verOk = safariVersionOk(ua);
  return {
    offscreenCanvas,
    workerWebGL2,
    safariVersionOk: verOk,
    overall: offscreenCanvas && workerWebGL2 && verOk,
  };
}
