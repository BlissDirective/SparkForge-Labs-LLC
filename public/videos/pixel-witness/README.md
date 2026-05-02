# Pixel Witness Video Assets

**Stage 11C** (`src/components/games/PixelWitnessGame.tsx`) ships with 24 placeholder clip references and 96 hand-authored Q-A pairs (`src/lib/pixelwitness/clipLibrary.ts`). The Q-A flow is fully playable today using SVG poster fallbacks; replacing the placeholders with real video files lights up the actual video playback in the Watch and Sense-Builder phases.

## File expectations

For each clip ID listed below, two files are expected at `/public/videos/pixel-witness/`:

| File | Format | Notes |
|---|---|---|
| `<clipId>.mp4` | MP4 H.264, ≤ 2 MB ideal | 5-15 sec duration, kid-safe, royalty-free |
| `<clipId>.poster.jpg` | JPG, 1280×720 ideal | First-frame poster shown before play / on error |

When a video file is missing, the `ClipPlayer` component falls back to `placeholder.svg` (also in this directory) and then to a kid-readable text panel. The Q-A flow continues to work either way.

## Asset standard

- **Duration**: 5-15 seconds per Doc 2 §G.5
- **Resolution**: 1280×720 minimum (game frames inside a chrome bezel — 720p is plenty)
- **Audio**: 4 clips have `hasAudio: true` and need actual audio tracks (soccer-goal, skateboard-trick, basketball-shot — see clip table below). The other 20 can be silent.
- **Kid-safety**: no people identifiable beyond hands/back-of-head, no brand logos visible, no hazardous content
- **Licensing**: royalty-free, redistribution-allowed (Pexels, Pixabay, public-domain)

## Clip manifest (24 entries)

Use this table for asset sourcing. The "Scene" column is what a video producer should capture; the "Critical detail" column is what the Q-A pairs depend on (and must be visible in the actual clip).

### Everyday (5)

| ID | Title | Duration | Audio | Scene | Critical detail |
|---|---|---|---|---|---|
| `cat-door` | Cat opens door | 8s | no | Cat presses door handle with one paw and pushes door open | Cat has NO collar (Q4 trap); uses ONE paw (Q3) |
| `kid-bubbles` | Kid blows bubbles | 10s | no | Child blowing soap bubbles outdoors | About 7 visible bubbles at peak (Q3); kid is smiling (Q2) |
| `dog-ball` | Dog catches ball | 7s | no | Dog jumps up and catches a tossed tennis ball mid-air | Ball does NOT bounce before catch (Q3); no name shown (Q4) |
| `tea-pour` | Tea is poured | 6s | no | Hot tea poured from teapot into cup, visible steam | 2 cups on table (Q3); steam visible (Q2) |
| `packing-suitcase` | Packing suitcase | 12s | no | Person folds 5 items and places into open suitcase | 5 items packed (Q3); destination unspecified (Q4) |

### Nature (5)

| ID | Title | Duration | Audio | Scene | Critical detail |
|---|---|---|---|---|---|
| `sunrise-tl` | Sunrise time-lapse | 15s | no | Sunrise time-lapse with cloud movement, no skyline | 3 cloud formations (Q3); no city (Q4) |
| `leaf-fall` | Leaf falling | 6s | no | Single autumn leaf drifts from branch to ground | Single leaf only (Q3); leaf shape ambiguous (Q4) |
| `ocean-wave` | Ocean wave | 9s | no | Wave with whitecaps rolls in and breaks | 2 wave breaks (Q3); whitecaps visible (Q2) |
| `flower-open` | Flower opens | 12s | no | Time-lapse of flower bud opening | 5-petal flower (Q3); species ambiguous (Q4) |
| `snow-falling` | Snow falling | 10s | no | Light snow against dark background | 20-25 flakes peak (Q3); slow falling (Q2) |

### Mechanical (5)

| ID | Title | Duration | Audio | Scene | Critical detail |
|---|---|---|---|---|---|
| `clock-gears` | Clock gears moving | 8s | no | Close-up of 3 interlocking clock gears turning | 3 gears (Q3); no clock face visible (Q4) |
| `dominos-fall` | Dominos falling | 9s | no | Line of 10 standing dominos falls in sequence | 10 dominos (Q3); chain reaction visible (Q2) |
| `balloon-inflate` | Balloon inflating | 11s | no | Person inflates red balloon by mouth in 5 breaths | 5 breaths (Q3); inflated by mouth (Q2) |
| `marble-run` | Marble run | 14s | no | Marble travels through 2 loops on a wooden track | 2 loops (Q3); ends in basket (Q1) |
| `ferris-wheel` | Ferris wheel turning | 12s | no | Ferris wheel rotates against blue sky | 12 cabins (Q3); daytime (Q2) |

### Sports (5)

| ID | Title | Duration | Audio | Scene | Critical detail |
|---|---|---|---|---|---|
| `soccer-goal` | Soccer goal | 8s | **YES** | Player kicks soccer ball into goal past goalie | 3 touches before shot (Q3); no scoreboard (Q4) |
| `swim-dive` | Swimming dive | 6s | no | Swimmer dives off block, clean entry | 4 lanes visible (Q3); experienced form (Q2) |
| `gym-flip` | Gymnastics flip | 5s | no | Gymnast performs single backflip on mat | 1 rotation (Q3); stuck landing (Q2) |
| `skateboard-trick` | Skateboard trick | 7s | **YES** | Skater performs an ollie over a low obstacle | ~20cm board height (Q3); no brand visible (Q4) |
| `basketball-shot` | Basketball shot | 6s | **YES** | Player shoots a 3-pointer, ball touches rim then goes in | Ball touches rim once (Q3); no jersey number visible (Q4) |

### Crafts (4)

| ID | Title | Duration | Audio | Scene | Critical detail |
|---|---|---|---|---|---|
| `origami-crane` | Origami crane folding | 14s | no | Time-lapse of standard origami crane fold | ~30 folds total (Q3); experienced hands (Q2) |
| `cake-decor` | Cake decorating | 13s | no | Baker pipes 3 colors of frosting onto round cake | 3 colors (Q3); birthday-cake style (Q2) |
| `plant-repot` | Plant repotting | 12s | no | Person repots a 4-leafed plant into a larger pot | 4 leaves (Q3); fresh soil added (Q1) |
| `clay-pot` | Pottery wheel | 15s | no | Potter shapes wet clay into vase, wets hands 4 times | Wets hands 4 times (Q3); wet-clay technique (Q2) |

## Total

24 clips × 4 questions = 96 Q-A pairs. Q4 is always the adversarial "hallucination-bait" question — these are designed to elicit a confidently-wrong AI answer about a detail that isn't actually visible in the clip.

## Generation note

Per Doc 2 §G.11, the Q-A pairs are PRE-RECORDED (no live model call). The recorded `aiAnswer` strings live in `src/lib/pixelwitness/clipLibrary.ts`. If you re-shoot a clip in a way that changes a "Critical detail" listed above, update the corresponding question's `aiAnswer` and `truth` fields too — otherwise the explanations won't match what kids see.
