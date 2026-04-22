// ════════════════════════════════════════════════════════════════
// shaderPrecompiler — Phase 5 task #1 (§10.11) Ultra sub-module
// Walk SHADER_MANIFEST, build probe meshes, and run renderer.compile()
// ════════════════════════════════════════════════════════════════
// The worker calls `precompileManifestGroups(renderer, groups)` once
// on init, before the first real frame. Each manifest entry yields a
// tiny probe Mesh (1×1 plane) with the specified material + features.
// renderer.compile() then runs the GLSL compile path, populating the
// program cache so the first real frame doesn't hitch.
//
// Why probes instead of just the real scene? Because the real scene
// isn't mounted yet when the worker starts — we're precompiling before
// any user-visible geometry exists. Probe meshes guarantee a deterministic
// warmup set independent of runtime component mount order.
// ════════════════════════════════════════════════════════════════

import {
  AmbientLight,
  BufferGeometry,
  DirectionalLight,
  HemisphereLight,
  Light,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SpotLight,
  Sprite,
  SpriteMaterial,
  Vector3,
  type Material,
  type WebGLRenderer,
} from 'three';
import type { ShaderManifestEntry } from './shaderManifest';
import { getManifestGroup, SHADER_MANIFEST } from './shaderManifest';

export interface PrecompileReport {
  compiledCount: number;
  totalCount: number;
  elapsedMs: number;
  failures: Array<{ id: string; error: string }>;
  byGroup: Record<string, { compiled: number; total: number; elapsedMs: number }>;
}

function buildProbe(entry: ShaderManifestEntry): Mesh | Line | Points | Sprite {
  const geom = new PlaneGeometry(1, 1);
  const matOpts: Record<string, unknown> = {};
  if (entry.features?.transparent) matOpts.transparent = true;
  if (entry.features?.fog) matOpts.fog = true;
  if (entry.features?.clipping) matOpts.clippingPlanes = [];

  let material: Material;
  switch (entry.materialClass) {
    case 'MeshStandardMaterial':
      material = new MeshStandardMaterial(matOpts);
      break;
    case 'MeshPhysicalMaterial':
      material = new MeshPhysicalMaterial(matOpts);
      break;
    case 'MeshBasicMaterial':
      material = new MeshBasicMaterial(matOpts);
      break;
    case 'LineBasicMaterial':
      material = new LineBasicMaterial(matOpts);
      return new Line(
        new BufferGeometry().setFromPoints([new Vector3(0, 0, 0), new Vector3(1, 0, 0)]),
        material,
      );
    case 'PointsMaterial':
      material = new PointsMaterial({ size: 1, ...matOpts });
      return new Points(
        new BufferGeometry().setFromPoints([new Vector3(0, 0, 0)]),
        material,
      );
    case 'SpriteMaterial':
      material = new SpriteMaterial(matOpts);
      return new Sprite(material as SpriteMaterial);
    case 'ShaderMaterial':
      // Minimal pass-through shader. Real shader sources are compiled
      // lazy on first real use because they vary per-component. The
      // probe exists purely to warm the ShaderMaterial pipeline branch.
      material = new ShaderMaterial({
        vertexShader: 'void main() { gl_Position = vec4(position, 1.0); }',
        fragmentShader: 'void main() { gl_FragColor = vec4(0.0); }',
        transparent: matOpts.transparent === true,
      });
      break;
    default:
      material = new MeshBasicMaterial();
  }
  return new Mesh(geom, material);
}

function buildProbeLights(entry: ShaderManifestEntry, scene: Scene): void {
  if (!entry.lights) return;
  for (const kind of entry.lights) {
    let light: Light | null = null;
    switch (kind) {
      case 'ambient':
        light = new AmbientLight(0xffffff, 0.1);
        break;
      case 'directional':
        light = new DirectionalLight(0xffffff, 0.5);
        break;
      case 'point':
        light = new PointLight(0xffffff, 0.5);
        break;
      case 'spot':
        light = new SpotLight(0xffffff, 0.5);
        break;
      case 'hemisphere':
        light = new HemisphereLight(0xffffff, 0x000000, 0.5);
        break;
    }
    if (light) scene.add(light);
  }
}

/**
 * Precompile the given manifest groups against the provided renderer.
 * Safe to call multiple times — the renderer program cache dedupes.
 *
 * @param renderer  the THREE.WebGLRenderer (or WebGPURenderer) in use
 * @param groups    manifest groups to compile (default: ['core', 'cockpit'])
 * @param budgetMs  optional per-group budget; groups over budget are
 *                  split across multiple idle callbacks.
 */
export function precompileManifestGroups(
  renderer: WebGLRenderer,
  groups: ShaderManifestEntry['group'][],
  _budgetMs = 16,
): PrecompileReport {
  const start =
    typeof performance !== 'undefined' && 'now' in performance
      ? performance.now()
      : Date.now();
  const report: PrecompileReport = {
    compiledCount: 0,
    totalCount: 0,
    elapsedMs: 0,
    failures: [],
    byGroup: {},
  };

  for (const group of groups) {
    const entries = getManifestGroup(group);
    const gStart =
      typeof performance !== 'undefined' && 'now' in performance
        ? performance.now()
        : Date.now();
    const gReport = { compiled: 0, total: entries.length, elapsedMs: 0 };

    // Build a fresh scene + ortho camera per group so lights do not
    // leak between groups (a directional light left in the scene can
    // force every subsequent compile into a "with-lights" variant).
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 2;

    for (const entry of entries) {
      try {
        const probe = buildProbe(entry);
        scene.add(probe);
        buildProbeLights(entry, scene);
        renderer.compile(scene, camera);
        gReport.compiled += 1;
        report.compiledCount += 1;
        // Dispose geometry — the program cache is what we care about.
        scene.remove(probe);
        (probe as Mesh).geometry?.dispose?.();
        const mat = (probe as Mesh).material as Material | undefined;
        mat?.dispose?.();
      } catch (err) {
        report.failures.push({
          id: entry.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      report.totalCount += 1;
    }

    const gEnd =
      typeof performance !== 'undefined' && 'now' in performance
        ? performance.now()
        : Date.now();
    gReport.elapsedMs = gEnd - gStart;
    report.byGroup[group] = gReport;
    // Dispose all scene-level lights / helpers.
    scene.traverse((obj) => {
      if (obj instanceof Light) obj.dispose?.();
    });
  }

  const end =
    typeof performance !== 'undefined' && 'now' in performance
      ? performance.now()
      : Date.now();
  report.elapsedMs = end - start;
  return report;
}

/** Count entries that would be compiled for the given groups. */
export function countManifestEntries(groups: ShaderManifestEntry['group'][]): number {
  return SHADER_MANIFEST.filter((e) => groups.includes(e.group)).length;
}
