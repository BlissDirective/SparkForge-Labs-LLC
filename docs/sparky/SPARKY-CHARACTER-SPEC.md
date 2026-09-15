# Sparky Character Spec — v1.0

**Status:** ACTIVE master spec (2026-09-14)
**Visual authority:** `public/forge-hub/sparky/LOCKED_SPARKY.png` (SHA in `public/forge-hub/SHA256SUMS`). Where this text and the image disagree, the image wins and this text is corrected.
**Lock doc:** `docs/forge-hub/LOCKED_SPARKY.md`
**Build plan:** `docs/forge-hub/TRANSITION_ACTION_PLAN.md` W3, §2.8, §2.8a, §2.8b, §6, §6b
**Supersedes:** `docs/sparky/_SUPERSEDED/SPARKY-RIVE-SPEC.md` (§2, §3, §6 of that file carried forward in §9 below)

This document is the contract between the owner, the character artists, and the engineers. It is written so that an artist can model, rig, and animate Sparky without asking a question, and so that an engineer can integrate the result without opening the source file. Anything not specified here is the artist's call, subject to the owner's approval at the checkpoints in §11.

---

## 1. Character

**Sparky** is a friendly, curious, slightly bouncy robot who lives on the desk of the Hologram-Forge Hub. He is the kid's guide, cheerleader, and tutor. Ages 7 to 16 must all find him appealing: cute enough for seven, cool enough for sixteen. He never scolds, never sulks for long, never blocks the kid's way.

### 1.1 Proportions (from the concept)
- Total height 1.0 unit (see §3.1 for scale). Head ≈ 0.33, torso ≈ 0.30, legs and boots ≈ 0.37.
- Head is a rounded, slightly squashed sphere with a flat face plane. Shoulders are wide relative to the waist. Forearms and shins are chunky cylinders with rounded caps. Boots are large, rounded, forward-heavy.
- Hands: five fingers, rounded, capable of an open palm (as in the concept), a point, a fist, and a thumbs-up.

### 1.2 Materials
| Zone | Look | Notes |
|---|---|---|
| Shell (head, torso, shoulder caps, forearms, thighs, shins, boots) | Coral, glossy, slight subsurface warmth, soft specular | One material, one colour, so outfit packs can recolour by variant |
| Joints and mechanics (neck, shoulders, elbows, wrists, hips, knees, ankles, ear housings, inner seams) | Matte black, low specular | One material |
| Emissives (face screen glow, chest badge "S", head dome, ear disc rings, boot sole lights) | Cyan, emissive, bloom-friendly | Separate material per zone so each can pulse independently |
| Face screen base | Black, slightly glossy, rounded rectangle | The dynamic face texture is applied here (§5) |
| Head dome | Translucent cyan, refractive, with an inner sparkle | Emissive intensity is animated by the chat state (§7.4) |
| Decals (lightning bolts, "S" glyph) | Yellow bolts, cyan "S" | Authored as a separate decal texture layer on the shell UV so outfit packs swap them (§8.3) |

Colour values are sampled from the locked image at integration time and written into `src/config/sparkyPalette.ts` by the engineer; the artist matches the image, not a hex list.

### 1.3 What is fixed, what is free
- **Fixed:** everything visible in the concept, the head dome as an uncovered emitter, the face-as-screen, the decal positions, five fingers.
- **Free:** the back of the character (never seen in the concept), seam placement, exact boot tread, the inside of the dome, how the sparkle is built.

---

## 2. Deliverables

