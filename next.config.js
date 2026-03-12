// ════════════════════════════════════════════════════
// NEXT.JS CONFIG — Production security + performance
// Stage 10 Part 2 — REPLACES Stage 1 config
// v2 [BUG-10D]: CSP includes Vercel analytics domains
// Preserves: Three.js externals, optimizePackageImports
// ════════════════════════════════════════════════════

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── Image optimization ──
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ── Security + caching headers ──
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
          {
            // [BUG-10D] CSP with Vercel analytics + monitoring domains
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline' https://js.stripe.com`.trim(),
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https://*.supabase.co https://api.anthropic.com https://api.stripe.com https://vitals.vercel-insights.com https://*.vercel-analytics.com https://*.vercel.app",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
      {
        // Cache fonts aggressively (1 year, immutable)
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache PWA icons (1 day)
        source: '/icon-(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },

  // ── Webpack optimization ──
  webpack: (config, { isServer }) => {
    // Server: externalize Three.js (client-only, crashes on server)
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        three: 'three',
        '@react-three/fiber': '@react-three/fiber',
        '@react-three/drei': '@react-three/drei',
      });
    }

    // Client: use lodash-es for tree-shaking
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        lodash: 'lodash-es',
      };
    }

    return config;
  },

  // ── Experimental performance features ──
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
    ],
  },
};

module.exports = nextConfig;
