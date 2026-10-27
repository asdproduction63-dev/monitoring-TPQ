import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPersen, formatTanggal, todayISO } from "@/lib/format";
import { JENIS_SETORAN, PREDIKAT } from "@/lib/constants";
import { SetoranBadge } from "@/components/badges";
import { Alert } from "@/components/alert";
import { Meter, Stat, StatBand } from "@/components/stat-band";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  cardHeadClass,
  cardSubClass,
  cardTitleClass,
  linkClass,
  pageHeadClass,
  pageSubClass,
  pageTitleClass,
  rowClass,
  tdClass,
  thClass,
} from "@/lib/ui";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireStaff();
  const today = todayISO();
  const from = new Date(`${today}T00:00:00`);
  from.setDate(from.getDate() - 29);
  const fromISO = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(
    from.getDate(),
  ).padStart(2, "0")}`;

  const [
    totalSantri,
    santriAktif,
    setoranHariIni,
    setoranTerbaru,
    presensiHariIni,
    santriSudahSetor,
    kegiatanAktif,
    setoran30Rows,
  ] = await Promise.all([
    prisma.santri.count(),
    prisma.santri.findMany({
      where: { active: true },
      select: { id: true, name: true, kelas: true },
      orderBy: { name: "asc" },
    }),
    prisma.hafalanSetoran.count({ where: { date: today } }),
    prisma.hafalanSetoran.findMany({
      take: 6,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        santri: { select: { id: true, name: true, kelas: true } },
        penguji: { select: { name: true } },
      },
    }),
    prisma.presensi.findMany({
      where: { date: today },
      select: { kegiatanId: true, status: true },
    }),
    prisma.hafalanSetoran.findMany({
      where: { date: today },
      select: { santriId: true },
      distinct: ["santriId"],
    }),
    prisma.kegiatan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.hafalanSetoran.groupBy({
      by: ["santriId"],
      where: { date: { gte: fromISO, lte: today } },
      _count: { _all: true },
    }),
  ]);

  const hadir = presensiHariIni.filter((p) => p.status === "HADIR").length;
  const persenHadir = presensiHariIni.length ? (hadir / presensiHariIni.length) * 100 : null;

  const setorIds = new Set(santriSudahSetor.map((s) => s.santriId));
  const belumSetor = santriAktif.filter((s) => !setorIds.has(s.id));

  const perKegiatan = new Map<number, { hadir: number; total: number }>();
  for (const row of presensiHariIni) {
    const current = perKegiatan.get(row.kegiatanId) ?? { hadir: 0, total: 0 };
    current.total += 1;
    if (row.status === "HADIR") current.hadir += 1;
    perKegiatan.set(row.kegiatanId, current);
  }

  const setoran30Map = new Map(setoran30Rows.map((row) => [row.santriId, row._count._all]));
  const totalSetoran30 = setoran30Rows.reduce((sum, row) => sum + row._count._all, 0);
  const maxSetoran30 = Math.max(1, ...setoran30Rows.map((row) => row._count._all));
  const rekap30 = santriAktif
    .map((s) => ({ ...s, total: setoran30Map.get(s.id) ?? 0 }))
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, 5);

  return (
    <div>
      <div className={pageHeadClass}>
        <div>
          <h1 className={pageTitleClass}>Assalamu&apos;alaikum, {user.name}</h1>
          <p className={pageSubClass}>Ringkasan setoran dan kegiatan murid hari ini.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/hafalan" className={btnPrimary}>
            Input setoran
          </Link>
          <Link href="/presensi" className={btnSecondary}>
            Isi presensi
          </Link>
        </div>
      </div>

      {sp.error ? (
        <div className="mb-5">
          <Alert type="error" message={sp.error} />
        </div>
      ) : null}
      {sp.saved ? (
        <div className="mb-5">
          <Alert type="success" message="Perubahan berhasil disimpan." />
        </div>
      ) : null}

      <StatBand className="sm:grid-cols-4">
        <Stat label="Murid aktif" value={santriAktif.length} hint={`${totalSantri} murid terdaftar`} />
        <Stat
          label="Setoran hari ini"
          value={setoranHariIni}
          hint={`${santriSudahSetor.length} murid sudah menyetor`}
        />
        <Stat
          label="Kehadiran"
          value={persenHadir === null ? "—" : formatPersen(persenHadir)}
          hint={
            persenHadir === null
              ? "Presensi belum diisi"
              : `${hadir} hadir dari ${presensiHariIni.length} catatan`
          }
        />
        <Stat
          label="Belum setor"
          value={belumSetor.length}
          hint={`dari ${santriAktif.length} murid aktif`}
        />
      </StatBand>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <section className={cardClass}>
            <div className={cardHeadClass}>
              <div>
                <h2 className={cardTitleClass}>Setoran terbaru</h2>
                <p className={cardSubClass}>Catatan setoran yang terakhir masuk.</p>
              </div>
              <Link href="/hafalan" className={`${linkClass} text-[12.5px]`}>
                Lihat semua
              </Link>
            </div>

            {setoranTerbaru.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-[13px] text-ink-500">Belum ada setoran yang tercatat.</p>
                <Link href="/hafalan" className={`${linkClass} mt-2 inline-block text-[13px]`}>
                  Input setoran pertama
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr>
                      <th className={thClass}>Murid</th>
                      <th className={thClass}>Materi</th>
                      <th className={thClass}>Tanggal</th>
                      <th className={thClass}>Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {setoranTerbaru.map((s) => (
                      <tr key={s.id} className={rowClass}>
                        <td className={tdClass}>
                          <Link
                            href={`/murid/${s.santri.id}`}
                            className="font-medium text-ink-900 hover:text-brand-700"
                          >
                            {s.santri.name}
                          </Link>
                          <p className="mt-0.5 text-[12px] text-ink-500">
                            {s.santri.kelas} ·{" "}
                            {JENIS_SETORAN[s.type as keyof typeof JENIS_SETORAN]?.short ?? s.type}
                          </p>
                        </td>
                        <td className={tdClass}>{s.materi}</td>
                        <td className={`${tdClass} whitespace-nowrap text-ink-600`}>
                          {formatTanggal(s.date)}
                        </td>
                        <td className={tdClass}>
                          <p className="text-[12px] text-ink-600">
                            {PREDIKAT[s.predikat as keyof typeof PREDIKAT]?.label ?? s.predikat}
                          </p>
                          <div className="mt-1">
                            <SetoranBadge status={s.status} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={cardClass}>
            <div className={cardHeadClass}>
              <div>
                <h2 className={cardTitleClass}>Setoran terbanyak, 30 hari</h2>
                <p className={cardSubClass}>
                  {totalSetoran30} setoran tercatat dalam 30 hari terakhir.
                </p>
              </div>
              <Link href="/laporan" className={`${linkClass} text-[12.5px]`}>
                Lihat laporan
              </Link>
            </div>

            {rekap30.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-ink-500">
                Belum ada setoran dalam 30 hari terakhir.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {rekap30.map((s) => (
                  <li key={s.id} className="px-4 py-3">
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <Link
                        href={`/murid/${s.id}`}
                        className="truncate text-[13px] font-medium text-ink-800 hover:text-brand-700"
                      >
                        {s.name} <span className="font-normal text-ink-400">{s.kelas}</span>
                      </Link>
                      <span className="tnum shrink-0 text-[12px] text-ink-500">{s.total} setoran</span>
                    </div>
                    <Meter value={Math.max(3, (s.total / maxSetoran30) * 100)} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className={cardClass}>
            <div className={cardHeadClass}>
              <div>
                <h2 className={cardTitleClass}>Presensi hari ini</h2>
                <p className={cardSubClass}>Kehadiran per kegiatan.</p>
              </div>
              <Link href="/presensi" className={`${linkClass} text-[12.5px]`}>
                Isi
              </Link>
            </div>

            {presensiHariIni.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] text-ink-500">Presensi hari ini belum diisi.</p>
                <Link href="/presensi" className={`${linkClass} mt-2 inline-block text-[13px]`}>
                  Mulai isi presensi
                </Link>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-ink-100">
                  {kegiatanAktif.map((k) => {
                    const stat = perKegiatan.get(k.id);
                    const pct = stat && stat.total > 0 ? (stat.hadir / stat.total) * 100 : 0;
                    return (
                      <li key={k.id} className="px-4 py-3">
                        <div className="mb-2 flex items-baseline justify-between gap-2">
                          <Link
                            href={`/presensi?date=${today}&kegiatan=${k.id}`}
                            className="truncate text-[13px] font-medium text-ink-800 hover:text-brand-700"
                          >
                            {k.name}
                          </Link>
                          <span
                            className={`tnum shrink-0 text-[12px] ${
                              stat ? "text-ink-500" : "text-ink-400"
                            }`}
                          >
                            {stat ? `${stat.hadir}/${stat.total} hadir` : "Belum diisi"}
                          </span>
                        </div>
                        <Meter value={pct} tone={stat ? "mint" : "ink"} />
                      </li>
                    );
                  })}
                </ul>
                <p className="border-t border-ink-100 px-4 py-2.5 text-[12px] text-ink-500">
                  Total kehadiran <span className="tnum font-medium text-ink-800">{hadir}</span> dari{" "}
                  <span className="tnum">{presensiHariIni.length}</span> catatan.
                </p>
              </>
            )}
          </section>

          <section className={cardClass}>
            <div className={cardHeadClass}>
              <div>
                <h2 className={cardTitleClass}>Belum setor hari ini</h2>
                <p className={cardSubClass}>Murid aktif yang belum punya catatan.</p>
              </div>
            </div>

            {belumSetor.length === 0 ? (
              <p className="px-4 py-10 text-center text-[13px] text-ink-500">
                Semua murid aktif sudah menyetor hari ini.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {belumSetor.slice(0, 7).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-ink-800">{s.name}</p>
                      <p className="text-[12px] text-ink-500">{s.kelas}</p>
                    </div>
                    <Link
                      href={`/hafalan?santri=${s.id}`}
                      className={`${linkClass} shrink-0 text-[12.5px]`}
                    >
                      Setor
                    </Link>
                  </li>
                ))}
                {belumSetor.length > 7 ? (
                  <li className="px-4 py-2.5 text-[12px] text-ink-400">
                    dan {belumSetor.length - 7} murid lainnya
                  </li>
                ) : null}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
