// ════════════════════════════════════════════════════════════════════════
// PIXI STAGE SKELETON — shared loading placeholder for game canvas stages
// ════════════════════════════════════════════════════════════════════════
// Single source of the dynamically-imported Pixi/Phaser stage's loading state.
// Extracted so the `h-[420px]` arbitrary spacing value lives in exactly one
// place instead of being repeated across ~26 migrated games (audit §3.7 —
// stop arbitrary-value drift; keeps the P2 §7.5 spacing budget in check).

export default function PixiStageSkeleton() {
  return (
    <div
      className="h-[420px] w-full animate-pulse rounded-2xl"
      style={{ background: '#0E1428' }}
    />
  );
}
