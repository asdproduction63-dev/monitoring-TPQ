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
  /**
   * Header keamanan untuk semua halaman. Sengaja yang hemat dan tanpa risiko:
   * tidak ada Content-Security-Policy ketat yang bisa mematahkan skrip sendiri,
   * hanya penutup celah yang umum.
   *
   * HSTS tidak dicantumkan karena Vercel sudah memasangnya sendiri.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Lawan klik-bajak: aplikasi tidak boleh ditanam dalam bingkai situs
          // lain, jadi tidak bisa ditumpangi dengan tombol tak kelihatan.
          { key: "X-Frame-Options", value: "DENY" },
          // Peramban tidak boleh menebak-nebak jenis berkas; ikut saja tipe
          // yang server kirim. Menutup sebagian serangan unggahan.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Jangan bocorkan alamat halaman TPQ ke situs luar yang diklik dari
          // sini; kirim asalnya saja saat pindah lintas situs.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Matikan kamera, mikrofon, dan pelacak lokasi untuk aplikasi ini.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
