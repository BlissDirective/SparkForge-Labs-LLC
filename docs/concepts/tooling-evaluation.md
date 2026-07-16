# Tooling Evaluation — Higgsfield vs OMMA vs Rive (for SparkForge)

*Research + recommendation for the Part IV build. Decision input, not a commitment.*

## The distinction that decides everything

Before comparing features, sort each tool into one of three buckets — because
integration risk, ownership, and the §IV.2 guardrails hinge on it:

| Bucket | What it means | Guardrail exposure |
|---|---|---|
| **Runtime dependency** | ships *inside* the app; renders live on the user's device | must satisfy perf/SSR/a11y/fallback rules directly |
| **Build-time asset tool** | generates files (video, images, models) we *own* and embed | low — assets are vetted once, then static |
| **Code/scene generator** | emits code or a live scene we import | high — inherits whatever substrate it generates |

- **Rive** = *runtime dependency* (and authoring tool). Already in the stack.
- **Higgsfield** = *build-time asset tool* (generative video/image/audio).
- **OMMA** = *code/scene generator* (Spline → WebGL/WebGPU Three.js) or asset tool.

The principle for a bespoke, guardrailed, kids' app: **prefer tools that give you
assets you own and runtimes you control** over platforms that own the runtime or
the hosting. That ordering alone predicts the verdicts below.

---

## 1. Rive — ADOPT / EXPAND (already yours)

**What it is:** a design + animation + **state-machine** engine. Authoring in the
Rive editor; ships as tiny `.riv` files played by open runtimes. Powers Duolingo,
Disney, Google, Spotify (2B+ users). Already in this repo as
`@rive-app/react-canvas`, and already the specified pipeline for the Sparky
mascot (9 poses + `SparkyMachine` inputs, per `docs/SPARKY-RIVE-SPEC.md`).

**Output / integration:** `.riv` (vector, up to ~90% smaller than equivalent
Lottie/AE), React runtime, DOM/canvas. State machines mean *interactive* (react
to hover/progress/combo), not just linear playback. Files **don't phone home and
keep working forever**, independent of any subscription.

**Fit against the guardrails:** excellent. Canvas-based but tiny and deterministic;
pairs naturally with a parallel-DOM/ARIA layer; trivially flag-gated and
revertible; the `.riv` is the same on every device (no WebGPU dependency). It is
the *correct* tool for: Sparky, the diorama "apparatus creatures," and the
signature moments (badge forge, hologram, level-up) as authored interactive
vector rather than hand-coded SVG.

**Cost/licensing:** editor is a cheap flat sub — Free (3 files), **Cadet $9/mo**
(unlimited exports), Voyager $32, Enterprise $120. Runtimes are free; exported
`.riv` keeps working forever. Predictable, no per-render credits, no
train-on-your-data clause. Kid-safe: *you* author every frame — zero generative
surprise.

**Verdict:** the clear winner and it's already in your stack. Expand it: it is the
backbone for Sparky + interactive vector across every concept in `docs/concepts/`.
One Cadet seat unblocks shipping authored `.riv` work.

---

## 2. Higgsfield — NARROW, build-time only (marketing/media), with hard caveats

**What it is:** an AI-native **generative media** suite — text/image → **video**,
images, and voice (Seedream, Cinema Studio, plus Sora 2 / Kling / Veo access),
40+ cinematic VFX presets, upscaling, and a Claude-MCP/After-Effects pipeline.
It is **not** a UI, component, or code tool — it produces **media assets** (MP4,
images, audio).

**Where it could help SparkForge:** strictly as a *build-time asset generator* for
non-interactive surfaces — a marketing **hero background video**, the **MP4-poster
fallbacks** the fidelity ladders already call for (e.g. Prism/Forge hero on
no-WebGPU devices), and rapid **moodboard/concept** frames during the
art-direction sprint. Its output drops into `<video>`/`<img>` — no runtime
coupling, low integration risk.

**Why it is NOT core, and the caveats that matter for a kids' product:**
- **It can't build the app.** No components, no interactivity, no code — it makes
  clips. It touches *marketing polish*, not the learning surfaces.
- **Provenance & moderation.** Every asset a child sees must be vetted. Generative
  video can hallucinate detail, drift from brand, or embed artifacts you didn't
  intend — each clip needs human review + ideally C2PA provenance. It cannot feed
  an unmoderated pipeline.
- **Brand/Sparky consistency.** Generative video will *not* match the SparkyCore
  vector identity; keep Sparky in Rive, never in Higgsfield.
- **Licensing.** Paid plans grant commercial-use rights, **but** the terms grant
  Higgsfield a license to use your inputs/outputs to train their models — a real
  consideration before feeding brand assets in. Free tier watermarks.
