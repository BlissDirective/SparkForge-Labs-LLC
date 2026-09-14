# Sparky Rive mascot — drop folder (in-game 2D mount)

Place the authored in-game mascot asset here as **`sparky.riv`**.

Until it exists, `SparkyRive.tsx` renders a small procedural placeholder
(no error, no console noise) so the game dock is never empty.

**Design authority (2026-09-14):** the locked Sparky is the coral chibi
robot in `public/forge-hub/sparky/LOCKED_SPARKY.png`, specified in
`docs/sparky/SPARKY-CHARACTER-SPEC.md`. The 3D rigged GLB is the master;
this `.riv` is the 2D in-game counterpart and must match the same design
(the older chrome-orb spec is archived under `docs/sparky/_SUPERSEDED/`).
A sprite-sheet fallback rendered from the 3D master is an acceptable
alternative to authoring a `.riv` (spec §9).

## Required asset contract (unchanged)

Author in the Rive editor with a **state machine named `SparkyMachine`** and
these inputs (matched by name at runtime in `src/components/sparky/SparkyRive.tsx`):

| Input       | Type            | Driven by                                   |
|-------------|-----------------|---------------------------------------------|
| `comboTier` | Number (0–3)    | combo intensity (0 idle → 3 on-fire)        |
| `celebrate` | Trigger         | combo milestone / big win                   |
| `encourage` | Trigger         | fired after a wrong answer                  |
| `thinking`  | Boolean         | true while a question/prompt is on screen   |

Suggested states: `idle`, `thinking`, `celebrate-1/2/3`, `encourage`.

Once `sparky.riv` is added, the placeholder disappears automatically and the
state machine is driven live by the GameJuiceEngine via `JuiceProvider`,
so it reacts inside all games at once. No code change needed.
