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
  // ── Security & Caching Headers (S10-CRIT-001, S10-HIGH-001, BUG-10D) ──
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    const cspDirectives = [
      "default-src 'self'",
      // unsafe-eval only in dev (HMR); unsafe-inline for Next.js script injection
      `script-src 'self' ${isProd ? '' : "'unsafe-eval'"} 'unsafe-inline'`,
      [
        "connect-src 'self'",
        'https://*.supabase.co',
        'https://*.sentry.io',
        'https://vitals.vercel-insights.com',
        'https://va.vercel-scripts.com',
        'https://api.stripe.com',
        'https://api.anthropic.com',
      ].join(' '),
      "img-src 'self' https://*.supabase.co data: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "worker-src 'self' blob:",
    ];

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; '),
          },
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
