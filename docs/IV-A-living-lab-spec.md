# Part IV — Living Laboratory · IV-A Exploration Spec

**Status:** Exploration draft (IV-A) · **Owner decision doc** · Date: 2026-07-13
**Parent:** `Fable-5-SparkForge-Rebuild.md` PART IV (§IV.1 north star, §IV.2 guardrails, §IV.3 workplan)
**Scope of this file:** decide the *rendering substrate*, the *art pipeline*, and *whether OMMA has a role* — then commit to one coded prototype and an exit gate. No code is written here.

> History note we are explicitly not repeating: the pre-2026 era shipped a 37M-triangle 3D "cockpit" UI that had to be abandoned for an HTML-first dashboard. The abandonment is still visible in the codebase — `src/config/feature-flags.ts` exists precisely to toggle "old 3D cockpit UI vs new HTML-first redesign," and `CockpitCanvasGate` short-circuits mobile/tablet to a plain HTML `MobileDashboard`. IV-A must earn its ambition *on top of* that healthy HTML baseline, never by replacing it.

---

## 1. IV-A Goal & Scope

**Goal:** Build **exactly one** lab as a 2.5D illustrated diorama (§IV.1) — behind a feature flag, with the current HTML-first navigation intact as the fallback — and measure it against the current nav before proposing any rollout. IV-A is a *spike*, not a migration. One lab, one signature moment, one flag, fully revertible.

