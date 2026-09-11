import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.133", "192.168.0.103", "localhost", "127.0.0.1"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85, 90, 95],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640],
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
