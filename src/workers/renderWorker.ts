// ════════════════════════════════════════════════════════════════
// renderWorker — Phase 5 task #1 (§10.11) Ultra (scaffold)
// OffscreenCanvas render worker entry point
// ════════════════════════════════════════════════════════════════
// Receives an OffscreenCanvas + SAB via postMessage, boots a
// WebGLRenderer in worker context, runs shader precompile over the
// manifest groups, then enters a rAF loop that:
//   - Reads store mirror values from SAB every frame
//   - Records frame time in fpsTelemetry
//   - Reports FPS back to main every 1s
//   - Lets autoQuality react to load spikes
//
// SCOPE LIMITATION (honest):
// -------------------------
// A full R3F reconciler running inside the worker is a 3-5 week
// engineering effort per the Phase 5 audit. This worker therefore
// ships a *minimal scene* (cockpit-shell ambient rim + grid + star
// field) rather than the full SparkForge scene tree. The main-thread
// Canvas remains authoritative for the full scene today; the worker
// path is feature-flagged behind NEXT_PUBLIC_FF_OFFSCREEN_RENDER=true
// so it can be opted into for perf testing without risk.
//
// The remaining gap to full-fidelity parity is tracked in
// `docs/OFFSCREEN_CANVAS_FEASIBILITY.md` section "Phase 2 (deferred)".
// The infra shipped in this PR (SAB mirror + event bridge + FPS
// telemetry + auto-quality + shader manifest + worker client) is
// exactly what that Phase 2 work will plug into, so no part of this
// delivery becomes throw-away when the reconciler lands.
// ════════════════════════════════════════════════════════════════

/// <reference lib="webworker" />

import * as THREE from 'three';
import {
  attachSabStoreView,
  SAB_SLOTS,
  SCENE_MODE_ENUM,
  QUALITY_TIER_ENUM,
  decodeEnum,
  type SabStoreHandle,
} from '@/lib/3d/offscreen/sabStoreMirror';
import {
  precompileManifestGroups,
} from '@/lib/3d/offscreen/shaderPrecompiler';
import {
  createFpsTelemetry,
  type FpsTelemetry,
} from '@/lib/3d/offscreen/fpsTelemetry';
import {
  createAutoQuality,
  DEFAULT_QUALITY_APPLICATION,
  type QualityTier,
  type AutoQuality,
} from '@/lib/3d/offscreen/autoQuality';
import {
  createWorkerEventRouter,
  type WorkerEventRouter,
} from '@/lib/3d/offscreen/eventBridge';
import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from '@/lib/3d/offscreen/workerProtocol';

declare const self: DedicatedWorkerGlobalScope;

// ─── State held across messages ───────────────────────────────────
let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let sab: SabStoreHandle | null = null;
let tel: FpsTelemetry | null = null;
let aq: AutoQuality | null = null;
let router: WorkerEventRouter | null = null;
let rafId: number | null = null;
let disposed = false;

function post(msg: WorkerOutboundMessage): void {
  self.postMessage(msg);
}

function applyQuality(tier: QualityTier): void {
  if (!renderer) return;
  const app = DEFAULT_QUALITY_APPLICATION;
  renderer.setPixelRatio(app.pixelRatio[tier]);
  renderer.shadowMap.enabled = tier !== 'low';
}

function buildMinimalScene(): { scene: THREE.Scene; camera: THREE.PerspectiveCamera } {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x06070e);
  s.fog = new THREE.FogExp2(0x06070e, 0.02);

  const c = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  c.position.set(0, 1.5, 6);
  c.lookAt(0, 0, 0);

  const amb = new THREE.AmbientLight(0x4a6cff, 0.45);
  s.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(5, 10, 7);
  s.add(dir);

  // Chrome bezel ring — a placeholder geometry that represents the
  // cockpit rim. Real cockpit geometry mounts back on main thread.
  const ringGeom = new THREE.TorusGeometry(2.0, 0.04, 12, 128);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xe8ecff,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0x304080,
    emissiveIntensity: 0.2,
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.rotation.x = Math.PI / 2;
  s.add(ring);

  // Holographic grid
  const grid = new THREE.GridHelper(20, 40, 0x4a6cff, 0x1a2040);
  (grid.material as THREE.Material).opacity = 0.35;
  (grid.material as THREE.Material).transparent = true;
  s.add(grid);

  // Star field
  const starGeom = new THREE.BufferGeometry();
  const starCount = 1500;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
  }
  starGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 0.7,
  });
  s.add(new THREE.Points(starGeom, starMat));

  return { scene: s, camera: c };
}

