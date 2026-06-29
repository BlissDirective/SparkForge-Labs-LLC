# Asset & MCP Pipeline — Acquisition & Setup Guide

> **Date:** 2026-06-28 · **Owner doc:** `Fable-Frontend-Enhancement.md` (Phase D)
> **Purpose:** step-by-step instructions to acquire and wire every external tool
> the Phase-D asset tracks depend on — Blender, Rive, Scenario, Figma (+ Meshy/
> Tripo, Lottie) — plus how to source the art that replaces the emoji sweep.

---

## 0. Critical environment caveat (read first)

There are **two kinds** of integration here, and they have very different
constraints:

| Kind | Examples | Where it runs |
|------|----------|---------------|
| **Desktop-app MCPs** (remote-control a running app) | Blender MCP, Figma Dev-Mode MCP, Rive Editor MCP | **Local Claude Code only** — the desktop app must be open on the same machine. They do **not** work in Claude Code on the web / this remote sandbox. |
| **API/key services** (HTTP, no local app) | Scenario, Meshy, Tripo, Hyper3D/Rodin | Anywhere a key + outbound HTTPS exists — including remote/CI. Store keys in `.env.local` (server-side) and call from a build script. |

**Implication:** the Blender / Figma / Rive-editor work is done in a **local
Claude Code session** with those apps installed. The Scenario/Meshy/Tripo art
generation can run from a script in any environment with the key. Assets (GLB,
.riv, PNG/WebP) are then committed to `public/` and consumed by the app
everywhere.

MCP servers are registered in a project-root **`.mcp.json`** (Claude Code reads
it automatically) or under `mcpServers` in `.claude/settings.json`. Each section
below gives the exact entry.

---

## 1. Blender MCP — themed 3D assets (closes HS-8 pet GLB)

**What it gives us:** Claude-driven modelling + text→3D inside Blender, exported
as GLB into `public/models/` for the existing R3F flagships (pets, props,
environments). Closes the long-standing HS-8 procedural-pet fallback.

