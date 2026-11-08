import { todayISO } from "@/lib/format";

/**
 * Perkembangan harian ditelusuri per bulan, sebagaimana raport ditelusuri per
 * pekan di lib/pekan.ts. Satu bulan diwakili tanggal pertamanya dalam format
 * ISO (YYYY-MM-01).
 */

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function keISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/** Tanggal 1 dari bulan yang memuat tanggal tersebut. */
export function awalBulan(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return awalBulan(todayISO());
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Tanggal penutup bulan tersebut. */
export function akhirBulan(awalISO: string): string {
  const date = new Date(`${awalISO}T00:00:00`);
  // Hari ke-0 bulan berikutnya adalah hari terakhir bulan ini, sekaligus
  // menyelesaikan urusan tahun kabisat tanpa perlu dihitung sendiri.
  return keISO(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function geserBulan(awalISO: string, jumlahBulan: number): string {
  const date = new Date(`${awalISO}T00:00:00`);
  return keISO(new Date(date.getFullYear(), date.getMonth() + jumlahBulan, 1));
}

export function bulanBerjalan(): string {
  return awalBulan(todayISO());
}

/**
 * Daftar bulan dari yang berjalan mundur ke belakang, berhenti saat mencapai
 * bulan murid terdaftar atau saat sudah mencapai batas maksimal.
 */
export function daftarBulan(terdaftar: Date, maks = 12): string[] {
  const batas = awalBulan(keISO(terdaftar));
  const hasil: string[] = [];
  let kursor = bulanBerjalan();

  while (hasil.length < maks && kursor >= batas) {
    hasil.push(kursor);
    kursor = geserBulan(kursor, -1);
  }

  // Murid yang baru terdaftar bulan ini tetap mendapat satu pilihan.
  return hasil.length > 0 ? hasil : [bulanBerjalan()];
}

export function labelBulan(awalISO: string): string {
  const date = new Date(`${awalISO}T00:00:00`);
  return `${NAMA_BULAN[date.getMonth()]} ${date.getFullYear()}`;
}
