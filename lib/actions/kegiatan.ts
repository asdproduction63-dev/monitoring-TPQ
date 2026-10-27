"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { KATEGORI_KEGIATAN } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { redirectWithError } from "@/lib/actions/helpers";

const kegiatanSchema = z.object({
  name: z.string().trim().min(1, "Nama kegiatan wajib diisi.").max(100),
  category: z.enum(
    Object.keys(KATEGORI_KEGIATAN) as [
      keyof typeof KATEGORI_KEGIATAN,
      ...(keyof typeof KATEGORI_KEGIATAN)[],
    ],
  ),
  startTime: z.string().trim().max(5),
  endTime: z.string().trim().max(5),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

function bacaForm(formData: FormData) {
  return kegiatanSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    startTime: formData.get("startTime") ?? "",
    endTime: formData.get("endTime") ?? "",
    sortOrder: formData.get("sortOrder") ?? 0,
  });
}

function validasiJam(value: string) {
  return value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export async function createKegiatan(formData: FormData) {
  await requireAdmin();
  const parsed = bacaForm(formData);
  if (!parsed.success) {
    redirectWithError("/pengaturan?tab=kegiatan", parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const data = parsed.data;
  if (!validasiJam(data.startTime) || !validasiJam(data.endTime)) {
    redirectWithError("/pengaturan?tab=kegiatan", "Format jam harus HH:MM, contoh 07:30.");
  }

  await prisma.kegiatan.create({
    data: {
      name: data.name,
      category: data.category,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      sortOrder: data.sortOrder,
    },
  });

  revalidatePath("/pengaturan");
  revalidatePath("/presensi");
  revalidatePath("/dashboard");
  redirect("/pengaturan?tab=kegiatan&saved=1");
}

export async function updateKegiatan(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const parsed = bacaForm(formData);
  if (!Number.isInteger(id) || id <= 0) {
    redirectWithError("/pengaturan?tab=kegiatan", "Kegiatan tidak ditemukan.");
  }
  if (!parsed.success) {
    redirectWithError("/pengaturan?tab=kegiatan", parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const data = parsed.data;
  if (!validasiJam(data.startTime) || !validasiJam(data.endTime)) {
    redirectWithError("/pengaturan?tab=kegiatan", "Format jam harus HH:MM, contoh 07:30.");
  }

  await prisma.kegiatan.update({
    where: { id },
    data: {
      name: data.name,
      category: data.category,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      sortOrder: data.sortOrder,
      active: formData.get("active") === "on",
    },
  });

  revalidatePath("/pengaturan");
  revalidatePath("/presensi");
  revalidatePath("/dashboard");
  redirect("/pengaturan?tab=kegiatan&saved=1");
}

export async function toggleKegiatan(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const kegiatan = await prisma.kegiatan.findUnique({ where: { id } });
  if (!kegiatan) {
    redirectWithError("/pengaturan?tab=kegiatan", "Kegiatan tidak ditemukan.");
  }

  await prisma.kegiatan.update({ where: { id }, data: { active: !kegiatan.active } });
  revalidatePath("/pengaturan");
  revalidatePath("/presensi");
  redirect("/pengaturan?tab=kegiatan&saved=1");
}

export async function deleteKegiatan(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    redirectWithError("/pengaturan?tab=kegiatan", "Kegiatan tidak ditemukan.");
  }

  const jumlahPresensi = await prisma.presensi.count({ where: { kegiatanId: id } });
  if (jumlahPresensi > 0) {
    redirectWithError(
      "/pengaturan?tab=kegiatan",
      "Kegiatan sudah memiliki data presensi. Nonaktifkan saja agar riwayat tetap tersimpan.",
    );
  }

  await prisma.kegiatan.delete({ where: { id } });
  revalidatePath("/pengaturan");
  revalidatePath("/presensi");
  redirect("/pengaturan?tab=kegiatan&deleted=1");
}
