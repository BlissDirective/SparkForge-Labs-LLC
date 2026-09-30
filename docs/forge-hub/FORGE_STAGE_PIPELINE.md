# Forge Stage — Authored-Object Pipeline (Blender → GLB)

**Status:** DRAFT — owner approval required (Tier 2 packet). Amends the *implementation* of decision 2 (DOM panels projected from the scene) and the plate-lock; does **not** reopen decisions 1–14.
**Date:** 2026-09-30
**Owner:** Conrad (sole approver)
**Sources:** TAP v2.2 §2.2 / §2.7 / §8 · decision lock `docs/01-decisions/2026-09-forge-hub.md` · `docs/sparky/SPARKY-CHARACTER-SPEC.md` · runtime constants `src/config/forgeHub.ts`, `src/lib/forge-hub/coreMap.ts`, `src/lib/forge-hub/glassSlots.ts`
**Proof-of-concept:** live artifact (three.js) + in-repo R3F route `/dev/forge-poc` (`src/components/forge-hub/poc/*`, stand-in geometry).

---

## 1. Why this exists

The shipped shell bakes the three holograms **into** the plate image (`LOCKED_HUB.jpg`) *and* redraws live glass over them (`glassSlots.ts`: "world materials overlay the three painted cyan frames"). At rest they align (SSIM 0.969); the moment a panel morphs it slides off the frame painted underneath — the drift the owner flagged. No rect-tuning fixes it, because the holograms exist in two places.

**The fix (owner direction, 2026-09):** the background becomes an **empty room**; the holograms, desk, and emitter become **live authored 3D objects**. Five objects on a backdrop, all morphing/reacting/emitting off one clock — a single coherent interactive environment. This packet is the asset contract that lets an artist produce those objects and engineering wire them in.

The POC proves the **runtime and the feel** with procedural stand-in geometry. This packet covers replacing that stand-in with authored GLBs at the locked visual quality.

---

## 2. Scope — five authored objects (+ Sparky)

| # | Object | Authored in | Runtime role |
|---|--------|-------------|--------------|
| 1–3 | `HoloL` / `HoloC` / `HoloR` | Blender **or** Spline | Glass screens: resize, merge to one, split, tilt. Carry DOM/RTT content. |
| 4 | `HubDesk` (station) | Blender | Fixed platform; opens/lights panels; future Sparky **dock**. |
| 5 | `SfEmitter` | Blender | Glowing SF disc + beam cones feeding the screens. |
| — | `Sparky` | Blender (own spec) | Already specced in `docs/sparky/SPARKY-CHARACTER-SPEC.md`; this packet only adds the **desk dock** contract (§12). |

Backdrop (empty room) is **not** one of the five morph objects — see §11 (clean-room plate vs modeled room).

---

## 3. Coordinate & scale contract (authoritative)

Everything an artist ships must land in this frame so engineering can drop it into the fixed-camera stage without guesswork.

- **Units:** meters. **Up:** +Y. **Forward (camera looks toward):** −Z. Apply all transforms before export (no unapplied scale/rotation).
- **Fixed camera** (`FORGE_HUB_CAMERA`): position `[0, 1.32, 4.35]`, lookAt `[0, 0.78, −0.2]`, **fov 38**, near 0.1, far 80. There is no free-look; author for this one view. Idle micro-dolly is ≤ 2% of the camera→lookAt distance.
- **Reference composition:** `public/forge-hub/world/LOCKED_HUB.jpg`, **1280×720 (16:9)**. This is the acceptance target (SSIM ≥ 0.96 at the lock pose).
- **Placement anchors** — each object's resting pose must project onto these plate-percent rectangles (measured from the locked art; origin top-left, %):

  | Anchor | left | top | width | height | yaw° | Source |
  |--------|------|-----|-------|--------|------|--------|
  | HoloL (lock) | 10.9 | 13.5 | 24.3 | 45 | −2 | `HOLO_L_LOCK` |
  | HoloC (lock) | 37.5 | 13.5 | 25 | 48 | 0 | `HOLO_C_LOCK` |
  | HoloR (lock) | 64.8 | 13.5 | 24.3 | 45 | +2 | `HOLO_R_LOCK` |
  | SF emitter disc | cx 50 | cy 78 | r 12 | — | — | `FORGE_CORE` |
  | Desk platform | 33 | 70 | 34 | 20 | 0 | `PEDESTAL` |

