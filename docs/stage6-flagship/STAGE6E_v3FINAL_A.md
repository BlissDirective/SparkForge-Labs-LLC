# Stage 6E v3-FINAL Part A — Agent Architect 3D Pipeline

**Version:** v3-FINAL
**Build Phase:** 13 (Stage 6E — Agent Architect, Part A: 3D pipeline component)
**Prerequisites:** Stage 3 Part 3 v3-FINAL (StationFrame + HDR infrastructure), Stage 5 complete
**Validation:** `npm run build` PASS, `npx tsc --noEmit` PASS, `npm run lint` PASS
**Lab:** 5 — Agents & Helpers | **Color:** #10B981 (Emerald/Green)
**Age Bands:** B (11-13), C (14-16) — Band A uses 2D fallback (drag complexity)

---

## Overview

This document creates the 3D pipeline visualization for the Agent Architect flagship game. One file: `AgentPipeline3D.tsx` (full R3F 3D platform with typed block geometries, TubeGeometry connections, InstancedMesh data packets, SpotLight execution tracking, and flagship emerald particles).

**Part A scope:** 3D component only. Part B contains the full `AgentArchitectGame.tsx` game replacement.

### Decisions Implemented

| Decision | Description | Component |
|----------|-------------|-----------|
| 6.4 | Full 3D platform preferred; 2D+3D hybrid fallback | AgentPipeline3D.tsx |
| 6.2.4 | Block shapes: Box/Cylinder/Octahedron per type. Connections: TubeGeometry + CatmullRomCurve3. Run: InstancedMesh cubes + SpotLight. ~5K triangles. | AgentPipeline3D.tsx |
| 5.3 | Flagship custom particles (emerald pipeline data stream) | AgentPipeline3D.tsx |

### Bug Fixes Preserved

| Bug | Description |
|-----|-------------|
| BUG-10F | Font stack: Exo 2/Sora/Orbitron NOT Fredoka/Nunito |

### v2 Enhancements Preserved (in Part B game file)

- 10 configurable block types (7 base + 3 advanced) with progressive unlock
- 8 structured missions with star ratings, difficulty levels, block requirements
- 5-phase game flow (welcome, learn, missions, build, report)
- Cinema mode execution with spotlight, narration bar, emoji trail
- Block configuration panels (goal text, search targets, tool selection, conditions)
- Live pseudocode generation (Band C) with auto-generated if/else, while, Promise.all
- Chrome bezel, LED rim, emerald particle background, glass panels
- All ARIA labels and accessibility features
- Age-band differentiation: A (guided, 5 blocks), B (all, 7 blocks), C (+ code, 10 blocks)

---

## Files

| Action | File | Lines |
|--------|------|-------|
| NEW | `src/components/3d/AgentPipeline3D.tsx` | ~400 |

**Supersedes:** No prior 3D file existed for Agent Architect. The v2 used CSS-only isometric effects.

### Triangle Budget Breakdown (5M Enhancement — March 18, 2026)

| Component | Desktop Ultra | LOD Low |
|-----------|-------------|---------|
| AgentPipeline3D (blocks + tubes + packets) | ~28K | ~11K |
| AgentArchitectEnvironment (server corridor) | ~350K | ~15K |
| AgentArchitectEnvironment (conveyor system) | ~100K | ~5K |
| AgentArchitectEnvironment (tool shelves) | ~80K | ~0 |
| AgentArchitectEnvironment (debug tower + cables) | ~130K | ~0 |
| AgentArchitectEnvironment (data pulse + terrain + sky) | ~290K | ~10K |
| **Total** | **~1.0M** | **~41K** |

**Scene total:** ~1.0M tris (desktop ultra) with LODWrapper adaptive FPS monitoring.
Immersive server command center: server corridor with LED status lights, conveyor belt system, tool shelves, debug call-stack tower, cable conduits, emerald data pulse floor rings.

### New Files (5M Enhancement)

| # | File | Purpose |
|---|------|---------|
| 2 | `src/components/3d/environments/AgentArchitectEnvironment.tsx` | Immersive server command center |

| Device | Max Budget | Target FPS | LOD Level |
|--------|-----------|------------|-----------|
| Desktop | 5,000,000 | 60 | ultra/high |
| Tablet | 2,500,000 | 45 | medium |
| Mobile | 1,250,000 | 30 | low |

---

## What Changed from v2 to v3-FINAL

