import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  // Next.js recommended config (includes react, react-hooks, @next/next)
  ...compat.extends('next/core-web-vitals'),

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

      // React hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Allow empty interfaces (common in R3F component props)
      '@typescript-eslint/no-empty-object-type': 'off',

      // Allow require() in config files (tailwind, postcss)
      '@typescript-eslint/no-require-imports': 'off',
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
      '*.config.mjs',
      'postcss.config.js',
    ],
  },
);
