import { formatRentangPekan } from "@/lib/pekan";

/**
 * Ubah nomor yang diketik admin menjadi format yang diterima tautan wa.me:
 * kode negara tanpa tanda plus, tanpa spasi, tanpa angka nol di depan.
 * Mengembalikan null bila nomornya tidak masuk akal.
 */
export function nomorWa(mentah: string | null | undefined): string | null {
  if (!mentah) return null;

  let angka = mentah.replace(/\D/g, "");
  if (!angka) return null;

  if (angka.startsWith("620")) {
    angka = `62${angka.slice(3)}`;
  } else if (angka.startsWith("0")) {
    angka = `62${angka.slice(1)}`;
  } else if (!angka.startsWith("62")) {
    angka = `62${angka}`;
  }

  // Nomor seluler Indonesia: 62 diikuti 9 sampai 12 angka.
  if (angka.length < 11 || angka.length > 15) return null;
  return angka;
}

/** Tampilan nomor yang enak dibaca di layar, misalnya +62 812-3456-7890. */
export function tampilNomor(mentah: string | null | undefined): string | null {
  const angka = nomorWa(mentah);
  if (!angka) return null;
  const sisa = angka.slice(2);
  const bagian = [sisa.slice(0, 3), sisa.slice(3, 7), sisa.slice(7)].filter(Boolean);
  return `+62 ${bagian.join("-")}`;
}

export type Pemberitahuan = {
  namaTpq: string;
  nama: string;
  kelas: string;
  pekan: string;
  tautan?: string | null;
};

/**
 * Pesan pemberitahuan, bukan isi raportnya. Nilai dan catatan anak sengaja
 * tidak dicantumkan supaya tidak tersebar lewat chat; wali membukanya sendiri
 * di aplikasi memakai akunnya.
 *
 * Tanda bintang dibaca WhatsApp sebagai huruf tebal.
 */
export function pesanPemberitahuan(p: Pemberitahuan): string {
  const baris = [
    "Assalamu'alaikum warahmatullahi wabarakatuh.",
    "",
    `Bapak/Ibu wali dari *${p.nama}* (${p.kelas}),`,
    "",
    `Raport pekanan untuk pekan ${formatRentangPekan(p.pekan)} sudah bisa dilihat.`,
    "",
  ];

  if (p.tautan) {
    baris.push("Silakan buka:", p.tautan, "");
    baris.push("Masuk memakai akun wali yang sudah diberikan pengurus.");
  } else {
    baris.push(
      "Silakan buka aplikasi TPQ dan masuk memakai akun wali yang sudah diberikan pengurus.",
    );
  }

  baris.push("", "Terima kasih.", p.namaTpq);

  return baris.join("\n");
}

/** Tautan yang membuka WhatsApp dengan pesan yang sudah terisi. */
export function tautanWa(nomor: string, pesan: string): string {
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`;
}
