# STAGE 1: FOUNDATION — Part 1 of 2 (Config & Structure)

**Version:** v2 | **Status:** COMPLETE | **v3-FINAL:** None (v2 only)
**Covers:** Next.js project setup, npm packages, config files, globals.css, directory structure
**Prerequisites:** Node.js 20+, Git, VS Code
**Estimated Build Time:** 20–30 minutes

---

## Overview

Stage 1 Part 1 establishes the SparkForge project skeleton:

1. Create Next.js 15 project with TypeScript (React 19)
2. Install all npm dependencies (50+ packages across 10 install commands)
3. Configure TypeScript, Tailwind CSS 4, PostCSS, Next.js 15, environment variables
4. Create globals.css with Frost-Prismatic design system
5. Create 30+ directories for the full project structure

After completing Part 1, the project compiles and the dev server starts — but no pages or components exist yet (those come in Part 2).

---

## Step 1: Create Next.js Project

> **Enhancement 8.1:** Upgraded from Next.js 14 → 15 (React 19, Turbopack stable,
> Server Actions stable, improved caching). See ENHANCEMENT_BLUEPRINT_v1.0 Section 8.1.

```bash
npx create-next-app@15 sparkforge \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack
```

After creation, `cd sparkforge`.

---

## Step 2: Install Dependencies (10 Commands)

> **Enhancement 8.1 Upgrades Applied:**
> - `framer-motion` → `motion` (rebranded, lighter — same API, import from `motion/react`)
> - `recharts` → `@nivo/core @nivo/line @nivo/bar` (better viz, animations, SSR support)
> - Added `jotai` for fine-grained 3D state (fewer re-renders alongside Zustand)
> - Added `@sentry/nextjs` for error tracking + performance monitoring
> - Three.js r170+ (WebGPU renderer, TSL shading language, batched rendering)
> - Added `msw` + `playwright` + `@playwright/test` for comprehensive testing
> - See ENHANCEMENT_BLUEPRINT_v1.0 Section 8.1 for full rationale.

### 2a — Supabase + Auth

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2b — State Management + Data Fetching

```bash
npm install zustand jotai @tanstack/react-query @tanstack/react-query-devtools
```

> **Enhancement 8.1:** Added `jotai` for atomic fine-grained 3D state (cockpit panel values,
> shader uniforms, particle counts) — avoids full-store re-renders that Zustand can cause
> with frequent 3D updates. Zustand remains for coarse app state (auth, child, game, ui).

### 2c — UI Libraries

```bash
npm install motion gsap lucide-react clsx tailwind-merge class-variance-authority tailwindcss-animate
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs \
  @radix-ui/react-tooltip @radix-ui/react-switch @radix-ui/react-slider \
  @radix-ui/react-progress @radix-ui/react-select @radix-ui/react-avatar
```

> **Enhancement 8.1:** `framer-motion` replaced with `motion` (same library, rebranded and lighter).
> Import path changes: `from 'motion/react'` → `from 'motion/react'`.
> GSAP is kept alongside for complex timeline animations (game sequences, ceremony FX).

### 2d — 3D Rendering

```bash
npm install three@latest @react-three/fiber @react-three/drei @react-three/postprocessing leva
```

> **Enhancement 8.1/8.2:** Three.js r170+ includes WebGPU renderer and TSL (Three.js Shading
> Language). WebGPU auto-detection with WebGL2 fallback configured in Stage 1 Part 2.

### 2e — Charts + Audio

```bash
npm install @nivo/core @nivo/line @nivo/bar @nivo/radar tone
```

> **Enhancement 8.1:** `recharts` replaced with `@nivo/core` + chart type packages.
> Nivo provides better animation, SSR support, and sophisticated visualization for
> parent dashboard analytics and learning progress charts.

### 2f — Payments

```bash
npm install stripe @stripe/stripe-js
```

### 2g — Validation

```bash
npm install zod
```

### 2h — AI SDK + Drag-and-Drop

```bash
npm install @anthropic-ai/sdk @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 2i — Error Tracking + Monitoring

```bash
npm install @sentry/nextjs
```

> **Enhancement 8.1:** Sentry provides error tracking, performance monitoring, and session
> replay. Initialization configured in Stage 1 Part 2 (sentry.client.config.ts,
> sentry.server.config.ts, sentry.edge.config.ts). Dashboard at sentry.io.

### 2j — Dev Dependencies (Testing Infrastructure)

```bash
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom \
  playwright @playwright/test msw happy-dom