### Acquire
1. **Install Blender 4.x** (free) — https://www.blender.org/download/.
2. **Install `uv`** (runs the MCP server): https://docs.astral.sh/uv/ — `curl -LsSf https://astral.sh/uv/install.sh | sh`.
3. **Get the addon** from `ahujasid/blender-mcp` (https://github.com/ahujasid/blender-mcp) — download `addon.py`.
4. In Blender: **Edit → Preferences → Add-ons → Install…**, pick `addon.py`, enable **"Interface: Blender MCP"**.
5. **(Optional, for text→3D)** get a **Hyper3D Rodin** key (https://hyper3d.ai — free trial tier) and/or enable **Hunyuan3D**; paste the key into the addon panel.

### Wire into Claude Code (`.mcp.json` at repo root)
```json
{
  "mcpServers": {
    "blender": { "command": "uvx", "args": ["blender-mcp"] }
  }
}
```
Then in Blender's 3D viewport press **N → "BlenderMCP" tab → Start MCP Server**
(listens on `localhost:9876`). Restart Claude Code; the `blender-mcp` tools
appear.

### Asset flow
Generate/model → **File → Export → glTF 2.0 (.glb)** → save to
`public/models/<category>/<name>.glb` → load via the existing R3F loader
(`useGLTF`). Optimize with `npm run optimize:3d` (already in `package.json`).
Target the per-game `triangleBudget` in `src/config/gameRegistry.ts`.

### Alternatives (API-based text→3D, no desktop app)
- **Meshy** (https://meshy.ai) — `MESHY_API_KEY`; REST text/image→3D → GLB.
- **Tripo** (https://www.tripo3d.ai) — `TRIPO_API_KEY`; similar.
Use these from a script when you can't run Blender locally; then still run the
GLB through Blender/`optimize:3d` for cleanup before committing.

---

## 2. Rive — the reactive Sparky mascot (`public/rive/sparky.riv`)

**What it gives us:** a state-machine character that reacts to game events
(idle → thinking → celebrate ×3 tiers → encourage → combo-hype). The runtime
(`@rive-app/react-canvas`) is **already installed and wired in `JuiceProvider`**;
only the `.riv` asset is missing (currently a placeholder README).

### Acquire / create
1. Create an account at **https://rive.app** (free tier exists; Pro ~$24–32/mo
   for teams/advanced data-binding).
2. New file → build the **Sparky** artboard (vector art or import SVG).
3. Add a **State Machine** named `sparky` with inputs the app will drive:
   - `mood` (Number 0–4) **or** discrete Triggers: `idle`, `celebrate`,
     `encourage`, `combo`.
   - Use **Data Binding** (Rive's web runtime supports binding game state →
     animation) so `JuiceProvider` can set inputs directly.
4. **Export → Download (.riv)** (the runtime format, not the editor file).
5. Commit to **`public/rive/sparky.riv`** (replace the README placeholder).

### Wire
The `<RiveMascot>` in `JuiceProvider` already references the path; once the file
exists, map `onCorrect/onWrong/combo` → state-machine inputs. Per-lab tinting:
either bake variants or apply a runtime color override.

### Rive Editor MCP (optional, early access)
Request access from Rive; when granted, add to `.mcp.json` (desktop-app class —
local only). Treat as an accelerator, never a dependency (Fable §5 risk note).

---

## 3. Scenario — style-locked 2D art (lab backgrounds, sprites, emoji replacements)

**What it gives us:** a **trained, style-consistent** generator so all 11 labs'
backgrounds, game sprites, and icon/emoji replacements share one art identity.
Pure API — runs from a script anywhere.

### Acquire
1. Account at **https://www.scenario.com** (usage-based pricing).
2. **Train a style model:** upload 10–30 reference images in the target
   Frost-Prismatic / lab aesthetic → train → note the **model ID**.
3. **API key:** Account → **API keys** → create. Store as `SCENARIO_API_KEY` in
   `.env.local` (server-side only — never `NEXT_PUBLIC_`).

### Use (build script, not runtime)
REST flow: `POST /generate/txt2img` with `{ modelId, prompt, ... }` → poll the
job → download the PNG. Write a generator script, e.g.
`scripts/gen-lab-art.ts`, that loops the 11 labs and writes
`public/lab-art/lab-<n>.webp`. Keep prompts in a config so the style stays
locked. Convert to WebP/AVIF and run through `next/image`.

```
SCENARIO_API_KEY=sk_...        # .env.local
SCENARIO_MODEL_ID=model_...    # your trained style model
```

---

## 4. Figma MCP — app-chrome design-to-code (optional, designer-in-loop)

**What it gives us:** turn Figma frames of app chrome / dashboard / parent pages
into code. Optional — does nothing for in-canvas game visuals.

### Option A — official Figma Dev Mode MCP (desktop-app class, local only)
1. **Figma desktop app**, on a **Dev or Full seat** (Dev Mode requires paid seat).
2. **Figma → Preferences → Enable Dev Mode MCP Server** → it serves
   `http://127.0.0.1:3845/sse`.
3. `.mcp.json`:
```json
{ "mcpServers": { "figma": { "url": "http://127.0.0.1:3845/sse" } } }
```

### Option B — community framelink (token-based, runs anywhere)
1. Figma → **Settings → Account → Personal access tokens** → generate.
2. `.mcp.json`:
```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--figma-api-key=YOUR_TOKEN", "--stdio"]
    }
  }
}
```

---

## 5. Lottie (optional) — UI micro-animations

For non-interactive flourishes only (Rive is strictly better for *interactive*
characters). Lottie Creator has an official MCP; export `.json`/`.lottie` and
play with `lottie-react`. Low priority.

---

## 6. Emoji → icon/asset replacement (Ui-Creation.md sweep)

The audit counted ~1,464 emoji occurrences. Replace them in three buckets, each
with a different art source:

| Bucket | What | Replacement source | Format |
|--------|------|---------------------|--------|
| **UI affordances** (buttons, status, nav) | ▶, ⚙, ✓, arrows | **lucide-react** (already a dep) — zero new assets | inline SVG |
| **Decorative / thematic** (level icons, lab glyphs, concept badges) | 🧠 📦 ⚖️ 🔬 | **Scenario** style-locked icon set, OR a commissioned SVG icon set | SVG / WebP |
| **Characters / reactions** (Sparky, lab companions, pet) | 🐕 🐱 mascot | **Rive** (animated) + **Blender** GLB for 3D pets | .riv / .glb |

### Process (repeatable)
1. **Inventory:** `rg -oP '[\x{1F000}-\x{1FAFF}\x{2600}-\x{27BF}]' src --no-heading | sort | uniq -c | sort -rn`
   → ranked list of every emoji + count. (Note: BSD/macOS grep lacks `\x{}`; use
   ripgrep `rg` or Node, as the sandbox `grep -P` build returns 0 here.)
2. **Categorize** each into the three buckets above.
3. **Map** every emoji → a concrete replacement:
   - UI → a named lucide icon (e.g. `🎯` → `<Target/>`, `⏱️` → `<Timer/>` —
     several migrated games already do this).
   - Decorative → a Scenario prompt spec or SVG filename.
   - Character → a Rive state / GLB.
   Keep the map in `docs/UI-Game-Enhancements/emoji-map.md` (one row per emoji).
4. **Generate** decorative art via Scenario with the locked style model; export
   SVG (preferred) or WebP to `public/icons/` ; commit.
5. **Swap** in code, bucket by bucket; re-enable/extend the no-emoji lint guard
   so regressions are caught.
6. **Verify** with the existing Playwright smoke harness (no visual regressions
   on the migrated games) + the SSIM ≥ 0.96 checkpoint for art-heavy screens.

### Scenario icon prompt template (style-locked)
```
"<subject>, single centered icon, flat with subtle neon rim-light,
 Frost-Prismatic palette accent <labHex>, dark transparent background,
 chrome bezel motif, no text" — modelId = SCENARIO_MODEL_ID
```

---

## 7. Where each key lives (summary)

```
# .env.local  (git-ignored; server-side)
SCENARIO_API_KEY=sk_...
SCENARIO_MODEL_ID=model_...
MESHY_API_KEY=...            # optional 3D
TRIPO_API_KEY=...            # optional 3D
HYPER3D_API_KEY=...          # optional, inside Blender addon

# .mcp.json   (repo root; desktop-app MCPs only work in LOCAL Claude Code)
{ "mcpServers": { "blender": {...}, "figma": {...} } }
```

Committed assets land in `public/models/` (GLB), `public/rive/sparky.riv`,
`public/lab-art/` (backgrounds), `public/icons/` (emoji replacements).
