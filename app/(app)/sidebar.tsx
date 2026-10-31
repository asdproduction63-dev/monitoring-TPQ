"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/session-token";

type NavItem = { href: string; label: string; icon: React.ReactNode };
type NavGroup = { label: string; items: NavItem[] };

const iconClass = "h-4 w-4 shrink-0";

const stroke = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: "1.4",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const icons = {
  dashboard: (
    <svg viewBox="0 0 16 16" {...stroke} className={iconClass}>
      <rect x="2.3" y="2.3" width="4.6" height="5.6" />
      <rect x="9.1" y="2.3" width="4.6" height="3.1" />
      <rect x="9.1" y="7.6" width="4.6" height="6.1" />
      <rect x="2.3" y="10.1" width="4.6" height="3.6" />
    </svg>
  ),
  hafalan: (
    <svg viewBox="0 0 16 16" {...stroke} className={iconClass}>
      <path d="M8 4.3v9.3" />
      <path d="M8 4.3C6.9 3.4 5.4 2.9 3.6 2.9c-.6 0-1.1.1-1.6.2v9c.5-.1 1-.2 1.6-.2 1.8 0 3.3.5 4.4 1.4 1.1-.9 2.6-1.4 4.4-1.4.6 0 1.1.1 1.6.2v-9c-.5-.1-1-.2-1.6-.2-1.8 0-3.3.5-4.4 1.4Z" />
    </svg>
  ),
  presensi: (
    <svg viewBox="0 0 16 16" {...stroke} className={iconClass}>
      <path d="M6.6 3.9h7.1M6.6 8h7.1M6.6 12.1h7.1" />
      <path d="m2.3 3.7 1 1 1.7-1.9M2.3 7.8l1 1 1.7-1.9M2.3 11.9l1 1 1.7-1.9" />
    </svg>
  ),
  murid: (
    <svg viewBox="0 0 16 16" {...stroke} className={iconClass}>
      <circle cx="8" cy="5.2" r="2.4" />
      <path d="M2.9 13.4c.5-2.6 2.5-4.1 5.1-4.1s4.6 1.5 5.1 4.1" />
    </svg>
  ),
  laporan: (
    <svg viewBox="0 0 16 16" {...stroke} className={iconClass}>
      <path d="M2 13.4h12" />
      <path d="M4.2 13.4V9.1M8 13.4V4.2M11.8 13.4V6.7" />
    </svg>
  ),
  rumah: (
    <svg viewBox="0 0 16 16" {...stroke} className={iconClass}>
      <path d="M2.2 7.3 8 2.5l5.8 4.8" />
      <path d="M3.7 8.5v4.6c0 .3.2.5.5.5h7.6c.3 0 .5-.2.5-.5V8.5" />
      <path d="M6.6 13.6V9.8h2.8v3.8" />
    </svg>
  ),
  kirim: (
    <svg viewBox="0 0 16 16" {...stroke} className={iconClass}>
      <path d="M14.2 1.8 7.4 8.6" />
      <path d="M14.2 1.8 9.9 14.2 7.4 8.6 1.8 6.1 14.2 1.8Z" />
    </svg>
  ),
  pengaturan: (
    <svg viewBox="0 0 16 16" {...stroke} className={iconClass}>
      <path d="M2.4 3.6h11.2M2.4 8h11.2M2.4 12.4h11.2" />
      <circle cx="5.4" cy="3.6" r="1.5" />
      <circle cx="10.6" cy="8" r="1.5" />
      <circle cx="6.8" cy="12.4" r="1.5" />
    </svg>
  ),
};

const navGroups: NavGroup[] = [
  {
    label: "Harian",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: icons.dashboard },
      { href: "/hafalan", label: "Setoran", icon: icons.hafalan },
      { href: "/presensi", label: "Presensi", icon: icons.presensi },
    ],
  },
  {
    label: "Catatan",
    items: [
      { href: "/murid", label: "Data Murid", icon: icons.murid },
      { href: "/laporan-rumah", label: "Laporan Rumah", icon: icons.rumah },
      { href: "/laporan", label: "Laporan", icon: icons.laporan },
      { href: "/pemberitahuan", label: "Pemberitahuan", icon: icons.kirim },
      { href: "/pengaturan", label: "Pengaturan", icon: icons.pengaturan },
    ],
  },
];

// Garis penanda: di bawah item pada layar kecil, di sisi kiri pada layar lebar.
const activeClass =
  "bg-white text-ink-900 shadow-[inset_0_-2px_0_0_#157270] lg:shadow-[inset_2px_0_0_0_#157270]";
const idleClass = "text-ink-600 hover:bg-white/65 hover:text-ink-900";

export function Sidebar({
  user,
  namaTpq,
  periode,
  catatanBaru = 0,
}: {
  user: SessionUser;
  namaTpq: string;
  periode: string;
  /// Jumlah laporan rumah yang belum dibuka staf ini.
  catatanBaru?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar border-ink-200 lg:flex lg:min-h-screen lg:w-[232px] lg:shrink-0 lg:flex-col lg:border-r">
      <div className="flex items-center gap-3 border-b border-ink-200 px-4 py-3 lg:border-b-0 lg:px-5 lg:pb-5 lg:pt-6">
        <Image
          src="/logo-lambang.png"
          alt=""
          width={507}
          height={482}
          className="h-9 w-auto shrink-0 lg:h-10"
        />
        <div className="min-w-0">
          <p className="truncate font-serif text-[16px] font-semibold leading-tight tracking-tight text-ink-900">
            {namaTpq}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
            Buku Monitoring
          </p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2.5 py-2 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-3 lg:py-0">
        {navGroups.map((group) => (
          <div key={group.label} className="contents lg:mt-6 lg:block lg:first:mt-0">
            <p className="hidden px-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400 lg:block">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] font-medium transition lg:gap-3 lg:rounded ${
                    active ? activeClass : idleClass
                  }`}
                >
                  <span className={active ? "text-brand-600" : "text-ink-400"}>{item.icon}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.href === "/laporan-rumah" && catatanBaru > 0 ? (
                    <span
                      aria-label={`${catatanBaru} laporan belum dibaca`}
                      className="tnum ml-auto rounded-full bg-clay-500 px-1.5 py-px text-[10.5px] font-semibold leading-[1.45] text-white"
                    >
                      {catatanBaru > 99 ? "99+" : catatanBaru}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto hidden lg:block lg:px-5 lg:pb-6">
        <p className="border-t border-ink-200 pt-3 text-[11px] leading-relaxed text-ink-400">
          {periode}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-400">
          Masuk sebagai <span className="text-ink-600">{user.name}</span>
        </p>
      </div>
    </aside>
  );
}
