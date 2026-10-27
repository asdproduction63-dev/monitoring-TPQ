import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTanggal, isISODate, monthStartISO, todayISO } from "@/lib/format";
import { JENIS_SETORAN, PREDIKAT, STATUS_SETORAN } from "@/lib/constants";
import { createSetoran, deleteSetoran } from "@/lib/actions/hafalan";
import { SetoranBadge } from "@/components/badges";
import { Alert } from "@/components/alert";
import { ConfirmSubmit } from "@/components/confirm-submit";
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
  selectClass,
  tdClass,
  thClass,
} from "@/lib/ui";

export const metadata = { title: "Setoran Hafalan" };

function Wajib() {
  return <span className="text-clay-500">*</span>;
}

export default async function HafalanPage({
  searchParams,
}: {
  searchParams: Promise<{
    santri?: string;
    dari?: string;
    sampai?: string;
    status?: string;
    saved?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const user = await requireStaff();
  const sp = await searchParams;
  const today = todayISO();
  const dari = isISODate(sp.dari) ? sp.dari : monthStartISO();
  const sampai = isISODate(sp.sampai) ? sp.sampai : today;
  const statusFilter = sp.status === "LULUS" || sp.status === "ULANG" ? sp.status : "";
  const santriFilter = sp.santri && Number.isFinite(Number(sp.santri)) ? Number(sp.santri) : 0;

  const where: Prisma.HafalanSetoranWhereInput = {
    date: { gte: dari, lte: sampai },
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(santriFilter ? { santriId: santriFilter } : {}),
  };

  const [santriList, riwayat] = await Promise.all([
    prisma.santri.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: { id: true, name: true, nis: true, kelas: true, active: true },
    }),
    prisma.hafalanSetoran.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 150,
      include: {
        santri: { select: { id: true, name: true, kelas: true } },
        penguji: { select: { name: true } },
      },
    }),
  ]);

  const santriAktif = santriList.filter((s) => s.active);
  const santriTerpilih = santriFilter ? santriAktif.find((s) => s.id === santriFilter) : santriAktif[0];

  const resetHref = `/hafalan?dari=${monthStartISO()}&sampai=${today}`;

  return (
    <div>
      <div className={pageHeadClass}>
        <div>
          <h1 className={pageTitleClass}>Setoran Hafalan</h1>
          <p className={pageSubClass}>Catat setoran baru dan telusuri riwayatnya.</p>
        </div>
      </div>

      {sp.error ? (
        <div className="mb-5">
          <Alert type="error" message={sp.error} />
        </div>
      ) : null}
      {sp.saved ? (
        <div className="mb-5">
          <Alert type="success" message="Setoran berhasil disimpan." />
        </div>
      ) : null}
      {sp.deleted ? (
        <div className="mb-5">
          <Alert type="success" message="Setoran berhasil dihapus." />
        </div>
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[380px_1fr]">
        <section className={`${cardClass} xl:sticky xl:top-20`}>
          <div className={cardHeadClass}>
            <div>
              <h2 className={cardTitleClass}>Input setoran</h2>
              <p className={cardSubClass}>Penguji: {user.name}</p>
            </div>
          </div>

          {santriAktif.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-ink-500">Belum ada murid aktif.</p>
              <Link href="/murid/baru" className={`${btnPrimary} mt-4`}>
                Tambah murid
              </Link>
            </div>
          ) : (
            <form action={createSetoran} className="space-y-4 p-5">
              <div>
                <label htmlFor="santriId" className={labelClass}>
                  Murid <Wajib />
                </label>
                <select
                  id="santriId"
                  name="santriId"
                  required
                  defaultValue={String(santriTerpilih?.id ?? "")}
                  className={selectClass}
                >
                  <option value="" disabled>
                    Pilih murid
                  </option>
                  {santriAktif.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.kelas}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="date" className={labelClass}>
                    Tanggal
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    defaultValue={today}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="type" className={labelClass}>
                    Jenis
                  </label>
                  <select id="type" name="type" defaultValue="ZIYADAH" className={selectClass}>
                    {(Object.keys(JENIS_SETORAN) as (keyof typeof JENIS_SETORAN)[]).map((key) => (
                      <option key={key} value={key}>
                        {JENIS_SETORAN[key].short}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="materi" className={labelClass}>
                  Materi <Wajib />
                </label>
                <textarea
                  id="materi"
                  name="materi"
                  rows={2}
                  required
                  maxLength={200}
                  placeholder="Contoh: Iqro 2 hal. 10–12 atau Al-Baqarah ayat 1–5"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="predikat" className={labelClass}>
                    Predikat
                  </label>
                  <select id="predikat" name="predikat" defaultValue="JAYYID" className={selectClass}>
                    {(Object.keys(PREDIKAT) as (keyof typeof PREDIKAT)[]).map((key) => (
                      <option key={key} value={key}>
                        {PREDIKAT[key].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className={labelClass}>
                    Status
                  </label>
                  <select id="status" name="status" defaultValue="LULUS" className={selectClass}>
                    {(Object.keys(STATUS_SETORAN) as (keyof typeof STATUS_SETORAN)[]).map((key) => (
                      <option key={key} value={key}>
                        {STATUS_SETORAN[key].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="catatan" className={labelClass}>
                  Catatan
                </label>
                <textarea
                  id="catatan"
                  name="catatan"
                  rows={2}
                  placeholder="Contoh: Perlu memperbaiki bacaan pada halaman 10."
                  className={inputClass}
                />
              </div>

              <button type="submit" className={`${btnPrimary} w-full`}>
                Simpan setoran
              </button>
            </form>
          )}
        </section>

        <section className="space-y-4">
          <div className={cardClass}>
            <form method="get" className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label htmlFor="filter-santri" className={labelClass}>
                  Murid
                </label>
                <select
                  id="filter-santri"
                  name="santri"
                  defaultValue={String(santriFilter || "")}
                  className={selectClass}
                >
                  <option value="">Semua murid</option>
                  {santriList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.active ? "" : " (nonaktif)"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-dari" className={labelClass}>
                  Dari
                </label>
                <input
                  id="filter-dari"
                  name="dari"
                  type="date"
                  defaultValue={dari}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="filter-sampai" className={labelClass}>
                  Sampai
                </label>
                <input
                  id="filter-sampai"
                  name="sampai"
                  type="date"
                  defaultValue={sampai}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="filter-status" className={labelClass}>
                  Status
                </label>
                <select
                  id="filter-status"
                  name="status"
                  defaultValue={statusFilter}
                  className={selectClass}
                >
                  <option value="">Semua status</option>
                  <option value="LULUS">Lulus</option>
                  <option value="ULANG">Perlu diulang</option>
                </select>
              </div>
              <div className="flex gap-2 sm:col-span-2 xl:col-span-4">
                <button type="submit" className={btnPrimary}>
                  Terapkan
                </button>
                <Link href={resetHref} className={btnSecondary}>
                  Reset
                </Link>
              </div>
            </form>
          </div>

          <div className={cardClass}>
            <div className={cardHeadClass}>
              <div>
                <h2 className={cardTitleClass}>Riwayat setoran</h2>
                <p className={cardSubClass}>
                  {riwayat.length} setoran · {formatTanggal(dari)} – {formatTanggal(sampai)}
                </p>
              </div>
            </div>

            {riwayat.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <p className="text-[13px] font-medium text-ink-700">
                  Tidak ada setoran pada periode ini.
                </p>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  Ubah rentang tanggal atau filter murid.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px]">
                  <thead>
                    <tr>
                      <th className={thClass}>Tanggal</th>
                      <th className={thClass}>Murid</th>
                      <th className={thClass}>Materi</th>
                      <th className={thClass}>Predikat</th>
                      <th className={thClass}>Status</th>
                      <th className={thClass}>Penguji</th>
                      {user.role === "ADMIN" ? <th className={`${thClass} text-right`}>Aksi</th> : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {riwayat.map((s) => (
                      <tr key={s.id} className={rowClass}>
                        <td className={`${tdClass} whitespace-nowrap text-ink-600`}>
                          {formatTanggal(s.date)}
                        </td>
                        <td className={tdClass}>
                          <Link
                            href={`/murid/${s.santri.id}`}
                            className="font-medium text-ink-800 hover:text-brand-700"
                          >
                            {s.santri.name}
                          </Link>
                          <p className="mt-0.5 text-[12px] text-ink-500">{s.santri.kelas}</p>
                        </td>
                        <td className={tdClass}>
                          <p className="font-medium text-ink-800">{s.materi}</p>
                          <p className="mt-0.5 text-[12px] text-ink-500">
                            {JENIS_SETORAN[s.type as keyof typeof JENIS_SETORAN]?.short ?? s.type}
                          </p>
                          {s.catatan ? (
                            <p className="mt-0.5 max-w-xs truncate text-[12px] italic text-ink-400">
                              {s.catatan}
                            </p>
                          ) : null}
                        </td>
                        <td className={`${tdClass} text-ink-600`}>
                          {PREDIKAT[s.predikat as keyof typeof PREDIKAT]?.label ?? s.predikat}
                        </td>
                        <td className={tdClass}>
                          <SetoranBadge status={s.status} />
                        </td>
                        <td className={`${tdClass} text-ink-600`}>{s.penguji.name}</td>
                        {user.role === "ADMIN" ? (
                          <td className={`${tdClass} text-right`}>
                            <form action={deleteSetoran} className="inline">
                              <input type="hidden" name="id" value={s.id} />
                              <ConfirmSubmit
                                className="text-[12.5px] font-medium text-clay-600 underline-offset-2 hover:text-clay-700 hover:underline"
                                message="Hapus setoran ini? Tindakan ini tidak dapat dibatalkan."
                              >
                                Hapus
                              </ConfirmSubmit>
                            </form>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {riwayat.length >= 150 ? (
              <p className={`${noteClass} border-t border-ink-100 px-4 py-2.5`}>
                Batas tampil 150 setoran. Persempit rentang tanggal untuk melihat data lain.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
