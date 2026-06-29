# Master Design, UI/UX Reference Source

**Purpose:** Curated reference repos for SparkForge's Design, UI, and UX enhancement audit.
**Date:** April 12, 2026 | **Total Sources:** 17

---

## How to Use This Document

Each source below includes a direct GitHub link for Claude Code to read/analyze. Sources are organized by topic with a coverage matrix at the end ensuring 2-3+ sources per category.

---

## 1. Web Application Animations

### 1.1 GSAP (GreenSock Animation Platform)
- **Repo:** https://github.com/greensock/GSAP
- **Stars:** ~24,400
- **Description:** Industry-standard professional animation platform. Timeline-based sequencing, ScrollTrigger for scroll-driven effects, MorphSVG, and complex choreographed animations. Powers Awwwards-winning sites and Apple product pages. SparkForge already uses GSAP — this repo contains advanced examples, plugins, and patterns to maximize its potential.

### 1.2 Motion (formerly Framer Motion)
- **Repo:** https://github.com/motiondivision/motion
- **Stars:** ~31,500
- **Description:** The de facto React animation library. Declarative spring-physics animations, layout transitions, gesture handling, scroll-linked animations, and shared layout animations. SparkForge already uses Motion — the repo's examples and docs contain advanced patterns for page transitions, exit animations, and orchestrated sequences.

### 1.3 anime.js
- **Repo:** https://github.com/juliangarnier/anime
- **Stars:** ~67,100
- **Description:** Lightweight JavaScript animation engine with a clean API. Handles CSS properties, SVG, DOM attributes, and JS objects with staggering, timelines, and custom easing. Excellent reference for micro-interactions, staggered list animations, and hero entrance effects.

### 1.4 Animate.css
- **Repo:** https://github.com/animate-css/animate.css
- **Stars:** ~82,500
- **Description:** Cross-browser library of ready-to-use CSS animations. Drop-in class-based animations (bounce, fade, slide, zoom, flip). Useful reference for quick attention-grabbing effects and transition presets without JavaScript overhead.

---

## 2. 3D Animation & 3D Web Components

### 2.1 Three.js
- **Repo:** https://github.com/mrdoob/three.js
- **Stars:** ~111,900
- **Description:** The foundational JavaScript 3D library. Scene graph, WebGL2/WebGPU renderers, geometries, materials, lights, cameras, loaders, post-processing, and TSL shaders. SparkForge's entire 3D pipeline is built on Three.js — the repo's `/examples/` directory contains 300+ advanced demos covering every technique (PBR, particles, instancing, compute shaders, bloom, SSAO, volumetrics).

### 2.2 React Three Fiber (R3F)
- **Repo:** https://github.com/pmndrs/react-three-fiber
- **Stars:** ~30,500
- **Description:** React renderer for Three.js — build 3D scenes declaratively with JSX. Manages canvas, render loop, events, and disposal. SparkForge's CockpitCanvas, all 3D environments, and game scenes use R3F. The repo docs cover performance optimization, scene management, and integration patterns.

### 2.3 drei
- **Repo:** https://github.com/pmndrs/drei
- **Stars:** ~9,600
- **Description:** Essential companion library to R3F — 100+ ready-made helpers including cameras, controls, Environment/Lightformer staging, text rendering (troika), HTML overlays, shaders, shapes, and performance utilities. Direct reference for improving SparkForge's 3D component quality (ContactShadows, Sparkles, MeshTransmissionMaterial, Float, etc.).

### 2.4 Theatre.js
- **Repo:** https://github.com/theatre-js/theatre
- **Stars:** ~12,300
- **Description:** Visual motion design editor for the web with a GUI timeline. Create and tweak animations visually, then export for production. Works natively with Three.js/R3F and DOM. Ideal reference for crafting precise cinematic hero sequences and 3D scene choreography.

---

## 3. Hero Page Animations & Design

