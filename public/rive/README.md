# Sparky Rive mascot — drop folder

Place the authored mascot asset here as **`sparky.riv`**.

Until it exists, `SparkyRive.tsx` renders a small procedural placeholder orb
(no error, no console noise) so the game dock is never empty.

## Required asset contract

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
state machine is driven live by the GameJuiceEngine via `JuiceProvider` —
so it reacts inside all games at once. No code change needed.
