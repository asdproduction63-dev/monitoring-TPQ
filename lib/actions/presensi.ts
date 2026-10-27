"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PRESENSI_STATUS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { redirectWithError } from "@/lib/actions/helpers";

export async function savePresensi(formData: FormData) {
  const user = await requireUser();
  const date = String(formData.get("date") ?? "");
  const kegiatanId = Number(formData.get("kegiatanId"));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    redirectWithError("/presensi", "Tanggal tidak valid.");
  }
  if (!Number.isInteger(kegiatanId) || kegiatanId <= 0) {
    redirectWithError(`/presensi?date=${date}`, "Kegiatan belum dipilih.");
  }

  const kegiatan = await prisma.kegiatan.findUnique({ where: { id: kegiatanId } });
  if (!kegiatan) {
    redirectWithError(`/presensi?date=${date}`, "Kegiatan tidak ditemukan.");
  }

  const santriList = await prisma.santri.findMany({
    where: { active: true },
    select: { id: true },
    orderBy: { id: "asc" },
  });

  const entries: { santriId: number; status: string; note: string | null }[] = [];

  for (const santri of santriList) {
    const status = String(formData.get(`status_${santri.id}`) ?? "");
    if (!(status in PRESENSI_STATUS)) continue;
    const note = String(formData.get(`note_${santri.id}`) ?? "").trim();
    entries.push({ santriId: santri.id, status, note: note || null });
  }

  if (entries.length === 0) {
    redirectWithError(
      `/presensi?date=${date}&kegiatan=${kegiatanId}`,
      "Belum ada status kehadiran yang dipilih.",
    );
  }

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.presensi.upsert({
        where: {
          santriId_kegiatanId_date: {
            santriId: entry.santriId,
            kegiatanId,
            date,
          },
        },
        update: {
          status: entry.status,
          note: entry.note,
          recordedById: user.id,
        },
        create: {
          santriId: entry.santriId,
          kegiatanId,
          date,
          status: entry.status,
          note: entry.note,
          recordedById: user.id,
        },
      }),
    ),
  );

  revalidatePath("/presensi");
  revalidatePath("/dashboard");
  revalidatePath("/laporan");
  redirect(`/presensi?date=${date}&kegiatan=${kegiatanId}&saved=1`);
}
