import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      { source: "/santri", destination: "/murid", permanent: true },
      { source: "/santri/:path*", destination: "/murid/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
