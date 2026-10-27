"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { toSessionRole } from "@/lib/session-token";

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

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username.toLowerCase() },
  });

  if (!user || !user.active) {
    return { error: "Username atau password salah, atau akun tidak aktif." };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { error: "Username atau password salah." };
  }

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
