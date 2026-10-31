import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayISO, formatTanggal, formatTanggalWaktu, formatPersen } from "@/lib/format";
import { JENIS_SETORAN, PREDIKAT } from "@/lib/constants";
import { toggleSantriActive } from "@/lib/actions/murid";
import { Badge, PresensiBadge, SetoranBadge } from "@/components/badges";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Alert } from "@/components/alert";
import { Stat, StatBand } from "@/components/stat-band";
import { LiniMasaRumah } from "@/components/lini-masa-rumah";
import {
  btnMini,
  btnPrimary,
  btnSecondary,
  btnDanger,
  cardClass,
  cardHeadClass,
  cardSubClass,
  cardTitleClass,
  rowClass,
  tdClass,
  thClass,
} from "@/lib/ui";

export const metadata = { title: "Detail Murid" };

export default async function MuridDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const santriId = Number(id);
  if (!Number.isInteger(santriId) || santriId <= 0) notFound();

  const from = new Date(`${todayISO()}T00:00:00`);
  from.setDate(from.getDate() - 29);
  const fromISO = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(
    from.getDate(),
  ).padStart(2, "0")}`;
  const today = todayISO();

  const santri = await prisma.santri.findUnique({
    where: { id: santriId },
    include: {
      wali: { select: { name: true, username: true, active: true } },
      setoran: {
        take: 25,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: { penguji: { select: { name: true } } },
      },
      presensi: {
        take: 15,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: { kegiatan: { select: { name: true } } },
      },
    },
  });

  if (!santri) notFound();

  const [jumlahSetoran, jumlahLulus, setoran30, presensi30, jumlahPresensi, catatanRumah] =
    await Promise.all([
    prisma.hafalanSetoran.count({ where: { santriId } }),
    prisma.hafalanSetoran.count({ where: { santriId, status: "LULUS" } }),
    prisma.hafalanSetoran.count({
      where: { santriId, date: { gte: fromISO, lte: today } },
    }),
    prisma.presensi.groupBy({
      by: ["status"],
      where: { santriId, date: { gte: fromISO, lte: today } },
      _count: { _all: true },
    }),
    prisma.presensi.count({ where: { santriId } }),
    prisma.catatanRumah.findMany({
      where: { santriId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        isi: true,
        createdAt: true,
        penulisId: true,
        penulis: { select: { name: true } },
        media: { select: { id: true, jenis: true, jalur: true, namaAsli: true } },
      },
    }),
  ]);

  const total30 = presensi30.reduce((sum, row) => sum + row._count._all, 0);
  const hadir30 = presensi30.find((row) => row.status === "HADIR")?._count._all ?? 0;
  const persen30 = total30 > 0 ? (hadir30 / total30) * 100 : null;

  const profileItems = [
    { label: "NIS", value: santri.nis, mono: true },
    { label: "Kelas", value: santri.kelas },
    { label: "No. HP wali", value: santri.phone || "—", mono: Boolean(santri.phone) },
    { label: "Terdaftar", value: formatTanggalWaktu(santri.createdAt) },
    {
      label: "Akun wali",
      value: santri.wali
        ? `${santri.wali.name}${santri.wali.active ? "" : " (nonaktif)"}`
        : "Belum dibuat",
    },
  ];

  return (
    <div className="space-y-5">
      <Link
        href="/murid"
        className="inline-block text-[12.5px] font-medium text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline"
      >
        ← Data murid
      </Link>

      {sp.error ? <Alert type="error" message={sp.error} /> : null}
      {sp.saved ? <Alert type="success" message="Data murid berhasil disimpan." /> : null}

      <div className="border-l-2 border-brand-700 bg-white">
        <div className="flex flex-col gap-4 border-b border-ink-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">
              {santri.nis}
            </p>
            <h1 className="mt-1.5 font-serif text-[24px] font-semibold leading-tight tracking-tight text-ink-900">
              {santri.name}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {santri.active ? <Badge tone="brand">Aktif</Badge> : <Badge>Nonaktif</Badge>}
              <Badge tone="steel">{santri.gender === "P" ? "Putri" : "Putra"}</Badge>
              <span className="text-[12.5px] text-ink-500">Kelas {santri.kelas}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href={`/api/raport/gambar?santri=${santri.id}`}
              target="_blank"
              rel="noopener"
              className={btnSecondary}
            >
              Raport pekan ini
            </a>
            <Link href={`/murid/${santri.id}/edit`} className={btnPrimary}>
              Edit data
            </Link>
            <form action={toggleSantriActive}>
              <input type="hidden" name="id" value={santri.id} />
              <input type="hidden" name="redirectTo" value={`/murid/${santri.id}`} />
              <ConfirmSubmit
                className={santri.active ? btnDanger : btnSecondary}
                message={
                  santri.active
                    ? "Nonaktifkan murid ini? Riwayat setoran dan presensi tetap tersimpan."
                    : "Aktifkan kembali murid ini?"
                }
              >
                {santri.active ? "Nonaktifkan" : "Aktifkan"}
              </ConfirmSubmit>
            </form>
          </div>
        </div>

        <dl className="grid gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {profileItems.map((item) => (
            <div key={item.label}>
              <dt className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-400">
                {item.label}
              </dt>
              <dd className={`mt-1 text-[13px] text-ink-800 ${item.mono ? "font-mono" : ""}`}>
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <StatBand className="sm:grid-cols-3">
        <Stat label="Total setoran" value={jumlahSetoran} hint={`${jumlahLulus} dinyatakan lulus`} />
        <Stat label="Setoran 30 hari" value={setoran30} hint="Dalam 30 hari terakhir" />
        <Stat
          label="Kehadiran 30 hari"
          value={persen30 === null ? "—" : formatPersen(persen30)}
          hint={
            total30 > 0 ? `${hadir30} hadir dari ${total30} catatan` : "Belum ada catatan presensi"
          }
        />
      </StatBand>

      <section className={cardClass}>
        <div className={cardHeadClass}>
          <div>
            <h2 className={cardTitleClass}>Riwayat setoran hafalan</h2>
            <p className={cardSubClass}>
              {jumlahSetoran > 25 ? "25 setoran terbaru." : "Seluruh riwayat setoran."}
            </p>
          </div>
          <Link href={`/hafalan?santri=${santri.id}`} className={btnMini}>
            Input setoran
          </Link>
        </div>

        {santri.setoran.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-ink-500">
            Belum ada setoran untuk murid ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr>
                  <th className={thClass}>Tanggal</th>
                  <th className={thClass}>Materi</th>
                  <th className={thClass}>Predikat</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Penguji</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {santri.setoran.map((s) => (
                  <tr key={s.id} className={rowClass}>
                    <td className={`${tdClass} whitespace-nowrap text-ink-600`}>
                      {formatTanggal(s.date)}
                    </td>
                    <td className={tdClass}>
                      <p className="font-medium text-ink-800">{s.materi}</p>
                      <p className="mt-0.5 text-[12px] text-ink-500">
                        {JENIS_SETORAN[s.type as keyof typeof JENIS_SETORAN]?.short ?? s.type}
                        {s.catatan ? ` · ${s.catatan}` : ""}
                      </p>
                    </td>
                    <td className={`${tdClass} text-ink-600`}>
                      {PREDIKAT[s.predikat as keyof typeof PREDIKAT]?.label ?? s.predikat}
                    </td>
                    <td className={tdClass}>
                      <SetoranBadge status={s.status} />
                    </td>
                    <td className={`${tdClass} text-ink-600`}>{s.penguji.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3">
          <h2 className={cardTitleClass}>Laporan rumah dari wali</h2>
          <p className={cardSubClass}>
            {catatanRumah.length === 0
              ? "Wali belum mengirim catatan apa pun."
              : catatanRumah.length === 10
                ? "10 catatan terbaru dari wali murid."
                : `${catatanRumah.length} catatan dari wali murid.`}
          </p>
        </div>
        <LiniMasaRumah
          catatan={catatanRumah}
          idPengguna={user.id}
          admin={user.role === "ADMIN"}
          kosong="Belum ada laporan dari wali untuk murid ini."
        />
      </section>

      <section className={cardClass}>
        <div className={cardHeadClass}>
          <div>
            <h2 className={cardTitleClass}>Riwayat presensi kegiatan</h2>
            <p className={cardSubClass}>
              {jumlahPresensi} catatan seluruhnya, 15 terbaru ditampilkan.
            </p>
          </div>
        </div>

        {santri.presensi.length === 0 ? (
          <p className="px-4 py-12 text-center text-[13px] text-ink-500">
            Belum ada catatan presensi.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className={thClass}>Tanggal</th>
                  <th className={thClass}>Kegiatan</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {santri.presensi.map((p) => (
                  <tr key={p.id} className={rowClass}>
                    <td className={`${tdClass} whitespace-nowrap text-ink-600`}>
                      {formatTanggal(p.date)}
                    </td>
                    <td className={tdClass}>{p.kegiatan.name}</td>
                    <td className={tdClass}>
                      <PresensiBadge status={p.status} />
                    </td>
                    <td className={`${tdClass} text-ink-500`}>{p.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