| # | Deliverable | Format | Where |
|---|---|---|---|
| D1 | Turnaround sheet (front, three-quarter, side, back) and expression sheet | PNG | `public/forge-hub/sparky/derived/` with SHAs after approval |
| D2 | Blocking model | Blender `.blend` | assets repo or Git LFS (§10) |
| D3 | Final model, UVs, textures | `.blend` + PNG texture sources | assets repo or Git LFS |
| D4 | Rig | in the `.blend` | assets repo or Git LFS |
| D5 | Clip library | actions in the `.blend`, exported as GLB animations | assets repo or Git LFS |
| D6 | Runtime GLB (base character) | glTF 2.0 binary through `npm run optimize:3d` (Draco or meshopt geometry, KTX2 textures) | `public/models/sparky/sparky.glb` |
| D7 | Outfit packs | one GLB per pack + `pack.json` | `public/models/sparky/outfits/<pack-id>/` |
| D8 | 2D stills and sprite sheets | PNG, rendered from D6 | `public/forge-hub/sparky/derived/2d/` |
| D9 | Sidecar manifest per GLB | `.md` naming the source `.blend` commit and the tool versions | next to each GLB |

---

## 3. Modelling

### 3.1 Scale and orientation
- glTF units are metres. Sparky's total height, boots to crown of the dome, is **0.40 m** (he is a desk companion; the desk plane in the room is at y = 0 and the holograms float above him).
- Origin at the centre of the boots' contact patch, on the floor. +Y up, faces −Z (glTF forward), so that "facing the camera" needs no correction in code.
- Rest pose: A-pose, arms at about 30°, fingers relaxed, feet shoulder-width, dome sparkle centred.

### 3.2 Budgets
| Item | Budget |
|---|---|
| Triangles, base character | ≤ 25 000 (target 18 000) |
| Triangles, any outfit pack | ≤ 6 000 |
| Bones (deforming) | ≤ 60 |
| Materials on base | ≤ 8 (shell, joints, face base, dome, chest emissive, ear emissive, boot emissive, decal layer) |
| Textures on base | two 2048 × 2048 sets (colour + roughness/metal/AO packed) plus one 1024 decal layer; delivered as PNG, compressed to KTX2 by the pipeline |
| Runtime GLB size | ≤ 3 MB after compression |
| Skinning influences | ≤ 4 per vertex |

### 3.3 Topology rules
- Quads in the source, clean loops at every joint so squash-and-stretch on a chibi body deforms without pinching.
- The face plane is a separate, slightly recessed mesh with its own UV island filling the full 0–1 space (the dynamic texture maps to it 1:1).
- The head dome is a separate mesh parented to the head bone, with its own material, so it can pulse, and so the outfit rule (§8.4) can be enforced by geometry checks.
- Ear discs, chest badge plate, boot sole lights: separate meshes with their emissive materials, parented to the nearest bone.
- No overlapping UVs on the decal layer. Bolts and the "S" glyph are placed on the decal UV so a pack can swap the whole layer.

---

## 4. Rig

### 4.1 Skeleton (naming is a contract)
Use exactly these names. Engineering resolves them by name at runtime.

```
root
└─ hips
   ├─ spine
   │  └─ chest
   │     ├─ neck
   │     │  └─ head
   │     │     ├─ holoEmitter          (dome socket; animate scale/glow only, never hidden)
   │     │     ├─ faceScreen           (face plane; no deformation, used for look-at tilt)
   │     │     ├─ earDisc.L
   │     │     └─ earDisc.R
   │     ├─ shoulder.L → upperArm.L → foreArm.L → hand.L → [thumb.L.01, thumb.L.02, index.L.01, index.L.02, middle.L.01, middle.L.02, ring.L.01, ring.L.02, pinky.L.01, pinky.L.02]
   │     └─ shoulder.R → (mirror)
   ├─ thigh.L → shin.L → foot.L → toe.L
   └─ thigh.R → (mirror)
```
Total deforming bones: 47. Add helper and IK bones freely in the source; do not export them.

