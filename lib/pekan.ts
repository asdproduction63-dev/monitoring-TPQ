import { todayISO } from "@/lib/format";

/**
 * Raport diterbitkan per pekan, Senin sampai Minggu. Satu pekan diwakili
 * oleh tanggal Seninnya dalam format ISO (YYYY-MM-DD).
 */

function keISO(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/** Senin dari pekan yang memuat tanggal tersebut. */
export function awalPekan(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return awalPekan(todayISO());
  // getDay(): 0 Minggu, 1 Senin, ... 6 Sabtu. Senin dijadikan hari ke-0.
  const mundur = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mundur);
  return keISO(date);
}

/** Minggu penutup dari pekan yang dimulai pada tanggal Senin tersebut. */
export function akhirPekan(seninISO: string): string {
  const date = new Date(`${seninISO}T00:00:00`);
  date.setDate(date.getDate() + 6);
  return keISO(date);
}

export function geserPekan(seninISO: string, jumlahPekan: number): string {
  const date = new Date(`${seninISO}T00:00:00`);
  date.setDate(date.getDate() + jumlahPekan * 7);
  return keISO(date);
}

export function pekanBerjalan(): string {
  return awalPekan(todayISO());
}

export function pekanSudahSelesai(seninISO: string): boolean {
  return akhirPekan(seninISO) < todayISO();
}

/**
 * Daftar pekan dari yang berjalan mundur ke belakang, berhenti saat mencapai
 * pekan murid terdaftar atau saat sudah mencapai batas maksimal.
 */
export function daftarPekan(terdaftar: Date, maks = 12): string[] {
  const batas = awalPekan(keISO(terdaftar));
  const hasil: string[] = [];
  let kursor = pekanBerjalan();

  while (hasil.length < maks && kursor >= batas) {
    hasil.push(kursor);
    kursor = geserPekan(kursor, -1);
  }

  // Murid yang baru terdaftar minggu ini tetap mendapat satu pilihan.
  return hasil.length > 0 ? hasil : [pekanBerjalan()];
}

const BULAN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/** Contoh: "19 – 25 Okt 2026" atau "29 Sep – 5 Okt 2026". */
export function formatRentangPekan(seninISO: string): string {
  const awal = new Date(`${seninISO}T00:00:00`);
  const akhir = new Date(`${akhirPekan(seninISO)}T00:00:00`);

  const awalBulan = BULAN[awal.getMonth()];
  const akhirBulan = BULAN[akhir.getMonth()];
  const tahunSama = awal.getFullYear() === akhir.getFullYear();

  if (awalBulan === akhirBulan && tahunSama) {
    return `${awal.getDate()} – ${akhir.getDate()} ${akhirBulan} ${akhir.getFullYear()}`;
  }

  const kiri = tahunSama
    ? `${awal.getDate()} ${awalBulan}`
    : `${awal.getDate()} ${awalBulan} ${awal.getFullYear()}`;

  return `${kiri} – ${akhir.getDate()} ${akhirBulan} ${akhir.getFullYear()}`;
}

/** Label pendek untuk pilihan pekan. */
export function labelPekan(seninISO: string): string {
  const rentang = formatRentangPekan(seninISO);
  if (seninISO === pekanBerjalan()) return `${rentang} (pekan berjalan)`;
  return rentang;
}
