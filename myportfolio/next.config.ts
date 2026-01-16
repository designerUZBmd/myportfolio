import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   images: {
    domains: ["res.cloudinary.com"],
  },
  reactCompiler: true,
};

export default nextConfig;
