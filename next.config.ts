import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mammoth", "pdfjs-dist"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
