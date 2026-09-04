import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.133", "192.168.0.103", "localhost", "127.0.0.1"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 90],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  reactCompiler: true,
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
