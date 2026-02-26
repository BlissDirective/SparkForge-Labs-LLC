/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images from Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Increase server action payload for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // v2: Tree-shake heavy icon and UI libraries
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
    ],
  },

  // v2: Prevent 3D packages from being bundled in server components
  // These are client-only and would crash on the server
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'three': 'three',
        '@react-three/fiber': '@react-three/fiber',
        '@react-three/drei': '@react-three/drei',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
