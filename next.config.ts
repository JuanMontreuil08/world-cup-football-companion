import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['playwright'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'a.espncdn.com' },
    ],
  },
};

export default nextConfig;
