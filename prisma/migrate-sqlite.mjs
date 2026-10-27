import { existsSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sqlitePath = process.env.SQLITE_PATH ?? path.join(scriptDir, "dev.db");

if (!existsSync(sqlitePath)) {
  console.log(`File SQLite tidak ditemukan: ${sqlitePath}`);
  process.exit(0);
}

const sqlite = new DatabaseSync(sqlitePath);

function rows(table) {
  return sqlite.prepare(`SELECT * FROM "${table}"`).all();
}

function toDate(value) {
  if (value == null) return new Date();
  if (value instanceof Date) return value;
  const parsed = new Date(typeof value === "number" ? value : String(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toBool(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function materiDariSetoranLama(setoran) {
  const bagian = [];
  if (setoran.surah) bagian.push(String(setoran.surah));
  if (setoran.ayatFrom != null && setoran.ayatTo != null) {
    bagian.push(`ayat ${setoran.ayatFrom}–${setoran.ayatTo}`);
  }
  if (setoran.juz != null) bagian.push(`Juz ${setoran.juz}`);
  return bagian.join(" ") || "Setoran";
}

async function main() {
  const users = rows("User");
  const santri = rows("Santri");
  const kegiatan = rows("Kegiatan");
  const settings = rows("Setting");
  const setoran = rows("HafalanSetoran");
  const presensi = rows("Presensi");

  await prisma.user.createMany({
    data: users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      passwordHash: u.passwordHash,
      role: u.role,
      active: toBool(u.active),
      createdAt: toDate(u.createdAt),
    })),
    skipDuplicates: true,
  });

  await prisma.santri.createMany({
    data: santri.map((s) => ({
      id: s.id,
      nis: s.nis,
      name: s.name,
      gender: s.gender,
      kelas: s.kelas,
      phone: s.phone,
      active: toBool(s.active),
      createdAt: toDate(s.createdAt),
    })),
    skipDuplicates: true,
  });

  await prisma.kegiatan.createMany({
    data: kegiatan
      .filter((k) => !/^shalat .*berjamaah$/i.test(k.name))
      .map((k) => ({
        id: k.id,
        name: k.name,
        category: k.category,
        startTime: k.startTime,
        endTime: k.endTime,
        active: toBool(k.active),
        sortOrder: k.sortOrder,
      })),
    skipDuplicates: true,
  });

  await prisma.setting.createMany({
    data: settings
      .filter((s) => s.key !== "targetJuzDefault")
      .map((s) => ({
        key: s.key === "namaPondok" ? "namaTpq" : s.key,
        value: s.value,
      })),
    skipDuplicates: true,
  });

  await prisma.hafalanSetoran.createMany({
    data: setoran.map((s) => ({
      id: s.id,
      santriId: s.santriId,
      pengujiId: s.pengujiId,
      date: s.date,
      type: s.type,
      materi: materiDariSetoranLama(s),
      status: s.status,
      predikat: s.predikat,
      catatan: s.catatan,
      createdAt: toDate(s.createdAt),
    })),
    skipDuplicates: true,
  });

  await prisma.presensi.createMany({
    data: presensi.map((p) => ({
      id: p.id,
      santriId: p.santriId,
      kegiatanId: p.kegiatanId,
      date: p.date,
      status: p.status,
      note: p.note,
      recordedById: p.recordedById,
      createdAt: toDate(p.createdAt),
      updatedAt: toDate(p.updatedAt),
    })),
    skipDuplicates: true,
  });

  for (const table of ["User", "Santri", "Kegiatan", "HafalanSetoran", "Presensi"]) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM "${table}"`,
    );
  }

  console.log(
    `Migrasi selesai: ${users.length} pengguna, ${santri.length} santri, ${kegiatan.length} kegiatan, ${settings.length} pengaturan, ${setoran.length} setoran, ${presensi.length} presensi.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await prisma.$disconnect();
  });
