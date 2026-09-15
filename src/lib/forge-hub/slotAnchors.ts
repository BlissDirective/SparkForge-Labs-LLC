// ════════════════════════════════════════════════════════════════
// Forge Hub — glass mesh anchors + live projection bus (W2)
// ════════════════════════════════════════════════════════════════
// Not a Zustand store. Glass slabs register their plane meshes;
// ForgeSlotProjector writes screen quads; useProjectedSlot reads
// them on rAF so HoloPanel does not re-render every frame.

import type { Mesh } from 'three';
import type { GlassSlotId } from './glassSlots';

export const GLASS_SLOT_IDS: readonly GlassSlotId[] = ['holoL', 'holoC', 'holoR'];

export interface ProjectedSlotQuad {
  left: number;
  top: number;
  width: number;
  height: number;
  yawDeg: number;
  reading: boolean;
  visible: boolean;
}

const anchors = new Map<GlassSlotId, Mesh>();
const projections = new Map<GlassSlotId, ProjectedSlotQuad | null>();

export function registerSlotAnchor(id: GlassSlotId, mesh: Mesh): void {
  anchors.set(id, mesh);
}

export function unregisterSlotAnchor(id: GlassSlotId, mesh?: Mesh | null): void {
  const current = anchors.get(id);
  if (!mesh || current === mesh) anchors.delete(id);
}

export function getSlotAnchor(id: GlassSlotId): Mesh | undefined {
  return anchors.get(id);
}

export function publishSlotProjection(
  id: GlassSlotId,
  quad: ProjectedSlotQuad | null,
): void {
  projections.set(id, quad);
}

export function getSlotProjection(id: GlassSlotId): ProjectedSlotQuad | null {
  return projections.get(id) ?? null;
}

/** Test helper — not used at runtime. */
export function resetSlotAnchorsForTests(): void {
  anchors.clear();
  projections.clear();
}
