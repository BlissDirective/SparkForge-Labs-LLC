# Forge Stage — Asset-Creation Prompt Playbook

**Status:** companion to `docs/forge-hub/FORGE_STAGE_PIPELINE.md` (AP-002, owner-approved 2026-09-30).
**Audience:** a computer-use model/agent driving **Spline** (screens) and **Blender** (desk, emitter), with the owner guiding. Also runnable by hand.
**Owner choices locked (§15):** clean room (owner supplies a new flat background plate) · Spline + Blender hand-authoring · object gates folded into P1/P4 · AI mesh-gen **not** used (O-2 not needed).

> **Reliability first.** A CU agent clicking through a 3D GUI is error-prone for precise work. The **reliable spine is the Blender script** `scripts/blender/forge_stage/build_forge_stage.py` — it emits the desk, emitter, and screens to exact spec (dimensions, pivots, names, sockets, export) deterministically. Have the agent **run that script**, then refine visuals with the art prompts below. Spline is offered for the screens if you want to shape them visually; a Blender fallback for the screens is in the same script.

---

## 0. How to use this

Two paths, pick per object:

- **A — Scripted (recommended for desk + emitter + screen scaffold):** agent opens Blender → Scripting tab → pastes/loads `build_forge_stage.py` → **Run** → three GLBs land in `~/forge-stage-glb/`. Then the agent applies the per-object **art-refinement** prompts (§4) and re-exports.
- **B — GUI-authored (optional for screens):** agent drives Spline with the §4.3 step list.

Either way, finish with **§5 clips**, **§6 export/optimize/governance**, and the **§7 acceptance checklist**.

---

## 1. Operator meta-prompt (paste this to the CU agent first)

```
You are a 3D technical artist creating game-ready assets for "SparkForge",
a hologram forge-room UI for a children's learning app. You will produce
three glTF-binary (.glb) files — HubDesk, SfEmitter, HoloScreens — that an
engineer drops into a fixed-camera React-Three-Fiber scene.

NON-NEGOTIABLE CONTRACT (verify before you export):
- Units: metres. Up axis authored +Z in Blender; export glTF as +Y up.
- Apply all transforms (no unapplied scale/rotation) before export.
- Object names EXACTLY: HubDesk, SfEmitter, HoloL, HoloC, HoloR.
- Empties (sockets) named EXACTLY as in the spec: socket.deskDock,
  socket.sparkySeat.<nearCore|leftLip|rightLip|frontCenter|behindCore>,
  socket.beamOriginC|L|R, HoloL.contentQuad / HoloC.contentQuad / HoloR.contentQuad.
- Material names: mat.deskMetal, mat.deskEmissive, mat.emitterCore, mat.glass.
- Do NOT bake glow, emission haze, or any hologram INTO a texture that must
  react — the glass/emitter/beam look is a runtime shader. Author geometry,
  UVs, and opaque PBR only (the desk is the one fully-textured surface).
- Keep each object within budget (desk <= 60k tris, emitter <= 20k, each
  screen <= 8k, total world <= 1.5M tris, <= 6 material families).
- Screens are simple vertical planes with clean UV0 spanning 0..1 (the
  rounded corners, translucency, and edge glow are added at runtime).

METHOD:
1. In Blender, run scripts/blender/forge_stage/build_forge_stage.py. This
   creates the correct scaffold (dimensions, pivots, names, sockets, export).
2. Refine each object's SHAPE and PBR to match the reference look using the
   per-object prompts you will be given, WITHOUT renaming anything or
   moving origins/sockets.
3. Re-export each object to .glb (File > Export > glTF 2.0, format GLB,
   +Y up, apply modifiers, selection only, include custom properties).
4. Run the validation checklist and report tris, material count, object and
   socket names, and file sizes for each GLB. Do not claim success until
   every checklist item passes. If a step fails, stop and report exactly
   what and why — never rename or fake a socket to pass.

REFERENCE LOOK: a warm rose-gold / cream forge room, cyan holograms, a
brushed rose-gold circular desk with an emissive rim, and a flat metallic
"SF" emitter disc at desk centre. The owner will supply the reference
background image; match its materials and warmth. Kid-friendly, soft,
premium — not gritty or sci-fi-military.
```

