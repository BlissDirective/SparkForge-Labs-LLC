# R3F + variation plan (unified) — 2026-09-11

**Visual lock:** `LOCKED_HUB` (no Sparky dock on plate)  
**Avatar lock:** `LOCKED_SPARKY` (enters as hologram/overlay)  
**Product:** this forge = welcome + main + control (no marketing hero page)  
**Engineering spine:** `Phased-R3F-Hub-Plan.md` (phases 0–6)  
**Motion vocabulary:** `FORGE_MOTION_BRAINSTORM.md` (updated below)

---

## 1. Architecture (v1 — confirmed)

| Layer | What | Notes |
|-------|------|--------|
| World | Desk + flat SF emitter + lab (mesh or plate+parallax) | Match LOCKED_HUB camera |
| Screens | 3 glass quads + `@react-three/drei` `Html` | Real React UI on glass |
| Motion | Named morph states (spring/lerp) | Same stage, no free-look |
| Sparky | Overlay / billboard / small mesh near SF or panel lip | **Not** desk hardware |
| Heavy games | Exit or dim forge → Phaser/Pixi | Perf |
| Parent/billing | `EscapeFlat` 2D | Don’t force 3D |
| **Not v1** | Pixel Streaming, free camera, Unity WebGL | Cost / complexity |

Bridge: keep PR #164 `/dev/forge-lab` hotspot behind a flag until R3F room shell ships.

---

## 2. Module catalog (unchanged, Sparky retargeted)

| Module | Role |
|--------|------|
| `HoloL` / `HoloC` / `HoloR` | Three primary glass panels (LOCKED_HUB trio) |
| `PlayStage` | 3→1 mega glass when needed |
| `CorePortal` | SF emitter (world) — bloom / emit only |
| `SparkyOverlay` | Locked Sparky — tip, point, whisper, cheer |
| `ToastRail` | Edge chips |
| `EscapeFlat` | Full-viewport 2D escape |

Drop `SparkyDock` world mesh from v1.

---

## 3. Morph states ↔ R3F modes

| Variation (art) | R3F mode | Layout | Sparky overlay |
|-----------------|----------|--------|----------------|
| **A Welcome** | `welcome` | Large center + 2 smaller sides *(target; locked plate is ~equal trio — morph on first paint or idle)* | Float near SF / lower-right of C; idle wave |
| **B Browse** | `hubSplit` | 3 clearer destinations (Hub / Labs / Games) | Points at hovered panel |
| **C Focus** | content deep-dive | C ~70–80%; sides yaw/tuck | Looks at C |
| **D Dual** | choose/compare | Two mid; C strip | Between panels |
| **E Lab bench** | `labsBrowse` / make | Wide work C; tools on sides | Helps at tool side |
| **F Game arena** | `gameLobby` → exit/`playStage` | Stage C; score/friends sides | Cheers at stage edge |
| **G Whisper** | coach tip | Panels dim/small | Dominates near SF |
| **H Emit burst** | `cinematic` | Dissolve → reform | Rides beam briefly |

Flow:
```
welcome ⇄ hubSplit ⇄ authMerged
              ↓
    labsBrowse / gameLobby / avatarStudio
              ↓
         playStage → hubSplit
```
`Emit burst` can punctuate any mode change.

---

## 4. Motion vocabulary (implementation hooks)

| Token | Behavior | Duration |
|-------|----------|----------|
| `sfBloom` | Cone from SF → panels brighten | 0.4–0.8s |
| `panelBreathe` | Scale 98–102% + scanline | idle loop |
| `yawTuck` | Sides ±8–15° on Focus | morph |
| `slotSlide` | Arc move, same Z plane | morph |
| `glassWipe` | Content enter | 0.3–0.5s |
| `sparkyPing` | Soft glow when addressable | pulse |
| `sparkyHop` | Squash/stretch to new overlay anchor | 0.25s |
| `morphDissolve` | Borders stay; glass re-layout | transition |

**Reduced motion:** skip dissolve/hop; crossfade layouts only.

---

## 5. Sparky as overlay (no dock)

**Anchors (pick in Phase 2):**
1. `nearSF` — slightly right of emitter, above desk (default Welcome)
2. `panelLip` — bottom edge of active panel
3. `whisperCenter` — lower center, panels dimmed

**Tech options (decide Phase 5):** Rive / Lottie / textured billboard / simple GLB. Start with `LOCKED_SPARKY` billboard + 3–4 poses.

**Rules:** never primary nav; tap → Whisper tip; don’t occlude glass hit targets.

---

## 5b. Screen inventory
Done: `SCREEN_INVENTORY.md` (live routes → mode/module/placement).

## 6. Phased build (next concrete work)

| Phase | Deliverable | Done when |
|-------|-------------|-----------|
| **0 Spec** ← *now* | This doc + screen inventory | Modes agreed |
| **1 Room shell** | R3F scene ≈ LOCKED_HUB; SF; fixed cam; empty glass; **no dock** | Looks like lock |
| **2 Screen kit** | Html on 3 quads + morph API (`welcome`/`hubSplit`/`focus`) | One React panel locked to mesh |
| **3 Welcome home** | Site root = forge welcome; Hub/Labs/Games browse | Navigable mock |
| **4 Auth + PlayStage** | Forms on glass; 3→1 stage | Sign-on + large stage |
| **5 Content + Sparky** | Real labs/lobby; SparkyOverlay wired | Parity flows |
| **6 Polish** | Emit timing, a11y, mobile, flag cutover | Ship behind flag |

**Flag:** e.g. `NEXT_PUBLIC_FORGE_LAB_R3F` (default off).

---

## 7. Open decisions (need your call)

1. **Welcome layout:** morph from locked equal-trio → large-C+2-small on load, or redesign later stills first?
2. **Side panels:** only shrink/yaw, or may leave frame?
3. **Sparky default anchor:** `nearSF` vs `panelLip`?
4. **Phase 1 start:** Cloud Agent room-shell spike on `setup-sparkforge-dev`, or more variation stills first?

---

## 8. Suggested next 48h (if you pick “build”)

1. Screen inventory one-pager (every live route → mode + modules)
2. Phase 1 spike: fixed cam + LOCKED_HUB plate/mesh + 3 empty glass quads
3. Wire `welcome` ↔ `hubSplit` morph with stub Html
4. Hold Sparky until Phase 5 (billboard ok earlier for vibe)
