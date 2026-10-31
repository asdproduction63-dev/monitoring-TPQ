import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { logout } from "@/lib/actions/auth";
import { ROLES } from "@/lib/constants";
import { formatTanggalPanjang, todayISO } from "@/lib/format";
import { Sidebar } from "./sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([requireStaff(), getSettings()]);
  const periode = `T.A. ${settings.tahunAjaran} · Semester ${settings.semester}`;

  // Penanda di sidebar: laporan rumah yang masuk setelah staf ini terakhir
  // membuka daftarnya. Tiap orang punya hitungannya sendiri.
  const akun = await prisma.user.findUnique({
    where: { id: user.id },
    select: { catatanDibacaAt: true },
  });
  const catatanBaru = await prisma.catatanRumah.count({
    where: akun?.catatanDibacaAt ? { createdAt: { gt: akun.catatanDibacaAt } } : {},
  });

  return (
    <div className="bg-app min-h-screen lg:flex">
      <Sidebar
        user={user}
        namaTpq={settings.namaTpq}
        periode={periode}
        catatanBaru={catatanBaru}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="app-bar bg-topbar sticky top-0 z-20 border-b border-ink-200 px-4 py-2.5 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
            <p className="truncate text-[12.5px] text-ink-500">{formatTanggalPanjang(todayISO())}</p>

            <div className="flex shrink-0 items-center gap-3">
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-[12.5px] font-medium text-ink-800">{user.name}</p>
                <p className="text-[11px] text-ink-500">{ROLES[user.role]?.label ?? user.role}</p>
              </div>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded border border-ink-200 bg-white px-2.5 py-1 text-[12px] font-medium text-ink-600 transition hover:border-ink-300 hover:text-ink-900"
                >
                  Keluar
                </button>
              </form>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