**In scope**
- One lab diorama (recommend **Lab 1** or **Lab 11 *Agentic AI***, whichever has the richest existing art direction) rendered as layered 2.5D.
- One "signature moment" for that lab (per §IV.1 the app's signature moments are lab-entry, badge-forge, level-up — IV-A takes **lab entry / airlock power-up**).
- A flag (`NEXT_PUBLIC_FLAG_LIVING_LAB`, see §5) that, when off, renders today's HTML lab detail unchanged.
- Perf + comprehension measurement against current nav using the existing `tests/e2e/` suite.

**Out of scope for IV-A** (belongs to IV-B/IV-C)
- The walkable floor-plan lab *map* and airlock View-Transition *between* labs (IV-B).
- Converting all 11 labs, DESIGN.md v2 diorama recipes, sound-palette registry (IV-C).
- Marketing homepage windows (IV-D).

### §IV.2 Guardrails — restated as a pass/fail checklist for IV-A

Every IV-A increment must satisfy all of these before it is considered done. These are the non-negotiables copied from §IV.2, made testable:

- [ ] **Progressive enhancement.** The HTML-first skeleton always works. With JS disabled or the flag off, the lab page is today's functional page — no blank canvas, no "enable 3D" wall.
- [ ] **Per-page perf budget: LCP < 2.5s.** The diorama must not push Largest Contentful Paint past 2.5s on a mid-tier device. The LCP element should be HTML/text/an eager poster image, never a script-hydrated canvas.
- [ ] **No WebGL on the dashboard critical path.** The diorama's *baseline* renders with zero WebGL/WebGPU. Any GPU-canvas effect is (a) optional, (b) lazy, (c) off the critical path, (d) never the LCP element.
- [ ] **Guards stay green.** Contrast, spacing, and design-matrix guard tests pass on the diorama exactly as on every other page. Text over illustration must still hit WCAG contrast.
- [ ] **Reduced-motion instant-on.** `prefers-reduced-motion` yields a static, fully-composed "instant-on" state (idle loops paused, parallax frozen, signature moment reduced to a single non-animated end-state). No motion is required to use or understand the page.
- [ ] **Mobile is a first-class diorama.** Mobile is the *same* art-directed scene reflowed — not a stripped card list. (We already ship a real `MobileDashboard`; the diorama must degrade to an equally intentional mobile composition, not to nothing.)
- [ ] **Flag-gated + individually revertible.** The whole increment ships behind one flag and can be reverted alone by flipping it — matching the existing `flag()` pattern (env `NEXT_PUBLIC_FLAG_LIVING_LAB=false` → instant rollback, no code change).

If any box can't be checked, the increment does not ship. This is the cockpit-era lesson encoded.

---

## 2. Rendering Substrate: SVG/CSS vs Pixi (and when to reach for each)

The §IV.1 vision names "layered SVG/Pixi, parallax depth, living idle details (bubbling flasks, blinking consoles)." That "SVG/Pixi" slash is the decision this section closes. Note both are already available: **Pixi.js 8 is in `package.json`**, alongside `motion` 12, `gsap`, `@rive-app/react-canvas` 4, and `three`/R3F.

### Comparison

| Dimension | Layered SVG + CSS/transform (motion/react + GSAP) | Pixi.js (WebGL/WebGPU 2D canvas) |
|---|---|---|
| **Perf vs LCP / no-WebGL rule** | LCP-friendly: SVG/HTML paints immediately, is the LCP element, and needs **no WebGL** — satisfies the critical-path rule by construction. Cost is per-node layout/paint; fine for tens-to-low-hundreds of layers. | A canvas is **WebGL/WebGPU** → forbidden on the critical path by §IV.2. Must be lazy-loaded, non-LCP, and gated. Cheap *per particle* once running; expensive to boot (context + shader compile) and adds jank risk during hydration. |
| **Bundle size** | ~0 new runtime (motion/react + GSAP already shipped). SVG is markup. | Pixi is ~*hundreds of KB* of JS even tree-shaken; already a dependency but not currently on dashboard routes — adding it to a dashboard route *adds* to that route's critical bundle unless code-split. |
| **Animation richness** | Excellent for **layered parallax**, transform/opacity idle loops, staged sequences (blinking consoles, gentle bob, flask glow via CSS `@keyframes` / GSAP timelines). Ceiling: hundreds of simultaneously-animated DOM nodes before compositor strain. | Excellent for **high-count particle systems** (bubbles, sparks, smoke, fluid) — thousands of sprites SVG can't touch. Overkill for a handful of blinking lights. |
| **Maintainability / who can edit** | Any front-end dev edits it; it's DOM + Tailwind + motion props. An illustrator's SVG export drops in directly. Diff-able in git. | Requires Pixi-specific knowledge (stage graph, tickers, textures). Illustrators can't touch it; art arrives as atlases/textures, not editable scene. Fewer people on the team can safely change it. |
| **Accessibility** | **Native win.** SVG is in the DOM: `role`, `aria-label`, `<title>`/`<desc>`, focusable interactive layers, real tab order. Guard tests can assert on it. | **Canvas is an a11y black box** — a single `<canvas>` element, no addressable children. Everything meaningful must be mirrored in a parallel DOM layer. Doubles the work to stay guard-green. |
| **Reduced-motion** | Trivial and reliable: gate CSS/GSAP/motion on `prefers-reduced-motion`; the static SVG *is* the instant-on state. | Must manually stop the ticker and render one static frame; easy to forget a subsystem. Higher risk of violating the instant-on guardrail. |
| **Mobile** | Reflows with the DOM; media queries + relative units; cheap on battery. Same scene, fewer parallax layers. | Full GPU canvas on mobile = battery/thermal + more boot jank on exactly the weakest devices. Contradicts "mobile first-class" if it means "mobile gets a heavy canvas." |
| **SEO / SSR** | SVG/HTML server-renders; content is in the initial HTML. Progressive-enhancement by default. | Canvas renders nothing server-side; content invisible to SSR/crawlers until JS boots. Needs an SSR HTML shadow anyway. |
| **Existing-stack integration** | Directly composes with `motion/react` variants and GSAP timelines already used across the app; View Transitions API for the airlock morph works on DOM. | Lives in its own canvas island; bridging Pixi ticker state to motion/react/GSAP and to View Transitions is manual glue. |

### Recommendation

**Default the IV-A prototype to layered SVG + CSS/transform parallax driven by `motion/react` (with GSAP for the longer signature-moment timeline).** This is the substrate that satisfies the §IV.2 guardrails *by construction*: it is the LCP element, needs no WebGL, is DOM/ARIA-addressable so guards stay green, and its static composition *is* the reduced-motion instant-on state.

**Reserve Pixi (WebGL) for one thing only:** a specific idle effect whose particle count genuinely exceeds what animated SVG nodes can do smoothly — e.g. a dense **bubbling-flask fluid** or a **spark shower** during the signature moment. And even then it must be:
1. Lazy-loaded **after** LCP (dynamic import, `ssr:false`), never the LCP element.
2. Rendered into a small, absolutely-positioned canvas *layer* inside the SVG stack — not the whole scene.
3. Gated by capability + `prefers-reduced-motion` + the feature flag, with an SVG/CSS still-frame fallback.

Concretely: build the *entire* first prototype with **zero Pixi**. Only introduce a Pixi layer if playtest shows a named idle effect that SVG can't sell — and treat that as a scoped, separately-flagged sub-increment.

**Tradeoff being accepted:** SVG caps out at hundreds of animated nodes, so a scene demanding thousands of simultaneous particles everywhere would force Pixi. We are betting the "living lab" reads as alive through *art direction and a few well-placed loops*, not brute particle volume — which is also cheaper, more accessible, and directly reverses the cockpit-era "more polygons = more magic" mistake.

---

## 3. Art Pipeline: Code-Drawn Vector vs Owner-Supplied Reference Art

Two ways to get diorama pixels, mirroring how Sparky is already handled (`SparkyCore.tsx` is pure hand-authored SVG + CSS, the "source of truth," per `docs/SPARKY-RIVE-SPEC.md`).

| Dimension | (a) Code-drawn / hand-authored SVG (SparkyCore vector style) | (b) Owner/illustrator-supplied reference art (SVG export or layered PNGs from Figma/Illustrator/Procreate) |
|---|---|---|
| **Iteration speed** | Fast for structural/parametric shapes (a console, a pipe, a glowing ring) — tweak a value, re-render. Slow/tedious for organic, painterly, or highly detailed hero props. | Fast to reach a *high visual ceiling* in a design tool; slow round-trip when engineering needs a change (must go back to the artist). |
| **Visual ceiling / uniqueness** | Bounded by what's reasonable to hand-code; risks the "AI-generated, plain, minimal" look the owner explicitly rejected if used for *everything*. | High and distinctive — this is where the "competitors can't copy this" craft comes from. Hero focal props deserve this. |
| **Consistency with Sparky** | Inherently on-style — same SVG idiom, same gradients/glow language as `SparkyCore`. | Needs a **style guide + review** to stay in the SparkyCore family (chrome, neon glow, glassmorphism). Risk of drift if briefed loosely. |
| **Cost / effort** | Engineering time only; no external spend. | Illustrator commission or owner time; real budget + scheduling dependency (the rebuild doc already lists a "mascot reference image (owner, incoming)" as an unlock). |
| **Who owns updates** | Engineering owns it end-to-end; lives in the repo, diff-able, versioned. | Artist/owner owns the source; engineering owns integration. Updates require the source file, not just the export — must keep layered originals. |
| **Feeds the SVG-vs-Pixi choice** | Naturally lands as inline/animatable SVG → the recommended substrate. | If delivered as **layered SVG**, drops straight into the SVG substrate; if delivered as flat PNGs, becomes parallax image layers (still SVG/CSS stack, just raster fills). |
| **Licensing** | Clean — authored in-house, no third-party rights. | Must secure full commercial rights / work-for-hire; verify any AI-tool-generated art's license and originality before shipping to a kids' product. |

### How reference art gets prepped (so it fits the substrate + guardrails)

- **Layer separation for parallax:** deliver the scene split into named depth layers — e.g. `bg`, `mid`, `props`, `fg`, plus any `idle:*` layers meant to animate (flask fluid, console screen, warning light). One flattened image kills parallax.
- **Format:** prefer **layered SVG** (each depth layer a `<g id="...">`); fall back to **transparent PNGs at named depth layers** (`lab01_bg@2x.png`, `lab01_props@2x.png`, …) when the art is painterly/raster.
- **Export settings:** 2x for raster (retina), transparent background, trimmed bounds, consistent artboard/viewBox across layers so they register when stacked.
- **Optimization:** run all SVG through **SVGO** (strip editor cruft, collapse groups carefully so animated `id`s survive); compress PNGs (e.g. to WebP/AVIF with an alpha) — this protects the LCP budget.
- **Contrast safety:** any layer that will sit under UI text must ship a darkened/scrim variant or leave a defined "quiet zone" so contrast guards pass.

### Recommendation — **hybrid, matching the Sparky model**

- **Code-drawn SVG** for *structural, animated, and interactive* layers: pipes, consoles, glowing rings, buttons, the parts that must react to progress ("lab powering up"), blink, or be ARIA-addressable. These need to be parametric and live in the repo.
- **Owner / commissioned-illustrator reference art** for the *hero focal prop(s)* of the diorama — the one or two beauty elements that carry the "crafted, not AI-plain" feeling.
- **Handoff format:** layered SVG (preferred) or transparent PNGs at named depth layers, per the prep rules above. Same discipline `SPARKY-RIVE-SPEC.md` uses — a drop-in artifact at a known path, no code change to swap.

**Tradeoff being accepted:** the hybrid introduces an art dependency and a review step to keep reference art on-style; in exchange we get a visual ceiling hand-coded SVG alone can't reach, without surrendering the animatable/accessible/in-repo core.

---

## 4. OMMA Evaluation (owner asked: can it design the Living Lab UI and/or the Sparky avatar?)

**What OMMA is (verified).** OMMA (omma.build) is an **AI-assisted, prompt-driven builder from the Spline team**. "Describe it. Omma builds it." It orchestrates parallel AI agents that generate code, images, and **3D models**, and it builds **interactive Three.js scenes** with native **WebGPU** support, in-browser. It ingests/produces `CSV, JSON, DOC, GLB, OBJ, PNG, SVG, MP4, GLTF`. It is, in effect, "Spline + agents": a 3D/interactive web canvas with a natural-language front door. ([omma.build](https://omma.build/), [Spline changelog](https://updates.spline.design/changelog/meet-omma-create-3d-websites-and-apps-with-ai-agents.), [Product Hunt](https://www.producthunt.com/products/omma))

**What it outputs (verified).** Both **hosted and self-hosted** paths exist. Hosted: prompt → live URL with custom-domain support. Self-host/export: it exposes a **Code API and code export for Vanilla.js, React, and Next.js** (Spline's existing Code-export lineage), and you can copy the code, open it in CodeSandbox, or download local files. So its output is *not* strictly locked to their hosting. ([toolworthy review](https://www.toolworthy.ai/tool/omma-build), [Spline: Exporting as Code](https://docs.spline.design/exporting-your-scene/web/exporting-as-code), [react-spline](https://github.com/splinetool/react-spline))

**Can it be integrated into our Next.js app?** Partially, and with a large asterisk. Two integration shapes exist, and they matter very differently:
- **Asset export** (GLB/GLTF/SVG/PNG/MP4): low-risk, standard files we already know how to consume. This is the safe surface.
- **Scene/code export** (React/Next component backed by the **Spline runtime = WebGL/WebGPU Three.js**): this is a **direct collision with §IV.2's "no WebGL on the dashboard critical path."** An OMMA-generated interactive scene *is* a GPU canvas — exactly the substrate IV-A is choosing *against* for the baseline. It is also the same class of technology (Three.js/WebGPU) as the abandoned 37M-tri cockpit. Dropping an OMMA Spline scene onto a dashboard route reintroduces the failure mode the whole of Part IV exists to avoid.

**Fit against the §IV.2 guardrails**
- **Perf / no-WebGL / LCP:** ✗ for scene output on the critical path (WebGL canvas, script-hydrated, non-SSR, boots on the GPU). ✓ only if used strictly for off-critical-path assets.
- **Progressive enhancement / SSR / SEO:** ✗ for scene output — a Spline canvas renders nothing server-side.
- **Accessibility:** ✗ for scene output — canvas is not DOM/ARIA-addressable; would fail our contrast/design-matrix guards without a hand-built parallel DOM. (**Needs verification** whether OMMA emits any a11y scaffolding — I found no claim that it does; assume not.)
- **Flag-gating / revertibility:** ◐ neutral — we could wrap *anything* behind our own flag, but that doesn't fix the substrate problems above.
- **Reduced-motion:** **Needs verification** — no evidence OMMA output honors `prefers-reduced-motion` or ships an instant-on still. Assume we'd have to add it.

**Can OMMA produce the Sparky avatar in the SparkyCore vector/Rive style with the 9 poses?** **Not in a way we can adopt — and I could not verify the specific capability, so I'm marking it "needs verification / likely no."** Reasons:
- The Sparky source of truth is **hand-authored SVG + CSS** (`SparkyCore.tsx`) and the reactive game mascot is a **Rive state machine** (`SparkyMachine`, inputs `comboTier`/`celebrate`/`encourage`/`thinking`, 9 named poses) per `docs/SPARKY-RIVE-SPEC.md`. OMMA is a **Spline/3D + generative-image** tool; I found **no evidence** it exports **`.riv` Rive files** or an editable state machine, and it is not a Rive editor. (Needs verification, but there is no product claim supporting it.)
- Even if OMMA emitted an SVG of a robot orb, matching **`SparkyCore` exactly** (the specified gradients, seam ring, LED-ring eyes, per-expression glow colors, and 9 blendable poses driven by our named inputs) is a precise, spec-bound target that a prompt-to-3D generator is not built to hit. Generative output would need heavy manual conforming and would risk style drift on our single most important brand asset — plus licensing/originality diligence for a kids' product.
- Bottom line: **use the existing pipeline for Sparky (SparkyCore SVG + Rive), not OMMA.**

### Verdict & safest trial

**Verdict:** OMMA is **not a fit for building the Living Lab UI itself**, because its native output is a WebGL/WebGPU Spline canvas that violates the no-WebGL-on-critical-path, SSR, and accessibility guardrails and re-opens the cockpit failure mode. SparkForge is a bespoke Next.js app, not a site to rebuild in a website builder — so the "prompt → hosted site" mode is a non-starter, and the "export a Spline scene into our app" mode fails §IV.2.

**Where it *could* earn a narrow pilot:** as an **asset-generation / concepting aid**, not a UI builder. Specifically: use OMMA to rapidly generate **candidate diorama art and props** (it exports SVG/PNG/GLB), and treat those purely as **reference art** that flows into the §3 hybrid pipeline (prepped, layered, SVGO'd, re-drawn or conformed to SparkyCore style). Evaluate exportability and license terms on that one batch before trusting it.

**Safest way to trial (if the owner wants to):** point OMMA at **one diorama** (the IV-A lab), generate visual assets only, and score them on: (1) can we export clean layered SVG/PNG? (2) is the style close enough to SparkyCore to be worth conforming? (3) are the license terms acceptable for a children's product? Do **not** import any OMMA-generated *scene/code* onto a dashboard route. If the assets aren't clearly better than a commissioned illustrator's, drop it.

**Integration risk rating:** **Low** if confined to exported flat/vector/GLB assets used off the critical path; **High** if any OMMA interactive scene is placed on a dashboard route (perf, a11y, SSR, cockpit-regression risk).

### Better-fit alternatives for this stack (already largely in `package.json`)
- **Rive** (`@rive-app/react-canvas`, present) — the *correct* tool for Sparky and for interactive vector lab creatures: tiny runtime, state machines, our 9-pose spec already targets it.
- **Lottie / dotLottie** — for one-shot "signature moments" (badge forge, hologram arrival) as designer-authored vector animations, if we want richer motion than hand-coded SVG for a single beat.
- **Figma → SVG export** — the natural authoring tool for the layered dioramas in §3; layer-named export drops into the SVG substrate.
- **Theatre.js** (`@theatre/core`, present) — for *sequencing* the airlock/power-up signature moment on DOM/SVG with a visual timeline, staying off WebGL.
- **Spline/Three (R3F, present)** — only if a future non-critical, opt-in "beauty" moment genuinely needs 3D; kept off dashboard critical paths by policy.

---

## 5. IV-A Concrete Deliverable & Exit Criteria

### The coded prototype includes
1. **One lab diorama** (recommend Lab 1 or Lab 11) as a layered SVG + CSS/transform parallax scene (§2), art via the §3 hybrid (code-drawn structure + one reference-art hero prop).
2. **One signature moment:** the **lab-entry "airlock power-up"** — on entering the lab, lights/consoles wake and the hero prop energizes, sequenced with GSAP or Theatre.js; a single non-animated end-state under reduced-motion.
3. **HTML-first fallback intact:** flag off ⇒ today's HTML lab detail page renders unchanged.
4. **Feature flag:** add `LIVING_LAB` to `src/config/feature-flags.ts` using the existing `flag()` helper, overridable via **`NEXT_PUBLIC_FLAG_LIVING_LAB`** (`=false` ⇒ instant revert, no code change — same pattern as `USE_HTML_DASHBOARD`).
5. **Mobile composition:** the same diorama reflowed (fewer parallax layers), not a card list.
6. **Zero WebGL on the critical path.** If a Pixi idle effect is trialed, it is a separate sub-flag, lazy, post-LCP.

### What to measure (against the current nav)
- **LCP < 2.5s** on a mid-tier device with the flag ON (must match the §IV.2 budget; compare to flag-OFF baseline).
- **CLS** — diorama layers must not shift content; target ≈ 0, no regression vs baseline.
- **Comprehension / task success** — can a user still find and start a game as fast as on the current nav? Measure via the existing **`tests/e2e/`** suite (extend `core-flow-smoke.spec.ts`; keep `a11y-*.spec.ts` green; add a `visual/` snapshot for the diorama).
- **Guards green** — contrast/spacing/design-matrix pass on the diorama.
- **Reduced-motion** — automated check that the instant-on static state renders with motion disabled.
- Qualitative: does it read as "a place, not a page," and as *crafted* vs the "AI-plain" baseline the owner rejected?

### Decision gate → proceed to IV-B
Proceed to **IV-B (navigation-as-world: floor plan + airlock transitions)** only if **all** hold:
- All §1 guardrail checkboxes pass (esp. LCP < 2.5s, no critical-path WebGL, guards green, reduced-motion instant-on).
- Comprehension/task-success is **≥** current nav (no regression in finding/starting a game).
- Owner picks a direction and judges the diorama a clear step up from the current look.
- The increment is provably revertible via `NEXT_PUBLIC_FLAG_LIVING_LAB=false`.

If comprehension regresses or the perf budget can't be met, **stop at IV-A** and iterate the single diorama rather than scaling the pattern — the cockpit era is the cautionary precedent for scaling an unproven spatial UI.

---

*End of IV-A spec. No code changed. This document is a decision input for the owner's art-direction sprint (§IV.3.1).*
