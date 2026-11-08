import { prisma } from "@/lib/prisma";

/**
 * Pembatas percobaan login, untuk memperlambat tebak-tebakan sandi dari luar.
 *
 * Dua sikap yang disengaja:
 *
 * 1. Fail-open. Semua sentuhan ke tabel LoginThrottle dibungkus try/catch.
 *    Kalau tabelnya belum ada — misalnya kode baru sudah tayang tapi DDL di
 *    Supabase belum dijalankan — pembatas ini diam saja dan login berjalan
 *    seperti sebelum ada fitur ini. Jadi menayangkannya tidak pernah bisa
 *    mengunci semua orang keluar.
 *
 * 2. Hanya untuk username yang benar-benar ada. Pemanggil memanggil pembatas
 *    ini sesudah memastikan akunnya ada dan aktif. Username ngawur tidak
 *    pernah sampai menyentuh bcrypt maupun tabel ini, jadi tabelnya tidak bisa
 *    digelembungkan baris sampah.
 *
 * Penguncian berbasis akun punya satu kelemahan yang diterima: orang usil bisa
 * sengaja salah sandi berkali-kali untuk mengunci akun orang lain sesaat.
 * Karena itu kuncinya hanya sementara dan pulih sendiri; akses lewat basis
 * data atau perkakas atur-ulang-sandi tetap terbuka.
 */

const BATAS_GAGAL = 7;
const MENIT_KUNCI = 15;

export type StatusKunci = { terkunci: true; menitTersisa: number } | { terkunci: false };

/** Apakah akun ini sedang dalam masa kunci? Dipanggil sebelum cek sandi. */
export async function periksaKunci(username: string): Promise<StatusKunci> {
  try {
    const baris = await prisma.loginThrottle.findUnique({
      where: { username },
      select: { terkunciHingga: true },
    });
    if (baris?.terkunciHingga && baris.terkunciHingga > new Date()) {
      const selisih = baris.terkunciHingga.getTime() - Date.now();
      return { terkunci: true, menitTersisa: Math.max(1, Math.ceil(selisih / 60000)) };
    }
  } catch {
    // Tabel belum ada atau basis data bermasalah: jangan halangi login.
  }
  return { terkunci: false };
}

/**
 * Catat satu percobaan gagal. Saat hitungannya mencapai batas, akun dikunci
 * untuk MENIT_KUNCI menit dan hitungannya dinolkan lagi.
 */
export async function catatGagal(username: string): Promise<void> {
  try {
    const baris = await prisma.loginThrottle.findUnique({
      where: { username },
      select: { gagal: true },
    });
    const gagalBaru = (baris?.gagal ?? 0) + 1;
    const kunci = gagalBaru >= BATAS_GAGAL;
    const data = kunci
      ? { gagal: 0, terkunciHingga: new Date(Date.now() + MENIT_KUNCI * 60000) }
      : { gagal: gagalBaru, terkunciHingga: null };

    await prisma.loginThrottle.upsert({
      where: { username },
      update: data,
      create: { username, ...data },
    });
  } catch {
    // Fail-open: kegagalan mencatat tidak boleh menggagalkan login.
  }
}

/** Bersihkan hitungan setelah login berhasil. */
export async function resetKunci(username: string): Promise<void> {
  try {
    await prisma.loginThrottle.deleteMany({ where: { username } });
  } catch {
    // Fail-open.
  }
}
