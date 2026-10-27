import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isISODate, todayISO, formatTanggalPanjang } from "@/lib/format";
import { PRESENSI_STATUS } from "@/lib/constants";
import { Alert } from "@/components/alert";
import { PresensiForm } from "@/components/presensi-form";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  inputClass,
  labelClass,
  noteClass,
  pageHeadClass,
  pageSubClass,
  pageTitleClass,
  selectClass,
} from "@/lib/ui";

export const metadata = { title: "Presensi Kegiatan" };

const ringkasanTone: Record<string, string> = {
  HADIR: "text-mint-700",
  IZIN: "text-brass-700",
  SAKIT: "text-steel-700",
  ALPA: "text-pink-700",
};

export default async function PresensiPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; kegiatan?: string; saved?: string; error?: string }>;
}) {
  const user = await requireStaff();
  const sp = await searchParams;
  const today = todayISO();
  const date = isISODate(sp.date) ? sp.date : today;

  const kegiatanList = await prisma.kegiatan.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const requestedId = Number(sp.kegiatan);
  const kegiatan = kegiatanList.find((k) => k.id === requestedId) ?? kegiatanList[0] ?? null;

  const [santri, existingRows] = await Promise.all([
    prisma.santri.findMany({
      where: { active: true },
      select: { id: true, name: true, kelas: true },
      orderBy: { name: "asc" },
    }),
    kegiatan
      ? prisma.presensi.findMany({
          where: { date, kegiatanId: kegiatan.id },
          select: { santriId: true, status: true, note: true },
        })
      : Promise.resolve([]),
  ]);

  const existing: Record<number, { status: string; note: string }> = {};
  for (const row of existingRows) {
    existing[row.santriId] = { status: row.status, note: row.note ?? "" };
  }

  const counts = existingRows.reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    },
    { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 },
  );

  return (
    <div>
      <div className={pageHeadClass}>
        <div>
          <h1 className={pageTitleClass}>Presensi Kegiatan</h1>
          <p className={pageSubClass}>{formatTanggalPanjang(date)}</p>
        </div>
        <Link href={`/laporan?jenis=presensi&dari=${date}&sampai=${date}`} className={btnSecondary}>
          Lihat rekap
        </Link>
      </div>

      {sp.error ? (
        <div className="mb-5">
          <Alert type="error" message={sp.error} />
        </div>
      ) : null}
      {sp.saved ? (
        <div className="mb-5">
          <Alert type="success" message="Presensi berhasil disimpan." />
        </div>
      ) : null}

      <div className={`${cardClass} mb-5 p-4`}>
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-48">
            <label htmlFor="date" className={labelClass}>
              Tanggal
            </label>
            <input id="date" name="date" type="date" defaultValue={date} className={inputClass} />
          </div>
          <div className="sm:w-80">
            <label htmlFor="kegiatan" className={labelClass}>
              Kegiatan
            </label>
            <select
              id="kegiatan"
              name="kegiatan"
              defaultValue={kegiatan ? String(kegiatan.id) : ""}
              className={selectClass}
              disabled={kegiatanList.length === 0}
            >
              {kegiatanList.length === 0 ? <option value="">Belum ada kegiatan aktif</option> : null}
              {kegiatanList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                  {k.startTime ? ` (${k.startTime})` : ""}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={btnPrimary} disabled={kegiatanList.length === 0}>
            Tampilkan
          </button>

          {existingRows.length > 0 ? (
            <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 sm:ml-auto sm:pb-1.5">
              {(Object.keys(PRESENSI_STATUS) as (keyof typeof PRESENSI_STATUS)[]).map((key) => (
                <div key={key} className="flex items-baseline gap-1.5">
                  <dt className="text-[12px] text-ink-500">{PRESENSI_STATUS[key].label}</dt>
                  <dd className={`tnum text-[13px] font-medium ${ringkasanTone[key]}`}>
                    {counts[key] ?? 0}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </form>
      </div>

      {kegiatanList.length === 0 ? (
        <div className={`${cardClass} px-6 py-16 text-center`}>
          <p className="text-[13px] font-medium text-ink-700">Belum ada kegiatan aktif.</p>
          <p className="mt-1 text-[12.5px] text-ink-500">
            {user.role === "ADMIN"
              ? "Tambahkan jenis kegiatan terlebih dahulu di menu Pengaturan."
              : "Hubungi admin untuk menambahkan jenis kegiatan."}
          </p>
          {user.role === "ADMIN" ? (
            <Link href="/pengaturan?tab=kegiatan" className={`${btnPrimary} mt-5`}>
              Atur kegiatan
            </Link>
          ) : null}
        </div>
      ) : santri.length === 0 ? (
        <div className={`${cardClass} px-6 py-16 text-center`}>
          <p className="text-[13px] font-medium text-ink-700">Belum ada murid aktif.</p>
          <p className="mt-1 text-[12.5px] text-ink-500">
            Tambahkan murid untuk mulai mencatat presensi.
          </p>
          <Link href="/murid/baru" className={`${btnPrimary} mt-5`}>
            Tambah murid
          </Link>
        </div>
      ) : kegiatan ? (
        <PresensiForm
          key={`${date}-${kegiatan.id}`}
          santri={santri}
          existing={existing}
          date={date}
          kegiatanId={kegiatan.id}
          kegiatanName={kegiatan.name}
        />
      ) : null}

      <p className={`${noteClass} mt-4`}>
        Hanya murid berstatus aktif yang tampil di sini. Riwayat presensi tetap tersimpan meski murid
        dinonaktifkan.
      </p>
    </div>
  );
}
