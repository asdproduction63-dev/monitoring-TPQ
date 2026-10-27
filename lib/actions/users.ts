"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import { redirectWithError } from "@/lib/actions/helpers";

const userSchema = z.object({
  name: z.string().trim().min(1, "Nama pengguna wajib diisi.").max(100),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username minimal 3 karakter.")
    .max(30)
    .regex(/^[a-z0-9._-]+$/, "Username hanya boleh huruf kecil, angka, titik, garis bawah, atau strip."),
  role: z.enum(Object.keys(ROLES) as [keyof typeof ROLES, ...(keyof typeof ROLES)[]]),
});

const accountSchema = userSchema.pick({ name: true, username: true });

const TAB_PENGGUNA = "/pengaturan?tab=pengguna";

/** Nilai kosong berarti akun tidak ditautkan ke murid mana pun. */
function bacaSantriId(formData: FormData): number | null {
  const raw = String(formData.get("santriId") ?? "").trim();
  if (raw === "") return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Satu murid hanya boleh dipegang satu akun wali. pemilikSaatIni dipakai saat
 * menyunting akun yang memang sudah tertaut ke murid tersebut.
 */
async function pastikanMuridBebas(santriId: number, pemilikSaatIni: number | null) {
  const santri = await prisma.santri.findUnique({
    where: { id: santriId },
    select: { name: true, waliId: true },
  });

  if (!santri) {
    redirectWithError(TAB_PENGGUNA, "Murid yang dipilih tidak ditemukan.");
  }
  if (santri.waliId !== null && santri.waliId !== pemilikSaatIni) {
    redirectWithError(TAB_PENGGUNA, `${santri.name} sudah ditautkan ke akun wali lain.`);
  }
}

/** Lepas tautan lama milik akun ini, lalu pasang tautan baru bila ada. */
async function tautkanMurid(userId: number, santriId: number | null) {
  await prisma.santri.updateMany({ where: { waliId: userId }, data: { waliId: null } });
  if (santriId !== null) {
    await prisma.santri.update({ where: { id: santriId }, data: { waliId: userId } });
  }
}

export async function updateOwnAccount(formData: FormData) {
  const current = await requireUser();
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
  });
  if (!parsed.success) {
    redirectWithError("/pengaturan?tab=akun", parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const wantsPasswordChange =
    currentPassword !== "" || newPassword !== "" || confirmPassword !== "";

  const account = await prisma.user.findUnique({
    where: { id: current.id },
    select: { passwordHash: true },
  });
  if (!account) {
    redirectWithError("/pengaturan?tab=akun", "Akun tidak ditemukan.");
  }

  if (wantsPasswordChange) {
    if (!currentPassword) {
      redirectWithError("/pengaturan?tab=akun", "Masukkan password saat ini.");
    }
    const valid = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!valid) {
      redirectWithError("/pengaturan?tab=akun", "Password saat ini salah.");
    }
    if (newPassword.length < 6) {
      redirectWithError("/pengaturan?tab=akun", "Password baru minimal 6 karakter.");
    }
    if (newPassword !== confirmPassword) {
      redirectWithError("/pengaturan?tab=akun", "Konfirmasi password baru tidak cocok.");
    }
  }

  const duplicate = await prisma.user.findFirst({
    where: { username: parsed.data.username, id: { not: current.id } },
  });
  if (duplicate) {
    redirectWithError("/pengaturan?tab=akun", "Username sudah digunakan pengguna lain.");
  }

  await prisma.user.update({
    where: { id: current.id },
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      ...(wantsPasswordChange ? { passwordHash: await bcrypt.hash(newPassword, 10) } : {}),
    },
  });

  await setSessionCookie({
    id: current.id,
    name: parsed.data.name,
    username: parsed.data.username,
    role: current.role,
  });

  revalidatePath("/", "layout");
  revalidatePath("/pengaturan");
  redirect("/pengaturan?tab=akun&saved=1");
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    role: formData.get("role"),
  });
  const password = String(formData.get("password") ?? "");

  if (!parsed.success) {
    redirectWithError("/pengaturan?tab=pengguna", parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }
  if (password.length < 6) {
    redirectWithError("/pengaturan?tab=pengguna", "Password minimal 6 karakter.");
  }

  const santriId = bacaSantriId(formData);
  const wali = parsed.data.role === "WALI";

  if (wali && santriId === null) {
    redirectWithError(TAB_PENGGUNA, "Akun wali murid harus ditautkan ke satu murid.");
  }
  if (wali && santriId !== null) {
    await pastikanMuridBebas(santriId, null);
  }

  const duplicate = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (duplicate) {
    redirectWithError("/pengaturan?tab=pengguna", "Username sudah digunakan.");
  }

  const dibuat = await prisma.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      role: parsed.data.role,
      passwordHash: await bcrypt.hash(password, 10),
    },
    select: { id: true },
  });

  if (wali && santriId !== null) {
    await tautkanMurid(dibuat.id, santriId);
  }

  revalidatePath("/pengaturan");
  redirect("/pengaturan?tab=pengguna&saved=1");
}

export async function updateUser(formData: FormData) {
  const current = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    redirectWithError("/pengaturan?tab=pengguna", "Pengguna tidak ditemukan.");
  }

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    redirectWithError("/pengaturan?tab=pengguna", parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const active = formData.get("active") === "on";
  const password = String(formData.get("password") ?? "").trim();

  if (id === current.id && (!active || parsed.data.role !== "ADMIN")) {
    redirectWithError(
      "/pengaturan?tab=pengguna",
      "Anda tidak dapat menonaktifkan atau menurunkan role akun sendiri.",
    );
  }
  if (password !== "" && password.length < 6) {
    redirectWithError("/pengaturan?tab=pengguna", "Password baru minimal 6 karakter.");
  }

  const santriId = bacaSantriId(formData);
  const wali = parsed.data.role === "WALI";

  if (wali && santriId === null) {
    redirectWithError(TAB_PENGGUNA, "Akun wali murid harus ditautkan ke satu murid.");
  }
  if (wali && santriId !== null) {
    await pastikanMuridBebas(santriId, id);
  }

  const duplicate = await prisma.user.findFirst({
    where: { username: parsed.data.username, id: { not: id } },
  });
  if (duplicate) {
    redirectWithError("/pengaturan?tab=pengguna", "Username sudah digunakan pengguna lain.");
  }

  await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      role: parsed.data.role,
      active,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });

  // Role bukan wali lagi berarti tautan ke murid ikut dilepas.
  await tautkanMurid(id, wali ? santriId : null);

  revalidatePath("/pengaturan");
  redirect("/pengaturan?tab=pengguna&saved=1");
}
