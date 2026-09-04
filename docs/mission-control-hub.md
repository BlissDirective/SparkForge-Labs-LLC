# Mission Control Hub — prototype notes

**Date:** 2026-09-04  
**Flag:** `NEXT_PUBLIC_MISSION_CONTROL_HUB` (`FEATURE_FLAGS.MISSION_CONTROL_HUB`)  
**Routes:** `/mission-control` (authenticated, flag-on) · `/dev/mission-control` (public preview)

This is a **constrained instrument-console prototype** for the kid hub / lab
entry. It is not a revival of the panoramic 3D cockpit, and it does not replace
parent, settings, or pricing.

---

## What failed in the old cockpit (and what we are not repeating)

Reviewed: `_SUPERSEDED/Cockpit-Interface-Plan.md`, `src/components/3d/_SUPERSEDED/`,
`docs/archive/3d-cockpit-hero/00-reference/_SUPERSEDED/` (especially
`COCKPIT_PANORAMIC_ARCHITECTURE_v1.md`), `COCKPIT_ARCHITECTURE_CURRENT.json`,
`SparkForge-Full-ControlScreen.json`, `CockpitCanvas.tsx`, Forge Ring (F5),
and the HTML-first dashboard pivot (`USE_HTML_DASHBOARD`).

| Old cockpit failure | What this prototype does instead |
|---|---|
| **~38–50M triangle panoramic hull** (288-segment panels, LED rims, cable bundles, fog, NPCs, four 3D consoles) — unusable on school Chromebooks | **CSS/DOM is the product.** Optional WebGL is a locked-camera backdrop with a few thousand triangles (two torii, a core, a pedestal, four octahedrons, drei `Stars`). `powerPreference: 'low-power'`, `dpr` capped at 1.25. |
| **Free-look / OrbitControls / camera chaos** (`SpatialView` orbit, mouse parallax on the whole scene, seated camera fighting HTML overlays) | **Camera is fixed.** No OrbitControls. Instruments are not raycast meshes. |
| **Triple-canvas / never-unmount persistent `CockpitCanvas`** that fought the App Router | **At most one decorative canvas**, dynamically imported, error-bounded. Unmounts with the page. CSS world still paints if WebGL throws. |
| **HTML dashboard obscuring a 3D backdrop** — “SaaS page with a barely-visible cockpit” | **Full-viewport space-lab world.** Dashboard chrome (sidebar / TopBar / BottomNav) is **not mounted** on `/mission-control`. |
| **UI glyphs in the mesh** (3D buttons, uikit panels, Html from drei) that broke keyboard and SR paths | **DOM twins are the instruments.** Lab pods are real `<button role="option">`s. The canvas is `aria-hidden`. |
| **Desktop-only 50M “always ultra” (D3D-1)** with CSS fallbacks later ripped out, then bolted back as `MobileDashboard` | **Hybrid from day one.** Desktop/ultrawide + motion OK → light canvas. Tablet/mobile (including typical 1366×768 Chromebooks), `prefers-reduced-motion`, or WebGL error → **same IA**, CSS portal + gauges + pods. |
| **Feature-card grid** (white-bordered 2×3 marketing cards, Forge workbench cards) — theming glass on the same squares | **Architecture change:** ellipse of lab **pods/crystals** around a holographic core + Sparky on a pedestal. XP/streak are **gauges**, not stat cards. |

The Forge Ring (`src/components/labs/ForgeRing.tsx`) is the closest *successful*
precedent: CSS 3D, zero canvas, listbox keyboard contract. This hub borrows that
lesson and adds a space-lab world + instrument chrome, without putting navigation
inside R3F.

---

## How to toggle

```bash
# Enable the authenticated kid-hub route + sidebar/home entry
NEXT_PUBLIC_MISSION_CONTROL_HUB=true
```

- Flag **defaults to `false`** in every environment so `/home` stays the working dashboard.
- `/dev/mission-control` is a **public preview** (sample child “Nova”) and does **not** require the flag — same pattern as `/dev/forge` and `/dev/sparky`.
- Parent / settings / pricing are unchanged.

---

## What shipped in this prototype

1. Full-viewport space lab (CSS starfield + circuit portal; optional light WebGL).
2. Rugged metallic console frame (gunmetal + brass corners + amber status).
3. Central Sparky/ForgeSpark on a holographic pedestal (existing mascot, not a new 3D character).
4. 11 lab pods from `labColors` / `labs` config — clickable, arrow-key listbox, lucide glyphs (no new emoji).
5. XP + streak as circular HUD gauges.
6. `data-slot="lab-content"` bay — labeled GameShell mount point. Enter Lab still routes to `/labs/[id]`; games are **not** rewritten.
7. Reduced-motion: no spin/pulse, no canvas, same layout.

---

## Known limitations

- Prototype fidelity, not final art. Crystals are CSS clip-paths; the portal is a CSS ring + a cheap torus.
- Lab progress on `/mission-control` needs a signed-in child; the public preview uses sample percents.
- Selecting a pod does not yet mount `GameShell` — the bay is an explicit slot for a later phase.
- Canvas is skipped below the desktop tier (width < 1440) on purpose so 1366px Chromebooks stay on the CSS path.
- Not a marketing-site rewrite; `LandingFeatures` 2×3 grid remains as the documented anti-pattern until a later pass.
