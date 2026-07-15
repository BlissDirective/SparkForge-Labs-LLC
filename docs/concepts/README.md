# Part IV — Living Laboratory · Concept Development

Design-direction drafts for the Part IV art-direction sprint. These are
**decision inputs**, not commitments — no code. Each doc is a self-contained
world: palette, materials, motion, sound, the AI-literacy metaphor, the one
signature moment, a map to the 11 labs, the fidelity ladder, and a staged,
flag-gated build sequence with a first slice.

All three inherit the same safety rails (independent of look): fallback ladder
→ HTML floor · parallel-DOM/ARIA a11y · perf-budget CI gate · live Playwright
verification · flag-gated thin slices. See `docs/IV-A-living-lab-spec.md`.

## Finalists

| # | Concept | Feels like | Best-fit pedagogy | Signature moment | Ladder risk |
|---|---|---|---|---|---|
| [05](./05-blueprint-forge.md) | **Blueprint Forge** | inventor's drafting table | AI system *design* | wireframe → **materialize** | low (line-art = authentic 2D) |
| [06](./06-living-forge.md) | **The Living Forge** | molten foundry of ideas | training as *craft* (forge/temper) | the **Forge Strike** ceremony | moderate (emissive/particles) |
| [08](./08-spark-circuit-playground.md) | **Spark Circuit Playground** | bright electric playground | neural *signals & activation* | the **Chain Reaction** | low (traces = authentic 2D) |

## Cross-cutting insight — they can be *one pipeline*, not three rivals

Blueprint 05 and Circuit 08 are both **line/trace-based**, so their 2D fallbacks
are the real aesthetic at low cost — the two safest, cheapest ladders. Forge 06
is the **ceremony + brand** play — highest emotional shine, moderate cost.

They also chain into a single coherent narrative that matches how you actually
build an AI:

> **Blueprint** (design it) → **Forge** (build & temper it) → **Circuit** (power it on and watch it run).

That's a natural way to stage a build plan: adopt **Forge's Forge-Strike** as the
first, self-contained ceremony slice (max wow, min surface), while prototyping a
**Blueprint** or **Circuit** game intro on a parallel flag. If the pipeline idea
holds, the three become the three verbs of one world — *draft, forge, spark to
life* — rather than three competing skins.

## Suggested first move

Spike **one** self-contained surface, verified live on a throttled low-end
device before any scaling:
- **Fastest wow:** Forge Strike ceremony (`NEXT_PUBLIC_FLAG_LIVING_FORGE`).
- **Lowest risk / most on-pedagogy:** a Blueprint or Circuit *game intro*
  (`NEXT_PUBLIC_FLAG_BLUEPRINT` / `NEXT_PUBLIC_FLAG_SPARK_CIRCUIT`).

Pick the metaphor (or the pipeline), and the next doc is a staged build plan for
the winner.
