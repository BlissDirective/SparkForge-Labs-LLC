# Forge Hub — reference hardware and measurement protocol

**Owner of this doc:** Inspector (W8-01). **Written 2026-09-15** by the owner's reviewer while the Grok team is rate-limited.
**Plan:** `TRANSITION_ACTION_PLAN.md` §8 (budgets), §4 (gates), §11.8.

Every gate that says "on the reference laptop" means the device in §2. Until it exists, the CI baseline in §1 is the only measured number and the gate packet must say so.

## 1. CI baseline (exists today)

| Item | Value |
|---|---|
| Runner | GitHub `ubuntu-latest`, no GPU |
| Browser | Playwright Chromium (pinned by `@playwright/test` in `package-lock.json`), headless |
| Graphics | WebGL2 through SwiftShader (software). **No WebGPU.** The renderer cascade lands on `webgl2`; the shell reports it on `data-forge-renderer`. |
| Viewport | 1280 × 720, device scale factor 1, dark colour scheme |
| Job | `.github/workflows/forge-hub-visual.yml` → `node scripts/ssim-forge-hub.mjs --require-backend any` |
| What it proves | Composition and colour of the room shell against `public/forge-hub/world/LOCKED_HUB.jpg`. It cannot prove frame time, bloom quality under WebGPU, or the TSL path. |
| What it cannot prove | Anything in §8 of the plan expressed in milliseconds or frames per second. |

## 2. Reference laptop (owner decision AP-001, approved 2026-09-15 — device still to be purchased)

- **Target:** a Chromebook or Windows laptop with an Intel Iris Xe class integrated GPU, 8 GB RAM, Chrome stable with WebGPU enabled, external or internal display at 1280 × 720 or larger.
- **Why this class:** it is the floor of what a kid brings to the desk; anything that hits 60 fps here hits it everywhere the plan targets.
- **Record here when it arrives:** make and model, CPU, GPU, RAM, OS build, Chrome version, WebGPU adapter string (`chrome://gpu`), display size and scale factor.

## 3. Measurement protocol (same on CI and on the device)

1. `npm ci`, then a production build with the CI placeholder environment (see `forge-hub-visual.yml`), then `npm start`.
2. **SSIM:** `node scripts/ssim-forge-hub.mjs --require-backend webgpu` on the device (`--require-backend any` on CI). The script verifies `SHA256SUMS`, captures `/dev/forge-hub?pose=lock`, compares against the canonical plate, and writes `.forge-hub-ssim/report.json`. The number in that file is the number in the gate packet. A stub, a skipped run, or a poster capture is not a number.
3. **Frame time:** on the device only, open `/dev/forge-hub` in each mode, record 30 s of the Chrome Performance panel, report p95 frame time for hub idle and for `playStage` with a DOM game and with a Phaser or Pixi game. Budgets: plan §8.
4. **Launch to first input:** `gameLobby` → pick a game → first accepted input, stopwatch from the Performance trace, three runs, report the median.
5. **Poster path:** run the same capture on WebKit (Playwright `webkit` project or Safari) and confirm `data-forge-stage="poster"` with no console errors.
6. **Reduced motion:** repeat step 3 with `prefers-reduced-motion: reduce`; every transition must be a crossfade of about 200 ms.

## 4. Results log

| Date | Device | Backend | SSIM vs lock | Notes |
|---|---|---|---|---|
| 2026-09-15 | Sandbox container, Chromium 1194 headless, software GL | webgl2 | **0.717** | Before fixes: desk disc painted over the plate; slab wireframe diagonals |
| 2026-09-15 | Same | webgl2 | **0.957** (0.972 vs the display still) | After fixes (`ForgeRoom.tsx`, `ForgeGlassSlabs.tsx`). Ceiling is 0.986 because the room renders the haze-free still. |
| 2026-09-15 | Same | webgpu | blank | Headless WebGPU canvas presents black; not a room defect. Needs the reference laptop. |