### 4.2 Sockets (empties parented to bones, exported as named nodes)
| Socket | Parent | Use |
|---|---|---|
| `socket.crown` | head | Hats and crowns as rings around the dome (see §8.4) |
| `socket.faceRim` | head | Glasses, masks, goggles pushed up |
| `socket.ear.L` / `socket.ear.R` | earDisc.L / .R | Earmuffs, headphones |
| `socket.neck` | neck | Scarves, collars, bow ties, capes (cape cloth may also skin to chest and spine) |
| `socket.chest` | chest | Badge plate swaps, stickers, name tags |
| `socket.back` | chest | Backpacks, wings, jetpack |
| `socket.hand.L` / `socket.hand.R` | hand.L / .R | Held props (wand, mug, sparkler, hammer) |
| `socket.boot.L` / `socket.boot.R` | foot.L / .R | Boot covers |
| `socket.holoBubble` | holoEmitter | The chat hologram's anchor point, 0.06 m above the dome apex |

### 4.3 Controls
- IK on arms and legs with FK switch; foot roll; a single `look` target that drives head and eyes (engineering overrides look at runtime via `faceScreen`, so bake head-look only into cinematic clips).
- Squash-and-stretch controls on head and torso (chibi timing). Exported clips bake these into bone scale; keep scale non-uniform only on `head`, `chest`, and `hips`.
- Face has **no** rig controls. Expressions are the dynamic texture (§5).

---

## 5. Face screen

The face is a texture, not geometry. This keeps the nine expressions identical across 3D, in-game 2D, and the compact-tier shell, and costs no facial rigging.

- **Source of truth:** `src/components/sparky/SparkyCore.tsx` redrawn in LED-dot style (plan W3 step 3). Engineering renders that SVG to a canvas texture at 512 × 512 and applies it to the face plane's emissive channel.
- **Expression set (unchanged names and glow colours):** `idle` cyan, `happy` green, `thinking` yellow, `speaking` magenta, `excited` orange, `sleepy` lavender, `sad` blue, `celebrating` yellow, `surprised` orange. Eyes and mouth are dot-matrix; the glow colour tints the whole screen.
- **Blink and micro-motion:** procedural (eye rows dim for two frames every 3 to 6 s; mouth dots shimmer while speaking).
- **Look-at:** procedural tilt of `faceScreen` (≤ 8°) plus eye-dot offset in the texture, aimed at the active panel, the hovered panel, the HoloBubble when it is open, or the pointer.
- **Artist deliverable for the face:** the black screen base, its bezel, and the UV island. No painted eyes.

---

## 6. Animation clips

All clips at 30 fps, exported as named glTF animations. Loops must be seamless. Every non-loop clip must be interruptible at any frame (the runtime blends out over 120 ms). Timings are targets; the animator may adjust ± 20 %.

| Clip name | Type | Length | Notes |
|---|---|---|---|
| `idle.a` | loop | 4 s | Weight shift, gentle bob, dome sparkle drift |
| `idle.b` | loop | 5 s | Looks around, small stretch; runtime alternates with `idle.a` |
| `breathe` | additive loop | 3 s | Subtle chest scale; layered on everything except `sleep` |
| `walk` | loop, root motion | 1 s / cycle | Chibi walk, 0.25 m per cycle; runtime scales playback to distance |
| `turn.L` / `turn.R` | one-shot, root rotation | 0.4 s | 90° in place |
| `wave` | one-shot | 1.2 s | Right hand, matches the concept's raised palm |
| `point.L` / `point.R` | hold with intro | 0.4 s in, hold, 0.3 s out | Arm extends toward the side panel; runtime aims the hand with IK |
| `cheer` | one-shot | 1.5 s | Both arms up, jump, dome flash |
| `whisper` | hold with intro | 0.5 s in, hold, 0.4 s out | Leans toward camera, hand cupped by the face |
| `sit` | hold | 0.6 s in | Sits on the desk edge, legs swinging loop |
| `sleep` | loop with intro | 1.0 s in, 6 s loop | Curls up, dome dims, face `sleepy` |
| `surprised` | one-shot | 0.6 s | Hop back, arms out |
| `sadNod` | one-shot | 1.2 s | Slump then recover with a nod ("you've got this") |
| `lookAround` | one-shot | 2.5 s | Curious scan, used when the kid is idle |
| `tapReact` | one-shot | 0.8 s | Reaction to being clicked: wobble and giggle pose |
| `thinking` | loop | 3 s | Hand to chin, dome pulses slowly |
| `outfitSwap` | one-shot | 0.9 s | Spin with a dome flash; outfit meshes swap at frame 14 |

