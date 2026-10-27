"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectWithError } from "@/lib/actions/helpers";

const settingsSchema = z.object({
  namaTpq: z.string().trim().min(1, "Nama TPQ wajib diisi.").max(120),
  namaPengasuh: z.string().trim().max(120),
  tahunAjaran: z.string().trim().min(1, "Tahun ajaran wajib diisi.").max(20),
  semester: z.enum(["Ganjil", "Genap"]),
});

export async function updateSettings(formData: FormData) {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    namaTpq: formData.get("namaTpq"),
    namaPengasuh: formData.get("namaPengasuh") ?? "",
    tahunAjaran: formData.get("tahunAjaran"),
    semester: formData.get("semester"),
  });

  if (!parsed.success) {
    redirectWithError("/pengaturan?tab=tpq", parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const data = parsed.data;
  const values: Record<string, string> = {
    namaTpq: data.namaTpq,
    namaPengasuh: data.namaPengasuh,
    tahunAjaran: data.tahunAjaran,
    semester: data.semester,
  };

  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );

  revalidatePath("/pengaturan");
  revalidatePath("/dashboard");
  redirect("/pengaturan?tab=tpq&saved=1");
}