| Aspect | v2 (Current) | v3-FINAL (This Document) |
|--------|-------------|--------------------------|
| Workspace Visualization | CSS isometric grid with 2D blocks, CSS depth shadows, SVG arrows | Full R3F 3D platform with typed 3D geometries per block, TubeGeometry connections |
| Block Shapes | Flat 2D cards with CSS box-shadow depth illusion | 3D geometries per type: BoxGeometry (Goal/Done), CylinderGeometry (Search/Tool), OctahedronGeometry (Decide/Check), TorusGeometry (Loop), etc. |
| Connections | SVG line with dashed stroke and CSS particle animation | TubeGeometry along CatmullRomCurve3 paths with emissive pulse material |
| Execution Animation | CSS radial-gradient spotlight + SVG animateMotion particles | InstancedMesh data cubes travel along tubes + SpotLight follows active block + PointLight glow |
| Camera | N/A (2D fixed view) | Fixed 45-deg overhead angle. Position: [0, 8, 6]. Smooth pan to active block in run. |
| Interaction | Motion drag on 2D positioned divs | Raycasting for block click. Block palette adds to 3D grid. Framer drag preserved in 2D fallback (mobile). |
| Triangle Budget | N/A (CSS/SVG) | ~5K max (10 blocks x 200 tri + 15 tubes x 100 tri + platform + particles) |
| Mobile Fallback | Same 2D at all sizes | 2D CSS workspace preserved as fallback. Auto-detect via window.innerWidth < 768. |
| 3D Component | None | AgentPipeline3D.tsx (NEW) Dynamic import, ssr: false |

---

## 3D Pipeline Specification (Decision 6.4 + 6.2.4)

| Element | Implementation | Details |
|---------|---------------|---------|
| Platform | PlaneGeometry(14, 10) | CanvasTexture grid material, emerald lines on dark bg |
| Goal Block | BoxGeometry(0.7, 0.45, 0.7) | Emerald #10B981, emissive glow when active |
| Search Block | CylinderGeometry(0.35, 0.35, 0.45, 16) | Blue #3B82F6, rotation animation |
| Tool Block | CylinderGeometry(0.3, 0.3, 0.55, 6) | Orange #F97316, hexagonal shape |
| Decide Block | OctahedronGeometry(0.38) | Purple #8B5CF6, pulse animation |
| Check Block | OctahedronGeometry(0.32) | Cyan #06B6D4 |
| Loop Block | TorusGeometry(0.28, 0.09, 8, 24) | Amber #F59E0B, rotating ring |
| Memory Block | SphereGeometry(0.32, 16, 12) | Pink #EC4899 |
| Parallel Block | BoxGeometry(0.8, 0.35, 0.4) | Yellow #EAB308, twin visual |
| Human Block | SphereGeometry(0.3, 16, 12) | Rose #F43F5E, heartbeat pulse |
| Done Block | BoxGeometry(0.55, 0.35, 0.55) | Gray #6B7280, gold on complete |
| Connections | TubeGeometry + CatmullRomCurve3 | Radius 0.03, 16 segments, emissive on active path, color from source block |
| Data Packets | InstancedMesh (BoxGeometry 0.08) | 4 per connection during run, travel along curve path, emerald glow trail |
| Spotlight | SpotLight | Follows active block, intensity 3, penumbra 0.5, smooth lerp tracking |
| Labels | drei Text | Block emoji + label above, config text below, billboard to camera |
| Particles | Points (80 count) | Emerald ambient rising, Decision 5.3 flagship custom, Float32Array positions |
| Camera | Fixed position [0, 8, 6], FOV 50 | No OrbitControls (fixed overhead view) |
| Budget | ~5K triangles max | 10 blocks x ~200 tri + connections + platform + particles + labels |
| Mobile | Not loaded | Parent auto-detects < 768px, falls back to v2 2D CSS, no R3F imported on mobile |

---

## Prerequisites

Packages (should exist from Stage 1 + Stage 3 P3 v3-FINAL):

```bash
npm list three @react-three/fiber @react-three/drei @react-three/postprocessing
```

If missing:

```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

---

## Step 1: NEW FILE — AgentPipeline3D.tsx

**File:** `src/components/3d/AgentPipeline3D.tsx` (NEW)
**Action:** CREATE
**Replaces:** Nothing (new file)

See source file for complete implementation.

---

## End of Part A

Part A complete. AgentPipeline3D.tsx provides the full 3D pipeline visualization for Agent Architect. It exports the default Canvas wrapper component (for dynamic import) and the `toPipelineBlocks` helper (for bridging v2 block state to 3D props).

**Next:** Proceed to Stage 6E v3-FINAL Part B for the complete standalone `AgentArchitectGame.tsx`.