Cinematic clips (first-visit ignition, level-up) are authored later against the Theatre.js beats and are not part of this base delivery.

---

## 7. Behaviour (engineering; here so the animator knows how clips are used)

### 7.1 Desk spots
Named positions on the desk plane, in room coordinates, set in `src/config/sparkySpots.ts`: `nearCore` (default), `leftLip`, `rightLip`, `frontCenter`, `behindCore`. Sparky walks between them with `walk` and `turn.*`; never teleports except under reduced motion.

### 7.2 State machine
`idle → attend(panel) → react(event) → return`, with `sleep` and `whisper` as overriding states. Inputs: forge mode, active and hovered panel, `JuiceProvider` game events (`comboTier`, `celebrate`, `encourage`, `thinking`), HoloBubble state, local time versus the profile's bedtime, outfit calendar.

### 7.3 Reaction map
| Event | Clip | Face | Extra |
|---|---|---|---|
| Panel hovered on the left or right | `point.L` / `point.R` from the nearest lip | `happy` | Beam brightens on that panel |
| Panel focused | look-at only | `idle` | — |
| `celebrate` | `cheer` | `celebrating` | Chest badge pulse, emitter burst |
| `encourage` | `sadNod` | `sad` → `happy` | HoloBubble tip |
| `comboTier` 2–3 | `idle.b` faster, then `cheer` at tier 3 | `excited` | — |
| `thinking` true | `thinking` | `thinking` | — |
| Kid idle > 45 s | `lookAround` | `idle` | HoloBubble `ping` |
| After bedtime | `sleep` | `sleepy` | Dome dims; Pajamas pack if enabled |
| Clicked or tapped | `tapReact` | `surprised` → `happy` | HoloBubble opens in `tip` |
| Whisper mode | `whisper` at `frontCenter` | `speaking` | Main panels dim |

### 7.4 HoloBubble coupling
The dome's emissive intensity follows the bubble state: 0.3 hidden, 0.6 ping, 1.0 tip and chat, 1.2 whisper. The bubble anchors at `socket.holoBubble` and is rendered by the panel system (plan §2.8b), not by the character asset.

---

## 8. Outfit packs

### 8.1 Pack format
```
public/models/sparky/outfits/<pack-id>/
  pack.json        id, name, group (seasonal|halloween|holiday|occasion|unlockable),
                   window or trigger, attachments[], materialSwaps{}, decalLayer?, clip?, size
  <pack-id>.glb    attachment meshes named by socket (e.g. "att.crown", "att.hand.R"),
                   optional extra clip
  decal.png        optional replacement decal layer (bolts → theme), 1024 × 1024
  thumb.png        256 × 256 for the outfit rack in avatarStudio
```
### 8.2 Rules
- ≤ 6 000 triangles, ≤ 500 KB compressed per pack. One 1024 texture at most.
- Attachments are rigid meshes parented to sockets. Cloth (capes, scarves) may skin to `neck`, `chest`, `spine` only.
- A pack may recolour the shell material (`materialSwaps.shell`) and replace the decal layer. It may not change the face, the dome, the joints, or the silhouette of the hands.
- Every pack must play cleanly through all §6 clips with no interpenetration at the held poses of `wave`, `point.*`, `cheer`, `whisper`, `sit`, `sleep`.
### 8.3 Decal themes
Bolts and the "S" plate are the cheap re-theme: bats (Halloween), snowflakes (winter), stars (Fourth of July), hearts (Valentine), clovers, petals, suns, maple leaves, candy canes. Delivered as the pack's `decal.png` on the base decal UV.
### 8.4 The dome rule
**Nothing covers the head dome.** Crown attachments are rings around the dome or have a circular cutout of at least the dome diameter plus 10 %. Engineering runs a geometry check on import: any attachment vertex inside the dome's bounding sphere fails the pack.
### 8.5 Year-one catalog
See `docs/forge-hub/TRANSITION_ACTION_PLAN.md` §6b for the 27 packs, their windows or triggers, contents, and clips, and the production order (First Day and Sharp Suit first).

