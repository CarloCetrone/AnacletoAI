import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Custom domain: anacletoai.com (no basePath subfolder needed)
};

export default nextConfig;