### 3.1 Lenis (Smooth Scroll)
- **Repo:** https://github.com/darkroomengineering/lenis
- **Stars:** ~13,600
- **Description:** Smooth, momentum-based scroll library. Commonly paired with GSAP ScrollTrigger for hero page scroll-driven 3D animations and parallax effects. Reference for elevating SparkForge's scroll experience across marketing pages and dashboard transitions.

### 3.2 React Bits
- **Repo:** https://github.com/DavidHDev/react-bits
- **Stars:** ~37,900
- **Description:** Open-source collection of animated, interactive React components built for visual impact. Includes text animations, scroll effects, 3D effects, background effects, and interactive UI elements. Directly usable reference for hero sections, landing page wow-factor, and creative component patterns.

---

## 4. Unique Frontend Design & UI Component Systems

### 4.1 shadcn/ui
- **Repo:** https://github.com/shadcn-ui/ui
- **Stars:** ~112,200
- **Description:** Beautifully designed, accessible, copy-paste React components built on Radix UI primitives and Tailwind CSS. Not an npm library — you own the code. The dominant modern React component system. Reference for component architecture, accessibility patterns, theming, and design token organization.

### 4.2 Magic UI
- **Repo:** https://github.com/magicuidesign/magicui
- **Stars:** ~20,700
- **Description:** UI library for design engineers — 110+ animated components and effects for Next.js/React. Includes dock components, spotlight cards, glassmorphism, scroll animations, 3D card effects, and particle backgrounds. Built on Motion + Tailwind. Directly relevant reference for SparkForge's Frost-Prismatic aesthetic (glassmorphism, neon glows, animated cards).

### 4.3 HeroUI (formerly NextUI)
- **Repo:** https://github.com/heroui-inc/heroui
- **Stars:** ~28,900
- **Description:** Beautiful, fast React UI library with automatic dark mode, built-in animations, and visual polish focus. Built on Tailwind CSS and React Aria for accessibility. Reference for dark-mode-first design patterns, animated component transitions, and modern aesthetic sensibility.

---

## 5. Top Web UI/UX & Design Systems

### 5.1 Storybook
- **Repo:** https://github.com/storybookjs/storybook
- **Stars:** ~89,700
- **Description:** Industry-standard workshop for building, documenting, and testing UI components in isolation. Works with React, Vue, Angular, Svelte. Reference for establishing a component development workflow, visual regression testing, and design system documentation for SparkForge's 172+ 3D components.

### 5.2 Awesome Design MD
- **Repo:** https://github.com/VoltAgent/awesome-design-md
- **Stars:** ~45,300
- **Description:** Collection of DESIGN.md files inspired by major brand design systems (Apple, Google, Stripe, Linear, Vercel). Drop one into your project and AI coding agents generate matching UI. Directly relevant for formalizing SparkForge's Frost-Prismatic design system into a machine-readable spec that ensures consistent design across all 35 games and 49 3D components.

---

## 6. Building & Designing Web Applications

### 6.1 Design Resources for Developers
- **Repo:** https://github.com/bradtraversy/design-resources-for-developers
- **Stars:** ~65,200
- **Description:** Massive curated directory of design and UI resources — stock photos, web templates, CSS frameworks, UI libraries, fonts, icons, color tools, illustrations, design inspiration sites, and more. One-stop reference for sourcing design assets and finding inspiration during SparkForge's enhancement audit.

### 6.2 Awesome Creative Coding
- **Repo:** https://github.com/terkelg/awesome-creative-coding
- **Stars:** ~14,700
- **Description:** Curated list covering generative art, data visualization, interaction design, shaders, math for graphics, Three.js resources, and creative tools. Reference for pushing SparkForge's 3D visual quality — shader techniques, particle system patterns, procedural generation, and interactive art approaches.

---

## Topic Coverage Matrix

Each topic has 2-3+ sources ensuring comprehensive coverage for the enhancement audit.

