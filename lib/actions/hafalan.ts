"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { PREDIKAT, STATUS_SETORAN, JENIS_SETORAN } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { redirectWithError } from "@/lib/actions/helpers";

const setoranSchema = z.object({
  santriId: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal tidak valid."),
  type: z.enum(Object.keys(JENIS_SETORAN) as [keyof typeof JENIS_SETORAN, ...(keyof typeof JENIS_SETORAN)[]]),
  materi: z.string().trim().min(1, "Materi wajib diisi.").max(200, "Materi maksimal 200 karakter."),
  predikat: z.enum(Object.keys(PREDIKAT) as [keyof typeof PREDIKAT, ...(keyof typeof PREDIKAT)[]]),
  status: z.enum(Object.keys(STATUS_SETORAN) as [keyof typeof STATUS_SETORAN, ...(keyof typeof STATUS_SETORAN)[]]),
  catatan: z.string().trim().max(500, "Catatan maksimal 500 karakter."),
});

export async function createSetoran(formData: FormData) {
  const user = await requireUser();

  const parsed = setoranSchema.safeParse({
    santriId: formData.get("santriId"),
    date: formData.get("date"),
    type: formData.get("type"),
    materi: formData.get("materi"),
    predikat: formData.get("predikat"),
    status: formData.get("status"),
    catatan: formData.get("catatan") ?? "",
  });

  if (!parsed.success) {
    redirectWithError("/hafalan", parsed.error.issues[0]?.message ?? "Data setoran tidak valid.");
  }

  const data = parsed.data;

  const santri = await prisma.santri.findUnique({ where: { id: data.santriId } });
  if (!santri) {
    redirectWithError("/hafalan", "Murid tidak ditemukan.");
  }

  await prisma.hafalanSetoran.create({
    data: {
      santriId: data.santriId,
      pengujiId: user.id,
      date: data.date,
      type: data.type,
      materi: data.materi,
      predikat: data.predikat,
      status: data.status,
      catatan: data.catatan || null,
    },
  });

  revalidatePath("/hafalan");
  revalidatePath("/dashboard");
  revalidatePath("/murid");
  revalidatePath(`/murid/${data.santriId}`);
  revalidatePath("/laporan");
  redirect("/hafalan?saved=1");
}

export async function deleteSetoran(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirectWithError("/hafalan", "Hanya admin yang dapat menghapus setoran.");
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    redirectWithError("/hafalan", "Setoran tidak ditemukan.");
  }

  const setoran = await prisma.hafalanSetoran.findUnique({ where: { id } });
  if (!setoran) {
    redirectWithError("/hafalan", "Setoran tidak ditemukan.");
  }

  await prisma.hafalanSetoran.delete({ where: { id } });

  revalidatePath("/hafalan");
  revalidatePath("/dashboard");
  revalidatePath(`/murid/${setoran.santriId}`);
  revalidatePath("/laporan");
  redirect("/hafalan?deleted=1");
}
