# Concept 08 — Spark Circuit Playground

*"Living electricity, bright and kinetic. Complete the circuit and watch the idea fire."*

**Reference DNA:** Spark · Technology · Colorful · Exciting
**One-line essence:** A bright, sunlit playground built from living circuitry, where signals are friendly sparks that hop between nodes. Kids complete circuits and paths to make ideas light up.

> Status: concept-development draft for the Part IV art-direction sprint. No code. A decision input, iterate freely.

---

## 1. Visual identity

**Mood:** high-energy, joyful, **daytime** — a bright playground, not a dark board. Colorful and kinetic without tipping into neon-on-black. This is the loudest, most playful of the three.

**Palette (named):**
| Token | Hex | Use |
|---|---|---|
| Sky Ground | `#EEF4FF` | bright ground (light); warm off-white |
| Deep Play | `#1B2244` | grounded dark for contrast panels |
| Tangerine | `#FF7A3C` | active traces / energy |
| Magenta Pop | `#FF3DA5` | nodes, accents |
| Lime | `#A6E22E` | success, "powered" |
| Spark Cyan | `#22D3EE` | current flow, sparks |

Candy-colored nodes on a bright ground; glow only on *active* traces so it reads clean, not busy.

**Materials:** glowing circuit traces as paths and slides, translucent candy-plastic nodes, bouncy connectors, arcs of friendly (rounded, non-jagged) lightning.

**Typography direction:** a rounded, bouncy display (friendly, chunky) + a clean rounded body; energetic but legible.

**Motion language:** current flowing along traces (animated dash-flow), spark *hops* node-to-node, chain-reaction cascades, bouncy node presses, a satisfying "snap + power-on" when a circuit completes.

**Sound identity:** playful electric blips, a rising arpeggio as current flows, a big joyful power-up chord on completion.

## 2. The world & metaphor

**Signals, activation, and connection** — the neural core. A neuron fires by sending a spark; a network works when the current finds a complete path. The child *wires and completes circuits* to make things activate, building intuition for connection, flow, thresholds, and routing.

## 3. Signature moment — "The Chain Reaction"

Finish a puzzle and a **cascade of sparks races across the entire board**, lighting every trace in sequence, ending in a big joyful power-on. Immensely satisfying, inherently game-like, and it visually *is* the lesson (signal propagation).

## 4. Mapping to SparkForge

| Lab / surface | Circuit Playground expression |
|---|---|
| 3 The Brain Inside | literal neural firing — sparks across neurons, thresholds as gates |
| 1 What IS AI? | connections light up as the child learns what's "AI" vs not |
| 11 Agentic AI · 5 AI Helpers | route the signal through the right tool/action to complete a task |
| 7 Vision · 8 Language | "send the input through the right processor" to get an output |
| Games (Neuron Relay, Neural Builder, Chatbot Builder) | map directly — they *are* wiring/flow games already |

**Retention hook:** the lab map is one big circuit board — every game you finish lights another trace until the whole board is powered.
**Age bands:** strongest for A/B (bright, kinetic, game-like); C gets depth via weights/thresholds/routing.

## 5. Fidelity ladder

| Rung | Spark Circuit |
|---|---|
| **WebGPU + TSL** | volumetric arcs, particle sparks, bloom on active traces |
| **WebGL2** | glow lines + sprite sparks |
| **2.5D SVG** | animated stroke-dash current flow — *authentic, because traces ARE lines* |
| **HTML floor** | static circuit diagram + progress; "powered/unpowered" states as chips |

Like Blueprint, the trace/line nature makes the 2D fallback the real thing at lower cost — a very safe ladder.

## 6. Accessibility & parallel DOM

Traces and nodes are interactive DOM/SVG with labels and focus states; circuit/completion state is readable text, not just glow. The chain-reaction cascade is decorative with a reduced-motion **instant-complete** state.

**Photosensitivity is a first-class constraint here:** cap flash rate, no more than 3 flashes/second (WCAG 2.3.1), no full-screen strobes, honor `prefers-reduced-motion` strictly. This is the concept most exposed to it — design the cascade as a smooth sweep, not a flicker.

## 7. Performance budget

Bright flat + line work is cheap; reserve particle arcs and bloom for capable tiers. Budget: LCP < 2.5s, 60fps desktop / 30fps floor. Strong low-end story; the 2D tier is genuinely lovely.

## 8. Staged build sequence (flag-gated)

Flag: `NEXT_PUBLIC_FLAG_SPARK_CIRCUIT`

1. **Slice 1 — retheme one wiring game.** Neuron Relay (or Neural Builder) becomes the circuit playground: flowing current, spark hops, chain-reaction completion. Ship dark, snapshot + perf + **flash-rate** gate, verify on a throttled profile.
2. **Slice 2 — lab map as a circuit board.** Finishing games lights traces between lab nodes.
3. **Slice 3 — dashboard as a playground board.**

## 9. Risks & open questions

- **Photosensitivity / overwhelm** (top risk): strict flash limits, smooth sweeps, generous whitespace, glow only on active elements.
- **High saturation can read "busy":** enforce restraint — bright ground, limited simultaneous color, one thing lit at a time.
- **Contrast** of bright colors on a light ground needs care (semantic states must stay AA).
- Open: how "electric" vs "toy-playful" should the lightning read? (Affects the energy vs friendliness balance.)

## 10. Why this one

The only *bright, daytime, high-energy* direction, and the one that maps most literally onto the neural-signal pedagogy. Its completion loops are inherently game-like, making it the strongest pure-retention play of the three.