```

> **Enhancement 8.5 — Testing Infrastructure:**
> - `vitest` + `@vitest/coverage-v8`: Unit + integration tests (Vite-native, fast)
> - `@testing-library/react` + `@testing-library/jest-dom`: Component testing
> - `playwright` + `@playwright/test`: E2E tests, cross-browser, visual regression screenshots
> - `msw`: Mock Service Worker for API mocking (Supabase, Stripe, Anthropic)
> - `happy-dom`: Fast DOM implementation for Vitest
>
> **Testing pyramid (configured in Stage 10 Part 1):**
> - Unit tests: Store logic, utility functions, game scoring, XP calculations
> - Component tests: Game rendering, phase transitions, accessibility compliance
> - Integration tests: API routes, Supabase queries, Stripe webhook handling
> - E2E tests: Full user journeys (signup → play game → earn badge → parent views progress)
> - Visual regression: Playwright screenshots for cockpit/game UI consistency
> - Performance tests: Lighthouse CI in GitHub Actions, triangle budget enforcement

---

## Step 3: TypeScript Configuration

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "noEmit": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Step 4: Tailwind CSS Configuration

> **Enhancement 8.1:** Tailwind CSS 4 uses the Oxide engine (10x faster builds) and supports
> CSS-first configuration. However, the JS config file (`tailwind.config.ts`) is still supported
> for complex configurations. Tailwind 4 also adds native container queries and `@starting-style`
> for entry animations. The config below remains compatible with both Tailwind 3 and 4.

**File:** `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ═══ Frost-Prismatic Neon Accents (60% blue / 40% pops) ═══
        neon: {
          blue: { DEFAULT: '#00BBFF', dim: '#00BBFF40', glow: '#00BBFF25' },
          green: { DEFAULT: '#00FF88', dim: '#00FF8840', glow: '#00FF8825' },
          purple: { DEFAULT: '#AA66FF', dim: '#AA66FF40', glow: '#AA66FF25' },
          orange: { DEFAULT: '#FF6644', dim: '#FF664440', glow: '#FF664425' },
          amber: { DEFAULT: '#FFAA44', dim: '#FFAA4440', glow: '#FFAA4425' },
        },
        // ═══ spark-* ALIASES — backward compatibility (IMP-4) ═══
        spark: {
          blue: '#00BBFF',
          purple: '#AA66FF',
          green: '#00FF88',
          orange: '#FF6644',
          coral: '#FF6644',
          amber: '#FFAA44',
        },
        // ═══ Surface Colors (dark mode) ═══
        surface: {
          deep: '#0A0E16',
          card: '#111118',
          elevated: '#1A1822',
          border: 'rgba(255, 255, 255, 0.06)',
        },
        // ═══ Lab Accent Colors (1-10) ═══
        lab: {
          1: '#00BBFF',
          2: '#AA66FF',
          3: '#FF66AA',
          4: '#FFAA44',
          5: '#00FF88',
          6: '#FF6644',
          7: '#06B6D4',
          8: '#818CF8',
          9: '#F97316',
          10: '#D946EF',
        },
      },
      fontFamily: {
        display: ['Exo 2', 'system-ui', 'sans-serif'],
        body: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        data: ['Orbitron', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0,187,255,0.25)',
        'glow-purple': '0 0 20px rgba(170,102,255,0.25)',
        'glow-green': '0 0 20px rgba(0,255,136,0.25)',
        'glow-orange': '0 0 20px rgba(255,102,68,0.25)',
        'glow-amber': '0 0 20px rgba(255,170,68,0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.06)',
        'chrome': '0 1px 0 rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.12)',
        'interactive': '0 4px 20px rgba(0,0,0,0.3), 0 0 15px var(--lab-glow, rgba(0,187,255,0.15))',
      },
      backgroundImage: {
        'frost-gradient': 'linear-gradient(135deg, rgba(0,187,255,0.08), rgba(170,102,255,0.05))',
        'chrome-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
        'glass-surface': 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(0,187,255,0.15)' },
          '50%': { boxShadow: '0 0 24px rgba(0,187,255,0.3)' },
        },
        'chrome-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'connection-pulse': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.8' },
        },
        'hex-appear': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'badge-unlock': {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '60%': { transform: 'scale(1.3) rotate(10deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-10vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        'slide-up-spring': {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '60%': { transform: 'translateY(-4px)' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-bounce': {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '70%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'xp-counter': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-60px) scale(1.5)', opacity: '0' },
        },
        'subtle-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,187,255,0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(0,187,255,0.25)' },
        },
        'skeleton-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-border-rotate': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        'float': 'float 3.5s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'chrome-shimmer': 'chrome-shimmer 3s linear infinite',
        'connection-pulse': 'connection-pulse 4s ease-in-out infinite',
        'hex-appear': 'hex-appear 0.4s ease both',
        'badge-unlock': 'badge-unlock 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'confetti-fall': 'confetti-fall 3s ease-in forwards',
        'slide-up': 'slide-up-spring 0.5s ease-out forwards',
        'scale-bounce': 'scale-bounce 0.5s ease-out forwards',
        'xp-float': 'xp-counter 1.5s ease-out forwards',
        'subtle-glow': 'subtle-glow 4s ease-in-out infinite',
        'skeleton-shimmer': 'skeleton-shimmer 1.8s linear infinite',
        'glow-border': 'glow-border-rotate 4s ease infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

