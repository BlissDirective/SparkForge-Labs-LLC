# Concept 05 — Blueprint Forge

*"The holographic inventor's drafting table. Draw it, then watch it run."*

**Reference DNA:** Inventive · Technology · Futuristic · Laboratory
**One-line essence:** The child is an inventor at a glowing drafting table. You *sketch* an AI system as a blueprint and it *materializes* into a working machine — design becomes reality in front of you.

> Status: concept-development draft for the Part IV art-direction sprint. No code. A decision input, iterate freely.

---

## 1. Visual identity

**Mood:** warm drafting studio meets cool holography — vellum and graphite under a desk lamp, with luminous wireframes rising off the page. Precise and inventive, but *warm*, never cold-technical.

**Palette (named):**
| Token | Hex | Use |
|---|---|---|
| Vellum | `#F3ECDE` | warm paper ground (light) |
| Ink Navy | `#12233F` | deep drafting ground (dark) |
| Blueprint | `#37B6FF` / `#6FD0FF` | holographic wireframe lines |
| Materialize | `#FFB23E` | the warm "it's real now" glow |
| Graphite | `#2A3550` | sketch strokes, labels |
| Brass | `#C89B5A` | drafting instruments, accents |

Warm ink-on-paper grounds + cool holo-lines is the whole tension. Not neon-on-black.

**Materials:** vellum, graphite, brass compass/rulers/set-squares, glowing holographic wireframes that lift off the table and print into solid, softly-lit devices.

**Typography direction:** an architect's-hand or precise geometric for labels, a clean humanist grotesque for body, monospace for "spec readouts" on the drawing. (Faces TBD; inline-only under the CSP.)

**Motion language:** line-draw (stroke reveal), blueprint unroll, and the hero **wireframe → solid "materialize"** dissolve. Restrained; the materialize is the punctuation.

**Sound identity:** pencil scratch, compass tick, ruler snap, and a warm low "power-on" hum when a design comes to life.

## 2. The world & metaphor

AI as **design and engineering**. Every concept is something you *spec and build*: inputs → model → output, drawn as a wireframe on the table, then materialized into a running machine. This is the purest expression of the **AI-system-design** competency — the child isn't shown AI, they *draft it into existence*.

## 3. Signature moment — "The Materialize"

A sketched wireframe resolves stroke-by-stroke, the lines thicken and fill, and the design **prints** into a solid, gently-glowing, *running* device with a warm power-on hum. One beat, high agency, deeply on-theme ("you designed this, now it's real").

## 4. Mapping to SparkForge

| Lab / surface | Blueprint expression |
|---|---|
| 2 Teaching Machines · 3 Brain Inside · 9 Build Your AI | draft the machine/network, materialize it, run it on real input |
| 11 Agentic AI | wire an agent *graph* on the table (Build → Equip → Constrain reads as annotate → attach tools → set limits) |
| 7 Vision · 8 Language · 4 Generative | "blueprint of a camera / translator / art-machine" that assembles |
| 6 Ethics · 10 Futures | *review the blueprint for flaws* — red-line the design |
| Games (Neural Builder, Chatbot Builder, Agent Architect) | open as a wireframe schematic that materializes into the playable game |

**Retention hook:** a personal "invention journal" of blueprints the child has materialized.
**Age bands:** strongest for B/C (engineering framing). Band A: simpler "trace the shape and it comes alive."

## 5. Fidelity ladder

| Rung | Blueprint Forge |
|---|---|
| **WebGPU + TSL** | holographic depth, volumetric materialize, parallax drawing table |
| **WebGL2** | wireframe + bloom + line-draw |
| **2.5D SVG** | animated line-draw — *nearly identical, because the aesthetic IS line art* |
| **HTML floor** | static blueprint diagram + readable spec + progress |

**Key advantage:** the 2D fallback is authentic, not a downgrade — a blueprint drawn in SVG *is* a blueprint. Lowest-risk ladder of the three.

## 6. Accessibility & parallel DOM

Blueprint labels and the "spec" of each design are real DOM/SVG text (readable, focusable). The materialize animation is decorative and has a reduced-motion instant "built" state. Nothing about navigation or game state lives only in the canvas.

## 7. Performance budget

Line-art is cheap; the materialize is a short one-shot. Critical path stays HTML; the drafting scene hydrates post-LCP. Budget: LCP < 2.5s, 60fps desktop / 30fps floor, GPU memory modest. Excellent low-end story.

## 8. Staged build sequence (flag-gated)

Flag: `NEXT_PUBLIC_FLAG_BLUEPRINT`

1. **Slice 1 — one game intro.** Neural Builder (or Agent Architect) *opens* as a wireframe that materializes into the existing playable game. Ship dark, Playwright snapshot + perf gate, verify on a throttled profile.
2. **Slice 2 — lab entry.** Entering a lab is a blueprint that unrolls and materializes the lab's games as devices on the table.
3. **Slice 3 — dashboard shell.** The home becomes the drafting table; progress = blueprints filed in the invention journal.

Each slice keeps the current HTML page as the flag-off fallback and must pass the perf + comprehension gates before the next begins.

## 9. Risks & open questions

- **Could read cold/technical for the youngest** → counter with warmth (paper, amber, a friendly inventor Sparky) and playful materialized devices.
- **Line-art can feel sparse** → art direction must add richness (textured paper, brass detail, warm lamp light) so it doesn't read as empty.
- Open: how "hand-drawn" vs "precise CAD" should the line quality be? (Affects warmth vs authority.)

## 10. Why this one

It's the only direction whose *visual identity is the pedagogy* — designing AI is both the look and the lesson. The "you drafted it into being" agency is a uniquely strong kid hook and maps cleanly onto the system-design competency.
