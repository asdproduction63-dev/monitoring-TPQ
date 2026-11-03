/**
 * Atur ulang password satu akun langsung di database.
 *
 * Password tidak pernah disimpan apa adanya, hanya hash bcrypt-nya. Jadi
 * kalau password admin terlupa, tidak ada cara membacanya kembali — satu-
 * satunya jalan adalah menimpanya dari luar aplikasi, lewat berkas ini.
 *
 * Database yang disentuh adalah yang tertulis di DATABASE_URL, yaitu Supabase
 * produksi. Karena itu alamatnya ditampilkan dulu di layar, dan namanya harus
 * diketik ulang sebelum perubahan dijalankan.
 *
 * Password yang diketik tidak ditampilkan di layar dan tidak pernah ditulis
 * ke mana pun selain sebagai hash di database.
 *
 *   npm run akun:password
 */

import readline from "node:readline";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const PANJANG_MINIMAL = 6;

/** Alamat database tanpa bagian rahasianya, sekadar untuk dipastikan mata. */
function tujuan(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname}`;
  } catch {
    return "(alamat tidak terbaca)";
  }
}

function tanya(rl, pertanyaan) {
  return new Promise((selesai) => rl.question(pertanyaan, (jawab) => selesai(jawab.trim())));
}

/** Sama seperti tanya(), tapi ketikannya tidak ikut tampil di layar. */
function tanyaRahasia(rl, pertanyaan) {
  return new Promise((selesai) => {
    rl.bisu = false;
    rl._writeToOutput = (teks) => {
      if (!rl.bisu) rl.output.write(teks);
    };
    rl.question(pertanyaan, (jawab) => {
      rl.bisu = false;
      rl.output.write("\n");
      selesai(jawab);
    });
    // Baru dibisukan setelah pertanyaannya sendiri selesai ditulis.
    rl.bisu = true;
  });
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("\nDATABASE_URL tidak terbaca. Jalankan lewat: npm run akun:password\n");
  process.exit(1);
}

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
});

try {
  console.log("\n  ATUR ULANG PASSWORD AKUN");
  console.log(`  Database: ${tujuan(url)}\n`);

  const daftar = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { username: "asc" }],
    select: { id: true, name: true, username: true, role: true, active: true },
  });

  if (daftar.length === 0) {
    console.log("  Tidak ada akun sama sekali di database ini.");
    console.log("  Jalankan `npm run db:seed` dulu untuk membuat akun admin bawaan.\n");
    process.exit(1);
  }

  console.log("  Akun yang ada:\n");
  for (const u of daftar) {
    const status = u.active ? "aktif   " : "NONAKTIF";
    console.log(`    ${u.username.padEnd(16)} ${u.role.padEnd(7)} ${status}  ${u.name}`);
  }
  console.log("");

  const username = await tanya(rl, "  Username yang mau diatur ulang (kosong = batal): ");
  if (username === "") {
    console.log("\n  Dibatalkan, tidak ada yang berubah.\n");
    process.exit(0);
  }

  const target = daftar.find((u) => u.username === username.toLowerCase());
  if (!target) {
    console.error(`\n  Tidak ada akun dengan username "${username}". Dibatalkan.\n`);
    process.exit(1);
  }

  const baru = await tanyaRahasia(rl, `  Password baru untuk ${target.username} (tidak tampil): `);
  if (baru.length < PANJANG_MINIMAL) {
    console.error(`\n  Password minimal ${PANJANG_MINIMAL} karakter. Dibatalkan.\n`);
    process.exit(1);
  }

  const ulang = await tanyaRahasia(rl, "  Ulangi password baru: ");
  if (baru !== ulang) {
    console.error("\n  Dua ketikan tidak sama. Dibatalkan.\n");
    process.exit(1);
  }

  const data = { passwordHash: await bcrypt.hash(baru, 10) };

  if (!target.active) {
    const jawab = await tanya(rl, "\n  Akun ini nonaktif sehingga tetap tidak bisa masuk.\n  Aktifkan sekalian? (y/n): ");
    if (jawab.toLowerCase().startsWith("y")) data.active = true;
  }

  const sahkan = await tanya(rl, `\n  Ketik ulang "${target.username}" untuk menjalankan: `);
  if (sahkan !== target.username) {
    console.error("\n  Tidak cocok. Dibatalkan, tidak ada yang berubah.\n");
    process.exit(1);
  }

  await prisma.user.update({ where: { id: target.id }, data });

  console.log(`\n  Selesai. Password ${target.username} sudah diganti.`);
  if (data.active) console.log("  Akunnya juga diaktifkan kembali.");
  console.log("  Sesi yang sudah masuk di perangkat lain tidak ikut keluar.\n");
} finally {
  rl.close();
  await prisma.$disconnect();
}
