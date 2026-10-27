import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function hariLalu(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("sv-SE");
}

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const ustadzPassword = await bcrypt.hash("ustadz123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Administrator",
      username: "admin",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { username: "ustadz" },
    update: {},
    create: {
      name: "Ustadz Hasan",
      username: "ustadz",
      passwordHash: ustadzPassword,
      role: "USTADZ",
    },
  });

  const settings: Record<string, string> = {
    namaTpq: "TPQ Al-Hikmah",
    namaPengasuh: "KH. Abdullah Syafi'i",
    tahunAjaran: "2026/2027",
    semester: "Ganjil",
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  const jumlahKegiatan = await prisma.kegiatan.count();
  if (jumlahKegiatan === 0) {
    await prisma.kegiatan.createMany({
      data: [
        { name: "KBM Pagi", category: "KBM", startTime: "07:30", endTime: "12:00", sortOrder: 1 },
        { name: "Halaqah Tahfizh Sore", category: "TAHFIZH", startTime: "15:30", endTime: "16:15", sortOrder: 2 },
        { name: "KBM Sore", category: "KBM", startTime: "16:15", endTime: "17:00", sortOrder: 3 },
        { name: "Murojaah Sore", category: "TAHFIZH", startTime: "17:00", endTime: "17:30", sortOrder: 4 },
      ],
    });
  }

  const jumlahSantri = await prisma.santri.count();
  if (jumlahSantri === 0) {
    await prisma.santri.createMany({
      data: [
        { nis: "2026001", name: "Ahmad Fauzan", gender: "L", kelas: "Iqro 2" },
        { nis: "2026002", name: "Muhammad Rizky", gender: "L", kelas: "Iqro 2" },
        { nis: "2026003", name: "Abdul Hakim", gender: "L", kelas: "Iqro 3" },
        { nis: "2026004", name: "Fahri Abdillah", gender: "L", kelas: "Iqro 3" },
        { nis: "2026005", name: "Nabila Putri", gender: "P", kelas: "Iqro 1" },
        { nis: "2026006", name: "Salsabila Azzahra", gender: "P", kelas: "Iqro 1" },
        { nis: "2026007", name: "Hafizh Ramadhan", gender: "L", kelas: "Al-Qur'an" },
        { nis: "2026008", name: "Aisyah Nur", gender: "P", kelas: "Al-Qur'an" },
      ],
    });
  }

  // Contoh akun wali murid, ditautkan ke murid pertama.
  const muridPertama = await prisma.santri.findFirst({ orderBy: { id: "asc" } });
  if (muridPertama) {
    const wali = await prisma.user.upsert({
      where: { username: "wali" },
      update: {},
      create: {
        name: `Wali ${muridPertama.name}`,
        username: "wali",
        passwordHash: await bcrypt.hash("wali123", 10),
        role: "WALI",
      },
    });

    if (muridPertama.waliId === null) {
      await prisma.santri.update({
        where: { id: muridPertama.id },
        data: { waliId: wali.id },
      });
    }
  }

  const jumlahSetoran = await prisma.hafalanSetoran.count();
  if (jumlahSetoran === 0) {
    const santri = await prisma.santri.findMany({ orderBy: { id: "asc" } });
    const penguji = await prisma.user.findUniqueOrThrow({ where: { username: "ustadz" } });
    const hariIni = new Date().toLocaleDateString("sv-SE");

    const data = [
      { santriId: santri[0].id, date: hariIni, materi: "Iqro 2 hal. 10–12", type: "ZIYADAH", predikat: "MUMTAZ", status: "LULUS" },
      { santriId: santri[2].id, date: hariIni, materi: "Al-Baqarah ayat 1–5", type: "ZIYADAH", predikat: "JAYYID_JIDDAN", status: "LULUS" },
      { santriId: santri[4].id, date: hariIni, materi: "Iqro 1 hal. 25", type: "MUROJAAH", predikat: "JAYYID", status: "ULANG" },
      { santriId: santri[1].id, date: hariLalu(1), materi: "Iqro 2 hal. 7–9", type: "ZIYADAH", predikat: "JAYYID_JIDDAN", status: "LULUS" },
      { santriId: santri[3].id, date: hariLalu(1), materi: "Yasin ayat 1–12", type: "ZIYADAH", predikat: "JAYYID", status: "LULUS" },
      { santriId: santri[5].id, date: hariLalu(2), materi: "Iqro 1 hal. 20–21", type: "ZIYADAH", predikat: "MUMTAZ", status: "LULUS" },
      { santriId: santri[6].id, date: hariLalu(2), materi: "Al-Kahfi ayat 1–10", type: "MUROJAAH", predikat: "JAYYID_JIDDAN", status: "LULUS" },
      { santriId: santri[7].id, date: hariLalu(3), materi: "Al-Baqarah ayat 17–30", type: "ZIYADAH", predikat: "JAYYID", status: "LULUS" },
    ];

    for (const item of data) {
      await prisma.hafalanSetoran.create({
        data: {
          ...item,
          pengujiId: penguji.id,
          catatan: item.status === "ULANG" ? "Perlu pengulangan pada halaman tersebut." : null,
        },
      });
    }
  }

  const jumlahPresensi = await prisma.presensi.count();
  if (jumlahPresensi === 0) {
    const santri = await prisma.santri.findMany({ where: { active: true }, orderBy: { id: "asc" } });
    const kegiatan = await prisma.kegiatan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
    const penguji = await prisma.user.findUniqueOrThrow({ where: { username: "ustadz" } });
    const hariIni = new Date().toLocaleDateString("sv-SE");

    const statusList = ["HADIR", "HADIR", "HADIR", "HADIR", "IZIN", "HADIR", "SAKIT", "HADIR"];

    for (const k of kegiatan.slice(0, 2)) {
      for (let i = 0; i < santri.length; i++) {
        await prisma.presensi.create({
          data: {
            santriId: santri[i].id,
            kegiatanId: k.id,
            date: hariIni,
            status: statusList[i % statusList.length],
            recordedById: penguji.id,
            note: statusList[i % statusList.length] === "IZIN" ? "Izin pulang ke rumah" : null,
          },
        });
      }
    }
  }

  console.log(
    "Seed selesai. Login admin: admin / admin123, ustadz: ustadz / ustadz123, wali: wali / wali123",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
