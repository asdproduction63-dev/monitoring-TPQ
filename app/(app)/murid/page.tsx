import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/badges";
import { Alert } from "@/components/alert";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  inputClass,
  linkClass,
  pageHeadClass,
  pageSubClass,
  pageTitleClass,
  rowClass,
  tabBarClass,
  tabClass,
  tdClass,
  thClass,
} from "@/lib/ui";

export const metadata = { title: "Data Murid" };

type FilterStatus = "aktif" | "nonaktif" | "semua";

export default async function MuridPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; error?: string; saved?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status: FilterStatus =
    sp.status === "nonaktif" ? "nonaktif" : sp.status === "semua" ? "semua" : "aktif";

  const [santri, counts] = await Promise.all([
    prisma.santri.findMany({
      where: {
        ...(status === "aktif" ? { active: true } : status === "nonaktif" ? { active: false } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { nis: { contains: q } },
                { kelas: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 300,
      include: { _count: { select: { setoran: true, presensi: true } } },
    }),
    prisma.santri.groupBy({ by: ["active"], _count: { _all: true } }),
  ]);

  const aktifCount = counts.find((c) => c.active)?._count._all ?? 0;
  const nonaktifCount = counts.find((c) => !c.active)?._count._all ?? 0;
  const totalCount = aktifCount + nonaktifCount;

  const tabHref = (value: FilterStatus) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (value !== "aktif") params.set("status", value);
    const qs = params.toString();
    return `/murid${qs ? `?${qs}` : ""}`;
  };

  const tabs: { value: FilterStatus; label: string; count: number }[] = [
    { value: "aktif", label: "Aktif", count: aktifCount },
    { value: "nonaktif", label: "Nonaktif", count: nonaktifCount },
    { value: "semua", label: "Semua", count: totalCount },
  ];

  return (
    <div>
      <div className={pageHeadClass}>
        <div>
          <h1 className={pageTitleClass}>Data Murid</h1>
          <p className={pageSubClass}>Daftar murid beserta riwayat perkembangannya.</p>
        </div>
        <Link href="/murid/baru" className={btnPrimary}>
          Tambah murid
        </Link>
      </div>

      {sp.error ? (
        <div className="mb-5">
          <Alert type="error" message={sp.error} />
        </div>
      ) : null}
      {sp.saved ? (
        <div className="mb-5">
          <Alert type="success" message="Data murid berhasil disimpan." />
        </div>
      ) : null}

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <nav className={tabBarClass}>
          {tabs.map((tab) => (
            <Link key={tab.value} href={tabHref(tab.value)} className={tabClass(status === tab.value)}>
              {tab.label} <span className="tnum text-ink-400">{tab.count}</span>
            </Link>
          ))}
        </nav>

        <form method="get" className="flex w-full gap-2 lg:w-auto">
          {status !== "aktif" ? <input type="hidden" name="status" value={status} /> : null}
          <div className="relative flex-1 lg:w-72">
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="4.4" />
              <path d="m10.3 10.3 3.2 3.2" />
            </svg>
            <input
              name="q"
              defaultValue={q}
              placeholder="Cari nama, NIS, atau kelas…"
              className={`${inputClass} pl-8`}
            />
          </div>
          <button type="submit" className={btnSecondary}>
            Cari
          </button>
          {q ? (
            <Link href={tabHref(status)} className={btnSecondary}>
              Reset
            </Link>
          ) : null}
        </form>
      </div>

      <div className={cardClass}>
        {santri.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-[13px] font-medium text-ink-700">Tidak ada data murid.</p>
            <p className="mt-1 text-[12.5px] text-ink-500">
              {q
                ? "Coba kata kunci lain atau ubah filter status."
                : "Tambahkan murid untuk mulai mencatat."}
            </p>
            {!q ? (
              <Link href="/murid/baru" className={`${btnPrimary} mt-5`}>
                Tambah murid
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr>
                  <th className={thClass}>Murid</th>
                  <th className={thClass}>Kelas</th>
                  <th className={`${thClass} text-right`}>Setoran</th>
                  <th className={thClass}>Status</th>
                  <th className={`${thClass} text-right`}>Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {santri.map((s) => (
                  <tr key={s.id} className={rowClass}>
                    <td className={tdClass}>
                      <Link href={`/murid/${s.id}`} className="group">
                        <p className="font-medium text-ink-900 group-hover:text-brand-700">{s.name}</p>
                        <p className="mt-0.5 text-[12px] text-ink-500">
                          <span className="font-mono">{s.nis}</span> ·{" "}
                          {s.gender === "P" ? "Putri" : "Putra"}
                        </p>
                      </Link>
                    </td>
                    <td className={tdClass}>{s.kelas}</td>
                    <td className={`${tdClass} tnum text-right`}>{s._count.setoran}</td>
                    <td className={tdClass}>
                      {s.active ? <Badge tone="brand">Aktif</Badge> : <Badge>Nonaktif</Badge>}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-right`}>
                      <Link href={`/murid/${s.id}`} className={`${linkClass} text-[12.5px]`}>
                        Detail
                      </Link>
                      <span className="mx-2 text-ink-200">/</span>
                      <Link
                        href={`/murid/${s.id}/edit`}
                        className="text-[12.5px] font-medium text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {santri.length > 0 ? (
          <p className="border-t border-ink-100 px-4 py-2.5 text-[12px] text-ink-500">
            Menampilkan <span className="tnum">{santri.length}</span> murid
            {santri.length === 300 ? " — batas 300, persempit pencarian" : ""}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
