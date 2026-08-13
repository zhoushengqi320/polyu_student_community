import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 避免桌面上级目录的 package-lock.json 被误判为 monorepo root
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