---

## 9. 2D counterparts and the in-game contract

- **2D stills and sprite sheets** are rendered from the runtime GLB (three-quarter front, 512 px, transparent) for every expression and for the key poses `idle`, `wave`, `point.L`, `point.R`, `cheer`, `thinking`, `sleep`. Used by the compact-tier shell, the poster fallback, and the in-game 72 px mount when no `.riv` exists.
- **In-game Rive contract (carried forward unchanged):** state machine `SparkyMachine`; inputs `comboTier` Number 0–3, `celebrate` Trigger, `encourage` Trigger, `thinking` Boolean; 200 × 200 artboard, transparent, reads at 72 px; triggers ≤ 1 s and interruptible; runtime `@rive-app/react-canvas` v4; names are case-sensitive. If a `.riv` is authored it must depict this character, not the orb.

---

## 10. Source control and pipeline

- **Sources** (`.blend`, texture PSD or Krita files, reference sheets): a separate `SparkForge-Sparky-Assets` repository, or Git LFS in this repository if the owner prefers one repo. Never commit `.blend` files to this repository without LFS.
- **Runtime assets** (`.glb`, KTX2, PNG stills): this repository under `public/models/sparky/` and `public/forge-hub/sparky/derived/`, always with a sidecar `.md` naming the source commit and tool versions.
- **Pipeline:** Blender 4.x export (glTF 2.0, +Y up, apply modifiers, export animations as separate actions, no cameras or lights) → `npm run optimize:3d` (existing script: Draco or meshopt geometry, KTX2/Basis textures) → import check script (bone names, socket names, dome rule, budgets) → `/dev/forge-hub` character panel for visual review.
- **Tool versions** are pinned in the sidecar manifest; a re-export with different versions is a new sidecar.

---

## 11. Owner checkpoints (HS-5 pattern)

| # | Gate | What the owner reviews | Pass condition |
|---|---|---|---|
| C1 | Turnaround and expression sheet | D1 | Reads as the locked concept from every angle; nine faces are unmistakable at 72 px |
| C2 | Blocking model in the room | D2 rendered on the desk in `/dev/forge-hub` | Scale and silhouette feel right beside the holograms |
| C3 | Final model and materials | D3 turntable and a still against the plate | SSIM ≥ 0.90 against a matched crop of the concept; coral, cyan, and yellow read correctly under the room light |
| C4 | Rig and clip library | D4 and D5 played in `/dev/forge-hub` | Every clip in §6 present and named; no pinching; interruptible blends look natural |
| C5 | Runtime GLB and behaviour | D6 in the hub, reacting to real events | Budgets met; reaction map §7.3 verified; dome rule enforced |
| C6 | Each outfit pack | D7 in the outfit rack and in every held pose | Pack rules §8.2 and §8.4; thumbnail approved |
| C7 | 2D stills | D8 in the compact shell and a game | Matches the 3D look; 72 px legible |

No deliverable goes past a checkpoint without the owner's written approval in the PR that adds it.

---

## 12. Glossary
- **Dome:** the translucent cyan module on Sparky's crown; the chat emitter.
- **HoloBubble:** the small hologram projected from the dome that carries all Sparky conversation.
- **Spot:** a named position on the desk Sparky can walk to.
- **Pack:** an outfit bundle (GLB + `pack.json`).
- **Plate:** the locked room image, `public/forge-hub/world/LOCKED_HUB.jpg`.
