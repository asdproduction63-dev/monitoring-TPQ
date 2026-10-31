"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  BATAS_UKURAN,
  hapusBerkas,
  izinUnggah,
  jalurAman,
  jenisMedia,
  storageSiap,
} from "@/lib/storage";

export type HasilIzin =
  | { ok: true; jalur: string; url: string; token: string }
  | { ok: false; pesan: string };

export type HasilSimpan = { ok: true } | { ok: false; pesan: string };

const BATAS_MEDIA = 6;

/**
 * Cari murid yang boleh disentuh oleh pemanggil. Wali hanya anaknya sendiri,
 * staf boleh murid mana pun. Mengembalikan null bila tidak berhak.
 */
async function muridYangBoleh(santriId: number) {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "WALI") {
    const milik = await prisma.santri.findFirst({
      where: { id: santriId, waliId: user.id },
      select: { id: true },
    });
    return milik ? { user, santriId: milik.id } : null;
  }

  const ada = await prisma.santri.findUnique({
    where: { id: santriId },
    select: { id: true },
  });
  return ada ? { user, santriId: ada.id } : null;
}

/**
 * Terbitkan izin unggah sekali pakai. Jalur berkas ditentukan di sini, bukan
 * oleh peramban, supaya tidak ada yang bisa menulis ke folder murid lain.
 */
export async function mintaIzinUnggah(
  santriId: number,
  namaBerkas: string,
  tipe: string,
  ukuran: number,
): Promise<HasilIzin> {
  if (!storageSiap()) {
    return { ok: false, pesan: "Penyimpanan berkas belum disiapkan. Hubungi admin." };
  }

  const izin = await muridYangBoleh(santriId);
  if (!izin) return { ok: false, pesan: "Tidak berhak mengunggah untuk murid ini." };

  if (!jenisMedia(tipe)) {
    return { ok: false, pesan: `Jenis berkas ${tipe || "tidak dikenal"} tidak didukung.` };
  }
  if (!Number.isFinite(ukuran) || ukuran <= 0) {
    return { ok: false, pesan: "Ukuran berkas tidak terbaca." };
  }
  if (ukuran > BATAS_UKURAN) {
    const mb = Math.round(BATAS_UKURAN / 1024 / 1024);
    return { ok: false, pesan: `Berkas melebihi batas ${mb} MB.` };
  }

  try {
    const jalur = jalurAman(izin.santriId, namaBerkas);
    const { url, token } = await izinUnggah(jalur);
    return { ok: true, jalur, url, token };
  } catch (e) {
    return { ok: false, pesan: e instanceof Error ? e.message : "Gagal menyiapkan unggahan." };
  }
}

const skemaMedia = z.object({
  jalur: z.string().min(1).max(300),
  jenis: z.enum(["FOTO", "VIDEO"]),
  namaAsli: z.string().min(1).max(200),
  ukuran: z.number().int().positive().max(BATAS_UKURAN),
});

/** Simpan satu catatan beserta media yang sudah terunggah. */
export async function simpanCatatan(
  santriId: number,
  isi: string,
  media: unknown,
): Promise<HasilSimpan> {
  const izin = await muridYangBoleh(santriId);
  if (!izin) return { ok: false, pesan: "Tidak berhak menulis catatan untuk murid ini." };

  const teks = isi.trim();
  const terurai = z.array(skemaMedia).max(BATAS_MEDIA).safeParse(media);
  if (!terurai.success) {
    return { ok: false, pesan: "Daftar media tidak valid." };
  }
  const berkas = terurai.data;

  if (teks.length === 0 && berkas.length === 0) {
    return { ok: false, pesan: "Tulis catatan atau lampirkan minimal satu berkas." };
  }
  if (teks.length > 2000) {
    return { ok: false, pesan: "Catatan terlalu panjang, maksimal 2000 karakter." };
  }

  // Jalur wajib berada di dalam folder murid yang bersangkutan. Ini menutup
  // celah bila peramban mengirim jalur karangan sendiri.
  const awalan = `santri/${izin.santriId}/`;
  if (berkas.some((m) => !m.jalur.startsWith(awalan) || m.jalur.includes(".."))) {
    return { ok: false, pesan: "Jalur berkas tidak sah." };
  }

  await prisma.catatanRumah.create({
    data: {
      santriId: izin.santriId,
      penulisId: izin.user.id,
      isi: teks,
      media: { create: berkas },
    },
  });

  revalidatePath("/raport");
  revalidatePath(`/murid/${izin.santriId}`);
  return { ok: true };
}

/**
 * Tandai bahwa staf ini sudah membuka daftar laporan rumah. Dipanggil dari
 * halaman daftar, bukan saat render, supaya penulisan tidak terjadi di
 * tengah proses menggambar halaman.
 */
export async function tandaiCatatanDibaca(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role === "WALI") return;

  await prisma.user.update({
    where: { id: user.id },
    data: { catatanDibacaAt: new Date() },
  });

  // Penanda jumlah ada di sidebar, yang hidup di layout.
  revalidatePath("/", "layout");
}

/** Hapus catatan beserta berkasnya. Penulis boleh menghapus miliknya sendiri. */
export async function hapusCatatan(catatanId: number): Promise<HasilSimpan> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, pesan: "Sesi berakhir, silakan masuk lagi." };

  const catatan = await prisma.catatanRumah.findUnique({
    where: { id: catatanId },
    select: { id: true, penulisId: true, santriId: true, media: { select: { jalur: true } } },
  });
  if (!catatan) return { ok: false, pesan: "Catatan tidak ditemukan." };

  const miliknya = catatan.penulisId === user.id;
  if (!miliknya && user.role !== "ADMIN") {
    return { ok: false, pesan: "Hanya penulis atau admin yang boleh menghapus." };
  }

  await prisma.catatanRumah.delete({ where: { id: catatanId } });
  await hapusBerkas(catatan.media.map((m) => m.jalur));

  revalidatePath("/raport");
  revalidatePath(`/murid/${catatan.santriId}`);
  return { ok: true };
}