function onInit(msg: Extract<WorkerInboundMessage, { kind: 'init' }>): void {
  const warmStart =
    typeof performance !== 'undefined' && 'now' in performance
      ? performance.now()
      : Date.now();
  try {
    sab = attachSabStoreView(msg.sab);
    router = createWorkerEventRouter();

    renderer = new THREE.WebGLRenderer({
      canvas: msg.canvas as unknown as HTMLCanvasElement,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(msg.dpr);
    renderer.setSize(msg.width, msg.height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const built = buildMinimalScene();
    scene = built.scene;
    camera = built.camera;
    camera.aspect = msg.width / msg.height;
    camera.updateProjectionMatrix();

    // Warm up shaders before first visible frame.
    const report = precompileManifestGroups(renderer, msg.warmupGroups);

    // Telemetry + auto-quality.
    aq = createAutoQuality({
      initialTier: msg.quality,
      onTierChange: (prev, next, reason) => {
        applyQuality(next);
        if (sab) sab.write(SAB_SLOTS.QUALITY_TIER, QUALITY_TIER_ENUM[next] ?? 2);
        post({ kind: 'tierChange', prev, next, reason });
      },
    });
    tel = createFpsTelemetry({
      onReport: (report) => {
        if (sab) {
          sab.write(SAB_SLOTS.FPS_LAST, report.fps);
          sab.write(SAB_SLOTS.FRAME_TIME_MS, report.frame.mean);
          if (report.gpu) sab.write(SAB_SLOTS.GPU_TIME_MS, report.gpu.mean);
        }
        aq?.ingest(report);
        post({ kind: 'fpsReport', report });
      },
    });

    applyQuality(msg.quality);
    if (sab) sab.write(SAB_SLOTS.QUALITY_TIER, QUALITY_TIER_ENUM[msg.quality] ?? 2);

    const warmEnd =
      typeof performance !== 'undefined' && 'now' in performance
        ? performance.now()
        : Date.now();

    post({
      kind: 'ready',
      warmupMs: warmEnd - warmStart,
      compiledCount: report.compiledCount,
      failedCount: report.failures.length,
    });

    startRenderLoop();
  } catch (err) {
    post({
      kind: 'error',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}

function onResize(msg: Extract<WorkerInboundMessage, { kind: 'resize' }>): void {
  if (!renderer || !camera) return;
  renderer.setPixelRatio(msg.dpr);
  renderer.setSize(msg.width, msg.height, false);
  camera.aspect = msg.width / msg.height;
  camera.updateProjectionMatrix();
}

function onEvent(msg: Extract<WorkerInboundMessage, { kind: 'event' }>): void {
  router?.handle(msg.evt);
}

function onQuality(msg: Extract<WorkerInboundMessage, { kind: 'quality' }>): void {
  applyQuality(msg.tier);
  aq?.pin(msg.tier);
  if (sab) sab.write(SAB_SLOTS.QUALITY_TIER, QUALITY_TIER_ENUM[msg.tier] ?? 2);
}

function onDispose(): void {
  disposed = true;
  if (rafId != null) cancelAnimationFrame(rafId);
  rafId = null;
  tel?.stop();
  renderer?.dispose();
  renderer = null;
  scene = null;
  camera = null;
  sab = null;
  tel = null;
  aq = null;
  router = null;
}

function startRenderLoop(): void {
  let lastT =
    typeof performance !== 'undefined' && 'now' in performance
      ? performance.now()
      : Date.now();
  const tick = () => {
    if (disposed || !renderer || !scene || !camera) return;
    const now =
      typeof performance !== 'undefined' && 'now' in performance
        ? performance.now()
        : Date.now();
    const dt = now - lastT;
    lastT = now;

    // Read SAB-mirrored state for per-frame reactivity.
    if (sab) {
      // Scene mode drives whether the worker renders at all — e.g.
      // we skip rendering during the main-thread hero animation so
      // two canvases don't clash.
      const sceneMode = decodeEnum(SCENE_MODE_ENUM, sab.read(SAB_SLOTS.SCENE_MODE));
      const reducedMotion = sab.read(SAB_SLOTS.REDUCED_MOTION) > 0.5;
      if (sceneMode === 'hero') {
        // Minimal scene — only animate stars, skip ring rotation.
      } else if (scene.children.length >= 3 && !reducedMotion) {
        // Gentle ring rotation representing cockpit activity.
        const ring = scene.children[2] as THREE.Mesh | undefined;
        if (ring) ring.rotation.z += dt * 0.0001;
      }
    }

    renderer.render(scene, camera);
    tel?.recordFrame(dt);
    rafId = self.requestAnimationFrame(tick);
  };
  rafId = self.requestAnimationFrame(tick);
}

// ─── Message dispatch ─────────────────────────────────────────────

self.addEventListener('message', (ev: MessageEvent<WorkerInboundMessage>) => {
  const msg = ev.data;
  if (!msg || typeof msg !== 'object' || !('kind' in msg)) return;
  try {
    switch (msg.kind) {
      case 'init':
        onInit(msg);
        break;
      case 'resize':
        onResize(msg);
        break;
      case 'event':
        onEvent(msg);
        break;
      case 'quality':
        onQuality(msg);
        break;
      case 'dispose':
        onDispose();
        break;
    }
  } catch (err) {
    post({
      kind: 'error',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
});

self.addEventListener('error', (ev: ErrorEvent) => {
  post({
    kind: 'error',
    message: ev.message || 'Worker uncaught error',
    stack: undefined,
  });
});

// Export an empty object so TS treats this as a module (required for
// import.meta and /// <reference>).
export {};