## Step 5: PostCSS Configuration

**File:** `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## Step 6: Next.js Configuration

**File:** `next.config.ts`

> **Note:** This is the Stage 1 starter config. Stage 10 Part 2 REPLACES this with
> production security headers, CSP, and caching. See STAGE10_Polish_Deploy_v2_PART2.
>
> **Enhancement 8.1:** Updated for Next.js 15 — uses `next.config.ts` (TypeScript native),
> Turbopack as default dev bundler, and `serverExternalPackages` (replaces experimental
> `serverComponentsExternalPackages`). Sentry integration via `withSentryConfig` wrapper.

```typescript
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Next.js 15: serverExternalPackages replaces experimental.serverComponentsExternalPackages
  serverExternalPackages: ['three', '@react-three/fiber', '@react-three/drei'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@nivo/core',
      '@nivo/line',
      '@nivo/bar',
    ],
    // Next.js 15: Turbopack is stable and used by default in dev
    turbo: {
      rules: {
        // Handle GLSL shader imports via Turbopack
        '*.glsl': { loaders: ['raw-loader'], as: '*.js' },
        '*.vert': { loaders: ['raw-loader'], as: '*.js' },
        '*.frag': { loaders: ['raw-loader'], as: '*.js' },
      },
    },
  },
  webpack: (config, { isServer }) => {
    // GLSL shader loader for production builds (Webpack)
    config.module.rules.push({
      test: /\.(glsl|vert|frag)$/,
      type: 'asset/source',
    });
    return config;
  },
};

// Sentry wraps the Next.js config for source maps + error tracking
export default withSentryConfig(nextConfig, {
  // Sentry build options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI, // Suppress logs in local dev
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring', // Proxy Sentry requests to avoid ad-blockers
  disableLogger: true,
});
```

---

## Step 7: Environment Variables Template

**File:** `.env.example`

```bash
# ════════════════════════════════════════════════════
# SPARKFORGE ENVIRONMENT VARIABLES
# Copy this file to .env.local and replace with real values
# NEVER commit .env.local — it contains secrets!
# ════════════════════════════════════════════════════

# ═══ Supabase ═══
# Get these from: Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi…your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi…your-service-role-key

# ═══ Anthropic AI (server-side ONLY — never in client bundle) ═══
ANTHROPIC_API_KEY=sk-ant-your-key-here

# ═══ Stripe (payment processing) ═══
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_PLUS_MONTHLY_ID=price_plus_monthly
STRIPE_PLUS_YEARLY_ID=price_plus_yearly
STRIPE_FORGE_MONTHLY_ID=price_forge_monthly
STRIPE_FORGE_YEARLY_ID=price_forge_yearly

# ═══ App Configuration ═══
NEXT_PUBLIC_URL=http://localhost:3000
CRON_SECRET=generate-a-random-string-here

# ═══ Feature Flags ═══
NEXT_PUBLIC_FF_WELCOME_ACHIEVEMENT=false
NEXT_PUBLIC_FF_LEVEL_CEREMONY=false
NEXT_PUBLIC_FF_PARENT_DASHBOARD=false
NEXT_PUBLIC_FF_CONTENT_AGENT=false
NEXT_PUBLIC_FF_OFFLINE_MODE=false

# ═══ Sentry (Enhancement 8.1 — Error Tracking + Monitoring) ═══
SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/1234567
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=sparkforge
SENTRY_AUTH_TOKEN=sntrys_your-auth-token

