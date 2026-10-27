import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { toSessionRole, type SessionUser } from "@/lib/session-token";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSessionUser();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, username: true, role: true, active: true },
  });

  if (!user || !user.active) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: toSessionRole(user.role),
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Halaman pencatatan hanya untuk admin dan ustadz. Wali murid yang nyasar
 * ke sini dilempar ke halaman raportnya sendiri.
 */
export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === "WALI") redirect("/raport");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireStaff();
  if (user.role !== "ADMIN") {
    redirect(`/dashboard?error=${encodeURIComponent("Halaman tersebut hanya untuk admin.")}`);
  }
  return user;
}

export type WaliSantri = {
  id: number;
  nis: string;
  name: string;
  kelas: string;
  active: boolean;
  createdAt: Date;
};

/**
 * Mengembalikan akun wali beserta murid yang ditautkan padanya. Admin dan
 * ustadz tidak punya murid tertaut, jadi mereka dilempar balik ke dashboard.
 *
 * santri bisa null bila admin belum menautkan akun ini ke murid mana pun.
 * Halaman raport menanganinya dengan pesan, bukan redirect, supaya tidak
 * terjadi lempar-lemparan antara /raport dan /dashboard.
 */
export async function requireWali(): Promise<{ user: SessionUser; santri: WaliSantri | null }> {
  const user = await requireUser();
  if (user.role !== "WALI") redirect("/dashboard");

  const santri = await prisma.santri.findFirst({
    where: { waliId: user.id },
    select: { id: true, nis: true, name: true, kelas: true, active: true, createdAt: true },
  });

  return { user, santri };
}
