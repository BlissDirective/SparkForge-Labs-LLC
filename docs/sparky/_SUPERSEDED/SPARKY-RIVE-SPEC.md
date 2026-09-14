# Sparky Rive Authoring Spec — `sparky.riv`

Practical spec for authoring the reactive Sparky game mascot in the Rive web
editor. Consumed by `src/components/sparky/SparkyRive.tsx`, which is mounted
in every game via `GameShell → JuiceProvider` (bottom-left corner, 72 px).
Until the file exists, the app shows a procedural fallback orb — dropping the
`.riv` in place upgrades all 42 games at once, no code changes.

## 1. The character (match SparkyCore exactly)

Sparky is a **chrome robot orb** — canonical geometry lives in
`src/components/sparky/SparkyCore.tsx` (pure SVG + CSS, the source of truth):

- **Body:** polished chrome sphere. Gradient `#F0F2F8 → #D8DDE8 → #B8C0D4 → #98A2BC → #7884A4` (160°), bright specular highlight upper-left, subtle seam ring.
- **Face screen:** dark rounded rectangle (`#0D1B2A → #050A12` radial), thin stroke in the current glow color at 30% opacity.
- **Eyes:** two glowing LED rings (radius ~9 of an 80-unit face), dark centers `#0A1628`, small white highlight dot upper-left of each.
- **Mouth:** thin glowing stroke (smile curve), same color as eyes.
- **Antenna:** short stem (`#A0A8C0 → #707890`) topped with a glowing ball in the current glow color.

Eyes/mouth/antenna-tip all share one **glow color** that changes per expression:

| Expression | Glow | Eyes | Mouth |
|---|---|---|---|
| idle | `#00D2FF` | normal | gentle smile |
| happy | `#00FF88` | slightly larger, raised | wide smile |
| thinking | `#FFD93D` | narrowed, lowered | small frown-flat |
| speaking | `#E945F5` | normal | open smile |
| excited | `#FF6B35` | large, raised | big open smile |
| sleepy | `#8B9FFF` | half-closed, drooped | flat |
| sad | `#5B7FFF` | small, lowered | downturned |
| celebrating | `#FFD93D` | largest, raised high | huge open smile |
| surprised | `#FF6B35` | widest | small "o" circle |

Author these 9 poses as states/keyed poses so transitions can blend between them.

## 2. Artboard + state machine

- **Artboard:** square, design at 200×200 (it renders at 72–120 px; keep strokes bold enough to read at 72 px). Transparent background — it floats over game UI.
- **State machine name:** `SparkyMachine` (exact, case-sensitive).

## 3. Inputs (exact names + types)

| Input | Type | Range | Driven by |
|---|---|---|---|
| `comboTier` | Number | 0–3 | Combo streak: 0 idle, 1 building (1+), 2 hot (5+), 3 on fire (12+) |
| `celebrate` | Trigger | — | Fired once per combo milestone / big win |
| `encourage` | Trigger | — | Fired once after each wrong answer |
| `thinking` | Boolean | — | True while a question is on screen (not yet wired in-game; testable on /dev/sparky) |

### Suggested state mapping

- `comboTier` 0 → **idle** loop (slow bob + blink); 1 → **happy** loop; 2 → **excited** loop (faster bob, brighter glow); 3 → **celebrating** loop (max hype, particles OK).
- `celebrate` trigger → one-shot **celebrating** burst (jump/spin/flash), then return to the current tier loop.
- `encourage` trigger → brief **sad → happy** nod ("you've got this"), return to tier loop.
- `thinking = true` → **thinking** loop (narrowed eyes, antenna pulse) overriding tier loops; false → back to tier loop.

Keep loops subtle — the mascot sits in the corner during gameplay and must not
distract. No audio in the .riv (game audio is Tone.js).

## 4. Sizes in-app

- **Gameplay mount (this asset's primary home):** 72 px, bottom-left of the game frame.
- **Dev showcase:** 120 px on `/dev/sparky`; component default is 96 px.
- For reference, the SVG `SparkyCore` sizes elsewhere in the app: sm 40 / md 72 / lg 120 / xl 192 px.

Design so it reads clearly at **72 px**.

## 5. Delivery + verification

1. Export from the Rive editor as `sparky.riv` (runtime format).
2. Drop it at **`public/rive/sparky.riv`** — exact path, no code changes needed.
3. Run `npm run dev` and open **`/dev/sparky`** (public route):
   - The SparkyRive section swaps from the fallback orb to your animation automatically (on load failure it silently keeps the fallback — if you still see the orb, check the file path and state machine name).
   - Use the comboTier 0–3 buttons, celebrate/encourage trigger buttons, and thinking toggle to exercise every input.
4. Sanity-check in a real game (e.g. `/dev/game-preview`): mascot sits bottom-left at 72 px, hypes up as you build a combo, pops on milestones, encourages on misses.

## 6. Gotchas

- Names are **case-sensitive**: `SparkyMachine`, `comboTier`, `celebrate`, `encourage`, `thinking`. A typo means the input is silently ignored.
- Triggers are fired programmatically (counter increments), possibly in quick succession — make trigger animations short (≤ 1 s) and interruptible.
- The runtime is `@rive-app/react-canvas` v4 — use a compatible editor export.