# ═══ Deployment (set in Vercel Dashboard) ═══
ENABLE_CONTENT_AGENT=true
ENABLE_CAMERA_GAMES=true
```

---

## Step 8: Global CSS — Frost-Prismatic Design System

**File:** `src/app/globals.css`

This file establishes the complete CSS design system for SparkForge. It contains:

- Google Fonts import (Exo 2, Sora, JetBrains Mono, Orbitron)
- CSS custom properties for neon accents, surfaces, text, chrome bezel, and lab colors
- `.skip-to-content` — accessibility skip navigation link
- `.chrome-frame` / `.chrome-highlight` / `.led-rim` / `.screen-inner` — metallic bezel components
- `.glass-card` — glassmorphism card with backdrop blur
- `.frost-blur` — heavier blur for modals/dropdowns
- `.control-panel-btn` — hover lift effect for interactive buttons
- `.interactive-hover` — GPU-accelerated lift + glow for game tiles
- `.neon-text` — neon text glow effect
- `.gradient-text-frost` / `.gradient-text-lab` — gradient text effects
- `.skeleton-shimmer` — CSS-only loading shimmer
- `.glow-border` — animated gradient border for premium cards
- `.page-enter` / `.page-exit` — page transition classes
- View Transitions API progressive enhancement
- `.particle` — floating particle dot animation
- `.bg-cosmic-dark` — starfield background
- Custom scrollbar styling
- Focus-visible outlines (accessibility)
- `@media (prefers-reduced-motion: reduce)` — motion reduction
- `.dyslexia-font` — dyslexia-friendly font toggle
- `.high-contrast` — high contrast mode override
- `.font-size-large` / `.font-size-xl` — font size presets

> The v3 additions (emissive glow, scanlines, vignette, station frame CSS, cockpit indicators)
> are added in Stage 3 Part 3 and later stages.

---

## Step 9: .gitignore

**File:** `.gitignore`

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Build output
.next/
out/
build/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Testing (Enhancement 8.5)
coverage/
test-results/
playwright-report/
blob-report/

# Sentry (Enhancement 8.1)
.sentryclirc
```

---

## Step 10: Create Directory Structure

Create all directories needed for the full project. Later stages will populate these with files.

```bash
# App routes
mkdir -p src/app/(auth)/login
mkdir -p src/app/(auth)/signup
mkdir -p src/app/(auth)/reset-password
mkdir -p src/app/(dashboard)/home
mkdir -p src/app/(dashboard)/labs
mkdir -p src/app/(dashboard)/arcade/\[gameSlug\]
mkdir -p src/app/(dashboard)/profile
mkdir -p src/app/(dashboard)/badges
mkdir -p src/app/(dashboard)/onboarding
mkdir -p src/app/(dashboard)/parent/add-child
mkdir -p src/app/(dashboard)/parent/subscription
mkdir -p src/app/(dashboard)/admin/content
mkdir -p src/app/(dashboard)/content/\[slug\]
mkdir -p src/app/(marketing)/pricing
mkdir -p src/app/(public)

# API routes
mkdir -p src/app/api/auth/login
mkdir -p src/app/api/auth/signup
mkdir -p src/app/api/auth/logout
mkdir -p src/app/api/auth/me
mkdir -p src/app/api/auth/callback
mkdir -p src/app/api/children/\[childId\]
mkdir -p src/app/api/content/\[slug\]
mkdir -p src/app/api/progress/all-labs
mkdir -p src/app/api/progress/world
mkdir -p src/app/api/gamification/xp
mkdir -p src/app/api/gamification/streak
mkdir -p src/app/api/gamification/badges
mkdir -p src/app/api/sessions
mkdir -p src/app/api/health
mkdir -p src/app/api/stripe/checkout
mkdir -p src/app/api/stripe/portal
mkdir -p src/app/api/stripe/webhook
mkdir -p src/app/api/ai/prompt-lab
mkdir -p src/app/api/agent/run
mkdir -p src/app/api/agent/review
mkdir -p src/app/api/agent/schedule

# Components
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/dashboard
mkdir -p src/components/games
mkdir -p src/components/game
mkdir -p src/components/gamification
mkdir -p src/components/celebrations
mkdir -p src/components/profile
mkdir -p src/components/labs
mkdir -p src/components/landing
mkdir -p src/components/parent
mkdir -p src/components/providers
mkdir -p src/components/transitions
mkdir -p src/components/shared
mkdir -p src/components/3d
mkdir -p src/components/accessibility
mkdir -p src/components/content

# Core
mkdir -p src/lib/supabase
mkdir -p src/lib/3d
mkdir -p src/lib/audio
mkdir -p src/lib/agent
mkdir -p src/stores
mkdir -p src/hooks
mkdir -p src/types
mkdir -p src/config
mkdir -p src/shaders/labPatterns

# Public assets
mkdir -p public/images
mkdir -p public/sounds/cockpit
mkdir -p public/fonts
mkdir -p public/models/pets
mkdir -p public/hdri

# Testing (Enhancement 8.5)
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p tests/mocks
```

---

## Validation

After completing all 10 steps:

```bash
npm run build
```

Expected: Build succeeds (may show warnings about missing pages — that's normal, pages come in Part 2 and later stages).

```bash
npm run dev
```

Expected: Dev server starts on `localhost:3000`. Default Next.js page renders.

---

## Commit

```bash
git add -A
git commit -m "Stage 1 Part 1: Config and folder structure"
```

---

## Next: Stage 1 Part 2

Part 2 creates all source files: types, stores, hooks, utils, Supabase clients, middleware, animations, feature flags, root layout, and the QueryProvider.
