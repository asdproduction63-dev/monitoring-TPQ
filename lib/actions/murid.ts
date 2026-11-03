"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hapusBerkas } from "@/lib/storage";
import { redirectWithError } from "@/lib/actions/helpers";

const santriSchema = z.object({
  nis: z.string().trim().min(1, "NIS wajib diisi.").max(30, "NIS terlalu panjang."),
  name: z.string().trim().min(1, "Nama murid wajib diisi.").max(100, "Nama terlalu panjang."),
  gender: z.enum(["L", "P"]),
  kelas: z.string().trim().min(1, "Kelas wajib diisi.").max(30, "Kelas terlalu panjang."),
  phone: z.string().trim().max(30, "Nomor telepon terlalu panjang."),
});

function bacaForm(formData: FormData) {
  return santriSchema.safeParse({
    nis: formData.get("nis"),
    name: formData.get("name"),
    gender: formData.get("gender"),
    kelas: formData.get("kelas"),
    phone: formData.get("phone") ?? "",
  });
}

export async function createSantri(formData: FormData) {
  await requireUser();
  const parsed = bacaForm(formData);
  if (!parsed.success) {
    redirectWithError("/murid/baru", parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const data = parsed.data;
  const existing = await prisma.santri.findUnique({ where: { nis: data.nis } });
  if (existing) {
    redirectWithError("/murid/baru", `NIS ${data.nis} sudah digunakan oleh ${existing.name}.`);
  }

  const santri = await prisma.santri.create({
    data: {
      nis: data.nis,
      name: data.name,
      gender: data.gender,
      kelas: data.kelas,
      phone: data.phone || null,
    },
  });

  revalidatePath("/murid");
  revalidatePath("/dashboard");
  redirect(`/murid/${santri.id}?saved=1`);
}

export async function updateSantri(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    redirectWithError("/murid", "Murid tidak ditemukan.");
  }

  const parsed = bacaForm(formData);
  if (!parsed.success) {
    redirectWithError(`/murid/${id}/edit`, parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const data = parsed.data;
  const duplicate = await prisma.santri.findFirst({
    where: { nis: data.nis, id: { not: id } },
  });
  if (duplicate) {
    redirectWithError(
      `/murid/${id}/edit`,
      `NIS ${data.nis} sudah digunakan oleh ${duplicate.name}.`,
    );
  }

  await prisma.santri.update({
    where: { id },
    data: {
      nis: data.nis,
      name: data.name,
      gender: data.gender,
      kelas: data.kelas,
      phone: data.phone || null,
    },
  });

  revalidatePath("/murid");
  revalidatePath(`/murid/${id}`);
  revalidatePath("/dashboard");
  redirect(`/murid/${id}?saved=1`);
}

/**
 * Hapus murid beserta seluruh jejaknya: setoran, presensi, catatan rumah,
 * dan berkas foto atau videonya di penyimpanan.
 *
 * Hanya admin, dan hanya kalau nama muridnya diketik ulang dengan benar —
 * ini satu-satunya tindakan di aplikasi yang tidak bisa dibatalkan. Untuk
 * murid yang sekadar berhenti mengaji, toggleSantriActive jauh lebih tepat:
 * riwayatnya tetap utuh untuk rekap TPQ.
 *
 * Akun wali yang tertaut tidak ikut terhapus, hanya terlepas tautannya.
 */
export async function deleteSantri(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    redirectWithError("/murid", "Murid tidak ditemukan.");
  }

  const santri = await prisma.santri.findUnique({
    where: { id },
    select: {
      name: true,
      catatanRumah: { select: { media: { select: { jalur: true } } } },
    },
  });
  if (!santri) {
    redirectWithError("/murid", "Murid tidak ditemukan.");
  }

  const konfirmasi = String(formData.get("konfirmasi") ?? "").trim();
  if (konfirmasi.toLowerCase() !== santri.name.trim().toLowerCase()) {
    redirectWithError(
      `/murid/${id}`,
      "Nama yang diketik tidak cocok, jadi penghapusan dibatalkan.",
    );
  }

  // Jalurnya dikumpulkan sebelum barisnya hilang; setelah dihapus tidak ada
  // lagi yang menunjuk ke berkas-berkas ini.
  const jalur = santri.catatanRumah.flatMap((c) => c.media.map((m) => m.jalur));

  // Setoran, presensi, catatan, dan medianya ikut terhapus lewat cascade.
  await prisma.santri.delete({ where: { id } });
  await hapusBerkas(jalur);

  revalidatePath("/murid");
  revalidatePath("/dashboard");
  revalidatePath("/presensi");
  revalidatePath("/laporan");
  revalidatePath("/laporan-rumah");
  revalidatePath("/pengaturan");
  redirect(`/murid?deleted=${encodeURIComponent(santri.name)}`);
}

export async function toggleSantriActive(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  const redirectTo = String(formData.get("redirectTo") || "/murid");
  if (!Number.isInteger(id) || id <= 0) {
    redirectWithError("/murid", "Murid tidak ditemukan.");
  }

  const santri = await prisma.santri.findUnique({ where: { id } });
  if (!santri) {
    redirectWithError("/murid", "Murid tidak ditemukan.");
  }

  await prisma.santri.update({
    where: { id },
    data: { active: !santri.active },
  });

  revalidatePath("/murid");
  revalidatePath(`/murid/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/presensi");
  redirect(redirectTo);
}
