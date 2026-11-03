import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TPQ Monitor",
    short_name: "TPQ Monitor",
    description: "Monitoring setoran dan kegiatan harian murid TPQ.",
    lang: "id",
    dir: "ltr",
    categories: ["education", "productivity"],
    // Akar halaman sudah mengarahkan sendiri: ustadz ke dashboard, wali murid
    // ke raport. Jadi pintu masuknya satu, tidak perlu dibedakan di sini.
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#faf7f0",
    theme_color: "#0f3a3a",
    icons: [
      // Versi "any" dipakai apa adanya: lambangnya transparan dan mengisi
      // penuh kanvas, jadi kalau ditandai maskable sudut atapnya terpotong.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Versi maskable punya latar krim dan lambang yang sudah dikecilkan ke
      // dalam zona aman, supaya aman dipotong bulat oleh Android.
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      {
        src: "/tangkapan-ponsel.png",
        sizes: "780x1688",
        type: "image/png",
        form_factor: "narrow",
        label: "Ringkasan setoran hafalan di ponsel",
      },
      {
        src: "/tangkapan-layar.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
        label: "Dashboard monitoring TPQ di layar lebar",
      },
    ],
  };
}
