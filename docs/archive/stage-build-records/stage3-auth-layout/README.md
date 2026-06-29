# Stage 3: Auth, Layout, Station Frame, Hero Animation & Cockpit Architecture

**Build Phase:** 4–5D of 30
**v3-FINAL:** Mixed (Parts 1–2 v2, Parts 3A–3B v3-FINAL, Hero A/B v3-FINAL, Cockpit A/B v3-FINAL)
**Hard Stops:** HS-5 (visual after Stage 3 parts), HS-5 (visual after Hero), HS-5 + HS-9 (visual after Cockpit)
**Decision IDs:** 1.1–1.7, 2.1–2.5, 7.1, 7.3–4, 8.1, OD-1–OD-4, CPA2-1–CPA2-12

## Documents in This Folder (8 files)

| Filename | Phase | Type | Content |
|----------|-------|------|---------|
| `STAGE3_Auth_Layout_Shell_v2_PART1.md` | 4 | v2 | AuthProvider, signup, login, reset-password |
| `STAGE3_Auth_Layout_Shell_v2_PART2.md` | 5 | v2 | Dashboard layout, Sidebar, TopBar, ChildSelector |
| `STAGE3_Auth_Layout_Shell_v3_PART3A_20260314.md` | 5 | v3-FINAL | StationFrame, CPA v2.0 integration, mode system |
| `STAGE3_Auth_Layout_Shell_v3_PART3B_20260314.md` | 5 | v3-FINAL | Emissive CSS, onboarding crystal, landing page |
| **`HERO_ANIMATION_v3FINAL_PartA.md`** | **5A** | **v3-FINAL** | **Hero stores, GPU detection, shaders, 3D utilities** |
| **`HERO_ANIMATION_v3FINAL_PartB.md`** | **5B** | **v3-FINAL** | **Hero particles, audio, hook, orchestrator (HeroAnimation.tsx)** |
| **`COCKPIT_CPA2_v3FINAL_PartA.md`** | **5C** | **v3-FINAL** | **CockpitCanvas, CameraSystem, 20M shell geometry** |
| **`COCKPIT_CPA2_v3FINAL_PartB.md`** | **5D** | **v3-FINAL** | **Spatial dashboard, HUD, transitions, audio, polish** |

## Build Order

1. Stage 3 Parts 1-2 (v2) → Auth + Dashboard Layout
2. Stage 3 Part 3A/B (v3-FINAL) → StationFrame Shell
3. **Hero Animation Part A** → Stores, GPU detection, shaders
4. **Hero Animation Part B** → Particles, audio, orchestrator → **HS-5 Visual Check**
5. **Cockpit CPA2 Part A** → Unified canvas, camera, shell geometry
6. **Cockpit CPA2 Part B** → Spatial content, transitions, audio → **HS-9 Handoff Check**

## Validation

- Login → Dashboard loads with sidebar
- Station frame visible (Part 3)
- **Hero animation plays 8 phases on first visit (19s)**
- **Cockpit renders at 20M tris, hero→cockpit handoff seamless**
- **Mobile: CSS fallback, no R3F Canvas**

## Commits & Tags

```bash
git commit -m "Stage 3: Auth + Layout + Station Frame"
git tag -a v0.3.0 -m "Stage 3 complete: Auth + Layout + Station Frame"

git commit -m "Phase 5A-5B: Hero Animation — 8-phase cinematic sequence"
git tag -a v0.3.1 -m "Stage 3-Hero complete: 8-phase cinematic hero animation"

git commit -m "Phase 5C-5D: Cockpit CPA2 — 20M 3D Panoramic Cockpit"
git tag -a v0.3.2 -m "Stage 3-Cockpit complete: 20M 3D Panoramic Cockpit"
```
