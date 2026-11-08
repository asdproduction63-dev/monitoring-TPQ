/*
 * Service worker TPQ Monitor.
 *
 * Aplikasi ini isinya data murid di balik akun masing-masing, jadi aturannya
 * sengaja ketat: yang disimpan hanya berkas statis yang sama untuk semua orang
 * (berkas hasil build Next, logo, ikon). Halaman dan API tidak pernah
 * disimpan, supaya tidak ada isi akun yang tertinggal di perangkat setelah
 * penggunanya keluar, dan supaya angka yang tampil selalu yang terbaru.
 *
 * Gunanya tetap ada: aplikasi bisa dipasang ke layar utama, terbuka tanpa
 * bilah alamat, muat lebih cepat karena berkas statisnya sudah tersimpan, dan
 * punya halaman yang pantas saat jaringan mati.
 *
 * Naikkan VERSI setiap kali berkas ini diubah, supaya simpanan lama dibuang.
 */

const VERSI = "tpq-v2";
const SIMPANAN = `statis-${VERSI}`;
const LURING = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SIMPANAN)
      .then((simpanan) => simpanan.addAll([LURING, "/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((kunci) =>
        Promise.all(kunci.filter((k) => k !== SIMPANAN).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Hanya berkas yang isinya sama untuk semua pengguna yang boleh disimpan. */
function bolehDisimpan(url) {
  // Berkas hasil build Next, termasuk huruf IBM Plex. Namanya mengandung hash,
  // jadi versi lama tidak pernah tertukar dengan yang baru.
  if (url.pathname.startsWith("/_next/static/")) return true;

  // Pengoptimal gambar Next dipakai juga untuk foto dokumentasi murid. Yang
  // disimpan hanya kalau sumbernya berkas di public/, bukan tautan Supabase.
  if (url.pathname === "/_next/image") {
    return (url.searchParams.get("url") || "").startsWith("/");
  }

  // Logo dan ikon yang ditaruh langsung di akar public/.
  return /^\/[^/]+\.(png|svg|ico|webmanifest)$/.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const permintaan = event.request;
  if (permintaan.method !== "GET") return;

  const url = new URL(permintaan.url);
  if (url.origin !== self.location.origin) return;

  // Halaman selalu diambil dari server. Kalau jaringannya mati, barulah
  // halaman luring yang ditampilkan.
  if (permintaan.mode === "navigate") {
    event.respondWith(fetch(permintaan).catch(() => caches.match(LURING)));
    return;
  }

  if (!bolehDisimpan(url)) return;

  event.respondWith(
    caches.open(SIMPANAN).then(async (simpanan) => {
      const tersimpan = await simpanan.match(permintaan);
      if (tersimpan) return tersimpan;

      const jawaban = await fetch(permintaan);
      if (jawaban.ok) simpanan.put(permintaan, jawaban.clone());
      return jawaban;
    }),
  );
});
