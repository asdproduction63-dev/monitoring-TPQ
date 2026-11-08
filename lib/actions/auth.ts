"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { toSessionRole } from "@/lib/session-token";
import { catatGagal, periksaKunci, resetKunci } from "@/lib/throttle-login";

export type LoginState = { error: string };

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Username dan password wajib diisi." };
  }

  const username = parsed.data.username.toLowerCase();

  // Pilih kolomnya secara tegas, tanpa menyentuh kolom lain, supaya kueri ini
  // tidak ikut tergantung pada perubahan skema mana pun di masa depan.
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true, passwordHash: true, role: true, active: true },
  });

  if (!user || !user.active) {
    return { error: "Username atau password salah, atau akun tidak aktif." };
  }

  // Akun yang baru saja dibanjiri percobaan gagal ditahan sebentar. Dicek
  // setelah akun dipastikan ada, supaya username ngawur tidak ikut tercatat.
  const kunci = await periksaKunci(username);
  if (kunci.terkunci) {
    return {
      error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${kunci.menitTersisa} menit.`,
    };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    await catatGagal(username);
    return { error: "Username atau password salah." };
  }

  await resetKunci(username);

  const role = toSessionRole(user.role);

  await setSessionCookie({
    id: user.id,
    name: user.name,
    username: user.username,
    role,
  });

  redirect(role === "WALI" ? "/raport" : "/dashboard");
}

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}