- **Cost model:** credit-based — Free (watermark, ~10 credits/day), **Starter
  $15/mo**, **Plus $49/mo**, **Ultra $129/mo**; credits don't roll over.

**Verdict:** optional, build-time only. Useful for one or two marketing/hero video
surfaces and fallback posters — behind human review and provenance. Do **not** put
AI-generated video inside the learning content, and do **not** use it for Sparky
or UI. Low priority relative to Rive.

---

## 3. OMMA — concept/asset generation only; do not adopt as a runtime

**What it is:** Spline's AI "canvas" — prompt → interactive 3D scenes, sites, games;
parallel agents generate code, images, 3D. Formats: GLB/GLTF/OBJ/SVG/PNG/MP4.
Exports **code for Vanilla/React/Next** via a Code API and is self-hostable.

**The catch (unchanged from `docs/IV-A-living-lab-spec.md`):** its native runtime
is the **Spline WebGL/WebGPU Three.js** engine. An OMMA "scene" dropped on a
dashboard route is exactly the substrate §IV.2 restricts — non-SSR, canvas (not
DOM/ARIA), GPU-bound — and reopens the abandoned-cockpit failure mode. Its
React/Next "export" is a component *backed by the Spline runtime*, so exporting
doesn't remove the substrate problem.

**Where it could earn a narrow pilot:** as an **asset/concept generator** only — it
exports SVG/PNG/GLB, which can feed the reference-art pipeline in the concept docs
(then re-drawn/conformed to style, SVGO'd). Never import an OMMA scene onto a
route.

**Why it's the lowest priority here:** you already own the better, safer version of
what OMMA's runtime does — **React-Three-Fiber + drei + postprocessing + WebGPU/TSL**
are in your stack, under your control, inside your perf/a11y/fallback discipline.
OMMA would hand you a scene you *don't* control on a substrate you've deliberately
bounded. **Cost:** Free (50 credits, 5 chats/mo, no 3D gen), **Professional
$29/mo**, Max per-seat, Enterprise; 3D generation burns credits fast.

**Verdict:** not for the UI or as a runtime. At most an occasional concept/asset
spigot, and even then your own R3F + an illustrator produce more on-brand, more
controllable results. Skip unless a specific asset need appears.

---

## Comparison against the existing stack

| Need | Existing stack | Higgsfield | OMMA | Rive |
|---|---|---|---|---|
| Mascot (Sparky) + interactive vector | Rive (+ SparkyCore SVG) | ✗ off-brand | ✗ | ✅ **the tool** |
| Bounded 3D scenes / dioramas | R3F + drei + postprocessing + WebGPU/TSL | ✗ | ◐ but wrong substrate/ownership | — |
| Signature moments (forge, hologram) | Rive / Theatre.js / GSAP | ◐ as video only | ✗ | ✅ authored interactive |
| 2D games | Pixi 8 + bespoke | ✗ | ◐ generates, you don't own | ◐ UI/FX layers |
| Motion / sequencing | motion/react + GSAP + Theatre.js | ✗ | ✗ | — |
| Marketing hero video / MP4 fallbacks | (none — a real gap) | ✅ build-time asset | ◐ | ✗ |
| Concept moodboards | — | ✅ fast | ✅ fast | — |

**Reading:** your in-house stack already covers runtime 3D, 2D games, motion, and
sequencing better and more safely than OMMA. Rive fills the mascot/interactive-
vector role (already planned). The one genuine *gap* these tools fill is
**pre-rendered marketing/hero video + poster fallbacks**, which Higgsfield does
well — as vetted, build-time assets.

## Recommendation (ranked)

1. **Rive — adopt/expand now.** It's already yours and already the plan. Grab one
   Cadet seat, author Sparky + the interactive-vector layer of whichever concept
   wins. Highest fit, lowest risk, kid-safe by construction.
2. **Higgsfield — optional, build-time only.** Use for a marketing hero video and
   MP4-poster fallbacks *behind human review + provenance*; never in learning
   content, never for Sparky/UI. Mind the train-on-your-data license.
3. **OMMA — skip for build; concept/asset spigot at most.** Your R3F stack already
   does its runtime job, under your control and inside the guardrails.

**Through-line:** own your runtime (R3F + Rive + Pixi), rent only *assets* you can
vet (Higgsfield video), and never import a scene you don't control onto a route
(OMMA). That keeps the "never get locked out of your own app again" promise intact.

## Sources

- Higgsfield: <https://higgsfield.ai/>, <https://higgsfield.ai/pricing> · pricing/license reviews: imagine.art, costbench.com, flowith.io
- OMMA / Spline: <https://omma.build/>, <https://omma.build/pricing>, Spline changelog + docs (Exporting as Code), splinetool/react-spline
- Rive: <https://rive.app/>, <https://rive.app/pricing>, help.rive.app/pricing, "Rive's new $9/mo plan"