| Topic | Sources (by section #) | Count |
|-------|----------------------|-------|
| **Web application animations** | 1.1 GSAP, 1.2 Motion, 1.3 anime.js, 1.4 Animate.css | 4 |
| **3D animation** | 2.1 Three.js, 2.2 R3F, 2.3 drei, 2.4 Theatre.js | 4 |
| **Hero page animations** | 1.1 GSAP, 1.2 Motion, 3.1 Lenis, 3.2 React Bits | 4 |
| **Hero page design** | 3.2 React Bits, 4.2 Magic UI, 4.3 HeroUI | 3 |
| **Supremely unique frontend design** | 4.1 shadcn/ui, 4.2 Magic UI, 3.2 React Bits, 4.3 HeroUI | 4 |
| **3D web application components** | 2.1 Three.js, 2.2 R3F, 2.3 drei | 3 |
| **Top web UI/UX** | 4.1 shadcn/ui, 5.1 Storybook, 5.2 Awesome Design MD | 3 |
| **3D UI** | 2.1 Three.js, 2.2 R3F, 2.3 drei, 2.4 Theatre.js | 4 |
| **Improving web application UX** | 1.1 GSAP, 1.2 Motion, 3.1 Lenis, 5.1 Storybook | 4 |
| **Building & designing web applications** | 6.1 Design Resources, 5.2 Awesome Design MD, 4.1 shadcn/ui | 3 |
| **Building & designing applications** | 6.1 Design Resources, 5.1 Storybook, 6.2 Awesome Creative Coding | 3 |
| **Front end design** | 4.1 shadcn/ui, 4.2 Magic UI, 4.3 HeroUI, 1.4 Animate.css | 4 |
| **UI/UX** | 4.1 shadcn/ui, 5.1 Storybook, 5.2 Awesome Design MD, 6.1 Design Resources | 4 |

---

## Quick Reference — All 17 Sources by Star Count

| # | Repository | Stars | Primary Focus |
|---|-----------|-------|---------------|
| 1 | shadcn-ui/ui | ~112K | Component system (Radix + Tailwind) |
| 2 | mrdoob/three.js | ~112K | 3D engine (WebGL/WebGPU) |
| 3 | storybookjs/storybook | ~90K | UI component workshop |
| 4 | animate-css/animate.css | ~82K | CSS animation presets |
| 5 | juliangarnier/anime | ~67K | JS animation engine |
| 6 | bradtraversy/design-resources | ~65K | Design resource directory |
| 7 | VoltAgent/awesome-design-md | ~45K | AI-readable design systems |
| 8 | DavidHDev/react-bits | ~38K | Animated React components |
| 9 | motiondivision/motion | ~31K | React animation library |
| 10 | pmndrs/react-three-fiber | ~30K | React renderer for Three.js |
| 11 | heroui-inc/heroui | ~29K | Dark-mode-first UI library |
| 12 | greensock/GSAP | ~24K | Professional animation platform |
| 13 | magicuidesign/magicui | ~21K | Animated design components |
| 14 | terkelg/awesome-creative-coding | ~15K | Creative coding resources |
| 15 | darkroomengineering/lenis | ~14K | Smooth scroll library |
| 16 | theatre-js/theatre | ~12K | Visual 3D animation editor |
| 17 | pmndrs/drei | ~10K | R3F helper components |

---

## SparkForge Stack Relevance

Sources already in SparkForge's stack (highest priority for audit):
- **Three.js** — Core 3D engine (r183+, TSL, WebGPU)
- **React Three Fiber** — React 3D renderer (CockpitCanvas, all 3D scenes)
- **drei** — R3F helpers (Environment, Text, staging)
- **Motion** — 2D animation library (page transitions, UI animations)
- **GSAP** — Scroll-driven and timeline animations

New sources to evaluate during audit:
- **Magic UI** — Glassmorphism, animated cards, particle effects (Frost-Prismatic alignment)
- **React Bits** — Hero section effects, interactive backgrounds
- **Theatre.js** — Visual timeline for hero animation choreography
- **Lenis** — Smooth scroll enhancement
- **Awesome Design MD** — Formalize Frost-Prismatic as DESIGN.md for consistency
- **HeroUI** — Dark-mode-first component patterns

---

*End of Master Design, UI/UX Reference Source v1.0 — 17 sources across 13 topic categories*
