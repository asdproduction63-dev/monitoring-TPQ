-- Tabel pembatas percobaan login. Jalankan sekali di Supabase:
-- SQL Editor -> tempel seluruh isi berkas ini -> Run.
--
-- Sampai tabel ini dibuat, pembatas login berjalan "fail-open": aplikasi
-- tetap bisa dipakai seperti biasa, hanya saja belum ada penguncian setelah
-- percobaan gagal berulang. Setelah tabel ini ada, penguncian otomatis aktif.

CREATE TABLE IF NOT EXISTS "LoginThrottle" (
    "username" TEXT NOT NULL,
    "gagal" INTEGER NOT NULL DEFAULT 0,
    "terkunciHingga" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LoginThrottle_pkey" PRIMARY KEY ("username")
);
