import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

// UX-ENH-010 (Recommended): next-intl plugin points at our
// getRequestConfig at src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');


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
  // ── Security & Caching Headers ──
  // DEPLOY-HIGH-002 (Option B): Content-Security-Policy is now set
  // per-request in src/middleware.ts so it can carry a unique nonce
  // per response and drop `'unsafe-inline'` from script-src. The
  // headers() block below therefore only sets the *static* security
  // headers (same across all responses) + cache headers.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      // Immutable caching for built assets
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Next.js 15: serverExternalPackages replaces experimental.serverComponentsExternalPackages
  serverExternalPackages: ['three', '@react-three/fiber', '@react-three/drei'],
  experimental: {
    // Phase 4 §10.1: View Transitions API — native browser route morphing.
    // Works alongside MechanicalIris for 3D transitions (D3D-B2) as
    // progressive enhancement on 2D route-level surfaces (dashboard ↔
    // auth ↔ marketing). Zero dependency cost, no-op in non-supporting
    // browsers. See src/components/providers/ViewTransitionProvider.tsx.
    viewTransition: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@nivo/core',
      '@nivo/line',
      '@nivo/bar',
    ],
  },
  // Next.js 15.5+: turbo moved from experimental.turbo to top-level turbopack
  turbopack: {
    rules: {
      // Handle GLSL shader imports via Turbopack
      '*.glsl': { loaders: ['raw-loader'], as: '*.js' },
      '*.vert': { loaders: ['raw-loader'], as: '*.js' },
      '*.frag': { loaders: ['raw-loader'], as: '*.js' },
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

// Compose plugins: next-intl → Sentry. Sentry wraps last because its
// config webhook needs to see the final Next.js config object.
const withIntl = withNextIntl(nextConfig);

// Sentry wraps the Next.js config for source maps + error tracking.
// DEPLOY-CRITICAL: Only wrap with Sentry when SENTRY_ORG is set.
// If org/project are missing, the source-map upload phase fails the
// build. Gracefully degrade to plain Next.js when Sentry is not
// configured (e.g. first deploy, staging, or personal forks).
const sentryOrg = process.env.SENTRY_ORG;
const sentryProject = pro