---

## 2. Shared contract (recap the agent must honor)

| Item | Value |
|------|-------|
| Units / up | metres; Blender +Z up → glTF **+Y up** |
| Camera (fixed) | pos `[0, 1.32, 4.35]`, lookAt `[0, 0.78, −0.2]`, fov 38 (author for this one view) |
| Desk | circular, **radius 1.62 m**, top surface at **y = 0** (Sparky's floor), origin at desk-top centre |
| Emitter | disc ~**0.36 m** radius on the desk centre; origin at disc centre |
| Screens | unit planes (engine scales via the layout registry); pivot at **core-facing bottom-centre**; UV0 0..1 |
| Sparky seats | five empties at the offsets in `src/config/sparkySpots.ts` (already in the script) |
| Background | **owner-supplied flat plate** (clean room, no holograms) — assets sit on top; do **not** author a room |
| Export | GLB, +Y up, transforms applied, custom props on, KTX2+Draco via `optimize:3d` (§6) |

---

## 3. Object: **SfEmitter** (Blender) — art-refinement prompt

```
Refine the SfEmitter object (already scaffolded: a 0.36 m brushed-metal disc
with an emissive ring, a cyan core face, and beam-origin sockets).

SHAPE: give the disc a subtle two-tier bevel like a premium speaker puck —
a wider brushed rose-gold base ring, a slightly recessed inner well, and the
flat cyan core face sitting just below the top lip so light pools in the well.
Add a fine concentric groove or two on the base (bevel/inset loops), kept low-
poly (<= 20k tris total). Chamfer all hard edges ~1–2 mm so nothing reads sharp.

MATERIAL: mat.deskMetal on the body — brushed rose-gold, metallic ~0.75,
roughness ~0.35, anisotropic feel. mat.emitterCore on the ring + core face —
leave it as a flat cyan placeholder with emission; the real glow, the "SF"
glyph, and the light beams are added in the runtime shader, so do NOT paint
an SF logo or draw beams here.

DO NOT move the origin (disc centre) or the socket.beamOrigin* empties.
Keep it readable at ~200 px tall on screen.
```

---

## 4. Object: **HubDesk** (Blender) — art-refinement prompt

```
Refine the HubDesk object (already scaffolded: a 1.62 m radius cylinder with
its TOP surface at y=0, an emissive rim ring, and the dock + Sparky-seat
sockets).

SHAPE: a warm, rounded "forge station" pedestal, not a plain cylinder. Give
the top edge a soft 2–3 cm rounded bevel; taper the body slightly inward
toward the base; add one or two calm concentric inset panels on the top
surface radiating from the centre emitter well (where SfEmitter sits). A
shallow circular recess at the exact centre seats the emitter. Optional: a
subtle forward apron/lip on the camera-facing side. Keep <= 60k tris.

MATERIAL: mat.deskMetal — brushed rose-gold / warm cream metal, metallic
~0.55, roughness ~0.42, matching the reference plate's desk. mat.deskEmissive
on the rim ring only, warm gold, low emission (the runtime drives its
intensity and dims it during play). No painted screens, logos, or holograms.

CRITICAL: keep the TOP surface a flat plane at y=0 (Sparky walks on it).
Do NOT move the origin (desk-top centre) or any socket.* empty — the five
sparkySeat sockets and deskDock must stay exactly where the script placed
them, or Sparky and the dock animation will misalign in-engine.
```

---

## 4.3 Objects: **HoloL / HoloC / HoloR** (Spline — optional GUI path)

The screens are intentionally simple (the glass look is a runtime shader). Use Spline only if you want to shape them visually; otherwise the Blender script already emits correct unit planes.

```
In Spline, create three flat rectangular panels named EXACTLY HoloL, HoloC,
HoloR. For each:
- Make a Rectangle / thin plane, ~1 x 1 unit, standing vertical, facing the
  camera (+Z). Give it a real pivot at the BOTTOM-CENTRE of the panel (so it
  tilts and merges from its base, toward the emitter below).
- Slightly round the corners in the mesh is OK but NOT required — the runtime
  shader rounds and glows the edges. Keep it a clean quad with UV 0..1 across
  the face.
- Material: a plain, near-white or pale-cyan placeholder. Do NOT add glow,
  transparency gradients, scanlines, or a fresnel here — all of that is the
  runtime glass shader. Spline's own glass/refraction must be OFF.
- Add an empty/null child named "<PanelName>.contentQuad" at the panel centre.
- Export each as glTF/GLB, +Y up, real-world scale, transforms applied.

Placement/tilt is set in-engine by the layout registry, so export each panel
at the origin, upright, yaw 0. Do not bake the trio spacing into the meshes.
```

Blender fallback for screens: the script's `build_screens()` already produces `HoloScreens.glb` with the three planes named, pivoted, and UV'd — use it if Spline is flaky.

---

## 5. Clips (refinement pass — add after geometry is approved)

Author these as **named actions** (Blender) / **states** (Spline). The big interactive morphs (trio → merged PlayStage, tilt, side-fade) are **engine-driven** by the Director lerping transforms — do **not** bake those. Author only the object-local motion the engine can't infer:

| Object | Clip | Technique | Notes |
|--------|------|-----------|-------|
| SfEmitter | `idle` | shape-key / transform loop | ring slow rotate + gentle core pulse |
| SfEmitter | `ignite` | shape-key + transform, ~300 ms | core rises/brightens as the portal charges |
| SfEmitter | `surge` | shape-key, ~200 ms | quick accent for a combo/win |
| HubDesk | `panelsOpen` / `panelsClose` | armature/transform, ~400 ms | top inset panels iris/slide for an activity |
| HubDesk | `deskDock` | armature/transform, ~600 ms | dock state for Sparky "connect" (pairs with a Sparky clip in-engine at `socket.deskDock`) |
| HoloL/C/R | `idle` | shape-key (subtle) | ≤ 1% breathe; optional |

Name clips exactly as above (no spaces). Bake at 30 fps. Keep them scrubbable (author eases) so the engine can play them forward/back and interrupt them.

---

## 6. Export → optimise → governance

1. Export each object: **File ▸ Export ▸ glTF 2.0** — Format **GLB**, **+Y up**, **Apply Modifiers**, **Selection Only**, **Custom Properties ON**, **Animations ON**.
2. Compress with the repo's existing pipeline: `npm run optimize:3d` (Draco geometry + KTX2 textures; the desk is the only textured object — screens/emitter ship no baked texture).
3. Place the optimised GLBs under `public/forge-hub/world/objects/` (`HubDesk.glb`, `SfEmitter.glb`, `HoloScreens.glb`).
4. **Governance (owner-gated art):** add each GLB's SHA to `public/forge-hub/SHA256SUMS`; commit the Blender/Spline **source** to Git LFS. `public/forge-hub/` is byte-locked — new assets land only with the owner's AP-002 approval (granted). Never regenerate in place without a new packet. Run `cd public/forge-hub && sha256sum -c SHA256SUMS` before/after.

---

## 7. Acceptance checklist (the agent must report all of these)

For **each** GLB, confirm and report:

- [ ] Object names exact: `HubDesk` / `SfEmitter` / `HoloL,HoloC,HoloR`.
- [ ] All sockets present and named exactly (deskDock, 5× sparkySeat, 3× beamOrigin, 3× contentQuad).
- [ ] Units metres; **+Y up**; transforms applied; origins correct (desk-top centre / disc centre / screen bottom-centre).
- [ ] Triangle count within budget (desk ≤ 60k · emitter ≤ 20k · each screen ≤ 8k) — report the numbers.
- [ ] Material families ≤ 6 total; names exact; **no baked glow/emission haze/holograms**; Spline glass/refraction OFF on screens.
- [ ] Screens: clean quad, UV0 spans 0..1, upright, yaw 0, pivot bottom-centre.
- [ ] Clips (if this pass): named exactly, 30 fps, scrubbable.
- [ ] File sizes reported; desk texture KTX2; Draco on.
- [ ] Renders sanely at the fixed camera (a screenshot at pos `[0,1.32,4.35]` looking at `[0,0.78,-0.2]`, fov 38).

Final placement and the SSIM ≥ 0.96 check happen in-engine once the new background plate is supplied and the objects are dropped onto it (P1/P4 gates). The agent's job ends at spec-clean, budget-clean GLBs.
