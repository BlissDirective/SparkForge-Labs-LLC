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
