import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPersen, formatTanggal, isISODate, monthStartISO, todayISO } from "@/lib/format";
import { Meter, Stat, StatBand } from "@/components/stat-band";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  cardHeadClass,
  cardSubClass,
  cardTitleClass,
  inputClass,
  labelClass,
  noteClass,
  pageHeadClass,
  pageSubClass,
  pageTitleClass,
  rowClass,
  tabBarClass,
  tabClass,
  tdClass,
  thClass,
} from "@/lib/ui";

export const metadata = { title: "Laporan" };

type Jenis = "hafalan" | "presensi";

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string; jenis?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const today = todayISO();
  const dari = isISODate(sp.dari) ? sp.dari : monthStartISO();
  const sampai = isISODate(sp.sampai) ? sp.sampai : today;
  const jenis: Jenis = sp.jenis === "presensi" ? "presensi" : "hafalan";

  const [santriList, setoran, presensi] = await Promise.all([
    prisma.santri.findMany({
      select: { id: true, nis: true, name: true, kelas: true, active: true },
      orderBy: { name: "asc" },
    }),
    jenis === "hafalan"
      ? prisma.hafalanSetoran.findMany({
          where: { date: { gte: dari, lte: sampai } },
          select: { santriId: true, status: true, date: true },
        })
      : Promise.resolve([]),
    jenis === "presensi"
      ? prisma.presensi.findMany({
          where: { date: { gte: dari, lte: sampai } },
          select: { santriId: true, status: true, date: true },
        })
      : Promise.resolve([]),
  ]);

  const hafalanMap = new Map<number, { total: number; lulus: number; ulang: number; last: string }>();
  for (const row of setoran) {
    const agg = hafalanMap.get(row.santriId) ?? { total: 0, lulus: 0, ulang: 0, last: "" };
    agg.total += 1;
    if (row.status === "LULUS") {
      agg.lulus += 1;
    } else {
      agg.ulang += 1;
    }
    if (row.date > agg.last) agg.last = row.date;
    hafalanMap.set(row.santriId, agg);
  }

  const presensiMap = new Map<
    number,
    { HADIR: number; IZIN: number; SAKIT: number; ALPA: number; total: number }
  >();
  for (const row of presensi) {
    const agg = presensiMap.get(row.santriId) ?? {
      HADIR: 0,
      IZIN: 0,
      SAKIT: 0,
      ALPA: 0,
      total: 0,
    };
    if (
      row.status === "HADIR" ||
      row.status === "IZIN" ||
      row.status === "SAKIT" ||
      row.status === "ALPA"
    ) {
      agg[row.status] += 1;
    }
    agg.total += 1;
    presensiMap.set(row.santriId, agg);
  }

  const hafalanRows = santriList
    .map((s) => ({ santri: s, agg: hafalanMap.get(s.id) }))
    .filter((row) => row.agg && row.agg.total > 0);

  const presensiRows = santriList
    .map((s) => ({ santri: s, agg: presensiMap.get(s.id) }))
    .filter((row) => row.agg && row.agg.total > 0);

  const totalSetoran = hafalanRows.reduce((sum, row) => sum + (row.agg?.total ?? 0), 0);
  const totalLulus = hafalanRows.reduce((sum, row) => sum + (row.agg?.lulus ?? 0), 0);
  const totalUlang = hafalanRows.reduce((sum, row) => sum + (row.agg?.ulang ?? 0), 0);

  const totalPresensi = presensiRows.reduce((sum, row) => sum + (row.agg?.total ?? 0), 0);
  const totalHadir = presensiRows.reduce((sum, row) => sum + (row.agg?.HADIR ?? 0), 0);
  const totalIzin = presensiRows.reduce((sum, row) => sum + (row.agg?.IZIN ?? 0), 0);
  const totalSakit = presensiRows.reduce((sum, row) => sum + (row.agg?.SAKIT ?? 0), 0);
  const totalAlpa = presensiRows.reduce((sum, row) => sum + (row.agg?.ALPA ?? 0), 0);

  const tabHref = (value: Jenis) => `/laporan?jenis=${value}&dari=${dari}&sampai=${sampai}`;
  const exportHref = `/api/export/${jenis}?dari=${dari}&sampai=${sampai}`;

  return (
    <div>
      <div className={pageHeadClass}>
        <div>
          <h1 className={pageTitleClass}>Laporan</h1>
          <p className={pageSubClass}>
            Periode {formatTanggal(dari)} – {formatTanggal(sampai)}
          </p>
        </div>
        <a href={exportHref} className={`${btnSecondary} no-print`}>
          Export CSV
        </a>
      </div>

      <div className={`${cardClass} mb-5 p-4`}>
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input type="hidden" name="jenis" value={jenis} />
          <div className="sm:w-44">
            <label htmlFor="dari" className={labelClass}>
              Dari tanggal
            </label>
            <input id="dari" name="dari" type="date" defaultValue={dari} className={inputClass} />
          </div>
          <div className="sm:w-44">
            <label htmlFor="sampai" className={labelClass}>
              Sampai tanggal
            </label>
            <input id="sampai" name="sampai" type="date" defaultValue={sampai} className={inputClass} />
          </div>
          <button type="submit" className={btnPrimary}>
            Tampilkan
          </button>
          <Link href={tabHref(jenis)} className={btnSecondary}>
            Bulan ini
          </Link>
        </form>
      </div>

      <nav className={`${tabBarClass} mb-5`}>
        <Link href={tabHref("hafalan")} className={tabClass(jenis === "hafalan")}>
          Setoran Hafalan
        </Link>
        <Link href={tabHref("presensi")} className={tabClass(jenis === "presensi")}>
          Presensi Kegiatan
        </Link>
      </nav>

      {jenis === "hafalan" ? (
        <>
          <StatBand className="sm:grid-cols-4">
            <Stat label="Total setoran" value={totalSetoran} />
            <Stat label="Murid menyetor" value={hafalanRows.length} hint="Pada periode ini" />
            <Stat
              label="Lulus"
              value={totalLulus}
              hint={`${formatPersen(totalSetoran ? (totalLulus / totalSetoran) * 100 : 0)} dari total`}
            />
            <Stat label="Perlu diulang" value={totalUlang} hint="Setoran yang belum lulus" />
          </StatBand>

          <div className={`${cardClass} mt-5`}>
            <div className={cardHeadClass}>
              <div>
                <h2 className={cardTitleClass}>Rekap hafalan per murid</h2>
                <p className={cardSubClass}>Dihitung dari setoran pada periode ini.</p>
              </div>
            </div>

            {hafalanRows.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-[13px] font-medium text-ink-700">
                  Belum ada setoran pada periode ini.
                </p>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  Ubah rentang tanggal untuk melihat periode lain.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[780px]">
                  <thead>
                    <tr>
                      <th className={thClass}>Murid</th>
                      <th className={thClass}>Kelas</th>
                      <th className={`${thClass} text-right`}>Setoran</th>
                      <th className={`${thClass} text-right`}>Lulus</th>
                      <th className={`${thClass} text-right`}>Diulang</th>
                      <th className={thClass}>Terakhir setor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {hafalanRows.map(({ santri, agg }) => (
                      <tr key={santri.id} className={rowClass}>
                        <td className={tdClass}>
                          <Link
                            href={`/murid/${santri.id}`}
                            className="font-medium text-ink-800 hover:text-brand-700"
                          >
                            {santri.name}
                          </Link>
                          <p className="mt-0.5 font-mono text-[11.5px] text-ink-500">{santri.nis}</p>
                        </td>
                        <td className={tdClass}>{santri.kelas}</td>
                        <td className={`${tdClass} tnum text-right font-medium text-ink-900`}>
                          {agg?.total ?? 0}
                        </td>
                        <td className={`${tdClass} tnum text-right text-brand-700`}>
                          {agg?.lulus ?? 0}
                        </td>
                        <td className={`${tdClass} tnum text-right text-brass-600`}>
                          {agg?.ulang ?? 0}
                        </td>
                        <td className={`${tdClass} whitespace-nowrap text-ink-600`}>
                          {agg?.last ? formatTanggal(agg.last) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <StatBand className="sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Total catatan" value={totalPresensi} hint={`${presensiRows.length} murid`} />
            <Stat
              label="Kehadiran"
              value={formatPersen(totalPresensi ? (totalHadir / totalPresensi) * 100 : 0)}
              hint={`${totalHadir} hadir`}
            />
            <Stat label="Izin" value={totalIzin} />
            <Stat label="Sakit" value={totalSakit} />
            <Stat label="Alpa" value={totalAlpa} />
          </StatBand>

          <div className={`${cardClass} mt-5`}>
            <div className={cardHeadClass}>
              <div>
                <h2 className={cardTitleClass}>Rekap presensi per murid</h2>
                <p className={cardSubClass}>Dihitung dari seluruh kegiatan pada periode ini.</p>
              </div>
            </div>

            {presensiRows.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <p className="text-[13px] font-medium text-ink-700">
                  Belum ada catatan presensi pada periode ini.
                </p>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  Ubah rentang tanggal atau isi presensi terlebih dahulu.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead>
                    <tr>
                      <th className={thClass}>Murid</th>
                      <th className={thClass}>Kelas</th>
                      <th className={`${thClass} text-right`}>Hadir</th>
                      <th className={`${thClass} text-right`}>Izin</th>
                      <th className={`${thClass} text-right`}>Sakit</th>
                      <th className={`${thClass} text-right`}>Alpa</th>
                      <th className={thClass}>Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {presensiRows.map(({ santri, agg }) => {
                      const total = agg?.total ?? 0;
                      const hadir = agg?.HADIR ?? 0;
                      const pct = total > 0 ? (hadir / total) * 100 : 0;
                      return (
                        <tr key={santri.id} className={rowClass}>
                          <td className={tdClass}>
                            <Link
                              href={`/murid/${santri.id}`}
                              className="font-medium text-ink-800 hover:text-brand-700"
                            >
                              {santri.name}
                            </Link>
                            <p className="mt-0.5 font-mono text-[11.5px] text-ink-500">{santri.nis}</p>
                          </td>
                          <td className={tdClass}>{santri.kelas}</td>
                          <td className={`${tdClass} tnum text-right text-mint-700`}>{hadir}</td>
                          <td className={`${tdClass} tnum text-right text-brass-700`}>
                            {agg?.IZIN ?? 0}
                          </td>
                          <td className={`${tdClass} tnum text-right text-steel-700`}>
                            {agg?.SAKIT ?? 0}
                          </td>
                          <td className={`${tdClass} tnum text-right text-pink-700`}>
                            {agg?.ALPA ?? 0}
                          </td>
                          <td className={tdClass}>
                            <div className="flex items-center gap-2.5">
                              <span className="tnum w-9 text-[12.5px] font-medium text-ink-700">
                                {formatPersen(pct)}
                              </span>
                              <div className="w-24">
                                <Meter value={pct} tone="mint" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <p className={`${noteClass} mt-4`}>
        Angka dihitung berdasarkan tanggal setoran atau presensi, bukan tanggal input. Murid nonaktif
        tetap muncul bila punya data pada periode ini.
      </p>
    </div>
  );
}
