import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  outputFileTracingRoot: process.cwd(),
  // Kop gambar raport membaca logo dari disk dengan jalur yang disusun saat
  // program berjalan, sehingga tidak terdeteksi penelusuran otomatis Next.
  // Tanpa baris ini, berkasnya tidak ikut terkemas dan rutenya error di Vercel.
  outputFileTracingIncludes: {
    "/api/raport/gambar": ["./public/logo-lambang.png"],
  },
  async redirects() {
    return [
      { source: "/santri", destination: "/murid", permanent: true },
      { source: "/santri/:path*", destination: "/murid/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
