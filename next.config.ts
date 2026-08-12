import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],

  async redirects() {
    return [
      // Old club-defaults sub-pages → new locations under competitions
      {
        source:      '/:clubSlug/admin/club-defaults/competition',
        destination: '/:clubSlug/admin/competitions/competition-defaults',
        permanent:   true,
      },
      {
        source:      '/:clubSlug/admin/club-defaults/recognition',
        destination: '/:clubSlug/admin/competitions/recognition',
        permanent:   true,
      },
    ]
  },

  images: {
    remotePatterns: [
      // Supabase Storage — production (hosted projects)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Supabase Storage — local dev (supabase start)
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
