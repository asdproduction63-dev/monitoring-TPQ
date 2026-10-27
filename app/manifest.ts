import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TPQ Monitor",
    short_name: "TPQ Monitor",
    description: "Monitoring setoran dan kegiatan harian murid TPQ.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#faf7f0",
    theme_color: "#0f3a3a",
    // Hanya "any". Ikonnya transparan dan mengisi penuh kanvas, jadi kalau
    // ditandai maskable, Android akan memotong sudut atap rumahnya.
    icons: [
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
