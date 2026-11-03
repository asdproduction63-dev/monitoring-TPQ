"use client";

import { useEffect } from "react";

/**
 * Mendaftarkan public/sw.js. Sengaja hanya saat production: di mode dev,
 * berkas hasil build belum punya hash tetap, jadi simpanan service worker
 * justru membuat perubahan kode tidak kelihatan di layar.
 *
 * Untuk mencobanya di komputer sendiri: `npm run build` lalu `npm start`.
 */
export function DaftarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const daftar = () => navigator.serviceWorker.register("/sw.js").catch(() => {});

    // Pendaftaran ditunda sampai halaman selesai dimuat supaya tidak ikut
    // berebut jaringan dengan isi halaman yang sedang dibuka pengguna.
    if (document.readyState === "complete") daftar();
    else window.addEventListener("load", daftar, { once: true });
  }, []);

  return null;
}