- **Pivot/origin rules:** screens pivot at the **core-facing bottom-centre** of the glass (so merge/tilt rotate naturally toward the emitter). Emitter pivots at the **disc centre on the desk top**. Desk pivots at **world origin on its top surface** (Sparky's floor is `y = desk top`). Sparky's floor is the desk top plane.
- Final world transforms are calibrated in-engine against `LOCKED_HUB.jpg` (SSIM); the percent anchors above are the target the calibration hits.

---

## 4. Object roster & authored clips

Clips are authored as named actions (Blender NLA / Action editor) or Spline states, exported as glTF **animation clips**. Technique per clip: **T** = transform keys, **S** = shape keys / morph targets, **A** = armature/bones. Interactive morphs must read well when **scrubbed** (bidirectional) and **interrupted** — author eases, not just linear.

### 4.1 Holograms (each of HoloL / HoloC / HoloR)
| Clip | Technique | ~Duration | Notes |
|------|-----------|-----------|-------|
| `idle` | S/T (subtle) | loop | breathe/float; ≤ 1% scale, tiny drift |
| `appear` | S+T | 300 ms | form from emitter spark |
| `dismiss` | S+T | 300 ms | reverse |
| `toMerged` | T (+S) | 420 ms | wing slides+scales toward centre, fades (sides) / grows (centre) into the merged slab |
| `fromMerged` | T (+S) | 340 ms | split back to trio |
| `tiltFocus` | T | 300 ms | yaw to reading/tucked lip |

Holograms are **mostly flat geometry with a clean front face** — see §8 content contract. Keep deformation gentle; content must stay readable.

### 4.2 Hub desk (`HubDesk`)
| Clip | Technique | ~Duration | Notes |
|------|-----------|-----------|-------|
| `idle` | — | static | fixed platform (rim emissive is runtime) |
| `panelsOpen` / `panelsClose` | A/T | 400 ms | surface panels iris/slide for activities |
| `deskDock` | A/T | 600 ms | dock state for Sparky "connect" (§12) |
| `pulse` | S | loop (opt) | subtle surface energy while a game runs |

### 4.3 SF emitter (`SfEmitter`)
| Clip | Technique | ~Duration | Notes |
|------|-----------|-----------|-------|
| `idle` | S | loop | disc ring rotate/pulse (glow is runtime) |
| `ignite` | S+T | 300 ms | charge → emit; beam cones brighten |
| `surge` | S | 200 ms | reaction accent (combo/win) |

Beam **geometry** may be authored (cone/ribbon meshes named `beam_L/C/R`) or generated at runtime; either way the **material is runtime** (§7).

---

## 5. Naming conventions

Runtime looks assets up by name — these are a contract, not a suggestion.

- **Objects:** `HoloL`, `HoloC`, `HoloR`, `HubDesk`, `SfEmitter`, `beam_L|C|R`. PascalCase roots.
- **Sockets / empties:** `socket.<name>` — e.g. `socket.beamOriginC`, `socket.deskDock`, `socket.sparkySeat.nearCore` (must match the five seats in `src/config/sparkySpots.ts`: `nearCore`, `leftLip`, `rightLip`, `frontCenter`, `behindCore`). Empties export as nodes; runtime resolves by name.
- **Content quad:** `HoloC/contentQuad` (and L/R) — the flat face that carries UI (§8).
- **Materials:** `mat.glass`, `mat.deskMetal`, `mat.deskEmissive`, `mat.emitterCore`, `mat.beam`. Glass/emitter/beam materials are **placeholders** overwritten at runtime (§7).
- **Clips:** exactly as in §4 (`toMerged`, `ignite`, …). No spaces.
- **UV sets:** UV0 = content/albedo. Reserve UV1 if lightmapping the desk.

---

## 6. Authoring tools

- **Blender (primary, free):** the riggable hero assets — desk, emitter, Sparky, and any bone/shape-key hologram motion. Exports glTF/GLB natively with clips.
- **Spline (optional, web-native):** good low-barrier path for the **screens + emitter** morph authoring (built-in states, exports to React-Three-Fiber). Fine as long as it produces a GLB honoring §3/§5/§8. Character stays in Blender.
- **troika-three-text** (already in deps) for any crisp in-canvas text, so authored glass never bakes live copy.

Choice is per-object and reversible; the GLB contract (§3–§9) is what matters, not the tool.

---

## 7. Material split — geometry authored, light is runtime

Author **geometry, UVs, and PBR for opaque surfaces only**. The living light is runtime so it can react to state (per-lab colour, interaction, combos):

| Surface | Authored (Blender/Spline) | Runtime (TSL / R3F) |
|---------|---------------------------|---------------------|
| Desk | full PBR (metal/rough, `mat.deskMetal`) | rim emissive drive, dim response |
| Glass screens | flat geometry + `mat.glass` **placeholder** (any neutral) | translucency, fresnel edge, scanline, breathe, content composite, bloom |
| Emitter core | disc geometry + `mat.emitterCore` placeholder | emissive drive, SF glyph, glow sprite |
| Beams | cone/ribbon geometry (or none) | additive beam shader, intensity = emitter state |

Do **not** bake glow, emission, or holograms into any texture that must react. Do **not** bake the holograms into the backdrop (that is the whole bug). One glass material family shared across the three screens (per the ≤ 6 material-families budget).

---

## 8. Content-on-glass contract

Each screen exposes a flat, camera-facing **`contentQuad`** (a sub-mesh or a clearly-UV'd face of the panel) whose UV0 maps `0..1` across the readable plate region, yaw 0 in reading poses. Runtime composites UI onto it two ways, crossfading:

- **At rest:** a real **DOM panel projected** onto the quad's four projected corners (crisp text, real inputs, the 42 games, accessibility) — extends today's `getSlotProjection` path.
- **During a morph:** the same content as a **texture on the quad** so it bends/scales/merges perfectly with the glass (no drift).

Artist requirements: keep `contentQuad` planar (or near-planar ≤ 8°) in reading poses; keep a ≥ 0.85-opacity backing region behind it so text stays legible; leave a consistent safe margin inside the rounded edge. The merged (`toMerged`) end pose is the PlayStage surface — its `contentQuad` is the game viewport (spec-literal ~70%×73% of frame, per the owner call recorded in `layouts.ts`).

---

## 9. Export settings (glTF / GLB)

- **Format:** `.glb` (binary), one file per object (or one scene GLB with all five named nodes — engineering can split; per-object preferred for streaming).
- **Transforms:** applied; +Y up; meters; no unapplied scale.
- **Animations:** all §4 clips, named exactly; bake at 30 fps; include only channels that change. Morph targets (shape keys) exported; skinned meshes use one armature.
- **Geometry:** triangulated; normals + tangents exported (tangents needed for any normal map).
- **Compression / textures:** run through the repo's existing `optimize:3d` (Draco + KTX2, already wired in `compressedLoaders.ts`). Albedo/ORM as **KTX2** (BasisU); glass/emitter/beam ship **no** baked texture (runtime materials).
- **Exclude:** cameras and lights (runtime owns the fixed camera + lighting); leave sockets/empties **in**.
- **Loader:** drei `useGLTF` + `useAnimations`; mixer with `crossFadeTo` for interruptible morphs; one Director clock drives all objects (Theatre.js for the authored ensemble beats).

---

## 10. Performance budgets (TAP §8, reference Iris-Xe Chromebook @ 1280×720)

| Item | Budget |
|------|--------|
| World total | ≤ 1.5 M triangles; ≤ 6 material families; bloom only |
| Per object (proposed) | desk ≤ 60 k · emitter ≤ 20 k · each glass screen ≤ 8 k · beams ≤ 3 k each |
| Sparky | ≤ 25 k tris, ≤ 60 bones, two 2048 KTX2 sets, ≤ 1.5 ms skin+anim/frame |
| Frame time | ≤ 16 ms hub idle; ≤ 8 ms world share while a DOM game runs; on-demand during Phaser/Pixi |
| Load | stage chunk + assets deferred until **after LCP** (LCP stays HTML text); each object GLB small; Sparky base ≤ 3 MB, outfit pack ≤ 500 KB |
| LODs | author a reduced desk/emitter if the full mesh misses budget on the reference laptop |

Compact tier (< 1440 px) never mounts the canvas — unchanged.

---

## 11. Clean-room backdrop & the SSIM gate (owner decision)

The backdrop must lose its painted holograms. Two options:

- **A — Clean-room plate (recommended first):** re-cut `LOCKED_HUB.jpg` to the **empty room** (holograms removed; desk/emitter also removed since they become live objects). Ship as a **companion asset** (e.g. `world/ROOM_CLEAN.jpg`) — this does **not** alter the locked bytes of `LOCKED_HUB.jpg`, which stays the composed acceptance target. Cheapest; keeps a static backdrop.
- **B — Modeled room:** author the room as geometry too (a later optional upgrade per TAP §2.2). More cost; enables lighting/parallax on the room itself.

**SSIM gate change:** today SSIM scores live glass over the *painted* plate. Under this pipeline it scores the **full live render at the lock pose** (clean room + five live objects, no baked holograms) against `LOCKED_HUB.jpg`, still ≥ 0.96. `scripts/ssim-forge-hub.mjs` is unchanged mechanically; only what's on screen changes. Producing `ROOM_CLEAN.jpg` (or the modeled room) is an **owner-gated art action** (it's new `public/forge-hub/` bytes → add to `SHA256SUMS`).

---

## 12. Sparky ↔ desk "connect" (future-proofing)

To let Sparky dock with the station for activities/cinematics:
- Desk ships `socket.deskDock` (and the five `socket.sparkySeat.*` empties matching `sparkySpots.ts`).
- Runtime parents/constrains a Sparky hand/body bone to `socket.deskDock` and plays `HubDesk/deskDock` + a Sparky clip on **one** shared Director timeline (desk panel opens, emitter surges, Sparky reaches). IK optional for exact hand landing.
- No Sparky mesh changes needed now — only the desk sockets and a future shared clip. This narrows nothing in the Sparky spec; it extends the seat system (decision 6a) to desk docking.

---

## 13. Governance

- **Source files** (`.blend`, Spline exports, `.fbx`): Git **LFS** (`.gitattributes` already tracks `.blend/.fbx/.abc`). Add `.spline` if used.
- **Runtime GLBs:** live under `public/forge-hub/` (e.g. `world/objects/*.glb`), **SHA-pinned in `SHA256SUMS`**, treated like the locked plate — never regenerate/restyle in place without an owner packet. `cd public/forge-hub && sha256sum -c SHA256SUMS` before/after any task near that folder.
- **Never** edit `src/components/games/*`; no new Zustand store (repurpose `sceneStore` → `forgeStore`); OVERLAY-CRIT-001 stands.
- **Gates:** each object gets an owner visual checkpoint (fold into P1 room-shell / P4 PlayStage, and the C-series already covers Sparky). A gate needs a **measured** SSIM from `scripts/ssim-forge-hub.mjs` (WebGL2 in CI, WebGPU on the reference laptop).

---

## 14. Deliverables & acceptance (per object)

1. `<Object>.glb` honoring §3 (frame/scale/pivot), §5 (names), §9 (export).
2. All §4 clips present, named, scrubbable, interruptible.
3. Sockets present and named (§5, §12).
4. Within the §10 budget on the reference laptop (report tris/draw calls/frame time).
5. Placed at its §3 anchor, the **lock pose renders SSIM ≥ 0.96** vs `LOCKED_HUB.jpg` (full live render).
6. Source (`.blend`/Spline) committed to LFS; GLB SHA added to `SHA256SUMS`.

---

## 15. Open decisions for the owner (approve to proceed)

1. **Backdrop:** Option A (clean-room plate `ROOM_CLEAN.jpg`) or B (modeled room)? (Recommend A first.)
2. **Who authors:** external 3D artist (TAP §9 names this as the one missing skill), AI mesh-gen (Track A, needs `MESH_GEN_API_KEY` — O-2), or Spline for screens/emitter + Blender for desk/emitter/Sparky?
3. **Approve the clean-room art action** (new `public/forge-hub/` bytes + `SHA256SUMS` update) and the **SSIM-gate reinterpretation** (full live render vs plate).
4. **Object gate mapping:** fold object checkpoints into P1/P4, or add a dedicated object gate series?

None of the above reopens decisions 1–14; they are implementation choices under decision 2 + the plate lock.

---

## 16. Fit with the existing plan

This **completes** decision 2 (DOM projected from the scene), decision 8 (directed, synchronized morphs), and decision 10 (WebGPU+TSL) by making every panel live geometry instead of a painting with overlays. It replaces only the "plate-plus-parallax with real meshes for what moves" shortcut in TAP §2.2 with "all five are real meshes," keeping the same interfaces, the same SSIM bar, and the same budgets. The POC (`/dev/forge-poc`) is the runtime reference the authored GLBs slot into.
