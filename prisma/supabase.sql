-- Schema database TPQ untuk Supabase (PostgreSQL).
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor.

CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USTADZ',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

CREATE TABLE IF NOT EXISTS "Santri" (
    "id" SERIAL NOT NULL,
    "nis" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'L',
    "kelas" TEXT NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Santri_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Santri_nis_key" ON "Santri"("nis");
CREATE INDEX IF NOT EXISTS "Santri_name_idx" ON "Santri"("name");

CREATE TABLE IF NOT EXISTS "Kegiatan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'HARIAN',
    "startTime" TEXT,
    "endTime" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Kegiatan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "HafalanSetoran" (
    "id" SERIAL NOT NULL,
    "santriId" INTEGER NOT NULL,
    "pengujiId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ZIYADAH',
    "materi" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LULUS',
    "predikat" TEXT NOT NULL DEFAULT 'JAYYID',
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HafalanSetoran_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "HafalanSetoran_santriId_fkey" FOREIGN KEY ("santriId")
        REFERENCES "Santri"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HafalanSetoran_pengujiId_fkey" FOREIGN KEY ("pengujiId")
        REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "HafalanSetoran_date_idx" ON "HafalanSetoran"("date");
CREATE INDEX IF NOT EXISTS "HafalanSetoran_santriId_idx" ON "HafalanSetoran"("santriId");
CREATE INDEX IF NOT EXISTS "HafalanSetoran_pengujiId_idx" ON "HafalanSetoran"("pengujiId");

CREATE TABLE IF NOT EXISTS "Presensi" (
    "id" SERIAL NOT NULL,
    "santriId" INTEGER NOT NULL,
    "kegiatanId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'HADIR',
    "note" TEXT,
    "recordedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presensi_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Presensi_santriId_fkey" FOREIGN KEY ("santriId")
        REFERENCES "Santri"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Presensi_kegiatanId_fkey" FOREIGN KEY ("kegiatanId")
        REFERENCES "Kegiatan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Presensi_recordedById_fkey" FOREIGN KEY ("recordedById")
        REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Presensi_santriId_kegiatanId_date_key"
    ON "Presensi"("santriId", "kegiatanId", "date");
CREATE INDEX IF NOT EXISTS "Presensi_date_idx" ON "Presensi"("date");
CREATE INDEX IF NOT EXISTS "Presensi_kegiatanId_idx" ON "Presensi"("kegiatanId");
CREATE INDEX IF NOT EXISTS "Presensi_recordedById_idx" ON "Presensi"("recordedById");

-- Data awal: akun login, pengaturan pondok, dan daftar kegiatan.
-- Password: admin123 dan ustadz123. Segera ganti setelah login.
INSERT INTO "User" ("name", "username", "passwordHash", "role")
VALUES
    ('Administrator', 'admin', '$2a$10$rjaXp7b1wa.AeKnKmzLmKuIfvipV5BT.j3Hwi7g9UDAr44xOcowiq', 'ADMIN'),
    ('Ustadz Hasan', 'ustadz', '$2a$10$H2dPr0PFfrkMoGhMdaPr3ukjvGoeLIYskgbAi35usPaSXPI44/tB.', 'USTADZ')
ON CONFLICT ("username") DO NOTHING;

INSERT INTO "Setting" ("key", "value")
VALUES
    ('namaTpq', 'TPQ Al-Hikmah'),
    ('namaPengasuh', 'KH. Abdullah Syafi''i'),
    ('tahunAjaran', '2026/2027'),
    ('semester', 'Ganjil')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "Kegiatan" ("name", "category", "startTime", "endTime", "sortOrder")
SELECT * FROM (
    VALUES
        ('KBM Pagi', 'KBM', '07:30', '12:00', 1),
        ('Halaqah Tahfizh Sore', 'TAHFIZH', '15:30', '16:15', 2),
        ('KBM Sore', 'KBM', '16:15', '17:00', 3),
        ('Murojaah Sore', 'TAHFIZH', '17:00', '17:30', 4)
) AS seed("name", "category", "startTime", "endTime", "sortOrder")
WHERE NOT EXISTS (SELECT 1 FROM "Kegiatan");

-- Amankan tabel dari akses langsung via anon key Supabase.
-- Prisma tetap bisa mengakses karena memakai role database (bukan anon key).
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Santri" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Kegiatan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HafalanSetoran" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Presensi" ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- Tambahan: akun wali murid (role 'WALI' pada tabel "User").
-- Satu akun wali ditautkan ke satu murid lewat kolom "Santri"."waliId".
-- Aman dijalankan ulang pada database yang sudah ada.
-- =====================================================================

ALTER TABLE "Santri" ADD COLUMN IF NOT EXISTS "waliId" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "Santri_waliId_key" ON "Santri"("waliId");

DO $$
BEGIN
    ALTER TABLE "Santri" ADD CONSTRAINT "Santri_waliId_fkey"
        FOREIGN KEY ("waliId") REFERENCES "User"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

-- =====================================================================
-- Tambahan: laporan wali tentang kegiatan anak di rumah.
-- Satu catatan boleh punya banyak foto atau video. Berkas medianya
-- sendiri disimpan di Supabase Storage, tabel ini hanya memuat jalurnya.
-- Aman dijalankan ulang pada database yang sudah ada.
-- =====================================================================

CREATE TABLE IF NOT EXISTS "CatatanRumah" (
    "id" SERIAL NOT NULL,
    "santriId" INTEGER NOT NULL,
    "penulisId" INTEGER NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatatanRumah_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CatatanRumah_santriId_fkey" FOREIGN KEY ("santriId")
        REFERENCES "Santri"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CatatanRumah_penulisId_fkey" FOREIGN KEY ("penulisId")
        REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CatatanRumah_santriId_createdAt_idx"
    ON "CatatanRumah"("santriId", "createdAt");
CREATE INDEX IF NOT EXISTS "CatatanRumah_penulisId_idx" ON "CatatanRumah"("penulisId");

CREATE TABLE IF NOT EXISTS "MediaRumah" (
    "id" SERIAL NOT NULL,
    "catatanId" INTEGER NOT NULL,
    "jenis" TEXT NOT NULL,
    "jalur" TEXT NOT NULL,
    "namaAsli" TEXT NOT NULL,
    "ukuran" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaRumah_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MediaRumah_catatanId_fkey" FOREIGN KEY ("catatanId")
        REFERENCES "CatatanRumah"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MediaRumah_catatanId_idx" ON "MediaRumah"("catatanId");

ALTER TABLE "CatatanRumah" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaRumah" ENABLE ROW LEVEL SECURITY;
