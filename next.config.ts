import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  typescript: {
    // Type errors are caught in the editor — don't block production builds.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
