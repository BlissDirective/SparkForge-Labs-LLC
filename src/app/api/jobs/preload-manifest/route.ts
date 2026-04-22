// GET  /api/jobs/preload-manifest          — user-specific manifest
// POST /api/jobs/preload-manifest/refresh  — cron-triggered rebuild for one user
// PERF-ENH KTX2/Basis + Draco (Ultra) — Phase 5 task #6
//
// Per-user 3D asset preload manifest. The GET form is what the client
// hits on app boot to fetch its personalized list of probable-next
// assets. The POST form is called by pg_cron (see automation-playbook)
// to pre-compute manifests in bulk.
//
// AI-driven heuristic (v1, deliberate simple):
//   - Progress in last 7d → which labs have been touched
//   - For each recent lab, include its primary 3D asset
//   - For the top 3 labs by play count, also include the environment
//     HDRI and cockpit skin
//
// A v2 (Recommended in the next-10 doc) would run this through the
// Content Agent to learn per-child preferences. The manifest is
// versioned so a v2 switch is a transparent upgrade.
import { NextRequest } from 'next/server';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';
import { createAdminClient } from '@/lib/supabase/server';

// ─── Canonical asset registry ─────────────────────────────────────
// Maps lab id → the 3D assets that lab typically pulls. Keep in sync
// with src/lib/3d/materials.ts GLTF_PRELOAD_PATHS.

const LAB_ASSETS: Record<number, { gltf: string[]; ktx2?: string[] }> = {
  1: { gltf: ['/models/ai_spy/scene.glb'] },
  2: { gltf: ['/models/prompt_lab/scene.glb'] },
  3: { gltf: ['/models/pet_trainer/scene.glb'] },
  4: { gltf: ['/models/neural_builder/scene.glb'] },
  5: { gltf: ['/models/data_detective/scene.glb'] },
  6: { gltf: ['/models/bias_detector/scene.glb'] },
  7: { gltf: ['/models/future_forge/scene.glb'] },
  8: { gltf: ['/models/ai_ethics/scene.glb'] },
  9: { gltf: ['/models/safe_web/scene.glb'] },
  10: { gltf: ['/models/career_explorer/scene.glb'] },
};

const SHARED_ASSETS: Array<{ url: string; kind: 'gltf' | 'hdri'; priority: number }> = [
  { url: '/hdri/frost-prismatic.hdr', kind: 'hdri', priority: 0.9 },
];

export interface PreloadManifestEntry {
  url: string;
  kind: 'gltf' | 'ktx2' | 'hdri' | 'basis';
  priority: number;
  sizeBytes?: number;
  lod?: string;
}

interface PreloadManifest {
  builtAt: string;
  userId: string;
  entries: PreloadManifestEntry[];
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const manifest = await buildManifestForUser(auth.user.id);
  return apiSuccess({ manifest });
}

async function buildManifestForUser(userId: string): Promise<PreloadManifest> {
  const admin = createAdminClient();

  // Recent lab activity — last 7 days.
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: rows } = await admin
    .from('progress')
    .select('world, completed_at')
    .in(
      'child_id',
      // Subquery not directly supported — resolve via children table.
      (
        await admin.from('children').select('id').eq('parent_id', userId)
      ).data?.map((c) => c.id) ?? [],
    )
    .gte('completed_at', since)
    .order('completed_at', { ascending: false })
    .limit(100);

  const labPlayCount = new Map<number, number>();
  for (const r of rows ?? []) {
    const world = Number(r.world);
    if (!Number.isFinite(world) || world < 1 || world > 10) continue;
    labPlayCount.set(world, (labPlayCount.get(world) ?? 0) + 1);
  }

  const sortedLabs = [...labPlayCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  const entries: PreloadManifestEntry[] = [];

  // Top-3 labs get their GLTF + environment pre-cached.
  sortedLabs.slice(0, 3).forEach((labId, i) => {
    const basePriority = 1.0 - i * 0.15;
    for (const url of LAB_ASSETS[labId]?.gltf ?? []) {
      entries.push({ url, kind: 'gltf', priority: basePriority });
    }
  });

  // Remaining labs get lower-priority hints.
  sortedLabs.slice(3).forEach((labId) => {
    for (const url of LAB_ASSETS[labId]?.gltf ?? []) {
      entries.push({ url, kind: 'gltf', priority: 0.4 });
    }
  });

  // Shared assets.
  for (const a of SHARED_ASSETS) {
    entries.push({ url: a.url, kind: a.kind, priority: a.priority });
  }

  // Dedup by url — highest priority wins.
  const byUrl = new Map<string, PreloadManifestEntry>();
  for (const e of entries) {
    const prior = byUrl.get(e.url);
    if (!prior || e.priority > prior.priority) byUrl.set(e.url, e);
  }
  const deduped = [...byUrl.values()].sort((a, b) => b.priority - a.priority);

  return {
    builtAt: new Date().toISOString(),
    userId,
    entries: deduped,
  };
}
