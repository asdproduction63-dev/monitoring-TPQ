import Image from "next/image";
import { requireWali } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { logout } from "@/lib/actions/auth";

export default async function RaportLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, settings] = await Promise.all([requireWali(), getSettings()]);

  return (
    <div className="bg-app flex min-h-screen flex-col">
      <header className="app-bar bg-sidebar border-b border-ink-200 px-4 py-3 lg:px-8">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Image
              src="/logo-lambang.png"
              alt=""
              width={507}
              height={482}
              className="h-9 w-auto shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate font-serif text-[16px] font-semibold leading-tight tracking-tight text-ink-900">
                {settings.namaTpq}
              </p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
                Raport Wali Murid
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <p className="hidden text-right text-[12.5px] text-ink-600 sm:block">{user.name}</p>
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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
