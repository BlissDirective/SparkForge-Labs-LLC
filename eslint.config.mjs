import nextPlugin from '@next/eslint-plugin-next';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Next.js core-web-vitals (native flat config — detected by Next.js build)
  nextPlugin.flatConfig.coreWebVitals,

  // React hooks
  reactHooksPlugin.configs['recommended-latest'],

  // TypeScript-aware rules
  ...tseslint.configs.recommended,

  // Project-specific overrides
  {
    rules: {
      // Warn on explicit `any` — too many to error on immediately
      '@typescript-eslint/no-explicit-any': 'warn',

      // Allow unused vars prefixed with _
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],

      // False positive for App Router — fonts in layout.tsx load globally
      '@next/next/no-page-custom-font': 'off',

      // T13 PERF-MED-002 (Opt A): Ban raw <img> across the app.
      // Use next/image (or the OptimizedImage wrapper) so images get
      // WebP/AVIF conversion, responsive sizing, and lazy loading for
      // free. Error (not warn) because the codebase audited clean on
      // April 21, 2026 — we do not want to regress.
      '@next/next/no-img-element': 'error',

      // React hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Allow empty interfaces (common in R3F component props)
      '@typescript-eslint/no-empty-object-type': 'off',

      // Allow require() in config files (tailwind, postcss)
      '@typescript-eslint/no-require-imports': 'off',

      // PERF-CRIT-001 (Phase 1 Task 12): Ban `import * as THREE` and the
      // default wildcard import from 'three'. Tree-shaking requires named
      // imports. Allow in agent pipeline files (they reference the pattern
      // as a string literal for code generation detection).
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'three',
              importNames: ['default'],
              message:
                'Do not default-import from "three". Use named imports (e.g. `import { Mesh, Color } from "three"`) so tree-shaking works.',
            },
          ],
          patterns: [
            {
              group: ['three'],
              importNamePattern: '^\\*$',
              message:
                'Do not use `import * as THREE from "three"`. Use named imports so tree-shaking works.',
            },
          ],
        },
      ],

      // Phase 5 P.4-MAX (§7.4): Font hierarchy enforcement.
      // Warn when a JSX element uses font-body or font-mono together with
      // direct numeric text children — those MUST use font-data (Orbitron)
      // or the DataNumber component. See src/components/ui/DataNumber.tsx.
      //
      // UX-HIGH-005 (C): Low-contrast regression guard.
      // Flag `text-white/10`, `/20`, `/30`, `/40` in JSX className literals.
      // WCAG 2.2 AA requires 4.5:1 contrast on normal text. White at 40%
      // opacity on our dark surface-deep background tests at ~3.9:1.
      // Existing offenders are allow-listed by the 'warn' severity — new
      // usage surfaces as a CI warning. Use `/50`+ as the minimum for
      // primary content; truly decorative watermark text that's safe to
      // de-emphasize can add `// eslint-disable-next-line
      // no-restricted-syntax` with a one-line justification.
      // P1 C6 (April 21, 2026): After the full PERF-HIGH-001 sweep
      // landed — 30 non-flagship games (T20) + 8 remaining sites
      // (P1 C1–C5) — the repo is selector-clean. Promoted from warn
      // to error so regressions fail CI. Font-for-numbers rule stays
      // here under the same `error` severity (zero current offenders).
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXAttribute[name.name='className'][value.type='Literal'][value.value=/font-body|font-mono/] ~ JSXText[value=/^\\s*[+\\-]?[0-9]+[.,0-9]*\\s*$/]",
          message:
            'Numeric data should render in font-data (Orbitron) or via <DataNumber>. Do not use font-body / font-mono for numeric values.',
        },
        {
          // PERF-HIGH-001 (C): Flag full-store subscriptions
          // (`const x = use*Store()` with NO selector argument) in
          // files inside a 3D render path or inside games/. Use a
          // selector like `useGameStore(s => s.score)` or a bundled
          // action hook (e.g. useGameActions) instead.
          selector:
            "VariableDeclarator[init.type='CallExpression'][init.callee.type='Identifier'][init.callee.name=/^use[A-Z]\\w*Store$/][init.arguments.length=0]",
          message:
            'Full store subscription (PERF-HIGH-001): `const x = use*Store()` without a selector triggers re-renders on every state change. Use `useStore(s => s.field)` or a bundled-action hook (e.g. useGameActions) instead.',
        },
        {
          // T19 UX-HIGH-005 (April 21, 2026): low-contrast text. After
          // the full sweep, text-white/10-40 should be zero in src/.
          // A vitest regression guard (tests/unit/no-low-contrast-text)
          // fails CI if any reappear; this warning surfaces it during
          // editing too.
          selector:
            "JSXAttribute[name.name='className'][value.type='Literal'][value.value=/(^|\\s)text-white\\/(10|20|30|40)(\\s|$)/]",
          message:
            'Low-contrast text (UX-HIGH-005): text-white/10-40 fails WCAG AA on dark backgrounds. Use text-white/50 or higher, or add an aria-label / eslint-disable comment for intentionally decorative cases.',
        },
      ],
    },
  },

  // P2 §5.9 — Easing tokens
  //
  // Raw cubic-bezier(...) strings and literal [x,y,x,y] bezier arrays
  // must live in src/lib/easings.ts. Everywhere else, import a token.
  // Keeps 2D / GSAP / CSS motion consistent.
  //
  // The easings.ts file itself is allow-listed below — it defines the
  // canonical values.
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/lib/easings.ts'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value=/cubic-bezier\\s*\\(/]",
          message:
            'P2 §5.9: Do not use raw `cubic-bezier(...)` strings. Import a token from @/lib/easings (SF_EASE_STANDARD, SF_EASE_EMPHASIZED, etc.).',
        },
      ],
    },
  },

  // P2 §3.6 — Reactive cockpit settings bridge
  //
  // 3D components MUST subscribe to store state via selectors or
  // useCockpitSettings(), NOT snapshot via `.getState()`. Snapshots
  // captured at mount time don't react to later Settings-page toggles.
  //
  // Exception: `getState()` is correct inside event callbacks where
  // you want the current value when the event fires (e.g. audio
  // hooks reading masterSoundEnabled at play-time). Those callers
  // live in hooks/ and should use eslint-disable with justification
  // if they really need it there.
  {
    files: ['src/components/3d/**/*.tsx', 'src/components/3d/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.name=/^use[A-Z]\\w*Store$/][property.name='getState']",
          message:
            'P2 §3.6: Do not snapshot cockpit/ui/guide store state via .getState() inside 3D components. Use a selector (useCockpitStore(s => s.field)) or the useCockpitSettings() bundle so Settings-page toggles propagate reactively.',
        },
      ],
    },
  },

  // TSL shader files — relax rules (Three.js TSL types are incomplete)
  {
    files: ['src/shaders/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Test files — relax rules
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx', 'src/mocks/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Global ignores
  {
    ignores: [
      '.next/',
      'node_modules/',
      'public/',
      'tools/',
      '*.config.js',
      '*.config.cjs',
    ],
  },
);
