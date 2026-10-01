// Authored forge-stage GLB locations (produced per
// docs/forge-hub/FORGE_STAGE_ASSET_PROMPTS.md). These do not exist until
// the asset pass ships; the POC probes for them and only offers the GLB
// path when all three are present, falling back to procedural otherwise.

export const POC_OBJECT_URLS = {
  desk: '/forge-hub/world/objects/HubDesk.glb',
  emitter: '/forge-hub/world/objects/SfEmitter.glb',
  screens: '/forge-hub/world/objects/HoloScreens.glb',
} as const;

/**
 * Placeholder transform mapping authored metres into the POC world until
 * the new background plate lands and placement is calibrated in-engine
 * (P1/P4). Desk + emitter render under this group; screens are reparented
 * to world space and driven by the pose clock.
 */
export const POC_GLB_PLACEMENT = {
  position: [0, -3.95, 1.0] as [number, number, number],
  scale: 1.0,
};

/** True only when every object GLB resolves (HEAD 200). */
export async function probePocAssets(): Promise<boolean> {
  try {
    const results = await Promise.all(
      Object.values(POC_OBJECT_URLS).map((u) =>
        fetch(u, { method: 'HEAD' })
          .then((r) => r.ok)
          .catch(() => false),
      ),
    );
    return results.every(Boolean);
  } catch {
    return false;
  }
}
