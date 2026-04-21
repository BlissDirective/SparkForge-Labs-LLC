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
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "JSXAttribute[name.name='className'][value.type='Literal'][value.value=/font-body|font-mono/] ~ JSXText[value=/^\\s*[+\\-]?[0-9]+[.,0-9]*\\s*$/]",
          message:
            'Numeric data should render in font-data (Orbitron) or via <DataNumber>. Do not use font-body / font-mono for numeric values.',
        },
        {
          selector:
            "JSXAttribute[name.name='className'][value.type='Literal'][value.value=/(^|\\s)text-white\\/(10|20|30|40)(\\s|$)/]",
          message:
            'Low-contrast text (UX-HIGH-005): text-white/10-40 fails WCAG AA on dark backgrounds. Use text-white/50 or higher, or add an aria-label / eslint-disable comment for intentionally decorative cases.',
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
